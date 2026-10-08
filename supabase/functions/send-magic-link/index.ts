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
//   - Enlace del correo: <redirectTo>?token_hash=…&type=magiclink (dominio propio,
//     sin supabase.co); CallbackPage lo verifica con verifyOtp. Ver
//     _shared/authLink.ts.
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
import { buildAuthEmailLink } from '../_shared/authLink.ts'
import { magicLinkEmail } from '../_shared/emailTemplates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GENERIC_SUCCESS_MESSAGE = 'If the email is valid, you will receive an access link.'

interface MagicLinkRequest {
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
    // la app que recoge la sesión (App.tsx).
    const redirectTo = resolveAuthRedirect(req, payload?.redirectTo, '/callback')

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

    // Enlace con el dominio propio (/callback?token_hash=…&type=magiclink), no el
    // action_link de <proyecto>.supabase.co (ver _shared/authLink.ts). Para una
    // cuenta nueva GoTrue puede devolver verification_type 'signup': CallbackPage
    // acepta cualquier tipo de verifyOtp.
    const magicLink = buildAuthEmailLink(redirectTo, magicLinkData?.properties, 'magiclink')
    if (!magicLink) {
      console.error('[send-magic-link] generateLink returned no usable link')
      throw new HttpError(500, 'INTERNAL_ERROR', 'Could not generate access link')
    }
    const linkUserId: string | undefined = magicLinkData.user?.id

    // Get user profile for personalization (if user exists)
    const { data: profile } = linkUserId
      ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', linkUserId)
        .maybeSingle()
      : { data: null }

    // Envío vía Brevo (_shared/email.ts)
    const emailResult = await sendEmail({
      to: email,
      ...magicLinkEmail({ name: profile?.full_name, link: magicLink }),
      tags: ['magic-link'],
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
