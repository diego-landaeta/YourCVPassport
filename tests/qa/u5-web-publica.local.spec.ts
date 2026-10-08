/**
 * Auditoría de la web pública (issue #5) e issue #4 puntos 11 (títulos en inglés) y 12
 * («Casos de éxito» vacío), contra la app local (Vite) con Supabase mockeado.
 *
 * - A1: los botones de la home llevan a /empresas/planes, /precios y /empresas/seguridad;
 *       /es/pricing y compañía redirigen (SPA y server.mjs con 301).
 * - A2: el pie no tiene enlaces a «#».
 * - A3: sin reseñas (API de Opynio con [] o caída) no queda la sección de testimonios
 *       con el título solo; con reseñas sí se ve.
 * - A4: el menú ya no enlaza al tablón de empleos vacío (la ruta sigue).
 * - B1: los CV de ejemplo de /producto/ats y /producto/dominio están en español.
 * - B2: index.html por defecto en español; cada página pública tiene su título en el HTML
 *       (scripts/generate-static-meta.mjs) y coincide con el que pinta React.
 * - B3: /nosotros/mision y /recursos/biblioteca redirigen a su página principal.
 * - C1: /precios sin scroll horizontal a 390 px.
 *
 * El widget de Opynio se sustituye por un doble local que imita su comportamiento
 * observado (v6.10): pinta en un shadow DOM, pide las reseñas a widget-proxy y marca el
 * contenedor con data-loaded="true". Nada sale a producción.
 *
 *   QA_PORT=5463 npx playwright test -c tests/qa/playwright.qa.config.ts --project=chromium tests/qa/u5-web-publica.local.spec.ts
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

type Lang = 'es' | 'en';

interface StaticMetaModule {
  STATIC_META_PAIRS: ReadonlyArray<{ es: string; en: string; title: Record<Lang, string>; description: Record<Lang, string> }>;
  STATIC_META_SINGLE: ReadonlyArray<{ path: string; title: string; description: string }>;
}
const loadStaticMeta = async (): Promise<StaticMetaModule> =>
  import(pathToFileURL(path.join(ROOT, 'seo', 'static-meta.mjs')).href);

async function setup(context: BrowserContext, lang: Lang = 'es') {
  await installInitState(context, { language: lang, theme: 'light' });
  return mockSupabase(context, { blog_posts: [], job_postings: [] });
}

// ---------------------------------------------------------------------------
// Doble del widget de Opynio
// ---------------------------------------------------------------------------

const FAKE_WIDGET_JS = `
(function () {
  document.querySelectorAll('.opynio-widget').forEach(function (el) {
    if (el.getAttribute('data-qa-scanned')) return;
    el.setAttribute('data-qa-scanned', '1');
    var root = el.shadowRoot || el.attachShadow({ mode: 'open' });
    root.innerHTML = '<div class="opynio-loading">Cargando...</div>';
    fetch('https://hvtrrhxeqrsnjxhngdsj.supabase.co/functions/v1/widget-proxy', {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ businessId: el.getAttribute('data-business-id') })
    })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) {
        var reviews = j.reviews || [];
        root.innerHTML = reviews.length
          ? reviews.map(function (r) { return '<div class="opynio-review-card">' + r.review_text + '</div>'; }).join('')
          : '<div>No hay reseñas con texto para mostrar.</div>';
      })
      .catch(function () { root.innerHTML = ''; })
      .then(function () { el.setAttribute('data-loaded', 'true'); });
  });
})();`;

type ReviewsMode = 'empty' | 'error' | 'reviews';

/** Sirve el doble del widget y responde widget-proxy según `mode`. */
async function mockOpynio(page: Page, mode: ReviewsMode) {
  await page.route('https://web.opynio.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_WIDGET_JS }));
  await page.route('**/functions/v1/widget-proxy', route => {
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (mode === 'error') return route.fulfill({ status: 500, headers, contentType: 'application/json', body: '{}' });
    const reviews = mode === 'reviews'
      ? [{ title: 'Genial', review_text: 'Reseña de prueba QA', rating: 5, original_author_name: 'QA', source: 'opynio', created_at: '2026-09-29T09:15:00+00:00' }]
      : [];
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ widget_version: 'qa', business: { id: 'qa', review_count: reviews.length }, reviews }) });
  });
}

