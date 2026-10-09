/**
 * QA del panel /admin con sesion admin y Supabase MOCKEADOS (nada sale a produccion).
 *
 *   QA_PORT=5340 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/admin.local.spec.ts
 *
 * Regresion de modo oscuro (#19): `QA_DARK_BASELINE=capture` regenera las lineas base
 * en tests/qa/fixtures/ (hacerlo SOLO con un tailwind.config.js de referencia).
 */
import { test, expect, type Page, type BrowserContext, type Browser, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, freezeMotion, contrastRatio, type SupabaseMock } from './helpers/supabaseMock';
import { sampleDarkColors, diffSamples, readEffectiveColors, type ColorSample } from './helpers/darkSample';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures');

/** Contexto nuevo con las opciones del proyecto (viewport, movil, baseURL...). */
async function newCtx(browser: Browser, testInfo: TestInfo, colorScheme: 'light' | 'dark') {
  const u = testInfo.project.use as any;
  return browser.newContext({
    baseURL: u.baseURL,
    viewport: u.viewport,
    userAgent: u.userAgent,
    deviceScaleFactor: u.deviceScaleFactor,
    isMobile: u.isMobile,
    hasTouch: u.hasTouch,
    locale: 'es-ES',
    colorScheme,
    ...SAFE_CONTEXT_OPTIONS,
  });
}

async function openApp(context: BrowserContext, page: Page, opts: { theme: 'light' | 'dark'; route: string; session?: boolean }) {
  const profiles = makeProfiles(117);
  const admin = profiles.find(p => p.id === ADMIN_ID)!;
  await installInitState(context, { sessionProfile: opts.session === false ? null : admin, theme: opts.theme, language: 'es' });
  const mock = await mockSupabase(context, { profiles });
  await page.goto(opts.route, { waitUntil: 'domcontentloaded' });
  return mock;
}

async function openAdmin(context: BrowserContext, page: Page, theme: 'light' | 'dark'): Promise<SupabaseMock> {
  const mock = await openApp(context, page, { theme, route: '/admin' });
  await expect(page.getByText('Moderación de Usuarios').first()).toBeVisible({ timeout: 45_000 });
  return mock;
}

/**
 * Click centrando antes el elemento (la cabecera sticky puede tapar botones de las
 * tablas). Clic real: desde U14 la portada de /admin no ensancha el documento en
 * movil y ya no hace falta el dispatchEvent de respaldo.
 */
async function clickCentered(loc: ReturnType<Page['locator']>) {
  await loc.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await loc.click({ timeout: 10_000 });
}

/**
 * Solo para /admin/search: en movil el filtro lateral (aside w-72 de
 * talent-search/CompanyTalentSearchPage, fuera del panel /admin) se superpone a la
 * paginacion e intercepta el puntero. Pendiente de arreglar en esa pagina.
 */
async function clickCenteredOrDispatch(loc: ReturnType<Page['locator']>) {
  await loc.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
  try {
    await loc.click({ timeout: 5_000 });
  } catch {
    await loc.dispatchEvent('click');
  }
}

async function openTab(page: Page, name: RegExp) {
  await clickCentered(page.getByRole('button', { name }).first());
}

