/**
 * U6 — llamadores de las RPC de empresa tras 20261007_seguridad_empresas.sql.
 * Supabase MOCKEADO (nada sale a producción). La seguridad real de la BD se
 * prueba aparte en PGlite.
 *
 *   QA_PORT=5406 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u06-empresas.local.spec.ts --output=test-results/u06
 *
 * - Ficha de oferta (/jobs/:slug): la visita se registra con UNA llamada a
 *   rpc/track_job_posting_view, sin INSERT directo en job_posting_views y sin
 *   la RPC genérica `increment` (no está en las migraciones; en producción la
 *   podía ejecutar anon sobre cualquier tabla).
 * - Panel de admin > empresas: si approve_company responde 42501 (la sesión no
 *   es admin en el servidor) se muestra un mensaje claro en vez de "Error: ...".
 * - Columnas privadas de companies (20261009 / 20261009b): el panel de admin y
 *   el de empresa leen `companies_full` con columnas explícitas; a `companies`
 *   solo se le piden columnas públicas (los counts, `select=id`).
 */
import { test, expect, type BrowserContext, type Route } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type SupabaseMock } from './helpers/supabaseMock';
import { PUBLIC_COMPANY_COLUMN_LIST } from '../../lib/companyColumns';

test.use(SAFE_CONTEXT_OPTIONS);

interface RpcCall { fn: string; body: any }

/** Registra las llamadas RPC y deja responder a `handler` (o null por defecto). */
async function recordRpc(context: BrowserContext, handler: (fn: string, body: any, route: Route) => Promise<boolean> = async () => false) {
  const calls: RpcCall[] = [];
  // Registrada después de mockSupabase: tiene prioridad sobre su router.
  await context.route('**/rest/v1/rpc/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fallback();
    const fn = new URL(req.url()).pathname.replace('/rest/v1/rpc/', '');
    let body: any = null;
    try { body = req.postDataJSON(); } catch { body = req.postData(); }
    calls.push({ fn, body });
    if (await handler(fn, body, route)) return;
    return route.fallback();
  });
  return calls;
}

const JOB = {
  id: '44444444-4444-4444-8444-444444444441',
  slug: 'oferta-qa-u06',
  title: 'Oferta QA U6',
  description: 'Descripción de prueba de la oferta.',
  company_name: 'Empresa QA',
  company_logo_url: null,
  company_website: null,
  company_description: null,
  employment_type: 'FULL_TIME',
  work_mode: 'REMOTE',
  experience_level: 'MID',
  location_city: 'Madrid',
  location_country: 'ES',
  is_remote: true,
  status: 'PUBLISHED',
  published_at: '2026-10-01T00:00:00Z',
  responsibilities: [],
  requirements: [],
  nice_to_have: [],
  benefits: [],
  required_skills: [],
  optional_skills: [],
  show_salary: false,
};

