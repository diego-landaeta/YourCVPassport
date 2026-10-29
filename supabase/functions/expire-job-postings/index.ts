// Supabase Edge Function: expire-job-postings
// ----------------------------------------------------------------------------
// Caducidad diaria de las ofertas (fase 2, issue #7). Llama a la RPC
// `expire_job_postings()` (migración 20261030), que:
//   1. avisa a la empresa 3 días antes del cierre (una sola vez por fecha de cierre),
//   2. pasa a EXPIRED las PUBLISHED/PAUSED cuyo `application_deadline` ya venció,
// y encola los correos en `email_outbox` (aquí no se envía nada). Es idempotente:
// ejecutarla dos veces seguidas no duplica nada.
//
// Quién puede llamarla (comprobado aquí; ver _shared/serviceAuth.ts)
//   - cron: cabecera x-cron-secret = secreto de entorno CRON_SECRET (el trabajo programado
//     de la base, migración 20261034). Nunca se acepta si CRON_SECRET no está definido.
//   - service_role: Authorization = clave service_role.
//   - admin: usuario con profiles.role = 'admin' (para lanzarla a mano).
//
// La migración 20261034 programa esta función (trabajo `bolsa-caducidad`, 03:10 UTC) con
// pg_cron + pg_net y el secreto x-cron-secret. Sin pg_cron sirve un POST diario (sin cuerpo)
// con la clave service_role desde el programador que uses.
//
// Contrato: POST (sin cuerpo)  ->  200 { ok: true, expired, notices }
//   401 UNAUTHORIZED | 403 FORBIDDEN | 405 | 500 INTERNAL_ERROR
//
// Despliegue: supabase functions deploy expire-job-postings --no-verify-jwt   (el programador
// manda x-cron-secret, no un JWT; la autorización se hace aquí dentro). Secreto: CRON_SECRET.
// Programación (diaria) y comprobaciones: docs/bolsa-despliegue-funciones.md. Los correos que
// encola los envía send-outbox.
// ----------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders } from '../_shared/cors.ts'
import { authorizeRequest, supabaseAuthDeps } from '../_shared/serviceAuth.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// deno-lint-ignore no-explicit-any
type Admin = any

async function authorize(req: Request, admin: Admin): Promise<{ ok: boolean; status: number }> {
  const r = await authorizeRequest(req, supabaseAuthDeps(admin, SERVICE_KEY, Deno.env.get('CRON_SECRET')))
  return { ok: r.who !== null, status: r.status }
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

    const { data, error } = await admin.rpc('expire_job_postings')
    if (error) {
      console.error('[expire-job-postings] rpc:', error.message)
      return json({ error: 'Could not expire job postings', code: 'INTERNAL_ERROR' }, 500)
    }
    const r = (data || {}) as { expired?: number; notices?: number }
    return json({ ok: true, expired: r.expired ?? 0, notices: r.notices ?? 0 }, 200)
  } catch (error) {
    console.error('[expire-job-postings] error interno:', (error as Error)?.message)
    return json({ error: 'Unexpected error', code: 'INTERNAL_ERROR' }, 500)
  }
})
