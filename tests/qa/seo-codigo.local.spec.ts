/**
 * Auditoria SEO del 25/10/2026: hallazgos que se arreglan en el codigo de la app
 * (05, 06, 08, 12, 13, 14, 15 y 17). Supabase va mockeado; nada sale a produccion.
 *
 *   05  blog: un solo H1 por articulo
 *   06  blog: BlogPosting + BreadcrumbList, og:type article con article:published_time / modified_time
 *       (sin duplicados) y Organization + WebSite en la home
 *   08  /empleos y /jobs: `noindex, follow` mientras el listado no tiene ofertas SIN filtros; con ofertas, indexable
 *   12  /recursos y /resources: noindex y H1 en el idioma de la interfaz
 *   13  perfiles /cv/:slug a 375 px: sin desbordamiento horizontal en ninguna plantilla (nombre largo y
 *       «YourCVPassport Support»)
 *   14  una sola meta robots, description, og:type, og:url y twitter:card en el DOM renderizado
 *   15  /producto/ats y /product/ats: un unico H1 (el CV de ejemplo incrustado no usa h1)
 *   17  las migas de pan enlazan a la URL canonica de la seccion
 *
 *   QA_PORT=5447 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/seo-codigo.local.spec.ts --project=chromium
 *
 * Las comprobaciones de <head> (06, 08, 12, 14) dependen de react-helmet-async, que con el servidor de
 * desarrollo de Vite a veces no pinta las etiquetas tras una re-optimizacion de dependencias (ver la nota de
 * u09-seo.local.spec.ts): contra el build salen estables (`vite build` + `vite preview --port $QA_PORT`).
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, makeProfiles, mockSupabase, type MockDb, type Row } from './helpers/supabaseMock';
import { CANONICAL_SECTION_PATHS, canonicalSectionPath } from '../../lib/seoCanonicalPaths';

test.use(SAFE_CONTEXT_OPTIONS);

const HEAD_WAIT = { timeout: 120_000 };
const BASE = 'https://yourcvpassport.com';

async function setup(context: BrowserContext, lang: 'es' | 'en' = 'es', db: MockDb = {}, rpc: Record<string, unknown> = {}) {
  await installInitState(context, { language: lang, theme: 'light' });
  await mockSupabase(context, { profiles: makeProfiles(3), ...db }, { rpc });
}

/** Contenido de las etiquetas del <head> que coinciden con el selector. */
const metaContents = (page: Page, selector: string) =>
  page.locator(`head ${selector}`).evaluateAll((els) => els.map((e) => e.getAttribute('content')));

/** Espera a que Helmet haya pintado el canonical (señal de que ya aplico las etiquetas de la pagina). */
const helmetReady = (page: Page) => expect(page.locator('head link[rel="canonical"]')).toBeAttached(HEAD_WAIT);

async function jsonLdTypes(page: Page): Promise<string[]> {
  const raw = await page.locator('head script[type="application/ld+json"]').allTextContents();
  const types: string[] = [];
  for (const r of raw) {
    const parsed = JSON.parse(r);
    for (const node of Array.isArray(parsed) ? parsed : [parsed]) types.push(node['@type']);
  }
  return types;
}

// ---------------------------------------------------------------------------
// 05 + 06  Blog
// ---------------------------------------------------------------------------

const POST_ES = '/recursos/blog/automatizacion-empleo-futuro-hispano';
const POST_EN = '/resources/blog/academic-cv-publications-format';

