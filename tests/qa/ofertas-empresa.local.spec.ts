/**
 * Bolsa de empleo, fase 2 (#7), lado EMPRESA y ADMIN, con Supabase MOCKEADO (nada sale a produccion):
 *
 * - Asistente de 5 pasos: eleccion «nueva o duplicar», validaciones en cliente (pais, titulo en
 *   mayusculas, descripcion >= 300, salario, fecha de cierre), autoguardado en cada «Continuar»
 *   (POST la primera vez, PATCH despues), moneda fijada por el pais, tope de 5 preguntas con
 *   «Imprescindible», casillas de las condiciones del empleador y Publicar
 *   (registrar_aceptacion con contexto `publicacion` ANTES de submit_job_for_review).
 * - Estado resultante: en revision / revision manual, y errores del servidor por prefijo.
 * - Empresa PENDING: se prepara el borrador pero «Publicar» queda desactivado.
 * - «Mis ofertas»: estados traducidos, nuevas/total, acciones por estado y SIN confirmacion de creditos.
 * - Admin: cola de revision, aprobar con moderar_oferta y rechazar solo con motivo.
 *
 *   QA_PORT=5420 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/ofertas-empresa.local.spec.ts
 *
 * Router propio de Supabase para la parte de empresa (estado en memoria); el admin usa el mock
 * compartido (`mockSupabase`) con algunas rutas sobrescritas.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { ADMIN_ID, buildFakeSession, installInitState, makeProfiles, mockSupabase, SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 150_000 });

const USER_ID = '00000000-0000-4000-8000-0000000000f1';
const COMPANY_ID = '00000000-0000-4000-8000-0000000000c1';
const JOB_ID = '00000000-0000-4000-8000-0000000000a1';
const OLD_JOB_ID = '00000000-0000-4000-8000-0000000000a2';
const DOC_ID = '00000000-0000-4000-8000-0000000000d1';

const PROFILE = {
  id: USER_ID,
  email: 'rrhh@empresa-test.example',
  full_name: 'Persona RRHH',
  role: 'employer',
  plan: 'free',
  wizard_completed: true,
  first_login_completed: true,
};

const COUNTRIES = [
  { code: 'ES', name_es: 'España', name_en: 'Spain', currency: 'EUR', active: true },
  { code: 'MX', name_es: 'México', name_en: 'Mexico', currency: 'MXN', active: true },
];

const TERMS = {
  id: DOC_ID,
  tipo: 'terminos_empleador',
  version: '1.0',
  idioma: 'es',
  titulo: 'Condiciones de registro y uso – Empleadores',
  texto: '8. Publicación de ofertas. Texto de prueba.',
  casillas_obligatorias: ['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento'],
  borrador: true,
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
  'content-type': 'application/json',
};
const reply = (route: Route, status: number, body: unknown) => route.fulfill({ status, headers: CORS, body: JSON.stringify(body) });

const pad = (n: number) => String(n).padStart(2, '0');
function localDate(addDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Oferta completa y valida (para abrir el paso 5 directamente). */
function completeJob(over: Record<string, any> = {}) {
  return {
    id: JOB_ID,
    company_id: COMPANY_ID,
    status: 'DRAFT',
    title: 'Dependiente/a de tienda',
    slug: null,
    department: null,
    employment_type: 'FULL_TIME',
    experience_level: 'JUNIOR',
    work_mode: 'ONSITE',
    location_city: 'Madrid',
    location_state: null,
    location_country: 'ES',
    is_remote: false,
    description: `<p>${'Buscamos una persona para atender a clientes en nuestra tienda. '.repeat(6)}</p>`,
    responsibilities: ['Atender al público'],
    requirements: [],
    nice_to_have: [],
    benefits: ['Seguro médico'],
    required_skills: ['Atención al cliente'],
    optional_skills: [],
    salary_min: 1200,
    salary_max: 1500,
    salary_currency: 'EUR',
    salary_period: 'MONTHLY',
    show_salary: true,
    application_deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    published_at: null,
    closed_at: null,
    country_code: 'ES',
    category: 'RETAIL',
    category2: null,
    vacancies: 1,
    contract_types: ['INDEFINITE'],
    schedule: 'FULL_TIME',
    duration: null,
    start_date: null,
    start_immediate: true,
    salary_mode: 'RANGE',
    education_min: null,
    experience_years: 1,
    languages: [],
    cover_letter_mode: 'NONE',
    allowed_countries: null,
    notify_emails: [],
    notify_frequency: 'DAILY',
    review_reason: null,
    views_count: 0,
    applications_count: 0,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    ...over,
  };
}

