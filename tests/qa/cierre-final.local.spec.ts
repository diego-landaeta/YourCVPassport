/**
 * Cierre final de la bolsa de empleo (frontend F-4 a F-12) con Supabase MOCKEADO. Nada sale a produccion.
 *
 *  - F-4  Alertas: varias alertas (hasta 5: lista, alta, edicion, baja) con el pais del perfil por defecto, y la
 *         baja publica desde el correo (/alertas/baja?token=, /alerts/unsubscribe?token=).
 *  - F-5  Listado: selector «Mas recientes / Mas afines» (solo con sesion de candidato; sort=affinity -> p_sort).
 *  - F-6  Enlace «Empleos» / «Jobs» en cabecera, menu movil y pie.
 *  - F-7  LegalGate: a cuentas de empresa NO se les pide la fecha de nacimiento; a candidatos si.
 *  - F-8  La interfaz adopta profiles_full.registro_idioma salvo eleccion manual en este dispositivo.
 *  - F-9  Registro de empresa: company_duplicate_hint, 23505 y revision en segundo plano.
 *  - F-10 (parte de la politica de cookies; el asistente esta en ofertas-empresa.local.spec.ts).
 *  - F-12 CookieConsent publica --cookie-banner-h.
 *
 *   QA_PORT=5446 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/cierre-final.local.spec.ts --project=chromium
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAFE_CONTEXT_OPTIONS, installInitState, makeProfiles, mockSupabase, type Row } from './helpers/supabaseMock';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 150_000 });

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
const reply = (route: Route, status: number, body: unknown) => route.fulfill({ status, headers: CORS, body: JSON.stringify(body) });
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

interface SetupOpts {
  session?: boolean;
  lang?: 'es' | 'en';
  profile?: Row;
  rpc?: Record<string, unknown>;
  db?: Record<string, Row[]>;
}

/** Candidato (o el perfil indicado) con sesion falsa, mocks de Supabase y registro de las RPC. */
async function setup(context: BrowserContext, page: Page, o: SetupOpts = {}) {
  const [base] = makeProfiles(1);
  const profile: Row = {
    ...base, id: uuid(77), role: 'professional', full_name: 'Lucía Fernández', email: 'lucia@example.test',
    country_code: 'MX', first_login_completed: true, dashboard_tour_completed: true, wizard_completed: true, ...(o.profile || {}),
  };
  await installInitState(context, { sessionProfile: o.session === false ? null : profile, language: o.lang ?? 'es', theme: 'light' });
  const rpcCalls: Record<string, any[]> = {};
  page.on('request', (req) => {
    const m = new URL(req.url()).pathname.match(/\/rest\/v1\/rpc\/(.+)$/);
    if (m && req.method() === 'POST') (rpcCalls[m[1]] ||= []).push(JSON.parse(req.postData() || '{}'));
  });
  const mock = await mockSupabase(context, { profiles: [profile], ...(o.db || {}) }, { rpc: { documentos_pendientes: [], ...(o.rpc || {}) } });
  return { profile, rpcCalls, mock };
}

// ---------------------------------------------------------------------------------------------
// F-4 Alertas
// ---------------------------------------------------------------------------------------------

function alertRow(i: number, over: Row = {}): Row {
  return { id: `alert-${i}`, profile_id: uuid(77), categories: i % 2 ? ['IT_SOFTWARE'] : [], country: 'ES', keywords: [], frequency: 'WEEKLY', active: true, last_sent_at: null, created_at: `2026-10-0${i}T10:00:00Z`, ...over };
}

