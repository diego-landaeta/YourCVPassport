/**
 * Bolsa de empleo, fase 1 (#6) en la UI, con Supabase MOCKEADO (nada sale a produccion):
 *
 * - Registro con dos caminos: primer paso «¿buscas empleo o contratas?».
 * - Candidato: fecha de nacimiento con control de edad (<16 no se registra; 16-17 con
 *   aviso y casilla de tutores), casillas obligatorias (condiciones+privacidad y datos
 *   verdaderos) y las opcionales SIN marcar; el cuerpo de `signup` lleva idioma, tipo,
 *   fecha y casillas.
 * - Empresa (camino de registro): sin fecha de nacimiento ni casillas de candidato.
 * - Registro de empresa (/company/register): pais obligatorio desde `countries`, contacto,
 *   casillas de empleador, SIN api.ipify.org, y tras crear la empresa llama a
 *   registrar_aceptacion (contexto registro, con p_company_id) y a company-review-ai.
 * - LegalGate: con documentos pendientes bloquea el area y registra la aceptacion.
 *
 *   QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/legal-registro.local.spec.ts
 *
 * No se ha ejecutado al escribirlo (puerto de Vite ocupado por otros agentes): ver el informe.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { installInitState, SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 120_000 });

const USER_ID = '00000000-0000-4000-8000-0000000000f1';
const COMPANY_ID = '00000000-0000-4000-8000-0000000000c1';
const DOC_EMPLEADOR = '00000000-0000-4000-8000-0000000000d1';
const DOC_PRIVACIDAD = '00000000-0000-4000-8000-0000000000d2';
const DOC_CANDIDATO = '00000000-0000-4000-8000-0000000000d3';

const PROFILE = {
  id: USER_ID,
  email: 'persona@empresa-test.example',
  full_name: 'Persona Prueba',
  role: 'professional',
  plan: 'free',
  wizard_completed: true,
  first_login_completed: true,
};

const LEGAL_DOCS = [
  {
    id: DOC_EMPLEADOR, tipo: 'terminos_empleador', version: '1.0', idioma: 'es', titulo: 'Condiciones de registro y uso – Empleadores',
    texto: '1. Titular. Texto de prueba.', audiencia: 'empleador',
    casillas_obligatorias: ['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento'],
    borrador: true, vigente_desde: '2026-10-29T00:00:00+00:00',
  },
  {
    id: DOC_PRIVACIDAD, tipo: 'privacidad', version: '1.0', idioma: 'es', titulo: 'Política de Privacidad',
    texto: 'Responsable: ISEIE.', audiencia: 'todos', casillas_obligatorias: [], borrador: true,
    vigente_desde: '2026-10-29T00:00:00+00:00',
  },
];

const COUNTRIES = [
  { code: 'ES', name_es: 'España', name_en: 'Spain', currency: 'EUR' },
  { code: 'MX', name_es: 'México', name_en: 'Mexico', currency: 'MXN' },
];

interface Calls {
  signup: any[];
  review: any[];
  acceptance: any[];
  companyInserts: any[];
  externalIp: string[];
}

interface Options {
  lang?: 'es' | 'en';
  /** Con sesion falsa (candidato). */
  session?: boolean;
  pendingDocs?: any[];
  /** Usuario miembro de una empresa en este estado (PENDING, APPROVED...). */
  companyStatus?: string;
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
  'content-type': 'application/json',
};
const reply = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, headers: CORS, body: JSON.stringify(body) });

