// Plantillas es/en de los correos que encolan las migraciones en `email_outbox`
// (20261029-20261032 y las Edge Functions company-review-ai / moderate-job-posting).
//
// Módulo PURO (sin Deno ni red): se puede probar con Node (templates.test.mjs).
// El diseño es el de _shared/emailLayout.ts (el mismo de todos los correos de la
// plataforma). Los datos del payload entran en crudo y el layout los ESCAPA; aquí solo se
// recortan y se limpian caracteres de control.
//
// Un `kind` por cada plantilla (lista completa en OUTBOX_KINDS; la prueba
// templates.test.mjs la compara con las migraciones):
//
//   Destinatario: support@yourcvpassport.com (avisos internos, siempre en español)
//     company_review_flagged      company-review-ai: empresa dudosa o con error
//     job_manual_review           moderar_oferta / _job_submit / moderate-job-posting
//     job_reported                denuncia de una oferta
//   Destinatario: la empresa (idioma de la empresa)
//     company_verified            company-review-ai: empresa verificada
//     company_rejected            (reservado) rechazo de una empresa
//     job_published               oferta publicada
//     job_rejected                oferta rechazada
//     job_expiring                faltan 3 días para el cierre
//     job_expired                 oferta cerrada por fecha
//     application_received_company  nueva candidatura (aviso individual: solo frecuencia inmediata)
//     application_digest              resumen diario de candidaturas nuevas (queue_application_digests)
//                                     (payload: job_title, company_name, total, date, panel_path y
//                                     candidates [{name, date, affinity}] SIN correo del candidato)
//   Destinatario: el candidato (idioma del perfil)
//     application_received_candidate  candidatura enviada
//     application_status_candidate    cambio de estado
//     application_message             plantilla «Descartado» / «Te llamamos» de la empresa
//     job_alert                       alertas de ofertas nuevas (payload: frequency, total, unsubscribe_token y
//                                     jobs [{title, slug, country_code, company_name}], máx. 8)
//     legal_version_notice            aviso de una nueva versión de términos / privacidad
//                                     (payload: tipo, version, titulo, vigente_desde; el enlace lo decide el
//                                     tipo: terminos_candidato / terminos_empleador / condiciones_publicacion
//                                     -> /terminos, privacidad -> /privacidad, cookies -> /politica-de-cookies)
//
// URL de la ficha de una oferta (misma regla que jobPath() de lib/jobsFormat.ts):
//   con country_code   -> /<cc>/ofertas/<slug> (es) y /<cc>/jobs/<slug> (en), cc en minúscula
//   sin country_code   -> /empleos/<slug> (es) y /jobs/<slug> (en), solo como alternativa
// El payload puede traer `country_code` (o `country`); si no, sale la alternativa.

import { BRAND, renderEmail, type Block, type EmailContent, type EmailLang } from '../_shared/emailLayout.ts'

export interface Rendered {
  subject: string
  html: string
  text: string
}

export class UnknownKindError extends Error {
  constructor(kind: string) {
    super(`UNKNOWN_KIND: ${kind}`)
    this.name = 'UnknownKindError'
  }
}

export class InvalidPayloadError extends Error {
  constructor(detail: string) {
    super(`INVALID_PAYLOAD: ${detail}`)
    this.name = 'InvalidPayloadError'
  }
}

export const OUTBOX_KINDS = [
  'company_review_flagged',
  'job_manual_review',
  'job_reported',
  'company_verified',
  'company_rejected',
  'job_published',
  'job_rejected',
  'job_expiring',
  'job_expired',
  'application_received_company',
  'application_digest',
  'application_received_candidate',
  'application_status_candidate',
  'application_message',
  'job_alert',
  'legal_version_notice',
] as const
export type OutboxKind = (typeof OUTBOX_KINDS)[number]

/** Avisos internos: salen siempre en español. */
const INTERNAL_KINDS = new Set<string>(['company_review_flagged', 'job_manual_review', 'job_reported'])

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

type Payload = Record<string, unknown>

/** Texto limpio: sin caracteres de control, recortado. */
function str(value: unknown, max = 200): string {
  const s = String(value ?? '')
    // deno-lint-ignore no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s
}

/** Lista de textos (acepta un texto suelto). */
function strList(value: unknown, maxItems = 10, maxLen = 300): string[] {
  const arr = Array.isArray(value) ? value : value == null || value === '' ? [] : [value]
  return arr.map((v) => str(v, maxLen)).filter(Boolean).slice(0, maxItems)
}

export function normalizeLang(raw: unknown): EmailLang {
  return String(raw ?? '').trim().toLowerCase().slice(0, 2) === 'en' ? 'en' : 'es'
}

/** Saludo con nombre si lo hay. */
function hello(lang: EmailLang, name: string): string {
  if (lang === 'en') return name ? `Hi ${name},` : 'Hello,'
  return name ? `Hola, ${name}:` : 'Hola:'
}

function build(lang: EmailLang, subject: string, content: EmailContent): Rendered {
  return { subject: subject.replace(/[\r\n]+/g, ' ').trim(), ...renderEmail({ ...content, lang }) }
}

