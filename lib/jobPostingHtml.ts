/**
 * Descripción de las ofertas: formato permitido y saneado.
 *
 * DOMPurify no es dependencia del proyecto, así que el saneado es propio y por
 * LISTA BLANCA: la descripción se guarda como un HTML mínimo reconstruido desde
 * cero (nunca se reutiliza el HTML de entrada):
 *
 *   <p> <br> <strong> <em> <ul> <ol> <li>   — sin atributos de ningún tipo.
 *
 * Todo lo demás se descarta (script, style, iframe, img...) o se "desenvuelve"
 * (se conserva su texto). Los textos se escapan al serializar. Con este formato
 * no hay forma de colar `on*=`, `javascript:`, `style=` ni enlaces.
 *
 * Usos:
 *   - editor del asistente (`RichTextEditor`): `sanitizeJobHtml` en cada cambio.
 *   - ficha y vista previa: `JobRichText` (componentes React, sin
 *     dangerouslySetInnerHTML) o `jobHtmlToText` para SEO y JSON-LD.
 *   - descripciones antiguas en texto plano: `descriptionToHtml` las convierte.
 *
 * El navegador es el único que tiene DOMParser; sin él (SSR, tests en Node) se
 * degrada a texto plano escapado, que es seguro.
 */

const MAX_HTML_LENGTH = 30000;

const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'head',
  'title', 'link', 'meta', 'form', 'input', 'textarea', 'select', 'button', 'img', 'video',
  'audio', 'canvas', 'source', 'track', 'applet', 'frame', 'frameset', 'base',
]);

const BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'header', 'footer', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'tr', 'table', 'main', 'aside', 'nav', 'figure',
]);

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** ¿Parece HTML (alguna de las etiquetas que genera el editor)? */
export function looksLikeHtml(s: string): boolean {
  return /<\s*\/?\s*(p|br|ul|ol|li|strong|em|b|i|div)\b/i.test(s);
}

