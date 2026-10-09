// Supabase Edge Function: translate-texts
// ----------------------------------------------------------------------------
// Traduce textos (es <-> en) y mantiene la caché compartida `text_translations`.
//
// Por qué existe: antes el navegador traducía y luego escribía la traducción
// directamente en `text_translations` con la anon key (políticas INSERT/UPDATE
// abiertas a todos). Cualquiera podía "envenenar" la caché y cambiar lo que
// otros usuarios ven como traducción. Desde la migración
// 20261005_cerrar_escritura_text_translations.sql solo el service role escribe
// en esa tabla, y el único que escribe es ESTA función, con traducciones que
// obtiene ella misma (el cliente nunca aporta el texto traducido).
//
// - JWT opcional: se despliega con --no-verify-jwt (la usan visitantes anónimos
//   del feed público y de los perfiles).
//     supabase functions deploy translate-texts --no-verify-jwt
// - CORS restringido a yourcvpassport.com, www y localhost/127.0.0.1.
// - Proveedor: el mismo que ya usa el proyecto (endpoint público `gtx` de Google
//   Translate, sin clave) y MyMemory como respaldo. No requiere secretos nuevos.
// - Rate limit con Upstash si está configurado (UPSTASH_REDIS_REST_URL/TOKEN);
//   si no lo está, falla en abierto (como el resto de funciones).
//
// Petición:  POST { texts: string[], sourceLang: 'es'|'en', targetLang: 'es'|'en' }
// Respuesta: 200 { translations: { [original]: traducido } }
//            (los textos que no se pudieron traducir no aparecen)
// ----------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { withRateLimit } from '../_shared/ratelimit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SUPPORTED_LANGS = ['es', 'en'] as const
type Lang = typeof SUPPORTED_LANGS[number]

// Límites por petición (evitan abuso y payloads enormes)
const MAX_TEXTS = 50
const MAX_TEXT_LENGTH = 5000
const MAX_TOTAL_CHARS = 30000
const GOOGLE_CHUNK = 1000 // límite seguro para la URL del endpoint gtx
const MYMEMORY_CHUNK = 450 // MyMemory admite 500
const CONCURRENCY = 4

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = new Set([
  'https://yourcvpassport.com',
  'https://www.yourcvpassport.com',
])
const LOCALHOST_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.has(origin) || LOCALHOST_RE.test(origin)
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

function json(body: unknown, status: number, origin: string | null, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(origin), ...extra, 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Hash idéntico al del cliente (services/translation/cache/dbTextCache.ts)
// para compartir las mismas filas de caché.
// ---------------------------------------------------------------------------
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// ---------------------------------------------------------------------------
// Proveedores
// ---------------------------------------------------------------------------
function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text]
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining)
      break
    }
    const area = remaining.substring(0, maxLength)
    let splitAt = maxLength
    const sentenceEnd = Math.max(area.lastIndexOf('. '), area.lastIndexOf('! '), area.lastIndexOf('? '), area.lastIndexOf('\n'))
    if (sentenceEnd > maxLength * 0.5) {
      splitAt = sentenceEnd + 1
    } else {
      const lastSpace = area.lastIndexOf(' ')
      if (lastSpace > maxLength * 0.5) splitAt = lastSpace + 1
    }
    chunks.push(remaining.substring(0, splitAt))
    remaining = remaining.substring(splitAt)
  }
  return chunks
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

