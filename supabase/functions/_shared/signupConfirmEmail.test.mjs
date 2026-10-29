// Pruebas de signupConfirmEmail.ts (correo de confirmación del alta: idioma y tipo de cuenta).
//   node supabase/functions/_shared/signupConfirmEmail.test.mjs
import assert from 'node:assert/strict'
import { buildSignupConfirmEmail, signupEmailKind, signupEmailLang } from './signupConfirmEmail.ts'
import { confirmSignupEmail } from './emailTemplates.ts'

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
const LINK = 'https://yourcvpassport.com/confirm?token_hash=abc&type=signup'
const mail = (tipo, lang, name = 'Ana') => buildSignupConfirmEmail({ tipo, lang, name, link: LINK })
const all = (m) => m.subject + m.html + m.text

t('candidato en español: es EXACTAMENTE el correo de siempre (confirmSignupEmail)', () => {
  for (const lang of [undefined, 'es', 'fr', '', null]) {
    const m = mail('candidato', lang)
    const ref = confirmSignupEmail({ name: 'Ana', link: LINK })
    assert.equal(m.subject, ref.subject)
    assert.equal(m.text, ref.text)
  }
})
t('las cuatro variantes tienen asunto, saludo, botón con el enlace y siguiente paso propios', () => {
  const seen = new Set()
  for (const tipo of ['candidato', 'empresa']) for (const lang of ['es', 'en']) {
    const m = mail(tipo, lang)
    seen.add(m.subject)
    assert.ok(m.html.includes('href="https://yourcvpassport.com/confirm?token_hash=abc&amp;type=signup"'), `${tipo}/${lang}: enlace`)
    assert.ok(m.text.includes(LINK), `${tipo}/${lang}: enlace en texto`)
    assert.ok(m.html.includes(`lang="${lang}"`), `${tipo}/${lang}: atributo lang`)
    assert.ok(lang === 'en' ? m.text.includes('Hi Ana,') : m.text.includes('Hola, Ana:'), `${tipo}/${lang}: saludo`)
    assert.ok(!/undefined|\[object|NaN/.test(all(m)))
  }
  assert.equal(seen.size, 4, 'cuatro asuntos distintos')
})
t('EMPRESA: asunto, botón y siguiente paso hablan del registro de la empresa (es y en)', () => {
  const es = mail('empresa', 'es')
  assert.equal(es.subject, 'Confirma tu correo para completar el registro de tu empresa')
  assert.ok(es.text.includes('Confirmar mi correo') && es.text.includes('completa el registro de tu empresa'))
  assert.ok(es.text.includes('cuenta de empresa') && !es.text.includes('CV profesional') && !es.text.includes('plantillas profesionales'))
  const en = mail('empresa', 'en')
  assert.equal(en.subject, 'Confirm your email to complete your company registration')
  assert.ok(en.text.includes('Confirm my email') && en.text.includes('complete your company registration'))
  assert.ok(!/Hola|Confirmar|empresa|candidatura|Un saludo/.test(en.text), `español en el correo en inglés:\n${en.text}`)
})
t('CANDIDATO en inglés: contenido del candidato, sin español', () => {
  const en = mail('candidato', 'en')
  assert.equal(en.subject, 'Confirm your email to activate your account')
  assert.ok(en.text.includes('Build your CV with professional templates'))
  assert.ok(!/Hola|Confirmar|CV profesional|Un saludo|Mensaje automático/.test(en.text), en.text)
})
t('el correo de empresa en español no contiene inglés fijo', () => {
  const es = mail('empresa', 'es')
  assert.ok(!/Kind regards|Hello|Hi |Confirm my|Privacy/.test(es.text), es.text)
})
t('tipo: solo "empresa" exacto da el correo de empresa; idioma: solo "en" (y en-XX) da inglés', () => {
  for (const tipo of [undefined, null, '', 'Empresa', 'EMPRESA', 'company', 5, ['empresa']]) assert.equal(signupEmailKind(tipo), 'candidato', String(tipo))
  assert.equal(signupEmailKind('empresa'), 'empresa')
  for (const l of ['en', 'EN', 'en-GB', ' en ']) assert.equal(signupEmailLang(l), 'en', l)
  for (const l of [undefined, null, 'es', 'fr', 'english', '', 7]) assert.equal(signupEmailLang(l), 'es', String(l))
  // El tipo raro no puede sacar el correo de empresa
  assert.equal(mail('Empresa', 'es').subject, confirmSignupEmail({ name: 'Ana', link: LINK }).subject)
})
t('nombre hostil escapado en HTML; sin nombre, saludo genérico; enlace hostil se sustituye', () => {
  const evil = mail('empresa', 'es', '<script>alert(1)</script>')
  assert.ok(!evil.html.includes('<script>') && evil.html.includes('&lt;script&gt;'))
  assert.ok(mail('empresa', 'en', null).text.includes('Hello,'))
  assert.ok(mail('empresa', 'es', null).text.includes('Hola:'))
  const bad = buildSignupConfirmEmail({ tipo: 'empresa', lang: 'es', link: 'javascript:alert(1)' })
  assert.ok(!/href="javascript:/i.test(bad.html))
})
t('asunto sin saltos de línea y correos de soporte correctos', () => {
  for (const tipo of ['candidato', 'empresa']) for (const lang of ['es', 'en']) {
    const m = mail(tipo, lang)
    assert.ok(!/[\r\n]/.test(m.subject))
    for (const e of new Set(all(m).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [])) assert.equal(e, 'support@yourcvpassport.com')
  }
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
