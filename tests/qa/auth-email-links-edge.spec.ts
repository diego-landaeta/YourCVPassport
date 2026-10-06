/**
 * Issue #244 del CRM: los correos de auth no deben mostrar Supabase ni
 * <proyecto>.supabase.co. Se ejecutan de verdad las Edge Functions que mandan
 * enlaces (signup, send-password-reset, send-magic-link, send-email-confirmation):
 *
 * - se compilan con esbuild sustituyendo `serve` (Deno std), supabase-js y Upstash
 *   por stubs; generateLink devuelve hashed_token, verification_type y un
 *   action_link con supabase.co;
 * - `_shared/email.ts` se ejecuta tal cual con un fetch falso que captura el
 *   payload de Brevo (nunca sale nada a la red; la API key es inventada).
 *
 * Se comprueba:
 * - el HTML y el asunto del correo no contienen "supabase" (sin distinguir
 *   mayúsculas) y el remitente es "YourCVPassport";
 * - el enlace es <origen permitido>/<path>?token_hash=…&type=…;
 * - un redirectTo de otro dominio se ignora;
 * - sin hashed_token (GoTrue antiguo) se usa action_link como respaldo.
 *
 * Solo Node: corre en el proyecto chromium y se salta en el resto.
 *   QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/auth-email-links-edge.spec.ts
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const FAKE_PROJECT = 'https://abcdefghijklmnop.supabase.co';
const HASHED_TOKEN = 'a1b2c3d4e5f6+/=hash';
const ENV: Record<string, string> = {
  SUPABASE_URL: FAKE_PROJECT,
  SUPABASE_SERVICE_ROLE_KEY: 'clave-falsa-de-test',
  BREVO_API_KEY: 'clave-brevo-falsa-de-test',
};

type FnName = 'signup' | 'send-password-reset' | 'send-magic-link' | 'send-email-confirmation';

interface FnCase {
  name: FnName;
  path: '/confirm' | '/recovery' | '/callback';
  linkType: string;
  body: (redirectTo: string) => Record<string, unknown>;
}

const FUNCTIONS: FnCase[] = [
  { name: 'signup', path: '/confirm', linkType: 'signup', body: (redirectTo) => ({ email: 'Ana@Example.test', password: 'Prueba1234', full_name: 'Ana <b>QA</b>', redirectTo }) },
  { name: 'send-password-reset', path: '/recovery', linkType: 'recovery', body: (redirectTo) => ({ email: 'ana@example.test', redirectTo }) },
  { name: 'send-magic-link', path: '/callback', linkType: 'magiclink', body: (redirectTo) => ({ email: 'ana@example.test', redirectTo }) },
  { name: 'send-email-confirmation', path: '/confirm', linkType: 'signup', body: (redirectTo) => ({ email: 'ana@example.test', userId: '00000000-0000-4000-8000-000000000001', redirectTo }) },
];

// Estado compartido con los stubs (globalThis, porque el bundle es otro módulo).
interface StubState {
  /** false: generateLink no devuelve hashed_token (GoTrue antiguo). */
  withHashedToken: boolean;
  generateLinkCalls: any[];
  brevoPayloads: any[];
  externalFetches: string[];
}
const g = globalThis as any;

/** Compila la función con stubs y devuelve su handler. */
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
        // Upstash no se usa (sin UPSTASH_* el rate limit hace fail open).
        b.onLoad({ filter: /^upstash$/, namespace: 'stub' }, () => ({
          contents: 'export class Redis {}; export class Ratelimit { static slidingWindow() { return {}; } }',
          loader: 'js',
        }));
        b.onLoad({ filter: /^supabase$/, namespace: 'stub' }, () => ({
          contents: `export function createClient() {
            const st = globalThis.__authLinkStub;
            const user = { id: '00000000-0000-4000-8000-000000000001', email: 'ana@example.test' };
            const profile = { data: { full_name: 'Ana Pérez' }, error: null };
            const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => profile, single: async () => profile };
            return {
              from: () => chain,
              auth: { admin: {
                createUser: async () => ({ data: { user }, error: null }),
                deleteUser: async () => ({ data: {}, error: null }),
                generateLink: async (params) => {
                  st.generateLinkCalls.push(params);
                  const redirect = params.options && params.options.redirectTo;
                  const properties = {
                    action_link: '${FAKE_PROJECT}/auth/v1/verify?token=123456&type=' + params.type + '&redirect_to=' + encodeURIComponent(redirect || ''),
                    email_otp: '123456',
                    redirect_to: redirect,
                    verification_type: params.type,
                  };
                  if (st.withHashedToken) properties.hashed_token = '${HASHED_TOKEN}';
                  return { data: { user, properties }, error: null };
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

async function call(handler: (req: Request) => Promise<Response>, fnCase: FnCase, opts: { origin?: string; redirectTo: string }) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.origin) headers.origin = opts.origin;
  const res = await handler(new Request(`https://edge.example.test/functions/v1/${fnCase.name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fnCase.body(opts.redirectTo)),
  }));
  const st: StubState = g.__authLinkStub;
  const payload = st.brevoPayloads.at(-1);
  const html: string = payload?.htmlContent ?? '';
  const href = html.match(/<a href="([^"]+)"/)?.[1] ?? '';
  return { status: res.status, body: await res.json().catch(() => null), payload, html, href };
}

