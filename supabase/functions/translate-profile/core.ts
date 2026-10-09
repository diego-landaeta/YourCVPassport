// Lógica pura de translate-profile (sin Deno ni red): se puede probar en Node.
//
// Varias funciones son COPIA EXACTA de código del frontend, porque la caché
// `profile_translations` la escribe el servidor pero la lee y valida el
// navegador. Si cambian allí, hay que cambiarlas aquí:
//   - generateContentHash / simpleHash ... services/translation/cache/databaseCache.ts
//   - extractTranslatedContent .......... services/translation/cache/databaseCache.ts
//   - extractTranslatableTexts .......... hooks/useTranslatedProfile.ts
//   - detectSourceLanguage .............. services/translation/translationService.ts
//   - hashText (caché text_translations)  services/translation/cache/dbTextCache.ts
//                                         (y supabase/functions/translate-texts)
// Si el hash no coincidiera, no se rompe nada: el navegador vería la entrada
// como obsoleta y traduciría él mismo (sin caché compartida).

export type Lang = 'es' | 'en'
export const SUPPORTED_LANGS: readonly Lang[] = ['es', 'en']

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>

/** Misma forma que monta components/pages/ProfileViewPage.tsx */
export interface ProfileData {
  profile: Row
  experiences: Row[]
  education: Row[]
  skills: Row[]
  portfolioItems: Row[]
  portfolio: Row[]
  certifications: Row[]
}

export interface TranslatedProfileContent {
  profile: { headline?: string | null; summary?: string | null }
  experiences: Array<{ id: string; position?: string | null; description?: string | null; achievements?: (string | null)[] }>
  education: Array<{ id: string; degree?: string | null; field_of_study?: string | null; description?: string | null; grade?: string | null }>
  portfolioItems?: Array<{ id: string; title?: string | null; description?: string | null }>
  portfolio?: Array<{ id: string; title?: string | null; description?: string | null }>
  skills: Array<{ id: string; name: string }>
  certifications?: Array<{ id: string; name?: string | null; title?: string | null; description?: string | null }>
}

/** Monta ProfileData igual que ProfileViewPage a partir de las filas. */
export function buildProfileData(profile: Row, experiences: Row[], education: Row[], skills: Row[], portfolioItems: Row[]): ProfileData {
  const items = portfolioItems || []
  return {
    profile,
    experiences: experiences || [],
    education: education || [],
    skills: skills || [],
    portfolioItems: items,
    portfolio: items.filter((item) => item.type === 'PROJECT' || !item.type),
    certifications: items.filter((item) => item.type === 'CERTIFICATION'),
  }
}

