/**
 * Edge Function send-auth-email (Send Email Hook de Supabase Auth).
 *
 * Se ejecuta la función de verdad (esbuild + Deno.serve/env falsos) con
 * `_shared/email.ts` real y un fetch falso que imita a Brevo. Se comprueba:
 * - firma Standard Webhooks: sin firma, firma mala o caducada → 401;
 * - cada tipo de correo sale con la plantilla y el enlace del dominio propio;
 * - cambio de email seguro: la dirección ACTUAL recibe token_hash_new y la
 *   NUEVA token_hash (nombres invertidos en Supabase);
 * - reautenticación lleva el código; avisos *_notification; Brevo caído → 500.
 *
 * Solo Node: corre en el proyecto chromium y se salta en el resto.
 *   QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/send-auth-email-edge.spec.ts
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const KEY = crypto.randomBytes(32);
const SECRET = `v1,whsec_${KEY.toString('base64')}`;
const ENV: Record<string, string> = { SEND_EMAIL_HOOK_SECRET: SECRET, BREVO_API_KEY: 'clave-falsa-de-test' };
const g = globalThis as any;

test.describe.configure({ mode: 'serial' });

interface State { brevo: any[]; brevoDown: boolean }
const st = (): State => g.__authHookState;

let handler: (req: Request) => Promise<Response>;
let originalFetch: typeof fetch;
let originalDeno: unknown;

test.beforeAll(async ({}, testInfo) => {
  originalFetch = globalThis.fetch;
  originalDeno = g.Deno;
  g.Deno = { env: { get: (k: string) => ENV[k] }, serve: (h: any) => { g.__authHookHandler = h; } };
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://api.brevo.com/v3/smtp/email') {
      if (st().brevoDown) return new Response('{"code":"internal_error"}', { status: 500 });
      st().brevo.push(JSON.parse(init.body));
      return new Response('{"messageId":"<qa@brevo>"}', { status: 201 });
    }
    throw new TypeError('red deshabilitada en el test: ' + url);
  }) as typeof fetch;
  // Un archivo por proceso: con varios a la vez, uno podía importar el bundle a medio escribir.
  const outfile = path.join(testInfo.project.outputDir, `send-auth-email-${testInfo.workerIndex}-${Date.now()}.mjs`);
  await build({ entryPoints: [path.join(ROOT, 'supabase', 'functions', 'send-auth-email', 'index.ts')], bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent' });
  await import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
  handler = g.__authHookHandler;
});

test.afterAll(() => {
  globalThis.fetch = originalFetch;
  g.Deno = originalDeno;
});

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Edge Function en Node: basta con un proyecto');
  g.__authHookState = { brevo: [], brevoDown: false } satisfies State;
});

function signed(payload: unknown, opts: { badSig?: boolean; ageSeconds?: number } = {}) {
  const body = JSON.stringify(payload);
  const id = 'msg_' + crypto.randomBytes(6).toString('hex');
  const ts = String(Math.floor(Date.now() / 1000) - (opts.ageSeconds ?? 0));
  const sig = crypto.createHmac('sha256', opts.badSig ? crypto.randomBytes(32) : KEY).update(`${id}.${ts}.${body}`).digest('base64');
  return new Request('https://edge.example.test/functions/v1/send-auth-email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${sig}` },
    body,
  });
}

const user = { email: 'ana@example.test', user_metadata: { full_name: 'Ana Pérez' } };
const hrefOf = (html: string) => (html.match(/<a href="(https:\/\/yourcvpassport\.com\/[^"]+)"[^>]*>(?!YourCVPassport)/)?.[1] ?? '').replace(/&amp;/g, '&');

test('firma: sin cabeceras, firma mala o caducada → 401 y ningún correo', async () => {
  const payload = { user, email_data: { email_action_type: 'signup', token_hash: 'h1' } };
  const unsigned = new Request('https://x.test', { method: 'POST', body: JSON.stringify(payload) });
  expect((await handler(unsigned)).status).toBe(401);
  expect((await handler(signed(payload, { badSig: true }))).status).toBe(401);
  expect((await handler(signed(payload, { ageSeconds: 600 }))).status).toBe(401);
  expect(st().brevo).toHaveLength(0);
});

for (const [type, path, subject] of [
  ['signup', '/confirm', 'Confirma tu correo'],
  ['recovery', '/recovery', 'Restablece tu contraseña'],
  ['magiclink', '/callback', 'enlace de acceso'],
  ['invite', '/confirm', 'invitado'],
] as const) {
  test(`${type}: plantilla de la marca y enlace ${path}?token_hash=…&type=${type}`, async () => {
    const res = await handler(signed({ user, email_data: { email_action_type: type, token_hash: 'hash-' + type, token: '123456' } }));
    expect(res.status).toBe(200);
    // Supabase Auth rechaza la respuesta sin Content-Type JSON (visto en producción).
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(st().brevo).toHaveLength(1);
    const mail = st().brevo[0];
    expect(mail.to).toEqual([{ email: 'ana@example.test' }]);
    expect(mail.subject).toContain(subject);
    expect(mail.sender.name).toBe('YourCVPassport');
    expect(hrefOf(mail.htmlContent)).toBe(`https://yourcvpassport.com${path}?token_hash=hash-${type}&type=${type}`);
    expect(JSON.stringify(mail)).not.toMatch(/supabase/i);
  });
}

test('email_change seguro: actual ← token_hash_new, nueva ← token_hash', async () => {
  const res = await handler(signed({
    user: { ...user, new_email: 'nueva@example.test' },
    email_data: { email_action_type: 'email_change', token_hash: 'PARA-LA-NUEVA', token_hash_new: 'PARA-LA-ACTUAL', token: '1', token_new: '2' },
  }));
  expect(res.status).toBe(200);
  expect(st().brevo).toHaveLength(2);
  const byTo = Object.fromEntries(st().brevo.map((m) => [m.to[0].email, m]));
  expect(hrefOf(byTo['ana@example.test'].htmlContent)).toContain('token_hash=PARA-LA-ACTUAL&type=email_change');
  expect(byTo['ana@example.test'].htmlContent).toContain('nueva@example.test');
  expect(hrefOf(byTo['nueva@example.test'].htmlContent)).toContain('token_hash=PARA-LA-NUEVA&type=email_change');
});

test('email_change sin modo seguro: un solo correo a la dirección nueva', async () => {
  const res = await handler(signed({ user: { ...user, new_email: 'nueva@example.test' }, email_data: { email_action_type: 'email_change', token_hash: 'h' } }));
  expect(res.status).toBe(200);
  expect(st().brevo.map((m) => m.to[0].email)).toEqual(['nueva@example.test']);
});

test('reauthentication: código en el correo; aviso de contraseña cambiada', async () => {
  expect((await handler(signed({ user, email_data: { email_action_type: 'reauthentication', token: '482915' } }))).status).toBe(200);
  expect(st().brevo[0].subject).toContain('482915');
  expect((await handler(signed({ user, email_data: { email_action_type: 'password_changed_notification' } }))).status).toBe(200);
  expect(st().brevo[1].subject).toBe('Tu contraseña se ha cambiado');
});

test('Brevo caído → 500 con { error } (Auth lo muestra como fallo)', async () => {
  st().brevoDown = true;
  const res = await handler(signed({ user, email_data: { email_action_type: 'recovery', token_hash: 'h' } }));
  expect(res.status).toBe(500);
  expect((await res.json()).error.message).toBe('Could not send email');
});
