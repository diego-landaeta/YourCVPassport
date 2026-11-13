// Pruebas de stripe-webhook con el index.ts REAL empaquetado (esbuild), una base en memoria y
// un Stripe falso: firma, idempotencia, plan del perfil / de la empresa, créditos y correo de
// fin de prueba. Sin red ni claves reales:
//   node supabase/functions/stripe-webhook/webhook.test.mjs
import assert from 'node:assert/strict'
import { loadEdge, createFakeSupabase } from '../_shared/testHarness.mjs'
import { createFakeStripe, FAKE_STRIPE_SECRET, FAKE_WEBHOOK_SECRET, PRICE_ENV, VALID_SIGNATURE } from '../_shared/testStripe.mjs'

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
  STRIPE_WEBHOOK_SECRET: FAKE_WEBHOOK_SECRET,
  BREVO_API_KEY: 'clave-brevo-falsa-de-test',
  ...PRICE_ENV,
}
let brevo = []
globalThis.fetch = async (url, init) => {
  if (String(url) === 'https://api.brevo.com/v3/smtp/email') {
    brevo.push(JSON.parse(init.body))
    return new Response(JSON.stringify({ messageId: '<test@brevo>' }), { status: 201, headers: { 'content-type': 'application/json' } })
  }
  throw new TypeError(`red deshabilitada en el test: ${url}`)
}
console.error = () => {}
console.warn = () => {}
console.log = ((orig) => (...a) => { if (/^(ok|FAIL|\n)/.test(String(a[0]))) orig(...a) })(console.log)
const handler = await loadEdge('stripe-webhook', ENV)

const ANA = '11111111-1111-4111-8111-111111111111'
const BEA = '55555555-5555-4555-8555-555555555555'
const CO = 'c0c0c0c0-0000-4000-8000-000000000001'

/** Base con la semántica de la RPC de la migración 20261104 (idempotente por referencia). */
function setup({ profiles, companies, subs = [], customers = [], stripe = {} } = {}) {
  const tables = {
    profiles: profiles ?? [
      { id: ANA, plan: 'free', email: 'ana@example.test', full_name: 'Ana', registro_idioma: 'es' },
      { id: BEA, plan: 'free', email: 'bea@example.test', full_name: 'Bea', registro_idioma: 'en' },
    ],
    companies: companies ?? [{ id: CO, company_name: 'Acme SL', plan: 'none', credit_balance: 10, total_credits_purchased: 0 }],
    billing_customers: customers,
    billing_subscriptions: subs,
    processed_webhook_events: [],
    company_credits_history: [],
  }
  const fake = createFakeSupabase(tables, {
    onQuery(q) {
      if (q.table === 'processed_webhook_events' && q.op === 'insert') {
        const id = q.rowsToInsert[0].event_id
        if (fake.db.tables.processed_webhook_events.some((r) => r.event_id === id)) {
          return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
        }
      }
      return null
    },
    rpc(name, args) {
      if (name !== 'add_company_credits_from_payment') return { data: null, error: { message: `rpc inesperada ${name}` } }
      const hist = fake.db.tables.company_credits_history
      if (hist.some((h) => h.metadata.stripe_reference === args.p_reference)) return { data: { applied: false, reason: 'already_processed' }, error: null }
      const co = fake.db.tables.companies.find((c) => c.id === args.p_company_id)
      if (!co) return { data: null, error: { code: 'P0002', message: 'COMPANY_NOT_FOUND' } }
      co.credit_balance += args.p_amount
      co.total_credits_purchased += args.p_amount
      hist.push({ company_id: co.id, amount: args.p_amount, balance_after: co.credit_balance, transaction_type: 'PURCHASE', metadata: { ...args.p_metadata, stripe_reference: args.p_reference } })
      return { data: { applied: true, balance: co.credit_balance }, error: null }
    },
  })
  globalThis.__fakeSupabase = fake
  const st = createFakeStripe(stripe)
  globalThis.__fakeStripe = st
  brevo = []
  return { fake, st, db: fake.db.tables }
}

let nEvent = 0
const evt = (type, object, id) => ({ id: id ?? `evt_${++nEvent}`, type, data: { object } })
const send = (event, signature = VALID_SIGNATURE) =>
  handler(new Request('https://edge.example.test/functions/v1/stripe-webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': signature },
    body: JSON.stringify(event),
  }))

