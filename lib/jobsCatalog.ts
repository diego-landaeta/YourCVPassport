/**
 * Catalogo de la bolsa de empleo: valores que se guardan en `job_postings` y sus
 * etiquetas es/en. Lo comparten el listado publico, la ficha, el panel del candidato
 * y (por contrato) el asistente de ofertas de la empresa: los VALORES (claves) son
 * los de la base de datos; si cambian aqui, cambian en los filtros y en las alertas.
 *
 * Categorias: lista provisional de ~30 (la de la especificacion de Manuel no esta en
 * el repo). Se guardan como texto en `job_postings.category` / `category2` y en
 * `job_alert_subscriptions.categories`.
 */

export type JobLang = 'es' | 'en';
export type Bilingual = { es: string; en: string };

export const JOB_CATEGORIES: ReadonlyArray<{ key: string; label: Bilingual }> = [
  { key: 'ADMINISTRATION', label: { es: 'Administración y secretariado', en: 'Administration and office support' } },
  { key: 'ACCOUNTING_FINANCE', label: { es: 'Contabilidad y finanzas', en: 'Accounting and finance' } },
  { key: 'BANKING_INSURANCE', label: { es: 'Banca y seguros', en: 'Banking and insurance' } },
  { key: 'CUSTOMER_SERVICE', label: { es: 'Atención al cliente', en: 'Customer service' } },
  { key: 'SALES', label: { es: 'Comercial y ventas', en: 'Sales and business development' } },
  { key: 'MARKETING', label: { es: 'Marketing y publicidad', en: 'Marketing and advertising' } },
  { key: 'COMMUNICATION', label: { es: 'Comunicación y periodismo', en: 'Communication and journalism' } },
  { key: 'HUMAN_RESOURCES', label: { es: 'Recursos humanos', en: 'Human resources' } },
  { key: 'LEGAL', label: { es: 'Legal y jurídico', en: 'Legal' } },
  { key: 'IT_SOFTWARE', label: { es: 'Informática y desarrollo', en: 'IT and software development' } },
  { key: 'DATA_AI', label: { es: 'Datos e inteligencia artificial', en: 'Data and artificial intelligence' } },
  { key: 'DESIGN_CREATIVE', label: { es: 'Diseño y creatividad', en: 'Design and creative' } },
  { key: 'ENGINEERING', label: { es: 'Ingeniería', en: 'Engineering' } },
  { key: 'ARCHITECTURE_CONSTRUCTION', label: { es: 'Arquitectura y construcción', en: 'Architecture and construction' } },
  { key: 'INDUSTRY_PRODUCTION', label: { es: 'Industria y producción', en: 'Industry and production' } },
  { key: 'MAINTENANCE_TECHNICAL', label: { es: 'Mantenimiento y oficios técnicos', en: 'Maintenance and skilled trades' } },
  { key: 'LOGISTICS_TRANSPORT', label: { es: 'Logística, almacén y transporte', en: 'Logistics, warehouse and transport' } },
  { key: 'PURCHASING_SUPPLY', label: { es: 'Compras y cadena de suministro', en: 'Purchasing and supply chain' } },
  { key: 'HEALTH_MEDICINE', label: { es: 'Sanidad y medicina', en: 'Healthcare and medicine' } },
  { key: 'PSYCHOLOGY_SOCIAL', label: { es: 'Psicología y trabajo social', en: 'Psychology and social work' } },
  { key: 'EDUCATION_TRAINING', label: { es: 'Educación y formación', en: 'Education and training' } },
  { key: 'HOSPITALITY_TOURISM', label: { es: 'Hostelería y turismo', en: 'Hospitality and tourism' } },
  { key: 'RETAIL', label: { es: 'Comercio y retail', en: 'Retail' } },
  { key: 'REAL_ESTATE', label: { es: 'Inmobiliaria', en: 'Real estate' } },
  { key: 'BEAUTY_WELLNESS', label: { es: 'Estética, belleza y bienestar', en: 'Beauty and wellness' } },
  { key: 'SPORTS_LEISURE', label: { es: 'Deporte y ocio', en: 'Sports and leisure' } },
  { key: 'AGRICULTURE_ENVIRONMENT', label: { es: 'Agricultura y medio ambiente', en: 'Agriculture and environment' } },
  { key: 'SECURITY_CLEANING', label: { es: 'Seguridad y limpieza', en: 'Security and cleaning' } },
  { key: 'PUBLIC_NGO', label: { es: 'Administración pública y ONG', en: 'Public sector and NGOs' } },
  { key: 'OTHER', label: { es: 'Otros', en: 'Other' } },
];

