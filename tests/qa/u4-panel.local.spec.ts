/**
 * Issue #4 (revisión del 08/10): registro y panel.
 *
 * Registro (components/auth/AuthScreen.tsx):
 *   - 8: «Crear cuenta» con todo vacío avisa del nombre completo (primer campo) y lo enfoca.
 *   - 9: correo mal escrito -> aviso traducido (el formulario ya no depende de la
 *        validación nativa del navegador) y no se llama a la función signup.
 *   - 10: la casilla de términos tiene nombre accesible completo (con los enlaces).
 *   - 21/22: placeholders traducidos y «Únete a miles de profesionales» una sola vez.
 *
 * Panel (Sidebar / MobileNav / dashboardNav.ts) con el asistente SIN terminar:
 *   - 2/3: Ajustes y Notificaciones se abren desde el menú (escritorio y móvil) y por URL.
 *   - 13/24: el aviso de bloqueo dice qué apartado y qué falta, sin «wizard».
 *   - 18: campana, hamburguesa y cierre del menú con nombre accesible.
 *   - 17: con el menú móvil abierto el botón flotante PRO no queda por encima.
 *   - 25: aria-current en la opción activa y enlace directo ?seccion=.
 *   - 26: «Panel» en lugar de «Dashboard».
 *   - 27/28: nombre de Google en minúsculas -> «Manuel Casas»; iniciales «MC» en
 *     escritorio y en móvil.
 *
 * Supabase va MOCKEADO (helpers/supabaseMock): nada sale a producción.
 *
 *   QA_PORT=5462 npx playwright test -c tests/qa/playwright.qa.config.ts --project=chromium tests/qa/u4-panel.local.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type Row } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, locale: 'es-ES' });
// El dashboard carga muchas secciones lazy: con Vite en frío la primera visita tarda.
test.describe.configure({ timeout: 150_000 });

const MOBILE = { width: 390, height: 844 };

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------
test.describe('Registro: validación y accesibilidad', () => {
  async function openSignup(page: Page) {
    await installInitState(page.context(), { language: 'es', theme: 'light' });
    const mock = await mockSupabase(page.context(), {});
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#fullName')).toBeVisible({ timeout: 100_000 });
    return mock;
  }

  test('8: «Crear cuenta» vacío avisa del nombre completo y lo enfoca', async ({ page }) => {
    await openSignup(page);
    await page.locator('form button[type=submit]').click();
    const alert = page.locator('#auth-form-error');
    await expect(alert).toHaveText('El nombre completo es obligatorio');
    await expect(alert).toHaveAttribute('role', 'alert');
    await expect(page.locator('#fullName')).toBeFocused();
    await expect(page.locator('#fullName')).toHaveAttribute('aria-invalid', 'true');
    // Con nombre, el siguiente aviso es el del correo
    await page.fill('#fullName', 'Ana Prueba');
    await page.locator('form button[type=submit]').click();
    await expect(alert).toHaveText('El correo electrónico es obligatorio');
    await expect(page.locator('#email')).toBeFocused();
  });

  test('9: correo mal escrito muestra el aviso traducido y no llama a signup', async ({ page }) => {
    const signupCalls: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/functions/v1/signup')) signupCalls.push(r.url()); });
    await openSignup(page);
    await page.fill('#fullName', 'Ana Prueba');
    await page.fill('#email', 'ana.prueba@correo');
    await page.fill('#password', 'Segura123');
    await page.fill('#confirmPassword', 'Segura123');
    await page.check('#agreeToTerms');
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('#auth-form-error')).toHaveText('Por favor ingresa un correo electrónico válido');
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#email')).toBeFocused();
    await page.waitForTimeout(300);
    expect(signupCalls).toHaveLength(0);
  });

  test('10/21/22: casilla de términos con nombre completo, placeholders en español y sin texto repetido', async ({ page }) => {
    await openSignup(page);
    await expect(page.getByRole('checkbox', { name: 'Acepto los Términos de servicio y la Política de privacidad' })).toBeVisible();
    await expect(page.locator('#fullName')).toHaveAttribute('placeholder', 'Juan Pérez');
    await expect(page.locator('#email')).toHaveAttribute('placeholder', 'tu.email@ejemplo.com');
    await expect(page.getByText(/Únete a miles de profesionales/)).toHaveCount(1);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('John Doe');
    expect(body).not.toContain('name@example.com');
    // Login: placeholder traducido también
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#email')).toHaveAttribute('placeholder', 'tu.email@ejemplo.com', { timeout: 60_000 });
  });
});

// ---------------------------------------------------------------------------
// Panel con el asistente sin terminar
// ---------------------------------------------------------------------------

/** Usuario que entró con Google (nombre en minúsculas) y aún no terminó el asistente. */
function me(): Row {
  const [base] = makeProfiles(1);
  return {
    ...base,
    id: ADMIN_ID,
    role: 'professional',
    full_name: 'manuel casas',
    email: 'manuel.qa@example.test',
    headline: null,
    summary: null,
    avatar_url: null,
    slug: null,
    template: null,
    wizard_completed: false,
    first_login_completed: true,
    dashboard_tour_completed: true,
    plan: 'free',
  };
}

