import { defineConfig, devices } from '@playwright/test';

/**
 * Suite de QA del informe de testeo (issue #1).
 *
 * - Specs `*.local.spec.ts`: app local (Vite) con Supabase mockeado via page.route.
 * - Specs `*.prod.spec.ts`: produccion, solo lectura (GET). Nunca escriben datos.
 *
 * Uso:
 *   npx playwright test -c tests/qa/playwright.qa.config.ts
 *   QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/admin.local.spec.ts
 *   npx playwright test -c tests/qa/playwright.qa.config.ts --project=webkit
 */
const port = Number(process.env.QA_PORT || 5300);
// 127.0.0.1 y no localhost: en Windows localhost puede resolver a ::1 y el webServer
// no detecta Vite levantado.
const localURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: '.',
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  outputDir: '../../test-results/qa',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: '../../playwright-report/qa', open: 'never' }]],
  use: {
    baseURL: localURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Sin esto, en WebKit las peticiones que pasan por el Service Worker de la app
    // se saltan page.route y llegan a la Supabase real.
    serviceWorkers: 'block',
    // Aviso de cookies (issue #11): las specs arrancan con todo aceptado, como antes
    // de que existiera el aviso, para que no tape botones ni bloquee el widget de
    // reseñas. cookies.local.spec.ts lo vacía para probar el aviso.
    storageState: {
      cookies: [],
      origins: [{
        origin: localURL,
        localStorage: [{ name: 'ycp_cookie_consent', value: JSON.stringify({ v: 1, date: '2026-10-15T00:00:00.000Z', analytics: true, thirdParty: true }) }],
      }],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    // Playwright lanza el comando desde la carpeta del config (tests/qa): sin esto
    // Vite serviría esa carpeta y nunca la app.
    cwd: '../..',
    url: localURL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