export const CONTRACT_TYPES: ReadonlyArray<{ key: string; label: Bilingual }> = [
  { key: 'INDEFINITE', label: { es: 'Indefinido', en: 'Permanent' } },
  { key: 'TEMPORARY', label: { es: 'Temporal', en: 'Temporary' } },
  { key: 'PROJECT', label: { es: 'Obra o proyecto', en: 'Project-based' } },
  { key: 'INTERNSHIP', label: { es: 'Prácticas', en: 'Internship' } },
  { key: 'TRAINING', label: { es: 'Formación', en: 'Training contract' } },
  { key: 'FREELANCE', label: { es: 'Autónomo', en: 'Freelance' } },
  { key: 'VOLUNTEER', label: { es: 'Voluntariado', en: 'Volunteer' } },
];

export const SCHEDULES: ReadonlyArray<{ key: string; label: Bilingual }> = [
  { key: 'FULL_TIME', label: { es: 'Jornada completa', en: 'Full time' } },
  { key: 'PART_TIME', label: { es: 'Jornada parcial', en: 'Part time' } },
  { key: 'HOURLY', label: { es: 'Por horas', en: 'By the hour' } },
];

export const WORK_MODES: ReadonlyArray<{ key: string; label: Bilingual }> = [
  { key: 'ONSITE', label: { es: 'Presencial', en: 'On-site' } },
  { key: 'HYBRID', label: { es: 'Híbrido', en: 'Hybrid' } },
  { key: 'REMOTE', label: { es: 'Remoto', en: 'Remote' } },
];

/** Formacion minima (job_postings.education_min). Mismos codigos que el asistente de ofertas. */
export const EDUCATION_LEVELS: ReadonlyArray<{ key: string; label: Bilingual }> = [
  { key: 'NONE', label: { es: 'Sin requisito', en: 'No requirement' } },
  { key: 'SECONDARY', label: { es: 'Educación secundaria', en: 'Secondary education' } },
  { key: 'VOCATIONAL', label: { es: 'Formación profesional / técnico', en: 'Vocational / technical' } },
  { key: 'BACHELOR', label: { es: 'Grado o licenciatura', en: 'Bachelor’s degree' } },
  { key: 'MASTER', label: { es: 'Máster o posgrado', en: 'Master’s or postgraduate' } },
  { key: 'DOCTORATE', label: { es: 'Doctorado', en: 'Doctorate' } },
];

/** Antiguedad de la publicacion (dias) para el filtro de fecha. */
export const POSTED_WITHIN: ReadonlyArray<{ days: number; label: Bilingual }> = [
  { days: 1, label: { es: 'Últimas 24 horas', en: 'Last 24 hours' } },
  { days: 7, label: { es: 'Últimos 7 días', en: 'Last 7 days' } },
  { days: 30, label: { es: 'Últimos 30 días', en: 'Last 30 days' } },
];

export interface JobCountry {
  code: string;
  name_es: string;
  name_en: string;
  currency: string;
}

/**
 * Paises de la tabla `countries` (migracion 20261030). Es la copia de respaldo: el
 * selector usa la tabla si responde y esta lista si no (o antes de aplicar la migracion).
 */
