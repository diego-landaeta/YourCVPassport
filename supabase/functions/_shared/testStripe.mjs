// Doble de Stripe SOLO para las pruebas de Node de las funciones de pago (no se despliega).
// _shared/testHarness.mjs sustituye `new Stripe(...)` por globalThis.__fakeStripe: cada prueba
// monta uno con createFakeStripe() y mira `calls` para saber qué se habría mandado a Stripe.
//
// Claves de prueba: se componen por partes para que el escáner de secretos del repo no las
// confunda con claves reales.

export const FAKE_STRIPE_SECRET = ['sk', 'test', 'clavefalsa0123456789'].join('_')
export const FAKE_WEBHOOK_SECRET = ['whsec', 'secretofalso0123456789'].join('_')
export const VALID_SIGNATURE = 't=1,v1=firma-de-prueba-valida'

export const PRICE_ENV = {
  STRIPE_PRICE_PRO_MONTHLY: 'price_ProMes',
  STRIPE_PRICE_PRO_ANNUAL: 'price_ProAno',
  STRIPE_PRICE_STARTER_MONTHLY: 'price_StarterMes',
  STRIPE_PRICE_STARTER_ANNUAL: 'price_StarterAno',
  STRIPE_PRICE_GROWTH_MONTHLY: 'price_GrowthMes',
  STRIPE_PRICE_GROWTH_ANNUAL: 'price_GrowthAno',
  STRIPE_PRICE_CREDITS_50: 'price_C50',
  STRIPE_PRICE_CREDITS_150: 'price_C150',
  STRIPE_PRICE_CREDITS_300: 'price_C300',
  STRIPE_PRICE_CREDITS_1000: 'price_C1000',
}

const rec = (id, amount, interval) => ({ id, active: true, currency: 'eur', unit_amount: amount, type: 'recurring', recurring: { interval, interval_count: 1 } })
const one = (id, amount) => ({ id, active: true, currency: 'eur', unit_amount: amount, type: 'one_time', recurring: null })

/** Prices tal y como estarían bien creados en Stripe. */
export function correctPrices() {
  return {
    price_ProMes: rec('price_ProMes', 1500, 'month'),
    price_ProAno: rec('price_ProAno', 14400, 'year'),
    price_StarterMes: rec('price_StarterMes', 9900, 'month'),
    price_StarterAno: rec('price_StarterAno', 95040, 'year'),
    price_GrowthMes: rec('price_GrowthMes', 24900, 'month'),
    price_GrowthAno: rec('price_GrowthAno', 239040, 'year'),
    price_C50: one('price_C50', 4900),
    price_C150: one('price_C150', 12900),
    price_C300: one('price_C300', 23900),
    price_C1000: one('price_C1000', 69900),
  }
}

function stripeError(code, message = code) {
  const e = new Error(message)
  e.type = 'StripeInvalidRequestError'
  e.code = code
  return e
}

/**
 * opts: prices { id: price }, subscriptions { id: sub }, customers { id: customer },
 * customerSubscriptions { customerId: [{ id, status }] }
 */
export function createFakeStripe(opts = {}) {
  const prices = opts.prices ?? correctPrices()
  const subscriptions = opts.subscriptions ?? {}
  const customers = opts.customers ?? {}
  const customerSubscriptions = opts.customerSubscriptions ?? {}
  const calls = { prices: [], customersCreate: [], sessions: [], portal: [], subRetrieve: [], customerRetrieve: [] }
  let nCustomer = 0
  return {
    calls,
    subscriptions: {
      _data: subscriptions,
      async retrieve(id) {
        calls.subRetrieve.push(id)
        if (!subscriptions[id]) throw stripeError('resource_missing', `No such subscription: ${id}`)
        return JSON.parse(JSON.stringify(subscriptions[id]))
      },
      async list({ customer }) {
        return { data: customerSubscriptions[customer] ?? [] }
      },
    },
    prices: {
      async retrieve(id) {
        calls.prices.push(id)
        if (!prices[id]) throw stripeError('resource_missing', `No such price: ${id}`)
        return prices[id]
      },
    },
    customers: {
      async create(params, options) {
        calls.customersCreate.push({ params, options })
        nCustomer++
        return { id: `cus_Fake${nCustomer}` }
      },
      async retrieve(id) {
        calls.customerRetrieve.push(id)
        return customers[id] ?? { id, invoice_settings: { default_payment_method: null } }
      },
    },
    checkout: {
      sessions: {
        async create(params, options) {
          calls.sessions.push({ params, options })
          return { id: `cs_test_${calls.sessions.length}`, url: `https://checkout.stripe.com/c/pay/cs_test_${calls.sessions.length}` }
        },
      },
    },
    billingPortal: {
      sessions: {
        async create(params) {
          calls.portal.push(params)
          return { id: 'bps_test_1', url: 'https://billing.stripe.com/p/session/test_1' }
        },
      },
    },
    webhooks: {
      async constructEventAsync(body, signature, secret) {
        if (signature !== VALID_SIGNATURE || secret !== FAKE_WEBHOOK_SECRET) throw new Error('No signatures found matching the expected signature for payload')
        return JSON.parse(body)
      },
    },
  }
}
