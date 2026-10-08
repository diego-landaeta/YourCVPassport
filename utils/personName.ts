// Utilidades de nombre de persona compartidas por el panel (sidebar, menú móvil,
// cabecera) para que el nombre y las iniciales se vean igual en todas partes.

// Partículas que en un nombre propio van en minúscula ("María de la Torre").
const LOWERCASE_PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'do', 'dos', 'das', 'van', 'von', 'di']);

const capitalizeWord = (word: string): string =>
  // Respeta guiones y apóstrofos: "jean-luc" -> "Jean-Luc", "o'neil" -> "O'Neil".
  word.replace(/(^|[-'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase());

/**
 * Pone en mayúscula inicial un nombre que llega todo en minúsculas (p. ej. el que
 * importa Google: «manuel casas» -> «Manuel Casas»). Si el nombre ya tiene alguna
 * mayúscula se respeta tal cual: el usuario lo escribió así a propósito.
 */
export function formatPersonName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  if (trimmed !== trimmed.toLocaleLowerCase()) return trimmed;
  return trimmed
    .split(' ')
    .map((word, i) => (i > 0 && LOWERCASE_PARTICLES.has(word) ? word : capitalizeWord(word)))
    .join(' ');
}

/**
 * Iniciales del avatar: primera letra del primer y del último nombre (máximo 2),
 * ignorando partículas. «manuel casas» -> «MC», «María de la Torre» -> «MT»,
 * «Ana» -> «A». Sin nombre devuelve el respaldo (por defecto «U»).
 */
export function getInitials(name: string | null | undefined, fallback = 'U'): string {
  const words = (name ?? '')
    .trim()
    .split(/\s+/)
    // Solo palabras que empiezan por letra: «Profesional 002» -> «P», no «P0».
    .filter((w) => /^\p{L}/u.test(w) && !LOWERCASE_PARTICLES.has(w.toLocaleLowerCase()));
  if (words.length === 0) return fallback;
  const first = Array.from(words[0])[0] ?? '';
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? '' : '';
  return (first + last).toLocaleUpperCase() || fallback;
}