// ---------------------------------------------------------------------------
// Hash del contenido (copia de databaseCache.ts)
// ---------------------------------------------------------------------------
function simpleHash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export function generateContentHash(profileData: ProfileData): string {
  const contentParts: string[] = []

  contentParts.push(profileData.profile.headline || '')
  contentParts.push(profileData.profile.summary || '')

  const sortedExperiences = [...(profileData.experiences || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  )
  sortedExperiences.forEach((exp) => {
    contentParts.push(exp.id || '')
    contentParts.push(exp.position || '')
    contentParts.push(exp.description || '')
    ;(exp.achievements || []).forEach((a: string | null) => contentParts.push(a || ''))
  })

  const sortedEducation = [...(profileData.education || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  )
  sortedEducation.forEach((edu) => {
    contentParts.push(edu.id || '')
    contentParts.push(edu.degree || '')
    contentParts.push(edu.field_of_study || '')
    contentParts.push(edu.description || '')
    contentParts.push(edu.grade || '')
  })

  const sortedPortfolio = [...(profileData.portfolioItems || profileData.portfolio || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  )
  sortedPortfolio.forEach((item) => {
    contentParts.push(item.id || '')
    contentParts.push(item.title || '')
    contentParts.push(item.description || '')
  })

  const sortedSkills = [...(profileData.skills || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  )
  sortedSkills.forEach((skill) => {
    contentParts.push(skill.id || '')
    contentParts.push(skill.name || '')
  })

  const sortedCertifications = [...(profileData.certifications || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  )
  sortedCertifications.forEach((cert) => {
    contentParts.push(cert.id || '')
    contentParts.push(cert.name || '')
    contentParts.push(cert.title || '')
    contentParts.push(cert.description || '')
  })

  return simpleHash(contentParts.join('|'))
}

// ---------------------------------------------------------------------------
// Textos a traducir (copia de useTranslatedProfile.extractTranslatableTexts)
// ---------------------------------------------------------------------------
export function extractTranslatableTexts(data: ProfileData): string[] {
  const texts: string[] = []

  if (data.profile.headline) texts.push(data.profile.headline)
  if (data.profile.summary) texts.push(data.profile.summary)

  data.experiences?.forEach((exp) => {
    if (exp.position) texts.push(exp.position)
    if (exp.description) texts.push(exp.description)
    exp.achievements?.forEach((a: string | null) => a && texts.push(a))
  })

  data.education?.forEach((edu) => {
    if (edu.degree) texts.push(edu.degree)
    if (edu.field_of_study) texts.push(edu.field_of_study)
    if (edu.description) texts.push(edu.description)
    if (edu.grade) texts.push(edu.grade)
  })

  data.portfolioItems?.forEach((item) => {
    if (item.title) texts.push(item.title)
    if (item.description) texts.push(item.description)
  })

  data.portfolio?.forEach((item) => {
    if (item.title) texts.push(item.title)
    if (item.description) texts.push(item.description)
  })

  data.skills?.forEach((skill) => {
    if (skill.name) texts.push(skill.name)
  })

  data.certifications?.forEach((cert) => {
    if (cert.name) texts.push(cert.name)
    if (cert.title) texts.push(cert.title)
    if (cert.description) texts.push(cert.description)
  })

  return texts.filter((t) => typeof t === 'string' && t.trim() !== '')
}

// ---------------------------------------------------------------------------
// Detección de idioma (copia de translationService.detectSourceLanguage)
// ---------------------------------------------------------------------------
export function detectSourceLanguage(text: string): Lang {
  if (!text || text.trim() === '') return 'en'

  const spanishIndicators = /[áéíóúüñ¿¡]/i
  if (spanishIndicators.test(text)) {
    return 'es'
  }

  const spanishOnlyWords = /\b(el|la|los|las|del|que|una|uno|pero|este|esta|estos|estas|tiene|hace|muy|mucho|poco|mejor|peor|nuevo|viejo|bueno|malo|cada|otro|mismo|todo|nada|algo|alguien|nadie|cual|quien|donde|cuando|cuanto|porque|aunque|mientras|sino|tambien|ademas|incluso|aun|todavia|apenas|casi|bastante|demasiado|tanto|desde|hacia|hasta|mediante|dentro|fuera|cerca|lejos|antes|despues|siempre|nunca|bien|mal|mayor|menor)\b/i

  const spanishUniqueWords = /\b(ingeniero|ingeniera|arquitecto|arquitecta|abogado|abogada|medico|medica|profesor|profesora|maestro|maestra|contador|contadora|gerente|jefe|jefa|supervisor|supervisora|coordinador|coordinadora|consultor|consultora|especialista|tecnico|tecnica|programador|programadora|desarrollador|desarrolladora|vendedor|vendedora|ejecutivo|ejecutiva|asistente|secretario|secretaria|administrador|administradora|financiero|financiera|recursos|humanos|informatica|comunicaciones|operaciones|produccion|calidad|logistica|compras|proyectos|mantenimiento|seguridad|ambiental|mecanico|mecanica|electrico|electrica|quimico|quimica|biologo|biologa|psicologo|psicologa|sociologo|sociologa|economista|auditor|auditora|investigador|investigadora|cientifico|cientifica|renovable|sostenible|residencial|fotovoltaica|termicas|climatizacion|refrigeracion|edificacion|construccion|obras|instalaciones|normativa|regulaciones|eficiencia|energetica|gestion|planificacion|supervision|inspeccion|certificacion|homologacion|diseno|dibujo|planos|presupuestos|licitaciones|contratacion|subcontratacion|proveedores|clientes|usuarios|pacientes|estudiantes|alumnos|empleados|trabajadores|equipo|departamento|seccion|unidad|sede|oficina|planta|fabrica|almacen|bodega|taller|laboratorio|clinica|escuela|colegio|instituto|facultad|agencia|corporacion|grupo|filial|sucursal|matriz|negocio|comercio|tienda|establecimiento|inmueble|propiedad|terreno|parcela|lote|vivienda|apartamento|piso|edificio|torre|complejo|urbanizacion|barrio|colonia|zona|provincia|pais|publico|privado|mixto|comunitario|cooperativo|asociativo|sindical|gremial|profesional|academico|educativo|deportivo|recreativo|turistico|hotelero|restaurante|gastronomico|culinario|alimenticio|agricola|ganadero|pesquero|minero|petrolero|energetico|hidraulico|eolico|geotermico|biomasa|biogas|biocombustible|reciclaje|residuos|desechos|contaminacion|emision|vertido|impacto|evaluacion|estudio|informe|reporte|diagnostico|analisis|sintesis|recomendacion|propuesta|solucion|alternativa|opcion|estrategia|tactica|metodologia|procedimiento|proceso|patron|estandar|norma|ley|decreto|resolucion|acuerdo|convenio|contrato|clausula|parrafo|inciso|anexo|apendice|trabajo|empresa|desarrollo|experiencia|habilidades|sobre|entre)\b/i

  const words = text.toLowerCase().split(/\s+/)
  let spanishWordCount = 0
  for (const word of words) {
    if (spanishOnlyWords.test(word) || spanishUniqueWords.test(word)) {
      spanishWordCount++
    }
  }

  const threshold = text.length < 50 ? 1 : 2
  if (spanishWordCount >= threshold) {
    return 'es'
  }
  return 'en'
}

/**
 * Qué textos hay que traducir para mostrar el perfil en `targetLang`, igual que
 * useTranslatedProfile: los detectados en el otro idioma, recortados y únicos.
 */
export function textsToTranslate(data: ProfileData, targetLang: Lang): { sourceLang: Lang; texts: string[] } {
  const sourceLang: Lang = targetLang === 'en' ? 'es' : 'en'
  const all = extractTranslatableTexts(data)
  const selected = all.filter((t) => detectSourceLanguage(t) === sourceLang)
  const texts = Array.from(new Set(selected.map((t) => t.trim()))).filter((t) => t !== '')
  return { sourceLang, texts }
}

// ---------------------------------------------------------------------------
// Contenido cacheado (copia de databaseCache.extractTranslatedContent). Única
// diferencia: busca también por el texto recortado (el mapa de traducciones se
// indexa recortado), así un texto con espacios al final también se traduce.
// ---------------------------------------------------------------------------
export function extractTranslatedContent(
  profileData: ProfileData,
  translations: Map<string, string>,
  translatedSkills: Array<{ id: string; name: string }>
): TranslatedProfileContent {
  const getTranslation = (text: string | null | undefined): string | null | undefined => {
    if (!text) return text
    return translations.get(text) || translations.get(text.trim()) || text
  }

  return {
    profile: {
      headline: getTranslation(profileData.profile.headline),
      summary: getTranslation(profileData.profile.summary),
    },
    experiences: (profileData.experiences || []).map((exp) => ({
      id: exp.id || '',
      position: getTranslation(exp.position),
      description: getTranslation(exp.description),
      achievements: exp.achievements?.map((a: string | null) => getTranslation(a) || a),
    })),
    education: (profileData.education || []).map((edu) => ({
      id: edu.id || '',
      degree: getTranslation(edu.degree),
      field_of_study: getTranslation(edu.field_of_study),
      description: getTranslation(edu.description),
      grade: getTranslation(edu.grade),
    })),
    portfolioItems: profileData.portfolioItems?.map((item) => ({
      id: item.id || '',
      title: getTranslation(item.title),
      description: getTranslation(item.description),
    })),
    portfolio: profileData.portfolio?.map((item) => ({
      id: item.id || '',
      title: getTranslation(item.title),
      description: getTranslation(item.description),
    })),
    skills: translatedSkills.map((s) => ({ id: s.id || '', name: s.name })),
    certifications: (profileData.certifications || []).map((cert) => ({
      id: cert.id || '',
      name: cert.name ? (getTranslation(cert.name) || cert.name) : cert.name,
      title: cert.title ? (getTranslation(cert.title) || cert.title) : cert.title,
      description: getTranslation(cert.description),
    })),
  }
}

// ---------------------------------------------------------------------------
// Hash de la caché de textos (idéntico a dbTextCache.ts y translate-texts)
// ---------------------------------------------------------------------------
export function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

// ---------------------------------------------------------------------------
// Proveedores de traducción (mismos que translate-texts: gtx + MyMemory).
// `fetchImpl` inyectable para las pruebas.
// ---------------------------------------------------------------------------
type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>

const GOOGLE_CHUNK = 1000
const MYMEMORY_CHUNK = 450

export function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text]
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining)
      break
    }
    const area = remaining.substring(0, maxLength)
    let splitAt = maxLength
    const sentenceEnd = Math.max(area.lastIndexOf('. '), area.lastIndexOf('! '), area.lastIndexOf('? '), area.lastIndexOf('\n'))
    if (sentenceEnd > maxLength * 0.5) {
      splitAt = sentenceEnd + 1
    } else {
      const lastSpace = area.lastIndexOf(' ')
      if (lastSpace > maxLength * 0.5) splitAt = lastSpace + 1
    }
    chunks.push(remaining.substring(0, splitAt))
    remaining = remaining.substring(splitAt)
  }
  return chunks
}

