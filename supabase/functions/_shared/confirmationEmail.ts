// Enlaces de confirmación de alta para cuentas que ya pueden existir. Lo usan
// `signup` (alta repetida de una cuenta pendiente) y `send-email-confirmation`
// (botón "Reenviar"). El correo en sí es confirmSignupEmail (_shared/emailTemplates.ts).

// Resultado de pedir a GoTrue un enlace de confirmación (generateLink 'signup'
// sin password) para un email que ya puede tener cuenta.
export type PendingLinkResult =
  | { kind: 'link'; properties: any; userId?: string }
  | { kind: 'confirmed' }      // la cuenta ya está confirmada (email_exists)
  | { kind: 'no-account' }     // no hay cuenta (GoTrue exige password para crearla)
  | { kind: 'rate-limited' }
  | { kind: 'error'; message: string }

// generateLink({ type: 'signup' }) sin password:
// - cuenta pendiente → devuelve un enlace nuevo (no toca la password);
// - cuenta confirmada → 422 email_exists;
// - sin cuenta → 422 validation_failed ("Signup requires a valid password"):
//   GoTrue no crea usuarios sin password, así que nunca da de alta a nadie.
export async function generatePendingConfirmationLink(
  supabase: any,
  email: string,
  redirectTo: string
): Promise<PendingLinkResult> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    options: { redirectTo },
  })
  if (!error) return { kind: 'link', properties: data?.properties, userId: data?.user?.id }

  const code: string = error.code || ''
  const status: number = error.status || 0
  const msg: string = error.message || ''
  if (code === 'email_exists' || code === 'user_already_exists' || /already (been )?registered|already exists/i.test(msg)) {
    return { kind: 'confirmed' }
  }
  if (code === 'validation_failed' || code === 'user_not_found' || status === 404 || /requires a valid password|not found/i.test(msg)) {
    return { kind: 'no-account' }
  }
  if (status === 429 || /rate limit/i.test(msg)) return { kind: 'rate-limited' }
  return { kind: 'error', message: `${status} ${code} ${msg}`.trim() }
}
