import { test, expect, type Page, type Request, type Route } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

/**
 * IA del editor de perfil servida por la Edge Function `ai-cv-assistant`.
 *
 * App local (Vite) con sesion y Supabase MOCKEADOS: no hay login real y ninguna
 * peticion sale a produccion. Comprueba que:
 *  - cada funcion de IA llama a /functions/v1/ai-cv-assistant con una tarea de la
 *    lista blanca (sin prompt libre ni modelo) y con el JWT de la sesion;
 *  - el resultado se muestra en la interfaz;
 *  - los errores de la funcion se muestran al usuario;
 *  - NINGUNA peticion sale a generativelanguage.googleapis.com.
 *
 * Funciones cubiertas:
 *  - generate_summary   -> Identidad, boton flotante "Mejorar con IA"
 *  - optimize_headline  -> Identidad, tras elegir un resumen
 *  - suggest_skills     -> Habilidades, boton flotante "Mejorar con IA"
 *  - optimize_experience / optimize_education -> lib/ai.ts (AITextOptimizer no esta
 *    montado hoy en ninguna pantalla; se invoca el modulo real desde la pagina)
 */

const USER_ID = '00000000-0000-4000-8000-0000000000a1';
const FN_PATH = '/functions/v1/ai-cv-assistant';
const ALLOWED_TASKS = ['optimize_experience', 'optimize_education', 'generate_summary', 'optimize_headline', 'suggest_skills'];

