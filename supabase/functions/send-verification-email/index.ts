// Supabase Edge Function: send-verification-email
// Sends email verification code via Brevo (_shared/email.ts)
//
// Seguridad (auditoría 2026-10-05, U4): ver _shared/stampVerification.ts.
//   - JWT obligatorio (desplegar SIN --no-verify-jwt). La identidad sale del
//     token; `userId` del body es opcional y solo vale si es el propio perfil, un
//     perfil gestionado por el llamante (managed_by) o si el llamante es admin.
//   - Código con crypto.getRandomValues; en stamps.evidence solo su HMAC.
//
// Contrato:
//   POST { email, userId? }  ->  200 { success, message, stampId, emailId }
//   400 INVALID_INPUT, 401 UNAUTHORIZED, 403 FORBIDDEN, 413 PAYLOAD_TOO_LARGE,
//   429 RATE_LIMITED (Upstash) / RATE_LIMIT_EXCEEDED (3 por hora y perfil),
//   500 INTERNAL_ERROR (sin detalles internos).
//
// Rate limit (Upstash, fail open si no está configurado):
//   - por IP: 5/min (config 'auth')
//   - por usuario llamante y por email destino (hash SHA-256): 3 cada 15 min
//     (config 'authEmail'): nadie puede bombardear un buzón ajeno.
//   - y el de siempre en BD: 3 envíos por hora y perfil (verification_attempts).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors.ts'
import { enforceRateLimit, getClientIp, sha256Hex } from '../_shared/ratelimit.ts'
import {
  HttpError,
  authenticate,
  createAdminClient,
  errorResponse,
  findPendingStamp,
  generateCode,
  hashCode,
  jsonResponse,
  readJsonBody,
  resolveTargetProfile,
} from '../_shared/stampVerification.ts'
import { isEmailConfigured, sendEmail } from '../_shared/email.ts'
import { verificationCodeEmail } from '../_shared/emailTemplates.ts'

const CODE_TTL_MS = 15 * 60 * 1000
// Mismo criterio que el modal (acepta p. ej. o'connor@...). El email solo va en
// `to` y en la BD, nunca dentro del HTML.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
    }

    const supabase = createAdminClient()

    // Identidad: siempre del JWT
    const caller = await authenticate(req, supabase)

    const ip = getClientIp(req)
    if (ip) {
      const limited = await enforceRateLimit('auth', [`stamp-email:ip:${ip}`], corsHeaders)
      if (limited) return limited
    }

    const payload = await readJsonBody(req)
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      throw new HttpError(400, 'INVALID_INPUT', 'A valid email is required')
    }

    // Perfil destino: el propio, uno gestionado o (admin) cualquiera
    const userId = await resolveTargetProfile(supabase, caller.id, payload.userId)

    const limited = await enforceRateLimit('authEmail', [
      `stamp-email:user:${caller.id}`,
      `stamp-email:dest:${await sha256Hex(email)}`,
    ], corsHeaders)
    if (limited) return limited

    // Check rate limiting - max 3 attempts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAttempts, error: countError } = await supabase
      .from('verification_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('verification_type', 'EMAIL')
      .gte('created_at', oneHourAgo)

    if (countError) throw countError

    if (recentAttempts && recentAttempts.length >= 3) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please wait before requesting another code.')
    }

    // Antes de crear el sello: sin BREVO_API_KEY no se podría mandar el código.
    if (!isEmailConfigured()) {
      throw new Error('Server configuration error: Missing email provider key')
    }

    // Código de 6 dígitos con CSPRNG; en BD solo se guarda su HMAC
    const verificationCode = generateCode()
    const evidence = {
      email,
      code_hash: await hashCode('EMAIL', userId, email, verificationCode),
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      attempts: 0,
    }

    // Reutiliza el sello PENDING más reciente o crea uno
    const existingStamp = await findPendingStamp(supabase, userId, 'EMAIL')

    let stampId: string

    if (existingStamp) {
      const { data: updatedStamp, error: updateError } = await supabase
        .from('stamps')
        .update({ evidence })
        .eq('id', existingStamp.id)
        .select('id')
        .single()

      if (updateError) throw updateError
      stampId = updatedStamp.id
    } else {
      const { data: newStamp, error: createError } = await supabase
        .from('stamps')
        .insert({
          profile_id: userId,
          type: 'EMAIL',
          status: 'PENDING',
          evidence,
          provider: 'brevo'
        })
        .select('id')
        .single()

      if (createError) throw createError
      stampId = newStamp.id
    }

    // Log verification attempt
    await supabase
      .from('verification_attempts')
      .insert({
        user_id: userId,
        verification_type: 'EMAIL',
        stamp_id: stampId,
        metadata: { email }
      })

    // Get user profile for personalization (va dentro del HTML: escapado)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()

    // Envío vía Brevo (_shared/email.ts)
    const emailResult = await sendEmail({
      to: email,
      ...verificationCodeEmail({ name: profile?.full_name, code: verificationCode }),
      tags: ['verification-code'],
    })

    if (!emailResult.ok) {
      console.error('[send-verification-email] email send failed:', emailResult.code, emailResult.status, emailResult.detail)
      throw new Error(`Email send failed: ${emailResult.code}`)
    }

    return jsonResponse(200, {
      success: true,
      message: 'Verification code sent successfully',
      stampId,
      emailId: emailResult.messageId
    }, corsHeaders)

  } catch (error) {
    return errorResponse(error, corsHeaders, 'send-verification-email')
  }
})
