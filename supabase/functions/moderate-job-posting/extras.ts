// Reglas ADICIONALES de moderación de ofertas (cierre final, E-1). Módulo PURO: sin red
// ni Deno. Se suman a `reviewJobText` (rules.ts) y, igual que aquellas, SOLO MARCAN:
// un hallazgo manda la oferta a MANUAL_REVIEW; ninguna de estas reglas rechaza ni publica.
//
//   SALARIO_INCOHERENTE   mínimo > máximo; importe mensual equivalente absurdo (< 100 o
//                         por encima del tope de su moneda); importe sin periodo.
//   TEXTO_DUPLICADO       misma huella normalizada (título + descripción) que otra oferta
//                         PUBLISHED / AI_REVIEW de OTRA empresa. La búsqueda de candidatas
//                         la hace index.ts; aquí solo se calcula y compara la huella.
//   CATEGORIA_INCOHERENTE el título contiene palabras inequívocas de otra categoría muy
//                         distinta de la elegida (heurística conservadora).
//   ENLACE_SOSPECHOSO     IP numérica, dominios con xn-- (imitación visual), .zip o .top
//                         en los enlaces del cuerpo de la oferta.

import { normalize, stripHtml, type Finding, type JobForReview } from './rules.ts'

/** Campos de la oferta que usan las reglas adicionales (además de los de rules.ts). */
export interface JobForExtras extends JobForReview {
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  salary_period?: string | null
  category?: string | null
  category2?: string | null
}

// ---------------------------------------------------------------------------
// Salario
// ---------------------------------------------------------------------------

/** Horas de trabajo al mes que se usan para pasar un importe por horas a mensual. */
const HOURS_PER_MONTH = 160
/** Tope mensual por defecto (moneda local común: EUR, USD, GBP, CHF, MXN, PEN...). */
const DEFAULT_MONTHLY_MAX = 100_000
/** Monedas con cifras muy altas por su valor nominal: su tope mensual es mayor. */
const MONTHLY_MAX_BY_CURRENCY: Record<string, number> = {
  COP: 100_000_000,
  CLP: 20_000_000,
  ARS: 50_000_000,
  PYG: 50_000_000,
  VES: 100_000_000,
  CRC: 20_000_000,
  UYU: 2_000_000,
  HUF: 10_000_000,
  DOP: 5_000_000,
  NIO: 5_000_000,
  CUP: 5_000_000,
}
/** Importe mensual por debajo del cual no es un sueldo (cualquier moneda). */
const MONTHLY_MIN = 100

/** Importe mensual equivalente, o null si el periodo no se conoce. */
export function monthlyEquivalent(amount: number, period: string | null | undefined): number | null {
  switch (String(period ?? '').toUpperCase()) {
    case 'MONTHLY': return amount
    case 'HOURLY': return amount * HOURS_PER_MONTH
    case 'YEARLY': return amount / 12
    default: return null
  }
}

const toAmount = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function salaryFindings(job: JobForExtras): Finding[] {
  const min = toAmount(job.salary_min)
  const max = toAmount(job.salary_max)
  if (min === null && max === null) return []
  const reasons: string[] = []
  const flag = (why: string) => { if (!reasons.includes(why)) reasons.push(why) }
  // Un único hallazgo con todos los motivos (rules.ts también deja uno por código).
  const done = (): Finding[] =>
    reasons.length ? [{ code: 'SALARIO_INCOHERENTE', message: `Salario incoherente: ${reasons.join('; ')}.`, excerpt: reasons.join('; ').slice(0, 100) }] : []

  if ((min !== null && min < 0) || (max !== null && max < 0)) flag('importe negativo')
  if (min !== null && max !== null && min > max) flag('el mínimo es mayor que el máximo')

  const period = String(job.salary_period ?? '').trim()
  if (!period) {
    flag('hay importe pero falta el periodo (hora, mes o año)')
    return done()
  }
  const currency = String(job.salary_currency ?? '').trim().toUpperCase()
  const maxMonthly = MONTHLY_MAX_BY_CURRENCY[currency] ?? DEFAULT_MONTHLY_MAX
  for (const [label, amount] of [['mínimo', min], ['máximo', max]] as const) {
    if (amount === null || amount < 0) continue
    const monthly = monthlyEquivalent(amount, period)
    if (monthly === null) continue
    if (monthly < MONTHLY_MIN) flag(`el ${label} equivale a menos de ${MONTHLY_MIN} al mes`)
    else if (monthly > maxMonthly) flag(`el ${label} equivale a más de ${maxMonthly.toLocaleString('en-US')} al mes`)
  }
  return done()
}

