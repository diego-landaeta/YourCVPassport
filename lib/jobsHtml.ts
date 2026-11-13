/**
 * Texto de una oferta -> HTML seguro (lista blanca, sin atributos).
 *
 * La descripcion la escribe la empresa en un editor (negrita, cursiva, listas) y llega
 * como HTML; las ofertas antiguas son texto plano. Esta funcion SOLO se usa para el JSON-LD
 * (donde hace falta un string). En pantalla se pinta con `JobRichText` (React, sin
 * dangerouslySetInnerHTML). server.mjs repite la misma logica: si cambias una, cambia la otra.
 */

const ALLOWED_TAGS = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'h4', 'blockquote']);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;

export function escapeText(value: string): string {
  return value
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(value);
}

/** Texto plano -> <p>...</p> con saltos de linea como <br>. */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeText(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function toSafeHtml(input: string | null | undefined): string {
  const value = (input ?? '').trim();
  if (!value) return '';
  if (!looksLikeHtml(value)) return plainTextToHtml(value);

  const cleaned = value.replace(DROP_WITH_CONTENT, '');
  let out = '';
  let last = 0;
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    out += escapeText(cleaned.slice(last, m.index));
    const name = m[1].toLowerCase();
    if (ALLOWED_TAGS.has(name)) {
      out += m[0].startsWith('</') ? `</${name}>` : `<${name}>`;
    }
    last = m.index + m[0].length;
  }
  out += escapeText(cleaned.slice(last));
  return out;
}

/** HTML o texto -> texto plano (para metas y descripciones cortas). */
export function htmlToPlainText(input: string | null | undefined, max?: number): string {
  const text = (input ?? '')
    .replace(DROP_WITH_CONTENT, ' ')
    .replace(/<\/(p|li|h[1-6]|div|blockquote)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (max && text.length > max) return `${text.slice(0, max - 1).trim()}…`;
  return text;
}
