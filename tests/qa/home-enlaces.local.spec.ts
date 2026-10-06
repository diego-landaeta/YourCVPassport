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
