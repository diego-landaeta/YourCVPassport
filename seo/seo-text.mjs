/**
 * Utilidades de texto compartidas por los generadores estáticos de SEO
 * (scripts/generate-static-meta.mjs, scripts/generate-profile-html.mjs, scripts/generate-sitemap.mjs).
 *
 * Todo es puro (sin red ni disco) para poder probarlo. Reglas de la auditoría del 25/10/2026
 * (hallazgo 11): títulos de 50 a 60 caracteres escritos completos y descripciones de 120 a 155
 * que terminan en frase completa. NUNCA se insertan puntos suspensivos: si un texto no cabe se
 * recorta por frase o por palabra, o se usa un título corto escrito a mano (`seoTitle`).
 */

export const BASE_URL = 'https://yourcvpassport.com';
export const BRAND = 'YourCVPassport';

export const TITLE_MIN = 50;
export const TITLE_MAX = 60;
export const DESC_MIN = 120;
export const DESC_MAX = 155;

/** Escapa un texto para contenido o valor de atributo HTML. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON-LD seguro dentro de <script>: `<` escapado para que un texto no pueda cerrar la etiqueta. */
export function jsonLdScript(obj) {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return `<script type="application/ld+json" data-rh="true">${json}</script>`;
}

/** Quita etiquetas HTML y espacios repetidos. */
export function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Texto en una línea, sin puntos suspensivos finales heredados de recortes antiguos. */
export function cleanText(value) {
  return stripHtml(value)
    .replace(/\s*(\.{3,}|…)\s*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'at', 'and', 'or', 'with', 'by', 'from', 'your', 'our', 'is', 'are', 'how',
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'con', 'para', 'por', 'tu', 'tus', 'su', 'sus', 'a', 'al', 'que', 'e', 'u',
]);

/** Corta por frases (. ! ?) sin romper abreviaturas de una letra ni decimales. */
export function splitSentences(text) {
  const t = cleanText(text);
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑÜ¿¡0-9"“(])/u).map((s) => s.trim()).filter(Boolean);
  // Numeración de listas («2.», «3.»): no es una frase, se une a la siguiente
  const merged = [];
  for (let i = 0; i < parts.length; i++) {
    if (/^\d{1,2}\.$/.test(parts[i]) && i + 1 < parts.length) { parts[i + 1] = `${parts[i]} ${parts[i + 1]}`; continue; }
    merged.push(parts[i]);
  }
  return merged;
}

function endsSentence(s) {
  return /[.!?]$/.test(s);
}

/** Recorta por palabra a `max` caracteres sin dejar una palabra vacía (stopword) colgando. */
export function cutAtWord(text, max) {
  if (text.length <= max) return text;
  let cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  cut = lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, max);
  const words = cut.split(' ');
  while (words.length > 1 && STOPWORDS.has(words[words.length - 1].toLowerCase().replace(/[^\p{L}]/gu, ''))) words.pop();
  return words.join(' ').replace(/[\s,;:\-–—(]+$/u, '');
}

/**
 * Descripción de 120 a 155 caracteres que termina en frase completa.
 *  - Si cabe tal cual, se respeta (añadiendo el punto final si falta y entra).
 *  - Si sobra, se queda con las frases enteras que caben; si no hay ninguna frase útil se corta
 *    en la última coma/punto y coma que caiga en rango, o por palabra, y se cierra con un punto.
 *  - `wordCut: false` evita el corte por palabra (devuelve las frases completas que quepan, aunque queden cortas).
 *  - Si falta, se le añaden frases completas de `extras` (resumen, primer párrafo...) mientras quepan.
 * Nunca añade «...».
 */
