/**
 * Paso final del asistente (components/profile-editor/FinalizationStep.tsx).
 *
 * Miniaturas de plantilla: antes se pedían `/images/templates/<id>-light.png` o
 * `-dark.png`, que no existen (un 404 por plantilla). Ahora se usa
 * `template.previewImage` con la imagen de reserva de utils/templateImageFallback.
 *   - ninguna petición a `-light.png` ni `-dark.png` y ningún 404 en /images/templates/;
 *   - las tres miniaturas cargan (naturalWidth > 0), en tema claro y oscuro;
 *   - si una imagen falla (abortada), se pone la de reserva (data-fallback-applied).
 *
 * Slug (validateSlug -> checkSlugAvailability de utils/slugUtils, con maybeSingle y
 * excluyendo el propio perfil):
 *   - Hoy el paso final NO tiene campo para editar la URL (handleSlugChange y
 *     handleSlugBlur no están conectados a ningún input): validateSlug solo se ejecuta
 *     al pulsar "Completar perfil" con el slug actual del usuario. Ese camino se prueba
 *     por la interfaz: el propio slug no cuenta como ocupado y se guarda sin 406.
 *   - Libre / ocupado: se llama a checkSlugAvailability desde la página con la sesión
 *     del usuario, exactamente como lo hace validateSlug (slug, session.user.id).
 *
 * Supabase va MOCKEADO (helpers/supabaseMock): nada sale a producción.
 *
 *   QA_PORT=5430 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/finalizacion-paso-final.local.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type Row, type SupabaseMock } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, locale: 'es-ES' });
// El dashboard carga muchas secciones lazy: con Vite en frío la primera visita tarda.
test.describe.configure({ timeout: 150_000 });

const OWN_SLUG = 'laura-qa-final';
const OTHER_ID = '00000000-0000-4000-8000-0000000f0002';
const OTHER_SLUG = 'slug-de-otra-persona';
const THUMBS = 'img[alt$="template preview"]';

/** Profesional con el perfil completo y el asistente sin terminar (id = ADMIN_ID para /auth/v1/user). */
function me(): Row {
  const [base] = makeProfiles(1);
  return {
    ...base,
    id: ADMIN_ID,
    role: 'professional',
    full_name: 'Laura QA',
    email: 'laura.qa@example.test',
    headline: 'Ingeniera de datos',
    summary: 'Resumen profesional de prueba para el paso final del asistente.',
    avatar_url: 'https://example.test/avatar.png',
    job_seeking_status: 'open_to_offers',
    slug: OWN_SLUG,
    // Más de 90 días: la restricción de cambio de URL no aplica
    last_slug_changed_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    template: 'classic',
    wizard_completed: false,
    first_login_completed: true,
    dashboard_tour_completed: true,
    plan: 'free',
  };
}

function buildDb(): Record<string, Row[]> {
  const other = { ...makeProfiles(3)[2], id: OTHER_ID, full_name: 'Otra Persona', slug: OTHER_SLUG };
  return {
    profiles: [me(), other],
    experiences: [{ id: 'exp-1', profile_id: ADMIN_ID, position: 'Analista', company_name: 'ACME', start_date: '2020-01-01', end_date: null, is_current: true, description: 'Trabajo', achievements: [], display_order: 0 }],
    education: [],
    skills: ['SQL', 'Python', 'dbt'].map((name, i) => ({ id: `sk-${i}`, profile_id: ADMIN_ID, name, level: 'ADVANCED', percentage: 80, created_at: '2026-01-01T00:00:00Z' })),
    languages: [], portfolio_items: [], stamps: [], visas: [], cv_versions: [], analytics_views: [],
    notifications: [], feed_posts: [], groups: [], group_members: [],
  };
}

interface Watch {
  lightDark: string[];
  notFound: string[];
  responses406: string[];
}

function watch(page: Page): Watch {
  const w: Watch = { lightDark: [], notFound: [], responses406: [] };
  page.on('request', (r) => { if (/-(light|dark)\.png(\?|$)/.test(r.url())) w.lightDark.push(r.url()); });
  page.on('response', (r) => {
    const url = decodeURIComponent(r.url());
    if (r.status() === 404 && url.includes('/images/templates/')) w.notFound.push(url);
    if (r.status() === 406) w.responses406.push(url);
  });
  return w;
}

async function boot(page: Page, theme: 'light' | 'dark' = 'light'): Promise<SupabaseMock> {
  await installInitState(page.context(), { sessionProfile: me(), language: 'es', theme });
  await page.addInitScript(() => { try { localStorage.setItem('sidebar-collapsed', 'false'); } catch { /* sin storage */ } });
  const mock = await mockSupabase(page.context(), buildDb());
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  return mock;
}

/** Abre el paso "Finalizar" desde el stepper (en móvil el stepper hace scroll horizontal). */
async function openFinalization(page: Page) {
  await expect(page.locator('[aria-current="step"]')).toHaveCount(1, { timeout: 90_000 });
  const step = page.locator('[role="button"][aria-label="Finalizar"]');
  await step.scrollIntoViewIfNeeded();
  await step.click();
  await expect(page.getByRole('heading', { name: '¡Felicidades!' })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(THUMBS)).toHaveCount(3);
}

