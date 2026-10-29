/**
 * Categorías profesionales de la bolsa de empleo (~30), con es/en.
 *
 * UNA SOLA LISTA para todo el producto: el asistente de ofertas (categoría y segunda
 * categoría), los filtros del listado público y las alertas (fase 4) comparten los
 * mismos códigos, que son los que se guardan en `job_postings.category` / `category2`.
 * La fuente es `lib/jobsCatalog.ts` (la del listado y las alertas); este módulo solo
 * la presenta con la forma {code, es, en} que usa el asistente. Si se cambia la lista,
 * se cambia allí.
 *
 * PENDIENTE DE VALIDAR por Manuel (issue #10: «validar la lista de categorías»). Los
 * códigos ya usados por ofertas publicadas no deben renombrarse (sí añadir nuevos).
 */
import { JOB_CATEGORIES as CATALOG } from './jobsCatalog';

export interface JobCategory {
  code: string;
  es: string;
  en: string;
}

export const JOB_CATEGORIES: readonly JobCategory[] = CATALOG.map((c) => ({ code: c.key, es: c.label.es, en: c.label.en }));

const BY_CODE = new Map(JOB_CATEGORIES.map((c) => [c.code, c]));

/** Código de «Otros»: siempre va el último de las listas ordenadas. */
const OTHER_CODE = 'OTHER';

export function isJobCategory(code: string | null | undefined): boolean {
  return !!code && BY_CODE.has(code);
}

/** Nombre de la categoría en el idioma pedido; si el código no existe, el propio código. */
export function jobCategoryLabel(code: string | null | undefined, lang: 'es' | 'en'): string {
  if (!code) return '';
  const c = BY_CODE.get(code);
  return c ? c[lang] : code;
}

/** Categorías ordenadas alfabéticamente por su nombre (con «Otros» siempre al final). */
export function sortedJobCategories(lang: 'es' | 'en'): JobCategory[] {
  const collator = new Intl.Collator(lang);
  const rest = JOB_CATEGORIES.filter((c) => c.code !== OTHER_CODE).slice().sort((a, b) => collator.compare(a[lang], b[lang]));
  return [...rest, ...JOB_CATEGORIES.filter((c) => c.code === OTHER_CODE)];
}
