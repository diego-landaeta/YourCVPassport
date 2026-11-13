// Pruebas de create-checkout-session con el index.ts REAL empaquetado (esbuild) contra una base
// en memoria y un Stripe falso (sin red ni claves reales):
//   node supabase/functions/create-checkout-session/checkout.test.mjs
import assert from 'node:assert/strict'
import { loadEdge, post, createFakeSupabase } from '../_shared/testHarness.mjs'
import { createFakeStripe, correctPrices, FAKE_STRIPE_SECRET, PRICE_ENV } from '../_shared/testStripe.mjs'

let passed = 0
async function t(name, fn) {
  try {
    await fn()
    passed++
    console.log(`ok   ${name}`)
  } catch (e) {
    console.log(`FAIL ${name}\n     ${e.stack}`)
    process.exitCode = 1
  }
}

const ENV = {
  SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-de-prueba-0123456789',
  STRIPE_SECRET_KEY: FAKE_STRIPE_SECRET,
  ...PRICE_ENV,
}
console.error = () => {}
console.warn = () => {}
const handler = await loadEdge('create-checkout-session', ENV)

const U = {
  ana: '11111111-1111-4111-8111-111111111111',
  owner: '22222222-2222-4222-8222-222222222222',
  member: '33333333-3333-4333-8333-333333333333',
  outsider: '44444444-4444-4444-8444-444444444444',
}
const CO = 'c0c0c0c0-0000-4000-8000-000000000001'
const CO2 = 'c0c0c0c0-0000-4000-8000-000000000002'
const TOKENS = { 'tok-ana': U.ana, 'tok-owner': U.owner, 'tok-member': U.member, 'tok-outsider': U.outsider }

function setup({ subs = [], customers = [], companyStatus = 'APPROVED', stripe = {} } = {}) {
  const fake = createFakeSupabase({
    profiles: [{ id: U.ana, full_name: 'Ana Pérez', plan: 'free' }, { id: U.owner, plan: 'free' }, { id: U.member, plan: 'free' }],
    company_users: [
      { company_id: CO, user_id: U.owner, role: 'OWNER' },
      { company_id: CO, user_id: U.member, role: 'MEMBER' },
    ],
    companies: [
      { id: CO, company_name: 'Acme SL', company_email: 'rrhh@acme.es', status: companyStatus, plan: 'none' },
      { id: CO2, company_name: 'Otra SL', company_email: 'otra@otra.es', status: 'APPROVED', plan: 'none' },
    ],
    billing_customers: customers,
    billing_subscriptions: subs,
  }, { getUser: (tok) => TOKENS[tok] ?? null })
  globalThis.__fakeSupabase = fake
  const st = createFakeStripe(stripe)
  globalThis.__fakeStripe = st
  return { fake, st }
}

const ORIGIN = 'https://yourcvpassport.com'
const call = (body, token = 'tok-ana', headers = {}) =>
  post(handler, 'create-checkout-session', body, { origin: ORIGIN, ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers })
const bodyOf = async (res) => JSON.parse(await res.text())

// ------------------------------------------------------------------ entrada
await t('sin JWT -> 401 y no toca Stripe', async () => {
  const { st } = setup()
  const res = await call({ product: 'pro_monthly' }, null)
  assert.equal(res.status, 401)
  assert.equal(st.calls.sessions.length + st.calls.prices.length, 0)
})

await t('JWT inválido -> 401', async () => {
  setup()
  const res = await call({ product: 'pro_monthly' }, 'tok-falso')
  assert.equal(res.status, 401)
  assert.equal((await bodyOf(res)).code, 'unauthorized')
})

await t('producto fuera de la lista blanca (o un price ID) -> 400 invalid_product', async () => {
  for (const product of ['enterprise', 'price_ProMes', '__proto__', '', 123, undefined]) {
    const { st } = setup()
    const res = await call({ product })
    assert.equal(res.status, 400, String(product))
    assert.equal((await bodyOf(res)).code, 'invalid_product')
    assert.equal(st.calls.sessions.length, 0)
  }
})

await t('origen no permitido -> 403', async () => {
  setup()
  const res = await call({ product: 'pro_monthly' }, 'tok-ana', { origin: 'https://evil.example' })
  assert.equal(res.status, 403)
})

