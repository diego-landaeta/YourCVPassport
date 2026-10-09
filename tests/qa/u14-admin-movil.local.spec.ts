/**
 * U14 — Panel /admin en movil, textos ES/EN, pestanas diferidas y accesibilidad.
 * Sesion admin y Supabase MOCKEADOS (nada sale a produccion).
 *
 *   QA_PORT=5414 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u14-admin-movil.local.spec.ts
 *
 * - En `mobile-chromium` (Pixel 7) se usa el viewport del dispositivo; en los
 *   proyectos de escritorio se fuerza 390 px de ancho.
 * - Capturas en test-results/u14-shots/<fase>/ (`QA_U14_PHASE=antes` para la linea base).
 */
import { test, expect, type Page, type BrowserContext, type TestInfo, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, freezeMotion } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PHASE = process.env.QA_U14_PHASE || 'despues';
const SHOTS = path.join(HERE, '..', '..', 'test-results', 'u14-shots', PHASE);
const MOBILE_WIDTH = 390;

type Lang = 'es' | 'en';

/** Tarjetas de la portada de /admin -> pestana. `own`: componente de components/admin. */
const TABS: Array<{ key: string; es: string; en: string; own: boolean }> = [
  { key: 'monitoring', es: 'Monitoreo de Usuarios', en: 'User Monitoring', own: true },
  { key: 'companies', es: 'Gestión de Empresas', en: 'Company Management', own: true },
  { key: 'stamps', es: 'Verificación de Stamps', en: 'Stamp Verification', own: true },
  { key: 'jobs', es: 'Aprobar Vacantes', en: 'Job Postings Approval', own: true },
  { key: 'user-moderation', es: 'Moderación de Usuarios', en: 'User Moderation', own: true },
  { key: 'blog', es: 'Gestión de Blog', en: 'Blog Management', own: false },
  { key: 'stories', es: 'Historias de Éxito', en: 'Success Stories', own: true },
  { key: 'templates', es: 'Configuración de Plantillas', en: 'Template Configuration', own: true },
  { key: 'testing', es: 'Hub de Testing', en: 'Testing Hub', own: true },
  { key: 'enterprise', es: 'Funcionalidades Enterprise', en: 'Enterprise Features', own: true },
  { key: 'translations', es: 'Caché de Traducciones', en: 'Translation Cache', own: true },
  { key: 'feed', es: 'Feed', en: 'Feed', own: false },
];

const BACK: Record<Lang, string> = { es: 'Volver al Dashboard', en: 'Back to Dashboard' };
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function openAdmin(context: BrowserContext, page: Page, testInfo: TestInfo, lang: Lang = 'es') {
  if (!testInfo.project.use.isMobile) await page.setViewportSize({ width: MOBILE_WIDTH, height: 844 });
  const profiles = makeProfiles(117);
  const admin = profiles.find(p => p.id === ADMIN_ID)!;
  await installInitState(context, { sessionProfile: admin, theme: 'light', language: lang });
  const mock = await mockSupabase(context, { profiles });
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(cardFor(page, TABS[0][lang])).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('[data-testid="profiles-table"]')).toBeVisible({ timeout: 20_000 });
  return mock;
}

/** Boton-tarjeta de la portada cuyo h3 empieza por `title`. */
function cardFor(page: Page, title: string): Locator {
  return page.locator('button').filter({ has: page.getByRole('heading', { level: 3, name: new RegExp(`^${escapeRe(title)}`) }) });
}

/** Espera a que la vista deje de mostrar spinners (sin fallar si alguno es perpetuo). */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  await expect.poll(() => page.locator('.animate-spin:visible').count(), { timeout: 8_000 }).toBe(0).catch(() => {});
  await page.waitForTimeout(250);
}

interface Layout { scrollWidth: number; bodyScrollWidth: number; viewport: number; scale: number; offenders: string[] }

