// Pruebas de ai-cv-assistant y ai-optimize-description con Claude como proveedor. Se ejecuta el
// index.ts REAL empaquetado con esbuild contra una base en memoria; fetch y las claves son falsos.
//   node supabase/functions/ai-cv-assistant/claude.test.mjs
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
  SUPABASE_ANON_KEY: 'anon-de-prueba-0123456789',
  ANTHROPIC_API_KEY: 'sk-ant-clave-inventada-solo-para-pruebas',
}
const JWT = { authorization: 'Bearer jwt-ok', origin: 'https://yourcvpassport.com' }
const origConsole = { error: console.error, warn: console.warn }
console.error = () => {}
console.warn = () => {}

function supabase({ allowed = true } = {}) {
  const fake = createFakeSupabase({}, {
    getUser: (tok) => (tok === 'jwt-ok' ? 'user-1' : null),
    rpc: (name) => {
      if (name === 'check_feature_limit') return { data: { allowed, plan: 'pro', remaining: 9 }, error: null }
      if (name === 'record_usage') return { data: null, error: null }
      return { data: null, error: { message: `rpc sin simular: ${name}` } }
    },
  })
  globalThis.__fakeSupabase = fake
  return fake
}

const realFetch = globalThis.fetch
function fakeAnthropic(handler) {
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init, body: init?.body ? JSON.parse(init.body) : null })
    return handler(calls.length, calls[calls.length - 1])
  }
  return calls
}
const textoOk = (text) => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }], stop_reason: 'end_turn' }) })
const falla = (status) => ({ ok: false, status, json: async () => ({}) })

const cv = await loadEdge('ai-cv-assistant', ENV)
const TAREA = { task: 'optimize_headline', input: { headline: 'Desarrollador web con 5 años' } }

await t('ai-cv-assistant: responde con Haiku primero y registra el modelo usado', async () => {
  const fake = supabase()
  const calls = fakeAnthropic(() => textoOk('1. Titular A\n2. Titular B\n3. Titular C'))
  const res = await post(cv, 'ai-cv-assistant', TAREA, JWT)
  assert.equal(res.status, 200)
  const out = await res.json()
  assert.equal(out.success, true)
  assert.match(out.text, /Titular A/)
  assert.match(out.model, /haiku/)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages')
  assert.equal(calls[0].init.headers['x-api-key'], ENV.ANTHROPIC_API_KEY)
  assert.match(calls[0].body.messages[0].content, /Desarrollador web con 5 años/)
  const uso = fake.db.rpcCalls.find((c) => c.name === 'record_usage')
  assert.equal(uso.args.p_metadata.model, out.model)
})

await t('ai-cv-assistant: si Haiku falla (529) prueba con Sonnet', async () => {
  supabase()
  const calls = fakeAnthropic((n) => (n === 1 ? falla(529) : textoOk('respaldo')))
  const res = await post(cv, 'ai-cv-assistant', TAREA, JWT)
  assert.equal(res.status, 200)
  const out = await res.json()
  assert.equal(out.text, 'respaldo')
  assert.match(out.model, /sonnet/)
  assert.equal(calls.length, 2)
})

await t('ai-cv-assistant: clave rechazada (401) no prueba otros modelos y devuelve 502 sin datos del proveedor', async () => {
  supabase()
  const calls = fakeAnthropic(() => falla(401))
  const res = await post(cv, 'ai-cv-assistant', TAREA, JWT)
  assert.equal(res.status, 502)
  const out = await res.json()
  assert.equal(out.code, 'ai_provider_error')
  assert.equal(calls.length, 1)
  assert.ok(!JSON.stringify(out).includes(ENV.ANTHROPIC_API_KEY))
})

await t('ai-cv-assistant: todos los modelos fallan -> 502', async () => {
  supabase()
  const calls = fakeAnthropic(() => falla(500))
  const res = await post(cv, 'ai-cv-assistant', TAREA, JWT)
  assert.equal(res.status, 502)
  assert.equal(calls.length, 2)
})

await t('ai-cv-assistant: sin ANTHROPIC_API_KEY -> 503 ai_not_configured y no llama a nadie', async () => {
  supabase()
  const sinClave = await loadEdge('ai-cv-assistant', { ...ENV, ANTHROPIC_API_KEY: undefined })
  const calls = fakeAnthropic(() => textoOk('x'))
  const res = await post(sinClave, 'ai-cv-assistant', TAREA, JWT)
  assert.equal(res.status, 503)
  assert.equal((await res.json()).code, 'ai_not_configured')
  assert.equal(calls.length, 0)
})

await t('ai-cv-assistant: ya no usa la clave de Gemini', async () => {
  supabase()
  const conGemini = await loadEdge('ai-cv-assistant', { SUPABASE_URL: ENV.SUPABASE_URL, SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY, GEMINI_API_KEY: 'AIza-no-debe-usarse' })
  const calls = fakeAnthropic(() => textoOk('x'))
  const res = await post(conGemini, 'ai-cv-assistant', TAREA, JWT)
  assert.equal(res.status, 503)
  assert.equal(calls.length, 0)
})

await t('ai-cv-assistant: sin sesion, tarea desconocida y limite del plan se resuelven antes de llamar al proveedor', async () => {
  supabase()
  const calls = fakeAnthropic(() => textoOk('x'))
  assert.equal((await post(cv, 'ai-cv-assistant', TAREA, { origin: JWT.origin })).status, 401)
  assert.equal((await post(cv, 'ai-cv-assistant', { task: 'otra', input: {} }, JWT)).status, 400)
  supabase({ allowed: false })
  assert.equal((await post(cv, 'ai-cv-assistant', TAREA, JWT)).status, 403)
  assert.equal(calls.length, 0)
})

await t('ai-optimize-description: usa Haiku con temperatura 0.7 y 1024 tokens', async () => {
  // loadEdge fija el entorno global: se recarga aqui para no heredar el de las pruebas «sin clave».
  const opt = await loadEdge('ai-optimize-description', ENV)
  supabase()
  const calls = fakeAnthropic(() => textoOk('Descripcion mejorada'))
  const res = await post(opt, 'ai-optimize-description', { type: 'experience', text: 'Hice cosas en mi trabajo anterior.', role: 'Analista' }, JWT)
  assert.equal(res.status, 200, await res.clone().text()); const salida = await res.json(); assert.equal(salida.optimized, 'Descripcion mejorada')
  assert.equal(calls.length, 1)
  assert.match(calls[0].body.model, /haiku/)
  assert.equal(calls[0].body.temperature, 0.7)
  assert.equal(calls[0].body.max_tokens, 1024)
  assert.equal(calls[0].init.headers['x-api-key'], ENV.ANTHROPIC_API_KEY)
})

await t('ai-optimize-description: sin clave de Anthropic -> 503 y sin llamadas', async () => {
  supabase()
  const sinClave = await loadEdge('ai-optimize-description', { ...ENV, ANTHROPIC_API_KEY: undefined })
  const calls = fakeAnthropic(() => textoOk('x'))
  const res = await post(sinClave, 'ai-optimize-description', { type: 'experience', text: 'Hice cosas en mi trabajo anterior.', role: 'Analista' }, JWT)
  assert.equal(res.status, 503)
  assert.equal(calls.length, 0)
})

globalThis.fetch = realFetch
console.error = origConsole.error
console.warn = origConsole.warn
console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (con fallos)' : ''}`)
