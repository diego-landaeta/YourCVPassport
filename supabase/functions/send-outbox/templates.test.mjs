// Pruebas de templates.ts (correos de la cola). Sin dependencias:
//   node supabase/functions/send-outbox/templates.test.mjs
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { renderOutboxEmail, OUTBOX_KINDS, UnknownKindError, InvalidPayloadError, jobUrl } from './templates.ts'

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
const FN_DIR = join(HERE, '..')
const MIGRATIONS = join(FN_DIR, '..', 'migrations')

// Payloads de ejemplo con la forma EXACTA que encolan las migraciones / Edge Functions.
const samples = {
  company_review_flagged: { dedupe_key: 'k', company_id: 'c1', review_id: 'r1', resultado: 'dudosa', company_name: 'Acme', legal_name: 'Acme SL', tax_id: 'A58818501', country_code: 'ES', company_email: 'rrhh@acme.es', website_url: 'https://acme.es', motivos: ['Correo gratuito', 'Duplicado'] },
  job_manual_review: { job_id: 'j1', title: 'Contable', company_id: 'c1', company_name: 'Acme', reasons: ['CONTACTO_EXTERNO («whatsapp»)'] },
  job_reported: { job_id: 'j1', title: 'Contable', slug: 'contable-madrid-j1', reason: 'Parece una estafa', report_id: 'rep1' },
  company_verified: { dedupe_key: 'k', company_id: 'c1', company_name: 'Acme' },
  company_rejected: { company_name: 'Acme', reason: 'No se pudo verificar el CIF' },
  job_published: { job_id: 'j1', title: 'Contable', slug: 'contable-madrid-j1', company_name: 'Acme' },
  job_rejected: { job_id: 'j1', title: 'Contable', company_name: 'Acme', reason: 'Pide dinero al candidato' },
  job_expiring: { job_id: 'j1', title: 'Contable', slug: 'contable-madrid-j1', company_name: 'Acme', application_deadline: '2026-11-20T23:59:00Z' },
  job_expired: { job_id: 'j1', title: 'Contable', company_name: 'Acme' },
  application_received_company: { application_id: 'a1', job_posting_id: 'j1', job_title: 'Contable', company_id: 'c1', candidate_name: 'Lucía Pérez', match_score: 82, digest: false },
  application_received_candidate: { application_id: 'a1', job_posting_id: 'j1', job_title: 'Contable', company_name: 'Acme', candidate_name: 'Lucía Pérez' },
  application_status_candidate: { application_id: 'a1', job_posting_id: 'j1', job_title: 'Contable', company_name: 'Acme', candidate_name: 'Lucía Pérez', old_status: 'NEW', new_status: 'INTERVIEW' },
  application_message: { template: 'interview', job_title: 'Contable', company_name: 'Acme', job_slug: 'contable-madrid-j1', application_id: 'a1' },
  legal_version_notice: { dedupe_key: 'k', tipo: 'terminos_candidato', version: '2.0', titulo: 'Condiciones generales para candidatos', vigente_desde: '2026-11-20T00:00:00Z', url_path: '/terminos' },
  job_alert: { profile_id: 'p1', frequency: 'DAILY', total: 12, jobs: [{ id: 'j1', title: 'Contable', slug: 's', company_name: 'Acme', country: 'ES', published_at: '2026-10-29' }, { id: 'j2', title: 'Analista', slug: 's2', company_name: 'Globex', country: 'MX', published_at: '2026-10-29' }], period_from: 'x', period_to: 'y' },
}
const INTERNAL = new Set(['company_review_flagged', 'job_manual_review', 'job_reported'])

t('hay un ejemplo y una plantilla por cada kind declarado', () => {
  assert.deepEqual(Object.keys(samples).sort(), [...OUTBOX_KINDS].sort())
})

