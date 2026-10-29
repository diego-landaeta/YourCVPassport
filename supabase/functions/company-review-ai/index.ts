// Supabase Edge Function: company-review-ai
//
// Revisión automática del registro de una empresa (bolsa de empleo, fase 1, #6).
// Despliegue: CON verificación de JWT (no usar --no-verify-jwt).
//
// QUÉ HACE
//   Comprueba, con REGLAS deterministas (rules.ts), una empresa PENDING:
//     - formato del identificador fiscal con el patrón PROPIO del país (ES, MX, AR,
//       CL, CO, PE y los de Europa de rules.ts); un país sin patrón propio queda
//       'dudosa': nunca se aprueba sola,
//     - web propia indicada y dominio del correo == dominio de la web (o subdominio);
//       correo gratuito (gmail, hotmail, outlook, yahoo, icloud, proton...) o
//       desechable = 'dudosa',
//     - duplicados por identificador fiscal, correo y dominio en CUALQUIER otra
//       empresa (y coincidencia con empresas rechazadas o suspendidas),
//     - palabras sospechosas y datos poco creíbles.
//   Escribe SIEMPRE el resultado en `company_ai_reviews` (ok | dudosa | error,
//   motivos jsonb, proveedor 'reglas'). Después:
//     - resultado 'ok'     -> UPDATE condicionado a status='PENDING' (si un admin
//                             la rechazó mientras tanto, NO se pisa) y se encola
//                             «empresa verificada» para el correo de la empresa;
//     - 'dudosa' o 'error' -> la empresa SIGUE en PENDING (revisión manual) y se
//                             encola un aviso a support@yourcvpassport.com en
//                             `email_outbox` con los motivos.
//   NO ENVÍA correo (Brevo sin cupo): solo encola; el envío real se hace aparte.
//
// SEGURIDAD
//   - Ante CUALQUIER error nunca se aprueba. Solo se aprueba si la revisión salió
//     'ok' Y quedó registrada en company_ai_reviews, y siempre con
//     UPDATE ... WHERE status = 'PENDING' (carrera con un admin que rechaza).
//   - Si hay MAX_OTHERS empresas o más no se puede garantizar la búsqueda de
//     duplicados: la revisión termina en 'error' (nunca se aprueba).
//   - Solo la pueden lanzar un admin o un miembro/creador de esa empresa. Un 'ok'
//     requiere que la empresa esté PENDING; las demás no se tocan.
//   - La respuesta al cliente NO incluye los motivos (no se enseña qué falla).
//
// CONTRATO: POST { companyId: uuid, force?: boolean (solo admin: repite la revisión) }
//   200 { success, status: 'APPROVED'|'PENDING'|..., resultado: 'ok'|'dudosa'|'error'|null, skipped? }
//   400 INVALID_INPUT | 401 UNAUTHORIZED | 403 FORBIDDEN | 404 NOT_FOUND | 429 RATE_LIMITED | 500 INTERNAL_ERROR
//
// PUNTO DE EXTENSIÓN PARA IA
//   Hoy el proveedor es solo 'reglas' (la clave de Gemini caducó y el proveedor es
//   una decisión pendiente). Para añadir una IA: implementar `ReviewProvider`
//   (rules.ts), añadirlo al array PROVIDERS de abajo y guardar su clave como secreto
//   de esta función. La IA solo puede AÑADIR hallazgos; no puede convertir una
//   empresa 'dudosa' en 'ok', y si lanza una excepción el resultado es 'error'.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders } from '../_shared/cors.ts'
import { enforceRateLimit } from '../_shared/ratelimit.ts'
import {
  reviewCompany,
  type CompanyForReview,
  type Finding,
  type OtherCompany,
  type ReviewProvider,
} from './rules.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const SUPPORT_EMAIL = 'support@yourcvpassport.com'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RULES_MODEL = 'reglas-v1'
// Máximo de empresas que se cargan para buscar duplicados (hoy hay 0; al crecer,
// pasar a una consulta filtrada por tax_id/dominio o a una RPC).
const MAX_OTHERS = 5000

// Proveedores de IA adicionales (vacío: solo reglas). Ver «PUNTO DE EXTENSIÓN».
const PROVIDERS: ReviewProvider[] = []

