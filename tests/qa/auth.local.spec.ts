/**
 * QA auth (#1 alta con email, #12 recuperación de contraseña) contra la app local.
 *
 * Todo lo que va a `*.supabase.co` se responde en local; en particular las
 * Edge Functions `signup` y `send-password-reset` se simulan con los códigos del
 * nuevo contrato (EMAIL_ALREADY_REGISTERED, WEAK_PASSWORD, EMAIL_SEND_FAILED...)
 * y con el contrato antiguo (500 + INTERNAL_ERROR) para cubrir el caso de
 * desplegar el frontend antes que las funciones. Nunca se crea una cuenta real.
 *
 *   QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/auth.local.spec.ts
 */
import { test, expect, type Page, type Route, type Request } from '@playwright/test';

type Lang = 'es' | 'en';

// OBLIGATORIO (igual que SAFE_CONTEXT_OPTIONS de helpers/supabaseMock.ts):
// - la app registra /sw.js y en WebKit las peticiones del service worker NO pasan
//   por `page.route`: llegarían a la Supabase real. Se bloquea el service worker.
// - proxy muerto como red de seguridad: lo externo no interceptado falla en local.
test.use({
  serviceWorkers: 'block',
  proxy: { server: 'http://127.0.0.1:9', bypass: 'localhost,127.0.0.1' },
});

// Vite en modo dev compila bajo demanda: con las 4 configuraciones en paralelo
// el primer page.goto puede pasar de 60 s en máquinas cargadas.
test.describe.configure({ timeout: 120_000 });

// Textos esperados (translations/*.ts > dashboard.auth.errors / recovery).
const TXT = {
  es: {
    signupButton: 'Crear cuenta',
    emailAlreadyExists: 'Este correo electrónico ya está registrado',
    weakPassword: 'La contraseña es demasiado débil',
    invalidInput: 'Revisa los datos',
    signupEmailSendFailed: 'No hemos podido enviarte el correo de confirmación',
    signupTimeout: 'El servidor está tardando demasiado en responder. Revisa tu correo',
    networkError: 'Error de red',
    serverError: 'Algo salió mal',
    tooManyRequests: 'Demasiadas solicitudes',
    signUpSuccess: '¡Cuenta creada! Revisa tu correo',
    recoveryEmailSendFailed: 'No hemos podido enviar el correo de recuperación',
    recoveryTimeout: 'El servidor está tardando demasiado en responder. Inténtalo',
    checkEmail: '¡Revisa tu correo!',
  },
  en: {
    signupButton: 'Create Account',
    emailAlreadyExists: 'An account with this email already exists',
    signupEmailSendFailed: "We couldn't send you the confirmation email",
    recoveryEmailSendFailed: "We couldn't send the password reset email",
  },
} as const;

interface FnCall { method: string; body: any }

const json = (route: Route, status: number, body: unknown, origin: string) =>
  route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

type FnHandler = (route: Route, req: Request, origin: string) => Promise<void> | void;

/**
 * Aísla la página: localhost pasa, `*.supabase.co` se responde en local
 * (la función indicada con `handler`, el resto con respuestas vacías) y
 * cualquier otro origen externo se aborta.
 */
async function isolate(page: Page, fn: 'signup' | 'send-password-reset', handler: FnHandler, lang: Lang) {
  const calls: FnCall[] = [];
  await page.addInitScript((l) => {
    try { localStorage.setItem('language', l); } catch { /* sin storage */ }
  }, lang);

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const origin = req.headers()['origin'] || `http://${new URL(page.url() || 'http://localhost').host}`;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();

    if (url.pathname === `/functions/v1/${fn}`) {
      if (req.method() === 'OPTIONS') return json(route, 200, 'ok', origin);
      let body: any = null;
      try { body = req.postDataJSON(); } catch { /* sin cuerpo */ }
      if (body?.password) body.password = '***';
      calls.push({ method: req.method(), body });
      return handler(route, req, origin);
    }
    if (url.pathname.startsWith('/functions/v1/')) return json(route, 200, {}, origin);
    if (url.pathname.startsWith('/rest/v1/')) return json(route, 200, [], origin);
    if (url.pathname.startsWith('/auth/v1/')) return json(route, 200, {}, origin);
    return json(route, 200, {}, origin);
  });
  return calls;
}

