// Supabase Edge Function: send-email-confirmation
// "Reenviar correo de confirmación": vuelve a mandar, por Brevo
// (_shared/email.ts), el enlace de confirmación de una cuenta pendiente.
//
// Contrato (la UI lo traduce en utils/authFunctionErrors.ts):
//   200                    siempre que el email sea válido, exista o no una cuenta
//                          pendiente (anti-enumeración): solo se envía si la
//                          cuenta existe y no está confirmada
//   400 INVALID_INPUT      cuerpo inválido o email mal formado
//   429 RATE_LIMITED       demasiadas peticiones desde la IP o hacia el mismo email
//   502 EMAIL_SEND_FAILED  Brevo no envió el correo
//   500 INTERNAL_ERROR     cualquier otro fallo
//
// Antes recibía `userId` en el cuerpo y no tenía límite: cualquiera podía
// disparar correos hacia cualquier cuenta. Ahora solo cuenta el email y el
// `userId` se ignora.
//
// Rate limit (Upstash, fail open si no está configurado):
//   - por IP: 5/min (config 'auth')
//   - por email (hash SHA-256): 3 cada 15 min (config 'authEmail'), cubo
//     compartido con `signup`. Se aplica exista o no la cuenta.
//
// Enlace del correo: <origen permitido>/confirm?token_hash=…&type=signup (dominio
// propio, sin supabase.co); ConfirmPage lo verifica con verifyOtp. Ver
// _shared/authLink.ts. redirectTo: solo un origen de la lista de CORS con path
// /confirm (resolveAuthRedirect en _shared/cors.ts); si no, el origen permitido de
// la petición o https://www.yourcvpassport.com.

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
const GENERIC_SUCCESS_MESSAGE = 'If there is a pending account with this email, a new confirmation link has been sent.'

interface EmailConfirmationRequest {
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

  // Respuesta neutra: no revela si la cuenta existe ni si está confirmada.
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
      const limited = await enforceRateLimit('auth', [`confirm:ip:${ip}`], corsHeaders)
      if (limited) return limited
    }

    let payload: EmailConfirmationRequest
    try {
      payload = await req.json()
    } catch {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body')
    }

    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    const redirectTo = resolveAuthRedirect(req, payload?.redirectTo, '/confirm')

    if (!email) {
      throw new HttpError(400, 'INVALID_INPUT', 'Email is required')
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid email')
    }

    // Rate limit por destinatario (mismo cubo que signup).
    const emailLimited = await enforceRateLimit('authEmail', [`confirm:email:${await sha256Hex(email)}`], corsHeaders)
    if (emailLimited) return emailLimited

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Solo hay enlace si la cuenta existe y está pendiente; si no existe o ya
    // está confirmada, la misma respuesta neutra y ningún correo.
    const pending = await generatePendingConfirmationLink(supabase, email, redirectTo)
    if (pending.kind === 'confirmed' || pending.kind === 'no-account') return genericSuccess()
    if (pending.kind === 'rate-limited') throw new HttpError(429, 'RATE_LIMITED', 'Too many requests')
    if (pending.kind === 'error') {
      console.error('[send-email-confirmation] generateLink failed:', pending.message)
      throw new HttpError(500, 'INTERNAL_ERROR', 'Could not generate confirmation link')
    }

    // Enlace con el dominio propio, no el action_link de <proyecto>.supabase.co.
    const confirmationLink = buildAuthEmailLink(redirectTo, pending.properties, 'signup')
    if (!confirmationLink) {
      console.error('[send-email-confirmation] generateLink returned no usable link')
      throw new HttpError(500, 'INTERNAL_ERROR', 'Could not generate confirmation link')
    }

    // Nombre del perfil para personalizar (usuario del enlace, no del cuerpo).
    const { data: profile } = pending.userId
      ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', pending.userId)
        .maybeSingle()
      : { data: null }

    const emailResult = await sendEmail({
      to: email,
      ...confirmSignupEmail({ name: profile?.full_name, link: confirmationLink }),
      tags: ['email-confirmation'],
    })

    if (!emailResult.ok) {
      // El detalle no lleva secretos ni destinatario.
      console.error('[send-email-confirmation] email send failed:', emailResult.code, emailResult.status, emailResult.detail)
      throw new HttpError(502, 'EMAIL_SEND_FAILED', 'Could not send confirmation email')
    }

    return genericSuccess()

  } catch (error: any) {
    const httpError = error instanceof HttpError
      ? error
      : new HttpError(500, 'INTERNAL_ERROR', error?.message || 'An error occurred')
    if (httpError.status >= 500) console.error('[send-email-confirmation]', httpError.code, error?.message)

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
