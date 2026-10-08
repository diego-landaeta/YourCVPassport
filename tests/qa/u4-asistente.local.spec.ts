/**
 * Asistente de CV de 8 pasos (components/profile-editor/ProfileWizard.tsx), issue #4.
 *
 * Cubre los arreglos que cambian el comportamiento del asistente:
 *   - Género opcional, con "Prefiero no decirlo" (se guarda null), sin asterisco ni
 *     errores "Invalid input" de Zod 4; sin asteriscos duplicados en Identidad;
 *     placeholders de país y contacto traducidos.
 *   - Experiencia opcional: se puede finalizar y publicar sin ninguna experiencia
 *     (la puerta del asistente y la de FinalizationStep coinciden).
 *   - Fechas: fin anterior al inicio y inicio futuro se rechazan con mensajes en
 *     español; los inputs de mes llevan min/max.
 *   - Preferencias opcional: "Finalizar" no se bloquea con el paso vacío y
 *     "Siguiente" avanza aunque el perfil traiga nulls de la BD.
 *   - "Siguiente" visible en Experiencia / Educación / Habilidades con listas vacías,
 *     y aviso del mínimo de habilidades junto a la lista.
 *   - La barra de pasos no marca pendiente un paso obligatorio antes de visitarlo, y
 *     en móvil centra el paso activo.
 *
 * Supabase va MOCKEADO (helpers/supabaseMock): las escrituras se registran, no se
 * aplican, y nada sale a producción.
 *
 *   QA_PORT=5461 npx playwright test -c tests/qa/playwright.qa.config.ts --project=chromium tests/qa/u4-asistente.local.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type Row, type SupabaseMock } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, locale: 'es-ES' });
// El dashboard carga muchas secciones lazy: con Vite en frío la primera visita tarda.
test.describe.configure({ timeout: 150_000 });

/** Profesional con Identidad completa y el asistente sin terminar. */
function me(overrides: Row = {}): Row {
  const [base] = makeProfiles(1);
  return {
    ...base,
    id: ADMIN_ID,
    role: 'professional',
    full_name: 'Lucía Estudiante',
    email: 'lucia.qa@example.test',
    headline: 'Estudiante de Ingeniería Informática',
    summary: 'Estudiante de último curso buscando mi primera experiencia profesional.',
    avatar_url: 'https://example.test/avatar.png',
    country_code: 'ES',
    gender: null,
    slug: 'lucia-estudiante-qa',
    last_slug_changed_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    template: 'classic',
    wizard_completed: false,
    first_login_completed: true,
    dashboard_tour_completed: true,
    plan: 'free',
    // Preferencias vacías, como las deja la BD a un perfil nuevo
    job_seeking_status: null,
    availability: null,
    remote_preference: null,
    job_type: null,
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    willing_to_relocate: null,
    preferred_locations: null,
    ...overrides,
  };
}

const skillRows = (n: number) => ['SQL', 'Python', 'Git', 'Docker'].slice(0, n)
  .map((name, i) => ({ id: `sk-${i}`, profile_id: ADMIN_ID, name, level: 'ADVANCED', percentage: 80, created_at: '2026-01-01T00:00:00Z' }));

function buildDb(profile: Row, { skills = 0 }: { skills?: number } = {}): Record<string, Row[]> {
  return {
    profiles: [profile],
    experiences: [],
    education: [],
    skills: skillRows(skills),
    languages: [], portfolio_items: [], stamps: [], visas: [], cv_versions: [], analytics_views: [],
    notifications: [], feed_posts: [], groups: [], group_members: [],
  };
}

async function boot(page: Page, profile: Row, opts: { skills?: number } = {}): Promise<SupabaseMock> {
  await installInitState(page.context(), { sessionProfile: profile, language: 'es', theme: 'light' });
  await page.addInitScript(() => { try { localStorage.setItem('sidebar-collapsed', 'false'); } catch { /* sin storage */ } });
  const mock = await mockSupabase(page.context(), buildDb(profile, opts));
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[aria-current="step"]')).toHaveCount(1, { timeout: 90_000 });
  return mock;
}

const step = (page: Page, name: string) => page.locator(`[role="button"][aria-label="${name}"]`);
const activeStep = (page: Page) => page.locator('[aria-current="step"]');

async function goToStep(page: Page, name: string) {
  await step(page, name).click();
  await expect(activeStep(page)).toHaveAttribute('aria-label', name);
}

