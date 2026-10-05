// Supabase Edge Function: verify-email-code
// Verifies email verification code
//
// Seguridad (auditoría 2026-10-05, U4): ver _shared/stampVerification.ts.
//   - JWT obligatorio (desplegar SIN --no-verify-jwt). `userId` del body solo si
//     es el propio perfil, uno gestionado por el llamante o si es admin.
//   - Se compara el HMAC del código en tiempo constante; máximo 5 intentos por
//     código (gastados de forma atómica) y caducidad de 15 minutos.
//   - Rate limit (Upstash, fail open): 5/min por usuario llamante y por IP.
//
// Contrato:
//   POST { code, userId? } -> 200 { success, message, stampId }
//   400 INVALID_INPUT / CODE_EXPIRED / TOO_MANY_ATTEMPTS / INVALID_CODE
//   (+ attemptsRemaining), 401 UNAUTHORIZED, 403 FORBIDDEN,
//   404 NO_PENDING_VERIFICATION, 409 CONCURRENT_ATTEMPT, 429 RATE_LIMITED,
//   500 INTERNAL_ERROR.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors.ts'
import { enforceRateLimit, getClientIp } from '../_shared/ratelimit.ts'
import {
  CODE_RE,
  HttpError,
  authenticate,
  createAdminClient,
  errorResponse,
  jsonResponse,
  readJsonBody,
  resolveTargetProfile,
  verifyStampCode,
} from '../_shared/stampVerification.ts'

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
    const limited = await enforceRateLimit('auth', [
      `stamp-verify:user:${caller.id}`,
      ...(ip ? [`stamp-verify:ip:${ip}`] : []),
    ], corsHeaders)
    if (limited) return limited

    const payload = await readJsonBody(req)
    const code = typeof payload.code === 'string' ? payload.code.trim() : ''
    if (!CODE_RE.test(code)) {
      throw new HttpError(400, 'INVALID_INPUT', 'A 6-digit code is required')
    }

    const userId = await resolveTargetProfile(supabase, caller.id, payload.userId)

    const stamp = await verifyStampCode(supabase, userId, 'EMAIL', code)

    // Update profile verified_credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('verified_credentials')
      .eq('id', userId)
      .maybeSingle()

    const verifiedCredentials: string[] = Array.isArray(profile?.verified_credentials) ? profile.verified_credentials : []
    if (!verifiedCredentials.includes('email')) {
      await supabase
        .from('profiles')
        .update({
          verified_credentials: [...verifiedCredentials, 'email']
        })
        .eq('id', userId)
    }

    return jsonResponse(200, {
      success: true,
      message: 'Email verified successfully',
      stampId: stamp.id
    }, corsHeaders)

  } catch (error) {
    return errorResponse(error, corsHeaders, 'verify-email-code')
  }
})
