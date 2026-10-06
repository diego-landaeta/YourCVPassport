// Supabase Edge Function: send-verification-sms
// Sends phone verification code using Twilio
//
// Seguridad (auditoría 2026-10-05, U4): ver _shared/stampVerification.ts.
//   Antes cualquiera, sin sesión, podía mandar SMS de Twilio (a nuestra costa) a
//   cualquier número y crear sellos en perfiles ajenos. Ahora:
//   - JWT obligatorio (desplegar SIN --no-verify-jwt); `userId` del body solo si
//     es el propio perfil, uno gestionado por el llamante o si es admin.
//   - Código con crypto.getRandomValues; en stamps.evidence solo su HMAC.
//   - El sello se crea ANTES de enviar el SMS: si la BD lo rechaza no sale nada.
//     Nota: 20260107_remove_phone_final.sql quitó PHONE del enum stamp_type, así
//     que hoy el insert falla y la función responde 500 sin mandar SMS. La UI
//     solo ofrece el sello EMAIL.
//
// Contrato:
//   POST { phone, userId? }  ->  200 { success, message, stampId, messageSid }
//   400 INVALID_INPUT / INVALID_PHONE_FORMAT, 401 UNAUTHORIZED, 403 FORBIDDEN,
//   429 RATE_LIMITED (Upstash) / RATE_LIMIT_EXCEEDED (3 por hora y perfil),
//   500 INTERNAL_ERROR (sin detalles internos).
//
// Rate limit (Upstash, fail open si no está configurado): por IP 5/min; por
// usuario llamante y por número destino (hash) 3 cada 15 min; en BD 3/hora.

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

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!

const CODE_TTL_MS = 10 * 60 * 1000
// E.164 (+ y 2-15 dígitos) tras quitar espacios, guiones, puntos y paréntesis:
// el modal manda "+34 600 123 456".
const PHONE_RE = /^\+[1-9]\d{1,14}$/

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
      const limited = await enforceRateLimit('auth', [`stamp-sms:ip:${ip}`], corsHeaders)
      if (limited) return limited
    }

    const payload = await readJsonBody(req)
    if (typeof payload.phone !== 'string' || !payload.phone.trim()) {
      throw new HttpError(400, 'INVALID_INPUT', 'Phone is required')
    }
    const phone = payload.phone.replace(/[\s().-]/g, '')
    if (!PHONE_RE.test(phone)) {
      throw new HttpError(400, 'INVALID_PHONE_FORMAT', 'Invalid phone format. Please use E.164 format (e.g., +1234567890)')
    }

    // Perfil destino: el propio, uno gestionado o (admin) cualquiera
    const userId = await resolveTargetProfile(supabase, caller.id, payload.userId)

    const limited = await enforceRateLimit('authEmail', [
      `stamp-sms:user:${caller.id}`,
      `stamp-sms:dest:${await sha256Hex(phone)}`,
    ], corsHeaders)
    if (limited) return limited

    // Check rate limiting - max 3 attempts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAttempts, error: countError } = await supabase
      .from('verification_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('verification_type', 'PHONE')
      .gte('created_at', oneHourAgo)

    if (countError) throw countError

    if (recentAttempts && recentAttempts.length >= 3) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please wait before requesting another code.')
    }

    // Check for required environment variables
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Server configuration error: Missing SMS provider keys')
    }

    // Código de 6 dígitos con CSPRNG; en BD solo se guarda su HMAC
    const verificationCode = generateCode()
    const evidence = {
      phone,
      code_hash: await hashCode('PHONE', userId, phone, verificationCode),
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      attempts: 0,
    }

    // Reutiliza el sello PENDING más reciente o crea uno
    const existingStamp = await findPendingStamp(supabase, userId, 'PHONE')

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
          type: 'PHONE',
          status: 'PENDING',
          evidence,
          provider: 'twilio'
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
        verification_type: 'PHONE',
        stamp_id: stampId,
        metadata: { phone }
      })

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const formData = new URLSearchParams()
    formData.append('To', phone)
    formData.append('From', TWILIO_PHONE_NUMBER)
    formData.append('Body', `Tu código de verificación de YourCVPassport es: ${verificationCode}\n\nEste código expira en 10 minutos.`)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
      },
      body: formData.toString()
    })

    if (!twilioResponse.ok) {
      const error = await twilioResponse.json()
      
      throw new Error(`Twilio error: ${JSON.stringify(error)}`)
    }

    const twilioData = await twilioResponse.json()

    return jsonResponse(200, {
      success: true,
      message: 'Verification code sent successfully',
      stampId,
      messageSid: twilioData.sid
    }, corsHeaders)

  } catch (error) {
    return errorResponse(error, corsHeaders, 'send-verification-sms')
  }
})
