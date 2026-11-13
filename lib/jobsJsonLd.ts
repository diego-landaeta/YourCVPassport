/**
 * JSON-LD `JobPosting` (Google Empleos) a partir de la ficha publica.
 * server.mjs construye el mismo objeto para el HTML que reciben los bots: si cambias
 * los campos aqui, cambialos alli (buildJobPostingJsonLd en server.mjs).
 *
 * Reglas de Google que se respetan:
 *  - title, description (HTML), datePosted, hiringOrganization y jobLocation son obligatorios;
 *    en teletrabajo puro se usa jobLocationType + applicantLocationRequirements.
 *  - validThrough = fecha de cierre; baseSalary solo si la empresa muestra el salario.
 *  - No se emite si la oferta ya no admite candidaturas.
 */
import type { JobDetail } from './jobsApi';
import { toSafeHtml } from './jobsHtml';
import { jobAbsoluteUrl } from './jobsFormat';

const SITE_URL = 'https://yourcvpassport.com';

// education_min -> credentialCategory de schema.org/Google
const CREDENTIAL_CATEGORY: Record<string, string> = {
  SECONDARY: 'high school',
  VOCATIONAL: 'professional certificate',
  BACHELOR: 'bachelor degree',
  MASTER: 'postgraduate degree',
  DOCTORATE: 'postgraduate degree',
};

const SALARY_UNIT: Record<string, string> = { HOURLY: 'HOUR', MONTHLY: 'MONTH', YEARLY: 'YEAR' };

function listHtml(title: string, items: string[] | null | undefined): string {
  const clean = (items || []).map((i) => (i || '').trim()).filter(Boolean);
  if (!clean.length) return '';
  return `<h3>${title}</h3><ul>${clean.map((i) => `<li>${toSafeHtml(i).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ul>`;
}

export function employmentTypes(job: Pick<JobDetail, 'contract_types' | 'schedule' | 'employment_type'>): string[] {
  const out = new Set<string>();
  if (job.schedule === 'PART_TIME' || job.schedule === 'HOURLY') out.add('PART_TIME');
  else if (job.schedule === 'FULL_TIME') out.add('FULL_TIME');
  for (const c of job.contract_types || []) {
    if (c === 'TEMPORARY') out.add('TEMPORARY');
    else if (c === 'PROJECT' || c === 'FREELANCE') out.add('CONTRACTOR');
    else if (c === 'INTERNSHIP' || c === 'TRAINING') out.add('INTERN');
    else if (c === 'VOLUNTEER') out.add('VOLUNTEER');
  }
  // Ofertas anteriores a la fase 2 (columnas antiguas)
  if (!out.size && job.employment_type) {
    const legacy: Record<string, string> = {
      FULL_TIME: 'FULL_TIME', PART_TIME: 'PART_TIME', CONTRACT: 'CONTRACTOR', TEMPORARY: 'TEMPORARY',
      INTERNSHIP: 'INTERN', FREELANCE: 'CONTRACTOR',
    };
    if (legacy[job.employment_type]) out.add(legacy[job.employment_type]);
  }
  if (!out.size) out.add('OTHER');
  return [...out];
}

const SECTION: Record<'es' | 'en', Record<string, string>> = {
  es: { resp: 'Funciones', req: 'Requisitos', nice: 'Se valora', ben: 'Beneficios' },
  en: { resp: 'Responsibilities', req: 'Requirements', nice: 'Nice to have', ben: 'Benefits' },
};

export function buildJobPostingJsonLd(job: JobDetail, pageUrl: string, lang: 'es' | 'en' = 'es'): Record<string, unknown> | null {
  if (!job.accepting_applications || !job.published_at) return null;

  const descriptionHtml = [
    toSafeHtml(job.description),
    listHtml(SECTION[lang].resp, job.responsibilities),
    listHtml(SECTION[lang].req, job.requirements),
    listHtml(SECTION[lang].nice, job.nice_to_have),
    listHtml(SECTION[lang].ben, job.benefits),
  ].filter(Boolean).join('');
  if (!descriptionHtml) return null;

  const isRemote = job.work_mode === 'REMOTE' || (!!job.is_remote && job.work_mode !== 'HYBRID' && job.work_mode !== 'ONSITE');
  const country = (job.country_code || job.location_country || '').toUpperCase() || undefined;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: descriptionHtml,
    identifier: { '@type': 'PropertyValue', name: job.company_name, value: job.id },
    datePosted: job.published_at,
    employmentType: employmentTypes(job),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name,
      ...(/^https?:[/][/]/i.test(job.company_website || '') ? { sameAs: job.company_website } : {}),
      ...(/^https:[/][/]/i.test(job.company_logo_url || '') ? { logo: job.company_logo_url } : {}),
    },
    directApply: true,
    url: pageUrl,
  };
  if (job.application_deadline) ld.validThrough = job.application_deadline;
  if (job.vacancies && job.vacancies > 0) ld.totalJobOpenings = job.vacancies;
  if (job.experience_years != null && job.experience_years > 0) {
    ld.experienceRequirements = { '@type': 'OccupationalExperienceRequirements', monthsOfExperience: job.experience_years * 12 };
  }
  const credential = CREDENTIAL_CATEGORY[job.education_min || ''];
  if (credential) ld.educationRequirements = { '@type': 'EducationalOccupationalCredential', credentialCategory: credential };
  if (job.category) ld.occupationalCategory = job.category;

  if (isRemote) {
    ld.jobLocationType = 'TELECOMMUTE';
    const allowed = (job.allowed_countries && job.allowed_countries.length ? job.allowed_countries : country ? [country] : [])
      .map((c) => ({ '@type': 'Country', name: c.toUpperCase() }));
    if (allowed.length) ld.applicantLocationRequirements = allowed.length === 1 ? allowed[0] : allowed;
  }
  if (!isRemote || job.location_city) {
    ld.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(job.location_city ? { addressLocality: job.location_city } : {}),
        ...(job.location_state ? { addressRegion: job.location_state } : {}),
        ...(country ? { addressCountry: country } : {}),
      },
    };
  }

  const min = job.salary_min;
  const max = job.salary_max;
  if (job.show_salary && (min != null || max != null) && job.salary_currency) {
    const unit = SALARY_UNIT[job.salary_period || ''] || 'MONTH';
    const value: Record<string, unknown> = { '@type': 'QuantitativeValue', unitText: unit };
    if (min != null && max != null && min !== max) { value.minValue = min; value.maxValue = max; }
    else value.value = (min ?? max) as number;
    ld.baseSalary = { '@type': 'MonetaryAmount', currency: job.salary_currency, value };
  }
  return ld;
}

/** URL canonica de la ficha: `/<cc>/ofertas/<slug>` (es) o `/<cc>/jobs/<slug>` (en); sin pais, la ruta antigua. */
export const jobCanonicalUrl = (slug: string, lang: 'es' | 'en', cc?: string | null) =>
  jobAbsoluteUrl(cc, slug, lang, SITE_URL);
