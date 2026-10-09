/**
 * QA U9 - SEO: titulo, description, canonical y hreflang por idioma, rutas duplicadas,
 * ficha de oferta y generador del sitemap.
 *
 * Reglas comprobadas:
 * - Cada idioma es canonico de si mismo (/precios -> /precios). Ninguna pagina en
 *   espanol apunta su canonical a la version inglesa.
 * - hreflang es/en/x-default reciprocos entre la pareja de rutas; sin hreflang en
 *   paginas de una sola URL (home, /company/register, articulos del blog).
 * - Rutas duplicadas -> canonical a la principal del mismo idioma.
 * - Sitemap: sin /resources/success, con terms/privacy/comunidad, cada post del blog
 *   solo bajo la ruta de su idioma, y todas sus URLs cargan en local sin la pagina 404.
 *
 * Supabase va mockeado (helpers/supabaseMock) y el generador se ejecuta sin
 * credenciales: no sale ninguna peticion a produccion.
 *
 *   QA_PORT=5409 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u09-seo.local.spec.ts --workers=2
 *
 * Nota: con el servidor de desarrollo, la primera carga tras arrancar Vite (o tras una
 * re-optimizacion de dependencias en la cache compartida node_modules/.vite) puede dejar
 * la pagina sin las etiquetas de Helmet aunque el titulo cambie. Contra el build de
 * produccion (`vite build` + `vite preview --port $QA_PORT`, que el config reutiliza
 * por `reuseExistingServer`) el resultado es estable.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installInitState, mockSupabase, SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BASE = 'https://yourcvpassport.com';
// Título por defecto de index.html (en español desde el issue #5)
const INDEX_TITLE = 'YourCVPassport - Plataforma de CV profesional verificado';

type Lang = 'es' | 'en';

/** Pagina con su URL en cada idioma (`single`: misma URL para ambos, sin hreflang). */
interface SeoRoute { en: string; es: string; single?: boolean }

const ROUTES: SeoRoute[] = [
  { en: '/', es: '/', single: true },
  { en: '/pricing', es: '/precios' },
  { en: '/product/overview', es: '/producto/resumen' },
  { en: '/product/stamps', es: '/producto/sellos' },
  { en: '/about', es: '/nosotros' },
  { en: '/about/contact', es: '/nosotros/contacto' },
  { en: '/professionals/how', es: '/profesionales/como-funciona' },
  { en: '/companies/search', es: '/empresas/busqueda' },
  { en: '/resources/blog', es: '/recursos/blog' },
  { en: '/resources/success-stories', es: '/recursos/exito' },
  { en: '/jobs', es: '/empleos' },
  { en: '/company/register', es: '/company/register', single: true },
];

/** Rutas duplicadas -> principal del mismo idioma. */
const DUPLICATES: { path: string; canonical: string; lang: Lang; alternates: { en: string; es: string } }[] = [
  { path: '/product', canonical: '/product/overview', lang: 'en', alternates: { en: '/product/overview', es: '/producto/resumen' } },
  { path: '/producto', canonical: '/producto/resumen', lang: 'es', alternates: { en: '/product/overview', es: '/producto/resumen' } },
  { path: '/professionals', canonical: '/professionals/how', lang: 'en', alternates: { en: '/professionals/how', es: '/profesionales/como-funciona' } },
  { path: '/profesionales', canonical: '/profesionales/como-funciona', lang: 'es', alternates: { en: '/professionals/how', es: '/profesionales/como-funciona' } },
  { path: '/companies', canonical: '/companies/search', lang: 'en', alternates: { en: '/companies/search', es: '/empresas/busqueda' } },
  { path: '/empresas', canonical: '/empresas/busqueda', lang: 'es', alternates: { en: '/companies/search', es: '/empresas/busqueda' } },
  { path: '/profiles', canonical: '/companies/search', lang: 'en', alternates: { en: '/companies/search', es: '/empresas/busqueda' } },
  { path: '/perfiles', canonical: '/empresas/busqueda', lang: 'es', alternates: { en: '/companies/search', es: '/empresas/busqueda' } },
];