test.describe('05 y 06: articulo del blog', () => {
  for (const [lang, path] of [['es', POST_ES], ['en', POST_EN]] as const) {
    test(`05: ${path} tiene un solo H1`, async ({ context, page }) => {
      await setup(context, lang);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('.blog-content')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      // El cuerpo conserva sus subtitulos
      expect(await page.locator('.blog-content h2').count()).toBeGreaterThan(0);
    });

    test(`06: ${path} emite BlogPosting + BreadcrumbList y og:type article sin duplicados`, async ({ context, page }) => {
      await setup(context, lang);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await helmetReady(page);
      await expect.poll(() => jsonLdTypes(page), HEAD_WAIT).toEqual(expect.arrayContaining(['BlogPosting', 'BreadcrumbList']));

      const blocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
      const nodes = blocks.flatMap((b) => { const p = JSON.parse(b); return Array.isArray(p) ? p : [p]; });
      const post = nodes.find((n) => n['@type'] === 'BlogPosting');
      const crumbs = nodes.find((n) => n['@type'] === 'BreadcrumbList');
      expect(post.url).toBe(`${BASE}${path}`);
      expect(post.headline).toBeTruthy();
      expect(post.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(post.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(post.inLanguage).toBe(lang);
      expect(post.publisher.name).toBe('YourCVPassport');
      expect(crumbs.itemListElement.map((i: any) => i.position)).toEqual([1, 2, 3]);
      expect(crumbs.itemListElement[1].item).toBe(`${BASE}${lang === 'es' ? '/recursos/blog' : '/resources/blog'}`);
      expect(crumbs.itemListElement[2].item).toBe(`${BASE}${path}`);

      expect(await metaContents(page, 'meta[property="og:type"]')).toEqual(['article']);
      const published = await metaContents(page, 'meta[property="article:published_time"]');
      const modified = await metaContents(page, 'meta[property="article:modified_time"]');
      expect(published).toHaveLength(1);
      expect(published[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(modified).toHaveLength(1);
    });
  }

  test('06: la home emite Organization y WebSite', async ({ context, page }) => {
    await setup(context);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await helmetReady(page);
    await expect.poll(() => jsonLdTypes(page), HEAD_WAIT).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
    expect(await metaContents(page, 'meta[property="og:type"]')).toEqual(['website']);
  });
});

// ---------------------------------------------------------------------------
// 08  /empleos y /jobs
// ---------------------------------------------------------------------------

function listRow(i: number): Row {
  return {
    id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`,
    title: `Oferta de prueba ${i}`, slug: `oferta-de-prueba-${i}-0000000${i}`,
    company_id: 'c1', company_name: `Empresa ${i}`, company_logo_url: null, country_code: 'ES', location_city: 'Madrid',
    work_mode: 'ONSITE', is_remote: false, contract_types: ['INDEFINITE'], schedule: 'FULL_TIME', category: 'IT_SOFTWARE',
    category2: null, vacancies: 1, experience_years: 2, summary: 'Descripcion corta.',
    salary_min: 1800, salary_max: 2400, salary_currency: 'EUR', salary_period: 'MONTHLY', salary_mode: 'RANGE', show_salary: true,
    published_at: new Date(Date.now() - i * 3600_000).toISOString(),
    application_deadline: new Date(Date.now() + 20 * 86400_000).toISOString(),
    already_applied: false, total_count: 2,
  };
}

test.describe('08: listado de ofertas', () => {
  for (const [lang, path] of [['es', '/empleos'], ['en', '/jobs']] as const) {
    test(`${path} sin ofertas y sin filtros: noindex, follow`, async ({ context, page }) => {
      await setup(context, lang, {}, { search_public_jobs_v2: [] });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await helmetReady(page);
      await expect.poll(() => metaContents(page, 'meta[name="robots"]'), HEAD_WAIT).toEqual(['noindex, follow']);
      expect(await metaContents(page, 'meta[name="googlebot"]')).toEqual(['noindex, follow']);
    });

    test(`${path} con ofertas: indexable`, async ({ context, page }) => {
      await setup(context, lang, {}, { search_public_jobs_v2: [listRow(1), listRow(2)] });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { level: 3 })).toHaveCount(2, { timeout: 60_000 });
      await helmetReady(page);
      await expect.poll(() => metaContents(page, 'meta[name="robots"]'), HEAD_WAIT).toEqual(['index, follow']);
    });
  }

  test('con filtros y sin resultados: noindex, nofollow como antes (no es el caso «sin ofertas»)', async ({ context, page }) => {
    await setup(context, 'es', {}, { search_public_jobs_v2: [] });
    await page.goto('/empleos?q=zzz', { waitUntil: 'domcontentloaded' });
    await helmetReady(page);
    await expect.poll(() => metaContents(page, 'meta[name="robots"]'), HEAD_WAIT).toEqual(['noindex, nofollow']);
  });
});

// ---------------------------------------------------------------------------
// 12  /recursos y /resources
// ---------------------------------------------------------------------------

test.describe('12: pagina «en construccion» de recursos', () => {
  for (const [lang, path, h1] of [['es', '/recursos', 'Recursos'], ['en', '/resources', 'Resources']] as const) {
    test(`${path}: noindex y H1 «${h1}»`, async ({ context, page }) => {
      await setup(context, lang);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toHaveText(h1, { timeout: 60_000 });
      await expect(page.locator('h1')).toHaveCount(1);
      await helmetReady(page);
      await expect.poll(() => metaContents(page, 'meta[name="robots"]'), HEAD_WAIT).toEqual(['noindex, nofollow']);
    });
  }
});

// ---------------------------------------------------------------------------
// 14  Etiquetas duplicadas en el DOM renderizado
// ---------------------------------------------------------------------------

test.describe('14: una sola etiqueta de cada tipo en el DOM renderizado', () => {
  for (const [lang, path] of [['es', '/'], ['es', '/precios'], ['en', '/pricing'], ['es', POST_ES]] as const) {
    test(`${path} (${lang})`, async ({ context, page }) => {
      await setup(context, lang);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await helmetReady(page);
      await expect.poll(() => metaContents(page, 'meta[name="robots"]'), HEAD_WAIT).toHaveLength(1);
      for (const sel of [
        'meta[name="robots"]',
        'meta[name="description"]',
        'meta[property="og:type"]',
        'meta[property="og:url"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[property="og:image"]',
        'meta[name="twitter:card"]',
        'meta[name="twitter:title"]',
        'link[rel="canonical"]',
      ]) {
        await expect(page.locator(`head ${sel}`), sel).toHaveCount(1);
      }
      // Ninguna meta (name o property) repetida, ni siquiera las que Helmet no gestiona
      const dups = await page.evaluate(() => {
        const seen: Record<string, number> = {};
        document.head.querySelectorAll('meta[name],meta[property]').forEach((m) => {
          const k = m.getAttribute('name') || m.getAttribute('property') || '';
          seen[k] = (seen[k] || 0) + 1;
        });
        return Object.entries(seen).filter(([, n]) => n > 1).map(([k, n]) => k + 'x' + n);
      });
      expect(dups).toEqual([]);
      expect((await metaContents(page, 'meta[property="og:url"]'))[0]).toMatch(/^https:\/\/yourcvpassport\.com\//);
    });
  }
});

// ---------------------------------------------------------------------------
// 15  /producto/ats
// ---------------------------------------------------------------------------

test.describe('15: un unico H1 en la pagina ATS', () => {
  for (const [lang, path] of [['es', '/producto/ats'], ['en', '/product/ats']] as const) {
    test(path, async ({ context, page }) => {
      await setup(context, lang);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 60_000 });
      // El CV de ejemplo (BadCVExample / GoodCVExample) esta en el DOM aunque el deslizador oculte una parte
      await expect(page.getByText(lang === 'es' ? 'CURRICULUM VITAE' : 'CURRICULUM VITAE').first()).toBeAttached();
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }
});

// ---------------------------------------------------------------------------
// 17  Migas de pan -> URL canonica
// ---------------------------------------------------------------------------

test.describe('17: las migas de pan enlazan a la URL canonica', () => {
  const CASES: { lang: 'es' | 'en'; page: string; section: string }[] = [
    { lang: 'es', page: '/producto/sellos', section: 'producto' },
    { lang: 'en', page: '/product/stamps', section: 'product' },
    { lang: 'es', page: '/profesionales/plantillas', section: 'profesionales' },
    { lang: 'en', page: '/professionals/templates', section: 'professionals' },
  ];
  for (const c of CASES) {
    test(`${c.page} -> ${CANONICAL_SECTION_PATHS[c.section]}`, async ({ context, page }) => {
      await setup(context, c.lang);
      await page.goto(c.page, { waitUntil: 'domcontentloaded' });
      const crumbs = page.getByTestId('breadcrumbs');
      await expect(crumbs).toBeVisible({ timeout: 60_000 });
      const hrefs = await crumbs.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs).toContain(CANONICAL_SECTION_PATHS[c.section]);
      expect(hrefs).not.toContain(`/${c.section}`);
    });
  }

  test('el JSON-LD BreadcrumbList tambien usa la URL canonica', async ({ context, page }) => {
    await setup(context, 'es');
    await page.goto('/producto/sellos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('breadcrumbs')).toBeVisible({ timeout: 60_000 });
    await expect.poll(async () => (await page.locator('head script[type="application/ld+json"]').allTextContents()).join(''), HEAD_WAIT)
      .toContain('BreadcrumbList');
    const all = (await page.locator('head script[type="application/ld+json"]').allTextContents()).join('');
    expect(all).toContain(`${BASE}/producto/resumen`);
    expect(all).not.toMatch(new RegExp(`"item":"${BASE}/producto"`));
  });

  test('canonicalSectionPath coincide con el canonical real de cada raiz de seccion', async ({ context, page }) => {
    for (const [section, target] of Object.entries(CANONICAL_SECTION_PATHS)) {
      await setup(context, section === section.toLowerCase() && /^(producto|profesionales|empresas)$/.test(section) ? 'es' : 'en');
      await page.goto(`/${section}`, { waitUntil: 'domcontentloaded' });
      await helmetReady(page);
      await expect.poll(() => page.locator('head link[rel="canonical"]').getAttribute('href'), HEAD_WAIT).toBe(`${BASE}${target}`);
      expect(canonicalSectionPath(section)).toBe(target);
    }
  });

  test('el menu lateral de la comunidad (/feed) enlaza a /companies/search y /professionals/how', async ({ context, page }) => {
    await setup(context, 'en');
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    const explore = page.locator('aside').filter({ hasText: 'Explore' });
    await expect(explore).toBeVisible({ timeout: 60_000 });
    const hrefs = await explore.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toContain('/companies/search');
    expect(hrefs).toContain('/professionals/how');
    expect(hrefs).not.toContain('/companies');
    expect(hrefs).not.toContain('/professionals');
  });
});

// ---------------------------------------------------------------------------
// 13  Desbordamiento horizontal a 375 px en perfiles
// ---------------------------------------------------------------------------

const TEMPLATES = [
  'passport', 'classic', 'modern-professional', 'corporate-classic', 'professional-classic', 'academic-standard',
  'creative-minimalist', 'creative-bold', 'creative-orange', 'creative-modern', 'urban', 'gradient-blue', 'modern-clean',
  'modern-minimalist', 'professional-blue', 'elegant-minimal', 'minimalist-yellow', 'coral-pink', 'green-minimal',
  'classic-sidebar', 'healthcare-professional',
] as const;

const NAMES = {
  corto: 'YourCVPassport Support',
  largo: 'Maximiliano Bartolome Fernandezdelasantisimatrinidadyalcantaravillanuevamontealegre',
} as const;

function cvProfile(slug: string, template: string, fullName: string, n: number): { profile: Row; rows: MockDb } {
  const id = `00000000-0000-4000-8000-0000000d${String(n).padStart(4, '0')}`;
  const profile: Row = {
    id, slug, full_name: fullName, headline: 'Soporte y atencion a profesionales', summary: 'Perfil de prueba para comprobar el diseno en movil.',
    email: `seo${n}@example.test`, location: 'Madrid, España', template, template_color: null, avatar_url: null, photo_url: null,
    role: 'professional', plan: 'pro', language: 'es', is_active: true, is_open_to_messages: true, wizard_completed: true,
    country_code: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  };
  const experiences = [0, 1].map((i) => ({
    id: `${id}-e${i}`, profile_id: id, company_name: `Empresa ${i + 1} S.L.`, position: `Puesto ${i + 1}`,
    start_date: `${2024 - i * 2}-01-01`, end_date: i === 0 ? null : `${2025 - i * 2}-12-01`, is_current: i === 0,
    description: 'Elaboracion de informes mensuales y atencion de incidencias.', achievements: ['Reduje costes un 20 %'], location: 'Madrid', sort_order: i,
  }));
  const education = [{ id: `${id}-ed0`, profile_id: id, institution_name: 'Universidad 1', degree: 'Grado', field_of_study: 'Ingenieria', start_date: '2014-09-01', end_date: '2018-06-30', description: null, sort_order: 0 }];
  const skills = Array.from({ length: 6 }, (_, i) => ({ id: `${id}-s${i}`, profile_id: id, name: `Habilidad ${i + 1}`, level: 'ADVANCED', percentage: 70, category: 'Herramientas', sort_order: i }));
  const languages = [{ id: `${id}-l0`, profile_id: id, name: 'Español', level: 'NATIVE', is_native: true, sort_order: 0 }];
  return { profile, rows: { experiences, education, skills, languages, portfolio_items: [], stamps: [] } };
}

test.describe('13: sin desbordamiento horizontal a 375 px', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  const cases = TEMPLATES.flatMap((template, ti) =>
    (['corto', 'largo'] as const).map((len, li) => ({ template, len, slug: `seo-${len}-${template}`, n: ti * 2 + li })),
  );

  for (const c of cases) {
    test(`${c.template} / ${c.len}`, async ({ context, page }) => {
      test.setTimeout(90_000);
      const db: MockDb = { profiles: makeProfiles(3), experiences: [], education: [], skills: [], languages: [], portfolio_items: [], stamps: [] };
      const { profile, rows } = cvProfile(c.slug, c.template, NAMES[c.len], c.n);
      db.profiles.push(profile);
      for (const [t, list] of Object.entries(rows)) db[t].push(...list);
      await installInitState(context, { language: 'es', theme: 'light' });
      await mockSupabase(context, db);

      await page.goto(`/cv/${c.slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.cv-template h1').first()).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(400); // fuentes e imagenes

      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide: string[] = [];
        for (const el of Array.from(document.querySelectorAll<HTMLElement>('.cv-template *'))) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > vw + 1) wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} right=${Math.round(r.right)}`);
        }
        return { vw, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth, wide: wide.slice(0, 6) };
      });
      expect(m.scroll, `${c.template}/${c.len}: scrollWidth ${m.scroll} > ${m.vw}; anchos: ${m.wide.join(' | ')}`).toBeLessThanOrEqual(m.vw);
      expect(m.body).toBeLessThanOrEqual(m.vw);
    });
  }
});
