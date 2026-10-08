// Relé de correo de YourCVPassport (Node 20, sin dependencias).
//
// Por qué existe: la cuenta de Brevo tiene activada la lista de IPs autorizadas
// y las Edge Functions de Supabase salen por IPs de AWS que cambian, así que
// Brevo las rechaza (401 "unrecognised IP address"). Este servidor (72.60.90.135)
// sí está autorizado. Las funciones envían aquí y el relé reenvía a Brevo con la
// API key, que nunca sale de este servidor.
//
// Contrato: POST / (nginx: https://yourcvpassport.com/api/mail-relay)
//   Authorization: Bearer <RELAY_SECRET>
//   { "path": "/smtp/email" | "/contacts/doubleOptinConfirmation", "payload": {...} }
//   → status y cuerpo de Brevo tal cual.
//
// Límites: solo esas dos rutas, remitente @yourcvpassport.com en /smtp/email,
// cuerpo máximo 512 KB, 120 peticiones por minuto, 10 s de timeout con Brevo.
// Los logs solo llevan ruta, status y duración (nunca destinatario ni contenido).
//
// Configuración: /etc/ycp-mail-relay.env (permisos 600) con
//   BREVO_API_KEY=...   RELAY_SECRET=...   [PORT=3917]
// Arranque: pm2 start server.mjs --name ycp-mail-relay (ver README.md).

import http from 'node:http';
import fs from 'node:fs';
import { timingSafeEqual } from 'node:crypto';

const ENV_FILE = process.env.RELAY_ENV_FILE || '/etc/ycp-mail-relay.env';
const env = Object.fromEntries(
  fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)
    .filter((l) => /^\s*[A-Z_]+\s*=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const BREVO_API_KEY = env.BREVO_API_KEY;
const RELAY_SECRET = env.RELAY_SECRET;
const PORT = Number(env.PORT || 3917);
if (!BREVO_API_KEY || !RELAY_SECRET || RELAY_SECRET.length < 32) {
  console.error('[mail-relay] faltan BREVO_API_KEY o RELAY_SECRET (>= 32 caracteres) en', ENV_FILE);
  process.exit(1);
}

const ALLOWED_PATHS = new Set(['/smtp/email', '/contacts/doubleOptinConfirmation']);
const SENDER_RE = /^[^\s@]+@yourcvpassport\.com$/i;
const MAX_BODY = 512 * 1024;
const RATE_PER_MIN = 120;
let windowStart = Date.now();
let windowCount = 0;

const secretBuf = Buffer.from(RELAY_SECRET);
function authorized(header) {
  const token = String(header || '').replace(/^Bearer\s+/i, '');
  const buf = Buffer.from(token);
  return buf.length === secretBuf.length && timingSafeEqual(buf, secretBuf);
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const t0 = Date.now();
  if (req.method !== 'POST') return send(res, 405, { code: 'method_not_allowed' });
  if (!authorized(req.headers.authorization)) return send(res, 401, { code: 'relay_unauthorized' });

  if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); windowCount = 0; }
  if (++windowCount > RATE_PER_MIN) return send(res, 429, { code: 'relay_rate_limited' });

  const chunks = [];
  let size = 0;
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) { send(res, 413, { code: 'relay_payload_too_large' }); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', async () => {
    if (res.writableEnded) return;
    let path, payload;
    try {
      ({ path, payload } = JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch {
      return send(res, 400, { code: 'relay_invalid_json' });
    }
    if (!ALLOWED_PATHS.has(path) || !payload || typeof payload !== 'object') {
      return send(res, 400, { code: 'relay_path_not_allowed' });
    }
    if (path === '/smtp/email' && !SENDER_RE.test(String(payload?.sender?.email || ''))) {
      return send(res, 400, { code: 'relay_sender_not_allowed' });
    }
    try {
      const r = await fetch(`https://api.brevo.com/v3${path}`, {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      console.log(`[mail-relay] ${path} -> ${r.status} (${Date.now() - t0} ms)`);
      res.writeHead(r.status, { 'content-type': 'application/json' });
      res.end(text || '{}');
    } catch (err) {
      console.log(`[mail-relay] ${path} -> error ${err?.name} (${Date.now() - t0} ms)`);
      send(res, 502, { code: 'relay_upstream_error' });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`[mail-relay] escuchando en 127.0.0.1:${PORT}`));