const JOB = {
  id: '00000000-0000-4000-8000-0000000000j1',
  title: 'Ingeniera de datos',
  slug: 'ingeniera-de-datos-qa',
  company_id: '00000000-0000-4000-8000-0000000000c1',
  department: null,
  employment_type: 'full_time',
  work_mode: 'remote',
  experience_level: 'mid',
  location_city: 'Madrid',
  location_state: null,
  location_country: 'ES',
  is_remote: true,
  description: 'Oferta de prueba local para QA de SEO.',
  responsibilities: [],
  requirements: [],
  nice_to_have: [],
  benefits: [],
  required_skills: [],
  optional_skills: [],
  salary_min: null,
  salary_max: null,
  salary_currency: 'EUR',
  salary_period: 'yearly',
  show_salary: false,
  application_deadline: null,
  application_email: null,
  application_url: null,
  views_count: 0,
  applications_count: 0,
  published_at: '2026-09-01T00:00:00Z',
  created_at: '2026-09-01T00:00:00Z',
  status: 'PUBLISHED',
  company_name: 'Empresa QA',
  company_logo_url: null,
  company_website: null,
  company_description: null,
};

async function setup(context: BrowserContext, lang: Lang) {
  await installInitState(context, { language: lang, theme: 'light' });
  return mockSupabase(context, { blog_posts: [], job_postings: [] }, { rpc: { get_job_posting_detail: [JOB] } });
}

interface HeadInfo {
  title: string;
  description: string | null;
  canonicals: string[];
  hreflang: Record<string, string>;
  hreflangCount: number;
}

/** Espera a que Helmet pinte el canonical de la ruta y devuelve las etiquetas SEO. */
async function readHead(page: Page, expectedCanonical: string): Promise<HeadInfo> {
  try {
    await expect.poll(
      () => page.evaluate(() => Array.from(document.querySelectorAll('link[rel="canonical"]')).map(l => l.getAttribute('href'))),
      { timeout: 150_000 },
    ).toEqual([expectedCanonical]);
  } catch (err) {
    const links = await page.evaluate(() => `${document.title} | ${location.href} | ${Array.from(document.head.querySelectorAll('link,meta[name]')).map(l => l.outerHTML).join(' ')}`);
    throw new Error(`${(err as Error).message}\nHEAD: ${links.slice(0, 3000)}`);
  }
  await expect.poll(() => page.title()).not.toBe(INDEX_TITLE);
  return page.evaluate(() => {
    const alternates = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'));
    const descs = Array.from(document.querySelectorAll('meta[name="description"]'));
    // La de Helmet (data-rh) manda sobre la estatica de index.html
    const desc = descs.find(d => d.hasAttribute('data-rh')) || descs[descs.length - 1];
    return {
      title: document.title,
      description: desc ? desc.getAttribute('content') : null,
      canonicals: Array.from(document.querySelectorAll('link[rel="canonical"]')).map(l => l.getAttribute('href') || ''),
      hreflang: Object.fromEntries(alternates.map(a => [a.getAttribute('hreflang') || '', a.getAttribute('href') || ''])),
      hreflangCount: alternates.length,
    };
  });
}