/** Ancho del documento frente al viewport del dispositivo y zoom del visual viewport. */
async function measure(page: Page): Promise<Layout> {
  const viewport = page.viewportSize()!.width;
  return page.evaluate((vw) => {
    const de = document.documentElement;
    const desc = (el: Element) => {
      const cls = (el.getAttribute('class') || '').slice(0, 70);
      const r = el.getBoundingClientRect();
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}[${cls}] right=${Math.round(r.right + window.scrollX)}`;
    };
    // Elementos que sobresalen del viewport sin estar dentro de un contenedor con scroll propio.
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox !== 'visible') return true;
      }
      return false;
    };
    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right + window.scrollX <= vw + 1) continue;
      if (clipped(el)) continue;
      const parent = el.parentElement;
      if (parent && parent !== document.body) {
        const pr = parent.getBoundingClientRect();
        if (pr.right + window.scrollX > vw + 1 && !clipped(parent)) continue; // solo el mas externo
      }
      offenders.push(desc(el));
      if (offenders.length >= 8) break;
    }
    return {
      scrollWidth: de.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      viewport: vw,
      scale: window.visualViewport ? window.visualViewport.scale : 1,
      offenders,
    };
  }, viewport);
}

function expectNoHorizontalScroll(l: Layout, where: string) {
  expect.soft(l.scrollWidth, `${where}: scrollWidth ${l.scrollWidth} > ${l.viewport}\n${l.offenders.join('\n')}`).toBeLessThanOrEqual(l.viewport);
  expect.soft(l.bodyScrollWidth, `${where}: body.scrollWidth`).toBeLessThanOrEqual(l.viewport);
  expect.soft(l.scale, `${where}: visualViewport.scale`).toBe(1);
}

async function shot(page: Page, testInfo: TestInfo, name: string) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${testInfo.project.name}-${name}.png`), fullPage: false }).catch(() => {});
}

/** Abre la pestana desde su tarjeta con un clic real (sin dispatchEvent). */
async function openTabFromCard(page: Page, title: string, lang: Lang) {
  const card = cardFor(page, title);
  await expect(card).toHaveCount(1);
  await card.scrollIntoViewIfNeeded();
  await card.click({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: BACK[lang] })).toBeVisible({ timeout: 20_000 });
}

async function backToHome(page: Page, lang: Lang) {
  await page.getByRole('button', { name: BACK[lang] }).click();
  await expect(cardFor(page, TABS[0][lang])).toBeVisible({ timeout: 20_000 });
}

/**
 * Controles interactivos visibles sin nombre accesible propio (texto, aria-label o
 * aria-labelledby). `title` no cuenta: es solo un tooltip y no llega en movil.
 */
async function unnamedControls(page: Page, root: string) {
  return page.evaluate((rootSel) => {
    const scope = document.querySelector(rootSel);
    if (!scope) return [`no existe ${rootSel}`];
    const out: string[] = [];
    for (const el of Array.from(scope.querySelectorAll('button, a[href], [role="button"]'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const aria = (el.getAttribute('aria-label') || '').trim();
      const by = el.getAttribute('aria-labelledby');
      const byText = by ? by.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim() : '';
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const imgAlt = Array.from(el.querySelectorAll('img[alt]')).map(i => i.getAttribute('alt') || '').join(' ').trim();
      if (aria || byText || text || imgAlt) continue;
      out.push(`${el.tagName.toLowerCase()}[${(el.getAttribute('class') || '').slice(0, 60)}] title=${el.getAttribute('title') ?? ''}`);
    }
    return out;
  }, root);
}

/** Elementos con outline-none que no ofrecen un indicador de foco alternativo. */
async function focusless(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('main [class*="outline-none"]'))
    .map(el => el.getAttribute('class') || '')
    .filter(c => !/focus(-visible)?:ring|focus(-visible)?:border|focus-visible:outline/.test(c))
    .map(c => c.slice(0, 90)));
}