const sub = (id, over = {}) => ({
  id,
  customer: 'cus_Ana',
  status: 'trialing',
  trial_end: 1767225600,
  cancel_at_period_end: false,
  items: { data: [{ price: { id: 'price_ProMes' }, current_period_end: 1767225600 }] },
  metadata: { owner_type: 'profile', owner_id: ANA, product_key: 'pro_monthly' },
  ...over,
})
const coSub = (id, priceId, over = {}) => sub(id, {
  customer: 'cus_Acme', status: 'active', trial_end: null,
  items: { data: [{ price: { id: priceId }, current_period_end: 1767225600 }] },
  metadata: { owner_type: 'company', owner_id: CO, product_key: 'starter_monthly' },
  ...over,
})

// ------------------------------------------------------------------ firma y configuración
await t('firma no válida -> 400 y no toca la base', async () => {
  const { fake } = setup()
  const res = await send(evt('customer.subscription.created', sub('sub_1')), 't=1,v1=mala')
  assert.equal(res.status, 400)
  assert.equal(fake.db.log.length, 0)
})

await t('sin cabecera stripe-signature -> 400', async () => {
  setup()
  const res = await handler(new Request('https://edge.example.test/functions/v1/stripe-webhook', { method: 'POST', body: '{}' }))
  assert.equal(res.status, 400)
})

await t('sin STRIPE_WEBHOOK_SECRET -> 503 (pagos sin activar), sin detalles', async () => {
  setup()
  const saved = ENV.STRIPE_WEBHOOK_SECRET
  delete ENV.STRIPE_WEBHOOK_SECRET
  try {
    const res = await send(evt('invoice.paid', {}))
    assert.equal(res.status, 503)
    assert.equal(await res.text(), 'billing not configured')
  } finally {
    ENV.STRIPE_WEBHOOK_SECRET = saved
  }
})

await t('GET -> 405', async () => {
  const res = await handler(new Request('https://edge.example.test/functions/v1/stripe-webhook'))
  assert.equal(res.status, 405)
})

// ------------------------------------------------------------------ perfil
await t('suscripción Pro en prueba -> fila en billing_subscriptions y perfil a pro', async () => {
  const { db } = setup({ stripe: { subscriptions: { sub_A: sub('sub_A') } } })
  const res = await send(evt('customer.subscription.created', sub('sub_A')))
  assert.equal(res.status, 200)
  const row = db.billing_subscriptions[0]
  assert.equal(row.stripe_subscription_id, 'sub_A')
  assert.equal(row.owner_type, 'profile')
  assert.equal(row.owner_id, ANA)
  assert.equal(row.product_key, 'pro_monthly')
  assert.equal(row.status, 'trialing')
  assert.equal(row.trial_end, '2026-01-01T00:00:00.000Z')
  assert.equal(db.profiles.find((p) => p.id === ANA).plan, 'pro')
  assert.equal(db.billing_customers[0].stripe_customer_id, 'cus_Ana', 'enlaza el cliente si no estaba')
})

await t('el estado se relee de Stripe: un evento viejo «trialing» no pisa un «canceled» más reciente', async () => {
  const { db } = setup({
    profiles: [{ id: ANA, plan: 'pro' }],
    stripe: { subscriptions: { sub_A: sub('sub_A', { status: 'canceled' }) } },
  })
  await send(evt('customer.subscription.updated', sub('sub_A', { status: 'trialing' })))
  assert.equal(db.billing_subscriptions[0].status, 'canceled')
  assert.equal(db.profiles[0].plan, 'free')
})

await t('prueba acabada sin tarjeta (Stripe la cancela) -> perfil vuelve a free', async () => {
  const { db } = setup({
    profiles: [{ id: ANA, plan: 'pro' }],
    subs: [{ stripe_subscription_id: 'sub_A', owner_type: 'profile', owner_id: ANA, status: 'trialing', product_key: 'pro_monthly' }],
    stripe: { subscriptions: { sub_A: sub('sub_A', { status: 'canceled' }) } },
  })
  const res = await send(evt('customer.subscription.deleted', sub('sub_A', { status: 'canceled' })))
  assert.equal(res.status, 200)
  assert.equal(db.profiles[0].plan, 'free')
  assert.equal(db.billing_subscriptions[0].status, 'canceled')
})

await t('baja de una suscripción con OTRA viva -> el perfil sigue en pro', async () => {
  const { db } = setup({
    profiles: [{ id: ANA, plan: 'pro' }],
    subs: [
      { stripe_subscription_id: 'sub_A', owner_type: 'profile', owner_id: ANA, status: 'active', product_key: 'pro_monthly' },
      { stripe_subscription_id: 'sub_B', owner_type: 'profile', owner_id: ANA, status: 'active', product_key: 'pro_annual' },
    ],
    stripe: { subscriptions: { sub_A: sub('sub_A', { status: 'canceled' }) } },
  })
  await send(evt('customer.subscription.deleted', sub('sub_A', { status: 'canceled' })))
  assert.equal(db.profiles[0].plan, 'pro')
})

