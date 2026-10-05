/**
 * QA de paginas publicas (#4 blog, #5 imagenes del blog, #6 migas de pan, #7 kit de prensa
 * y titulo de /terminos) contra la app local.
 *
 * Supabase se responde en local (helpers/supabaseMock): la tabla `blog_posts` va vacia y
 * el listado sale de content/posts. Solo los tests de #5 dejan pasar images.unsplash.com
 * (lectura) para comprobar que las fotos cargan de verdad; en el resto se bloquean para no
 * saturar los navegadores. No se envia ningun formulario real: prensa y boletin solo
 * preparan un enlace mailto que el usuario abre.
 *
 *   QA_PORT=5320 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/publicas.local.spec.ts
 */
import { test, expect, type Page, type BrowserContext, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installInitState, mockSupabase } from './helpers/supabaseMock';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

type Lang = 'es' | 'en';
const BLOG = { es: '/recursos/blog', en: '/resources/blog' } as const;
const ALL_LABEL = { es: 'Todos', en: 'All' } as const;
const LOAD_MORE = { es: 'Cargar más artículos', en: 'Load more articles' } as const;
const PAGE_SIZE = 12;

async function setup(context: BrowserContext, lang: Lang, opts: { realImages?: boolean } = {}) {
  await installInitState(context, { language: lang, theme: 'light' });
  const allowHosts = ['localhost', '127.0.0.1', ...(opts.realImages ? ['images.unsplash.com'] : [])];
  return mockSupabase(context, { blog_posts: [] }, { allowHosts });
}

/** Click centrando el elemento (en movil la cabecera sticky tapa los botones). */
async function clickCentered(loc: Locator) {
  await loc.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await loc.click();
}

/** Opacidad efectiva (producto de la opacidad de todos los ancestros). */
async function effectiveOpacities(cards: Locator) {
  return cards.evaluateAll(els => els.map(el => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1');
    const r = el.getBoundingClientRect();
    return { opacity: Math.round(o * 1000) / 1000, height: r.height };
  }));
}

