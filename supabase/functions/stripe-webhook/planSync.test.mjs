// Pruebas de las reglas puras del webhook (planSync.ts) y del correo de fin de prueba.
//   node supabase/functions/stripe-webhook/planSync.test.mjs
import assert from 'node:assert/strict'
import {
  targetProfilePlan,
  targetCompanyPlan,
  subscriptionSnapshot,
  invoiceSubscriptionId,
  invoicePriceId,
  shouldGrantPeriodCredits,
  toISO,
} from './planSync.ts'
import { trialEndingEmail, formatDate } from './billingEmails.ts'
import { PRICE_ENV } from '../_shared/testStripe.mjs'

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

const row = (product_key) => ({ product_key })
const env = (k) => PRICE_ENV[k]

await t('perfil: suscripción Pro viva -> pro (desde free o basic); ya pro -> sin cambio', () => {
  assert.equal(targetProfilePlan('free', [row('pro_monthly')]), 'pro')
  assert.equal(targetProfilePlan(null, [row('pro_annual')]), 'pro')
  assert.equal(targetProfilePlan('basic', [row('pro_monthly')]), 'pro')
  assert.equal(targetProfilePlan('pro', [row('pro_monthly')]), null)
  assert.equal(targetProfilePlan('PRO', [row('pro_monthly')]), null)
})

await t('perfil: sin suscripción viva -> free solo si estaba en pro', () => {
  assert.equal(targetProfilePlan('pro', []), 'free')
  assert.equal(targetProfilePlan('free', []), null)
  assert.equal(targetProfilePlan('basic', []), null)
})

await t('perfil: enterprise (lo da un admin) nunca lo tocan los pagos', () => {
  assert.equal(targetProfilePlan('enterprise', []), null)
  assert.equal(targetProfilePlan('enterprise', [row('pro_monthly')]), null)
})

await t('perfil: una suscripción de empresa o desconocida no da Pro', () => {
  assert.equal(targetProfilePlan('free', [row('starter_monthly')]), null)
  assert.equal(targetProfilePlan('pro', [row(null)]), 'free')
  assert.equal(targetProfilePlan('pro', [row('inventado')]), 'free')
})

await t('empresa: starter / growth / none; growth gana si hay dos', () => {
  assert.equal(targetCompanyPlan('none', [row('starter_monthly')]), 'starter')
  assert.equal(targetCompanyPlan('none', [row('growth_annual')]), 'growth')
  assert.equal(targetCompanyPlan('starter', [row('starter_annual'), row('growth_monthly')]), 'growth')
  assert.equal(targetCompanyPlan('growth', []), 'none')
  assert.equal(targetCompanyPlan(null, []), null)
  assert.equal(targetCompanyPlan('growth', [row('growth_monthly')]), null)
  assert.equal(targetCompanyPlan('none', [row('pro_monthly'), row('credits_50')]), null, 'ni Pro ni packs dan plan de empresa')
})

await t('empresa: enterprise (a medida) no lo tocan los pagos', () => {
  assert.equal(targetCompanyPlan('enterprise', []), null)
  assert.equal(targetCompanyPlan('enterprise', [row('starter_monthly')]), null)
})

await t('subscriptionSnapshot: formato con periodos en los items (API nueva) y en la suscripción (2024-06-20)', () => {
  const nuevo = subscriptionSnapshot({
    id: 'sub_1', customer: 'cus_1', status: 'trialing', trial_end: 1767225600, cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_ProMes' }, current_period_end: 1767225600 }] }, metadata: {},
  }, env)
  assert.equal(nuevo.productKey, 'pro_monthly')
  assert.equal(nuevo.currentPeriodEnd, '2026-01-01T00:00:00.000Z')
  assert.equal(nuevo.trialEnd, '2026-01-01T00:00:00.000Z')
  const viejo = subscriptionSnapshot({
    id: 'sub_2', customer: { id: 'cus_2' }, status: 'active', current_period_end: 1767225600, cancel_at_period_end: true,
    items: { data: [{ price: 'price_GrowthAno' }] },
  }, env)
  assert.equal(viejo.customerId, 'cus_2')
  assert.equal(viejo.productKey, 'growth_annual')
  assert.equal(viejo.currentPeriodEnd, '2026-01-01T00:00:00.000Z')
  assert.equal(viejo.cancelAtPeriodEnd, true)
})

