/**
 * Filtros de Historias de éxito. En español la opción "Todo" se comparaba con 'All'
 * y dejaba la lista vacía. Sin historias en BD se usan las estáticas de traducciones.
 *
 *   QA_PORT=5300 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/historias-filtros.local.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const CASES = [
  { lang: 'es', path: '/recursos/exito', all: 'Todo', goal: 'Cambio de Carrera' },
  { lang: 'en', path: '/resources/success-stories', all: 'All', goal: 'Career Change' },
] as const;

/** Tarjetas de la rejilla que sigue a los filtros. */
const cards = (page: Page) =>
  page.locator('#stories-goal')
    .locator('xpath=ancestor::div[contains(@class,"justify-center")][1]/following-sibling::div[1]')
    .locator(':scope > div');

for (const c of CASES) {
  test(`historias (${c.lang}): "${c.all}" muestra todas y el filtro por objetivo funciona`, async ({ page, context }) => {
    await installInitState(context, { language: c.lang, theme: 'light' });
    await mockSupabase(context, { success_stories: [] });
    await page.goto(c.path, { waitUntil: 'domcontentloaded' });

    const goal = page.getByLabel(/objetivo|goal/i);
    await expect(goal).toBeVisible({ timeout: 45_000 });
    await expect(cards(page).first()).toBeVisible();
    const total = await cards(page).count();
    expect(total).toBeGreaterThan(1);

    await goal.selectOption({ label: c.goal });
    const filtered = await cards(page).count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);

    // Volver a "Todo"/"All" recupera la lista completa (antes, en español, la vaciaba)
    await goal.selectOption({ label: c.all });
    await expect(cards(page)).toHaveCount(total);
    await page.getByLabel(/sector|industr/i).selectOption({ label: c.all });
    await expect(cards(page)).toHaveCount(total);
  });
}
