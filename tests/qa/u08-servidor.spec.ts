/**
 * QA del servidor de producción (server.mjs), unidad U8.
 *
 * Arranca server.mjs en un puerto libre con:
 * - un DIST_DIR temporal con el index.html del repo y un asset de prueba (no hace falta build),
 * - una Supabase falsa (servidor HTTP local que imita PostgREST): ninguna petición sale fuera,
 * - TRANSLATE_RATE_LIMIT bajo para provocar el 429.
 *
 * Comprueba: XSS almacenado en el SSR de /cv/:slug (escapado de &, <, >, " y ', patrones
 * "$&"/"$'" de String.replace y avatar_url fuera de la lista blanca), cabeceras de seguridad
 * y caché, ausencia de X-Powered-By, validación y rate limit de /api/translate y sitemap
 * con URLs del apex. Solo corre en el proyecto chromium (no usa navegador).
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u08-servidor.spec.ts --project=chromium
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const RATE_LIMIT = 15; // > nº de peticiones del test de validación
const XSS_NAME = `Eve </title><script>alert(1)</script> "q" 'a' & $' $&`;

const PROFILES: Record<string, Record<string, unknown>> = {
  evil: {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'evil',
    full_name: XSS_NAME,
    headline: `<img src=x onerror=alert(2)>`,
    summary: 'Resumen',
    location: 'Valencia',
    avatar_url: 'javascript:alert(3)',
    meta_title: null,
    meta_description: null,
  },
  'http-avatar': {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'http-avatar',
    full_name: 'Ana',
    headline: 'Dev',
    avatar_url: 'http://evil.example.com/a.png" onload="alert(4)',
  },
  ok: {
    id: '00000000-0000-0000-0000-000000000003',
    slug: 'ok',
    full_name: 'Luis',
    headline: 'Diseñador',
    avatar_url: 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/avatars/luis.png',
  },
};

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

/** Supabase falsa: responde a /rest/v1/<tabla> como PostgREST. */
function startFakeSupabase(port: number): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const table = url.pathname.replace('/rest/v1/', '');
    let rows: unknown[] = [];
    if (table === 'profiles') {
      // /cv/:slug filtra con slug=eq.<slug>; el sitemap con slug=not.is.null
      const slug = url.searchParams.get('slug') || '';
      rows = slug.startsWith('eq.')
        ? (PROFILES[slug.slice(3)] ? [PROFILES[slug.slice(3)]] : [])
        : [{ slug: 'a&b<c>', updated_at: '2026-10-01T00:00:00Z' }];
    }
    const wantsObject = String(req.headers.accept || '').includes('vnd.pgrst.object');
    res.setHeader('Content-Type', 'application/json');
    if (wantsObject) {
      if (rows.length !== 1) { res.statusCode = 406; res.end(JSON.stringify({ code: 'PGRST116', message: 'no rows' })); return; }
      res.end(JSON.stringify(rows[0]));
      return;
    }
    res.end(JSON.stringify(rows));
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

