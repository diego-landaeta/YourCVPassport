// Supabase Edge Function: moderate-job-posting
// ----------------------------------------------------------------------------
// Revisión automática de una oferta que está en AI_REVIEW (fase 2, issue #7).
//
// Qué hace
//   - Lee la oferta con service_role y aplica las reglas de `rules.ts` (dinero o pago
//     por adelantado, WhatsApp/Telegram, multinivel, discriminación, contacto externo,
//     mayúsculas excesivas, texto sin sentido...). Después consulta `ai.ts` (hoy sin
//     proveedor: devuelve null).
//   - ANTES de leer el texto pide la huella de TODO el texto moderado con la RPC
//     get_job_moderation_hash(id). SIN hallazgos -> moderar_oferta(id, 'PUBLISHED',
//     p_expected_hash => huella). Si la empresa editó mientras tanto, la RPC contesta
//     HASH_MISMATCH (la oferta sigue en AI_REVIEW) y se evalúa de nuevo, como máximo 2
//     veces más; si el texto sigue cambiando, MANUAL_REVIEW. Un fallo al obtener la
//     huella también acaba en MANUAL_REVIEW (nunca se publica sin huella).
//   - CON hallazgos, o ante CUALQUIER error -> moderar_oferta(id, 'MANUAL_REVIEW', motivo).
//     La propia RPC encola el aviso a support@yourcvpassport.com en `email_outbox`.
//     Si la RPC también falla, esta función encola el aviso directamente (fallback).
//   - NUNCA publica ante un error: PUBLISHED solo se pide cuando no hay hallazgos y no
//     se ha producido ninguna excepción. Si ni siquiera se puede pasar a revisión
//     manual, la oferta se queda en AI_REVIEW (no visible) y se responde con error.
//
// Quién puede llamarla (comprobado aquí; ver _shared/serviceAuth.ts)
//   - cron: cabecera x-cron-secret = secreto de entorno CRON_SECRET (el trabajo programado
//     de la base, migración 20261034). Nunca se acepta si CRON_SECRET no está definido.
//   - service_role: cabecera Authorization = clave service_role (webhook de BD).
//   - admin: usuario con profiles.role = 'admin' (botón «Revisión automática» del panel).
//   Cualquier otro -> 401/403.
//
// Contrato: POST { job_id?: uuid, limit?: 1-50 }
//   - Con job_id: revisa esa oferta.
//   - Sin job_id: barrido de las ofertas en AI_REVIEW, de la más antigua a la más nueva
//     (hasta `limit`, 20 por defecto). Pensado para un cron cada pocos minutos.
//   200 { ok, results: [{ job_id, outcome, findings, ai? }] }
//       outcome: PUBLISHED | MANUAL_REVIEW | SKIPPED (ya no estaba en AI_REVIEW) |
//                NOT_FOUND | ERROR
//   400 INVALID_INPUT | 401 UNAUTHORIZED | 403 FORBIDDEN | 405 | 500 INTERNAL_ERROR
//   (500 si algún resultado es ERROR: la oferta sigue sin publicar)
//
// Cómo engancharla (paso de despliegue MANUAL; ver docs/bolsa-despliegue-funciones.md)
//   - Lo hace el trabajo `bolsa-moderacion` (pg_cron + pg_net, migración 20261034) cada 5
//     minutos: POST sin cuerpo con x-cron-secret. Alternativa: un cron externo con la clave
//     service_role en Authorization.
//   Sin programador, las ofertas se quedan en AI_REVIEW hasta que un admin pulse
//   «Revisión automática» o las apruebe a mano: es un fallo seguro, no una publicación.
//
// Despliegue: supabase functions deploy moderate-job-posting --no-verify-jwt   (el programador
// manda x-cron-secret, no un JWT; la autorización se hace aquí dentro).
// Secretos: CRON_SECRET; SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.
// ----------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders } from '../_shared/cors.ts'
import { authorizeRequest, supabaseAuthDeps } from '../_shared/serviceAuth.ts'
import { reasonFromFindings, reviewJobText, type Finding } from './rules.ts'
import { reviewWithAi } from './ai.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPPORT_EMAIL = 'support@yourcvpassport.com'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const JOB_COLUMNS =
  'id, title, status, company_id, description, department, responsibilities, requirements, nice_to_have, benefits, required_skills, optional_skills, application_instructions, application_url, application_email, duration'

type Outcome = 'PUBLISHED' | 'MANUAL_REVIEW' | 'SKIPPED' | 'NOT_FOUND' | 'ERROR'
interface Result {
  job_id: string
  outcome: Outcome
  findings: string[]
  ai?: { provider: string; model?: string; verdict: string }
}

