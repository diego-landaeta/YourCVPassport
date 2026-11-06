import { DEFAULT_COUNTRY, FALLBACK_COUNTRIES, isKnownCountry, type JobCountry, type JobLang } from './jobsCatalog';

const LOCALE: Record<JobLang, string> = { es: 'es-ES', en: 'en-GB' };

export interface SalaryInput {
  show_salary?: boolean | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  salary_mode?: string | null;
}

const PERIOD_SUFFIX: Record<string, Record<JobLang, string>> = {
  HOURLY: { es: '/hora', en: '/hour' },
  MONTHLY: { es: '/mes', en: '/month' },
  YEARLY: { es: '/año', en: '/year' },
};

function money(amount: number, currency: string | null | undefined, lang: JobLang): string {
  try {
    return new Intl.NumberFormat(LOCALE[lang], {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
      // es-ES no agrupa los numeros de 4 cifras: se fuerza para que 1.900 y 38.000 se lean igual
      useGrouping: 'always',
    } as unknown as Intl.NumberFormatOptions).format(amount);
  } catch {
    // Moneda no valida para Intl: numero con el codigo delante
    return `${currency || ''} ${amount.toLocaleString(LOCALE[lang], { useGrouping: true })}`.trim();
  }
}

/** Salario en la moneda del anuncio, o null si no se muestra o no hay cifras. */
export function formatJobSalary(job: SalaryInput, lang: JobLang): string | null {
  if (!job.show_salary) return null;
  const min = job.salary_min ?? null;
  const max = job.salary_max ?? null;
  if (min == null && max == null) return null;

  let mode = job.salary_mode || null;
  if (!mode) {
    if (min != null && max != null) mode = min === max ? 'EXACT' : 'RANGE';
    else mode = min != null ? 'FROM' : 'UP_TO';
  }
  const cur = job.salary_currency;
  const suffix = job.salary_period ? PERIOD_SUFFIX[job.salary_period]?.[lang] ?? '' : '';
  let text: string;
  if (mode === 'RANGE' && min != null && max != null) {
    text = `${money(min, cur, lang)} – ${money(max, cur, lang)}`;
  } else if (mode === 'EXACT') {
    text = money((min ?? max) as number, cur, lang);
  } else if (mode === 'UP_TO' && (max ?? min) != null) {
    text = `${lang === 'es' ? 'Hasta' : 'Up to'} ${money((max ?? min) as number, cur, lang)}`;
  } else if (mode === 'FROM' && (min ?? max) != null) {
    text = `${lang === 'es' ? 'Desde' : 'From'} ${money((min ?? max) as number, cur, lang)}`;
  } else if (min != null && max != null) {
    text = `${money(min, cur, lang)} – ${money(max, cur, lang)}`;
  } else {
    text = money((min ?? max) as number, cur, lang);
  }
  return `${text}${suffix ? ` ${suffix}` : ''}`;
}

/** "hace 3 días", "3 days ago", "hoy"... */
export function timeAgo(iso: string | null | undefined, lang: JobLang, now: number = Date.now()): string {
  if (!iso) return '';
  const diffMs = new Date(iso).getTime() - now;
  if (Number.isNaN(diffMs)) return '';
  const minutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: 'auto' });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  const months = Math.round(days / 30);
  return rtf.format(months, 'month');
}

export function formatDate(iso: string | null | undefined, lang: JobLang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(iso: string | null | undefined, now: number = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - now) / 86400000);
}

/** Region del idioma del navegador (es-MX -> MX) si es un pais de la bolsa. */
export function browserCountry(countries: ReadonlyArray<JobCountry> = FALLBACK_COUNTRIES): string | null {
  if (typeof navigator === 'undefined') return null;
  const langs = [...(navigator.languages || []), navigator.language].filter(Boolean);
  for (const l of langs) {
    const region = l.split(/[-_]/)[1];
    if (region && isKnownCountry(region, countries)) return region.toUpperCase();
  }
  return null;
}