/** Baja hasta el final para que se monten las secciones perezosas. */
async function scrollToBottom(page: Page) {
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(100);
  }
}

// ---------------------------------------------------------------------------
// A1 / A2 / A4: enlaces de la home, pie y menú
// ---------------------------------------------------------------------------

test.describe('A1-A4 enlaces', () => {
  test('home: ventas, comparar planes y seguridad enlazan a las rutas en español', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pricing = page.locator('section#pricing');
    await expect(pricing).toBeVisible({ timeout: 45_000 });
    await expect(pricing.locator('a[href="/empresas/planes"]')).toHaveCount(1);
    await expect(pricing.locator('a[href="/precios"]')).toHaveCount(1);
    await expect(page.locator('a[href="/empresas/seguridad"]').first()).toBeAttached();
    await expect(page.locator('a[href^="/es/"], a[href^="/en/"]')).toHaveCount(0);
  });

  for (const [from, to] of [
    ['/es/pricing', '/precios'],
    ['/es/companies/plans', '/empresas/planes'],
    ['/es/companies/security', '/empresas/seguridad'],
    ['/en/precios', '/pricing'],
    ['/nosotros/mision', '/nosotros'],
    ['/recursos/biblioteca', '/profesionales/plantillas'],
  ] as const) {
    test(`SPA: ${from} redirige a ${to}`, async ({ page, context }) => {
      await setup(context, 'es');
      await page.goto(`${from}?utm=qa`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`${to.replace(/\//g, '\\/')}\\?utm=qa$`), { timeout: 45_000 });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 45_000 });
      await expect(page.getByText(/^404$/)).toHaveCount(0);
    });
  }

  for (const path of ['/', '/precios']) {
    test(`pie sin enlaces a "#" ni redes sin URL (${path})`, async ({ page, context }) => {
      await setup(context, 'es');
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const footer = page.locator('footer');
      await expect(footer).toBeVisible({ timeout: 45_000 });
      await expect(footer.locator('a[href="#"], a[href=""], a:not([href])')).toHaveCount(0);
      await expect(footer.getByText(/^(LinkedIn|X|YouTube)$/)).toHaveCount(0);
    });
  }

  test('menú: sin «Buscar empleos» ni «Biblioteca de plantillas»; Misión y valores lleva a /nosotros', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header')).toBeVisible({ timeout: 45_000 });
    const header = page.locator('header');
    // Los submenús pueden estar cerrados: se mira el DOM y el diccionario a la vez
    await expect(header.locator('a[href="/jobs"], a[href="/empleos"]')).toHaveCount(0);
    await expect(header.locator('a[href="/recursos/biblioteca"], a[href="/nosotros/mision"]')).toHaveCount(0);
    const es = fs.readFileSync(path.join(ROOT, 'translations', 'es.ts'), 'utf8');
    const nav = es.slice(es.indexOf('NAV_LINKS'), es.indexOf('PRICING_PLANS'));
    expect(nav).not.toMatch(/id: 'jobs'/);
    expect(nav).not.toMatch(/id: 'recursos\/biblioteca'/);
    expect(nav).toMatch(/name: 'Misión y valores', href: '#', id: 'nosotros' \}/);
    // La ruta del tablón sigue funcionando
    await page.goto('/jobs', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 45_000 });
  });
});

// ---------------------------------------------------------------------------
// A3: testimonios
// ---------------------------------------------------------------------------

