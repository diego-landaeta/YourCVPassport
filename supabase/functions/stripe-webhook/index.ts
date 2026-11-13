/**
 * stripe-webhook
 *
 * Recibe los eventos de Stripe y actualiza la base (con service_role):
 * suscripciones, plan del perfil / de la empresa y créditos pagados.
 *
 * Despliegue: `supabase functions deploy stripe-webhook --no-verify-jwt`
 * (Stripe no manda JWT; la única barrera es la firma, que se comprueba siempre).
 * URL y eventos que hay que dar de alta en Stripe: docs/pagos-stripe.md.
 *
 * Eventos:
 *   checkout.session.completed / checkout.session.async_payment_succeeded
 *       pago único pagado -> créditos del pack (RPC add_company_credits_from_payment,
 *       referencia = id de la sesión); suscripción -> sincroniza la suscripción.
 *   customer.subscription.created / updated / deleted / paused / resumed
 *       sincroniza billing_subscriptions y el plan (profiles.plan pro/free,
 *       companies.plan starter/growth/none). Un perfil solo vuelve a free si no le
 *       queda otra suscripción viva.
 *   customer.subscription.trial_will_end
 *       sincroniza y manda el correo de fin de prueba (ES/EN según el perfil).
 *   invoice.paid
 *       sincroniza; si es de un plan de empresa (alta o renovación), abona los
 *       créditos del periodo (referencia = id de la factura).
 *   invoice.payment_failed
 *       sincroniza (past_due / unpaid) y lo deja en el log.
 *
 * Garantías:
 * - Firma verificada con constructEventAsync y STRIPE_WEBHOOK_SECRET: 400 si no vale.
 * - Idempotente: processed_webhook_events (PK = event.id). Un evento repetido
 *   responde 200 sin hacer nada. Si el proceso falla se libera el evento y se
 *   responde 500 para que Stripe reintente. Los abonos de créditos son además
 *   idempotentes por referencia en la base.
 * - El estado de la suscripción se vuelve a leer de Stripe (no se fía del orden de
 *   llegada de los eventos).
 * - Al exterior solo sale { received } o un texto genérico; el detalle, al log
 *   (sin datos personales ni claves).
 * - Sin STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET responde 503 (pagos sin activar).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import Stripe from 'https://esm.sh/stripe@^16.2.0?target=deno&no-check';
import { isAllowedOrigin } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { BRAND } from '../_shared/emailLayout.ts';
import {
  BILLING_PRODUCTS,
  centsToEuros,
  isProductKey,
  productKeyForPriceId,
  stripeSecretConfigured,
  type ProductKey,
} from '../_shared/stripeProducts.ts';
import {
  isStripeError,
  liveSubscriptionRows,
  normalizeLang,
  ownerFromMetadata,
  type Admin,
  type Owner,
  type StripeClient,
} from '../_shared/billing.ts';
import {
  invoicePriceId,
  invoiceSubscriptionId,
  shouldGrantPeriodCredits,
  subscriptionSnapshot,
  targetCompanyPlan,
  targetProfilePlan,
  type SubscriptionSnapshot,
} from './planSync.ts';
import { trialEndingEmail } from './billingEmails.ts';

const STRIPE_API_VERSION = '2024-06-20';

// deno-lint-ignore no-explicit-any
type AnyObj = any;

function text(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

function ok(body: Record<string, unknown> = { received: true }): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function appUrl(): string {
  const env = (Deno.env.get('APP_URL') ?? '').trim().replace(/\/+$/, '');
  return env && isAllowedOrigin(env) ? env : BRAND.url;
}

interface Ctx {
  admin: Admin
  stripe: StripeClient
  eventId: string
}

// -----------------------------------------------------------------------------
// Idempotencia
// -----------------------------------------------------------------------------

/** true si el evento es nuevo; false si ya estaba procesado (23505). */
async function claimEvent(admin: Admin, eventId: string, type: string): Promise<boolean> {
  const { error } = await admin.from('processed_webhook_events').insert({ event_id: eventId, type });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

async function releaseEvent(admin: Admin, eventId: string): Promise<void> {
  try {
    await admin.from('processed_webhook_events').delete().eq('event_id', eventId);
  } catch (err) {
    console.error('[stripe-webhook] no se pudo liberar el evento:', (err as Error)?.message ?? String(err));
  }
}

// -----------------------------------------------------------------------------
// Titular, cliente y plan
// -----------------------------------------------------------------------------

async function ownerForCustomer(admin: Admin, customerId: string | null): Promise<Owner | null> {
  if (!customerId) return null;
  const { data, error } = await admin
    .from('billing_customers')
    .select('owner_type, owner_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (error) throw error;
  return data ? ownerFromMetadata(data) : null;
}

async function ownerForSubscriptionRow(admin: Admin, subscriptionId: string): Promise<Owner | null> {
  const { data, error } = await admin
    .from('billing_subscriptions')
    .select('owner_type, owner_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data ? ownerFromMetadata(data) : null;
}

/** Guarda el cliente del titular si aún no estaba (lo normal es que lo creara create-checkout-session). */
async function linkCustomer(admin: Admin, owner: Owner, customerId: string | null): Promise<void> {
  if (!customerId) return;
  const { data, error } = await admin
    .from('billing_customers')
    .select('stripe_customer_id')
    .eq('owner_type', owner.type)
    .eq('owner_id', owner.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return;
  const { error: insertError } = await admin
    .from('billing_customers')
    .insert({ owner_type: owner.type, owner_id: owner.id, stripe_customer_id: customerId });
  if (insertError && insertError.code !== '23505') throw insertError;
}

/** Recalcula el plan del titular a partir de sus suscripciones vivas en la base. */
async function applyOwnerPlan(admin: Admin, owner: Owner): Promise<void> {
  const live = await liveSubscriptionRows(admin, owner);
  const table = owner.type === 'profile' ? 'profiles' : 'companies';
  const { data: row, error } = await admin.from(table).select('plan').eq('id', owner.id).maybeSingle();
  if (error) throw error;
  if (!row) {
    console.warn(`[stripe-webhook] ${owner.type} ${owner.id} no existe: no se cambia el plan`);
    return;
  }
  const target = owner.type === 'profile' ? targetProfilePlan(row.plan, live) : targetCompanyPlan(row.plan, live);
  if (target === null) return;
  const { error: updateError } = await admin.from(table).update({ plan: target }).eq('id', owner.id);
  if (updateError) throw updateError;
  console.log(`[stripe-webhook] ${owner.type} ${owner.id}: plan ${row.plan ?? '-'} -> ${target}`);
}

// -----------------------------------------------------------------------------
// Suscripciones
// -----------------------------------------------------------------------------

/**
 * Vuelve a leer la suscripción en Stripe (estado actual, sin depender del orden
 * de los eventos), la guarda y recalcula el plan. Devuelve titular y datos, o
 * null si no se puede asociar a nadie (p. ej. creada a mano en el Dashboard).
 */
async function syncSubscription(
  ctx: Ctx,
  subscriptionId: string,
  hint: { owner?: Owner | null; eventObject?: AnyObj } = {},
): Promise<{ owner: Owner; snap: SubscriptionSnapshot; raw: AnyObj } | null> {
  let sub: AnyObj;
  try {
    sub = await ctx.stripe.subscriptions.retrieve(subscriptionId);
  } catch (err) {
    if (isStripeError(err) && (err as { code?: string }).code === 'resource_missing' && hint.eventObject) {
      sub = hint.eventObject;
    } else {
      throw err;
    }
  }
  const snap = subscriptionSnapshot(sub);
  const owner = ownerFromMetadata(sub?.metadata)
    ?? hint.owner
    ?? (await ownerForCustomer(ctx.admin, snap.customerId))
    ?? (await ownerForSubscriptionRow(ctx.admin, snap.id));
  if (!owner) {
    console.warn(`[stripe-webhook] suscripción ${snap.id} sin titular conocido (evento ${ctx.eventId}): se ignora`);
    return null;
  }

  let productKey: ProductKey | null = snap.productKey;
  if (productKey && BILLING_PRODUCTS[productKey].kind !== owner.type) {
    console.warn(`[stripe-webhook] suscripción ${snap.id}: producto ${productKey} no es de ${owner.type}; no da plan`);
    productKey = null;
  }

  await linkCustomer(ctx.admin, owner, snap.customerId);
  const { error } = await ctx.admin.from('billing_subscriptions').upsert({
    stripe_subscription_id: snap.id,
    owner_type: owner.type,
    owner_id: owner.id,
    stripe_customer_id: snap.customerId,
    product_key: productKey,
    price_id: snap.priceId,
    status: snap.status,
    trial_end: snap.trialEnd,
    current_period_end: snap.currentPeriodEnd,
    cancel_at_period_end: snap.cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });
  if (error) throw error;

  await applyOwnerPlan(ctx.admin, owner);
  return { owner, snap: { ...snap, productKey }, raw: sub };
}

// -----------------------------------------------------------------------------
// Créditos
// -----------------------------------------------------------------------------

async function grantCredits(
  ctx: Ctx,
  companyId: string,
  amount: number,
  reference: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await ctx.admin.rpc('add_company_credits_from_payment', {
    p_company_id: companyId,
    p_amount: amount,
    p_reference: reference,
    p_metadata: metadata,
  });
  if (error) throw error;
  const applied = (data as { applied?: boolean } | null)?.applied === true;
  console.log(`[stripe-webhook] créditos ${amount} empresa ${companyId} ref ${reference}: ${applied ? 'abonados' : 'ya estaban abonados'}`);
}

async function handleCheckoutSession(ctx: Ctx, session: AnyObj): Promise<void> {
  const owner = ownerFromMetadata(session?.metadata);
  const key = session?.metadata?.product_key;

  if (session?.mode === 'payment') {
    if (session.payment_status !== 'paid') {
      // Método asíncrono: los créditos llegan con checkout.session.async_payment_succeeded.
      console.log(`[stripe-webhook] sesión ${session.id} sin pagar todavía (${session.payment_status})`);
      return;
    }
    if (!owner || owner.type !== 'company' || !isProductKey(key) || BILLING_PRODUCTS[key].mode !== 'payment') {
      console.warn(`[stripe-webhook] sesión de pago ${session.id} sin metadata válida: no se abonan créditos`);
      return;
    }
    const product = BILLING_PRODUCTS[key];
    await linkCustomer(ctx.admin, owner, typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null);
    await grantCredits(ctx, owner.id, product.credits, String(session.id), {
      product_key: product.key,
      description: `${product.label} (Stripe)`,
      price: centsToEuros(typeof session.amount_total === 'number' ? session.amount_total : product.amountCents),
      checkout_session: session.id,
    });
    return;
  }

  if (session?.mode === 'subscription' && session.subscription) {
    const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    await syncSubscription(ctx, subId, { owner });
  }
}

async function handleInvoicePaid(ctx: Ctx, invoice: AnyObj): Promise<void> {
  const subId = invoiceSubscriptionId(invoice);
  // Factura de un pago único (packs): los créditos ya van por checkout.session.completed.
  if (!subId) return;
  const synced = await syncSubscription(ctx, subId);
  if (!synced || !shouldGrantPeriodCredits(invoice) || synced.owner.type !== 'company') return;

  const fromInvoice = productKeyForPriceId(invoicePriceId(invoice));
  const key = fromInvoice ?? synced.snap.productKey;
  if (!key) {
    console.warn(`[stripe-webhook] factura ${invoice.id}: price desconocido, no se abonan créditos`);
    return;
  }
  const product = BILLING_PRODUCTS[key];
  if (product.kind !== 'company' || product.mode !== 'subscription' || product.credits <= 0) return;

  await grantCredits(ctx, synced.owner.id, product.credits, String(invoice.id), {
    product_key: product.key,
    description: `Créditos del ${product.label} (Stripe)`,
    price: centsToEuros(typeof invoice.amount_paid === 'number' ? invoice.amount_paid : product.amountCents),
    invoice: invoice.id,
    subscription: subId,
  });
}

// -----------------------------------------------------------------------------
// Correo de fin de prueba
// -----------------------------------------------------------------------------

async function sendTrialEnding(ctx: Ctx, owner: Owner, sub: AnyObj, snap: SubscriptionSnapshot): Promise<void> {
  if (owner.type !== 'profile' || snap.status !== 'trialing') return;

  let profile: AnyObj = null;
  const full = await ctx.admin.from('profiles').select('email, full_name, registro_idioma').eq('id', owner.id).maybeSingle();
  if (full.error) {
    // Base sin registro_idioma (anterior a 20261029): sin idioma, en español.
    const basic = await ctx.admin.from('profiles').select('email, full_name').eq('id', owner.id).maybeSingle();
    if (basic.error) throw basic.error;
    profile = basic.data;
  } else {
    profile = full.data;
  }

  let email: string | null = profile?.email ?? null;
  if (!email) {
    const { data } = await ctx.admin.auth.admin.getUserById(owner.id);
    email = data?.user?.email ?? null;
  }
  if (!email) {
    console.warn(`[stripe-webhook] fin de prueba: el perfil ${owner.id} no tiene correo`);
    return;
  }

  // ¿Ya tiene tarjeta? En la suscripción o como predeterminada del cliente (el portal la guarda ahí).
  let hasPaymentMethod = !!(sub?.default_payment_method || sub?.default_source);
  if (!hasPaymentMethod && snap.customerId) {
    try {
      const customer = await ctx.stripe.customers.retrieve(snap.customerId);
      hasPaymentMethod = !!(customer?.invoice_settings?.default_payment_method || customer?.default_source);
    } catch {
      // Sin saberlo, el correo pide añadir tarjeta: es el caso seguro.
    }
  }

  const lang = normalizeLang(profile?.registro_idioma);
  const manageUrl = `${appUrl()}/${lang === 'en' ? 'pricing' : 'precios'}?billing=manage`;
  const rendered = trialEndingEmail(lang, {
    name: profile?.full_name ?? null,
    trialEnd: snap.trialEnd,
    manageUrl,
    hasPaymentMethod,
  });
  const res = await sendEmail({ to: email, ...rendered, tags: ['billing', 'trial_will_end'] });
  if (!res.ok) console.error(`[stripe-webhook] correo de fin de prueba no enviado: ${res.code} ${res.detail}`);
}

// -----------------------------------------------------------------------------
// Eventos
// -----------------------------------------------------------------------------

async function handleEvent(ctx: Ctx, event: AnyObj): Promise<void> {
  const obj = event?.data?.object ?? {};
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await handleCheckoutSession(ctx, obj);
      return;

    case 'checkout.session.async_payment_failed':
      console.warn(`[stripe-webhook] pago asíncrono fallido en la sesión ${obj.id}`);
      return;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed':
      await syncSubscription(ctx, String(obj.id), { eventObject: obj });
      return;

    case 'customer.subscription.trial_will_end': {
      const synced = await syncSubscription(ctx, String(obj.id), { eventObject: obj });
      if (synced) await sendTrialEnding(ctx, synced.owner, synced.raw, synced.snap);
      return;
    }

    case 'invoice.paid':
      await handleInvoicePaid(ctx, obj);
      return;

    case 'invoice.payment_failed': {
      const subId = invoiceSubscriptionId(obj);
      if (subId) await syncSubscription(ctx, subId);
      console.warn(`[stripe-webhook] cobro fallido de la factura ${obj.id} (suscripción ${subId ?? '-'})`);
      return;
    }

    default:
      console.log(`[stripe-webhook] evento sin tratar: ${event.type}`);
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  const webhookSecret = (Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '').trim();
  if (!stripeSecretConfigured() || !webhookSecret) {
    return text(503, 'billing not configured');
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return text(400, 'invalid signature');
  const rawBody = await req.text();

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: STRIPE_API_VERSION,
  });

  let event: AnyObj;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    console.warn('[stripe-webhook] firma no válida');
    return text(400, 'invalid signature');
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let claimed = false;
  try {
    claimed = await claimEvent(admin, String(event.id), String(event.type));
    if (!claimed) return ok({ received: true, duplicate: true });

    await handleEvent({ admin, stripe, eventId: String(event.id) }, event);
    return ok();
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    console.error(`[stripe-webhook] fallo con ${event.type} ${event.id}: ${isStripeError(err) ? `Stripe ${e.type} ${e.code ?? ''}` : (e?.message ?? String(err))}`);
    if (claimed) await releaseEvent(admin, String(event.id));
    return text(500, 'internal error');
  }
});