/** job_alert_subscriptions con estado en memoria: GET lista, POST/PATCH/DELETE se aplican y se registran. */
async function alertsStore(context: BrowserContext, initial: Row[], opts: { postError?: { status: number; body: unknown } } = {}) {
  const rows = initial.map((r) => ({ ...r }));
  const writes: Array<{ method: string; body: any; id: string | null }> = [];
  await context.route('**/rest/v1/job_alert_subscriptions*', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fallback();
    const url = new URL(req.url());
    const id = (url.searchParams.get('id') || '').replace('eq.', '') || null;
    if (req.method() === 'GET') return reply(route, 200, rows);
    let body: any = null;
    try { body = req.postDataJSON(); } catch { /* sin cuerpo */ }
    writes.push({ method: req.method(), body, id });
    if (req.method() === 'POST') {
      if (opts.postError) return reply(route, opts.postError.status, opts.postError.body);
      rows.push({ id: `alert-new-${rows.length + 1}`, created_at: new Date().toISOString(), last_sent_at: null, ...body });
      return reply(route, 201, []);
    }
    if (req.method() === 'PATCH') {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows[i] = { ...rows[i], ...body };
      return reply(route, 200, i >= 0 ? [rows[i]] : []);
    }
    if (req.method() === 'DELETE') {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
      return reply(route, 204, null);
    }
    return route.fallback();
  });
  return { rows, writes };
}

async function openAlertsTab(page: Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    window.history.pushState({ section: 'opportunities' }, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { section: 'opportunities' } }));
  });
  const tab = page.getByRole('tab', { name: /Alertas/ });
  await expect(tab).toBeVisible({ timeout: 90_000 });
  await tab.click();
}