/** Texto plano -> HTML mínimo: párrafos por línea en blanco, <br> por salto simple. */
export function plainTextToHtml(text: string): string {
  const t = (text || '').replace(/\r\n?/g, '\n').trim();
  if (!t) return '';
  return t
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function trimBr(s: string): string {
  return s.replace(/^(<br>)+|(<br>)+$/g, '');
}

function hasContent(html: string): boolean {
  return html.replace(/<br>/g, '').trim() !== '';
}

function serializeChildren(node: Node): string {
  let out = '';
  node.childNodes.forEach((child) => {
    out += serializeNode(child);
  });
  return out;
}

function isBlockLike(tag: string): boolean {
  return tag === 'ul' || tag === 'ol' || tag === 'li' || BLOCK_TAGS.has(tag) || /^h[1-6]$/.test(tag);
}

function serializeNode(node: Node): string {
  if (node.nodeType === 3) {
    return escapeHtml((node.nodeValue || '').replace(/ /g, ' '));
  }
  if (node.nodeType !== 1) return '';

  const tag = (node as Element).tagName.toLowerCase();
  if (DROP_TAGS.has(tag)) return '';

  switch (tag) {
    case 'br':
      return '<br>';
    case 'strong':
    case 'b': {
      const inner = serializeChildren(node);
      return hasContent(inner) ? `<strong>${inner}</strong>` : inner;
    }
    case 'em':
    case 'i': {
      const inner = serializeChildren(node);
      return hasContent(inner) ? `<em>${inner}</em>` : inner;
    }
    case 'ul':
    case 'ol': {
      let inner = '';
      node.childNodes.forEach((ch) => {
        if (ch.nodeType === 3) {
          const t = (ch.nodeValue || '').trim();
          if (t) inner += `<li>${escapeHtml(t)}</li>`;
        } else if (ch.nodeType === 1) {
          const isLi = (ch as Element).tagName.toLowerCase() === 'li';
          const content = trimBr(isLi ? serializeChildren(ch) : serializeNode(ch));
          if (hasContent(content)) inner += `<li>${content}</li>`;
        }
      });
      return inner ? `<${tag}>${inner}</${tag}>` : '';
    }
    case 'li': {
      // <li> fuera de una lista: se trata como un párrafo.
      const inner = trimBr(serializeChildren(node));
      return hasContent(inner) ? `<p>${inner}</p>` : '';
    }
    default:
      break;
  }

  if (/^h[1-6]$/.test(tag)) {
    const inner = trimBr(serializeChildren(node));
    return hasContent(inner) ? `<p><strong>${inner}</strong></p>` : '';
  }
  if (BLOCK_TAGS.has(tag)) {
    return serializeBlock(node);
  }
  // Etiqueta desconocida (span, a, font, u...): se conserva solo el contenido.
  return serializeChildren(node);
}

/** Serializa un contenedor como secuencia de <p> y listas (lo inline suelto se agrupa en párrafos). */
function serializeBlock(node: Node): string {
  let out = '';
  let inline = '';
  const flush = () => {
    const t = trimBr(inline);
    if (hasContent(t)) out += `<p>${t}</p>`;
    inline = '';
  };
  node.childNodes.forEach((child) => {
    if (child.nodeType === 1 && isBlockLike((child as Element).tagName.toLowerCase())) {
      flush();
      out += serializeNode(child);
      return;
    }
    inline += serializeNode(child);
  });
  flush();
  return out;
}

/** Quita etiquetas y decodifica lo justo: red de seguridad cuando no hay DOMParser. */
function fallbackToText(html: string): string {
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/**
 * HTML de entrada (editor, pegado, base de datos) -> HTML mínimo seguro.
 * Idempotente: sanitizeJobHtml(sanitizeJobHtml(x)) === sanitizeJobHtml(x).
 */
export function sanitizeJobHtml(input: string | null | undefined): string {
  const raw = (input || '').slice(0, MAX_HTML_LENGTH * 2);
  if (!raw.trim()) return '';
  if (typeof DOMParser === 'undefined') {
    return plainTextToHtml(fallbackToText(raw)).slice(0, MAX_HTML_LENGTH);
  }
  const doc = new DOMParser().parseFromString(`<body>${raw}</body>`, 'text/html');
  if (!doc.body) return '';
  return serializeBlock(doc.body).trim().slice(0, MAX_HTML_LENGTH);
}

/** Acepta HTML o texto plano antiguo y devuelve siempre HTML saneado. */
export function descriptionToHtml(raw: string | null | undefined): string {
  const s = raw || '';
  if (!s.trim()) return '';
  return sanitizeJobHtml(looksLikeHtml(s) ? s : plainTextToHtml(s));
}

/** Texto plano de una descripción (recuento, SEO, resúmenes): un párrafo o elemento de lista por línea. */
export function jobHtmlToText(html: string | null | undefined, opts: { markers?: boolean } = {}): string {
  const markers = opts.markers !== false;
  const safe = descriptionToHtml(html);
  if (!safe) return '';
  if (typeof DOMParser === 'undefined') return fallbackToText(safe).replace(/[ \t]+/g, ' ').trim();
  const doc = new DOMParser().parseFromString(`<body>${safe}</body>`, 'text/html');
  const lines: string[] = [];
  const text = (el: Element): string => {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    return (clone.textContent || '').replace(/[ \t]+/g, ' ').trim();
  };
  doc.body.childNodes.forEach((child) => {
    if (child.nodeType !== 1) return;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === 'ul' || tag === 'ol') {
      let n = 0;
      el.childNodes.forEach((li) => {
        if (li.nodeType !== 1) return;
        n += 1;
        lines.push((markers ? (tag === 'ul' ? '• ' : `${n}. `) : '') + text(li as Element).replace(/\s*\n\s*/g, ' '));
      });
    } else {
      lines.push(text(el));
    }
  });
  return lines.filter(Boolean).join('\n').trim();
}

/**
 * Nº de caracteres de texto visible. Es siempre ≤ el recuento de la base
 * (`_job_submit` quita etiquetas sin decodificar entidades), de modo que si el
 * cliente da el mínimo por bueno, el servidor también. NO cuenta los prefijos
 * de lista («• », «1. »): el SQL solo cuenta el texto entre etiquetas.
 */
export function jobTextLength(html: string | null | undefined): number {
  return jobHtmlToText(html, { markers: false }).replace(/\s+/g, ' ').trim().length;
}
