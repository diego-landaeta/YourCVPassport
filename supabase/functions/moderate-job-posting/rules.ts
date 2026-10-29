// Reglas de revisión automática de ofertas (sin IA). Módulo PURO: sin red ni Deno,
// para poder probarlo suelto (node/ts) y para que `index.ts` solo orqueste.
//
// Filosofía: ante la duda, revisión manual. Una oferta solo se publica sola si NINGUNA
// regla salta. Los falsos positivos cuestan un minuto de un humano; un falso negativo
// publica una estafa. Las reglas se aplican sobre texto normalizado (minúsculas, sin
// tildes, sin HTML) y se complementan con el filtro previo `_job_precheck` de la
// migración 20261030 (que ya manda a MANUAL_REVIEW lo evidente al enviar).

export interface JobForReview {
  title?: string | null
  description?: string | null
  department?: string | null
  responsibilities?: string[] | null
  requirements?: string[] | null
  nice_to_have?: string[] | null
  benefits?: string[] | null
  required_skills?: string[] | null
  optional_skills?: string[] | null
  application_instructions?: string | null
  application_url?: string | null
  application_email?: string | null
  duration?: string | null
}

export interface Finding {
  /** Código estable (se guarda en review_reason y en el correo a support@). */
  code: string
  /** Explicación para quien revise (español). */
  message: string
  /** Fragmento (normalizado) que disparó la regla. */
  excerpt?: string
}

