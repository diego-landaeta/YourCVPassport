// Catálogo de pagos de YourCVPassport <-> precios de Stripe.
//
// Fuente única para create-checkout-session, create-portal-session,
// get-billing-status y stripe-webhook. El cliente SOLO manda una clave de
// producto (p. ej. 'pro_monthly'); el price ID sale de un secreto de entorno de
// esta lista blanca y, antes de cobrar, create-checkout-session comprueba en
// Stripe que importe, moneda e intervalo coinciden con lo de aquí
// (priceMatchesProduct): un secreto pegado mal no puede cobrar otro importe.
//
// Módulo PURO (sin red ni efectos al importar): el entorno entra por parámetro
// (getEnv) y se prueba con Node (stripeProducts.test.mjs).
//
// Sin STRIPE_SECRET_KEY o sin el secreto del price, el producto está «sin
// configurar» (isBillingConfigured = false): las funciones responden 503
// billing_not_configured y el frontend vuelve al comportamiento de siempre.
//
// Para añadir o cambiar un producto: este mapa, el producto en Stripe, su
// secreto y docs/pagos-stripe.md (tabla de productos).

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
  | 'credits_1000'

export type OwnerType = 'profile' | 'company'
export type ProfilePlan = 'pro'
export type CompanyPlan = 'starter' | 'growth'

export interface BillingProduct {
  key: ProductKey
  /** Quién paga: el perfil del usuario (plan Profesional) o una empresa. */
  kind: OwnerType
  /** 'subscription' = Checkout de suscripción; 'payment' = pago único (packs). */
  mode: 'subscription' | 'payment'
  /** Importe en céntimos de euro que debe tener el price de Stripe. */
  amountCents: number
  currency: 'eur'
  /** Intervalo del price recurrente (null en los pagos únicos). */
  interval: 'month' | 'year' | null
  /**
   * Créditos que se abonan a la empresa: en los packs, una vez al pagar; en
   * Starter / Growth, en CADA factura pagada del periodo (la anual abona los 12
   * meses de golpe en cada renovación anual).
   */
  credits: number
  /** Días de prueba gratis (solo Pro, sin tarjeta; una prueba por perfil). */
  trialDays: number
  /** Plan que concede mientras la suscripción está viva. */
  plan: ProfilePlan | CompanyPlan | null
  /** Secreto de Supabase con el price ID. */
  envVar: string
  /** Nombre para descripciones e historial de créditos. */
  label: string
}

export const BILLING_PRODUCTS: Readonly<Record<ProductKey, BillingProduct>> = Object.freeze({
  pro_monthly: { key: 'pro_monthly', kind: 'profile', mode: 'subscription', amountCents: 1500, currency: 'eur', interval: 'month', credits: 0, trialDays: 14, plan: 'pro', envVar: 'STRIPE_PRICE_PRO_MONTHLY', label: 'Plan Profesional (mensual)' },
  pro_annual: { key: 'pro_annual', kind: 'profile', mode: 'subscription', amountCents: 14400, currency: 'eur', interval: 'year', credits: 0, trialDays: 14, plan: 'pro', envVar: 'STRIPE_PRICE_PRO_ANNUAL', label: 'Plan Profesional (anual)' },
  starter_monthly: { key: 'starter_monthly', kind: 'company', mode: 'subscription', amountCents: 9900, currency: 'eur', interval: 'month', credits: 100, trialDays: 0, plan: 'starter', envVar: 'STRIPE_PRICE_STARTER_MONTHLY', label: 'Plan Starter (mensual)' },
  starter_annual: { key: 'starter_annual', kind: 'company', mode: 'subscription', amountCents: 95040, currency: 'eur', interval: 'year', credits: 1200, trialDays: 0, plan: 'starter', envVar: 'STRIPE_PRICE_STARTER_ANNUAL', label: 'Plan Starter (anual)' },
  growth_monthly: { key: 'growth_monthly', kind: 'company', mode: 'subscription', amountCents: 24900, currency: 'eur', interval: 'month', credits: 1000, trialDays: 0, plan: 'growth', envVar: 'STRIPE_PRICE_GROWTH_MONTHLY', label: 'Plan Growth (mensual)' },
  growth_annual: { key: 'growth_annual', kind: 'company', mode: 'subscription', amountCents: 239040, currency: 'eur', interval: 'year', credits: 12000, trialDays: 0, plan: 'growth', envVar: 'STRIPE_PRICE_GROWTH_ANNUAL', label: 'Plan Growth (anual)' },
  credits_50: { key: 'credits_50', kind: 'company', mode: 'payment', amountCents: 4900, currency: 'eur', interval: null, credits: 50, trialDays: 0, plan: null, envVar: 'STRIPE_PRICE_CREDITS_50', label: 'Pack de 50 créditos' },
  credits_150: { key: 'credits_150', kind: 'company', mode: 'payment', amountCents: 12900, currency: 'eur', interval: null, credits: 150, trialDays: 0, plan: null, envVar: 'STRIPE_PRICE_CREDITS_150', label: 'Pack de 150 créditos' },
  credits_300: { key: 'credits_300', kind: 'company', mode: 'payment', amountCents: 23900, currency: 'eur', interval: null, credits: 300, trialDays: 0, plan: null, envVar: 'STRIPE_PRICE_CREDITS_300', label: 'Pack de 300 créditos' },
  credits_1000: { key: 'credits_1000', kind: 'company', mode: 'payment', amountCents: 69900, currency: 'eur', interval: null, credits: 1000, trialDays: 0, plan: null, envVar: 'STRIPE_PRICE_CREDITS_1000', label: 'Pack de 1000 créditos' },
})

