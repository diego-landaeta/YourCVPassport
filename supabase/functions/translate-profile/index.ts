// Supabase Edge Function: translate-profile
// ----------------------------------------------------------------------------
// Traduce un perfil completo (es <-> en) y guarda el resultado en la caché
// compartida `profile_translations`.
//
// Por qué existe: antes el navegador traducía el perfil y escribía el JSON
// traducido directamente en `profile_translations` con la anon key (políticas
// INSERT/UPDATE abiertas a todos). Cualquiera podía "envenenar" la traducción
// que ven los demás visitantes de un perfil. Desde la migración
// 20261005_cerrar_escritura_profile_translations.sql solo el service role
// escribe en esa tabla y el único que lo hace es ESTA función, que:
//   - recibe SOLO { profileId, targetLanguage } (nunca texto traducido),
//   - lee el perfil con la anon key, es decir, exactamente lo que ve un
//     visitante anónimo (si el perfil no es público, no hay nada que cachear y
//     no se filtra contenido privado a la caché pública),
//   - traduce ella misma (caché text_translations + Google gtx / MyMemory),
//   - y guarda con el service role.
//
// - JWT opcional: se despliega con --no-verify-jwt (la usan visitantes anónimos
//   de los perfiles públicos).
//     supabase functions deploy translate-profile --no-verify-jwt
// - CORS restringido a yourcvpassport.com, www y localhost/127.0.0.1.
// - Rate limit 'api' (por IP) con Upstash si está configurado; si no, falla en
//   abierto. Además, si la caché ya está al día no se traduce nada.
// - Sin secretos nuevos (SUPABASE_URL, SUPABASE_ANON_KEY y
//   SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase).
//
// Petición:  POST { profileId: uuid, targetLanguage: 'es'|'en' }
// Respuesta: 200 { status: 'cached'|'stored'|'partial'|'nothing_to_translate',
//                  source_content_hash, translated_content? }
//            404 perfil no público / inexistente, 413 perfil demasiado grande,
//            400 petición inválida, 429 rate limit, 403 origen no permitido.
// El navegador trata cualquier error como "sin caché compartida" y sigue
// mostrando su propia traducción.
// ----------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { withRateLimit } from '../_shared/ratelimit.ts'
import {
  type Lang,
  SUPPORTED_LANGS,
  UUID_RE,
  buildProfileData,
  extractTranslatedContent,
  generateContentHash,
  hashText,
  mapWithConcurrency,
  normalize,
  textsToTranslate,
  translateOne,
} from './core.ts'
import { correctGenderBatch, inferGenderFromName } from './genderCorrection.ts'
import { PUBLIC_PROFILE_COLUMNS } from '../_shared/publicProfileColumns.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Límites (evitan abuso y perfiles desmesurados)
const MAX_BODY_BYTES = 2048
const MAX_ROWS_PER_SECTION = 200
const MAX_TEXTS = 400
const MAX_TEXT_LENGTH = 10000
const MAX_TOTAL_CHARS = 120000
const CONCURRENCY = 4