let originalFetch: typeof fetch;
let originalDeno: unknown;

test.beforeAll(() => {
  originalFetch = globalThis.fetch;
  originalDeno = g.Deno;
  g.Deno = { env: { get: (k: string) => ENV[k] } };
  // fetch falso: solo responde a Brevo (captura el payload). Cualquier otra URL
  // se registra y falla, para detectar llamadas a la red.
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input.url;
    const st: StubState = g.__authLinkStub;
    if (url === 'https://api.brevo.com/v3/smtp/email') {
      st.brevoPayloads.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ messageId: '<qa@brevo>' }), { status: 201, headers: { 'content-type': 'application/json' } });
    }
    st.externalFetches.push(url);
    throw new TypeError('red deshabilitada en el test');
  }) as typeof fetch;
});

test.afterAll(() => {
  globalThis.fetch = originalFetch;
  g.Deno = originalDeno;
  delete g.__authLinkStub;
  delete g.__edgeHandler;
});

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Edge Functions en Node: basta con un proyecto');
  g.__authLinkStub = { withHashedToken: true, generateLinkCalls: [], brevoPayloads: [], externalFetches: [] } satisfies StubState;
});

test.describe.configure({ mode: 'serial' });

for (const fnCase of FUNCTIONS) {
  test.describe(`Edge Function ${fnCase.name}`, () => {
    const expectedLink = (origin: string) =>
      `${origin}${fnCase.path}?token_hash=${encodeURIComponent(HASHED_TOKEN)}&type=${fnCase.linkType}`;

    test('enlace con el dominio propio y correo sin "supabase"', async ({}, testInfo) => {
      const handler = await loadHandler(fnCase.name, testInfo.outputPath());
      const r = await call(handler, fnCase, { origin: 'https://yourcvpassport.com', redirectTo: `https://yourcvpassport.com${fnCase.path}` });

      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.payload, 'se envía un correo por Brevo').toBeTruthy();
      expect(r.href).toBe(expectedLink('https://yourcvpassport.com'));
      expect(r.html).not.toMatch(/supabase/i);
      expect(r.payload.subject).not.toMatch(/supabase/i);
      expect(r.payload.sender?.name).toBe('YourCVPassport');
      expect(JSON.stringify(r.payload)).not.toMatch(/supabase/i);
      // generateLink recibe el destino validado (lo usa el respaldo action_link).
      const st: StubState = g.__authLinkStub;
      expect(st.generateLinkCalls.at(-1)?.options?.redirectTo).toBe(`https://yourcvpassport.com${fnCase.path}`);
      expect(st.externalFetches).toEqual([]);
    });

    test('un redirectTo de otro dominio se ignora', async ({}, testInfo) => {
      const handler = await loadHandler(fnCase.name, testInfo.outputPath());

      // Con Origin permitido: se usa ese origen.
      const a = await call(handler, fnCase, { origin: 'https://yourcvpassport.com', redirectTo: `https://evil.example${fnCase.path}` });
      expect(a.status, JSON.stringify(a.body)).toBe(200);
      expect(a.href).toBe(expectedLink('https://yourcvpassport.com'));
      expect(a.html).not.toContain('evil.example');

      // Origen local permitido (desarrollo): se respeta.
      const b = await call(handler, fnCase, { origin: 'http://localhost:5440', redirectTo: `https://evil.example${fnCase.path}?x=1` });
      expect(b.href).toBe(expectedLink('http://localhost:5440'));

      // Sin Origin ni redirectTo válido: dominio principal (nunca localhost).
      const c = await call(handler, fnCase, { redirectTo: 'https://evil.example/otra' });
      expect(c.href).toBe(expectedLink('https://www.yourcvpassport.com'));
      expect(c.html).not.toMatch(/localhost|evil\.example|supabase/i);
    });

    test('sin hashed_token (GoTrue antiguo) se usa action_link como respaldo', async ({}, testInfo) => {
      const handler = await loadHandler(fnCase.name, testInfo.outputPath());
      g.__authLinkStub.withHashedToken = false;
      const r = await call(handler, fnCase, { origin: 'https://yourcvpassport.com', redirectTo: `https://yourcvpassport.com${fnCase.path}` });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.href.startsWith(`${FAKE_PROJECT}/auth/v1/verify?`)).toBe(true);
      expect(new URL(r.href).searchParams.get('redirect_to')).toBe(`https://yourcvpassport.com${fnCase.path}`);
    });
  });
}
