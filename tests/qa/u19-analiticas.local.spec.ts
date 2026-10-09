/**
 * U19 — Analíticas (Supabase MOCKEADO: nada sale a producción).
 *
 * (a) Visitas falsas por exportaciones: abrir /cv/:slug registra UNA visita
 *     (POST a analytics_views), pero no cuando la ficha se carga dentro de un
 *     iframe (así la cargan los generadores de PDF) ni con ?export=1.
 * (b) Agrupación por día LOCAL: con la zona del navegador en México, Madrid y
 *     Tokio, las visitas a las 23:30 y a las 00:30 hora local caen en su día
 *     local (antes se agrupaba por día UTC) y los días sin visitas salen con 0,
 *     tanto en el calendario del dashboard como en el CSV de la sección Analíticas.
 *
 *   QA_PORT=5419 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u19-analiticas.local.spec.ts --output=test-results/u19
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, buildFakeSession, installInitState, mockSupabase, type SupabaseMock, type Row } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

// ---------------------------------------------------------------------------
// (a) Visitas: exportaciones e iframes no cuentan
// ---------------------------------------------------------------------------

const CV_ID = '00000000-0000-4000-8000-000000019001';
const cvProfile: Row = {
  id: CV_ID,
  full_name: 'Marta Visitas',
  headline: 'Analista de datos',
  summary: 'Perfil de prueba para las visitas.',
  slug: 'marta-visitas',
  template: 'classic',
  template_color: null,
  role: 'professional',
  is_active: true,
  profile_hidden: false,
  wizard_completed: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const viewPosts = (mock: SupabaseMock) =>
  mock.writes.filter((w) => w.method === 'POST' && w.url.startsWith('/rest/v1/analytics_views'));

async function mockCv(context: BrowserContext) {
  await installInitState(context, { language: 'es', theme: 'light' });
  return mockSupabase(context, {
    profiles: [cvProfile],
    stamps: [], experiences: [], education: [], skills: [], portfolio_items: [], languages: [],
    analytics_views: [],
  });
}

/** Deja tiempo a que trackView haga (o no) su POST tras pintarse la ficha. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

test.describe('(a) visitas a /cv/:slug', () => {
  test('visita normal: registra exactamente 1 visita', async ({ page, context }) => {
    test.setTimeout(90_000);
    const mock = await mockCv(context);
    await page.goto(`/cv/${cvProfile.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(cvProfile.full_name).first()).toBeVisible({ timeout: 45_000 });
    await expect.poll(() => viewPosts(mock).length, { timeout: 15_000 }).toBe(1);
    const body = JSON.parse(viewPosts(mock)[0].body || '{}');
    expect(body.profile_id).toBe(CV_ID);
    // Deduplicación de 24 h intacta: recargar no suma otra
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(cvProfile.full_name).first()).toBeVisible({ timeout: 45_000 });
    await settle(page);
    expect(viewPosts(mock)).toHaveLength(1);
  });

  test('dentro de un iframe (generador de PDF): 0 visitas', async ({ page, context }) => {
    test.setTimeout(90_000);
    const mock = await mockCv(context);
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"></head>
<body><iframe id="cv" src="/cv/${cvProfile.slug}" style="width:1200px;height:900px;border:0"></iframe></body></html>`;
    await page.route('**/__qa/u19-iframe', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
    await page.goto('/__qa/u19-iframe');
    await expect(page.frameLocator('#cv').getByText(cvProfile.full_name).first()).toBeVisible({ timeout: 45_000 });
    await settle(page);
    expect(viewPosts(mock)).toEqual([]);
  });

  test('con ?export=1: 0 visitas', async ({ page, context }) => {
    test.setTimeout(90_000);
    const mock = await mockCv(context);
    await page.goto(`/cv/${cvProfile.slug}?export=1`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(cvProfile.full_name).first()).toBeVisible({ timeout: 45_000 });
    await settle(page);
    expect(viewPosts(mock)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// (b) Agrupación por día local
// ---------------------------------------------------------------------------

/** "Ahora" fijo: 12:00 UTC es el 15 de octubre en las tres zonas (06:00, 14:00, 21:00). */
const NOW_UTC = new Date('2026-10-15T12:00:00Z');
const YEAR = 2026;
const OCT = 9; // mes 0-based

const me: Row = {
  id: ADMIN_ID, // el router del mock responde /auth/v1/user con este id
  full_name: 'QA Zonas', email: 'qa-zonas@example.test', role: 'professional',
  wizard_completed: true, first_login_completed: true, dashboard_tour_completed: true,
  template: 'classic', slug: 'qa-zonas', headline: 'QA', summary: 'Perfil de prueba.',
  avatar_url: 'https://example.test/avatar.png', plan: 'free', is_active: true,
  created_at: '2026-01-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z',
};

/**
 * Sesión falsa que no caduca: con el reloj fijado en el 15/10 la de
 * buildFakeSession (24 h desde ahora) podría darse por caducada.
 */
async function installLongSession(context: BrowserContext) {
  const base = buildFakeSession(me);
  const exp = 4102444800; // 2100-01-01
  const [header, , signature] = base.access_token.split('.');
  const payload = Buffer.from(JSON.stringify({ sub: me.id, role: 'authenticated', exp, aud: 'authenticated', email: me.email })).toString('base64url');
  const session = { ...base, access_token: `${header}.${payload}.${signature}`, expires_at: exp, expires_in: exp - Math.floor(NOW_UTC.getTime() / 1000) };
  await context.addInitScript((s) => {
    try {
      localStorage.setItem('yourcvpassport-auth', JSON.stringify(s));
      localStorage.setItem('language', 'es');
      localStorage.setItem('theme', 'light');
      localStorage.setItem('sidebar-collapsed', 'false');
    } catch { /* sin storage */ }
  }, session);
}

/**
 * Instantes ISO de las visitas, calculados EN EL NAVEGADOR (que ya tiene la zona
 * emulada): 2 a las 23:30 del 12/10 local y 1 a las 00:30 del 10/10 local.
 * - México (UTC-6): las 23:30 son las 05:30 UTC del 13 → por UTC caían un día después.
 * - Madrid/Tokio: las 00:30 son el 9 en UTC → por UTC caían un día antes.
 */
async function visitInstants(page: Page): Promise<string[]> {
  return page.evaluate(([y, m]) => [
    new Date(y, m, 12, 23, 30).toISOString(),
    new Date(y, m, 12, 23, 30, 40).toISOString(),
    new Date(y, m, 10, 0, 30).toISOString(),
  ], [YEAR, OCT] as const);
}

const EXPECTED: Record<string, number> = {
  '2026-10-09': 0,
  '2026-10-10': 1,
  '2026-10-11': 0,
  '2026-10-12': 2,
  '2026-10-13': 0,
  '2026-10-14': 0,
  '2026-10-15': 0,
};

async function bootDashboard(page: Page, context: BrowserContext) {
  await page.clock.setFixedTime(NOW_UTC);
  await installLongSession(context);
  // Filas mínimas para que el perfil esté completo y el dashboard pinte el
  // calendario de visitas (si no, muestra la guía de inicio).
  const own = (n: number, extra: Row = {}) =>
    Array.from({ length: n }, (_, i) => ({ id: `00000000-0000-4000-8000-00000019b${String(i).padStart(3, '0')}`, profile_id: me.id, created_at: '2026-02-01T10:00:00Z', ...extra }));
  const mock = await mockSupabase(context, {
    profiles: [me], analytics_views: [], analytics_clicks: [], analytics_leads: [],
    experiences: own(1, { title: 'QA', company: 'ACME', start_date: '2020-01-01' }),
    education: own(1, { institution: 'UPM', degree: 'Ing.', start_date: '2015-01-01' }),
    skills: own(3, { name: 'Testing' }),
    languages: own(1, { language: 'Español', level: 'native' }),
  });
  // Los instantes dependen de la zona: se calculan en una página en blanco y se
  // cargan en la BD mock (el router lee `db` en cada petición).
  const instants = await visitInstants(page);
  mock.db.analytics_views = instants.map((viewed_at, i) => ({
    id: `00000000-0000-4000-8000-00000019a00${i}`, profile_id: me.id, visitor_id: `visitor_${i}`,
    viewed_at, referrer: null, country: null, city: null, user_agent: 'Mozilla/5.0 (Windows NT 10.0)',
  }));
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  return { mock, instants };
}

for (const timezoneId of ['America/Mexico_City', 'Europe/Madrid', 'Asia/Tokyo']) {
  test.describe(`(b) días locales en ${timezoneId}`, () => {
    test.use({ timezoneId, locale: 'es-ES' });

    test('utilidades de dateKeys: día local, rango sin huecos ni duplicados (también con cambio de hora)', async ({ page }) => {
      await page.route('**/__qa/u19-blank', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body>u19</body></html>' }));
      await page.goto('/__qa/u19-blank');
      const res = await page.evaluate(async () => {
        const url = '/utils/dateKeys.ts';
        const m: any = await import(/* @vite-ignore */ url);
        // Rango que cruza el fin del horario de verano europeo (25/10/2026)
        const keys: string[] = m.localDayKeysBetween(new Date(2026, 9, 20, 23, 59), new Date(2026, 10, 2, 0, 1));
        return {
          late: m.toLocalDayKey(new Date(2026, 9, 12, 23, 30)),
          early: m.toLocalDayKey(new Date(2026, 9, 10, 0, 30).toISOString()),
          parsed: (() => { const d = m.parseLocalDayKey('2026-10-12'); return [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]; })(),
          keys,
          ago: m.toLocalDayKey(m.localDaysAgo(29, new Date(2026, 9, 15, 6))),
          invalid: m.localDayKeysBetween('no-es-fecha'),
        };
      });
      expect(res.late).toBe('2026-10-12');
      expect(res.early).toBe('2026-10-10');
      expect(res.parsed).toEqual([2026, 9, 12, 0]);
      expect(res.keys).toHaveLength(14);
      expect(res.keys[0]).toBe('2026-10-20');
      expect(res.keys[13]).toBe('2026-11-02');
      expect(new Set(res.keys).size).toBe(14);
      expect(res.ago).toBe('2026-09-16');
      expect(res.invalid).toEqual([]);
    });

    test('calendario del dashboard: cada visita en su día local y 0 en los días vacíos', async ({ page, context }) => {
      test.setTimeout(120_000);
      const { mock } = await bootDashboard(page, context);
      const chart = page.locator('[data-tour="chart"]');
      await expect(chart).toBeVisible({ timeout: 60_000 });

      await expect(chart.getByTestId('monthly-visits-total')).toHaveText(/^3\s+visitas$/, { timeout: 20_000 });
      for (const [day, visits] of Object.entries(EXPECTED)) {
        await expect(chart.locator(`[data-date="${day}"]`), day).toHaveAttribute('data-visits', String(visits));
      }
      // La consulta empieza a medianoche local de hace 29 días (últimos 30 días naturales)
      const viewsReq = mock.requestsTo('analytics_views').find((r) => r.params.select?.[0] === 'viewed_at');
      expect(viewsReq, 'consulta de visitas por día').toBeTruthy();
      const gte = (viewsReq!.params.viewed_at || []).find((v) => v.startsWith('gte.'))!.slice(4);
      const localStart = await page.evaluate((iso) => { const d = new Date(iso); return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]; }, gte);
      expect(localStart).toEqual([2026, 9, 16, 0, 0]);
    });

    test('Analíticas (7 días): el CSV trae los 7 días locales con 0 en los vacíos', async ({ page, context }, testInfo) => {
      test.setTimeout(120_000);
      await bootDashboard(page, context);
      await expect(page.locator('[data-tour="chart"]')).toBeVisible({ timeout: 60_000 });
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('change-dashboard-section', { detail: { section: 'analitica' } })));
      await page.getByRole('button', { name: 'Últimos 7 días' }).click({ timeout: 30_000 });

      const csvButton = page.getByRole('button', { name: 'Exportar CSV' });
      await expect(csvButton).toBeVisible();
      const [download] = await Promise.all([page.waitForEvent('download'), csvButton.click()]);
      const file = testInfo.outputPath('u19-analytics.csv');
      await download.saveAs(file);
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      const start = lines.indexOf('Date,Views,Clicks');
      expect(start).toBeGreaterThan(-1);
      const rows = lines.slice(start + 1, lines.indexOf('', start + 1));
      expect(rows).toEqual(Object.entries(EXPECTED).map(([d, v]) => `${d},${v},0`));
    });
  });
}
