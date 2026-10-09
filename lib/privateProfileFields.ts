import { supabase } from '../supabase/client';

/**
 * Lee columnas privadas de `profiles` (email, phone...) para varios perfiles
 * desde la vista `profiles_full`, que solo devuelve las filas que el usuario
 * puede ver completas (la suya, las que gestiona y todas si es admin).
 *
 * Sirve para completar listados que embeben `profiles(...)` con columnas
 * públicas: el embed no puede pedir columnas privadas (42501 desde la migración
 * 20261006_cerrar_columnas_privadas_profiles_stamps.sql).
 *
 * Devuelve un Map id -> fila. Los perfiles que el usuario no puede ver
 * completos no aparecen.
 */
export async function fetchPrivateProfileFields<T extends Record<string, unknown>>(
  profileIds: Array<string | null | undefined>,
  columns: string,
): Promise<Map<string, T>> {
  const ids = Array.from(new Set(profileIds.filter((id): id is string => Boolean(id))));
  const out = new Map<string, T>();
  if (ids.length === 0) return out;
  const { data, error } = await supabase
    .from('profiles_full')
    .select(`id, ${columns}`)
    .in('id', ids);
  if (error) {
    console.error('profiles_full:', error.message);
    return out;
  }
  for (const row of (data || []) as unknown as Array<T & { id: string }>) out.set(row.id, row);
  return out;
}