async function googleChunk(text: string, sl: Lang, tl: Lang): Promise<string> {
  const params = new URLSearchParams({ client: 'gtx', sl, tl, dt: 't', q: text })
  const res = await fetchWithTimeout(`https://translate.googleapis.com/translate_a/single?${params}`, 10000)
  if (!res.ok) throw new Error(`google ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data?.[0])) throw new Error('google: formato inesperado')
  const out = (data[0] as unknown[])
    .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
    .join('')
  if (!out) throw new Error('google: vacío')
  return out
}

async function myMemoryChunk(text: string, sl: Lang, tl: Lang): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair: `${sl}|${tl}`, de: 'api@yourcvpassport.com' })
  const res = await fetchWithTimeout(`https://api.mymemory.translated.net/get?${params}`, 10000)
  if (!res.ok) throw new Error(`mymemory ${res.status}`)
  const data = await res.json()
  if (data?.responseStatus !== 200 || typeof data?.responseData?.translatedText !== 'string') {
    throw new Error(`mymemory ${data?.responseStatus}`)
  }
  return data.responseData.translatedText
}

async function translateOne(text: string, sl: Lang, tl: Lang): Promise<string | null> {
  try {
    const parts = splitIntoChunks(text, GOOGLE_CHUNK)
    const out: string[] = []
    for (const p of parts) out.push(await googleChunk(p, sl, tl))
    return out.join('')
  } catch (_e) {
    // Respaldo: MyMemory
  }
  try {
    const parts = splitIntoChunks(text, MYMEMORY_CHUNK)
    const out: string[] = []
    for (const p of parts) out.push(await myMemoryChunk(p, sl, tl))
    return out.join(' ')
  } catch (_e) {
    return null
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: isAllowedOrigin(origin) ? 200 : 403, headers: corsHeadersFor(origin) })
  }
  // Un navegador desde otro dominio no puede usar esta función
  if (origin && !isAllowedOrigin(origin)) {
    return json({ error: 'Origin not allowed' }, 403, origin)
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin)
  }

  const limited = await withRateLimit(req, 'api')
  if (limited instanceof Response) {
    const headers = Object.fromEntries(limited.headers.entries())
    return new Response(limited.body, { status: limited.status, headers: { ...headers, ...corsHeadersFor(origin) } })
  }

  let body: { texts?: unknown; sourceLang?: unknown; targetLang?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin)
  }

  const sourceLang = body.sourceLang as Lang
  const targetLang = body.targetLang as Lang
  if (!SUPPORTED_LANGS.includes(sourceLang) || !SUPPORTED_LANGS.includes(targetLang)) {
    return json({ error: 'sourceLang/targetLang must be es or en' }, 400, origin)
  }
  if (!Array.isArray(body.texts)) {
    return json({ error: 'texts must be an array' }, 400, origin)
  }

  const texts = Array.from(new Set(
    (body.texts as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim() !== '')
  ))
  if (texts.length > MAX_TEXTS) {
    return json({ error: `Too many texts (max ${MAX_TEXTS})` }, 413, origin)
  }
  if (texts.some((t) => t.length > MAX_TEXT_LENGTH) || texts.reduce((n, t) => n + t.length, 0) > MAX_TOTAL_CHARS) {
    return json({ error: 'Payload too large' }, 413, origin)
  }

  const translations: Record<string, string> = {}
  if (texts.length === 0) return json({ translations }, 200, origin)
  if (sourceLang === targetLang) {
    texts.forEach((t) => { translations[t] = t })
    return json({ translations }, 200, origin)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Caché compartida (se comprueba también el texto original para evitar colisiones del hash)
  const pending: string[] = []
  try {
    const hashes = Array.from(new Set(texts.map(hashText)))
    const { data, error } = await admin
      .from('text_translations')
      .select('text_hash, original_text, translated_text')
      .in('text_hash', hashes)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
    if (error) throw error
    const byOriginal = new Map<string, string>()
    for (const row of (data || []) as { original_text: string; translated_text: string }[]) {
      byOriginal.set(row.original_text, row.translated_text)
    }
    for (const t of texts) {
      const hit = byOriginal.get(t)
      if (hit) translations[t] = hit
      else pending.push(t)
    }
  } catch (_e) {
    pending.push(...texts.filter((t) => !(t in translations)))
  }

  // 2. Traducir lo que falta
  if (pending.length > 0) {
    const results = await mapWithConcurrency(pending, CONCURRENCY, (t) => translateOne(t, sourceLang, targetLang))
    const rows: Record<string, unknown>[] = []
    pending.forEach((t, i) => {
      const tr = results[i]
      if (!tr || !tr.trim()) return
      translations[t] = tr
      // Solo se cachean traducciones reales (si vuelve el mismo texto no aporta nada)
      if (normalize(tr) !== normalize(t)) {
        rows.push({
          text_hash: hashText(t),
          source_lang: sourceLang,
          target_lang: targetLang,
          original_text: t,
          translated_text: tr,
        })
      }
    })

    // 3. Guardar en la caché compartida (service role: única vía de escritura)
    if (rows.length > 0) {
      const { error } = await admin
        .from('text_translations')
        .upsert(rows, { onConflict: 'text_hash,source_lang,target_lang' })
      if (error) console.warn('[translate-texts] No se pudo guardar en caché:', error.message)
    }
  }

  return json({ translations }, 200, origin)
})
