// Enlace de los correos de auth con el dominio propio (issue #244 del CRM: el
// usuario no debe ver Supabase ni <proyecto>.supabase.co en ningún sitio).
//
// generateLink devuelve en `properties`:
//   action_link        https://<proyecto>.supabase.co/auth/v1/verify?token=…&redirect_to=…
//   hashed_token       hash del token de un solo uso
//   verification_type  'signup' | 'recovery' | 'magiclink' | …
//
// En lugar de action_link, el correo enlaza a la app:
//   <origen permitido><path>?token_hash=<hashed_token>&type=<verification_type>
// y la página (/confirm, /recovery o /callback) llama a
// supabase.auth.verifyOtp({ token_hash, type }) para abrir la sesión
// (utils/emailLinkAuth.ts). El token sigue siendo de un solo uso y caduca igual.
//
// `redirectTo` es la URL de resolveAuthRedirect (_shared/cors.ts): un origen de la
// lista blanca + path, sin query ni hash. Así un redirectTo de otro dominio nunca
// llega al enlace.

export interface GenerateLinkProperties {
  action_link?: string
  hashed_token?: string
  verification_type?: string
  redirect_to?: string
}

// Tipos que acepta verifyOtp con token_hash (EmailOtpType de supabase-js).
const EMAIL_OTP_TYPES = new Set(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'])

// Devuelve el enlace del correo o null si generateLink no devolvió nada utilizable.
// `fallbackType` es el tipo pedido a generateLink, por si la respuesta no trae
// verification_type.
export function buildAuthEmailLink(
  redirectTo: string,
  properties: GenerateLinkProperties | null | undefined,
  fallbackType: string,
): string | null {
  const hashedToken = properties?.hashed_token
  const type = properties?.verification_type || fallbackType
  if (typeof hashedToken === 'string' && hashedToken && EMAIL_OTP_TYPES.has(type)) {
    return `${redirectTo}?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(type)}`
  }

  // Respaldo para versiones antiguas de GoTrue que no devuelven hashed_token: el
  // enlace pasa por <proyecto>.supabase.co/auth/v1/verify (se ve el dominio de
  // Supabase) y vuelve a redirectTo con #access_token, formato que las páginas
  // siguen aceptando. Si aparece este aviso en los logs, actualizar GoTrue.
  if (typeof properties?.action_link === 'string' && properties.action_link) {
    console.warn('[authLink] generateLink sin hashed_token: se usa action_link')
    return properties.action_link
  }
  return null
}