interface Opts {
  lang?: 'es' | 'en';
  companyStatus?: string;
  /** País de la empresa (companies_full.country_code). Por defecto ES; null = sin informar. */
  companyCountry?: string | null;
  jobs?: Record<string, any>[];
  questions?: Record<string, any>[];
  /** Respuesta de submit_job_for_review: estado o error. */
  submit?: { status: 'AI_REVIEW' | 'MANUAL_REVIEW' } | { error: { code: string; message: string; details?: string } };
  newApplications?: { job_posting_id: string }[];
}

interface Calls {
  jobWrites: { method: string; body: any; query: string }[];
  questionWrites: { method: string; body: any; query: string }[];
  rpc: { fn: string; body: any }[];
  dialogs: string[];
}

async function isolate(page: Page, opts: Opts = {}): Promise<Calls> {
  const calls: Calls = { jobWrites: [], questionWrites: [], rpc: [], dialogs: [] };
  const jobs = new Map<string, Record<string, any>>((opts.jobs ?? []).map((j) => [j.id, { ...j }]));
  let questions = (opts.questions ?? []).map((q) => ({ ...q }));
  let qSeq = 0;

  page.on('dialog', (d) => {
    calls.dialogs.push(d.message());
    void d.dismiss();
  });

  await installInitState(page.context(), { sessionProfile: PROFILE, language: opts.lang ?? 'es', theme: process.env.QA_F2_THEME === 'dark' ? 'dark' : 'light' });

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    if (req.method() === 'OPTIONS') return reply(route, 200, 'ok');

    let body: any = null;
    try {
      body = req.postDataJSON();
    } catch {
      /* sin cuerpo */
    }
    const path = url.pathname;
    const method = req.method();
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const one = (row: any) => reply(route, 200, wantsObject ? row : [row]);

    if (path.startsWith('/auth/v1/user')) return reply(route, 200, buildFakeSession(PROFILE).user);
    if (path.startsWith('/auth/v1/')) return reply(route, 200, {});

    if (path.startsWith('/rest/v1/rpc/')) {
      const fn = path.replace('/rest/v1/rpc/', '');
      calls.rpc.push({ fn, body });
      if (fn === 'documentos_pendientes') return reply(route, 200, []);
      if (fn === 'get_job_questions_for_company') return reply(route, 200, questions);
      if (fn === 'registrar_aceptacion') return reply(route, 200, ['00000000-0000-4000-8000-0000000000e1']);
      if (fn === 'submit_job_for_review') {
        const s = opts.submit ?? { status: 'AI_REVIEW' };
        if ('error' in s) return reply(route, 400, { hint: null, details: null, ...s.error });
        return reply(route, 200, { success: true, status: s.status, flags: [], application_deadline: new Date(Date.now() + 30 * 86400000).toISOString() });
      }
      return reply(route, 200, null);
    }

    if (path === '/rest/v1/company_users') return reply(route, 200, [{ id: 'cu-1', company_id: COMPANY_ID, user_id: USER_ID, role: 'OWNER' }]);
    if (path === '/rest/v1/companies_full') {
      return reply(route, 200, [{
        id: COMPANY_ID, company_name: 'Empresa Prueba', legal_name: 'Empresa Prueba, S.L.', tax_id: 'B67799247',
        company_email: 'rrhh@empresa-test.example', status: opts.companyStatus ?? 'APPROVED', credit_balance: 0,
        total_credits_purchased: 0, total_credits_used: 0, country_code: opts.companyCountry === undefined ? 'ES' : opts.companyCountry, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
      }]);
    }
    if (path === '/rest/v1/companies') return reply(route, 200, [{ id: COMPANY_ID, company_name: 'Empresa Prueba', logo_url: null }]);
    if (path === '/rest/v1/profiles_full') return reply(route, 200, [PROFILE]);
    if (path === '/rest/v1/countries') return reply(route, 200, COUNTRIES);
    if (path === '/rest/v1/documentos_legales') return reply(route, 200, [TERMS]);
    if (path === '/rest/v1/job_applications') return reply(route, 200, opts.newApplications ?? []);

    if (path === '/rest/v1/job_posting_questions') {
      if (method === 'GET') return reply(route, 200, questions);
      calls.questionWrites.push({ method, body, query: decodeURIComponent(url.search) });
      if (method === 'POST') {
        const rows = (Array.isArray(body) ? body : [body]).map((r: any) => ({ ...r, id: `q-${++qSeq}` }));
        questions = [...questions, ...rows];
        return reply(route, 201, rows.map((r: any) => ({ id: r.id, order_index: r.order_index })));
      }
      return reply(route, 200, []);
    }

    if (path === '/rest/v1/job_postings') {
      if (method === 'GET') {
        const idEq = url.searchParams.get('id');
        if (idEq?.startsWith('eq.')) {
          const row = jobs.get(idEq.slice(3));
          return reply(route, 200, row ? [row] : []);
        }
        return reply(route, 200, Array.from(jobs.values()));
      }
      calls.jobWrites.push({ method, body, query: decodeURIComponent(url.search) });
      if (method === 'POST') {
        const row = { ...completeJob(), ...body, id: JOB_ID, status: 'DRAFT' };
        jobs.set(JOB_ID, row);
        return one({ id: JOB_ID, status: 'DRAFT' });
      }
      if (method === 'PATCH') {
        const id = (url.searchParams.get('id') || '').replace('eq.', '');
        const row = jobs.get(id) ?? completeJob({ id });
        const next = { ...row, ...body };
        jobs.set(id, next);
        return one({ id, status: next.status });
      }
      return reply(route, 200, []);
    }

    if (path.startsWith('/rest/v1/')) return reply(route, method === 'POST' ? 201 : 200, method === 'POST' ? null : []);
    return reply(route, 200, {});
  });
  return calls;
}