async function isolate(page: Page, opts: Options = {}): Promise<Calls> {
  const calls: Calls = { signup: [], review: [], acceptance: [], companyInserts: [], externalIp: [] };
  await installInitState(page.context(), {
    sessionProfile: opts.session ? PROFILE : null,
    language: opts.lang ?? 'es',
  });

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname.includes('ipify')) calls.externalIp.push(req.url());
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    if (req.method() === 'OPTIONS') return reply(route, 200, 'ok');

    let body: any = null;
    try { body = req.postDataJSON(); } catch { /* sin cuerpo */ }
    const path = url.pathname;
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object');

    if (path === '/functions/v1/signup') {
      calls.signup.push(body);
      return reply(route, 200, { success: true, emailSent: true, alreadyPending: false });
    }
    if (path === '/functions/v1/company-review-ai') {
      calls.review.push(body);
      return reply(route, 200, { success: true, status: 'PENDING', resultado: 'dudosa' });
    }
    if (path === '/rest/v1/rpc/registrar_aceptacion') {
      calls.acceptance.push(body);
      return reply(route, 200, ['00000000-0000-4000-8000-0000000000a1']);
    }
    if (path === '/rest/v1/rpc/documentos_pendientes') {
      return reply(route, 200, opts.pendingDocs ?? []);
    }
    if (path === '/rest/v1/company_users' && opts.companyStatus) {
      return reply(route, 200, [{ id: 'cu-1', company_id: COMPANY_ID, user_id: USER_ID, role: 'OWNER' }]);
    }
    if (path === '/rest/v1/companies_full' && opts.companyStatus) {
      return reply(route, 200, [{
        id: COMPANY_ID, company_name: 'Empresa Prueba', legal_name: 'Empresa Prueba, S.L.', tax_id: 'B67799247',
        company_email: 'rrhh@empresa-test.example', status: opts.companyStatus, credit_balance: 0,
        total_credits_purchased: 0, total_credits_used: 0, created_at: '2026-10-29T00:00:00Z', updated_at: '2026-10-29T00:00:00Z',
      }]);
    }
    if (path === '/rest/v1/documentos_legales') return reply(route, 200, LEGAL_DOCS);
    if (path === '/rest/v1/countries') return reply(route, 200, COUNTRIES);
    if (path === '/rest/v1/profiles_full') return reply(route, 200, [PROFILE]);
    if (path === '/rest/v1/companies' && req.method() === 'POST') {
      calls.companyInserts.push(body);
      return reply(route, 201, wantsObject ? { id: COMPANY_ID } : [{ id: COMPANY_ID }]);
    }
    if (path.startsWith('/rest/v1/')) {
      return reply(route, req.method() === 'POST' ? 201 : 200, req.method() === 'POST' ? null : []);
    }
    return reply(route, 200, {});
  });
  return calls;
}