/** Quita etiquetas HTML y decodifica lo mínimo (&nbsp; &amp; &lt; &gt;). */
export function stripHtml(html: string): string {
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Minúsculas, sin tildes y con los espacios colapsados. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[ \t\r\f\v ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

/** Todo el texto que ve un candidato, en un solo bloque (con el título primero). */
export function collectText(job: JobForReview): {
  original: string
  normalized: string
  /** Texto normalizado SIN los campos propios `application_url` / `application_email` (ni sus valores repetidos en el texto). */
  contact: string
  title: string
  body: string
} {
  const list = (v?: string[] | null) => (Array.isArray(v) ? v.join('\n') : '')
  const title = String(job.title ?? '')
  const fieldUrl = String(job.application_url ?? '').trim()
  const fieldEmail = String(job.application_email ?? '').trim()
  const body = [
    stripHtml(String(job.description ?? '')),
    list(job.responsibilities),
    list(job.requirements),
    list(job.nice_to_have),
    list(job.benefits),
    list(job.required_skills),
    list(job.optional_skills),
    String(job.department ?? ''),
    String(job.duration ?? ''),
    String(job.application_instructions ?? ''),
    String(job.application_url ?? ''),
    String(job.application_email ?? ''),
  ]
    .filter(Boolean)
    .join('\n')
  const original = `${title}\n${body}`
  // Para CONTACTO_EXTERNO: lo que el candidato LEE, quitando los datos de contacto que
  // la empresa configuró en sus campos propios (y su repetición literal en el texto).
  const contactSource = [
    title,
    stripHtml(String(job.description ?? '')),
    list(job.responsibilities),
    list(job.requirements),
    list(job.nice_to_have),
    list(job.benefits),
    list(job.required_skills),
    list(job.optional_skills),
    String(job.department ?? ''),
    String(job.duration ?? ''),
    String(job.application_instructions ?? ''),
  ]
    .filter(Boolean)
    .join('\n')
  let contact = normalize(contactSource)
  for (const own of [fieldUrl, fieldEmail]) {
    const o = normalize(own)
    if (o) contact = contact.split(o).join(' ')
  }
  return { original, normalized: normalize(original), contact, title, body }
}

interface Rule {
  code: string
  message: string
  patterns: RegExp[]
}

// Todos los patrones se aplican a texto NORMALIZADO (sin tildes, en minúsculas).
const RULES: Rule[] = [
  {
    code: 'DINERO',
    message: 'Pide dinero al candidato (pago por adelantado, cursos o material de pago, inversión, depósito).',
    patterns: [
      /\b(pago|tasa|cuota|inversion|deposito|fianza)\s+(inicial|previ[oa]|por adelantado|de inscripcion|de matricula|de registro|de acceso|obligatori[oa])\b/,
      /\b(curso|kit|material|formacion|uniforme|licencia|certificado)\s+(de|con)\s+pago\b/,
      /\b(curso|formacion|kit|material)\s+(obligatori[oa]|previ[oa])\s+(de pago|a cargo del candidato)\b/,
      /\bpaga(r|s)?\s+(por\s+)?(el|tu|su)\s+(puesto|empleo|trabajo|plaza)\b/,
      /\b(necesit(as|a)|debes?|tendras?\s+que|has de)\s+(invertir|pagar|abonar|depositar|adelantar)\b/,
      /\b(inversion minima|capital inicial|comprar (tu|el) (propio )?(material|kit|stock))\b/,
      /\b(western union|moneygram|bitcoin|criptomonedas?|usdt|transferencia previa)\b/,
      /\b(advance fee|registration fee|upfront (payment|fee)|pay to apply|investment required|training fee|you (must|will need to) pay)\b/,
    ],
  },
  // CONTACTO_EXTERNO no está aquí: lo calcula `contactoExterno()` (más abajo) sobre el
  // texto SIN los campos propios application_url / application_email.
  {
    code: 'MULTINIVEL',
    message: 'Parece un negocio multinivel o piramidal.',
    patterns: [
      /\b(multinivel|multi-nivel|piramid(e|al)|network marketing|marketing de red|mlm)\b/,
      /\b(red de (consumo|distribuidores)|reclut(a|ar|ando)\s+(a\s+)?(personas|gente|amigos|equipo))\b/,
      /\b(referidos?|invita a (tus )?amigos)\b.{0,40}\b(ganas|pagan|comision)\b/,
    ],
  },
  {
    code: 'DISCRIMINACION',
    message: 'Requisito discriminatorio (sexo, estado civil, aspecto, hijos o similares).',
    patterns: [
      /\b(solo|unicamente|exclusivamente)\s+(para\s+)?(hombres|mujeres|varones|chicos|chicas|caballeros|senoras|senoritas)\b/,
      /\b(se busca|buscamos|necesitamos|precisamos)\s+(a\s+)?(un\s+|una\s+)?(chico|chica|muchacho|muchacha|senorita|joven\s+(guapo|guapa|atractiv[oa]))\b/,
      /\b(buena presencia|buena apariencia|aspecto fisico|fisico agradable|sin hijos|sin cargas familiares|no embarazada|estado civil)\b/,
      /\b(soltero|soltera|solteros|solteras)\b/,
      /\braza\s+(blanca|negra|caucasica)\b/,
      /\b(solo|unicamente|exclusivamente)\s+(nacionales|ciudadanos)\b/,
      /\b(men|women|males|females)\s+only\b|\bonly\s+(men|women|males|females)\b/,
      /\bage\s+(limit|range|between)\b|\b(single|unmarried)\s+(only|candidates)\b/,
    ],
  },
  {
    code: 'ADULTO',
    message: 'Contenido adulto o servicios sexuales.',
    patterns: [
      /\b(escort|onlyfans|contenido adulto|adult content|servicios sexuales|sexting)\b/,
      /\bacompanante\s+(sexual|vip|de lujo)\b/,
      /\bmasajes?\s+(eroticos?|con final feliz)\b/,
      /\bmodelo\s+(webcam|de webcam|erotic[oa])\b/,
    ],
  },
  {
    code: 'PROMESA_EXAGERADA',
    message: 'Promesas de ganancias exageradas o garantizadas.',
    patterns: [
      /\b(ganancias?|ingresos?|sueldo|salario)\s+(garantizad[oa]s?|ilimitad[oa]s?|asegurad[oa]s?)\b/,
      /\bgan(a|as|ar)\s+(hasta\s+)?[$€]?\s?\d[\d.,]*\s*(\$|€|usd|eur|dolares|euros)?\s*(al dia|diarios|por dia|a la semana|semanales|en\s+\d+\s+(dias|horas))\b/,
      /\b(dinero (facil|rapido)|hazte rico|libertad financiera|ingresos pasivos)\b/,
      /\b(easy money|get rich|guaranteed income|unlimited earning)\b/,
    ],
  },
]

// ---------------------------------------------------------------------------
// CONTACTO_EXTERNO (afinado, auditoría F14)
// ---------------------------------------------------------------------------
// Una oferta normal trae la web de la empresa, un correo corporativo y una URL de
// candidatura: NADA de eso se marca. Solo se marca lo que huele a captación fuera de la
// plataforma:
//   1. teléfonos sueltos en el texto,
//   2. enlaces acortados (bit.ly...),
//   3. WhatsApp / Telegram (y similares) usados para contactar, o enlaces wa.me / t.me,
//   4. correos de proveedores gratuitos (gmail, hotmail...) en el texto,
//   5. frases que piden hablar «por privado» o «fuera de la plataforma».
// Los campos `application_url` y `application_email` configurados por la empresa y su
// repetición literal en el texto quedan fuera (ver collectText().contact).

const SHORTENERS = /\b(bit\.ly|tinyurl\.com|cutt\.ly|goo\.gl|is\.gd|rebrand\.ly|shorturl\.at|ow\.ly|t\.co|rb\.gy|tiny\.cc|s\.id|lnkd\.in|buff\.ly)\b/

// Sobre texto normalizado. Los lookbehind evitan tomar trozos de números más largos
// (salarios con puntos de millar, fechas, rangos).
const PHONE_PATTERNS: RegExp[] = [
  /(?<![\w.,/])\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}(?!\d)/, // +34 600 123 456, +52 55 1234 5678
  /(?<![\d.,/-])\d{3}[ -]\d{3}[ -]\d{3}(?![\d.,/-]?\d)/, // 600 123 456
  /(?<![\d.,/-])\d{3}[ -]\d{2}[ -]\d{2}[ -]\d{2}(?!\d)/, // 600 12 34 56
  /(?<![\d.,/-])\d{2}[ -]\d{4}[ -]\d{4}(?!\d)/, // 55 1234 5678
  /(?<![\d.,/-])\(\d{2,4}\)\s?\d{3,4}[ -]?\d{4}(?!\d)/, // (55) 1234-5678
  /(?<![\d.,/-])[679]\d{8}(?![\d.,/-]?\d)/, // 600123456
  /\b(?:tel|telf|tlf|telefono|movil|celular|cel)\b\W{0,3}\+?\d[\d\s.-]{6,}\d/, // «tel: 12 34 56 78»
]

const MESSENGER = '(?:whatsapp|wasap|watsap|telegram|viber|wechat|signal app)'
const CONTACT_VERB =
  '(?:escribe|escribenos|escribeme|contacta|contactanos|contactame|llama|llamanos|llamame|chatea|agregame|agreganos|anadenos|unete|envianos|enviame|mandanos|mandame|postula|aplica|inscribete|apuntate)'
const MESSENGER_PATTERNS: RegExp[] = [
  /\b(?:wa\.me|t\.me)\b/,
  new RegExp(`\\b${CONTACT_VERB}\\b[^\\n.]{0,40}\\b${MESSENGER}\\b`),
  new RegExp(`\\b${MESSENGER}\\b\\W{0,3}(?:al|:|-)?\\s*\\+?\\d[\\d\\s.-]{5,}\\d`),
  /\btelegram\W{0,3}@[a-z0-9_]{3,}/,
  new RegExp(`\\b(?:message|text|contact|chat|dm|write|reach|call)\\s+(?:me|us)\\b[^\\n.]{0,30}\\b${MESSENGER}\\b`),
]

const OUTSIDE_PATTERNS: RegExp[] = [
  /\b(?:escribe|escribenos|escribeme|contacta|contactanos|contactame|llama|llamanos|llamame|habla|hablame|hablanos)\b[^\n.]{0,30}\b(?:por|al|en)\s+privado\b/,
  /\b(?:escribe|escribenos|escribeme|contacta|contactanos|contactame|llama|llamanos|llamame)\b[^\n.]{0,40}\bfuera de (?:la )?(?:plataforma|web|pagina|aplicacion)\b/,
  /\bsin pasar por (?:la )?(?:plataforma|web)\b/,
  /\b(?:contact|message|text|dm|call|email)\s+(?:me|us)\b[^\n.]{0,30}\b(?:directly|privately|outside)\b/,
  /\boutside (?:of )?(?:the )?(?:platform|site|website)\b|\boff[- ]platform\b/,
]

// Marcas de correo gratuito (cubren hotmail.com.ar, yahoo.com.mx...).
const FREE_MAIL_BRANDS = new Set([
  'gmail', 'googlemail', 'hotmail', 'outlook', 'live', 'msn', 'yahoo', 'ymail', 'icloud', 'me', 'aol',
  'proton', 'protonmail', 'gmx', 'zoho', 'yandex', 'mail', 'qq', 'terra', 'tutanota', 'fastmail',
])

/** Dominios de correos gratuitos que aparecen en el texto (sin repetir). */
export function freeEmailsIn(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(/[a-z0-9._%+-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})/g)) {
    const labels = m[1].split('.')
    const sld = labels.length >= 3 && labels[labels.length - 1].length === 2 && ['com', 'co', 'net', 'org'].includes(labels[labels.length - 2])
      ? labels[labels.length - 3]
      : labels[labels.length - 2]
    if (FREE_MAIL_BRANDS.has(sld)) out.add(m[0])
  }
  return [...out]
}

