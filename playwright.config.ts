import { defineConfig, devices } from '@playwright/test';

/**
 * Config raiz de Playwright: specs antiguos de tests/*.spec.ts contra la app local
 * (Vite) con Supabase mockeado (tests/qa/helpers/supabaseMock.ts).
 *
 *   npx playwright test
 *   PW_PORT=5190 npx playwright test
 *
 * - tests/qa tiene su propia config (tests/qa/playwright.qa.config.ts): ver tests/qa/README.md.
 * - tests/edge-functions llama a Edge Functions REALES y envia correos: queda fuera
 *   por defecto. Solo se incluye con RUN_LIVE_EDGE_TESTS=1 y un proyecto de PRUEBAS
 *   (EDGE_TEST_SUPABASE_URL / EDGE_TEST_SUPABASE_ANON_KEY); ver tests/edge-functions/test-config.ts.
 * - Sin cabeceras globales: nada de claves de Supabase en las peticiones de los tests.
 */
const port = Number(process.env.PW_PORT || 5173);
// 127.0.0.1 y no localhost: en Windows localhost puede resolver a ::1 y el webServer
// no detecta Vite levantado.
const localURL = `http://127.0.0.1:${port}`;
const runLiveEdge = process.env.RUN_LIVE_EDGE_TESTS === '1';

export default defineConfig({
  testDir: './tests',
  // Playwright compara testIgnore con la ruta absoluta: de ahi el `**/tests/` delante.
  testIgnore: ['**/tests/qa/**', ...(runLiveEdge ? [] : ['**/tests/edge-functions/**'])],

  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  outputDir: './test-results/root',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: './playwright-report/root', open: 'never' }]],

  use: {
    baseURL: localURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // En WebKit las peticiones que pasan por el Service Worker de la app se saltan
    // page.route y llegarian a la Supabase real.
    serviceWorkers: 'block',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Vite (vite.config.ts) y no server.mjs (puerto 3000, sirve un dist/ que puede estar viejo).
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: localURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
