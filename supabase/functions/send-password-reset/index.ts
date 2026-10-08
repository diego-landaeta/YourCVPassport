// Supabase Edge Function: send-password-reset
// Sends password reset email via Brevo (_shared/email.ts)
//
// Contrato de errores (la UI los traduce en utils/authFunctionErrors.ts):
//   200                    siempre que el email sea válido, exista o no la cuenta (anti-enumeración)
//   400 INVALID_INPUT      cuerpo inválido o email mal formado
//   429 RATE_LIMITED       demasiadas peticiones desde la IP o hacia el mismo email
//                          (Upstash), o GoTrue limita la petición
//   502 EMAIL_SEND_FAILED  Brevo no envió el correo
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
//
// Enlace del correo: <redirectTo>?token_hash=…&type=recovery (dominio propio, sin
// supabase.co); RecoveryPage lo verifica con verifyOtp. Ver _shared/authLink.ts.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders, resolveAuthRedirect } from '../_shared/cors.ts'
import { enforceRateLimit, getClientIp, sha256Hex } from '../_shared/ratelimit.ts'
import { sendEmail } from '../_shared/email.ts'
import { buildAuthEmailLink } from '../_shared/authLink.ts'
import { passwordResetEmail } from '../_shared/emailTemplates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GENERIC_SUCCESS_MESSAGE = 'If an account exists with this email, you will receive a password reset link.'

interface PasswordResetRequest {
  email: string
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

    // Enlace con el dominio propio (/recovery?token_hash=…&type=recovery), no el
    // action_link de <proyecto>.supabase.co (ver _shared/authLink.ts).
    const resetLink = buildAuthEmailLink(redirectTo, resetData?.properties, 'recovery')
    if (!resetLink) {
      console.error('[send-password-reset] generateLink returned no usable link')
      throw new HttpError(500, 'INTERNAL_ERROR', 'Could not generate reset link')
    }
    const userId: string | undefined = resetData.user?.id

    // Get user profile for personalization
    const { data: profile } = userId
      ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle()
      : { data: null }

    // Envío por Brevo (_shared/email.ts, timeout de 10 s: un envío colgado
    // también es EMAIL_SEND_FAILED).
    const emailResult = await sendEmail({
      to: email,
      ...passwordResetEmail({ name: profile?.full_name, link: resetLink }),
      tags: ['password-reset'],
    })

    if (!emailResult.ok) {
      // Sin BREVO_API_KEY, timeout, o Brevo rechaza el envío (key mala, dominio
      // sin autenticar...). El detalle no lleva secretos ni destinatario.
      console.error('[send-password-reset] email send failed:', emailResult.code, emailResult.status, emailResult.detail)
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