test.describe('F-4: varias alertas de ofertas', () => {
  test('sin alertas se abre el alta con el país del perfil y se guarda', async ({ context, page }) => {
    await setup(context, page);
    const store = await alertsStore(context, []);
    await openAlertsTab(page);
    await expect(page.getByTestId('alert-form')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#al-country')).toHaveValue('MX'); // país del perfil por defecto
    await page.getByTestId('alert-save').click();
    await expect.poll(() => store.writes.length).toBe(1);
    expect(store.writes[0].method).toBe('POST');
    expect(store.writes[0].body).toMatchObject({ profile_id: uuid(77), country: 'MX', frequency: 'WEEKLY', active: true, categories: [], keywords: [] });
    // Vuelve a la lista con la alerta nueva
    await expect(page.getByTestId('alerts-list')).toContainText('1 de 5 alertas');
    await expect(page.getByTestId('alert-item')).toHaveCount(1);
  });

  test('cinco alertas: no se puede crear otra; borrar una (con confirmación) libera el hueco', async ({ context, page }) => {
    await setup(context, page);
    const store = await alertsStore(context, [1, 2, 3, 4, 5].map((i) => alertRow(i)));
    await openAlertsTab(page);
    await expect(page.getByTestId('alert-item')).toHaveCount(5, { timeout: 60_000 });
    await expect(page.getByTestId('alerts-list')).toContainText('5 de 5 alertas');
    await expect(page.getByTestId('alert-new')).toBeDisabled();
    await expect(page.getByTestId('alerts-limit')).toContainText('máximo de 5 alertas');

    // Borrar pide confirmación y borra SOLO esa alerta
    await page.getByTestId('alert-delete').nth(1).click();
    await expect(page.getByText('¿Eliminar esta alerta?')).toBeVisible();
    expect(store.writes).toHaveLength(0);
    await page.getByTestId('alert-delete-confirm').click();
    await expect.poll(() => store.writes.length).toBe(1);
    expect(store.writes[0]).toMatchObject({ method: 'DELETE', id: 'alert-2' });
    await expect(page.getByTestId('alert-item')).toHaveCount(4);
    await expect(page.getByTestId('alert-new')).toBeEnabled();
  });

  test('editar una alerta actualiza solo esa (PATCH por id) y pausarla la deja en pausa', async ({ context, page }) => {
    await setup(context, page);
    const store = await alertsStore(context, [alertRow(1), alertRow(2)]);
    await openAlertsTab(page);
    await expect(page.getByTestId('alert-item')).toHaveCount(2, { timeout: 60_000 });
    await page.getByRole('button', { name: 'Editar: Alerta 2' }).click();
    await expect(page.getByRole('heading', { name: 'Editar alerta' })).toBeVisible();
    await page.getByTestId('alert-form').getByText('Cada día', { exact: true }).click();
    await page.getByTestId('alert-save').click();
    await expect.poll(() => store.writes.length).toBe(1);
    expect(store.writes[0]).toMatchObject({ method: 'PATCH', id: 'alert-2' });
    expect(store.writes[0].body.frequency).toBe('DAILY');
    await expect(page.getByTestId('alert-item').nth(1)).toContainText('Cada día');
  });

  test('si la base rechaza la sexta alerta, el mensaje es claro', async ({ context, page }) => {
    await setup(context, page);
    await alertsStore(context, [], { postError: { status: 400, body: { code: 'P0001', message: 'MAX_ALERTS: no puedes tener más de 5 alertas', details: null, hint: null } } });
    await openAlertsTab(page);
    await expect(page.getByTestId('alert-form')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('alert-save').click();
    await expect(page.getByText('No se pueden crear más de 5 alertas').first()).toBeVisible();
  });
});

const TOKEN = '6f1d3c5e-8a47-4b0e-9a55-0c2f7d9e1b34';

test.describe('F-4: baja de alertas desde el correo', () => {
  test('español: /alertas/baja?token= llama a unsubscribe_job_alerts y confirma', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { session: false, rpc: { unsubscribe_job_alerts: true } });
    await page.goto(`/alertas/baja?token=${TOKEN}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Alertas canceladas' })).toBeVisible({ timeout: 60_000 });
    expect(rpcCalls.unsubscribe_job_alerts).toEqual([{ p_token: TOKEN }]);
    await expect(page.getByRole('link', { name: 'Ver ofertas' })).toHaveAttribute('href', '/empleos');
  });

  test('inglés: /alerts/unsubscribe?token= se ve en inglés', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { session: false, lang: 'es', rpc: { unsubscribe_job_alerts: true } });
    await page.goto(`/alerts/unsubscribe?token=${TOKEN}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Alerts cancelled' })).toBeVisible({ timeout: 60_000 });
    expect(rpcCalls.unsubscribe_job_alerts).toEqual([{ p_token: TOKEN }]);
    await expect(page.getByRole('link', { name: 'See jobs' })).toHaveAttribute('href', '/jobs');
  });

  test('token que no existe o ya de baja: mensaje propio, no un éxito falso', async ({ context, page }) => {
    await setup(context, page, { session: false, rpc: { unsubscribe_job_alerts: false } });
    await page.goto(`/alertas/baja?token=${TOKEN}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Este enlace ya no tiene alertas activas' })).toBeVisible({ timeout: 60_000 });
  });

  test('sin token o con uno mal formado no se llama a la base', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { session: false, rpc: { unsubscribe_job_alerts: true } });
    await page.goto('/alertas/baja?token=esto-no-es-un-uuid', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enlace no válido' })).toBeVisible({ timeout: 60_000 });
    await page.goto('/alertas/baja', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enlace no válido' })).toBeVisible();
    expect(rpcCalls.unsubscribe_job_alerts).toBeUndefined();
  });

  test('un fallo de red se puede reintentar', async ({ context, page }) => {
    await setup(context, page, { session: false, rpc: { unsubscribe_job_alerts: true } });
    let calls = 0;
    await context.route('**/rest/v1/rpc/unsubscribe_job_alerts', async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fallback();
      calls++;
      return calls === 1 ? reply(route, 500, { message: 'boom' }) : reply(route, 200, true);
    });
    await page.goto(`/alertas/baja?token=${TOKEN}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'No hemos podido completar la baja' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByRole('heading', { name: 'Alertas canceladas' })).toBeVisible();
    expect(calls).toBe(2);
  });

  test('las rutas existen en App y routeConfig, NO entran en el sitemap y robots.txt las cierra', () => {
    const routeConfig = fs.readFileSync(path.join(ROOT, 'config', 'routeConfig.ts'), 'utf8');
    const pathMappings = routeConfig.slice(routeConfig.indexOf('const pathMappings'), routeConfig.indexOf('export const routeRedirects'));
    expect(pathMappings).not.toMatch(/alertas\/baja|alerts\/unsubscribe/); // pathMappings alimenta el sitemap y el hreflang
    expect(routeConfig).toMatch(/alertUnsubscribeRoutes = \['\/alertas\/baja', '\/alerts\/unsubscribe'\]/);
    expect(fs.readFileSync(path.join(ROOT, 'App.tsx'), 'utf8')).toMatch(/alertUnsubscribeRoutes\.map/);
    const robots = fs.readFileSync(path.join(ROOT, 'public', 'robots.txt'), 'utf8');
    expect(robots).toMatch(/Disallow: \/alertas\/baja/);
    expect(robots).toMatch(/Disallow: \/alerts\/unsubscribe/);
  });
});

// ---------------------------------------------------------------------------------------------
// F-5 Orden «Más afines»
// ---------------------------------------------------------------------------------------------

function listRow(i: number): Row {
  return {
    id: uuid(100 + i), title: `Oferta de prueba ${i}`, slug: `oferta-de-prueba-${i}-0000000${i}`, company_id: 'c1', company_name: `Empresa ${i}`,
    company_logo_url: null, country_code: 'ES', location_city: 'Madrid', work_mode: 'ONSITE', is_remote: false, contract_types: ['INDEFINITE'],
    schedule: 'FULL_TIME', category: 'IT_SOFTWARE', category2: null, vacancies: 1, experience_years: 2, summary: 'Descripción corta.',
    salary_min: 1800, salary_max: 2400, salary_currency: 'EUR', salary_period: 'MONTHLY', salary_mode: 'RANGE', show_salary: true,
    published_at: new Date(Date.now() - i * 3600_000).toISOString(), application_deadline: new Date(Date.now() + 20 * 86400_000).toISOString(),
    already_applied: false, total_count: 6,
  };
}
const LIST = Array.from({ length: 6 }, (_, i) => listRow(i + 1));

test.describe('F-5: orden «Más recientes / Más afines»', () => {
  test('sin sesión «Más afines» está deshabilitado y la RPC no recibe p_sort (ni con sort=affinity en la URL)', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { session: false, rpc: { search_public_jobs_v2: LIST } });
    await page.goto('/empleos?sort=affinity', { waitUntil: 'domcontentloaded' });
    const sort = page.getByTestId('job-sort');
    await expect(sort).toBeVisible({ timeout: 60_000 });
    await expect(sort).toHaveValue('recent');
    await expect(sort.locator('option[value="affinity"]')).toBeDisabled();
    await expect(sort.locator('option[value="recent"]')).toHaveText('Más recientes');
    await expect(sort.locator('option[value="affinity"]')).toHaveText('Más afines');
    expect(rpcCalls.search_public_jobs_v2.length).toBeGreaterThan(0);
    for (const body of rpcCalls.search_public_jobs_v2) expect(body).not.toHaveProperty('p_sort');
  });

  test('con sesión de candidato elige «Más afines»: la URL lleva sort=affinity y la RPC p_sort', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { rpc: { search_public_jobs_v2: LIST } });
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    const sort = page.getByTestId('job-sort');
    await expect(sort).toBeVisible({ timeout: 60_000 });
    await expect(sort.locator('option[value="affinity"]')).toBeEnabled();
    await sort.selectOption('affinity');
    await expect(page).toHaveURL(/sort=affinity/);
    await expect.poll(() => rpcCalls.search_public_jobs_v2.some((b) => b.p_sort === 'affinity')).toBe(true);
    await sort.selectOption('recent');
    await expect(page).not.toHaveURL(/sort=/);
    const last = rpcCalls.search_public_jobs_v2[rpcCalls.search_public_jobs_v2.length - 1];
    expect(last).not.toHaveProperty('p_sort');
  });

  test('un enlace compartido con sort=affinity abre ya ordenado para un candidato', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { rpc: { search_public_jobs_v2: LIST } });
    await page.goto('/empleos?sort=affinity', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('job-sort')).toHaveValue('affinity', { timeout: 60_000 });
    await expect.poll(() => rpcCalls.search_public_jobs_v2?.some((b) => b.p_sort === 'affinity')).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// F-6 Enlace «Empleos» / «Jobs»