export function fitDescription(text, extras = [], { min = DESC_MIN, max = DESC_MAX, wordCut = true } = {}) {
  let t = cleanText(text);
  if (!t) t = '';
  const extraSentences = extras.flatMap((e) => splitSentences(e));

  if (t.length > max) {
    const sentences = splitSentences(t);
    let acc = '';
    for (const s of sentences) {
      const next = acc ? `${acc} ${s}` : s;
      if (next.length > max) break;
      acc = next;
    }
    if (acc.length >= min) return acc;
    // Sin frase completa útil: coma o punto y coma dentro de rango
    const head = t.slice(0, max);
    const punct = Math.max(head.lastIndexOf(', '), head.lastIndexOf('; '), head.lastIndexOf(': '));
    if (punct >= min - 1) return `${head.slice(0, punct)}.`;
    // wordCut=false: sin frase ni coma que valga, se devuelve lo que haya (puede ser corto)
    if (!wordCut) return acc;
    const byWord = cutAtWord(t, max - 1);
    return `${byWord}.`;
  }

  if (t && !endsSentence(t) && t.length < max) t += '.';
  if (t.length >= min) return t;

  for (const s of extraSentences) {
    // Solo frases reales: largas, con mayúscula inicial y sin numeración de lista ni negritas
    if (!endsSentence(s) || s.length < 30 || !/^[A-ZÁÉÍÓÚÑ¿¡]/.test(s) || /\b\d{1,2}\.\s/.test(s) || /\*\*/.test(s) || /\s\d{1,2}\.$/.test(s)) continue;
    if (t.includes(s)) continue;
    const next = t ? `${t} ${s}` : s;
    if (next.length > max) continue;
    t = next;
    if (t.length >= min) break;
  }
  return t;
}

/**
 * Elige el primer candidato de título dentro de [min, max]. Si ninguno lo está, el más largo que
 * no supere `max` y, en último término, el más corto. Devuelve { title, ok }.
 */
export function pickTitle(candidates, { min = TITLE_MIN, max = TITLE_MAX } = {}) {
  const list = candidates.map((c) => cleanText(c)).filter(Boolean);
  const exact = list.find((c) => c.length >= min && c.length <= max);
  if (exact) return { title: exact, ok: true };
  const under = list.filter((c) => c.length <= max).sort((a, b) => b.length - a.length)[0];
  if (under) return { title: under, ok: false };
  return { title: list.sort((a, b) => a.length - b.length)[0] ?? '', ok: false };
}

/**
 * Variantes de un título largo de más a menos fieles: completo, sin el año final y solo la parte
 * anterior a ":" / " - " / " | ". Nunca se corta por palabras (dejaría el título colgando):
 * si ninguna entra en 50-60 hace falta un `seoTitle` escrito a mano en seo/seo-titles.json.
 */
export function titleVariants(base) {
  const b = cleanText(base);
  const out = [b];
  const noYear = b
    .replace(/\s+(in|en|for|para)\s+(20\d\d)$/i, '')
    .replace(/\s*[:(\-–—]\s*(guía|guia|guide)?\s*(completa|practica|práctica|complete)?\s*(20\d\d)\)?$/i, '')
    .replace(/\s*\(?\b20\d\d\b\)?$/, '')
    .trim();
  if (noYear && noYear !== b) out.push(noYear);
  const head = b.split(/\s*(?::| - | – | \| )\s*/)[0].trim();
  if (head && head.length >= 20 && !out.includes(head)) out.push(head);
  return out;
}

/** Título SEO de un texto con el sufijo de marca: la primera variante que entra en 50–60. */
export function fitTitleWithBrand(base, { sep = ' - ', extras = [] } = {}) {
  const suffix = `${sep}${BRAND}`;
  const variants = titleVariants(base);
  const candidates = [];
  for (const v of variants) candidates.push(`${v}${suffix}`);
  for (const v of variants) for (const x of extras) candidates.push(`${v}${x}${suffix}`);
  for (const v of variants) candidates.push(v);
  return pickTitle(candidates);
}

/**
 * Quita las etiquetas que escribe este generador (canonical, og:url, og:locale, hreflang, JSON-LD
 * y robots con data-rh) para que renderPage sea idempotente: si el index.html de partida ya pasó
 * por aquí (p. ej. dist/index.html de la home), no quedan duplicadas.
 */
