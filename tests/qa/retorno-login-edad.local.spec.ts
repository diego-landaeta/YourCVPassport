/**
 * Auditoria de la bolsa (S6 y S4 del frontend) con Supabase mockeado.
 *
 *  - S6: «Inscribirme» sin sesion lleva a /login?next=...; tras iniciar sesion se vuelve a la
 *    OFERTA (no a /dashboard). PostLoginReturn (App.tsx) solo consume el retorno en /dashboard:
 *    consumirlo en /login lo gastaba antes de que AuthScreen navegara a /dashboard (que ganaba).
 *  - S4: LegalGate pide la fecha de nacimiento cuando profiles_full.fecha_nacimiento es NULL
 *    (OAuth y cuentas antiguas): 16-17 anos con casilla de tutores, <16 cierra la sesion con
 *    mensaje claro, y una fecha valida llama a set_my_birth_date.
 *
 *   QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/retorno-login-edad.local.spec.ts --project=chromium
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, buildFakeSession, installInitState, makeProfiles, mockSupabase, type Row } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 120_000 });

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const SLUG = 'enfermera-uci-madrid-11111111';
const DETAIL: Row = {
  id: JOB_ID, title: 'Enfermera UCI', slug: SLUG, company_id: 'c1', department: null,
  employment_type: null, work_mode: 'ONSITE', experience_level: null,
  location_city: 'Madrid', location_state: 'Madrid', location_country: 'ES', is_remote: false,
  description: '<p>Buscamos enfermera con experiencia.</p>',
  responsibilities: [], requirements: [], nice_to_have: null, benefits: [],
  required_skills: [], optional_skills: null,
  salary_min: null, salary_max: null, salary_currency: 'EUR', salary_period: 'MONTHLY', show_salary: false,
  application_deadline: new Date(Date.now() + 25 * 86400_000).toISOString(), application_email: null, application_url: null,
  application_instructions: null, published_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
  company_name: 'Hospital Norte', company_logo_url: null, company_website: null, company_description: null,
  status: 'PUBLISHED', accepting_applications: true, closed_at: null, country_code: 'ES', category: 'HEALTH_MEDICINE', category2: null,
  vacancies: 1, contract_types: ['INDEFINITE'], schedule: 'FULL_TIME', duration: null, start_date: null, start_immediate: true,
  salary_mode: null, education_min: null, experience_years: null, languages: [],
  cover_letter_mode: 'NONE', allowed_countries: null,
};

async function boot(context: BrowserContext, page: Page, o: { session?: boolean; profile?: Row; rpc?: Record<string, unknown> } = {}) {
  const base = makeProfiles(4)[2];
  const candidate: Row = { ...base, role: 'professional', country_code: 'ES', ...(o.profile || {}) };
  await installInitState(context, { sessionProfile: o.session ? candidate : null, language: 'es', theme: 'light' });
  const rpcCalls: Record<string, any[]> = {};
  page.on('request', (req) => {
    const m = new URL(req.url()).pathname.match(/\/rest\/v1\/rpc\/(.+)$/);
    if (m && req.method() === 'POST') (rpcCalls[m[1]] ||= []).push(JSON.parse(req.postData() || '{}'));
  });
  await mockSupabase(context, { profiles: [candidate], documentos_legales: [], my_job_applications: [] }, {
    rpc: { get_job_posting_detail: [DETAIL], ...(o.rpc || {}) },
  });
  return { candidate, rpcCalls };
}

test.describe('S6: retorno a la oferta tras iniciar sesion', () => {
  test('sin sesion: Inscribirme -> /login -> iniciar sesion -> vuelve a la oferta (no a /dashboard)', async ({ context, page }) => {
    const { candidate } = await boot(context, page);
    // Login con contrasena: el mock de Supabase devuelve una sesion valida
    await page.route('**/auth/v1/token*', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(buildFakeSession(candidate)),
    }));

    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Inicia sesión para inscribirte' }).first().click();
    await expect(page).toHaveURL(/\/login\?next=/);

    await page.fill('#email', 'qa.candidata@example.test');
    await page.fill('#password', 'Prueba1234');
    await page.locator('form button[type=submit]').click();

    // Termina en la oferta (ruta canonica con pais; /empleos/<slug> redirige), no en /dashboard
    await expect(page).toHaveURL(new RegExp(`/es/ofertas/${SLUG}`), { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    expect(new URL(page.url()).pathname).not.toBe('/dashboard');
    // El retorno se consumio una sola vez
    expect(await page.evaluate(() => sessionStorage.getItem('ycvp_post_login_return'))).toBeNull();
  });

  test('con sesion ya abierta y un retorno pendiente, /login -> /dashboard -> oferta', async ({ context, page }) => {
    await boot(context, page, { session: true });
    await page.addInitScript((path) => {
      try { sessionStorage.setItem('ycvp_post_login_return', JSON.stringify({ path, at: Date.now() })); } catch { /* sin storage */ }
    }, `/empleos/${SLUG}`);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`/es/ofertas/${SLUG}`), { timeout: 60_000 });
  });

  test('un retorno pendiente NO se gasta al visitar /login sin sesion', async ({ context, page }) => {
    await boot(context, page);
    await page.addInitScript((path) => {
      try { sessionStorage.setItem('ycvp_post_login_return', JSON.stringify({ path, at: Date.now() })); } catch { /* sin storage */ }
    }, `/empleos/${SLUG}`);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#email')).toBeVisible({ timeout: 60_000 });
    expect(await page.evaluate(() => sessionStorage.getItem('ycvp_post_login_return'))).not.toBeNull();
  });
});