// ---------------------------------------------------------------------------------------------

test.describe('F-6: enlace a las ofertas en cabecera, menú móvil y pie', () => {
  test('español (escritorio 1440): cabecera y pie enlazan a /empleos y la cabecera no desborda', async ({ context, page }) => {
    await setup(context, page, { session: false });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const nav = page.locator('header nav');
    const link = nav.getByRole('link', { name: 'Empleos', exact: true });
    await expect(link).toBeVisible({ timeout: 60_000 });
    await expect(link).toHaveAttribute('href', '/empleos');
    await expect(page.locator('footer').getByRole('link', { name: 'Empleos', exact: true })).toHaveAttribute('href', '/empleos');
    await link.click();
    await expect(page).toHaveURL(/\/empleos$/);
  });

  test('inglés: «Jobs» enlaza a /jobs', async ({ context, page }) => {
    await setup(context, page, { session: false, lang: 'en' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header nav').getByRole('link', { name: 'Jobs', exact: true })).toHaveAttribute('href', '/jobs', { timeout: 60_000 });
    await expect(page.locator('footer').getByRole('link', { name: 'Jobs', exact: true })).toHaveAttribute('href', '/jobs');
  });

  test('el menú de escritorio cabe a 1280 px (con el enlace nuevo no desborda)', async ({ context, page }) => {
    await setup(context, page, { session: false });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header nav').getByRole('link', { name: 'Empleos', exact: true })).toBeVisible({ timeout: 60_000 });
    const overflow = await page.evaluate(() => {
      const nav = document.querySelector('header nav') as HTMLElement;
      const header = document.querySelector('header') as HTMLElement;
      return { doc: document.documentElement.scrollWidth - window.innerWidth, nav: nav.scrollWidth - nav.clientWidth, header: header.scrollWidth - header.clientWidth };
    });
    expect(overflow.doc).toBeLessThanOrEqual(0);
    expect(overflow.nav).toBeLessThanOrEqual(1);
    expect(overflow.header).toBeLessThanOrEqual(1);
  });

  test('móvil (390): el menú desplegable lleva a Empleos', async ({ context, page }) => {
    await setup(context, page, { session: false });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Abrir menú principal' }).click({ timeout: 60_000 });
    const link = page.getByRole('link', { name: 'Empleos', exact: true }).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/empleos$/);
  });
});

// ---------------------------------------------------------------------------------------------
// F-7 LegalGate: fecha de nacimiento
// ---------------------------------------------------------------------------------------------

const COMPANY_ID = uuid(300);

function companyDb(profileId: string): Record<string, Row[]> {
  return {
    company_users: [{ id: uuid(301), company_id: COMPANY_ID, user_id: profileId, role: 'OWNER' }],
    companies: [{ id: COMPANY_ID, company_name: 'Empresa Prueba', legal_name: 'Empresa Prueba, S.L.', tax_id: 'B67799247', company_email: 'rrhh@empresa-test.example', status: 'APPROVED', credit_balance: 0, total_credits_purchased: 0, total_credits_used: 0, country_code: 'ES', logo_url: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }],
  };
}

test.describe('F-7: la fecha de nacimiento no se pide a cuentas de empresa', () => {
  test('cuenta de empresa (role employer) sin fecha: entra al panel sin pantalla de edad', async ({ context, page }) => {
    const id = uuid(78);
    const { rpcCalls } = await setup(context, page, { profile: { id, role: 'employer', fecha_nacimiento: null }, db: companyDb(id) });
    await page.goto('/company/dashboard', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => rpcCalls.documentos_pendientes?.length ?? 0, { timeout: 90_000 }).toBeGreaterThan(0); // pasó a las condiciones
    await expect(page.getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toHaveCount(0);
    expect(rpcCalls.set_my_birth_date).toBeUndefined();
  });

  test('alta con tipo=empresa en los metadatos (aunque el rol aún sea de candidato): tampoco se pide', async ({ context, page }) => {
    const id = uuid(79);
    // Independiente del orden de los init scripts: al LEER la sesión guardada se le añade tipo=empresa.
    await page.addInitScript(() => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key: string) {
        const value = original.call(this, key);
        if (key === 'yourcvpassport-auth' && value) {
          try {
            const s = JSON.parse(value);
            s.user.user_metadata = { ...(s.user.user_metadata || {}), tipo: 'empresa' };
            return JSON.stringify(s);
          } catch { /* se devuelve tal cual */ }
        }
        return value;
      };
    });
    const { rpcCalls } = await setup(context, page, { profile: { id, role: 'professional', fecha_nacimiento: null }, db: companyDb(id) });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => rpcCalls.documentos_pendientes?.length ?? 0, { timeout: 90_000 }).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toHaveCount(0);
    expect(rpcCalls.set_my_birth_date).toBeUndefined();
  });

  test('candidato (u OAuth) sin fecha: SÍ se la pide', async ({ context, page }) => {
    await setup(context, page, { profile: { role: 'professional', fecha_nacimiento: null } });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toBeVisible({ timeout: 90_000 });
  });
});

