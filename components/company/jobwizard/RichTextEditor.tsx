import React, { useEffect, useRef } from 'react';
import { BoldIcon, ItalicIcon, ListBulletIcon, NumberedListIcon } from '@heroicons/react/24/outline';
import { descriptionToHtml, sanitizeJobHtml } from '../../../lib/jobPostingHtml';

interface Props {
  id: string;
  /** HTML saneado (o texto plano antiguo: se convierte). */
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  ariaLabel: string;
  toolbarLabel: string;
  labels: { bold: string; italic: string; ul: string; ol: string };
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
}

/**
 * Editor sencillo (negrita, cursiva, listas) con contentEditable.
 *
 *  - Cada cambio pasa por `sanitizeJobHtml` antes de salir: lo que llega al
 *    estado y a la base es siempre el HTML mínimo de la lista blanca.
 *  - Al pegar se inserta SOLO texto plano (nada de HTML ajeno).
 *  - El contenido del div solo se reescribe desde fuera cuando el valor cambia
 *    por algo que no ha salido de este editor (cargar un borrador), para no
 *    mover el cursor mientras se escribe.
 */
export const RichTextEditor: React.FC<Props> = ({ id, value, onChange, placeholder, ariaLabel, toolbarLabel, labels, invalid, describedBy, disabled }) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = descriptionToHtml(value);
    if (lastEmitted.current === incoming) return;
    // Solo asignamos HTML ya saneado por nuestra lista blanca.
    el.innerHTML = incoming;
    lastEmitted.current = incoming;
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const clean = sanitizeJobHtml(el.innerHTML);
    lastEmitted.current = clean;
    onChange(clean);
  };

  const exec = (command: string) => {
    if (disabled) return;
    ref.current?.focus();
    document.execCommand(command, false);
    emit();
  };

  const btn =
    'h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-dark-border text-slate-700 dark:text-slate-200 bg-white dark:bg-dark-bg-secondary hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue text-sm disabled:opacity-60 transition-colors';

  return (
    <div>
      <div role="toolbar" aria-label={toolbarLabel} className="flex flex-wrap gap-1.5 mb-2">
        {/* onMouseDown: evita que el botón robe la selección del editor */}
        <button type="button" className={btn} aria-label={labels.bold} title={labels.bold} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
          <BoldIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" className={btn} aria-label={labels.italic} title={labels.italic} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}>
          <ItalicIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" className={btn} aria-label={labels.ul} title={labels.ul} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" className={btn} aria-label={labels.ol} title={labels.ol} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}>
          <NumberedListIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={ref}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          if (text) document.execCommand('insertText', false, text);
        }}
        className={`min-h-[12rem] max-h-[28rem] overflow-y-auto px-4 py-3 text-[15px] border rounded-lg shadow-sm bg-white dark:bg-dark-bg-tertiary text-slate-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 ${
          invalid ? 'border-red-500' : 'border-slate-300 dark:border-dark-border'
        }`}
      />
    </div>
  );
};

export default RichTextEditor;