test.describe('A3 testimonios', () => {
  for (const { path, heading } of [
    { path: '/', heading: 'Casos de éxito que inspiran el crecimiento profesional' },
    { path: '/precios', heading: 'Lo que dicen nuestros usuarios' },
  ]) {
    for (const mode of ['empty', 'error'] as const) {
      test(`${path}: sin reseñas (${mode === 'empty' ? 'API []' : 'API caída'}) no queda la sección`, async ({ page, context }) => {
        await setup(context, 'es');
        await mockOpynio(page, mode);
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('footer')).toBeVisible({ timeout: 45_000 });
        await scrollToBottom(page);
        await expect(page.getByTestId('testimonials-section')).toHaveCount(0, { timeout: 15_000 });
        await expect(page.getByRole('heading', { name: heading })).toHaveCount(0);
      });
    }

    test(`${path}: con reseñas se ve la sección con su título`, async ({ page, context }) => {
      await setup(context, 'es');
      await mockOpynio(page, 'reviews');
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const section = page.getByTestId('testimonials-section');
      await section.scrollIntoViewIfNeeded({ timeout: 45_000 });
      await expect(section.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15_000 });
      await expect(section).toHaveAttribute('aria-busy', 'false');
    });
  }

  test('script de Opynio bloqueado: tampoco queda el título solo', async ({ page, context }) => {
    await setup(context, 'es'); // el router de QA aborta web.opynio.com
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('footer')).toBeVisible({ timeout: 45_000 });
    await scrollToBottom(page);
    await expect(page.getByTestId('testimonials-section')).toHaveCount(0, { timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// B1: contenido de ejemplo en español
// ---------------------------------------------------------------------------

test.describe('B1 ejemplos en español', () => {
  test('/producto/ats: el CV de ejemplo malo y el bueno están en español', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/producto/ats', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('OBJETIVO PROFESIONAL:').first()).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText('Laura Martín').first()).toBeAttached();
    const html = await page.content();
    expect(html).not.toContain('jon.doe');
    expect(html).not.toContain('CAREER OBJECTIVE');
    expect(html).not.toContain('Professional Summary');
  });

  test('/producto/dominio: la tarjeta de ejemplo no usa jane.doe', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/producto/dominio', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('laura.martin@email.com')).toBeAttached({ timeout: 15_000 });
    const html = await page.content();
    expect(html).not.toContain('jane.doe');
    expect(html).not.toContain('Jane Doe');
  });

  test('/product/domain (en) conserva el ejemplo en inglés', async ({ page, context }) => {
    await setup(context, 'en');
    await page.goto('/product/domain', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('jane.doe@email.com')).toBeAttached({ timeout: 45_000 });
  });
});

// ---------------------------------------------------------------------------
// B2: títulos en español desde el primer byte
// ---------------------------------------------------------------------------

test.describe('B2 títulos', () => {
  test('index.html por defecto en español (título y descripción)', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<html lang="es">/);
    expect(html).toContain('<title>YourCVPassport - Plataforma de CV profesional verificado</title>');
    expect(html).toMatch(/<meta name="description" content="Crea, verifica y comparte tu CV profesional/);
    expect(html).not.toContain('Professional CV Platform');
    expect(html).not.toContain('Create, verify and share');
  });

  test('/signup y /login en español: título de la pestaña traducido', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.title(), { timeout: 45_000 }).toBe('Crear cuenta - Crea tu CV profesional | YourCVPassport');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.title(), { timeout: 45_000 }).toBe('Iniciar sesión - Accede a tu cuenta | YourCVPassport');
  });

  // nginx redirige /login a /login/ (existe dist/login/index.html). En producción
  // /login/ mostraba el formulario de registro porque AuthScreen compara '/login'.
  test('/login/ y /signup/ con barra final: URL sin barra, formulario y título correctos', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/login/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 45_000 }).toBe('/login');
    await expect(page.locator('#confirmPassword')).toHaveCount(0);
    await expect(page.locator('#fullName')).toHaveCount(0);
    await expect.poll(() => page.title(), { timeout: 45_000 }).toBe('Iniciar sesión - Accede a tu cuenta | YourCVPassport');

    await page.goto('/signup/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 45_000 }).toBe('/signup');
    await expect(page.locator('#fullName')).toBeVisible({ timeout: 45_000 });
    await expect.poll(() => page.title(), { timeout: 45_000 }).toBe('Crear cuenta - Crea tu CV profesional | YourCVPassport');
  });

  test('generador: cada página pública sale con su título, canonical y hreflang', async () => {
    const { renderPage, listPages } = await import(pathToFileURL(path.join(ROOT, 'scripts', 'generate-static-meta.mjs')).href);
    const base = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const pages = listPages() as Array<{ path: string; lang: Lang; title: string }>;
    expect(pages.length).toBeGreaterThanOrEqual(40);
    const precios = pages.find(p => p.path === '/precios')!;
    const html = renderPage(base, precios) as string;
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<title>Precios y Planes - YourCVPassport</title>');
    expect(html).toContain('<link rel="canonical" href="https://yourcvpassport.com/precios" data-rh="true" />');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://yourcvpassport.com/pricing" data-rh="true" />');
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html.match(/<title>/g)).toHaveLength(1);
    const pricing = renderPage(base, pages.find(p => p.path === '/pricing')!) as string;
    expect(pricing).toContain('<html lang="en">');
    expect(pricing).toContain('<title>Pricing and Plans - YourCVPassport</title>');
    // Ninguna página en español con el título genérico ni textos en inglés de index.html
    for (const p of pages.filter(x => x.lang === 'es')) expect(p.title).not.toMatch(/Professional CV Platform|Sign Up|Sign In/);
  });

  for (const lang of ['es', 'en'] as const) {
    test(`los títulos estáticos coinciden con los que pinta la SPA (${lang})`, async ({ page, context }) => {
      test.setTimeout(300_000);
      const { STATIC_META_PAIRS } = await loadStaticMeta();
      await setup(context, lang);
      const mismatches: string[] = [];
      for (const pair of STATIC_META_PAIRS) {
        await page.goto(pair[lang], { waitUntil: 'domcontentloaded' });
        try {
          await expect.poll(() => page.title(), { timeout: 30_000 }).toBe(pair.title[lang]);
        } catch {
          mismatches.push(`${pair[lang]}: SPA "${await page.title()}" != estático "${pair.title[lang]}"`);
        }
      }
      expect(mismatches, 'actualiza seo/static-meta.mjs').toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// C1: /precios sin scroll horizontal en móvil
// ---------------------------------------------------------------------------

test.describe('C1 móvil', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ['/precios', '/empresas/planes']) {
    test(`${path} sin scroll horizontal a 390 px`, async ({ page, context }) => {
      await setup(context, 'es');
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 45_000 });
      await scrollToBottom(page);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      // Ni siquiera con scroll programático se mueve la página en horizontal
      await page.evaluate(() => window.scrollTo(500, window.scrollY));
      expect(await page.evaluate(() => window.scrollX)).toBe(0);
    });
  }
});

