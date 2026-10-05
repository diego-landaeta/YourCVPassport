/**
 * U2 — El admin solo administra: sin uso social ni perfil propio.
 *
 * Sesion y Supabase MOCKEADOS (nada sale a produccion):
 *   QA_PORT=5402 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u02-admin-redireccion.local.spec.ts --output=test-results/u02
 *
 * - admin: /dashboard, /dashboard/feed, /dashboard/visas, /comunidad, /feed y las vistas
 *   de publicacion terminan en /admin sin pintar nunca el dashboard (ni el asistente).
 * - admin: el menu de cuenta solo tiene "Panel admin" y "Cerrar sesion"; sin "Comunidad".
 * - professional: /dashboard y /comunidad funcionan como antes.
 */
import { test, expect, type Page, type BrowserContext, type TestInfo } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type Row } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, locale: 'es-ES' });

const SHOTS = 'test-results/u02';
// Textos de la cabecera en español (translations/es.ts)
const t = { logout: 'Salir' };
const isMobile = (testInfo: TestInfo) => testInfo.project.name.startsWith('mobile');

/**
 * Registra si en algun momento se pinta el dashboard personal (sidebar, menu movil o
 * el asistente de perfil). Se instala antes de que cargue la app para cazar parpadeos.
 */
async function watchDashboard(context: BrowserContext) {
  await context.addInitScript(() => {
    const SELECTOR = '[data-tour="sidebar"], [data-tour="mobile-menu-toggle"], [data-tour="mobile-menu"]';
    (window as any).__dashboardSeen = false;
    const check = () => {
      if (document.querySelector(SELECTOR)) (window as any).__dashboardSeen = true;
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true });
  });
}

async function openAs(context: BrowserContext, page: Page, who: 'admin' | 'professional', route: string, opts: { wizardCompleted?: boolean } = {}) {
  const all = makeProfiles(6);
  let profiles: Row[];
  let me: Row;
  if (who === 'admin') {
    me = { ...all.find(p => p.id === ADMIN_ID)!, wizard_completed: opts.wizardCompleted ?? false };
    profiles = [me, ...all.filter(p => p.id !== ADMIN_ID)];
  } else {
    // Sin el admin en la tabla: /auth/v1/user del mock no devuelve al admin.
    me = { ...all.find(p => p.role === 'professional')!, wizard_completed: opts.wizardCompleted ?? true };
    profiles = [me];
  }
  await installInitState(context, { sessionProfile: me, theme: 'light', language: 'es' });
  await watchDashboard(context);
  const mock = await mockSupabase(context, { profiles, experiences: [], education: [], skills: [], languages: [], portfolio_items: [] });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  return mock;
}

const dashboardSeen = (page: Page) => page.evaluate(() => (window as any).__dashboardSeen === true);

test.describe('U2 admin: redirecciones a /admin', () => {
  for (const route of ['/dashboard', '/dashboard/feed', '/dashboard/visas', '/comunidad', '/feed', '/comunidad?grupo=x', '/p/00000000-0000-4000-8000-000000000999']) {
    test(`admin en ${route} acaba en /admin sin ver el dashboard ni el asistente`, async ({ page, context }, testInfo) => {
      // El chunk de /admin es pesado: con Vite en frio tarda en compilarse.
      test.setTimeout(150_000);
      await openAs(context, page, 'admin', route);
      await expect(page).toHaveURL(/\/admin$/, { timeout: 45_000 });
      await expect(page.getByText('Moderación de Usuarios').first()).toBeVisible({ timeout: 90_000 });
      expect(await dashboardSeen(page)).toBe(false);
      if (route === '/dashboard') {
        await page.screenshot({ path: `${SHOTS}/u02-admin-dashboard-a-admin-${testInfo.project.name}.png` });
      }
    });
  }
});

test.describe('U2 admin: menu de cuenta y navegacion', () => {
  test('admin: "Panel admin" y "Salir" (cerrar sesión), sin "Mi perfil", "Dashboard", "Ver mi CV" ni "Comunidad"', async ({ page, context }, testInfo) => {
    await openAs(context, page, 'admin', '/');
    if (isMobile(testInfo)) {
      await page.getByRole('button', { name: 'Open main menu' }).click();
      const drawer = page.locator('div.fixed.inset-y-0.left-0');
      await expect(drawer.getByRole('link', { name: 'Panel admin' })).toBeVisible({ timeout: 45_000 });
      await expect(drawer.getByRole('button', { name: t.logout })).toBeVisible();
      for (const name of ['Dashboard', 'Mi perfil', 'Ver mi CV', 'Comunidad']) {
        await expect(drawer.getByRole('link', { name, exact: true })).toHaveCount(0);
      }
      await page.screenshot({ path: `${SHOTS}/u02-admin-menu-${testInfo.project.name}.png` });
      await drawer.getByRole('link', { name: 'Panel admin' }).click();
    } else {
      await expect(page.locator('header nav').getByRole('link', { name: 'Precios' }).first()).toBeVisible({ timeout: 45_000 });
      await expect(page.locator('header nav').getByRole('link', { name: 'Comunidad' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Menú de cuenta' }).click();
      const menu = page.locator('header div.absolute.right-0');
      await expect(menu.getByRole('link', { name: 'Panel admin' })).toBeVisible();
      await expect(menu.getByRole('button', { name: t.logout })).toBeVisible();
      await expect(menu.getByRole('link')).toHaveCount(1);
      for (const name of ['Dashboard', 'Mi perfil', 'Ver mi CV', 'Comunidad']) {
        await expect(menu.getByText(name, { exact: true })).toHaveCount(0);
      }
      await page.screenshot({ path: `${SHOTS}/u02-admin-menu-${testInfo.project.name}.png` });
      await menu.getByRole('link', { name: 'Panel admin' }).click();
    }
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe('U2 professional: sin cambios', () => {
  test('professional en /dashboard sigue viendo su dashboard', async ({ page, context }, testInfo) => {
    await openAs(context, page, 'professional', '/dashboard');
    if (isMobile(testInfo)) {
      await expect(page.locator('[data-tour="mobile-menu-toggle"]')).toBeVisible({ timeout: 45_000 });
    } else {
      await expect(page.locator('[data-section-btn="ajustes"]')).toBeVisible({ timeout: 45_000 });
      await expect(page.getByRole('button', { name: 'Panel admin' })).toHaveCount(0);
    }
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.screenshot({ path: `${SHOTS}/u02-professional-dashboard-${testInfo.project.name}.png` });
  });

  test('professional en /comunidad sigue en la comunidad', async ({ page, context }) => {
    await openAs(context, page, 'professional', '/comunidad');
    await expect.poll(() => dashboardSeen(page), { timeout: 45_000 }).toBe(true);
    await expect(page).toHaveURL(/\/comunidad$/);
  });

  test('professional: el menu de cuenta mantiene Dashboard y la navegacion mantiene Comunidad', async ({ page, context }, testInfo) => {
    test.skip(isMobile(testInfo), 'Menu de cuenta de escritorio');
    await openAs(context, page, 'professional', '/');
    await expect(page.locator('header nav').getByRole('link', { name: 'Comunidad' })).toBeVisible({ timeout: 45_000 });
    await page.getByRole('button', { name: 'Menú de cuenta' }).click();
    const menu = page.locator('header div.absolute.right-0');
    await expect(menu.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Panel admin' })).toHaveCount(0);
  });
});
