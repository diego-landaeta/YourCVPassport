// Supabase Edge Function: send-outbox
// ----------------------------------------------------------------------------
// Envía los correos que las RPC y las Edge Functions de la bolsa de empleo dejan en
// `email_outbox` (migraciones 20261029-20261032). Ninguna otra pieza envía esa cola.
//
// Qué hace en cada llamada
//   1. Cuenta los `sent_at` de HOY (UTC). Si ya se llegó al tope diario, no envía nada.
//   2. Toma un lote (20 por defecto) de filas pendientes: sent_at IS NULL, attempts < 5,
//      send_after <= now(), por `priority` ascendente (avisos internos y estado/seguridad
//      antes que el resumen diario y las alertas) y, a igualdad, la más antigua primero.
//   3. Reclama cada fila con un UPDATE condicionado (bloqueo optimista, ver queue.ts): dos
//      ejecuciones simultáneas nunca envían la misma.
//   4. Genera el correo con las plantillas es/en de templates.ts (diseño de
//      _shared/emailLayout.ts) y lo envía con _shared/email.ts (Brevo, o el relé).
//   5. Marca `sent_at`, o deja la fila para reintentar con `attempts`, `send_after`
//      (backoff) y `last_error`. Si Brevo contesta cupo agotado (402/429) o falta la
//      configuración, PARA la ejecución y no gasta el intento de la fila.
//
// TOPE DIARIO (para no agotar el cupo de Brevo, compartido y de 300/día)
//   Secreto OUTBOX_DAILY_CAP (por defecto 250). Con el 80 % gastado solo salen los de
//   estado/seguridad (priority < 8): resumen diario y alertas esperan al día siguiente.
//
// Quién puede llamarla (comprobado aquí; ver _shared/serviceAuth.ts)
//   - cron: cabecera x-cron-secret = secreto de entorno CRON_SECRET (el trabajo programado
//     de la base, migración 20261034). Nunca se acepta si CRON_SECRET no está definido.
//   - service_role: Authorization = clave service_role.
//   - admin: usuario con profiles.role = 'admin' (lanzarla a mano o ver el estado).
//
// Contrato: POST { limit?: 1-50, dry_run?: boolean, alerts?: boolean, digests?: boolean }
//   alerts: true -> ANTES de enviar llama a la RPC queue_job_alerts() (migración 20261031),
//     que encola un aviso por suscriptor con ofertas nuevas, y después envía como siempre.
//     Es lo que hace el trabajo diario `bolsa-alertas` (07:00 UTC). Si la RPC falla se
//     registra y se sigue enviando: la respuesta lleva alerts_queued (número) o
//     alerts_error: true. Con dry_run no se llama.
//   digests: true -> ANTES de enviar llama a la RPC queue_application_digests() (migración
//     20261035), que agrega las candidaturas nuevas del día en UN correo `application_digest` por
//     empresa y oferta (solo para ofertas con frecuencia de resumen diario; es idempotente por
//     dedupe_key). Es lo que hace el trabajo diario `bolsa-resumenes` (08:00 UTC). Igual que con
//     las alertas: si la RPC falla se registra y se sigue enviando (digests_queued o
//     digests_error: true en la respuesta). Con dry_run no se llama. Alertas y resúmenes
//     pueden pedirse en la misma llamada.
//   200 { ok: true, sent, failed, skipped_claimed, cap, sent_today, remaining_today,
//         stopped: null | CAP_REACHED | QUOTA | TIME_BUDGET, errors: [{id, kind, error}] }
//       (errors NO lleva destinatarios ni contenido)
//   dry_run -> 200 { ok: true, dry_run: true, cap, sent_today, due_now, pending }
//   503 { stopped: 'CONFIG' | 'PROVIDER_DOWN', ... } si el envío no está configurado o
//       Brevo/el relé no responden; 503 { code: 'MIGRATION_MISSING' } si falta la columna
//       last_error (migración 20261032). El cron lo marcará como fallo.
//   (la ejecución también termina con stopped: 'PROVIDER_DOWN' tras 3 fallos 5xx seguidos)
//   401 UNAUTHORIZED | 403 FORBIDDEN | 405 | 500 INTERNAL_ERROR
//
// Despliegue: supabase functions deploy send-outbox --no-verify-jwt   (el trabajo programado
// manda x-cron-secret, no un JWT; la autorización se hace aquí dentro). Ver
// docs/bolsa-despliegue-funciones.md.
// Secretos: CRON_SECRET, BREVO_API_KEY (o EMAIL_RELAY_URL + EMAIL_RELAY_SECRET), SENDER_EMAIL y,
// opcional, OUTBOX_DAILY_CAP. SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.
// Requiere la columna email_outbox.last_error (migración 20261032).
// ----------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders } from '../_shared/cors.ts'
import { authorizeRequest, supabaseAuthDeps } from '../_shared/serviceAuth.ts'
import { sendEmail } from '../_shared/email.ts'
import { renderOutboxEmail } from './templates.ts'
import {
  DEFAULT_DAILY_CAP,
  MAX_ATTEMPTS,
  MAX_BATCH,
  processOutbox,
  startOfUtcDay,
  type OutboxRow,
  type OutboxStore,
} from './queue.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// deno-lint-ignore no-explicit-any
type Admin = any