// ---------------------------------------------------------------------------------------------
// F-8 Idioma de registro
// ---------------------------------------------------------------------------------------------

const htmlLang = (page: Page) => page.evaluate(() => document.documentElement.lang);

test.describe('F-8: la interfaz adopta el idioma de registro', () => {
  test('perfil registrado en inglés y sin elección manual: la interfaz pasa a inglés', async ({ context, page }) => {
    await setup(context, page, { lang: 'es', profile: { registro_idioma: 'en' } });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => htmlLang(page), { timeout: 90_000 }).toBe('en');
  });

  test('con una elección manual de idioma en este dispositivo, gana la elección manual', async ({ context, page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('language_manual', '1'); } catch { /* sin storage */ } });
    await setup(context, page, { lang: 'es', profile: { registro_idioma: 'en' } });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    expect(await htmlLang(page)).toBe('es');
  });

  test('elegir idioma en el selector de la cabecera deja anotada la elección manual', async ({ context, page }) => {
    await setup(context, page, { session: false, lang: 'es' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => localStorage.getItem('language_manual'))).toBeNull();
    await page.locator('header').getByRole('button', { name: /^ES$/ }).first().click({ timeout: 60_000 });
    await page.getByRole('button', { name: 'English (EN)' }).first().click();
    await expect.poll(() => htmlLang(page)).toBe('en');
    expect(await page.evaluate(() => localStorage.getItem('language_manual'))).toBe('1');
  });
});

