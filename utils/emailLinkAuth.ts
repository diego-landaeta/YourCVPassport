// ============================================================================
// Enlaces de los correos de auth con el dominio propio (issue #244 del CRM).
//
// Las Edge Functions signup, send-password-reset, send-magic-link y
// send-email-confirmation ya no enlazan a <proyecto>.supabase.co/auth/v1/verify,
// sino a la app:
//   /confirm?token_hash=…&type=signup
//   /recovery?token_hash=…&type=recovery
//   /callback?token_hash=…&type=magiclink
// (ver supabase/functions/_shared/authLink.ts). La página llama a
// supabase.auth.verifyOtp({ token_hash, type }), que abre la sesión.
//
// Los correos antiguos siguen llegando con #access_token en el hash: eso lo
// procesa supabase-js solo (detectSessionInUrl) y las páginas lo leen con
// getSession(), como antes.
// ============================================================================

import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

export interface EmailLinkParams {
  tokenHash: string;
  type: EmailOtpType;
}

/** `expired`: token caducado, ya usado o inválido. `failed`: red u otro fallo. */
export type EmailLinkErrorKind = 'expired' | 'failed';

/** `error` null si el enlace se verificó; `session` es la sesión abierta (si la hay). */
export interface EmailLinkResult {
  session: Session | null;
  error: EmailLinkErrorKind | null;
}

/** token_hash + type de la query, o null si la URL no es un enlace nuevo. */
export function readEmailLinkParams(search: string): EmailLinkParams | null {
  const params = new URLSearchParams(search);
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  if (!tokenHash || !type || !EMAIL_OTP_TYPES.includes(type)) return null;
  return { tokenHash, type };
}

/**
 * Quita token_hash y type de la URL con history.replaceState para que el token
 * no quede en el historial, en marcadores ni en el Referer. Conserva el estado
 * de React Router (history.state) y el resto de la query.
 */
export function stripEmailLinkParams(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('token_hash');
    url.searchParams.delete('type');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Sin History API: el token es de un solo uso y caduca igualmente.
  }
}

// GoTrue responde 403 otp_expired tanto si el token ha caducado como si ya se
// usó; flow_state_*, bad_jwt, etc. también significan "pide otro enlace".
const EXPIRED_CODES = new Set(['otp_expired', 'otp_disabled', 'flow_state_expired', 'flow_state_not_found', 'bad_jwt', 'validation_failed']);

function classifyError(error: { status?: number; code?: string; name?: string }): EmailLinkErrorKind {
  if (error.code && EXPIRED_CODES.has(error.code)) return 'expired';
  if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) return 'expired';
  return 'failed';
}

/**
 * Error que GoTrue devuelve en la URL al abrir un enlace del formato antiguo ya
 * caducado o usado (#error=access_denied&error_code=otp_expired&...). null si no
 * hay error.
 */
export function readEmailLinkUrlError(search: string, hash: string): EmailLinkErrorKind | null {
  for (const raw of [hash.replace(/^#/, ''), search.replace(/^\?/, '')]) {
    const params = new URLSearchParams(raw);
    const code = params.get('error_code');
    const error = params.get('error');
    if (!code && !error && !params.get('error_description')) continue;
    return (code && EXPIRED_CODES.has(code)) || error === 'access_denied' ? 'expired' : 'failed';
  }
  return null;
}

// Una sola verificación por token: React.StrictMode monta dos veces los efectos
// en desarrollo y un segundo verifyOtp con el mismo token daría otp_expired.
const inFlight = new Map<string, Promise<EmailLinkResult>>();

/** Verifica el enlace (verifyOtp con token_hash). Nunca lanza. */
export function verifyEmailLink({ tokenHash, type }: EmailLinkParams): Promise<EmailLinkResult> {
  const cached = inFlight.get(tokenHash);
  if (cached) return cached;
  const promise = (async (): Promise<EmailLinkResult> => {
    try {
      // getSession espera a que el cliente termine de inicializarse (sesión
      // guardada, refresco) antes de guardar la nueva.
      await supabase.auth.getSession();
      const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return { session: null, error: classifyError(error as any) };
      return { session: data.session, error: null };
    } catch {
      return { session: null, error: 'failed' };
    }
  })();
  inFlight.set(tokenHash, promise);
  return promise;
}