let serverProc: ChildProcess | undefined;
let fakeSupabase: http.Server | undefined;
let distDir = '';
let baseURL = '';
let serverLog = '';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({}, testInfo) => {
  if (testInfo.project.name !== 'chromium') return;

  distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'u08-dist-'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(distDir, 'index.html'));
  fs.mkdirSync(path.join(distDir, 'assets'));
  fs.writeFileSync(path.join(distDir, 'assets', 'app-abc123.js'), 'console.log(1);');
  fs.writeFileSync(path.join(distDir, 'favicon.ico'), '');

  const supaPort = await freePort();
  fakeSupabase = await startFakeSupabase(supaPort);

  const port = await freePort();
  baseURL = `http://127.0.0.1:${port}`;
  serverProc = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
    cwd: ROOT,
    env: {
      ...process.env,
      // Playwright inyecta su loader de TS en NODE_OPTIONS: server.mjs no lo necesita
      NODE_OPTIONS: '',
      PORT: String(port),
      HOST: '127.0.0.1',
      DIST_DIR: distDir,
      TRANSLATE_RATE_LIMIT: String(RATE_LIMIT),
      VITE_SUPABASE_URL: `http://127.0.0.1:${supaPort}`,
      VITE_SUPABASE_ANON_KEY: 'qa-fake-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProc.stdout?.on('data', d => { serverLog += d; });
  serverProc.stderr?.on('data', d => { serverLog += d; });
  serverProc.on('exit', code => { serverLog += `\n[exit ${code}]`; });
  serverProc.on('error', err => { serverLog += `\n[spawn error] ${err.message}`; });

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${baseURL}/health`);
      if (r.ok) return;
    } catch { /* aún arrancando */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`server.mjs no arrancó:\n${serverLog}`);
});

test.afterAll(async () => {
  serverProc?.kill();
  await new Promise<void>(resolve => (fakeSupabase ? fakeSupabase.close(() => resolve()) : resolve()));
  if (distDir) fs.rmSync(distDir, { recursive: true, force: true });
});

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Prueba de servidor: basta con un proyecto');
});

function expectSecurityHeaders(headers: Record<string, string>) {
  expect(headers['x-powered-by']).toBeUndefined();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');
  const csp = headers['content-security-policy-report-only'];
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'self'");
  expect(csp).toContain('script-src \'self\' https://web.opynio.com');
}

async function translate(request: APIRequestContext, data: unknown) {
  return request.post(`${baseURL}/api/translate`, { data });
}

test('SSR de /cv/:slug escapa los datos del perfil (XSS almacenado)', async ({ request }) => {
  const res = await request.get(`${baseURL}/cv/evil`, { headers: { 'User-Agent': 'Googlebot/2.1' } });
  expect(res.status()).toBe(200);
  const html = await res.text();

  // Ningún tag inyectado sobrevive
  expect(html).not.toContain('<script>alert(1)</script>');
  expect(html).not.toContain('<img src=x');
  expect(html).not.toContain('javascript:alert(3)');
  // El nombre sale escapado en <title> y en los meta
  const escapedName = 'Eve &lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt; &quot;q&quot; &#39;a&#39; &amp; $&#39; $&amp;';
  expect(html).toContain(`<title>${escapedName} - &lt;img src=x onerror=alert(2)&gt; | YourCVPassport</title>`);
  expect(html).toContain(`<meta name="author" content="${escapedName}">`);
  // "$'" / "$&" no se interpretan como patrones de String.replace: un solo <title> y un solo </head>
  expect(html.match(/<title>/g)).toHaveLength(1);
  expect(html.match(/<\/head>/g)).toHaveLength(1);
  // avatar_url no permitido -> imagen por defecto; URLs canónicas en el apex
  expect(html).toContain('<meta property="og:image" content="https://yourcvpassport.com/og-image.png">');
  expect(html).toContain('<meta property="og:url" content="https://yourcvpassport.com/cv/evil">');
  expect(html).toContain('<link rel="canonical" href="https://yourcvpassport.com/cv/evil">');
  expectSecurityHeaders(res.headers());
  expect(res.headers()['cache-control']).toBe('no-cache');
});

test('og:image solo acepta https de un origen permitido', async ({ request }) => {
  const bad = await (await request.get(`${baseURL}/cv/http-avatar`)).text();
  expect(bad).toContain('<meta property="og:image" content="https://yourcvpassport.com/og-image.png">');
  expect(bad).not.toContain('evil.example.com');

  const ok = await (await request.get(`${baseURL}/cv/ok`)).text();
  expect(ok).toContain('<meta property="og:image" content="https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/avatars/luis.png">');
});

test('cabeceras de seguridad y caché en SPA, assets y errores', async ({ request }) => {
  const spa = await request.get(`${baseURL}/precios`);
  expect(spa.status()).toBe(200);
  expectSecurityHeaders(spa.headers());
  expect(spa.headers()['cache-control']).toBe('no-cache');
  expect(spa.headers()['strict-transport-security']).toBeUndefined(); // HTTP plano

  const https = await request.get(`${baseURL}/`, { headers: { 'X-Forwarded-Proto': 'https' } });
  expect(https.headers()['strict-transport-security']).toBe('max-age=31536000');

  const asset = await request.get(`${baseURL}/assets/app-abc123.js`);
  expect(asset.status()).toBe(200);
  expectSecurityHeaders(asset.headers());
  expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');

  const fav = await request.get(`${baseURL}/favicon.ico`);
  expect(fav.headers()['cache-control']).toBe('public, max-age=86400');

  const missingApi = await request.get(`${baseURL}/api/no-existe`);
  expect(missingApi.status()).toBe(404);
  expect(await missingApi.json()).toEqual({ error: 'Not found' });
  expectSecurityHeaders(missingApi.headers());
});

test('/api/translate valida la entrada', async ({ request }) => {
  const cases: Array<[unknown, number]> = [
    [{}, 400],
    [{ texts: [], sourceLang: 'es', targetLang: 'en' }, 400],
    [{ texts: ['hola'], sourceLang: 'es', targetLang: 'fr' }, 400],
    [{ texts: ['hola'], sourceLang: 'es' }, 400],
    [{ texts: [123], sourceLang: 'es', targetLang: 'en' }, 400],
    [{ texts: Array(201).fill('x'), sourceLang: 'es', targetLang: 'en' }, 413],
    [{ texts: ['x'.repeat(5001)], sourceLang: 'es', targetLang: 'en' }, 413],
  ];
  for (const [body, status] of cases) {
    const res = await translate(request, body);
    expect(res.status(), JSON.stringify(body).slice(0, 80)).toBe(status);
    expect((await res.json()).error).toBeTruthy();
  }

  // JSON mal formado: 400 en JSON, sin stack trace
  const malformed = await request.post(`${baseURL}/api/translate`, {
    headers: { 'Content-Type': 'application/json' },
    data: '{"texts": [',
  });
  expect(malformed.status()).toBe(400);
  const text = await malformed.text();
  expect(text).not.toContain('at ');
  expect(JSON.parse(text).error).toBeTruthy();
});

test('/api/translate devuelve 429 al superar el límite por IP', async ({ request }) => {
  // Mismo idioma: no llama a Google. Las peticiones del test anterior ya cuentan.
  let last;
  for (let i = 0; i < RATE_LIMIT + 1; i++) {
    last = await translate(request, { texts: ['hola'], sourceLang: 'es', targetLang: 'es' });
    if (last.status() === 429) break;
  }
  expect(last!.status()).toBe(429);
  expect(Number(last!.headers()['retry-after'])).toBeGreaterThan(0);
  expect((await last!.json()).error).toBe('Too many requests');
});

test('la CSP de server.mjs es la misma que la del snippet de nginx', async ({ request }) => {
  const res = await request.get(`${baseURL}/`);
  const snippet = fs.readFileSync(path.join(ROOT, 'nginx', 'yourcvpassport-security-headers.conf'), 'utf-8');
  const nginxCsp = snippet.match(/add_header Content-Security-Policy-Report-Only "([^"]+)"/)?.[1];
  expect(nginxCsp).toBeTruthy();
  expect(res.headers()['content-security-policy-report-only']).toBe(nginxCsp);
});

test('sitemap dinámico con URLs del apex y slugs escapados', async ({ request }) => {
  const res = await request.get(`${baseURL}/sitemap.xml`);
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain('<loc>https://yourcvpassport.com/</loc>');
  expect(xml).toContain('<loc>https://yourcvpassport.com/cv/a%26b%3Cc%3E</loc>');
  expect(xml).not.toContain('www.yourcvpassport.com');
  expect(xml).not.toMatch(/<loc>[^<]*[<>&][^<]*<\/loc>/);
});
