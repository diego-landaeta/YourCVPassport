// Pruebas de extras.ts (reglas adicionales de moderación: salario, duplicado, categoría, enlaces).
//   node supabase/functions/moderate-job-posting/extras.test.mjs
// (Node >= 22.18 / 24 carga .ts directamente; si no: node --experimental-strip-types ...)
import assert from 'node:assert/strict'
import {
  salaryFindings, textFingerprint, fingerprintIsComparable, duplicateFinding, categoryFinding, categoriesInTitle,
  linkFinding, hostsIn, monthlyEquivalent, reviewJobExtras,
} from './extras.ts'

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
const sal = (o) => salaryFindings({ salary_currency: 'EUR', salary_period: 'MONTHLY', ...o })

// ---------------------------------------------------------------------------
// Salario
// ---------------------------------------------------------------------------
t('salario razonable (rango mensual, por horas, anual) -> sin hallazgos', () => {
  assert.deepEqual(sal({ salary_min: 1400, salary_max: 1800 }), [])
  assert.deepEqual(sal({ salary_min: 12, salary_max: 18, salary_period: 'HOURLY' }), [])
  assert.deepEqual(sal({ salary_min: 24000, salary_max: 30000, salary_period: 'YEARLY' }), [])
  assert.deepEqual(sal({ salary_min: 1800 }), [], 'solo mínimo')
  assert.deepEqual(sal({ salary_max: 2500 }), [], 'solo máximo')
  assert.deepEqual(salaryFindings({}), [], 'sin salario no hay nada que revisar')
  assert.deepEqual(salaryFindings({ salary_min: null, salary_max: null, salary_period: null }), [])
})
t('mínimo mayor que el máximo -> SALARIO_INCOHERENTE', () => {
  const f = sal({ salary_min: 3000, salary_max: 1000 })
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'SALARIO_INCOHERENTE')
  assert.ok(f[0].excerpt.includes('mínimo es mayor'))
})
t('mensual por debajo de 100 -> incoherente (también por horas y anual)', () => {
  assert.equal(sal({ salary_min: 50, salary_max: 90 }).length, 1)
  assert.equal(sal({ salary_min: 0.5, salary_max: 0.6, salary_period: 'HOURLY' }).length, 1, '0,6 €/h = 96 al mes')
  assert.equal(sal({ salary_min: 600, salary_max: 900, salary_period: 'YEARLY' }).length, 1, '900 al año = 75 al mes')
})
t('mensual por encima de 100.000 en moneda común -> incoherente', () => {
  assert.equal(sal({ salary_min: 150000, salary_max: 200000 }).length, 1)
  assert.equal(sal({ salary_min: 100, salary_max: 700, salary_period: 'HOURLY' }).length, 1, '700 €/h = 112.000 al mes')
  assert.equal(sal({ salary_min: 2000000, salary_max: 2500000, salary_period: 'YEARLY' }).length, 1)
  assert.equal(salaryFindings({ salary_min: 100000, salary_max: 100000, salary_period: 'MONTHLY', salary_currency: 'USD' }).length, 0, 'justo en el tope')
})
t('monedas de cifras altas (COP, CLP, ARS...) tienen un tope mayor', () => {
  assert.deepEqual(salaryFindings({ salary_min: 2500000, salary_max: 4000000, salary_period: 'MONTHLY', salary_currency: 'COP' }), [])
  assert.deepEqual(salaryFindings({ salary_min: 800000, salary_max: 1200000, salary_period: 'MONTHLY', salary_currency: 'CLP' }), [])
  assert.deepEqual(salaryFindings({ salary_min: 1500000, salary_max: 2200000, salary_period: 'MONTHLY', salary_currency: 'ars' }), [])
  assert.equal(salaryFindings({ salary_min: 500000000, salary_max: 600000000, salary_period: 'MONTHLY', salary_currency: 'COP' }).length, 1)
})
t('importe sin periodo -> incoherente (y no se evalúan los topes)', () => {
  const f = sal({ salary_min: 1500, salary_max: 1800, salary_period: null })
  assert.equal(f.length, 1)
  assert.ok(f[0].excerpt.includes('falta el periodo'))
  assert.equal(sal({ salary_min: 1500, salary_period: '' }).length, 1)
})
t('varios defectos a la vez van en UN solo hallazgo', () => {
  const f = sal({ salary_min: 3000, salary_max: 50 })
  assert.equal(f.length, 1)
  assert.ok(f[0].excerpt.includes('mínimo es mayor') && f[0].excerpt.includes('menos de 100'))
})
t('importe negativo o no numérico no revienta', () => {
  assert.equal(sal({ salary_min: -5, salary_max: 1000 }).length, 1)
  assert.deepEqual(sal({ salary_min: 'abc', salary_max: undefined }), [])
})
t('monthlyEquivalent', () => {
  assert.equal(monthlyEquivalent(10, 'HOURLY'), 1600)
  assert.equal(monthlyEquivalent(12000, 'YEARLY'), 1000)
  assert.equal(monthlyEquivalent(10, 'WEEKLY'), null)
})

