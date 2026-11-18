// Pruebas de serviceAuth.ts (autorización de moderate-job-posting, send-outbox y
// expire-job-postings: secreto de cron, service_role y admin). Sin dependencias:
//   node supabase/functions/_shared/serviceAuth.test.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { authorizeRequest, cronSecretMatches, timingSafeEqual, supabaseAuthDeps, MIN_CRON_SECRET_LENGTH } from './serviceAuth.ts'

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

const CRON = 'c0ffee-cron-secret-0123456789abcdef'
const SERVICE = 'service-role-key-for-tests-xyz'
const URL = 'https://x.supabase.co/functions/v1/send-outbox'

/** Dependencias falsas que cuentan las consultas (la vía cron no debe tocar la base). */
function deps(o = {}) {
  const { users = {}, roles = {} } = o
  const cronSecret = 'cronSecret' in o ? o.cronSecret : CRON
  const calls = { getUserId: 0, getRole: 0 }
  return {
    calls,
    serviceKey: SERVICE,
    cronSecret,
    async getUserId(token) { calls.getUserId++; return users[token] ?? null },
    async getRole(id) { calls.getRole++; return roles[id] ?? null },
  }
}
const req = (headers = {}) => new Request(URL, { method: 'POST', headers })

// ------------------------------- x-cron-secret -----------------------------------
await t('secreto correcto -> cron, 200, sin consultar la base', async () => {
  const d = deps()
  const r = await authorizeRequest(req({ 'x-cron-secret': CRON }), d)
  assert.deepEqual(r, { who: 'cron', status: 200 })
  assert.equal(d.calls.getUserId + d.calls.getRole, 0)
})

await t('secreto correcto con espacios o salto de línea alrededor (pegado en el panel) -> cron', async () => {
  assert.equal((await authorizeRequest(req({ 'x-cron-secret': ` ${CRON} ` }), deps())).who, 'cron')
  assert.equal((await authorizeRequest(req({ 'x-cron-secret': CRON }), deps({ cronSecret: `${CRON}\n` }))).who, 'cron')
})

await t('secreto incorrecto -> 401 (misma longitud, distinto último carácter, prefijo, más largo, otro caso)', async () => {
  for (const bad of [CRON.slice(0, -1) + 'X', CRON.slice(0, -1), CRON + 'x', CRON.toUpperCase(), 'x'.repeat(CRON.length), 'wrong']) {
    const d = deps()
    const r = await authorizeRequest(req({ 'x-cron-secret': bad }), d)
    assert.deepEqual(r, { who: null, status: 401 }, bad)
    assert.equal(d.calls.getUserId, 0, 'sin Authorization no se consulta ningún usuario')
  }
})

await t('secreto ausente (sin cabecera ni Authorization) -> 401', async () => {
  assert.deepEqual(await authorizeRequest(req(), deps()), { who: null, status: 401 })
})

await t('entorno sin CRON_SECRET (undefined) -> nunca acepta, ni con cabecera vacía ni con un valor cualquiera', async () => {
  for (const header of [CRON, 'cualquier-cosa-larga-1234567890', '', 'undefined', 'null']) {
    const r = await authorizeRequest(req({ 'x-cron-secret': header }), deps({ cronSecret: undefined }))
    assert.deepEqual(r, { who: null, status: 401 }, `cabecera «${header}»`)
  }
})

await t('CRON_SECRET vacío, en blanco o demasiado corto -> nunca acepta (cabecera vacía == secreto vacío NO vale)', async () => {
  for (const env of ['', '   ', '\n', 'short', 'x'.repeat(MIN_CRON_SECRET_LENGTH - 1)]) {
    for (const header of ['', env, env.trim(), 'x'.repeat(MIN_CRON_SECRET_LENGTH)]) {
      const r = await authorizeRequest(req({ 'x-cron-secret': header }), deps({ cronSecret: env }))
      assert.deepEqual(r, { who: null, status: 401 }, `env «${env}» cabecera «${header}»`)
    }
  }
  assert.equal(cronSecretMatches('', ''), false)
  assert.equal(cronSecretMatches(null, null), false)
  assert.equal(cronSecretMatches(undefined, undefined), false)
})

await t('cabecera vacía con secreto configurado -> 401', async () => {
  assert.deepEqual(await authorizeRequest(req({ 'x-cron-secret': '' }), deps()), { who: null, status: 401 })
  assert.deepEqual(await authorizeRequest(req({ 'x-cron-secret': '   ' }), deps()), { who: null, status: 401 })
})

await t('un secreto de exactamente la longitud mínima sí vale', async () => {
  const s = 'k'.repeat(MIN_CRON_SECRET_LENGTH)
  assert.equal(cronSecretMatches(s, s), true)
})

await t('el secreto de cron no se confunde con un Bearer: como Authorization no abre nada', async () => {
  const r = await authorizeRequest(req({ Authorization: `Bearer ${CRON}` }), deps())
  assert.deepEqual(r, { who: null, status: 401 })
})

await t('timingSafeEqual: iguales, distintos, longitudes distintas, vacíos y multibyte', () => {
  assert.equal(timingSafeEqual('abc', 'abc'), true)
  assert.equal(timingSafeEqual('abc', 'abd'), false)
  assert.equal(timingSafeEqual('abc', 'abcd'), false)
  assert.equal(timingSafeEqual('', 'a'), false)
  assert.equal(timingSafeEqual('', ''), true)
  assert.equal(timingSafeEqual('ñandú', 'ñandú'), true)
  assert.equal(timingSafeEqual('ñandú', 'nandu'), false)
})

