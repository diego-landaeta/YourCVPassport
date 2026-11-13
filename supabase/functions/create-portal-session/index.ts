/**
 * create-portal-session
 *
 * Abre el portal de cliente de Stripe (gestionar o cancelar la suscripción,
 * añadir la tarjeta al final de la prueba, descargar facturas).
 *
 * Endpoint: POST /functions/v1/create-portal-session (con JWT)
 * Body:     { owner?: 'profile' | 'company', companyId?: uuid, returnPath?: string, lang?: 'es' | 'en' }
 * 200:      { url }
 * Errores:  { error, code }:
 *   401 unauthorized
 *   400 invalid_request
 *   503 billing_not_configured   sin STRIPE_SECRET_KEY
 *   404 no_billing_account       el titular nunca ha pagado (no tiene cliente en Stripe)
 *   404 company_required / 403 company_forbidden / company_role_required / company_inactive
 *   429 RATE_LIMITED / 502 stripe_error / 500 internal_error
 *
 * Perfil: el usuario del JWT. Empresa: solo OWNER/ADMIN de esa empresa.
 * return_url: origen de la lista blanca de CORS + ruta de RETURN_PATHS.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import Stripe from 'https://esm.sh/stripe@^16.2.0?target=deno&no-check';
import { DEFAULT_APP_ORIGIN, getAllowedOrigin, getCorsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { enforceRateLimit } from '../_shared/ratelimit.ts';
import { defaultReturnPath, resolveReturnPath, stripeSecretConfigured } from '../_shared/stripeProducts.ts';
import {
  bearerToken,
  findCustomerId,
  isOwnerType,
  isStripeError,
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
    const ownerType = body.owner === undefined ? 'profile' : body.owner;
    if (!isOwnerType(ownerType)) return fail(400, 'invalid_request', 'Invalid owner', cors);

    if (!stripeSecretConfigured()) {
      return fail(503, 'billing_not_configured', 'Billing is not configured yet', cors);
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.id) return fail(401, 'unauthorized', 'Invalid or expired session', cors);

    const limited = await enforceRateLimit('billing', [`user:${user.id}`], cors);
    if (limited) return limited;

    let owner: Owner;
    if (ownerType === 'profile') {
      owner = { type: 'profile', id: String(user.id) };
    } else {
      const access = await resolveCompanyAccess(admin, String(user.id), body.companyId, true);
      if (!access.ok) return fail(access.status, access.code, 'Company access denied', cors);
      owner = { type: 'company', id: String(access.company.id) };
    }

    const customerId = await findCustomerId(admin, owner);
    if (!customerId) return fail(404, 'no_billing_account', 'No billing account yet', cors);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: STRIPE_API_VERSION,
    });

    const appOrigin = getAllowedOrigin(req) ?? DEFAULT_APP_ORIGIN;
    const path = resolveReturnPath(body.returnPath, defaultReturnPath(null, owner.type));
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appOrigin}${path}`,
      locale: normalizeLang(body.lang),
    });
    if (!session?.url) throw new Error('Stripe no devolvió la URL del portal');

    return json(200, { url: session.url }, cors);
  } catch (err) {
    if (isStripeError(err)) {
      // Típico: el portal no está activado en Stripe (Settings → Billing → Customer portal).
      const e = err as { type?: string; code?: string };
      console.error(`[portal] Stripe ${e.type} ${e.code ?? ''}`);
      return fail(502, 'stripe_error', 'Payment provider error', cors);
    }
    console.error('[portal] error interno:', (err as Error)?.message ?? String(err));
    return fail(500, 'internal_error', 'Internal error', cors);
  }
});