await t('perfil enterprise (admin) no baja a free al cancelar', async () => {
  const { db } = setup({
    profiles: [{ id: ANA, plan: 'enterprise' }],
    stripe: { subscriptions: { sub_A: sub('sub_A', { status: 'canceled' }) } },
  })
  await send(evt('customer.subscription.deleted', sub('sub_A', { status: 'canceled' })))
  assert.equal(db.profiles[0].plan, 'enterprise')
})

await t('suscripción sin metadata: el titular sale de billing_customers', async () => {
  const s = sub('sub_C', { metadata: {} })
  const { db } = setup({
    customers: [{ owner_type: 'profile', owner_id: ANA, stripe_customer_id: 'cus_Ana' }],
    stripe: { subscriptions: { sub_C: s } },
  })
  await send(evt('customer.subscription.updated', s))
  assert.equal(db.billing_subscriptions[0].owner_id, ANA)
  assert.equal(db.profiles.find((p) => p.id === ANA).plan, 'pro')
})

await t('suscripción de nadie (creada a mano en Stripe) -> 200 y no cambia nada', async () => {
  const s = sub('sub_D', { metadata: {}, customer: 'cus_Desconocido' })
  const { db } = setup({ stripe: { subscriptions: { sub_D: s } } })
  const res = await send(evt('customer.subscription.created', s))
  assert.equal(res.status, 200)
  assert.equal(db.billing_subscriptions.length, 0)
})

await t('checkout de suscripción completado -> sincroniza la suscripción', async () => {
  const { db, st } = setup({ stripe: { subscriptions: { sub_A: sub('sub_A') } } })
  await send(evt('checkout.session.completed', { id: 'cs_1', mode: 'subscription', subscription: 'sub_A', metadata: { owner_type: 'profile', owner_id: ANA, product_key: 'pro_monthly' } }))
  assert.deepEqual(st.calls.subRetrieve, ['sub_A'])
  assert.equal(db.profiles.find((p) => p.id === ANA).plan, 'pro')
})

// ------------------------------------------------------------------ idempotencia
await t('mismo evento dos veces -> la segunda responde duplicate y no repite nada', async () => {
  const { db, st } = setup()
  const e = evt('checkout.session.completed', { id: 'cs_pack', mode: 'payment', payment_status: 'paid', amount_total: 12900, customer: 'cus_Acme', metadata: { owner_type: 'company', owner_id: CO, product_key: 'credits_150' } }, 'evt_repetido')
  assert.equal((await send(e)).status, 200)
  const second = await send(e)
  assert.equal(second.status, 200)
  assert.deepEqual(JSON.parse(await second.text()), { received: true, duplicate: true })
  assert.equal(db.company_credits_history.length, 1)
  assert.equal(db.companies[0].credit_balance, 160)
  assert.equal(st.calls.subRetrieve.length, 0)
})

await t('si el proceso falla se libera el evento (500) y el reintento de Stripe lo procesa', async () => {
  const { fake, db } = setup({ stripe: { subscriptions: {} } })
  const failing = fake.db.hooks.rpc
  fake.db.hooks.rpc = () => ({ data: null, error: { message: 'connection reset' } })
  const e = evt('checkout.session.completed', { id: 'cs_x', mode: 'payment', payment_status: 'paid', amount_total: 4900, metadata: { owner_type: 'company', owner_id: CO, product_key: 'credits_50' } }, 'evt_falla')
  const res = await send(e)
  assert.equal(res.status, 500)
  assert.equal(await res.text(), 'internal error', 'sin detalles internos')
  assert.equal(db.processed_webhook_events.length, 0, 'evento liberado')
  fake.db.hooks.rpc = failing
  assert.equal((await send(e)).status, 200)
  assert.equal(db.companies[0].credit_balance, 60)
})

await t('dos eventos distintos con la misma sesión de pago -> los créditos se abonan una vez (referencia)', async () => {
  const { db } = setup()
  const session = { id: 'cs_doble', mode: 'payment', payment_status: 'paid', amount_total: 4900, metadata: { owner_type: 'company', owner_id: CO, product_key: 'credits_50' } }
  await send(evt('checkout.session.completed', session))
  await send(evt('checkout.session.async_payment_succeeded', session))
  assert.equal(db.company_credits_history.length, 1)
  assert.equal(db.companies[0].credit_balance, 60)
})

