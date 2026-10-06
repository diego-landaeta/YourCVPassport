/**
 * Comprobación de slug disponible en la interfaz.
 *
 *   - Dashboard > Ajustes, editor de URL (SlugEditor en
 *     components/dashboard/DashboardContent.tsx): usa checkSlugAvailability de
 *     utils/slugUtils (maybeSingle, excluye el propio perfil). Icono verde = libre,
 *     rojo = ocupado; el propio slug no se consulta ni se marca como ocupado.
 *   - Admin > Gestión de perfiles, modal "Editar Perfil"
 *     (components/admin/ProfilesManagement.tsx): al salir del campo se comprueba con
 *     maybeSingle y `id=neq.<perfil>`; al guardar se vuelve a comprobar.
 *
 * En los dos: libre -> disponible, de otro perfil -> no disponible, el propio -> no
 * cuenta como ocupado, y ninguna petición a /rest/v1/profiles responde 406 (el mock
 * responde 406 a toda petición `vnd.pgrst.object` sin una única fila, como PostgREST).
 * El paso final del asistente está en finalizacion-paso-final.local.spec.ts.
 *
 * Supabase va MOCKEADO (helpers/supabaseMock): nada sale a producción.
 *
 *   QA_PORT=5430 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/slug-disponible.local.spec.ts
 */
import { test, expect, type Page, type Locator } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type Row, type SupabaseMock } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, locale: 'es-ES' });
// El dashboard y /admin cargan secciones lazy: con Vite en frío la primera visita tarda.
test.describe.configure({ timeout: 150_000 });

/** Registra las respuestas 406 de /rest/v1/profiles. */
function watch406(page: Page) {
  const list: string[] = [];
  page.on('response', (r) => {
    const url = decodeURIComponent(r.url());
    if (r.status() === 406 && url.includes('/rest/v1/profiles')) list.push(url);
  });
  return list;
}

/** Consultas de slug (GET a profiles con filtro `slug`). */
const slugQueries = (mock: SupabaseMock, slug: string) =>
  mock.requestsTo('profiles').filter((r) => r.params.slug?.[0] === `eq.${slug}`);

/** Click centrando antes el elemento (las cabeceras sticky pueden taparlo en móvil). */
async function clickCentered(loc: Locator) {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await loc.click({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Dashboard: editor de URL en Ajustes
// ---------------------------------------------------------------------------
const OWN_SLUG = 'laura-qa-dashboard';
const OTHER_ID = '00000000-0000-4000-8000-0000000f0102';
const OTHER_SLUG = 'slug-ocupado-por-otro';
const FREE_SLUG = 'slug-libre-dashboard-qa';

function me(): Row {
  const [base] = makeProfiles(1);
  return {
    ...base,
    // id de ADMIN_ID para que /auth/v1/user del mock devuelva este usuario
    id: ADMIN_ID,
    role: 'professional',
    full_name: 'Laura QA',
    slug: OWN_SLUG,
    // Más de 90 días: se puede cambiar la URL
    last_slug_changed_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    first_login_completed: true,
    dashboard_tour_completed: true,
    wizard_completed: true,
  };
}

async function bootDashboard(page: Page) {
  const other = { ...makeProfiles(3)[2], id: OTHER_ID, full_name: 'Otra Persona', slug: OTHER_SLUG };
  await installInitState(page.context(), { sessionProfile: me(), language: 'es', theme: 'light' });
  await page.addInitScript(() => { try { localStorage.setItem('sidebar-collapsed', 'false'); } catch { /* sin storage */ } });
  const mock = await mockSupabase(page.context(), {
    profiles: [me(), other],
    experiences: [], education: [], skills: [], languages: [], portfolio_items: [], stamps: [], visas: [],
    cv_versions: [], analytics_views: [], notifications: [], feed_posts: [], groups: [], group_members: [],
  });
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  // Esperar a que DashboardPage esté montado (escucha popstate) antes de cambiar de sección
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 90_000 });
  // Misma navegación que usa DashboardPage (vale igual en escritorio y en móvil)
  await page.evaluate(() => {
    window.history.pushState({ section: 'ajustes' }, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { section: 'ajustes' } }));
  });
  const input = page.locator('input[placeholder="tu-nombre-profesional"]');
  await expect(input).toHaveValue(OWN_SLUG, { timeout: 30_000 });
  await input.scrollIntoViewIfNeeded();
  return { mock, input };
}