function b64url(o: unknown) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}
const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
const fakeJwt = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: USER_ID, role: 'authenticated', exp, aud: 'authenticated', email: 'qa-ia@example.test' })}.firma-falsa`;
const user = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'qa-ia@example.test',
  app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Laura QA' }, created_at: '2026-01-01T00:00:00Z',
};
const session = { access_token: fakeJwt, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'refresh-falso', user };

const profile = {
  id: USER_ID, full_name: 'Laura QA', email: 'qa-ia@example.test', role: 'professional', plan: 'pro',
  is_active: true, slug: 'laura-qa', headline: 'desarollador full stack con esperiencia', summary: '',
  location: 'Madrid, España', country_code: 'ES', template: 'classic', wizard_completed: false,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};
const experiences = [
  { id: 'e1', profile_id: USER_ID, position: 'Desarrollador Frontend', company_name: 'ACME', description: 'Desarrollo de interfaces con React', start_date: '2022-01-01', end_date: null, is_current: true },
  { id: 'e2', profile_id: USER_ID, position: 'Programador Junior', company_name: 'Initech', description: 'Mantenimiento de APIs', start_date: '2019-01-01', end_date: '2021-12-01', is_current: false },
];
const education = [
  { id: 'd1', profile_id: USER_ID, degree: 'Grado en Informática', institution_name: 'UPM', field_of_study: 'Ingeniería', description: 'Proyecto final sobre accesibilidad', start_date: '2015-09-01', end_date: '2019-06-01' },
];
const skills = [
  { id: 's1', profile_id: USER_ID, name: 'React', level: 'ADVANCED', percentage: 80, created_at: '2026-01-01T00:00:00Z' },
  { id: 's2', profile_id: USER_ID, name: 'TypeScript', level: 'ADVANCED', percentage: 75, created_at: '2026-01-01T00:00:00Z' },
];

// Respuestas realistas de la funcion (texto crudo del modelo; el cliente lo parsea).
const AI_TEXT: Record<string, string> = {
  generate_summary:
    'Desarrolladora frontend con experiencia en React y TypeScript, centrada en interfaces accesibles.\n---\nIngeniera de software orientada a producto, con experiencia en React y APIs.\n---\nProfesional del desarrollo web que combina React, TypeScript y buenas prácticas.',
  optimize_headline:
    'Full Stack Developer | React, Node.js & APIs\n---\nIngeniera Full Stack | Frontend & Backend\n---\nDesarrolladora Full Stack | TypeScript y Cloud',
  suggest_skills: 'Kubernetes, Accesibilidad web, Testing con Playwright, Comunicación, Liderazgo técnico',
  optimize_experience:
    'DESCRIPCIÓN:\n* **Desarrollé** interfaces con React para 50.000 usuarios\n* Mejoré el rendimiento un 30%\n\nLOGROS:\n* Reduje el tiempo de carga un 40%\n* Lideré la migración a TypeScript\n* Implanté tests end-to-end',
  optimize_education: 'Grado en Informática con proyecto final sobre accesibilidad web, calificado con matrícula de honor.',
};

type FnCall = { task: string; input: Record<string, unknown>; body: Record<string, unknown>; auth: string | undefined };
type FnMode = { status: number; body?: Record<string, unknown> } | null;

interface Ctx {
  fnCalls: FnCall[];
  googleRequests: string[];
  // Respuestas de Supabase que NO salieron del mock (habrian llegado a la red real).
  unmockedSupabase: string[];
  fnErrorByTask: Record<string, FnMode>;
}

async function setup(page: Page): Promise<Ctx> {
  const ctx: Ctx = { fnCalls: [], googleRequests: [], unmockedSupabase: [], fnErrorByTask: {} };

  // Red de seguridad: cualquier peticion (incluida la de un worker) hacia Google AI queda registrada.
  page.on('request', (r: Request) => {
    if (r.url().includes('generativelanguage.googleapis.com')) ctx.googleRequests.push(r.url());
  });
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.hostname.endsWith('supabase.co') && r.headers()['x-qa-mock'] !== '1') {
      ctx.unmockedSupabase.push(`${r.request().method()} ${u.pathname}`);
    }
  });

  await page.addInitScript((s) => {
    localStorage.setItem('yourcvpassport-auth', JSON.stringify(s));
    localStorage.setItem('language', 'es');
    localStorage.setItem('theme', 'light');
  }, session);

  await page.routeWebSocket(/.*/, (ws) => ws.close());

  await page.route('**/*', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    if (url.hostname.includes('generativelanguage.googleapis.com')) {
      ctx.googleRequests.push(req.url());
      return route.abort();
    }
    if (!url.hostname.endsWith('supabase.co')) return route.abort();

    const origin = req.headers()['origin'] || '*';
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': req.headers()['access-control-request-headers'] || 'authorization, x-client-info, apikey, content-type, range, prefer, accept-profile, content-profile',
      'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, HEAD, OPTIONS',
      'access-control-expose-headers': 'content-range',
      'x-qa-mock': '1',
    };
    const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
      route.fulfill({ status, contentType: 'application/json', headers: { ...cors, ...headers }, body: body === undefined ? '' : JSON.stringify(body) });

    const method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });

    if (url.pathname === FN_PATH) {
      const body = (req.postDataJSON() || {}) as Record<string, unknown>;
      const task = String(body.task);
      ctx.fnCalls.push({ task, input: (body.input || {}) as Record<string, unknown>, body, auth: req.headers()['authorization'] });
      const err = ctx.fnErrorByTask[task];
      if (err) return json(err.status, err.body ?? { success: false, code: 'ai_provider_error', error: 'AI provider error' });
      // Pequena espera para que el estado de carga sea observable.
      await new Promise((r) => setTimeout(r, 300));
      return json(200, { success: true, text: AI_TEXT[task] ?? '', model: 'gemini-2.5-flash' });
    }
    if (url.pathname.startsWith('/functions/v1/')) return json(200, {});
    if (url.pathname.startsWith('/auth/v1/user')) return json(200, user);
    if (url.pathname.startsWith('/auth/v1/')) return json(200, {});
    if (url.pathname === '/rest/v1/rpc/check_feature_limit') return json(200, { allowed: true, plan: 'pro', remaining: 'unlimited' });
    if (url.pathname.startsWith('/rest/v1/rpc/')) return json(200, null);
    if (!url.pathname.startsWith('/rest/v1/')) return json(404, {});
    // Escrituras: se aceptan sin persistir.
    if (method !== 'GET' && method !== 'HEAD') return json(201, []);

    const table = url.pathname.replace('/rest/v1/', '');
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const rowsFor: Record<string, unknown[]> = {
      profiles: [profile],
      // AuthContext lee el perfil propio (con columnas privadas) de la vista profiles_full
      profiles_full: [profile],
      experiences,
      education,
      skills,
    };
    const rows = rowsFor[table] ?? [];
    if (method === 'HEAD') return json(200, undefined, { 'content-range': `*/${rows.length}` });
    if (wantsObject) return rows.length ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: 'no rows' });
    return json(200, rows, { 'content-range': rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0' });
  });

  return ctx;
}

function expectWhitelistedCall(call: FnCall) {
  expect(ALLOWED_TASKS).toContain(call.task);
  expect(call.auth).toBe(`Bearer ${fakeJwt}`);
  // El cliente ya no puede mandar prompt libre, modelo, endpoint ni identidad.
  expect(Object.keys(call.body).sort()).toEqual(['input', 'task']);
}

async function openIdentityStep(page: Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTitle('Mejorar con IA')).toBeVisible({ timeout: 100_000 });
}

test.describe('IA via Edge Function ai-cv-assistant', () => {
  // La app registra un Service Worker (index.tsx). En WebKit las peticiones que pasan
  // por el SW no las ve page.route y saldrian a produccion: se bloquea el SW.
  test.use(SAFE_CONTEXT_OPTIONS);
  // El primer render del dashboard en Vite dev es lento (sobre todo en WebKit/Firefox).
  test.describe.configure({ timeout: 150_000 });

  test('resumen y headline: llaman a la funcion, muestran variantes y aplican la elegida', async ({ page }) => {
    const ctx = await setup(page);
    await openIdentityStep(page);

    await page.getByTitle('Mejorar con IA').click();
    // Estado de carga visible mientras responde la funcion.
    await expect(page.getByText('Cargando las opciones...')).toBeVisible();

    const firstSummary = AI_TEXT.generate_summary.split('---')[0].trim();
    await expect(page.getByText(firstSummary)).toBeVisible();
    const summaryCall = ctx.fnCalls.find((c) => c.task === 'generate_summary')!;
    expect(summaryCall).toBeTruthy();
    expectWhitelistedCall(summaryCall);
    expect(summaryCall.input).toMatchObject({ tone: 'formal', variantsCount: 3 });
    expect(summaryCall.input.experiences).toEqual(expect.arrayContaining(['Desarrollador Frontend en ACME']));
    expect(summaryCall.input.skills).toEqual(['React', 'TypeScript']);

    // Elegir la primera variante dispara la optimizacion del headline.
    await page.getByRole('button', { name: 'Seleccionar' }).first().click();
    await expect(page.getByText('Headline Optimizado')).toBeVisible();
    await expect(page.getByText('Full Stack Developer | React, Node.js & APIs')).toBeVisible();
    const headlineCall = ctx.fnCalls.find((c) => c.task === 'optimize_headline')!;
    expectWhitelistedCall(headlineCall);
    expect(headlineCall.input).toEqual({ headline: profile.headline });

    await page.getByRole('button', { name: 'Seleccionar' }).first().click();
    await expect(page.getByText('Headline Optimizado')).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('input[name="headline"]')).toHaveValue('Full Stack Developer | React, Node.js & APIs');

    expect(ctx.googleRequests).toEqual([]);
    expect(ctx.unmockedSupabase).toEqual([]);
  });

  test('resumen: un error de la funcion (cuota agotada) se muestra al usuario', async ({ page }) => {
    const ctx = await setup(page);
    ctx.fnErrorByTask.generate_summary = {
      status: 403,
      body: { success: false, code: 'limit_reached', error: 'Monthly limit reached', plan: 'pro', remaining: 0 },
    };
    await openIdentityStep(page);

    await page.getByTitle('Mejorar con IA').click();
    await expect(page.getByText(/Has alcanzado tu límite mensual de solicitudes de IA \(plan pro\)/)).toBeVisible();
    await expect(page.getByText('Cargando las opciones...')).toBeHidden();
    expect(ctx.fnCalls.map((c) => c.task)).toEqual(['generate_summary']);
    expect(ctx.googleRequests).toEqual([]);
    expect(ctx.unmockedSupabase).toEqual([]);
  });

  test('habilidades: sugerencias via funcion y error visible si falla el proveedor', async ({ page }) => {
    const ctx = await setup(page);
    await openIdentityStep(page);

    // En movil la etiqueta del paso esta oculta (hidden sm:block): se pulsa el paso entero.
    await page.locator('div.cursor-pointer', { has: page.getByText('Habilidades', { exact: true }) }).first().click();
    await expect(page.getByText('React', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTitle('Mejorar con IA').click();

    await expect(page.getByText('Kubernetes')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Testing con Playwright')).toBeVisible();
    const skillsCall = ctx.fnCalls.find((c) => c.task === 'suggest_skills')!;
    expectWhitelistedCall(skillsCall);
    expect(skillsCall.input).toEqual({
      experiences: [
        { title: 'Desarrollador Frontend', company: 'ACME', description: 'Desarrollo de interfaces con React' },
        { title: 'Programador Junior', company: 'Initech', description: 'Mantenimiento de APIs' },
      ],
      currentSkills: ['React', 'TypeScript'],
    });

    // Fallo del proveedor -> mensaje de error visible en el panel.
    ctx.fnErrorByTask.suggest_skills = { status: 502, body: { success: false, code: 'ai_provider_error', error: 'AI provider error' } };
    await page.getByRole('button', { name: /Regenerar Sugerencias IA/ }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'El servicio de IA no está disponible en este momento' })).toBeVisible();
    expect(ctx.fnCalls.filter((c) => c.task === 'suggest_skills')).toHaveLength(2);

    expect(ctx.googleRequests).toEqual([]);
    expect(ctx.unmockedSupabase).toEqual([]);
  });

  test('experiencia y educacion (lib/ai): tareas via funcion, parseo y errores', async ({ page }) => {
    const ctx = await setup(page);
    await openIdentityStep(page);

    const results = await page.evaluate(async () => {
      // Modulo real servido por Vite; usa el mismo cliente de Supabase que la app.
      const ai = await import('/lib/ai.ts' as string);
      const expOk = await ai.optimizeExperience('Desarrollador Frontend', 'ACME', 'Desarrollo de interfaces con React', 'qa-user', ['Lancé la web']);
      const eduOk = await ai.optimizeEducation('Grado en Informática', 'UPM', 'Ingeniería', 'Proyecto final', 'qa-user');
      return { expOk, eduOk };
    });

    expect(results.expOk.success).toBe(true);
    expect(results.expOk.data.description).toContain('**Desarrollé** interfaces con React');
    expect(results.expOk.data.achievements).toEqual([
      'Reduje el tiempo de carga un 40%',
      'Lideré la migración a TypeScript',
      'Implanté tests end-to-end',
    ]);
    expect(results.eduOk).toEqual({ success: true, data: AI_TEXT.optimize_education });

    const expCall = ctx.fnCalls.find((c) => c.task === 'optimize_experience')!;
    expectWhitelistedCall(expCall);
    expect(expCall.input).toEqual({
      title: 'Desarrollador Frontend', company: 'ACME', description: 'Desarrollo de interfaces con React', achievements: ['Lancé la web'],
    });
    const eduCall = ctx.fnCalls.find((c) => c.task === 'optimize_education')!;
    expectWhitelistedCall(eduCall);
    expect(eduCall.input).toEqual({ degree: 'Grado en Informática', institution: 'UPM', fieldOfStudy: 'Ingeniería', description: 'Proyecto final' });

    // Errores: plan sin IA y fallo de proveedor llegan como mensaje legible.
    ctx.fnErrorByTask.optimize_experience = { status: 403, body: { success: false, code: 'plan_required', error: 'x', plan: 'free' } };
    ctx.fnErrorByTask.optimize_education = { status: 502 };
    const errors = await page.evaluate(async () => {
      const ai = await import('/lib/ai.ts' as string);
      return {
        exp: await ai.optimizeExperience('a', 'b', 'c', 'qa-user-2'),
        edu: await ai.optimizeEducation('a', 'b', 'c', 'd', 'qa-user-2'),
      };
    });
    expect(errors.exp.success).toBe(false);
    expect(errors.exp.error).toContain('no están disponibles en el plan Free');
    expect(errors.edu.success).toBe(false);
    expect(errors.edu.error).toContain('El servicio de IA no está disponible en este momento');

    expect(ctx.googleRequests).toEqual([]);
    expect(ctx.unmockedSupabase).toEqual([]);
  });
});
