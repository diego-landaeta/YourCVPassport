// Lógica común de los sellos verificados por código:
//   send-verification-email / verify-email-code
//   send-verification-sms   / verify-phone-code
//
// Seguridad (auditoría 2026-10-05, U4). Antes estas funciones no pedían sesión
// y confiaban en el `userId` del body: cualquiera podía crear y verificar sellos
// en perfiles ajenos (p. ej. verificar el email de la víctima apuntando al correo
// del atacante) y mandar SMS de Twilio a cualquier número. Ahora:
//   - JWT obligatorio. La identidad sale de auth.getUser(token), nunca del body.
//   - El perfil destino es el del llamante. Solo se acepta otro `userId` si el
//     llamante es su gestor (profiles.managed_by, mismo criterio que
//     is_managed_profile) o admin (mismo criterio que current_user_is_admin).
//   - Código de 6 dígitos con crypto.getRandomValues (no Math.random).
//   - En `stamps.evidence` se guarda un HMAC del código, nunca el código: el
//     propietario puede leer sus propios sellos (RLS) y con el código en claro
//     podía verificar un email que no es suyo sin abrir el correo.
//   - Caducidad y máximo de intentos por código (ver verify-*-code).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const CODE_RE = /^\d{6}$/
export const MAX_CODE_ATTEMPTS = 5
export const MAX_BODY_BYTES = 8 * 1024

// Error con status HTTP y código estable para el cliente.
export class HttpError extends Error {
  status: number
  code: string
  extra: Record<string, unknown>
  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.extra = extra
  }
}

export function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

// Respuesta de error: { error, code } (+ extra). Los errores no previstos salen
// como 500 INTERNAL_ERROR genérico; el detalle solo va al log.
export function errorResponse(err: unknown, cors: Record<string, string>, tag: string): Response {
  if (err instanceof HttpError) {
    return jsonResponse(err.status, { error: err.message, code: err.code, ...err.extra }, cors)
  }
  console.error(`[${tag}] error interno:`, (err as Error)?.message)
  return jsonResponse(500, { error: 'Internal server error', code: 'INTERNAL_ERROR' }, cors)
}

// Cliente con service role (las tablas se leen saltándose la RLS: el permiso se
// comprueba aquí con resolveTargetProfile).
export function createAdminClient(): any {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export function bearerToken(req: Request): string {
  const header = req.headers.get('authorization') ?? ''
  return header.replace(/^Bearer\s+/i, '').trim()
}

// Usuario del JWT o 401.
export async function authenticate(req: Request, admin: any): Promise<{ id: string }> {
  const token = bearerToken(req)
  if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Missing authorization')
  const { data, error } = await admin.auth.getUser(token)
  const user = data?.user
  if (error || !user?.id) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired session')
  return { id: user.id }
}

// Cuerpo JSON con tamaño máximo; 400/413 si no es un objeto válido.
export async function readJsonBody(req: Request, maxBytes = MAX_BODY_BYTES): Promise<Record<string, unknown>> {
  const raw = await req.text()
  if (new TextEncoder().encode(raw).length > maxBytes) {
    throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request too large')
  }
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid body')
  }
  return body as Record<string, unknown>
}

// ¿El llamante es admin? Mismo criterio que public.current_user_is_admin().
export async function isAdmin(admin: any, userId: string): Promise<boolean> {
  const { data } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
  return typeof data?.role === 'string' && data.role.toLowerCase() === 'admin'
}

// Perfil sobre el que actúa la petición. Sin `requested` (o igual al llamante)
// es el propio. Otro id solo si el llamante lo gestiona o es admin; si no, 403
// (también si el perfil no existe: no se revela qué ids existen).
export async function resolveTargetProfile(admin: any, callerId: string, requested: unknown): Promise<string> {
  if (requested === undefined || requested === null || requested === '' || requested === callerId) {
    return callerId
  }
  if (typeof requested !== 'string' || !UUID_RE.test(requested)) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid userId')
  }
  if (requested.toLowerCase() === callerId.toLowerCase()) return callerId

  const { data: target } = await admin
    .from('profiles')
    .select('id, managed_by')
    .eq('id', requested)
    .maybeSingle()

  if (target && target.managed_by && target.managed_by === callerId) return target.id
  if (target && await isAdmin(admin, callerId)) return target.id
  throw new HttpError(403, 'FORBIDDEN', 'Not allowed to act on this profile')
}