// ---------------------------------------------------------------------------
// 1. Sin scroll horizontal ni zoom reducido; las tarjetas abren su pestana
// ---------------------------------------------------------------------------
test.describe('U14 movil: portada y pestanas de /admin', () => {
  test('sin scroll horizontal, scale 1 y clic real en cada tarjeta', async ({ context, page }, testInfo) => {
    test.setTimeout(300_000);
    await openAdmin(context, page, testInfo, 'es');
    await settle(page);
    await freezeMotion(page);

    const home = await measure(page);
    testInfo.annotations.push({ type: 'portada', description: JSON.stringify(home) });
    expectNoHorizontalScroll(home, 'portada');
    await shot(page, testInfo, 'portada');
    await page.locator('[data-testid="profiles-table"]').scrollIntoViewIfNeeded();
    await shot(page, testInfo, 'portada-tabla');
    await page.evaluate(() => window.scrollTo(0, 0));

    for (const tab of TABS) {
      await openTabFromCard(page, tab.es, 'es');
      await settle(page);
      const l = await measure(page);
      testInfo.annotations.push({ type: tab.key, description: JSON.stringify(l) });
      if (tab.own) expectNoHorizontalScroll(l, `pestana ${tab.key}`);
      await shot(page, testInfo, `tab-${tab.key}`);
      await backToHome(page, 'es');
    }
  });

  test('el desplegable de descarga de la tabla de perfiles no queda recortado', async ({ context, page }, testInfo) => {
    await openAdmin(context, page, testInfo, 'es');
    const table = page.locator('[data-testid="profiles-table"]');
    const trigger = table.getByRole('button', { name: 'Descargar CV' }).last();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    // Todas las opciones se ven enteras dentro del viewport
    const items = menu.getByRole('menuitem');
    await expect(items).toHaveCount(3);
    // El foco entra en el menu y las flechas lo recorren
    await expect(items.first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    const vw = page.viewportSize()!;
    for (const box of await items.evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }))) {
      expect(box.l).toBeGreaterThanOrEqual(0);
      expect(box.r).toBeLessThanOrEqual(vw.width);
      expect(box.t).toBeGreaterThanOrEqual(0);
      expect(box.b).toBeLessThanOrEqual(vw.height);
    }
    // El elemento visible en el centro de la primera opcion es la propia opcion (no tapada)
    const first = items.first();
    const hit = await first.evaluate(el => { const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!top && el.contains(top); });
    expect(hit).toBe(true);
    expectNoHorizontalScroll(await measure(page), 'menu de descarga');
    await shot(page, testInfo, 'menu-descarga');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 2. Textos en ingles con la interfaz en ingles
// ---------------------------------------------------------------------------
test.describe('U14 i18n: Gestion de perfiles y de plantillas en ingles', () => {
  const SPANISH = /\b(Gestión|Recargar|Buscar|Filtrar|Todos los planes|Usuario|País|Registro|Acciones|Plantilla|Gratuita|Oculta|Vista Previa|Sin configurar|Cómo funciona|perfiles encontrados|Cargando)\b/;

  test('portada (gestion de perfiles) y modales en ingles', async ({ context, page }, testInfo) => {
    await openAdmin(context, page, testInfo, 'en');
    await expect(page.getByRole('heading', { name: 'Profiles Management' })).toBeVisible();
    await expect(page.getByText('117 profiles found')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible();
    await expect(page.getByPlaceholder('Name, email, headline...')).toBeVisible();
    await expect(page.locator('select:has(option[value="enterprise"]) option[value="all"]').first()).toHaveText('All plans');
    const table = page.locator('[data-testid="profiles-table"]');
    const headers = (await table.locator('thead th').allTextContents()).map(s => s.trim());
    expect(headers).toEqual(['User', 'Email', 'Custom URL', 'Country', 'Plan', 'Joined', 'Actions']);
    const tableText = await table.innerText();
    expect(tableText).not.toMatch(SPANISH);
    // Fechas con el locale del idioma (makeProfiles: enero de 2026)
    const joined = (await table.locator('tbody tr td:nth-child(6)').allTextContents()).map(s => s.trim());
    expect(joined.length).toBeGreaterThan(0);
    for (const d of joined) expect(d).toMatch(/^(Jan|Feb|Mar|Apr)\s\d{2},\s26$/);

    // Modal de edicion
    await table.getByRole('button', { name: 'Edit' }).first().click();
    const edit = page.getByRole('dialog', { name: 'Edit profile' });
    await expect(edit).toBeVisible();
    await expect(edit.getByRole('button', { name: 'Save changes' })).toBeVisible();
    await expect(edit.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(edit.getByRole('button', { name: 'Close' })).toBeVisible();
    expect(await edit.innerText()).not.toMatch(/Nombre Completo|Guardar|Cancelar|Nota del administrador|Rol\b/);
    await shot(page, testInfo, 'en-modal-editar');
    await edit.getByRole('button', { name: 'Cancel' }).click();
    await expect(edit).toBeHidden();

    // Modal Enterprise
    await table.getByRole('button', { name: 'Enterprise features' }).first().click();
    const ent = page.getByRole('dialog', { name: /Enterprise features/ });
    await expect(ent).toBeVisible();
    await expect(ent.getByRole('button', { name: 'Close', exact: true }).last()).toBeVisible();
    expect(await ent.innerText()).not.toMatch(/Actualizar a Enterprise|Activar Enterprise|Cerrar|No se pudieron/);
    await ent.getByRole('button', { name: 'Close', exact: true }).last().click();
    await expect(ent).toBeHidden();
  });

  test('gestion de plantillas en ingles', async ({ context, page }, testInfo) => {
    await openAdmin(context, page, testInfo, 'en');
    await openTabFromCard(page, 'Template Configuration', 'en');
    await expect(page.getByRole('heading', { name: 'Template Management' })).toBeVisible();
    const root = page.locator('h2:has-text("Template Management")').locator('xpath=../../..');
    const headers = (await root.locator('table thead th').allTextContents()).map(s => s.trim());
    expect(headers).toEqual(['Template', 'ID', 'Preview', 'Free', 'Premium', 'Hidden', 'Status']);
    await expect(page.getByPlaceholder('Search template by name or ID...')).toBeVisible();
    expect(await root.innerText()).not.toMatch(SPANISH);
    await shot(page, testInfo, 'en-plantillas');
    await root.getByRole('button', { name: /View/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Sample user:')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Pestanas diferidas: el codigo de cada pestana no se descarga hasta abrirla
// ---------------------------------------------------------------------------
test.describe('U14 pestanas diferidas', () => {
  test('UserMonitoring (recharts) y el resto de secciones se cargan al abrir su pestana', async ({ context, page }, testInfo) => {
    const requested: string[] = [];
    page.on('request', r => requested.push(new URL(r.url()).pathname));
    await openAdmin(context, page, testInfo, 'es');
    await settle(page);
    const lazy = ['UserMonitoring', 'StampsManagement', 'UserModeration', 'TemplateManagement', 'AdminTestingHub', 'CompanyManagementSection', 'EnterpriseFeaturesManagement', 'TranslationCacheManagement'];
    for (const name of lazy) {
      expect(requested.filter(p => p.includes(`/components/admin/${name}`)), `${name} cargado en la portada`).toEqual([]);
    }
    expect(requested.filter(p => /\/recharts/.test(p)), 'recharts en la portada').toEqual([]);

    await openTabFromCard(page, 'Monitoreo de Usuarios', 'es');
    await expect.poll(() => requested.some(p => p.includes('/components/admin/UserMonitoring'))).toBe(true);
  });

  test('fallback accesible mientras carga la pestana', async ({ context, page }, testInfo) => {
    await openAdmin(context, page, testInfo, 'es');
    // Retrasa el modulo de la pestana para ver el fallback de Suspense
    await page.route('**/components/admin/StampsManagement.tsx*', async route => {
      await new Promise(r => setTimeout(r, 1500));
      await route.continue();
    });
    const card = cardFor(page, 'Verificación de Stamps');
    await card.scrollIntoViewIfNeeded();
    await card.click();
    const status = page.getByRole('status', { name: 'Cargando sección…' });
    await expect(status).toBeVisible();
    await expect(status).toBeHidden({ timeout: 20_000 });
  });
});

// ---------------------------------------------------------------------------
// 4. Accesibilidad: botones de icono con nombre y foco visible
// ---------------------------------------------------------------------------
test.describe('U14 accesibilidad de botones de icono', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`controles con nombre accesible y foco visible (${lang})`, async ({ context, page }, testInfo) => {
      test.setTimeout(240_000);
      await openAdmin(context, page, testInfo, lang);
      await settle(page);
      const problems: string[] = [];
      const check = async (where: string) => {
        for (const c of await unnamedControls(page, 'main')) problems.push(`${where}: ${c}`);
        for (const c of await focusless(page)) problems.push(`${where}: outline-none sin foco: ${c}`);
      };
      await check('portada');
      for (const tab of TABS.filter(t => t.own)) {
        await openTabFromCard(page, tab[lang], lang);
        await settle(page);
        await check(tab.key);
        await backToHome(page, lang);
      }
      expect(problems, problems.join('\n')).toEqual([]);

      // Nombres concretos de la tabla de perfiles en el idioma de la interfaz
      const table = page.locator('[data-testid="profiles-table"]');
      const names = lang === 'es'
        ? ['Ver CV', 'Descargar CV', 'Funcionalidades Enterprise', 'Editar', 'Eliminar']
        : ['View CV', 'Download CV', 'Enterprise features', 'Edit', 'Delete'];
      for (const n of names) await expect(table.getByRole(n === names[0] ? 'link' : 'button', { name: n, exact: true }).first()).toBeVisible();
    });
  }
});
