// Pruebas de rules.ts (revisión de empresas). Sin dependencias:
//   node supabase/functions/company-review-ai/rules.test.mjs
// (Node >= 22.18 / 24 carga .ts directamente; si no: node --experimental-strip-types ...)
import assert from 'node:assert/strict'
import { reviewCompany, checkTaxId, canonicalTaxId, isFreeEmailHost, hasOwnTaxPattern } from './rules.ts'

let passed = 0
function t(name, fn) {
  try {
    fn()
    passed++
    console.log(`ok   ${name}`)
  } catch (e) {
    console.log(`FAIL ${name}\n     ${e.message}`)
    process.exitCode = 1
  }
}

const ACTIVE = new Set(['ES', 'MX', 'AR', 'CL', 'CO', 'PE', 'EC', 'BR', 'DE', 'FR'])
const good = {
  id: '11111111-1111-1111-1111-111111111111',
  company_name: 'Acme Servicios',
  legal_name: 'Acme Servicios SL',
  tax_id: 'A58818501', // CIF con dígito de control válido
  country_code: 'ES',
  company_email: 'rrhh@acme.es',
  website_url: 'https://www.acme.es',
  contact_name: 'Laura Pérez',
  description: 'Consultora de formación y selección de personal.',
  industry: 'Consultoría',
}
const codes = (r) => r.motivos.filter((m) => m.severity === 'warn').map((m) => m.code)
const run = (over = {}, others = [], active = ACTIVE) => reviewCompany({ ...good, ...over }, others, active)

t('empresa limpia (CIF válido, web = dominio del correo) -> ok', () => {
  const r = run()
  assert.equal(r.resultado, 'ok', JSON.stringify(codes(r)))
})
t('correo en un subdominio de la web -> ok', () => {
  assert.equal(run({ company_email: 'rrhh@mail.acme.es' }).resultado, 'ok')
})
t('web en subdominio y correo en el dominio raíz -> ok', () => {
  assert.equal(run({ website_url: 'https://empleo.acme.es/inicio', company_email: 'info@acme.es' }).resultado, 'ok')
})
t('RFC mexicano con patrón propio -> ok', () => {
  const r = run({ country_code: 'MX', tax_id: 'ABC123456T12', company_email: 'rh@acme.com.mx', website_url: 'acme.com.mx' })
  assert.equal(r.resultado, 'ok', JSON.stringify(codes(r)))
})

for (const mail of ['acme@gmail.com', 'acme@hotmail.com', 'acme@outlook.com', 'acme@yahoo.es', 'acme@icloud.com', 'acme@proton.me', 'acme@hotmail.com.ar', 'acme@outlook.es']) {
  t(`correo gratuito ${mail} -> dudosa`, () => {
    const r = run({ company_email: mail })
    assert.equal(r.resultado, 'dudosa')
    assert.ok(codes(r).includes('free_email_with_website'), codes(r).join())
  })
}
t('correo gratuito sin web -> dudosa (y website_missing)', () => {
  const r = run({ company_email: 'acme@gmail.com', website_url: '' })
  assert.equal(r.resultado, 'dudosa')
  assert.ok(codes(r).includes('free_email_no_website') && codes(r).includes('website_missing'))
})
t('correo corporativo pero SIN web -> dudosa', () => {
  const r = run({ website_url: null })
  assert.equal(r.resultado, 'dudosa')
  assert.ok(codes(r).includes('website_missing'))
})
t('dominio del correo distinto al de la web -> dudosa', () => {
  const r = run({ company_email: 'rrhh@otraempresa.com' })
  assert.equal(r.resultado, 'dudosa')
  assert.ok(codes(r).includes('domain_mismatch'))
})
t('correo desechable -> dudosa', () => {
  assert.ok(codes(run({ company_email: 'x@mailinator.com' })).includes('email_disposable'))
})
t('web alojada en servicio compartido (github.io) -> dudosa', () => {
  const r = run({ website_url: 'https://acme.github.io', company_email: 'rrhh@acme.github.io' })
  assert.equal(r.resultado, 'dudosa')
})
t('dominio con xn-- (posible imitación) -> dudosa', () => {
  const r = run({ website_url: 'https://xn--acme-9ua.es', company_email: 'a@xn--acme-9ua.es' })
  assert.ok(codes(r).includes('domain_idn'))
})