// ---------------------------------------------------------------------------
// server.mjs: 301 y páginas con título propio (solo chromium, sin navegador)
// ---------------------------------------------------------------------------

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

test.describe('server.mjs', () => {
  test.describe.configure({ mode: 'serial' });
  let proc: ChildProcess | undefined;
  let distDir = '';
  let base = '';
  let log = '';

  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'u5-dist-'));
    fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(distDir, 'index.html'));
    const env = { ...process.env, NODE_OPTIONS: '' };
    // Mismo paso que `npm run build` tras vite build
    await new Promise<void>((resolve, reject) => {
      const gen = spawn(process.execPath, [path.join(ROOT, 'scripts', 'generate-static-meta.mjs'), distDir], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      gen.stdout?.on('data', d => { out += d; });
      gen.stderr?.on('data', d => { out += d; });
      gen.on('exit', code => (code === 0 ? resolve() : reject(new Error(`generate-static-meta: ${out}`))));
    });
    const port = await freePort();
    base = `http://127.0.0.1:${port}`;
    proc = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
      cwd: ROOT,
      env: {
        ...env,
        PORT: String(port),
        HOST: '127.0.0.1',
        DIST_DIR: distDir,
        // Supabase inexistente: estas pruebas no consultan datos
        VITE_SUPABASE_URL: 'http://127.0.0.1:9',
        VITE_SUPABASE_ANON_KEY: 'qa-fake-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    proc.stdout?.on('data', d => { log += d; });
    proc.stderr?.on('data', d => { log += d; });
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      try { if ((await fetch(`${base}/health`)).ok) return; } catch { /* arrancando */ }
      await new Promise(r => setTimeout(r, 200));
    }
    throw new Error(`server.mjs no arrancó:\n${log}`);
  });

  test.afterAll(async () => {
    proc?.kill();
    if (distDir) fs.rmSync(distDir, { recursive: true, force: true });
  });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Prueba de servidor: basta con un proyecto');
  });

  test('301 de rutas antiguas y fusionadas, conservando la query', async () => {
    const cases: Array<[string, string]> = [
      ['/es/pricing', '/precios'],
      ['/es/companies/plans?ref=home', '/empresas/planes?ref=home'],
      ['/es/companies/security', '/empresas/seguridad'],
      ['/es', '/'],
      ['/es/precios', '/precios'],
      ['/en/precios', '/pricing'],
      ['/es/resources/library', '/profesionales/plantillas'],
      ['/nosotros/mision', '/nosotros'],
      ['/about/mission', '/about'],
      ['/recursos/biblioteca', '/profesionales/plantillas'],
      ['/resources/library', '/professionals/templates'],
    ];
    for (const [from, to] of cases) {
      const res = await fetch(`${base}${from}`, { redirect: 'manual' });
      expect(res.status, from).toBe(301);
      expect(res.headers.get('location'), from).toBe(to);
    }
    // Rutas vigentes: sin redirección
    for (const p of ['/precios', '/empresas', '/empleos']) {
      expect((await fetch(`${base}${p}`, { redirect: 'manual' })).status, p).toBe(200);
    }
  });

  test('cada página pública llega con su título en el HTML; el resto, con el de index.html', async () => {
    const precios = await (await fetch(`${base}/precios`)).text();
    expect(precios).toContain('<title>Precios y Planes - YourCVPassport</title>');
    expect(precios).toContain('<link rel="canonical" href="https://yourcvpassport.com/precios" data-rh="true" />');
    const planes = await (await fetch(`${base}/empresas/planes`)).text();
    expect(planes).toContain('<title>Planes para Empresas - YourCVPassport</title>');
    const pricing = await (await fetch(`${base}/pricing`)).text();
    expect(pricing).toContain('<html lang="en">');
    // Ruta sin página propia (y la barra final no redirige a /precios/)
    const other = await (await fetch(`${base}/dashboard`)).text();
    expect(other).toContain('<title>YourCVPassport - Plataforma de CV profesional verificado</title>');
    const res = await fetch(`${base}/precios`, { redirect: 'manual' });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-cache');
    // Ninguna carpeta del build sin index.html: nginx (try_files $uri/) daría 403 en /empresas
    const dirsWithoutIndex: string[] = [];
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!ent.isDirectory()) continue;
        const sub = path.join(dir, ent.name);
        if (!fs.existsSync(path.join(sub, 'index.html'))) dirsWithoutIndex.push(path.relative(distDir, sub));
        walk(sub);
      }
    };
    walk(distDir);
    expect(dirsWithoutIndex).toEqual([]);
    expect(await (await fetch(`${base}/empresas`)).text()).toContain('<title>YourCVPassport - Plataforma de CV profesional verificado</title>');
  });
});