// ------------------------------------------------------------------ packs de créditos
await t('pack pagado -> créditos del catálogo (no del importe) con referencia = sesión', async () => {
  const { db } = setup()
  await send(evt('checkout.session.completed', { id: 'cs_1000', mode: 'payment', payment_status: 'paid', amount_total: 69900, metadata: { owner_type: 'company', owner_id: CO, product_key: 'credits_1000' } }))
  const h = db.company_credits_history[0]
  assert.equal(h.amount, 1000)
  assert.equal(h.metadata.stripe_reference, 'cs_1000')
  assert.equal(h.metadata.price, '699.00')
  assert.equal(db.companies[0].credit_balance, 1010)
})

await t('pago asíncrono aún sin cobrar -> no abona hasta async_payment_succeeded', async () => {
  const { db } = setup()
  const s = { id: 'cs_sepa', mode: 'payment', payment_status: 'unpaid', metadata: { owner_type: 'company', owner_id: CO, product_key: 'credits_50' } }
  await send(evt('checkout.session.completed', s))
  assert.equal(db.company_credits_history.length, 0)
  await send(evt('checkout.session.async_payment_succeeded', { ...s, payment_status: 'paid' }))
  assert.equal(db.company_credits_history.length, 1)
})

await t('sesión de pago con metadata de perfil o producto de suscripción -> no abona nada', async () => {
  const { db } = setup()
  await send(evt('checkout.session.completed', { id: 'cs_a', mode: 'payment', payment_status: 'paid', metadata: { owner_type: 'profile', owner_id: ANA, product_key: 'credits_50' } }))
  await send(evt('checkout.session.completed', { id: 'cs_b', mode: 'payment', payment_status: 'paid', metadata: { owner_type: 'company', owner_id: CO, product_key: 'growth_monthly' } }))
  await send(evt('checkout.session.completed', { id: 'cs_c', mode: 'payment', payment_status: 'paid', metadata: { owner_type: 'company', owner_id: 'no-es-uuid', product_key: 'credits_50' } }))
  assert.equal(db.company_credits_history.length, 0)
})

// ------------------------------------------------------------------ planes de empresa
await t('Starter mensual: alta -> companies.plan starter y 100 créditos (referencia = factura)', async () => {
  const s = coSub('sub_Co', 'price_StarterMes')
  const { db } = setup({ stripe: { subscriptions: { sub_Co: s } } })
  await send(evt('customer.subscription.created', s))
  assert.equal(db.companies[0].plan, 'starter')
  await send(evt('invoice.paid', { id: 'in_1', status: 'paid', billing_reason: 'subscription_create', amount_paid: 9900, subscription: 'sub_Co', lines: { data: [{ price: { id: 'price_StarterMes' } }] } }))
  assert.equal(db.companies[0].credit_balance, 110)
  assert.equal(db.company_credits_history[0].metadata.stripe_reference, 'in_1')
  // renovación del mes siguiente
  await send(evt('invoice.paid', { id: 'in_2', status: 'paid', billing_reason: 'subscription_cycle', amount_paid: 9900, subscription: 'sub_Co', lines: { data: [{ price: { id: 'price_StarterMes' } }] } }))
  assert.equal(db.companies[0].credit_balance, 210)
})

await t('Growth anual: cada factura anual pagada abona 12 000 créditos', async () => {
  const s = coSub('sub_G', 'price_GrowthAno', { metadata: { owner_type: 'company', owner_id: CO, product_key: 'growth_annual' } })
  const { db } = setup({ stripe: { subscriptions: { sub_G: s } } })
  await send(evt('invoice.paid', { id: 'in_g', status: 'paid', billing_reason: 'subscription_create', amount_paid: 239040, parent: { subscription_details: { subscription: 'sub_G' } }, lines: { data: [{ pricing: { price_details: { price: 'price_GrowthAno' } } }] } }))
  assert.equal(db.companies[0].plan, 'growth')
  assert.equal(db.companies[0].credit_balance, 12010)
  assert.equal(db.company_credits_history[0].metadata.price, '2390.40')
})

await t('cambio de plan a mitad de periodo (subscription_update) no abona créditos', async () => {
  const s = coSub('sub_Co', 'price_GrowthMes')
  const { db } = setup({ stripe: { subscriptions: { sub_Co: s } } })
  await send(evt('invoice.paid', { id: 'in_up', status: 'paid', billing_reason: 'subscription_update', amount_paid: 15000, subscription: 'sub_Co', lines: { data: [{ price: { id: 'price_GrowthMes' } }] } }))
  assert.equal(db.company_credits_history.length, 0)
  assert.equal(db.companies[0].plan, 'growth', 'el plan sí cambia')
})

