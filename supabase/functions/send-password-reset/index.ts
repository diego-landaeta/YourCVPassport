// Supabase Edge Function: send-password-reset
// Sends password reset email using Resend
//
// Contrato de errores (la UI los traduce en utils/authFunctionErrors.ts):
//   200                    siempre que el email sea válido, exista o no la cuenta (anti-enumeración)
//   400 INVALID_INPUT      cuerpo inválido o email mal formado
//   429 RATE_LIMITED       demasiadas peticiones desde la IP o hacia el mismo email
//                          (Upstash), o GoTrue limita la petición
//   502 EMAIL_SEND_FAILED  Resend no envió el correo
//   500 INTERNAL_ERROR     cualquier otro fallo
//
// Rate limit (Upstash, fail open si no está configurado):
//   - por IP: 5/min (config 'auth')
//   - por email normalizado (hash SHA-256, nunca en claro): 3 cada 15 min
//     (config 'authEmail'). Se aplica exista o no la cuenta, así que el 429 no
//     revela nada.
//
// redirectTo: solo se acepta un origen de la lista de CORS con path /recovery
// (ver resolveAuthRedirect en _shared/cors.ts); si no, se usa el origen
// permitido de la petición o https://www.yourcvpassport.com.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders, resolveAuthRedirect } from '../_shared/cors.ts'
import { enforceRateLimit, getClientIp, sha256Hex } from '../_shared/ratelimit.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const RESEND_TIMEOUT_MS = 10000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GENERIC_SUCCESS_MESSAGE = 'If an account exists with this email, you will receive a password reset link.'

interface PasswordResetRequest {
  email: string
  redirectTo?: string
}

// full_name lo controla el usuario y va dentro del HTML del correo.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Error con status HTTP y código estable para el cliente.
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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Respuesta neutra: no revela si la cuenta existe.
  const genericSuccess = () => new Response(
    JSON.stringify({ success: true, message: GENERIC_SUCCESS_MESSAGE }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'INVALID_INPUT', 'Method not allowed')
    }

    // Rate limit por IP antes de leer el cuerpo. Sin IP conocida no se limita
    // por IP (un cubo 'unknown' compartido bloquearía a todos); queda el de email.
    const ip = getClientIp(req)
    if (ip) {
      const limited = await enforceRateLimit('auth', [`reset:ip:${ip}`], corsHeaders)
      if (limited) return limited
    }

    // Get request body
    let payload: PasswordResetRequest
    try {
      payload = await req.json()
    } catch {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body')
    }

    // Normalizado a minúsculas: antes `u.email === email` fallaba con mayúsculas.
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    const redirectTo = resolveAuthRedirect(req, payload?.redirectTo, '/recovery')

    if (!email) {
      throw new HttpError(400, 'INVALID_INPUT', 'Email is required')
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid email')
    }

    // Rate limit por destinatario: evita bombardear un buzón cambiando de IP.
    const emailLimited = await enforceRateLimit('authEmail', [`reset:email:${await sha256Hex(email)}`], corsHeaders)
    if (emailLimited) return emailLimited

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // generateLink busca el usuario directamente (sin listUsers(), que sólo traía
    // la primera página de 50). Si no existe, GoTrue responde 404 / user_not_found
    // y devolvemos la misma respuesta neutra.
    // Supabase Auth ya aplica su propio rate limit.
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: { redirectTo }
    })

    if (resetError) {
      const code: string = (resetError as any).code || ''
      const status: number = (resetError as any).status || 0
      if (code === 'user_not_found' || status === 404 || /not found/i.test(resetError.message || '')) {
        return genericSuccess()
      }
      if (status === 429 || /rate limit/i.test(resetError.message || '')) {
        throw new HttpError(429, 'RATE_LIMITED', 'Too many requests')
      }
      console.error('[send-password-reset] generateLink failed:', status, code, resetError.message)
      throw new HttpError(500, 'INTERNAL_ERROR', 'Could not generate reset link')
    }

    const resetLink = resetData.properties.action_link
    const userId: string | undefined = resetData.user?.id

    // Get user profile for personalization
    const { data: profile } = userId
      ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle()
      : { data: null }

    const userName = escapeHtml(profile?.full_name || email.split('@')[0])

    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'onboarding@resend.dev'

    // Send email via Resend (con timeout: un fetch colgado también es EMAIL_SEND_FAILED)
    let resendResponse: Response
    try {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: `YourCVPassport <${senderEmail}>`,
          to: email,
          subject: 'Recupera tu contraseña - YourCVPassport',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperación de Contraseña</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">YourCVPassport</h1>
                </div>
  
                <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                  <h2 style="color: #1f2937; margin-top: 0;">¡Hola ${userName}!</h2>
  
                  <p style="font-size: 16px; color: #4b5563;">
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en YourCVPassport.
                  </p>
  
                  <p style="font-size: 16px; color: #4b5563;">
                    Haz clic en el botón de abajo para crear una nueva contraseña:
                  </p>
  
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Restablecer Contraseña
                    </a>
                  </div>
  
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      ⏰ <strong>Este enlace expira en 1 hora</strong>
                    </p>
                  </div>
  
                  <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña no será cambiada.
                  </p>
  
                  <div style="background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #3730a3; font-size: 13px;">
                      🔒 <strong>Consejo de seguridad:</strong> Nunca compartas este enlace con nadie. Nuestro equipo nunca te pedirá tu contraseña.
                    </p>
                  </div>
  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
                  <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                    © 2025 YourCVPassport. Todos los derechos reservados.<br>
                    Este es un email automático, por favor no respondas a este mensaje.
                  </p>
                </div>
              </body>
            </html>
          `
        })
      })
    } catch (fetchError: any) {
      // Timeout o fallo de red hacia Resend
      console.error('[send-password-reset] Resend fetch failed:', fetchError?.name, fetchError?.message)
      throw new HttpError(502, 'EMAIL_SEND_FAILED', 'Could not send password reset email')
    }

    if (!resendResponse.ok) {
      const error = await resendResponse.json().catch(() => ({}))
      // Típico: 403 "domain is not verified" si falta el DNS de Resend.
      console.error('[send-password-reset] Resend error:', resendResponse.status, JSON.stringify(error))
      throw new HttpError(502, 'EMAIL_SEND_FAILED', 'Could not send password reset email')
    }

    // Misma respuesta que cuando la cuenta no existe (no revela si existe).
    return genericSuccess()

  } catch (error: any) {
    const httpError = error instanceof HttpError
      ? error
      : new HttpError(500, 'INTERNAL_ERROR', error?.message || 'An error occurred')
    if (httpError.status >= 500) console.error('[send-password-reset]', httpError.code, error?.message)

    return new Response(
      JSON.stringify({
        error: httpError.message,
        code: httpError.code
      }),
      {
        status: httpError.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
