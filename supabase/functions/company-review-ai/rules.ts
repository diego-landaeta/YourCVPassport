// Reglas de la revisión automática de empresas (bolsa de empleo, fase 1, #6).
//
// Módulo PURO (sin Deno ni red) para poder probarlo con Node. La Edge Function
// (index.ts) carga los datos, llama a `reviewCompany` y decide qué hacer con el
// resultado. Aquí solo se juzga: nunca se aprueba nada desde este fichero.
//
// Un hallazgo `warn` pasa la empresa a revisión manual ('dudosa'); un `info` es
// solo contexto para quien revise. NO hay IA: son reglas deterministas. Ver
// `ReviewProvider` para el punto de extensión.
//
// ENDURECIDO (auditoría 29/10/2026, S3). Un resultado 'ok' (= se puede aprobar
// sola) exige TODO a la vez:
//   - país activo y identificador fiscal con patrón PROPIO del país (los países
//     sin patrón propio quedan 'dudosa': `tax_id_generic_pattern`),
//   - web propia indicada y el dominio del correo == dominio de la web (o un
//     subdominio de él),
//   - correo que NO sea de un proveedor gratuito ni desechable,
//   - ningún duplicado de NIF, correo o dominio en otra empresa (la que sea),
//   - sin palabras sospechosas ni datos poco creíbles.
// Cualquier duda es 'dudosa': un humano decide.

export type Severity = 'info' | 'warn'

export interface Finding {
  code: string
  severity: Severity
  message_es: string
  message_en: string
}

export interface CompanyForReview {
  id: string
  company_name: string | null
  legal_name: string | null
  tax_id: string | null
  country_code: string | null
  company_email: string | null
  website_url: string | null
  contact_name: string | null
  description: string | null
  industry: string | null
}

export interface OtherCompany {
  id: string
  company_name: string | null
  tax_id: string | null
  /** Opcional: ayuda a comparar identificadores con y sin prefijo de país (ES B123… = B123…). */
  country_code?: string | null
  company_email: string | null
  website_url: string | null
  status: string | null
}

/**
 * Punto de extensión para un proveedor de IA (hoy NO hay ninguno: la clave de
 * Gemini caducó y el proveedor es una decisión pendiente). Un proveedor recibe la
 * empresa y las demás y devuelve hallazgos EXTRA. Reglas de oro, que index.ts
 * hace cumplir:
 *   - solo puede AÑADIR hallazgos; un `info` no cambia el resultado y la IA nunca
 *     convierte una empresa 'dudosa' en 'ok';
 *   - si lanza una excepción, la revisión termina en 'error' (queda PENDING);
 *   - su `name` y `model` se guardan en company_ai_reviews.proveedor / modelo.
 * Para activarlo: implementar la interfaz, añadirlo a PROVIDERS en index.ts y
 * poner su clave como secreto de la Edge Function (nunca en VITE_*).
 */
export interface ReviewProvider {
  name: string
  model?: string
  review(company: CompanyForReview, others: OtherCompany[]): Promise<Finding[]>
}