await t('factura pagada del plan Pro (perfil) no abona créditos a nadie', async () => {
  const { db } = setup({ stripe: { subscriptions: { sub_A: sub('sub_A', { status: 'active' }) } } })
  await send(evt('invoice.paid', { id: 'in_pro', status: 'paid', billing_reason: 'subscription_cycle', amount_paid: 1500, subscription: 'sub_A', lines: { data: [{ price: { id: 'price_ProMes' } }] } }))
  assert.equal(db.company_credits_history.length, 0)
  assert.equal(db.profiles.find((p) => p.id === ANA).plan, 'pro')
})

await t('baja del plan de empresa -> companies.plan none (enterprise no se toca)', async () => {
  const s = coSub('sub_Co', 'price_StarterMes', { status: 'canceled' })
  const { db } = setup({ companies: [{ id: CO, plan: 'starter', credit_balance: 0, total_credits_purchased: 0 }], stripe: { subscriptions: { sub_Co: s } } })
  await send(evt('customer.subscription.deleted', s))
  assert.equal(db.companies[0].plan, 'none')
  const r2 = setup({ companies: [{ id: CO, plan: 'enterprise', credit_balance: 0, total_credits_purchased: 0 }], stripe: { subscriptions: { sub_Co: s } } })
  await send(evt('customer.subscription.deleted', s))
  assert.equal(r2.db.companies[0].plan, 'enterprise')
})

await t('cobro fallido -> estado past_due guardado y el plan se mantiene mientras Stripe reintenta', async () => {
  const s = coSub('sub_Co', 'price_StarterMes', { status: 'past_due' })
  const { db } = setup({ companies: [{ id: CO, plan: 'starter', credit_balance: 0, total_credits_purchased: 0 }], stripe: { subscriptions: { sub_Co: s } } })
  await send(evt('invoice.payment_failed', { id: 'in_f', subscription: 'sub_Co' }))
  assert.equal(db.billing_subscriptions[0].status, 'past_due')
  assert.equal(db.companies[0].plan, 'starter')
  assert.equal(db.company_credits_history.length, 0)
})

// ------------------------------------------------------------------ fin de prueba
await t('trial_will_end sin tarjeta -> correo en español con enlace para añadirla', async () => {
  const s = sub('sub_A')
  setup({ stripe: { subscriptions: { sub_A: s } } })
  const res = await send(evt('customer.subscription.trial_will_end', s))
  assert.equal(res.status, 200)
  assert.equal(brevo.length, 1)
  assert.deepEqual(brevo[0].to, [{ email: 'ana@example.test' }])
  assert.match(brevo[0].subject, /Tu prueba del plan Profesional termina pronto/)
  assert.match(brevo[0].htmlContent, /https:\/\/yourcvpassport\.com\/precios\?billing=manage/)
  assert.match(brevo[0].htmlContent, /Añadir mi tarjeta/)
})

await t('trial_will_end de un perfil en inglés con tarjeta del cliente -> correo en inglés que avisa del cobro', async () => {
  const s = sub('sub_B', { customer: 'cus_Bea', metadata: { owner_type: 'profile', owner_id: BEA, product_key: 'pro_annual' }, items: { data: [{ price: { id: 'price_ProAno' } }] } })
  setup({ stripe: { subscriptions: { sub_B: s }, customers: { cus_Bea: { id: 'cus_Bea', invoice_settings: { default_payment_method: 'pm_1' } } } } })
  await send(evt('customer.subscription.trial_will_end', s))
  assert.equal(brevo.length, 1)
  assert.match(brevo[0].subject, /Your Professional plan trial ends soon/)
  assert.match(brevo[0].htmlContent, /pricing\?billing=manage/)
  assert.match(brevo[0].htmlContent, /Manage my subscription/)
})

await t('trial_will_end de una suscripción que ya no está en prueba -> sin correo', async () => {
  const s = sub('sub_A', { status: 'active' })
  setup({ stripe: { subscriptions: { sub_A: s } } })
  await send(evt('customer.subscription.trial_will_end', s))
  assert.equal(brevo.length, 0)
})

await t('evento desconocido -> 200 sin cambios', async () => {
  const { db } = setup()
  const res = await send(evt('customer.created', { id: 'cus_1' }))
  assert.equal(res.status, 200)
  assert.equal(db.billing_subscriptions.length, 0)
})

console.log(`\n${passed} pruebas OK${process.exitCode ? ' (con fallos)' : ''}`)
