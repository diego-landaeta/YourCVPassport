// Pruebas de send-outbox con { digests: true } y { alerts: true }: se ejecuta el index.ts REAL
// (esbuild) contra una cola en memoria y un Brevo falso (nunca sale nada a la red):
//   node supabase/functions/send-outbox/digests.test.mjs
import assert from 'node:assert/strict'
import { loadEdge, post, createFakeSupabase } from '../_shared/testHarness.mjs'

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
  CRON_SECRET: 'cron-secret-de-prueba-0123456789',
  BREVO_API_KEY: 'clave-brevo-falsa-de-test',
}
const origFetch = globalThis.fetch
const origErr = console.error
let brevo = []
globalThis.fetch = async (url, init) => {
  if (String(url) === 'https://api.brevo.com/v3/smtp/email') {
    brevo.push(JSON.parse(init.body))
    return new Response(JSON.stringify({ messageId: '<test@brevo>' }), { status: 201, headers: { 'content-type': 'application/json' } })
  }
  throw new TypeError(`red deshabilitada en el test: ${url}`)
}
console.error = () => {}

const handler = await loadEdge('send-outbox', ENV)
const CRON = { origin: 'https://yourcvpassport.com', 'x-cron-secret': ENV.CRON_SECRET }
const past = () => new Date(Date.now() - 60_000).toISOString()
const row = (id, kind, to, payload, over = {}) => ({ id, kind, to_email: to, payload, lang: 'es', priority: 5, send_after: past(), attempts: 0, sent_at: null, last_error: null, ...over })

const DIGEST_PAYLOAD = {
  dedupe_key: 'digest:j1:2026-10-29', job_posting_id: 'j1', job_title: 'Contable', company_name: 'Acme', total: 2, date: '2026-10-29',
  panel_path: '/company/jobs/applications', candidates: [{ name: 'Lucía Pérez', date: '2026-10-29T09:00:00Z', affinity: 82 }, { name: 'Marcos Gil', date: '2026-10-29T10:00:00Z', affinity: 40 }],
}

/** RPC simuladas: cada una encola filas como haría la migración 20261035 / 20261031. */
function setup({ rows = [], digestsRpc = 'ok', alertsRpc = 'ok' } = {}) {
  const fake = createFakeSupabase({ email_outbox: rows }, {
    rpc: (name) => {
      const outbox = fake.db.tables.email_outbox
      if (name === 'queue_application_digests') {
        if (digestsRpc === 'error') return { data: null, error: { message: 'function public.queue_application_digests() does not exist' } }
        outbox.push(row('d1', 'application_digest', 'empresa@acme.es', DIGEST_PAYLOAD, { priority: 8 }))
        outbox.push(row('d2', 'application_digest', 'otra@globex.com', { ...DIGEST_PAYLOAD, dedupe_key: 'digest:j2:2026-10-29', job_title: 'Analista' }, { priority: 8 }))
        return { data: 2, error: null }
      }
      if (name === 'queue_job_alerts') {
        if (alertsRpc === 'error') return { data: null, error: { message: 'boom' } }
        outbox.push(row('a1', 'job_alert', 'cand@x.com', { frequency: 'DAILY', total: 1, unsubscribe_token: '3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', jobs: [{ title: 'Contable', slug: 'contable-madrid-1a2b3c4d', country_code: 'es', company_name: 'Acme' }] }, { priority: 9 }))
        return { data: 1, error: null }
      }
      return { data: null, error: { message: 'rpc inesperada' } }
    },
  })
  globalThis.__fakeSupabase = fake
  brevo = []
  return fake
}
const sentRows = (fake) => fake.db.tables.email_outbox.filter((r) => r.sent_at)
const orderOf = (fake) => fake.db.log.map((l) => l.rpc ?? `${l.table}:${l.op}`)