async function openBlog(page: Page, lang: Lang) {
  await page.goto(BLOG[lang], { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('blog-grid')).toBeVisible({ timeout: 45_000 });
}

/** Fuerza la carga de todas las <img> (loading=lazy) y devuelve su estado final. */
async function loadAllImages(page: Page, selector: string) {
  await page.evaluate(sel => document.querySelectorAll<HTMLImageElement>(sel).forEach(img => { img.loading = 'eager'; }), selector);
  await expect.poll(
    () => page.evaluate(sel => Array.from(document.querySelectorAll<HTMLImageElement>(sel)).every(img => img.complete), selector),
    { timeout: 60_000 },
  ).toBe(true);
  return page.evaluate(sel => Array.from(document.querySelectorAll<HTMLImageElement>(sel)).map(img => ({
    src: img.currentSrc || img.src,
    naturalWidth: img.naturalWidth,
    fallback: img.dataset.fallbackApplied === 'true',
  })), selector);
}

// ---------------------------------------------------------------------------
// #4 Blog: la cuadricula se ve en todas las categorias, ES/EN, escritorio y movil
// ---------------------------------------------------------------------------
test.describe('#4 blog visible y paginado', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`tarjetas con opacidad 1 en todas las categorias (${lang})`, async ({ page, context }) => {
      test.setTimeout(120_000);
      await setup(context, lang);
      await openBlog(page, lang);

      const group = page.getByRole('group', { name: lang === 'es' ? 'Filtrar por categoría' : 'Filter by category' });
      const buttons = group.getByRole('button');
      const labels = await buttons.allInnerTexts();
      expect(labels[0]).toBe(ALL_LABEL[lang]);
      // La etiqueta fija en espanol "Todo" ya no aparece en ingles
      if (lang === 'en') expect(labels).not.toContain('Todo');
      expect(labels.length).toBeGreaterThan(4);

      for (const label of labels) {
        const btn = group.getByRole('button', { name: label, exact: true });
        await clickCentered(btn);
        await expect(btn).toHaveAttribute('aria-pressed', 'true');
        const cards = page.getByTestId('blog-card');
        await expect(cards.first()).toBeVisible();
        const n = await cards.count();
        expect(n, `categoria ${label}`).toBeGreaterThan(0);
        expect(n, `categoria ${label}: maximo una tanda`).toBeLessThanOrEqual(PAGE_SIZE);
        // Recorre la cuadricula: cada tarjeta debe tener opacidad 1 aunque la lista sea larga
        await page.evaluate(() => {
          const all = document.querySelectorAll('[data-testid="blog-card"]');
          all[all.length - 1]?.scrollIntoView({ block: 'end' });
        });
        const states = await effectiveOpacities(cards);
        for (const s of states) {
          expect(s.opacity, `categoria ${label}`).toBe(1);
          expect(s.height).toBeGreaterThan(100);
        }
      }
    });

    test(`"cargar mas" anade tandas de ${PAGE_SIZE} y se reinicia al filtrar (${lang})`, async ({ page, context }) => {
      test.setTimeout(90_000);
      await setup(context, lang);
      await openBlog(page, lang);

      const cards = page.getByTestId('blog-card');
      const status = page.locator('[data-testid="blog-grid"] + div [role="status"]');
      await expect(cards).toHaveCount(PAGE_SIZE);
      const total = Number((await status.innerText()).match(/(\d+)\D+(\d+)/)![2]);
      expect(total).toBeGreaterThan(100);

      const more = page.getByRole('button', { name: LOAD_MORE[lang] });
      await clickCentered(more);
      await expect(cards).toHaveCount(PAGE_SIZE * 2);
      const states = await effectiveOpacities(cards);
      expect(states.every(s => s.opacity === 1)).toBe(true);

      // Hasta el final: el boton desaparece y se muestran todas
      while (await more.isVisible()) await clickCentered(more);
      await expect(cards).toHaveCount(total);

      // Al cambiar de categoria se vuelve a la primera tanda
      const group = page.getByRole('group', { name: lang === 'es' ? 'Filtrar por categoría' : 'Filter by category' });
      await clickCentered(group.getByRole('button').nth(1));
      expect(await cards.count()).toBeLessThanOrEqual(PAGE_SIZE);

      // Sin resultados: mensaje claro
      await page.getByRole('searchbox').fill('zzzz-sin-resultados');
      await expect(page.getByText(lang === 'es' ? 'No hay artículos que coincidan' : 'No articles match')).toBeVisible();
    });
  }

  test('el boletin no usa alert() y prepara un mailto explicito', async ({ page, context }) => {
    await setup(context, 'es');
    await openBlog(page, 'es');
    let dialog = false;
    page.on('dialog', d => { dialog = true; d.dismiss(); });
    const email = page.getByRole('textbox', { name: 'Tu dirección de correo' });
    await email.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await email.fill('qa@example.com');
    await page.getByRole('button', { name: 'Suscribirse' }).click();
    const status = page.getByRole('status').filter({ hasText: 'support@yourcvpassport.com' });
    await expect(status).toBeVisible();
    const link = status.getByRole('link', { name: 'Abrir correo' });
    await expect(link).toHaveAttribute('href', /^mailto:support@yourcvpassport\.com\?subject=.+qa%40example\.com/);
    expect(dialog).toBe(false);
    expect(new URL(page.url()).pathname).toBe('/recursos/blog');
  });
});