// ---------------------------------------------------------------------------
// 12 rutas en ES y EN
// ---------------------------------------------------------------------------
test.describe('U9 SEO por idioma', () => {
  // La primera visita compila los chunks en Vite: margen amplio
  test.describe.configure({ timeout: 300_000 });
  test('12 rutas: titulo traducido y unico, description, canonical propio y hreflang reciprocos', async ({ browser }) => {
    test.setTimeout(600_000);
    const seen: Record<Lang, Map<string, string>> = { es: new Map(), en: new Map() };
    const descs: Record<Lang, Map<string, string>> = { es: new Map(), en: new Map() };

    for (const lang of ['es', 'en'] as const) {
      const context = await browser.newContext(SAFE_CONTEXT_OPTIONS);
      await setup(context, lang);
      const page = await context.newPage();
      for (const r of ROUTES) {
        const own = r[lang];
        await page.goto(own, { waitUntil: 'domcontentloaded' });
        const head = await readHead(page, `${BASE}${own}`);
        const label = `${lang} ${own}`;

        expect(head.canonicals, label).toEqual([`${BASE}${own}`]);
        if (lang === 'es' && own !== r.en) {
          expect(head.canonicals[0], `${label}: canonical en ingles`).not.toBe(`${BASE}${r.en}`);
        }
        expect(head.title, label).toMatch(/YourCVPassport/);
        expect(head.description, label).toBeTruthy();
        expect(head.description!.length, label).toBeLessThanOrEqual(160);
        expect(await page.locator('html').getAttribute('lang'), label).toBe(lang);

        if (r.single) {
          expect(head.hreflangCount, `${label}: sin hreflang`).toBe(0);
        } else {
          expect(head.hreflang, label).toEqual({ en: `${BASE}${r.en}`, es: `${BASE}${r.es}`, 'x-default': `${BASE}${r.en}` });
          expect(head.hreflangCount, label).toBe(3);
        }

        const dupTitle = [...seen[lang].entries()].find(([, t]) => t === head.title);
        expect(dupTitle, `${label}: titulo repetido con ${dupTitle?.[0]}`).toBeUndefined();
        seen[lang].set(own, head.title);
        descs[lang].set(own, head.description!);
      }
      await context.close();
    }

    // Traducido: el titulo y la description ES no son los EN de la misma pagina
    for (const r of ROUTES) {
      expect(seen.es.get(r.es), `titulo ${r.es}`).not.toBe(seen.en.get(r.en));
      expect(descs.es.get(r.es), `description ${r.es}`).not.toBe(descs.en.get(r.en));
    }
  });

  test('rutas duplicadas apuntan a la principal del mismo idioma', async ({ page, context }) => {
    test.setTimeout(360_000);
    await setup(context, 'es');
    for (const d of DUPLICATES) {
      await page.goto(d.path, { waitUntil: 'domcontentloaded' });
      const head = await readHead(page, `${BASE}${d.canonical}`);
      expect(head.hreflang, d.path).toEqual({ en: `${BASE}${d.alternates.en}`, es: `${BASE}${d.alternates.es}`, 'x-default': `${BASE}${d.alternates.en}` });
    }
  });

  test('oferta de empleo: canonical y titulo por idioma y por oferta', async ({ page, context }) => {
    await setup(context, 'en');
    await page.goto(`/empleos/${JOB.slug}`, { waitUntil: 'domcontentloaded' });
    const es = await readHead(page, `${BASE}/empleos/${JOB.slug}`);
    expect(es.title).toBe('Ingeniera de datos en Empresa QA - YourCVPassport');
    expect(es.hreflang).toEqual({ en: `${BASE}/jobs/${JOB.slug}`, es: `${BASE}/empleos/${JOB.slug}`, 'x-default': `${BASE}/jobs/${JOB.slug}` });
    expect(await page.locator('html').getAttribute('lang')).toBe('es');

    await page.goto(`/jobs/${JOB.slug}`, { waitUntil: 'domcontentloaded' });
    const en = await readHead(page, `${BASE}/jobs/${JOB.slug}`);
    expect(en.title).toBe('Ingeniera de datos at Empresa QA - YourCVPassport');
    expect(en.hreflang).toEqual(es.hreflang);
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
  });

  test('articulo del blog: canonical propio y sin hreflang a otro idioma', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/recursos/blog/como-hacer-cv-para-emigrar-europa', { waitUntil: 'domcontentloaded' });
    const head = await readHead(page, `${BASE}/recursos/blog/como-hacer-cv-para-emigrar-europa`);
    expect(head.hreflangCount).toBe(0);
  });

  test('AboutUs en espanol enlaza a /nosotros/... sin prefijo /es', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
    await readHead(page, `${BASE}/nosotros`);
    const hrefs = await page.locator('main a, a').evaluateAll(els => els.map(e => e.getAttribute('href') || ''));
    expect(hrefs.filter(h => h.startsWith('/es/'))).toEqual([]);
    expect(hrefs).toContain('/nosotros/prensa');
    expect(hrefs).toContain('/nosotros/contacto');
  });
});