t('los kind que encolan las migraciones y las Edge Functions están TODOS cubiertos', () => {
  const found = new Set()
  // Migraciones 20261029-20261034 (la 20261033 encola legal_version_notice; la 20261034 solo programa).
  const files = readdirSync(MIGRATIONS).filter((f) => /^2026102[9]|^2026103[0-4]/.test(f))
  assert.ok(files.length >= 3, `migraciones encontradas: ${files.join(',')}`)
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS, f), 'utf8')
    for (const m of sql.matchAll(/(?:_outbox_enqueue|jobs_enqueue_email)\(\s*'([a-z_]+)'/g)) found.add(m[1])
    // INSERT directo en la cola: insert into [public.]email_outbox (...) values|select ('kind', ...
    for (const m of sql.matchAll(/insert\s+into\s+(?:public\.)?email_outbox\s*\([^)]*\)\s*(?:values\s*\(|select\s+\(?)\s*'([a-z_]+)'/gi)) found.add(m[1])
  }
  // La migración 20261033 (avisos de versión legal) debe encolar legal_version_notice.
  const f33 = files.find((f) => f.startsWith('20261033'))
  if (f33) {
    const sql33 = readFileSync(join(MIGRATIONS, f33), 'utf8')
    for (const m of sql33.matchAll(/'(legal_version_notice)'/g)) found.add(m[1])
    assert.ok(found.has('legal_version_notice'), '20261033 debe encolar legal_version_notice')
  } else {
    console.log('     (aviso: no existe aún 20261033_*.sql; el kind legal_version_notice no se contrasta con SQL)')
  }
  for (const f of ['company-review-ai/index.ts', 'moderate-job-posting/index.ts', 'expire-job-postings/index.ts']) {
    const ts = readFileSync(join(FN_DIR, f), 'utf8')
    for (const m of ts.matchAll(/kind:\s*'([a-z_]+)'/g)) found.add(m[1])
  }
  assert.ok(found.size >= 12, `kinds encontrados: ${[...found].join(',')}`)
  const missing = [...found].filter((k) => !OUTBOX_KINDS.includes(k))
  assert.deepEqual(missing, [], `kinds sin plantilla: ${missing.join(',')}`)
  console.log(`     (kinds encolados por el código: ${[...found].sort().join(', ')})`)
})

for (const kind of OUTBOX_KINDS) {
  for (const lang of ['es', 'en']) {
    t(`${kind} [${lang}]: asunto, html y texto no vacíos`, () => {
      const r = renderOutboxEmail(kind, samples[kind], lang)
      assert.ok(r.subject.trim().length > 3, 'asunto vacío')
      assert.ok(r.html.includes('<html') && r.html.length > 1500, 'html vacío')
      assert.ok(r.text.trim().length > 80, 'texto vacío')
      assert.ok(!/[\r\n]/.test(r.subject), 'asunto con saltos de línea')
      assert.ok(!/undefined|\[object Object\]|NaN/.test(r.html + r.text + r.subject), 'valor sin rellenar')
    })
  }
}

t('es y en son textos distintos (todas las claves traducidas) y el idioma fijo del pie sigue al idioma', () => {
  for (const kind of OUTBOX_KINDS) {
    const es = renderOutboxEmail(kind, samples[kind], 'es')
    const en = renderOutboxEmail(kind, samples[kind], 'en')
    if (INTERNAL.has(kind)) {
      assert.equal(en.subject, es.subject, `${kind}: interno, siempre en español`)
      assert.ok(es.text.includes('Un saludo') || es.text.includes('Aviso interno'))
      continue
    }
    assert.notEqual(en.subject, es.subject, `${kind}: asunto igual en es y en`)
    assert.ok(en.html.includes('lang="en"') && es.html.includes('lang="es"'), `${kind}: atributo lang`)
    assert.ok(/Kind regards/.test(en.text) && /Automated message/.test(en.text), `${kind}: pie en inglés`)
    assert.ok(/Un saludo/.test(es.text) && /Mensaje automático/.test(es.text), `${kind}: pie en español`)
    // Nada de castellano fijo en el correo inglés
    assert.ok(!/(Hola|Un saludo|Ayuda|Privacidad|Términos|Mensaje automático|Ver |Ir a |candidatura)/.test(en.text), `${kind}: texto español en el correo en inglés:\n${en.text}`)
    assert.ok(!/(Kind regards|Hello|Hi |View |Privacy)/.test(es.text), `${kind}: texto inglés en el correo en español`)
  }
})

