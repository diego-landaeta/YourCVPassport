// Supabase Edge Function: company-registration-email
//
// Seguridad (auditoría 2026-10-05, U4). Antes: sin autenticación, CORS '*' y
// companyId del body -> cualquiera podía mandar correos de "empresa aprobada /
// rechazada" a cualquier empresa. Ahora:
//   - JWT obligatorio (desplegar SIN --no-verify-jwt) y el llamante tiene que ser
//     admin (profiles.role, comprobado en servidor con service role; mismo
//     criterio que current_user_is_admin). Única llamada legítima:
//     components/admin/CompanyManagementSection.tsx tras approve_company /
//     reject_company.
//   - companyId UUID, type 'approved' | 'rejected' y la empresa tiene que estar
//     ya en ese estado (APPROVED / REJECTED): no se puede mandar un "aprobada" a
//     una empresa pendiente o rechazada.
//   - Los datos de la empresa (nombre, email, CIF, motivo) se escapan al entrar
//     en el HTML (plantilla base, _shared/emailLayout.ts).
//   - CORS con _shared/cors.ts; errores { success: false, error, code } sin
//     detalles internos.
//
// Contrato: POST { companyId, type } -> 200 { success, message, emailId }
//   400 INVALID_INPUT | 401 UNAUTHORIZED | 403 FORBIDDEN | 404 NOT_FOUND |
//   409 INVALID_STATE | 500 INTERNAL_ERROR

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders } from '../_shared/cors.ts'
import { isEmailConfigured, sendEmail } from '../_shared/email.ts'
import { companyApprovedEmail, companyRejectedEmail } from '../_shared/emailTemplates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://yourcvpassport.com'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EXPECTED_STATUS: Record<string, string> = { approved: 'APPROVED', rejected: 'REJECTED' }

class HttpError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // 1. Llamante: JWT válido y role admin
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
    if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Missing authorization')
    const { data: callerData, error: callerError } = await supabase.auth.getUser(token)
    const callerId: string | undefined = callerData?.user?.id
    if (callerError || !callerId) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired session')

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .maybeSingle()
    if (typeof callerProfile?.role !== 'string' || callerProfile.role.toLowerCase() !== 'admin') {
      throw new HttpError(403, 'FORBIDDEN', 'Admin role required')
    }

    // 2. Entrada
    let payload: any
    try {
      payload = await req.json()
    } catch {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body')
    }
    const companyId = payload?.companyId
    const type = payload?.type
    if (typeof companyId !== 'string' || !UUID_RE.test(companyId)) {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid companyId')
    }
    if (type !== 'approved' && type !== 'rejected') {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid type')
    }

    // Antes de tocar la BD: sin BREVO_API_KEY no se podría mandar el correo.
    if (!isEmailConfigured()) {
      throw new Error('Email provider not configured')
    }

    // Get company details
    const { data: rawCompany, error: companyError } = await supabase
      .from('companies')
      .select('*, company_users!inner(user_id)')
      .eq('id', companyId)
      .maybeSingle()

    if (companyError) throw companyError
    if (!rawCompany) throw new HttpError(404, 'NOT_FOUND', 'Company not found')

    // 3. Solo se notifica el estado que ya tiene la empresa
    if (String(rawCompany.status ?? '').toUpperCase() !== EXPECTED_STATUS[type]) {
      throw new HttpError(409, 'INVALID_STATE', 'Company status does not match the notification type')
    }

    // Get primary contact user email
    const userId = rawCompany.company_users?.[0]?.user_id
    if (!userId) {
      throw new HttpError(404, 'NOT_FOUND', 'No user associated with company')
    }

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user?.email) {
      throw new Error(`Failed to fetch user email: ${userError?.message ?? 'no email'}`)
    }

    const userEmail = user.email

    // Plantillas en _shared/emailTemplates.ts (datos en crudo: la plantilla los escapa).
    const email = type === 'approved'
      ? companyApprovedEmail({
        companyName: rawCompany.company_name,
        companyEmail: rawCompany.company_email,
        taxId: rawCompany.tax_id,
        dashboardUrl: `${APP_URL}/company/dashboard`,
      })
      : companyRejectedEmail({
        companyName: rawCompany.company_name,
        reason: rawCompany.rejection_reason,
      })

    // Envío vía Brevo (_shared/email.ts)
    const emailResult = await sendEmail({
      to: userEmail,
      ...email,
      tags: [type === 'approved' ? 'company-approved' : 'company-rejected'],
    })

    if (!emailResult.ok) {
      console.error('[company-registration-email] email send failed:', emailResult.code, emailResult.status, emailResult.detail)
      throw new HttpError(502, 'EMAIL_SEND_FAILED', 'Could not send email')
    }

    return json(200, {
      success: true,
      message: `${type} email sent successfully`,
      emailId: emailResult.messageId,
    })
  } catch (error: any) {
    if (error instanceof HttpError) {
      return json(error.status, { success: false, error: error.message, code: error.code })
    }
    console.error('[company-registration-email] error interno:', error?.message)
    return json(500, { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})
