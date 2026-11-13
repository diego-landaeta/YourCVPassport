import { test, expect, type Page, type Route } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

/**
 * Pagos con Stripe en el frontend (lib/billingApi.ts, hooks/useBilling.ts).
 *
 * App local (Vite) con sesión y Supabase MOCKEADOS (nada sale a producción ni a
 * Stripe: checkout.stripe.com y billing.stripe.com se sirven aquí). Comprueba que:
 *  - sin sesión, el plan de pago sigue abriendo el alta (como antes);
 *  - con sesión, el navegador solo manda la CLAVE del producto (nunca un price ni
 *    un importe) y redirige a la URL de Stripe que devuelve la función;
 *  - con los pagos sin activar (503 billing_not_configured) sale el aviso «muy
 *    pronto» y no se va a ningún sitio;
 *  - con suscripción viva el botón pasa a «Gestionar suscripción» y abre el portal;
 *  - el anual de empresa muestra lo que cobra Stripe (950,40 €) y manda starter_annual;
 *  - la página de créditos muestra euros y compra por Checkout (sin UPDATE directo);
 *  - ?checkout=ok enseña el aviso y se quita de la URL.
 *
 *   QA_PORT=5320 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/pagos.local.spec.ts --project=chromium
 */

test.use(SAFE_CONTEXT_OPTIONS);

const USER_ID = '00000000-0000-4000-8000-0000000000b7';
const COMPANY_ID = 'c0c0c0c0-0000-4000-8000-0000000000b7';

