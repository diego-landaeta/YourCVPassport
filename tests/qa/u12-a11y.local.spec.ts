import { test, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * QA local U12 — accesibilidad (editor de perfil, dashboard, layout y compartidos).
 *
 * - Ningún button / a / [role=button|link] visible sin nombre accesible en el
 *   contenido principal (cabecera, sidebar, nav móvil y footer son de otras
 *   unidades: se informan pero no se exigen aquí).
 * - Skip-link "Saltar al contenido" aparece con Tab y lleva el foco a <main>.
 * - Anillo de foco visible (outline o box-shadow) en una muestra de controles.
 * - Los div con role="button" se activan con Enter.
 *
 * App local con Supabase mockeado (helpers/supabaseMock): nada sale a producción.
 *
 *   QA_PORT=5412 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u12-a11y.local.spec.ts --output=test-results/u12
 */
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type Row } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, locale: 'es-ES' });
// El dashboard carga muchas secciones lazy: con Vite en frío la primera visita tarda.
test.describe.configure({ timeout: 180_000 });

const OTHER = '00000000-0000-4000-8000-0000000d0002';
const LEAD_ID = '00000000-0000-4000-8000-0000000d1001';

function me(overrides: Row = {}): Row {
  const [admin] = makeProfiles(1);
  return {
    ...admin,
    id: ADMIN_ID,
    first_login_completed: true,
    dashboard_tour_completed: true,
    wizard_completed: true,
    ...overrides,
  };
}

function buildDb(profile: Row) {
  const other = { ...makeProfiles(3)[2], id: OTHER, full_name: 'Laura Contacto' };
  const ts = new Date(Date.now() - 3600_000).toISOString();
  return {
    profiles: [profile, other],
    experiences: [{ id: 'exp-1', profile_id: ADMIN_ID, position: 'Analista', company_name: 'ACME', start_date: '2020-01-01', end_date: null, is_current: true, description: 'Trabajo', achievements: [], display_order: 0 }],
    education: [{ id: 'edu-1', profile_id: ADMIN_ID, institution_name: 'Universidad', degree: 'Grado', field_of_study: 'Economía', start_date: '2014-09-01', end_date: '2018-06-30', display_order: 0 }],
    skills: [], languages: [], portfolio_items: [], stamps: [], visas: [], cv_versions: [],
    analytics_views: [], notifications: [], feed_posts: [], groups: [], group_members: [],
    conversation_summaries: [{
      lead_id: LEAD_ID, sender_id: OTHER, recipient_id: ADMIN_ID, sender_name: 'Laura Contacto', recipient_name: profile.full_name,
      lead_type: 'job_offer', subject: 'Propuesta', last_message: 'Hola, ¿hablamos?', last_message_at: ts, status: 'NEW',
    }],
    messages: [{ id: 'msg-1', lead_id: LEAD_ID, sender_id: OTHER, sender_name: 'Laura Contacto', content: 'Hola, ¿hablamos?', is_read: false, created_at: ts }],
    leads: [{ id: LEAD_ID, recipient_id: ADMIN_ID, sender_name: 'Laura Contacto', sender_email: 'laura@example.test', subject: 'Propuesta', message: 'Hola, ¿hablamos?', status: 'NEW', lead_type: 'job_offer', created_at: ts }],
  };
}

async function boot(page: Page, path: string, profile: Row | null) {
  page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 300)));
  if (process.env.QA_DEBUG) page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 400)); });
  await installInitState(page.context(), { sessionProfile: profile, language: 'es', theme: 'light' });
  await page.addInitScript(() => { try { localStorage.setItem('sidebar-collapsed', 'false'); } catch { /* sin storage */ } });
  await mockSupabase(page.context(), buildDb(profile ?? me()));
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

/** Cambia de sección del dashboard por el mismo popstate que usa DashboardPage. */
async function openSection(page: Page, section: string) {
  await page.evaluate((s) => {
    window.history.pushState({ section: s }, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { section: s } }));
  }, section);
}

interface Unnamed { html: string; inChrome: boolean }

/** Controles visibles sin nombre accesible (aria-label, aria-labelledby, texto, alt o title). */
async function unnamedControls(page: Page): Promise<Unnamed[]> {
  return page.evaluate(() => {
    const out: { html: string; inChrome: boolean }[] = [];
    const sel = 'button, a[href], [role="button"], [role="link"], [role="switch"]';
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const label = el.getAttribute('aria-label')?.trim();
      const by = el.getAttribute('aria-labelledby');
      const byText = by ? by.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim() || '').join('') : '';
      const text = (el.innerText || '').trim();
      const alt = Array.from(el.querySelectorAll('img[alt]')).map((i) => i.getAttribute('alt')?.trim() || '').join('');
      const title = el.getAttribute('title')?.trim();
      if (label || byText || text || alt || title) continue;
      out.push({
        html: el.outerHTML.slice(0, 220),
        // Cabecera, sidebar, navegación y footer pertenecen a otras unidades.
        // MobileNav (barra superior fija y cajón lateral) tampoco es de U12.
        inChrome: !!el.closest('header, nav, aside, footer, [data-sidebar], .fixed.top-0.left-0.right-0, [data-tour="mobile-menu"]'),
      });
    }
    return out;
  });
}

async function expectNoUnnamed(page: Page, testInfo: TestInfo, where: string) {
  const list = await unnamedControls(page);
  const chrome = list.filter((u) => u.inChrome);
  if (chrome.length) testInfo.annotations.push({ type: 'fuera-de-alcance', description: `${where}: ${chrome.length} sin nombre en cabecera/sidebar/nav/footer` });
  expect(list.filter((u) => !u.inChrome).map((u) => u.html), `${where}: controles sin nombre accesible`).toEqual([]);
}