// ---------------------------------------------------------------------------
// #19 Regresion: el nuevo selector de `dark:` no cambia nada con <html class="dark">
// ---------------------------------------------------------------------------
test.describe('#19 regresion modo oscuro global', () => {
  test('colores computados identicos a la linea base con html.dark', async ({ browser }, testInfo) => {
    test.setTimeout(150_000);
    const samples: Record<string, ColorSample[]> = {};

    // 1) Pagina publica + cabecera (sin sesion)
    {
      const context = await newCtx(browser, testInfo, 'dark');
      const page = await context.newPage();
      // Testimonials oculta su seccion si el script de Opynio falla (onerror) y el
      // router de QA aborta todo origen externo: sin este stub la seccion desaparece
      // y la muestra de `main` depende de la red. Se sirve un script vacio en local
      // (page.route tiene prioridad sobre el route del contexto); el contenido del
      // widget queda fuera de la muestra (THIRD_PARTY_WIDGETS).
      await page.route('https://web.opynio.com/**', route =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub QA: widget de Opynio */' }));
      await openApp(context, page, { theme: 'dark', route: '/', session: false });
      await expect(page.locator('header').first()).toBeVisible({ timeout: 45_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await freezeMotion(page);
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
      samples.header = await sampleDarkColors(page, 'header');
      samples.home = await sampleDarkColors(page, 'main');
      await context.close();
    }

    // 2) Dashboard admin (sin la tabla de perfiles, que cambia en este mismo arreglo)
    // 3) Plantilla de CV (Classic) dentro de un ancestro .dark (vista previa en oscuro)
    {
      const context = await newCtx(browser, testInfo, 'dark');
      const page = await context.newPage();
      await openAdmin(context, page, 'dark');
      await page.waitForLoadState('networkidle').catch(() => {});
      await freezeMotion(page);
      await page.evaluate(() => {
        const h2 = [...document.querySelectorAll('h2')].find(h => /Gestión de Usuarios|Users Management/.test(h.textContent || ''));
        h2?.closest('.rounded-lg')?.setAttribute('data-qa-skip', '');
      });
      await page.waitForTimeout(300);
      samples.adminDashboard = await sampleDarkColors(page, 'main', { exclude: '[data-qa-skip]' });

      await openTab(page, /Hub de Testing/);
      await clickCentered(page.getByText('Datos de Muestra').first());
      await expect(page.locator('.cv-template')).toBeVisible();
      await clickCentered(page.getByRole('button', { name: /Tema Oscuro/ }));
      await freezeMotion(page);
      await page.waitForTimeout(300);
      samples.cvTemplateDark = await sampleDarkColors(page, '.cv-template');
      await context.close();
    }

    for (const [k, v] of Object.entries(samples)) expect(v.length, `muestra ${k} vacia`).toBeGreaterThan(5);

    const file = path.join(FIXTURES, `dark-regression-baseline.${testInfo.project.name}.json`);
    if (process.env.QA_DARK_BASELINE === 'capture') {
      fs.mkdirSync(FIXTURES, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(samples, null, 1));
      testInfo.annotations.push({ type: 'baseline', description: `capturada en ${file}` });
      return;
    }
    expect(fs.existsSync(file), `falta la linea base ${file}`).toBe(true);
    const baseline = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, ColorSample[]>;
    const report: string[] = [];
    for (const area of Object.keys(baseline)) {
      // La linea base se capturo con el darkMode de referencia ('class'). Lo que se
      // verifica es que TODO elemento de la linea base sigue existiendo con colores
      // identicos. Los elementos anadidos despues (p. ej. el selector de idioma
      // movil que paso a la cabecera, Header.tsx) no tienen valor de referencia:
      // se anotan en el informe pero no fallan. Un elemento quitado o con otras
      // clases (sale como quitado + nuevo) SI falla.
      const added: string[] = [];
      const d = diffSamples(baseline[area], samples[area] || [], { added: 'ignore', onAdded: k => added.push(k) });
      if (d.length) report.push(`== ${area} ==`, ...d.slice(0, 40));
      for (const k of added) testInfo.annotations.push({ type: 'elemento nuevo sin linea base', description: `${area}: ${k}` });
    }
    expect(report, report.join('\n')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Utilidades para los tests funcionales
// ---------------------------------------------------------------------------
const SHOTS = process.env.QA_SHOTS_DIR || path.join(HERE, '..', '..', 'test-results', 'qa-admin-shots');

async function shot(page: Page, testInfo: TestInfo, name: string, locator?: ReturnType<Page['locator']>) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${testInfo.project.name}-${name}.png`);
  if (locator) await locator.screenshot({ path: file }).catch(() => {});
  else await page.screenshot({ path: file }).catch(() => {});
}

const DATA = makeProfiles(117);
/** Mismo orden que la consulta: created_at desc, id asc. */
const sorted = (rows: typeof DATA) => rows.slice().sort((a, b) =>
  a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const isProfessional = (r: any) => r.role === 'professional' || r.role == null;
const PLAN_LABEL: Record<string, string> = { free: 'Free', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };

async function rowNames(page: Page, tableTestId: string) {
  return page.locator(`[data-testid="${tableTestId}"] tbody tr td:first-child .font-medium`).allTextContents();
}

// ---------------------------------------------------------------------------
// #15 + #14 Moderacion de usuarios: roles reales, plan real, paginacion servidor
// ---------------------------------------------------------------------------
test.describe('#14/#15 Moderacion de usuarios', () => {
  test('roles reales, plan real y paginacion en servidor', async ({ context, page }, testInfo) => {
    test.setTimeout(120_000);
    const mock = await openAdmin(context, page, 'light');
    mock.clear();
    await openTab(page, /Moderación de Usuarios/);
    const summary = page.getByText(/Mostrando \d+–\d+ de \d+/);
    await expect(summary).toHaveText('Mostrando 1–25 de 117');

    // Tarjetas: consultas head:true, NULL cuenta como activo
    const suspended = DATA.filter(r => r.is_active === false).length;
    const cards = page.locator('p.text-2xl');
    await expect(cards).toHaveText([String(DATA.length), String(DATA.length - suspended), String(suspended)]);
    expect(mock.requestsTo('profiles').filter(r => r.method === 'HEAD').length).toBeGreaterThanOrEqual(2);

    // Peticion paginada: columnas concretas, count exact, offset/limit, orden estable
    // Listado del panel: vista profiles_full (email/plan/moderacion son privados en profiles)
    const list = mock.requestsTo('profiles_full').filter(r => r.method === 'GET' && !r.params.id);
    expect(list.length).toBeGreaterThan(0);
    for (const r of list) {
      expect(r.params.select?.[0]).not.toBe('*');
      expect(r.params.limit?.[0]).toBe('25');
      expect(r.prefer || '').toContain('count=exact');
      expect(r.params.order?.[0]).toBe('created_at.desc,id.asc');
    }
    const ordered = sorted(DATA);
    await expect.poll(() => rowNames(page, 'users-table')).toEqual(ordered.slice(0, 25).map(r => r.full_name));

    // Columna Plan: plan real (antes "Free" fijo)
    const planCells = page.locator('[data-testid="users-table"] tbody tr td:nth-child(4) span');
    await expect(planCells).toHaveText(ordered.slice(0, 25).map(r => PLAN_LABEL[r.plan || 'free']));
    await shot(page, testInfo, '14-15-moderacion-p1');

    // Pagina 2
    await clickCentered(page.getByRole('button', { name: 'Página siguiente' }).first());
    await expect(summary).toHaveText('Mostrando 26–50 de 117');
    await expect.poll(() => rowNames(page, 'users-table')).toEqual(ordered.slice(25, 50).map(r => r.full_name));
    expect(mock.requestsTo('profiles_full').some(r => r.params.offset?.[0] === '25')).toBe(true);

    // Filtro por rol: valores reales de BD; 'Profesional' incluye role NULL. Vuelve a la pagina 1.
    const roleSel = page.locator('select:has(option[value="profile_manager"])');
    await expect(roleSel.locator('option')).toHaveText(['Todos', 'Profesional', 'Empresa', 'Gestor de perfiles', 'Administrador']);
    const roleCases: Array<[string, (r: any) => boolean]> = [
      ['professional', isProfessional],
      ['employer', (r) => r.role === 'employer'],
      ['profile_manager', (r) => r.role === 'profile_manager'],
      ['admin', (r) => r.role === 'admin'],
    ];
    for (const [value, pred] of roleCases) {
      await roleSel.selectOption(value);
      const n = DATA.filter(pred).length;
      expect(n).toBeGreaterThan(0);
      await expect(summary).toHaveText(`Mostrando 1–${Math.min(25, n)} de ${n}`);
      await expect.poll(() => rowNames(page, 'users-table')).toEqual(sorted(DATA.filter(pred)).slice(0, 25).map(r => r.full_name));
      if (value === 'professional') await shot(page, testInfo, '15-filtro-profesional');
    }
    expect(mock.requests.some(r => r.params.or?.[0] === '(role.eq.professional,role.is.null)')).toBe(true);

    // Estado suspendido
    const statusSel = page.locator('select:has(option[value="suspended"])');
    await roleSel.selectOption('all');
    await statusSel.selectOption('suspended');
    await expect(summary).toHaveText(`Mostrando 1–${suspended} de ${suspended}`);

    // Busqueda con debounce + combinacion con rol en un unico or=
    await statusSel.selectOption('all');
    await roleSel.selectOption('professional');
    await expect(summary).toHaveText(/de \d+/);
    const search = page.getByPlaceholder('Buscar usuarios...');
    mock.clear();
    await search.fill('Profesional 01');
    const expectedSearch = DATA.filter(r => isProfessional(r) && /profesional 01/i.test(r.full_name));
    await expect(summary).toHaveText(`Mostrando 1–${expectedSearch.length} de ${expectedSearch.length}`);
    const searchReqs = mock.requestsTo('profiles_full').filter(r => r.method === 'GET' && r.params.or);
    expect(searchReqs.length, 'debounce: una sola consulta por termino').toBe(1);
    expect(searchReqs[0].params.or[0]).toBe('(and(or(role.eq.professional,role.is.null),or(full_name.ilike."%Profesional 01%",email.ilike."%Profesional 01%")))');

    // Caracteres reservados de PostgREST: no rompen la consulta
    await roleSel.selectOption('all');
    await search.fill('pro11@example.test, (x)');
    await expect(page.getByText('No se encontraron usuarios')).toBeVisible();
    await search.fill('pro11@example.test');
    await expect(summary).toHaveText('Mostrando 1–1 de 1');

    // Modal: badge de rol con texto (antes no se mostraba con role NULL y salia
    // vacio con 'professional') y plan. pro11 tiene role NULL en los datos de prueba.
    expect(DATA.find(r => r.email === 'pro11@example.test')!.role).toBeNull();
    await clickCentered(page.locator('[data-testid="users-table"] button[title="Ver Detalles"]').first());
    await expect(page.locator('span', { hasText: /^Profesional$/ }).first()).toBeVisible();
    await shot(page, testInfo, '15-modal-rol');
  });

  test('modo oscuro: contraste de la paginacion y del plan', async ({ context, page }, testInfo) => {
    await openAdmin(context, page, 'dark');
    await openTab(page, /Moderación de Usuarios/);
    await expect(page.getByText('Mostrando 1–25 de 117')).toBeVisible();
    await freezeMotion(page);
    const plan = await readEffectiveColors(page, '[data-testid="users-table"] tbody tr td:nth-child(4) span');
    expect(contrastRatio(plan.color, plan.bg)).toBeGreaterThanOrEqual(4.5);
    const sum = await readEffectiveColors(page, 'p[aria-live="polite"]');
    expect(contrastRatio(sum.color, sum.bg)).toBeGreaterThanOrEqual(4.5);
    const pageBtn = await readEffectiveColors(page, 'nav[aria-label="Paginación"] button[aria-label="Ir a la página 2"]');
    expect(contrastRatio(pageBtn.color, pageBtn.bg)).toBeGreaterThanOrEqual(4.5);
    await shot(page, testInfo, '14-moderacion-dark');
  });
});

// ---------------------------------------------------------------------------
// #20 Gestion de perfiles (portada de /admin): paginada, sin descargar todo
// ---------------------------------------------------------------------------
test.describe('#20 Gestion de perfiles', () => {
  test('portada de /admin paginada en servidor con tarjetas head:true', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const mock = await openAdmin(context, page, 'light');
    await expect(page.getByText('117 perfiles encontrados')).toBeVisible();
    const table = page.locator('[data-testid="profiles-table"]');
    await expect(table.locator('tbody tr')).toHaveCount(25);

    // Ninguna peticion de listado de perfiles sin limite (antes select=* sin range)
    const listReqs = mock.requestsTo('profiles_full').filter(r => r.method === 'GET' && !r.params.id);
    const pmReqs = listReqs.filter(r => (r.params.select?.[0] || '').includes('country_code'));
    expect(pmReqs.length).toBeGreaterThan(0);
    for (const r of pmReqs) {
      expect(r.params.limit?.[0]).toBe('25');
      expect(r.prefer || '').toContain('count=exact');
    }
    expect(listReqs.filter(r => r.params.select?.[0] === '*' && !r.params.limit), 'select=* sin limite').toEqual([]);

    // Tarjetas por plan (NULL = Free)
    const count = (p: string) => DATA.filter(r => (p === 'free' ? !r.plan || r.plan === 'free' : r.plan === p)).length;
    const statNums = page.locator('div.grid.grid-cols-2 > div > div.text-2xl');
    await expect(statNums).toHaveText([count('free'), count('basic'), count('pro'), count('enterprise')].map(String));

    // Paginacion + filtro de plan + busqueda
    await expect(page.getByText('Mostrando 1–25 de 117')).toBeVisible();
    await clickCentered(page.getByRole('button', { name: 'Ir a la página 2' }).first());
    await expect(page.getByText('Mostrando 26–50 de 117')).toBeVisible();
    await expect.poll(() => rowNames(page, 'profiles-table')).toEqual(sorted(DATA).slice(25, 50).map(r => r.full_name));

    const planSel = page.locator('select:has(option[value="all"]):has(option[value="enterprise"])');
    await planSel.selectOption('pro');
    await expect(page.getByText(`${count('pro')} perfiles encontrados`)).toBeVisible();
    await expect(page.getByText(`Mostrando 1–${Math.min(25, count('pro'))} de ${count('pro')}`)).toBeVisible();

    await planSel.selectOption('all');
    await page.getByPlaceholder('Nombre, email, headline...').fill('Ingeniera');
    const n = DATA.filter(r => /ingeniera/i.test(r.headline)).length;
    await expect(page.getByText(`${n} perfiles encontrados`)).toBeVisible();

    // Selector de rol del modal de edicion: valores reales
    await clickCentered(table.locator('button[title="Editar"]').first());
    const roleSel = page.locator('select:has(option[value="profile_manager"])');
    await expect(roleSel.locator('option')).toHaveText(['Profesional', 'Empresa', 'Gestor de perfiles', 'Administrador']);
    await shot(page, testInfo, '20-perfiles-modal');
    await clickCentered(page.getByRole('button', { name: 'Cancelar' }));
    await shot(page, testInfo, '20-perfiles-paginados');
    expect(mock.writes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// #16 Gestion de plantillas: modo oscuro completo, lienzo del CV blanco
// ---------------------------------------------------------------------------
test.describe('#16 Gestion de plantillas', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`contraste y fondos en tema ${theme}`, async ({ context, page }, testInfo) => {
      await openAdmin(context, page, theme);
      await openTab(page, /Configuración de Plantillas/);
      await expect(page.getByRole('heading', { name: 'Gestión de Plantillas' })).toBeVisible();
      await freezeMotion(page);

      const title = await readEffectiveColors(page, 'h2:has-text("Gestión de Plantillas")');
      expect(contrastRatio(title.color, title.bg), `titulo ${JSON.stringify(title)}`).toBeGreaterThanOrEqual(4.5);
      const cell = await readEffectiveColors(page, 'table tbody tr td .text-sm.font-medium');
      expect(contrastRatio(cell.color, cell.bg)).toBeGreaterThanOrEqual(4.5);
      const th = await readEffectiveColors(page, 'table thead th');
      expect(contrastRatio(th.color, th.bg)).toBeGreaterThanOrEqual(4.5);
      const chip = await readEffectiveColors(page, 'table tbody tr td:nth-child(4) button');
      expect(contrastRatio(chip.color, chip.bg)).toBeGreaterThanOrEqual(4.5);
      const help = await readEffectiveColors(page, 'h3:has-text("Cómo funciona")');
      expect(contrastRatio(help.color, help.bg)).toBeGreaterThanOrEqual(4.5);

      if (theme === 'dark') {
        // Contenedor como el resto de pestanas (dark-bg-secondary) y tabla oscura
        expect(title.bg).toBe('rgb(26, 31, 38)');
        expect(th.bg).toBe('rgb(39, 44, 53)');
        const input = await readEffectiveColors(page, 'input[placeholder^="Buscar plantilla"]');
        expect(input.bg).toBe('rgb(39, 44, 53)');
      } else {
        expect(title.bg).toBe('rgb(255, 255, 255)');
      }
      await shot(page, testInfo, `16-plantillas-${theme}`);

      // Modal: cabecera/pie segun tema, lienzo del CV siempre blanco
      await clickCentered(page.getByRole('button', { name: /Ver/ }).first());
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const canvas = dialog.locator('.cv-force-light');
      await expect(canvas).toBeVisible();
      await page.waitForTimeout(300);
      expect(await canvas.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
      expect(await dialog.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(theme === 'dark' ? 'rgb(26, 31, 38)' : 'rgb(255, 255, 255)');
      // Dentro del lienzo no se aplica ninguna variante dark: (texto oscuro)
      const textColor = await canvas.evaluate(el => {
        const t = [...el.querySelectorAll('h1, h2, p')].find(n => (n.textContent || '').trim().length > 2);
        return t ? getComputedStyle(t).color : null;
      });
      expect(textColor).not.toBeNull();
      const avg = (textColor!.match(/[\d.]+/g) || []).slice(0, 3).map(Number).reduce((a, b) => a + b, 0) / 3;
      expect(avg, `texto del CV ${textColor}`).toBeLessThan(160);
      await shot(page, testInfo, `16-plantillas-modal-${theme}`);
    });
  }
});

// ---------------------------------------------------------------------------
// #17 y #19 Testing Hub
// ---------------------------------------------------------------------------
test.describe('#17/#19 Testing Hub', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`origen de datos y tema de la vista previa con pagina ${theme}`, async ({ context, page }, testInfo) => {
      test.setTimeout(90_000);
      await openAdmin(context, page, theme);
      await openTab(page, /Hub de Testing/);
      await expect(page.getByText('Origen de Datos')).toBeVisible();
      await freezeMotion(page);

      // #17: className evaluado y tarjeta seleccionada distinguible
      const CARD_SEL = 'label:has(input[type="radio"])';
      const labels = page.locator(CARD_SEL).filter({ hasText: /Datos de Muestra|Usuario Real/ });
      await expect(labels).toHaveCount(2);
      for (const c of await labels.evaluateAll(els => els.map(e => e.className))) expect(c).not.toContain('${');
      const read = async () => {
        const out: Array<{ card: { color: string; bg: string; border: string }; tC: number; sC: number }> = [];
        for (let i = 0; i < 2; i++) {
          const card = await readEffectiveColors(page, `${CARD_SEL}:has-text("Datos de Muestra"), ${CARD_SEL}:has-text("Usuario Real")`, i);
          const t = await readEffectiveColors(page, `${CARD_SEL}:has-text("${i === 0 ? 'Datos de Muestra' : 'Usuario Real'}") .font-medium`);
          const s = await readEffectiveColors(page, `${CARD_SEL}:has-text("${i === 0 ? 'Datos de Muestra' : 'Usuario Real'}") .text-xs`);
          out.push({ card, tC: contrastRatio(t.color, t.bg), sC: contrastRatio(s.color, s.bg) });
        }
        return out;
      };
      const PURPLE = 'rgb(168, 85, 247)'; // border-purple-500
      const checkedIdx = async () => (await labels.evaluateAll(els => els.map(e => (e.querySelector('input') as HTMLInputElement).checked))).indexOf(true);
      const verify = async () => {
        const idx = await checkedIdx();
        expect(idx).toBeGreaterThanOrEqual(0);
        const cards = await read();
        const selected = cards[idx], other = cards[1 - idx];
        expect(selected.card.border).toBe(PURPLE);
        expect(other.card.border).not.toBe(PURPLE);
        expect(other.card.bg).not.toBe(selected.card.bg);
        for (const c of cards) {
          expect(c.tC, JSON.stringify(c)).toBeGreaterThanOrEqual(4.5);
          expect(c.sC, JSON.stringify(c)).toBeGreaterThanOrEqual(4.5);
        }
        return idx;
      };
      const first = await verify();
      await shot(page, testInfo, `17-origen-datos-${theme}`, labels.first().locator('xpath=../..'));
      // Cambiar la seleccion mueve el resaltado
      await clickCentered(labels.nth(1 - first));
      expect(await verify()).toBe(1 - first);
      // Datos de muestra para la vista previa
      await clickCentered(labels.filter({ hasText: 'Datos de Muestra' }));
      expect(await verify()).toBe(0);

      // #19: el boton de tema cambia la vista previa tambien con la pagina en oscuro
      const cv = page.locator('.cv-template');
      await expect(cv).toBeVisible();
      const bg = () => cv.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(await bg()).toBe('rgb(255, 255, 255)');
      const lightSample = await sampleDarkColors(page, '.cv-template');
      await shot(page, testInfo, `19-preview-pagina-${theme}-claro`, cv);
      await clickCentered(page.getByRole('button', { name: /Tema Oscuro/ }));
      await expect.poll(bg).toBe('rgb(31, 41, 55)');
      await shot(page, testInfo, `19-preview-pagina-${theme}-oscuro`, cv);
      await clickCentered(page.getByRole('button', { name: /Tema Claro/ }));
      await expect.poll(bg).toBe('rgb(255, 255, 255)');
      // Con cv-force-light la plantilla es identica con <html> en claro y en oscuro
      // (incluido el color de texto heredado).
      const htmlDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      await page.evaluate(() => document.documentElement.classList.toggle('dark'));
      const toggledSample = await sampleDarkColors(page, '.cv-template');
      await page.evaluate((d) => document.documentElement.classList.toggle('dark', d), htmlDark);
      expect(diffSamples(lightSample, toggledSample)).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Pagination compartida: CompanyTalentSearchPage (via /admin/search) sin cambios
// ---------------------------------------------------------------------------
test.describe('Pagination en busqueda de talento', () => {
  test('mismos botones y navegacion que la version inline', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const mock = await openApp(context, page, { theme: 'light', route: '/admin/search' });
    const pages = Math.ceil(DATA.filter(r => r.role !== 'admin').length / 30);
    await expect(page.getByText(`Page 1 of ${pages}`)).toBeVisible({ timeout: 45_000 });
    const nav = page.getByRole('navigation', { name: 'Paginación' });
    await expect(nav).toBeVisible();
    const numbers = nav.locator('button:not([aria-label="Página anterior"]):not([aria-label="Página siguiente"])');
    await expect(numbers).toHaveText(['1', '2', String(pages)]);
    await expect(nav.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    await expect(nav.locator('[aria-current="page"]')).toHaveText('1');

    await clickCenteredOrDispatch(nav.getByRole('button', { name: 'Página siguiente' }));
    await expect(page.getByText(`Page 2 of ${pages}`)).toBeVisible();
    await expect(numbers).toHaveText(['1', '2', '3']);
    expect(mock.requestsTo('profiles').some(r => r.params.offset?.[0] === '30' && r.params.limit?.[0] === '30')).toBe(true);

    await clickCenteredOrDispatch(nav.getByRole('button', { name: 'Ir a la página 3' }));
    await expect(page.getByText(`Page 3 of ${pages}`)).toBeVisible();
    await expect(numbers).toHaveText(['2', '3', '4']);
    await clickCenteredOrDispatch(nav.getByRole('button', { name: 'Página siguiente' }));
    await expect(page.getByText(`Page ${pages} of ${pages}`)).toBeVisible();
    await expect(numbers).toHaveText(['1', '3', '4']);
    await expect(nav.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    await shot(page, testInfo, 'pagination-talent-search', nav);
  });
});
