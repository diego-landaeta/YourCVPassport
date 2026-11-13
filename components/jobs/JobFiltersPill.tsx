import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FOCUS_RING } from './JobFiltersDefs';
import { JOB_FADE_CLASS } from './JobListMotion';

interface PillProps {
  label: string;
  /** Texto de la opcion activa; si hay, la pill se tine de azul y lo muestra en lugar de la etiqueta. */
  valueLabel?: string | null;
  panelRole: 'listbox' | 'dialog';
  children: (close: () => void) => React.ReactNode;
}

/** Pill desplegable: boton + panel flotante con cierre por fuera, Escape y Tab. */
export const JobFiltersPill: React.FC<PillProps> = ({ label, valueLabel, panelRole, children }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const active = !!valueLabel;

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) btnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && rootRef.current && !rootRef.current.contains(next)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    const root = rootRef.current;
    root?.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      root?.removeEventListener('focusout', onFocusOut);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup={panelRole}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-10 max-w-[16rem] items-center gap-1.5 rounded-full border pl-4 pr-3 text-sm font-medium transition-colors duration-150 ${FOCUS_RING} ${active
          ? 'border-cv-blue/50 bg-blue-100/80 text-blue-900 hover:bg-blue-100 dark:border-cv-blue/60 dark:bg-cv-blue/15 dark:text-blue-100 dark:hover:bg-cv-blue/25'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:hover:border-dark-border-light dark:hover:bg-dark-bg-tertiary'}`}
      >
        <span className="truncate">{valueLabel || label}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 stroke-[2.25] text-slate-500 transition-transform duration-150 dark:text-dark-text-secondary ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          role={panelRole}
          aria-label={label}
          className={`absolute left-0 top-full z-30 mt-2 min-w-[15rem] max-w-[22rem] rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,.06),0_16px_40px_-12px_rgba(15,23,42,.28)] dark:border-dark-border dark:bg-dark-bg-secondary dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,.7)] ${JOB_FADE_CLASS}`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
};

interface OptionsProps {
  allLabel: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onPick: (value: string) => void;
}

/** Lista de opciones con teclado: flechas, Inicio/Fin, Intro y Escape (lo cierra la pill). */
export const JobFiltersOptions: React.FC<OptionsProps> = ({ allLabel, options, value, onPick }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>('[aria-selected="true"]') || el.querySelector<HTMLElement>('[role="option"]');
    target?.focus();
    target?.scrollIntoView({ block: 'nearest' });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="option"]') || []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = Math.min(items.length - 1, i + 1);
    else if (e.key === 'ArrowUp') next = Math.max(0, i - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next >= 0) { e.preventDefault(); items[next]?.focus(); }
  };

  const all = [{ value: '', label: allLabel }, ...options];
  return (
    <div ref={ref} onKeyDown={onKeyDown} className="scrollbar-thin max-h-72 overflow-y-auto">
      {all.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value || 'all'}
            type="button"
            role="option"
            aria-selected={selected}
            tabIndex={selected || (!value && o.value === '') ? 0 : -1}
            onClick={() => onPick(o.value)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cv-blue ${selected
              ? 'bg-blue-50 font-semibold text-blue-900 dark:bg-cv-blue/15 dark:text-blue-100'
              : 'text-slate-700 hover:bg-slate-100 dark:text-dark-text-primary dark:hover:bg-dark-bg-tertiary'}`}
          >
            <span>{o.label}</span>
            {selected && <CheckIcon className="h-4 w-4 shrink-0 stroke-[2.25] text-cv-blue dark:text-cv-blue-light" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
};