function b64url(o: unknown) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}
const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
const fakeJwt = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: USER_ID, role: 'authenticated', exp, aud: 'authenticated', email: 'qa-pagos@example.test' })}.firma-falsa`;
const user = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'qa-pagos@example.test',
  app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Pablo QA' }, created_at: '2026-01-01T00:00:00Z',
};
const session = { access_token: fakeJwt, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'refresh-falso', user };

const baseProfile = {
  id: USER_ID, full_name: 'Pablo QA', email: 'qa-pagos@example.test', role: 'professional', plan: 'free', is_premium: false,
  is_active: true, slug: 'pablo-qa', headline: 'QA', summary: '', country_code: 'ES', template: 'classic', wizard_completed: true,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};
const company = {
  id: COMPANY_ID, company_name: 'Acme QA', legal_name: 'Acme QA SL', status: 'APPROVED', credit_balance: 25,
  total_credits_purchased: 0, total_credits_used: 0, created_by: USER_ID, created_at: '2026-01-01T00:00:00Z',
};

type Json = Record<string, any>;
interface Setup {
  loggedIn?: boolean;
  withCompany?: boolean;
  billingStatus?: Json | null;
  checkout?: { status: number; body: Json };
  portal?: { status: number; body: Json };
}
interface Ctx {
  fnCalls: { name: string; body: Json; auth?: string }[];
  writes: string[];
  stripeVisits: string[];
}

const NOT_CONFIGURED = { status: 503, body: { error: 'Billing is not configured yet', code: 'billing_not_configured' } };
const CHECKOUT_OK = { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_qa' } };
const PORTAL_OK = { status: 200, body: { url: 'https://billing.stripe.com/p/session/test_qa' } };

function statusWith(sub: Json | null, company: Json | null = null, trialAvailable = true) {
  return {
    enabled: true,
    configured: { pro_monthly: true, pro_annual: true, starter_monthly: true, starter_annual: true, growth_monthly: true, growth_annual: true, credits_50: true, credits_150: true, credits_300: true, credits_1000: true },
    profile: { plan: sub ? 'pro' : 'free', trialAvailable, hasBillingAccount: !!sub, subscription: sub },
    company,
  };
}

async function setup(page: Page, opts: Setup = {}): Promise<Ctx> {
  const ctx: Ctx = { fnCalls: [], writes: [], stripeVisits: [] };
  const loggedIn = opts.loggedIn !== false;
  const profile = { ...baseProfile, ...(opts.billingStatus?.profile?.subscription ? { plan: 'pro', is_premium: true } : {}) };

  await page.addInitScript(([s, logged]) => {
    if (logged) localStorage.setItem('yourcvpassport-auth', JSON.stringify(s));
    localStorage.setItem('language', 'es');
    localStorage.setItem('theme', 'light');
  }, [session, loggedIn] as const);

  await page.routeWebSocket(/.*/, (ws) => ws.close());
  await page.route('**/*', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, body: '' });
      return route.continue();
    }
    if (url.hostname === 'checkout.stripe.com' || url.hostname === 'billing.stripe.com') {
      ctx.stripeVisits.push(req.url());
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Stripe QA</title><h1>Stripe QA</h1>' });
    }
    if (!url.hostname.endsWith('supabase.co')) return route.abort();

    const origin = req.headers()['origin'] || '*';
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': req.headers()['access-control-request-headers'] || 'authorization, x-client-info, apikey, content-type, range, prefer, accept-profile, content-profile',
      'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, HEAD, OPTIONS',
      'access-control-expose-headers': 'content-range',
    };
    const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
      route.fulfill({ status, contentType: 'application/json', headers: { ...cors, ...headers }, body: body === undefined ? '' : JSON.stringify(body) });
    const method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });

    if (url.pathname.startsWith('/functions/v1/')) {
      const name = url.pathname.replace('/functions/v1/', '');
      let body: Json = {};
      try { body = req.postDataJSON() || {}; } catch { /* sin cuerpo */ }
      ctx.fnCalls.push({ name, body, auth: req.headers()['authorization'] });
      if (name === 'get-billing-status') return opts.billingStatus ? json(200, opts.billingStatus) : json(503, { code: 'billing_not_configured' });
      if (name === 'create-checkout-session') {
        const r = opts.checkout ?? NOT_CONFIGURED;
        return json(r.status, r.body);
      }
      if (name === 'create-portal-session') {
        const r = opts.portal ?? PORTAL_OK;
        return json(r.status, r.body);
      }
      return json(200, {});
    }
    if (url.pathname.startsWith('/auth/v1/user')) return loggedIn ? json(200, user) : json(401, {});
    if (url.pathname.startsWith('/auth/v1/')) return json(200, {});
    if (url.pathname.startsWith('/rest/v1/rpc/')) return json(200, []);
    if (!url.pathname.startsWith('/rest/v1/')) return json(404, {});
    if (method !== 'GET' && method !== 'HEAD') {
      ctx.writes.push(`${method} ${url.pathname}`);
      return json(201, []);
    }

    const table = url.pathname.replace('/rest/v1/', '');
    const rowsFor: Record<string, unknown[]> = {
      profiles: loggedIn ? [profile] : [],
      profiles_full: loggedIn ? [profile] : [],
      company_users: opts.withCompany ? [{ id: 'cu1', company_id: COMPANY_ID, user_id: USER_ID, role: 'OWNER' }] : [],
      companies_full: opts.withCompany ? [company] : [],
      company_credits_history: [],
    };
    const rows = rowsFor[table] ?? [];
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    if (method === 'HEAD') return json(200, undefined, { 'content-range': `*/${rows.length}` });
    if (wantsObject) return rows.length ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: 'no rows' });
    return json(200, rows, { 'content-range': rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0' });
  });
  return ctx;
}

const proButton = (page: Page) => page.locator('#pricing').getByRole('button', { name: /Inicia prueba gratuita de 14 días|Gestionar suscripción|Contratar el plan Profesional/ });

test('sin sesión: el plan Profesional abre el alta y no llama a Stripe', async ({ page }) => {
  const ctx = await setup(page, { loggedIn: false });
  await page.goto('/precios');
  await proButton(page).click();
  // openModal('signup') lleva a /signup (AuthContext)
  await expect(page).toHaveURL(/\/signup$/);
  expect(ctx.fnCalls.filter((c) => c.name === 'create-checkout-session')).toHaveLength(0);
  expect(ctx.stripeVisits).toHaveLength(0);
});

test('pagos sin activar (503): aviso «muy pronto» y no se sale de la página', async ({ page }) => {
  const ctx = await setup(page, { billingStatus: null, checkout: NOT_CONFIGURED });
  await page.goto('/precios');
  await proButton(page).click();
  await expect(page.getByText('Los pagos estarán disponibles muy pronto.')).toBeVisible();
  await expect(page).toHaveURL(/\/precios$/);
  expect(ctx.stripeVisits).toHaveLength(0);
});

test('con sesión: manda solo la clave del producto (mensual / anual) y redirige a Stripe Checkout', async ({ page }) => {
  const ctx = await setup(page, { billingStatus: statusWith(null), checkout: CHECKOUT_OK });
  await page.goto('/precios');
  await page.locator('label[for="billing-toggle"]').click();
  await proButton(page).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/);
  const call = ctx.fnCalls.find((c) => c.name === 'create-checkout-session')!;
  expect(call.body.product).toBe('pro_annual');
  expect(call.auth).toBe(`Bearer ${fakeJwt}`);
  expect(Object.keys(call.body).sort()).toEqual(['attempt', 'lang', 'product', 'returnPath']);
  expect(call.body.returnPath).toBe('/precios');
  expect(JSON.stringify(call.body)).not.toMatch(/price_|amount|userId|owner/);
});

test('con suscripción en prueba: «Gestionar suscripción» abre el portal de Stripe', async ({ page }) => {
  const sub = { productKey: 'pro_monthly', status: 'trialing', trialEnd: new Date(Date.now() + 5 * 86400000).toISOString(), currentPeriodEnd: null, cancelAtPeriodEnd: false };
  const ctx = await setup(page, { billingStatus: statusWith(sub, null, false), portal: PORTAL_OK });
  await page.goto('/precios');
  const btn = page.locator('#pricing').getByRole('button', { name: 'Gestionar suscripción' });
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page).toHaveURL(/billing\.stripe\.com/);
  expect(ctx.fnCalls.find((c) => c.name === 'create-portal-session')!.body.owner).toBe('profile');
  expect(ctx.fnCalls.filter((c) => c.name === 'create-checkout-session')).toHaveLength(0);
});

test('ya tuvo la prueba: el botón dice «Contratar el plan Profesional» (no promete prueba)', async ({ page }) => {
  await setup(page, { billingStatus: statusWith(null, null, false) });
  await page.goto('/precios');
  await expect(page.locator('#pricing').getByRole('button', { name: 'Contratar el plan Profesional' })).toBeVisible();
});

test('vuelta de Stripe (?checkout=ok): aviso de éxito y el parámetro desaparece', async ({ page }) => {
  await setup(page, { billingStatus: statusWith(null) });
  await page.goto('/precios?checkout=ok');
  await expect(page.getByText('¡Listo! Tu plan se activará en unos segundos.')).toBeVisible();
  await expect(page).toHaveURL(/\/precios$/);
});

test('planes de empresa: el anual muestra 950,40 € (lo que cobra Stripe) y compra starter_annual', async ({ page }) => {
  const ctx = await setup(page, {
    withCompany: true,
    billingStatus: statusWith(null, { id: COMPANY_ID, role: 'OWNER', canManage: true, plan: 'none', hasBillingAccount: false, subscription: null }),
    checkout: CHECKOUT_OK,
  });
  await page.goto('/empresas/planes');
  await page.locator('label[for="billing-toggle-company"]').click();
  await expect(page.getByText('€950,40', { exact: true })).toBeVisible();
  await expect(page.getByText('€2390,40', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar' }).first().click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/);
  const call = ctx.fnCalls.find((c) => c.name === 'create-checkout-session')!;
  expect(call.body.product).toBe('starter_annual');
  expect(call.body.companyId).toBe(COMPANY_ID);
});

test('créditos: precios en euros y compra por Checkout, sin UPDATE directo del saldo', async ({ page }) => {
  const ctx = await setup(page, {
    withCompany: true,
    billingStatus: statusWith(null),
    checkout: CHECKOUT_OK,
  });
  await page.goto('/company/credits');
  await expect(page.getByText('€49', { exact: true })).toBeVisible();
  await expect(page.getByText('€699', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('$49');
  const buy = page.getByRole('button', { name: /Comprar|Purchase/ }).first();
  await buy.click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/);
  const call = ctx.fnCalls.find((c) => c.name === 'create-checkout-session')!;
  expect(call.body.product).toBe('credits_50');
  expect(call.body.companyId).toBe(COMPANY_ID);
  expect(call.body.returnPath).toBe('/company/credits');
  expect(ctx.writes.filter((w) => /companies|company_credits_history|company_activity_log/.test(w))).toEqual([]);
});