await t('digests:true llama a queue_application_digests() ANTES de listar y envía los resúmenes', async () => {
  const fake = setup()
  const res = await post(handler, 'send-outbox', { digests: true }, CRON)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
  assert.equal(body.digests_queued, 2)
  assert.equal(body.digests_error, undefined)
  assert.equal(body.sent, 2)
  // Orden: la RPC va antes del primer listado de candidatas de la cola.
  const order = orderOf(fake)
  const rpcAt = order.indexOf('queue_application_digests')
  assert.ok(rpcAt >= 0)
  const firstUpdate = order.findIndex((o, i) => i > rpcAt && o === 'email_outbox:update')
  assert.ok(firstUpdate > rpcAt, order.join(','))
  assert.equal(sentRows(fake).length, 2)
})
await t('el correo del resumen sale con los candidatos (sin correo ni teléfono) y el enlace al panel', async () => {
  setup()
  await post(handler, 'send-outbox', { digests: true }, CRON)
  assert.equal(brevo.length, 2)
  const mail = brevo.find((m) => m.to[0].email === 'empresa@acme.es')
  assert.ok(mail.subject.startsWith('2 candidaturas nuevas para Contable'), mail.subject)
  assert.ok(mail.textContent.includes('Lucía Pérez') && mail.textContent.includes('82 % de encaje'))
  assert.ok(mail.htmlContent.includes('https://yourcvpassport.com/company/jobs/applications'))
  assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(mail.textContent.replace(/support@yourcvpassport\.com/g, '')), 'ningún correo ajeno en el texto')
})
await t('si queue_application_digests falla: se registra, se sigue enviando y la respuesta dice digests_error', async () => {
  const fake = setup({ digestsRpc: 'error', rows: [row('x1', 'job_expired', 'e@acme.es', { title: 'Contable', company_name: 'Acme' })] })
  const res = await post(handler, 'send-outbox', { digests: true }, CRON)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.digests_error, true)
  assert.equal(body.digests_queued, undefined)
  assert.equal(body.sent, 1)
  assert.equal(sentRows(fake).length, 1)
})
await t('sin digests:true no se llama a la RPC; con dry_run tampoco', async () => {
  const fake = setup()
  await post(handler, 'send-outbox', {}, CRON)
  await post(handler, 'send-outbox', { digests: true, alerts: true, dry_run: true }, CRON)
  assert.equal(fake.db.rpcCalls.length, 0)
})
await t('alerts y digests en la misma llamada: las dos RPC, enlaces de oferta y de baja en la alerta', async () => {
  const fake = setup()
  const body = await (await post(handler, 'send-outbox', { alerts: true, digests: true }, CRON)).json()
  assert.equal(body.alerts_queued, 1)
  assert.equal(body.digests_queued, 2)
  assert.deepEqual(fake.db.rpcCalls.map((c) => c.name), ['queue_job_alerts', 'queue_application_digests'])
  const alert = brevo.find((m) => m.to[0].email === 'cand@x.com')
  assert.ok(alert.htmlContent.includes('https://yourcvpassport.com/es/ofertas/contable-madrid-1a2b3c4d'))
  assert.ok(alert.htmlContent.includes('https://yourcvpassport.com/alertas/baja?token=3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'))
})
await t('los resúmenes (prioridad 8) esperan si se ha gastado el 80 % del tope diario', async () => {
  const h = await loadEdge('send-outbox', { ...ENV, OUTBOX_DAILY_CAP: '10' })
  const fake = setup({ rows: Array.from({ length: 8 }, (_, i) => row(`s${i}`, 'job_expired', 'e@acme.es', { title: 'X' }, { sent_at: new Date().toISOString(), attempts: 1 })) })
  const body = await (await post(h, 'send-outbox', { digests: true }, CRON)).json()
  assert.equal(body.sent, 0, JSON.stringify(body))
  assert.equal(body.digests_queued, 2, 'se encolan, pero esperan al día siguiente')
  assert.equal(fake.db.tables.email_outbox.filter((r) => r.kind === 'application_digest' && !r.sent_at).length, 2)
})
await t('autorización: sin credenciales 401 y la RPC no se llama; con service_role 200', async () => {
  const fake = setup()
  const res = await post(handler, 'send-outbox', { digests: true }, { origin: 'https://yourcvpassport.com' })
  assert.equal(res.status, 401)
  assert.equal(fake.db.rpcCalls.length, 0)
  const ok = await post(handler, 'send-outbox', { digests: true }, { origin: 'https://yourcvpassport.com', authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` })
  assert.equal(ok.status, 200)
})
await t('un resumen con datos imposibles (total 0) queda sin enviar con RENDER y no bloquea al resto', async () => {
  const fake = setup({ rows: [row('bad', 'application_digest', 'e@acme.es', { job_title: 'X', total: 0, candidates: [] }, { priority: 8 }), row('ok1', 'job_expired', 'e@acme.es', { title: 'Y' })] })
  const body = await (await post(handler, 'send-outbox', {}, CRON)).json()
  assert.equal(body.sent, 1)
  const bad = fake.db.tables.email_outbox.find((r) => r.id === 'bad')
  assert.equal(bad.sent_at, null)
  assert.match(bad.last_error, /RENDER|INVALID_PAYLOAD/)
})

globalThis.fetch = origFetch
console.error = origErr
console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
