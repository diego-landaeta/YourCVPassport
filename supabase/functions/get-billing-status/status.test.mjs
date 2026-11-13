// Pruebas de get-billing-status (index.ts REAL con esbuild y base en memoria; no llama a Stripe):
//   node supabase/functions/get-billing-status/status.test.mjs
import assert from 'node:assert/strict'
import { loadEdge, post, createFakeSupabase } from '../_shared/testHarness.mjs'
import { FAKE_STRIPE_SECRET, PRICE_ENV } from '../_shared/testStripe.mjs'

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
const handler = await loadEdge('get-billing-status', ENV)

const ANA = '11111111-1111-4111-8111-111111111111'
const OWNER = '22222222-2222-4222-8222-222222222222'
const CO = 'c0c0c0c0-0000-4000-8000-000000000001'

function setup({ subs = [], customers = [], hooks = {} } = {}) {
  globalThis.__fakeSupabase = createFakeSupabase({
    profiles: [{ id: ANA, plan: 'pro' }, { id: OWNER, plan: 'free' }],
    company_users: [{ company_id: CO, user_id: OWNER, role: 'OWNER' }],
    companies: [{ id: CO, company_name: 'Acme', company_email: 'rrhh@acme.es', status: 'APPROVED', plan: 'growth', credit_balance: 500 }],
    billing_customers: customers,
    billing_subscriptions: subs,
  }, { getUser: (tok) => ({ 'tok-ana': ANA, 'tok-owner': OWNER }[tok] ?? null), ...hooks })
}
const call = (token, body = {}) => post(handler, 'get-billing-status', body, { origin: 'https://yourcvpassport.com', ...(token ? { authorization: `Bearer ${token}` } : {}) })
const read = async (res) => JSON.parse(await res.text())

await t('perfil en prueba: plan, suscripción, días y sin prueba disponible; solo booleanos de configuración', async () => {
  setup({
    subs: [{ stripe_subscription_id: 'sub_A', owner_type: 'profile', owner_id: ANA, product_key: 'pro_monthly', status: 'trialing', trial_end: '2026-11-17T00:00:00.000Z', current_period_end: '2026-11-17T00:00:00.000Z', cancel_at_period_end: false, price_id: 'price_ProMes' }],
    customers: [{ owner_type: 'profile', owner_id: ANA, stripe_customer_id: 'cus_Ana' }],
  })
  const res = await call('tok-ana')
  assert.equal(res.status, 200)
  const body = await read(res)
  assert.equal(body.enabled, true)
  assert.equal(body.profile.plan, 'pro')
  assert.equal(body.profile.trialAvailable, false)
  assert.equal(body.profile.hasBillingAccount, true)
  assert.deepEqual(body.profile.subscription, { productKey: 'pro_monthly', status: 'trialing', trialEnd: '2026-11-17T00:00:00.000Z', currentPeriodEnd: '2026-11-17T00:00:00.000Z', cancelAtPeriodEnd: false })
  assert.equal(body.company, null)
  assert.ok(Object.values(body.configured).every((v) => v === true))
  const raw = JSON.stringify(body)
  assert.ok(!raw.includes('price_') && !raw.includes('cus_'), 'no expone price IDs ni clientes')
})

await t('OWNER de empresa: plan y gestión de la empresa; perfil sin suscripción con prueba disponible', async () => {
  setup({ subs: [{ stripe_subscription_id: 'sub_C', owner_type: 'company', owner_id: CO, product_key: 'growth_monthly', status: 'active', cancel_at_period_end: true }] })
  const body = await read(await call('tok-owner'))
  assert.equal(body.profile.trialAvailable, true)
  assert.equal(body.profile.subscription, null)
  assert.equal(body.company.id, CO)
  assert.equal(body.company.canManage, true)
  assert.equal(body.company.plan, 'growth')
  assert.equal(body.company.subscription.cancelAtPeriodEnd, true)
  assert.equal(body.company.creditBalance, undefined, 'no devuelve datos que ya lee el panel')
})

await t('sin Stripe configurado: enabled false y todos los productos a false', async () => {
  setup()
  const saved = ENV.STRIPE_SECRET_KEY
  delete ENV.STRIPE_SECRET_KEY
  try {
    const body = await read(await call('tok-ana'))
    assert.equal(body.enabled, false)
    assert.ok(Object.values(body.configured).every((v) => v === false))
  } finally {
    ENV.STRIPE_SECRET_KEY = saved
  }
})

await t('tablas de pagos sin crear (migración pendiente): responde 200 como sin pagos', async () => {
  setup({ hooks: { onQuery: (q) => (q.table.startsWith('billing_') ? { error: { code: '42P01', message: 'relation does not exist' } } : null) } })
  const res = await call('tok-ana')
  assert.equal(res.status, 200)
  const body = await read(res)
  assert.equal(body.profile.subscription, null)
  assert.equal(body.profile.plan, 'pro')
})

await t('sin JWT o JWT inválido -> 401', async () => {
  setup()
  assert.equal((await call(null)).status, 401)
  assert.equal((await call('tok-falso')).status, 401)
})

console.log(`\n${passed} pruebas OK${process.exitCode ? ' (con fallos)' : ''}`)
