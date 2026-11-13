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

const LegalTextBody: React.FC<Props> = ({ texto, className = '', anchors = false }) => {
  const all = legalLines(texto);
  // Solo la primera línea que nombra el anexo lleva el ancla (un id no se repite).
  const anchorAt = anchors ? all.findIndex((l) => /anexo i\b|annex i\b/i.test(l)) : -1;
  return (
  <div className={`max-w-[68ch] text-[15px] leading-7 text-slate-700 dark:text-slate-300 ${className}`}>
    {all.map((line, i) => {
      // «N. Título. Resto» o «ANEXO I. Título (…). Resto»: el título en negrita.
      const m = /^(\d+\.\s+[^.]{1,60}\.)\s+(.*)$/.exec(line) ?? /^((?:ANEXO|ANNEX) [IVX]+\.\s+[^.]{1,80}\.)\s+(.*)$/.exec(line);
      const anchor = i === anchorAt ? 'anexo' : undefined;
      // «a) …» y «– …»: apartados de una cláusula, sangrados.
      const sub = /^([a-z]\)|[–-])\s/.test(line);
      return (
        <p key={i} id={anchor} className={`mb-3.5 scroll-mt-24${sub ? ' pl-4 sm:pl-6' : ''}`}>
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
};

export default LegalTextBody;