const f = (code: string, severity: Severity, message_es: string, message_en: string): Finding => ({
  code,
  severity,
  message_es,
  message_en,
})

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Mayúsculas y sin separadores (espacios, puntos, guiones, barras). Conserva Ñ y &. */
export function normalizeTaxId(raw: string | null | undefined): string {
  return (raw ?? '').toUpperCase().replace(/[\s.\-/_]/g, '')
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const digitsOf = (s: string): number[] => s.split('').map((c) => Number(c))

// ---------------------------------------------------------------------------
// Identificador fiscal por país
// ---------------------------------------------------------------------------

type TaxCheck = (id: string) => boolean | string // true = bien; false/mensaje = mal

// España: CIF, NIF, NIE con dígito/letra de control.
const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

function esNif(id: string): boolean {
  const m = /^(\d{8})([A-Z])$/.exec(id)
  return !!m && NIF_LETTERS[Number(m[1]) % 23] === m[2]
}
function esNie(id: string): boolean {
  const m = /^([XYZ])(\d{7})([A-Z])$/.exec(id)
  if (!m) return false
  const n = Number(`${'XYZ'.indexOf(m[1])}${m[2]}`)
  return NIF_LETTERS[n % 23] === m[3]
}
function esCif(id: string): boolean {
  const m = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(id)
  if (!m) return false
  const d = digitsOf(m[2])
  const even = d[1] + d[3] + d[5]
  const odd = [d[0], d[2], d[4], d[6]].reduce((acc, x) => {
    const x2 = x * 2
    return acc + Math.floor(x2 / 10) + (x2 % 10)
  }, 0)
  const control = (10 - ((even + odd) % 10)) % 10
  const letter = 'JABCDEFGHI'[control]
  if ('PQRSNW'.includes(m[1])) return m[3] === letter
  if ('ABEH'.includes(m[1])) return m[3] === String(control)
  return m[3] === letter || m[3] === String(control)
}
function esKlm(id: string): boolean {
  return /^[KLM]\d{7}[A-Z]$/.test(id) // NIF especiales: solo formato
}

function arCuit(id: string): boolean {
  if (!/^\d{11}$/.test(id)) return false
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const d = digitsOf(id)
  const sum = w.reduce((acc, wi, i) => acc + wi * d[i], 0)
  let check = 11 - (sum % 11)
  if (check === 11) check = 0
  if (check === 10) return d[10] === 9 || d[10] === 4
  return d[10] === check
}

function clRut(id: string): boolean {
  const m = /^(\d{7,8})([0-9K])$/.exec(id)
  if (!m) return false
  let sum = 0
  let factor = 2
  for (let i = m[1].length - 1; i >= 0; i--) {
    sum += Number(m[1][i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const dv = 11 - (sum % 11)
  const expected = dv === 11 ? '0' : dv === 10 ? 'K' : String(dv)
  return m[2] === expected
}

function peRuc(id: string): boolean {
  if (!/^(10|15|16|17|20)\d{9}$/.test(id)) return false
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const d = digitsOf(id)
  const sum = w.reduce((acc, wi, i) => acc + wi * d[i], 0)
  let dv = 11 - (sum % 11)
  if (dv >= 10) dv -= 10
  return d[10] === dv
}

const re = (pattern: RegExp): TaxCheck => (id) => pattern.test(id)

/**
 * Patrones por país (sobre el identificador normalizado y, para la UE, sin el
 * prefijo de país). España, México, Argentina, Chile, Colombia y Perú con la
 * regla del identificador local; Europa con el formato del IVA/registro.
 */
const TAX_RULES: Record<string, { label: string; prefix?: string; check: TaxCheck }> = {
  ES: { label: 'CIF/NIF/NIE', prefix: 'ES', check: (id) => esCif(id) || esNif(id) || esNie(id) || esKlm(id) },
  MX: { label: 'RFC', check: re(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/) },
  AR: { label: 'CUIT', check: arCuit },
  CL: { label: 'RUT', check: clRut },
  CO: { label: 'NIT', check: re(/^\d{9,10}$/) },
  PE: { label: 'RUC', check: peRuc },
  DE: { label: 'USt-IdNr./Steuernummer', prefix: 'DE', check: re(/^\d{9}$/) },
  FR: { label: 'TVA/SIREN/SIRET', prefix: 'FR', check: re(/^(\d{9}|\d{14}|[A-Z0-9]{2}\d{9})$/) },
  IT: { label: 'Partita IVA', prefix: 'IT', check: re(/^\d{11}$/) },
  PT: { label: 'NIF/NIPC', prefix: 'PT', check: re(/^\d{9}$/) },
  IE: { label: 'VAT', prefix: 'IE', check: re(/^[A-Z0-9+*]{8,9}$/) },
  NL: { label: 'BTW/KvK', prefix: 'NL', check: re(/^(\d{9}B\d{2}|\d{8})$/) },
  BE: { label: 'BTW/TVA', prefix: 'BE', check: re(/^0?\d{9}$/) },
  CH: { label: 'UID/IVA', prefix: 'CHE', check: re(/^\d{9}(MWST|TVA|IVA)?$/) },
  AT: { label: 'UID', prefix: 'AT', check: re(/^U\d{8}$/) },
  PL: { label: 'NIP', prefix: 'PL', check: re(/^\d{10}$/) },
  SE: { label: 'Momsnr/Org.nr', prefix: 'SE', check: re(/^\d{10}(\d{2})?$/) },
  NO: { label: 'Org.nr', prefix: 'NO', check: re(/^\d{9}(MVA)?$/) },
  DK: { label: 'CVR', prefix: 'DK', check: re(/^\d{8}$/) },
  FI: { label: 'Y-tunnus/ALV', prefix: 'FI', check: re(/^\d{8}$/) },
  GR: { label: 'AFM', prefix: 'EL', check: re(/^\d{9}$/) },
  RO: { label: 'CUI', prefix: 'RO', check: re(/^\d{2,10}$/) },
  CZ: { label: 'DIČ/IČO', prefix: 'CZ', check: re(/^\d{8,10}$/) },
  HU: { label: 'Adószám', prefix: 'HU', check: re(/^\d{8}(\d{3})?$/) },
  GB: { label: 'VAT/Company number', prefix: 'GB', check: re(/^(\d{9}|\d{12}|GD\d{3}|HA\d{3}|[A-Z0-9]{8})$/) },
}

/** Países que tienen patrón propio de identificador fiscal. */
export function hasOwnTaxPattern(countryCode: string | null | undefined): boolean {
  return Object.prototype.hasOwnProperty.call(TAX_RULES, (countryCode ?? '').toUpperCase())
}

/** Valores de relleno típicos: todo el mismo carácter o secuencias obvias. */
function isPlaceholderTaxId(id: string): boolean {
  const body = id.replace(/^[A-Z]{0,3}(?=\d)/, '')
  if (/^(.)\1+$/.test(body)) return true // 00000000, AAAAAAAA
  return /^(0123456789|1234567890|123456789|12345678|1234567|987654321|87654321|0000000)/.test(body.replace(/[A-Z]$/, ''))
}

export function checkTaxId(countryCode: string | null, taxId: string | null): Finding[] {
  const id = normalizeTaxId(taxId)
  if (!id) {
    return [f('tax_id_missing', 'warn', 'No hay identificador fiscal.', 'There is no tax identifier.')]
  }
  const country = (countryCode ?? '').toUpperCase()
  const rule = TAX_RULES[country]
  if (!rule) {
    // Sin patrón PROPIO del país no se puede comprobar de verdad: nunca se
    // aprueba sola. Si además el formato genérico es dudoso, se dice.
    const generic = /^[A-Z0-9ÑÉ&]{5,20}$/.test(id)
    return [
      f(
        'tax_id_generic_pattern',
        'warn',
        country
          ? `No hay un patrón propio para el identificador fiscal de ${country}: no se puede comprobar automáticamente.`
          : 'No se puede comprobar el identificador fiscal sin país.',
        country
          ? `There is no own tax-id pattern for ${country}: it cannot be checked automatically.`
          : 'The tax identifier cannot be checked without a country.',
      ),
      ...(generic
        ? []
        : [f('tax_id_format', 'warn', 'El identificador fiscal no tiene un formato válido (5-20 letras o cifras).', 'The tax identifier does not look valid (5-20 letters or digits).')]),
    ]
  }
  if (isPlaceholderTaxId(id)) {
    return [f('tax_id_placeholder', 'warn', `El identificador fiscal «${taxId}» parece un valor de relleno.`, `The tax identifier "${taxId}" looks like a placeholder.`)]
  }
  const candidates = [id]
  if (rule.prefix && id.startsWith(rule.prefix)) candidates.push(id.slice(rule.prefix.length))
  if (candidates.some((c) => rule.check(c) === true)) return []
  return [
    f(
      'tax_id_format',
      'warn',
      `El identificador fiscal «${taxId}» no cumple el formato ${rule.label} de ${country}.`,
      `The tax identifier "${taxId}" does not match the ${rule.label} format for ${country}.`,
    ),
  ]
}

// ---------------------------------------------------------------------------
// Dominios: web, correo
// ---------------------------------------------------------------------------

export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.it',
  'outlook.com', 'outlook.es', 'live.com', 'live.com.mx', 'msn.com', 'yahoo.com', 'yahoo.es', 'yahoo.com.mx',
  'yahoo.com.ar', 'yahoo.fr', 'yahoo.co.uk', 'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
  'proton.me', 'protonmail.com', 'gmx.com', 'gmx.es', 'gmx.de', 'gmx.net', 'web.de', 'mail.com', 'zoho.com',
  'yandex.com', 'yandex.ru', 'mail.ru', 'qq.com', '163.com', 'terra.com', 'terra.es', 'telefonica.net',
  'wanadoo.fr', 'orange.fr', 'free.fr', 'libero.it', 'virgilio.it', 'tiscali.it', 'bol.com.br', 'uol.com.br',
])

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com',
  'trashmail.com', 'getnada.com', 'dispostable.com', 'sharklasers.com', 'maildrop.cc', 'throwawaymail.com',
  'fakeinbox.com', 'mintemail.com', 'emailondeck.com',
])

