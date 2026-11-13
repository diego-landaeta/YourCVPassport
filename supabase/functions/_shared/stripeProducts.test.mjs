// Pruebas del catálogo de pagos (stripeProducts.ts): lista blanca de productos,
// importes, «sin configurar» y comprobación del price de Stripe. Sin red:
//   node supabase/functions/_shared/stripeProducts.test.mjs
import assert from 'node:assert/strict'
import {
  BILLING_PRODUCTS,
  PRODUCT_KEYS,
  configuredProducts,
  isBillingConfigured,
  isProductKey,
  priceIdFor,
  priceMatchesProduct,
  productKeyForPriceId,
  resolveReturnPath,
  defaultReturnPath,
  stripeSecretConfigured,
  centsToEuros,
  isLiveStatus,
} from './stripeProducts.ts'

let passed = 0
async function t(name, fn) {
  try {
    await fn()
    passed++
    console.log(`ok   ${name}`)
  } catch (e) {
    console.log(`FAIL ${name}\n     ${e.message}`)
    process.exitCode = 1
  }
}

// Clave falsa con forma de clave de prueba de Stripe. Se compone por partes para que
// el escáner de secretos del repo no la confunda con una clave real.
const FAKE_SECRET = ['sk', 'test', 'clavefalsa0123456789'].join('_')
const envOf = (o) => (k) => o[k]
const FULL = {
  STRIPE_SECRET_KEY: FAKE_SECRET,
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

await t('catálogo: los 10 productos y los importes de la web (EUR, céntimos)', () => {
  assert.deepEqual(PRODUCT_KEYS.sort(), ['credits_1000', 'credits_150', 'credits_300', 'credits_50', 'growth_annual', 'growth_monthly', 'pro_annual', 'pro_monthly', 'starter_annual', 'starter_monthly'])
  const amounts = Object.fromEntries(PRODUCT_KEYS.map((k) => [k, BILLING_PRODUCTS[k].amountCents]))
  assert.deepEqual(amounts, {
    pro_monthly: 1500, pro_annual: 14400, starter_monthly: 9900, starter_annual: 95040, growth_monthly: 24900, growth_annual: 239040,
    credits_50: 4900, credits_150: 12900, credits_300: 23900, credits_1000: 69900,
  })
  for (const k of PRODUCT_KEYS) assert.equal(BILLING_PRODUCTS[k].currency, 'eur')
})

await t('catálogo: anual = mensual x 12 x 0,8 (lo que enseña la web)', () => {
  for (const [m, a] of [['pro_monthly', 'pro_annual'], ['starter_monthly', 'starter_annual'], ['growth_monthly', 'growth_annual']]) {
    assert.equal(BILLING_PRODUCTS[a].amountCents, Math.round(BILLING_PRODUCTS[m].amountCents * 12 * 0.8), a)
  }
})

await t('catálogo: créditos por periodo (Starter 100/mes, Growth 1000/mes; anual = 12x) y por pack', () => {
  assert.equal(BILLING_PRODUCTS.starter_monthly.credits, 100)
  assert.equal(BILLING_PRODUCTS.starter_annual.credits, 1200)
  assert.equal(BILLING_PRODUCTS.growth_monthly.credits, 1000)
  assert.equal(BILLING_PRODUCTS.growth_annual.credits, 12000)
  for (const n of [50, 150, 300, 1000]) assert.equal(BILLING_PRODUCTS[`credits_${n}`].credits, n)
  assert.equal(BILLING_PRODUCTS.pro_monthly.credits, 0)
})

await t('catálogo: prueba de 14 días solo en Pro; empresas sin prueba', () => {
  for (const k of PRODUCT_KEYS) assert.equal(BILLING_PRODUCTS[k].trialDays, k.startsWith('pro_') ? 14 : 0, k)
})

await t('isProductKey: solo claves del catálogo (nada de prototipos ni price IDs)', () => {
  assert.equal(isProductKey('pro_monthly'), true)
  for (const bad of ['enterprise', 'premium', 'price_ProMes', '__proto__', 'toString', '', null, undefined, 1, {}]) assert.equal(isProductKey(bad), false, String(bad))
})

await t('sin STRIPE_SECRET_KEY nada está configurado aunque haya price IDs', () => {
  const env = envOf({ ...FULL, STRIPE_SECRET_KEY: undefined })
  assert.equal(stripeSecretConfigured(env), false)
  for (const k of PRODUCT_KEYS) assert.equal(isBillingConfigured(k, env), false)
})

await t('clave con forma rara (publishable, vacía, espacios) no cuenta como configurada', () => {
  for (const bad of ['', '   ', ['pk', 'test', 'abc'].join('_'), 'whatever', ['sk', 'test', ''].join('_')]) {
    assert.equal(stripeSecretConfigured(envOf({ STRIPE_SECRET_KEY: bad })), false, bad)
  }
  assert.equal(stripeSecretConfigured(envOf({ STRIPE_SECRET_KEY: `  ${FAKE_SECRET}\n` })), true)
})

await t('price ausente o sin forma de price -> ese producto sin configurar; el resto sí', () => {
  const env = envOf({ ...FULL, STRIPE_PRICE_GROWTH_ANNUAL: '', STRIPE_PRICE_CREDITS_50: 'prod_NoEsUnPrice' })
  assert.equal(isBillingConfigured('growth_annual', env), false)
  assert.equal(isBillingConfigured('credits_50', env), false)
  assert.equal(isBillingConfigured('pro_monthly', env), true)
  const map = configuredProducts(env)
  assert.equal(Object.values(map).filter(Boolean).length, 8)
  assert.ok(Object.values(map).every((v) => typeof v === 'boolean'), 'solo booleanos')
})

await t('priceIdFor / productKeyForPriceId usan los secretos', () => {
  const env = envOf(FULL)
  assert.equal(priceIdFor('starter_annual', env), 'price_StarterAno')
  assert.equal(productKeyForPriceId('price_GrowthMes', env), 'growth_monthly')
  assert.equal(productKeyForPriceId('price_Ajeno', env), null)
  assert.equal(productKeyForPriceId(undefined, env), null)
})

const recurring = (amount, interval, over = {}) => ({ id: 'price_x', active: true, currency: 'eur', unit_amount: amount, type: 'recurring', recurring: { interval, interval_count: 1 }, ...over })
const oneTime = (amount, over = {}) => ({ id: 'price_x', active: true, currency: 'eur', unit_amount: amount, type: 'one_time', recurring: null, ...over })

await t('priceMatchesProduct: price correcto pasa', () => {
  assert.deepEqual(priceMatchesProduct(recurring(1500, 'month'), BILLING_PRODUCTS.pro_monthly), { ok: true })
  assert.deepEqual(priceMatchesProduct(recurring(95040, 'year'), BILLING_PRODUCTS.starter_annual), { ok: true })
  assert.deepEqual(priceMatchesProduct(oneTime(12900), BILLING_PRODUCTS.credits_150), { ok: true })
  assert.deepEqual(priceMatchesProduct(oneTime(4900, { currency: 'EUR' }), BILLING_PRODUCTS.credits_50), { ok: true })
})

await t('priceMatchesProduct: rechaza importe, moneda, intervalo, tipo o archivado distinto (secreto equivocado)', () => {
  const cases = [
    [recurring(1499, 'month'), 'pro_monthly', 'amount_mismatch'],
    [recurring(14400, 'year'), 'pro_monthly', 'amount_mismatch'],
    [recurring(1500, 'year'), 'pro_monthly', 'interval_mismatch'],
    [recurring(1500, 'month', { currency: 'usd' }), 'pro_monthly', 'currency_mismatch'],
    [recurring(1500, 'month', { active: false }), 'pro_monthly', 'price_inactive'],
    [recurring(1500, 'month', { recurring: { interval: 'month', interval_count: 3 } }), 'pro_monthly', 'interval_count_mismatch'],
    [oneTime(1500), 'pro_monthly', 'not_recurring'],
    [recurring(4900, 'month'), 'credits_50', 'not_one_time'],
    [oneTime(69900), 'credits_300', 'amount_mismatch'],
    [null, 'credits_50', 'price_missing'],
  ]
  for (const [price, key, reason] of cases) {
    assert.deepEqual(priceMatchesProduct(price, BILLING_PRODUCTS[key]), { ok: false, reason }, `${key} ${reason}`)
  }
})

await t('rutas de vuelta: solo la lista blanca; lo demás cae a la de por defecto', () => {
  assert.equal(resolveReturnPath('/company/credits', '/precios'), '/company/credits')
  for (const bad of ['https://evil.example/precios', '//evil.example', '/precios?x=1', '/admin', '', null, 42]) {
    assert.equal(resolveReturnPath(bad, '/precios'), '/precios', String(bad))
  }
  assert.equal(defaultReturnPath(BILLING_PRODUCTS.credits_50, 'company'), '/company/credits')
  assert.equal(defaultReturnPath(BILLING_PRODUCTS.growth_monthly, 'company'), '/empresas/planes')
  assert.equal(defaultReturnPath(BILLING_PRODUCTS.pro_annual, 'profile'), '/precios')
})

await t('utilidades: centsToEuros e isLiveStatus', () => {
  assert.equal(centsToEuros(95040), '950.40')
  assert.equal(centsToEuros(1500), '15.00')
  for (const s of ['active', 'trialing', 'past_due']) assert.equal(isLiveStatus(s), true)
  for (const s of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', undefined]) assert.equal(isLiveStatus(s), false)
})

console.log(`\n${passed} pruebas OK${process.exitCode ? ' (con fallos)' : ''}`)