/** Capturas opcionales para revisar el aspecto: QA_F2_SHOTS=1 (y QA_F2_THEME=dark). No afectan al resultado. */
async function shot(page: Page, name: string) {
  if (!process.env.QA_F2_SHOTS) return;
  await page.screenshot({ path: `test-results/ofertas-f2-shots/${process.env.QA_F2_THEME || 'light'}-${name}.png`, fullPage: true });
}

const lastRpc = (calls: Calls, fn: string) => [...calls.rpc].reverse().find((c) => c.fn === fn);

test.describe('asistente de ofertas', () => {
  test('nueva oferta: 5 pasos, validaciones, autoguardado y publicar', async ({ page }) => {
    const calls = await isolate(page, { companyCountry: null });
    await page.goto('/company/jobs/new');

    // Antes del paso 1: nueva o duplicar (sin ofertas anteriores, duplicar queda sin uso).
    await expect(page.getByRole('heading', { name: '¿Cómo quieres empezar?' })).toBeVisible({ timeout: 90_000 });
    await page.getByTestId('choose-new').click();

    // --- Paso 1: validaciones ---
    await page.getByTestId('next-step').click();
    await expect(page.getByText('Elige el país.')).toBeVisible();
    await expect(page.getByText('Escribe el título del puesto.')).toBeVisible();
    expect(calls.jobWrites).toHaveLength(0); // con errores no se guarda nada

    await page.selectOption('#f-country', 'ES');
    await page.fill('#f-title', 'VENDEDOR DE TIENDA');
    await page.selectOption('#f-category', 'RETAIL');
    await page.getByRole('radio', { name: 'Presencial' }).check();
    await page.fill('#f-city', 'Madrid');
    await page.getByTestId('next-step').click();
    await expect(page.getByText('No escribas el título todo en mayúsculas.')).toBeVisible();

    await page.fill('#f-title', 'Dependiente/a de tienda');
    await page.getByTestId('next-step').click();

    // Autoguardado: primera vez INSERT en DRAFT, con la moneda del país. Orden de la issue #7:
    // 1 Datos básicos, 2 Condiciones y compensación, 3 Descripción y requisitos, 4 Filtros, 5 Revisar.
    await expect(page.getByRole('heading', { name: 'Condiciones y compensación', level: 2 })).toBeVisible();
    expect(calls.jobWrites).toHaveLength(1);
    expect(calls.jobWrites[0].method).toBe('POST');
    expect(calls.jobWrites[0].body).toMatchObject({
      company_id: COMPANY_ID,
      created_by: USER_ID,
      status: 'DRAFT',
      title: 'Dependiente/a de tienda',
      country_code: 'ES',
      category: 'RETAIL',
      work_mode: 'ONSITE',
      location_city: 'Madrid',
      vacancies: 1,
      salary_currency: 'EUR',
    });
    // La URL pasa a /edit/:id sin perder el paso
    await expect(page).toHaveURL(new RegExp(`/company/jobs/edit/${JOB_ID}`));

    // --- Paso 2: contrato, jornada, salario con moneda fija, mostrar salario obligatorio ---
    await page.getByTestId('next-step').click();
    await expect(page.getByText('Elige al menos un tipo de contrato.')).toBeVisible();
    await expect(page.getByText('Elige la jornada.')).toBeVisible();
    await expect(page.getByText('Elige si quieres mostrar el salario o no.')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Indefinido' }).check();
    await page.getByRole('radio', { name: 'Jornada completa' }).check();
    await page.selectOption('#f-salary-mode', 'RANGE');
    await expect(page.locator('#f-currency')).toHaveValue('EUR');
    await expect(page.locator('#f-currency')).toHaveAttribute('readonly', '');
    await page.fill('#f-salary-min', '1500');
    await page.fill('#f-salary-max', '1200');
    await page.getByRole('radio', { name: 'Sí, mostrarlo' }).check();
    await page.getByTestId('next-step').click();
    await expect(page.getByText('El máximo no puede ser menor que el mínimo.')).toBeVisible();
    await page.fill('#f-salary-min', '1200');
    await page.fill('#f-salary-max', '1500');
    // Los beneficios son chips: se añade uno de los sugeridos.
    await page.getByRole('button', { name: '+ Seguro médico' }).click();
    await page.getByTestId('next-step').click();

    // Segundo guardado: UPDATE, no INSERT.
    await expect(page.getByRole('heading', { name: 'Descripción y requisitos', level: 2 })).toBeVisible();
    await shot(page, 'paso3');
    expect(calls.jobWrites).toHaveLength(2);
    expect(calls.jobWrites[1].method).toBe('PATCH');
    expect(calls.jobWrites[1].body).toMatchObject({
      contract_types: ['INDEFINITE'],
      schedule: 'FULL_TIME',
      salary_mode: 'RANGE',
      salary_min: 1200,
      salary_max: 1500,
      salary_currency: 'EUR',
      salary_period: 'MONTHLY',
      show_salary: true,
      benefits: ['Seguro médico'],
    });

    // --- Paso 3: descripción >= 300 ---
    await page.locator('#f-description').fill('Texto demasiado corto.');
    await page.getByTestId('next-step').click();
    await expect(page.getByText('La descripción necesita al menos 300 caracteres.')).toBeVisible();
    await page.locator('#f-description').fill('Buscamos una persona para atender a clientes en tienda. '.repeat(8));
    await expect(page.getByTestId('description-count')).toContainText('caracteres');
    await page.getByTestId('next-step').click();

    // Tercer guardado: UPDATE.
    await expect(page.getByRole('heading', { name: 'Filtros y candidaturas', level: 2 })).toBeVisible();
    expect(calls.jobWrites).toHaveLength(3);
    expect(calls.jobWrites[2].method).toBe('PATCH');
    expect(calls.jobWrites[2].body.description).toMatch(/^<p>Buscamos una persona/);

    // --- Paso 4: hasta 5 preguntas, «Imprescindible», correos y fecha de cierre ---
    await page.getByRole('button', { name: '+ Experiencia' }).click();
    const first = page.getByTestId('question-card').first();
    await first.getByRole('checkbox', { name: 'Imprescindible' }).check();
    await first.locator('input[type=number]').fill('2');
    await page.getByRole('button', { name: '+ Formación' }).click();
    const second = page.getByTestId('question-card').nth(1);
    await second.getByRole('checkbox', { name: 'Imprescindible' }).check();
    await second.getByRole('radio', { name: 'Sí', exact: true }).check();
    await page.getByRole('button', { name: '+ Idioma' }).click();
    await page.getByRole('button', { name: '+ Carné o certificación' }).click();
    await page.getByRole('button', { name: '+ Disponibilidad para viajar' }).click();
    await expect(page.getByTestId('question-card')).toHaveCount(5);
    await shot(page, 'paso4');
    await expect(page.getByRole('button', { name: '+ Añadir pregunta' })).toBeDisabled();
    await expect(page.getByText('Has llegado al máximo de 5 preguntas.')).toBeVisible();

    await expect(page.locator('#f-deadline')).toHaveValue(localDate(30)); // 30 días por defecto
    await page.fill('#f-notify', 'esto-no-es-un-correo');
    await page.getByTestId('next-step').click();
    await expect(page.getByText('Hay un correo que no es válido.')).toBeVisible();
    await page.fill('#f-notify', 'rrhh@empresa-test.example');
    await page.getByRole('radio', { name: 'Opcional' }).check();
    await page.getByTestId('next-step').click();

    await expect(page.getByRole('heading', { name: 'Revisar y publicar', level: 2 })).toBeVisible();
    expect(calls.questionWrites.filter((w) => w.method === 'POST')).toHaveLength(1);
    const qBody = calls.questionWrites.find((w) => w.method === 'POST')!.body as any[];
    expect(qBody).toHaveLength(5);
    expect(qBody[0]).toMatchObject({ question_type: 'NUMBER', is_knockout: true, is_required: true, expected_answer: '>=2', order_index: 0 });
    expect(qBody[1]).toMatchObject({ question_type: 'YES_NO', is_knockout: true, expected_answer: 'YES' });
    expect(qBody[2]).toMatchObject({ is_knockout: false, expected_answer: null });
    const lastJobWrite = calls.jobWrites[calls.jobWrites.length - 1].body;
    expect(lastJobWrite).toMatchObject({ cover_letter_mode: 'OPTIONAL', notify_emails: ['rrhh@empresa-test.example'] });

    // --- Paso 5: resumen, vista previa y condiciones ---
    await expect(page.getByTestId('job-preview')).toContainText('Dependiente/a de tienda');
    await expect(page.getByTestId('job-preview')).toContainText(/1\.?200/);
    await shot(page, 'paso5');
    const publish = page.getByTestId('publish-button');
    await expect(publish).toBeDisabled();
    for (const key of TERMS.casillas_obligatorias) {
      await page.locator(`[data-casilla="${key}"]`).check();
    }
    await expect(publish).toBeEnabled();
    await publish.click();

    const result = page.getByTestId('publish-result');
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute('data-status', 'AI_REVIEW');
    await expect(result).toContainText('Oferta enviada a revisión');

    // La aceptación se registra con la oferta ANTES de enviarla a revisión.
    const names = calls.rpc.map((c) => c.fn);
    expect(names.indexOf('registrar_aceptacion')).toBeGreaterThan(-1);
    expect(names.indexOf('registrar_aceptacion')).toBeLessThan(names.indexOf('submit_job_for_review'));
    expect(lastRpc(calls, 'registrar_aceptacion')!.body).toMatchObject({
      p_documento_ids: [DOC_ID],
      p_contexto: 'publicacion',
      p_oferta_id: JOB_ID,
      p_company_id: COMPANY_ID,
      p_casillas: { poder_representacion: true, ofertas_reales_no_discriminatorias: true, anexo_encargo_tratamiento: true },
    });
    expect(lastRpc(calls, 'submit_job_for_review')!.body).toEqual({ p_job_id: JOB_ID });
    // Publicar es gratis: no hay ningún diálogo de confirmación de créditos.
    expect(calls.dialogs).toHaveLength(0);
  });

  test('revisión manual: mensaje propio', async ({ page }) => {
    const calls = await isolate(page, { jobs: [completeJob()], submit: { status: 'MANUAL_REVIEW' } });
    await page.goto(`/company/jobs/edit/${JOB_ID}?paso=5`);
    for (const key of TERMS.casillas_obligatorias) await page.locator(`[data-casilla="${key}"]`).check({ timeout: 90_000 });
    await page.getByTestId('publish-button').click();
    const result = page.getByTestId('publish-result');
    await expect(result).toHaveAttribute('data-status', 'MANUAL_REVIEW');
    await expect(result).toContainText('Tu oferta está en revisión manual');
    expect(lastRpc(calls, 'submit_job_for_review')).toBeTruthy();
  });

  test('errores del servidor por prefijo, en español y con la lista de motivos', async ({ page }) => {
    await isolate(page, {
      jobs: [completeJob()],
      submit: { error: { code: '22023', message: 'JOB_INVALID: description_too_short, country_required', details: 'description_too_short,country_required' } },
    });
    await page.goto(`/company/jobs/edit/${JOB_ID}?paso=5`);
    for (const key of TERMS.casillas_obligatorias) await page.locator(`[data-casilla="${key}"]`).check({ timeout: 90_000 });
    await page.getByTestId('publish-button').click();
    const err = page.getByTestId('submit-error');
    await expect(err).toContainText('La oferta no cumple todavía los requisitos para publicarse');
    await expect(err).toContainText('la descripción tiene menos de 300 caracteres');
    await expect(err).toContainText('falta el país');
  });

  test('empresa pendiente de verificación: prepara el borrador pero no publica', async ({ page }) => {
    await isolate(page, { jobs: [completeJob()], companyStatus: 'PENDING' });
    await page.goto(`/company/jobs/edit/${JOB_ID}?paso=5`);
    for (const key of TERMS.casillas_obligatorias) await page.locator(`[data-casilla="${key}"]`).check({ timeout: 90_000 });
    await expect(page.getByText('Tu empresa todavía está pendiente de verificación').first()).toBeVisible();
    await expect(page.getByTestId('publish-button')).toBeDisabled();
  });

  test('duplicar una oferta anterior: se copia y la primera vez se INSERTA como nueva', async ({ page }) => {
    const old = completeJob({ id: OLD_JOB_ID, title: 'Oferta anterior', status: 'CLOSED' });
    const calls = await isolate(page, {
      jobs: [old],
      questions: [{ id: 'q-old', job_posting_id: OLD_JOB_ID, question_text: '¿Tienes carné de conducir?', question_type: 'YES_NO', options: null, is_required: true, is_knockout: true, expected_answer: 'YES', order_index: 0 }],
    });
    await page.goto('/company/jobs/new');
    await page.getByTestId('choose-duplicate').click();
    await page.getByTestId('choose-duplicate-item').first().click();

    await expect(page.locator('#f-title')).toHaveValue('Oferta anterior', { timeout: 90_000 });
    await page.getByTestId('next-step').click();
    await expect(page.getByRole('heading', { name: 'Condiciones y compensación', level: 2 })).toBeVisible();
    expect(calls.jobWrites[0].method).toBe('POST');
    expect(calls.jobWrites[0].body.title).toBe('Oferta anterior');
    const qPost = calls.questionWrites.find((w) => w.method === 'POST');
    expect(qPost).toBeTruthy();
    expect((qPost!.body as any[])[0]).toMatchObject({ question_text: '¿Tienes carné de conducir?', is_knockout: true, expected_answer: 'YES' });
  });

  test('una oferta en revisión no se edita', async ({ page }) => {
    await isolate(page, { jobs: [completeJob({ status: 'AI_REVIEW' })] });
    await page.goto(`/company/jobs/edit/${JOB_ID}`);
    await expect(page.getByRole('heading', { name: 'Esta oferta está en revisión' })).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('#f-title')).toHaveCount(0);
  });
});