// deno-lint-ignore no-explicit-any
type Admin = any

/** 'cron' (secreto del programador), 'service' (clave service_role) o 'admin' (usuario admin); si no, null. */
async function authorize(req: Request, admin: Admin): Promise<{ who: 'cron' | 'service' | 'admin' | null; status: number }> {
  return await authorizeRequest(req, supabaseAuthDeps(admin, SERVICE_KEY, Deno.env.get('CRON_SECRET')))
}

/** Encola directamente el aviso a support@ (solo si la RPC no ha podido hacerlo). */
async function enqueueSupportNotice(admin: Admin, jobId: string, title: string, reasons: string): Promise<void> {
  const hour = new Date().toISOString().slice(0, 13).replace(/\D/g, '')
  const { error } = await admin.from('email_outbox').insert({
    kind: 'job_manual_review',
    to_email: SUPPORT_EMAIL,
    lang: 'es',
    priority: 3,
    payload: { job_id: jobId, title, reasons: [reasons], source: 'moderate-job-posting', dedupe_key: `job_moderation_fallback:${jobId}:${hour}` },
  })
  // 23505 = ya encolado en esta hora: es lo esperado, no un fallo.
  if (error && error.code !== '23505') console.error('[moderate-job-posting] outbox:', error.message)
}

/** Pasa a revisión manual por la RPC; si falla, deja el aviso en la cola y devuelve false. */
async function toManualReview(admin: Admin, jobId: string, title: string, reason: string): Promise<boolean> {
  const { error } = await admin.rpc('moderar_oferta', { p_job_id: jobId, p_decision: 'MANUAL_REVIEW', p_motivo: reason })
  if (!error) return true
  console.error('[moderate-job-posting] moderar_oferta MANUAL_REVIEW:', error.message)
  await enqueueSupportNotice(admin, jobId, title, reason)
  return false
}

// Evaluaciones máximas por oferta: la primera y, si el texto cambia mientras se evalúa
// (HASH_MISMATCH), hasta 2 re-evaluaciones. Si aun así sigue cambiando, revisión manual.
const MAX_EVALUATIONS = 3

/** Huella de TODO el texto moderado (RPC get_job_moderation_hash, solo service_role/admin). */
async function getModerationHash(admin: Admin, jobId: string): Promise<string> {
  const { data, error } = await admin.rpc('get_job_moderation_hash', { p_job_id: jobId })
  if (error) throw new Error(`hash: ${error.message}`)
  if (typeof data !== 'string' || !data) throw new Error('hash: respuesta vacía')
  return data
}

const isHashMismatch = (err: { message?: string } | null | undefined) => /HASH_MISMATCH/.test(String(err?.message || ''))

