// Pruebas del barrido de company-review-ai ({ sweep: true }) y de la comprobación del correo de
// la cuenta. Se ejecuta el index.ts REAL empaquetado con esbuild contra una base en memoria
// (sin red ni claves reales):
//   node supabase/functions/company-review-ai/sweep.test.mjs
import assert from 'node:assert/strict'
import { loadEdge, post, createFakeSupabase } from '../_shared/testHarness.mjs'
import { pickForReview, pickStale } from './sweep.ts'
import { reviewCompany, checkCreatorEmail, duplicateRefs } from './rules.ts'

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
}
const origConsole = { error: console.error, warn: console.warn }
console.error = () => {}
console.warn = () => {}
const handler = await loadEdge('company-review-ai', ENV)
const HEADERS = { origin: 'https://yourcvpassport.com' }

const NOW = Date.now()
const ago = (min) => new Date(NOW - min * 60 * 1000).toISOString()
const company = (n, over = {}) => ({
  id: `c${n}`, company_name: `Empresa ${n}`, legal_name: `Empresa ${n} SL`, tax_id: 'A58818501', country_code: 'ES',
  company_email: `rrhh@empresa${n}.es`, website_url: `https://www.empresa${n}.es`, contact_name: 'Laura Pérez',
  description: 'Consultora de formación', industry: 'Consultoría', status: 'PENDING', created_by: `u${n}`, idioma: 'es', created_at: ago(10), ...over,
})
const verifiedUser = (n, over = {}) => ({ id: `u${n}`, email: `ana@empresa${n}.es`, email_confirmed_at: ago(100), ...over })

function setup({ companies, reviews = [], users, hooks = {} }) {
  const fake = createFakeSupabase({
    companies,
    company_ai_reviews: reviews,
    countries: [{ code: 'ES', active: true }],
    profiles: [{ id: 'admin1', role: 'admin' }, { id: 'user1', role: 'user' }],
    email_outbox: [],
  }, {
    users: Object.fromEntries(users.map((u) => [u.id, u])),
    getUser: (token) => ({ 'tok-admin': 'admin1', 'tok-user': 'user1' }[token] ?? null),
    ...hooks,
  })
  globalThis.__fakeSupabase = fake
  return fake
}
const sweep = (headers = {}, body = { sweep: true }) => post(handler, 'company-review-ai', body, { ...HEADERS, ...headers })
const CRON = { 'x-cron-secret': ENV.CRON_SECRET }
const statusOf = (fake, id) => fake.db.tables.companies.find((c) => c.id === id).status
const outbox = (fake) => fake.db.tables.email_outbox

