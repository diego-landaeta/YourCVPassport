/**
 * Enlaces de las secciones Precios y Seguridad de la home. Antes se formaban con
 * '/es' + ruta inglesa (/es/companies/plans), que da 404, y el botón de ventas se
 * detectaba comparando el texto del CTA ('Contactar Ventas').
 *
 *   QA_PORT=5300 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/home-enlaces.local.spec.ts
 */
import { test, expect } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const CASES = [
  { lang: 'es', plans: '/empresas/planes', pricing: '/precios', security: '/empresas/seguridad' },
  { lang: 'en', plans: '/companies/plans', pricing: '/pricing', security: '/companies/security' },
] as const;

test('og-image.png existe (1200x630) y es la imagen por defecto al compartir', async ({ page, request }) => {
  const res = await request.get('/og-image.png');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  const png = await res.body();
  // Cabecera IHDR de PNG: ancho y alto en los bytes 16-23
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  const html = await (await request.get('/')).text();
  expect(html).toContain('<meta property="og:image" content="https://yourcvpassport.com/og-image.png"');
  await page.goto('/og-image.png');
  expect(await page.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1200);
});

// Issue #244 del CRM: el precio se ve claro antes de pagar, en PC y en móvil
const PRICES = [
  { lang: 'es', path: '/precios', plan: 'Plan Profesional', price: '€15', period: '/ mes' },
  { lang: 'en', path: '/pricing', plan: 'Professional Plan', price: '€15', period: '/ month' },
] as const;

for (const p of PRICES) {
  for (const where of ['home', 'precios'] as const) {
    test(`precio visible en ${where === 'home' ? 'la home' : p.path} (${p.lang})`, async ({ page, context }) => {
      await installInitState(context, { language: p.lang, theme: 'light' });
      await mockSupabase(context, {});
      await page.goto(where === 'home' ? '/' : p.path, { waitUntil: 'domcontentloaded' });
      const scope = where === 'home' ? page.locator('section#pricing') : page.locator('main');
      const card = scope.locator('div', { has: page.getByRole('heading', { name: p.plan, exact: true }) }).last();
      await card.scrollIntoViewIfNeeded({ timeout: 45_000 });
      await expect(card).toBeVisible();
      const text = (await card.innerText()).replace(/\s+/g, ' ');
      expect(text).toContain(p.price);
      expect(text).toContain(p.period.replace(/\s+/g, ' ').trim().split(' ').pop()!);
      // Dentro de la pantalla (sin desbordar en móvil)
      const box = (await card.boundingBox())!;
      const vw = page.viewportSize()!.width;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
    });
  }
}

const TOGGLE = {
  es: { toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro' },
  en: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
} as const;

for (const lang of ['es', 'en'] as const) {
  test(`botón de modo oscuro con nombre en el idioma activo (${lang})`, async ({ page, context }) => {
    await installInitState(context, { language: lang, theme: 'light' });
    await mockSupabase(context, {});
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const toDark = page.getByRole('button', { name: TOGGLE[lang].toDark, exact: true });
    // En móvil el botón está dentro del menú principal
    const menu = page.getByRole('button', { name: lang === 'es' ? 'Abrir menú principal' : 'Open main menu', exact: true });
    await expect(page.locator('header')).toBeVisible({ timeout: 45_000 });
    if (await menu.isVisible()) await menu.click();
    await expect(toDark.locator('visible=true').first()).toBeVisible({ timeout: 45_000 });
    await toDark.locator('visible=true').first().click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.getByRole('button', { name: TOGGLE[lang].toLight, exact: true }).locator('visible=true').first()).toBeVisible();
  });
}

for (const c of CASES) {
  test(`home (${c.lang}): precios y seguridad enlazan a rutas del idioma y sin 404`, async ({ page, context }) => {
    await installInitState(context, { language: c.lang, theme: 'light' });
    await mockSupabase(context, {});
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const pricing = page.locator('section#pricing');
    await expect(pricing).toBeVisible({ timeout: 45_000 });

    // El plan de empresa lleva a planes de empresa; los demás abren el registro (botón)
    const salesLinks = pricing.locator(`a[href="${c.plans}"]`);
    await expect(salesLinks).toHaveCount(1);
    await expect(pricing.locator(`a[href="${c.pricing}"]`)).toHaveCount(1);
    await expect(page.locator(`a[href="${c.security}"]`).first()).toBeVisible();
    await expect(page.locator('a[href^="/es/"]')).toHaveCount(0);

    // Las tres rutas cargan su página, no la 404
    for (const href of [c.plans, c.pricing, c.security]) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 45_000 });
      await expect(page.getByText(/404/)).toHaveCount(0);
    }
  });
}
