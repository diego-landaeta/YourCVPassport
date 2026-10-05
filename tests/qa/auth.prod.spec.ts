/**
 * QA auth contra producción: SOLO preflight CORS (OPTIONS), sin efectos.
 * No se hace ningún POST a `signup` ni a `send-password-reset`.
 *
 * Los tests marcados con test.fixme sólo pasarán cuando se desplieguen las
 * funciones con la lista de orígenes de supabase/functions/_shared/cors.ts.
 * Tras el despliegue, quitar el fixme.
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/auth.prod.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

const FUNCTIONS = 'https://djehzlzombqrzzuchcef.supabase.co/functions/v1';
const PREFLIGHT_HEADERS = {
  'access-control-request-method': 'POST',
  'access-control-request-headers': 'authorization, x-client-info, apikey, content-type',
};

for (const fn of ['signup', 'send-password-reset']) {
  test.describe(`CORS ${fn}`, () => {
    // Una sola pasada basta: no depende del navegador.
    test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || !!isMobile, 'solo chromium escritorio');

    test('preflight responde 200 desde el dominio de producción', async ({ request }) => {
      const res = await request.fetch(`${FUNCTIONS}/${fn}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://www.yourcvpassport.com', ...PREFLIGHT_HEADERS },
      });
      expect(res.status()).toBe(200);
      const allow = res.headers()['access-control-allow-origin'];
      expect(['*', 'https://www.yourcvpassport.com']).toContain(allow);
    });

    test.fixme('tras desplegar: eco del origen permitido (no "*")', async ({ request }) => {
      const res = await request.fetch(`${FUNCTIONS}/${fn}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://www.yourcvpassport.com', ...PREFLIGHT_HEADERS },
      });
      expect(res.headers()['access-control-allow-origin']).toBe('https://www.yourcvpassport.com');
    });

    test.fixme('tras desplegar: un origen ajeno no se refleja', async ({ request }) => {
      const res = await request.fetch(`${FUNCTIONS}/${fn}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.example', ...PREFLIGHT_HEADERS },
      });
      const allow = res.headers()['access-control-allow-origin'];
      expect(allow).not.toBe('*');
      expect(allow).not.toBe('https://evil.example');
    });
  });
}