/**
 * Enlace público a una oferta. URL canónica /<cc>/ofertas/<slug> (es) o /<cc>/jobs/<slug>
 * (en), con `cc` (country_code de la oferta) en minúscula; sin código de país válido sale
 * la alternativa /empleos/<slug> o /jobs/<slug>. Sin slug, el listado general (sin cambios).
 */
export function jobUrl(lang: EmailLang, slug: string, countryCode?: unknown): string {
  const s = slug.replace(/[^A-Za-z0-9._~-]/g, '')
  if (!s) return `${BRAND.url}/${lang === 'en' ? 'jobs' : 'empleos'}`
  const cc = String(countryCode ?? '').trim().toLowerCase()
  if (/^[a-z]{2}$/.test(cc)) return `${BRAND.url}/${cc}/${lang === 'en' ? 'jobs' : 'ofertas'}/${s}`
  return `${BRAND.url}/${lang === 'en' ? 'jobs' : 'empleos'}/${s}`
}

/** País de la oferta en el payload (country_code o country), o ''. */
const countryOf = (p: Payload): string => str(p.country_code ?? p.country, 4)

function dateText(lang: EmailLang, iso: unknown): string {
  const d = new Date(String(iso ?? ''))
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

const need = (value: string, field: string): string => {
  if (!value) throw new InvalidPayloadError(`falta ${field}`)
  return value
}

// ---------------------------------------------------------------------------
// Plantillas
// ---------------------------------------------------------------------------

type Renderer = (p: Payload, lang: EmailLang) => Rendered

const R: Record<OutboxKind, Renderer> = {
  // ------------------------- avisos internos (support@) ---------------------
  company_review_flagged: (p) => {
    const name = str(p.company_name, 150) || 'Empresa'
    const resultado = str(p.resultado, 20)
    const motivos = strList(p.motivos, 12, 300)
    // Referencias de AMBAS empresas: solo en este aviso interno (nunca en la respuesta al cliente).
    const dups = (Array.isArray(p.duplicates) ? (p.duplicates as Payload[]) : []).slice(0, 10).map((d) => {
      const names: Record<string, string> = { tax_id: 'NIF', email: 'correo', domain: 'dominio' }
      const by = strList(d?.matches, 4, 20).map((m) => names[m] ?? m).join(', ')
      return `${str(d?.company_name, 100) || 'Empresa'} (ref. ${str(d?.id, 60)}, ${str(d?.status, 20) || '?'})${by ? `: coincide en ${by}` : ''}`
    })
    return build('es', `[Revisión] Empresa pendiente de revisión manual: ${name}`, {
      preheader: `La revisión automática de ${name} no pudo aprobarla (${resultado || 'dudosa'}).`,
      eyebrow: 'Aviso interno',
      heading: 'Empresa para revisar a mano',
      intro: 'La revisión automática no la ha aprobado.',
      hero: 'dark',
      greeting: 'Hola:',
      blocks: [
        { type: 'p', text: `La empresa ${name} sigue pendiente (resultado: ${resultado || 'dudosa'}). Revisa los motivos y decide en el panel de administración.` },
        { type: 'details', title: 'Datos registrados', rows: [
          ['Empresa', name],
          ['Referencia', str(p.company_id, 60)],
          ['Razón social', str(p.legal_name, 150)],
          ['Identificador fiscal', str(p.tax_id, 40)],
          ['País', str(p.country_code, 4)],
          ['Correo', str(p.company_email, 200)],
          ['Web', str(p.website_url, 200)],
        ] },
        ...(motivos.length ? [{ type: 'checks', title: 'Motivos', items: motivos } as Block] : []),
        ...(dups.length ? [{ type: 'checks', title: 'Coincide con otras empresas (solo para soporte)', items: dups } as Block] : []),
        { type: 'button', label: 'Abrir el panel de administración', url: `${BRAND.url}/admin`, fallback: false },
      ],
      signoff: false,
      footerReason: 'Aviso interno generado por la revisión automática de empresas.',
    })
  },

  job_manual_review: (p) => {
    const title = str(p.title, 150) || 'Oferta'
    const reasons = strList(p.reasons, 12, 400)
    return build('es', `[Revisión] Oferta en revisión manual: ${title}`, {
      preheader: `La oferta «${title}» necesita revisión manual.`,
      eyebrow: 'Aviso interno',
      heading: 'Oferta para revisar a mano',
      intro: 'No se ha podido publicar automáticamente.',
      hero: 'dark',
      greeting: 'Hola:',
      blocks: [
        { type: 'p', text: `La oferta «${title}» de ${str(p.company_name, 150) || 'una empresa'} está en revisión manual. Decide en el panel de administración (Ofertas).` },
        { type: 'details', title: 'Oferta', rows: [['Título', title], ['Empresa', str(p.company_name, 150)], ['Identificador', str(p.job_id, 60)]] },
        ...(reasons.length ? [{ type: 'checks', title: 'Motivos', items: reasons } as Block] : []),
        { type: 'button', label: 'Abrir el panel de administración', url: `${BRAND.url}/admin`, fallback: false },
      ],
      signoff: false,
      footerReason: 'Aviso interno de la moderación de ofertas.',
    })
  },

  job_reported: (p) => {
    const title = str(p.title, 150) || 'Oferta'
    return build('es', `[Denuncia] Oferta denunciada: ${title}`, {
      preheader: `Alguien ha denunciado la oferta «${title}».`,
      eyebrow: 'Aviso interno',
      heading: 'Oferta denunciada',
      intro: 'Una persona ha marcado esta oferta como problemática.',
      hero: 'dark',
      greeting: 'Hola:',
      blocks: [
        { type: 'details', title: 'Denuncia', rows: [
          ['Oferta', title],
          ['Motivo', str(p.reason, 400)],
          ['Identificador', str(p.job_id, 60)],
          ['Denuncia', str(p.report_id, 60)],
        ] },
        { type: 'button', label: 'Ver la oferta', url: jobUrl('es', str(p.slug, 200), countryOf(p)), fallback: false },
      ],
      signoff: false,
      footerReason: 'Aviso interno de denuncias de ofertas.',
    })
  },

  // ------------------------------ empresa -----------------------------------
  company_verified: (p, lang) => {
    const name = need(str(p.company_name, 150), 'company_name')
    return build(lang, lang === 'en' ? `${name} is now verified on YourCVPassport` : `${name} ya está verificada en YourCVPassport`, {
      preheader: lang === 'en' ? 'Your company is verified. You can now publish job postings.' : 'Tu empresa está verificada. Ya puedes publicar ofertas.',
      eyebrow: lang === 'en' ? 'Company verified' : 'Empresa verificada',
      heading: lang === 'en' ? 'Your company is verified' : 'Tu empresa está verificada',
      intro: lang === 'en' ? 'You can now publish job postings and receive applications.' : 'Ya puedes publicar ofertas y recibir candidaturas.',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `We have checked the registration of ${name} and it is verified. Publishing job postings is free.`
          : `Hemos revisado el registro de ${name} y está verificado. Publicar ofertas es gratis.` },
        { type: 'steps', title: lang === 'en' ? 'Next steps' : 'Siguientes pasos', items: lang === 'en'
          ? ['Create your first job posting', 'Send it for review', 'Receive and manage applications']
          : ['Crea tu primera oferta', 'Envíala a revisión', 'Recibe y gestiona las candidaturas'] },
        { type: 'button', label: lang === 'en' ? 'Go to my job postings' : 'Ir a mis ofertas', url: `${BRAND.url}/company/jobs` },
      ],
      footerReason: lang === 'en' ? `You are receiving this email because ${name} was registered on YourCVPassport.` : `Recibes este correo porque se registró ${name} en YourCVPassport.`,
    })
  },

  company_rejected: (p, lang) => {
    const name = need(str(p.company_name, 150), 'company_name')
    const reason = str(p.reason, 500)
    return build(lang, lang === 'en' ? `About the registration of ${name}` : `Sobre el registro de ${name}`, {
      preheader: lang === 'en' ? 'We could not verify your company registration.' : 'No hemos podido verificar el registro de tu empresa.',
      eyebrow: lang === 'en' ? 'Registration update' : 'Estado del registro',
      heading: lang === 'en' ? 'We could not verify your company' : 'No hemos podido verificar tu empresa',
      hero: 'dark',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `We reviewed the registration of ${name} and could not approve it for now.`
          : `Hemos revisado el registro de ${name} y por ahora no hemos podido aprobarlo.` },
        ...(reason ? [{ type: 'note', tone: 'warning', title: lang === 'en' ? 'Reason' : 'Motivo', text: reason } as Block] : []),
        { type: 'p', text: lang === 'en'
          ? `If you think this is a mistake, write to us at ${BRAND.supportEmail}.`
          : `Si crees que es un error, escríbenos a ${BRAND.supportEmail}.` },
      ],
      footerReason: lang === 'en' ? `You are receiving this email because ${name} was registered on YourCVPassport.` : `Recibes este correo porque se registró ${name} en YourCVPassport.`,
    })
  },

  job_published: (p, lang) => {
    const title = need(str(p.title, 150), 'title')
    const company = str(p.company_name, 150)
    const url = jobUrl(lang, str(p.slug, 200), countryOf(p))
    return build(lang, lang === 'en' ? `Your job posting is live: ${title}` : `Tu oferta ya está publicada: ${title}`, {
      preheader: lang === 'en' ? `“${title}” is now visible to candidates.` : `«${title}» ya es visible para los candidatos.`,
      eyebrow: lang === 'en' ? 'Job posting published' : 'Oferta publicada',
      heading: lang === 'en' ? 'Your job posting is live' : 'Tu oferta ya está publicada',
      intro: lang === 'en' ? 'Candidates can now see it and apply.' : 'Los candidatos ya pueden verla e inscribirse.',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `“${title}”${company ? ` (${company})` : ''} passed the review and is now published.`
          : `«${title}»${company ? ` (${company})` : ''} ha superado la revisión y ya está publicada.` },
        { type: 'button', label: lang === 'en' ? 'See the job posting' : 'Ver la oferta', url },
        { type: 'small', text: lang === 'en'
          ? 'You will get notices about new applications according to the frequency you chose for this job posting (right away or as a daily summary). You can change it by editing the job posting.'
          : 'Recibirás avisos de las nuevas candidaturas según la frecuencia que elegiste para esta oferta (al momento o en un resumen diario). Puedes cambiarla editando la oferta.' },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you manage this job posting.' : 'Recibes este correo porque gestionas esta oferta.',
    })
  },

  job_rejected: (p, lang) => {
    const title = need(str(p.title, 150), 'title')
    const reason = str(p.reason, 600)
    return build(lang, lang === 'en' ? `Your job posting was not published: ${title}` : `Tu oferta no se ha publicado: ${title}`, {
      preheader: lang === 'en' ? `“${title}” did not pass the review.` : `«${title}» no ha superado la revisión.`,
      eyebrow: lang === 'en' ? 'Review result' : 'Resultado de la revisión',
      heading: lang === 'en' ? 'Your job posting was not published' : 'Tu oferta no se ha publicado',
      hero: 'dark',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `We reviewed “${title}” and could not publish it as it is.`
          : `Hemos revisado «${title}» y no hemos podido publicarla tal como está.` },
        ...(reason ? [{ type: 'note', tone: 'warning', title: lang === 'en' ? 'Reason' : 'Motivo', text: reason } as Block] : []),
        { type: 'p', text: lang === 'en'
          ? 'You can edit the job posting and send it for review again.'
          : 'Puedes editar la oferta y enviarla de nuevo a revisión.' },
        { type: 'button', label: lang === 'en' ? 'Edit my job postings' : 'Editar mis ofertas', url: `${BRAND.url}/company/jobs` },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you manage this job posting.' : 'Recibes este correo porque gestionas esta oferta.',
    })
  },

  job_expiring: (p, lang) => {
    const title = need(str(p.title, 150), 'title')
    const when = dateText(lang, p.application_deadline)
    return build(lang, lang === 'en' ? `Your job posting closes soon: ${title}` : `Tu oferta cierra pronto: ${title}`, {
      preheader: lang === 'en' ? `“${title}” closes in a few days.` : `«${title}» cierra en pocos días.`,
      eyebrow: lang === 'en' ? 'Closing soon' : 'Cierre próximo',
      heading: lang === 'en' ? 'Your job posting closes in 3 days' : 'Tu oferta cierra en 3 días',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `The application deadline of “${title}”${when ? ` is ${when}` : ' is coming up'}. After that date it will be closed automatically.`
          : `La fecha de cierre de «${title}»${when ? ` es el ${when}` : ' se acerca'}. Después se cerrará automáticamente.` },
        { type: 'p', text: lang === 'en' ? 'If you still need candidates, renew it from your panel.' : 'Si aún necesitas candidatos, renuévala desde tu panel.' },
        { type: 'button', label: lang === 'en' ? 'Manage my job postings' : 'Gestionar mis ofertas', url: `${BRAND.url}/company/jobs` },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you manage this job posting.' : 'Recibes este correo porque gestionas esta oferta.',
    })
  },

  job_expired: (p, lang) => {
    const title = need(str(p.title, 150), 'title')
    return build(lang, lang === 'en' ? `Your job posting has closed: ${title}` : `Tu oferta se ha cerrado: ${title}`, {
      preheader: lang === 'en' ? `“${title}” reached its closing date.` : `«${title}» ha llegado a su fecha de cierre.`,
      eyebrow: lang === 'en' ? 'Job posting closed' : 'Oferta cerrada',
      heading: lang === 'en' ? 'Your job posting has closed' : 'Tu oferta se ha cerrado',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `“${title}” reached its closing date and is no longer visible to candidates. You can still review the applications you received.`
          : `«${title}» ha llegado a su fecha de cierre y ya no es visible para los candidatos. Sigues pudiendo consultar las candidaturas recibidas.` },
        { type: 'button', label: lang === 'en' ? 'See applications' : 'Ver candidaturas', url: `${BRAND.url}/company/jobs/applications` },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you manage this job posting.' : 'Recibes este correo porque gestionas esta oferta.',
    })
  },

  application_received_company: (p, lang) => {
    const title = need(str(p.job_title, 150), 'job_title')
    const candidate = str(p.candidate_name, 120)
    const score = Number(p.match_score)
    const hasScore = Number.isFinite(score) && score >= 0 && score <= 100
    return build(lang, lang === 'en' ? `New application for ${title}` : `Nueva candidatura para ${title}`, {
      preheader: lang === 'en' ? `${candidate || 'A candidate'} applied to “${title}”.` : `${candidate || 'Una persona'} se ha inscrito en «${title}».`,
      eyebrow: lang === 'en' ? 'New application' : 'Nueva candidatura',
      heading: lang === 'en' ? 'You have a new application' : 'Tienes una nueva candidatura',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'details', rows: [
          [lang === 'en' ? 'Job posting' : 'Oferta', title],
          [lang === 'en' ? 'Candidate' : 'Candidato/a', candidate],
          [lang === 'en' ? 'Match with the requirements' : 'Encaje con los requisitos', hasScore ? `${Math.round(score)} %` : ''],
        ] },
        { type: 'button', label: lang === 'en' ? 'Review the application' : 'Revisar la candidatura', url: `${BRAND.url}/company/jobs/applications` },
        ...(p.digest === true ? [{ type: 'small', text: lang === 'en' ? 'You chose to receive a daily summary of applications.' : 'Has elegido recibir un resumen diario de candidaturas.' } as Block] : []),
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you manage this job posting.' : 'Recibes este correo porque gestionas esta oferta.',
    })
  },

  application_digest: (p, lang) => {
    const title = need(str(p.job_title ?? p.title, 150), 'job_title')
    const company = str(p.company_name, 150)
    const raw = Array.isArray(p.candidates) ? p.candidates : Array.isArray(p.applications) ? p.applications : Array.isArray(p.items) ? p.items : []
    const rows = (raw as Payload[]).slice(0, 15).map((c) => {
      const given = c?.affinity ?? c?.match_score ?? c?.score
      const score = Number(given)
      const hasScore = given != null && given !== '' && Number.isFinite(score) && score >= 0 && score <= 100
      // Solo nombre, fecha y afinidad: nunca correo, teléfono ni identificadores del candidato.
      return [
        str(c?.name ?? c?.candidate_name, 120) || (lang === 'en' ? 'Candidate' : 'Candidato/a'),
        dateText(lang, c?.date ?? c?.applied_at ?? c?.created_at),
        hasScore ? (lang === 'en' ? `${Math.round(score)} % match` : `${Math.round(score)} % de encaje`) : '',
      ].filter(Boolean).join(' · ')
    })
    const total = Math.max(Math.floor(Number(p.total)) || rows.length, rows.length)
    if (total < 1) throw new InvalidPayloadError('application_digest sin candidaturas')
    const day = dateText(lang, p.date ?? p.digest_date ?? p.period_to)
    const more = total - rows.length
    // Solo rutas del panel de empresa: un panel_path ajeno se ignora.
    const rawPath = str(p.panel_path ?? p.url_path, 120)
    const path = /^\/company\/[A-Za-z0-9/_-]*(\?[A-Za-z0-9=&_-]*)?$/.test(rawPath) ? rawPath : '/company/jobs/applications'
    const many = total === 1 ? '' : 's'
    return build(lang, lang === 'en'
      ? `${total} new application${many} for ${title}`
      : `${total} candidatura${total === 1 ? ' nueva' : 's nuevas'} para ${title}`, {
      preheader: lang === 'en'
        ? `Daily summary: ${total} new application${many} for “${title}”.`
        : `Resumen diario: ${total} candidatura${total === 1 ? ' nueva' : 's nuevas'} para «${title}».`,
      eyebrow: lang === 'en' ? 'Daily summary' : 'Resumen diario',
      heading: lang === 'en' ? 'New applications today' : 'Candidaturas nuevas de hoy',
      intro: lang === 'en'
        ? `${total} new application${many}${day ? ` on ${day}` : ''}.`
        : `${total} candidatura${total === 1 ? ' nueva' : 's nuevas'}${day ? ` el ${day}` : ''}.`,
      greeting: hello(lang, ''),
      blocks: [
        { type: 'details', rows: [
          [lang === 'en' ? 'Job posting' : 'Oferta', title],
          [lang === 'en' ? 'Company' : 'Empresa', company],
          [lang === 'en' ? 'New applications' : 'Candidaturas nuevas', String(total)],
        ] },
        ...(rows.length ? [{ type: 'checks', title: lang === 'en' ? 'Who applied' : 'Quién se ha inscrito', items: rows } as Block] : []),
        ...(more > 0 ? [{ type: 'small', text: lang === 'en' ? `And ${more} more in your panel.` : `Y ${more} más en tu panel.` } as Block] : []),
        { type: 'button', label: lang === 'en' ? 'Review the applications' : 'Revisar las candidaturas', url: `${BRAND.url}${path}` },
        { type: 'small', text: lang === 'en'
          ? 'You get this summary because you chose a daily summary for this job posting. You can change it by editing the job posting.'
          : 'Recibes este resumen porque elegiste el resumen diario en esta oferta. Puedes cambiarlo editando la oferta.' },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you manage this job posting.' : 'Recibes este correo porque gestionas esta oferta.',
    })
  },

  // ------------------------------ candidato ---------------------------------
  application_received_candidate: (p, lang) => {
    const title = need(str(p.job_title, 150), 'job_title')
    const company = str(p.company_name, 150)
    const name = str(p.candidate_name, 120)
    return build(lang, lang === 'en' ? `Application sent: ${title}` : `Candidatura enviada: ${title}`, {
      preheader: lang === 'en' ? `We have sent your application for “${title}”.` : `Hemos enviado tu candidatura a «${title}».`,
      eyebrow: lang === 'en' ? 'Application sent' : 'Candidatura enviada',
      heading: lang === 'en' ? 'Your application has been sent' : 'Tu candidatura se ha enviado',
      intro: lang === 'en' ? 'The company will review it.' : 'La empresa la revisará.',
      greeting: hello(lang, name),
      blocks: [
        { type: 'details', rows: [[lang === 'en' ? 'Job posting' : 'Oferta', title], [lang === 'en' ? 'Company' : 'Empresa', company]] },
        { type: 'p', text: lang === 'en'
          ? 'You will get an email whenever your application changes status. You can also follow it from your panel.'
          : 'Te avisaremos por correo cuando cambie el estado de tu candidatura. También puedes seguirla desde tu panel.' },
        { type: 'button', label: lang === 'en' ? 'See my applications' : 'Ver mis candidaturas', url: `${BRAND.url}/dashboard` },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you applied to a job posting on YourCVPassport.' : 'Recibes este correo porque te has inscrito en una oferta de YourCVPassport.',
    })
  },

  application_status_candidate: (p, lang) => {
    const title = need(str(p.job_title, 150), 'job_title')
    const company = str(p.company_name, 150)
    const name = str(p.candidate_name, 120)
    const status = str(p.new_status, 30).toUpperCase()
    const T: Record<string, { es: [string, string, string]; en: [string, string, string]; tone: 'brand' | 'dark' }> = {
      SHORTLISTED: {
        es: ['Tu candidatura ha sido preseleccionada', 'Has pasado a la siguiente fase del proceso.', 'La empresa ha preseleccionado tu candidatura. Es posible que se ponga en contacto contigo próximamente.'],
        en: ['Your application has been shortlisted', 'You have moved on to the next stage.', 'The company has shortlisted your application. They may contact you soon.'],
        tone: 'brand',
      },
      INTERVIEW: {
        es: ['La empresa quiere entrevistarte', 'Tu candidatura avanza a la fase de entrevista.', 'La empresa ha pasado tu candidatura a la fase de entrevista. Mantente atento/a a tu correo y a tu teléfono.'],
        en: ['The company wants to interview you', 'Your application moves on to the interview stage.', 'The company has moved your application to the interview stage. Keep an eye on your email and phone.'],
        tone: 'brand',
      },
      HIRED: {
        es: ['¡Enhorabuena, has sido seleccionado/a!', 'La empresa ha elegido tu candidatura.', 'La empresa te ha seleccionado para el puesto. Revisa tu correo: se pondrán en contacto contigo para los siguientes pasos.'],
        en: ['Congratulations, you have been selected!', 'The company has chosen your application.', 'The company has selected you for the position. Check your email: they will contact you about the next steps.'],
        tone: 'brand',
      },
      REJECTED: {
        es: ['Actualización sobre tu candidatura', 'La empresa ha tomado una decisión.', 'En esta ocasión la empresa no continuará con tu candidatura. Gracias por tu interés: hay muchas más ofertas esperándote.'],
        en: ['Update on your application', 'The company has made a decision.', 'This time the company will not continue with your application. Thank you for your interest: there are many more openings waiting for you.'],
        tone: 'dark',
      },
    }
    const t = T[status] ?? {
      es: ['Tu candidatura ha cambiado de estado', 'Hay novedades en tu candidatura.', 'El estado de tu candidatura ha cambiado. Consúltalo en tu panel.'],
      en: ['Your application status has changed', 'There is news about your application.', 'The status of your application has changed. See it in your panel.'],
      tone: 'brand' as const,
    }
    const [heading, intro, body] = lang === 'en' ? t.en : t.es
    return build(lang, `${heading}: ${title}`, {
      preheader: `${heading} — ${title}`,
      eyebrow: lang === 'en' ? 'Application update' : 'Estado de tu candidatura',
      heading,
      intro,
      hero: t.tone === 'dark' ? 'dark' : 'brand',
      greeting: hello(lang, name),
      blocks: [
        { type: 'details', rows: [[lang === 'en' ? 'Job posting' : 'Oferta', title], [lang === 'en' ? 'Company' : 'Empresa', company]] },
        { type: 'p', text: body },
        { type: 'button', label: lang === 'en' ? 'See my applications' : 'Ver mis candidaturas', url: `${BRAND.url}/dashboard` },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you applied to a job posting on YourCVPassport.' : 'Recibes este correo porque te has inscrito en una oferta de YourCVPassport.',
    })
  },

  application_message: (p, lang) => {
    const title = need(str(p.job_title, 150), 'job_title')
    const company = str(p.company_name, 150) || (lang === 'en' ? 'The company' : 'La empresa')
    const template = str(p.template, 20).toLowerCase()
    if (template !== 'rejected' && template !== 'interview') throw new InvalidPayloadError(`plantilla desconocida: ${template}`)
    if (template === 'rejected') {
      return build(lang, lang === 'en' ? `Update on your application: ${title}` : `Sobre tu candidatura: ${title}`, {
        preheader: lang === 'en' ? `${company} will not continue with your application.` : `${company} no continuará con tu candidatura.`,
        eyebrow: lang === 'en' ? 'Message from the company' : 'Mensaje de la empresa',
        heading: lang === 'en' ? 'Thank you for applying' : 'Gracias por inscribirte',
        hero: 'dark',
        greeting: hello(lang, ''),
        blocks: [
          { type: 'p', text: lang === 'en'
            ? `${company} has reviewed your application for “${title}” and, this time, will not continue with it. Thank you for your time and interest.`
            : `${company} ha revisado tu candidatura a «${title}» y, en esta ocasión, no la continuará. Gracias por tu tiempo y tu interés.` },
          { type: 'p', text: lang === 'en' ? 'Do not be discouraged: new job postings are published every day.' : 'No te desanimes: cada día se publican nuevas ofertas.' },
          { type: 'button', label: lang === 'en' ? 'Find more job postings' : 'Buscar más ofertas', url: `${BRAND.url}/${lang === 'en' ? 'jobs' : 'empleos'}` },
        ],
        footerReason: lang === 'en' ? 'You are receiving this email because you applied to a job posting on YourCVPassport.' : 'Recibes este correo porque te has inscrito en una oferta de YourCVPassport.',
      })
    }
    return build(lang, lang === 'en' ? `${company} wants to talk to you: ${title}` : `${company} quiere hablar contigo: ${title}`, {
      preheader: lang === 'en' ? `${company} will contact you about “${title}”.` : `${company} se pondrá en contacto contigo por «${title}».`,
      eyebrow: lang === 'en' ? 'Message from the company' : 'Mensaje de la empresa',
      heading: lang === 'en' ? 'We will call you' : 'Te llamamos',
      intro: lang === 'en' ? 'Your application caught their attention.' : 'Tu candidatura ha llamado su atención.',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `${company} has reviewed your application for “${title}” and wants to talk to you. They will contact you soon using the details in your profile.`
          : `${company} ha revisado tu candidatura a «${title}» y quiere hablar contigo. Se pondrá en contacto contigo en breve con los datos de tu perfil.` },
        { type: 'note', tone: 'brand', title: lang === 'en' ? 'Tip' : 'Consejo', text: lang === 'en'
          ? 'Check that your phone number and email are up to date in your profile, and keep your phone at hand.'
          : 'Comprueba que tu teléfono y tu correo estén al día en tu perfil y ten el móvil a mano.' },
        { type: 'button', label: lang === 'en' ? 'Review my profile' : 'Revisar mi perfil', url: `${BRAND.url}/dashboard` },
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you applied to a job posting on YourCVPassport.' : 'Recibes este correo porque te has inscrito en una oferta de YourCVPassport.',
    })
  },

  job_alert: (p, lang) => {
    const rawJobs = Array.isArray(p.jobs) ? (p.jobs as Payload[]) : []
    const jobs = rawJobs.slice(0, 8).map((j) => ({
      title: str(j?.title, 120),
      company: str(j?.company_name, 100),
      country: str(j?.country_code ?? j?.country, 4),
      slug: str(j?.slug, 200),
    })).filter((j) => j.title)
    if (!jobs.length) throw new InvalidPayloadError('job_alert sin ofertas')
    const total = Math.max(Number(p.total) || jobs.length, jobs.length)
    const weekly = str(p.frequency, 12).toUpperCase() === 'WEEKLY'
    // Baja de ESTA alerta con un clic: solo si el token es un UUID (si no, no hay enlace).
    const token = str(p.unsubscribe_token, 64)
    const unsub = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
      ? `${BRAND.url}${lang === 'en' ? '/alerts/unsubscribe' : '/alertas/baja'}?token=${token.toLowerCase()}`
      : ''
    return build(lang, lang === 'en'
      ? `${total} new job posting${total === 1 ? '' : 's'} for you`
      : `${total} oferta${total === 1 ? ' nueva' : 's nuevas'} para ti`, {
      preheader: lang === 'en' ? `${total} new job postings match your alerts.` : `${total} ofertas nuevas coinciden con tus alertas.`,
      eyebrow: lang === 'en' ? (weekly ? 'Weekly job alert' : 'Daily job alert') : (weekly ? 'Alerta semanal de empleo' : 'Alerta diaria de empleo'),
      heading: lang === 'en' ? 'New job postings for you' : 'Nuevas ofertas para ti',
      intro: lang === 'en' ? 'They match the alerts you set up.' : 'Coinciden con las alertas que configuraste.',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'links', title: lang === 'en' ? (total > jobs.length ? `Latest ${jobs.length} of ${total}` : 'Job postings') : (total > jobs.length ? `Las últimas ${jobs.length} de ${total}` : 'Ofertas'),
          items: jobs.map((j) => ({ label: j.title, url: jobUrl(lang, j.slug, j.country), meta: [j.company, j.country.toUpperCase()].filter(Boolean).join(' · ') })) },
        { type: 'button', label: lang === 'en' ? 'See all job postings' : 'Ver todas las ofertas', url: `${BRAND.url}/${lang === 'en' ? 'jobs' : 'empleos'}` },
        { type: 'small', text: lang === 'en'
          ? 'You can change or turn off your alerts at any time from your panel.'
          : 'Puedes cambiar o desactivar tus alertas cuando quieras desde tu panel.' },
        ...(unsub ? [{ type: 'links', items: [{ label: lang === 'en' ? 'Unsubscribe from this alert' : 'Darme de baja de esta alerta', url: unsub }] } as Block] : []),
      ],
      footerReason: lang === 'en' ? 'You are receiving this email because you turned on job alerts on YourCVPassport.' : 'Recibes este correo porque activaste las alertas de empleo en YourCVPassport.',
    })
  },

  // ------------------- condiciones legales (candidatos y empresas) ----------------
  legal_version_notice: (p, lang) => {
    const tipo = str(p.tipo, 40)
    const doc = LEGAL_DOCS[tipo] ?? LEGAL_GENERIC
    const label = lang === 'en' ? doc.en : doc.es.replace(/^(los|las|la|el) /, '')
    const titulo = str(p.titulo, 150) || label
    const version = str(p.version, 30)
    const when = dateText(lang, p.vigente_desde)
    // El destino lo manda el TIPO de documento (cada uno tiene su página). Solo con un tipo
    // desconocido se usa el url_path del payload, y únicamente si es una página legal conocida.
    const path = LEGAL_DOCS[tipo] ? doc.path : LEGAL_PATHS.has(str(p.url_path, 40)) ? str(p.url_path, 40) : doc.path
    const url = `${BRAND.url}${path}`
    return build(lang, lang === 'en'
      ? `We are updating our ${doc.en}${when ? `: effective ${when}` : ''}`
      : `Actualizamos ${doc.es}${when ? `: entra en vigor el ${when}` : ''}`, {
      preheader: lang === 'en'
        ? `A new version of “${titulo}” takes effect${when ? ` on ${when}` : ' soon'}.`
        : `Una nueva versión de «${titulo}» entra en vigor${when ? ` el ${when}` : ' próximamente'}.`,
      eyebrow: lang === 'en' ? 'Legal notice' : 'Aviso legal',
      heading: lang === 'en' ? 'Our legal terms are changing' : 'Cambian nuestras condiciones legales',
      intro: lang === 'en' ? 'Please review what changes before it takes effect.' : 'Revisa lo que cambia antes de que entre en vigor.',
      greeting: hello(lang, ''),
      blocks: [
        { type: 'p', text: lang === 'en'
          ? `We have published a new version of “${titulo}”${version ? ` (version ${version})` : ''}. It takes effect${when ? ` on ${when}` : ' soon'}; the next time you sign in you will be asked to review and accept it.`
          : `Hemos publicado una nueva versión de «${titulo}»${version ? ` (versión ${version})` : ''}. Entra en vigor${when ? ` el ${when}` : ' próximamente'}; la próxima vez que inicies sesión te pediremos que la revises y la aceptes.` },
        { type: 'details', title: lang === 'en' ? 'The document' : 'El documento', rows: [
          [lang === 'en' ? 'Document' : 'Documento', titulo],
          [lang === 'en' ? 'Version' : 'Versión', version],
          [lang === 'en' ? 'Takes effect' : 'Entra en vigor', when],
        ] },
        { type: 'button', label: lang === 'en' ? 'Read the new version' : 'Leer la nueva versión', url },
        { type: 'small', text: lang === 'en'
          ? 'If you do not agree with the changes you can stop using the platform and ask us to delete your account.'
          : 'Si no estás de acuerdo con los cambios, puedes dejar de usar la plataforma y pedirnos que eliminemos tu cuenta.' },
      ],
      footerReason: lang === 'en'
        ? 'You are receiving this email because you have an account on YourCVPassport and the legal terms that apply to it are changing.'
        : 'Recibes este correo porque tienes una cuenta en YourCVPassport y cambian las condiciones legales que te aplican.',
    })
  },
}