/** Fecha AAAA-MM-DD de hace `years` años y `extraDays` días (en calendario local). */
function agoISO(years: number, extraDays = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - extraDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function fillAccount(page: Page, email = 'Nuevo.Usuario@Example.com') {
  await page.fill('#fullName', 'Nuevo Usuario');
  await page.fill('#email', email);
  await page.fill('#password', 'Prueba1234');
}

test.describe('registro con dos caminos', () => {
  test('el primer paso pregunta empleo o contratar y no enseña el formulario hasta elegir', async ({ page }) => {
    await isolate(page);
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: '¿Buscas empleo o quieres contratar?' })).toBeVisible();
    await expect(page.locator('#fullName')).toHaveCount(0);
    await page.getByTestId('signup-type-candidato').click();
    await expect(page.locator('#fullName')).toBeVisible();
    // «Cambiar» vuelve a la elección
    await page.getByRole('button', { name: 'Cambiar', exact: true }).click();
    await expect(page.getByTestId('signup-type-empresa')).toBeVisible();
  });

  test('candidato: edad, casillas obligatorias y cuerpo de signup', async ({ page }) => {
    const calls = await isolate(page, { lang: 'es' });
    await page.goto('/signup');
    await page.getByTestId('signup-type-candidato').click();
    await fillAccount(page);

    // Casillas SIN marcar por defecto; las opcionales aparte.
    await expect(page.locator('#agreeToTerms')).not.toBeChecked();
    // Los enlaces van a la página legal en el idioma de la interfaz (/terminos, no /terms).
    await expect(page.getByRole('link', { name: /Condiciones de registro y uso para candidatos/ })).toHaveAttribute('href', '/terminos');
    await expect(page.getByRole('link', { name: 'Política de Privacidad' })).toHaveAttribute('href', '/privacidad');
    await expect(page.locator('#consent-datos_verdaderos')).not.toBeChecked();
    await expect(page.locator('#consent-perfil_publico')).not.toBeChecked();

    // Menor de 16: no se registra.
    await page.fill('#birthDate', agoISO(10));
    await expect(page.getByText('Debes tener al menos 16 años para crear una cuenta.').first()).toBeVisible();
    await page.locator('form button[type=submit]').click();
    expect(calls.signup).toHaveLength(0);

    // 16-17: aviso y casilla de tutores.
    await page.fill('#birthDate', agoISO(17, 30));
    await expect(page.getByText(/autorización de tus padres o tutores/).first()).toBeVisible();
    await expect(page.locator('#consent-autorizacion_tutores')).toBeVisible();

    // Adulto: sin marcar las obligatorias no se envía.
    await page.fill('#birthDate', '1990-05-15');
    await expect(page.locator('#consent-autorizacion_tutores')).toHaveCount(0);
    await page.locator('form button[type=submit]').click();
    expect(calls.signup).toHaveLength(0);
    await expect(page.locator('#agreeToTerms')).toHaveAttribute('aria-invalid', 'true');

    // Marcar las dos obligatorias (la de «datos verdaderos» también es obligatoria).
    await page.check('#agreeToTerms');
    await page.locator('form button[type=submit]').click();
    expect(calls.signup).toHaveLength(0);
    await page.check('#consent-datos_verdaderos');
    await page.locator('form button[type=submit]').click();

    await expect.poll(() => calls.signup.length).toBe(1);
    const body = calls.signup[0];
    expect(body.email).toBe('nuevo.usuario@example.com');
    expect(body.tipo).toBe('candidato');
    expect(body.registro_idioma).toBe('es');
    expect(body.fecha_nacimiento).toBe('1990-05-15');
    expect(body.casillas.acepto_condiciones_privacidad).toBe(true);
    expect(body.casillas.datos_verdaderos).toBe(true);
    expect(body.casillas.perfil_publico).toBe(false);
    expect(body.casillas.alertas_novedades).toBe(false);
  });

  test('candidato de 17 años: sin la casilla de tutores no se registra', async ({ page }) => {
    const calls = await isolate(page);
    await page.goto('/signup?tipo=candidato');
    await fillAccount(page);
    await page.fill('#birthDate', agoISO(17, 30));
    await page.check('#agreeToTerms');
    await page.check('#consent-datos_verdaderos');
    await page.locator('form button[type=submit]').click();
    expect(calls.signup).toHaveLength(0);
    await page.check('#consent-autorizacion_tutores');
    await page.locator('form button[type=submit]').click();
    await expect.poll(() => calls.signup.length).toBe(1);
    expect(calls.signup[0].casillas.autorizacion_tutores).toBe(true);
  });

  test('en inglés: el idioma de registro es el de la interfaz', async ({ page }) => {
    const calls = await isolate(page, { lang: 'en' });
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Are you looking for a job or hiring?' })).toBeVisible();
    await page.getByTestId('signup-type-candidato').click();
    await fillAccount(page);
    await page.fill('#birthDate', '1990-05-15');
    await page.check('#agreeToTerms');
    await page.check('#consent-datos_verdaderos');
    await page.locator('form button[type=submit]').click();
    await expect.poll(() => calls.signup.length).toBe(1);
    expect(calls.signup[0].registro_idioma).toBe('en');
  });

  test('empresa: sin fecha de nacimiento ni casillas de candidato', async ({ page }) => {
    const calls = await isolate(page);
    await page.goto('/signup?tipo=empresa');
    await expect(page.locator('#birthDate')).toHaveCount(0);
    await expect(page.locator('#agreeToTerms')).toHaveCount(0);
    await expect(page.getByText(/completarás los datos de la empresa/)).toBeVisible();
    await fillAccount(page, 'rrhh@empresa-test.example');
    await page.locator('form button[type=submit]').click();
    await expect.poll(() => calls.signup.length).toBe(1);
    const body = calls.signup[0];
    expect(body.tipo).toBe('empresa');
    expect(body.registro_idioma).toBe('es');
    expect(body).not.toHaveProperty('fecha_nacimiento');
    expect(body).not.toHaveProperty('casillas');
  });
});