async function bootDashboard(page: Page, path = '/dashboard') {
  await installInitState(page.context(), { sessionProfile: me(), language: 'es', theme: 'light' });
  await page.addInitScript(() => { try { localStorage.setItem('sidebar-collapsed', 'false'); } catch { /* sin storage */ } });
  const mock = await mockSupabase(page.context(), {
    profiles: [me()],
    experiences: [], education: [], skills: [], languages: [], portfolio_items: [],
    stamps: [], visas: [], cv_versions: [], analytics_views: [],
    feed_notifications: [], feed_posts: [], groups: [], group_members: [],
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  return mock;
}

test.describe('Panel de escritorio (asistente sin terminar)', () => {
  test('2/3/25/26: Ajustes y Notificaciones abiertos, «Panel» traducido y aria-current', async ({ page }) => {
    await bootDashboard(page);
    const sidebar = page.locator('[data-tour="sidebar"]');
    await expect(sidebar.locator('[data-section-btn="ajustes"]')).toBeVisible({ timeout: 100_000 });

    // 26: «Panel», no «Dashboard»
    await expect(sidebar.locator('[data-section-btn="dashboard"]')).toHaveText(/^\s*Panel\s*$/);
    await expect(sidebar.getByText('Dashboard', { exact: true })).toHaveCount(0);

    // 3: Ajustes accesible
    await sidebar.locator('[data-section-btn="ajustes"]').click();
    await expect(page.getByRole('heading', { name: 'Ajustes de cuenta' })).toBeVisible({ timeout: 60_000 });
    await expect(sidebar.locator('[data-section-btn="ajustes"]')).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveURL(/\/dashboard\?seccion=ajustes$/);
    await expect(page.getByTestId('wizard-lock-notice')).toHaveCount(0);

    // 2: Notificaciones accesible desde el menú (igual que desde la campana)
    await sidebar.locator('[data-section-btn="notificaciones"]').click();
    await expect(page.getByRole('heading', { name: /^Notificaciones/ })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Sin notificaciones')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('wizard-lock-notice')).toHaveCount(0);
  });

  test('13/24: el aviso de bloqueo dice qué apartado y qué falta, sin «wizard» y sin tapar el contenido', async ({ page }) => {
    await bootDashboard(page);
    const sidebar = page.locator('[data-tour="sidebar"]');
    const templates = sidebar.locator('[data-section-btn="plantillas"]');
    await expect(templates).toBeVisible({ timeout: 100_000 });
    await expect(templates).toContainText('Bloqueado: completa tu CV primero');
    await templates.click();

    const notice = page.getByTestId('wizard-lock-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('Completa tu CV primero');
    await expect(notice).toContainText('«Plantillas» se desbloquea al terminar el asistente de tu CV.');
    await expect(notice).toContainText('Título profesional');
    await expect(notice).toContainText('Foto de perfil');
    await expect(notice).toContainText('Publicar tu CV en el último paso del asistente («Finalizar»)');
    await expect(notice).not.toContainText(/wizard/i);

    // El aviso está dentro del menú lateral: no se superpone al área de contenido
    const sideBox = (await sidebar.boundingBox())!;
    const noticeBox = (await notice.boundingBox())!;
    expect(noticeBox.x + noticeBox.width).toBeLessThanOrEqual(sideBox.x + sideBox.width + 1);

    await notice.getByRole('button', { name: 'Cerrar aviso' }).click();
    await expect(notice).toHaveCount(0);
  });

  test('27/28: nombre de Google con mayúscula inicial e iniciales «MC»', async ({ page }) => {
    await bootDashboard(page);
    const sidebar = page.locator('[data-tour="sidebar"]');
    await expect(sidebar.getByText('Manuel Casas', { exact: true })).toBeVisible({ timeout: 100_000 });
    await expect(sidebar.getByText('manuel casas', { exact: true })).toHaveCount(0);
    await expect(sidebar.getByText('MC', { exact: true })).toBeVisible();
  });

  test('25: enlace directo /dashboard?seccion=ajustes abre Ajustes aunque falte el asistente', async ({ page }) => {
    await bootDashboard(page, '/dashboard?seccion=ajustes');
    await expect(page.getByRole('heading', { name: 'Ajustes de cuenta' })).toBeVisible({ timeout: 100_000 });
    // Un apartado bloqueado por URL no se abre: se queda en el asistente
    await page.goto('/dashboard?seccion=plantillas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[aria-current="step"]')).toHaveCount(1, { timeout: 100_000 });
    await expect(page).toHaveURL(/\/dashboard\?seccion=mi-perfil$/);
  });
});

test.describe('Panel móvil (asistente sin terminar)', () => {
  test.use({ viewport: MOBILE, hasTouch: true });

  test('18/2/3/28: nombres accesibles, Notificaciones y Ajustes abiertos e iniciales «MC»', async ({ page }) => {
    await bootDashboard(page);
    // La campana de la barra superior (el menú cerrado queda inert, fuera de la tabulación)
    const bell = page.locator('button[aria-label="Notificaciones"]');
    const burger = page.getByRole('button', { name: 'Abrir menú' });
    await expect(burger).toBeVisible({ timeout: 100_000 });
    await expect(bell).toBeVisible();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#dashboard-mobile-menu')).toHaveAttribute('inert', '');

    // Campana: Notificaciones
    await bell.click();
    await expect(page.getByRole('heading', { name: /^Notificaciones/ })).toBeVisible({ timeout: 60_000 });

    // Menú: «Panel», iniciales MC, Notificaciones y Ajustes sin candado
    await burger.click();
    const menu = page.locator('#dashboard-mobile-menu');
    await expect(page.getByRole('button', { name: 'Cerrar menú' }).first()).toBeVisible();
    await expect(menu.locator('[data-tour="mobile-dashboard"]')).toContainText('Panel');
    await expect(menu.getByText('MC', { exact: true })).toBeVisible();
    await expect(menu.getByText('Manuel Casas', { exact: true })).toBeVisible();
    await expect(menu.locator('[data-tour="mobile-notificaciones"]')).not.toContainText('Bloqueado');
    await expect(menu.locator('[data-tour="mobile-ajustes"]')).not.toContainText('Bloqueado');
    await expect(menu.locator('[data-tour="mobile-plantillas"]')).toContainText('Bloqueado');

    await menu.locator('[data-tour="mobile-ajustes"]').click();
    await expect(page.getByRole('heading', { name: 'Ajustes de cuenta' })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('wizard-lock-notice')).toHaveCount(0);
  });

  test('13/24: aviso de bloqueo dentro del menú móvil, con lo que falta', async ({ page }) => {
    await bootDashboard(page);
    const burger = page.getByRole('button', { name: 'Abrir menú' });
    await burger.click({ timeout: 100_000 });
    await expect(page.getByRole('button', { name: 'Cerrar menú' }).first()).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#dashboard-mobile-menu');
    await menu.locator('[data-tour="mobile-plantillas"]').click();
    const notice = menu.getByTestId('wizard-lock-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('«Plantillas» se desbloquea al terminar el asistente de tu CV.');
    await expect(notice).not.toContainText(/wizard/i);
    // «Ir al asistente» cierra el menú y abre el asistente
    await notice.getByRole('button', { name: 'Ir al asistente' }).click();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[aria-current="step"]')).toHaveCount(1, { timeout: 60_000 });
  });

  test('17: con el menú abierto el botón flotante PRO del asistente queda debajo', async ({ page }) => {
    await bootDashboard(page);
    // El botón PRO sale en el paso Identidad cuando hay nombre
    const pro = page.locator('button', { hasText: 'PRO' }).first();
    await expect(pro).toBeVisible({ timeout: 100_000 });
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.locator('#dashboard-mobile-menu')).toBeVisible();
    // Esperar a que acabe la animación del menú
    await page.waitForTimeout(400);
    const box = (await pro.boundingBox())!;
    const coveredByPro = await page.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return !!el?.closest('button')?.textContent?.includes('PRO');
    }, [box.x + box.width / 2, box.y + box.height / 2] as const);
    expect(coveredByPro).toBe(false);
  });
});
