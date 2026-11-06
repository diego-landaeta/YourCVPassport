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
 * - signup (bolsa de empleo, #6): edad mínima de 16 años, tipo de cuenta (solo "empresa"
 *   exacto sale del camino de candidato), casillas obligatorias, idioma y texto del correo de
 *   confirmación (candidato / empresa, es / en);
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
  /** La tabla documentos_legales no se puede leer (signup sigue). */
  docsDown: boolean;
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
            // documentos_legales: versiones vigentes que lee signup (select().in().lte().order()).
            const docs = [
              { tipo: 'terminos_candidato', version: '2.0-en', idioma: 'en', vigente_desde: '2026-10-01T00:00:00Z' },
              { tipo: 'terminos_candidato', version: '1.0', idioma: 'es', vigente_desde: '2026-09-01T00:00:00Z' },
              { tipo: 'privacidad', version: '1.0', idioma: 'es', vigente_desde: '2026-09-01T00:00:00Z' },
            ];
            const docsChain = {
              select: () => docsChain, in: () => docsChain, lte: () => docsChain, order: () => docsChain,
              then: (resolve) => resolve(st.docsDown ? { data: null, error: { message: 'relation "documentos_legales" does not exist' } } : { data: docs, error: null }),
            };
            const authError = (status, code, message) => ({ data: { user: null, properties: null }, error: { status, code, message } });
            return {
              from: (table) => (table === 'documentos_legales' ? docsChain : chain),
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

/** Casillas obligatorias del candidato (contrato de 20261029_legal_aceptaciones_idioma.sql). */
const CASILLAS = { acepto_condiciones_privacidad: true, datos_verdaderos: true };

/** Fecha AAAA-MM-DD de alguien que hoy (UTC) tiene `years` años cumplidos hoy, más `plusDays` días de nacido después. */
function birthDate(years: number, plusDays = 0): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));
  if (d.getUTCDate() !== now.getUTCDate()) d.setUTCDate(0); // 29 de febrero -> 28
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d.toISOString().slice(0, 10);
}

/** Alta de CANDIDATO válida (adulto, casillas obligatorias). `over` sobrescribe campos. */
const signupBody = (email = 'Ana@Example.test', over: Record<string, unknown> = {}) => ({
  email, password: 'Prueba1234', full_name: 'Nombre <b>Nuevo</b>', redirectTo: 'https://yourcvpassport.com/confirm',
  fecha_nacimiento: '1995-05-20', casillas: CASILLAS, ...over,
});
/** Alta de EMPRESA: sin fecha de nacimiento ni casillas de candidato. */
const companyBody = (over: Record<string, unknown> = {}) => ({
  email: 'rrhh@acme.test', password: 'Prueba1234', full_name: 'Nombre <b>Nuevo</b>', redirectTo: 'https://yourcvpassport.com/confirm',
  tipo: 'empresa', ...over,
});
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
    account: 'none', generateLinkDown: false, brevoDown: false, rateLimit: false, docsDown: false,
    calls: { createUser: [], deleteUser: [], updateUserById: [], generateLink: [] },
    brevoPayloads: [], externalFetches: [], hits: {},
  } satisfies StubState;
});

