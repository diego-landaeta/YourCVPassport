/**
 * Utilidades para construir filtros de busqueda de PostgREST (supabase-js `.or()`)
 * con texto escrito por el usuario.
 *
 * `.or()` recibe una cadena con la sintaxis de PostgREST, donde `,` `.` `:` `(` `)`
 * son caracteres reservados. Si el usuario escribe por ejemplo "garcia, ana" o
 * "(test)", el filtro se rompe (error 400) o cambia de significado.
 *
 * Solucion: el valor se envia entre comillas dobles (sintaxis admitida por
 * PostgREST para valores con reservados) y se eliminan del termino los caracteres
 * que no pueden ir sin escape dentro de esas comillas (`"` y `\`) y el `*`, que
 * PostgREST convierte en comodin `%` en like/ilike.
 */

/**
 * Une varios grupos OR (p. ej. rol "profesional o sin rol" + busqueda) en una sola
 * llamada a `.or()`, como `and(or(g1),or(g2))`, para no depender de que PostgREST
 * combine varios parametros `or=` repetidos.
 */
export function combineOrGroups(groups: Array<string | null | undefined>): string | null {
  const valid = groups.filter((g): g is string => !!g);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];
  return `and(${valid.map((g) => `or(${g})`).join(',')})`;
}

/** Limpia el termino de busqueda. Devuelve '' si no queda nada util. */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/["\\*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

/**
 * Construye `col1.ilike."%term%",col2.ilike."%term%"` para `query.or(...)`.
 * Devuelve null si el termino queda vacio (no se debe aplicar filtro).
 */
export function buildIlikeOrFilter(columns: string[], term: string): string | null {
  const clean = sanitizeSearchTerm(term);
  if (!clean) return null;
  const value = `"%${clean}%"`;
  return columns.map((col) => `${col}.ilike.${value}`).join(',');
}
