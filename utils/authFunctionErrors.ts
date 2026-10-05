// ============================================================================
// Errores de las Edge Functions de autenticación (`signup`, `send-password-reset`).
//
// Las funciones devuelven `{ error, code }` con estos códigos:
//   EMAIL_ALREADY_REGISTERED (409), INVALID_INPUT (400), WEAK_PASSWORD (400),
//   EMAIL_SEND_FAILED (502), INTERNAL_ERROR (500).
// En el cliente se añaden TIMEOUT, NETWORK_ERROR y RATE_LIMITED.
//
// También reconoce el contrato antiguo (500 + INTERNAL_ERROR con el mensaje de
// GoTrue/Resend en `error`) para que la UI muestre algo útil aunque el frontend
// se despliegue antes que las funciones.
// ============================================================================

import { supabase } from '../supabase/client';

// Tiempo máximo de espera de `functions.invoke` en alta y recuperación: el
// botón nunca se queda en "Creando cuenta..." más de esto.
export const AUTH_FUNCTION_TIMEOUT_MS = 20000;

export type AuthFunctionErrorCode =
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_INPUT'
  | 'WEAK_PASSWORD'
  | 'EMAIL_SEND_FAILED'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export class AuthFunctionError extends Error {
  code: AuthFunctionErrorCode;
  status?: number;

  constructor(code: AuthFunctionErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'AuthFunctionError';
    this.code = code;
    this.status = status;
  }
}

const KNOWN_CODES: AuthFunctionErrorCode[] = [
  'EMAIL_ALREADY_REGISTERED',
  'INVALID_INPUT',
  'WEAK_PASSWORD',
  'EMAIL_SEND_FAILED',
  'RATE_LIMITED',
];

// Clasifica por el texto del mensaje (contrato antiguo o errores de GoTrue).
// GoTrue dice "A user with this email address has already been registered".
function codeFromMessage(message: string): AuthFunctionErrorCode | null {
  if (/already (been )?registered|already exists|email_exists/i.test(message)) return 'EMAIL_ALREADY_REGISTERED';
  if (/resend error|email_send_failed/i.test(message)) return 'EMAIL_SEND_FAILED';
  if (/rate limit|too many requests/i.test(message)) return 'RATE_LIMITED';
  if (/password/i.test(message) && /weak|at least|short|characters/i.test(message)) return 'WEAK_PASSWORD';
  return null;
}

// Convierte el `error` de `supabase.functions.invoke` en un AuthFunctionError.
export async function toAuthFunctionError(error: any): Promise<AuthFunctionError> {
  if (error instanceof AuthFunctionError) return error;

  const name: string = error?.name || '';
  const context: any = error?.context;

  // Fallo de fetch: timeout (AbortController de `invoke`) o red caída / CORS.
  if (name === 'FunctionsFetchError') {
    const causeName: string = context?.name || '';
    if (causeName === 'AbortError' || causeName === 'TimeoutError') {
      return new AuthFunctionError('TIMEOUT', 'Request timed out');
    }
    return new AuthFunctionError('NETWORK_ERROR', context?.message || error.message || 'Network error');
  }
  if (name === 'AbortError' || name === 'TimeoutError') {
    return new AuthFunctionError('TIMEOUT', 'Request timed out');
  }

  // Respuesta no-2xx: leer el cuerpo JSON `{ error, code }` si lo hay.
  if (context && typeof context.status === 'number') {
    const status: number = context.status;
    let message = error?.message || `HTTP ${status}`;
    let bodyCode: string | undefined;
    try {
      if (typeof context.json === 'function') {
        const body = await context.json();
        if (body?.error) message = String(body.error);
        else if (body?.message) message = String(body.message);
        if (body?.code) bodyCode = String(body.code);
      }
    } catch {
      // Cuerpo vacío o no JSON: nos quedamos con el status.
    }
    if (bodyCode && (KNOWN_CODES as string[]).includes(bodyCode)) {
      return new AuthFunctionError(bodyCode as AuthFunctionErrorCode, message, status);
    }
    if (status === 429) return new AuthFunctionError('RATE_LIMITED', message, status);
    if (status === 409) return new AuthFunctionError('EMAIL_ALREADY_REGISTERED', message, status);
    return new AuthFunctionError(codeFromMessage(message) || 'SERVER_ERROR', message, status);
  }

  const message: string = error?.message || String(error || 'Unknown error');
  if (error instanceof TypeError) return new AuthFunctionError('NETWORK_ERROR', message);
  return new AuthFunctionError(codeFromMessage(message) || 'SERVER_ERROR', message);
}

// Invoca una Edge Function de auth con timeout y errores normalizados.
// `timeout` aborta el fetch; la carrera con `guard` es un seguro por si el
// AbortController no llegara a resolver la promesa (nunca debe quedarse colgada).
export async function invokeAuthFunction<T = any>(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: AuthFunctionError | null }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AuthFunctionError('TIMEOUT', 'Request timed out')),
      AUTH_FUNCTION_TIMEOUT_MS + 1000
    );
  });
  try {
    const { data, error } = await Promise.race([
      supabase.functions.invoke(name, { body, timeout: AUTH_FUNCTION_TIMEOUT_MS }),
      guard,
    ]);
    if (error) return { data: null, error: await toAuthFunctionError(error) };
    // 2xx con `{ error }` en el cuerpo (no debería pasar, pero no lo ignoramos).
    if ((data as any)?.error) {
      const d = data as any;
      const code = (KNOWN_CODES as string[]).includes(d.code) ? (d.code as AuthFunctionErrorCode) : null;
      return {
        data: null,
        error: code ? new AuthFunctionError(code, String(d.error)) : await toAuthFunctionError(new Error(String(d.error))),
      };
    }
    return { data: data as T, error: null };
  } catch (e) {
    return { data: null, error: await toAuthFunctionError(e) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
