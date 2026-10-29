/**
 * Aviso de cookies (issue #11, YCV-001 y YCV-015) contra la app local.
 *
 * Sin decisión previa (storageState vacío, al contrario que el resto de specs):
 * - el aviso aparece con «Aceptar todo», «Rechazar» y «Configurar», sin desbordar
 *   en móvil y con botones de 44 px;
 * - «Rechazar» no carga nada de Opynio y en su lugar sale «Mostrar reseñas»;
 * - «Aceptar todo» carga el widget (doble local) y guarda la decisión;
 * - «Configurar» abre el diálogo (Escape lo cierra) y guarda la selección;
 * - el pie tiene la columna Legal y «Configurar cookies» reabre el diálogo;
 * - /politica-de-cookies y /cookie-policy existen;
 * - Consent Mode v2: index.html deja todo denegado por defecto.
 *
 *   QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/cookies.local.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, storageState: { cookies: [], origins: [] } });
test.describe.configure({ timeout: 120_000 });

// Doble del widget de Opynio: una reseña dentro de un shadow DOM, como el real.
const FAKE_WIDGET_JS = `
  document.querySelectorAll('.opynio-widget').forEach(function (el) {
    var root = el.shadowRoot || el.attachShadow({ mode: 'open' });
    root.innerHTML = '<div class="opynio-review-card">Reseña de prueba QA</div>';
    el.setAttribute('data-loaded', 'true');
  });`;

async function setup(page: Page) {
  await installInitState(page.context(), { sessionProfile: null, language: 'es', theme: 'light' });
  await mockSupabase(page.context(), {});
  const opynio: string[] = [];
  await page.route('https://web.opynio.com/**', route => {
    opynio.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_WIDGET_JS });
  });
  return opynio;
}

const banner = (page: Page) => page.getByTestId('cookie-banner');
const consent = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('ycp_cookie_consent') || 'null'));

test('el aviso aparece y «Rechazar» no carga Opynio', async ({ page }) => {
  const opynio = await setup(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(banner(page)).toBeVisible({ timeout: 45_000 });
  for (const name of ['Aceptar todo', 'Rechazar', 'Configurar']) {
    await expect(banner(page).getByRole('button', { name, exact: true })).toBeVisible();
  }
  await banner(page).getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect(banner(page)).toHaveCount(0);
  expect(await consent(page)).toMatchObject({ v: 1, analytics: false, thirdParty: false });

  await page.getByTestId('reviews-consent-placeholder').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('reviews-consent-placeholder')).toBeVisible();
  await page.waitForTimeout(1500);
  expect(opynio, 'sin consentimiento no se pide nada a Opynio').toEqual([]);

  // Tras recargar no vuelve a preguntar.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await expect(banner(page)).toHaveCount(0);
});

test('«Mostrar reseñas» y «Aceptar todo» cargan el widget', async ({ page }) => {
  const opynio = await setup(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await banner(page).getByRole('button', { name: 'Rechazar', exact: true }).click({ timeout: 45_000 });
  const placeholder = page.getByTestId('reviews-consent-placeholder');
  await placeholder.scrollIntoViewIfNeeded();
  await placeholder.getByRole('button', { name: 'Mostrar reseñas' }).click();
  await expect.poll(() => opynio.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(await consent(page)).toMatchObject({ analytics: false, thirdParty: true });

  // «Aceptar todo» en una visita nueva: todo concedido.
  await page.evaluate(() => localStorage.removeItem('ycp_cookie_consent'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await banner(page).getByRole('button', { name: 'Aceptar todo', exact: true }).click({ timeout: 45_000 });
  expect(await consent(page)).toMatchObject({ analytics: true, thirdParty: true });
});

test('«Configurar»: diálogo accesible, Escape y guardar la selección', async ({ page }) => {
  await setup(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await banner(page).getByRole('button', { name: 'Configurar', exact: true }).click({ timeout: 45_000 });
  const dialog = page.getByRole('dialog', { name: 'Configurar cookies' });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('cookie-switch-analytics')).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByTestId('cookie-switch-thirdParty')).toHaveAttribute('aria-checked', 'false');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(banner(page)).toBeVisible();

  await banner(page).getByRole('button', { name: 'Configurar', exact: true }).click();
  await page.getByTestId('cookie-switch-analytics').click();
  await expect(page.getByTestId('cookie-switch-analytics')).toHaveAttribute('aria-checked', 'true');
  await dialog.getByRole('button', { name: 'Guardar selección' }).click();
  expect(await consent(page)).toMatchObject({ analytics: true, thirdParty: false });
});

test('pie con columna Legal, «Configurar cookies» y política de cookies', async ({ page }) => {
  await setup(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await banner(page).getByRole('button', { name: 'Rechazar', exact: true }).click({ timeout: 45_000 });
  const footer = page.locator('footer');
  for (const [name, href] of [['Privacidad', '/privacidad'], ['Términos', '/terminos'], ['Cookies', '/politica-de-cookies']]) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  await footer.getByRole('button', { name: 'Configurar cookies' }).click();
  await expect(page.getByRole('dialog', { name: 'Configurar cookies' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/politica-de-cookies', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Política de cookies' })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText('visitor_id')).toBeVisible();
  await page.goto('/cookie-policy', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 45_000 });
});

test('Consent Mode v2: denegado por defecto en index.html', async ({ page }) => {
  await setup(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const first = await page.evaluate(() => {
    const dl = (window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? [];
    const entry = dl.find(e => e[0] === 'consent' && e[1] === 'default');
    return entry ? (entry[2] as Record<string, string>) : null;
  });
  expect(first).toMatchObject({ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('el aviso no desborda y sus botones miden al menos 44 px', async ({ page }) => {
    await setup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(banner(page)).toBeVisible({ timeout: 45_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    for (const box of await banner(page).getByRole('button').evaluateAll(els => els.map(e => e.getBoundingClientRect().height))) {
      expect(box).toBeGreaterThanOrEqual(44);
    }
  });
});
