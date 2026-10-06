// Supabase Edge Function: send-magic-link
// Sends magic link for passwordless authentication via Brevo (_shared/email.ts)
//
// Sin autenticación por diseño (es un login). Seguridad (auditoría 2026-10-05, U4):
//   - redirectTo: solo un origen de la lista de CORS con path /callback (ver
//     resolveAuthRedirect en _shared/cors.ts); si no, el origen permitido de la
//     petición o https://www.yourcvpassport.com. Antes se aceptaba cualquier URL
//     y el enlace del correo podía llevar el token a un dominio ajeno.
//   - generateLink directo, sin listUsers() (que solo traía la primera página).
//   - Respuesta neutra: el mismo 200 exista o no la cuenta (anti-enumeración).
//     Nota: con type 'magiclink' GoTrue crea la cuenta (sin confirmar) si el
//     email no existe y el enlace sirve de alta, igual que antes de este cambio.
//   - Nombre del perfil escapado antes de meterlo en el HTML.
//
// Contrato:
//   200 { success, message }   siempre que el email sea válido
//   400 INVALID_INPUT          cuerpo inválido o email mal formado
//   429 RATE_LIMITED           demasiadas peticiones (el mensaje contiene
//                              "rate limit": MagicLinkForm lo usa para el aviso)
//   500 INTERNAL_ERROR         cualquier otro fallo (sin detalles internos)
//
// Rate limit (Upstash, fail open si no está configurado), como send-password-reset:
//   - por IP: 5/min (config 'auth')
//   - por email normalizado (hash SHA-256): 3 cada 15 min (config 'authEmail')

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders, resolveAuthRedirect } from '../_shared/cors.ts'
import { enforceRateLimit, getClientIp, sha256Hex } from '../_shared/ratelimit.ts'
import { sendEmail } from '../_shared/email.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GENERIC_SUCCESS_MESSAGE = 'If the email is valid, you will receive an access link.'

interface MagicLinkRequest {
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

  // 429 de enforceRateLimit con un mensaje que MagicLinkForm reconoce.
  const rateLimit = async (type: 'auth' | 'authEmail', identifiers: string[]): Promise<Response | null> => {
    const limited = await enforceRateLimit(type, identifiers, corsHeaders)
    if (!limited) return null
    return new Response(
      JSON.stringify({ error: 'Too many requests (rate limit). Please try again later.', code: 'RATE_LIMITED' }),
      { status: 429, headers: limited.headers }
    )
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'INVALID_INPUT', 'Method not allowed')
    }

    // Rate limit por IP antes de leer el cuerpo (sin IP conocida solo queda el de email).
    const ip = getClientIp(req)
    if (ip) {
      const limited = await rateLimit('auth', [`magic:ip:${ip}`])
      if (limited) return limited
    }

    let payload: MagicLinkRequest
    try {
      payload = await req.json()
    } catch {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body')
    }

    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    if (!email) {
      throw new HttpError(400, 'INVALID_INPUT', 'Email is required')
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid email')
    }

    // resolveAuthRedirect valida origen + path exacto; '/callback' es la ruta de
    // la app que recoge la sesión (App.tsx). El tipo del helper solo enumera
    // '/confirm' | '/recovery': ampliarlo en _shared/cors.ts quita este cast.
    const redirectTo = resolveAuthRedirect(req, payload?.redirectTo, '/callback' as unknown as '/confirm')

    // Rate limit por destinatario: evita bombardear un buzón cambiando de IP.
    const emailLimited = await rateLimit('authEmail', [`magic:email:${await sha256Hex(email)}`])
    if (emailLimited) return emailLimited

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // generateLink busca el usuario directamente (sin listUsers()).
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo }
    })

    if (magicLinkError) {
      const code: string = (magicLinkError as any).code || ''
      const status: number = (magicLinkError as any).status || 0
      const message: string = magicLinkError.message || ''
      // Cuenta inexistente o altas desactivadas: misma respuesta neutra.
      if (code === 'user_not_found' || code === 'signup_disabled' || status === 404 || /not found|not allowed/i.test(message)) {
        return genericSuccess()
      }
      if (status === 429 || /rate limit/i.test(message)) {
        throw new HttpError(429, 'RATE_LIMITED', 'Too many requests (rate limit). Please try again later.')
      }
      console.error('[send-magic-link] generateLink failed:', status, code, message)
      throw new HttpError(500, 'INTERNAL_ERROR', 'Could not generate access link')
    }

    const magicLink = magicLinkData.properties.action_link
    const linkUserId: string | undefined = magicLinkData.user?.id

    // Get user profile for personalization (if user exists)
    const { data: profile } = linkUserId
      ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', linkUserId)
        .maybeSingle()
      : { data: null }

    const userName = escapeHtml(profile?.full_name || email.split('@')[0])

    // Envío vía Brevo (_shared/email.ts)
    const emailResult = await sendEmail({
        to: email,
        subject: 'Tu enlace de acceso a YourCVPassport',
        tags: ['magic-link'],
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Magic Link - Acceso Rápido</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">YourCVPassport</h1>
              </div>

              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">¡Hola ${userName}! 👋</h2>

                <p style="font-size: 16px; color: #4b5563;">
                  Has solicitado un enlace mágico para acceder a tu cuenta de YourCVPassport sin necesidad de contraseña.
                </p>

                <p style="font-size: 16px; color: #4b5563;">
                  Haz clic en el botón de abajo para iniciar sesión de forma segura:
                </p>

                <div style="text-align: center; margin: 35px 0;">
                  <a href="${magicLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    ✨ Acceder a mi Cuenta
                  </a>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⏰ <strong>Este enlace expira en 1 hora</strong>
                  </p>
                </div>

                <div style="background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #3730a3; font-size: 13px;">
                    🔒 <strong>Consejo de seguridad:</strong> Este enlace es de un solo uso y solo funciona en el dispositivo desde el que lo solicitaste. Nunca lo compartas con nadie.
                  </p>
                </div>

                <div style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Si no solicitaste este enlace, puedes ignorar este email de forma segura. Nadie podrá acceder a tu cuenta sin este enlace.
                </div>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; font-weight: bold;">
                    💡 ¿Prefieres usar contraseña?
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 13px;">
                    Puedes iniciar sesión con tu email y contraseña en cualquier momento desde nuestra página de login.
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

    if (!emailResult.ok) {
      console.error('[send-magic-link] email send failed:', emailResult.code, emailResult.status, emailResult.detail)
      throw new Error(`Email send failed: ${emailResult.code}`)
    }

    // Misma respuesta que cuando la cuenta no existe (no revela nada).
    return genericSuccess()

  } catch (error: any) {
    const httpError = error instanceof HttpError
      ? error
      : new HttpError(500, 'INTERNAL_ERROR', 'An error occurred')
    if (!(error instanceof HttpError)) console.error('[send-magic-link]', error?.message)

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
