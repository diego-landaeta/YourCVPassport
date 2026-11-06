import React, { useMemo } from 'react';
import { descriptionToHtml, jobHtmlToText } from '../../../lib/jobPostingHtml';

/**
 * Pinta la descripción de una oferta SIN dangerouslySetInnerHTML.
 *
 * El texto se sanea (lista blanca: p, br, strong, em, ul, ol, li) y se convierte
 * a elementos de React. Acepta HTML del editor o texto plano antiguo. Sin
 * DOMParser (SSR) cae a texto con saltos de línea. Lo usan la vista previa del
 * asistente, el panel de admin y, si quiere, la ficha pública.
 */
const ALLOWED = new Set(['p', 'strong', 'em', 'ul', 'ol', 'li']);

function convert(node: Node, key: string): React.ReactNode {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return null;
  const tag = (node as Element).tagName.toLowerCase();
  if (tag === 'br') return <br key={key} />;
  const kids: React.ReactNode[] = [];
  node.childNodes.forEach((c, i) => kids.push(convert(c, `${key}.${i}`)));
  if (!ALLOWED.has(tag)) return <React.Fragment key={key}>{kids}</React.Fragment>;
  return React.createElement(tag, { key }, ...kids);
}

export const JobRichText: React.FC<{ html: string | null | undefined; className?: string }> = ({ html, className }) => {
  const content = useMemo(() => {
    const safe = descriptionToHtml(html);
    if (!safe) return null;
    if (typeof DOMParser === 'undefined') return <p className="whitespace-pre-wrap">{jobHtmlToText(safe)}</p>;
    const doc = new DOMParser().parseFromString(`<body>${safe}</body>`, 'text/html');
    const out: React.ReactNode[] = [];
    doc.body.childNodes.forEach((c, i) => out.push(convert(c, String(i))));
    return out;
  }, [html]);

  return (
    <div
      className={`space-y-3 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 ${className || ''}`}
    >
      {content}
    </div>
  );
};

export default JobRichText;
