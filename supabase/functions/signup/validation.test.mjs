// Pruebas de signup/validation.ts (tipo, idioma, edad y casillas del alta). Sin dependencias:
//   node supabase/functions/signup/validation.test.mjs
import assert from 'node:assert/strict'
import { validateSignupFields, SignupValidationError, parseBirthDate, ageFrom, normalizeLang } from './validation.ts'

let passed = 0
function t(name, fn) {
  try {
    fn()
    passed++
    console.log(`ok   ${name}`)
  } catch (e) {
    console.log(`FAIL ${name}\n     ${e.stack}`)
    process.exitCode = 1
  }
}

const NOW = new Date('2026-10-30T12:00:00Z')
const BOXES = { acepto_condiciones_privacidad: true, datos_verdaderos: true }
const ok = (over = {}) => ({ tipo: 'candidato', fecha_nacimiento: '1995-05-20', casillas: BOXES, ...over })
const fails = (payload, re) => assert.throws(() => validateSignupFields(payload, NOW), (e) => e instanceof SignupValidationError && e.status === 400 && e.code === 'INVALID_INPUT' && re.test(e.message), JSON.stringify(payload))

t('candidato adulto con casillas obligatorias: válido', () => {
  const v = validateSignupFields(ok(), NOW)
  assert.equal(v.tipo, 'candidato')
  assert.equal(v.age, 31)
  assert.equal(v.fechaNacimiento, '1995-05-20')
  assert.equal(v.acceptedBoxes.acepto_condiciones_privacidad, true)
  assert.equal(v.acceptedBoxes.perfil_publico, false, 'las opcionales ausentes quedan en false')
})
t('casillas: solo `true` exacto cuenta; el resto de claves se descarta', () => {
  const v = validateSignupFields(ok({ casillas: { ...BOXES, perfil_publico: 'true', aparecer_google: 1, alertas_novedades: true, inventada: true } }), NOW)
  assert.equal(v.acceptedBoxes.perfil_publico, false)
  assert.equal(v.acceptedBoxes.aparecer_google, false)
  assert.equal(v.acceptedBoxes.alertas_novedades, true)
  assert.ok(!('inventada' in v.acceptedBoxes))
})

// --- edad
t('menor de 16: UNDERAGE; justo 16 hoy: válido (con casilla de tutores, es menor de 18)', () => {
  fails(ok({ fecha_nacimiento: '2012-01-01' }), /UNDERAGE/)
  fails(ok({ fecha_nacimiento: '2010-10-31' }), /UNDERAGE/) // cumple 16 mañana
  const v = validateSignupFields(ok({ fecha_nacimiento: '2010-10-30', casillas: { ...BOXES, autorizacion_tutores: true } }), NOW)
  assert.equal(v.age, 16)
})
t('16 o 17 años sin autorización de tutores -> CASILLA_OBLIGATORIA; con ella o con 18, válido', () => {
  fails(ok({ fecha_nacimiento: '2009-06-01' }), /CASILLA_OBLIGATORIA: autorizacion_tutores/)
  assert.equal(validateSignupFields(ok({ fecha_nacimiento: '2009-06-01', casillas: { ...BOXES, autorizacion_tutores: true } }), NOW).age, 17)
  assert.equal(validateSignupFields(ok({ fecha_nacimiento: '2008-10-30' }), NOW).age, 18)
})
t('fecha de nacimiento ausente, vacía, mal formada, imposible o futura -> 400 para candidato', () => {
  for (const bad of [undefined, null, '', '1995/05/20', '20-05-1995', '1995-02-31', '1995-13-01', '1899-12-31', '2027-01-01', 19950520, {}, [], '1995-5-2']) {
    fails(ok({ fecha_nacimiento: bad }), /fecha_nacimiento/)
  }
})