const patchesTo = (mock: SupabaseMock, table: string) =>
  mock.writes.filter((w) => w.method === 'PATCH' && w.url.startsWith(`/rest/v1/${table}`));

test.describe('U4 Identidad', () => {
  test('género opcional con "Prefiero no decirlo" (se guarda null) y sin errores en inglés', async ({ page }) => {
    const mock = await boot(page, me());
    const gender = page.locator('select#identity-gender');
    await expect(gender).toBeVisible();
    // Sin asterisco: ya no es obligatorio
    await expect(page.locator('label[for="identity-gender"]')).toHaveText(/^\s*Género\s*$/);
    await expect(gender).toHaveValue('');
    await expect(gender.locator('option')).toHaveText(['Prefiero no decirlo', 'Mujer', 'Hombre']);

    // Un cambio cualquiera para que se guarde, dejando el género sin indicar
    await page.locator('input[name="headline"]').fill('Estudiante de Ingeniería Informática (último curso)');
    mock.clear();
    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(activeStep(page)).toHaveAttribute('aria-label', 'Experiencia', { timeout: 30_000 });
    const patch = patchesTo(mock, 'profiles').find((w) => (w.body || '').includes('"headline"'));
    expect(patch, 'PATCH de identidad').toBeTruthy();
    expect(JSON.parse(patch!.body || '{}').gender).toBeNull();
    await expect(page.getByText('Debes seleccionar tu género')).toHaveCount(0);
    await expect(page.getByText('Invalid input')).toHaveCount(0);
  });

  test('etiquetas sin asterisco duplicado y placeholders traducidos', async ({ page }) => {
    await boot(page, me({ country_code: null }));
    await expect(page.locator('label', { hasText: 'Nombre completo' }).first()).toHaveText(/^\s*Nombre completo\s*\*\s*$/);
    await expect(page.locator('label', { hasText: 'Título profesional' }).first()).toHaveText(/^\s*Título profesional\s*\*\s*$/);
    await expect(page.getByText('Selecciona un país', { exact: true })).toBeVisible();
    await expect(page.getByText('Select country')).toHaveCount(0);
    await expect(page.locator('input[name="linkedin_url"]')).toHaveAttribute('placeholder', 'linkedin.com/in/usuario');
    await expect(page.locator('input[name="github_url"]')).toHaveAttribute('placeholder', 'github.com/usuario');

    // País vacío: el error de Zod sale en español
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByText('Debes seleccionar un país')).toBeVisible();
    await expect(page.getByText('Invalid input')).toHaveCount(0);
  });
});