class HttpError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const errorFinding = (detail: string): Finding => ({
  code: 'review_error',
  severity: 'warn',
  message_es: `La revisión automática falló y la empresa pasa a revisión manual (${detail}).`,
  message_en: `The automatic review failed and the company goes to manual review (${detail}).`,
})

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'INVALID_INPUT', 'Method not allowed')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new HttpError(500, 'INTERNAL_ERROR', 'Server not configured')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // 1. Llamante
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
    if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Missing authorization')
    const { data: callerData, error: callerError } = await supabase.auth.getUser(token)
    const callerId: string | undefined = callerData?.user?.id
    if (callerError || !callerId) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired session')

    // 2. Entrada
    let body: any
    try {
      body = await req.json()
    } catch {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body')
    }
    const companyId = typeof body?.companyId === 'string' ? body.companyId : ''
    if (!UUID_RE.test(companyId)) throw new HttpError(400, 'INVALID_INPUT', 'companyId must be a UUID')

    // 3. Empresa y permisos
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, legal_name, tax_id, country_code, company_email, website_url, contact_name, description, industry, status, created_by, idioma')
      .eq('id', companyId)
      .maybeSingle()
    if (companyError) throw new HttpError(500, 'INTERNAL_ERROR', 'Could not load company')
    if (!company) throw new HttpError(404, 'NOT_FOUND', 'Company not found')

    const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', callerId).maybeSingle()
    const isAdmin = typeof callerProfile?.role === 'string' && callerProfile.role.toLowerCase() === 'admin'
    let allowed = isAdmin || company.created_by === callerId
    if (!allowed) {
      const { data: member } = await supabase
        .from('company_users')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('user_id', callerId)
        .maybeSingle()
      allowed = !!member
    }
    if (!allowed) throw new HttpError(403, 'FORBIDDEN', 'Not allowed for this company')

    const limited = await enforceRateLimit('ai', [`company-review:${callerId}`], corsHeaders)
    if (limited) return limited

    // Solo se revisan las PENDING; las demás no se tocan.
    if (company.status !== 'PENDING') {
      return json(200, { success: true, skipped: true, status: company.status, resultado: null })
    }

    // Idempotencia: una revisión de hace menos de 2 min se devuelve tal cual (doble clic, reintentos).
    if (!(isAdmin && body?.force === true)) {
      const { data: recent } = await supabase
        .from('company_ai_reviews')
        .select('resultado, created_at')
        .eq('company_id', companyId)
        .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (recent) return json(200, { success: true, skipped: true, status: 'PENDING', resultado: recent.resultado })
    }

    const outcome = await reviewAndDecide(supabase, company as CompanyForReview & { status: string; idioma: string | null })
    return json(200, { success: true, status: outcome.approved ? 'APPROVED' : 'PENDING', resultado: outcome.resultado })
  } catch (error: any) {
    const httpError = error instanceof HttpError ? error : new HttpError(500, 'INTERNAL_ERROR', 'An error occurred')
    if (httpError.status >= 500) console.error('[company-review-ai]', httpError.code, error?.message)
    return json(httpError.status, { success: false, error: httpError.message, code: httpError.code })
  }
})

// ---------------------------------------------------------------------------