const COLUMNS = 'id, kind, to_email, payload, lang, priority, send_after, attempts'

async function authorize(req: Request, admin: Admin): Promise<{ ok: boolean; status: number }> {
  const r = await authorizeRequest(req, supabaseAuthDeps(admin, SERVICE_KEY, Deno.env.get('CRON_SECRET')))
  return { ok: r.who !== null, status: r.status }
}

/** Tope diario: secreto OUTBOX_DAILY_CAP (entero >= 0); si falta o no es válido, 250. */
function dailyCap(): number {
  const raw = (Deno.env.get('OUTBOX_DAILY_CAP') || '').trim()
  if (!/^\d{1,6}$/.test(raw)) return DEFAULT_DAILY_CAP
  return Number(raw)
}

function supabaseStore(admin: Admin): OutboxStore {
  return {
    async countSentSince(sinceIso) {
      const { count, error } = await admin
        .from('email_outbox')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', sinceIso)
      if (error) throw new Error(`count: ${error.message}`)
      return count ?? 0
    },

    async listCandidates({ nowIso, limit, maxPriority }) {
      let q = admin
        .from('email_outbox')
        .select(COLUMNS)
        .is('sent_at', null)
        .lt('attempts', MAX_ATTEMPTS)
        .lte('send_after', nowIso)
        .order('priority', { ascending: true })
        .order('send_after', { ascending: true })
        .limit(limit)
      if (maxPriority !== undefined) q = q.lte('priority', maxPriority)
      const { data, error } = await q
      if (error) throw new Error(`list: ${error.message}`)
      return (data ?? []) as OutboxRow[]
    },

    // UPDATE ... WHERE id AND sent_at IS NULL AND attempts = <leído> AND send_after = <leído>
    // AND attempts < 5 RETURNING ...: solo una ejecución obtiene la fila.
    async claim(row, leaseUntilIso) {
      const { data, error } = await admin
        .from('email_outbox')
        .update({ attempts: row.attempts + 1, send_after: leaseUntilIso })
        .eq('id', row.id)
        .is('sent_at', null)
        .eq('attempts', row.attempts)
        .eq('send_after', row.send_after)
        .lt('attempts', MAX_ATTEMPTS)
        .select(COLUMNS)
      if (error) throw new Error(`claim: ${error.message}`)
      return Array.isArray(data) && data.length === 1 ? (data[0] as OutboxRow) : null
    },

    async markSent(id, nowIso) {
      // Lo crítico es sent_at (si falla, el correo se reenviaría): va solo, sin tocar last_error.
      const { error } = await admin.from('email_outbox').update({ sent_at: nowIso }).eq('id', id).is('sent_at', null)
      if (error) throw new Error(`markSent: ${error.message}`)
      // Limpiar el último error es opcional (la columna es de la migración 20261032).
      await admin.from('email_outbox').update({ last_error: null }).eq('id', id).not('last_error', 'is', null)
    },

    async release(id, patch) {
      const { error } = await admin
        .from('email_outbox')
        .update({ attempts: patch.attempts, send_after: patch.sendAfterIso, last_error: patch.lastError.slice(0, 500) })
        .eq('id', id)
        .is('sent_at', null)
      if (error) console.error('[send-outbox] release:', error.message)
    },
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
    if (!auth.ok) {
      return json(auth.status === 403 ? { error: 'Forbidden', code: 'FORBIDDEN' } : { error: 'Unauthorized', code: 'UNAUTHORIZED' }, auth.status)
    }

    let body: { limit?: unknown; dry_run?: unknown; alerts?: unknown; digests?: unknown } = {}
    try {
      const text = await req.text()
      if (text.trim()) body = JSON.parse(text)
    } catch {
      return json({ error: 'Invalid JSON body', code: 'INVALID_INPUT' }, 400)
    }

    const store = supabaseStore(admin)
    const cap = dailyCap()

    if (body.dry_run === true) {
      const sentToday = await store.countSentSince(startOfUtcDay(new Date()))
      const due = await admin.from('email_outbox').select('id', { count: 'exact', head: true }).is('sent_at', null).lt('attempts', MAX_ATTEMPTS).lte('send_after', new Date().toISOString())
      // Incluye last_error: si la migración 20261032 no está aplicada, esta comprobación falla (500) antes de enviar nada.
      const pending = await admin.from('email_outbox').select('id, last_error', { count: 'exact', head: true }).is('sent_at', null).lt('attempts', MAX_ATTEMPTS)
      if (due.error || pending.error) {
        console.error('[send-outbox] dry_run:', due.error?.message || pending.error?.message)
        return json({ error: 'Could not read the queue', code: 'INTERNAL_ERROR' }, 500)
      }
      return json({ ok: true, dry_run: true, cap, sent_today: sentToday, due_now: due.count ?? 0, pending: pending.count ?? 0 }, 200)
    }

    // Comprobación previa: sin la columna last_error (migración 20261032) no se envía nada.
    const pre = await admin.from('email_outbox').select('last_error').limit(1)
    if (pre.error) {
      console.error('[send-outbox] falta la migración 20261032 (email_outbox.last_error):', pre.error.message)
      return json({ ok: false, error: 'Queue schema is out of date (apply migration 20261032)', code: 'MIGRATION_MISSING' }, 503)
    }

    // Alertas de ofertas: la RPC encola; el envío lo hace este mismo barrido. Un fallo no lo impide.
    let alertsQueued: number | null = null
    let alertsError = false
    if (body.alerts === true) {
      const { data, error } = await admin.rpc('queue_job_alerts')
      if (error) {
        alertsError = true
        console.error('[send-outbox] queue_job_alerts:', error.message)
      } else {
        alertsQueued = Number.isFinite(Number(data)) ? Number(data) : 0
      }
    }

    // Resumen diario de candidaturas: la RPC encola un correo por empresa y oferta; el envío lo hace este barrido.
    let digestsQueued: number | null = null
    let digestsError = false
    if (body.digests === true) {
      const { data, error } = await admin.rpc('queue_application_digests')
      if (error) {
        digestsError = true
        console.error('[send-outbox] queue_application_digests:', error.message)
      } else {
        digestsQueued = Number.isFinite(Number(data)) ? Number(data) : 0
      }
    }

    const limit = Number.isInteger(body.limit) ? Math.min(Math.max(Number(body.limit), 1), MAX_BATCH) : undefined

    const summary = await processOutbox({
      store,
      dailyCap: cap,
      batchSize: limit,
      render: (row) => renderOutboxEmail(row.kind, row.payload, row.lang),
      send: async (row, mail) => {
        const r = await sendEmail({ to: row.to_email, subject: mail.subject, html: mail.html, text: mail.text, tags: ['outbox', row.kind] })
        return r.ok ? { ok: true } : { ok: false, status: r.status, code: r.code, detail: r.detail }
      },
    })

    if (summary.errors.length) {
      // Solo ids y tipos: nada de destinatarios ni de contenido.
      console.error('[send-outbox] errores:', JSON.stringify(summary.errors.slice(0, 10)))
    }
    const down = summary.stopped === 'CONFIG' || summary.stopped === 'PROVIDER_DOWN'
    return json({
      ok: !down,
      ...summary,
      ...(body.alerts === true ? (alertsError ? { alerts_error: true } : { alerts_queued: alertsQueued }) : {}),
      ...(body.digests === true ? (digestsError ? { digests_error: true } : { digests_queued: digestsQueued }) : {}),
    }, down ? 503 : 200)
  } catch (error) {
    console.error('[send-outbox] error interno:', (error as Error)?.message)
    return json({ error: 'Unexpected error', code: 'INTERNAL_ERROR' }, 500)
  }
})