/** Pais por defecto: el del perfil con sesion, luego el del navegador y, si no, Espana. */
export function resolveDefaultCountry(profileCountry: string | null | undefined, countries: ReadonlyArray<JobCountry> = FALLBACK_COUNTRIES): string {
  if (profileCountry && isKnownCountry(profileCountry, countries)) return profileCountry.toUpperCase();
  return browserCountry(countries) || DEFAULT_COUNTRY;
}

// --- Rutas ------------------------------------------------------------------

/** Ruta ANTIGUA de la ficha (sin pais). Sigue viva: la ficha redirige en cliente a `jobPath` cuando la oferta tiene pais. */
export const jobDetailPath = (slug: string, lang: JobLang) => `/${lang === 'es' ? 'empleos' : 'jobs'}/${encodeURIComponent(slug)}`;

/**
 * URL CANONICA de una oferta: `/<cc>/ofertas/<slug>` (es) y `/<cc>/jobs/<slug>` (en), con el
 * codigo ISO del pais en minuscula (p. ej. `/es/ofertas/enfermera-uci-madrid-1a2b3c4d`).
 * Sin pais valido cae a la ruta antigua (`/empleos/<slug>`), que redirige a esta cuando la
 * oferta tiene pais.
 *
 * CONTRATO con el resto de piezas: `send-outbox/templates.ts` (`jobUrl()`), el sitemap y el
 * servidor de SSR deben construir exactamente esta misma forma.
 */
export function jobPath(cc: string | null | undefined, slug: string, lang: JobLang): string {
  const code = (cc || '').trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return jobDetailPath(slug, lang);
  return `/${code}/${lang === 'es' ? 'ofertas' : 'jobs'}/${encodeURIComponent(slug)}`;
}

/** Enlace a la ficha de una oferta con los datos que haya: `country_code`, o `location_country` si es un codigo ISO. */
export function jobHref(
  job: { slug?: string | null; country_code?: string | null; location_country?: string | null },
  lang: JobLang,
): string {
  const loc = (job.location_country || '').trim();
  const cc = job.country_code || (/^[A-Za-z]{2}$/.test(loc) ? loc : null);
  return jobPath(cc, job.slug || '', lang);
}

/** URL absoluta de la oferta en el sitio (canonical, hreflang, JSON-LD). */
export function jobAbsoluteUrl(cc: string | null | undefined, slug: string, lang: JobLang, site = 'https://yourcvpassport.com'): string {
  return `${site}${jobPath(cc, slug, lang)}`;
}

/**
 * Interpreta la ruta de una ficha: `lang` segun el prefijo (`ofertas` = es, `jobs` = en) y el
 * `cc` de la URL si lo lleva (minuscula), o null en las rutas antiguas `/empleos/:slug` y `/jobs/:slug`.
 */
export function parseJobRoute(pathname: string): { lang: JobLang; cc: string | null } {
  const m = /^\/([a-z]{2})\/(ofertas|jobs)\//i.exec(pathname);
  if (m) return { lang: m[2].toLowerCase() === 'ofertas' ? 'es' : 'en', cc: m[1].toLowerCase() };
  return { lang: pathname.startsWith('/empleos/') ? 'es' : 'en', cc: null };
}

/** Listado raiz en el idioma de la interfaz (/empleos o /jobs). */
export const jobsRootPath = (lang: JobLang) => (lang === 'es' ? '/empleos' : '/jobs');

/**
 * Listado de un pais. En espanol la direccion lleva el pais (/mx/empleos); en ingles
 * se queda en /jobs con ?country=mx, porque /xx/jobs choca con las redirecciones
 * antiguas (/es/jobs -> /empleos).
 */
export function jobsCountryPath(country: string | null | undefined, lang: JobLang): string {
  if (!country) return jobsRootPath(lang);
  const cc = country.toLowerCase();
  return lang === 'es' ? `/${cc}/empleos` : `/jobs?country=${cc}`;
}

const COUNTRY_KEY = 'ycvp_jobs_country';

export function readSavedCountry(): string | null {
  try {
    return localStorage.getItem(COUNTRY_KEY);
  } catch {
    return null;
  }
}

export function saveCountry(code: string): void {
  try {
    localStorage.setItem(COUNTRY_KEY, code);
  } catch { /* modo privado */ }
}