/** Hallazgo CONTACTO_EXTERNO sobre el texto de contacto (normalizado) y el texto completo (acortadores). */
export function contactoExterno(contact: string, all: string): Finding | null {
  const msg = 'Intenta sacar al candidato de la plataforma (teléfono suelto, enlace acortado, WhatsApp/Telegram o correo gratuito).'
  const hit = (why: string, index: number, len: number): Finding => ({
    code: 'CONTACTO_EXTERNO',
    message: `${msg} Motivo: ${why}.`,
    excerpt: excerptAround(contact, index, len),
  })

  const short = SHORTENERS.exec(all) // incluye application_url: un acortador no es «la web de la empresa»
  if (short) return { code: 'CONTACTO_EXTERNO', message: `${msg} Motivo: enlace acortado.`, excerpt: excerptAround(all, short.index, short[0].length) }

  for (const re of PHONE_PATTERNS) {
    const m = re.exec(contact)
    if (m) return hit('teléfono suelto', m.index, m[0].length)
  }
  for (const re of MESSENGER_PATTERNS) {
    const m = re.exec(contact)
    if (m) return hit('mensajería externa', m.index, m[0].length)
  }
  const free = freeEmailsIn(contact)
  if (free.length) {
    const i = contact.indexOf(free[0])
    return hit('correo de proveedor gratuito', i, free[0].length)
  }
  for (const re of OUTSIDE_PATTERNS) {
    const m = re.exec(contact)
    if (m) return hit('pide contacto fuera de la plataforma', m.index, m[0].length)
  }
  return null
}