test.describe('registro de empresa', () => {
  test('sin sesión pide crear la cuenta de empresa', async ({ page }) => {
    await isolate(page);
    await page.goto('/company/register');
    await expect(page.getByRole('heading', { name: 'Necesitas una cuenta para registrar tu empresa' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Crear cuenta de empresa' })).toHaveAttribute('href', '/signup?tipo=empresa');
  });

  test('país obligatorio, casillas de empleador, sin ipify, aceptación y revisión', async ({ page }) => {
    const calls = await isolate(page, { session: true });
    await page.goto('/company/register');
    await expect(page.locator('#country_code')).toBeVisible();
    // Países desde la tabla countries
    await expect(page.locator('#country_code option')).toHaveText(['Selecciona un país', 'España', 'México']);
    // Tamaños nuevos
    await expect(page.locator('#company_size option')).toHaveText([
      'Selecciona el tamaño', '1-10 empleados', '11-50 empleados', '51-250 empleados', 'Más de 250 empleados',
    ]);

    await page.fill('#company_name', 'Empresa Prueba');
    await page.fill('#legal_name', 'Empresa Prueba, S.L.');
    await page.fill('#tax_id', 'B67799247');
    await page.fill('#company_email', 'rrhh@empresa-test.example');
    await page.fill('#website_url', 'https://empresa-test.example');
    await page.fill('#industry', 'Formación');
    await page.selectOption('#company_size', '51-250');
    await page.fill('#contact_name', 'Marta Gómez');

    // Sin país ni casillas: errores propios, nada se envía.
    await page.locator('form button[type=submit]').click();
    await expect(page.getByText('Selecciona el país de la empresa.')).toBeVisible();
    await expect(page.getByText('Marca todas las casillas obligatorias para registrar la empresa.')).toBeVisible();
    expect(calls.companyInserts).toHaveLength(0);

    await page.selectOption('#country_code', 'ES');
    for (const key of ['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento']) {
      await expect(page.locator(`#consent-${key}`)).not.toBeChecked();
      await page.check(`#consent-${key}`);
    }
    await page.locator('form button[type=submit]').click();

    // Éxito: la empresa queda en revisión (la Edge del mock responde PENDING).
    await expect(page.getByText(/Tu empresa está en revisión|está en revisión/).first()).toBeVisible({ timeout: 20_000 });

    // Inserción: país, idioma, contacto; la IP NO la manda el cliente.
    expect(calls.companyInserts).toHaveLength(1);
    const insert = calls.companyInserts[0];
    expect(insert.country_code).toBe('ES');
    expect(insert.idioma).toBe('es');
    expect(insert.contact_name).toBe('Marta Gómez');
    expect(insert.company_size).toBe('51-250');
    expect(insert).not.toHaveProperty('signup_ip');
    expect(calls.externalIp).toHaveLength(0);

    // Aceptación: registro, con la empresa y las casillas de empleador.
    expect(calls.acceptance).toHaveLength(1);
    const acceptance = calls.acceptance[0];
    expect(acceptance.p_contexto).toBe('registro');
    expect(acceptance.p_company_id).toBe(COMPANY_ID);
    expect([...acceptance.p_documento_ids].sort()).toEqual([DOC_EMPLEADOR, DOC_PRIVACIDAD].sort());
    expect(acceptance.p_casillas.poder_representacion).toBe(true);
    expect(acceptance.p_casillas.ofertas_reales_no_discriminatorias).toBe(true);
    expect(acceptance.p_casillas.anexo_encargo_tratamiento).toBe(true);
    expect(acceptance.p_casillas.novedades_comerciales).toBe(false);
    // La IP y el navegador no viajan en la petición.
    expect(JSON.stringify(acceptance)).not.toMatch(/p_ip|user_agent|p_user_agent/);

    // Revisión automática solicitada para esa empresa.
    expect(calls.review).toEqual([{ companyId: COMPANY_ID }]);
  });
});

test.describe('empresa pendiente de revisión', () => {
  test('puede entrar al panel y ve el aviso «en revisión» (no publica)', async ({ page }) => {
    await isolate(page, { session: true, companyStatus: 'PENDING' });
    await page.goto('/company/dashboard');
    await expect(page.getByRole('status').filter({ hasText: 'Tu empresa está en revisión' })).toBeVisible();
    // No cae en la antigua pantalla que bloqueaba todo /company/* mientras estaba PENDING.
    await expect(page).toHaveURL(new RegExp('/company/dashboard$'));
  });

  test('aprobada: sin aviso', async ({ page }) => {
    await isolate(page, { session: true, companyStatus: 'APPROVED' });
    await page.goto('/company/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Tu empresa está en revisión')).toHaveCount(0);
  });
});

test.describe('LegalGate', () => {
  test('con documentos pendientes bloquea el área y registra la aceptación', async ({ page }) => {
    const pending = [
      {
        documento_id: DOC_CANDIDATO, tipo: 'terminos_candidato', version: '1.1', idioma: 'es',
        titulo: 'Condiciones de registro y uso – Candidatos', texto: '1. Titular. Nueva versión.',
        audiencia: 'candidato', casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'],
        borrador: true, vigente_desde: '2026-10-29T00:00:00+00:00',
      },
    ];
    const calls = await isolate(page, { session: true, pendingDocs: pending });
    await page.goto('/dashboard');

    const dialog = page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Borrador pendiente de revisión legal')).toBeVisible();
    const accept = dialog.getByRole('button', { name: 'Aceptar y continuar' });
    await expect(accept).toBeDisabled();

    await dialog.getByRole('checkbox').first().check();
    await expect(accept).toBeDisabled();
    await dialog.getByRole('checkbox').nth(1).check();
    await expect(accept).toBeEnabled();
    await accept.click();

    await expect(dialog).toHaveCount(0);
    expect(calls.acceptance).toHaveLength(1);
    expect(calls.acceptance[0].p_documento_ids).toEqual([DOC_CANDIDATO]);
    expect(calls.acceptance[0].p_contexto).toBe('nueva_version'); // cuenta antigua (sesión falsa de enero)
    expect(calls.acceptance[0].p_casillas).toEqual({ acepto_condiciones_privacidad: true, datos_verdaderos: true });
  });

  test('sin pendientes no aparece la pantalla', async ({ page }) => {
    await isolate(page, { session: true, pendingDocs: [] });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' })).toHaveCount(0);
  });

  // F15: lo que marcó al registrarse (app_metadata.registro_aceptacion) se registra en el primer
  // acceso, y la casilla opcional «alertas_novedades» crea la alerta de ofertas. perfil_publico,
  // aparecer_google y empresas_contacto no tienen columna en profiles: no se aplican (ver informe).
  test('F15: la aceptación del alta se registra sin pedirla otra vez y alertas_novedades crea la alerta', async ({ page }) => {
    const pending = [
      {
        documento_id: DOC_CANDIDATO, tipo: 'terminos_candidato', version: '1.0', idioma: 'es',
        titulo: 'Condiciones de registro y uso – Candidatos', texto: '1. Titular.',
        audiencia: 'candidato', casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'],
        borrador: false, vigente_desde: '2026-10-29T00:00:00+00:00',
      },
    ];
    const calls = await isolate(page, { session: true, pendingDocs: pending });
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('yourcvpassport-auth');
        if (!raw) return;
        const s = JSON.parse(raw);
        s.user.app_metadata = {
          ...(s.user.app_metadata || {}),
          registro_aceptacion: {
            tipo: 'candidato',
            casillas: { acepto_condiciones_privacidad: true, datos_verdaderos: true, alertas_novedades: true, perfil_publico: false },
            versiones: { terminos_candidato: '1.0' },
            aceptado_en: new Date().toISOString(),
          },
        };
        localStorage.setItem('yourcvpassport-auth', JSON.stringify(s));
      } catch { /* sin storage */ }
    });
    // Las casillas opcionales del alta se guardan con save_consent_prefs: solo las 4 claves, nunca las obligatorias
    const prefsCalls: any[] = [];
    page.on('request', (r) => { if (r.url().includes('/rpc/save_consent_prefs') && r.method() === 'POST') prefsCalls.push(r.postDataJSON()); });
    const alertWrites: Array<{ method: string; body: any }> = [];
    await page.route('**/rest/v1/job_alert_subscriptions*', (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') return reply(route, 200, 'ok');
      if (req.method() === 'GET') return reply(route, 200, null); // sin alerta previa (maybeSingle)
      let body: any = null;
      try { body = req.postDataJSON(); } catch { /* sin cuerpo */ }
      alertWrites.push({ method: req.method(), body });
      return reply(route, req.method() === 'POST' ? 201 : 200, req.method() === 'POST' ? null : []); // el UPDATE no toca filas -> INSERT
    });
    await page.goto('/dashboard');
    await expect.poll(() => calls.acceptance.length).toBe(1);
    expect(calls.acceptance[0]).toMatchObject({ p_contexto: 'registro', p_documento_ids: [DOC_CANDIDATO] });
    // No aparece la pantalla de aceptación: ya estaba aceptado en el alta
    await expect(page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' })).toHaveCount(0);
    await expect.poll(() => alertWrites.some((w) => w.method === 'POST')).toBe(true);
    const insert = alertWrites.find((w) => w.method === 'POST')!;
    expect(insert.body).toMatchObject({ profile_id: USER_ID, categories: [], keywords: [], frequency: 'WEEKLY', active: true });
    await expect.poll(() => prefsCalls.length).toBe(1);
    expect(prefsCalls[0]).toEqual({ p_prefs: { alertas_novedades: true, perfil_publico: false } });
  });

  test('sin la casilla alertas_novedades no se crea ninguna alerta', async ({ page }) => {
    const pending = [
      {
        documento_id: DOC_CANDIDATO, tipo: 'terminos_candidato', version: '1.0', idioma: 'es',
        titulo: 'Condiciones de registro y uso – Candidatos', texto: '1. Titular.',
        audiencia: 'candidato', casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'],
        borrador: false, vigente_desde: '2026-10-29T00:00:00+00:00',
      },
    ];
    const calls = await isolate(page, { session: true, pendingDocs: pending });
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('yourcvpassport-auth');
        if (!raw) return;
        const s = JSON.parse(raw);
        s.user.app_metadata = {
          ...(s.user.app_metadata || {}),
          registro_aceptacion: {
            tipo: 'candidato',
            casillas: { acepto_condiciones_privacidad: true, datos_verdaderos: true, alertas_novedades: false },
            versiones: { terminos_candidato: '1.0' },
          },
        };
        localStorage.setItem('yourcvpassport-auth', JSON.stringify(s));
      } catch { /* sin storage */ }
    });
    const alertRequests: string[] = [];
    const prefsCalls: any[] = [];
    page.on('request', (r) => {
      if (r.url().includes('job_alert_subscriptions')) alertRequests.push(r.method());
      if (r.url().includes('/rpc/save_consent_prefs') && r.method() === 'POST') prefsCalls.push(r.postDataJSON());
    });
    await page.goto('/dashboard');
    await expect.poll(() => calls.acceptance.length).toBe(1);
    await page.waitForTimeout(1500);
    expect(alertRequests.filter((m) => m !== 'OPTIONS' && m !== 'GET')).toHaveLength(0);
    // lo que dijo «no» tambien queda registrado en consent_prefs (solo las claves opcionales)
    expect(prefsCalls).toEqual([{ p_prefs: { alertas_novedades: false } }]);
  });
});

test.describe('textos legales', () => {
  test('/terms lee documentos_legales y marca el borrador', async ({ page }) => {
    await isolate(page);
    await page.route('**/rest/v1/documentos_legales*', (route) =>
      reply(route, 200, [{ ...LEGAL_DOCS[0], tipo: 'terminos_candidato', titulo: 'Condiciones de registro y uso – Candidatos' }]),
    );
    await page.goto('/terminos'); // la ruta fija el idioma: /terminos = español
    await expect(page.getByRole('heading', { name: 'Condiciones de registro y uso – Candidatos' })).toBeVisible();
    await expect(page.getByText(/Borrador v1.0: texto provisional/)).toBeVisible();
  });
});
