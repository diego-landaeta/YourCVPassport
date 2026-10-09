/**
 * Issue #3: si el correo de confirmación falla, la cuenta no se pierde.
 * Se ejecutan de verdad las Edge Functions `signup` y `send-email-confirmation`
 * ("Reenviar correo de confirmación"), con el mismo montaje que
 * auth-email-links-edge.spec.ts:
 *
 * - esbuild sustituye `serve` (Deno std), supabase-js y Upstash por stubs
 *   configurables (createUser / generateLink / límite de Upstash);
 * - `_shared/email.ts` se ejecuta tal cual con un fetch falso que imita a Brevo
 *   (nunca sale nada a la red; la API key es inventada).
 *
 * Se comprueba:
 * - signup: Brevo caído o generateLink caído → 200 emailSent:false y NO se
 *   borra el usuario (antes: rollback + 502);
 * - signup con email de una cuenta pendiente → se reenvía el enlace, sin crear
 *   otra cuenta ni cambiar su password; con cuenta confirmada → 409;
 * - send-email-confirmation: solo envía a cuentas pendientes, responde igual si
 *   la cuenta no existe o ya está confirmada, ignora `userId` del cuerpo;
 * - límite por email (3 cada 15 min) compartido entre las dos funciones.
 *
 * Solo Node: corre en el proyecto chromium y se salta en el resto.
 *   QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/signup-pendiente-edge.spec.ts
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const ENV: Record<string, string> = {
  SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'clave-falsa-de-test',
  BREVO_API_KEY: 'clave-brevo-falsa-de-test',
};

type FnName = 'signup' | 'send-email-confirmation';

/** Comportamiento de GoTrue para el email del test. */
type Account = 'none' | 'pending' | 'confirmed';

interface StubState {
  account: Account;
  /** generateLink falla con un error genérico (GoTrue caído). */
  generateLinkDown: boolean;
  /** Brevo responde 500. */
  brevoDown: boolean;
  /** Upstash activo (límite real del stub) o fail open. */
  rateLimit: boolean;
  calls: { createUser: any[]; deleteUser: any[]; updateUserById: any[]; generateLink: any[] };
  brevoPayloads: any[];
  externalFetches: string[];
  /** Contador del Ratelimit falso: `${prefix}:${identifier}` → peticiones. */
  hits: Record<string, number>;
}
const g = globalThis as any;
const st = (): StubState => g.__pendingStub;

