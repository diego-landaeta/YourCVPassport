import React from 'react';

/**
 * Cuerpo de un documento legal. Cada línea del texto es un párrafo; «N. Título. Resto»
 * lleva el título en negrita. Medida de lectura ≤ 68 caracteres, interlineado holgado.
 * Presentación común de LegalDocPage y de la puerta de aceptación (LegalGate).
 */
export function legalLines(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    // La primera línea de los borradores («BORRADOR v1.0 – ...») se muestra como aviso aparte.
    .filter((l, i) => !(i === 0 && /^(borrador|draft)\b/i.test(l)));
}

interface Props {
  texto: string;
  className?: string;
  /** Marca con id="anexo" el párrafo del Anexo I (salto desde las casillas del registro). */
  anchors?: boolean;
}

const LegalTextBody: React.FC<Props> = ({ texto, className = '', anchors = false }) => (
  <div className={`max-w-[68ch] text-[15px] leading-7 text-slate-700 dark:text-slate-300 ${className}`}>
    {legalLines(texto).map((line, i) => {
      const m = /^(\d+\.\s+[^.]{1,60}\.)\s+(.*)$/.exec(line);
      const anchor = anchors && /anexo i|annex i/i.test(line) ? 'anexo' : undefined;
      return (
        <p key={i} id={anchor} className="mb-3.5 scroll-mt-24">
          {m ? (
            <>
              <strong className="font-semibold text-slate-900 dark:text-white">{m[1]}</strong> {m[2]}
            </>
          ) : (
            line
          )}
        </p>
      );
    })}
  </div>
);

export default LegalTextBody;
