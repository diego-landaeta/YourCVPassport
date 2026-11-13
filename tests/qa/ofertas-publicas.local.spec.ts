/**
 * Bolsa de empleo, fase 2 y 3 (listado publico, ficha e inscripcion) con Supabase mockeado.
 * Contrato SQL: supabase/migrations/20261030_ofertas_fase2.sql y 20261031_candidaturas_fase3.sql
 * (NO estan aplicadas en produccion: aqui se responden las RPC con datos de prueba).
 *
 * Cubre:
 *  - /empleos sin sesion: listado completo (sin el tope de 8), pais por defecto Espana y filtros que
 *    llegan a search_public_jobs_v2.
 *  - /mx/empleos pide MX; un codigo que no es pais (/zz/empleos) pinta la pagina 404.
 *  - «Ya inscrito» con sesion (vista my_job_applications).
 *  - Ficha: JSON-LD JobPosting valido, noindex y aviso si esta cerrada, 404 si no existe.
 *  - URL canonica con pais (/es/ofertas/<slug>, /es/jobs/<slug>): la ficha, los enlaces del listado y la
 *    redireccion en cliente (replace) desde /empleos/<slug> y /jobs/<slug>.
 *  - Inscribirme sin sesion lleva a /login?next=... y guarda el retorno.
 *  - Inscripcion en un paso: resumen del perfil con avisos, pregunta MULTIPLE_CHOICE, consentimiento,
 *    cuerpo de apply_to_job y mapeo de errores a mensajes.
 *
 *   QA_PORT=5300 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/ofertas-publicas.local.spec.ts
 *
 * No lo he ejecutado en esta oleada (necesita arrancar Vite en un puerto libre): queda escrito.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, makeProfiles, mockSupabase, type Row } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

// Las etiquetas de <head> las pinta react-helmet-async con un retardo (y con el servidor de desarrollo de Vite,
// tras re-optimizar dependencias, a veces no llegan a pintarse: ver la nota de tests/qa/u09-seo.local.spec.ts).
// Contra el build (`vite preview`) salen al instante; aqui se da margen.
const HEAD_WAIT = { timeout: 120_000 };

async function readJsonLd(page: Page): Promise<any> {
  const loc = page.locator('script[type="application/ld+json"]').first();
  await expect(loc).toBeAttached(HEAD_WAIT);
  return JSON.parse((await loc.textContent()) || '{}');
}

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const SLUG = 'enfermera-uci-madrid-11111111';
// URL canonica de la ficha: /<cc>/ofertas/<slug> (es) y /<cc>/jobs/<slug> (en). La antigua /empleos/<slug> redirige.
const CANON = `/es/ofertas/${SLUG}`;
const Q_CHOICE = '33333333-3333-4333-8333-333333333331';
const Q_YESNO = '33333333-3333-4333-8333-333333333332';

function listRow(i: number, over: Row = {}): Row {
  return {
    id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`,
    title: `Oferta de prueba ${i}`,
    slug: `oferta-de-prueba-${i}-0000000${i}`,
    company_id: 'c1',
    company_name: `Empresa ${i}`,
    company_logo_url: null,
    country_code: 'ES',
    location_city: 'Madrid',
    work_mode: 'ONSITE',
    is_remote: false,
    contract_types: ['INDEFINITE'],
    schedule: 'FULL_TIME',
    category: 'IT_SOFTWARE',
    category2: null,
    vacancies: 1,
    experience_years: 2,
    summary: 'Descripcion corta de la oferta.',
    salary_min: 1800, salary_max: 2400, salary_currency: 'EUR', salary_period: 'MONTHLY', salary_mode: 'RANGE',
    show_salary: true,
    published_at: new Date(Date.now() - i * 3600_000).toISOString(),
    application_deadline: new Date(Date.now() + 20 * 86400_000).toISOString(),
    already_applied: false,
    total_count: 12,
    ...over,
  };
}

const LIST = Array.from({ length: 12 }, (_, i) => listRow(i + 1));

const DETAIL: Row = {
  id: JOB_ID, title: 'Enfermera UCI', slug: SLUG, company_id: 'c1', department: null,
  employment_type: null, work_mode: 'ONSITE', experience_level: null,
  location_city: 'Madrid', location_state: 'Madrid', location_country: 'ES', is_remote: false,
  description: '<p>Buscamos <strong>enfermera</strong> con experiencia.</p><script>window.__xss = 1</script>',
  responsibilities: ['Cuidar pacientes'], requirements: ['Grado en Enfermería'], nice_to_have: null, benefits: ['Seguro médico'],
  required_skills: ['UCI'], optional_skills: null,
  salary_min: 1800, salary_max: 2400, salary_currency: 'EUR', salary_period: 'MONTHLY', show_salary: true,
  application_deadline: new Date(Date.now() + 25 * 86400_000).toISOString(), application_email: null, application_url: null,
  application_instructions: null, published_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
  company_name: 'Hospital Norte', company_logo_url: null, company_website: 'https://hospital.example.com', company_description: 'Hospital de referencia.',
  status: 'PUBLISHED', accepting_applications: true, closed_at: null, country_code: 'ES', category: 'HEALTH_MEDICINE', category2: null,
  vacancies: 2, contract_types: ['INDEFINITE'], schedule: 'FULL_TIME', duration: null, start_date: null, start_immediate: true,
  salary_mode: 'RANGE', education_min: 'Grado', experience_years: 2, languages: [{ language: 'Inglés', level: 'B2' }],
  cover_letter_mode: 'OPTIONAL', allowed_countries: null,
};

const QUESTIONS: Row[] = [
  { id: Q_CHOICE, job_posting_id: JOB_ID, question_text: '¿Qué turno prefieres?', question_type: 'MULTIPLE_CHOICE', options: ['Mañana', 'Tarde', 'Noche'], is_required: true, order_index: 0, is_knockout: false },
  { id: Q_YESNO, job_posting_id: JOB_ID, question_text: '¿Tienes el título homologado?', question_type: 'YES_NO', options: null, is_required: true, order_index: 1, is_knockout: true },
];

const LEGAL_DOC = { id: '44444444-4444-4444-8444-444444444444', tipo: 'terminos_candidato', version: '1.0', idioma: 'es', titulo: 'Condiciones', casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'], vigente_desde: '2026-10-01T00:00:00Z' };

interface Setup { rpc?: Record<string, unknown>; session?: boolean; db?: Record<string, Row[]> }

async function setup(context: BrowserContext, page: Page, o: Setup = {}) {
  const profiles = makeProfiles(4);
  const candidate = { ...profiles[2], role: 'professional', country_code: 'ES' };
  await installInitState(context, { sessionProfile: o.session ? candidate : null, language: 'es', theme: 'light' });
  const rpcCalls: Record<string, any[]> = {};
  page.on('request', (req) => {
    const m = new URL(req.url()).pathname.match(/\/rest\/v1\/rpc\/(.+)$/);
    if (m && req.method() === 'POST') (rpcCalls[m[1]] ||= []).push(JSON.parse(req.postData() || '{}'));
  });
  await mockSupabase(context, { profiles: [candidate], ...(o.db || {}) }, {
    rpc: { search_public_jobs_v2: LIST, ...(o.rpc || {}) },
  });
  return { candidate, rpcCalls };
}

test.describe('listado publico', () => {
  test('sin sesion muestra TODAS las ofertas (sin tope de 8) y pide Espana por defecto', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page);
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Ofertas de empleo', level: 1 })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(12);
    await expect(page.getByText('12 ofertas')).toBeVisible();
    await expect.poll(() => rpcCalls.search_public_jobs_v2?.length ?? 0).toBeGreaterThan(0);
    const body = rpcCalls.search_public_jobs_v2[0];
    expect(body.p_country).toBe('ES');
    expect(body.p_limit).toBe(20);
    expect(body.p_offset).toBe(0);
  });

  test('cada fila enlaza a la URL canonica con pais de su oferta', async ({ context, page }) => {
    await setup(context, page);
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(12, { timeout: 60_000 });
    await expect(page.locator('a[href="/es/ofertas/oferta-de-prueba-1-00000001"]').first()).toBeVisible();
    await expect(page.locator('a[href^="/empleos/"]')).toHaveCount(0);
  });

  test('/mx/empleos pide MX y el filtro de categoria llega a la RPC', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page);
    await page.goto('/mx/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Ofertas de empleo en México/ })).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => rpcCalls.search_public_jobs_v2?.some((b) => b.p_country === 'MX')).toBe(true);

    // Las categorias son una pill desplegable (boton + lista de opciones)
    await page.getByRole('button', { name: 'Categoría' }).click();
    await page.getByRole('option', { name: 'Informática y desarrollo' }).click();
    await expect.poll(() => rpcCalls.search_public_jobs_v2?.some((b) => b.p_category === 'IT_SOFTWARE' && b.p_country === 'MX')).toBe(true);
    await expect(page).toHaveURL(/cat=IT_SOFTWARE/);
  });

  test('un codigo que no es un pais pinta la pagina 404', async ({ context, page }) => {
    await setup(context, page);
    await page.goto('/zz/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('404').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('meta[name="robots"][data-rh="true"]')).toHaveAttribute('content', /noindex/, HEAD_WAIT);
  });

  test('sin resultados con filtros: mensaje y boton para limpiar', async ({ context, page }) => {
    await setup(context, page, { rpc: { search_public_jobs_v2: [] } });
    await page.goto('/empleos?cat=SALES', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Ninguna oferta coincide con tus filtros')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Limpiar filtros' }).first()).toBeVisible();
  });

  test('con sesion marca «Ya inscrito» las ofertas de my_job_applications', async ({ context, page }) => {
    await setup(context, page, {
      session: true,
      db: { my_job_applications: [{ job_posting_id: LIST[2].id, candidate_status: 'SENT' }] },
    });
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(12, { timeout: 60_000 });
    await expect(page.getByText('Ya inscrito')).toHaveCount(1);
  });
});

test.describe('ficha de oferta', () => {
  test('pinta la oferta, emite JSON-LD JobPosting y no ejecuta scripts del texto', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [DETAIL] } });
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Buscamos')).toBeVisible();
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();

    const ld = await readJsonLd(page);
    expect(ld['@type']).toBe('JobPosting');
    expect(ld.title).toBe('Enfermera UCI');
    expect(ld.validThrough).toBe(DETAIL.application_deadline);
    expect(ld.hiringOrganization.name).toBe('Hospital Norte');
    expect(ld.baseSalary.currency).toBe('EUR');
    expect(ld.baseSalary.value).toMatchObject({ minValue: 1800, maxValue: 2400, unitText: 'MONTH' });
    expect(ld.jobLocation.address.addressCountry).toBe('ES');
    expect(ld.description).not.toContain('<script');
    await expect(page.locator('meta[name="robots"][data-rh="true"]')).toHaveAttribute('content', 'index, follow', HEAD_WAIT);
  });

  test('sin salario visible no hay baseSalary', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [{ ...DETAIL, show_salary: false, salary_min: null, salary_max: null, salary_currency: null }] } });
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    const ld = await readJsonLd(page);
    expect(ld.baseSalary).toBeUndefined();
  });

  test('oferta cerrada: aviso, sin boton de inscripcion, noindex y sin JSON-LD', async ({ context, page }) => {
    await setup(context, page, {
      rpc: { get_job_posting_detail: [{ ...DETAIL, status: 'CLOSED', accepting_applications: false }] },
    });
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Esta oferta ya no admite candidaturas').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Inscribirme' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Ofertas parecidas' })).toBeVisible();
    await expect(page.locator('meta[name="robots"][data-rh="true"]')).toHaveAttribute('content', /noindex/, HEAD_WAIT);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });

  test('una oferta que no existe pinta la pagina 404 (sin navegar a /404)', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [] } });
    await page.goto('/empleos/no-existe-00000000', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('¡Ups! Página no encontrada')).toBeVisible({ timeout: 60_000 });
    expect(new URL(page.url()).pathname).toBe('/empleos/no-existe-00000000');
    await expect(page.locator('meta[name="robots"][data-rh="true"]')).toHaveAttribute('content', /noindex/, HEAD_WAIT);
  });

  test('URL canonica: /es/ofertas/<slug> pinta la ficha sin redirigir y conserva la query', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [DETAIL] } });
    await page.goto(`${CANON}?utm=x`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    const u = new URL(page.url());
    expect(u.pathname).toBe(CANON);
    expect(u.search).toBe('?utm=x');
  });

  test('/empleos/<slug> redirige (replace) a la canonica con pais y conserva la query', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [DETAIL] } });
    await page.goto(`/empleos/${SLUG}?utm=x`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => new URL(page.url()).pathname).toBe(CANON);
    expect(new URL(page.url()).search).toBe('?utm=x');
    // replace: la entrada antigua no queda en el historial (volver atras no vuelve a /empleos/<slug>)
    expect(await page.evaluate(() => history.length)).toBeLessThanOrEqual(2);
  });

  test('/jobs/<slug> (ingles) redirige a /es/jobs/<slug> y la interfaz queda en ingles', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [DETAIL] } });
    await page.goto(`/jobs/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/es/jobs/${SLUG}`);
    await expect(page.getByRole('button', { name: /Sign in to apply|Log in to apply/i }).first()).toBeVisible();
  });

  test('un pais que no es el de la oferta se corrige al de la oferta', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [DETAIL] } });
    await page.goto(`/mx/ofertas/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => new URL(page.url()).pathname).toBe(CANON);
  });

  test('una oferta sin pais conserva la ruta antigua (no redirige)', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [{ ...DETAIL, country_code: null }] } });
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    expect(new URL(page.url()).pathname).toBe(`/empleos/${SLUG}`);
  });

  test('la ficha canonica declara canonical, hreflang con pais y url del JSON-LD con pais', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [DETAIL] } });
    await page.goto(CANON, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    // Helmet: en Vite dev a veces no pinta el <head>; se valida contra el build (vite preview)
    const base = 'https://yourcvpassport.com';
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${base}${CANON}`, HEAD_WAIT);
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', `${base}/es/ofertas/${SLUG}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `${base}/es/jobs/${SLUG}`);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `${base}/es/jobs/${SLUG}`);
    const ld = await readJsonLd(page);
    expect(ld.url).toBe(`${base}${CANON}`);
  });

  test('Inscribirme sin sesion lleva a /login con retorno a la oferta', async ({ context, page }) => {
    await setup(context, page, { rpc: { get_job_posting_detail: [DETAIL] } });
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Inicia sesión para inscribirte' }).first().click();
    await expect(page).toHaveURL(/\/login\?next=/);
    const next = new URL(page.url()).searchParams.get('next');
    expect(next).toBe(`${CANON}?apply=1`);
    const stored = await page.evaluate(() => sessionStorage.getItem('ycvp_post_login_return'));
    expect(JSON.parse(stored || '{}').path).toBe(`${CANON}?apply=1`);
  });
});

test.describe('inscripcion', () => {
  const rpc = {
    get_job_posting_detail: [DETAIL],
    preview_application_profile: {
      profile: {
        profile: { full_name: 'Profesional 002', headline: 'Enfermera', location: 'Madrid' },
        contact: { email: 'pro2@example.test', phone: null },
        experiences: [], education: [{ degree: 'Grado' }], skills: [{ name: 'UCI' }], languages: [],
      },
      gaps: ['NO_EXPERIENCE', 'NO_LANGUAGES'],
    },
    apply_to_job: { success: true, application_id: '55555555-5555-4555-8555-555555555555', match_score: 72, warnings: ['NO_EXPERIENCE'] },
  };
  const db = { job_posting_questions: QUESTIONS, documentos_legales: [LEGAL_DOC], my_job_applications: [] };

  test('resumen con avisos, preguntas, consentimiento y cuerpo de apply_to_job', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { session: true, rpc, db });
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Inscribirme' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Esto es lo que verá la empresa')).toBeVisible({ timeout: 60_000 });
    await expect(dialog.getByText('Profesional 002')).toBeVisible();
    await expect(dialog.getByText('No has añadido experiencia')).toBeVisible();
    await expect(dialog.getByText('¿Qué turno prefieres?')).toBeVisible();

    // Sin consentimiento ni respuestas no se envia
    await dialog.getByRole('button', { name: 'Enviar inscripción' }).click();
    await expect(dialog.getByText('Marca las casillas de consentimiento para poder inscribirte.')).toBeVisible();
    expect(rpcCalls.apply_to_job).toBeUndefined();

    await dialog.getByLabel('Tarde').check();
    await dialog.getByLabel('Sí', { exact: true }).check();
    await dialog.getByLabel(/Acepto las condiciones para candidatos/).check();
    await dialog.getByLabel('Confirmo que los datos de mi perfil son verdaderos.').check();
    await dialog.getByRole('button', { name: 'Enviar inscripción' }).click();

    await expect(dialog.getByText('Inscripción enviada')).toBeVisible();
    await expect.poll(() => rpcCalls.apply_to_job?.length ?? 0).toBe(1);
    const body = rpcCalls.apply_to_job[0];
    expect(body.p_job_posting_id).toBe(JOB_ID);
    expect(body.p_consent).toBe(true);
    expect(body.p_consent_doc_version).toBe('1.0');
    expect(body.p_answers).toEqual({ [Q_CHOICE]: 'Tarde', [Q_YESNO]: 'YES' });
    // Registro legal de la aceptacion (contexto inscripcion)
    await expect.poll(() => rpcCalls.registrar_aceptacion?.length ?? 0).toBe(1);
    expect(rpcCalls.registrar_aceptacion[0]).toMatchObject({ p_contexto: 'inscripcion', p_oferta_id: JOB_ID, p_documento_ids: [LEGAL_DOC.id] });
  });

  test('ALREADY_APPLIED llega como mensaje en espanol', async ({ context, page }) => {
    await setup(context, page, { session: true, rpc, db });
    await page.route('**/rest/v1/rpc/apply_to_job', (route) => route.fulfill({
      status: 400, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: 'P0001', message: 'ALREADY_APPLIED: Already applied to this job' }),
    }));
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Inscribirme' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Esto es lo que verá la empresa')).toBeVisible({ timeout: 60_000 });
    await dialog.getByLabel('Mañana').check();
    await dialog.getByLabel('Sí', { exact: true }).check();
    await dialog.getByLabel(/Acepto las condiciones para candidatos/).check();
    await dialog.getByLabel('Confirmo que los datos de mi perfil son verdaderos.').check();
    await dialog.getByRole('button', { name: 'Enviar inscripción' }).click();
    await expect(dialog.getByText('Ya te habías inscrito en esta oferta.')).toBeVisible();
  });

  test('CONSENT_REQUIRED y REQUIRED_QUESTION_MISSING tienen su mensaje', async ({ context, page }) => {
    await setup(context, page, { session: true, rpc, db });
    await page.route('**/rest/v1/rpc/apply_to_job', (route) => route.fulfill({
      status: 400, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: 'P0001', message: 'REQUIRED_QUESTION_MISSING: falta responder "¿Qué turno prefieres?"' }),
    }));
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Inscribirme' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Esto es lo que verá la empresa')).toBeVisible({ timeout: 60_000 });
    await dialog.getByLabel('Mañana').check();
    await dialog.getByLabel('Sí', { exact: true }).check();
    await dialog.getByLabel(/Acepto las condiciones para candidatos/).check();
    await dialog.getByLabel('Confirmo que los datos de mi perfil son verdaderos.').check();
    await dialog.getByRole('button', { name: 'Enviar inscripción' }).click();
    await expect(dialog.getByText('Falta responder una pregunta obligatoria.')).toBeVisible();
  });

  // S1: el servidor exige la aceptacion vigente en apply_to_job (ACCEPTANCE_REQUIRED), asi que
  // la aceptacion se registra ANTES y se espera; si falla, no se inscribe.
  const fillAndSubmit = async (page: Page) => {
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Esto es lo que verá la empresa')).toBeVisible({ timeout: 60_000 });
    await dialog.getByLabel('Tarde').check();
    await dialog.getByLabel('Sí', { exact: true }).check();
    await dialog.getByLabel(/Acepto las condiciones para candidatos/).check();
    await dialog.getByLabel('Confirmo que los datos de mi perfil son verdaderos.').check();
    await dialog.getByRole('button', { name: 'Enviar inscripción' }).click();
    return dialog;
  };

  test('S1: registrar_aceptacion va ANTES de apply_to_job', async ({ context, page }) => {
    const order: string[] = [];
    page.on('request', (req) => {
      const m = new URL(req.url()).pathname.match(/\/rest\/v1\/rpc\/(registrar_aceptacion|apply_to_job)$/);
      if (m && req.method() === 'POST') order.push(m[1]);
    });
    await setup(context, page, { session: true, rpc, db });
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Inscribirme' }).first().click();
    const dialog = await fillAndSubmit(page);
    await expect(dialog.getByText('Inscripción enviada')).toBeVisible();
    expect(order).toEqual(['registrar_aceptacion', 'apply_to_job']);
  });

  test('S1: si registrar_aceptacion falla NO se llama a apply_to_job y se explica', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page, { session: true, rpc, db });
    await page.route('**/rest/v1/rpc/registrar_aceptacion', (route) => route.fulfill({
      status: 400, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: '22023', message: 'DOCUMENTO_NO_VIGENTE: terminos_candidato 0.9 (es) no es la versión en vigor' }),
    }));
    await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Inscribirme' }).first().click();
    const dialog = await fillAndSubmit(page);
    await expect(dialog.getByText(/No hemos podido registrar tu aceptación/)).toBeVisible();
    expect(rpcCalls.apply_to_job).toBeUndefined();
    await expect(dialog.getByText('Inscripción enviada')).toHaveCount(0);
  });

  for (const [code, message, text] of [
    ['ACCEPTANCE_REQUIRED', 'ACCEPTANCE_REQUIRED: acepta las condiciones de candidato vigentes antes de inscribirte', /tienes que aceptar las condiciones vigentes/],
    ['UNDERAGE', 'UNDERAGE: hay que tener al menos 16 años para inscribirse', /al menos 16 años para inscribirte/],
  ] as const) {
    test(`S1/S4: apply_to_job devuelve ${code}: mensaje claro`, async ({ context, page }) => {
      await setup(context, page, { session: true, rpc, db });
      await page.route('**/rest/v1/rpc/apply_to_job', (route) => route.fulfill({
        status: 400, contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ code: 'P0001', message }),
      }));
      await page.goto(`/empleos/${SLUG}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Inscribirme' }).first().click();
      const dialog = await fillAndSubmit(page);
      await expect(dialog.getByText(text)).toBeVisible();
    });
  }
});

test.describe('filtro de experiencia (F6)', () => {
  test('la pill «Experiencia» llega a la URL (exp) y a search_public_jobs_v2 (p_max_experience_years)', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page);
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Ofertas de empleo', level: 1 })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Experiencia', exact: true }).click();
    await page.getByRole('option', { name: 'Hasta 2 años' }).click();
    await expect(page).toHaveURL(/exp=2/);
    await expect.poll(() => rpcCalls.search_public_jobs_v2?.some((b) => b.p_max_experience_years === 2)).toBe(true);
    // «Sin experiencia» = 0 (no se pierde por ser falsy). Con un valor elegido, la pill muestra el valor.
    await page.getByRole('button', { name: 'Hasta 2 años', exact: true }).click();
    await page.getByRole('option', { name: 'Sin experiencia' }).click();
    await expect(page).toHaveURL(/exp=0/);
    await expect.poll(() => rpcCalls.search_public_jobs_v2?.some((b) => b.p_max_experience_years === 0)).toBe(true);
  });

  test('un valor raro en la URL se ignora', async ({ context, page }) => {
    const { rpcCalls } = await setup(context, page);
    await page.goto('/empleos?exp=abc', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => rpcCalls.search_public_jobs_v2?.length ?? 0).toBeGreaterThan(0);
    expect(rpcCalls.search_public_jobs_v2.every((b) => b.p_max_experience_years === null)).toBe(true);
  });
});