// Código numérico de 6 dígitos sin sesgo (muestreo con rechazo).
export function generateCode(): string {
  const RANGE = 1_000_000
  const LIMIT = Math.floor(0x1_0000_0000 / RANGE) * RANGE
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    if (buf[0] < LIMIT) return String(buf[0] % RANGE).padStart(6, '0')
  }
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// HMAC-SHA256 del código ligado al tipo, al perfil y al destino: un hash de un
// código de 6 dígitos sin clave se rompe probando el millón de valores.
// Clave: secreto opcional VERIFICATION_CODE_SECRET o, si no existe, la service
// role key (nunca sale del servidor). Si se rota, los códigos pendientes
// (15 min como mucho) dejan de valer y hay que pedir otro.
export async function hashCode(kind: 'EMAIL' | 'PHONE', profileId: string, destination: string, code: string): Promise<string> {
  const secret = Deno.env.get('VERIFICATION_CODE_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!secret) throw new Error('VERIFICATION_CODE_SECRET / SUPABASE_SERVICE_ROLE_KEY no configurados')
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${kind}|${profileId}|${destination}|${code}`))
  return toHex(sig)
}

export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const x = enc.encode(a)
  const y = enc.encode(b)
  let diff = x.length ^ y.length
  const n = Math.max(x.length, y.length)
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Sello PENDING más reciente del tipo indicado (puede haber varios si el
// frontend antiguo insertó alguno por su cuenta; antes .single() fallaba).
export async function findPendingStamp(admin: any, profileId: string, type: 'EMAIL' | 'PHONE'): Promise<any | null> {
  const { data, error } = await admin
    .from('stamps')
    .select('id, profile_id, evidence')
    .eq('profile_id', profileId)
    .eq('type', type)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

// ---------------------------------------------------------------------------
// Verificación de un código (verify-email-code / verify-phone-code)
// ---------------------------------------------------------------------------
//
// Respuestas (las que ya entendía StampsVerificationCodeModal):
//   404 NO_PENDING_VERIFICATION, 400 CODE_EXPIRED, 400 TOO_MANY_ATTEMPTS,
//   400 INVALID_CODE (+ attemptsRemaining), 409 CONCURRENT_ATTEMPT.
// Devuelve el sello verificado.
export async function verifyStampCode(
  admin: any,
  profileId: string,
  type: 'EMAIL' | 'PHONE',
  code: string,
): Promise<{ id: string; evidence: Record<string, unknown> }> {
  const field = type === 'EMAIL' ? 'email' : 'phone'
  const stamp = await findPendingStamp(admin, profileId, type)
  if (!stamp) {
    throw new HttpError(404, 'NO_PENDING_VERIFICATION', `No pending ${field} verification found`)
  }

  const evidence = (stamp.evidence ?? {}) as Record<string, any>
  const destination = typeof evidence[field] === 'string' ? evidence[field] : ''

  // Sin hash (sello antiguo con el código en claro o creado desde el navegador)
  // o caducado: hay que pedir otro código.
  const expiresAt = evidence.expires_at ? new Date(evidence.expires_at).getTime() : NaN
  if (typeof evidence.code_hash !== 'string' || !destination || !(expiresAt > Date.now())) {
    await admin.from('stamps').update({ status: 'EXPIRED' }).eq('id', stamp.id).eq('status', 'PENDING')
    throw new HttpError(400, 'CODE_EXPIRED', 'Verification code has expired. Please request a new one.')
  }

  const attempts = Number.isInteger(evidence.attempts) ? evidence.attempts as number : 0
  if (attempts >= MAX_CODE_ATTEMPTS) {
    await admin.from('stamps').update({ status: 'REJECTED' }).eq('id', stamp.id).eq('status', 'PENDING')
    throw new HttpError(400, 'TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Please request a new code.')
  }

  // Se gasta el intento ANTES de comparar y solo si nadie lo ha gastado a la vez
  // (filtro por el valor leído): con peticiones en paralelo no se pueden probar
  // más de MAX_CODE_ATTEMPTS códigos.
  const nextAttempts = attempts + 1
  let consume = admin
    .from('stamps')
    .update({ evidence: { ...evidence, attempts: nextAttempts } })
    .eq('id', stamp.id)
    .eq('status', 'PENDING')
  consume = Number.isInteger(evidence.attempts)
    ? consume.eq('evidence->>attempts', String(attempts))
    : consume.is('evidence->>attempts', null)
  const { data: consumed, error: consumeError } = await consume.select('id')
  if (consumeError) throw consumeError
  if (!consumed || consumed.length === 0) {
    throw new HttpError(409, 'CONCURRENT_ATTEMPT', 'Another verification attempt is in progress. Please try again.')
  }

  const expected = await hashCode(type, stamp.profile_id, destination, code)
  if (!timingSafeEqual(expected, evidence.code_hash)) {
    const remaining = MAX_CODE_ATTEMPTS - nextAttempts
    if (remaining <= 0) {
      await admin.from('stamps').update({ status: 'REJECTED' }).eq('id', stamp.id).eq('status', 'PENDING')
    }
    throw new HttpError(400, 'INVALID_CODE', 'Invalid verification code', { attemptsRemaining: Math.max(0, remaining) })
  }

  const verifiedEvidence = { [field]: destination, verified: true }
  const { data: verified, error: verifyError } = await admin
    .from('stamps')
    .update({ status: 'VERIFIED', verified_at: new Date().toISOString(), evidence: verifiedEvidence })
    .eq('id', stamp.id)
    .eq('status', 'PENDING')
    .select('id')
  if (verifyError) throw verifyError
  if (!verified || verified.length === 0) {
    throw new HttpError(409, 'CONCURRENT_ATTEMPT', 'Another verification attempt is in progress. Please try again.')
  }
  return { id: stamp.id, evidence: verifiedEvidence }
}
