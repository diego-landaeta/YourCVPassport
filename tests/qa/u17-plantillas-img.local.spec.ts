/**
 * U17 — Imagenes de plantillas contra la app local.
 *
 * - /profesionales/plantillas y /professionals/templates (a las que redirigen /recursos/biblioteca
 *   y /resources/library desde el issue #5): tras recorrer
 *   la pagina, ninguna miniatura de /images/templates/ queda con naturalWidth 0.
 * - Cada imagen referenciada en el codigo existe en public/images/templates (salvo las
 *   dos de en.ts que tampoco existen en produccion: van a la imagen de reserva).
 * - Con una miniatura forzada a fallar (page.route abort) se ve la imagen de reserva.
 *
 * Supabase se responde en local (helpers/supabaseMock) y el resto de hosts externos
 * (Unsplash) se bloquean: solo se comprueban las imagenes locales de plantillas.
 *
 *   QA_PORT=5417 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u17-plantillas-img.local.spec.ts --output=test-results/u17
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installInitState, mockSupabase, SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const TEMPLATES_DIR = path.join(ROOT, 'public', 'images', 'templates');
const SHOTS_DIR = path.join(ROOT, 'test-results', 'u17-capturas');

/**
 * Referenciadas solo en translations/en.ts (antes de alinear TEMPLATES con es.ts) y
 * ausentes tambien en produccion (404): no se descargan. Mientras sigan referenciadas
 * se resuelven con la imagen de reserva; cuando en.ts use template-28/template-41
 * dejan de aparecer y los tests siguen pasando.
 */
const KNOWN_MISSING = ['pharmacist.png', 'email-reference.png'];
const KNOWN_MISSING_TITLES = ['Pharmacist', 'Reference Request Email'];

const SELECTOR = 'img[src*="/images/templates/"], img[data-fallback-applied]';

type Lang = 'es' | 'en';

async function setup(context: BrowserContext, lang: Lang) {
  await installInitState(context, { language: lang, theme: 'light' });
  return mockSupabase(context, {});
}

/** Baja por la pagina a saltos para disparar los IntersectionObserver de las tarjetas. */
async function scrollThrough(page: Page) {
  let last = -1;
  for (let i = 0; i < 80; i++) {
    const { y, max } = await page.evaluate(() => {
      window.scrollBy(0, Math.round(window.innerHeight * 0.8));
      return { y: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight };
    });
    await page.waitForTimeout(60);
    if (y >= max - 2 && y === last) break;
    last = y;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

/** Fuerza la carga de las miniaturas (loading=lazy) y devuelve su estado final. */
async function loadTemplateImages(page: Page) {
  await page.evaluate(sel => document.querySelectorAll<HTMLImageElement>(sel).forEach(img => { img.loading = 'eager'; }), SELECTOR);
  const allComplete = () => page.evaluate(sel => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(sel));
    return imgs.length > 0 && imgs.every(img => img.complete);
  }, SELECTOR);
  await expect.poll(allComplete, { timeout: 60_000 }).toBe(true);
  // Margen para que onError cambie a la reserva y esta termine de cargar
  await page.waitForTimeout(500);
  await expect.poll(allComplete, { timeout: 15_000 }).toBe(true);
  return page.evaluate(sel => Array.from(document.querySelectorAll<HTMLImageElement>(sel)).map(img => ({
    src: img.getAttribute('src') || '',
    alt: img.alt,
    naturalWidth: img.naturalWidth,
    fallback: img.dataset.fallbackApplied === 'true',
  })), SELECTOR);
}

/** Nombres /images/templates/*.png referenciados en el codigo fuente (sin node_modules/dist). */
function referencedTemplateFiles(): string[] {
  const names = new Set<string>();
  const walk = (dir: string) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', '.claude', 'test-results', 'playwright-report', 'tests', 'public'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
        const src = fs.readFileSync(p, 'utf8');
        for (const m of src.matchAll(/\/images\/templates\/([A-Za-z0-9_.-]+\.png)/g)) names.add(m[1]);
      }
    }
  };
  walk(ROOT);
  return [...names].sort();
}

