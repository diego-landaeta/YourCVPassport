/**
 * Pagos con Stripe desde el navegador. Contrato de las Edge Functions:
 *   create-checkout-session, create-portal-session y get-billing-status
 *   (supabase/functions/, docs/pagos-stripe.md).
 *
 * El navegador solo manda la CLAVE del producto (p. ej. 'pro_monthly'): el price,
 * el importe y quién paga los decide el servidor. Aquí no hay claves de Stripe.
 *
 * Mientras los pagos no estén activados (sin claves o sin productos en Stripe)
 * las funciones responden 503 billing_not_configured y estas funciones devuelven
 * { kind: 'not_configured' }: las páginas siguen como antes (aviso «muy pronto»).
 */
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

export type ProductKey =
  | 'pro_monthly'
  | 'pro_annual'
  | 'starter_monthly'
  | 'starter_annual'
  | 'growth_monthly'
  | 'growth_annual'
  | 'credits_50'
  | 'credits_150'
  | 'credits_300'
  | 'credits_1000';

export type BillingOwner = 'profile' | 'company';

export type BillingActionResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'not_configured' }
  | { kind: 'already_subscribed' }
  | { kind: 'company_required' }
  | { kind: 'company_role_required' }
  | { kind: 'company_inactive' }
  | { kind: 'no_billing_account' }
  | { kind: 'unauthorized' }
  | { kind: 'rate_limited' }
  | { kind: 'error' };

export interface BillingSubscription {
  productKey: ProductKey | null;
  status: string;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingStatus {
  enabled: boolean;
  configured: Partial<Record<ProductKey, boolean>>;
  profile: {
    plan: string;
    trialAvailable: boolean;
    hasBillingAccount: boolean;
    subscription: BillingSubscription | null;
  };
  company: null | {
    id: string;
    role: string;
    canManage: boolean;
    plan: string;
    hasBillingAccount: boolean;
    subscription: BillingSubscription | null;
  };
}

const LIVE_STATUSES = ['active', 'trialing', 'past_due'];

export function isLiveSubscription(sub: BillingSubscription | null | undefined): boolean {
  return !!sub && LIVE_STATUSES.includes(sub.status);
}

/** Días enteros que quedan de prueba (redondeo hacia arriba), o null si no hay fecha. */
export function trialDaysLeft(trialEnd: string | null | undefined, now = Date.now()): number | null {
  if (!trialEnd) return null;
  const end = new Date(trialEnd).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - now) / 86_400_000));
}

/**
 * Precio en euros con el formato de las tarjetas de precios («€99», «€950,40»):
 * sin decimales si es entero, con dos si no (coma en español). Lo que se enseña
 * tiene que ser lo que cobra Stripe: antes el anual de empresa se redondeaba
 * (€950 en vez de 950,40 €).
 */
export function formatEuro(amount: number, lang: 'es' | 'en', forceDecimals = false): string {
  const cents = Math.round(amount * 100);
  const text = cents % 100 === 0 && !forceDecimals ? String(cents / 100) : (cents / 100).toFixed(2);
  return `€${lang === 'es' ? text.replace('.', ',') : text}`;
}

/** Producto de un plan de empresa y ciclo. */
export function companyPlanProduct(plan: 'starter' | 'growth', annual: boolean): ProductKey {
  return `${plan}_${annual ? 'annual' : 'monthly'}` as ProductKey;
}

/** Pack de créditos por número de créditos (los cuatro de la página de créditos). */
export function creditsProduct(credits: number): ProductKey | null {
  return ([50, 150, 300, 1000] as const).includes(credits as 50) ? (`credits_${credits}` as ProductKey) : null;
}

// ---------------------------------------------------------------------------
// Llamadas
// ---------------------------------------------------------------------------

async function errorInfo(error: unknown): Promise<{ status: number; code: string }> {
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response | undefined;
    let code = '';
    try {
      const body = await res?.json();
      if (body && typeof body.code === 'string') code = body.code;
    } catch {
      // Cuerpo no JSON (p. ej. la función aún no está desplegada).
    }
    return { status: res?.status ?? 0, code };
  }
  return { status: 0, code: '' };
}

function mapError(status: number, code: string): BillingActionResult {
  switch (code) {
    case 'billing_not_configured':
    case 'price_unavailable':
      return { kind: 'not_configured' };
    case 'already_subscribed':
      return { kind: 'already_subscribed' };
    case 'company_required':
      return { kind: 'company_required' };
    case 'company_role_required':
    case 'company_forbidden':
      return { kind: 'company_role_required' };
    case 'company_inactive':
      return { kind: 'company_inactive' };
    case 'no_billing_account':
      return { kind: 'no_billing_account' };
    case 'unauthorized':
      return { kind: 'unauthorized' };
    case 'RATE_LIMITED':
      return { kind: 'rate_limited' };
    default:
      // Función aún sin desplegar (404 del gateway, sin código) o 503 genérico:
      // se trata como pagos sin activar.
      if (!code && (status === 404 || status === 503)) return { kind: 'not_configured' };
      if (status === 401) return { kind: 'unauthorized' };
      return { kind: 'error' };
  }
}

