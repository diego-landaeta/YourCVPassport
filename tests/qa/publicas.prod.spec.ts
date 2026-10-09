/**
 * QA de paginas publicas contra PRODUCCION (solo lectura: GET y navegacion, sin formularios).
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/publicas.prod.spec.ts --project=chromium
 *
 * Los arreglos de #4, #5, #6, #7 y /terminos estan en la rama trabajo/panel-gestor-y-arreglos
 * y aun NO estan desplegados: las comprobaciones que dependen del despliegue van con
 * test.fixme y documentan que el fallo sigue en produccion hasta entonces. Al desplegar,
 * quitar el fixme de cada una.
 */
import { test, expect } from '@playwright/test';

const PROD = 'https://yourcvpassport.com';
const DEPLOY_PENDING = 'Arreglado en local; sigue fallando en produccion hasta desplegar la rama';

test.describe('produccion (solo lectura)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Produccion: basta con un navegador');
  });

  test('las paginas publicas responden', async ({ request }) => {
    for (const p of ['/recursos/blog', '/resources/blog', '/nosotros/prensa', '/empresas/seguridad', '/terminos']) {
      const r = await request.get(`${PROD}${p}`);
      expect(r.status(), p).toBe(200);
    }
  });

  test('#4 la cuadricula del blog se ve (opacidad 1)', async ({ page }) => {
    test.fixme(true, `${DEPLOY_PENDING}: en prod el wrapper de la cuadricula se queda en opacity 0`);
    await page.goto(`${PROD}/recursos/blog`);
    const card = page.getByTestId('blog-card').first();
    await expect(card).toBeVisible({ timeout: 30_000 });
  });

  test('#5 el destacado "Emigrar a Europa" ya no usa la foto de yoga', async ({ page }) => {
    test.fixme(true, `${DEPLOY_PENDING}: en prod la portada sigue siendo photo-1518611012118 (yoga)`);
    await page.goto(`${PROD}/recursos/blog`);
    await expect(page.getByTestId('blog-featured').locator('img')).toHaveAttribute('src', /photo-1578894381163/);
  });

  test('#6 /empresas/seguridad muestra migas de pan', async ({ page }) => {
    test.fixme(true, `${DEPLOY_PENDING}: en prod no existe el componente de migas`);
    await page.goto(`${PROD}/empresas/seguridad`);
    await expect(page.getByRole('navigation', { name: 'Ruta de navegación' })).toBeVisible();
  });

  test('#7 los activos del kit de prensa existen', async ({ request }) => {
    test.fixme(true, `${DEPLOY_PENDING}: hoy /press/* devuelve el index.html del SPA (o 404)`);
    for (const [p, type] of [
      ['/press/yourcvpassport-press-kit.zip', /zip/],
      ['/press/yourcvpassport-logo.svg', /svg/],
      ['/press/yourcvpassport-icon.png', /png/],
    ] as const) {
      const r = await request.get(`${PROD}${p}`);
      expect(r.status(), p).toBe(200);
      expect(r.headers()['content-type'], p).toMatch(type);
    }
  });

  test('/terminos tiene el titulo en espanol', async ({ page }) => {
    test.fixme(true, `${DEPLOY_PENDING}: en prod el H1 es "Terms and Conditions"`);
    await page.goto(`${PROD}/terminos`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Términos y Condiciones');
  });
});
