/**
 * La verificación de marca de Google OAuth rechazó la app porque la página principal
 * no explicaba su propósito: sin JavaScript, el HTML era solo <div id="root"></div>.
 * index.html lleva ahora un bloque estático (qué es la app, uso de los datos de Google
 * y enlaces a privacidad y términos) que React sustituye al montar.
 *
 *   QA_PORT=5300 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/portada-sin-js.local.spec.ts
 */
import { test, expect } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

test('sin JavaScript: la portada explica la app y enlaza privacidad y términos', async ({ browser }) => {
  const context = await browser.newContext({ ...SAFE_CONTEXT_OPTIONS, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const home = page.locator('#static-home');
  await expect(home).toBeVisible();
  await expect(home.getByRole('heading', { level: 1, name: 'YourCVPassport' })).toBeVisible();
  await expect(home).toContainText('verificar tus credenciales');
  await expect(home).toContainText('build an online CV');
  await expect(home).toContainText('nombre, tu correo y tu foto de perfil');
  for (const [name, href] of [
    ['Política de privacidad', '/privacidad'],
    ['Términos y condiciones', '/terminos'],
    ['Privacy Policy', '/privacy'],
    ['Terms of Service', '/terms'],
  ] as const) {
    await expect(home.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  await context.close();
});

test('con JavaScript: React sustituye el bloque estático (sin contenido duplicado)', async ({ page, context }) => {
  await installInitState(context, { language: 'es', theme: 'light' });
  await mockSupabase(context, {});
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('section#pricing')).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('#static-home')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCount(1);
});