test.describe('Mis ofertas', () => {
  const JOBS = [
    completeJob({ id: 'j-draft', title: 'Borrador de prueba', status: 'DRAFT', created_at: '2026-10-01T10:00:00Z' }),
    completeJob({ id: 'j-pub', title: 'Oferta publicada', status: 'PUBLISHED', slug: 'oferta-publicada-1234abcd', published_at: '2026-10-05T10:00:00Z', applications_count: 5, views_count: 40, created_at: '2026-10-02T10:00:00Z' }),
    completeJob({ id: 'j-review', title: 'Oferta en revisión', status: 'MANUAL_REVIEW', created_at: '2026-10-03T10:00:00Z' }),
    completeJob({ id: 'j-rej', title: 'Oferta rechazada', status: 'REJECTED', review_reason: 'Pide dinero al candidato', created_at: '2026-10-04T10:00:00Z' }),
    completeJob({ id: 'j-exp', title: 'Oferta caducada', status: 'EXPIRED', published_at: '2026-08-01T10:00:00Z', created_at: '2026-08-01T09:00:00Z' }),
    completeJob({ id: 'j-paused', title: 'Oferta pausada', status: 'PAUSED', published_at: '2026-10-05T10:00:00Z', created_at: '2026-10-06T10:00:00Z' }),
  ];

  test('estados traducidos, nuevas/total, acciones por estado y sin confirmación de créditos', async ({ page }, testInfo) => {
    test.skip(!!testInfo.project.use.isMobile, 'La tabla es de escritorio: en móvil se pintan tarjetas.');
    const calls = await isolate(page, { jobs: JOBS, newApplications: [{ job_posting_id: 'j-pub' }, { job_posting_id: 'j-pub' }] });
    await page.goto('/company/jobs');

    const table = page.getByTestId('jobs-table');
    await expect(table).toBeVisible({ timeout: 90_000 });
    const row = (id: string) => table.locator(`tr[data-job-id="${id}"]`);
    await expect(row('j-draft')).toContainText('Borrador');
    await expect(row('j-pub')).toContainText('Publicada');
    await expect(row('j-review')).toContainText('En revisión manual');
    await expect(row('j-rej')).toContainText('Rechazada');
    await expect(row('j-rej')).toContainText('Pide dinero al candidato');
    await expect(row('j-exp')).toContainText('Caducada');
    await expect(row('j-pub').getByTestId('apps-cell')).toHaveText('2 nuevas / 5');

    await shot(page, 'mis-ofertas');
    // Acciones: publicada -> editar, pausar, cerrar, cubierta, duplicar. En revisión solo duplicar.
    for (const name of ['Editar', 'Pausar', 'Cerrar', 'Marcar como cubierta', 'Duplicar']) {
      await expect(row('j-pub').getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible();
    }
    await expect(row('j-review').getByRole('button', { name: /^Editar/ })).toHaveCount(0);
    await expect(row('j-review').getByRole('button', { name: /^Duplicar/ })).toBeVisible();
    await expect(row('j-exp').getByRole('button', { name: /^Renovar/ })).toBeVisible();
    await expect(row('j-paused').getByRole('button', { name: /^Reanudar/ })).toBeVisible();

    // Publicar es gratis: el listado no habla de créditos.
    await expect(page.getByText(/créditos?\b/i)).toHaveCount(0);

    // Pausar: sin diálogos.
    await row('j-pub').getByRole('button', { name: /^Pausar/ }).click();
    await expect.poll(() => calls.jobWrites.length).toBe(1);
    expect(calls.jobWrites[0].method).toBe('PATCH');
    expect(calls.jobWrites[0].body).toEqual({ status: 'PAUSED' });
    expect(calls.jobWrites[0].query).toContain('id=eq.j-pub');

    // Cerrar pide confirmación en la propia fila (no un diálogo del navegador).
    await row('j-pub').getByRole('button', { name: /^Cerrar/ }).click();
    await expect(row('j-pub').getByRole('alertdialog')).toBeVisible();
    await row('j-pub').getByRole('button', { name: 'Sí', exact: true }).click();
    await expect.poll(() => calls.jobWrites.length).toBe(2);
    expect(calls.jobWrites[1].body).toEqual({ status: 'CLOSED' });
    // El cierre termina (y limpia su confirmación) antes de pedir la siguiente: si no, es una carrera.
    await expect(row('j-pub').getByRole('alertdialog')).toHaveCount(0);

    // Renovar una caducada: vuelve a borrador con 30 días más y abre el último paso.
    await row('j-exp').getByRole('button', { name: /^Renovar/ }).click();
    await row('j-exp').getByRole('button', { name: 'Sí', exact: true }).click();
    await expect.poll(() => calls.jobWrites.length).toBe(3);
    expect(calls.jobWrites[2].body.status).toBe('DRAFT');
    const renewedTo = new Date(calls.jobWrites[2].body.application_deadline).getTime();
    expect(renewedTo).toBeGreaterThan(Date.now() + 28 * 86400000);
    // F4: el cierre se cuenta desde AHORA (el trigger lo limita a now() + 61 días, no a published_at + 61)
    expect(renewedTo).toBeLessThanOrEqual(Date.now() + 61 * 86400000);
    await expect(page).toHaveURL(/\/company\/jobs\/edit\/j-exp\?paso=5/);

    expect(calls.dialogs).toHaveLength(0);
  });

  test('sin ofertas: estado vacío con acción', async ({ page }) => {
    await isolate(page, { jobs: [] });
    await page.goto('/company/jobs');
    await expect(page.getByRole('heading', { name: 'Todavía no has creado ninguna oferta' })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole('button', { name: 'Crear mi primera oferta' })).toBeVisible();
  });
});

test.describe('panel de administración', () => {
  const QUEUED = {
    id: JOB_ID, title: 'Oferta dudosa', company_id: COMPANY_ID, status: 'MANUAL_REVIEW', country_code: 'ES', category: 'SALES',
    work_mode: 'REMOTE', location_city: null, is_remote: true, contract_types: ['FREELANCE'], schedule: 'FULL_TIME',
    salary_min: null, salary_max: null, salary_currency: 'EUR', salary_period: null, show_salary: false,
    description: '<p>Gana dinero rápido. Escríbenos por WhatsApp.</p>', responsibilities: [], requirements: [], benefits: [],
    review_reason: 'Reglas automáticas: CONTACTO_EXTERNO («whatsapp»)', reviewed_at: null, published_at: null, applications_count: 0,
    created_at: '2026-10-28T10:00:00Z', companies: { company_name: 'Empresa Prueba' },
  };
  const PUBLISHED = { ...QUEUED, id: 'j-ok', title: 'Oferta normal', status: 'PUBLISHED', review_reason: null, description: '<p>Descripción normal.</p>' };

  test('cola de revisión: ver denuncias, rechazar exige motivo y aprobar llama a moderar_oferta', async ({ context, page }) => {
    const profiles = makeProfiles(5);
    const admin = profiles.find((p) => p.id === ADMIN_ID)!;
    await installInitState(context, { sessionProfile: admin, language: 'es' });
    await mockSupabase(context, { profiles });

    const rpc: { fn: string; body: any }[] = [];
    await context.route('**/rest/v1/rpc/moderar_oferta', async (route) => {
      rpc.push({ fn: 'moderar_oferta', body: route.request().postDataJSON() });
      return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ job_id: JOB_ID, status: 'PUBLISHED' }) });
    });
    await context.route('**/rest/v1/job_postings*', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify([QUEUED, PUBLISHED]) });
    });
    await context.route('**/rest/v1/job_reports*', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({
        status: 200,
        headers: CORS,
        body: JSON.stringify([{ id: 'r1', job_id: JOB_ID, reason: 'SCAM', details: 'Piden pagar un curso', status: 'OPEN', created_at: '2026-10-28T12:00:00Z' }]),
      });
    });

    await page.goto('/admin');
    await page.getByRole('button', { name: /Aprobar Vacantes/ }).click({ timeout: 90_000 });

    // La cola solo trae las que esperan revisión.
    const table = page.getByTestId('admin-jobs-table');
    await expect(table.locator('tr[data-job-id]')).toHaveCount(1);
    await expect(table.locator(`tr[data-job-id="${JOB_ID}"]`)).toContainText('En revisión manual');
    await expect(table.locator(`tr[data-job-id="${JOB_ID}"]`)).toContainText('1 abiertas');

    // Detalle: avisos de la revisión y denuncias.
    await table.getByRole('button', { name: 'Oferta dudosa', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('CONTACTO_EXTERNO');
    await expect(dialog).toContainText('Estafa o piden dinero');
    await expect(dialog).toContainText('Piden pagar un curso');

    // Rechazar sin motivo: no se llama a la RPC.
    await dialog.getByRole('button', { name: /^Rechazar/ }).click();
    await dialog.getByTestId('admin-panel-confirm').click();
    await expect(dialog.getByText('Escribe el motivo del rechazo.')).toBeVisible();
    expect(rpc).toHaveLength(0);

    // Con motivo sí.
    await dialog.getByLabel(/Motivo del rechazo/).fill('Pide contactar por WhatsApp');
    await dialog.getByTestId('admin-panel-confirm').click();
    await expect.poll(() => rpc.length).toBe(1);
    expect(rpc[0].body).toEqual({ p_job_id: JOB_ID, p_decision: 'REJECTED', p_motivo: 'Pide contactar por WhatsApp' });

    // Aprobar desde la tabla.
    await table.getByRole('button', { name: /^Aprobar: Oferta dudosa/ }).click();
    await expect.poll(() => rpc.length).toBe(2);
    expect(rpc[1].body).toEqual({ p_job_id: JOB_ID, p_decision: 'PUBLISHED', p_motivo: null });
  });
});
