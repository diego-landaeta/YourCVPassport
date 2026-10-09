/**
 * Claves de día 'YYYY-MM-DD' en la zona horaria LOCAL del navegador.
 *
 * Las graficas de analitica agrupaban con `toISOString().split('T')[0]` (o con
 * `created_at.split('T')[0]`), que da el dia en UTC: una visita a las 23:30 en
 * Ciudad de Mexico (05:30 UTC del dia siguiente) aparecia en el dia siguiente, y
 * una a las 00:30 en Madrid o Tokio en el dia anterior. Ademas, `new Date('YYYY-MM-DD')`
 * se interpreta como medianoche UTC, asi que al pintar la etiqueta en una zona
 * con desfase negativo se veia el dia anterior. Estas utilidades trabajan siempre
 * con el calendario local.
 */

/** 'YYYY-MM-DD' con getFullYear/getMonth/getDate (fecha LOCAL, no UTC). */
export function toLocalDayKey(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Medianoche local del día indicado por una clave 'YYYY-MM-DD' (sin pasar por UTC). */
export function parseLocalDayKey(key: string): Date {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Medianoche local del día de `date`. */
export function startOfLocalDay(date: Date | string | number = new Date()): Date {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Medianoche local de hace `n` días (n = 0 es hoy). Con n = dias - 1 sirve como
 * inicio de "los últimos N días" contando hoy: N días naturales completos.
 */
export function localDaysAgo(n: number, from: Date = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() - n);
}

/**
 * Claves de todos los días locales entre `start` y `end` (ambos incluidos), en
 * orden. Avanza con el constructor (año, mes, día + i) y no sumando 24 h, para
 * que los cambios de horario de verano no salten ni repitan días.
 */
export function localDayKeysBetween(start: Date | string | number, end: Date | string | number = new Date()): string[] {
  const first = startOfLocalDay(start);
  const last = startOfLocalDay(end);
  const keys: string[] = [];
  // Fecha inválida: NaN nunca es > last y el bucle no terminaría.
  if (isNaN(first.getTime()) || isNaN(last.getTime())) return keys;
  for (let i = 0; ; i++) {
    const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
    if (d > last) break;
    keys.push(toLocalDayKey(d));
  }
  return keys;
}
