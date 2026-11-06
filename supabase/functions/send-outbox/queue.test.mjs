// Pruebas de queue.ts (cola de correo): tope diario, prioridad, bloqueo optimista,
// reintentos y cupo de Brevo. Base de datos simulada en memoria. Sin dependencias:
//   node supabase/functions/send-outbox/queue.test.mjs
import assert from 'node:assert/strict'
import { processOutbox, classifyFailure, backoffMinutes, MAX_ATTEMPTS, LOW_PRIORITY_FROM } from './queue.ts'
import { renderOutboxEmail, UnknownKindError } from './templates.ts'

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

const NOW = new Date('2026-10-29T10:00:00.000Z')
const iso = (d) => new Date(d).toISOString()
let seq = 0
function row(over = {}) {
  seq++
  return {
    id: `id-${String(seq).padStart(4, '0')}`, kind: 'job_published', to_email: `u${seq}@example.com`,
    payload: { title: 'Contable', slug: 's', company_name: 'Acme' }, lang: 'es', priority: 5,
    send_after: iso(NOW.getTime() - 60_000), sent_at: null, attempts: 0, last_error: null, created_at: iso(NOW.getTime() - seq * 1000),
    ...over,
  }
}

// Base en memoria con la MISMA semántica que el UPDATE condicionado de index.ts.
function memStore(rows, { yieldMs = 0 } = {}) {
  const tick = () => new Promise((r) => setTimeout(r, yieldMs))
  const claims = []
  return {
    rows,
    claims,
    async countSentSince(since) {
      await tick()
      return rows.filter((r) => r.sent_at && r.sent_at >= since).length
    },
    async listCandidates({ nowIso, limit, maxPriority }) {
      await tick()
      return rows
        .filter((r) => !r.sent_at && r.attempts < MAX_ATTEMPTS && r.send_after <= nowIso && (maxPriority === undefined || r.priority <= maxPriority))
        .sort((a, b) => a.priority - b.priority || a.send_after.localeCompare(b.send_after))
        .slice(0, limit)
        .map((r) => ({ ...r }))
    },
    async claim(candidate, leaseUntilIso) {
      await tick()
      const r = rows.find((x) => x.id === candidate.id)
      if (!r || r.sent_at || r.attempts !== candidate.attempts || r.send_after !== candidate.send_after || r.attempts >= MAX_ATTEMPTS) return null
      r.attempts += 1
      r.send_after = leaseUntilIso
      claims.push(r.id)
      return { ...r }
    },
    async markSent(id, nowIso) {
      await tick()
      const r = rows.find((x) => x.id === id)
      if (!r.sent_at) { r.sent_at = nowIso; r.last_error = null }
    },
    async release(id, patch) {
      await tick()
      const r = rows.find((x) => x.id === id)
      if (r && !r.sent_at) { r.attempts = patch.attempts; r.send_after = patch.sendAfterIso; r.last_error = patch.lastError }
    },
  }
}

const okSend = () => { const log = []; return { log, send: async (r) => { log.push(r.id); return { ok: true } } } }
const base = (store, extra = {}) => ({
  store, now: () => NOW, render: (r) => renderOutboxEmail(r.kind, r.payload, r.lang), dailyCap: 250, ...extra,
})

await t('envía por prioridad ascendente (estado/seguridad antes que alertas) y respeta send_after', async () => {
  const rows = [
    row({ id: 'alerta', kind: 'job_alert', priority: 9, payload: { frequency: 'DAILY', total: 1, jobs: [{ title: 'X' }] } }),
    row({ id: 'estado', kind: 'application_status_candidate', priority: 4, payload: { job_title: 'X', company_name: 'Y', new_status: 'INTERVIEW' } }),
    row({ id: 'support', kind: 'job_manual_review', priority: 3, to_email: 'support@yourcvpassport.com', payload: { title: 'X', reasons: ['A'] } }),
    row({ id: 'futuro', priority: 1, send_after: iso(NOW.getTime() + 3600_000) }),
  ]
  const { log, send } = okSend()
  const s = await processOutbox(base(memStore(rows), { send }))
  assert.deepEqual(log, ['support', 'estado', 'alerta'])
  assert.equal(s.sent, 3)
  assert.equal(rows.find((r) => r.id === 'futuro').sent_at, null, 'send_after futuro no se envía')
  assert.ok(rows.filter((r) => r.id !== 'futuro').every((r) => r.sent_at && r.attempts === 1))
})

