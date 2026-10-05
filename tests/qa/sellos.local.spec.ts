import { test, expect, type Page, type Route } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

/**
 * Sello de email (StampsVerificationCodeModal) contra las Edge Functions
 * endurecidas en U4: send-verification-email y verify-email-code.
 *
 * App local (Vite) con sesion y Supabase MOCKEADOS: ninguna peticion sale a
 * produccion. Comprueba que:
 *  - el modal llama a las funciones con el JWT de la sesion;
 *  - ya NO hay "modo de prueba" en el navegador: si la funcion falla no se
 *    inserta ni se actualiza ningun sello desde el cliente y no sale ningun
 *    alert con el codigo;
 *  - los errores { error, code } de la funcion (429, 401, INVALID_CODE...) se
 *    leen del cuerpo de la respuesta y se muestran al usuario.
 */

const USER_ID = '00000000-0000-4000-8000-0000000000b1';

function b64url(o: unknown) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}
const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
const fakeJwt = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: USER_ID, role: 'authenticated', exp, aud: 'authenticated', email: 'qa-sellos@example.test' })}.firma-falsa`;
const user = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'qa-sellos@example.test',
  app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Sara QA' }, created_at: '2026-01-01T00:00:00Z',
};
const session = { access_token: fakeJwt, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'refresh-falso', user };
const profile = {
  id: USER_ID, full_name: 'Sara QA', email: 'qa-sellos@example.test', role: 'professional', plan: 'pro',
  is_active: true, slug: 'sara-qa', headline: 'QA', summary: '', template: 'classic', wizard_completed: true,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

type FnReply = { status: number; body: Record<string, unknown> };
interface Ctx {
  calls: { fn: string; body: Record<string, unknown>; auth: string | undefined }[];
  stampWrites: string[];
  dialogs: string[];
  unmockedSupabase: string[];
  replies: Record<string, FnReply>;
}

async function setup(page: Page, replies: Record<string, FnReply>): Promise<Ctx> {
  const ctx: Ctx = { calls: [], stampWrites: [], dialogs: [], unmockedSupabase: [], replies };

  page.on('dialog', (d) => { ctx.dialogs.push(d.message()); void d.dismiss(); });
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.hostname.endsWith('supabase.co') && r.headers()['x-qa-mock'] !== '1') ctx.unmockedSupabase.push(`${r.request().method()} ${u.pathname}`);
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

    if (url.pathname.startsWith('/functions/v1/')) {
      const fn = url.pathname.replace('/functions/v1/', '');
      if (fn === 'send-verification-email' || fn === 'verify-email-code') {
        ctx.calls.push({ fn, body: (req.postDataJSON() || {}) as Record<string, unknown>, auth: req.headers()['authorization'] });
        const reply = ctx.replies[fn];
        return json(reply.status, reply.body);
      }
      return json(200, {});
    }
    if (url.pathname.startsWith('/auth/v1/user')) return json(200, user);
    if (url.pathname.startsWith('/auth/v1/')) return json(200, {});
    if (url.pathname === '/rest/v1/rpc/check_feature_limit') return json(200, { allowed: true, plan: 'pro', remaining: 'unlimited' });
    if (url.pathname.startsWith('/rest/v1/rpc/')) return json(200, null);
    if (!url.pathname.startsWith('/rest/v1/')) return json(404, {});

    const table = url.pathname.replace('/rest/v1/', '');
    if (method !== 'GET' && method !== 'HEAD') {
      if (table === 'stamps') ctx.stampWrites.push(`${method} ${url.search}`);
      return json(201, []);
    }
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const rowsFor: Record<string, unknown[]> = { profiles: [profile], profiles_full: [profile] };
    const rows = rowsFor[table] ?? [];
    if (method === 'HEAD') return json(200, undefined, { 'content-range': `*/${rows.length}` });
    if (wantsObject) return rows.length ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: 'no rows' });
    return json(200, rows, { 'content-range': rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0' });
  });

  return ctx;
}

// Abre la seccion Verificaciones (via el historial de la app: vale en escritorio
// y en movil) y el modal del sello de email.
async function openEmailModal(page: Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main, #root').first()).toBeVisible({ timeout: 100_000 });
  const card = page.getByRole('button', { name: /Verifica tu dirección de correo/ });
  await expect(async () => {
    await page.evaluate(() => {
      window.history.pushState({ section: 'stamps' }, '');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { section: 'stamps' } }));
    });
    await expect(card).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 100_000 });
  await card.click();
  await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();
}

test.describe('Sello de email via Edge Functions (sin modo de prueba en el navegador)', () => {
  test.use(SAFE_CONTEXT_OPTIONS);
  test.describe.configure({ timeout: 150_000 });

  test('envio y verificacion correctos: llaman a las funciones con el JWT y no escriben sellos desde el cliente', async ({ page }) => {
    const ctx = await setup(page, {
      'send-verification-email': { status: 200, body: { success: true, message: 'ok', stampId: 'st-1', emailId: 'e-1' } },
      'verify-email-code': { status: 200, body: { success: true, message: 'Email verified successfully', stampId: 'st-1' } },
    });
    await openEmailModal(page);

    await page.getByPlaceholder('tu@email.com').fill('sara@example.com');
    await page.getByRole('button', { name: 'Enviar Código' }).click();
    await expect(page.getByPlaceholder('000000')).toBeVisible();

    const send = ctx.calls.find((c) => c.fn === 'send-verification-email')!;
    expect(send.auth).toBe(`Bearer ${fakeJwt}`);
    expect(send.body).toEqual({ email: 'sara@example.com', userId: USER_ID });

    await page.getByPlaceholder('000000').fill('123456');
    await page.getByRole('button', { name: 'Verificar Código' }).click();
    await expect(page.getByPlaceholder('000000')).toBeHidden();

    const verify = ctx.calls.find((c) => c.fn === 'verify-email-code')!;
    expect(verify.auth).toBe(`Bearer ${fakeJwt}`);
    expect(verify.body).toEqual({ code: '123456', userId: USER_ID });
    expect(ctx.stampWrites).toEqual([]);
    expect(ctx.dialogs).toEqual([]);
    expect(ctx.unmockedSupabase).toEqual([]);
  });

  test('429 al enviar: muestra el aviso de limite, sin alert con codigo ni sello creado en el navegador', async ({ page }) => {
    const ctx = await setup(page, {
      'send-verification-email': { status: 429, body: { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' } },
      'verify-email-code': { status: 200, body: { success: true } },
    });
    await openEmailModal(page);

    await page.getByPlaceholder('tu@email.com').fill('sara@example.com');
    await page.getByRole('button', { name: 'Enviar Código' }).click();

    await expect(page.getByText('Has excedido el límite de intentos.', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder('000000')).toHaveCount(0);
    expect(ctx.stampWrites).toEqual([]);
    expect(ctx.dialogs).toEqual([]);
  });

  test('401 al enviar: pide volver a iniciar sesion', async ({ page }) => {
    const ctx = await setup(page, {
      'send-verification-email': { status: 401, body: { error: 'Invalid or expired session', code: 'UNAUTHORIZED' } },
      'verify-email-code': { status: 200, body: { success: true } },
    });
    await openEmailModal(page);

    await page.getByPlaceholder('tu@email.com').fill('sara@example.com');
    await page.getByRole('button', { name: 'Enviar Código' }).click();

    await expect(page.getByText('Tu sesión ha caducado. Vuelve a iniciar sesión.')).toBeVisible();
    expect(ctx.stampWrites).toEqual([]);
    expect(ctx.dialogs).toEqual([]);
  });

  test('codigo incorrecto: muestra intentos restantes y no actualiza el sello desde el cliente', async ({ page }) => {
    const ctx = await setup(page, {
      'send-verification-email': { status: 200, body: { success: true, stampId: 'st-1' } },
      'verify-email-code': { status: 400, body: { error: 'Invalid verification code', code: 'INVALID_CODE', attemptsRemaining: 3 } },
    });
    await openEmailModal(page);

    await page.getByPlaceholder('tu@email.com').fill('sara@example.com');
    await page.getByRole('button', { name: 'Enviar Código' }).click();
    await page.getByPlaceholder('000000').fill('000000');
    await page.getByRole('button', { name: 'Verificar Código' }).click();

    await expect(page.getByText('Código incorrecto. Por favor verifica e intenta nuevamente. (3 intentos restantes)')).toBeVisible();
    await expect(page.getByPlaceholder('000000')).toBeVisible();
    expect(ctx.stampWrites).toEqual([]);
    expect(ctx.dialogs).toEqual([]);
  });

  test('codigo caducado: pide uno nuevo', async ({ page }) => {
    await setup(page, {
      'send-verification-email': { status: 200, body: { success: true, stampId: 'st-1' } },
      'verify-email-code': { status: 400, body: { error: 'expired', code: 'CODE_EXPIRED' } },
    });
    await openEmailModal(page);

    await page.getByPlaceholder('tu@email.com').fill('sara@example.com');
    await page.getByRole('button', { name: 'Enviar Código' }).click();
    await page.getByPlaceholder('000000').fill('123456');
    await page.getByRole('button', { name: 'Verificar Código' }).click();

    await expect(page.getByText('El código ha expirado. Por favor solicita uno nuevo.')).toBeVisible();
  });
});