/** Edad como requisito: «menor de 30 años», «entre 25 y 35 años», «edad máxima»... (18 y 16 son el mínimo legal). */
function ageFinding(n: string): Finding | null {
  const range = /\bentre\s+(\d{2})\s+y\s+(\d{2})\s+anos\b/.exec(n)
  if (range) return { code: 'DISCRIMINACION', message: 'Requisito de edad.', excerpt: range[0] }
  const lim = /\b(menor(es)?|mayor(es)?)\s+de\s+(\d{2})\s+anos\b/.exec(n)
  if (lim && ![16, 18].includes(Number(lim[4]))) return { code: 'DISCRIMINACION', message: 'Requisito de edad.', excerpt: lim[0] }
  const edad = /\b(edad\s+(maxima|minima|limite|entre|de\s+\d{2})|\d{2}\s+anos\s+de\s+edad|under\s+\d{2}\s+years|over\s+\d{2}\s+years)\b/.exec(n)
  if (edad) return { code: 'DISCRIMINACION', message: 'Requisito de edad.', excerpt: edad[0] }
  return null
}

function excerptAround(text: string, index: number, len: number): string {
  const from = Math.max(0, index - 20)
  return text.slice(from, Math.min(text.length, index + len + 30)).replace(/\s+/g, ' ').trim().slice(0, 100)
}

