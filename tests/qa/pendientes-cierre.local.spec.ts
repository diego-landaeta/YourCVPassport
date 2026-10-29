/**
 * Cierre de pendientes de la bolsa de empleo (frontend), con Supabase MOCKEADO:
 *
 *  1. Aviso de nueva version de las condiciones (RPC `legal_aviso_proximo`): banner descartable por
 *     sesion en el panel, aviso en la puerta de aceptacion y en la pagina legal; si la RPC no existe
 *     (migracion sin aplicar) falla en silencio.
 *  2. Admin: seccion «Paises» (listar, activar/desactivar, anadir) y «Condiciones legales» (estados
 *     vigente/proxima/anterior, vista previa y publicacion con `legal_publicar_version`, >= 15 dias).
 *  4. LegalGate guarda las casillas opcionales con `save_consent_prefs` (solo las 4 claves).
 *
 *   QA_PORT=5442 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/pendientes-cierre.local.spec.ts --project=chromium
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { ADMIN_ID, installInitState, makeProfiles, mockSupabase, SAFE_CONTEXT_OPTIONS, type Row, type SupabaseMock } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 120_000 });

const DAY = 86_400_000;
const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString();

const DOC_ID = '44444444-4444-4444-8444-444444444444';
const NOTICE_CANDIDATO = { tipo: 'terminos_candidato', version: '2.0', idioma: 'es', titulo: 'Condiciones de registro y uso – Candidatos', vigente_desde: inDays(12), dias_restantes: 12 };
const NOTICE_EMPLEADOR = { tipo: 'terminos_empleador', version: '2.0', idioma: 'es', titulo: 'Condiciones de registro y uso – Empleadores', vigente_desde: inDays(12), dias_restantes: 12 };
const NOTICE_PRIVACIDAD = { tipo: 'privacidad', version: '2.0', idioma: 'es', titulo: 'Política de privacidad', vigente_desde: inDays(1), dias_restantes: 1 };

const PENDING = [{
  documento_id: DOC_ID, tipo: 'terminos_candidato', version: '1.1', idioma: 'es',
  titulo: 'Condiciones de registro y uso – Candidatos', texto: '1. Titular. Nueva versión.',
  audiencia: 'candidato', casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'],
  borrador: false, vigente_desde: '2026-10-29T00:00:00+00:00',
}];

interface Boot {
  session?: 'candidate' | 'admin' | null;
  rpc?: Record<string, unknown>;
  db?: Record<string, Row[]>;
}

/** Sesion + mocks. Registra los cuerpos de las RPC en `rpcCalls`. */
async function boot(context: BrowserContext, page: Page, o: Boot = {}) {
  const profiles = makeProfiles(6);
  const admin = profiles.find((p) => p.id === ADMIN_ID)!;
  const candidate = { ...profiles[2], role: 'professional', country_code: 'ES' };
  const sessionProfile = o.session === 'admin' ? admin : o.session === 'candidate' ? candidate : null;
  await installInitState(context, { sessionProfile, language: 'es', theme: 'light' });
  const mock = await mockSupabase(context, { profiles: o.session === 'admin' ? profiles : [candidate, ...profiles], ...(o.db || {}) }, { rpc: o.rpc || {} });
  const rpcCalls: Array<{ fn: string; body: any }> = [];
  page.on('request', (req) => {
    const m = new URL(req.url()).pathname.match(/\/rest\/v1\/rpc\/(.+)$/);
    if (m && req.method() === 'POST') {
      let body: any = null;
      try { body = req.postDataJSON(); } catch { /* sin cuerpo */ }
      rpcCalls.push({ fn: m[1], body });
    }
  });
  return { mock, rpcCalls, candidate };
}

// ---------------------------------------------------------------------------
// 1. Aviso de nueva version
// ---------------------------------------------------------------------------

