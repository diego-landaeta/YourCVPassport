// Prueba del flujo de moderateOne (hash antes de evaluar, HASH_MISMATCH, reintentos).
// index.ts usa APIs de Deno, así que se extrae el fragmento de orquestación, se le quitan
// los tipos con node:module y se ejecuta contra una base simulada.
//   node supabase/functions/moderate-job-posting/orquestacion.test.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { reviewJobText, reasonFromFindings } from './rules.ts'

const src = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
const from = src.indexOf('/** Encola directamente el aviso a support@')
const to = src.indexOf('serve(async')
assert.ok(from > 0 && to > from, 'no se encontró el fragmento de orquestación')
const code = stripTypeScriptTypes(src.slice(from, to))
const factory = new Function(
  'reviewJobText', 'reasonFromFindings', 'reviewWithAi', 'JOB_COLUMNS', 'SUPPORT_EMAIL',
  `${code}\nreturn { moderateOne }`,
)

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

// Base simulada. `edits` = lista de ediciones que ocurren justo después de pedir la huella
// (la n-ésima llamada a get_job_moderation_hash).
function fakeAdmin({ job, hashFails = false, mismatchTimes = 0, publishError = null }) {
  const calls = []
  let hashCalls = 0
  let mismatches = 0
  const state = { job: { ...job } }
  const admin = {
    calls,
    state,
    rpc: async (name, args) => {
      calls.push({ name, args })
      if (name === 'get_job_moderation_hash') {
        hashCalls++
        if (hashFails) return { data: null, error: { message: 'function does not exist' } }
        return { data: `hash-${hashCalls}`, error: null }
      }
      if (name === 'moderar_oferta') {
        if (args.p_decision === 'PUBLISHED') {
          if (publishError) return { data: null, error: { message: publishError } }
          if (mismatches < mismatchTimes) {
            mismatches++
            return { data: null, error: { message: 'HASH_MISMATCH: el texto cambió' } }
          }
          state.job.status = 'PUBLISHED'
        } else if (args.p_decision === 'MANUAL_REVIEW') {
          state.job.status = 'MANUAL_REVIEW'
        }
        return { data: {}, error: null }
      }
      return { data: null, error: { message: 'rpc desconocida' } }
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { ...state.job }, error: null }) }),
      }),
      insert: async (row) => { calls.push({ name: `insert:${table}`, row }); return { error: null } },
    }),
  }
  return admin
}

const JOB_OK = {
  id: 'j1', status: 'AI_REVIEW', title: 'Contable', department: null,
  description: 'Empresa de servicios busca contable con experiencia en facturación y cierres mensuales. Trabajo presencial en Madrid.',
  requirements: [], responsibilities: [], benefits: [], nice_to_have: [], required_skills: [], optional_skills: [],
  application_instructions: null, application_url: null, application_email: null, duration: null,
}
const make = (aiVerdict = null) =>
  factory(reviewJobText, reasonFromFindings, async () => aiVerdict, 'cols', 'support@yourcvpassport.com').moderateOne

await t('oferta limpia: pide la huella ANTES de leer y publica con p_expected_hash', async () => {
  const admin = fakeAdmin({ job: JOB_OK })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'PUBLISHED')
  const names = admin.calls.map((c) => c.name)
  assert.equal(names[0], 'get_job_moderation_hash')
  const pub = admin.calls.find((c) => c.name === 'moderar_oferta')
  assert.equal(pub.args.p_decision, 'PUBLISHED')
  assert.equal(pub.args.p_expected_hash, 'hash-1')
})
await t('HASH_MISMATCH una vez: vuelve a evaluar con la huella nueva y publica', async () => {
  const admin = fakeAdmin({ job: JOB_OK, mismatchTimes: 1 })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'PUBLISHED')
  const pubs = admin.calls.filter((c) => c.name === 'moderar_oferta')
  assert.deepEqual(pubs.map((p) => p.args.p_expected_hash), ['hash-1', 'hash-2'])
})
await t('HASH_MISMATCH dos veces: publica a la tercera evaluación', async () => {
  const admin = fakeAdmin({ job: JOB_OK, mismatchTimes: 2 })
  assert.equal((await make()(admin, 'j1')).outcome, 'PUBLISHED')
})
await t('HASH_MISMATCH persistente (3 evaluaciones): MANUAL_REVIEW, nunca PUBLISHED', async () => {
  const admin = fakeAdmin({ job: JOB_OK, mismatchTimes: 99 })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.deepEqual(r.findings, ['TEXTO_CAMBIANTE'])
  assert.equal(admin.calls.filter((c) => c.name === 'get_job_moderation_hash').length, 3)
  assert.equal(admin.calls.filter((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'PUBLISHED').length, 3)
  assert.equal(admin.state.job.status, 'MANUAL_REVIEW')
})
await t('sin RPC de huella (no desplegada): MANUAL_REVIEW, no publica', async () => {
  const admin = fakeAdmin({ job: JOB_OK, hashFails: true })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.ok(!admin.calls.some((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'PUBLISHED'))
})
await t('con hallazgos: MANUAL_REVIEW y no se pide publicar', async () => {
  const admin = fakeAdmin({ job: { ...JOB_OK, description: 'Escríbenos por WhatsApp al +34 612 345 678 y gana dinero fácil.' } })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.ok(r.findings.includes('CONTACTO_EXTERNO'))
  assert.ok(!admin.calls.some((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'PUBLISHED'))
})
await t('otro error al publicar: MANUAL_REVIEW sin reintentos', async () => {
  const admin = fakeAdmin({ job: JOB_OK, publishError: 'COMPANY_NOT_APPROVED' })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.equal(admin.calls.filter((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'PUBLISHED').length, 1)
})
await t('la IA con dudas manda a MANUAL_REVIEW', async () => {
  const admin = fakeAdmin({ job: JOB_OK })
  const r = await make({ verdict: 'doubt', reasons: ['título incoherente'], provider: 'x' })(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
})
await t('oferta que ya no está en AI_REVIEW: SKIPPED', async () => {
  const admin = fakeAdmin({ job: { ...JOB_OK, status: 'PUBLISHED' } })
  assert.equal((await make()(admin, 'j1')).outcome, 'SKIPPED')
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
