/**
 * Traducción automática que FALLA (hooks/useAutoTranslation.ts).
 *
 * Un post en inglés en /comunidad con la interfaz en español. Si la traducción no
 * llega, el post se queda en su idioma original y el indicador "Traduciendo..."
 * (data-testid="auto-translation-loading") desaparece: no se queda cargando.
 *
 *   (a) 500 de todos los proveedores: Edge Function `translate-texts`, /api/translate
 *       (plugin de Vite), Google y MyMemory.
 *   (b) red abortada en todos ellos. Google reintenta los fallos de red con espera
 *       exponencial (1+2+4+8 s, y otra ronda para los fallidos), así que en Chromium
 *       y Firefox el indicador dura unos 30 s antes de rendirse.
 *   (c) la capa de traducción RECHAZA la promesa. Hoy autoTranslate.ts y
 *       translateBatch se tragan los errores de red y resuelven con el original, así
 *       que (a) y (b) no llegan a ejercitar el `.catch` del hook. Para probar ese
 *       `.catch` se inyecta el fallo: el módulo autoTranslate.ts que sirve Vite se
 *       reescribe en la respuesta para que requestAutoTranslation rechace. Sin el
 *       `.catch` este test falla (el indicador se queda para siempre).
 *
 * Supabase va MOCKEADO (helpers/supabaseMock): nada sale a producción.
 *
 *   QA_PORT=5430 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/traduccion-fallo.local.spec.ts
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, installInitState, mockSupabase, type Row, type SupabaseMock } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, locale: 'es-ES', timezoneId: 'UTC' });
// /comunidad carga secciones lazy: con Vite en frío la primera visita tarda.
test.describe.configure({ timeout: 150_000 });

const AUTHOR_EN = '00000000-0000-4000-8000-0000000e0002';
const POST_EN = '00000000-0000-4000-8000-0000000e1001';
const EN_POST = 'Just finished my certification in cloud architecture. Happy to share tips with anyone preparing the exam!';

const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

/** Usuario normal con el id de ADMIN_ID: /auth/v1/user del mock devuelve ese usuario. */
function me(): Row {
  return {
    id: ADMIN_ID, full_name: 'QA Usuario', email: 'qa@example.test', role: 'professional',
    wizard_completed: true, first_login_completed: true, dashboard_tour_completed: true,
    template: 'classic', slug: 'qa-usuario', headline: 'QA Engineer', summary: 'Perfil de prueba.',
    avatar_url: null, plan: 'free', is_active: true, created_at: isoDaysAgo(200), updated_at: isoDaysAgo(1),
  };
}

function buildDb() {
  const author = { id: AUTHOR_EN, full_name: 'Sarah Johnson', headline: 'Cloud Architect', avatar_url: null, slug: 'sarah-johnson' };
  return {
    profiles: [me(), author],
    feed_posts: [{
      id: POST_EN, author_id: AUTHOR_EN, content: EN_POST, content_type: 'TEXT', visibility: 'PUBLIC',
      is_hidden: false, is_pinned: false, is_edited: false, image_urls: [], shares_count: 0, views_count: 0,
      likes_count: 0, comments_count: 0, group_id: null, achievement_type: null, achievement_data: {}, metadata: {},
      created_at: isoDaysAgo(1), updated_at: isoDaysAgo(1),
      // El mock resuelve el embebido `author:profiles!author_id(...)` con esta clave.
      profiles: author,
    }],
    feed_comments: [], feed_likes: [], feed_shares: [], groups: [], group_members: [], text_translations: [],
  };
}

type Mode = '500' | 'abort' | 'reject';

interface TranslationLog {
  edgeCalls: number;
  providerCalls: string[];
}

const PROVIDERS = /translate\.googleapis\.com|api\.mymemory\.translated\.net/;

/** Inyecta el rechazo en el módulo que sirve Vite (ver cabecera, caso c). */
async function injectRejectingModule(page: Page) {
  await page.route('**/services/translation/autoTranslate.ts*', async (route: Route) => {
    const res = await route.fetch();
    const src = await res.text();
    const marker = 'export function requestAutoTranslation(';
    expect(src, 'Vite sirve requestAutoTranslation como función exportada').toContain(marker);
    const patched = src.replace(
      marker,
      'export function requestAutoTranslation(text, source, target) {\n'
      + '  return Promise.reject(new Error("QA: fallo inyectado en la capa de traducción"));\n'
      + '}\n'
      + 'function __qaRequestAutoTranslationOriginal(',
    );
    await route.fulfill({ response: res, body: patched, headers: { ...res.headers(), 'cache-control': 'no-store' } });
  });
}