// ---------------------------------------------------------------------------
// Texto duplicado
// ---------------------------------------------------------------------------
const DESC = 'Buscamos una persona para gestionar la facturación y los cierres mensuales de una empresa de servicios con sede en Madrid. Se valora experiencia previa.'
t('la huella ignora HTML, tildes, mayúsculas, signos y espacios', () => {
  const a = textFingerprint({ title: 'Contable Senior', description: DESC })
  const b = textFingerprint({ title: '  CONTABLE   senior!! ', description: `<p>${DESC.replace('facturación', 'facturacion').toUpperCase()}</p>` })
  assert.equal(a, b)
  assert.notEqual(a, textFingerprint({ title: 'Contable Senior', description: DESC + ' Incorporación inmediata.' }))
  assert.notEqual(a, textFingerprint({ title: 'Contable Junior', description: DESC }))
})
t('huellas muy cortas no se comparan', () => {
  assert.equal(fingerprintIsComparable(textFingerprint({ title: 'Camarero', description: 'Se busca camarero.' })), false)
  assert.equal(fingerprintIsComparable(textFingerprint({ title: 'Contable', description: DESC })), true)
})
t('duplicado de OTRA empresa -> hallazgo (sin datos de la otra oferta); de la misma empresa -> nada', () => {
  const mine = { id: 'a', company_id: 'c1', title: 'Contable', description: DESC }
  const r = duplicateFinding(mine, [{ id: 'b', company_id: 'c2', title: 'contable', description: `<b>${DESC}</b>` }])
  assert.equal(r.finding.code, 'TEXTO_DUPLICADO')
  assert.deepEqual(r.matches, ['b'])
  assert.ok(!JSON.stringify(r.finding).includes('"b"') && !r.finding.excerpt.includes('c2'))
  assert.equal(duplicateFinding(mine, [{ id: 'b', company_id: 'c1', title: 'contable', description: DESC }]).finding, null)
  assert.equal(duplicateFinding(mine, [{ id: 'a', company_id: 'c2', title: 'contable', description: DESC }]).finding, null, 'ella misma')
  assert.equal(duplicateFinding(mine, [{ id: 'b', company_id: 'c2', title: 'contable', description: DESC + ' Y algo más.' }]).finding, null)
  assert.equal(duplicateFinding({ ...mine, description: 'Corta' }, [{ id: 'b', company_id: 'c2', title: 'Contable', description: 'Corta' }]).finding, null)
})

// ---------------------------------------------------------------------------
// Título frente a categoría
// ---------------------------------------------------------------------------
t('título de enfermería con categoría Informática -> CATEGORIA_INCOHERENTE', () => {
  const f = categoryFinding({ title: 'Enfermera UCI turno de noche', category: 'IT_SOFTWARE' })
  assert.equal(f.code, 'CATEGORIA_INCOHERENTE')
  assert.ok(categoryFinding({ title: 'Software Developer', category: 'HOSPITALITY_TOURISM' }))
  assert.ok(categoryFinding({ title: 'Camarero/a de sala', category: 'LEGAL', category2: 'ACCOUNTING_FINANCE' }))
})
t('título coherente, de un grupo afín, sin palabras clave o con «Otros» -> sin hallazgo', () => {
  assert.equal(categoryFinding({ title: 'Enfermera UCI', category: 'HEALTH_MEDICINE' }), null)
  assert.equal(categoryFinding({ title: 'Enfermera escolar', category: 'EDUCATION_TRAINING', category2: 'HEALTH_MEDICINE' }), null, 'cualquiera de las dos categorías')
  assert.equal(categoryFinding({ title: 'Contable', category: 'ADMINISTRATION' }), null, 'mismo grupo (oficina)')
  assert.equal(categoryFinding({ title: 'Psicólogo clínico', category: 'HEALTH_MEDICINE' }), null, 'mismo grupo (salud)')
  assert.equal(categoryFinding({ title: 'Responsable de cuentas', category: 'SALES' }), null, 'sin palabra inequívoca')
  assert.equal(categoryFinding({ title: 'Enfermera', category: 'OTHER' }), null)
  assert.equal(categoryFinding({ title: 'Enfermera', category: null }), null)
  assert.equal(categoryFinding({ title: '', category: 'SALES' }), null)
})
t('categoriesInTitle: por inicio de palabra, sin tildes, es y en', () => {
  assert.deepEqual(categoriesInTitle('Programador/a Java'), ['IT_SOFTWARE'])
  assert.deepEqual(categoriesInTitle('Médico de familia'), ['HEALTH_MEDICINE'])
  assert.deepEqual(categoriesInTitle('Registered Nurse'), ['HEALTH_MEDICINE'])
  assert.deepEqual(categoriesInTitle('Administrativo/a'), [])
  assert.deepEqual(categoriesInTitle('Nursery assistant'), [], '«nursery» no es «nurse»')
})