// Webs que no son «web propia de la empresa»: redes sociales y acortadores.
const NOT_OWN_WEBSITE = new Set([
  'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com', 'tiktok.com', 'youtube.com',
  'linktr.ee', 'bit.ly', 'tinyurl.com', 'wa.me', 'wix.com', 'wordpress.com', 'blogspot.com', 'sites.google.com',
  'docs.google.com', 'forms.gle', 'github.io', 'netlify.app', 'vercel.app', 'pages.dev', 'weebly.com', 'webflow.io',
  'wixsite.com', 'carrd.co', 'business.site', 'my.canva.site', 'notion.site', 'ow.ly', 'cutt.ly', 'is.gd',
])

const SECOND_LEVEL = new Set(['co', 'com', 'org', 'net', 'gob', 'gov', 'edu', 'ac', 'nom'])

/** Host en minúsculas y sin «www.», o null si no es una URL/host usable. */
export function hostOf(urlOrHost: string | null | undefined): string | null {
  const raw = (urlOrHost ?? '').trim()
  if (!raw) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    return host || null
  } catch {
    return null
  }
}

/** Dominio registrable aproximado (empresa.com, empresa.com.mx, empresa.co.uk). */
export function registrableDomain(host: string): string {
  const labels = host.split('.')
  if (labels.length <= 2) return host
  const tld = labels[labels.length - 1]
  const sld = labels[labels.length - 2]
  const take = tld.length === 2 && SECOND_LEVEL.has(sld) ? 3 : 2
  return labels.slice(-take).join('.')
}