await t('TOPE diario: cuenta los sent_at de HOY (UTC) y nunca lo supera', async () => {
  const rows = []
  for (let i = 0; i < 8; i++) rows.push(row({ sent_at: iso(NOW.getTime() - 3600_000) })) // ya enviados hoy
  for (let i = 0; i < 5; i++) rows.push(row({ sent_at: iso(NOW.getTime() - 20 * 3600_000 * 1.2) })) // AYER (23:xx UTC): no cuentan
  for (let i = 0; i < 20; i++) rows.push(row())
  const { log, send } = okSend()
  const s = await processOutbox(base(memStore(rows), { send, dailyCap: 10, batchSize: 50 }))
  assert.equal(log.length, 2, 'solo caben 2 más hasta 10')
  assert.equal(s.stopped, null)
  assert.equal(s.sent_today, 10)
  assert.equal(s.remaining_today, 0)
  const s2 = await processOutbox(base(memStore(rows), { send, dailyCap: 10 }))
  assert.equal(s2.stopped, 'CAP_REACHED')
  assert.equal(log.length, 2, 'una segunda ejecución no envía nada')
})

await t('tope por defecto 250 y configurable (0 = no envía)', async () => {
  const rows = [row(), row()]
  const { log, send } = okSend()
  const s = await processOutbox(base(memStore(rows), { send, dailyCap: 0 }))
  assert.equal(s.stopped, 'CAP_REACHED')
  assert.equal(log.length, 0)
  const { DEFAULT_DAILY_CAP } = await import('./queue.ts')
  assert.equal(DEFAULT_DAILY_CAP, 250)
})

await t('reserva del 20 %: con el 80 % gastado solo salen los de estado/seguridad, no las alertas', async () => {
  const rows = []
  for (let i = 0; i < 8; i++) rows.push(row({ sent_at: iso(NOW.getTime() - 60_000) })) // 8 de 10
  rows.push(row({ id: 'alerta', kind: 'job_alert', priority: 9, payload: { frequency: 'DAILY', total: 1, jobs: [{ title: 'X' }] } }))
  rows.push(row({ id: 'resumen', priority: 8 }))
  rows.push(row({ id: 'estado', priority: 4 }))
  const { log, send } = okSend()
  await processOutbox(base(memStore(rows), { send, dailyCap: 10, batchSize: 50 }))
  assert.deepEqual(log, ['estado'])
  assert.equal(rows.find((r) => r.id === 'alerta').sent_at, null)
  assert.ok(LOW_PRIORITY_FROM === 8)
})

await t('SIN DUPLICADOS: dos ejecuciones simultáneas sobre las mismas filas envían cada una UNA sola vez', async () => {
  const rows = []
  for (let i = 0; i < 30; i++) rows.push(row())
  const store = memStore(rows, { yieldMs: 1 })
  const sentA = []
  const sentB = []
  const mk = (log) => base(store, { batchSize: 30, send: async (r) => { await new Promise((x) => setTimeout(x, 2)); log.push(r.id); return { ok: true } } })
  const [a, b] = await Promise.all([processOutbox(mk(sentA)), processOutbox(mk(sentB))])
  const all = [...sentA, ...sentB]
  assert.equal(new Set(all).size, all.length, `duplicados: ${all.length - new Set(all).size}`)
  assert.equal(all.length, 30, 'se enviaron todas, ninguna se perdió')
  assert.ok(a.skipped_claimed + b.skipped_claimed > 0, 'alguna reclamación perdió la carrera')
  assert.ok(rows.every((r) => r.attempts === 1))
})

