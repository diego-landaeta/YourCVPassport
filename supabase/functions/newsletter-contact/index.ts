/**
 * newsletter-contact Edge Function
 *
 * Formularios publicos de la web que antes solo preparaban un mailto:
 *   - Boletin del blog  -> alta en una lista de Brevo con doble opt-in.
 *   - Contacto de prensa -> correo transaccional de Brevo a la bandeja de prensa.
 *
 * Endpoint: POST /functions/v1/newsletter-contact  (desplegar con --no-verify-jwt)
 * Body:
 *   { action: 'subscribe', email, lang?, website? }
 *   { action: 'press', name, email, outlet?, message, lang?, website? }
 *   `website` es el honeypot: los humanos lo dejan vacio (campo oculto).
 * Respuesta 200: { success: true }
 * Errores: { error, code }
 *   400 INVALID_INPUT       cuerpo, accion o campos no validos
 *   403 ORIGIN_NOT_ALLOWED  Origin ausente o fuera de la lista de _shared/cors.ts
 *   429 RATE_LIMITED        demasiadas peticiones por IP o hacia el mismo email
 *   503 NOT_CONFIGURED      faltan secretos de Brevo (la web ofrece el mailto)
 *   502 SEND_FAILED         Brevo rechazo la peticion, timeout o red caida
 *   500 INTERNAL_ERROR      cualquier otro fallo
 *
 * Garantias:
 * - Sin JWT (formulario anonimo): por eso Origin obligatorio y en lista blanca,
 *   rate limit por IP y por email (hash SHA-256, nunca en claro) y honeypot.
 * - Alta neutra: "ya suscrito" responde igual que un alta nueva (no revela si
 *   un email esta en la lista).
 * - Todo lo que escribe el usuario va escapado en el HTML del correo de prensa
 *   y sin saltos de linea en el asunto y en los nombres.
 * - Ni la API key ni los datos personales (email, nombre, mensaje) se escriben
 *   en los logs: solo el status y el codigo de error de Brevo.
 *
 * Secretos y despliegue: ver README.md de esta carpeta.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { enforceRateLimit, getClientIp, sha256Hex } from '../_shared/ratelimit.ts';

// ==================================================
// CONFIGURACION
// ==================================================

const BREVO_BASE_URL = 'https://api.brevo.com/v3';
const BREVO_TIMEOUT_MS = 10_000;

const SITE_ORIGIN = 'https://www.yourcvpassport.com';
// Pagina a la que vuelve el usuario tras confirmar el correo de doble opt-in.
const REDIRECT_PATH = { es: '/recursos/blog', en: '/resources/blog' } as const;

const DEFAULT_PRESS_INBOX = 'press@yourcvpassport.com';
const DEFAULT_SENDER_EMAIL = 'no-reply@yourcvpassport.com';
const DEFAULT_SENDER_NAME = 'YourCVPassport';

const MAX_BODY_BYTES = 32 * 1024;
const MAX = { email: 254, name: 120, outlet: 160, message: 5000, website: 200 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Control (incluidos \r y \n): no se admiten en campos de una linea.
const CONTROL_RE = /[\u0000-\u001f\u007f]/;
// En el mensaje se permiten \n, \r y \t; el resto de control no.
const MESSAGE_CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

type Lang = 'es' | 'en';
type Action = 'subscribe' | 'press';

const ALLOWED_KEYS: Record<Action, ReadonlySet<string>> = {
  subscribe: new Set(['action', 'email', 'lang', 'website']),
  press: new Set(['action', 'name', 'email', 'outlet', 'message', 'lang', 'website']),
};

// ==================================================
// RESPUESTAS
// ==================================================

class HttpError extends Error {
  status: number;
  code: string;
  headers: Record<string, string>;
  constructor(status: number, code: string, message: string, headers: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

function json(status: number, body: Record<string, unknown>, cors: Record<string, string>, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, ...extra, 'Content-Type': 'application/json' },
  });
}

const ok = (cors: Record<string, string>) => json(200, { success: true }, cors);

// ==================================================
// VALIDACION
// ==================================================

function field(body: Record<string, unknown>, key: string, max: number, opts: { required?: boolean; multiline?: boolean } = {}): string {
  const value = body[key];
  if (value === undefined || value === null) {
    if (opts.required) throw new HttpError(400, 'INVALID_INPUT', `Missing field ${key}`);
    return '';
  }
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_INPUT', `Field ${key} must be a string`);
  const trimmed = value.trim();
  if (opts.required && !trimmed) throw new HttpError(400, 'INVALID_INPUT', `Field ${key} is empty`);
  if (trimmed.length > max) throw new HttpError(400, 'INVALID_INPUT', `Field ${key} is too long`);
  if ((opts.multiline ? MESSAGE_CONTROL_RE : CONTROL_RE).test(trimmed)) {
    throw new HttpError(400, 'INVALID_INPUT', `Field ${key} contains invalid characters`);
  }
  return trimmed;
}

function emailField(body: Record<string, unknown>): string {
  const email = field(body, 'email', MAX.email, { required: true }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'INVALID_INPUT', 'Invalid email');
  return email;
}

function langField(body: Record<string, unknown>): Lang {
  if (body.lang === undefined || body.lang === null) return 'es';
  if (body.lang !== 'es' && body.lang !== 'en') throw new HttpError(400, 'INVALID_INPUT', 'Invalid lang');
  return body.lang;
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) throw new HttpError(400, 'INVALID_INPUT', 'Request too large');
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) throw new HttpError(400, 'INVALID_INPUT', 'Request too large');
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid body');
  }
  return body as Record<string, unknown>;
}

function positiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ==================================================
// BREVO
// ==================================================

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Llama a Brevo con timeout. Devuelve el status y el `code` de error de Brevo
// (p. ej. 'duplicate_parameter'); nunca el mensaje, que puede incluir el email.
async function brevoPost(path: string, apiKey: string, payload: unknown, tag: string): Promise<{ status: number; code: string | null }> {
  let res: Response;
  try {
    res = await fetch(`${BREVO_BASE_URL}${path}`, {
      method: 'POST',
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`[newsletter-contact] ${tag}: Brevo fetch failed:`, (err as Error)?.name);
    throw new HttpError(502, 'SEND_FAILED', 'Could not reach the email provider');
  }
  let code: string | null = null;
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    code = typeof body?.code === 'string' ? body.code : null;
  } else {
    await res.body?.cancel().catch(() => {});
  }
  return { status: res.status, code };
}

async function subscribe(body: Record<string, unknown>, cors: Record<string, string>): Promise<Response> {
  const email = emailField(body);
  const lang = langField(body);

  const apiKey = Deno.env.get('BREVO_API_KEY');
  const listId = positiveInt(Deno.env.get('BREVO_NEWSLETTER_LIST_ID'));
  // Plantilla por idioma opcional; si no hay de ingles se usa la general.
  const templateId = positiveInt(
    (lang === 'en' && Deno.env.get('BREVO_DOI_TEMPLATE_ID_EN')) || Deno.env.get('BREVO_DOI_TEMPLATE_ID'),
  );
  if (!apiKey || !listId || !templateId) {
    console.error('[newsletter-contact] subscribe: BREVO_API_KEY, BREVO_NEWSLETTER_LIST_ID o BREVO_DOI_TEMPLATE_ID no configurados');
    throw new HttpError(503, 'NOT_CONFIGURED', 'Newsletter is not configured');
  }

  await limitEmail('subscribe', email, cors);

  const { status, code } = await brevoPost('/contacts/doubleOptinConfirmation', apiKey, {
    email,
    includeListIds: [listId],
    templateId,
    redirectionUrl: `${SITE_ORIGIN}${REDIRECT_PATH[lang]}?suscrito=1`,
  }, 'subscribe');

  // 201: correo de confirmacion enviado. 204: el contacto ya existia.
  // 400 duplicate_parameter: ya estaba en la lista. Todo responde igual.
  if (status === 201 || status === 204 || (status === 400 && code === 'duplicate_parameter')) {
    return ok(cors);
  }
  console.error('[newsletter-contact] subscribe: Brevo error', status, code ?? '');
  throw new HttpError(502, 'SEND_FAILED', 'Could not subscribe');
}

async function press(body: Record<string, unknown>, cors: Record<string, string>): Promise<Response> {
  const name = field(body, 'name', MAX.name, { required: true });
  const email = emailField(body);
  const outlet = field(body, 'outlet', MAX.outlet);
  const message = field(body, 'message', MAX.message, { required: true, multiline: true });
  const lang = langField(body);

  const apiKey = Deno.env.get('BREVO_API_KEY');
  const inbox = (Deno.env.get('PRESS_INBOX_EMAIL') || DEFAULT_PRESS_INBOX).trim();
  const senderEmail = (Deno.env.get('BREVO_SENDER_EMAIL') || DEFAULT_SENDER_EMAIL).trim();
  const senderName = (Deno.env.get('BREVO_SENDER_NAME') || DEFAULT_SENDER_NAME).trim();
  if (!apiKey || !EMAIL_RE.test(inbox) || !EMAIL_RE.test(senderEmail)) {
    console.error('[newsletter-contact] press: BREVO_API_KEY, PRESS_INBOX_EMAIL o BREVO_SENDER_EMAIL no configurados');
    throw new HttpError(503, 'NOT_CONFIGURED', 'Press contact is not configured');
  }

  await limitEmail('press', email, cors);

  const subject = `[Prensa] ${outlet || name}`;
  const rows: [string, string][] = [
    ['Nombre', name],
    ['Medio', outlet || '-'],
    ['Email', email],
    ['Idioma', lang],
  ];
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: Arial, sans-serif; color: #1F2937; line-height: 1.5;">
<h2 style="margin: 0 0 16px;">Nueva consulta de prensa (formulario web)</h2>
<table cellpadding="4" style="border-collapse: collapse;">
${rows.map(([k, v]) => `<tr><td style="font-weight: bold; vertical-align: top;">${k}</td><td>${escapeHtml(v)}</td></tr>`).join('\n')}
</table>
<p style="font-weight: bold; margin: 16px 0 4px;">Mensaje</p>
<div style="white-space: pre-wrap; border-left: 4px solid #2563EB; padding-left: 12px;">${escapeHtml(message)}</div>
<p style="color: #6B7280; font-size: 12px; margin-top: 24px;">Responde a este correo para contestar directamente al remitente.</p>
</body></html>`;
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), '', message].join('\n');

  const { status, code } = await brevoPost('/smtp/email', apiKey, {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: inbox }],
    replyTo: { email, name },
    subject,
    htmlContent: html,
    textContent: text,
    tags: ['press-contact'],
  }, 'press');

  if (status >= 200 && status < 300) return ok(cors);
  console.error('[newsletter-contact] press: Brevo error', status, code ?? '');
  throw new HttpError(502, 'SEND_FAILED', 'Could not send the message');
}

// Limite por destinatario (3 cada 15 min, config 'authEmail'): evita usar el
// formulario para inundar un buzon ajeno cambiando de IP.
async function limitEmail(action: Action, email: string, cors: Record<string, string>): Promise<void> {
  const limited = await enforceRateLimit('authEmail', [`newsletter:${action}:email:${await sha256Hex(email)}`], cors);
  if (limited) throw limited;
}

// ==================================================
// HANDLER
// ==================================================

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  // Formulario publico sin JWT: solo desde la web (Origin obligatorio y permitido).
  if (!isAllowedOrigin(req.headers.get('origin'))) {
    return json(403, { error: 'Origin not allowed', code: 'ORIGIN_NOT_ALLOWED' }, cors);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'INVALID_INPUT', 'Method not allowed', { Allow: 'POST, OPTIONS' });
    }

    // Rate limit por IP (5/min, config 'auth') antes de leer el cuerpo. Sin IP
    // conocida no se limita por IP (un cubo compartido bloquearia a todos).
    const ip = getClientIp(req);
    if (ip) {
      const limited = await enforceRateLimit('auth', [`newsletter:ip:${ip}`], cors);
      if (limited) return limited;
    }

    const body = await readBody(req);
    const action = body.action;
    if (action !== 'subscribe' && action !== 'press') {
      throw new HttpError(400, 'INVALID_INPUT', 'Unknown action');
    }
    for (const key of Object.keys(body)) {
      if (!ALLOWED_KEYS[action].has(key)) throw new HttpError(400, 'INVALID_INPUT', `Unknown field ${key}`);
    }

    // Honeypot relleno: se responde como si todo fuera bien y no se envia nada.
    if (field(body, 'website', MAX.website)) return ok(cors);

    return action === 'subscribe' ? await subscribe(body, cors) : await press(body, cors);
  } catch (error) {
    if (error instanceof Response) return error; // 429 de enforceRateLimit
    const httpError = error instanceof HttpError
      ? error
      : new HttpError(500, 'INTERNAL_ERROR', 'An error occurred');
    if (!(error instanceof HttpError)) console.error('[newsletter-contact] unexpected:', (error as Error)?.name);
    return json(httpError.status, { error: httpError.message, code: httpError.code }, cors, httpError.headers);
  }
});
