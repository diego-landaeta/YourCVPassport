/**
 * «Todo gratis hasta nuevo aviso» (#24).
 *
 * Gratis para todos: plantillas, exportaciones, sellos, grupos y analíticas. La IA
 * sigue siendo de pago (solo la usan los perfiles con plan de pago).
 *
 * No se borra nada: planes, precios y créditos siguen en el código y en la base.
 * Para volver a cobrar: compilar con VITE_TODO_GRATIS=false y deshacer la migración
 * supabase/migrations/20261113_todo_gratis.sql (lleva los valores de antes).
 */

export const TODO_GRATIS = import.meta.env.VITE_TODO_GRATIS !== 'false';

const PLANES_DE_PAGO = ['pro', 'premium', 'enterprise'];

/** Páginas de precios y planes (ES/EN): fuera del menú, del pie y de la comunidad. */
const RUTAS_DE_PRECIOS = new Set(['precios', 'pricing', 'empresas/planes', 'companies/plans']);

/** Quita del menú las entradas de precios mientras todo es gratis (también en submenús). */
export function sinPrecios<T extends { id: string; subItems?: T[] }>(items: T[]): T[] {
  if (!TODO_GRATIS) return items;
  return items
    .filter(i => !RUTAS_DE_PRECIOS.has(i.id))
    .map(i => (i.subItems ? { ...i, subItems: sinPrecios(i.subItems) } : i));
}

/** ¿El perfil tiene de verdad un plan de pago? */
export function tienePlanDePago(plan: string | null | undefined): boolean {
  return PLANES_DE_PAGO.includes(String(plan ?? 'free').toLowerCase());
}

/** Plantillas Pro, grupos y analíticas: libres para todos mientras todo es gratis. */
export function tieneFuncionesPro(plan: string | null | undefined): boolean {
  return TODO_GRATIS || tienePlanDePago(plan);
}

/**
 * La IA no es gratis, pero mientras todo es gratis no hay dónde pagarla: a quien no
 * la tiene no se le ofrece (nada de «mejora tu plan» hacia una página de precios).
 */
export function ofrecerIA(tieneAcceso: boolean): boolean {
  return tieneAcceso || !TODO_GRATIS;
}
