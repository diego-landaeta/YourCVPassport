// Piezas comunes de las funciones de pago (create-checkout-session,
// create-portal-session, get-billing-status y stripe-webhook).
//
// Sin Deno ni red al importar: el cliente admin de Supabase (service_role) y el
// de Stripe entran por parámetro, así que se prueba con los dobles de
// _shared/testHarness.mjs.
//
// Quién puede pagar por quién:
//   - perfil: el usuario del JWT, siempre para sí mismo (owner_id = auth.uid()).
//   - empresa: miembro OWNER o ADMIN de esa empresa en company_users (los mismos
//     roles que gestionan el equipo, ver 20261007_seguridad_empresas.sql), y la
//     empresa APPROVED o PENDING (REJECTED / SUSPENDED no pueden pagar).

import { isLiveStatus, LIVE_SUBSCRIPTION_STATUSES, type OwnerType } from './stripeProducts.ts'

// deno-lint-ignore no-explicit-any
export type Admin = any
// deno-lint-ignore no-explicit-any
export type StripeClient = any

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Roles de company_users que pueden contratar, comprar créditos y abrir el portal. */
export const MANAGE_ROLES = ['OWNER', 'ADMIN'] as const

/** Estados de empresa que pueden pagar (PENDING entra en el panel y prepara borradores). */
export const PAYABLE_COMPANY_STATUSES = ['APPROVED', 'PENDING'] as const

export interface Owner {
  type: OwnerType
  id: string
}

export function isOwnerType(value: unknown): value is OwnerType {
  return value === 'profile' || value === 'company'
}

/** Titular desde metadata de Stripe ({ owner_type, owner_id }), validado. */
export function ownerFromMetadata(meta: unknown): Owner | null {
  const m = (meta ?? {}) as Record<string, unknown>
  if (!isOwnerType(m.owner_type)) return null
  if (typeof m.owner_id !== 'string' || !UUID_RE.test(m.owner_id)) return null
  return { type: m.owner_type, id: m.owner_id.toLowerCase() }
}

export interface CompanyRow {
  id: string
  company_name: string | null
  company_email: string | null
  status: string | null
  plan: string | null
}

export type CompanyAccess =
  | { ok: true; company: CompanyRow; role: string; canManage: boolean }
  | { ok: false; status: 403 | 404; code: 'company_required' | 'company_forbidden' | 'company_role_required' | 'company_inactive' }

/**
 * Empresa del usuario para pagar o consultar. Con `companyId`, tiene que ser
 * miembro de esa; sin él, la primera en la que sea OWNER/ADMIN (o cualquiera si
 * no es gestor en ninguna). `requireManage`: exige OWNER/ADMIN y empresa activa.
 */
export async function resolveCompanyAccess(
  admin: Admin,
  userId: string,
  companyId: unknown,
  requireManage: boolean,
): Promise<CompanyAccess> {
  const { data: memberships, error } = await admin
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', userId)
  if (error) throw error
  const rows: { company_id: string; role: string }[] = (memberships ?? []).map((m: { company_id: string; role: string | null }) => ({
    company_id: String(m.company_id),
    role: String(m.role ?? '').toUpperCase(),
  }))

  let membership: { company_id: string; role: string } | undefined
  if (companyId !== undefined && companyId !== null && companyId !== '') {
    if (typeof companyId !== 'string' || !UUID_RE.test(companyId)) return { ok: false, status: 403, code: 'company_forbidden' }
    membership = rows.find((m) => m.company_id.toLowerCase() === companyId.toLowerCase())
    if (!membership) return { ok: false, status: 403, code: 'company_forbidden' }
  } else {
    membership = rows.find((m) => (MANAGE_ROLES as readonly string[]).includes(m.role)) ?? rows[0]
    if (!membership) return { ok: false, status: 404, code: 'company_required' }
  }

  const canManage = (MANAGE_ROLES as readonly string[]).includes(membership.role)
  if (requireManage && !canManage) return { ok: false, status: 403, code: 'company_role_required' }

  const { data: company, error: companyError } = await admin
    .from('companies')
    .select('id, company_name, company_email, status, plan')
    .eq('id', membership.company_id)
    .maybeSingle()
  if (companyError) throw companyError
  if (!company) return { ok: false, status: 404, code: 'company_required' }
  if (requireManage && !(PAYABLE_COMPANY_STATUSES as readonly string[]).includes(String(company.status ?? '').toUpperCase())) {
    return { ok: false, status: 403, code: 'company_inactive' }
  }
  return { ok: true, company: company as CompanyRow, role: membership.role, canManage }
}

