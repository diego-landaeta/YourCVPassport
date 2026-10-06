// Supabase Edge Function: signup
// Handles user registration and sends confirmation email via Brevo (_shared/email.ts)
//
// Contrato de errores (la UI los traduce en utils/authFunctionErrors.ts):
//   400 INVALID_INPUT            cuerpo inválido, email mal formado o sin password
//   400 WEAK_PASSWORD            password que no cumple la política
//   409 EMAIL_ALREADY_REGISTERED el email ya tiene cuenta
//   429 RATE_LIMITED             demasiadas altas desde la misma IP (Upstash) o GoTrue limita la petición
//   502 EMAIL_SEND_FAILED        Brevo no envió el correo (se borra el usuario: rollback)
//   500 INTERNAL_ERROR           cualquier otro fallo
//
// Éxito: 200 { success, message }. No se devuelve el objeto `user` de GoTrue
// (metadatos, identidades, fechas): el frontend no lo usa.
//
// redirectTo: solo se acepta un origen de la lista de CORS con path /confirm
// (ver resolveAuthRedirect en _shared/cors.ts); si no, se usa el origen
// permitido de la petición o https://www.yourcvpassport.com.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders, resolveAuthRedirect } from '../_shared/cors.ts'
import { enforceRateLimit, getClientIp } from '../_shared/ratelimit.ts'
import { sendEmail } from '../_shared/email.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SignupRequest {
  email: string
  password: string
  full_name?: string
  redirectTo?: string
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

// El nombre lo escribe quien se registra y va dentro del HTML del correo: sin
// escapar, cualquiera podría registrar el email de un tercero con un "nombre"
// que inyecte enlaces o HTML en un correo enviado desde nuestro dominio.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Misma política que el formulario (AuthScreen.validatePassword).
function isStrongPassword(pwd: string): boolean {
  return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)
}

// Traduce los errores de GoTrue (createUser) a códigos propios.
// GoTrue: code 'email_exists' / "A user with this email address has already been registered".
function mapAuthError(err: any): HttpError {
  const code: string = err?.code || ''
  const msg: string = err?.message || ''
  if (code === 'email_exists' || code === 'user_already_exists' || /already (been )?registered|already exists/i.test(msg)) {
    return new HttpError(409, 'EMAIL_ALREADY_REGISTERED', 'A user with this email address has already been registered')
  }
  if (code === 'weak_password' || (/password/i.test(msg) && /weak|at least|short|characters/i.test(msg))) {
    return new HttpError(400, 'WEAK_PASSWORD', msg || 'Password is too weak')
  }
  if (code === 'email_address_invalid' || code === 'validation_failed' || /invalid.*email|email.*invalid/i.test(msg)) {
    return new HttpError(400, 'INVALID_INPUT', msg || 'Invalid email')
  }
  if (err?.status === 429 || /rate limit/i.test(msg)) {
    return new HttpError(429, 'RATE_LIMITED', msg || 'Too many requests')
  }
  return new HttpError(500, 'INTERNAL_ERROR', msg || 'Auth error')
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'INVALID_INPUT', 'Method not allowed')
    }

    // Rate limit por IP (5/min, config 'auth'). Sin IP conocida no se limita:
    // un cubo compartido 'unknown' bloquearía el alta a todo el mundo.
    const ip = getClientIp(req)
    if (ip) {
      const limited = await enforceRateLimit('auth', [`signup:ip:${ip}`], corsHeaders)
      if (limited) return limited
    }

    let payload: SignupRequest
    try {
      payload = await req.json()
    } catch {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body')
    }

    // El email se normaliza a minúsculas (GoTrue también lo hace al guardar).
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    const password = typeof payload?.password === 'string' ? payload.password : ''
    const full_name = typeof payload?.full_name === 'string' ? payload.full_name.trim().slice(0, 200) : undefined
    const redirectTo = resolveAuthRedirect(req, payload?.redirectTo, '/confirm')

    if (!email || !password) {
      throw new HttpError(400, 'INVALID_INPUT', 'Email and password are required')
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid email')
    }
    if (!isStrongPassword(password)) {
      throw new HttpError(400, 'WEAK_PASSWORD', 'Password must be at least 8 characters and include uppercase, lowercase and a number')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Create user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: { full_name }
    })

    if (createError) throw mapAuthError(createError)

    const user = userData.user

    // Rollback: borra el usuario recién creado si no se puede completar el alta,
    // para que pueda reintentar con el mismo email.
    const rollbackUser = async () => {
      if (!user?.id) return
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteError) console.error('[signup] rollback deleteUser failed:', deleteError.message)
    }

    // Generate confirmation link
    const { data: confirmData, error: confirmError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: { redirectTo }
    })

    if (confirmError) {
      console.error('[signup] generateLink failed:', confirmError.message)
      await rollbackUser()
      throw new HttpError(500, 'INTERNAL_ERROR', 'Could not generate confirmation link')
    }

    const confirmationLink = confirmData.properties.action_link
    const userName = escapeHtml(full_name || email.split('@')[0])

    // Envío por Brevo (_shared/email.ts, timeout de 10 s: un envío colgado
    // también es EMAIL_SEND_FAILED).
    const emailResult = await sendEmail({
      to: email,
      subject: '¡Bienvenido a YourCVPassport! Confirma tu email',
      tags: ['signup'],
      html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirma tu Email</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">YourCVPassport</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Tu CV Profesional Verificado</p>
                </div>
  
                <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                  <h2 style="color: #1f2937; margin-top: 0;">¡Bienvenido ${userName}! 🎉</h2>
  
                  <p style="font-size: 16px; color: #4b5563;">
                    Estamos emocionados de tenerte en YourCVPassport. Estás a un paso de crear tu CV profesional verificado.
                  </p>
  
                  <p style="font-size: 16px; color: #4b5563;">
                    Para comenzar, por favor confirma tu dirección de email haciendo clic en el botón de abajo:
                  </p>
  
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${confirmationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Confirmar Email
                    </a>
                  </div>
  
                  <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                      ✨ <strong>¿Qué puedes hacer con YourCVPassport?</strong>
                    </p>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                      <li>Crear CVs profesionales con plantillas modernas</li>
                      <li>Verificar tus credenciales y experiencia</li>
                      <li>Compartir tu perfil con un enlace único</li>
                      <li>Exportar en PDF y DOCX</li>
                    </ul>
                  </div>
  
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      ⏰ <strong>Este enlace expira en 24 horas</strong>
                    </p>
                  </div>
  
                  <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    Si no creaste una cuenta en YourCVPassport, puedes ignorar este email de forma segura.
                  </p>
  
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
      // Sin BREVO_API_KEY, timeout, o Brevo rechaza el envío (key mala, dominio
      // sin autenticar...). El detalle no lleva secretos ni destinatario.
      console.error('[signup] email send failed:', emailResult.code, emailResult.status, emailResult.detail)

      // Rollback: Delete the user if email sending fails
      await rollbackUser()

      throw new HttpError(502, 'EMAIL_SEND_FAILED', 'Could not send confirmation email')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created and confirmation email sent'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    const httpError = error instanceof HttpError
      ? error
      : new HttpError(500, 'INTERNAL_ERROR', error?.message || 'An error occurred')
    if (httpError.status >= 500) console.error('[signup]', httpError.code, error?.message)

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