// ------------------------------------------------------------------ sin configurar
await t('sin STRIPE_SECRET_KEY -> 503 billing_not_configured (nada en Stripe ni en la base)', async () => {
  const { fake, st } = setup()
  const saved = ENV.STRIPE_SECRET_KEY
  delete ENV.STRIPE_SECRET_KEY
  try {
    const res = await call({ product: 'pro_monthly' })
    assert.equal(res.status, 503)
    assert.equal((await bodyOf(res)).code, 'billing_not_configured')
    assert.equal(st.calls.sessions.length + st.calls.prices.length + st.calls.customersCreate.length, 0)
    assert.equal(fake.db.log.length, 0, 'ni siquiera consulta la base')
  } finally {
    ENV.STRIPE_SECRET_KEY = saved
  }
})

await t('sin el secreto del price de ESE producto -> 503; los demás siguen funcionando', async () => {
  setup()
  const saved = ENV.STRIPE_PRICE_CREDITS_300
  ENV.STRIPE_PRICE_CREDITS_300 = ''
  try {
    const res = await call({ product: 'credits_300' }, 'tok-owner')
    assert.equal(res.status, 503)
    assert.equal((await bodyOf(res)).code, 'billing_not_configured')
    const ok = await call({ product: 'credits_150' }, 'tok-owner')
    assert.equal(ok.status, 200)
  } finally {
    ENV.STRIPE_PRICE_CREDITS_300 = saved
  }
})

// ------------------------------------------------------------------ price de Stripe
await t('price con otro importe (secreto equivocado) -> 503 price_unavailable, sin cliente ni sesión', async () => {
  const prices = correctPrices()
  prices.price_ProMes = { ...prices.price_ProMes, unit_amount: 1499 }
  const { st } = setup({ stripe: { prices } })
  const res = await call({ product: 'pro_monthly' })
  assert.equal(res.status, 503)
  assert.equal((await bodyOf(res)).code, 'price_unavailable')
  assert.equal(st.calls.customersCreate.length + st.calls.sessions.length, 0)
})

await t('secreto que apunta al price anual en el producto mensual -> 503 (intervalo)', async () => {
  const saved = ENV.STRIPE_PRICE_STARTER_MONTHLY
  ENV.STRIPE_PRICE_STARTER_MONTHLY = 'price_StarterAno'
  try {
    const { st } = setup()
    const res = await call({ product: 'starter_monthly' }, 'tok-owner')
    assert.equal(res.status, 503)
    assert.equal(st.calls.sessions.length, 0)
  } finally {
    ENV.STRIPE_PRICE_STARTER_MONTHLY = saved
  }
})

await t('price inexistente en la cuenta -> 503 price_unavailable', async () => {
  const prices = correctPrices()
  delete prices.price_C50
  setup({ stripe: { prices } })
  const res = await call({ product: 'credits_50' }, 'tok-owner')
  assert.equal(res.status, 503)
  assert.equal((await bodyOf(res)).code, 'price_unavailable')
})