/** stripe_customer_id del titular, o null si aún no tiene. */
export async function findCustomerId(admin: Admin, owner: Owner): Promise<string | null> {
  const { data, error } = await admin
    .from('billing_customers')
    .select('stripe_customer_id')
    .eq('owner_type', owner.type)
    .eq('owner_id', owner.id)
    .maybeSingle()
  if (error) throw error
  return data?.stripe_customer_id ?? null
}

/**
 * Cliente de Stripe del titular; lo crea si no existe. La idempotency key es
 * estable por titular: un doble clic o un reintento reutilizan el mismo cliente.
 */
export async function getOrCreateCustomer(
  admin: Admin,
  stripe: StripeClient,
  owner: Owner,
  details: { email?: string | null; name?: string | null; preferredLocale?: string | null },
): Promise<string> {
  const existing = await findCustomerId(admin, owner)
  if (existing) return existing

  const params: Record<string, unknown> = {
    metadata: { owner_type: owner.type, owner_id: owner.id },
  }
  if (details.email) params.email = details.email
  if (details.name) params.name = String(details.name).slice(0, 200)
  if (details.preferredLocale) params.preferred_locales = [details.preferredLocale]

  const customer = await stripe.customers.create(params, { idempotencyKey: `ycvp-customer-${owner.type}-${owner.id}` })
  const { error } = await admin
    .from('billing_customers')
    .insert({ owner_type: owner.type, owner_id: owner.id, stripe_customer_id: customer.id })
  if (error) {
    // Otra petición lo guardó a la vez: vale la fila que ya está.
    if (error.code === '23505') return (await findCustomerId(admin, owner)) ?? customer.id
    throw error
  }
  return customer.id
}

export interface SubscriptionRow {
  stripe_subscription_id: string
  owner_type: OwnerType
  owner_id: string
  product_key: string | null
  price_id: string | null
  status: string
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  updated_at?: string | null
}

/** Suscripciones vivas (active / trialing / past_due) del titular según la base. */
export async function liveSubscriptionRows(admin: Admin, owner: Owner): Promise<SubscriptionRow[]> {
  const { data, error } = await admin
    .from('billing_subscriptions')
    .select('*')
    .eq('owner_type', owner.type)
    .eq('owner_id', owner.id)
    .in('status', [...LIVE_SUBSCRIPTION_STATUSES])
  if (error) throw error
  return (data ?? []) as SubscriptionRow[]
}

/** ¿El titular ha tenido alguna vez una suscripción (cualquier estado)? Para la prueba única. */
export async function hasAnySubscriptionRow(admin: Admin, owner: Owner): Promise<boolean> {
  const { data, error } = await admin
    .from('billing_subscriptions')
    .select('stripe_subscription_id')
    .eq('owner_type', owner.type)
    .eq('owner_id', owner.id)
    .limit(1)
  if (error) throw error
  return (data ?? []).length > 0
}

/** Suscripciones vivas del cliente en Stripe (Stripe manda; cubre el hueco antes del webhook). */
export async function liveStripeSubscriptionIds(stripe: StripeClient, customerId: string): Promise<{ live: string[]; any: boolean }> {
  const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
  const data: { id: string; status: string }[] = list?.data ?? []
  return { live: data.filter((s) => isLiveStatus(s.status)).map((s) => s.id), any: data.length > 0 }
}

// deno-lint-ignore no-explicit-any
export function isStripeError(error: any): boolean {
  return typeof error?.type === 'string' && error.type.startsWith('Stripe')
}

/** Lee el cuerpo JSON (máx. `maxBytes`). null si no es un objeto JSON. */
export async function readJsonObject(req: Request, maxBytes = 4096): Promise<Record<string, unknown> | null> {
  const text = await req.text()
  if (!text) return {}
  if (new TextEncoder().encode(text).length > maxBytes) return null
  try {
    const body = JSON.parse(text)
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

/** Token del JWT de la cabecera Authorization ('' si no hay). */
export function bearerToken(req: Request): string {
  return (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
}

/** 'es' | 'en' a partir de lo que mande el cliente o el idioma guardado. */
export function normalizeLang(value: unknown): 'es' | 'en' {
  return typeof value === 'string' && value.toLowerCase().startsWith('en') ? 'en' : 'es'
}
