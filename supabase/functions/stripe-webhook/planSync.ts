// Reglas puras del webhook de Stripe (sin Deno ni red): qué plan corresponde a
// un titular según sus suscripciones vivas, cómo leer una suscripción o una
// factura de Stripe en los dos formatos de la API, y cuándo una factura abona
// los créditos del periodo. Se prueban con Node (planSync.test.mjs).

import {
  BILLING_PRODUCTS,
  isProductKey,
  productKeyForPriceId,
  type GetEnv,
  type OwnerType,
  type ProductKey,
} from '../_shared/stripeProducts.ts'

interface LiveRow {
  product_key: string | null
}

function liveProducts(rows: LiveRow[], kind: OwnerType) {
  return rows
    .map((r) => (isProductKey(r.product_key) ? BILLING_PRODUCTS[r.product_key] : null))
    .filter((p) => p !== null && p.kind === kind && p.mode === 'subscription')
}

/**
 * Plan nuevo del perfil, o null si no hay que tocarlo.
 *  - Con una suscripción viva del plan Profesional: 'pro'.
 *  - Sin ninguna: vuelve a 'free' SOLO si estaba en 'pro' (un 'basic' heredado no se toca).
 *  - 'enterprise' lo da un admin a mano: los pagos nunca lo cambian.
 */
export function targetProfilePlan(current: string | null | undefined, liveRows: LiveRow[]): string | null {
  const cur = String(current ?? 'free').toLowerCase() || 'free'
  if (cur === 'enterprise') return null
  const hasPro = liveProducts(liveRows, 'profile').some((p) => p!.plan === 'pro')
  if (hasPro) return cur === 'pro' ? null : 'pro'
  return cur === 'pro' ? 'free' : null
}

/**
 * Plan nuevo de la empresa, o null si no cambia. Growth gana a Starter si hubiera
 * dos vivas. Sin ninguna: 'none'. 'enterprise' (a medida, admin) no se toca.
 */
export function targetCompanyPlan(current: string | null | undefined, liveRows: LiveRow[]): string | null {
  const cur = String(current ?? 'none').toLowerCase() || 'none'
  if (cur === 'enterprise') return null
  const plans = liveProducts(liveRows, 'company').map((p) => p!.plan)
  const best = plans.includes('growth') ? 'growth' : plans.includes('starter') ? 'starter' : 'none'
  return best === cur ? null : best
}

// ---------------------------------------------------------------------------
// Lectura de objetos de Stripe (API 2024-06-20 y la de 2025, donde los periodos
// pasan a los items y la suscripción de la factura a invoice.parent)
// ---------------------------------------------------------------------------

// deno-lint-ignore no-explicit-any
type AnyObj = any

export function toISO(seconds: unknown): string | null {
  return typeof seconds === 'number' && Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value) return value
  if (value && typeof value === 'object' && typeof (value as AnyObj).id === 'string') return (value as AnyObj).id
  return null
}

export interface SubscriptionSnapshot {
  id: string
  customerId: string | null
  priceId: string | null
  productKey: ProductKey | null
  status: string
  trialEnd: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

/** Lo que se guarda de una suscripción. El producto sale del price (secretos) y, si no, de su metadata. */
export function subscriptionSnapshot(sub: AnyObj, getEnv?: GetEnv): SubscriptionSnapshot {
  const item = sub?.items?.data?.[0] ?? null
  const priceId = idOf(item?.price)
  const fromPrice = productKeyForPriceId(priceId, getEnv)
  const fromMeta = isProductKey(sub?.metadata?.product_key) ? sub.metadata.product_key : null
  const periodEnd = item?.current_period_end ?? sub?.current_period_end
  return {
    id: String(sub?.id ?? ''),
    customerId: idOf(sub?.customer),
    priceId,
    productKey: fromPrice ?? fromMeta,
    status: String(sub?.status ?? 'unknown'),
    trialEnd: toISO(sub?.trial_end),
    currentPeriodEnd: toISO(periodEnd),
    cancelAtPeriodEnd: sub?.cancel_at_period_end === true,
  }
}

/** Suscripción de una factura (invoice.subscription o invoice.parent.subscription_details.subscription). */
export function invoiceSubscriptionId(invoice: AnyObj): string | null {
  return idOf(invoice?.subscription) ?? idOf(invoice?.parent?.subscription_details?.subscription)
}

/** Price de la primera línea con price de la factura (line.price o line.pricing.price_details.price). */
export function invoicePriceId(invoice: AnyObj): string | null {
  const lines: AnyObj[] = invoice?.lines?.data ?? []
  for (const line of lines) {
    const id = idOf(line?.price) ?? idOf(line?.pricing?.price_details?.price)
    if (id) return id
  }
  return null
}

// Facturas que abonan los créditos del periodo: la primera (alta) y cada
// renovación. Los cambios de plan a mitad de periodo (subscription_update, con
// prorrateo) NO abonan: el plan nuevo da sus créditos en la siguiente renovación.
const CREDIT_BILLING_REASONS = ['subscription_create', 'subscription_cycle']

export function shouldGrantPeriodCredits(invoice: AnyObj): boolean {
  return invoice?.status === 'paid' && CREDIT_BILLING_REASONS.includes(String(invoice?.billing_reason ?? ''))
}
