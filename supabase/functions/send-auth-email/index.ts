// Supabase Edge Function: send-auth-email (Send Email Hook de Supabase Auth)
//
// Supabase Auth ya no envía sus correos por SMTP (antes: smtp.resend.com, con el
// dominio sin verificar). Con el hook activado, Auth llama a esta función para
// cada correo que tendría que mandar (cambio de email, invitación, reautenticación,
// avisos de seguridad y, si algún cliente los pide a Auth directamente, alta,
// recuperación y magic link) y aquí se envía con las plantillas de la marca por
// _shared/email.ts (relé del servidor web: ver deploy/mail-relay/).
//
// Seguridad: Auth firma cada petición (Standard Webhooks, verificada aquí con
// crypto.subtle). Sin firma válida o con más de 5 min de antigüedad, 401.
// Desplegar con --no-verify-jwt (no lleva JWT de usuario, lleva firma).
//
// Secretos:
//   SEND_EMAIL_HOOK_SECRET  "v1,whsec_<base64>" (el mismo que se configura en el hook)
//   APP_URL                 opcional, por defecto https://yourcvpassport.com
//
// Enlaces: <APP_URL><ruta>?token_hash=…&type=… (dominio propio, sin supabase.co);
// la web los verifica con verifyOtp (utils/emailLinkAuth.ts).
//
// Cambio de email con "Secure email change" (dos correos): por compatibilidad,
// Supabase invierte los nombres de los hashes. La dirección ACTUAL (user.email)
// recibe token_hash_new y la NUEVA (user.new_email) recibe token_hash.
// https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
//
// Respuesta: 200 con {} (JSON) si se envió; 401 con firma inválida; 500 { error } si
// falla el envío (Auth lo muestra como error al usuario).

import { sendEmail } from '../_shared/email.ts'
import {
  accountNoticeEmail,
  confirmSignupEmail,
  emailChangeEmail,
  inviteEmail,
  magicLinkEmail,
  passwordResetEmail,
  reauthenticationEmail,
  type RenderedEmail,
} from '../_shared/emailTemplates.ts'

const APP_URL = (Deno.env.get('APP_URL') || 'https://yourcvpassport.com').replace(/\/+$/, '')

interface HookPayload {
  user: { email?: string; new_email?: string; user_metadata?: { full_name?: string } }
  email_data: {
    token?: string
    token_hash?: string
    token_new?: string
    token_hash_new?: string
    email_action_type: string
  }
}

const PATHS: Record<string, string> = {
  signup: '/confirm',
  invite: '/confirm',
  email_change: '/confirm',
  recovery: '/recovery',
  magiclink: '/callback',
  email: '/callback',
}

function link(type: string, tokenHash: string): string {
  return `${APP_URL}${PATHS[type] ?? '/confirm'}?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`
}

// Verificación Standard Webhooks (la que usa Supabase Auth en los hooks):
// firma = base64(HMAC-SHA256(clave, `${webhook-id}.${webhook-timestamp}.${cuerpo}`)),
// clave = base64 de SEND_EMAIL_HOOK_SECRET sin el prefijo "v1,whsec_"; la cabecera
// webhook-signature trae una o varias "v1,<firma>" separadas por espacios. Se
// rechazan marcas de tiempo con más de 5 minutos de diferencia (reenvíos).
async function verifyWebhook(secretB64: string, headers: Headers, body: string): Promise<boolean> {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signatures = headers.get('webhook-signature')
  if (!id || !timestamp || !signatures) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false
  let keyBytes: Uint8Array
  try {
    keyBytes = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0))
  } catch {
    return false
  }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)))
  const expected = btoa(String.fromCharCode(...mac))
  return signatures.split(' ').some((s) => {
    const sig = s.startsWith('v1,') ? s.slice(3) : ''
    if (sig.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    return diff === 0
  })
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed')

  const secret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') || '').replace(/^v1,whsec_/, '')
  if (!secret) {
    console.error('[send-auth-email] falta SEND_EMAIL_HOOK_SECRET')
    return errorResponse(500, 'Hook not configured')
  }

  const body = await req.text()
  if (!(await verifyWebhook(secret, req.headers, body))) return errorResponse(401, 'Invalid signature')
  let payload: HookPayload
  try {
    payload = JSON.parse(body) as HookPayload
  } catch {
    return errorResponse(400, 'Invalid JSON')
  }

  const { user, email_data: data } = payload
  const type = data?.email_action_type
  const name = user?.user_metadata?.full_name
  const messages: { to: string; email: RenderedEmail; tag: string }[] = []

  switch (type) {
    case 'signup':
      if (user.email && data.token_hash) messages.push({ to: user.email, email: confirmSignupEmail({ name, link: link(type, data.token_hash) }), tag: 'auth-signup' })
      break
    case 'invite':
      if (user.email && data.token_hash) messages.push({ to: user.email, email: inviteEmail({ link: link(type, data.token_hash) }), tag: 'auth-invite' })
      break
    case 'recovery':
      if (user.email && data.token_hash) messages.push({ to: user.email, email: passwordResetEmail({ name, link: link(type, data.token_hash) }), tag: 'auth-recovery' })
      break
    case 'magiclink':
    case 'email':
      if (user.email && data.token_hash) messages.push({ to: user.email, email: magicLinkEmail({ name, link: link(type, data.token_hash) }), tag: 'auth-magiclink' })
      break
    case 'email_change': {
      const newEmail = user.new_email
      // Secure email change: dos correos, con los hashes invertidos (ver cabecera).
      if (user.email && data.token_hash_new) {
        messages.push({ to: user.email, email: emailChangeEmail({ target: 'current', newEmail, link: link(type, data.token_hash_new) }), tag: 'auth-email-change' })
      }
      if (newEmail && data.token_hash) {
        messages.push({ to: newEmail, email: emailChangeEmail({ target: 'new', link: link(type, data.token_hash) }), tag: 'auth-email-change' })
      }
      break
    }
    case 'reauthentication':
      if (user.email && data.token) messages.push({ to: user.email, email: reauthenticationEmail({ code: data.token }), tag: 'auth-reauthentication' })
      break
    default:
      // Avisos de seguridad (*_notification).
      if (user.email && typeof type === 'string' && type.endsWith('_notification')) {
        messages.push({ to: user.email, email: accountNoticeEmail({ type }), tag: 'auth-notice' })
      }
  }

  if (!messages.length) {
    console.error('[send-auth-email] sin correo que enviar para el tipo', type)
    return errorResponse(400, `Unsupported email_action_type: ${type}`)
  }

  for (const m of messages) {
    const result = await sendEmail({ to: m.to, ...m.email, tags: [m.tag] })
    if (!result.ok) {
      console.error('[send-auth-email] email send failed:', type, result.code, result.status, result.detail)
      return errorResponse(500, 'Could not send email')
    }
  }
  // Auth exige Content-Type JSON también en el éxito (si no: hook_payload_invalid_content_type).
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
})