test.describe('Dashboard > Ajustes: URL personalizada', () => {
  test('libre = disponible, de otro = ocupado, el propio no cuenta; sin 406', async ({ page }) => {
    const r406 = watch406(page);
    const { mock, input } = await bootDashboard(page);
    // Contenedor del input (iconos) y del editor completo (botón Guardar)
    const field = input.locator('xpath=..');
    const editor = input.locator('xpath=ancestor::div[contains(@class,"space-y-3")][1]');
    const ok = field.locator('svg.text-green-500');
    const taken = field.locator('svg.text-red-500');
    const save = editor.getByRole('button', { name: 'Guardar' });

    // Libre
    await input.fill(FREE_SLUG);
    await expect(ok).toBeVisible({ timeout: 15_000 });
    await expect(taken).toHaveCount(0);
    await expect(save).toBeEnabled();
    expect(slugQueries(mock, FREE_SLUG).length).toBeGreaterThan(0);
    for (const r of slugQueries(mock, FREE_SLUG)) {
      expect(r.params.id?.[0], 'excluye el propio perfil').toBe(`neq.${ADMIN_ID}`);
      expect(r.accept ?? '', 'maybeSingle, no vnd.pgrst.object').not.toContain('vnd.pgrst.object');
    }

    // Ocupado por otro perfil
    await input.fill(OTHER_SLUG);
    await expect(taken).toBeVisible({ timeout: 15_000 });
    await expect(ok).toHaveCount(0);
    await expect(save).toBeDisabled();

    // El propio, justo después de un ocupado: ni se consulta ni se queda el "ocupado"
    // del valor anterior (antes Guardar seguía deshabilitado)
    await input.fill(OWN_SLUG);
    await page.waitForTimeout(1200); // más que el debounce de 500 ms
    await expect(taken).toHaveCount(0);
    await expect(save).toBeEnabled();
    expect(slugQueries(mock, OWN_SLUG)).toEqual([]);

    // Escribir uno ocupado y volver al propio antes del debounce: el temporizador del
    // valor anterior no debe dispararse
    const takenQueries = slugQueries(mock, OTHER_SLUG).length;
    await input.fill(OTHER_SLUG);
    await input.fill(OWN_SLUG);
    await page.waitForTimeout(1500);
    await expect(taken).toHaveCount(0);
    await expect(save).toBeEnabled();
    expect(slugQueries(mock, OTHER_SLUG).length, 'sin consulta del valor descartado').toBe(takenQueries);

    await save.click();
    await expect(save).toHaveCount(0); // sale del modo edición sin guardar nada
    expect(mock.writes.filter((w) => w.url.startsWith('/rest/v1/profiles'))).toEqual([]);

    expect(r406, '406 en /rest/v1/profiles').toEqual([]);
  });

  test('guardar un slug libre lo escribe en el propio perfil', async ({ page }) => {
    const r406 = watch406(page);
    const { mock, input } = await bootDashboard(page);
    const editor = input.locator('xpath=ancestor::div[contains(@class,"space-y-3")][1]');
    await input.fill(FREE_SLUG);
    await expect(input.locator('xpath=..').locator('svg.text-green-500')).toBeVisible({ timeout: 15_000 });
    mock.clear();
    await editor.getByRole('button', { name: 'Guardar' }).click();

    await expect.poll(() => mock.writes.filter((w) => w.method === 'PATCH' && w.url.startsWith('/rest/v1/profiles')).length,
      { timeout: 15_000 }).toBe(1);
    const patch = mock.writes.find((w) => w.method === 'PATCH')!;
    expect(patch.url).toContain(`id=eq.${ADMIN_ID}`);
    expect(JSON.parse(patch.body || '{}').slug).toBe(FREE_SLUG);
    await expect(page.getByText('URL actualizada exitosamente')).toBeVisible();
    expect(r406).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Admin: modal "Editar Perfil" de Gestión de perfiles
// ---------------------------------------------------------------------------
const TARGET_NAME = 'Profesional 005';
const TARGET_ID = '00000000-0000-4000-8000-000000000005';
const TARGET_SLUG = 'perfil-5';
const ADMIN_TAKEN = 'perfil-7';
const ADMIN_FREE = 'slug-libre-admin-qa';

async function openEditModal(page: Page) {
  const profiles = makeProfiles(117);
  const admin = profiles.find((p) => p.id === ADMIN_ID)!;
  await installInitState(page.context(), { sessionProfile: admin, language: 'es', theme: 'light' });
  const mock = await mockSupabase(page.context(), { profiles });
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Moderación de Usuarios').first()).toBeVisible({ timeout: 90_000 });

  await page.getByPlaceholder('Nombre, email, headline...').fill(TARGET_NAME);
  await expect(page.getByText('1 perfiles encontrados')).toBeVisible({ timeout: 15_000 });
  const table = page.locator('[data-testid="profiles-table"]');
  await clickCentered(table.locator('button[title="Editar"]').first());
  const dialog = page.getByRole('dialog', { name: 'Editar Perfil' });
  const input = dialog.locator('#profiles-edit-slug');
  await expect(input).toHaveValue(TARGET_SLUG);
  return { mock, dialog, input };
}

test.describe('Admin > Gestión de perfiles: editar slug', () => {
  test('libre = disponible, de otro = ocupado, el propio no cuenta y se guarda; sin 406', async ({ page }) => {
    const r406 = watch406(page);
    const { mock, dialog, input } = await openEditModal(page);
    const error = dialog.locator('#profiles-edit-slug-error');
    const save = dialog.getByRole('button', { name: 'Guardar Cambios' });

    // Libre: al salir del campo se consulta y no hay error
    await input.fill(ADMIN_FREE);
    await input.blur();
    await expect.poll(() => slugQueries(mock, ADMIN_FREE).length, { timeout: 15_000 }).toBeGreaterThan(0);
    await expect(save).toBeEnabled();
    await expect(error).toHaveCount(0);
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    for (const r of slugQueries(mock, ADMIN_FREE)) {
      expect(r.params.id?.[0], 'excluye el perfil editado').toBe(`neq.${TARGET_ID}`);
      expect(r.accept ?? '').not.toContain('vnd.pgrst.object');
    }

    // Ocupado por otro perfil
    await input.fill(ADMIN_TAKEN);
    await input.blur();
    await expect(error).toHaveText('Esta URL ya está en uso');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(save).toBeDisabled();

    // El propio: escribir limpia el error, al salir no se marca como ocupado
    await input.fill(TARGET_SLUG);
    await input.blur();
    await page.waitForTimeout(500);
    await expect(error).toHaveCount(0);
    await expect(save).toBeEnabled();
    expect(slugQueries(mock, TARGET_SLUG), 'sin consulta al salir: es el slug actual').toEqual([]);

    // Guardar vuelve a comprobar (excluyendo el propio perfil) y escribe
    await save.click();
    await expect.poll(() => mock.writes.filter((w) => w.method === 'PATCH' && w.url.startsWith('/rest/v1/profiles')).length,
      { timeout: 15_000 }).toBe(1);
    const own = slugQueries(mock, TARGET_SLUG);
    expect(own).toHaveLength(1);
    expect(own[0].params.id?.[0]).toBe(`neq.${TARGET_ID}`);
    const patch = mock.writes.find((w) => w.method === 'PATCH')!;
    expect(patch.url).toContain(`id=eq.${TARGET_ID}`);
    expect(JSON.parse(patch.body || '{}').slug).toBe(TARGET_SLUG);
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Esta URL ya está en uso. Por favor elige otra.')).toHaveCount(0);

    expect(r406, '406 en /rest/v1/profiles').toEqual([]);
  });

  test('guardar con un slug de otro perfil no escribe', async ({ page }) => {
    const r406 = watch406(page);
    const { mock, dialog, input } = await openEditModal(page);
    // Sin salir del campo (no hay comprobación previa): la de "Guardar" lo detiene
    await input.fill(ADMIN_TAKEN);
    const save = dialog.getByRole('button', { name: 'Guardar Cambios' });
    await save.click();
    await expect(dialog.locator('#profiles-edit-slug-error')).toBeVisible({ timeout: 15_000 });
    await expect(dialog.locator('#profiles-edit-slug-error')).toContainText('Esta URL ya está en uso');
    expect(mock.writes.filter((w) => w.url.startsWith('/rest/v1/profiles'))).toEqual([]);
    expect(r406).toEqual([]);
  });
});