export function emailDomain(email: string | null | undefined): string | null {
  const m = /@([^@\s]+)$/.exec((email ?? '').trim().toLowerCase())
  return m ? m[1] : null
}

// Marcas de correo gratuito: cubren sus variantes por país (hotmail.com.ar, yahoo.com.br...).
const FREE_EMAIL_BRANDS = new Set([
  'gmail', 'googlemail', 'hotmail', 'outlook', 'msn', 'yahoo', 'ymail', 'icloud', 'aol', 'protonmail',
  'proton', 'pm', 'gmx', 'zoho', 'yandex', 'mail', 'qq', 'terra', 'wanadoo', 'libero', 'tutanota', 'tuta', 'fastmail',
])

/** true si el host es de un proveedor de correo gratuito (lista exacta o marca conocida). */
export function isFreeEmailHost(host: string | null | undefined): boolean {
  if (!host) return false
  const h = host.toLowerCase()
  const root = registrableDomain(h)
  if (FREE_EMAIL_DOMAINS.has(h) || FREE_EMAIL_DOMAINS.has(root)) return true
  return FREE_EMAIL_BRANDS.has(root.split('.')[0])
}

const NAME_STOPWORDS = new Set([
  'sociedad', 'limitada', 'anonima', 'empresa', 'company', 'group', 'grupo', 'servicios', 'services',
  'solutions', 'soluciones', 'consulting', 'consultoria', 'international', 'internacional', 'holding',
  'gmbh', 'corp', 'corporation', 'limited', 'espana', 'spain', 'mexico', 'the',
])