export function stripManagedTags(html) {
  return html
    .replace(/[ \t]*<link rel="canonical"[^>]*>\s*\n?/gi, '')
    .replace(/[ \t]*<link rel="alternate" hreflang="[^"]*"[^>]*>\s*\n?/gi, '')
    .replace(/[ \t]*<meta property="og:url"[^>]*>\s*\n?/gi, '')
    .replace(/[ \t]*<meta property="og:locale"[^>]*>\s*\n?/gi, '')
    .replace(/[ \t]*<meta property="article:published_time"[^>]*>\s*\n?/gi, '')
    .replace(/[ \t]*<script type="application\/ld\+json" data-rh="true">[\s\S]*?<\/script>\s*\n?/gi, '')
    .replace(/[ \t]*<meta name="(?:robots|googlebot)" content="[^"]*" data-rh="true"\s*\/?>\s*\n?/gi, '');
}

// ── Markdown de los artículos del blog a bloques de texto ───────────────────────────

/**
 * Convierte el markdown propio de los artículos (títulos #, listas -, **negrita**, imágenes con
 * {caption:...}, bloques :::tip) en bloques de texto plano para el HTML estático.
 * Devuelve { blocks, h2s, plainLength }. La primera línea `# ...` (el título) se descarta.
 */
export function markdownToBlocks(markdown) {
  const lines = String(markdown ?? '').replace(/\r/g, '').split('\n');
  const blocks = [];
  const h2s = [];
  let para = [];
  let list = [];
  let firstH1Skipped = false;

  const inline = (s) => cleanText(
    s
      .replace(/!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^>\s?/, ''),
  );

  const flushPara = () => {
    if (para.length) {
      const text = inline(para.join(' '));
      if (text) blocks.push({ type: 'p', text });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const items = list.map(inline).filter(Boolean);
      if (items.length) blocks.push({ type: 'ul', items });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    if (/^:::/.test(line)) { flushPara(); flushList(); continue; }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara(); flushList();
      const level = m[1].length;
      const text = inline(m[2]);
      if (!text) continue;
      if (level === 1) {
        if (!firstH1Skipped) { firstH1Skipped = true; continue; }
        blocks.push({ type: 'h2', text });
        h2s.push(text);
      } else if (level === 2) {
        blocks.push({ type: 'h2', text });
        h2s.push(text);
      } else {
        blocks.push({ type: 'h3', text });
      }
      continue;
    }
    if (/^!\[[^\]]*\]\([^)]*\)/.test(line)) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^[-*]\s+(.*)$/))) { flushPara(); list.push(m[1]); continue; }
    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  const plainLength = blocks.reduce((n, b) => n + (b.text ? b.text.length : b.items.join(' ').length), 0);
  return { blocks, h2s, plainLength };
}

/**
 * Primeros ~`target` caracteres de texto del cuerpo: bloques enteros hasta pasar el objetivo, y el
 * último bloque se cierra en el final de frase siguiente al objetivo (sin cortar a media frase).
 * Los encabezados se conservan como encabezados del extracto, salvo si quedaran al final solos.
 */
export function excerptBlocks(blocks, target = 1500) {
  const out = [];
  let chars = 0;
  for (const b of blocks) {
    const len = b.text ? b.text.length : b.items.join(' ').length;
    if (chars >= target) break;
    if (b.type === 'p' && chars + len > target + 400) {
      // Párrafo largo que pasa de sobra: se recorta en una frase completa
      const sentences = splitSentences(b.text);
      let acc = '';
      for (const s of sentences) {
        acc = acc ? `${acc} ${s}` : s;
        if (chars + acc.length >= target) break;
      }
      out.push({ type: 'p', text: acc });
      chars += acc.length;
      break;
    }
    out.push(b);
    chars += len;
  }
  while (out.length && (out[out.length - 1].type === 'h2' || out[out.length - 1].type === 'h3')) out.pop();
  return { blocks: out, chars };
}