// ---------------------------------------------------------------------------
// Enlaces sospechosos
// ---------------------------------------------------------------------------
const link = (description, extra = {}) => linkFinding({ title: 'Oferta', description, ...extra })
t('IP numérica, xn--, .zip y .top en el cuerpo -> ENLACE_SOSPECHOSO', () => {
  assert.equal(link('Solicítalo en http://203.0.113.9/form').code, 'ENLACE_SOSPECHOSO')
  assert.ok(link('Solicítalo en https://3405803977/form'), 'IP en decimal')
  assert.ok(link('Solicítalo en http://0xCB007109/form'), 'IP en hexadecimal')
  assert.ok(link('Solicítalo en http://[2001:db8::1]/form'), 'IPv6')
  assert.ok(link('Entra en https://xn--bnker-ira.com/empleo'), 'xn--')
  assert.ok(link('Entra en https://sub.xn--80ak6aa92e.com/'), 'xn-- en un subdominio')
  assert.ok(link('Descarga https://empresa.zip/oferta'), '.zip')
  assert.ok(link('Postula en https://empleo-rapido.top/inscripcion'), '.top')
  assert.ok(link('Más info en www.mi-empleo.top'), '.top sin esquema')
  assert.ok(link('Abre el archivo oferta.zip adjunto'), 'nombre de fichero .zip')
})
t('los enlaces dentro de <a href> y en application_url / instrucciones también cuentan', () => {
  assert.ok(link('<p>Más <a href="http://198.51.100.7/x">aquí</a></p>'))
  assert.ok(link('Texto limpio', { application_url: 'https://postula.top/form' }))
  assert.ok(link('Texto limpio', { application_instructions: 'Escribe a rrhh@empleo.top' }))
  assert.ok(link('Texto limpio', { requirements: ['Rellenar http://10.0.0.5/f'] }))
})
t('enlaces normales y números que parecen IP pero no lo son -> sin hallazgo', () => {
  assert.equal(link('Web: https://www.acme.es y https://empleo.acme.com/ofertas?id=3'), null)
  assert.equal(link('Escribe a rrhh@acme.es o a talento@acme.co.uk'), null)
  assert.equal(link('Sueldo 1.300 - 1.500 € brutos, versión 1.2.3.4 del convenio'), null, 'sin esquema, un número con puntos no es un enlace')
  assert.equal(link('Hay un topónimo: La Top Gun Academy y la zip code 28001'), null)
  assert.equal(link('', { application_url: 'https://www.acme.es/empleo' }), null)
})
t('hostsIn extrae hosts sin credenciales ni puerto', () => {
  assert.deepEqual(hostsIn('http://user:pw@acme.es:8080/x?y=1'), ['acme.es'])
})

// ---------------------------------------------------------------------------
// Conjunto
// ---------------------------------------------------------------------------
t('reviewJobExtras junta salario, categoría y enlaces; una oferta normal no marca nada', () => {
  const bad = reviewJobExtras({
    title: 'Enfermera', category: 'IT_SOFTWARE', description: 'Web http://203.0.113.9/', salary_min: 3000, salary_max: 1000, salary_period: 'MONTHLY', salary_currency: 'EUR',
  })
  assert.deepEqual(bad.map((f) => f.code).sort(), ['CATEGORIA_INCOHERENTE', 'ENLACE_SOSPECHOSO', 'SALARIO_INCOHERENTE'])
  assert.deepEqual(reviewJobExtras({
    title: 'Desarrollador/a backend', category: 'IT_SOFTWARE', description: 'Equipo de plataforma en https://www.acme.es', salary_min: 40000, salary_max: 55000, salary_period: 'YEARLY', salary_currency: 'EUR',
  }), [])
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
