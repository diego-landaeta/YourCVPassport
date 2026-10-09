/**
 * Issue #244 del CRM: enlaces de los correos de auth con el dominio propio.
 *
 * Las Edge Functions mandan /confirm, /recovery y /callback con
 * ?token_hash=…&type=… (ver tests/qa/auth-email-links-edge.spec.ts) y la página
 * llama a supabase.auth.verifyOtp({ token_hash, type }) -> POST /auth/v1/verify.
 * Aquí se mockea ese POST y se comprueba:
 *
 * - /confirm?token_hash=x&type=signup: verifica, abre sesión y va al panel;
 * - /recovery?token_hash=x&type=recovery: formulario de nueva contraseña;
 * - /callback?token_hash=x&type=magiclink: abre sesión y va al panel;
 * - token caducado o usado (403 otp_expired): mensaje claro y enlace para pedir
 *   otro, sin pantalla en blanco ni "Algo salió mal";
 * - formato antiguo (#access_token en el hash) sigue funcionando;
 * - tras verificar, la URL ya no contiene token_hash (ni en el historial);
 * - una sola llamada a verify por enlace (StrictMode monta dos veces en dev).
 *
 *   QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/auth-email-links.local.spec.ts
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { ADMIN_ID, buildFakeSession, installInitState, mockSupabase, SAFE_CONTEXT_OPTIONS, type Row } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

// Vite en modo dev compila bajo demanda: con 4 navegadores en paralelo el
// primer page.goto puede tardar.
test.describe.configure({ timeout: 120_000 });

// Textos esperados (translations/*.ts > dashboard.auth.emailLink / recovery / errors).
const TXT = {
  es: {
    expiredTitle: 'Este enlace ha caducado o ya se ha usado',
    expiredDesc: 'los enlaces del correo solo sirven una vez',
    failedTitle: 'No hemos podido verificar el enlace',
    requestNewAccessLink: 'Pedir un enlace de acceso nuevo',
    requestNewRecoveryLink: 'Pedir un nuevo enlace de recuperación',
    confirmedTitle: '¡Correo confirmado!',
    newPasswordTitle: 'Establecer nueva contraseña',
    recoveryTitle: 'Recuperar contraseña',
    serverError: 'Algo salió mal',
  },
  en: {
    expiredTitle: 'This link has expired or has already been used',
    requestNewAccessLink: 'Request a new sign-in link',
  },
} as const;

// Perfil de la sesión: id = ADMIN_ID porque el mock responde /auth/v1/user con
// ese id; rol professional para que /dashboard no redirija a /admin.
const PROFILE: Row = {
  id: ADMIN_ID,
  full_name: 'Ana QA',
  email: 'ana@example.test',
  role: 'professional',
  is_active: true,
  plan: 'free',
  slug: 'ana-qa',
  wizard_completed: true,
  template: 'classic',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

type VerifyMode = 'ok' | 'expired';

interface VerifyCall { body: any }

/**
 * Mock de Supabase + POST /auth/v1/verify. Se registra después de mockSupabase:
 * en Playwright gana la última ruta registrada; el preflight OPTIONS y el resto
 * siguen en el router del mock.
 */
async function setup(context: BrowserContext, mode: VerifyMode, language: 'es' | 'en' = 'es') {
  await installInitState(context, { language, theme: 'light' });
  await mockSupabase(context, { profiles: [PROFILE], profiles_full: [PROFILE] });
  const calls: VerifyCall[] = [];
  await context.route(/\/auth\/v1\/verify(\?|$)/, async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    let body: any = null;
    try { body = req.postDataJSON(); } catch { /* sin cuerpo */ }
    calls.push({ body });
    const headers = { 'access-control-allow-origin': '*' };
    if (mode === 'expired') {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ code: 403, error_code: 'otp_expired', msg: 'Email link is invalid or has expired' }),
      });
    }
    // GoTrue responde a verify con la sesión (access_token, refresh_token, user...).
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(buildFakeSession(PROFILE)) });
  });
  return calls;
}

const storedSession = (page: Page) =>
  page.evaluate(() => {
    try { return localStorage.getItem('yourcvpassport-auth'); } catch { return null; }
  });

/** La URL y la entrada del historial ya no llevan el token. */
async function expectTokenGone(page: Page) {
  await expect.poll(() => page.url()).not.toContain('token_hash');
  const href = await page.evaluate(() => window.location.href);
  expect(href).not.toContain('token_hash');
}

/** Hash del formato antiguo (implicit grant) que GoTrue añadía al redirigir. */
function legacyHash(type: string) {
  const s = buildFakeSession(PROFILE);
  const p = new URLSearchParams({
    access_token: s.access_token,
    expires_at: String(s.expires_at),
    expires_in: String(s.expires_in),
    refresh_token: s.refresh_token,
    token_type: 'bearer',
    type,
  });
  return `#${p.toString()}`;
}