test.describe('U17 imagenes de plantillas', () => {
  test('todas las imagenes referenciadas existen en public/images/templates', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'comprobacion de ficheros: basta un proyecto');
    const refs = referencedTemplateFiles();
    expect(refs.length).toBeGreaterThan(50);
    const missing = refs.filter(n => !fs.existsSync(path.join(TEMPLATES_DIR, n)));
    for (const n of missing) expect(KNOWN_MISSING, `falta public/images/templates/${n}`).toContain(n);
    // Las descargadas son PNG reales (no una pagina HTML guardada con extension .png)
    for (const n of refs.filter(r => !KNOWN_MISSING.includes(r))) {
      const head = fs.readFileSync(path.join(TEMPLATES_DIR, n)).subarray(0, 8).toString('hex');
      expect(head, n).toBe('89504e470d0a1a0a');
    }
  });

  // /recursos/biblioteca y /resources/library se fusionaron con la galeria de
  // /profesionales/plantillas (issue #5, B3): redirigen y la galeria no tiene miniaturas rotas.
  for (const { lang, url, target } of [
    { lang: 'es' as const, url: '/recursos/biblioteca', target: '/profesionales/plantillas' },
    { lang: 'en' as const, url: '/resources/library', target: '/professionals/templates' },
  ]) {
    test(`biblioteca redirige a la galeria sin miniaturas rotas (${lang})`, async ({ page, context }, testInfo) => {
      test.setTimeout(120_000);
      await setup(context, lang);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`${target}$`), { timeout: 45_000 });
      await expect(page.locator('h1')).toBeVisible({ timeout: 45_000 });
      await expect(page.getByText('Oops! Something went wrong')).toHaveCount(0);
      await scrollThrough(page);
      const imgs = await loadTemplateImages(page);
      expect(imgs.length).toBeGreaterThan(5);
      for (const img of imgs) expect(img.naturalWidth, `${img.alt} (${img.src.slice(0, 60)})`).toBeGreaterThan(0);
      const fallbacks = imgs.filter(i => i.fallback).map(i => i.alt).sort();
      if (lang === 'es') expect(fallbacks).toEqual([]);
      else for (const alt of fallbacks) expect(KNOWN_MISSING_TITLES, `reserva inesperada: ${alt}`).toContain(alt);

      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS_DIR, `${process.env.U17_SHOT || 'despues'}-biblioteca-${lang}-${testInfo.project.name}.png`), fullPage: false });
    });
  }

  test('profesionales/plantillas sin miniaturas rotas', async ({ page, context }, testInfo) => {
    test.setTimeout(120_000);
    await setup(context, 'es');
    await page.goto('/profesionales/plantillas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('Oops! Something went wrong')).toHaveCount(0);
    await scrollThrough(page);
    const imgs = await loadTemplateImages(page);
    expect(imgs.length).toBeGreaterThan(5);
    for (const img of imgs) expect(img.naturalWidth, `${img.alt} (${img.src})`).toBeGreaterThan(0);
    // Corporativo Clasico apunta al archivo que existe (antes: classic-corporate.png)
    const corporate = imgs.find(i => i.src.includes('corporate'));
    if (corporate) expect(corporate.src).toBe('/images/templates/corporate-classic.png');

    fs.mkdirSync(SHOTS_DIR, { recursive: true });
    const card = page.locator('img[src*="/images/templates/"]').first();
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS_DIR, `${process.env.U17_SHOT || 'despues'}-profesionales-plantillas-${testInfo.project.name}.png`) });
  });

  test('galeria de profesionales/plantillas: miniaturas que fallan muestran la reserva', async ({ page, context }) => {
    test.setTimeout(120_000);
    await setup(context, 'es');
    await page.route('**/images/templates/*.png', route => route.abort());
    await page.goto('/profesionales/plantillas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible({ timeout: 45_000 });
    await scrollThrough(page);
    const imgs = await loadTemplateImages(page);
    expect(imgs.length).toBeGreaterThan(5);
    for (const img of imgs) {
      expect(img.fallback, `${img.alt} sin reserva`).toBe(true);
      expect(img.naturalWidth).toBeGreaterThan(0);
    }
  });
});