async function moderateOne(admin: Admin, jobId: string): Promise<Result> {
  const base: Result = { job_id: jobId, outcome: 'ERROR', findings: [] }
  let title = ''
  try {
    for (let attempt = 1; attempt <= MAX_EVALUATIONS; attempt++) {
      // 0. La huella se toma ANTES de leer el texto. Si la empresa edita después de este
      //    punto, la huella que se pasa a moderar_oferta ya no coincidirá (HASH_MISMATCH)
      //    y se vuelve a evaluar; nunca se publica un texto distinto del evaluado.
      const hash = await getModerationHash(admin, jobId)

      const { data: job, error } = await admin.from('job_postings').select(JOB_COLUMNS).eq('id', jobId).maybeSingle()
      if (error) throw new Error(`lectura: ${error.message}`)
      if (!job) return { ...base, outcome: 'NOT_FOUND' }
      title = String(job.title || '')
      if (job.status !== 'AI_REVIEW') return { ...base, outcome: 'SKIPPED' }

      // 1. Reglas + (si algún día hay) IA. Cualquier excepción cae al catch -> revisión manual.
      const findings: Finding[] = reviewJobText(job)
      const ai = await reviewWithAi(job, findings)
      let aiNote: string | undefined
      if (ai && ai.verdict !== 'ok') {
        findings.push({ code: 'IA_DUDA', message: 'El proveedor de IA ha marcado dudas.', excerpt: ai.reasons.join('; ').slice(0, 100) })
        aiNote = `IA (${ai.provider}${ai.model ? ` ${ai.model}` : ''}): ${ai.reasons.join('; ')}`
      }
      const codes = findings.map((f) => f.code)
      const aiInfo = ai ? { provider: ai.provider, model: ai.model, verdict: ai.verdict } : undefined

      // 2. Si entre la lectura y la decisión un admin ya la resolvió, no se pisa.
      const { data: again, error: againErr } = await admin.from('job_postings').select('status').eq('id', jobId).maybeSingle()
      if (againErr) throw new Error(`relectura: ${againErr.message}`)
      if (!again || again.status !== 'AI_REVIEW') return { ...base, outcome: 'SKIPPED', findings: codes }

      // 3. Decisión
      if (findings.length > 0) {
        const ok = await toManualReview(admin, jobId, title, reasonFromFindings(findings, aiNote))
        return { ...base, outcome: ok ? 'MANUAL_REVIEW' : 'ERROR', findings: codes, ai: aiInfo }
      }

      const { error: pubErr } = await admin.rpc('moderar_oferta', {
        p_job_id: jobId,
        p_decision: 'PUBLISHED',
        p_motivo: null,
        p_expected_hash: hash,
      })
      if (!pubErr) return { ...base, outcome: 'PUBLISHED', findings: [], ai: aiInfo }

      if (isHashMismatch(pubErr)) {
        // El texto cambió mientras se evaluaba: la oferta sigue en AI_REVIEW. Se evalúa de nuevo.
        console.warn(`[moderate-job-posting] HASH_MISMATCH en ${jobId} (evaluación ${attempt}/${MAX_EVALUATIONS})`)
        continue
      }

      // No se pudo publicar por otra causa (p. ej. empresa no verificada): revisión manual, nunca insistir.
      console.error('[moderate-job-posting] moderar_oferta PUBLISHED:', pubErr.message)
      const reason = reasonFromFindings([], `No se pudo publicar automáticamente: ${String(pubErr.message).slice(0, 200)}`)
      await toManualReview(admin, jobId, title, reason)
      return { ...base, outcome: 'MANUAL_REVIEW', findings: ['ERROR_PUBLICAR'], ai: aiInfo }
    }

    // El texto siguió cambiando en todas las evaluaciones: que lo mire una persona.
    const reason = reasonFromFindings([], `El texto de la oferta cambió durante la revisión automática (${MAX_EVALUATIONS} intentos): revisión manual.`)
    const moved = await toManualReview(admin, jobId, title, reason)
    return { ...base, outcome: moved ? 'MANUAL_REVIEW' : 'ERROR', findings: ['TEXTO_CAMBIANTE'] }
  } catch (err) {
    // Cualquier error: nunca se publica. Se intenta pasar a revisión manual.
    const message = String((err as Error)?.message || err).slice(0, 200)
    console.error('[moderate-job-posting] error en', jobId, message)
    const moved = await toManualReview(admin, jobId, title, `Error en la revisión automática: ${message}`)
    return { ...base, outcome: moved ? 'MANUAL_REVIEW' : 'ERROR', findings: ['ERROR_REVISION'] }
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (body: unknown, status: number): Response =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

    const auth = await authorize(req, admin)
    if (!auth.who) {
      return json(auth.status === 403 ? { error: 'Forbidden', code: 'FORBIDDEN' } : { error: 'Unauthorized', code: 'UNAUTHORIZED' }, auth.status)
    }

    let body: { job_id?: unknown; limit?: unknown } = {}
    try {
      const text = await req.text()
      if (text.trim()) body = JSON.parse(text)
    } catch {
      return json({ error: 'Invalid JSON body', code: 'INVALID_INPUT' }, 400)
    }

    let ids: string[] = []
    if (body.job_id !== undefined && body.job_id !== null) {
      if (typeof body.job_id !== 'string' || !UUID_RE.test(body.job_id)) {
        return json({ error: 'job_id must be a UUID', code: 'INVALID_INPUT' }, 400)
      }
      ids = [body.job_id]
    } else {
      const limit = Math.min(Math.max(Number.isInteger(body.limit) ? Number(body.limit) : 20, 1), 50)
      const { data, error } = await admin.from('job_postings').select('id').eq('status', 'AI_REVIEW').order('updated_at', { ascending: true }).limit(limit)
      if (error) {
        console.error('[moderate-job-posting] cola:', error.message)
        return json({ error: 'Could not read the queue', code: 'INTERNAL_ERROR' }, 500)
      }
      ids = (data || []).map((r: { id: string }) => r.id)
    }

    const results: Result[] = []
    for (const id of ids) results.push(await moderateOne(admin, id))

    const failed = results.some((r) => r.outcome === 'ERROR')
    return json({ ok: !failed, results }, failed ? 500 : 200)
  } catch (error) {
    console.error('[moderate-job-posting] error interno:', (error as Error)?.message)
    return json({ error: 'Unexpected error', code: 'INTERNAL_ERROR' }, 500)
  }
})