export const FALLBACK_COUNTRIES: ReadonlyArray<JobCountry> = [
  { code: 'ES', name_es: 'España', name_en: 'Spain', currency: 'EUR' },
  { code: 'MX', name_es: 'México', name_en: 'Mexico', currency: 'MXN' },
  { code: 'AR', name_es: 'Argentina', name_en: 'Argentina', currency: 'ARS' },
  { code: 'CL', name_es: 'Chile', name_en: 'Chile', currency: 'CLP' },
  { code: 'CO', name_es: 'Colombia', name_en: 'Colombia', currency: 'COP' },
  { code: 'PE', name_es: 'Perú', name_en: 'Peru', currency: 'PEN' },
  { code: 'EC', name_es: 'Ecuador', name_en: 'Ecuador', currency: 'USD' },
  { code: 'UY', name_es: 'Uruguay', name_en: 'Uruguay', currency: 'UYU' },
  { code: 'PY', name_es: 'Paraguay', name_en: 'Paraguay', currency: 'PYG' },
  { code: 'BO', name_es: 'Bolivia', name_en: 'Bolivia', currency: 'BOB' },
  { code: 'VE', name_es: 'Venezuela', name_en: 'Venezuela', currency: 'VES' },
  { code: 'CR', name_es: 'Costa Rica', name_en: 'Costa Rica', currency: 'CRC' },
  { code: 'PA', name_es: 'Panamá', name_en: 'Panama', currency: 'USD' },
  { code: 'DO', name_es: 'República Dominicana', name_en: 'Dominican Republic', currency: 'DOP' },
  { code: 'GT', name_es: 'Guatemala', name_en: 'Guatemala', currency: 'GTQ' },
  { code: 'HN', name_es: 'Honduras', name_en: 'Honduras', currency: 'HNL' },
  { code: 'SV', name_es: 'El Salvador', name_en: 'El Salvador', currency: 'USD' },
  { code: 'NI', name_es: 'Nicaragua', name_en: 'Nicaragua', currency: 'NIO' },
  { code: 'CU', name_es: 'Cuba', name_en: 'Cuba', currency: 'CUP' },
  { code: 'PR', name_es: 'Puerto Rico', name_en: 'Puerto Rico', currency: 'USD' },
  { code: 'GQ', name_es: 'Guinea Ecuatorial', name_en: 'Equatorial Guinea', currency: 'XAF' },
  { code: 'DE', name_es: 'Alemania', name_en: 'Germany', currency: 'EUR' },
  { code: 'FR', name_es: 'Francia', name_en: 'France', currency: 'EUR' },
  { code: 'IT', name_es: 'Italia', name_en: 'Italy', currency: 'EUR' },
  { code: 'PT', name_es: 'Portugal', name_en: 'Portugal', currency: 'EUR' },
  { code: 'GB', name_es: 'Reino Unido', name_en: 'United Kingdom', currency: 'GBP' },
  { code: 'IE', name_es: 'Irlanda', name_en: 'Ireland', currency: 'EUR' },
  { code: 'NL', name_es: 'Países Bajos', name_en: 'Netherlands', currency: 'EUR' },
  { code: 'BE', name_es: 'Bélgica', name_en: 'Belgium', currency: 'EUR' },
  { code: 'CH', name_es: 'Suiza', name_en: 'Switzerland', currency: 'CHF' },
  { code: 'AT', name_es: 'Austria', name_en: 'Austria', currency: 'EUR' },
  { code: 'PL', name_es: 'Polonia', name_en: 'Poland', currency: 'PLN' },
  { code: 'SE', name_es: 'Suecia', name_en: 'Sweden', currency: 'SEK' },
  { code: 'NO', name_es: 'Noruega', name_en: 'Norway', currency: 'NOK' },
  { code: 'DK', name_es: 'Dinamarca', name_en: 'Denmark', currency: 'DKK' },
  { code: 'FI', name_es: 'Finlandia', name_en: 'Finland', currency: 'EUR' },
  { code: 'GR', name_es: 'Grecia', name_en: 'Greece', currency: 'EUR' },
  { code: 'RO', name_es: 'Rumanía', name_en: 'Romania', currency: 'RON' },
  { code: 'CZ', name_es: 'Chequia', name_en: 'Czechia', currency: 'CZK' },
  { code: 'HU', name_es: 'Hungría', name_en: 'Hungary', currency: 'HUF' },
];

export const DEFAULT_COUNTRY = 'ES';

function labelFrom(list: ReadonlyArray<{ key: string; label: Bilingual }>, key: string | null | undefined, lang: JobLang): string {
  if (!key) return '';
  const hit = list.find((i) => i.key === key);
  return hit ? hit.label[lang] : key;
}

export const educationLabel = (key: string | null | undefined, lang: JobLang) => labelFrom(EDUCATION_LEVELS, key, lang);
export const categoryLabel = (key: string | null | undefined, lang: JobLang) => labelFrom(JOB_CATEGORIES, key, lang);
export const contractLabel = (key: string | null | undefined, lang: JobLang) => labelFrom(CONTRACT_TYPES, key, lang);
export const scheduleLabel = (key: string | null | undefined, lang: JobLang) => labelFrom(SCHEDULES, key, lang);
export const workModeLabel = (key: string | null | undefined, lang: JobLang) => labelFrom(WORK_MODES, key, lang);

/** Idioma pedido en la oferta: {language: 'en', level: 'B2'} (o texto libre de ofertas antiguas) -> «Inglés (B2)». */
export function languageReqLabel(l: unknown, lang: JobLang): string {
  if (typeof l === 'string') return l;
  const o = l as { language?: string; name?: string; level?: string } | null;
  const code = o?.language || o?.name || '';
  let name = code;
  if (/^[a-z]{2,3}$/i.test(code)) {
    try {
      const dn = new Intl.DisplayNames([lang], { type: 'language' }).of(code.toLowerCase());
      if (dn) name = dn.charAt(0).toUpperCase() + dn.slice(1);
    } catch { /* codigo no valido: se deja tal cual */ }
  }
  return o?.level ? `${name} (${o.level})` : name;
}

export function countryName(code: string | null | undefined, lang: JobLang, list: ReadonlyArray<JobCountry> = FALLBACK_COUNTRIES): string {
  if (!code) return '';
  const hit = list.find((c) => c.code === code.toUpperCase());
  if (!hit) return code.toUpperCase();
  return lang === 'en' ? hit.name_en : hit.name_es;
}

export function countryCurrency(code: string | null | undefined, list: ReadonlyArray<JobCountry> = FALLBACK_COUNTRIES): string | null {
  if (!code) return null;
  return list.find((c) => c.code === code.toUpperCase())?.currency ?? null;
}

export function isKnownCountry(code: string | null | undefined, list: ReadonlyArray<JobCountry> = FALLBACK_COUNTRIES): boolean {
  if (!code) return false;
  const up = code.toUpperCase();
  return list.some((c) => c.code === up);
}
