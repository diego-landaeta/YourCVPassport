// Supabase Edge Function: signup
// Handles user registration and sends confirmation email via Brevo (_shared/email.ts)
//
// Contrato de errores (la UI los traduce en utils/authFunctionErrors.ts):
//   400 INVALID_INPUT            cuerpo inválido, email mal formado o sin password
//   400 WEAK_PASSWORD            password que no cumple la política
//   409 EMAIL_ALREADY_REGISTERED el email ya tiene una cuenta confirmada
//   429 RATE_LIMITED             demasiadas altas desde la misma IP o hacia el mismo
//                                email (Upstash), o GoTrue limita la petición
//   500 INTERNAL_ERROR           cualquier otro fallo
//
// Éxito: 200 { success, emailSent, alreadyPending }. No se devuelve el objeto
// `user` de GoTrue (metadatos, identidades, fechas): el frontend no lo usa.
//   - emailSent: false → la cuenta está creada y pendiente, pero el correo no
//     salió (Brevo caído, sin key...). Antes se borraba la cuenta y se devolvía
//     502 EMAIL_SEND_FAILED (issue #3); ahora la UI ofrece "Reenviar correo de
//     confirmación" (send-email-confirmation).
//   - alreadyPending: true → el email ya tenía una cuenta sin confirmar: no se
//     crea otra ni se cambia su password, solo se reenvía la confirmación.
//
// Rate limit (Upstash, fail open si no está configurado): 5/min por IP (config
// 'auth') y 3 cada 15 min por email (config 'authEmail', hash SHA-256, cubo
// compartido con send-email-confirmation).
//
// redirectTo: solo se acepta un origen de la lista de CORS con path /confirm
// (ver resolveAuthRedirect en _shared/cors.ts); si no, se usa el origen
// permitido de la petición o https://www.yourcvpassport.com.
//
// Enlace del correo: <redirectTo>?token_hash=…&type=signup (dominio propio, sin
// supabase.co); ConfirmPage lo verifica con verifyOtp. Ver _shared/authLink.ts.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders, resolveAuthRedirect } from '../_shared/cors.ts'
import { enforceRateLimit, getClientIp, sha256Hex } from '../_shared/ratelimit.ts'
import { sendEmail } from '../_shared/email.ts'
import { buildAuthEmailLink } from '../_shared/authLink.ts'
import { generatePendingConfirmationLink } from '../_shared/confirmationEmail.ts'
import { confirmSignupEmail } from '../_shared/emailTemplates.ts'

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

// Respuesta de éxito: cuenta creada (o ya pendiente), con o sin correo enviado.
function created(corsHeaders: Record<string, string>, result: { emailSent: boolean; alreadyPending?: boolean }): Response {
  return new Response(
    JSON.stringify({
      success: true,
      emailSent: result.emailSent,
      alreadyPending: !!result.alreadyPending,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
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

    // Rate limit por destinatario, compartido con send-email-confirmation
    // ("Reenviar"): evita bombardear un buzón ajeno cambiando de IP.
    const emailLimited = await enforceRateLimit('authEmail', [`confirm:email:${await sha256Hex(email)}`], corsHeaders)
    if (emailLimited) return emailLimited

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Create user
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: { full_name }
    })

    let alreadyPending = false
    let properties: any

    if (createError) {
      const mapped = mapAuthError(createError)
      if (mapped.code !== 'EMAIL_ALREADY_REGISTERED') throw mapped

      // El email ya tiene cuenta. Si está pendiente de confirmar (p. ej. el
      // primer correo no llegó), se reenvía la confirmación en vez de un 409.
      // Como GoTrue en un alta repetida, no se cambia la password: no sabemos
      // si quien se registra ahora es el dueño del buzón.
      const pending = await generatePendingConfirmationLink(supabase, email, redirectTo)
      if (pending.kind === 'rate-limited') throw new HttpError(429, 'RATE_LIMITED', 'Too many requests')
      if (pending.kind !== 'link') throw mapped
      alreadyPending = true
      properties = pending.properties
    } else {
      // Generate confirmation link
      const { data: confirmData, error: confirmError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: { redirectTo }
      })
      if (confirmError) {
        // La cuenta queda creada y pendiente: el usuario puede pedir el
        // correo con "Reenviar" (send-email-confirmation).
        console.error('[signup] generateLink failed:', confirmError.message)
        return created(corsHeaders, { emailSent: false })
      }
      properties = confirmData?.properties
    }

    // Enlace con el dominio propio (/confirm?token_hash=…&type=signup), no el
    // action_link de <proyecto>.supabase.co (ver _shared/authLink.ts).
    const confirmationLink = buildAuthEmailLink(redirectTo, properties, 'signup')
    if (!confirmationLink) {
      console.error('[signup] generateLink returned no usable link')
      return created(corsHeaders, { emailSent: false, alreadyPending })
    }

    // En un alta repetida no se usa el nombre que se acaba de escribir: la
    // cuenta es la de antes.
    const emailResult = await sendEmail({
      to: email,
      ...confirmSignupEmail({ name: alreadyPending ? null : full_name, link: confirmationLink }),
      tags: ['signup'],
    })

    if (!emailResult.ok) {
      // Sin BREVO_API_KEY, timeout (10 s), o Brevo rechaza el envío (key mala,
      // dominio sin autenticar...). El detalle no lleva secretos ni destinatario.
      // La cuenta NO se borra (issue #3): queda pendiente y la UI ofrece
      // "Reenviar correo de confirmación".
      console.error('[signup] email send failed:', emailResult.code, emailResult.status, emailResult.detail)
      return created(corsHeaders, { emailSent: false, alreadyPending })
    }

    return created(corsHeaders, { emailSent: true, alreadyPending })

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