/** Documentos legales (documentos_legales.tipo) y su destino público. */
const LEGAL_PATHS = new Set(['/terminos', '/privacidad', '/politica-de-cookies'])
const LEGAL_DOCS: Record<string, { es: string; en: string; path: string }> = {
  terminos_candidato: { es: 'los términos para candidatos', en: 'terms for candidates', path: '/terminos' },
  terminos_empleador: { es: 'los términos para empresas', en: 'terms for employers', path: '/terminos' },
  condiciones_publicacion: { es: 'las condiciones de publicación de ofertas', en: 'job posting terms', path: '/terminos' },
  privacidad: { es: 'la política de privacidad', en: 'privacy policy', path: '/privacidad' },
  cookies: { es: 'la política de cookies', en: 'cookie policy', path: '/politica-de-cookies' },
}
const LEGAL_GENERIC = { es: 'nuestras condiciones legales', en: 'legal terms', path: '/terminos' }

/**
 * Genera el correo de una fila de la cola. Lanza UnknownKindError si no hay plantilla y
 * InvalidPayloadError si faltan datos imprescindibles: son errores PERMANENTES (reintentar
 * no los arregla).
 */
export function renderOutboxEmail(kind: string, payload: unknown, langRaw: unknown): Rendered {
  const render = (R as Record<string, Renderer | undefined>)[kind]
  if (!render) throw new UnknownKindError(kind)
  const p: Payload = payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as Payload) : {}
  const lang: EmailLang = INTERNAL_KINDS.has(kind) ? 'es' : normalizeLang(langRaw)
  return render(p, lang)
}