async function fetchWithTimeout(fetchImpl: FetchLike, url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetchImpl(url, { signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

async function googleChunk(fetchImpl: FetchLike, text: string, sl: Lang, tl: Lang): Promise<string> {
  const params = new URLSearchParams({ client: 'gtx', sl, tl, dt: 't', q: text })
  const res = await fetchWithTimeout(fetchImpl, `https://translate.googleapis.com/translate_a/single?${params}`, 10000)
  if (!res.ok) throw new Error(`google ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data?.[0])) throw new Error('google: formato inesperado')
  const out = (data[0] as unknown[])
    .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
    .join('')
  if (!out) throw new Error('google: vacío')
  return out
}

async function myMemoryChunk(fetchImpl: FetchLike, text: string, sl: Lang, tl: Lang): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair: `${sl}|${tl}`, de: 'api@yourcvpassport.com' })
  const res = await fetchWithTimeout(fetchImpl, `https://api.mymemory.translated.net/get?${params}`, 10000)
  if (!res.ok) throw new Error(`mymemory ${res.status}`)
  const data = await res.json()
  if (data?.responseStatus !== 200 || typeof data?.responseData?.translatedText !== 'string') {
    throw new Error(`mymemory ${data?.responseStatus}`)
  }
  return data.responseData.translatedText
}

/** Traduce un texto; null si fallan los dos proveedores. */
export async function translateOne(fetchImpl: FetchLike, text: string, sl: Lang, tl: Lang): Promise<string | null> {
  try {
    const parts = splitIntoChunks(text, GOOGLE_CHUNK)
    const out: string[] = []
    for (const p of parts) out.push(await googleChunk(fetchImpl, p, sl, tl))
    return out.join('')
  } catch (_e) {
    // Respaldo: MyMemory
  }
  try {
    const parts = splitIntoChunks(text, MYMEMORY_CHUNK)
    const out: string[] = []
    for (const p of parts) out.push(await myMemoryChunk(fetchImpl, p, sl, tl))
    return out.join(' ')
  } catch (_e) {
    return null
  }
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