function isStripeUrl(url: unknown, host: 'checkout.stripe.com' | 'billing.stripe.com'): url is string {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === host;
  } catch {
    return false;
  }
}

function newAttemptId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export interface CheckoutOptions {
  companyId?: string | null;
  /** Ruta de la app a la que volver (el servidor solo acepta su lista blanca). */
  returnPath?: string;
  lang?: 'es' | 'en';
}

/** Abre Stripe Checkout para un producto. El llamador redirige si kind === 'redirect'. */
export async function startCheckout(product: ProductKey, opts: CheckoutOptions = {}): Promise<BillingActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        product,
        ...(opts.companyId ? { companyId: opts.companyId } : {}),
        ...(opts.returnPath ? { returnPath: opts.returnPath } : {}),
        lang: opts.lang ?? 'es',
        attempt: newAttemptId(),
      },
    });
    if (error) {
      const { status, code } = await errorInfo(error);
      return mapError(status, code);
    }
    return isStripeUrl(data?.url, 'checkout.stripe.com') ? { kind: 'redirect', url: data.url } : { kind: 'error' };
  } catch {
    return { kind: 'error' };
  }
}

/** Abre el portal de cliente de Stripe (perfil o empresa). */
export async function openBillingPortal(owner: BillingOwner, opts: CheckoutOptions = {}): Promise<BillingActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: {
        owner,
        ...(opts.companyId ? { companyId: opts.companyId } : {}),
        ...(opts.returnPath ? { returnPath: opts.returnPath } : {}),
        lang: opts.lang ?? 'es',
      },
    });
    if (error) {
      const { status, code } = await errorInfo(error);
      return mapError(status, code);
    }
    return isStripeUrl(data?.url, 'billing.stripe.com') ? { kind: 'redirect', url: data.url } : { kind: 'error' };
  } catch {
    return { kind: 'error' };
  }
}

function parseSubscription(raw: unknown): BillingSubscription | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.status !== 'string') return null;
  return {
    productKey: typeof s.productKey === 'string' ? (s.productKey as ProductKey) : null,
    status: s.status,
    trialEnd: typeof s.trialEnd === 'string' ? s.trialEnd : null,
    currentPeriodEnd: typeof s.currentPeriodEnd === 'string' ? s.currentPeriodEnd : null,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd === true,
  };
}

/** Valida la respuesta de get-billing-status. null si no tiene la forma esperada. */
export function parseBillingStatus(raw: unknown): BillingStatus | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  if (!r.profile || typeof r.profile !== 'object') return null;
  const configured: Partial<Record<ProductKey, boolean>> = {};
  if (r.configured && typeof r.configured === 'object') {
    for (const [k, v] of Object.entries(r.configured)) if (typeof v === 'boolean') configured[k as ProductKey] = v;
  }
  const c = r.company && typeof r.company === 'object' && typeof r.company.id === 'string' ? r.company : null;
  return {
    enabled: r.enabled === true,
    configured,
    profile: {
      plan: typeof r.profile.plan === 'string' ? r.profile.plan : 'free',
      trialAvailable: r.profile.trialAvailable !== false,
      hasBillingAccount: r.profile.hasBillingAccount === true,
      subscription: parseSubscription(r.profile.subscription),
    },
    company: c && {
      id: c.id,
      role: typeof c.role === 'string' ? c.role : '',
      canManage: c.canManage === true,
      plan: typeof c.plan === 'string' ? c.plan : 'none',
      hasBillingAccount: c.hasBillingAccount === true,
      subscription: parseSubscription(c.subscription),
    },
  };
}

// Caché breve: varias piezas de la misma página piden el estado a la vez.
const CACHE_MS = 30_000;
let cache: { key: string; at: number; promise: Promise<BillingStatus | null> } | null = null;

export function invalidateBillingStatus(): void {
  cache = null;
}

/**
 * Estado de pagos del usuario con sesión. null si no hay pagos o la función falla.
 * `userId` solo separa la caché entre sesiones (la identidad la saca el servidor del JWT).
 */
export function getBillingStatus(userId: string, companyId?: string | null): Promise<BillingStatus | null> {
  const key = `${userId}|${companyId ?? ''}`;
  if (cache && cache.key === key && Date.now() - cache.at < CACHE_MS) return cache.promise;
  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-billing-status', {
        body: companyId ? { companyId } : {},
      });
      if (error) return null;
      return parseBillingStatus(data);
    } catch {
      return null;
    }
  })();
  cache = { key, at: Date.now(), promise };
  return promise;
}
