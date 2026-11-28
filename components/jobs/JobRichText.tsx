import React from 'react';
import { looksLikeHtml } from '../../lib/jobsHtml';

/**
 * Pinta el texto de una oferta (HTML del editor o texto plano) SIN dangerouslySetInnerHTML:
 * el HTML se recorre con DOMParser y solo se crean los elementos de la lista blanca.
 * Todo lo demas (script, style, iframe, atributos, on*, javascript:) se descarta.
 */

const BLOCK_TAGS = new Set(['p', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote']);
const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'u']);
const DROP_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'form', 'input', 'button']);

const TAG_CLASS: Record<string, string> = {
  p: 'mb-4 last:mb-0',
  ul: 'list-disc pl-5 mb-4 last:mb-0 space-y-1.5 marker:text-slate-400 dark:marker:text-dark-text-tertiary',
  ol: 'list-decimal pl-5 mb-4 last:mb-0 space-y-1.5 marker:text-slate-500 dark:marker:text-dark-text-tertiary',
  li: 'pl-1',
  h2: 'text-lg font-semibold text-slate-900 dark:text-dark-text-primary mt-6 mb-2',
  h3: 'text-base font-semibold text-slate-900 dark:text-dark-text-primary mt-5 mb-2',
  h4: 'text-base font-semibold text-slate-900 dark:text-dark-text-primary mt-4 mb-1',
  blockquote: 'border-l-2 border-slate-300 dark:border-dark-border pl-4 text-slate-600 dark:text-dark-text-secondary mb-4',
};

function safeHref(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim(), 'https://yourcvpassport.com');
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function convert(node: Node, key: string): React.ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROP_TAGS.has(tag)) return null;

  const children = Array.from(el.childNodes).map((c, i) => convert(c, `${key}.${i}`));

  if (tag === 'br') return <br key={key} />;
  if (tag === 'a') {
    const href = safeHref(el.getAttribute('href'));
    if (!href) return <React.Fragment key={key}>{children}</React.Fragment>;
    return (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow ugc"
        className="text-cv-blue dark:text-cv-blue-light underline underline-offset-2 break-words hover:text-cv-blue-dark dark:hover:text-blue-300">
        {children}
      </a>
    );
  }
  if (BLOCK_TAGS.has(tag)) return React.createElement(tag, { key, className: TAG_CLASS[tag] }, children);
  if (INLINE_TAGS.has(tag)) return React.createElement(tag === 'b' ? 'strong' : tag, { key }, children);
  // Cualquier otra etiqueta (div, span...): se conserva el texto sin la etiqueta
  return <React.Fragment key={key}>{children}</React.Fragment>;
}

interface Props {
  text: string | null | undefined;
  className?: string;
}

const JobRichText: React.FC<Props> = ({ text, className = '' }) => {
  const value = (text ?? '').trim();
  const content = React.useMemo<React.ReactNode>(() => {
    if (!value) return null;
    if (!looksLikeHtml(value)) {
      return value
        .split(/\n{2,}/)
        .map((p, i) => <p key={i} className="mb-4 last:mb-0 whitespace-pre-line">{p.trim()}</p>);
    }
    if (typeof DOMParser === 'undefined') return <p className="mb-3">{value.replace(/<[^>]*>/g, ' ')}</p>;
    const doc = new DOMParser().parseFromString(value, 'text/html');
    return Array.from(doc.body.childNodes).map((n, i) => convert(n, `n${i}`));
  }, [value]);

  if (!content) return null;
  return <div className={`break-words ${className}`}>{content}</div>;
};

export default JobRichText;