function nameTokens(...names: Array<string | null>): string[] {
  const out = new Set<string>()
  for (const n of names) {
    for (const t of stripAccents((n ?? '').toLowerCase()).split(/[^a-z0-9]+/)) {
      if (t.length >= 4 && !NAME_STOPWORDS.has(t)) out.add(t)
    }
  }
  return [...out]
}

export function checkDomains(c: CompanyForReview): Finding[] {
  const out: Finding[] = []
  const mailHost = emailDomain(c.company_email)
  const webHost = hostOf(c.website_url)
  const hasWebsite = !!(c.website_url && c.website_url.trim())

  if (hasWebsite && (!webHost || !webHost.includes('.') || /^\d{1,3}(\.\d{1,3}){3}$/.test(webHost))) {
    out.push(f('website_invalid', 'warn', 'La web indicada no es una dirección válida de empresa.', 'The website is not a valid company address.'))
  }
  const webRoot = webHost ? registrableDomain(webHost) : null
  if (webRoot && NOT_OWN_WEBSITE.has(webRoot)) {
    out.push(f('website_not_own', 'warn', `La web (${webRoot}) es una red social o un servicio compartido, no una web propia.`, `The website (${webRoot}) is a social network or shared service, not an own website.`))
  }

  // Sin web propia no hay nada con lo que comparar el dominio del correo: no se
  // aprueba sola (con correo gratuito se avisa además con su propio código).
  if (!hasWebsite) {
    out.push(f('website_missing', 'warn', 'La empresa no indica web: no se puede comprobar que el dominio del correo sea suyo.', 'The company has no website: the email domain cannot be checked.'))
  }
  // Dominios con caracteres internacionales codificados (xn--): posible suplantación visual.
  const isIdn = (h: string | null) => !!h && h.split('.').some((l) => l.startsWith('xn--'))

  if (mailHost) {
    const mailRoot = registrableDomain(mailHost)
    if (isIdn(mailHost) || isIdn(webHost)) {
      out.push(f('domain_idn', 'warn', 'El dominio usa caracteres internacionales codificados (xn--): puede imitar a otro.', 'The domain uses encoded international characters (xn--): it may imitate another.'))
    }
    if (DISPOSABLE_EMAIL_DOMAINS.has(mailRoot)) {
      out.push(f('email_disposable', 'warn', `El correo usa un dominio desechable (${mailRoot}).`, `The email uses a disposable domain (${mailRoot}).`))
    } else if (isFreeEmailHost(mailHost)) {
      if (hasWebsite) {
        out.push(f('free_email_with_website', 'warn', `Web propia (${webHost ?? c.website_url}) con correo gratuito (${mailHost}).`, `Own website (${webHost ?? c.website_url}) with a free email (${mailHost}).`))
      } else {
        out.push(f('free_email_no_website', 'warn', `Correo gratuito (${mailHost}) y sin web: no hay forma de comprobar la empresa.`, `Free email (${mailHost}) and no website: the company cannot be checked.`))
      }
    } else if (webRoot && !NOT_OWN_WEBSITE.has(webRoot) && webRoot !== mailRoot) {
      // El dominio del correo tiene que ser el de la web o un subdominio suyo.
      out.push(f('domain_mismatch', 'warn', `El dominio de la web (${webRoot}) y el del correo (${mailRoot}) no coinciden.`, `The website domain (${webRoot}) and the email domain (${mailRoot}) do not match.`))
    }

    // Coherencia nombre / dominio (solo informativo: marcas con dominios distintos existen).
    const label = (webRoot ?? registrableDomain(mailHost)).split('.')[0]
    if (!isFreeEmailHost(mailHost) && label) {
      const tokens = nameTokens(c.company_name, c.legal_name)
      const nameBlob = stripAccents(`${c.company_name ?? ''}${c.legal_name ?? ''}`.toLowerCase()).replace(/[^a-z0-9]/g, '')
      const coherent = tokens.some((t) => label.includes(t) || t.includes(label)) || (label.length >= 3 && nameBlob.includes(label))
      if (!coherent && tokens.length > 0) {
        out.push(f('name_not_in_domain', 'info', `El nombre de la empresa no aparece en el dominio (${label}).`, `The company name does not appear in the domain (${label}).`))
      }
    }
  } else {
    out.push(f('email_invalid', 'warn', 'El correo de la empresa no es válido.', 'The company email is not valid.'))
  }
  return out
}