test.afterEach(({}, testInfo) => {
  // En los demás proyectos el test se salta en beforeEach y no hay estado que revisar.
  if (testInfo.project.name !== 'chromium') return;
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

// ---------------------------------------------------------------------------
// Bolsa de empleo (#6): edad, tipo de cuenta, casillas, idioma y texto del correo.
// La lógica pura está probada también en Node (supabase/functions/signup/validation.test.mjs
// y _shared/signupConfirmEmail.test.mjs); aquí se comprueba la función COMPLETA.
// ---------------------------------------------------------------------------
test.describe('signup: edad, tipo de cuenta y casillas', () => {
  /** Estado tras un rechazo: 400, ninguna cuenta creada y ningún correo. */
  const expectRejected = (r: { status: number; body: any }, re: RegExp) => {
    expect(r.status, JSON.stringify(r.body)).toBe(400);
    expect(r.body.code).toBe('INVALID_INPUT');
    expect(r.body.error).toMatch(re);
    expect(st().calls.createUser, 'no se crea la cuenta').toEqual([]);
    expect(st().brevoPayloads, 'no sale ningún correo').toEqual([]);
  };

  test('candidato sin fecha_nacimiento: 400 y no se crea la cuenta', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const { fecha_nacimiento: _omit, ...sinFecha } = signupBody();
    expectRejected(await post(handler, 'signup', sinFecha), /fecha_nacimiento/);
  });

  test('fecha de nacimiento mal formada, imposible o futura: 400', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    for (const fecha of ['', '20-05-1995', '1995-02-31', '2999-01-01', 19950520, null]) {
      expectRejected(await post(handler, 'signup', { ...signupBody(), fecha_nacimiento: fecha }), /fecha_nacimiento/);
    }
  });

  test('menor de 16 años: 400 UNDERAGE; el día antes de cumplirlos también', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    expectRejected(await post(handler, 'signup', signupBody('ana@example.test', { fecha_nacimiento: birthDate(12) })), /UNDERAGE/);
    // 15 años y 364 días: cumple los 16 mañana.
    expectRejected(await post(handler, 'signup', signupBody('ana@example.test', { fecha_nacimiento: birthDate(16, 1) })), /UNDERAGE/);
  });

  test('16 años recién cumplidos: exige la autorización de tutores; con ella, 200', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const sixteen = birthDate(16);
    const sinTutores = await post(handler, 'signup', signupBody('ana@example.test', { fecha_nacimiento: sixteen }));
    expectRejected(sinTutores, /CASILLA_OBLIGATORIA: autorizacion_tutores/);
    const conTutores = await post(handler, 'signup', signupBody('ana@example.test', { fecha_nacimiento: sixteen, casillas: { ...CASILLAS, autorizacion_tutores: true } }));
    expect(conTutores.status, JSON.stringify(conTutores.body)).toBe(200);
    expect(st().calls.createUser[0].app_metadata.registro_aceptacion.casillas.autorizacion_tutores).toBe(true);
  });

  test('casillas ausentes o sin las obligatorias: 400 con el nombre de la casilla', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const { casillas: _omit, ...sinCasillas } = signupBody();
    expectRejected(await post(handler, 'signup', sinCasillas), /casillas is required/);
    for (const bad of ['si', [], 7]) {
      expectRejected(await post(handler, 'signup', { ...signupBody(), casillas: bad }), /casillas is required/);
    }
    expectRejected(await post(handler, 'signup', signupBody('ana@example.test', { casillas: { datos_verdaderos: true } })), /CASILLA_OBLIGATORIA: acepto_condiciones_privacidad/);
    expectRejected(await post(handler, 'signup', signupBody('ana@example.test', { casillas: { acepto_condiciones_privacidad: true } })), /CASILLA_OBLIGATORIA: datos_verdaderos/);
    // Solo vale `true` booleano: "true" como texto no cuenta.
    expectRejected(await post(handler, 'signup', signupBody('ana@example.test', { casillas: { acepto_condiciones_privacidad: 'true', datos_verdaderos: true } })), /CASILLA_OBLIGATORIA/);
  });

  test('tipo desconocido o raro = candidato: no esquiva la edad ni las casillas', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    for (const tipo of ['company', 'Empresa', 'EMPRESA', '', null, 5, ['empresa'], { tipo: 'empresa' }]) {
      const { fecha_nacimiento: _f, casillas: _c, ...bare } = signupBody();
      expectRejected(await post(handler, 'signup', { ...bare, tipo }), /fecha_nacimiento/);
      expectRejected(await post(handler, 'signup', { ...bare, tipo, fecha_nacimiento: birthDate(12), casillas: CASILLAS }), /UNDERAGE/);
      expectRejected(await post(handler, 'signup', { ...bare, tipo, fecha_nacimiento: '1995-05-20' }), /casillas is required/);
    }
  });

  test('tipo desconocido con datos válidos se registra como candidato (metadatos y correo de candidato)', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const r = await post(handler, 'signup', signupBody('ana@example.test', { tipo: 'company' }));
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const created = st().calls.createUser[0];
    expect(created.user_metadata.tipo).toBe('candidato');
    expect(created.app_metadata.registro_aceptacion.tipo).toBe('candidato');
    expect(st().brevoPayloads[0].subject).toBe('Confirma tu correo para activar tu cuenta');
  });

  test('candidato válido: metadatos (idioma, fecha), casillas y versiones vigentes en app_metadata', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const before = Date.now();
    const r = await post(handler, 'signup', signupBody('ana@example.test', {
      registro_idioma: 'en',
      casillas: { ...CASILLAS, perfil_publico: true, alertas_novedades: true, inventada: true },
    }));
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const created = st().calls.createUser[0];
    expect(created.user_metadata).toMatchObject({ tipo: 'candidato', registro_idioma: 'en', fecha_nacimiento: '1995-05-20' });
    const reg = created.app_metadata.registro_aceptacion;
    expect(reg.casillas).toMatchObject({ acepto_condiciones_privacidad: true, datos_verdaderos: true, perfil_publico: true, alertas_novedades: true, aparecer_google: false, empresas_contacto: false });
    expect(reg.casillas).not.toHaveProperty('inventada');
    // Versiones leídas por el SERVIDOR (en inglés cuando existe, si no la española).
    expect(reg.versiones).toEqual({ terminos_candidato: '2.0-en', privacidad: '1.0' });
    // Hora declarada por el servidor: ISO UTC y de ahora.
    expect(reg.aceptado_en).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const at = Date.parse(reg.aceptado_en);
    expect(at).toBeGreaterThanOrEqual(before - 1000);
    expect(at).toBeLessThanOrEqual(Date.now() + 1000);
  });

  test('si no se pueden leer las versiones vigentes, el alta sigue (LegalGate lo pedirá después)', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    st().docsDown = true;
    const r = await post(handler, 'signup', signupBody());
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(st().calls.createUser[0].app_metadata.registro_aceptacion.versiones).toEqual({});
  });

  test('empresa sin fecha ni casillas: 200, tipo empresa, sin registro_aceptacion de candidato', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const r = await post(handler, 'signup', companyBody());
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toEqual({ success: true, emailSent: true, alreadyPending: false });
    const created = st().calls.createUser[0];
    expect(created.user_metadata.tipo).toBe('empresa');
    expect(created.user_metadata).not.toHaveProperty('fecha_nacimiento');
    expect(created).not.toHaveProperty('app_metadata');
  });

  test('empresa con una fecha de nacimiento de menor de 16: se valida igual y se rechaza', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    expectRejected(await post(handler, 'signup', companyBody({ fecha_nacimiento: birthDate(12) })), /UNDERAGE/);
    expectRejected(await post(handler, 'signup', companyBody({ fecha_nacimiento: 'ayer' })), /fecha_nacimiento/);
  });

  test('correo de EMPRESA en español: asunto, saludo, botón y siguiente paso de empresa', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const r = await post(handler, 'signup', companyBody({ registro_idioma: 'es' }));
    expect(r.status).toBe(200);
    const mail = st().brevoPayloads[0];
    expect(mail.subject).toBe('Confirma tu correo para completar el registro de tu empresa');
    expect(mail.htmlContent).toContain('lang="es"');
    expect(mail.htmlContent).toContain('Hola, Nombre &lt;b&gt;Nuevo&lt;/b&gt;:');
    expect(mail.textContent).toContain('Confirmar mi correo');
    expect(mail.textContent).toContain('completa el registro de tu empresa');
    expect(mail.htmlContent).toContain('/confirm?token_hash=hash-de-test&amp;type=signup');
    // Nada del correo de candidato.
    expect(mail.textContent).not.toContain('plantillas profesionales');
  });

  test('correo de EMPRESA en inglés (registro_idioma en): todo el texto en inglés', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    const r = await post(handler, 'signup', companyBody({ registro_idioma: 'en-GB', full_name: 'Ana' }));
    expect(r.status).toBe(200);
    expect(st().calls.createUser[0].user_metadata.registro_idioma).toBe('en');
    const mail = st().brevoPayloads[0];
    expect(mail.subject).toBe('Confirm your email to complete your company registration');
    expect(mail.htmlContent).toContain('lang="en"');
    expect(mail.textContent).toContain('Hi Ana,');
    expect(mail.textContent).toContain('Confirm my email');
    expect(mail.textContent).not.toMatch(/Hola|Confirmar|empresa|Un saludo/);
  });

  test('correo de CANDIDATO en inglés; con idioma ausente o raro, en español', async ({}, testInfo) => {
    const handler = await loadHandler('signup', testInfo.outputPath());
    st().account = 'none';
    expect((await post(handler, 'signup', signupBody('en@example.test', { registro_idioma: 'en' }))).status).toBe(200);
    expect(st().brevoPayloads[0].subject).toBe('Confirm your email to activate your account');
    expect(st().brevoPayloads[0].textContent).not.toMatch(/Hola|Confirmar|Un saludo/);
    for (const [i, idioma] of [undefined, '<script>', 'english', 5].entries()) {
      st().account = 'none'; // cada alta es una cuenta nueva
      expect((await post(handler, 'signup', signupBody(`es${i}@example.test`, { registro_idioma: idioma }))).status).toBe(200);
      expect(st().brevoPayloads.at(-1).subject).toBe('Confirma tu correo para activar tu cuenta');
    }
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
