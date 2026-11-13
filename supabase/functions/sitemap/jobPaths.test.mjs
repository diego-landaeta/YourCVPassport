// Pruebas de la URL canónica de ficha de oferta en el sitemap (edge `sitemap` y
// scripts/generate-sitemap.mjs) y de su paridad con jobUrl() de send-outbox/templates.ts.
//   node supabase/functions/sitemap/jobPaths.test.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { jobPaths, normalizeCountry } from './jobPaths.ts'
import { jobUrl } from '../send-outbox/templates.ts'

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

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..')
const SLUG = 'enfermera-uci-madrid-1a2b3c4d'

t('con country_code: /<cc>/ofertas/<slug> (es) y /<cc>/jobs/<slug> (en), cc en minúscula', () => {
  assert.deepEqual(jobPaths(SLUG, 'ES'), { cc: 'es', es: `/es/ofertas/${SLUG}`, en: `/es/jobs/${SLUG}` })
  assert.deepEqual(jobPaths(SLUG, 'mx'), { cc: 'mx', es: `/mx/ofertas/${SLUG}`, en: `/mx/jobs/${SLUG}` })
  assert.deepEqual(jobPaths(SLUG, ' Ar '), { cc: 'ar', es: `/ar/ofertas/${SLUG}`, en: `/ar/jobs/${SLUG}` })
})

t('sin country_code (o inválido): la alternativa /empleos/<slug> y /jobs/<slug>', () => {
  for (const cc of [undefined, null, '', '  ', 'ESP', 'E', '1', '../', 'e s', 42]) {
    assert.deepEqual(jobPaths(SLUG, cc), { cc: null, es: `/empleos/${SLUG}`, en: `/jobs/${SLUG}` }, String(cc))
  }
})

t('el slug se codifica (no puede romper la ruta ni el XML)', () => {
  const p = jobPaths('a b/<c>&"d', 'es')
  assert.ok(!/[ <>&"]/.test(p.es + p.en), p.es)
  assert.ok(p.es.startsWith('/es/ofertas/') && p.en.startsWith('/es/jobs/'))
})

t('normalizeCountry', () => {
  assert.equal(normalizeCountry('PE'), 'pe')
  assert.equal(normalizeCountry(''), null)
  assert.equal(normalizeCountry(null), null)
})

t('paridad con jobUrl() de send-outbox (la misma ruta en correos y sitemap)', () => {
  const BASE = 'https://yourcvpassport.com'
  for (const cc of ['ES', 'mx', undefined, '', 'ESP']) {
    const p = jobPaths(SLUG, cc)
    assert.equal(jobUrl('es', SLUG, cc), BASE + p.es, `es ${cc}`)
    assert.equal(jobUrl('en', SLUG, cc), BASE + p.en, `en ${cc}`)
  }
})

// scripts/generate-sitemap.mjs ejecuta la generación al importarlo: se extrae su función
// jobPaths() del código fuente y se compara con la del módulo.
t('scripts/generate-sitemap.mjs: su jobPaths() coincide con la del módulo y se usa para las fichas', () => {
  const src = readFileSync(join(ROOT, 'scripts', 'generate-sitemap.mjs'), 'utf8')
  const m = src.match(/function jobPaths\(slug, countryCode\) \{[\s\S]*?\r?\n\}\r?\n/)
  assert.ok(m, 'jobPaths() no está en el script')
  const fromScript = new Function(`${m[0]}; return jobPaths`)()
  for (const cc of ['ES', 'mx', ' Ar ', undefined, null, '', 'ESP', '../']) {
    const a = fromScript(SLUG, cc)
    const b = jobPaths(SLUG, cc)
    assert.deepEqual(a, { es: b.es, en: b.en }, String(cc))
  }
  assert.ok(/const pair = jobPaths\(job\.slug, job\.country_code\)/.test(src), 'las fichas deben salir de jobPaths(slug, country_code)')
  assert.ok(!/`\/empleos\/\$\{job\.slug\}`|`\/jobs\/\$\{job\.slug\}`/.test(src), 'no debe quedar la ruta antigua a pelo')
  assert.ok(/path: `\/\$\{cc\}\/empleos`/.test(src), 'el listado por país /<cc>/empleos no cambia')
})

t('edge sitemap: usa jobPaths() y mantiene el listado por país /<cc>/empleos', () => {
  const src = readFileSync(join(HERE, 'index.ts'), 'utf8')
  assert.ok(/import \{ jobPaths \} from '\.\/jobPaths\.ts'/.test(src))
  assert.ok(/jobPaths\(j\.slug, j\.country_code\)/.test(src))
  assert.ok(!/path: `\/empleos\/\$\{slug\}`|path: `\/jobs\/\$\{slug\}`/.test(src), 'no debe quedar la ruta antigua a pelo')
  assert.ok(/path: `\/\$\{cc\}\/empleos`/.test(src), 'el listado por país no cambia')
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