// ---------------------------------------------------------------------------
// Duplicados / denunciados
// ---------------------------------------------------------------------------

/**
 * Identificador comparable: normalizado y sin el prefijo de país de la UE (ES B1234… == B1234…).
 * Para duplicados se quita el prefijo del país indicado; si no se conoce el país de la otra
 * empresa se usa el de la que se revisa.
 */
export function canonicalTaxId(countryCode: string | null | undefined, taxId: string | null | undefined): string {
  const id = normalizeTaxId(taxId)
  const prefix = TAX_RULES[(countryCode ?? '').toUpperCase()]?.prefix
  return prefix && id.startsWith(prefix) && id.length > prefix.length ? id.slice(prefix.length) : id
}

const FLAGGED_STATUSES = new Set(['REJECTED', 'SUSPENDED'])
const shortId = (id: string) => id.slice(0, 8)

export function checkDuplicates(c: CompanyForReview, others: OtherCompany[]): Finding[] {
  const out: Finding[] = []
  const taxId = canonicalTaxId(c.country_code, c.tax_id)
  const email = (c.company_email ?? '').trim().toLowerCase()
  const mailHost = emailDomain(c.company_email)
  const myDomains = new Set<string>()
  const webHost = hostOf(c.website_url)
  if (webHost) myDomains.add(registrableDomain(webHost))
  if (mailHost && !isFreeEmailHost(mailHost)) {
    myDomains.add(registrableDomain(mailHost))
  }
  for (const d of [...myDomains]) if (NOT_OWN_WEBSITE.has(d)) myDomains.delete(d)

  const byTax: OtherCompany[] = []
  const byEmail: OtherCompany[] = []
  const byDomain: OtherCompany[] = []
  for (const o of others) {
    if (o.id === c.id) continue
    if (taxId && canonicalTaxId(o.country_code ?? c.country_code, o.tax_id) === taxId) byTax.push(o)
    if (email && (o.company_email ?? '').trim().toLowerCase() === email) byEmail.push(o)
    const oDomains = new Set<string>()
    const oWeb = hostOf(o.website_url)
    if (oWeb) oDomains.add(registrableDomain(oWeb))
    const oMail = emailDomain(o.company_email)
    if (oMail && !isFreeEmailHost(oMail)) oDomains.add(registrableDomain(oMail))
    if ([...myDomains].some((d) => oDomains.has(d))) byDomain.push(o)
  }

  const describe = (list: OtherCompany[]) =>
    list.map((o) => `${shortId(o.id)} (${o.status ?? '?'})`).join(', ')

  if (byTax.length) {
    out.push(f('duplicate_tax_id', 'warn', `Ya hay ${byTax.length} empresa(s) con el mismo identificador fiscal: ${describe(byTax)}.`, `${byTax.length} other company(ies) already use the same tax identifier: ${describe(byTax)}.`))
  }
  if (byEmail.length) {
    out.push(f('duplicate_email', 'warn', `Ya hay ${byEmail.length} empresa(s) con el mismo correo: ${describe(byEmail)}.`, `${byEmail.length} other company(ies) already use the same email: ${describe(byEmail)}.`))
  }
  if (byDomain.length) {
    out.push(f('duplicate_domain', 'warn', `Ya hay ${byDomain.length} empresa(s) con el mismo dominio: ${describe(byDomain)}.`, `${byDomain.length} other company(ies) already use the same domain: ${describe(byDomain)}.`))
  }
  const flagged = [...byTax, ...byEmail, ...byDomain].filter((o) => FLAGGED_STATUSES.has(o.status ?? ''))
  if (flagged.length) {
    out.push(f('duplicate_flagged', 'warn', `Coincide con empresas ya rechazadas o suspendidas: ${describe(flagged)}.`, `Matches companies that were already rejected or suspended: ${describe(flagged)}.`))
  }
  return out
}