// ---------------------------------------------------------------------------
// Texto duplicado (huella)
// ---------------------------------------------------------------------------

/** Longitud mínima de la huella (título + descripción) para compararla: textos cortos coinciden por azar. */
export const MIN_FINGERPRINT_LENGTH = 80

/**
 * Huella normalizada de título + descripción: sin HTML, sin tildes, en minúsculas y solo
 * letras y cifras (los signos, espacios y saltos de línea no cambian la huella). Dos
 * ofertas con el mismo título y la misma descripción dan la misma huella.
 */
export function textFingerprint(job: { title?: string | null; description?: string | null }): string {
  const compact = (s: string) => normalize(stripHtml(s)).replace(/[^a-z0-9]+/g, ' ').trim()
  return `${compact(String(job.title ?? ''))}|${compact(String(job.description ?? ''))}`
}

/** ¿La huella es lo bastante larga para compararse? */
export const fingerprintIsComparable = (fp: string): boolean => fp.replace(/[|\s]/g, '').length >= MIN_FINGERPRINT_LENGTH

/**
 * Hallazgo si alguna oferta candidata (de OTRA empresa, ya filtrada por el llamador) tiene
 * la misma huella. El hallazgo NO lleva datos de la otra oferta: es texto que se guarda en
 * review_reason y que puede ver la empresa; la referencia queda solo en el registro del servidor.
 */
export function duplicateFinding(
  job: JobForExtras & { id?: string | null; company_id?: string | null },
  others: Array<{ id: string; company_id?: string | null; title?: string | null; description?: string | null }>,
): { finding: Finding | null; matches: string[] } {
  const mine = textFingerprint(job)
  if (!fingerprintIsComparable(mine)) return { finding: null, matches: [] }
  const matches = others
    .filter((o) => o.id !== job.id && (!job.company_id || !o.company_id || o.company_id !== job.company_id))
    .filter((o) => textFingerprint(o) === mine)
    .map((o) => o.id)
  if (!matches.length) return { finding: null, matches: [] }
  return {
    matches,
    finding: {
      code: 'TEXTO_DUPLICADO',
      message: 'El título y la descripción son idénticos a los de una oferta de otra empresa.',
      excerpt: 'mismo texto que otra oferta de otra empresa',
    },
  }
}

// ---------------------------------------------------------------------------
// Título frente a categoría
// ---------------------------------------------------------------------------

