// ============================================================================
// Hash de la URL con la que se abrió la app, leído ANTES de crear el cliente de
// Supabase (supabase/client.ts importa este módulo primero).
//
// Formato antiguo de los enlaces de auth: GoTrue redirige a
// /recovery#access_token=…&type=recovery. supabase-js abre la sesión y vacía el
// hash (window.location.hash = '') antes de que se cargue RecoveryPage (lazy),
// que ya no veía type=recovery y mostraba el formulario de pedir correo en vez
// del de nueva contraseña. Ver utils/emailLinkAuth.ts.
// ============================================================================

interface InitialAuthUrl {
  pathname: string;
  type: string | null;
}

let initial: InitialAuthUrl | null = null;
try {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (hash.get('access_token')) {
    initial = { pathname: window.location.pathname, type: hash.get('type') };
  }
} catch {
  initial = null;
}

/**
 * `type` del enlace antiguo (#access_token=…&type=…) si la app se abrió en
 * `pathname`. Solo devuelve el valor una vez: una visita posterior a la misma
 * ruta dentro de la SPA no lo hereda.
 */
export function consumeInitialAuthHashType(pathname: string): string | null {
  if (!initial || initial.pathname !== pathname) return null;
  const { type } = initial;
  initial = null;
  return type;
}