// ------------------------------------------------------------------ perfil (Pro)
await t('Pro por primera vez: prueba de 14 días SIN tarjeta, titular = usuario del JWT', async () => {
  const { fake, st } = setup()
  const res = await call({ product: 'pro_monthly', lang: 'en', returnPath: '/pricing' })
  assert.equal(res.status, 200)
  assert.match((await bodyOf(res)).url, /^https:\/\/checkout\.stripe\.com\//)
  const { params, options } = st.calls.sessions[0]
  assert.equal(params.mode, 'subscription')
  assert.deepEqual(params.line_items, [{ price: 'price_ProMes', quantity: 1 }])
  assert.equal(params.subscription_data.trial_period_days, 14)
  assert.deepEqual(params.subscription_data.trial_settings, { end_behavior: { missing_payment_method: 'cancel' } })
  assert.equal(params.payment_method_collection, 'if_required')
  assert.equal(params.metadata.owner_type, 'profile')
  assert.equal(params.metadata.owner_id, U.ana)
  assert.deepEqual(params.subscription_data.metadata, params.metadata)
  assert.equal(params.success_url, 'https://yourcvpassport.com/pricing?checkout=ok')
  assert.equal(params.cancel_url, 'https://yourcvpassport.com/pricing?checkout=cancel')
  assert.equal(params.locale, 'en')
  assert.ok(options.idempotencyKey.startsWith(`checkout-profile-${U.ana}-pro_monthly-`))
  // cliente creado con metadata del titular y guardado
  assert.deepEqual(st.calls.customersCreate[0].params.metadata, { owner_type: 'profile', owner_id: U.ana })
  assert.equal(st.calls.customersCreate[0].options.idempotencyKey, `ycvp-customer-profile-${U.ana}`)
  assert.equal(fake.db.tables.billing_customers.length, 1)
})

await t('el body no puede cambiar el titular (userId / ownerId ajenos se ignoran)', async () => {
  const { st } = setup()
  const res = await call({ product: 'pro_annual', userId: U.outsider, owner_id: U.outsider, ownerId: U.outsider })
  assert.equal(res.status, 200)
  assert.equal(st.calls.sessions[0].params.metadata.owner_id, U.ana)
})

await t('una prueba por perfil: si ya tuvo una suscripción (aunque esté cancelada) no hay prueba', async () => {
  const { st } = setup({ subs: [{ stripe_subscription_id: 'sub_Vieja', owner_type: 'profile', owner_id: U.ana, status: 'canceled', product_key: 'pro_monthly' }] })
  const res = await call({ product: 'pro_monthly' })
  assert.equal(res.status, 200)
  const { params } = st.calls.sessions[0]
  assert.equal(params.subscription_data.trial_period_days, undefined)
  assert.equal(params.payment_method_collection, undefined, 'sin prueba se pide tarjeta')
})

await t('una prueba por perfil: también si Stripe tiene una suscripción del cliente que la base no conoce', async () => {
  const { st } = setup({
    customers: [{ owner_type: 'profile', owner_id: U.ana, stripe_customer_id: 'cus_Ana' }],
    stripe: { customerSubscriptions: { cus_Ana: [{ id: 'sub_X', status: 'incomplete_expired' }] } },
  })
  const res = await call({ product: 'pro_monthly' })
  assert.equal(res.status, 200)
  assert.equal(st.calls.sessions[0].params.subscription_data.trial_period_days, undefined)
  assert.equal(st.calls.customersCreate.length, 0, 'reutiliza el cliente existente')
})

await t('ya suscrito (base) -> 409 already_subscribed, sin sesión', async () => {
  const { st } = setup({ subs: [{ stripe_subscription_id: 'sub_Viva', owner_type: 'profile', owner_id: U.ana, status: 'trialing', product_key: 'pro_monthly' }] })
  const res = await call({ product: 'pro_annual' })
  assert.equal(res.status, 409)
  assert.equal((await bodyOf(res)).code, 'already_subscribed')
  assert.equal(st.calls.sessions.length, 0)
})

await t('ya suscrito (solo en Stripe, el webhook aún no llegó) -> 409', async () => {
  const { st } = setup({
    customers: [{ owner_type: 'profile', owner_id: U.ana, stripe_customer_id: 'cus_Ana' }],
    stripe: { customerSubscriptions: { cus_Ana: [{ id: 'sub_Nueva', status: 'active' }] } },
  })
  const res = await call({ product: 'pro_monthly' })
  assert.equal(res.status, 409)
  assert.equal(st.calls.sessions.length, 0)
})

await t('returnPath fuera de la lista blanca -> ruta por defecto (/precios)', async () => {
  const { st } = setup()
  await call({ product: 'pro_monthly', returnPath: 'https://evil.example/robar' })
  assert.equal(st.calls.sessions[0].params.success_url, 'https://yourcvpassport.com/precios?checkout=ok')
})

await t('origen localhost (desarrollo) se respeta en las URLs de vuelta', async () => {
  const { st } = setup()
  await call({ product: 'pro_monthly' }, 'tok-ana', { origin: 'http://localhost:5173' })
  assert.equal(st.calls.sessions[0].params.success_url, 'http://localhost:5173/precios?checkout=ok')
})

// ------------------------------------------------------------------ empresa
await t('empresa: OWNER compra un pack -> pago único con factura; titular = su empresa', async () => {
  const { fake, st } = setup()
  const res = await call({ product: 'credits_150', companyId: CO }, 'tok-owner')
  assert.equal(res.status, 200)
  const { params } = st.calls.sessions[0]
  assert.equal(params.mode, 'payment')
  assert.equal(params.metadata.owner_type, 'company')
  assert.equal(params.metadata.owner_id, CO)
  assert.equal(params.metadata.product_key, 'credits_150')
  assert.deepEqual(params.payment_intent_data.metadata, params.metadata)
  assert.equal(params.invoice_creation.enabled, true)
  assert.equal(params.subscription_data, undefined)
  assert.equal(params.success_url, 'https://yourcvpassport.com/company/credits?checkout=ok')
  assert.equal(st.calls.customersCreate[0].params.email, 'rrhh@acme.es')
  assert.equal(fake.db.tables.billing_customers[0].owner_type, 'company')
})

await t('empresa: OWNER sin companyId -> su empresa; plan Growth anual SIN prueba', async () => {
  const { st } = setup()
  const res = await call({ product: 'growth_annual' }, 'tok-owner')
  assert.equal(res.status, 200)
  const { params } = st.calls.sessions[0]
  assert.equal(params.metadata.owner_id, CO)
  assert.deepEqual(params.line_items, [{ price: 'price_GrowthAno', quantity: 1 }])
  assert.equal(params.subscription_data.trial_period_days, undefined)
  assert.equal(params.success_url, 'https://yourcvpassport.com/empresas/planes?checkout=ok')
})

await t('empresa: MEMBER -> 403 company_role_required', async () => {
  const { st } = setup()
  const res = await call({ product: 'starter_monthly', companyId: CO }, 'tok-member')
  assert.equal(res.status, 403)
  assert.equal((await bodyOf(res)).code, 'company_role_required')
  assert.equal(st.calls.sessions.length + st.calls.customersCreate.length, 0)
})

await t('empresa: companyId de otra empresa (no es miembro) -> 403 company_forbidden', async () => {
  const { st } = setup()
  const res = await call({ product: 'credits_50', companyId: CO2 }, 'tok-owner')
  assert.equal(res.status, 403)
  assert.equal((await bodyOf(res)).code, 'company_forbidden')
  assert.equal(st.calls.sessions.length, 0)
})

await t('empresa: usuario sin empresa -> 404 company_required', async () => {
  setup()
  const res = await call({ product: 'growth_monthly' }, 'tok-outsider')
  assert.equal(res.status, 404)
  assert.equal((await bodyOf(res)).code, 'company_required')
})

await t('empresa: suspendida o rechazada -> 403 company_inactive; pendiente sí puede pagar', async () => {
  for (const status of ['SUSPENDED', 'REJECTED']) {
    setup({ companyStatus: status })
    const res = await call({ product: 'credits_50' }, 'tok-owner')
    assert.equal(res.status, 403, status)
    assert.equal((await bodyOf(res)).code, 'company_inactive')
  }
  setup({ companyStatus: 'PENDING' })
  assert.equal((await call({ product: 'credits_50' }, 'tok-owner')).status, 200)
})

await t('empresa: con Starter vivo no abre otra suscripción (409) pero sí deja comprar packs', async () => {
  const subs = [{ stripe_subscription_id: 'sub_Co', owner_type: 'company', owner_id: CO, status: 'active', product_key: 'starter_monthly' }]
  setup({ subs })
  assert.equal((await call({ product: 'growth_monthly' }, 'tok-owner')).status, 409)
  setup({ subs })
  assert.equal((await call({ product: 'credits_1000' }, 'tok-owner')).status, 200)
})

await t('idempotency key: mismo `attempt` -> misma clave; otro attempt -> otra', async () => {
  const { st } = setup()
  await call({ product: 'credits_50', attempt: 'intento-0001' }, 'tok-owner')
  await call({ product: 'credits_50', attempt: 'intento-0001' }, 'tok-owner')
  await call({ product: 'credits_50', attempt: 'intento-0002' }, 'tok-owner')
  const keys = st.calls.sessions.map((s) => s.options.idempotencyKey)
  assert.equal(keys[0], keys[1])
  assert.notEqual(keys[1], keys[2])
})

await t('error de Stripe al crear la sesión -> 502 sin el mensaje de Stripe', async () => {
  const { st } = setup()
  st.checkout.sessions.create = async () => {
    const e = new Error('Your account cannot currently make live charges. secret detail')
    e.type = 'StripeInvalidRequestError'
    throw e
  }
  const res = await call({ product: 'pro_monthly' })
  assert.equal(res.status, 502)
  const text = await res.text()
  assert.ok(!text.includes('secret detail'))
  assert.equal(JSON.parse(text).code, 'stripe_error')
})

console.log(`\n${passed} pruebas OK${process.exitCode ? ' (con fallos)' : ''}`)