/** ¿El elemento enfocado muestra un indicador de foco (outline o box-shadow)? */
async function focusIndicator(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { ok: false, desc: 'sin foco' };
    const cs = getComputedStyle(el);
    // `outline-style: auto` es el anillo nativo del navegador (Chrome lo pinta
    // aunque el ancho computado salga 0px).
    const outline = cs.outlineStyle === 'auto' || (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0);
    const shadow = cs.boxShadow !== 'none' && cs.boxShadow !== '';
    return { ok: outline || shadow, desc: `${el.tagName} outline=${cs.outlineStyle} ${cs.outlineWidth} shadow=${cs.boxShadow}` };
  });
}

/** Enfoca un locator en modalidad teclado (para que aplique :focus-visible). */
async function keyboardFocus(page: Page, locator: ReturnType<Page['locator']>) {
  await locator.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
}

const isWebkit = (testInfo: TestInfo) => testInfo.project.name === 'webkit';

test.describe('U12 skip-link', () => {
  test('aparece con Tab y lleva el foco a main', async ({ page }, testInfo) => {
    await boot(page, '/', null);
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(skip).toHaveCount(1);
    // Oculto en reposo (sr-only: 1x1 px)
    expect((await skip.boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);

    await page.keyboard.press('Tab');
    // En WebKit Tab no recorre enlaces por defecto (preferencia de Safari).
    if (isWebkit(testInfo) && !(await skip.evaluate((el) => el === document.activeElement))) await skip.focus();
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(20);
    expect((await focusIndicator(page)).ok).toBe(true);

    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();
  });

  test('en inglés dice "Skip to content"', async ({ page }) => {
    await installInitState(page.context(), { language: 'en', theme: 'light' });
    await mockSupabase(page.context(), buildDb(me()));
    await page.goto('/product/ats', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCount(1);
  });
});

test.describe('U12 nombres accesibles', () => {
  for (const path of ['/', '/producto/ats', '/producto/sellos']) {
    test(`pública ${path}`, async ({ page }, testInfo) => {
      await boot(page, path, null);
      await expect(page.locator('main#main-content')).toBeVisible();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expectNoUnnamed(page, testInfo, path);
    });
  }

  test('dashboard: inicio', async ({ page }, testInfo) => {
    await boot(page, '/dashboard', me());
    await expect(page.locator('main#main-content')).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);
    await expectNoUnnamed(page, testInfo, 'dashboard inicio');
  });

  test('dashboard: editor de perfil (wizard) + teclado', async ({ page }, testInfo) => {
    await boot(page, '/dashboard', me({ wizard_completed: false }));
    const steps = page.locator('[role="button"][aria-label]').filter({ has: page.locator('svg') });
    await expect(page.locator('[aria-current="step"]')).toHaveCount(1, { timeout: 60_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await expectNoUnnamed(page, testInfo, 'editor de perfil');

    // Los pasos (div role=button) se activan con Enter y tienen indicador de foco
    const current = page.locator('[aria-current="step"]');
    const firstLabel = await current.getAttribute('aria-label');
    const second = steps.nth(1);
    const secondLabel = await second.getAttribute('aria-label');
    expect(secondLabel).not.toBe(firstLabel);
    await keyboardFocus(page, second);
    await expect(second).toBeFocused();
    expect((await focusIndicator(page)).ok, (await focusIndicator(page)).desc).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.locator('[aria-current="step"]')).toHaveAttribute('aria-label', secondLabel!);

    // Botones de icono del paso Experiencia: editar / eliminar con nombre y foco visible
    const edit = page.getByRole('button', { name: 'Editar' }).first();
    await expect(edit).toBeVisible();
    await keyboardFocus(page, edit);
    const ind = await focusIndicator(page);
    expect(ind.ok, ind.desc).toBe(true);
    await expect(page.getByRole('button', { name: 'Eliminar' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Arrastrar para reordenar' }).first()).toBeAttached();
  });

  test('dashboard: mensajes y bandeja de leads', async ({ page }, testInfo) => {
    await boot(page, '/dashboard', me());
    // Esperar a que DashboardPage esté montado (escucha popstate) antes de cambiar de sección
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const row = page.locator('[role="button"]:visible').filter({ hasText: 'Laura Contacto' }).first();
    await expect(async () => {
      await openSection(page, 'leads');
      await expect(row).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 90_000 });
    await expectNoUnnamed(page, testInfo, 'bandeja de leads');
    // La estrella solo existe en la lista de escritorio
    if (!testInfo.project.name.startsWith('mobile')) {
      await expect(page.getByRole('button', { name: 'Destacar' }).first()).toBeAttached();
    }

    // La fila de conversación se abre con Enter
    await keyboardFocus(page, row);
    const ind = await focusIndicator(page);
    expect(ind.ok, ind.desc).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByText('Hola, ¿hablamos?').filter({ visible: true }).first()).toBeVisible();
    if (testInfo.project.name.startsWith('mobile')) await expect(page.getByRole('button', { name: 'Volver' }).first()).toBeVisible();
    await page.waitForTimeout(300);
    await expectNoUnnamed(page, testInfo, 'conversación abierta');

    await openSection(page, 'messages');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);
    await expectNoUnnamed(page, testInfo, 'mensajes');
  });
});
