/**
 * U16 — Robustez de datos: lecturas que pueden no devolver fila.
 *
 * Con `.single()` PostgREST responde 406 (PGRST116) cuando no hay fila y la app lo
 * trataba como error. Las lecturas en las que "no hay fila" es lo normal usan ahora
 * `.maybeSingle()` (en GET pide un array y devuelve null sin 406). El mock
 * (helpers/supabaseMock) responde 406 a toda petición `vnd.pgrst.object` sin una
 * única fila, así que aquí se registran las respuestas 406 y se exige 0.
 *
 *   (a) /recursos/blog/<slug-inexistente> → página "no encontrado", sin 406 ni errores de consola
 *   (b) detalle de empleo de un usuario no postulado → botón "Aplicar", sin 406
 *   (c) /cv/:slug sin traducción en caché → sin 406 en profile_translations
 *   (d) comprobación de slug/handle disponible (utils/slugUtils, utils/handleValidation)
 *   (e) búsqueda de talento (hooks/useTalentSearch) sin `is_public` ni columnas privadas
 *
 * Supabase va MOCKEADO: nada sale a producción.
 *
 *   QA_PORT=5416 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u16-robustez.local.spec.ts --output=test-results/u16
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import {
  SAFE_CONTEXT_OPTIONS,
  ADMIN_ID,
  makeProfiles,
  installInitState,
  mockSupabase,
  type Row,
} from './helpers/supabaseMock';
import { PUBLIC_PROFILE_COLUMN_LIST, PRIVATE_PROFILE_COLUMN_LIST } from '../../lib/publicProfileColumns';

test.use(SAFE_CONTEXT_OPTIONS);

const PUBLIC = new Set<string>(PUBLIC_PROFILE_COLUMN_LIST);
const PRIVATE = new Set<string>(PRIVATE_PROFILE_COLUMN_LIST);

/** Registra las respuestas 406 y los errores de consola de la página. */
function watch(page: Page) {
  const responses406: string[] = [];
  const consoleErrors: string[] = [];
  page.on('response', (r) => {
    if (r.status() === 406) responses406.push(decodeURIComponent(r.url()));
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Ruido del entorno de QA, no de la app: el mock cierra el WebSocket de HMR
    // de Vite y aborta los orígenes externos (fuentes, analítica) con ERR_FAILED.
    // Una respuesta 406 daría "the server responded with a status of 406" y sí cuenta.
    if (text.startsWith('[vite]') || /^Failed to load resource: net::ERR_/.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  return { responses406, consoleErrors };
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

// ---------------------------------------------------------------------------
// (a) Blog: slug inexistente
// ---------------------------------------------------------------------------
test.describe('(a) blog: post inexistente', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`muestra "no encontrado" sin 406 ni errores de consola (${lang})`, async ({ page, context }) => {
      test.setTimeout(90_000);
      await installInitState(context, { language: lang, theme: 'light' });
      const mock = await mockSupabase(context, { blog_posts: [] });
      const w = watch(page);

      const base = lang === 'es' ? '/recursos/blog' : '/resources/blog';
      await page.goto(`${base}/este-post-no-existe-u16`, { waitUntil: 'domcontentloaded' });

      const heading = lang === 'es' ? '¡Ups! Página No Encontrada' : 'Oops! Page Not Found';
      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 45_000 });
      // Se queda en la URL pedida (no redirige a /blog, ruta que no existe)
      expect(new URL(page.url()).pathname).toBe(`${base}/este-post-no-existe-u16`);
      await settle(page);

      const reqs = mock.requestsTo('blog_posts').filter((r) => r.params.slug?.[0] === 'eq.este-post-no-existe-u16');
      expect(reqs.length, 'consulta el post por slug').toBeGreaterThan(0);
      // maybeSingle pide un array (sin Accept vnd.pgrst.object)
      for (const r of reqs) expect(r.accept ?? '').not.toContain('vnd.pgrst.object');

      expect(w.responses406, 'respuestas 406').toEqual([]);
      expect(w.consoleErrors, 'errores de consola').toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// (b) Detalle de empleo: usuario que aún no se ha postulado
// ---------------------------------------------------------------------------
test.describe('(b) detalle de empleo', () => {
  test('usuario no postulado: ve "Aplicar" y no hay 406', async ({ page, context }) => {
    test.setTimeout(90_000);
    const profiles = makeProfiles(5);
    const admin = profiles.find((p) => p.id === ADMIN_ID)!;
    await installInitState(context, { sessionProfile: admin, language: 'es', theme: 'light' });
    const job: Row = {
      id: '00000000-0000-4000-8000-0000000j0b01',
      slug: 'data-engineer-u16',
      title: 'Data Engineer U16',
      description: 'Construir pipelines de datos.',
      requirements: null,
      responsibilities: null,
      benefits: null,
      location_city: 'Madrid',
      location_country: 'ES',
      is_remote: true,
      employment_type: 'FULL_TIME',
      experience_level: 'MID',
      salary_min: null,
      salary_max: null,
      salary_currency: 'EUR',
      salary_period: null,
      show_salary: false,
      required_skills: [],
      preferred_skills: [],
      application_deadline: null,
      application_url: null,
      application_instructions: null,
      published_at: '2026-09-01T00:00:00Z',
      company_name: 'ACME U16',
      company_logo_url: null,
      company_website: null,
      company_description: null,
    };
    const mock = await mockSupabase(
      context,
      { profiles, job_applications: [], job_posting_questions: [], company_users: [] },
      { rpc: { get_job_posting_detail: [job] } },
    );
    const w = watch(page);

    await page.goto('/empleos/data-engineer-u16', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Data Engineer U16').first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole('button', { name: 'Aplicar ahora' })).toBeVisible();
    await expect(page.getByText('Ya aplicaste')).toHaveCount(0);
    await settle(page);

    // Se comprobó la postulación (sin fila) y se leyó el perfil del usuario
    await expect.poll(() => mock.requestsTo('job_applications').length).toBeGreaterThan(0);
    expect(mock.requestsTo('profiles').some((r) => r.params.id?.[0] === `eq.${ADMIN_ID}`)).toBe(true);
    expect(w.responses406, 'respuestas 406').toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// (c) /cv/:slug sin traducción en caché
// ---------------------------------------------------------------------------
const CV_ID = '00000000-0000-4000-8000-0000000c0016';
const cvProfile: Row = {
  id: CV_ID,
  full_name: 'Lucía Robustez',
  headline: 'Ingeniera de datos',
  summary: 'Diez años construyendo plataformas de datos.',
  slug: 'lucia-robustez',
  template: 'classic',
  template_color: null,
  role: 'professional',
  is_active: true,
  profile_hidden: false,
  wizard_completed: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

test.describe('(c) perfil público sin traducción en caché', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`no hay 406 al buscar la traducción (${lang})`, async ({ page, context }) => {
      test.setTimeout(90_000);
      await installInitState(context, { language: lang, theme: 'light' });
      const mock = await mockSupabase(context, {
        profiles: [cvProfile],
        profile_translations: [],
        text_translations: [],
        stamps: [],
        experiences: [],
        education: [],
        skills: [{ id: 'k1', profile_id: CV_ID, name: 'SQL', sort_order: 1 }],
        portfolio_items: [],
        languages: [],
      });
      const w = watch(page);

      await page.goto(`/cv/${cvProfile.slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Lucía Robustez').first()).toBeVisible({ timeout: 45_000 });
      await expect.poll(() => mock.requestsTo('profile_translations').length, { timeout: 20_000 }).toBeGreaterThan(0);
      await settle(page);

      for (const r of mock.requestsTo('profile_translations')) {
        expect(r.accept ?? '').not.toContain('vnd.pgrst.object');
      }
      expect(w.responses406, 'respuestas 406').toEqual([]);
      // Sin logs de depuración de la caché de traducciones
      expect(w.consoleErrors.filter((e) => e.includes('[DatabaseCache]'))).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Utilidades para ejecutar módulos de la app dentro de la página (Vite dev)
// ---------------------------------------------------------------------------
async function openBlankApp(page: Page) {
  // Cualquier ruta sirve: solo hace falta que el servidor de Vite responda.
  await page.goto('/404', { waitUntil: 'domcontentloaded' });
}

async function setupModulesPage(context: BrowserContext, db: Record<string, Row[]>) {
  await installInitState(context, { language: 'es', theme: 'light' });
  return mockSupabase(context, db);
}

// ---------------------------------------------------------------------------
// (d) Disponibilidad de slug / handle
// ---------------------------------------------------------------------------
test.describe('(d) slug disponible', () => {
  test('libre = disponible, ocupado = no disponible, sin 406', async ({ page, context }) => {
    test.setTimeout(90_000);
    const profiles = makeProfiles(6);
    const mock = await setupModulesPage(context, { profiles });
    const w = watch(page);
    await openBlankApp(page);

    const result = await page.evaluate(async () => {
      const slugUtils = await import('/utils/slugUtils.ts' as string);
      const handles = await import('/utils/handleValidation.ts' as string);
      const { supabase } = await import('/supabase/client.ts' as string);
      return {
        free: await slugUtils.checkSlugAvailability('slug-libre-u16'),
        taken: await slugUtils.checkSlugAvailability('perfil-3'),
        ownSlug: await slugUtils.checkSlugAvailability('perfil-3', '00000000-0000-4000-8000-000000000003'),
        handleFree: await handles.checkHandleAvailability('handle-libre-u16', supabase),
        handleTaken: await handles.checkHandleAvailability('perfil-4', supabase),
        handleOwn: await handles.checkHandleAvailability('perfil-4', supabase, '00000000-0000-4000-8000-000000000004'),
      };
    });

    expect(result.free).toBe(true);
    expect(result.taken).toBe(false);
    expect(result.ownSlug).toBe(true);
    expect(result.handleFree).toEqual({ available: true });
    expect(result.handleTaken.available).toBe(false);
    expect(result.handleOwn).toEqual({ available: true });

    const slugReqs = mock.requestsTo('profiles').filter((r) => r.params.slug);
    expect(slugReqs.length).toBe(6);
    for (const r of slugReqs) expect(r.accept ?? '').not.toContain('vnd.pgrst.object');
    expect(w.responses406, 'respuestas 406').toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// (e) Búsqueda de talento (hook useTalentSearch)
// ---------------------------------------------------------------------------
test.describe('(e) búsqueda de talento', () => {
  test('filtra perfiles públicos sin is_public ni columnas privadas', async ({ page, context }) => {
    test.setTimeout(90_000);
    const base = makeProfiles(12).map((p) => ({ ...p, title: 'Analista', summary: 'Resumen', profile_hidden: false }));
    // Casos de visibilidad: oculto por moderación, suspendido y activo con is_active null
    base[3] = { ...base[3], role: 'professional', profile_hidden: true };
    base[4] = { ...base[4], role: 'professional', is_active: false };
    base[5] = { ...base[5], role: 'professional', is_active: null, profile_hidden: null };
    const mock = await setupModulesPage(context, { profiles: base, public_stamps: [] });
    const w = watch(page);
    await openBlankApp(page);

    const run = async (keywords: string) => page.evaluate(async (kw) => {
      // Mismas instancias de React que usa el hook (deps optimizadas de Vite)
      const entry = await (await fetch('/index.tsx')).text();
      const reactUrl = entry.match(/from\s+"(\/node_modules\/\.vite\/deps\/react\.js[^"]*)"/)![1];
      const domUrl = entry.match(/from\s+"(\/node_modules\/\.vite\/deps\/react-dom_client\.js[^"]*)"/)![1];
      const React = (await import(reactUrl)).default;
      const ReactDOM = (await import(domUrl)).default;
      const { useTalentSearch } = await import('/hooks/useTalentSearch.ts' as string);
      const { initialFilters } = await import('/hooks/useTalentFilters.ts' as string);

      return new Promise<{ ids: string[]; error: string | null; total: number }>((resolve) => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = ReactDOM.createRoot(host);
        let started = false;
        function Probe() {
          const s = useTalentSearch();
          React.useEffect(() => {
            if (!started) { started = true; s.search({ ...initialFilters, keywords: kw }); return; }
            if (!s.loading) {
              resolve({ ids: s.results.map((r: { id: string }) => r.id), error: s.error, total: s.totalResults });
              setTimeout(() => root.unmount(), 0);
            }
          }, [s.loading, s.results, s.error]);
          return null;
        }
        root.render(React.createElement(Probe));
      });
    }, keywords);

    const all = await run('');
    expect(all.error).toBeNull();
    const ids = new Set(all.ids);
    expect(ids.has(base[3].id), 'perfil oculto').toBe(false);
    expect(ids.has(base[4].id), 'perfil suspendido').toBe(false);
    expect(ids.has(base[5].id), 'is_active null cuenta como activo').toBe(true);
    for (const id of ids) expect(base.find((p) => p.id === id)!.role).not.toBe('admin');
    expect(all.total).toBe(all.ids.length);

    // Palabras clave con caracteres que romperían el filtro or=(...)
    const kw = await run('Profesional 007, (x)');
    expect(kw.error).toBeNull();

    const reqs = mock.requestsTo('profiles');
    expect(reqs.length).toBe(2);
    for (const r of reqs) {
      expect(r.params.is_public, 'no filtra por is_public').toBeUndefined();
      expect(r.params.profile_hidden?.[0]).toBe('not.is.true');
      expect(r.params.is_active?.[0]).toBe('not.is.false');
      // Columnas de profiles pedidas (sin los embeds skills/experiences)
      const select = r.params.select?.[0] ?? '*';
      const own = select.replace(/\w+\([^)]*\)/g, '').split(',').map((c) => c.trim()).filter(Boolean);
      for (const c of own) expect(PUBLIC.has(c) && !PRIVATE.has(c), `columna ${c}`).toBe(true);
      for (const key of Object.keys(r.params)) expect(PRIVATE.has(key), `filtro ${key}`).toBe(false);
      const or = r.params.or?.[0] ?? '';
      for (const c of ['bio', 'professional_title', ...PRIVATE]) expect(new RegExp(`\\b${c}\\.`).test(or), `or= ${c}`).toBe(false);
    }
    const orKw = reqs[1].params.or?.[0] ?? '';
    expect(orKw).toContain('full_name.ilike.%Profesional 007   x%');
    expect(mock.requestsTo('profiles_full')).toEqual([]);
    expect(w.responses406, 'respuestas 406').toEqual([]);
  });
});