async function boot(page: Page, mode: Mode): Promise<{ mock: SupabaseMock; log: TranslationLog }> {
  const log: TranslationLog = { edgeCalls: 0, providerCalls: [] };
  await installInitState(page.context(), { sessionProfile: me(), language: 'es', theme: 'light' });
  await page.addInitScript(() => { try { localStorage.setItem('sidebar-collapsed', 'false'); } catch { /* sin storage */ } });
  const mock = await mockSupabase(page.context(), buildDb());

  // Rutas de página: tienen prioridad sobre el router del contexto (mockSupabase).
  await page.route('**/functions/v1/translate-texts', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fallback();
    log.edgeCalls++;
    // Pequeña espera: el indicador "Traduciendo..." se ve en todos los navegadores.
    await new Promise((r) => setTimeout(r, 1500));
    if (mode === 'abort') return route.abort('failed');
    return route.fulfill({
      status: 500, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ error: 'proveedor de traducción caído (QA)' }),
    });
  });
  await page.route('**/api/translate**', (route) => (mode === 'abort'
    ? route.abort('failed')
    : route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"QA"}' })));
  await page.route(PROVIDERS, (route) => {
    log.providerCalls.push(new URL(route.request().url()).hostname);
    return mode === 'abort'
      ? route.abort('failed')
      : route.fulfill({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
  });
  if (mode === 'reject') await injectRejectingModule(page);

  await page.goto('/comunidad', { waitUntil: 'domcontentloaded' });
  return { mock, log };
}

/** Comprobación común: original visible, sin "Traduciendo..." ni aviso de traducido. */
async function expectOriginalWithoutLoading(page: Page, settleTimeout: number) {
  const post = page.locator('article', { hasText: EN_POST });
  await expect(post).toBeVisible({ timeout: 60_000 });
  await expect(post.getByTestId('auto-translation-loading')).toHaveCount(0, { timeout: settleTimeout });
  await expect(post.getByTestId('auto-translation-notice')).toHaveCount(0);
  await expect(post).toContainText(EN_POST);
  // Y sigue así (no vuelve a ponerse a traducir en bucle)
  await page.waitForTimeout(1000);
  await expect(post.getByTestId('auto-translation-loading')).toHaveCount(0);
  await expect(post).toContainText(EN_POST);
  return post;
}

test.describe('Traducción automática que falla: se ve el original y no se queda "Traduciendo..."', () => {
  test('(a) 500 de la Edge Function y de los proveedores de respaldo', async ({ page }) => {
    const { mock, log } = await boot(page, '500');
    const post = page.locator('article', { hasText: EN_POST });
    await expect(post).toBeVisible({ timeout: 60_000 });
    // Mientras se pide la traducción se ve el original con el indicador
    await expect(post.getByTestId('auto-translation-loading')).toBeVisible();
    await expect(post).toContainText(EN_POST);

    await expectOriginalWithoutLoading(page, 30_000);
    expect(log.edgeCalls, 'se pidió la traducción a translate-texts').toBeGreaterThan(0);
    expect(mock.writes.filter((w) => w.url.includes('text_translations')), 'sin escrituras en la caché compartida').toEqual([]);
  });

  test('(b) red abortada en la Edge Function y en los proveedores de respaldo', async ({ page }) => {
    const { mock, log } = await boot(page, 'abort');
    const post = page.locator('article', { hasText: EN_POST });
    await expect(post).toBeVisible({ timeout: 60_000 });
    await expect(post.getByTestId('auto-translation-loading')).toBeVisible();
    await expect(post).toContainText(EN_POST);

    // Google reintenta los fallos de red (~30 s en Chromium/Firefox): margen amplio.
    await expectOriginalWithoutLoading(page, 75_000);
    expect(log.edgeCalls).toBeGreaterThan(0);
    expect(mock.writes.filter((w) => w.url.includes('text_translations'))).toEqual([]);
  });

  test('(c) la capa de traducción rechaza: el .catch del hook quita el indicador', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    const { log } = await boot(page, 'reject');

    await expectOriginalWithoutLoading(page, 15_000);
    // El rechazo se gestiona en el hook: no llega como error no capturado
    expect(pageErrors.filter((m) => m.includes('fallo inyectado')), 'rechazo sin capturar').toEqual([]);
    // Con el módulo inyectado no se llega a pedir nada a la red
    expect(log.edgeCalls).toBe(0);
  });
});