// Palabras inequívocas por categoría (sobre el título normalizado, por inicio de palabra).
// Solo términos que casi no admiten otro sentido: la regla es conservadora a propósito.
const CATEGORY_WORDS: Record<string, string[]> = {
  HEALTH_MEDICINE: ['enfermer', 'medico', 'medica', 'doctor ', 'doctora ', 'fisioterap', 'farmaceutic', 'odontolog', 'dentista', 'pediatra', 'cirujan', 'nurse ', 'nurses ', 'physician', 'physiotherap', 'pharmacist', 'dentist', 'paramedic', 'auxiliar de enfermeria'],
  PSYCHOLOGY_SOCIAL: ['psicolog', 'trabajador social', 'trabajadora social', 'psychologist', 'social worker', 'psicopedagog'],
  LEGAL: ['abogad', 'procurador', 'lawyer', 'attorney', 'paralegal', 'notari'],
  IT_SOFTWARE: ['programador', 'programadora', 'desarrollador', 'desarrolladora', 'developer', 'software engineer', 'devops', 'frontend', 'backend', 'full stack', 'fullstack', 'sysadmin', 'administrador de sistemas'],
  DATA_AI: ['data scientist', 'cientifico de datos', 'cientifica de datos', 'data engineer', 'ingeniero de datos', 'machine learning', 'analista de datos', 'data analyst'],
  HOSPITALITY_TOURISM: ['camarero', 'camarera', 'cocinero', 'cocinera', 'barista', 'bartender', 'recepcionista de hotel', 'waiter', 'waitress', 'sommelier', 'chef'],
  LOGISTICS_TRANSPORT: ['conductor de camion', 'camionero', 'repartidor', 'mozo de almacen', 'carretillero', 'truck driver', 'delivery driver', 'warehouse operator'],
  EDUCATION_TRAINING: ['profesor', 'profesora', 'docente', 'maestro de', 'maestra de', 'teacher', 'lecturer', 'tutor academico'],
  ACCOUNTING_FINANCE: ['contable', 'contador', 'accountant', 'bookkeeper', 'tesorero'],
  BANKING_INSURANCE: ['gestor de seguros', 'agente de seguros', 'insurance agent', 'asesor bancario', 'bank teller'],
  HUMAN_RESOURCES: ['recursos humanos', 'reclutador', 'reclutadora', 'recruiter', 'human resources'],
  ARCHITECTURE_CONSTRUCTION: ['albanil', 'bricklayer', 'aparejador'],
  MAINTENANCE_TECHNICAL: ['electricista', 'fontanero', 'fontanera', 'soldador', 'electrician', 'plumber', 'welder', 'mecanico'],
  BEAUTY_WELLNESS: ['peluquer', 'esteticista', 'manicura', 'hairdresser', 'barber', 'beautician'],
  SECURITY_CLEANING: ['vigilante de seguridad', 'limpiador', 'limpiadora', 'personal de limpieza', 'security guard', 'cleaner'],
  AGRICULTURE_ENVIRONMENT: ['agricultor', 'agronomo', 'agronoma', 'ganadero', 'farmer', 'agronomist'],
  REAL_ESTATE: ['agente inmobiliario', 'asesor inmobiliario', 'real estate agent'],
  SPORTS_LEISURE: ['entrenador personal', 'monitor deportivo', 'socorrista', 'personal trainer', 'lifeguard'],
  DESIGN_CREATIVE: ['disenador grafico', 'disenadora grafica', 'graphic designer', 'ilustrador', 'ilustradora', 'ux designer'],
  COMMUNICATION: ['periodista', 'redactor', 'redactora', 'journalist', 'copywriter'],
}

// Grupos de categorías afines: un título de un grupo con categoría del MISMO grupo no se marca.
const CATEGORY_GROUPS: Record<string, string> = {
  ADMINISTRATION: 'oficina', ACCOUNTING_FINANCE: 'oficina', BANKING_INSURANCE: 'oficina', CUSTOMER_SERVICE: 'oficina',
  SALES: 'oficina', MARKETING: 'oficina', COMMUNICATION: 'oficina', HUMAN_RESOURCES: 'oficina', LEGAL: 'oficina',
  PURCHASING_SUPPLY: 'oficina', REAL_ESTATE: 'oficina', PUBLIC_NGO: 'oficina',
  IT_SOFTWARE: 'tecnologia', DATA_AI: 'tecnologia', DESIGN_CREATIVE: 'tecnologia', ENGINEERING: 'tecnologia',
  HEALTH_MEDICINE: 'salud', PSYCHOLOGY_SOCIAL: 'salud', BEAUTY_WELLNESS: 'salud', SPORTS_LEISURE: 'salud',
  HOSPITALITY_TOURISM: 'servicios', RETAIL: 'servicios', SECURITY_CLEANING: 'servicios',
  LOGISTICS_TRANSPORT: 'oficios', INDUSTRY_PRODUCTION: 'oficios', MAINTENANCE_TECHNICAL: 'oficios',
  ARCHITECTURE_CONSTRUCTION: 'oficios', AGRICULTURE_ENVIRONMENT: 'oficios',
  EDUCATION_TRAINING: 'educacion',
}

/** Categorías cuyas palabras inequívocas aparecen en el título. */
export function categoriesInTitle(title: string): string[] {
  const t = ` ${normalize(title).replace(/[^a-z0-9]+/g, ' ').trim()} `
  const found: string[] = []
  for (const [cat, words] of Object.entries(CATEGORY_WORDS)) {
    if (words.some((w) => t.includes(` ${w}`))) found.push(cat)
  }
  return found
}

