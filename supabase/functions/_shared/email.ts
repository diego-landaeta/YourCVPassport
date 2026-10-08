// Envío de correo transaccional con Brevo (API v3, POST /v3/smtp/email).
//
// Todas las Edge Functions que mandan correo pasan por sendEmail(); ninguna
// llama al proveedor directamente. Ver supabase/functions/EMAIL.md.
//
// Secretos (supabase secrets set ...):
//   BREVO_API_KEY  obligatorio. Sin él, sendEmail() devuelve EMAIL_NOT_CONFIGURED
//                  sin hacer ninguna petición.
//   SENDER_EMAIL   opcional (por defecto no-reply@yourcvpassport.com). Tiene que
//                  pertenecer a un dominio autenticado en Brevo.
//
// Si están EMAIL_RELAY_URL y EMAIL_RELAY_SECRET, el envío va por el relé del
// servidor web (Brevo rechaza las IPs de las Edge Functions); ver
// _shared/brevoRequest.ts y deploy/mail-relay/.
//
// Nunca se registran ni se devuelven la API key, el destinatario ni el
// contenido del correo: `detail` solo lleva el status y el código de error de
// Brevo, pensado para console.error del llamador.

import { brevoConfigured, brevoRequest } from './brevoRequest.ts'

const DEFAULT_SENDER_EMAIL = 'no-reply@yourcvpassport.com'
const SENDER_NAME = 'YourCVPassport'

// Brevo tiene que contestar antes de esto para que signup responda dentro del
// timeout de 20 s del frontend (arranque en frío + createUser + generateLink).
export const EMAIL_TIMEOUT_MS = 10000

// Una sola dirección: sin espacios, comas, punto y coma ni <>, para que nadie
// cuele varios destinatarios ni un "Nombre <correo>" en el campo.
const SINGLE_EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/
const MAX_EMAIL_LENGTH = 254
const MAX_TAGS = 10
const MAX_DETAIL_LENGTH = 200

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: string[]
}

export type SendEmailErrorCode = 'EMAIL_SEND_FAILED' | 'EMAIL_NOT_CONFIGURED'

// status: código HTTP de Brevo si hubo respuesta; 0 si no la hubo (timeout,
// red, entrada inválida o falta de configuración).
export type SendEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; status: number; code: SendEmailErrorCode; detail: string }

export function isValidSingleEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_EMAIL_LENGTH && SINGLE_EMAIL_RE.test(value)
}

function senderEmail(): string {
  return (Deno.env.get('SENDER_EMAIL') || '').trim() || DEFAULT_SENDER_EMAIL
}

// true si hay API key y remitente válido. Útil para fallar antes de tocar la
// base de datos (p. ej. antes de crear un sello de verificación).
export function isEmailConfigured(): boolean {
  return brevoConfigured() && isValidSingleEmail(senderEmail())
}

function fail(status: number, code: SendEmailErrorCode, detail: string): SendEmailResult {
  return { ok: false, status, code, detail: detail.slice(0, MAX_DETAIL_LENGTH) }
}

// Texto de error de Brevo apto para logs: solo el campo `code` (p. ej.
// "unauthorized", "invalid_parameter"), sin el mensaje, que puede incluir el
// destinatario.
function brevoErrorCode(body: unknown): string {
  const code = (body as { code?: unknown } | null)?.code
  return typeof code === 'string' ? code.replace(/[^\w.-]/g, '').slice(0, 60) : 'unknown'
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const fromEmail = senderEmail()
  if (!brevoConfigured()) return fail(0, 'EMAIL_NOT_CONFIGURED', 'BREVO_API_KEY not set')
  if (!isValidSingleEmail(fromEmail)) return fail(0, 'EMAIL_NOT_CONFIGURED', 'SENDER_EMAIL is not a valid address')

  const to = typeof input?.to === 'string' ? input.to.trim() : ''
  if (!isValidSingleEmail(to)) return fail(0, 'EMAIL_SEND_FAILED', 'invalid recipient (exactly one address expected)')

  // El asunto es una línea: se quitan saltos de línea.
  const subject = typeof input.subject === 'string' ? input.subject.replace(/[\r\n]+/g, ' ').trim() : ''
  if (!subject) return fail(0, 'EMAIL_SEND_FAILED', 'empty subject')
  if (typeof input.html !== 'string' || !input.html.trim()) return fail(0, 'EMAIL_SEND_FAILED', 'empty html')

  const payload: Record<string, unknown> = {
    sender: { email: fromEmail, name: SENDER_NAME },
    to: [{ email: to }],
    subject,
    htmlContent: input.html,
  }
  if (typeof input.text === 'string' && input.text.trim()) payload.textContent = input.text
  if (input.replyTo !== undefined) {
    const replyTo = typeof input.replyTo === 'string' ? input.replyTo.trim() : ''
    if (!isValidSingleEmail(replyTo)) return fail(0, 'EMAIL_SEND_FAILED', 'invalid replyTo')
    payload.replyTo = { email: replyTo }
  }
  if (Array.isArray(input.tags)) {
    const tags = input.tags
      .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
      .map((t) => t.trim().slice(0, 50))
      .slice(0, MAX_TAGS)
    if (tags.length) payload.tags = tags
  }

  let response: Response
  try {
    response = await brevoRequest('/smtp/email', payload, EMAIL_TIMEOUT_MS)
  } catch (error: unknown) {
    // Timeout (TimeoutError/AbortError) o fallo de red: un fetch colgado también
    // es EMAIL_SEND_FAILED.
    const name = (error as { name?: unknown } | null)?.name
    const reason = name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network error'
    return fail(0, 'EMAIL_SEND_FAILED', `brevo ${reason}`)
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    // Típicos: 401 unauthorized (key mala), 400 invalid_parameter (remitente no
    // validado o dominio sin autenticar), 402 (sin créditos), 429.
    return fail(response.status, 'EMAIL_SEND_FAILED', `brevo HTTP ${response.status} ${brevoErrorCode(body)}`)
  }

  const messageId = (body as { messageId?: unknown } | null)?.messageId
  return { ok: true, messageId: typeof messageId === 'string' ? messageId : '' }
}