test.describe('aviso de nueva version de las condiciones', () => {
  test('el panel de candidato muestra el aviso (solo el de su ambito), con fecha, dias y enlace; se descarta por sesion', async ({ context, page }) => {
    await boot(context, page, { session: 'candidate', rpc: { legal_aviso_proximo: [NOTICE_CANDIDATO, NOTICE_EMPLEADOR] } });
    await page.goto('/dashboard');
    const banner = page.getByTestId('legal-notice-banner');
    await expect(banner).toBeVisible({ timeout: 60_000 });
    await expect(banner.getByText('Habrá una nueva versión de nuestras condiciones')).toBeVisible();
    await expect(banner.getByText(/versión 2\.0, entra en vigor el/)).toBeVisible();
    await expect(banner.getByText('Quedan 12 días.')).toBeVisible();
    // solo el del candidato: el de empleador no aplica a su ambito
    await expect(banner.locator('li')).toHaveCount(1);
    await expect(banner.getByRole('link', { name: 'Leer la nueva versión' })).toHaveAttribute('href', '/terminos');

    await banner.getByRole('button', { name: /Descartar el aviso de/ }).click();
    await expect(banner).toHaveCount(0);
    // sigue descartado al recargar (misma sesion del navegador)...
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(800);
    await expect(page.getByTestId('legal-notice-banner')).toHaveCount(0);
    // ...y vuelve en una sesion nueva
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.getByTestId('legal-notice-banner')).toBeVisible({ timeout: 60_000 });
  });

  test('si la RPC no existe todavia falla en silencio: sin aviso y sin errores de pagina', async ({ context, page }) => {
    await boot(context, page, { session: 'candidate' });
    await page.route('**/rest/v1/rpc/legal_aviso_proximo', (route) => route.fulfill({
      status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.legal_aviso_proximo' }),
    }));
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(800);
    await expect(page.getByTestId('legal-notice-banner')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('sin sesion no se consulta la RPC ni se pinta nada', async ({ context, page }) => {
    const { rpcCalls } = await boot(context, page, { session: null, rpc: { legal_aviso_proximo: [NOTICE_CANDIDATO] } });
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    expect(rpcCalls.filter((c) => c.fn === 'legal_aviso_proximo')).toHaveLength(0);
    await expect(page.getByTestId('legal-notice-banner')).toHaveCount(0);
  });

  test('la puerta de aceptacion avisa de la proxima version con su fecha', async ({ context, page }) => {
    await boot(context, page, { session: 'candidate', rpc: { documentos_pendientes: PENDING, legal_aviso_proximo: [NOTICE_PRIVACIDAD], registrar_aceptacion: ['x'] } });
    await page.goto('/dashboard');
    const dialog = page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' });
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    const note = dialog.getByTestId('legal-gate-upcoming');
    await expect(note).toBeVisible();
    await expect(note).toContainText('Próxima versión');
    await expect(note).toContainText('la versión 2.0 de «Política de privacidad»');
  });

  test('la pagina de privacidad avisa de la proxima version y deja leerla', async ({ context, page }) => {
    await boot(context, page, {
      session: 'candidate',
      rpc: { legal_aviso_proximo: [NOTICE_PRIVACIDAD] },
      db: {
        documentos_legales: [
          { id: 'd1', tipo: 'privacidad', version: '1.0', idioma: 'es', titulo: 'Política de privacidad', texto: '1. Responsable. Texto vigente de privacidad.', audiencia: 'todos', casillas_obligatorias: [], borrador: false, vigente_desde: '2026-10-01T00:00:00Z' },
          { id: 'd2', tipo: 'privacidad', version: '2.0', idioma: 'es', titulo: 'Política de privacidad', texto: '1. Responsable. Texto NUEVO de privacidad.', audiencia: 'todos', casillas_obligatorias: [], borrador: false, vigente_desde: inDays(1) },
        ],
      },
    });
    await page.goto('/privacidad');
    const note = page.getByTestId('legal-doc-upcoming');
    await expect(note).toBeVisible({ timeout: 60_000 });
    await expect(note).toContainText('La versión 2.0 de este documento entra en vigor el');
    await expect(page.getByText('Texto vigente de privacidad.')).toBeVisible();

    await note.getByRole('button', { name: 'Ver la próxima versión' }).click();
    await expect(page.getByTestId('legal-doc-next')).toContainText('Texto NUEVO de privacidad.');
    await expect(page.getByText('Texto vigente de privacidad.')).toHaveCount(0);
    await note.getByRole('button', { name: 'Volver al texto vigente' }).click();
    await expect(page.getByText('Texto vigente de privacidad.')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Casillas opcionales -> save_consent_prefs
// ---------------------------------------------------------------------------

test.describe('LegalGate guarda las casillas opcionales con save_consent_prefs', () => {
  test('las marcadas en la puerta se guardan DESPUES de la aceptacion y solo con las claves tocadas', async ({ context, page }) => {
    const { rpcCalls } = await boot(context, page, {
      session: 'candidate',
      rpc: { documentos_pendientes: PENDING, registrar_aceptacion: ['00000000-0000-4000-8000-0000000000e1'], save_consent_prefs: { ok: true } },
    });
    await page.goto('/dashboard');
    const dialog = page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' });
    await expect(dialog).toBeVisible({ timeout: 60_000 });

    // Las opcionales estan plegadas: no cambian el orden de las casillas obligatorias
    await expect(dialog.getByRole('checkbox')).toHaveCount(2);
    await dialog.getByRole('checkbox').nth(0).check();
    await dialog.getByRole('checkbox').nth(1).check();
    await dialog.locator('summary').click();
    await expect(dialog.getByRole('checkbox')).toHaveCount(6);
    await dialog.locator('#gate-opt-perfil_publico').check();
    await dialog.locator('#gate-opt-alertas_novedades').check();
    await dialog.locator('#gate-opt-alertas_novedades').uncheck();

    await dialog.getByRole('button', { name: 'Aceptar y continuar' }).click();
    await expect(dialog).toHaveCount(0);

    await expect.poll(() => rpcCalls.some((c) => c.fn === 'save_consent_prefs')).toBe(true);
    const order = rpcCalls.map((c) => c.fn).filter((f) => f === 'registrar_aceptacion' || f === 'save_consent_prefs');
    expect(order).toEqual(['registrar_aceptacion', 'save_consent_prefs']);
    const prefs = rpcCalls.find((c) => c.fn === 'save_consent_prefs')!.body;
    // solo las claves tocadas y de las 4 permitidas; nada de casillas obligatorias ni de visibilidad del perfil
    expect(prefs).toEqual({ p_prefs: { perfil_publico: true, alertas_novedades: false } });
  });

  test('sin tocar ninguna opcional NO se llama a save_consent_prefs', async ({ context, page }) => {
    const { rpcCalls } = await boot(context, page, { session: 'candidate', rpc: { documentos_pendientes: PENDING, registrar_aceptacion: ['x'] } });
    await page.goto('/dashboard');
    const dialog = page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' });
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await dialog.getByRole('checkbox').nth(0).check();
    await dialog.getByRole('checkbox').nth(1).check();
    await dialog.getByRole('button', { name: 'Aceptar y continuar' }).click();
    await expect(dialog).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(rpcCalls.filter((c) => c.fn === 'save_consent_prefs')).toHaveLength(0);
  });

  test('un fallo de save_consent_prefs (RPC aun sin aplicar) no bloquea la entrada', async ({ context, page }) => {
    await boot(context, page, { session: 'candidate', rpc: { documentos_pendientes: PENDING, registrar_aceptacion: ['x'] } });
    await page.route('**/rest/v1/rpc/save_consent_prefs', (route) => route.fulfill({
      status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.save_consent_prefs' }),
    }));
    await page.goto('/dashboard');
    const dialog = page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' });
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await dialog.getByRole('checkbox').nth(0).check();
    await dialog.getByRole('checkbox').nth(1).check();
    await dialog.locator('summary').click();
    await dialog.locator('#gate-opt-aparecer_google').check();
    await dialog.getByRole('button', { name: 'Aceptar y continuar' }).click();
    await expect(dialog).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Admin: paises y condiciones
// ---------------------------------------------------------------------------

const COUNTRIES: Row[] = [
  { code: 'ES', name_es: 'España', name_en: 'Spain', currency: 'EUR', active: true },
  { code: 'MX', name_es: 'México', name_en: 'Mexico', currency: 'MXN', active: true },
  { code: 'PT', name_es: 'Portugal', name_en: 'Portugal', currency: 'EUR', active: false },
];

const writesTo = (mock: SupabaseMock, method: string, needle: string) => mock.writes.filter((w) => w.method === method && w.url.includes(needle));

async function openAdminSection(page: Page, card: string, heading: string) {
  await page.goto('/admin');
  await page.getByRole('button', { name: new RegExp(card) }).first().click();
  await expect(page.getByRole('heading', { name: heading, level: 2 })).toBeVisible({ timeout: 60_000 });
}

test.describe('admin: paises', () => {
  test('lista, activa y desactiva con el teclado y anade un pais con validacion', async ({ context, page }) => {
    const { mock } = await boot(context, page, { session: 'admin', db: { countries: COUNTRIES } });
    await openAdminSection(page, 'Países', 'Países');

    await expect(page.getByTestId('countries-count')).toHaveText('2 activos de 3');
    const rows = page.getByTestId('countries-list').locator('li');
    await expect(rows).toHaveCount(3);

    // Desactivar España: PATCH con active=false sobre su codigo
    const sw = page.getByRole('switch', { name: 'Desactivar España' });
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('switch', { name: 'Activar España' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('countries-count')).toHaveText('1 activos de 3');
    const patch = writesTo(mock, 'PATCH', '/rest/v1/countries');
    expect(patch).toHaveLength(1);
    expect(patch[0].url).toContain('code=eq.ES');
    expect(JSON.parse(patch[0].body || '{}')).toEqual({ active: false });

    // Buscar
    await page.getByLabel('Buscar país').fill('mex');
    await expect(rows).toHaveCount(1);
    await page.getByLabel('Buscar país').fill('');

    // Anadir: validacion en cliente
    await page.getByRole('button', { name: 'Añadir país' }).click();
    await expect(page.getByText('Este campo es obligatorio.').first()).toBeVisible();
    await page.fill('#country-code', 'PT');
    await page.fill('#country-name-es', 'Portugal');
    await page.fill('#country-name-en', 'Portugal');
    await page.fill('#country-currency', 'EU');
    await page.getByRole('button', { name: 'Añadir país' }).click();
    await expect(page.getByText('Ese código ya existe.')).toBeVisible();
    await expect(page.getByText('Usa 3 letras (código ISO 4217, p. ej. EUR).')).toBeVisible();
    expect(writesTo(mock, 'POST', '/rest/v1/countries')).toHaveLength(0);

    await page.fill('#country-code', 'fr');
    await page.fill('#country-name-es', 'Francia');
    await page.fill('#country-name-en', 'France');
    await page.fill('#country-currency', 'eur');
    await page.getByRole('button', { name: 'Añadir país' }).click();
    await expect.poll(() => writesTo(mock, 'POST', '/rest/v1/countries').length).toBe(1);
    expect(JSON.parse(writesTo(mock, 'POST', '/rest/v1/countries')[0].body || '{}')).toEqual({ code: 'FR', name_es: 'Francia', name_en: 'France', currency: 'EUR', active: true });
    await expect(page.getByTestId('countries-list').locator('li[data-code="FR"]')).toBeVisible();
  });
});

const LEGAL_ROWS = (): Row[] => [
  { id: 'v1', tipo: 'terminos_candidato', version: '1.0', idioma: 'es', titulo: 'Condiciones candidatos', texto: '1. Titular. Texto de la 1.0.', audiencia: 'candidato', requiere_aceptacion: true, casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'], borrador: true, vigente_desde: '2026-09-01T00:00:00Z', created_at: '2026-09-01T00:00:00Z' },
  { id: 'v2', tipo: 'terminos_candidato', version: '1.1', idioma: 'es', titulo: 'Condiciones candidatos', texto: '1. Titular. Texto de la 1.1.', audiencia: 'candidato', requiere_aceptacion: true, casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'], borrador: false, vigente_desde: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z' },
  { id: 'v3', tipo: 'terminos_candidato', version: '2.0', idioma: 'es', titulo: 'Condiciones candidatos', texto: '1. Titular. Texto de la 2.0.', audiencia: 'candidato', requiere_aceptacion: true, casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'], borrador: false, vigente_desde: inDays(20), created_at: '2026-10-20T00:00:00Z' },
  { id: 'v4', tipo: 'privacidad', version: '1.0', idioma: 'en', titulo: 'Privacy policy', texto: '1. Controller. Privacy text.', audiencia: 'todos', requiere_aceptacion: true, casillas_obligatorias: [], borrador: true, vigente_desde: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z' },
];

test.describe('admin: condiciones legales', () => {
  test('lista por tipo e idioma con estado vigente / proxima / anterior y borrador; muestra el texto', async ({ context, page }) => {
    await boot(context, page, { session: 'admin', db: { documentos_legales: LEGAL_ROWS() } });
    await openAdminSection(page, 'Condiciones legales', 'Condiciones legales');

    const list = page.getByTestId('legal-versions');
    await expect(list.locator('li[data-version="1.0"][data-status="anterior"]')).toHaveCount(1);
    await expect(list.locator('li[data-version="1.1"][data-status="vigente"]')).toHaveCount(1);
    await expect(list.locator('li[data-version="2.0"][data-status="proxima"]')).toHaveCount(1);
    await expect(list.locator('li[data-status="vigente"]')).toHaveCount(2); // 1.1 candidatos ES y la privacidad EN
    await expect(list.getByText('Borrador legal')).toHaveCount(2);
    await expect(list.getByText('Términos para candidatos').first()).toBeVisible();

    // Filtro por idioma
    await page.getByLabel('Idioma').selectOption('en');
    await expect(list.locator('li')).toHaveCount(1);
    await page.getByLabel('Idioma').selectOption('');

    await list.locator('li[data-version="2.0"]').getByRole('button', { name: 'Ver texto' }).click();
    await expect(list.getByText('Texto de la 2.0.')).toBeVisible();
  });

  test('nueva version: vista previa, antelacion minima de 15 dias, confirmacion y llamada a legal_publicar_version', async ({ context, page }) => {
    const { rpcCalls } = await boot(context, page, {
      session: 'admin',
      db: { documentos_legales: LEGAL_ROWS() },
      rpc: { legal_publicar_version: { id: 'nuevo', avisos: 37 } },
    });
    await openAdminSection(page, 'Condiciones legales', 'Condiciones legales');
    await page.getByRole('button', { name: 'Nueva versión' }).click();

    // Valida lo evidente en cliente
    await page.getByRole('button', { name: 'Revisar y publicar' }).click();
    await expect(page.getByText('Indica la versión.')).toBeVisible();
    await expect(page.getByText('Indica el título.')).toBeVisible();
    await expect(page.getByText('Escribe el texto de la versión.')).toBeVisible();

    // Version repetida
    await page.fill('#legal-version', '1.1');
    await expect(page.getByText('Esa versión ya existe para este documento e idioma.')).toBeVisible();
    await page.fill('#legal-version', '3.0');
    await page.fill('#legal-titulo', 'Condiciones de registro y uso – Candidatos');
    await page.fill('#legal-texto', '1. Titular. Texto de la 3.0.\nSegundo parrafo.');

    // Vista previa con el titulo en negrita
    await page.getByRole('button', { name: 'Vista previa' }).click();
    const preview = page.getByTestId('legal-preview');
    await expect(preview).toContainText('Texto de la 3.0.');
    await expect(preview.locator('strong')).toHaveText('1. Titular.');
    await page.getByRole('button', { name: 'Escribir' }).click();

    // Fecha demasiado pronta: rechazada en cliente y sin llamar a la RPC
    const soon = new Date(Date.now() + 2 * DAY);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    await page.fill('#legal-fecha', local(soon));
    await page.getByRole('button', { name: 'Revisar y publicar' }).click();
    await expect(page.getByText('La fecha de entrada en vigor debe ser al menos 15 días posterior a hoy.')).toBeVisible();
    expect(rpcCalls.filter((c) => c.fn === 'legal_publicar_version')).toHaveLength(0);

    // Fecha valida (>= 15 dias): pide confirmacion y publica
    const when = new Date(Date.now() + 20 * DAY);
    await page.fill('#legal-fecha', local(when));
    await page.getByRole('button', { name: 'Revisar y publicar' }).click();
    const confirm = page.getByTestId('legal-confirm');
    await expect(confirm).toContainText('versión 3.0');
    expect(rpcCalls.filter((c) => c.fn === 'legal_publicar_version')).toHaveLength(0);
    await confirm.getByRole('button', { name: 'Publicar versión' }).click();

    await expect.poll(() => rpcCalls.filter((c) => c.fn === 'legal_publicar_version').length).toBe(1);
    const body = rpcCalls.find((c) => c.fn === 'legal_publicar_version')!.body;
    expect(body).toMatchObject({
      p_tipo: 'terminos_candidato',
      p_version: '3.0',
      p_idioma: 'es',
      p_titulo: 'Condiciones de registro y uso – Candidatos',
      p_casillas: ['acepto_condiciones_privacidad', 'datos_verdaderos'],
    });
    expect(body.p_texto).toContain('Texto de la 3.0.');
    expect(new Date(body.p_vigente_desde).getTime()).toBeGreaterThanOrEqual(Date.now() + 15 * DAY);
    // se cierra el formulario y se confirma con el numero de avisos que devuelve la RPC
    await expect(page.getByRole('heading', { name: 'Publicar una nueva versión' })).toHaveCount(0);
    await expect(page.getByText(/Aviso encolado para 37 usuarios/)).toBeVisible();
  });

  test('la primera version de un tipo/idioma puede entrar en vigor desde ahora', async ({ context, page }) => {
    await boot(context, page, { session: 'admin', db: { documentos_legales: LEGAL_ROWS() } });
    await openAdminSection(page, 'Condiciones legales', 'Condiciones legales');
    await page.getByRole('button', { name: 'Nueva versión' }).click();
    await page.locator('#legal-idioma').selectOption('en');
    await page.locator('#legal-tipo').selectOption('terminos_empleador');
    await expect(page.getByText('Es la primera versión de este documento en este idioma: puede entrar en vigor desde ahora.')).toBeVisible();
  });

  test('un rechazo del servidor (sin permiso) se explica y no cierra el formulario', async ({ context, page }) => {
    await boot(context, page, { session: 'admin', db: { documentos_legales: LEGAL_ROWS() } });
    await page.route('**/rest/v1/rpc/legal_publicar_version', (route) => route.fulfill({
      status: 403, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: '42501', message: 'FORBIDDEN: solo admin' }),
    }));
    await openAdminSection(page, 'Condiciones legales', 'Condiciones legales');
    await page.getByRole('button', { name: 'Nueva versión' }).click();
    await page.fill('#legal-version', '3.0');
    await page.fill('#legal-titulo', 'Titulo');
    await page.fill('#legal-texto', '1. Titular. Texto.');
    await page.getByRole('button', { name: 'Revisar y publicar' }).click();
    await page.getByTestId('legal-confirm').getByRole('button', { name: 'Publicar versión' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'No tienes permiso para publicar versiones.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Publicar una nueva versión' })).toBeVisible();
  });
});