t('lang desconocido o vacío cae a español; en-GB / EN cae a inglés', () => {
  assert.ok(/Un saludo/.test(renderOutboxEmail('job_expired', samples.job_expired, 'fr').text))
  assert.ok(/Un saludo/.test(renderOutboxEmail('job_expired', samples.job_expired, null).text))
  assert.ok(/Kind regards/.test(renderOutboxEmail('job_expired', samples.job_expired, 'en-GB').text))
  assert.ok(/Kind regards/.test(renderOutboxEmail('job_expired', samples.job_expired, 'EN').text))
})

// Escape de HTML: nombres y títulos hostiles en TODOS los campos de texto
const EVIL = '<script>alert(1)</script><img src=x onerror=alert(2)>"\'&'
function evilize(v) {
  if (typeof v === 'string') return EVIL
  if (Array.isArray(v)) return v.map(evilize)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, evilize(x)]))
  return v
}
for (const kind of OUTBOX_KINDS) {
  t(`${kind}: escapa HTML en nombres, títulos, motivos y listas`, () => {
    const base = samples[kind]
    // se conservan los campos de control para que no falle la validación
    const evil = evilize(base)
    if (kind === 'application_message') evil.template = 'rejected'
    if (kind === 'application_status_candidate') evil.new_status = 'SHORTLISTED'
    if (kind === 'job_alert') evil.frequency = 'DAILY'
    for (const lang of ['es', 'en']) {
      const r = renderOutboxEmail(kind, evil, lang)
      assert.ok(!r.html.includes('<script>'), 'script sin escapar')
      assert.ok(!r.html.includes('<img src=x'), 'img sin escapar')
      assert.ok(r.html.includes('&lt;script&gt;'), 'el texto debe aparecer escapado')
      assert.ok(!/[\r\n]/.test(r.subject))
    }
  })
}