// ---------------------------------------------------------------------------------------------
// F-9 Registro de empresa
// ---------------------------------------------------------------------------------------------

const DOC_EMP = uuid(401);
const DOC_PRIV = uuid(402);

async function companyRegistrationSetup(context: BrowserContext, page: Page, o: { hint?: Row | null; companiesPost?: (route: Route) => Promise<unknown>; review?: (route: Route) => Promise<unknown> } = {}) {
  const s = await setup(context, page, {
    profile: { role: 'employer' },
    rpc: { company_duplicate_hint: o.hint ?? { tax_id_taken: false, email_taken: false }, registrar_aceptacion: [uuid(499)] },
    db: {
      countries: [{ code: 'ES', name_es: 'España', name_en: 'Spain', currency: 'EUR', active: true }],
      documentos_legales: [
        { id: DOC_EMP, tipo: 'terminos_empleador', version: '1.0', idioma: 'es', titulo: 'Condiciones – Empleadores', texto: 'Texto.', audiencia: 'empleador', casillas_obligatorias: ['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento'], borrador: true, vigente_desde: '2026-10-29T00:00:00+00:00' },
        { id: DOC_PRIV, tipo: 'privacidad', version: '1.0', idioma: 'es', titulo: 'Privacidad', texto: 'Texto.', audiencia: 'todos', casillas_obligatorias: [], borrador: true, vigente_desde: '2026-10-29T00:00:00+00:00' },
      ],
    },
  });
  const posts: Record<string, any[]> = { companies: [], company_users: [] };
  await context.route(new RegExp("/rest/v1/companies([?].*)?$"), async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    posts.companies.push(route.request().postDataJSON());
    if (o.companiesPost) return o.companiesPost(route);
    return reply(route, 201, { id: COMPANY_ID });
  });
  await context.route(new RegExp("/rest/v1/company_users([?].*)?$"), async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    posts.company_users.push(route.request().postDataJSON());
    return reply(route, 201, null);
  });
  const reviews: any[] = [];
  await context.route('**/functions/v1/company-review-ai', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fallback();
    reviews.push(route.request().postDataJSON());
    if (o.review) return o.review(route);
    return reply(route, 200, { success: true, status: 'PENDING' });
  });
  return { ...s, posts, reviews };
}