// ---------------------------------------------------------------------------
// Palabras sospechosas y calidad de los datos
// ---------------------------------------------------------------------------

// Aparecen en cualquier texto (nombre, descripción, sector, web).
const SUSPICIOUS_TERMS = [
  'casino', 'apuestas', 'betting', 'poker', 'porn', 'porno', 'xxx', 'escort', 'viagra', 'cialis',
  'dinero facil', 'dinero rapido', 'gana dinero', 'ganar dinero rapido', 'ingresos garantizados', 'inversion garantizada',
  'piramide', 'piramidal', 'multinivel', 'mlm', 'network marketing', 'opciones binarias', 'binary options',
  'get rich', 'make money fast', 'easy money', 'guaranteed income', 'work from home and earn',
  'western union', 'moneygram', 'pago por adelantado', 'upfront fee', 'registration fee', 'tasa de inscripcion',
  'envia dinero', 'send money', 'wire transfer', 'lorem ipsum',
]
// Solo en el nombre: señales de empresa de pruebas o inventada.
const SUSPICIOUS_NAME_TERMS = ['test', 'testing', 'prueba', 'fake', 'asdf', 'qwerty', 'lorem', 'xxxx']

const wordRe = (term: string) => new RegExp(`(?:^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z0-9]|$)`)

export function checkSuspicious(c: CompanyForReview): Finding[] {
  const out: Finding[] = []
  const norm = (s: string | null) => stripAccents((s ?? '').toLowerCase())
  const names = `${norm(c.company_name)} | ${norm(c.legal_name)}`
  const all = `${names} | ${norm(c.description)} | ${norm(c.industry)} | ${norm(c.website_url)}`

  const hits = SUSPICIOUS_TERMS.filter((t) => wordRe(t).test(all))
  const nameHits = SUSPICIOUS_NAME_TERMS.filter((t) => wordRe(t).test(names))
  const found = [...new Set([...hits, ...nameHits])]
  if (found.length) {
    out.push(f('suspicious_terms', 'warn', `Palabras sospechosas en los datos: ${found.join(', ')}.`, `Suspicious words in the data: ${found.join(', ')}.`))
  }

  const name = (c.company_name ?? '').trim()
  const legal = (c.legal_name ?? '').trim()
  const badName = (n: string) => n.length < 2 || /^[\d\W_]+$/.test(n) || /(.)\1{4,}/.test(n)
  if (badName(name) || badName(legal)) {
    out.push(f('name_quality', 'warn', 'El nombre comercial o la razón social no parecen reales.', 'The trade name or legal name does not look real.'))
  }
  const contact = (c.contact_name ?? '').trim()
  if (contact && (contact.length < 3 || /^[\d\W_]+$/.test(contact) || /(.)\1{3,}/.test(contact))) {
    out.push(f('contact_quality', 'warn', 'El nombre de contacto no parece real.', 'The contact name does not look real.'))
  }
  return out
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

export function checkCountry(c: CompanyForReview, activeCountries: Set<string> | null): Finding[] {
  const code = (c.country_code ?? '').toUpperCase()
  if (!code) return [f('country_missing', 'warn', 'La empresa no indica país.', 'The company has no country.')]
  if (activeCountries && !activeCountries.has(code)) {
    return [f('country_inactive', 'warn', `El país ${code} no está entre los países activos.`, `The country ${code} is not among the active countries.`)]
  }
  return []
}

export function reviewCompany(
  c: CompanyForReview,
  others: OtherCompany[],
  activeCountries: Set<string> | null = null,
): { resultado: 'ok' | 'dudosa'; motivos: Finding[] } {
  const motivos = [
    ...checkCountry(c, activeCountries),
    ...checkTaxId(c.country_code, c.tax_id),
    ...checkDomains(c),
    ...checkDuplicates(c, others),
    ...checkSuspicious(c),
  ]
  return { resultado: motivos.some((m) => m.severity === 'warn') ? 'dudosa' : 'ok', motivos }
}