export const PRODUCT_KEYS = Object.keys(BILLING_PRODUCTS) as ProductKey[]

export type GetEnv = (name: string) => string | undefined

/** Deno.env.get si existe (en las pruebas de Node se pasa getEnv explícito). */
export const denoEnv: GetEnv = (name) => {
  // deno-lint-ignore no-explicit-any
  const d = (globalThis as any).Deno
  return d?.env?.get ? d.env.get(name) : undefined
}

export function isProductKey(value: unknown): value is ProductKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BILLING_PRODUCTS, value)
}

function cleanEnv(getEnv: GetEnv, name: string): string {
  return String(getEnv(name) ?? '').trim()
}

/** STRIPE_SECRET_KEY presente (no se valida contra Stripe). Nunca se devuelve su valor. */
export function stripeSecretConfigured(getEnv: GetEnv = denoEnv): boolean {
  return /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(cleanEnv(getEnv, 'STRIPE_SECRET_KEY'))
}

/** Price ID del producto (secreto de entorno), o null si falta o no tiene forma de price. */
export function priceIdFor(key: ProductKey, getEnv: GetEnv = denoEnv): string | null {
  const id = cleanEnv(getEnv, BILLING_PRODUCTS[key].envVar)
  return /^price_[A-Za-z0-9]+$/.test(id) ? id : null
}

/** El producto se puede vender: hay clave de Stripe y price ID. */
export function isBillingConfigured(key: ProductKey, getEnv: GetEnv = denoEnv): boolean {
  return stripeSecretConfigured(getEnv) && priceIdFor(key, getEnv) !== null
}

/** { clave: configurado } para get-billing-status (solo booleanos, nunca IDs). */
export function configuredProducts(getEnv: GetEnv = denoEnv): Record<ProductKey, boolean> {
  const out = {} as Record<ProductKey, boolean>
  for (const k of PRODUCT_KEYS) out[k] = isBillingConfigured(k, getEnv)
  return out
}

/** Producto de un price ID de Stripe (por los secretos), o null si no es nuestro. */
export function productKeyForPriceId(priceId: unknown, getEnv: GetEnv = denoEnv): ProductKey | null {
  if (typeof priceId !== 'string' || !priceId) return null
  for (const k of PRODUCT_KEYS) if (priceIdFor(k, getEnv) === priceId) return k
  return null
}

/** Datos del price de Stripe que se comparan (subconjunto de Stripe.Price). */
export interface StripePriceLike {
  id?: string
  active?: boolean
  currency?: string
  unit_amount?: number | null
  type?: string
  recurring?: { interval?: string; interval_count?: number } | null
}

export type PriceCheck = { ok: true } | { ok: false; reason: string }

/**
 * ¿El price de Stripe es el que dice el catálogo? Activo, EUR, mismo importe en
 * céntimos, recurrente con el mismo intervalo (y cada 1) o pago único.
 */
export function priceMatchesProduct(price: StripePriceLike | null | undefined, product: BillingProduct): PriceCheck {
  if (!price) return { ok: false, reason: 'price_missing' }
  if (price.active === false) return { ok: false, reason: 'price_inactive' }
  if (String(price.currency ?? '').toLowerCase() !== product.currency) return { ok: false, reason: 'currency_mismatch' }
  if (price.unit_amount !== product.amountCents) return { ok: false, reason: 'amount_mismatch' }
  if (product.mode === 'subscription') {
    if (price.type !== 'recurring' || !price.recurring) return { ok: false, reason: 'not_recurring' }
    if (price.recurring.interval !== product.interval) return { ok: false, reason: 'interval_mismatch' }
    if ((price.recurring.interval_count ?? 1) !== 1) return { ok: false, reason: 'interval_count_mismatch' }
  } else if (price.type !== 'one_time') {
    return { ok: false, reason: 'not_one_time' }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Estados de suscripción
// ---------------------------------------------------------------------------

// Estados en los que la suscripción sigue dando el plan. past_due cuenta: Stripe
// sigue reintentando el cobro y el plan se mantiene hasta que la cancela.
export const LIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due'] as const

export function isLiveStatus(status: unknown): boolean {
  return typeof status === 'string' && (LIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
}

// ---------------------------------------------------------------------------
// Rutas de vuelta de Stripe (lista blanca)
// ---------------------------------------------------------------------------

// Páginas de la app a las que se puede volver de Checkout o del portal. Se
// añade ?checkout=ok|cancel (Checkout) o nada (portal). Cualquier otra cosa se
// sustituye por la de por defecto del producto.
export const RETURN_PATHS = [
  '/precios',
  '/pricing',
  '/empresas/planes',
  '/companies/plans',
  '/company/credits',
  '/company/dashboard',
  '/dashboard',
] as const

export function defaultReturnPath(product: BillingProduct | null, owner: OwnerType): string {
  if (product?.mode === 'payment') return '/company/credits'
  return owner === 'company' ? '/empresas/planes' : '/precios'
}

/** Ruta pedida por el cliente si está en la lista blanca; si no, la de por defecto. */
export function resolveReturnPath(requested: unknown, fallback: string): string {
  return typeof requested === 'string' && (RETURN_PATHS as readonly string[]).includes(requested) ? requested : fallback
}

/** Euros con dos decimales (para metadata.price del historial de créditos). */
export function centsToEuros(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2)
}