// Duplicados
const other = (over) => ({ id: '22222222-2222-2222-2222-222222222222', company_name: 'Otra', tax_id: 'B99999999', country_code: 'ES', company_email: 'a@zzz.com', website_url: 'https://zzz.com', status: 'APPROVED', ...over })
t('mismo NIF en otra empresa APROBADA -> dudosa (duplicate_tax_id)', () => {
  const r = run({}, [other({ tax_id: 'A58818501' })])
  assert.equal(r.resultado, 'dudosa')
  assert.ok(codes(r).includes('duplicate_tax_id'))
})
t('mismo NIF con otro formato (a-588.185-01) -> dudosa', () => {
  assert.ok(codes(run({}, [other({ tax_id: 'a-588.185-01' })])).includes('duplicate_tax_id'))
})
t('mismo NIF con prefijo de país (ESA58818501) -> dudosa', () => {
  assert.ok(codes(run({}, [other({ tax_id: 'ESA58818501' })])).includes('duplicate_tax_id'))
})
t('mismo NIF en una empresa PENDING o REJECTED -> dudosa + duplicate_flagged', () => {
  assert.ok(codes(run({}, [other({ tax_id: 'A58818501', status: 'PENDING' })])).includes('duplicate_tax_id'))
  assert.ok(codes(run({}, [other({ tax_id: 'A58818501', status: 'REJECTED' })])).includes('duplicate_flagged'))
})
t('mismo correo -> dudosa', () => {
  assert.ok(codes(run({}, [other({ company_email: 'RRHH@acme.es' })])).includes('duplicate_email'))
})
t('mismo dominio (otro correo) -> dudosa', () => {
  assert.ok(codes(run({}, [other({ website_url: 'https://www.acme.es', company_email: 'x@acme.es' })])).includes('duplicate_domain'))
})
t('otras empresas sin relación -> sigue ok', () => {
  assert.equal(run({}, [other({}), other({ id: '33333333-3333-3333-3333-333333333333', tax_id: 'C12345674' })]).resultado, 'ok')
})
t('la propia empresa en la lista no cuenta como duplicado', () => {
  assert.equal(run({}, [other({ id: good.id, tax_id: 'A58818501' })]).resultado, 'ok')
})

// Países sin patrón propio
for (const cc of ['BR', 'EC', 'UY', 'PY', 'BO', 'VE', 'CR', 'PA', 'DO', 'GT', 'HN', 'SV', 'NI', 'CU', 'PR', 'GQ']) {
  t(`país ${cc} con patrón genérico -> dudosa (tax_id_generic_pattern)`, () => {
    assert.equal(hasOwnTaxPattern(cc), false)
    const r = run({ country_code: cc, tax_id: '1790012345001' }, [], new Set([cc]))
    assert.equal(r.resultado, 'dudosa')
    assert.ok(codes(r).includes('tax_id_generic_pattern'))
  })
}
t('país sin código -> dudosa', () => {
  assert.equal(run({ country_code: null }).resultado, 'dudosa')
})
t('país inactivo -> dudosa', () => {
  assert.ok(codes(run({}, [], new Set(['MX']))).includes('country_inactive'))
})

// Identificador
t('CIF con dígito de control erróneo -> dudosa', () => {
  assert.ok(codes(run({ tax_id: 'A58818502' })).includes('tax_id_format'))
})
t('NIF de relleno 12345678Z (control válido) -> dudosa', () => {
  assert.ok(codes(run({ tax_id: '12345678Z' })).includes('tax_id_placeholder'))
})
t('sin NIF -> dudosa', () => {
  assert.ok(codes(run({ tax_id: '' })).includes('tax_id_missing'))
})
t('checkTaxId ES acepta NIF y NIE válidos', () => {
  assert.deepEqual(checkTaxId('ES', '00000000T').map((x) => x.code), ['tax_id_placeholder'])
  assert.deepEqual(checkTaxId('ES', '12345678Z').map((x) => x.code), ['tax_id_placeholder'])
  assert.deepEqual(checkTaxId('ES', '45612378C').map((x) => x.code), [])
  assert.deepEqual(checkTaxId('ES', 'X2345678T').map((x) => x.code), [])
})
t('canonicalTaxId quita el prefijo de país', () => {
  assert.equal(canonicalTaxId('ES', 'ES-A58818501'), 'A58818501')
  assert.equal(canonicalTaxId('DE', 'DE 123456789'), '123456789')
})
t('isFreeEmailHost detecta variantes por país', () => {
  for (const h of ['gmail.com', 'hotmail.com.mx', 'yahoo.com.br', 'outlook.com.ar', 'live.com', 'icloud.com', 'proton.me']) assert.ok(isFreeEmailHost(h), h)
  assert.ok(!isFreeEmailHost('acme.es'))
})

// Sospechosas
t('palabras sospechosas -> dudosa', () => {
  assert.ok(codes(run({ description: 'Gana dinero fácil con nuestra pirámide' })).includes('suspicious_terms'))
})
t('nombre de prueba -> dudosa', () => {
  assert.ok(codes(run({ company_name: 'test' })).includes('suspicious_terms'))
})

// Invariante de seguridad: 'ok' solo si NO hay ningún warn
t('invariante: ok implica cero warn (barrido de variantes)', () => {
  const emails = ['a@acme.es', 'a@gmail.com', 'a@otra.com', '', 'no-es-correo', 'a@acme.es.evil.com']
  const webs = ['https://acme.es', '', 'acme.es', 'https://facebook.com/acme', 'http://1.2.3.4']
  const taxes = ['A58818501', '', 'B0', '12345678Z']
  const countries = ['ES', 'BR', null, 'ZZ']
  for (const company_email of emails) for (const website_url of webs) for (const tax_id of taxes) for (const country_code of countries) {
    const r = run({ company_email, website_url, tax_id, country_code }, [], new Set(['ES', 'BR', 'ZZ']))
    if (r.resultado === 'ok') {
      assert.equal(codes(r).length, 0)
      assert.equal(country_code, 'ES')
      assert.equal(tax_id, 'A58818501')
      assert.ok(/@(.+\.)?acme\.es$/.test(company_email) && /acme\.es/.test(website_url), `${company_email} ${website_url}`)
    }
  }
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
