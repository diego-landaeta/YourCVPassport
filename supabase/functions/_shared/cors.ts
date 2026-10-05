// CORS con lista de orígenes permitidos (en lugar de '*').
//
// Producción: yourcvpassport.com y www. Desarrollo: http://localhost:<puerto> y
// http://127.0.0.1:<puerto>. Orígenes extra (p. ej. un staging) por el secreto
// opcional CORS_EXTRA_ORIGINS, separados por comas.
//
// Si el origen no está permitido se responde con el origen principal: el
// navegador bloquea la respuesta. No sustituye a la autenticación.

const ALLOWED_ORIGINS = [
  'https://yourcvpassport.com',
  'https://www.yourcvpassport.com',
]

const LOCALHOST_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/

function extraOrigins(): string[] {
  return (Deno.env.get('CORS_EXTRA_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin) || LOCALHOST_RE.test(origin) || extraOrigins().includes(origin)
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

// ---------------------------------------------------------------------------
// Destino de los enlaces de los correos de auth (redirectTo)
// ---------------------------------------------------------------------------
//
// El redirectTo que manda el cliente acaba en el enlace del correo: sin validar,
// cualquiera podría generar correos legítimos de YourCVPassport que, tras
// confirmar o recuperar la cuenta, llevan a un dominio ajeno con el token en la
// URL. Solo se acepta un origen de la lista de CORS con el path esperado; si no,
// se usa el origen de la petición (si está permitido) o el dominio principal.

// Destino por defecto cuando no hay un origen válido (nunca localhost).
export const DEFAULT_APP_ORIGIN = 'https://www.yourcvpassport.com'

// Devuelve el Origin de la petición si está en la lista blanca; si no, null.
export function getAllowedOrigin(req: Request): string | null {
  const origin = req.headers.get('origin')
  return isAllowedOrigin(origin) ? origin : null
}

// URL final del enlace del correo para `path` ('/confirm' o '/recovery').
// Se reconstruye como origen + path: se descartan query, hash y credenciales.
export function resolveAuthRedirect(req: Request, requested: unknown, path: '/confirm' | '/recovery'): string {
  if (typeof requested === 'string' && requested.length <= 2048) {
    try {
      const url = new URL(requested)
      if (!url.username && !url.password && url.pathname === path && isAllowedOrigin(url.origin)) {
        return `${url.origin}${path}`
      }
    } catch {
      // URL mal formada: se ignora y se usa el origen por defecto.
    }
  }
  return `${getAllowedOrigin(req) ?? DEFAULT_APP_ORIGIN}${path}`
}
