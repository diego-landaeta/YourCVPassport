/**
 * Modelo del asistente de ofertas (auditoria F4, F7, F10) ejecutado dentro del navegador con las
 * funciones REALES de la app (import dinamico desde Vite), con Supabase mockeado.
 *
 *  - F7: jobTextLength no cuenta los prefijos de lista («• », «1. »): el SQL solo cuenta texto.
 *  - F10: orden de los pasos de la issue #7 (basicos, condiciones, descripcion, filtros, revisar).
 *  - F4: el cierre se limita a ahora + 61 dias (desde AHORA, no desde published_at).
 *
 *   QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/bolsa-modelo.local.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 120_000 });

test.beforeEach(async ({ context, page }) => {
  await installInitState(context, { sessionProfile: null, language: 'es', theme: 'light' });
  await mockSupabase(context, {}, { rpc: { search_public_jobs_v2: [] } });
  await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
});

test('F7: jobTextLength no cuenta los prefijos de las listas', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const m = await import(/* @vite-ignore */ '/lib/jobPostingHtml.ts');
    const html = '<p>Hola mundo</p><ul><li>uno</li><li>dos</li></ul><ol><li>tres</li><li>cuatro</li></ol>';
    return { len: m.jobTextLength(html), withMarkers: m.jobHtmlToText(html).replace(/\s+/g, ' ').trim().length };
  });
  // «Hola mundo uno dos tres cuatro» = 30 caracteres: lo que cuenta el SQL (etiquetas -> espacio)
  expect(r.len).toBe('Hola mundo uno dos tres cuatro'.length);
  // El texto con marcadores (SEO, vista previa) sigue llevando «• » y «1. »
  expect(r.withMarkers).toBeGreaterThan(r.len);
});

test('F10: orden de los pasos de la issue #7', async ({ page }) => {
  const ids = await page.evaluate(async () => (await import(/* @vite-ignore */ '/lib/jobPostingModel.ts')).STEP_IDS);
  expect(ids).toEqual(['basics', 'conditions', 'description', 'screening', 'review']);
});

test('F4: el cierre elegido nunca pasa de ahora + 61 dias y hoy + 60 no se recorta', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const m = await import(/* @vite-ignore */ '/lib/jobPostingModel.ts');
    const now = new Date();
    const day60 = m.deadlineToInstant(m.dateInDays(60, now), now)!;
    const far = m.deadlineToInstant(m.dateInDays(90, now), now)!;
    const day30 = m.deadlineToInstant(m.dateInDays(30, now), now)!;
    return { now: now.getTime(), day60: Date.parse(day60), far: Date.parse(far), day30: Date.parse(day30), max: m.MAX_DEADLINE_DAYS };
  });
  const DAY = 86400000;
  expect(r.max).toBe(60);
  expect(r.day60).toBeLessThanOrEqual(r.now + 61 * DAY);
  expect(r.far).toBeLessThanOrEqual(r.now + 61 * DAY);
  // El fin de dia de «hoy + 60» queda tal cual (la base admite hasta ahora + 61 dias)
  const end60 = new Date(r.now); end60.setDate(end60.getDate() + 60); end60.setHours(23, 59, 0, 0);
  expect(r.day60).toBe(end60.getTime());
  expect(r.day30).toBeGreaterThan(r.now + 29 * DAY);
});