async function fillCompanyForm(page: Page) {
  await page.goto('/company/register', { waitUntil: 'domcontentloaded' });
  await page.fill('#company_name', 'Empresa Prueba');
  await page.fill('#legal_name', 'Empresa Prueba, S.L.');
  await page.fill('#tax_id', 'B67799247');
  await page.fill('#company_email', 'rrhh@empresa-test.example');
  await page.fill('#website_url', 'https://empresa-test.example');
  await page.fill('#industry', 'Formación');
  await page.selectOption('#company_size', '51-250');
  await page.fill('#contact_name', 'Marta Gómez');
  await page.selectOption('#country_code', 'ES');
  for (const key of ['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento']) await page.check(`#consent-${key}`);
}

test.describe('F-9: registro de empresa', () => {
  test('company_duplicate_hint avisa ANTES de insertar y sin revelar de quién es el otro registro', async ({ context, page }) => {
    const { posts, rpcCalls } = await companyRegistrationSetup(context, page, { hint: { tax_id_taken: true, email_taken: false } });
    await fillCompanyForm(page);
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('#tax_id-err')).toContainText('Ya hay una empresa registrada con este identificador fiscal.', { timeout: 60_000 });
    expect(rpcCalls.company_duplicate_hint).toEqual([{ p_tax_id: 'B67799247', p_company_email: 'rrhh@empresa-test.example' }]);
    expect(posts.companies).toHaveLength(0);
    expect(posts.company_users).toHaveLength(0);
    // El texto no menciona nombres, correos ni ids de la otra empresa
    await expect(page.locator('#tax_id-err')).not.toContainText(/rrhh@|Empresa Prueba|B67799247|[0-9a-f]{8}-/);
  });

  test('correo duplicado: aviso en el campo del correo', async ({ context, page }) => {
    const { posts } = await companyRegistrationSetup(context, page, { hint: { tax_id_taken: false, email_taken: true } });
    await fillCompanyForm(page);
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('#company_email-err')).toContainText('Ya hay una empresa registrada con este correo', { timeout: 60_000 });
    expect(posts.companies).toHaveLength(0);
  });

  test('23505 al insertar (carrera o RPC ausente): mensaje útil y no se crea nada a medias', async ({ context, page }) => {
    const { posts } = await companyRegistrationSetup(context, page, {
      companiesPost: (route) => reply(route, 409, { code: '23505', message: 'duplicate key value violates unique constraint "companies_tax_id_key"', details: 'Key (tax_id)=(B67799247) already exists.', hint: null }),
    });
    await fillCompanyForm(page);
    await page.locator('form button[type=submit]').click();
    await expect(page.getByText('Ya existe una empresa con ese identificador fiscal o ese correo, así que no hemos creado nada').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#tax_id-err')).toContainText('identificador fiscal');
    expect(posts.company_users).toHaveLength(0); // sin empresa no hay vínculo
  });

  test('si falla vincular al usuario, se intenta deshacer la empresa (DELETE) y se explica', async ({ context, page }) => {
    const deletes: string[] = [];
    const { posts } = await companyRegistrationSetup(context, page);
    await context.route(new RegExp("/rest/v1/company_users([?].*)?$"), async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      posts.company_users.push(route.request().postDataJSON());
      return reply(route, 400, { code: '23503', message: 'insert or update on table "company_users" violates foreign key constraint', details: null, hint: null });
    });
    await context.route(new RegExp("/rest/v1/companies[?]"), async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      deletes.push(decodeURIComponent(route.request().url()));
      return reply(route, 204, null);
    });
    await fillCompanyForm(page);
    await page.locator('form button[type=submit]').click();
    await expect(page.getByText('lo hemos deshecho para que no quede nada a medias').first()).toBeVisible({ timeout: 60_000 });
    expect(deletes.some((u) => u.includes(`id=eq.${COMPANY_ID}`))).toBe(true);
  });

  test('la revisión va en segundo plano: el éxito sale al instante con «te avisaremos» y pasa a verificada si llega', async ({ context, page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    const { reviews } = await companyRegistrationSetup(context, page, {
      review: async (route) => { await gate; return reply(route, 200, { success: true, status: 'APPROVED' }); },
    });
    await fillCompanyForm(page);
    await page.locator('form button[type=submit]').click();
    // La revisión sigue sin responder y aun así la pantalla de éxito ya está ahí
    await expect(page.getByText('estamos revisando tu empresa')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('te avisaremos por correo')).toBeVisible();
    expect(reviews).toEqual([{ companyId: COMPANY_ID }]);
    release();
    await expect(page.getByText('Tu empresa ha sido verificada')).toBeVisible({ timeout: 20_000 });
  });
});

