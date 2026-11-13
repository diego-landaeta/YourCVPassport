// Pruebas de _shared/claude.ts (cliente de la API de Anthropic usado por ai-cv-assistant y
// ai-optimize-description). Sin red ni claves: fetch es falso.
//   node supabase/functions/_shared/claude.test.mjs
import assert from 'node:assert/strict'
import { callClaude, ProviderAuthError, CLAUDE_FAST, CLAUDE_PRECISE, CLAUDE_MODELS_TO_TRY, ANTHROPIC_URL, ANTHROPIC_VERSION } from './claude.ts'

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

const realFetch = globalThis.fetch
/** Sustituye fetch por un doble que anota la llamada y devuelve `resp`. */
function fakeFetch(resp) {
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    return typeof resp === 'function' ? resp(calls.length) : resp
  }
  return calls
}
const ok = (data) => ({ ok: true, status: 200, json: async () => data })
const err = (status) => ({ ok: false, status, json: async () => ({ error: { message: 'datos del usuario que no deben salir' } }) })
const KEY = 'sk-ant-clave-inventada-solo-para-pruebas'

await t('orden de modelos: rapido primero y preciso de respaldo', () => {
  assert.deepEqual([...CLAUDE_MODELS_TO_TRY], [CLAUDE_FAST, CLAUDE_PRECISE])
  assert.match(CLAUDE_FAST, /haiku/)
  assert.match(CLAUDE_PRECISE, /sonnet/)
})

await t('envia la peticion a Anthropic con la clave en cabecera, nunca en la URL', async () => {
  const calls = fakeFetch(ok({ content: [{ type: 'text', text: ' Hola ' }] }))
  const out = await callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'Mejora esto', maxTokens: 700, temperature: 0.7 })
  assert.equal(out, 'Hola')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, ANTHROPIC_URL)
  assert.ok(!calls[0].url.includes(KEY), 'la clave no puede ir en la URL')
  const h = calls[0].init.headers
  assert.equal(h['x-api-key'], KEY)
  assert.equal(h['anthropic-version'], ANTHROPIC_VERSION)
  assert.equal(h['Content-Type'], 'application/json')
  const body = JSON.parse(calls[0].init.body)
  assert.equal(body.model, CLAUDE_FAST)
  assert.equal(body.max_tokens, 700)
  assert.equal(body.temperature, 0.7)
  assert.deepEqual(body.messages, [{ role: 'user', content: 'Mejora esto' }])
  assert.ok(!JSON.stringify(body).includes(KEY), 'la clave no puede ir en el cuerpo')
})

await t('sin temperatura no la envia, y max_tokens tiene valor por defecto', async () => {
  const calls = fakeFetch(ok({ content: [{ type: 'text', text: 'x' }] }))
  await callClaude({ apiKey: KEY, model: CLAUDE_PRECISE, prompt: 'p' })
  const body = JSON.parse(calls[0].init.body)
  assert.ok(!('temperature' in body))
  assert.equal(body.max_tokens, 2048)
})

await t('une los bloques de texto y descarta los que no lo son', async () => {
  fakeFetch(ok({ content: [{ type: 'thinking', text: 'no' }, { type: 'text', text: 'Uno ' }, { type: 'tool_use' }, { type: 'text', text: 'dos' }] }))
  assert.equal(await callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'p' }), 'Uno dos')
})

await t('401 y 403 son ProviderAuthError (probar otro modelo no lo arregla)', async () => {
  for (const status of [401, 403]) {
    fakeFetch(err(status))
    await assert.rejects(callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'p' }), (e) => e instanceof ProviderAuthError && e.message === `AI provider returned ${status}`)
  }
})

await t('429, 404 y 5xx son errores normales (el llamador prueba el siguiente modelo)', async () => {
  for (const status of [404, 429, 500, 529]) {
    fakeFetch(err(status))
    await assert.rejects(callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'p' }), (e) => !(e instanceof ProviderAuthError) && e.message === `AI provider returned ${status}`)
  }
})

await t('el mensaje de error nunca incluye el cuerpo del proveedor ni la clave', async () => {
  fakeFetch(err(400))
  try { await callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'p' }); assert.fail('debia fallar') } catch (e) {
    assert.ok(!e.message.includes('datos del usuario'))
    assert.ok(!e.message.includes(KEY))
  }
})

await t('respuesta vacia: error con el motivo de parada', async () => {
  fakeFetch(ok({ content: [], stop_reason: 'refusal' }))
  await assert.rejects(callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'p' }), /no usable text \(refusal\)/)
  fakeFetch(ok({ content: [{ type: 'text', text: '   ' }] }))
  await assert.rejects(callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'p' }), /no usable text \(unknown\)/)
})

await t('pasa la senal de cancelacion a fetch (timeout del llamador)', async () => {
  const calls = fakeFetch(ok({ content: [{ type: 'text', text: 'x' }] }))
  const c = new AbortController()
  await callClaude({ apiKey: KEY, model: CLAUDE_FAST, prompt: 'p', signal: c.signal })
  assert.equal(calls[0].init.signal, c.signal)
})

globalThis.fetch = realFetch
console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (con fallos)' : ''}`)