export function categoryFinding(job: JobForExtras): Finding | null {
  const chosen = [job.category, job.category2].map((c) => String(c ?? '').trim()).filter(Boolean)
  // Sin categoría, o «Otros»: no hay nada con lo que comparar.
  if (!chosen.length || chosen.includes('OTHER')) return null
  const fromTitle = categoriesInTitle(String(job.title ?? ''))
  if (!fromTitle.length) return null
  // Si el título encaja con alguna de las categorías elegidas (o con una de su grupo), bien.
  const chosenGroups = new Set(chosen.map((c) => CATEGORY_GROUPS[c] ?? c))
  if (fromTitle.some((c) => chosen.includes(c) || chosenGroups.has(CATEGORY_GROUPS[c] ?? c))) return null
  return {
    code: 'CATEGORIA_INCOHERENTE',
    message: 'El título parece de otra categoría muy distinta de la elegida.',
    excerpt: `título de «${fromTitle[0]}» con categoría «${chosen[0]}»`,
  }
}

// ---------------------------------------------------------------------------
// Enlaces sospechosos
// ---------------------------------------------------------------------------

const SUSPICIOUS_TLDS = new Set(['zip', 'top'])

/** Hosts (en minúscula) de todos los enlaces que aparecen en un texto, incluidos los `href` de HTML. */
export function hostsIn(text: string): string[] {
  const hosts = new Set<string>()
  const add = (raw: string) => {
    const h = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/^[^@/]*@/, '').split(/[/?#:]/)[0]?.toLowerCase().replace(/\.+$/, '') ?? ''
    if (h) hosts.add(h)
  }
  for (const m of text.matchAll(/\bhttps?:\/\/[^\s"'<>()]+/gi)) add(m[0])
  // IPv6 entre corchetes
  for (const m of text.matchAll(/\bhttps?:\/\/(\[[0-9a-f:.]+\])/gi)) hosts.add(m[1].toLowerCase())
  // Sin esquema: www.algo.xx y dominios con los TLD vigilados o con xn--.
  for (const m of text.matchAll(/\b(?:www\.)[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/gi)) add(m[0])
  for (const m of text.matchAll(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:zip|top)\b/gi)) add(m[0])
  for (const m of text.matchAll(/\b(?:[a-z0-9-]+\.)*xn--[a-z0-9-]+(?:\.[a-z0-9-]+)*\b/gi)) add(m[0])
  return [...hosts]
}

const isNumericIp = (h: string): boolean =>
  /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || // 203.0.113.9
  /^\d{8,10}$/.test(h) || // 3405803977 (IP en decimal)
  /^0x[0-9a-f]{6,8}$/i.test(h) || // 0xCB007109
  /^\[[0-9a-f:.]+\]$/i.test(h) // IPv6

export function linkFinding(job: JobForExtras): Finding | null {
  const list = (v?: string[] | null) => (Array.isArray(v) ? v.join('\n') : '')
  // Texto CRUDO (no normalizado ni sin HTML): los enlaces de <a href="..."> cuentan.
  const raw = [
    job.description, list(job.responsibilities), list(job.requirements), list(job.nice_to_have), list(job.benefits),
    job.application_instructions, job.application_url, job.application_email, job.department,
  ].filter(Boolean).join('\n')
  for (const host of hostsIn(raw)) {
    const labels = host.split('.')
    if (isNumericIp(host)) return linkHit('dirección IP numérica', host)
    if (labels.some((l) => l.startsWith('xn--'))) return linkHit('dominio con caracteres codificados (xn--)', host)
    if (SUSPICIOUS_TLDS.has(labels[labels.length - 1])) return linkHit(`dominio .${labels[labels.length - 1]}`, host)
  }
  return null
}

const linkHit = (why: string, host: string): Finding => ({
  code: 'ENLACE_SOSPECHOSO',
  message: `Enlace sospechoso: ${why}.`,
  excerpt: `${why}: ${host}`.slice(0, 100),
})

// ---------------------------------------------------------------------------
// Conjunto
// ---------------------------------------------------------------------------

/** Hallazgos de las reglas adicionales que no necesitan consultar la base (todo menos el duplicado). */
export function reviewJobExtras(job: JobForExtras): Finding[] {
  const out: Finding[] = [...salaryFindings(job)]
  const cat = categoryFinding(job)
  if (cat) out.push(cat)
  const link = linkFinding(job)
  if (link) out.push(link)
  return out
}