/** Espera a que las miniaturas terminen (incluida la posible reserva) y devuelve su estado. */
async function thumbState(page: Page) {
  const allComplete = () => page.evaluate((sel) => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(sel));
    return imgs.length === 3 && imgs.every((img) => img.complete);
  }, THUMBS);
  await expect.poll(allComplete, { timeout: 30_000 }).toBe(true);
  // Margen para que onError cambie a la reserva y esta termine de cargar
  await page.waitForTimeout(400);
  await expect.poll(allComplete, { timeout: 15_000 }).toBe(true);
  return page.evaluate((sel) => Array.from(document.querySelectorAll<HTMLImageElement>(sel)).map((img) => ({
    src: img.getAttribute('src') || '',
    naturalWidth: img.naturalWidth,
    fallback: img.dataset.fallbackApplied === 'true',
  })), THUMBS);
}

test.describe('Paso final: miniaturas de plantilla', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`sin -light/-dark.png ni 404; las tres miniaturas cargan (tema ${theme})`, async ({ page }) => {
      const w = watch(page);
      await boot(page, theme);
      await openFinalization(page);

      const thumbs = await thumbState(page);
      expect(thumbs.map((t) => t.src)).toEqual([
        '/images/templates/passport.png',
        '/images/templates/classic.png',
        '/images/templates/creative-bold.png',
      ]);
      for (const t of thumbs) {
        expect(t.naturalWidth, `naturalWidth de ${t.src}`).toBeGreaterThan(0);
        expect(t.fallback, `${t.src} no necesita la reserva`).toBe(false);
      }
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      expect(w.lightDark, 'peticiones a -light.png / -dark.png').toEqual([]);
      expect(w.notFound, '404 en /images/templates/').toEqual([]);
    });
  }

  test('si una miniatura falla se pone la imagen de reserva', async ({ page }) => {
    const w = watch(page);
    await page.route('**/images/templates/classic.png', (route) => route.abort('failed'));
    await boot(page);
    await openFinalization(page);

    const thumbs = await thumbState(page);
    const [passport, classic, creative] = thumbs;
    expect(classic.fallback, 'classic.png abortada -> reserva').toBe(true);
    expect(classic.src.startsWith('data:image/svg+xml')).toBe(true);
    expect(classic.naturalWidth).toBeGreaterThan(0);
    for (const t of [passport, creative]) {
      expect(t.fallback).toBe(false);
      expect(t.naturalWidth).toBeGreaterThan(0);
    }
    await expect(page.locator(`${THUMBS}[data-fallback-applied="true"]`)).toHaveCount(1);
    expect(w.lightDark).toEqual([]);
    expect(w.notFound).toEqual([]);
  });
});

test.describe('Paso final: slug disponible', () => {
  test('el propio slug no cuenta como ocupado: "Completar perfil" guarda sin 406', async ({ page }) => {
    const w = watch(page);
    const mock = await boot(page);
    await openFinalization(page);
    mock.clear();

    await page.getByRole('button', { name: 'Completar perfil' }).click();

    // Se guarda plantilla + slug propio + asistente terminado
    await expect.poll(() => mock.writes.filter((x) => x.method === 'PATCH' && x.url.startsWith('/rest/v1/profiles')).length,
      { timeout: 30_000 }).toBeGreaterThan(0);
    const patch = mock.writes.find((x) => x.method === 'PATCH' && x.url.startsWith('/rest/v1/profiles'))!;
    expect(patch.url).toContain(`id=eq.${ADMIN_ID}`);
    const body = JSON.parse(patch.body || '{}');
    expect(body.slug).toBe(OWN_SLUG);
    expect(body.wizard_completed).toBe(true);

    await expect(page.getByText('Esta URL ya está en uso. Por favor elige otra.')).toHaveCount(0);
    await expect(page.getByText('La URL debe tener al menos 3 caracteres')).toHaveCount(0);
    // validateSlug no consulta la BD para el slug que ya es del usuario
    expect(mock.requestsTo('profiles').filter((r) => r.params.slug)).toEqual([]);
    expect(w.responses406.filter((u) => u.includes('/rest/v1/profiles')), '406 en /rest/v1/profiles').toEqual([]);
  });

  test('checkSlugAvailability como lo llama validateSlug: libre, ocupado y propio, sin 406', async ({ page }) => {
    const w = watch(page);
    const mock = await boot(page);
    await openFinalization(page);
    mock.clear();

    const result = await page.evaluate(async ([own, other, userId]) => {
      const { checkSlugAvailability } = await import('/utils/slugUtils.ts' as string);
      return {
        free: await checkSlugAvailability('slug-libre-final-qa', userId),
        taken: await checkSlugAvailability(other, userId),
        own: await checkSlugAvailability(own, userId),
        // Sin excluir el propio perfil, el slug propio sí aparece en la BD
        ownWithoutExclusion: await checkSlugAvailability(own),
      };
    }, [OWN_SLUG, OTHER_SLUG, ADMIN_ID] as const);

    expect(result).toEqual({ free: true, taken: false, own: true, ownWithoutExclusion: false });
    const slugReqs = mock.requestsTo('profiles').filter((r) => r.params.slug);
    expect(slugReqs).toHaveLength(4);
    // Con el usuario: excluye su propio id
    expect(slugReqs.filter((r) => r.params.id?.[0] === `neq.${ADMIN_ID}`)).toHaveLength(3);
    // maybeSingle: pide un array, nunca `vnd.pgrst.object`
    for (const r of slugReqs) expect(r.accept ?? '').not.toContain('vnd.pgrst.object');
    expect(w.responses406.filter((u) => u.includes('/rest/v1/profiles')), '406 en /rest/v1/profiles').toEqual([]);
  });
});
