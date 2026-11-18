// Autorización común de las funciones de la bolsa que llama un programador:
// moderate-job-posting, send-outbox y expire-job-postings.
//
// Módulo PURO (sin Deno ni red): las dependencias entran por parámetro y se prueba
// con Node (serviceAuth.test.mjs).
//
// Tres vías, comprobadas en este orden:
//   1. `x-cron-secret`: el trabajo programado de la base (pg_cron + pg_net, migración
//      20261034) lo manda con el secreto de entorno CRON_SECRET. Se compara en tiempo
//      constante. NUNCA se acepta si CRON_SECRET no está definido, está vacío o es
//      demasiado corto (< 16 caracteres): una función sin secreto no se abre.
//   2. Authorization: Bearer <clave service_role> (comparación en tiempo constante).
//   3. Authorization: Bearer <JWT de un usuario> cuyo perfil tiene role = 'admin'.
// Cualquier otra cosa: 401 (sin credenciales válidas) o 403 (usuario sin ser admin).
//
// Con el secreto de cron, el gateway de Supabase NO ve un JWT: las tres funciones se
// despliegan con --no-verify-jwt y esta comprobación es la única barrera (ver
// docs/bolsa-despliegue-funciones.md). Por eso aquí no se afloja nada de las vías 2 y 3.

/** Longitud mínima aceptada para CRON_SECRET (un valor corto se trata como no configurado). */
export const MIN_CRON_SECRET_LENGTH = 16

/** Comparación en tiempo constante (no se corta en la primera diferencia ni por la longitud). */
export function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  const n = Math.max(x.length, y.length)
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

/**
 * ¿La cabecera `x-cron-secret` coincide con CRON_SECRET? Falso si falta cualquiera de los
 * dos, si el secreto de entorno no está definido / está vacío / es corto, o si no coinciden.
 */
export function cronSecretMatches(provided: string | null | undefined, expected: string | null | undefined): boolean {
  const want = String(expected ?? '').trim()
  if (want.length < MIN_CRON_SECRET_LENGTH) return false
  const got = String(provided ?? '').trim()
  if (!got) return false
  return timingSafeEqual(got, want)
}

export type Caller = 'cron' | 'service' | 'admin'

export interface AuthDeps {
  /** SUPABASE_SERVICE_ROLE_KEY */
  serviceKey: string | undefined
  /** CRON_SECRET (puede no estar definido) */
  cronSecret: string | undefined
  /** admin.auth.getUser(token) -> id del usuario, o null si el token no es válido */
  getUserId: (token: string) => Promise<string | null>
  /** profiles.role del usuario; null si no hay perfil o falló la lectura */
  getRole: (userId: string) => Promise<string | null>
}

export interface AuthResult {
  who: Caller | null
  status: 200 | 401 | 403
}

export async function authorizeRequest(req: Request, deps: AuthDeps): Promise<AuthResult> {
  // 1. Programador de la base
  const cronHeader = req.headers.get('x-cron-secret')
  if (cronHeader !== null && cronSecretMatches(cronHeader, deps.cronSecret)) return { who: 'cron', status: 200 }

  // 2. Clave service_role
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return { who: null, status: 401 }
  if (deps.serviceKey && timingSafeEqual(token, deps.serviceKey)) return { who: 'service', status: 200 }

  // 3. Administrador con sesión
  const userId = await deps.getUserId(token)
  if (!userId) return { who: null, status: 401 }
  const role = await deps.getRole(userId)
  if (!role || role.toLowerCase() !== 'admin') return { who: null, status: 403 }
  return { who: 'admin', status: 200 }
}

/**
 * Dependencias reales: cliente admin de Supabase (service_role). `cronSecret` y `serviceKey`
 * se pasan desde cada función (Deno.env.get('CRON_SECRET') / SUPABASE_SERVICE_ROLE_KEY).
 */
// deno-lint-ignore no-explicit-any
export function supabaseAuthDeps(admin: any, serviceKey: string | undefined, cronSecret: string | undefined): AuthDeps {
  return {
    serviceKey,
    cronSecret,
    async getUserId(token) {
      const { data, error } = await admin.auth.getUser(token)
      return error || !data?.user ? null : String(data.user.id)
    },
    async getRole(userId) {
      const { data, error } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (error || !data) return null
      return String(data.role ?? '')
    },
  }
}