await t('SIN DUPLICADOS: tres ejecuciones y tope compartido (el tope no se rebasa por la concurrencia)', async () => {
  const rows = []
  for (let i = 0; i < 40; i++) rows.push(row())
  const store = memStore(rows, { yieldMs: 1 })
  const sent = []
  const mk = () => base(store, { dailyCap: 12, batchSize: 40, send: async (r) => { await new Promise((x) => setTimeout(x, 1)); sent.push(r.id); return { ok: true } } })
  await Promise.all([processOutbox(mk()), processOutbox(mk()), processOutbox(mk())])
  assert.equal(new Set(sent).size, sent.length)
  assert.ok(sent.length >= 12 && sent.length <= 12 + 3, `enviados ${sent.length}: el tope puede rebasarse como mucho en uno por ejecución simultánea`)
})

await t('CUPO de Brevo agotado (429): para, la fila vuelve atrás SIN gastar intento y se aplaza', async () => {
  const rows = [row({ id: 'a' }), row({ id: 'b' }), row({ id: 'c' })]
  let n = 0
  const send = async () => (++n === 2 ? { ok: false, status: 429, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 429 too_many_requests' } : { ok: true })
  const s = await processOutbox(base(memStore(rows), { send }))
  assert.equal(s.stopped, 'QUOTA')
  assert.equal(s.sent, 1)
  const b = rows.find((r) => r.id === 'b')
  assert.equal(b.attempts, 0, 'el intento no se quema por cupo')
  assert.ok(b.send_after > iso(NOW.getTime() + 30 * 60_000), 'aplazada al menos 30 min')
  assert.match(b.last_error, /^QUOTA/)
  assert.equal(rows.find((r) => r.id === 'c').attempts, 0, 'la siguiente ni se toca')
})

await t('cupo agotado con 402 y con texto «not_enough_credits»', async () => {
  assert.equal(classifyFailure({ status: 402, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 402 x' }), 'quota')
  assert.equal(classifyFailure({ status: 400, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 400 not_enough_credits' }), 'quota')
  assert.equal(classifyFailure({ status: 403, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 403 daily limit' }), 'quota')
})

await t('sin configuración de envío o clave mala (401): para sin gastar intentos', async () => {
  for (const r of [{ status: 0, code: 'EMAIL_NOT_CONFIGURED', detail: 'BREVO_API_KEY not set' }, { status: 401, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 401 unauthorized' }]) {
    const rows = [row({ id: 'a' }), row({ id: 'b' })]
    const s = await processOutbox(base(memStore(rows), { send: async () => ({ ok: false, ...r }) }))
    assert.equal(s.stopped, 'CONFIG')
    assert.ok(rows.every((x) => x.attempts === 0 && !x.sent_at))
  }
})

await t('error permanente de UNA fila (400 parámetro inválido): gasta intento, backoff y sigue con las demás', async () => {
  const rows = [row({ id: 'mala' }), row({ id: 'buena' })]
  const send = async (r) => (r.id === 'mala' ? { ok: false, status: 400, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 400 invalid_parameter' } : { ok: true })
  const s = await processOutbox(base(memStore(rows), { send }))
  assert.equal(s.stopped, null)
  assert.equal(s.sent, 1)
  const m = rows.find((r) => r.id === 'mala')
  assert.equal(m.attempts, 1)
  assert.ok(m.send_after > iso(NOW) && m.last_error.includes('400'))
  assert.equal(rows.find((r) => r.id === 'buena').sent_at !== null, true)
})

await t('5xx: reintenta con backoff creciente y a los 5 intentos deja de elegirse', async () => {
  const rows = [row({ id: 'x' })]
  const store = memStore(rows)
  let clock = NOW.getTime()
  const send = async () => ({ ok: false, status: 500, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 500 x' })
  const seen = []
  for (let i = 0; i < 7; i++) {
    clock += 24 * 3600_000 // un día después (para no cruzar el tope, cada día cuenta aparte)
    await processOutbox(base(store, { send, now: () => new Date(clock) }))
    seen.push(rows[0].attempts)
  }
  assert.deepEqual(seen, [1, 2, 3, 4, 5, 5, 5], 'tras 5 intentos ya no se toca')
  assert.equal(rows[0].sent_at, null)
  assert.ok(rows[0].last_error.includes('500'))
  assert.ok(backoffMinutes(1) < backoffMinutes(2) && backoffMinutes(2) < backoffMinutes(4))
})

await t('Brevo caído (3 fallos 5xx/timeout seguidos): para y devuelve esos intentos', async () => {
  const rows = [row(), row(), row(), row(), row()]
  const s = await processOutbox(base(memStore(rows), { send: async () => ({ ok: false, status: 0, code: 'EMAIL_SEND_FAILED', detail: 'brevo timeout' }) }))
  assert.equal(s.stopped, 'PROVIDER_DOWN')
  assert.equal(s.failed, 0)
  assert.ok(rows.every((r) => r.attempts === 0 && !r.sent_at), 'ningún intento quemado')
  assert.equal(rows.filter((r) => r.last_error).length, 3)
})

await t('un fallo transitorio aislado no para la ejecución', async () => {
  const rows = [row({ id: 'a' }), row({ id: 'b' }), row({ id: 'c' })]
  let n = 0
  const send = async () => (++n === 1 ? { ok: false, status: 503, code: 'EMAIL_SEND_FAILED', detail: 'brevo HTTP 503' } : { ok: true })
  const s = await processOutbox(base(memStore(rows), { send }))
  assert.equal(s.sent, 2)
  assert.equal(s.failed, 1)
  assert.equal(rows.find((r) => r.id === 'a').attempts, 1)
})

await t('kind desconocido o payload inválido: error permanente, no se reintenta y no bloquea al resto', async () => {
  const rows = [row({ id: 'raro', kind: 'kind_inventado', payload: {} }), row({ id: 'vacia', payload: {} }), row({ id: 'bien' })]
  const { log, send } = okSend()
  const s = await processOutbox(base(memStore(rows), { send }))
  assert.deepEqual(log, ['bien'])
  assert.equal(s.failed, 2)
  assert.equal(rows.find((r) => r.id === 'raro').attempts, MAX_ATTEMPTS)
  assert.match(rows.find((r) => r.id === 'raro').last_error, /UNKNOWN_KIND/)
  assert.match(rows.find((r) => r.id === 'vacia').last_error, /INVALID_PAYLOAD/)
  assert.ok(new UnknownKindError('x') instanceof Error)
})

await t('idempotente: una segunda ejecución no vuelve a enviar lo enviado', async () => {
  const rows = [row(), row(), row()]
  const { log, send } = okSend()
  await processOutbox(base(memStore(rows), { send }))
  await processOutbox(base(memStore(rows), { send }))
  assert.equal(log.length, 3)
})

await t('una fila reclamada por otra ejecución (arrendamiento vigente) no se vuelve a coger', async () => {
  const rows = [row({ id: 'a', attempts: 1, send_after: iso(NOW.getTime() + 5 * 60_000) })]
  const { log, send } = okSend()
  await processOutbox(base(memStore(rows), { send }))
  assert.equal(log.length, 0)
})

await t('el arrendamiento caduca: una ejecución muerta a medias no pierde el correo', async () => {
  const rows = [row({ id: 'a', attempts: 1, send_after: iso(NOW.getTime() - 1000) })] // arrendamiento vencido
  const { log, send } = okSend()
  await processOutbox(base(memStore(rows), { send }))
  assert.deepEqual(log, ['a'])
  assert.equal(rows[0].attempts, 2)
})

await t('presupuesto de tiempo: si se agota, para limpiamente', async () => {
  const rows = [row(), row(), row()]
  let clock = NOW.getTime()
  const send = async () => { clock += 60_000; return { ok: true } }
  const s = await processOutbox(base(memStore(rows), { send, now: () => new Date(clock), budgetMs: 90_000 }))
  assert.equal(s.stopped, 'TIME_BUDGET')
  assert.ok(s.sent >= 1 && s.sent < 3)
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