// --- tipo
t('tipo desconocido, vacío, con otras mayúsculas o de otro tipo de dato = candidato (no esquiva edad ni casillas)', () => {
  for (const tipo of [undefined, null, '', 'Empresa', 'EMPRESA', ' empresa', 'company', 'admin', 1, true, ['empresa'], { a: 1 }]) {
    assert.equal(validateSignupFields(ok({ tipo }), NOW).tipo, 'candidato', JSON.stringify(tipo))
    fails({ tipo, casillas: BOXES }, /fecha_nacimiento/) // sin fecha: rechazado igual que un candidato
    fails({ tipo, fecha_nacimiento: '1995-05-20' }, /casillas/) // sin casillas: rechazado
    fails({ tipo, fecha_nacimiento: '2015-05-20', casillas: BOXES }, /UNDERAGE/) // menor: rechazado
  }
})
t('tipo "empresa" exacto: sin fecha ni casillas es válido; si llega fecha se valida igual', () => {
  const v = validateSignupFields({ tipo: 'empresa' }, NOW)
  assert.deepEqual([v.tipo, v.fechaNacimiento, v.acceptedBoxes], ['empresa', undefined, undefined])
  assert.equal(validateSignupFields({ tipo: 'empresa', fecha_nacimiento: '1980-01-01' }, NOW).fechaNacimiento, '1980-01-01')
  fails({ tipo: 'empresa', fecha_nacimiento: '2015-01-01' }, /UNDERAGE/)
  fails({ tipo: 'empresa', fecha_nacimiento: 'ayer' }, /fecha_nacimiento/)
})

// --- casillas
t('casillas ausentes o con forma rara -> 400 para candidato', () => {
  for (const bad of [undefined, null, '', 'si', 5, [], [BOXES]]) fails(ok({ casillas: bad }), /casillas is required/)
})
t('falta alguna casilla obligatoria -> CASILLA_OBLIGATORIA con su nombre', () => {
  fails(ok({ casillas: { datos_verdaderos: true } }), /CASILLA_OBLIGATORIA: acepto_condiciones_privacidad/)
  fails(ok({ casillas: { acepto_condiciones_privacidad: true } }), /CASILLA_OBLIGATORIA: datos_verdaderos/)
  fails(ok({ casillas: { acepto_condiciones_privacidad: 'true', datos_verdaderos: true } }), /CASILLA_OBLIGATORIA: acepto_condiciones_privacidad/)
  fails(ok({ casillas: {} }), /CASILLA_OBLIGATORIA/)
})
t('payload nulo o vacío: se trata como candidato sin fecha -> 400', () => {
  fails(undefined, /fecha_nacimiento/)
  fails(null, /fecha_nacimiento/)
  fails({}, /fecha_nacimiento/)
})

// --- idioma
t('registro_idioma: es/en y variantes regionales; lo raro se ignora', () => {
  const lang = (registro_idioma) => validateSignupFields(ok({ registro_idioma }), NOW).registroIdioma
  assert.equal(lang('en'), 'en')
  assert.equal(lang('EN-gb'), 'en')
  assert.equal(lang(' es '), 'es')
  assert.equal(lang('pt-BR'), 'pt')
  for (const bad of [undefined, '', 'english', 'e', '12', '<script>', 5, {}]) assert.equal(lang(bad), undefined, JSON.stringify(bad))
})

// --- auxiliares
t('parseBirthDate / ageFrom / normalizeLang', () => {
  assert.deepEqual(parseBirthDate('2000-02-29', NOW), { y: 2000, m: 2, d: 29 })
  assert.equal(parseBirthDate('2001-02-29', NOW), null)
  assert.equal(parseBirthDate('2026-10-31', NOW), null, 'futura')
  assert.equal(ageFrom({ y: 2000, m: 10, d: 30 }, NOW), 26)
  assert.equal(ageFrom({ y: 2000, m: 10, d: 31 }, NOW), 25)
  assert.equal(normalizeLang('ES'), 'es')
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