test.describe('S4: LegalGate pide la fecha de nacimiento si falta', () => {
  const gate = (page: Page) => page.getByRole('dialog');

  test('fecha de 30 anos: llama a set_my_birth_date y deja pasar', async ({ context, page }) => {
    const { rpcCalls } = await boot(context, page, {
      session: true,
      profile: { fecha_nacimiento: null },
      rpc: { set_my_birth_date: { status: 'ok' } },
    });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(gate(page).getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toBeVisible({ timeout: 60_000 });

    // Sin fecha no se envia
    await gate(page).getByRole('button', { name: 'Guardar y continuar' }).click();
    await expect(gate(page).getByText('Indica tu fecha de nacimiento.')).toBeVisible();
    expect(rpcCalls.set_my_birth_date).toBeUndefined();

    await gate(page).getByLabel('Fecha de nacimiento').fill('1994-03-12');
    await gate(page).getByRole('button', { name: 'Guardar y continuar' }).click();
    await expect.poll(() => rpcCalls.set_my_birth_date?.length ?? 0).toBe(1);
    expect(rpcCalls.set_my_birth_date[0]).toEqual({ p_birth_date: '1994-03-12' });
    await expect(page.getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toHaveCount(0);
  });

  test('16-17 anos: aviso y casilla de tutores obligatoria', async ({ context, page }) => {
    const { rpcCalls } = await boot(context, page, {
      session: true,
      profile: { fecha_nacimiento: null },
      rpc: { set_my_birth_date: { status: 'ok' } },
    });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(gate(page).getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toBeVisible({ timeout: 60_000 });

    const y = new Date().getFullYear() - 17;
    await gate(page).getByLabel('Fecha de nacimiento').fill(`${y}-01-01`);
    await expect(gate(page).getByText(/Tienes menos de 18 años/)).toBeVisible();

    await gate(page).getByRole('button', { name: 'Guardar y continuar' }).click();
    await expect(gate(page).getByText('Confirma la autorización de tus padres o tutores para continuar.')).toBeVisible();
    expect(rpcCalls.set_my_birth_date).toBeUndefined();

    await gate(page).getByLabel('Confirmo que cuento con la autorización de mis padres o tutores.').check();
    await gate(page).getByRole('button', { name: 'Guardar y continuar' }).click();
    await expect.poll(() => rpcCalls.set_my_birth_date?.length ?? 0).toBe(1);
  });

  test('menor de 16: cierra sesion y /login explica por que', async ({ context, page }) => {
    await boot(context, page, {
      session: true,
      profile: { fecha_nacimiento: null },
      rpc: { set_my_birth_date: { status: 'underage' } },
    });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(gate(page).getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toBeVisible({ timeout: 60_000 });
    const y = new Date().getFullYear() - 12;
    await gate(page).getByLabel('Fecha de nacimiento').fill(`${y}-06-01`);
    // El aviso aparece ya al escribirla
    await expect(gate(page).getByText('Debes tener al menos 16 años para crear una cuenta.')).toBeVisible();
    await gate(page).getByRole('button', { name: 'Guardar y continuar' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 60_000 });
    await expect(page.getByRole('alert').filter({ hasText: 'hay que tener al menos 16 años' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('yourcvpassport-auth'))).toBeNull();
  });

  test('con fecha ya guardada no se pide', async ({ context, page }) => {
    const { rpcCalls } = await boot(context, page, { session: true, profile: { fecha_nacimiento: '1990-05-05' } });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Confirma tu fecha de nacimiento' })).toHaveCount(0);
    await page.waitForTimeout(1500);
    expect(rpcCalls.set_my_birth_date).toBeUndefined();
  });
});
