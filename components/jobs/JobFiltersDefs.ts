import {
  CONTRACT_TYPES, JOB_CATEGORIES, POSTED_WITHIN, SCHEDULES, WORK_MODES, type JobLang,
} from '../../lib/jobsCatalog';
import { fmt } from '../../lib/bolsaText';
import type { JobsText } from './textos';

/** Filtros de la URL que gestionan las pills y el panel inferior (q y city van en el buscador). */
export type JobFilterKey = 'cat' | 'contract' | 'sched' | 'mode' | 'days' | 'exp';
export type JobFilterValues = Record<JobFilterKey, string> & { min: string };
export type JobFilterPatch = Record<string, string | null>;

export interface JobFilterDef {
  key: JobFilterKey;
  /** Etiqueta de la pill y del grupo del panel. */
  label: string;
  /** Texto de la opcion «sin filtro». */
  allLabel: string;
  options: Array<{ value: string; label: string }>;
}

export function buildFilterDefs(tx: JobsText, lang: JobLang): JobFilterDef[] {
  return [
    { key: 'cat', label: tx.category, allLabel: tx.allCategories, options: JOB_CATEGORIES.map((c) => ({ value: c.key, label: c.label[lang] })) },
    { key: 'contract', label: tx.contract, allLabel: tx.anyContract, options: CONTRACT_TYPES.map((c) => ({ value: c.key, label: c.label[lang] })) },
    { key: 'sched', label: tx.schedule, allLabel: tx.anySchedule, options: SCHEDULES.map((c) => ({ value: c.key, label: c.label[lang] })) },
    { key: 'mode', label: tx.workMode, allLabel: tx.anyMode, options: WORK_MODES.map((c) => ({ value: c.key, label: c.label[lang] })) },
    { key: 'days', label: tx.posted, allLabel: tx.anyDate, options: POSTED_WITHIN.map((c) => ({ value: String(c.days), label: c.label[lang] })) },
    {
      key: 'exp', label: tx.experience, allLabel: tx.anyExperience,
      // «Años máximos que pide la oferta»: p_max_experience_years (las que piden ≤ X años o ninguna)
      options: [
        { value: '0', label: tx.exp0 },
        { value: '1', label: fmt(tx.expUpTo, { n: 1 }) },
        { value: '2', label: fmt(tx.expUpTo, { n: 2 }) },
        { value: '3', label: fmt(tx.expUpTo, { n: 3 }) },
        { value: '5', label: fmt(tx.expUpTo, { n: 5 }) },
      ],
    },
  ];
}

/** Texto de la opcion elegida; si el valor no esta en el catalogo, el codigo humanizado. */
export function optionLabel(def: JobFilterDef, value: string): string {
  const hit = def.options.find((o) => o.value === value);
  if (hit) return hit.label;
  const w = value.replace(/[_\-]+/g, ' ').toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** Estilos comunes del anillo de foco de los controles del listado sobre el fondo azul tenue de la banda. */
export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-blue-50 dark:focus-visible:ring-offset-dark-bg-secondary';
