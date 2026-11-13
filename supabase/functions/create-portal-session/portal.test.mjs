// Pruebas de create-portal-session (index.ts REAL con esbuild, base en memoria, Stripe falso):
//   node supabase/functions/create-portal-session/portal.test.mjs
import assert from 'node:assert/strict'
import { loadEdge, post, createFakeSupabase } from '../_shared/testHarness.mjs'
import { createFakeStripe, FAKE_STRIPE_SECRET } from '../_shared/testStripe.mjs'

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
}
console.error = () => {}
console.warn = () => {}
const handler = await loadEdge('create-portal-session', ENV)

const ANA = '11111111-1111-4111-8111-111111111111'
const OWNER = '22222222-2222-4222-8222-222222222222'
const MEMBER = '33333333-3333-4333-8333-333333333333'
const CO = 'c0c0c0c0-0000-4000-8000-000000000001'

function setup(customers = [{ owner_type: 'profile', owner_id: ANA, stripe_customer_id: 'cus_Ana' }, { owner_type: 'company', owner_id: CO, stripe_customer_id: 'cus_Acme' }]) {
  globalThis.__fakeSupabase = createFakeSupabase({
    company_users: [{ company_id: CO, user_id: OWNER, role: 'ADMIN' }, { company_id: CO, user_id: MEMBER, role: 'VIEWER' }],
    companies: [{ id: CO, company_name: 'Acme', company_email: 'rrhh@acme.es', status: 'APPROVED', plan: 'starter' }],
    billing_customers: customers,
  }, { getUser: (tok) => ({ 'tok-ana': ANA, 'tok-owner': OWNER, 'tok-member': MEMBER }[tok] ?? null) })
  const st = createFakeStripe()
  globalThis.__fakeStripe = st
  return st
}
const call = (body, token = 'tok-ana') =>
  post(handler, 'create-portal-session', body, { origin: 'https://www.yourcvpassport.com', ...(token ? { authorization: `Bearer ${token}` } : {}) })

await t('perfil: portal del cliente del usuario del JWT, vuelta a /precios', async () => {
  const st = setup()
  const res = await call({ lang: 'en' })
  assert.equal(res.status, 200)
  assert.match(JSON.parse(await res.text()).url, /^https:\/\/billing\.stripe\.com\//)
  assert.deepEqual(st.calls.portal[0], { customer: 'cus_Ana', return_url: 'https://www.yourcvpassport.com/precios', locale: 'en' })
})

await t('empresa: ADMIN abre el portal de su empresa con la ruta pedida (lista blanca)', async () => {
  const st = setup()
  const res = await call({ owner: 'company', returnPath: '/company/credits' }, 'tok-owner')
  assert.equal(res.status, 200)
  assert.equal(st.calls.portal[0].customer, 'cus_Acme')
  assert.equal(st.calls.portal[0].return_url, 'https://www.yourcvpassport.com/company/credits')
})

await t('empresa: VIEWER -> 403 company_role_required', async () => {
  const st = setup()
  const res = await call({ owner: 'company' }, 'tok-member')
  assert.equal(res.status, 403)
  assert.equal(JSON.parse(await res.text()).code, 'company_role_required')
  assert.equal(st.calls.portal.length, 0)
})

await t('sin cliente en Stripe -> 404 no_billing_account', async () => {
  setup([])
  const res = await call({})
  assert.equal(res.status, 404)
  assert.equal(JSON.parse(await res.text()).code, 'no_billing_account')
})

await t('sin STRIPE_SECRET_KEY -> 503 billing_not_configured', async () => {
  setup()
  const saved = ENV.STRIPE_SECRET_KEY
  delete ENV.STRIPE_SECRET_KEY
  try {
    const res = await call({})
    assert.equal(res.status, 503)
    assert.equal(JSON.parse(await res.text()).code, 'billing_not_configured')
  } finally {
    ENV.STRIPE_SECRET_KEY = saved
  }
})

await t('sin JWT -> 401; owner inválido -> 400; returnPath ajeno -> ruta por defecto', async () => {
  setup()
  assert.equal((await call({}, null)).status, 401)
  assert.equal((await call({ owner: 'admin' })).status, 400)
  const st = setup()
  await call({ returnPath: 'https://evil.example' })
  assert.equal(st.calls.portal[0].return_url, 'https://www.yourcvpassport.com/precios')
})

console.log(`\n${passed} pruebas OK${process.exitCode ? ' (con fallos)' : ''}`)