async function reviewAndDecide(
  supabase: any,
  company: CompanyForReview & { status: string; idioma: string | null },
): Promise<{ resultado: 'ok' | 'dudosa' | 'error'; approved: boolean }> {
  let resultado: 'ok' | 'dudosa' | 'error' = 'error'
  let motivos: Finding[] = []
  const providerNames = ['reglas', ...PROVIDERS.map((p) => p.name)]
  const modelos = [RULES_MODEL, ...PROVIDERS.map((p) => p.model ?? p.name)]

  // 1. Revisión. Cualquier fallo (carga de datos, proveedor...) = 'error'.
  try {
    const { data: others, error: othersError } = await supabase
      .from('companies')
      .select('id, company_name, tax_id, country_code, company_email, website_url, status')
      .neq('id', company.id)
      .limit(MAX_OTHERS)
    if (othersError) throw new Error(`others: ${othersError.message}`)
    // Sin la lista completa no se puede afirmar que no hay duplicados.
    if ((others ?? []).length >= MAX_OTHERS) throw new Error('others: demasiadas empresas para buscar duplicados')

    const { data: countries, error: countriesError } = await supabase.from('countries').select('code').eq('active', true)
    if (countriesError) throw new Error(`countries: ${countriesError.message}`)
    const active = new Set<string>((countries ?? []).map((c: any) => String(c.code).toUpperCase()))

    const result = reviewCompany(company, (others ?? []) as OtherCompany[], active)
    motivos = result.motivos
    resultado = result.resultado

    for (const provider of PROVIDERS) {
      const extra = await provider.review(company, (others ?? []) as OtherCompany[])
      motivos = [...motivos, ...extra]
      if (extra.some((m) => m.severity === 'warn')) resultado = 'dudosa'
    }
  } catch (e: any) {
    console.error('[company-review-ai] fallo en la revisión:', e?.message)
    resultado = 'error'
    motivos = [errorFinding('revisión')]
  }

  // 2. Dejar constancia. Sin registro no se aprueba nada.
  let reviewId: string | null = null
  try {
    const { data, error } = await supabase
      .from('company_ai_reviews')
      .insert({
        company_id: company.id,
        resultado,
        motivos,
        proveedor: providerNames.join('+'),
        modelo: modelos.join('+'),
      })
      .select('id')
      .single()
    if (error) throw error
    reviewId = data.id
  } catch (e: any) {
    console.error('[company-review-ai] no se pudo guardar la revisión:', e?.message)
    resultado = 'error'
    motivos = [...motivos, errorFinding('guardado')]
  }

  // 3. Aprobar SOLO si salió 'ok' y quedó registrada.
  // UPDATE condicionado a status='PENDING': si entre la lectura y ahora un admin la
  // rechazó (o ya la aprobó), no se toca nada. service_role pasa el trigger de
  // protección de companies (20261007). Se rellenan los mismos campos que
  // approve_company, con verified_by NULL (= automática).
  let approved = false
  let statusChanged = false
  if (resultado === 'ok' && reviewId) {
    try {
      const { data: updated, error } = await supabase
        .from('companies')
        .update({
          status: 'APPROVED',
          verified_at: new Date().toISOString(),
          verified_by: null,
          admin_notes: 'Verificada automáticamente (reglas): sin incidencias.',
        })
        .eq('id', company.id)
        .eq('status', 'PENDING')
        .select('id')
      if (error) throw error
      if (Array.isArray(updated) && updated.length === 1) {
        approved = true
      } else {
        // Ya no estaba PENDING: otra persona decidió antes. No se pisa ni se avisa.
        statusChanged = true
        console.warn('[company-review-ai] la empresa ya no estaba PENDING; no se aprueba')
      }
    } catch (e: any) {
      console.error('[company-review-ai] la aprobación falló:', e?.message)
      resultado = 'error'
      motivos = [errorFinding('aprobación')]
      try {
        await supabase.from('company_ai_reviews').insert({
          company_id: company.id,
          resultado: 'error',
          motivos,
          proveedor: providerNames.join('+'),
          modelo: modelos.join('+'),
        })
      } catch {
        // sin más: la empresa sigue PENDING
      }
    }
  }

  // 4. Avisos en la cola (NO se envía nada aquí). Si otra persona ya decidió, no se avisa.
  if (statusChanged) return { resultado, approved: false }
  if (approved) {
    await enqueue(supabase, {
      kind: 'company_verified',
      to_email: company.company_email,
      lang: company.idioma === 'en' ? 'en' : 'es',
      priority: 5,
      payload: {
        dedupe_key: `company_verified:${company.id}`,
        company_id: company.id,
        company_name: company.company_name,
      },
    })
  } else {
    await enqueue(supabase, {
      kind: 'company_review_flagged',
      to_email: SUPPORT_EMAIL,
      lang: 'es',
      priority: 3,
      payload: {
        dedupe_key: `company_review:${company.id}:${resultado}`,
        company_id: company.id,
        review_id: reviewId,
        resultado,
        company_name: company.company_name,
        legal_name: company.legal_name,
        tax_id: company.tax_id,
        country_code: company.country_code,
        company_email: company.company_email,
        website_url: company.website_url,
        motivos: motivos.filter((m) => m.severity === 'warn').map((m) => m.message_es),
      },
    })
  }

  return { resultado, approved }
}

async function enqueue(
  supabase: any,
  row: { kind: string; to_email: string | null; lang: string; priority: number; payload: Record<string, unknown> },
): Promise<void> {
  if (!row.to_email) return
  try {
    const { error } = await supabase.from('email_outbox').insert(row)
    // 23505 = ya encolado con esa dedupe_key: correcto.
    if (error && error.code !== '23505') console.error('[company-review-ai] email_outbox:', error.code, error.message)
  } catch (e: any) {
    console.error('[company-review-ai] email_outbox:', e?.message)
  }
}