// ---------------------------------------------------------------------------
// Autorización del barrido
// ---------------------------------------------------------------------------
await t('barrido sin credenciales: 401 y no toca nada', async () => {
  const fake = setup({ companies: [company(1)], users: [verifiedUser(1)] })
  const res = await sweep()
  assert.equal(res.status, 401)
  assert.equal(fake.db.tables.company_ai_reviews.length, 0)
})
await t('barrido con x-cron-secret incorrecto o sin Authorization: 401', async () => {
  setup({ companies: [company(1)], users: [verifiedUser(1)] })
  assert.equal((await sweep({ 'x-cron-secret': 'otro-secreto-distinto-0123456789' })).status, 401)
  assert.equal((await sweep({ authorization: 'Bearer nada' })).status, 401)
})
await t('CRON_SECRET sin configurar: x-cron-secret nunca se acepta', async () => {
  const h = await loadEdge('company-review-ai', { ...ENV, CRON_SECRET: undefined })
  setup({ companies: [company(1)], users: [verifiedUser(1)] })
  const res = await post(h, 'company-review-ai', { sweep: true }, { ...HEADERS, 'x-cron-secret': 'cron-secret-de-prueba-0123456789' })
  assert.equal(res.status, 401)
  await loadEdge('company-review-ai', ENV)
})
await t('un usuario normal (ni admin ni service_role) no puede lanzar el barrido: 403', async () => {
  setup({ companies: [company(1)], users: [verifiedUser(1)] })
  assert.equal((await sweep({ authorization: 'Bearer tok-user' })).status, 403)
})
await t('barrido autorizado por cron, service_role y admin: 200', async () => {
  for (const headers of [CRON, { authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` }, { authorization: 'Bearer tok-admin' }]) {
    setup({ companies: [], users: [] })
    const res = await sweep(headers)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.sweep, true)
    assert.equal(body.candidates, 0)
  }
})

// ---------------------------------------------------------------------------
// Qué se revisa
// ---------------------------------------------------------------------------
await t('revisa solo las PENDING sin revisión de más de 2 min; las otras no se tocan', async () => {
  const fake = setup({
    companies: [
      company(1, { created_at: ago(5) }),                       // sí
      company(2, { created_at: ago(1), tax_id: 'X2' }),                     // muy reciente
      company(3, { created_at: ago(20), tax_id: 'X3' }),                    // ya revisada
      company(4, { created_at: ago(20), status: 'APPROVED', tax_id: 'X4' }),  // no PENDING
    ],
    reviews: [{ id: 'r3', company_id: 'c3', resultado: 'dudosa' }],
    users: [1, 2, 3, 4].map((n) => verifiedUser(n)),
  })
  const res = await sweep(CRON)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.reviewed, 1)
  assert.equal(body.candidates, 1)
  const reviewed = fake.db.tables.company_ai_reviews.map((r) => r.company_id).sort()
  assert.deepEqual(reviewed, ['c1', 'c3'])
  // c1 cumple todo (CIF válido, web = dominio del correo, cuenta del mismo dominio): se aprueba.
  assert.equal(statusOf(fake, 'c1'), 'APPROVED')
  assert.equal(statusOf(fake, 'c2'), 'PENDING')
  assert.equal(statusOf(fake, 'c3'), 'PENDING')
  assert.equal(outbox(fake).filter((o) => o.kind === 'company_verified').length, 1)
})
await t('máximo 20 por llamada (las más antiguas); las que se quedan fuera y pasan de 30 min avisan a soporte, una sola vez', async () => {
  const many = Array.from({ length: 25 }, (_, i) => company(100 + i, { tax_id: `X${i}`, created_at: ago(120 - i) }))
  const fake = setup({ companies: many, users: many.map((c) => verifiedUser(Number(c.id.slice(1)))) })
  const body = await (await sweep(CRON)).json()
  assert.equal(body.reviewed, 20)
  assert.equal(body.candidates, 25)
  assert.equal(body.stale_notified, 5)
  // Se revisaron las 20 más antiguas (c100..c119); quedan sin revisión c120..c124.
  const done = new Set(fake.db.tables.company_ai_reviews.map((r) => r.company_id))
  assert.ok(done.has('c100') && done.has('c119') && !done.has('c120'))
  const stale = outbox(fake).filter((o) => o.payload.resultado === 'sin_revision')
  assert.equal(stale.length, 5)
  assert.ok(stale.every((o) => o.to_email === 'support@yourcvpassport.com' && o.kind === 'company_review_flagged' && o.payload.dedupe_key.startsWith('company_unreviewed:')))
  // Segundo barrido: revisa las 5 que faltaban; el aviso no se duplica (23505 por dedupe_key).
  const body2 = await (await sweep(CRON)).json()
  assert.equal(body2.reviewed, 5)
  assert.equal(outbox(fake).filter((o) => o.payload.resultado === 'sin_revision').length, 5)
})
await t('si la revisión no deja constancia (falla el guardado) y pasan 30 min: aviso a soporte y NO se aprueba', async () => {
  const fake = setup({
    companies: [company(1, { created_at: ago(45) })],
    users: [verifiedUser(1)],
    hooks: { onQuery: (q) => (q.table === 'company_ai_reviews' && q.op === 'insert' ? { error: { message: 'disco lleno' } } : undefined) },
  })
  const body = await (await sweep(CRON)).json()
  assert.equal(body.reviewed, 1)
  assert.equal(statusOf(fake, 'c1'), 'PENDING', 'sin registro no se aprueba')
  assert.equal(body.stale_notified, 1)
  assert.ok(outbox(fake).some((o) => o.payload.dedupe_key === 'company_unreviewed:c1'))
})
await t('la respuesta del barrido solo lleva números (ni nombres ni motivos ni correos)', async () => {
  setup({ companies: [company(1, { tax_id: 'B0' })], users: [verifiedUser(1)] })
  const body = await (await sweep(CRON)).json()
  assert.ok(Object.values(body).every((v) => typeof v === 'number' || typeof v === 'boolean'), JSON.stringify(body))
})

// ---------------------------------------------------------------------------
// Correo de la cuenta que registra la empresa
// ---------------------------------------------------------------------------
async function sweepOne(userOver, companyOver = {}, extra = []) {
  const fake = setup({ companies: [company(1, companyOver), ...extra], users: [verifiedUser(1, userOver), ...extra.map((c) => verifiedUser(Number(c.id.slice(1))))] })
  await sweep(CRON)
  return fake
}
await t('cuenta con correo de otro dominio que la web -> dudosa, queda PENDING y avisa a soporte', async () => {
  const fake = await sweepOne({ email: 'ana@otradistinta.com' })
  assert.equal(statusOf(fake, 'c1'), 'PENDING')
  const review = fake.db.tables.company_ai_reviews[0]
  assert.equal(review.resultado, 'dudosa')
  assert.ok(review.motivos.some((m) => m.code === 'creator_email_domain_mismatch'))
  assert.equal(outbox(fake).filter((o) => o.kind === 'company_review_flagged').length, 1)
})
await t('cuenta con correo gratuito (gmail) y web propia -> dudosa', async () => {
  const fake = await sweepOne({ email: 'ana@gmail.com' })
  assert.equal(statusOf(fake, 'c1'), 'PENDING')
  assert.ok(fake.db.tables.company_ai_reviews[0].motivos.some((m) => m.code === 'creator_email_free'))
})
await t('cuenta con el correo SIN confirmar -> dudosa', async () => {
  const fake = await sweepOne({ email_confirmed_at: null })
  assert.equal(statusOf(fake, 'c1'), 'PENDING')
  assert.ok(fake.db.tables.company_ai_reviews[0].motivos.some((m) => m.code === 'creator_email_unconfirmed'))
})
await t('creador desconocido (sin created_by o usuario inexistente) -> dudosa, nunca aprueba', async () => {
  const fake = await sweepOne({}, { created_by: null })
  assert.equal(statusOf(fake, 'c1'), 'PENDING')
  assert.ok(fake.db.tables.company_ai_reviews[0].motivos.some((m) => m.code === 'creator_email_unavailable'))
  const fake2 = setup({ companies: [company(1)], users: [] })
  await sweep(CRON)
  assert.equal(statusOf(fake2, 'c1'), 'PENDING')
})
await t('cuenta en un subdominio de la web (ana@rrhh.empresa1.es) -> se aprueba', async () => {
  const fake = await sweepOne({ email: 'ana@rrhh.empresa1.es' })
  assert.equal(statusOf(fake, 'c1'), 'APPROVED')
})

// ---------------------------------------------------------------------------
// Duplicados de NIF / correo
// ---------------------------------------------------------------------------
await t('NIF repetido en otra empresa: nunca se aprueba; la referencia de ambas va solo en el aviso interno', async () => {
  const existing = company(2, { status: 'APPROVED', tax_id: 'A58818501', created_at: ago(500) })
  const fake = await sweepOne({}, { tax_id: 'ES-A58818501' }, [existing])
  assert.equal(statusOf(fake, 'c1'), 'PENDING')
  const review = fake.db.tables.company_ai_reviews.find((r) => r.company_id === 'c1')
  assert.equal(review.resultado, 'dudosa')
  const motive = review.motivos.find((m) => m.code === 'duplicate_tax_id')
  assert.ok(motive)
  // Los motivos guardados no revelan la otra empresa.
  assert.ok(!JSON.stringify(review.motivos).includes('c2') && !JSON.stringify(review.motivos).includes('Empresa 2'))
  const notice = outbox(fake).find((o) => o.kind === 'company_review_flagged' && o.payload.company_id === 'c1')
  assert.equal(notice.payload.company_id, 'c1')
  assert.deepEqual(notice.payload.duplicates.map((d) => ({ id: d.id, matches: d.matches })), [{ id: 'c2', matches: ['tax_id'] }])
})
await t('correo de empresa repetido: dudosa y aviso con la referencia', async () => {
  const existing = company(2, { status: 'APPROVED', tax_id: 'B99999999', company_email: 'rrhh@empresa1.es', created_at: ago(500) })
  const fake = await sweepOne({}, {}, [existing])
  assert.equal(statusOf(fake, 'c1'), 'PENDING')
  const notice = outbox(fake).find((o) => o.payload.company_id === 'c1')
  assert.ok(notice.payload.duplicates.some((d) => d.id === 'c2' && d.matches.includes('email')))
})

// ---------------------------------------------------------------------------
// Flujo normal (una empresa concreta) sigue como antes
// ---------------------------------------------------------------------------
await t('revisión normal con sesión del creador: sigue funcionando y exige credenciales', async () => {
  const fake = setup({ companies: [company(1)], users: [verifiedUser(1)], hooks: { getUser: (tk) => ({ 'tok-owner': 'u1', 'tok-other': 'user1' }[tk] ?? null) } })
  fake.db.tables.profiles.push({ id: 'u1', role: 'user' })
  assert.equal((await post(handler, 'company-review-ai', { companyId: '11111111-1111-4111-8111-111111111111' }, HEADERS)).status, 401)
  const ok = await post(handler, 'company-review-ai', { companyId: 'c1' }, { ...HEADERS, authorization: 'Bearer tok-owner' })
  assert.equal(ok.status, 400, 'companyId debe ser un UUID')
  fake.db.tables.companies[0].id = '22222222-2222-4222-8222-222222222222'
  const res = await post(handler, 'company-review-ai', { companyId: '22222222-2222-4222-8222-222222222222' }, { ...HEADERS, authorization: 'Bearer tok-owner' })
  assert.equal(res.status, 200)
  assert.equal((await res.json()).status, 'APPROVED')
  const forbidden = await post(handler, 'company-review-ai', { companyId: '22222222-2222-4222-8222-222222222222' }, { ...HEADERS, authorization: 'Bearer tok-other' })
  assert.equal(forbidden.status, 403)
})

// ---------------------------------------------------------------------------
// Módulos puros
// ---------------------------------------------------------------------------
await t('pickForReview / pickStale: edad, orden y tope', () => {
  const now = Date.parse('2026-10-30T12:00:00Z')
  const mk = (id, min) => ({ id, created_at: new Date(now - min * 60000).toISOString() })
  const list = [mk('a', 1), mk('b', 3), mk('c', 31), mk('d', 90), mk('e', 3)]
  assert.deepEqual(pickForReview(list, new Set(), now).map((c) => c.id), ['d', 'c', 'b', 'e'])
  assert.deepEqual(pickForReview(list, new Set(['d']), now, 2).map((c) => c.id), ['c', 'b'])
  assert.deepEqual(pickStale(list, now).map((c) => c.id), ['c', 'd'])
  assert.deepEqual(pickForReview([{ id: 'x', created_at: 'no-es-fecha' }], new Set(), now), [])
})
await t('checkCreatorEmail: casos; reviewCompany solo lo aplica si se le informa del contexto', () => {
  const c = { id: '1', company_name: 'Acme', legal_name: 'Acme SL', tax_id: 'A58818501', country_code: 'ES', company_email: 'rrhh@acme.es', website_url: 'https://acme.es', contact_name: 'Laura Pérez', description: 'x', industry: 'x' }
  assert.deepEqual(checkCreatorEmail(c, { email: 'a@acme.es', confirmed: true }), [])
  assert.deepEqual(checkCreatorEmail(c, { email: 'a@mail.acme.es', confirmed: true }), [])
  assert.equal(checkCreatorEmail(c, { email: 'a@acme.com', confirmed: true })[0].code, 'creator_email_domain_mismatch')
  assert.equal(checkCreatorEmail(c, { email: 'a@mailinator.com', confirmed: true })[0].code, 'creator_email_disposable')
  assert.equal(checkCreatorEmail(c, null)[0].code, 'creator_email_unavailable')
  assert.equal(checkCreatorEmail(c, { email: 'a@acme.es', confirmed: false })[0].code, 'creator_email_unconfirmed')
  assert.deepEqual(checkCreatorEmail({ ...c, website_url: '' }, { email: 'a@gmail.com', confirmed: true }), [], 'sin web ya avisa website_missing')
  assert.equal(reviewCompany(c, [], null).resultado, 'ok')
  assert.equal(reviewCompany(c, [], null, { creatorEmail: { email: 'a@acme.com', confirmed: true } }).resultado, 'dudosa')
  assert.equal(reviewCompany(c, [], null, { creatorEmail: null }).resultado, 'dudosa')
})
await t('duplicateRefs: NIF con otro formato, correo y dominio; máximo configurable', () => {
  const c = { id: '1', company_name: 'Acme', legal_name: '', tax_id: 'A58818501', country_code: 'ES', company_email: 'rrhh@acme.es', website_url: 'https://acme.es', contact_name: '', description: '', industry: '' }
  const others = [
    { id: '2', company_name: 'Uno', tax_id: 'ES-A58818501', company_email: 'x@otra.com', website_url: null, status: 'APPROVED' },
    { id: '3', company_name: 'Dos', tax_id: 'B1', company_email: 'RRHH@acme.es', website_url: null, status: 'REJECTED' },
    { id: '4', company_name: 'Tres', tax_id: 'B2', company_email: 'y@zzz.com', website_url: 'https://www.acme.es/x', status: 'PENDING' },
    { id: '5', company_name: 'Cuatro', tax_id: 'B3', company_email: 'z@qqq.com', website_url: 'https://qqq.com', status: 'APPROVED' },
  ]
  const refs = duplicateRefs(c, others)
  assert.deepEqual(refs.map((r) => [r.id, r.matches.join('+')]), [['2', 'tax_id'], ['3', 'email+domain'], ['4', 'domain']])
  assert.equal(duplicateRefs(c, others, 1).length, 1)
})

console.error = origConsole.error
console.warn = origConsole.warn
console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