async function loadHandler(fn: FnName, outDir: string): Promise<(req: Request) => Promise<Response>> {
  const outfile = path.join(outDir, `${fn}.mjs`);
  await build({
    entryPoints: [path.join(ROOT, 'supabase', 'functions', fn, 'index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    plugins: [{
      name: 'stubs-deno',
      setup(b) {
        b.onResolve({ filter: /^https:\/\/deno\.land\/std@[^/]+\/http\/server\.ts$/ }, () => ({ path: 'serve', namespace: 'stub' }));
        b.onResolve({ filter: /^https:\/\/esm\.sh\/@supabase\/supabase-js/ }, () => ({ path: 'supabase', namespace: 'stub' }));
        b.onResolve({ filter: /^https:\/\/esm\.sh\/@upstash\// }, () => ({ path: 'upstash', namespace: 'stub' }));
        b.onLoad({ filter: /^serve$/, namespace: 'stub' }, () => ({
          contents: 'export function serve(handler) { globalThis.__edgeHandler = handler; }',
          loader: 'js',
        }));
        // Ratelimit falso: ventana fija en memoria con el mismo número de
        // peticiones que la config real.
        b.onLoad({ filter: /^upstash$/, namespace: 'stub' }, () => ({
          contents: `export class Redis { constructor() {} }
            export class Ratelimit {
              constructor(opts) { this.max = opts.limiter.max; this.prefix = opts.prefix; }
              static slidingWindow(max) { return { max }; }
              async limit(id) {
                const hits = globalThis.__pendingStub.hits;
                const key = this.prefix + ':' + id;
                hits[key] = (hits[key] || 0) + 1;
                return { success: hits[key] <= this.max, limit: this.max, remaining: Math.max(0, this.max - hits[key]), reset: Date.now() + 60000 };
              }
            }`,
          loader: 'js',
        }));
        b.onLoad({ filter: /^supabase$/, namespace: 'stub' }, () => ({
          contents: `export function createClient() {
            const st = globalThis.__pendingStub;
            const user = { id: '00000000-0000-4000-8000-0000000000aa', email: 'ana@example.test' };
            const profile = { data: { full_name: 'Ana Guardada' }, error: null };
            const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => profile, single: async () => profile };
            const authError = (status, code, message) => ({ data: { user: null, properties: null }, error: { status, code, message } });
            return {
              from: () => chain,
              auth: { admin: {
                createUser: async (params) => {
                  st.calls.createUser.push(params);
                  if (st.account !== 'none') return { data: { user: null }, error: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } };
                  st.account = 'pending';
                  return { data: { user }, error: null };
                },
                deleteUser: async (id) => { st.calls.deleteUser.push(id); return { data: {}, error: null }; },
                updateUserById: async (id, attrs) => { st.calls.updateUserById.push({ id, attrs }); return { data: { user }, error: null }; },
                generateLink: async (params) => {
                  st.calls.generateLink.push(params);
                  if (st.generateLinkDown) return authError(500, 'unexpected_failure', 'Database error');
                  // GoTrue: signup sin password → cuenta confirmada: email_exists;
                  // sin cuenta: validation_failed (no crea usuarios sin password).
                  if (st.account === 'confirmed') return authError(422, 'email_exists', 'A user with this email address has already been registered');
                  if (st.account === 'none' && !params.password) return authError(422, 'validation_failed', 'Signup requires a valid password');
                  const redirect = params.options && params.options.redirectTo;
                  return { data: { user, properties: {
                    action_link: '${ENV.SUPABASE_URL}/auth/v1/verify?token=1&type=signup',
                    hashed_token: 'hash-de-test',
                    redirect_to: redirect,
                    verification_type: 'signup',
                  } }, error: null };
                },
              } },
            };
          }`,
          loader: 'js',
        }));
      },
    }],
  });
  delete g.__edgeHandler;
  await import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
  const handler = g.__edgeHandler;
  expect(typeof handler, `${fn} registra su handler con serve()`).toBe('function');
  return handler;
}

async function post(handler: (req: Request) => Promise<Response>, fn: FnName, body: Record<string, unknown>, ip = '203.0.113.7') {
  const res = await handler(new Request(`https://edge.example.test/functions/v1/${fn}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://yourcvpassport.com', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  }));
  return { status: res.status, body: await res.json().catch(() => null) };
}

const signupBody = (email = 'Ana@Example.test') => ({ email, password: 'Prueba1234', full_name: 'Nombre <b>Nuevo</b>', redirectTo: 'https://yourcvpassport.com/confirm' });
const resendBody = (email = 'ana@example.test') => ({ email, redirectTo: 'https://yourcvpassport.com/confirm' });

let originalFetch: typeof fetch;
let originalDeno: unknown;

test.beforeAll(() => {
  originalFetch = globalThis.fetch;
  originalDeno = g.Deno;
  g.Deno = { env: { get: (k: string) => (k.startsWith('UPSTASH_') ? (st()?.rateLimit ? 'stub' : undefined) : ENV[k]) } };
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://api.brevo.com/v3/smtp/email') {
      if (st().brevoDown) return new Response(JSON.stringify({ code: 'internal_error' }), { status: 500, headers: { 'content-type': 'application/json' } });
      st().brevoPayloads.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ messageId: '<qa@brevo>' }), { status: 201, headers: { 'content-type': 'application/json' } });
    }
    st().externalFetches.push(url);
    throw new TypeError('red deshabilitada en el test');
  }) as typeof fetch;
});

test.afterAll(() => {
  globalThis.fetch = originalFetch;
  g.Deno = originalDeno;
  delete g.__pendingStub;
  delete g.__edgeHandler;
});

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Edge Functions en Node: basta con un proyecto');
  g.__pendingStub = {
    account: 'none', generateLinkDown: false, brevoDown: false, rateLimit: false,
    calls: { createUser: [], deleteUser: [], updateUserById: [], generateLink: [] },
    brevoPayloads: [], externalFetches: [], hits: {},
  } satisfies StubState;
});

test.afterEach(() => {
  expect(st().externalFetches, 'ninguna petición sale a la red').toEqual([]);
});

test.describe.configure({ mode: 'serial' });

test.describe('signup: la cuenta no se pierde', () => {
  test('alta normal: 200 emailSent:true y un correo', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const r = await post(handler, 'signup', signupBody());
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toEqual({ success: true, emailSent: true, alreadyPending: false });
    expect(st().brevoPayloads).toHaveLength(1);
    // El nombre va escapado en el HTML.
    expect(st().brevoPayloads[0].htmlContent).toContain('Nombre &lt;b&gt;Nuevo&lt;/b&gt;');
  });

  test('Brevo caído: 200 emailSent:false y el usuario NO se borra', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    st().brevoDown = true;
    const r = await post(handler, 'signup', signupBody());
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toEqual({ success: true, emailSent: false, alreadyPending: false });
    expect(st().calls.deleteUser).toEqual([]);
    expect(st().account).toBe('pending');
  });

  test('generateLink caído tras crear la cuenta: 200 emailSent:false sin borrar', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    st().generateLinkDown = true;
    const r = await post(handler, 'signup', signupBody());
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.emailSent).toBe(false);
    expect(st().calls.deleteUser).toEqual([]);
    expect(st().brevoPayloads).toEqual([]);
  });

  test('email con cuenta pendiente: reenvía el enlace sin crear otra ni tocar la password', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    st().account = 'pending';
    const r = await post(handler, 'signup', signupBody());
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toEqual({ success: true, emailSent: true, alreadyPending: true });
    expect(st().calls.updateUserById).toEqual([]);
    expect(st().calls.deleteUser).toEqual([]);
    // generateLink sin password: GoTrue no la cambia.
    expect(st().calls.generateLink.at(-1)).not.toHaveProperty('password');
    const html: string = st().brevoPayloads[0].htmlContent;
    expect(html).toContain('/confirm?token_hash=hash-de-test&amp;type=signup');
    // No se saluda con el nombre recién escrito (la cuenta es la de antes).
    expect(html).not.toContain('Nuevo');
  });

  test('email con cuenta confirmada: 409 EMAIL_ALREADY_REGISTERED y ningún correo', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    st().account = 'confirmed';
    const r = await post(handler, 'signup', signupBody());
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('EMAIL_ALREADY_REGISTERED');
    expect(st().brevoPayloads).toEqual([]);
  });
});

test.describe('send-email-confirmation ("Reenviar")', () => {
  test('cuenta pendiente: 200 y correo con enlace del dominio propio', async ({}, testInfo) => {
    const handler = await loadHandler('send-email-confirmation', testInfo.outputPath());
    st().account = 'pending';
    const r = await post(handler, 'send-email-confirmation', resendBody('Ana@Example.TEST'));
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(st().brevoPayloads).toHaveLength(1);
    expect(st().brevoPayloads[0].to).toEqual([{ email: 'ana@example.test' }]);
    expect(st().brevoPayloads[0].htmlContent).toContain('https://yourcvpassport.com/confirm?token_hash=hash-de-test&amp;type=signup');
    // Versión en texto plano con el enlace sin escapar.
    expect(st().brevoPayloads[0].textContent).toContain('https://yourcvpassport.com/confirm?token_hash=hash-de-test&type=signup');
    expect(st().brevoPayloads[0].htmlContent).toContain('Ana Guardada');
  });

  test('sin cuenta o ya confirmada: misma respuesta y ningún correo', async ({}, testInfo) => {
    const handler = await loadHandler('send-email-confirmation', testInfo.outputPath());
    st().account = 'none';
    const a = await post(handler, 'send-email-confirmation', resendBody());
    st().account = 'confirmed';
    const b = await post(handler, 'send-email-confirmation', resendBody());
    st().account = 'pending';
    st().brevoPayloads = [];
    const c = await post(handler, 'send-email-confirmation', resendBody());
    expect(a).toEqual(b);
    expect(c).toEqual(a);
    expect(a.status).toBe(200);
    expect(st().brevoPayloads).toHaveLength(1); // solo el de la cuenta pendiente
    // Nunca crea una cuenta: generateLink va sin password.
    for (const call of st().calls.generateLink) expect(call).not.toHaveProperty('password');
    expect(st().calls.createUser).toEqual([]);
  });

  test('ignora el userId del cuerpo: el destino es solo el email', async ({}, testInfo) => {
    const handler = await loadHandler('send-email-confirmation', testInfo.outputPath());
    st().account = 'pending';
    const r = await post(handler, 'send-email-confirmation', { ...resendBody(), userId: '11111111-1111-4111-8111-111111111111' });
    expect(r.status).toBe(200);
    expect(st().calls.generateLink.at(-1).email).toBe('ana@example.test');
  });

  test('Brevo caído: 502 EMAIL_SEND_FAILED', async ({}, testInfo) => {
    const handler = await loadHandler('send-email-confirmation', testInfo.outputPath());
    st().account = 'pending';
    st().brevoDown = true;
    const r = await post(handler, 'send-email-confirmation', resendBody());
    expect(r.status).toBe(502);
    expect(r.body.code).toBe('EMAIL_SEND_FAILED');
  });

  test('email mal formado: 400 INVALID_INPUT', async ({}, testInfo) => {
    const handler = await loadHandler('send-email-confirmation', testInfo.outputPath());
    const r = await post(handler, 'send-email-confirmation', resendBody('no-es-un-email'));
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_INPUT');
  });
});

test('límite por email compartido: alta + 2 reenvíos y el siguiente da 429 (desde otra IP)', async ({}, testInfo) => {
  const signup = await loadHandler('signup', testInfo.outputPath());
  const resend = await loadHandler('send-email-confirmation', testInfo.outputPath());
  st().rateLimit = true;

  expect((await post(signup, 'signup', signupBody(), '198.51.100.1')).status).toBe(200);
  expect((await post(resend, 'send-email-confirmation', resendBody(), '198.51.100.2')).status).toBe(200);
  expect((await post(resend, 'send-email-confirmation', resendBody(), '198.51.100.3')).status).toBe(200);
  const blocked = await post(resend, 'send-email-confirmation', resendBody(), '198.51.100.4');
  expect(blocked.status).toBe(429);
  expect(blocked.body.code).toBe('RATE_LIMITED');
  expect(st().brevoPayloads).toHaveLength(3);
  // La clave de Upstash lleva el hash, nunca el email en claro.
  expect(Object.keys(st().hits).join(' ')).not.toContain('ana@example.test');
});