// ---------------------------------------------------------------------------
// #5 Imagenes del blog: ninguna rota (naturalWidth 0) y ninguna tira del fallback
// ---------------------------------------------------------------------------
test.describe('#5 imagenes del blog', () => {
  test('todas las URLs de Unsplash de content/posts responden 200', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Comprobacion HTTP: basta con un navegador');
    test.setTimeout(180_000);
    const dir = path.join(ROOT, 'content', 'posts');
    const ids = new Set<string>();
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.ts')) continue;
      for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/images\.unsplash\.com\/(photo-[0-9a-f]+-[0-9a-f]+)/g)) ids.add(m[1]);
    }
    expect(ids.size).toBeGreaterThan(20);
    // La foto de yoga ya no se usa en ningun post
    expect(ids.has('photo-1518611012118-696072aa579a')).toBe(false);
    const broken: string[] = [];
    for (const id of ids) {
      const r = await request.get(`https://images.unsplash.com/${id}?w=200&q=50`);
      if (r.status() !== 200) broken.push(`${id} -> ${r.status()}`);
    }
    expect(broken).toEqual([]);
  });

  for (const lang of ['es', 'en'] as const) {
    test(`listado completo sin imagenes rotas (${lang})`, async ({ page, context }, testInfo) => {
      test.setTimeout(180_000);
      await setup(context, lang, { realImages: true });
      await openBlog(page, lang);
      // En escritorio chromium se recorre la lista entera; en el resto, destacado + primera tanda.
      if (testInfo.project.name === 'chromium') {
        const more = page.getByRole('button', { name: LOAD_MORE[lang] });
        while (await more.isVisible()) await clickCentered(more);
      }
      const imgs = await loadAllImages(page, '[data-testid="blog-card"] img, [data-testid="blog-featured"] img');
      expect(imgs.length).toBeGreaterThanOrEqual(PAGE_SIZE + 1);
      const bad = imgs.filter(i => i.naturalWidth === 0 || i.fallback);
      expect(bad, JSON.stringify(bad.slice(0, 5))).toEqual([]);
    });
  }

  test('destacado "Emigrar a Europa": foto de pasaporte y post sin imagenes rotas', async ({ page, context }) => {
    test.setTimeout(90_000);
    await setup(context, 'es', { realImages: true });
    await openBlog(page, 'es');
    const featured = page.getByTestId('blog-featured');
    await expect(featured).toContainText('Emigrar a Europa');
    await expect(featured.locator('img')).toHaveAttribute('src', /photo-1578894381163-e72c17f2d45f/);

    await page.goto('/recursos/blog/como-hacer-cv-para-emigrar-europa', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 45_000 });
    const imgs = await loadAllImages(page, 'main img');
    expect(imgs.length).toBeGreaterThan(3);
    expect(imgs.some(i => /photo-1518611012118/.test(i.src))).toBe(false);
    expect(imgs.filter(i => i.naturalWidth === 0 || i.fallback)).toEqual([]);
  });

  test('si una foto falla se muestra la imagen de reserva', async ({ page, context }) => {
    // Sin images.unsplash.com: todas las fotos remotas fallan y deben caer en el fallback
    await setup(context, 'es');
    await openBlog(page, 'es');
    for (const img of [page.getByTestId('blog-featured').locator('img'), page.getByTestId('blog-card').first().locator('img')]) {
      await img.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await expect(img).toHaveAttribute('data-fallback-applied', 'true');
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    }

    // Vista del post: portada (onError de React) e imagenes del cuerpo (listener en captura)
    await page.goto('/recursos/blog/como-hacer-cv-para-emigrar-europa', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 45_000 });
    await expect.poll(() => page.locator('main img[data-fallback-applied="true"]').count(), { timeout: 20_000 }).toBeGreaterThan(2);
    const broken = await page.locator('main img').evaluateAll(els => els.filter(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth === 0).length);
    expect(broken).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// #6 Migas de pan
// ---------------------------------------------------------------------------
type CrumbCase = { path: string; lang: Lang; items: { text: string; href?: string }[] };
const CRUMBS: CrumbCase[] = [
  { path: '/empresas/seguridad', lang: 'es', items: [{ text: 'Inicio', href: '/' }, { text: 'Empresas' }, { text: 'Seguridad y cumplimiento' }] },
  { path: '/companies/security', lang: 'en', items: [{ text: 'Home', href: '/' }, { text: 'Companies' }, { text: 'Security and compliance' }] },
  { path: '/producto/sellos', lang: 'es', items: [{ text: 'Inicio', href: '/' }, { text: 'Producto', href: '/producto' }, { text: 'Perfiles verificados' }] },
  { path: '/product/stamps', lang: 'en', items: [{ text: 'Home', href: '/' }, { text: 'Product', href: '/product' }, { text: 'Verified profiles' }] },
  { path: '/nosotros/prensa', lang: 'es', items: [{ text: 'Inicio', href: '/' }, { text: 'Nosotros', href: '/nosotros' }, { text: 'Prensa y kit de medios' }] },
  { path: '/about/press', lang: 'en', items: [{ text: 'Home', href: '/' }, { text: 'About us', href: '/about' }, { text: 'Press and media kit' }] },
  { path: '/recursos/blog', lang: 'es', items: [{ text: 'Inicio', href: '/' }, { text: 'Recursos' }, { text: 'Blog' }] },
  { path: '/resources/blog', lang: 'en', items: [{ text: 'Home', href: '/' }, { text: 'Resources' }, { text: 'Blog' }] },
  { path: '/terminos', lang: 'es', items: [{ text: 'Inicio', href: '/' }, { text: 'Términos y condiciones' }] },
  { path: '/terms', lang: 'en', items: [{ text: 'Home', href: '/' }, { text: 'Terms and conditions' }] },
];

test.describe('#6 migas de pan', () => {
  test('todas las rutas de routeConfig tienen etiqueta corta, sin "/", en ES y EN', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Comprobacion estatica: basta con un navegador');
    const routes = [...fs.readFileSync(path.join(ROOT, 'config', 'routeConfig.ts'), 'utf8')
      .matchAll(/\{ en: '([^']+)', es: '([^']+)'/g)]
      .flatMap(m => [m[1], m[2]])
      .filter(r => !r.startsWith('dev/'));
    expect(routes.length).toBeGreaterThan(40);
    for (const lang of ['es', 'en']) {
      const src = fs.readFileSync(path.join(ROOT, 'translations', `${lang}.ts`), 'utf8');
      const block = src.slice(src.indexOf('breadcrumbs: {'));
      const labelsSrc = block.slice(block.indexOf('labels: {'), block.indexOf('}'));
      const labels = Object.fromEntries([...labelsSrc.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map(m => [m[1], m[2]]));
      for (const r of routes) {
        expect(labels[r], `${lang}: ${r}`).toBeTruthy();
        expect(labels[r], `${lang}: ${r}`).not.toContain('/');
        expect(labels[r].length, `${lang}: ${r}`).toBeLessThanOrEqual(30);
      }
    }
  });

  for (const c of CRUMBS) {
    test(`${c.path}`, async ({ page, context }) => {
      await setup(context, c.lang);
      await page.goto(c.path, { waitUntil: 'domcontentloaded' });
      const nav = page.getByRole('navigation', { name: c.lang === 'es' ? 'Ruta de navegación' : 'Breadcrumb' });
      await expect(nav).toBeVisible({ timeout: 45_000 });
      await expect(nav).toHaveCount(1);
      const items = nav.locator('li');
      await expect(items).toHaveCount(c.items.length);
      for (let i = 0; i < c.items.length; i++) {
        const li = items.nth(i);
        await expect(li).toHaveText(c.items[i].text);
        const link = li.locator('a');
        if (c.items[i].href) await expect(link).toHaveAttribute('href', c.items[i].href!);
        else await expect(link).toHaveCount(0);
      }
      await expect(items.last().locator('[aria-current="page"]')).toHaveCount(1);

      // JSON-LD BreadcrumbList: solo niveles con URL, el ultimo es la pagina actual
      await expect.poll(() => page.locator('script[type="application/ld+json"]').allTextContents()
        .then(all => all.some(t => t.includes('BreadcrumbList')))).toBe(true);
      const ld = (await page.locator('script[type="application/ld+json"]').allTextContents())
        .map(t => JSON.parse(t)).find(j => j['@type'] === 'BreadcrumbList');
      const expectedLd = c.items.filter((it, i) => it.href || i === c.items.length - 1);
      expect(ld.itemListElement.map((e: any) => e.name)).toEqual(expectedLd.map(it => it.text));
      expect(ld.itemListElement.at(-1).item).toBe(`https://yourcvpassport.com${c.path}`);
      expect(ld.itemListElement.map((e: any) => e.position)).toEqual(expectedLd.map((_, i) => i + 1));

      // Sin scroll horizontal (390 px en movil)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('el post del blog no duplica migas (ya tiene "Volver al Blog")', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/recursos/blog/como-hacer-cv-para-emigrar-europa', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('breadcrumbs')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// #7 Kit de prensa
// ---------------------------------------------------------------------------
const DOWNLOADS = [
  { testId: 'press-download-kit', file: 'yourcvpassport-press-kit.zip' },
  { testId: 'press-download-logo', file: 'yourcvpassport-logo.svg' },
  { testId: 'press-download-icon', file: 'yourcvpassport-icon.png' },
];

test.describe('#7 kit de prensa', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`descargas reales con nombre y tamano (${lang})`, async ({ page, context }, testInfo) => {
      await setup(context, lang);
      await page.goto(lang === 'es' ? '/nosotros/prensa' : '/about/press', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('press-download-kit')).toBeVisible({ timeout: 45_000 });

      for (const d of DOWNLOADS) {
        const link = page.getByTestId(d.testId);
        await link.evaluate(el => el.scrollIntoView({ block: 'center' }));
        await expect(link).toHaveAttribute('download', d.file);
        const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
        expect(download.suggestedFilename()).toBe(d.file);
        const target = testInfo.outputPath(d.file);
        await download.saveAs(target);
        expect(fs.statSync(target).size, d.file).toBeGreaterThan(0);
      }
      // La pagina no salta al inicio ni cambia de URL
      expect(new URL(page.url()).hash).toBe('');
    });
  }

  test('sin anclas vacias, colores reales de marca y secciones visibles', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/nosotros/prensa', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('press-download-kit')).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('main a[href="#"]')).toHaveCount(0);
    await expect(page.getByText('Leer Más')).toHaveCount(0);
    const colors = page.getByTestId('press-brand-colors');
    await expect(colors).toContainText('#2563EB');
    await expect(colors).not.toContainText('#0052FF');
    // Las secciones animadas (useIntersectionObserver) terminan visibles al recorrer la pagina
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 400) await page.evaluate(yy => window.scrollTo(0, yy), y);
    // La seccion se anima al entrar en pantalla: se lleva a la vista y se espera a que
    // termine la transicion (medir al instante fallaba con el servidor cargado).
    await colors.scrollIntoViewIfNeeded();
    await expect.poll(
      () => colors.evaluate(el => { let o = 1; for (let e: Element | null = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; }),
      { timeout: 10_000 },
    ).toBeGreaterThan(0.99);
  });

  test('el formulario de prensa no usa alert() y prepara el mailto a press@', async ({ page, context }) => {
    await setup(context, 'es');
    await page.goto('/nosotros/prensa', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('press-download-kit')).toBeVisible({ timeout: 45_000 });
    let dialog = false;
    page.on('dialog', d => { dialog = true; d.dismiss(); });
    await page.getByLabel('Nombre Completo').fill('QA Test');
    await page.getByLabel('Medio de Comunicación').fill('QA Medio');
    await page.getByLabel('Correo Electrónico').fill('qa@example.com');
    await page.getByLabel('Mensaje').fill('Prueba local, no se envia nada.');
    await page.getByRole('button', { name: 'Enviar Consulta' }).click();
    const status = page.getByRole('status').filter({ hasText: 'press@yourcvpassport.com' });
    await expect(status).toBeVisible();
    await expect(status.getByRole('link', { name: 'Abrir en mi correo' }))
      .toHaveAttribute('href', /^mailto:press@yourcvpassport\.com\?subject=Consulta%20de%20prensa%20-%20QA%20Medio&body=.+Prueba%20local/);
    expect(dialog).toBe(false);
    expect(new URL(page.url()).pathname).toBe('/nosotros/prensa');
  });
});

// ---------------------------------------------------------------------------
// Extra: /terminos en espanol
// ---------------------------------------------------------------------------
test('/terminos tiene el titulo en espanol y /terms en ingles', async ({ page, context }) => {
  await setup(context, 'es');
  await page.goto('/terminos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Términos y Condiciones' })).toBeVisible({ timeout: 45_000 });
  await page.goto('/terms', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Terms and Conditions' })).toBeVisible({ timeout: 45_000 });
});