// ------------------------- vías service_role y admin intactas --------------------------
await t('clave service_role en Authorization -> service (con y sin CRON_SECRET en el entorno)', async () => {
  for (const cronSecret of [CRON, undefined, '']) {
    const d = deps({ cronSecret })
    const r = await authorizeRequest(req({ Authorization: `Bearer ${SERVICE}` }), d)
    assert.deepEqual(r, { who: 'service', status: 200 })
    assert.equal(d.calls.getUserId, 0)
  }
})

await t('clave service_role incorrecta -> se trata como token de usuario: 401 si no es de nadie', async () => {
  const r = await authorizeRequest(req({ Authorization: `Bearer ${SERVICE}x` }), deps())
  assert.deepEqual(r, { who: null, status: 401 })
})

await t('admin con sesión -> admin; sin ser admin -> 403; token inválido -> 401; perfil sin leer -> 403', async () => {
  const d = deps({ users: { 'tok-admin': 'u1', 'tok-user': 'u2', 'tok-noprofile': 'u3' }, roles: { u1: 'admin', u2: 'user' } })
  assert.deepEqual(await authorizeRequest(req({ Authorization: 'Bearer tok-admin' }), d), { who: 'admin', status: 200 })
  assert.deepEqual(await authorizeRequest(req({ Authorization: 'bearer tok-admin' }), d), { who: 'admin', status: 200 })
  assert.deepEqual(await authorizeRequest(req({ Authorization: 'Bearer tok-user' }), d), { who: null, status: 403 })
  assert.deepEqual(await authorizeRequest(req({ Authorization: 'Bearer tok-noprofile' }), d), { who: null, status: 403 })
  assert.deepEqual(await authorizeRequest(req({ Authorization: 'Bearer tok-nadie' }), d), { who: null, status: 401 })
  assert.deepEqual(await authorizeRequest(req({ Authorization: 'Bearer ' }), d), { who: null, status: 401 })
  assert.deepEqual(await authorizeRequest(req({ Authorization: '' }), d), { who: null, status: 401 })
})

await t('un secreto de cron erróneo NO bloquea las otras vías (service_role y admin siguen entrando)', async () => {
  const d = deps({ users: { 'tok-admin': 'u1' }, roles: { u1: 'ADMIN' } })
  assert.equal((await authorizeRequest(req({ 'x-cron-secret': 'mal', Authorization: `Bearer ${SERVICE}` }), d)).who, 'service')
  assert.equal((await authorizeRequest(req({ 'x-cron-secret': 'mal', Authorization: 'Bearer tok-admin' }), d)).who, 'admin')
})

await t('un secreto de cron erróneo no convierte a un usuario normal en admin', async () => {
  const d = deps({ users: { 'tok-user': 'u2' }, roles: { u2: 'user' } })
  assert.deepEqual(await authorizeRequest(req({ 'x-cron-secret': CRON.slice(1), Authorization: 'Bearer tok-user' }), d), { who: null, status: 403 })
})

await t('supabaseAuthDeps: lee usuario y rol con el cliente admin; errores -> null', async () => {
  const mk = (user, profile) => ({
    auth: { getUser: async () => user },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => profile }) }) }),
  })
  const ok = supabaseAuthDeps(mk({ data: { user: { id: 'u9' } }, error: null }, { data: { role: 'admin' }, error: null }), SERVICE, CRON)
  assert.equal(await ok.getUserId('t'), 'u9')
  assert.equal(await ok.getRole('u9'), 'admin')
  assert.equal(ok.serviceKey, SERVICE)
  assert.equal(ok.cronSecret, CRON)
  const bad = supabaseAuthDeps(mk({ data: { user: null }, error: { message: 'x' } }, { data: null, error: { message: 'y' } }), SERVICE, undefined)
  assert.equal(await bad.getUserId('t'), null)
  assert.equal(await bad.getRole('u9'), null)
})

// ---------------- Cableado en las tres funciones (no se pueden importar: usan Deno) ----------------
const HERE = dirname(fileURLToPath(import.meta.url))
const FN_DIR = join(HERE, '..')
for (const fn of ['moderate-job-posting', 'send-outbox', 'expire-job-postings']) {
  await t(`${fn}: usa authorizeRequest con CRON_SECRET, mantiene service_role/admin y no imprime el secreto`, () => {
    const src = readFileSync(join(FN_DIR, fn, 'index.ts'), 'utf8')
    assert.ok(/from '\.\.\/_shared\/serviceAuth\.ts'/.test(src), 'importa serviceAuth')
    assert.ok(/authorizeRequest\(req, supabaseAuthDeps\(admin, SERVICE_KEY, Deno\.env\.get\('CRON_SECRET'\)\)\)/.test(src), 'pasa CRON_SECRET y la clave service_role')
    assert.ok(/getCorsHeaders\(req\)/.test(src) && /req\.method === 'OPTIONS'/.test(src) && /METHOD_NOT_ALLOWED/.test(src), 'CORS y método intactos')
    assert.ok(/code: 'FORBIDDEN'/.test(src) && /code: 'UNAUTHORIZED'/.test(src), '401/403 intactos')
    assert.ok(!/console\.[a-z]+\([^)]*CRON_SECRET/.test(src) && !/console\.[a-z]+\([^)]*x-cron-secret/i.test(src), 'no se registra el secreto')
    // La comprobación va ANTES de leer el cuerpo o tocar la base
    assert.ok(src.indexOf('await authorize(req, admin)') < src.indexOf('req.text()') || !src.includes('req.text()'))
  })
}

await t('CORS: x-cron-secret no se publica como cabecera permitida a navegadores', () => {
  const cors = readFileSync(join(FN_DIR, '_shared', 'cors.ts'), 'utf8')
  assert.ok(!/x-cron-secret/i.test(cors), 'el programador no es un navegador: no se amplía CORS')
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