test.describe('enlace nuevo con token_hash', () => {
  test('/confirm?token_hash&type=signup: verifica, inicia sesión y va al panel', async ({ page, context }) => {
    const calls = await setup(context, 'ok');
    await page.goto('/confirm?token_hash=x&type=signup');

    await expect(page.getByText(TXT.es.confirmedTitle)).toBeVisible({ timeout: 60_000 });
    await expectTokenGone(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    expect(await storedSession(page)).toContain('access_token');

    expect(calls).toHaveLength(1);
    expect(calls[0].body).toMatchObject({ token_hash: 'x', type: 'signup' });
  });

  test('/recovery?token_hash&type=recovery: muestra el formulario de nueva contraseña', async ({ page, context }) => {
    const calls = await setup(context, 'ok');
    await page.goto('/recovery?token_hash=x&type=recovery');

    await expect(page.getByRole('heading', { name: TXT.es.newPasswordTitle })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#newPassword')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expectTokenGone(page);
    expect(await storedSession(page)).toContain('access_token');

    expect(calls).toHaveLength(1);
    expect(calls[0].body).toMatchObject({ token_hash: 'x', type: 'recovery' });
  });

  test('/callback?token_hash&type=magiclink: inicia sesión y va al panel', async ({ page, context }) => {
    const calls = await setup(context, 'ok');
    await page.goto('/callback?token_hash=x&type=magiclink');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    expect(page.url()).not.toContain('token_hash');
    expect(await storedSession(page)).toContain('access_token');

    expect(calls).toHaveLength(1);
    expect(calls[0].body).toMatchObject({ token_hash: 'x', type: 'magiclink' });
  });

  test('la entrada del historial no conserva el token', async ({ page, context }) => {
    await setup(context, 'ok');
    await page.goto('/');
    await page.goto('/recovery?token_hash=x&type=recovery');
    await expect(page.locator('#newPassword')).toBeVisible({ timeout: 60_000 });
    await expectTokenGone(page);
    // Volver atrás y adelante: la entrada de /recovery ya no lleva el token.
    await page.goBack();
    await page.goForward();
    await expect.poll(() => page.url()).toMatch(/\/recovery$/);
  });
});

test.describe('token caducado o ya usado (403 otp_expired)', () => {
  const cases = [
    { url: '/confirm?token_hash=x&type=signup', action: TXT.es.requestNewAccessLink, actionHref: '/magic-link' },
    { url: '/callback?token_hash=x&type=magiclink', action: TXT.es.requestNewAccessLink, actionHref: '/magic-link' },
    { url: '/recovery?token_hash=x&type=recovery', action: TXT.es.requestNewRecoveryLink, actionHref: null },
  ];

  for (const c of cases) {
    test(`${c.url.split('?')[0]}: mensaje claro y enlace para pedir otro`, async ({ page, context }) => {
      const calls = await setup(context, 'expired');
      await page.goto(c.url);

      const card = page.getByTestId('email-link-error');
      await expect(card).toBeVisible({ timeout: 60_000 });
      await expect(card.getByRole('heading', { name: TXT.es.expiredTitle })).toBeVisible();
      await expect(card.getByRole('alert')).toContainText(TXT.es.expiredDesc);
      await expect(page.getByText(TXT.es.serverError)).toHaveCount(0);
      await expect(page.getByText(TXT.es.failedTitle)).toHaveCount(0);
      await expectTokenGone(page);
      expect(await storedSession(page)).toBeNull();
      expect(calls).toHaveLength(1);

      // Se queda en la página (sin redirección automática que oculte el aviso).
      await page.waitForTimeout(3500);
      await expect(card).toBeVisible();

      if (c.actionHref) {
        await expect(card.getByRole('link', { name: c.action })).toHaveAttribute('href', c.actionHref);
      } else {
        // /recovery: el botón vuelve al formulario para pedir otro correo.
        await card.getByRole('button', { name: c.action }).click();
        await expect(page.getByRole('heading', { name: TXT.es.recoveryTitle })).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
      }
    });
  }

  test('en inglés el mensaje también es claro', async ({ page, context }) => {
    await setup(context, 'expired', 'en');
    await page.goto('/confirm?token_hash=x&type=signup');
    const card = page.getByTestId('email-link-error');
    await expect(card.getByRole('heading', { name: TXT.en.expiredTitle })).toBeVisible({ timeout: 60_000 });
    await expect(card.getByRole('link', { name: TXT.en.requestNewAccessLink })).toBeVisible();
  });
});

test.describe('formato antiguo (#access_token): correos ya enviados', () => {
  test('/confirm#access_token: confirma y va al panel', async ({ page, context }) => {
    const calls = await setup(context, 'ok');
    await page.goto(`/confirm${legacyHash('signup')}`);
    await expect(page.getByText(TXT.es.confirmedTitle)).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    expect(calls).toHaveLength(0);
  });

  test('/recovery#access_token&type=recovery: formulario de nueva contraseña', async ({ page, context }) => {
    const calls = await setup(context, 'ok');
    await page.goto(`/recovery${legacyHash('recovery')}`);
    await expect(page.getByRole('heading', { name: TXT.es.newPasswordTitle })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#newPassword')).toBeVisible();
    expect(calls).toHaveLength(0);
  });

  test('/callback#access_token: inicia sesión y va al panel', async ({ page, context }) => {
    const calls = await setup(context, 'ok');
    await page.goto(`/callback${legacyHash('magiclink')}`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    expect(await storedSession(page)).toContain('access_token');
    expect(calls).toHaveLength(0);
  });

  test('/callback#error_code=otp_expired: mensaje de enlace caducado', async ({ page, context }) => {
    await setup(context, 'ok');
    await page.goto('/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    await expect(page.getByTestId('email-link-error').getByRole('heading', { name: TXT.es.expiredTitle })).toBeVisible({ timeout: 60_000 });
  });
});