test.describe('U4 Experiencia, Educación y Habilidades', () => {
  test('"Siguiente" visible con las listas vacías y aviso del mínimo de habilidades', async ({ page }) => {
    await boot(page, me());
    await goToStep(page, 'Experiencia');
    await expect(page.getByText('Al menos 1 experiencia laboral')).toHaveCount(0);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(activeStep(page)).toHaveAttribute('aria-label', 'Educación');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(activeStep(page)).toHaveAttribute('aria-label', 'Habilidades');
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible();
    await expect(page.getByTestId('skills-min-hint')).toHaveText('Para publicar tu CV necesitas al menos 3 habilidades (0/3)');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(activeStep(page)).toHaveAttribute('aria-label', 'Idiomas');
  });

  test('fechas: fin anterior al inicio e inicio futuro se rechazan en español', async ({ page }) => {
    const mock = await boot(page, me());
    await goToStep(page, 'Experiencia');
    await page.getByRole('button', { name: 'Añadir experiencia' }).click();
    // Con el formulario abierto solo queda el botón de enviar, con otro texto
    await expect(page.getByRole('button', { name: 'Añadir experiencia' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Guardar experiencia' })).toBeVisible();

    const start = page.locator('input[name="start_date"]');
    const end = page.locator('input[name="end_date"]');
    await expect(start).toHaveAttribute('min', '1950-01');
    await expect(start).toHaveAttribute('max', /^\d{4}-\d{2}$/);
    await expect(page.locator('input[name="position"]')).toHaveAttribute('maxlength', '100');

    await page.locator('input[name="position"]').fill('Becario de desarrollo');
    await page.locator('input[name="company_name"]').fill('ACME');
    await start.fill('2024-05');
    await end.fill('2023-01');
    await expect(end).toHaveAttribute('min', '2024-05');
    mock.clear();
    await page.getByRole('button', { name: 'Guardar experiencia' }).click();
    await expect(page.getByText('La fecha de fin no puede ser anterior a la fecha de inicio')).toBeVisible();
    await expect(page.getByText('End date cannot be before start date')).toHaveCount(0);

    // Inicio en un mes futuro (actual + 1)
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    await start.fill(nextMonth);
    await page.locator('input[name="is_current"]').check();
    await page.getByRole('button', { name: 'Guardar experiencia' }).click();
    await expect(page.getByText(/La fecha de inicio no puede ser futura|La fecha no puede ser posterior al año actual/)).toBeVisible();

    expect(mock.writes.filter((w) => w.url.startsWith('/rest/v1/experiences')), 'no se guarda nada').toEqual([]);
  });

  test('la barra no marca Habilidades como pendiente hasta visitarla', async ({ page }) => {
    await boot(page, me());
    const dot = step(page, 'Habilidades').locator('span[title]');
    await expect(dot).toHaveCount(0);
    await goToStep(page, 'Habilidades');
    await goToStep(page, 'Idiomas');
    await expect(dot).toHaveCount(1);
  });
});

test.describe('U4 Finalizar', () => {
  test('se puede finalizar y publicar sin experiencia ni preferencias', async ({ page }) => {
    const mock = await boot(page, me(), { skills: 3 });
    await goToStep(page, 'Finalizar');
    await expect(page.getByRole('heading', { name: '¡Felicidades!' })).toBeVisible({ timeout: 30_000 });
    mock.clear();
    await page.getByRole('button', { name: 'Completar perfil' }).click();
    await expect.poll(() => patchesTo(mock, 'profiles').filter((w) => (w.body || '').includes('wizard_completed')).length,
      { timeout: 30_000 }).toBeGreaterThan(0);
    const body = JSON.parse(patchesTo(mock, 'profiles').find((w) => (w.body || '').includes('wizard_completed'))!.body || '{}');
    expect(body.wizard_completed).toBe(true);
    await expect(page.getByText(/PERFIL INCOMPLETO/)).toHaveCount(0);
  });

  test('Preferencias vacía no bloquea "Finalizar" desde la barra', async ({ page }) => {
    await boot(page, me(), { skills: 3 });
    await goToStep(page, 'Preferencias');
    await step(page, 'Finalizar').click();
    await expect(page.getByRole('heading', { name: '¡Felicidades!' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Por favor, completa tus preferencias laborales para continuar')).toHaveCount(0);
  });

  test('"Siguiente" en Preferencias avanza aunque el perfil traiga nulls; moneda EUR para España', async ({ page }) => {
    await boot(page, me(), { skills: 3 });
    await goToStep(page, 'Preferencias');
    await expect(page.locator('select[name="salary_currency"]')).toHaveValue('EUR');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(activeStep(page)).toHaveAttribute('aria-label', 'Finalizar', { timeout: 30_000 });
  });
});

test.describe('U4 barra de pasos en móvil', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('centra el paso activo al cambiar de paso', async ({ page }) => {
    await boot(page, me());
    // click() del DOM: sin el auto-scroll de Playwright, que ya movería la barra
    await page.evaluate(() => (document.querySelector('[role="button"][aria-label="Preferencias"]') as HTMLElement).click());
    await expect(activeStep(page)).toHaveAttribute('aria-label', 'Preferencias');
    await expect.poll(() => page.evaluate(() => {
      const el = document.querySelector('[aria-current="step"]') as HTMLElement;
      let box: HTMLElement | null = el.parentElement;
      while (box && getComputedStyle(box).overflowX !== 'auto') box = box.parentElement;
      if (!box) return false;
      const a = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return box.scrollLeft > 0 && a.left >= b.left && a.right <= b.right;
    }), { timeout: 10_000 }).toBe(true);
  });

  test('botón flotante de IA: nombre accesible y oculto mientras se escribe (issue #4, 17 y 18)', async ({ page }) => {
    await boot(page, me());
    const pro = page.getByTestId('ai-pro-button');
    await expect(pro).toBeVisible();
    await expect(pro).toHaveAttribute('aria-label', /.+/);
    // Sin elementos interactivos dentro del botón (antes el «PRO» era clicable).
    await expect(pro.locator('[onclick], a, button')).toHaveCount(0);

    await page.locator('main input[type="text"], main textarea').first().focus();
    await expect(pro).toBeHidden();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(pro).toBeVisible();
  });
});
