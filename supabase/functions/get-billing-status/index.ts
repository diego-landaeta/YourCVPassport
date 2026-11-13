/**
 * get-billing-status
 *
 * Estado de pago de quien llama, para que el frontend sepa qué botón enseñar
 * («Prueba gratis», «Gestionar suscripción»...) y los días de prueba que quedan.
 *
 * Endpoint: POST /functions/v1/get-billing-status (con JWT)
 * Body:     { companyId?: uuid }  (opcional; sin él, la empresa del usuario si tiene)
 * 200: {
 *   enabled: boolean,                         // hay STRIPE_SECRET_KEY
 *   configured: { [productKey]: boolean },    // solo booleanos, nunca price IDs
 *   profile: { plan, trialAvailable, hasBillingAccount, subscription: Sub | null },
 *   company: null | { id, role, canManage, plan, hasBillingAccount, subscription: Sub | null }
 * }
 * Sub = { productKey, status, trialEnd, currentPeriodEnd, cancelAtPeriodEnd }
 *
 * Solo lee (service_role, filtrando SIEMPRE por el usuario del JWT). Si las
 * tablas de pagos aún no existen o falla una lectura, responde igual con
 * subscription null: el frontend se comporta como sin pagos.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { getCorsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { configuredProducts, stripeSecretConfigured } from '../_shared/stripeProducts.ts';
import {
  bearerToken,
  findCustomerId,
  hasAnySubscriptionRow,
  liveSubscriptionRows,
  readJsonObject,
  resolveCompanyAccess,
  type Admin,
  type Owner,
  type SubscriptionRow,
} from '../_shared/billing.ts';

function json(status: number, body: Record<string, unknown>, cors: Record<string, string>, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', ...extra },
  });
}

interface SubInfo {
  productKey: string | null
  status: string
  trialEnd: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

/** La suscripción viva más reciente (normalmente solo hay una). */
function mainSubscription(rows: SubscriptionRow[]): SubInfo | null {
  if (!rows.length) return null
  const r = [...rows].sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')))[0]
  return {
    productKey: r.product_key ?? null,
    status: r.status,
    trialEnd: r.trial_end ?? null,
    currentPeriodEnd: r.current_period_end ?? null,
    cancelAtPeriodEnd: r.cancel_at_period_end === true,
  }
}

async function ownerState(admin: Admin, owner: Owner): Promise<{ subscription: SubInfo | null; hasBillingAccount: boolean; everSubscribed: boolean }> {
  try {
    const [rows, customerId, ever] = await Promise.all([
      liveSubscriptionRows(admin, owner),
      findCustomerId(admin, owner),
      hasAnySubscriptionRow(admin, owner),
    ])
    return { subscription: mainSubscription(rows), hasBillingAccount: !!customerId, everSubscribed: ever }
  } catch (err) {
    // Tablas de 20261104 sin aplicar o fallo puntual: como si no hubiera pagos.
    console.error(`[billing-status] lectura de ${owner.type} fallida:`, (err as Error)?.message ?? String(err))
    return { subscription: null, hasBillingAccount: false, everSubscribed: false }
  }
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(req);

  if (origin && !isAllowedOrigin(origin)) {
    return json(403, { error: 'Origin not allowed', code: 'origin_not_allowed' }, cors);
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed', code: 'method_not_allowed' }, cors, { Allow: 'POST, OPTIONS' });
  }

  try {
    const token = bearerToken(req);
    if (!token) return json(401, { error: 'Missing authorization', code: 'unauthorized' }, cors);

    const body = (await readJsonObject(req)) ?? {};

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.id) return json(401, { error: 'Invalid or expired session', code: 'unauthorized' }, cors);
    const userId = String(user.id);

    const { data: profileRow } = await admin.from('profiles').select('plan').eq('id', userId).maybeSingle();
    const profileOwner: Owner = { type: 'profile', id: userId };
    const profileState = await ownerState(admin, profileOwner);

    let company: Record<string, unknown> | null = null;
    try {
      const access = await resolveCompanyAccess(admin, userId, body.companyId, false);
      if (access.ok) {
        const state = await ownerState(admin, { type: 'company', id: String(access.company.id) });
        company = {
          id: access.company.id,
          role: access.role,
          canManage: access.canManage,
          plan: access.company.plan ?? 'none',
          hasBillingAccount: state.hasBillingAccount,
          subscription: state.subscription,
        };
      }
    } catch (err) {
      console.error('[billing-status] empresa:', (err as Error)?.message ?? String(err));
    }

    return json(200, {
      enabled: stripeSecretConfigured(),
      configured: configuredProducts(),
      profile: {
        plan: String(profileRow?.plan ?? 'free').toLowerCase(),
        trialAvailable: !profileState.everSubscribed,
        hasBillingAccount: profileState.hasBillingAccount,
        subscription: profileState.subscription,
      },
      company,
    }, cors);
  } catch (err) {
    console.error('[billing-status] error interno:', (err as Error)?.message ?? String(err));
    return json(500, { error: 'Internal error', code: 'internal_error' }, cors);
  }
});