// ---------------------------------------------------------------------------
// Generador del sitemap (salida temporal; nunca toca public/sitemap.xml)
// ---------------------------------------------------------------------------
test.describe('U9 sitemap', () => {
  test('generador: rutas correctas y todas cargan en local sin 404', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Generador y recorrido completo: basta con un navegador');
    test.setTimeout(30 * 60_000);

    const out = testInfo.outputPath('sitemap.xml');
    const published = fs.readFileSync(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8');
    // Sin credenciales: el generador no consulta Supabase (dotenv no pisa variables ya definidas)
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-sitemap.mjs'), `--output=${out}`], {
      cwd: ROOT,
      env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
      stdio: 'pipe',
    });
    expect(fs.readFileSync(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8'), 'public/sitemap.xml intacto').toBe(published);

    const xml = fs.readFileSync(out, 'utf8');
    const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => {
      const block = m[1];
      return {
        loc: block.match(/<loc>([^<]+)<\/loc>/)![1],
        alternates: Object.fromEntries([...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(a => [a[1], a[2]])),
      };
    });
    const locs = new Set(entries.map(e => e.loc));
    expect(locs.size, 'sin URLs repetidas').toBe(entries.length);
    for (const e of entries) expect(e.loc.startsWith(`${BASE}/`), e.loc).toBe(true);

    expect(locs.has(`${BASE}/resources/success`)).toBe(false);
    for (const p of ['/resources/success-stories', '/recursos/exito', '/terms', '/terminos', '/privacy', '/privacidad', '/comunidad', '/feed', '/jobs', '/empleos']) {
      expect(locs.has(`${BASE}${p}`), p).toBe(true);
    }
    // Duplicadas fuera (su canonical es la principal)
    for (const p of ['/product', '/producto', '/professionals', '/profesionales', '/companies', '/empresas', '/profiles', '/perfiles']) {
      expect(locs.has(`${BASE}${p}`), p).toBe(false);
    }

    // hreflang reciprocos: cada alternate existe como <loc> con el mismo juego
    const byLoc = new Map(entries.map(e => [e.loc, e]));
    for (const e of entries) {
      if (!e.alternates.es || !e.alternates.en) continue;
      expect(e.alternates['x-default'], e.loc).toBe(e.alternates.en);
      for (const alt of [e.alternates.en, e.alternates.es]) {
        expect(byLoc.get(alt)?.alternates, `${e.loc} -> ${alt}`).toEqual(e.alternates);
      }
    }

    // Blog: cada post solo bajo la ruta de su idioma
    const meta = fs.readFileSync(path.join(ROOT, 'content', 'posts', 'index.ts'), 'utf8');
    const posts = [...meta.slice(meta.indexOf('allPostsMeta:')).matchAll(/\{[^{}]*"slug":\s*"([^"]+)"[^{}]*"lang":\s*"([a-z]+)"[^{}]*\}/g)]
      .map(m => ({ slug: m[1], lang: m[2] }));
    expect(posts.length).toBeGreaterThan(100);
    for (const p of posts) {
      const own = `${BASE}${p.lang === 'en' ? '/resources/blog/' : '/recursos/blog/'}${p.slug}`;
      const other = `${BASE}${p.lang === 'en' ? '/recursos/blog/' : '/resources/blog/'}${p.slug}`;
      expect(locs.has(own), own).toBe(true);
      expect(locs.has(other), other).toBe(false);
      expect(byLoc.get(own)!.alternates).toEqual({ [p.lang]: own });
    }

    // Todas las URLs cargan en local (SPA) sin la pagina 404 y sin redirigir
    await setup(context, 'es');
    const failed: string[] = [];
    for (const loc of locs) {
      const p = loc.slice(BASE.length) || '/';
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      try {
        await expect.poll(() => page.title(), { timeout: 30_000 }).not.toBe(INDEX_TITLE);
        await page.waitForTimeout(150);
        const noindex = await page.locator('meta[name="robots"][content*="noindex"]').count();
        const now = new URL(page.url()).pathname;
        if (noindex > 0 || now !== p) failed.push(`${p} -> ${now}${noindex ? ' (404/noindex)' : ''}`);
      } catch {
        failed.push(`${p} -> sin titulo propio`);
      }
    }
    expect(failed).toEqual([]);
  });
});
