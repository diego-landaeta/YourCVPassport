/**
 * /company/profile/:profileId metía el parámetro de la URL en un filtro .or() de
 * PostgREST (`slug.eq.X,handle.eq.X`). Con comas o paréntesis se podían añadir
 * condiciones al filtro. Ahora solo se aceptan slugs/handles ([a-z0-9_-]).
 * Supabase mockeado.
 *
 *   QA_PORT=5300 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/empresa-perfil-filtro.local.spec.ts
 */
import { test, expect, type BrowserContext } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, makeProfiles, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const COMPANY_ID = '22222222-2222-4222-8222-222222222222';

async function setup(context: BrowserContext) {
  const profiles = makeProfiles(4).map((p) => (p.role === 'admin' ? p : { ...p, role: 'user' }));
  const recruiter = { ...profiles[1], role: 'user' };
  const candidate = profiles[2];
  const company = { id: COMPANY_ID, company_name: 'Empresa QA', status: 'APPROVED', credit_balance: 10, created_by: recruiter.id };
  await installInitState(context, { sessionProfile: recruiter, language: 'es', theme: 'light' });
  await mockSupabase(context, {
    profiles,
    company_users: [{ id: 'cu-1', company_id: COMPANY_ID, user_id: recruiter.id, role: 'OWNER', is_active: true }],
    // companies_full: lectura de miembros si se cierra el SELECT de companies por columnas
    companies: [company],
    companies_full: [company],
    company_profile_views: [],
    company_conversations: [],
    company_activity_log: [],
  });
  const profileQueries: string[] = [];
  context.on('request', (req) => {
    const u = new URL(req.url());
    if (u.pathname.endsWith('/rest/v1/profiles') && req.method() === 'GET') profileQueries.push(decodeURIComponent(u.search));
  });
  return { candidate, profileQueries };
}

test('un parámetro con sintaxis de filtro no llega a la consulta y muestra "no encontrado"', async ({ context, page }) => {
  test.setTimeout(120_000);
  const { profileQueries } = await setup(context);
  const evil = encodeURIComponent('x,role.eq.admin');
  await page.goto(`/company/profile/${evil}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Perfil no encontrado')).toBeVisible({ timeout: 60_000 });
  expect(profileQueries.filter((q) => q.includes('role.eq.admin'))).toEqual([]);
  expect(profileQueries.filter((q) => q.includes('or=('))).toEqual([]);
});

test('un slug válido sigue cargando el perfil', async ({ context, page }) => {
  test.setTimeout(120_000);
  const { candidate, profileQueries } = await setup(context);
  await page.goto(`/company/profile/${candidate.slug}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(String(candidate.full_name)).first()).toBeVisible({ timeout: 60_000 });
  expect(profileQueries.some((q) => q.includes(`slug.eq.${candidate.slug}`))).toBe(true);
});
