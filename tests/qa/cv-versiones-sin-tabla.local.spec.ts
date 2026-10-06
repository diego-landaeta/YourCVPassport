/**
 * Versiones del CV: si faltaba la tabla cv_versions, la sección mostraba al usuario
 * instrucciones de desarrollador ("Abre Supabase Dashboard", SQL Editor, una ruta local
 * de un PC). Issue #244 del CRM: el usuario no debe ver "Supabase" ni textos de prueba.
 * Ahora muestra el mismo aviso "Disponible próximamente" que el resto de usuarios.
 *
 *   QA_PORT=5300 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/cv-versiones-sin-tabla.local.spec.ts
 */
import { test, expect } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, makeProfiles, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

test('versiones del CV sin tabla: sin instrucciones de desarrollador ni "Supabase"', async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  // El único caso que llegaba a la pantalla de instrucciones: este email y sin tabla
  const [base] = makeProfiles(1);
  const me = {
    ...base, role: 'professional', email: 'admin@yourcvpassport.com',
    first_login_completed: true, dashboard_tour_completed: true, wizard_completed: true,
  };
  await installInitState(context, { sessionProfile: me, language: 'es', theme: 'light' });
  await mockSupabase(context, { profiles: [me], experiences: [], education: [], skills: [], languages: [], portfolio_items: [] });
  await context.route('**/rest/v1/cv_versions**', (route) => route.request().method() === 'OPTIONS'
    ? route.fallback()
    : route.fulfill({
      status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: '42P01', message: 'relation "cv_versions" does not exist', details: null, hint: null }),
    }));

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main, #main-content').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  // La sección no tiene entrada en el menú: se abre como lo hace el historial del dashboard
  await page.evaluate(() => {
    window.history.pushState({ section: 'cv-versions' }, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { section: 'cv-versions' } }));
  });
  await expect(page.getByText(/Disponible próximamente|Configuración de Base de Datos Requerida/)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: testInfo.outputPath('cv-versiones.png'), fullPage: true });

  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/supabase/i);
  expect(text).not.toContain('SQL Editor');
  expect(text).not.toContain('Users\\molin');
  await expect(page.getByText('Disponible próximamente')).toBeVisible();
});
