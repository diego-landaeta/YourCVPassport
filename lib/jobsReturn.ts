/**
 * "Inscribirme" sin sesion: se manda a /login y, al entrar, se vuelve a la oferta.
 *
 * Doble via, porque el login (AuthScreen) no es de este modulo:
 *  1. `?next=/empleos/<slug>?apply=1` en la URL de /login (lo puede leer AuthScreen).
 *  2. sessionStorage: `PostLoginReturn` (App.tsx) lleva al usuario a la oferta en cuanto
 *     hay sesion, aunque AuthScreen mande a /dashboard.
 * Solo se aceptan rutas internas (empiezan por una sola "/").
 */

const KEY = 'ycvp_post_login_return';
const MAX_AGE_MS = 30 * 60 * 1000;

export function isSafeReturnPath(path: unknown): path is string {
  return typeof path === 'string'
    && path.startsWith('/')
    && !path.startsWith('//')
    && !path.includes('\\')
    && !/[\u0000-\u001f]/.test(path)
    && path.length < 500;
}

export function setPostLoginReturn(path: string): void {
  if (!isSafeReturnPath(path)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch { /* sin almacenamiento: queda el ?next= */ }
}

export function peekPostLoginReturn(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (!isSafeReturnPath(path) || typeof at !== 'number' || Date.now() - at > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

/** Devuelve la ruta pendiente (si hay) y la borra. */
export function consumePostLoginReturn(): string | null {
  const path = peekPostLoginReturn();
  try {
    sessionStorage.removeItem(KEY);
  } catch { /* nada */ }
  return path;
}

/** Ruta de login con retorno. */
export function loginUrlWithReturn(returnPath: string): string {
  return isSafeReturnPath(returnPath) ? `/login?next=${encodeURIComponent(returnPath)}` : '/login';
}
