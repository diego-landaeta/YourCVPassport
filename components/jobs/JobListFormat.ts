import {
  CONTRACT_TYPES, JOB_CATEGORIES, SCHEDULES, WORK_MODES,
  type Bilingual, type JobLang,
} from '../../lib/jobsCatalog';
import type { SalaryInput } from '../../lib/jobsFormat';

/**
 * Formato propio del listado: etiquetas que nunca muestran un codigo crudo y salario con
 * separador de miles siempre (Intl en es-ES no agrupa las cifras de 4 digitos: «1900 €»).
 */

type Catalog = ReadonlyArray<{ key: string; label: Bilingual }>;

/** «FULL_TIME» -> «Full time»: ultimo recurso cuando el codigo no esta en el catalogo. */
export function humanizeCode(code: string): string {
  const words = code.trim().replace(/[_\-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function resolveLabel(list: Catalog, code: string | null | undefined, lang: JobLang): string {
  if (!code) return '';
  const exact = list.find((i) => i.key === code);
  if (exact) return exact.label[lang];
  // Codigos antiguos o abreviados («LOGISTICS» -> LOGISTICS_TRANSPORT)
  const prefix = list.find((i) => i.key.startsWith(`${code}_`));
  if (prefix) return prefix.label[lang];
  return humanizeCode(code);
}

export const listCategoryLabel = (code: string | null | undefined, lang: JobLang) => resolveLabel(JOB_CATEGORIES, code, lang);
export const listContractLabel = (code: string | null | undefined, lang: JobLang) => resolveLabel(CONTRACT_TYPES, code, lang);
export const listScheduleLabel = (code: string | null | undefined, lang: JobLang) => resolveLabel(SCHEDULES, code, lang);
export const listWorkModeLabel = (code: string | null | undefined, lang: JobLang) => resolveLabel(WORK_MODES, code, lang);

const LOCALE: Record<JobLang, string> = { es: 'es-ES', en: 'en-GB' };

/** Separador de miles tambien en cifras de 4 digitos (es-ES las deja sin agrupar). Los tipos de lib aun no recogen «always». */
const ALWAYS_GROUP = { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions;

const PERIOD_SUFFIX: Record<string, Record<JobLang, string>> = {
  HOURLY: { es: '/hora', en: '/hour' },
  MONTHLY: { es: '/mes', en: '/month' },
  YEARLY: { es: '/año', en: '/year' },
};

/** Importe con moneda y separador de miles incluso en cifras de 4 digitos. */
export function formatMoney(amount: number, currency: string | null | undefined, lang: JobLang): string {
  try {
    return new Intl.NumberFormat(LOCALE[lang], {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
      ...ALWAYS_GROUP,
    }).format(amount);
  } catch {
    return `${currency || ''} ${amount.toLocaleString(LOCALE[lang], { useGrouping: true })}`.trim();
  }
}

export interface SalaryParts {
  /** Cifra principal: «1.900 € – 2.400 €», «Desde 1.500 €». */
  value: string;
  /** Periodo: «/mes». Cadena vacia si no hay. */
  period: string;
}

/** Misma logica que formatJobSalary (lib/jobsFormat) pero separando cifra y periodo. */
export function formatSalaryParts(job: SalaryInput, lang: JobLang): SalaryParts | null {
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
  const m = (n: number) => formatMoney(n, cur, lang);
  let value: string;
  if (mode === 'RANGE' && min != null && max != null) value = `${m(min)} – ${m(max)}`;
  else if (mode === 'EXACT') value = m((min ?? max) as number);
  else if (mode === 'UP_TO' && (max ?? min) != null) value = `${lang === 'es' ? 'Hasta' : 'Up to'} ${m((max ?? min) as number)}`;
  else if (mode === 'FROM' && (min ?? max) != null) value = `${lang === 'es' ? 'Desde' : 'From'} ${m((min ?? max) as number)}`;
  else if (min != null && max != null) value = `${m(min)} – ${m(max)}`;
  else value = m((min ?? max) as number);

  const period = job.salary_period ? PERIOD_SUFFIX[job.salary_period]?.[lang] ?? '' : '';
  return { value, period };
}

/** Numero entero con separador de miles (contadores del listado). */
export function formatCount(n: number, lang: JobLang): string {
  return new Intl.NumberFormat(LOCALE[lang], ALWAYS_GROUP).format(n);
}