// ---------------------------------------------------------------------------
// CORS (mismo criterio que translate-texts)
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

  // ---- Petición ----
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413, origin)
  }
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413, origin)
  }
  let body: { profileId?: unknown; targetLanguage?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin)
  }
  const profileId = body?.profileId
  const targetLang = body?.targetLanguage as Lang
  if (typeof profileId !== 'string' || !UUID_RE.test(profileId)) {
    return json({ error: 'profileId must be a uuid' }, 400, origin)
  }
  if (!SUPPORTED_LANGS.includes(targetLang)) {
    return json({ error: 'targetLanguage must be es or en' }, 400, origin)
  }

  try {
    // ---- 1. Perfil tal como lo ve un visitante anónimo ----
    // Cliente con la anon key y SIN el JWT del que llama: aplica la RLS pública.
    const publicDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    // Columnas públicas explícitas: con la anon key select('*') da 42501.
    const { data: profile, error: profileError } = await publicDb
      .from('profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq('id', profileId)
      .maybeSingle()
    if (profileError) throw new Error(`profiles: ${profileError.message}`)
    if (!profile) {
      return json({ error: 'Profile not found' }, 404, origin)
    }

    const sections = await Promise.all(
      ['experiences', 'education', 'skills', 'portfolio_items'].map((table) =>
        publicDb.from(table).select('*').eq('profile_id', profileId).limit(MAX_ROWS_PER_SECTION + 1)
      )
    )
    for (const s of sections) {
      if (s.error) throw new Error(`secciones: ${s.error.message}`)
      if ((s.data?.length ?? 0) > MAX_ROWS_PER_SECTION) {
        return json({ error: 'Profile too large' }, 413, origin)
      }
    }
    const [experiences, education, skills, portfolioItems] = sections.map((s) => (s.data || []) as Record<string, unknown>[])

    const profileData = buildProfileData(profile, experiences, education, skills, portfolioItems)
    const contentHash = generateContentHash(profileData)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ---- 2. ¿La caché ya está al día? Entonces no hay nada que hacer ----
    const { data: existing, error: existingError } = await admin
      .from('profile_translations')
      .select('source_content_hash, translated_content')
      .eq('profile_id', profileId)
      .eq('target_language', targetLang)
      .maybeSingle()
    if (existingError) console.warn('[translate-profile] No se pudo leer la caché:', existingError.message)
    if (existing && existing.source_content_hash === contentHash) {
      return json({ status: 'cached', source_content_hash: contentHash, translated_content: existing.translated_content }, 200, origin)
    }

    // ---- 3. Textos a traducir (mismo criterio que el navegador) ----
    const { sourceLang, texts } = textsToTranslate(profileData, targetLang)
    if (
      texts.length > MAX_TEXTS ||
      texts.some((t) => t.length > MAX_TEXT_LENGTH) ||
      texts.reduce((n, t) => n + t.length, 0) > MAX_TOTAL_CHARS
    ) {
      return json({ error: 'Profile too large' }, 413, origin)
    }

    let translations = new Map<string, string>()
    let failed = 0

    if (texts.length > 0) {
      // 3a. Caché compartida de textos (se comprueba el texto original por colisiones del hash)
      const pending: string[] = []
      try {
        const hashes = Array.from(new Set(texts.map(hashText)))
        const { data, error } = await admin
          .from('text_translations')
          .select('original_text, translated_text')
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
          if (hit) translations.set(t, hit)
          else pending.push(t)
        }
      } catch (_e) {
        pending.push(...texts.filter((t) => !translations.has(t)))
      }

      // 3b. Traducir lo que falta
      if (pending.length > 0) {
        const results = await mapWithConcurrency(pending, CONCURRENCY, (t) => translateOne(fetch, t, sourceLang, targetLang))
        const rows: Record<string, unknown>[] = []
        pending.forEach((t, i) => {
          const tr = results[i]
          if (!tr || !tr.trim()) {
            failed++
            return
          }
          translations.set(t, tr)
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
        if (rows.length > 0) {
          const { error } = await admin
            .from('text_translations')
            .upsert(rows, { onConflict: 'text_hash,source_lang,target_lang' })
          if (error) console.warn('[translate-profile] No se pudo guardar text_translations:', error.message)
        }
      }

      // 3c. Corrección de género (igual que useTranslatedProfile, solo hacia español)
      if (targetLang === 'es') {
        const p = profile as Record<string, unknown>
        const declared = typeof p.gender === 'string' && p.gender ? p.gender : null
        const gender = declared || inferGenderFromName(typeof p.full_name === 'string' ? p.full_name : null)
        if (gender) translations = correctGenderBatch(translations, gender)
      }
    }

    const translatedSkills = (profileData.skills || []).map((skill) => ({
      id: (skill.id as string) || '',
      name: translations.get(((skill.name as string) || '').trim()) || (skill.name as string),
    }))
    const content = extractTranslatedContent(profileData, translations, translatedSkills)

    // ---- 4. Si algo no se pudo traducir, NO se cachea (se devolvería a
    //         todos los visitantes un perfil a medio traducir) ----
    if (failed > 0) {
      return json({ status: 'partial', source_content_hash: contentHash, translated_content: content }, 200, origin)
    }

    // ---- 5. Guardar (service role: única vía de escritura) ----
    const { error: upsertError } = await admin
      .from('profile_translations')
      .upsert({
        profile_id: profileId,
        target_language: targetLang,
        translated_content: content,
        source_content_hash: contentHash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,target_language' })
    if (upsertError) {
      console.warn('[translate-profile] No se pudo guardar profile_translations:', upsertError.message)
      return json({ status: 'partial', source_content_hash: contentHash, translated_content: content }, 200, origin)
    }

    return json({
      status: texts.length === 0 ? 'nothing_to_translate' : 'stored',
      source_content_hash: contentHash,
      translated_content: content,
    }, 200, origin)
  } catch (err) {
    console.error('[translate-profile] Error:', (err as Error)?.message)
    return json({ error: 'Internal error' }, 500, origin)
  }
})