async function fillSignup(page: Page, email = 'qa.Mock@Example.com') {
  await page.goto('/signup');
  await page.fill('#fullName', 'QA Tester');
  await page.fill('#email', email);
  await page.fill('#password', 'Prueba1234');
  await page.fill('#confirmPassword', 'Prueba1234');
  await page.check('#agreeToTerms');
  await page.locator('form button[type=submit]').click();
  return Date.now();
}

const formAlert = (page: Page) => page.getByRole('alert');
const toastArea = (page: Page) => page.locator('div.fixed.top-4.right-4');

// ---------------------------------------------------------------------------
// #1 Alta con email
// ---------------------------------------------------------------------------
test.describe('#1 alta con email: todo error se muestra', () => {
  const cases: { name: string; respond: FnHandler; expected: string }[] = [
    {
      name: '502 EMAIL_SEND_FAILED (Resend)',
      respond: (r, _q, o) => json(r, 502, { error: 'Could not send confirmation email', code: 'EMAIL_SEND_FAILED' }, o),
      expected: TXT.es.signupEmailSendFailed,
    },
    {
      name: '409 EMAIL_ALREADY_REGISTERED',
      respond: (r, _q, o) => json(r, 409, { error: 'A user with this email address has already been registered', code: 'EMAIL_ALREADY_REGISTERED' }, o),
      expected: TXT.es.emailAlreadyExists,
    },
    {
      name: '400 WEAK_PASSWORD',
      respond: (r, _q, o) => json(r, 400, { error: 'Password is too weak', code: 'WEAK_PASSWORD' }, o),
      expected: TXT.es.weakPassword,
    },
    {
      name: '400 INVALID_INPUT',
      respond: (r, _q, o) => json(r, 400, { error: 'Invalid email', code: 'INVALID_INPUT' }, o),
      expected: TXT.es.invalidInput,
    },
    {
      name: '429 rate limit',
      respond: (r, _q, o) => json(r, 429, { error: 'Rate limit exceeded' }, o),
      expected: TXT.es.tooManyRequests,
    },
    {
      name: 'contrato antiguo: 500 "already been registered"',
      respond: (r, _q, o) => json(r, 500, { error: 'A user with this email address has already been registered', code: 'INTERNAL_ERROR' }, o),
      expected: TXT.es.emailAlreadyExists,
    },
    {
      name: 'contrato antiguo: 500 "Resend error"',
      respond: (r, _q, o) => json(r, 500, { error: 'Resend error: {"statusCode":403,"message":"The yourcvpassport.com domain is not verified"}', code: 'INTERNAL_ERROR' }, o),
      expected: TXT.es.signupEmailSendFailed,
    },
    {
      name: '500 desconocido',
      respond: (r, _q, o) => json(r, 500, { error: 'boom', code: 'INTERNAL_ERROR' }, o),
      expected: TXT.es.serverError,
    },
    {
      name: 'fallo de red',
      respond: (r) => r.abort('failed'),
      expected: TXT.es.networkError,
    },
  ];

  for (const c of cases) {
    test(c.name, async ({ page }) => {
      const calls = await isolate(page, 'signup', c.respond, 'es');
      await fillSignup(page);

      await expect(formAlert(page)).toContainText(c.expected);
      await expect(toastArea(page).getByText(c.expected)).toBeVisible();
      // El botón vuelve a su estado normal (no se queda en "Creando cuenta...").
      await expect(page.locator('form button[type=submit]')).toHaveText(TXT.es.signupButton);
      await expect(page.locator('form button[type=submit]')).toBeEnabled();
      expect(page.url()).toContain('/signup');
      expect(calls.filter((x) => x.method === 'POST')).toHaveLength(1);
    });
  }

  test('éxito: mensaje verde, email normalizado y redirección a /login', async ({ page }) => {
    const calls = await isolate(page, 'signup', (r, _q, o) => json(r, 200, { success: true, user: { id: 'mock' } }, o), 'es');
    await fillSignup(page, 'QA.Mock@Example.COM');

    await expect(page.getByText(TXT.es.signUpSuccess)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    const post = calls.find((x) => x.method === 'POST');
    expect(post?.body?.email).toBe('qa.mock@example.com');
    expect(post?.body?.full_name).toBe('QA Tester');
    await page.waitForURL('**/login', { timeout: 10_000 });
  });

  test('función colgada: timeout con mensaje claro (~20 s)', async ({ page }) => {
    test.setTimeout(120_000);
    // Nunca responde (el AbortController de invoke corta la petición).
    await isolate(page, 'signup', () => new Promise<void>(() => {}), 'es');
    const t0 = await fillSignup(page);
    await expect(page.locator('form button[type=submit]')).toBeDisabled();

    await expect(formAlert(page)).toContainText(TXT.es.signupTimeout, { timeout: 60_000 });
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeGreaterThan(15_000);
    // 20 s de timeout + margen para máquinas cargadas.
    expect(elapsed).toBeLessThan(40_000);
    await expect(page.locator('form button[type=submit]')).toHaveText(TXT.es.signupButton);
    await expect(page.locator('form button[type=submit]')).toBeEnabled();
  });

  test('EN: mensajes traducidos', async ({ page }) => {
    await isolate(page, 'signup', (r, _q, o) => json(r, 409, { error: 'dup', code: 'EMAIL_ALREADY_REGISTERED' }, o), 'en');
    await fillSignup(page);
    await expect(formAlert(page)).toContainText(TXT.en.emailAlreadyExists);
    await expect(page.locator('form button[type=submit]')).toHaveText(TXT.en.signupButton);
  });
});

// ---------------------------------------------------------------------------
// #12 Recuperación de contraseña
// ---------------------------------------------------------------------------
async function requestRecovery(page: Page, email = 'Usuario.QA@Example.COM') {
  await page.goto('/recovery');
  await page.fill('#email', email);
  await page.locator('form button[type=submit]').click();
}

test.describe('#12 recuperación: errores concretos', () => {
  test('502 EMAIL_SEND_FAILED muestra mensaje específico (no "Algo salió mal")', async ({ page }) => {
    await isolate(page, 'send-password-reset', (r, _q, o) => json(r, 502, { error: 'Could not send password reset email', code: 'EMAIL_SEND_FAILED' }, o), 'es');
    await requestRecovery(page);
    await expect(page.getByRole('alert')).toContainText(TXT.es.recoveryEmailSendFailed);
    await expect(toastArea(page).getByText(TXT.es.recoveryEmailSendFailed)).toBeVisible();
    await expect(page.getByRole('alert')).not.toContainText(TXT.es.serverError);
    await expect(page.locator('form button[type=submit]')).toBeEnabled();
  });

  test('contrato antiguo: 500 "Resend error" también se reconoce', async ({ page }) => {
    await isolate(page, 'send-password-reset', (r, _q, o) => json(r, 500, { error: 'Resend error: {"statusCode":403}', code: 'INTERNAL_ERROR' }, o), 'es');
    await requestRecovery(page);
    await expect(page.getByRole('alert')).toContainText(TXT.es.recoveryEmailSendFailed);
  });

  test('500 desconocido: mensaje genérico', async ({ page }) => {
    await isolate(page, 'send-password-reset', (r, _q, o) => json(r, 500, { error: 'boom', code: 'INTERNAL_ERROR' }, o), 'es');
    await requestRecovery(page);
    await expect(page.getByRole('alert')).toContainText(TXT.es.serverError);
  });

  test('éxito: pantalla "Revisa tu correo" y email en minúsculas', async ({ page }) => {
    const calls = await isolate(page, 'send-password-reset', (r, _q, o) => json(r, 200, { success: true, message: 'If an account exists with this email, you will receive a password reset link.' }, o), 'es');
    await requestRecovery(page);
    await expect(page.getByText(TXT.es.checkEmail)).toBeVisible();
    const post = calls.find((x) => x.method === 'POST');
    expect(post?.body?.email).toBe('usuario.qa@example.com');
    expect(post?.body?.redirectTo).toMatch(/\/recovery$/);
  });

  test('función colgada: timeout con mensaje claro', async ({ page }) => {
    test.setTimeout(120_000);
    await isolate(page, 'send-password-reset', () => new Promise<void>(() => {}), 'es');
    await requestRecovery(page);
    await expect(page.getByRole('alert')).toContainText(TXT.es.recoveryTimeout, { timeout: 60_000 });
    await expect(page.locator('form button[type=submit]')).toBeEnabled();
  });

  test('EN: mensaje de envío fallido traducido', async ({ page }) => {
    await isolate(page, 'send-password-reset', (r, _q, o) => json(r, 502, { error: 'x', code: 'EMAIL_SEND_FAILED' }, o), 'en');
    await requestRecovery(page);
    await expect(page.getByRole('alert')).toContainText(TXT.en.recoveryEmailSendFailed);
  });
});
