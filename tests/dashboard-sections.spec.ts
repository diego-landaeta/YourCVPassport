import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, makeProfiles, mockSupabase } from './qa/helpers/supabaseMock';

/**
 * Dashboard Sections Test Suite
 *
 * Navegacion por las secciones del menu lateral del dashboard (components/dashboard/Sidebar.tsx).
 * Sesion falsa de un profesional y Supabase mockeado (tests/qa/helpers/supabaseMock.ts):
 * no hace falta login real ni credenciales.
 *
 * Las secciones de la version anterior de este spec (template, visas, cv-versions,
 * exportar) ya no estan en el menu; la lista de abajo sigue a Sidebar.tsx.
 */

test.use(SAFE_CONTEXT_OPTIONS);

/** Secciones del menu que se abren dentro del dashboard (sin `link` externo). */
const SECTIONS = [
  'plantillas',
  'stamps',
  'feed',
  'grupos',
  'canales',
  'notificaciones',
  'leads',
  'vacantes',
  'analitica',
  'ajustes',
] as const;

const sectionButton = (page: Page, id: string) => page.locator(`[data-section-btn="${id}"]:visible`).first();

/** Un boton del menu esta activo cuando lleva el fondo de marca (ver isActive en Sidebar.tsx). */
async function expectActive(page: Page, id: string) {
  await expect(sectionButton(page, id)).toHaveClass(/\bbg-cv-blue\b/, { timeout: 15_000 });
}

test.describe('Dashboard Navigation & Sections', () => {
  const pageErrors: string[] = [];

  test.beforeEach(async ({ context, page }) => {
    const profiles = makeProfiles(3);
    const professional = profiles.find(p => p.role === 'professional')!;
    await installInitState(context, { sessionProfile: professional, language: 'es' });
    await mockSupabase(context, { profiles });
    pageErrors.length = 0;
    page.on('pageerror', err => pageErrors.push(err.message));
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(sectionButton(page, 'dashboard')).toBeVisible({ timeout: 45_000 });
  });

  test.afterEach(() => {
    // Ninguna seccion debe lanzar errores no capturados al renderizar.
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });

  test('should open on Dashboard Home', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expectActive(page, 'dashboard');
  });

  test('should navigate to My Profile sections', async ({ page }) => {
    await sectionButton(page, 'mi-perfil').click();
    // Por defecto abre la subseccion de identidad (mi-perfil:identity)
    await expectActive(page, 'mi-perfil');
  });

  for (const id of SECTIONS) {
    test(`should navigate to section "${id}"`, async ({ page }) => {
      await sectionButton(page, id).click();
      await expectActive(page, id);
      await expect(sectionButton(page, 'dashboard')).not.toHaveClass(/\bbg-cv-blue\b/);
    });
  }
});