t('URLs: un slug hostil no puede inyectar esquemas ni comillas', () => {
  const r = renderOutboxEmail('job_published', { ...samples.job_published, slug: 'x"><script>alert(1)</script>javascript:alert(1)' }, 'es')
  assert.ok(!r.html.includes('<script>'))
  assert.ok(!/href="javascript:/i.test(r.html))
  assert.ok(/href="https:\/\/yourcvpassport\.com\/empleos\/[A-Za-z0-9._~-]*"/.test(r.html))
})

t('URL de la ficha: /<cc>/ofertas/<slug> (es) y /<cc>/jobs/<slug> (en), cc en minúscula; sin país, la alternativa', () => {
  assert.equal(jobUrl('es', 'enfermera-uci-madrid-1a2b3c4d', 'ES'), 'https://yourcvpassport.com/es/ofertas/enfermera-uci-madrid-1a2b3c4d')
  assert.equal(jobUrl('en', 'nurse-madrid-1a2b3c4d', 'mx'), 'https://yourcvpassport.com/mx/jobs/nurse-madrid-1a2b3c4d')
  assert.equal(jobUrl('es', 'x', undefined), 'https://yourcvpassport.com/empleos/x')
  assert.equal(jobUrl('en', 'x', ''), 'https://yourcvpassport.com/jobs/x')
  assert.equal(jobUrl('es', 'x', 'ESP'), 'https://yourcvpassport.com/empleos/x', 'cc de 3 letras no vale')
  assert.equal(jobUrl('es', 'x', '../'), 'https://yourcvpassport.com/empleos/x', 'cc hostil no vale')
  assert.equal(jobUrl('es', '', 'ES'), 'https://yourcvpassport.com/empleos', 'sin slug, el listado general')
})

t('job_published y job_reported usan la URL canónica cuando el payload trae country_code', () => {
  const a = renderOutboxEmail('job_published', { ...samples.job_published, country_code: 'ES' }, 'es')
  assert.ok(a.html.includes('href="https://yourcvpassport.com/es/ofertas/contable-madrid-j1"'))
  const b = renderOutboxEmail('job_published', { ...samples.job_published, country_code: 'MX' }, 'en')
  assert.ok(b.html.includes('href="https://yourcvpassport.com/mx/jobs/contable-madrid-j1"'))
  const c = renderOutboxEmail('job_reported', { ...samples.job_reported, country_code: 'AR' }, 'es')
  assert.ok(c.html.includes('href="https://yourcvpassport.com/ar/ofertas/contable-madrid-j1"'))
  const d = renderOutboxEmail('job_published', { ...samples.job_published, country_code: '"><x' }, 'es')
  assert.ok(d.html.includes('/empleos/contable-madrid-j1') && !d.html.includes('"><x'))
})

t('legal_version_notice: asunto, documento, versión, fecha y enlace según tipo, en es y en', () => {
  const es = renderOutboxEmail('legal_version_notice', samples.legal_version_notice, 'es')
  assert.ok(es.subject.includes('20 de noviembre de 2026') && es.subject.startsWith('Actualizamos'), es.subject)
  assert.ok(es.text.includes('Condiciones generales para candidatos') && es.text.includes('2.0') && es.text.includes('20 de noviembre de 2026'))
  assert.ok(es.html.includes('href="https://yourcvpassport.com/terminos"'))
  const en = renderOutboxEmail('legal_version_notice', samples.legal_version_notice, 'en')
  assert.ok(en.subject.includes('20 November 2026') && en.subject.startsWith('We are updating'), en.subject)
  assert.ok(en.text.includes('Takes effect: 20 November 2026'))
  const emp = renderOutboxEmail('legal_version_notice', { ...samples.legal_version_notice, tipo: 'terminos_empleador', url_path: undefined }, 'es')
  assert.ok(emp.html.includes('href="https://yourcvpassport.com/terminos"') && emp.subject.includes('para empresas'), emp.subject)
  const priv = renderOutboxEmail('legal_version_notice', { ...samples.legal_version_notice, tipo: 'privacidad', url_path: undefined, titulo: '' }, 'es')
  assert.ok(priv.html.includes('href="https://yourcvpassport.com/privacidad"'))
  assert.ok(priv.subject.includes('la política de privacidad'), priv.subject)
  assert.ok(priv.text.includes('«política de privacidad»'), 'sin titulo, usa el nombre del tipo')
})

t('legal_version_notice: el enlace solo puede ser /terminos o /privacidad (url_path hostil o ajeno se ignora)', () => {
  for (const bad of ['https://evil.example/x', 'javascript:alert(1)', '//evil.example', '/admin', '/terminos/../admin', '"><script>']) {
    const r = renderOutboxEmail('legal_version_notice', { ...samples.legal_version_notice, tipo: 'privacidad', url_path: bad }, 'es')
    assert.ok(r.html.includes('href="https://yourcvpassport.com/privacidad"'), bad)
    assert.ok(!/evil\.example|javascript:|<script>/.test(r.html), bad)
  }
  const ok = renderOutboxEmail('legal_version_notice', { ...samples.legal_version_notice, tipo: 'terminos_candidato', url_path: '/privacidad' }, 'es')
  assert.ok(ok.html.includes('href="https://yourcvpassport.com/privacidad"'), 'un url_path permitido manda sobre el tipo')
})

t('legal_version_notice: fecha ausente o inválida no rompe ni deja «undefined»; tipo desconocido cae a un texto genérico', () => {
  for (const vigente_desde of [undefined, null, '', 'no-es-fecha']) {
    for (const lang of ['es', 'en']) {
      const r = renderOutboxEmail('legal_version_notice', { ...samples.legal_version_notice, vigente_desde }, lang)
      assert.ok(!/undefined|NaN|Invalid Date/.test(r.subject + r.html + r.text))
    }
  }
  const r = renderOutboxEmail('legal_version_notice', { tipo: 'inventado', version: '1' }, 'es')
  assert.ok(r.subject.includes('nuestras condiciones legales'), r.subject)
  assert.ok(r.html.includes('https://yourcvpassport.com/terminos"'))
})

t('sin datos sensibles innecesarios: correos, teléfonos, claves e ids internos no salen', () => {
  const leak = {
    to_email: 'secreto@privado.com', candidate_email: 'candidato@privado.com', email: 'x@privado.com',
    phone: '+34600111222', telefono: '600111222', password: 'hunter2', token: 'tok_abc123', dedupe_key: 'DEDUPE-KEY-XYZ',
    profile_id: 'PROFILE-ID-123', application_id: 'APPLICATION-ID-456', job_posting_id: 'JOBPOST-ID-789', company_id: 'COMPANY-ID-000',
    cv_url: 'https://cv.example/secret.pdf', internal_notes: 'NOTA-INTERNA',
  }
  for (const kind of OUTBOX_KINDS) {
    if (INTERNAL.has(kind)) continue
    const r = renderOutboxEmail(kind, { ...samples[kind], ...leak }, 'es')
    const all = r.subject + r.html + r.text
    for (const needle of ['secreto@privado.com', 'candidato@privado.com', 'x@privado.com', '600111222', 'hunter2', 'tok_abc123', 'DEDUPE-KEY-XYZ', 'PROFILE-ID-123', 'APPLICATION-ID-456', 'JOBPOST-ID-789', 'COMPANY-ID-000', 'secret.pdf', 'NOTA-INTERNA']) {
      assert.ok(!all.includes(needle), `${kind} filtra ${needle}`)
    }
  }
})

t('el correo al candidato no incluye el correo de la empresa ni el de contacto; el de la empresa no incluye email/teléfono del candidato', () => {
  const r = renderOutboxEmail('application_received_company', { ...samples.application_received_company, candidate_email: 'c@x.com', candidate_phone: '600000001' }, 'es')
  assert.ok(!/c@x\.com|600000001/.test(r.html + r.text))
})

t('el único contacto que aparece es support@yourcvpassport.com', () => {
  for (const kind of OUTBOX_KINDS) {
    const r = renderOutboxEmail(kind, samples[kind], 'es')
    const emails = new Set((r.html + r.text).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [])
    for (const e of emails) {
      if (kind === 'company_review_flagged' && e === 'rrhh@acme.es') continue // aviso interno a support: datos de la empresa a revisar
      assert.equal(e, 'support@yourcvpassport.com', `${kind}: ${e}`)
    }
    assert.ok(!/info@yourcvpassport/.test(r.html + r.text), 'info@ no se usa')
  }
})

t('application_status_candidate: cada estado tiene mensaje propio y uno desconocido no rompe', () => {
  const subjects = new Set()
  for (const s of ['SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED', 'OTRO']) {
    for (const lang of ['es', 'en']) {
      const r = renderOutboxEmail('application_status_candidate', { ...samples.application_status_candidate, new_status: s }, lang)
      subjects.add(`${lang}:${r.subject}`)
    }
  }
  assert.equal(subjects.size, 10)
})

t('application_message: «rejected» y «interview» en es y en, y una plantilla rara se rechaza', () => {
  const seen = new Set()
  for (const tpl of ['rejected', 'interview']) for (const lang of ['es', 'en']) {
    seen.add(renderOutboxEmail('application_message', { ...samples.application_message, template: tpl }, lang).subject)
  }
  assert.equal(seen.size, 4)
  assert.throws(() => renderOutboxEmail('application_message', { ...samples.application_message, template: 'hired' }, 'es'), InvalidPayloadError)
})

t('errores permanentes: kind desconocido, datos imprescindibles ausentes, alerta vacía', () => {
  assert.throws(() => renderOutboxEmail('kind_inventado', {}, 'es'), UnknownKindError)
  assert.throws(() => renderOutboxEmail('job_published', { slug: 'x' }, 'es'), InvalidPayloadError)
  assert.throws(() => renderOutboxEmail('job_alert', { jobs: [] }, 'es'), InvalidPayloadError)
  assert.throws(() => renderOutboxEmail('company_verified', null, 'es'), InvalidPayloadError)
})

t('motivos: aviso a support con motivo como texto suelto o como lista (las dos formas que encola SQL)', () => {
  const a = renderOutboxEmail('job_manual_review', { ...samples.job_manual_review, reasons: 'CONTACTO_EXTERNO' }, 'es')
  const b = renderOutboxEmail('job_manual_review', { ...samples.job_manual_review, reasons: ['A', 'B'] }, 'es')
  const c = renderOutboxEmail('job_manual_review', { ...samples.job_manual_review, reasons: '' }, 'es')
  assert.ok(a.text.includes('CONTACTO_EXTERNO') && b.text.includes('A') && c.html.length > 1000)
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
