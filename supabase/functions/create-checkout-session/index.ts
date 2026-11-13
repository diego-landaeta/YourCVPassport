/**
 * create-checkout-session
 *
 * Abre una Stripe Checkout Session para un producto del catálogo
 * (_shared/stripeProducts.ts): plan Profesional, planes de empresa Starter /
 * Growth o un pack de créditos.
 *
 * Endpoint: POST /functions/v1/create-checkout-session (con JWT)
 * Body:     { product: ProductKey, companyId?: uuid, returnPath?: string, lang?: 'es' | 'en',
 *             attempt?: string (id por clic, para la idempotency key) }
 * 200:      { url }  -> el frontend redirige a Stripe
 * Errores:  { error, code } con `code` estable (el frontend decide por `code`):
 *   401 unauthorized              sin JWT o JWT inválido
 *   400 invalid_request / invalid_product
 *   503 billing_not_configured    falta STRIPE_SECRET_KEY o el secreto del price:
 *                                 el frontend vuelve al comportamiento de antes
 *   503 price_unavailable         el price no existe, está archivado o NO coincide
 *                                 con el catálogo (importe, moneda, intervalo)
 *   404 company_required          producto de empresa y el usuario no tiene empresa
 *   403 company_forbidden / company_role_required / company_inactive
 *   409 already_subscribed        ya tiene una suscripción viva de ese tipo: al portal
 *   429 RATE_LIMITED
 *   502 stripe_error / 500 internal_error
 *
 * Garantías:
 * - Identidad SIEMPRE del JWT (auth.getUser(token)), nunca del body. Un perfil
 *   solo paga para sí mismo; una empresa, solo un OWNER/ADMIN suyo.
 * - El cliente solo elige la clave del producto: el price ID sale de los
 *   secretos y se comprueba en Stripe contra el catálogo antes de cobrar.
 * - Prueba de 14 días del plan Profesional SIN tarjeta (payment_method_collection
 *   'if_required'; si acaba sin tarjeta, Stripe cancela la suscripción). Una sola
 *   prueba por perfil: no hay prueba si el perfil ha tenido alguna suscripción.
 * - success_url / cancel_url: origen de la lista blanca de CORS + ruta de la
 *   lista blanca de stripeProducts.ts (RETURN_PATHS).
 * - Idempotency keys en Stripe (cliente y sesión): un doble clic no duplica nada.
 * - Rate limit por usuario (_shared/ratelimit.ts, 'billing').
 * - Ningún detalle interno (mensajes de Stripe o de la base) sale al cliente.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import Stripe from 'https://esm.sh/stripe@^16.2.0?target=deno&no-check';
import { DEFAULT_APP_ORIGIN, getAllowedOrigin, getCorsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { enforceRateLimit } from '../_shared/ratelimit.ts';
import {
  BILLING_PRODUCTS,
  defaultReturnPath,
  isBillingConfigured,
  isProductKey,
  priceIdFor,
  priceMatchesProduct,
  resolveReturnPath,
} from '../_shared/stripeProducts.ts';
import {
  bearerToken,
  getOrCreateCustomer,
  hasAnySubscriptionRow,
  isStripeError,
  liveStripeSubscriptionIds,
  liveSubscriptionRows,
  normalizeLang,
  readJsonObject,
  resolveCompanyAccess,
  type Owner,
} from '../_shared/billing.ts';

const STRIPE_API_VERSION = '2024-06-20';

function json(status: number, body: Record<string, unknown>, cors: Record<string, string>, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', ...extra },
  });
}

function fail(status: number, code: string, message: string, cors: Record<string, string>): Response {
  return json(status, { error: message, code }, cors);
}

async function shortHash(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(req);

  if (origin && !isAllowedOrigin(origin)) {
    return fail(403, 'origin_not_allowed', 'Origin not allowed', cors);
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed', code: 'method_not_allowed' }, cors, { Allow: 'POST, OPTIONS' });
  }

  try {
    const token = bearerToken(req);
    if (!token) return fail(401, 'unauthorized', 'Missing authorization', cors);

    const body = await readJsonObject(req);
    if (!body) return fail(400, 'invalid_request', 'Invalid JSON body', cors);
    if (!isProductKey(body.product)) return fail(400, 'invalid_product', 'Unknown product', cors);
    const product = BILLING_PRODUCTS[body.product];

    // Sin clave de Stripe o sin price: los pagos aún no están activos (no es un error).
    if (!isBillingConfigured(product.key)) {
      return fail(503, 'billing_not_configured', 'Billing is not configured yet', cors);
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---- Identidad: del JWT, nunca del body ----
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.id) return fail(401, 'unauthorized', 'Invalid or expired session', cors);

    const limited = await enforceRateLimit('billing', [`user:${user.id}`], cors);
    if (limited) return limited;

    const lang = normalizeLang(body.lang);

    // ---- Titular del pago ----
    let owner: Owner;
    let customerDetails: { email?: string | null; name?: string | null; preferredLocale?: string | null };
    if (product.kind === 'profile') {
      owner = { type: 'profile', id: String(user.id) };
      const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      customerDetails = { email: user.email ?? null, name: profile?.full_name ?? null, preferredLocale: lang };
    } else {
      const access = await resolveCompanyAccess(admin, String(user.id), body.companyId, true);
      if (!access.ok) return fail(access.status, access.code, 'Company access denied', cors);
      owner = { type: 'company', id: String(access.company.id) };
      customerDetails = { email: access.company.company_email, name: access.company.company_name, preferredLocale: lang };
    }

    // ---- Una suscripción viva por tipo: si ya hay, al portal (no se cobra dos veces) ----
    if (product.mode === 'subscription' && (await liveSubscriptionRows(admin, owner)).length > 0) {
      return fail(409, 'already_subscribed', 'There is already an active subscription', cors);
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: STRIPE_API_VERSION,
    });

    // ---- El price del secreto tiene que ser el del catálogo ----
    const priceId = priceIdFor(product.key)!;
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
    } catch (err) {
      if (isStripeError(err) && (err as { code?: string }).code === 'resource_missing') {
        console.error(`[checkout] ${product.envVar} apunta a un price que no existe en la cuenta de STRIPE_SECRET_KEY`);
        return fail(503, 'price_unavailable', 'Price not available', cors);
      }
      throw err;
    }
    const check = priceMatchesProduct(price, product);
    if (!check.ok) {
      console.error(`[checkout] ${product.envVar} no coincide con el catálogo (${product.key}): ${check.reason}`);
      return fail(503, 'price_unavailable', 'Price not available', cors);
    }

    // ---- Cliente de Stripe y comprobación en Stripe (cubre el hueco antes del webhook) ----
    const customerId = await getOrCreateCustomer(admin, stripe, owner, customerDetails);
    let trialDays = 0;
    if (product.mode === 'subscription') {
      const inStripe = await liveStripeSubscriptionIds(stripe, customerId);
      if (inStripe.live.length > 0) {
        return fail(409, 'already_subscribed', 'There is already an active subscription', cors);
      }
      if (product.trialDays > 0 && !inStripe.any && !(await hasAnySubscriptionRow(admin, owner))) {
        trialDays = product.trialDays;
      }
    }

    // ---- Checkout ----
    const appOrigin = getAllowedOrigin(req) ?? DEFAULT_APP_ORIGIN;
    const path = resolveReturnPath(body.returnPath, defaultReturnPath(product, owner.type));
    const metadata: Record<string, string> = {
      owner_type: owner.type,
      owner_id: owner.id,
      product_key: product.key,
      user_id: String(user.id),
    };

    // deno-lint-ignore no-explicit-any
    const params: Record<string, any> = {
      mode: product.mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appOrigin}${path}?checkout=ok`,
      cancel_url: `${appOrigin}${path}?checkout=cancel`,
      client_reference_id: owner.id,
      locale: lang,
      metadata,
    };
    if (product.mode === 'subscription') {
      params.subscription_data = { metadata };
      if (trialDays > 0) {
        params.subscription_data.trial_period_days = trialDays;
        // Si la prueba acaba sin tarjeta, Stripe cancela la suscripción (y el
        // webhook devuelve el perfil a 'free').
        params.subscription_data.trial_settings = { end_behavior: { missing_payment_method: 'cancel' } };
        params.payment_method_collection = 'if_required';
      }
    } else {
      params.payment_intent_data = { metadata };
      // Factura del pago único (la piden las empresas).
      params.invoice_creation = { enabled: true, invoice_data: { metadata } };
    }

    // Idempotencia: el frontend manda un `attempt` por clic (doble clic o reintento
    // de red = misma sesión). Sin él, tramo de 1 minuto. No vale un tramo largo: un
    // segundo pack comprado poco después recibiría la sesión ya pagada.
    const attempt = typeof body.attempt === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(body.attempt)
      ? body.attempt
      : String(Math.floor(Date.now() / 60_000));
    const idempotencyKey = `checkout-${owner.type}-${owner.id}-${product.key}-${attempt}-${await shortHash(params)}`;
    const session = await stripe.checkout.sessions.create(params, { idempotencyKey });
    if (!session?.url) throw new Error('Stripe no devolvió la URL de la sesión');

    return json(200, { url: session.url }, cors);
  } catch (err) {
    if (isStripeError(err)) {
      const e = err as { type?: string; code?: string };
      console.error(`[checkout] Stripe ${e.type} ${e.code ?? ''}`);
      return fail(502, 'stripe_error', 'Payment provider error', cors);
    }
    console.error('[checkout] error interno:', (err as Error)?.message ?? String(err));
    return fail(500, 'internal_error', 'Internal error', cors);
  }
});