/** Proporción de mayúsculas sobre letras, y nº de letras. */
export function capsRatio(text: string): { ratio: number; letters: number } {
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (!letters.length) return { ratio: 0, letters: 0 }
  const upper = letters.replace(/[^\p{Lu}]/gu, '').length
  return { ratio: upper / letters.length, letters: letters.length }
}

/**
 * Aplica todas las reglas. Devuelve los hallazgos (uno por código, con el primer
 * fragmento que lo disparó). Lista vacía = nada raro según las reglas.
 */
export function reviewJobText(job: JobForReview): Finding[] {
  const { normalized, contact, title, body } = collectText(job)
  const found = new Map<string, Finding>()
  const add = (f: Finding) => {
    if (!found.has(f.code)) found.set(f.code, f)
  }

  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const m = re.exec(normalized)
      if (m) {
        add({ code: rule.code, message: rule.message, excerpt: excerptAround(normalized, m.index, m[0].length) })
        break
      }
    }
  }

  const contacto = contactoExterno(contact, normalized)
  if (contacto) add(contacto)

  const age = ageFinding(normalized)
  if (age) add(age)

  // Mayúsculas excesivas / signos repetidos (título y cuerpo por separado)
  const t = capsRatio(title)
  const b = capsRatio(body)
  if ((t.letters >= 8 && t.ratio > 0.8) || (b.letters >= 60 && b.ratio > 0.5) || /[!¡]{4,}|\?{4,}/.test(`${title}\n${body}`)) {
    add({ code: 'MAYUSCULAS_EXCESIVAS', message: 'Mayúsculas o signos de exclamación excesivos.' })
  }

  // Texto sin sentido: casi sin letras, caracteres repetidos o muy pocas palabras distintas
  const bodyNorm = normalize(body)
  const nonSpace = bodyNorm.replace(/\s/g, '')
  const lettersOnly = bodyNorm.replace(/[^a-z]/g, '')
  const words = bodyNorm.split(/[^a-z0-9]+/).filter((w) => w.length > 1)
  if (
    (nonSpace.length >= 40 && lettersOnly.length / nonSpace.length < 0.5) ||
    /(.)\1{9,}/.test(bodyNorm) ||
    (words.length >= 40 && new Set(words).size / words.length < 0.25)
  ) {
    add({ code: 'TEXTO_SIN_SENTIDO', message: 'El texto parece sin sentido, repetido o copiado a granel.' })
  }

  return Array.from(found.values())
}

/** Texto compacto de los hallazgos para `review_reason` (máx. 1000 en la RPC). */
export function reasonFromFindings(findings: Finding[], extra?: string): string {
  const parts = findings.map((f) => `${f.code}${f.excerpt ? ` («${f.excerpt}»)` : ''}`)
  const head = parts.length ? `Reglas automáticas: ${parts.join('; ')}` : ''
  return [head, extra].filter(Boolean).join(' | ').slice(0, 950)
}
