/**
 * Issue #3 en la UI: cuenta creada pero pendiente de confirmar.
 *
 * - signup responde 200 { emailSent: false } (Brevo caído): aviso ámbar, sin
 *   redirección a /login y botón "Reenviar correo de confirmación";
 * - signup responde 200 { alreadyPending: true } (alta repetida): aviso y el
 *   botón en espera (el correo acaba de salir);
 * - login con "Email not confirmed": mensaje traducido (antes en inglés fijo)
 *   y el mismo botón;
 * - el botón llama a send-email-confirmation solo con el email (sin userId),
 *   muestra el texto neutro y una cuenta atrás; 429 → "Demasiadas solicitudes".
 *
 * Todo lo que va a `*.supabase.co` se responde en local. Nunca se crea una cuenta.
 *   QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/signup-pendiente.local.spec.ts
 */
import { test, expect, type Page, type Route } from '@playwright/test';

test.use({
  serviceWorkers: 'block',
  proxy: { server: 'http://127.0.0.1:9', bypass: 'localhost,127.0.0.1' },
});
test.describe.configure({ timeout: 120_000 });

// translations/*.ts > dashboard.auth
const TXT = {
  es: {
    accountCreatedEmailNotSent: 'Tu cuenta está creada, pero no hemos podido enviarte el correo de confirmación',
    alreadyPendingResent: 'Ya tenías una cuenta pendiente de confirmar con este correo y te hemos reenviado el enlace',
    emailNotConfirmed: 'Por favor confirma tu correo electrónico antes de iniciar sesión',
    resendButton: 'Reenviar correo de confirmación',
    resendSent: 'Si hay una cuenta pendiente de confirmar con este correo, te hemos enviado un enlace nuevo',
    resendCooldown: /Podrás reenviarlo de nuevo en \d+ s/,
    tooManyRequests: 'Demasiadas solicitudes',
  },
  en: {
    accountCreatedEmailNotSent: "Your account has been created, but we couldn't send you the confirmation email",
    resendButton: 'Resend confirmation email',
    emailNotConfirmed: 'Please confirm your email before logging in',
  },
} as const;

type Responder = (route: Route, origin: string) => Promise<void> | void;
interface Calls { signup: any[]; resend: any[] }

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

async function isolate(page: Page, lang: 'es' | 'en', fns: { signup?: Responder; resend?: Responder; login?: Responder }) {
  const calls: Calls = { signup: [], resend: [] };
  await page.addInitScript((l) => {
    try { localStorage.setItem('language', l); } catch { /* sin storage */ }
  }, lang);
  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const origin = req.headers()['origin'] || 'http://127.0.0.1';
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    if (req.method() === 'OPTIONS') return json(route, 200, 'ok', origin);

    let body: any = null;
    try { body = req.postDataJSON(); } catch { /* sin cuerpo */ }
    if (url.pathname === '/functions/v1/signup') {
      calls.signup.push(body);
      return fns.signup ? fns.signup(route, origin) : json(route, 200, { success: true, emailSent: true, alreadyPending: false }, origin);
    }
    if (url.pathname === '/functions/v1/send-email-confirmation') {
      calls.resend.push(body);
      return fns.resend ? fns.resend(route, origin) : json(route, 200, { success: true }, origin);
    }
    if (url.pathname === '/auth/v1/token' && fns.login) return fns.login(route, origin);
    if (url.pathname.startsWith('/rest/v1/')) return json(route, 200, [], origin);
    return json(route, 200, {}, origin);
  });
  return calls;
}

async function fillSignup(page: Page, email = 'QA.Pendiente@Example.com') {
  await page.goto('/signup');
  await page.fill('#fullName', 'QA Tester');
  await page.fill('#email', email);
  await page.fill('#password', 'Prueba1234');
  await page.fill('#confirmPassword', 'Prueba1234');
  await page.check('#agreeToTerms');
  await page.locator('form button[type=submit]').click();
}

test('alta con correo no enviado: aviso, sin redirección y "Reenviar" funciona', async ({ page }) => {
  const calls = await isolate(page, 'es', {
    signup: (r, o) => json(r, 200, { success: true, emailSent: false, alreadyPending: false }, o),
  });
  await fillSignup(page);

  await expect(page.getByRole('status').filter({ hasText: TXT.es.accountCreatedEmailNotSent })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const resend = page.getByRole('button', { name: TXT.es.resendButton });
  await expect(resend).toBeEnabled();

  await resend.click();
  await expect(page.getByText(TXT.es.resendSent)).toBeVisible();
  await expect(page.getByText(TXT.es.resendCooldown)).toBeVisible();
  await expect(resend).toBeDisabled();
  // Solo el email (normalizado) y el destino; nunca userId.
  expect(calls.resend).toHaveLength(1);
  expect(calls.resend[0].email).toBe('qa.pendiente@example.com');
  expect(calls.resend[0]).not.toHaveProperty('userId');
  expect(calls.resend[0].redirectTo).toMatch(/\/confirm$/);

  // No hay redirección automática a /login (antes a los 3 s).
  await page.waitForTimeout(3500);
  expect(page.url()).toContain('/signup');
});

test('alta repetida de una cuenta pendiente: aviso y botón en espera', async ({ page }) => {
  await isolate(page, 'es', {
    signup: (r, o) => json(r, 200, { success: true, emailSent: true, alreadyPending: true }, o),
  });
  await fillSignup(page);
  await expect(page.getByRole('status').filter({ hasText: TXT.es.alreadyPendingResent })).toBeVisible();
  await expect(page.getByRole('button', { name: TXT.es.resendButton })).toBeDisabled();
  await expect(page.getByText(TXT.es.resendCooldown)).toBeVisible();
});

test('reenvío limitado (429): mensaje claro', async ({ page }) => {
  await isolate(page, 'es', {
    signup: (r, o) => json(r, 200, { success: true, emailSent: false, alreadyPending: false }, o),
    resend: (r, o) => json(r, 429, { error: 'Too many requests', code: 'RATE_LIMITED' }, o),
  });
  await fillSignup(page);
  await page.getByRole('button', { name: TXT.es.resendButton }).click();
  await expect(page.getByText(TXT.es.tooManyRequests)).toBeVisible();
});

test('login sin confirmar: mensaje en español y "Reenviar"', async ({ page }) => {
  const calls = await isolate(page, 'es', {
    login: (r, o) => json(r, 400, { code: 'email_not_confirmed', error_code: 'email_not_confirmed', msg: 'Email not confirmed' }, o),
  });
  await page.goto('/login');
  await page.fill('#email', 'Pendiente@Example.com');
  await page.fill('#password', 'Prueba1234');
  await page.locator('form button[type=submit]').click();

  await expect(page.getByRole('alert')).toContainText(TXT.es.emailNotConfirmed);
  await page.getByRole('button', { name: TXT.es.resendButton }).click();
  await expect(page.getByText(TXT.es.resendSent)).toBeVisible();
  expect(calls.resend[0].email).toBe('pendiente@example.com');
});

test('EN: textos traducidos', async ({ page }) => {
  await isolate(page, 'en', {
    signup: (r, o) => json(r, 200, { success: true, emailSent: false, alreadyPending: false }, o),
  });
  await fillSignup(page);
  await expect(page.getByRole('status').filter({ hasText: TXT.en.accountCreatedEmailNotSent })).toBeVisible();
  await expect(page.getByRole('button', { name: TXT.en.resendButton })).toBeVisible();
});