await t('subscriptionSnapshot: price que ya no está en los secretos -> producto de la metadata', () => {
  const s = subscriptionSnapshot({ id: 'sub_3', status: 'active', items: { data: [{ price: { id: 'price_Antiguo' } }] }, metadata: { product_key: 'starter_monthly' } }, env)
  assert.equal(s.productKey, 'starter_monthly')
  const sinNada = subscriptionSnapshot({ id: 'sub_4', status: 'active', items: { data: [] }, metadata: { product_key: 'falso' } }, env)
  assert.equal(sinNada.productKey, null)
})

await t('facturas: suscripción y price en los dos formatos de la API', () => {
  assert.equal(invoiceSubscriptionId({ subscription: 'sub_1' }), 'sub_1')
  assert.equal(invoiceSubscriptionId({ subscription: { id: 'sub_2' } }), 'sub_2')
  assert.equal(invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_3' } } }), 'sub_3')
  assert.equal(invoiceSubscriptionId({}), null)
  assert.equal(invoicePriceId({ lines: { data: [{ price: { id: 'price_A' } }] } }), 'price_A')
  assert.equal(invoicePriceId({ lines: { data: [{ description: 'prorrateo' }, { pricing: { price_details: { price: 'price_B' } } }] } }), 'price_B')
  assert.equal(invoicePriceId({ lines: { data: [] } }), null)
})

await t('créditos del periodo: alta y renovación pagadas; no en cambios de plan ni sin pagar', () => {
  assert.equal(shouldGrantPeriodCredits({ status: 'paid', billing_reason: 'subscription_create' }), true)
  assert.equal(shouldGrantPeriodCredits({ status: 'paid', billing_reason: 'subscription_cycle' }), true)
  assert.equal(shouldGrantPeriodCredits({ status: 'paid', billing_reason: 'subscription_update' }), false)
  assert.equal(shouldGrantPeriodCredits({ status: 'paid', billing_reason: 'manual' }), false)
  assert.equal(shouldGrantPeriodCredits({ status: 'open', billing_reason: 'subscription_cycle' }), false)
})

await t('toISO ignora lo que no es un número', () => {
  assert.equal(toISO(null), null)
  assert.equal(toISO('1767225600'), null)
})

await t('correo de fin de prueba en español, sin tarjeta: pide añadirla y avisa de la vuelta a Gratis', () => {
  const m = trialEndingEmail('es', { name: 'Ana', trialEnd: '2026-11-17T10:00:00Z', manageUrl: 'https://yourcvpassport.com/precios?billing=manage', hasPaymentMethod: false })
  assert.match(m.subject, /prueba del plan Profesional/)
  assert.match(m.html, /17 de noviembre de 2026/)
  assert.match(m.html, /Añadir mi tarjeta/)
  assert.match(m.text, /plan Gratis/)
  assert.match(m.html, /https:\/\/yourcvpassport\.com\/precios\?billing=manage/)
  assert.match(m.html, /Hola, Ana:/)
})

await t('correo de fin de prueba en inglés, con tarjeta: avisa del cobro', () => {
  const m = trialEndingEmail('en', { name: '', trialEnd: '2026-11-17T10:00:00Z', manageUrl: 'https://yourcvpassport.com/pricing?billing=manage', hasPaymentMethod: true })
  assert.match(m.subject, /trial ends soon/)
  assert.match(m.html, /17 November 2026/)
  assert.match(m.html, /Manage my subscription/)
  assert.match(m.html, /lang="en"|Kind regards/)
  assert.ok(!/Añadir/.test(m.html))
})

await t('correo: el nombre se escapa (sin HTML inyectado)', () => {
  const m = trialEndingEmail('es', { name: '<img src=x onerror=alert(1)>', trialEnd: null, manageUrl: 'https://yourcvpassport.com/precios', hasPaymentMethod: false })
  assert.ok(!m.html.includes('<img src=x'))
  assert.equal(formatDate('es', null), 'en unos días')
})

console.log(`\n${passed} pruebas OK${process.exitCode ? ' (con fallos)' : ''}`)