test('ficha de oferta: la visita se registra solo con track_job_posting_view', async ({ context, page }) => {
  // Vite en frío con varios navegadores en paralelo puede tardar más de 60 s.
  test.setTimeout(150_000);
  await installInitState(context, { sessionProfile: null, language: 'es' });
  const mock = await mockSupabase(context, { profiles: makeProfiles(3), job_posting_questions: [] }, {
    rpc: { get_job_posting_detail: [JOB], track_job_posting_view: { success: true, view_id: null } },
  });
  const calls = await recordRpc(context);

  await page.goto(`/jobs/${JOB.slug}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: JOB.title })).toBeVisible({ timeout: 90_000 });
  // Una visita por carga de la ficha (en dev, StrictMode monta dos veces el efecto).
  const loads = () => calls.filter(c => c.fn === 'get_job_posting_detail').length;
  const tracks = () => calls.filter(c => c.fn === 'track_job_posting_view');
  await expect.poll(() => tracks().length, { timeout: 15_000 }).toBeGreaterThan(0);
  await page.waitForTimeout(1_000);
  expect(tracks().length).toBe(loads());

  // Solo el id de la oferta: el perfil lo decide el servidor (auth.uid()).
  for (const track of tracks()) expect(track.body).toEqual({ p_job_posting_id: JOB.id });
  expect(calls.some(c => c.fn === 'increment')).toBe(false);
  expect(mock.writes.filter(w => w.url.includes('job_posting_views'))).toEqual([]);
});

test('admin > empresas: approve_company con 42501 muestra un mensaje claro', async ({ context, page }) => {
  test.setTimeout(150_000);
  const profiles = makeProfiles(5);
  const admin = profiles.find(p => p.id === ADMIN_ID)!;
  await installInitState(context, { sessionProfile: admin, language: 'es' });
  const company = {
    id: '22222222-2222-4222-8222-222222222222',
    company_name: 'Empresa Pendiente QA',
    legal_name: 'Empresa Pendiente QA SL',
    tax_id: 'B00000000',
    company_email: 'empresa@example.test',
    status: 'PENDING',
    credit_balance: 0,
    created_at: '2026-10-01T00:00:00Z',
    company_users: [],
  };
  await mockSupabase(context, { profiles, companies: [company], company_users: [] });
  const calls = await recordRpc(context, async (fn, _body, route) => {
    if (fn !== 'approve_company') return false;
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: '42501', message: 'NOT_ADMIN: solo un administrador puede hacer esto', details: null, hint: null }),
    });
    return true;
  });

  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Moderación de Usuarios').first()).toBeVisible({ timeout: 90_000 });
  const tab = page.getByRole('button', { name: /Gestión de Empresas/ }).first();
  await expect(tab).toBeVisible();
  await tab.evaluate(el => (el as HTMLElement).click());

  const details = page.getByRole('button', { name: /View Details/ }).first();
  await expect(details).toBeVisible({ timeout: 20_000 });
  await details.evaluate(el => (el as HTMLElement).click());
  const approve = page.getByRole('button', { name: /Approve Company/ });
  await expect(approve).toBeVisible();
  await approve.evaluate(el => (el as HTMLElement).click());

  await expect(page.getByText(/Solo un administrador puede aprobar o rechazar empresas/)).toBeVisible({ timeout: 15_000 });
  const call = calls.find(c => c.fn === 'approve_company')!;
  expect(call.body.p_company_id).toBe(company.id);
});

// ---------------------------------------------------------------------------
// Columnas privadas de companies (20261009_proteger_datos_companies.sql +
// 20261009b_cerrar_columnas_privadas_companies.sql): a `companies` solo se le
// piden id / company_name / logo_url; el resto se lee de `companies_full`.
// ---------------------------------------------------------------------------

/** Columnas de nivel superior de un `select` (sin los embeds `tabla(...)`). */
function topLevelColumns(select: string): string[] {
  let depth = 0;
  let cur = '';
  const out: string[] = [];
  for (const ch of select) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(c => !c.includes('('));
}

/** Ninguna petición a la tabla `companies` pide columnas privadas ni `*`. */
function expectOnlyPublicCompanyColumns(mock: SupabaseMock) {
  for (const r of mock.requestsTo('companies')) {
    const cols = topLevelColumns(r.params.select?.[0] ?? '*');
    for (const c of cols) expect(PUBLIC_COMPANY_COLUMN_LIST as readonly string[], `companies?${r.query}`).toContain(c);
    for (const k of Object.keys(r.params)) {
      if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
      expect(PUBLIC_COMPANY_COLUMN_LIST as readonly string[], `filtro sobre columna privada: companies?${r.query}`).toContain(k);
    }
  }
}

const COMPANY_ROW = {
  id: '22222222-2222-4222-8222-222222222223',
  company_name: 'Empresa Columnas QA',
  legal_name: 'Empresa Columnas QA SL',
  tax_id: 'B12345678',
  company_email: 'columnas@example.test',
  status: 'PENDING',
  credit_balance: 0,
  total_credits_purchased: 0,
  total_credits_used: 0,
  admin_notes: 'nota interna QA',
  created_at: '2026-10-01T00:00:00Z',
};

test('admin > empresas: lee companies_full con columnas explícitas y cuenta con id', async ({ context, page }) => {
  test.setTimeout(150_000);
  const profiles = makeProfiles(5);
  const admin = profiles.find(p => p.id === ADMIN_ID)!;
  await installInitState(context, { sessionProfile: admin, language: 'es' });
  const mock = await mockSupabase(context, { profiles, companies: [{ ...COMPANY_ROW, company_users: [] }], company_users: [] });

  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Moderación de Usuarios').first()).toBeVisible({ timeout: 90_000 });
  // Contadores del panel: total sobre companies.id, los del mes sobre companies_full
  await expect.poll(() => mock.requestsTo('companies').filter(r => r.method === 'HEAD').length, { timeout: 15_000 }).toBeGreaterThan(0);
  for (const r of mock.requestsTo('companies').filter(r => r.method === 'HEAD')) expect(r.params.select?.[0]).toBe('id');
  const monthly = mock.requestsTo('companies_full').filter(r => r.method === 'HEAD');
  expect(monthly.length).toBeGreaterThan(0);
  for (const r of monthly) {
    expect(r.params.select?.[0]).toBe('id');
    expect(r.params.created_at?.[0]).toMatch(/^gte\./);
  }

  const tab = page.getByRole('button', { name: /Gestión de Empresas/ }).first();
  await expect(tab).toBeVisible();
  await tab.evaluate(el => (el as HTMLElement).click());
  await expect(page.getByText(COMPANY_ROW.company_name).first()).toBeVisible({ timeout: 20_000 });

  const list = mock.requestsTo('companies_full').filter(r => r.method === 'GET' && r.params.select?.[0]?.includes('tax_id'));
  expect(list.length).toBeGreaterThan(0);
  for (const r of list) {
    const cols = topLevelColumns(r.params.select![0]);
    expect(cols).not.toContain('*');
    // Sin embed company_users: no se usaba y desde una vista depende de que PostgREST deduzca la relación
    expect(r.params.select![0]).not.toContain('company_users');
    for (const c of ['id', 'company_name', 'tax_id', 'company_email', 'status', 'admin_notes', 'tax_document_url', 'verification_document_url']) expect(cols).toContain(c);
  }
  // Estadísticas por estado: también desde la vista
  expect(mock.requestsTo('companies_full').some(r => r.method === 'GET' && r.params.select?.[0] === 'status')).toBe(true);

  // Búsqueda: comas o paréntesis no añaden condiciones al filtro .or()
  await page.getByPlaceholder(/Search by company name/).fill('acme),status.eq.APPROVED');
  await expect.poll(() => mock.requestsTo('companies_full').filter(r => r.method === 'GET' && r.params.or).length, { timeout: 15_000 }).toBeGreaterThan(0);
  for (const r of mock.requestsTo('companies_full').filter(r => r.method === 'GET' && r.params.or)) {
    const or = r.params.or![0];
    expect(or.startsWith('(') && or.endsWith(')')).toBe(true);
    const inner = or.slice(1, -1);
    expect(inner).not.toMatch(/[()]/);
    expect(inner.split(',')).toHaveLength(3);
  }
  expectOnlyPublicCompanyColumns(mock);
});

test('panel de empresa: la empresa del miembro se lee de companies_full', async ({ context, page }) => {
  test.setTimeout(150_000);
  const member = { ...makeProfiles(4)[3], role: 'employer' };
  await installInitState(context, { sessionProfile: member, language: 'es' });
  const mock = await mockSupabase(context, {
    profiles: [member],
    companies: [COMPANY_ROW],
    company_users: [{ id: '77777777-7777-4777-8777-777777777771', company_id: COMPANY_ROW.id, user_id: member.id, role: 'OWNER' }],
  });

  await page.goto('/company/dashboard', { waitUntil: 'domcontentloaded' });
  // Empresa PENDING: la pantalla de revisión muestra nombre, email y CIF (columnas privadas)
  await expect(page.getByText(COMPANY_ROW.tax_id)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(COMPANY_ROW.company_email)).toBeVisible();

  const reads = mock.requestsTo('companies_full').filter(r => r.method === 'GET');
  expect(reads.length).toBeGreaterThan(0);
  for (const r of reads) {
    expect(r.params.id?.[0]).toBe(`eq.${COMPANY_ROW.id}`);
    const cols = topLevelColumns(r.params.select![0]);
    expect(cols).not.toContain('*');
    expect(cols).toEqual(expect.arrayContaining(['id', 'company_name', 'tax_id', 'company_email', 'status', 'credit_balance']));
  }
  expect(mock.requestsTo('companies')).toEqual([]);
});
