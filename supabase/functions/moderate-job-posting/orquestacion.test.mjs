// Prueba del flujo de moderateOne (hash antes de evaluar, HASH_MISMATCH, reintentos).
// index.ts usa APIs de Deno, así que se extrae el fragmento de orquestación, se le quitan
// los tipos con node:module y se ejecuta contra una base simulada.
//   node supabase/functions/moderate-job-posting/orquestacion.test.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { reviewJobText, reasonFromFindings } from './rules.ts'
import { reviewJobExtras, duplicateFinding, fingerprintIsComparable, textFingerprint } from './extras.ts'
import { reviewWithAi as realReviewWithAi, simulatedProvider } from './ai.ts'

const src = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
const from = src.indexOf('/** Encola directamente el aviso a support@')
const to = src.indexOf('serve(async')
assert.ok(from > 0 && to > from, 'no se encontró el fragmento de orquestación')
const code = stripTypeScriptTypes(src.slice(from, to))
const factory = new Function(
  'reviewJobText', 'reasonFromFindings', 'reviewWithAi', 'JOB_COLUMNS', 'SUPPORT_EMAIL',
  'reviewJobExtras', 'duplicateFinding', 'fingerprintIsComparable', 'textFingerprint',
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
function fakeAdmin({ job, hashFails = false, mismatchTimes = 0, publishError = null, others = [], othersError = null }) {
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
      select: () => {
        // Consulta de duplicados: .in().ilike().limit().neq() y se espera el resultado.
        const list = {
          ilike(col, pattern) { calls.push({ name: 'ilike', col, pattern }); return this },
          limit() { return this },
          neq(col, val) { calls.push({ name: 'neq', col, val }); return this },
          then(resolve) { resolve(othersError ? { data: null, error: { message: othersError } } : { data: others, error: null }) },
        }
        return {
          eq: () => ({ maybeSingle: async () => ({ data: { ...state.job }, error: null }) }),
          in: () => list,
        }
      },
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
const make = (aiVerdict = null, ai = null) =>
  factory(reviewJobText, reasonFromFindings, ai ?? (async () => aiVerdict), 'cols', 'support@yourcvpassport.com',
    reviewJobExtras, duplicateFinding, fingerprintIsComparable, textFingerprint).moderateOne
const makeWithProvider = (provider, timeoutMs = 50) =>
  make(null, (job, findings) => realReviewWithAi(job, findings, provider, timeoutMs))

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

// ---------------------------------------------------------------------------
// Reglas nuevas (E-1) en el flujo completo
// ---------------------------------------------------------------------------
const LONG = 'Buscamos una persona para gestionar la facturación y los cierres mensuales de una empresa de servicios con sede en Madrid. Se valora experiencia previa en contabilidad y manejo de hojas de cálculo.'
const JOB_DUP = { ...JOB_OK, id: 'j1', company_id: 'c1', title: 'Contable senior', description: LONG }

await t('salario incoherente (mínimo > máximo): MANUAL_REVIEW y nunca PUBLISHED', async () => {
  const admin = fakeAdmin({ job: { ...JOB_OK, salary_min: 3000, salary_max: 1000, salary_period: 'MONTHLY', salary_currency: 'EUR', category: 'ACCOUNTING_FINANCE' } })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.ok(r.findings.includes('SALARIO_INCOHERENTE'))
  assert.ok(!admin.calls.some((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'PUBLISHED'))
})
await t('salario normal y categoría coherente: se publica', async () => {
  const admin = fakeAdmin({ job: { ...JOB_OK, salary_min: 1500, salary_max: 2000, salary_period: 'MONTHLY', salary_currency: 'EUR', category: 'ACCOUNTING_FINANCE' } })
  assert.equal((await make()(admin, 'j1')).outcome, 'PUBLISHED')
})
await t('texto idéntico al de OTRA empresa: MANUAL_REVIEW (TEXTO_DUPLICADO), la consulta excluye a la propia empresa', async () => {
  const admin = fakeAdmin({ job: JOB_DUP, others: [{ id: 'j9', company_id: 'c2', title: 'CONTABLE SENIOR', description: '<p>' + LONG + '</p>' }] })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.ok(r.findings.includes('TEXTO_DUPLICADO'))
  assert.ok(admin.calls.some((c) => c.name === 'neq' && c.col === 'company_id' && c.val === 'c1'))
  // El motivo guardado (lo ve la empresa) no revela la otra oferta.
  const manual = admin.calls.find((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'MANUAL_REVIEW')
  assert.ok(!manual.args.p_motivo.includes('j9') && !manual.args.p_motivo.includes('c2'), manual.args.p_motivo)
})
await t('el mismo texto en otra oferta de la MISMA empresa no es duplicado', async () => {
  const admin = fakeAdmin({ job: JOB_DUP, others: [{ id: 'j9', company_id: 'c1', title: 'Contable senior', description: LONG }] })
  assert.equal((await make()(admin, 'j1')).outcome, 'PUBLISHED')
})
await t('error al buscar duplicados: MANUAL_REVIEW, no se publica sin haberlo comprobado', async () => {
  const admin = fakeAdmin({ job: JOB_DUP, othersError: 'timeout' })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.ok(!admin.calls.some((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'PUBLISHED'))
})
await t('el título con comodines de ilike se escapa', async () => {
  const admin = fakeAdmin({ job: { ...JOB_DUP, title: 'Contable 100%_senior' } })
  await make()(admin, 'j1')
  assert.equal(admin.calls.find((c) => c.name === 'ilike').pattern, 'Contable 100\\%\\_senior')
})
await t('enlace sospechoso en el cuerpo: MANUAL_REVIEW', async () => {
  const admin = fakeAdmin({ job: { ...JOB_OK, description: JOB_OK.description + ' Rellena tu solicitud en http://203.0.113.9/solicitud.' } })
  const r = await make()(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.ok(r.findings.includes('ENLACE_SOSPECHOSO'))
})

// ---------------------------------------------------------------------------
// reviewWithAi con proveedor simulado (sin red)
// ---------------------------------------------------------------------------
await t('IA simulada que dice ok: se publica (la IA no bloquea ni decide sola)', async () => {
  const admin = fakeAdmin({ job: JOB_OK })
  const p = simulatedProvider({ verdict: 'ok', reasons: [] })
  const r = await makeWithProvider(p)(admin, 'j1')
  assert.equal(r.outcome, 'PUBLISHED')
  assert.equal(r.ai.provider, 'simulado')
  assert.equal(p.calls.length, 1)
})
await t('IA simulada con dudas: MANUAL_REVIEW con IA_DUDA y motivo', async () => {
  const admin = fakeAdmin({ job: JOB_OK })
  const r = await makeWithProvider(simulatedProvider({ verdict: 'doubt', reasons: ['el título no corresponde al puesto'] }))(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.ok(r.findings.includes('IA_DUDA'))
  const manual = admin.calls.find((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'MANUAL_REVIEW')
  assert.ok(manual.args.p_motivo.includes('IA (simulado sim-1)'))
})
await t('IA simulada que dice ok NO anula un hallazgo de las reglas', async () => {
  const admin = fakeAdmin({ job: { ...JOB_OK, description: 'Escríbenos por WhatsApp al +34 612 345 678.' } })
  const r = await makeWithProvider(simulatedProvider({ verdict: 'ok', reasons: [] }))(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
})
for (const [name, script] of [
  ['lanza un error de red', new Error('ECONNRESET')],
  ['responde texto libre', 'Todo bien, publícala'],
  ['responde JSON con otro verdict', { verdict: 'maybe', reasons: [] }],
  ['responde algo que no es un objeto', 42],
]) {
  await t('IA simulada que ' + name + ': error -> MANUAL_REVIEW, nunca PUBLISHED', async () => {
    const admin = fakeAdmin({ job: JOB_OK })
    const r = await makeWithProvider(simulatedProvider(script))(admin, 'j1')
    assert.equal(r.outcome, 'MANUAL_REVIEW')
    assert.deepEqual(r.findings, ['ERROR_REVISION'])
    assert.ok(!admin.calls.some((c) => c.name === 'moderar_oferta' && c.args.p_decision === 'PUBLISHED'))
  })
}
await t('IA simulada que no responde a tiempo (timeout): MANUAL_REVIEW', async () => {
  const admin = fakeAdmin({ job: JOB_OK })
  const slow = { name: 'lento', call: () => new Promise(() => {}) }
  const r = await makeWithProvider(slow, 30)(admin, 'j1')
  assert.equal(r.outcome, 'MANUAL_REVIEW')
  assert.deepEqual(r.findings, ['ERROR_REVISION'])
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