// ---------------------------------------------------------------------------------------------
// F-10 (política de cookies) y F-12 (variable CSS del aviso)
// ---------------------------------------------------------------------------------------------

test.describe('F-10: la política de cookies lista el almacenamiento nuevo', () => {
  for (const [lang, route] of [['es', '/politica-de-cookies'], ['en', '/cookie-policy']] as const) {
    test(`${lang}: ${route}`, async ({ context, page }) => {
      await setup(context, page, { session: false, lang });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main, body').first()).toBeVisible({ timeout: 60_000 });
      for (const key of ['ycvp_jobs_country', 'ycvp_post_login_return', 'ycvp.underage-notice', 'ycvp.legal-notice-dismissed', 'language_manual']) {
        await expect(page.locator('td', { hasText: key }).first()).toBeVisible({ timeout: 60_000 });
      }
    });
  }
});

test.describe('F-12: --cookie-banner-h', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // sin decisión previa: el aviso se ve

  test('mientras el aviso se ve, la variable vale su alto en px; al decidir vuelve a 0px', async ({ context, page }) => {
    await setup(context, page, { session: false });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible({ timeout: 60_000 });
    const read = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--cookie-banner-h'));
    await expect.poll(read).toMatch(/^\d+px$/);
    const h = Number((await read()).replace('px', ''));
    const box = await banner.boundingBox();
    expect(h).toBeGreaterThan(80);
    expect(Math.abs(h - Math.ceil(box!.height))).toBeLessThanOrEqual(2);
    // Una barra fija con bottom: var(--cookie-banner-h) queda justo por encima del aviso
    await page.evaluate(() => {
      const bar = document.createElement('div');
      bar.id = 'test-bar';
      bar.style.cssText = 'position:fixed;left:0;right:0;height:10px;bottom:var(--cookie-banner-h, 0px)';
      document.body.appendChild(bar);
    });
    const bar = await page.locator('#test-bar').boundingBox();
    expect(bar!.y + bar!.height).toBeLessThanOrEqual(box!.y + 2);
    // Al rechazar/aceptar el aviso desaparece y la variable vuelve a 0
    await banner.getByRole('button', { name: /Rechazar|Aceptar/ }).first().click();
    await expect(banner).toHaveCount(0);
    await expect.poll(read).toBe('0px');
  });
});
