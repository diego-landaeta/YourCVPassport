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
//   - Los datos de la empresa (nombre, email, CIF, motivo) se escapan antes de
//     entrar en el HTML.
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Copia de la empresa con los textos escapados (los usa la plantilla HTML).
function escapeCompany(row: Record<string, unknown>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(row)) out[k] = typeof v === 'string' ? escapeHtml(v) : v
  return out
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

    const company = escapeCompany(rawCompany)

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

    // Prepare email content based on type
    let emailSubject: string
    let emailHtml: string

    if (type === 'approved') {
      emailSubject = `Welcome to YourCVPassport - Company Approved! 🎉`
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Company Approved</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1 style="margin: 0; font-size: 28px;">Company Approved!</h1>
              </div>

              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome to YourCVPassport, ${company.company_name}!</h2>

                <p>Great news! Your company registration has been approved by our team. You can now access the full company panel and start finding top talent.</p>

                <div class="info-box">
                  <strong>Company Details:</strong><br>
                  <strong>Name:</strong> ${company.company_name}<br>
                  <strong>Email:</strong> ${company.company_email}<br>
                  <strong>Tax ID:</strong> ${company.tax_id}
                </div>

                <h3 style="color: #1f2937;">What's Next?</h3>
                <ul style="line-height: 1.8;">
                  <li><strong>Purchase Credits:</strong> Buy credit packages to unlock candidate profiles</li>
                  <li><strong>Search Talent:</strong> Use advanced filters to find the perfect candidates</li>
                  <li><strong>Contact Candidates:</strong> Reach out directly to professionals</li>
                  <li><strong>Save Searches:</strong> Create saved searches with automated alerts</li>
                </ul>

                <div style="text-align: center;">
                  <a href="${APP_URL}/company/dashboard" class="button">Go to Company Dashboard</a>
                </div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  <strong>Need help getting started?</strong><br>
                  Contact our support team at <a href="mailto:support@yourcvpassport.com" style="color: #3b82f6;">support@yourcvpassport.com</a>
                </p>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} YourCVPassport. All rights reserved.</p>
                <p>
                  <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">Visit Website</a> |
                  <a href="${APP_URL}/help" style="color: #3b82f6; text-decoration: none;">Help Center</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    } else {
      // Rejected
      emailSubject = 'Company Registration Update - YourCVPassport'
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Update</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
              .icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">⚠️</div>
                <h1 style="margin: 0; font-size: 28px;">Registration Status Update</h1>
              </div>

              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Dear ${company.company_name},</h2>

                <p>Thank you for your interest in YourCVPassport. We've reviewed your company registration and unfortunately we're unable to approve it at this time.</p>

                <div class="warning-box">
                  <strong>Reason for rejection:</strong><br>
                  ${company.rejection_reason || 'Please contact support for more details.'}
                </div>

                <h3 style="color: #1f2937;">What can you do?</h3>
                <ul style="line-height: 1.8;">
                  <li>Review the rejection reason above</li>
                  <li>Gather any additional documentation or information</li>
                  <li>Contact our support team for clarification</li>
                  <li>Submit a new application with updated information</li>
                </ul>

                <div style="text-align: center;">
                  <a href="mailto:support@yourcvpassport.com" class="button">Contact Support</a>
                </div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  We're here to help! If you believe this is an error or need assistance, please don't hesitate to reach out to our team.
                </p>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} YourCVPassport. All rights reserved.</p>
                <p>
                  <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">Visit Website</a> |
                  <a href="mailto:support@yourcvpassport.com" style="color: #3b82f6; text-decoration: none;">support@yourcvpassport.com</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    }

    // Envío vía Brevo (_shared/email.ts)
    const emailResult = await sendEmail({
      to: userEmail,
      subject: emailSubject,
      html: emailHtml,
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
