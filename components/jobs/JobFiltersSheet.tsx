import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { JobLang } from '../../lib/jobsCatalog';
import { fmt } from '../../lib/bolsaText';
import { useJobsText } from './textos';
import type { JobFilterDef, JobFilterPatch, JobFilterValues } from './JobFiltersDefs';
import { formatCount } from './JobListFormat';
import { JOB_FADE_CLASS, JOB_SHEET_CLASS } from './JobListMotion';

interface Props {
  lang: JobLang;
  defs: JobFilterDef[];
  values: JobFilterValues;
  currency: string | null;
  total: number;
  loading: boolean;
  onChange: (patch: JobFilterPatch) => void;
  onClear: () => void;
  onClose: () => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Panel inferior de filtros para movil. Los cambios se aplican al instante (la URL manda,
 * igual que con las pills), y el pie muestra cuantas ofertas dejan.
 */
const JobFiltersSheet: React.FC<Props> = ({ lang, defs, values, currency, total, loading, onChange, onClear, onClose }) => {
  const tx = useJobsText();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [minDraft, setMinDraft] = useState(values.min);

  const commitMin = () => {
    const v = minDraft.trim();
    const next = v && Number(v) > 0 ? v : '';
    if (next !== values.min) onChange({ min: next || null });
  };
  const closeAndCommit = () => { commitMin(); onClose(); };

  // Bloqueo del scroll de fondo, foco inicial y cierre con Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    // Si la ventana pasa a ancho de tableta, el panel ya no existe: se cierra para soltar el scroll
    const mq = window.matchMedia('(min-width: 768px)');
    const onWide = (e: MediaQueryListEvent) => { if (e.matches) onClose(); };
    mq.addEventListener('change', onWide);
    return () => { document.body.style.overflow = prev; mq.removeEventListener('change', onWide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeAndCommit(); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) || []).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const hasAny = Object.entries(values).some(([, v]) => !!v);
  const catDef = defs.find((d) => d.key === 'cat');
  const chipDefs = defs.filter((d) => d.key !== 'cat');
  const resultsLabel = loading ? tx.showResultsGeneric : total === 1 ? tx.showResultsOne : fmt(tx.showResults, { n: formatCount(total, lang) });

  return (
    <div className="fixed inset-0 z-50 md:hidden" onKeyDown={onKeyDown}>
      <div className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] ${JOB_FADE_CLASS}`} onClick={closeAndCommit} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jf-sheet-title"
        className={`absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl bg-white shadow-[0_-16px_48px_-12px_rgba(15,23,42,.35)] dark:bg-dark-bg-secondary ${JOB_SHEET_CLASS}`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
          <h2 id="jf-sheet-title" className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary">{tx.filters}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeAndCommit}
            aria-label={tx.closeLabel}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 pb-5 pt-2">
          {catDef && (
            <div>
              <label htmlFor="jf-sheet-cat" className="block text-sm font-semibold text-slate-900 dark:text-dark-text-primary">{catDef.label}</label>
              <select
                id="jf-sheet-cat"
                value={values.cat}
                onChange={(e) => onChange({ cat: e.target.value || null })}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary"
              >
                <option value="">{catDef.allLabel}</option>
                {catDef.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {chipDefs.map((def) => (
            <fieldset key={def.key}>
              <legend className="text-sm font-semibold text-slate-900 dark:text-dark-text-primary">{def.label}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {[{ value: '', label: def.allLabel }, ...def.options].map((o) => (
                  <label key={o.value || 'all'} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name={`jf-sheet-${def.key}`}
                      value={o.value}
                      checked={values[def.key] === o.value}
                      onChange={() => onChange({ [def.key]: o.value || null })}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors duration-150 peer-checked:border-cv-blue peer-checked:bg-blue-50 peer-checked:text-blue-900 peer-focus-visible:ring-2 peer-focus-visible:ring-cv-blue peer-focus-visible:ring-offset-2 dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:peer-checked:border-cv-blue/70 dark:peer-checked:bg-cv-blue/15 dark:peer-checked:text-blue-100 dark:peer-focus-visible:ring-offset-dark-bg-secondary">
                      {o.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div>
            <label htmlFor="jf-sheet-min" className="block text-sm font-semibold text-slate-900 dark:text-dark-text-primary">
              {fmt(tx.minSalary, { currency: currency || '—' })}
            </label>
            <input
              id="jf-sheet-min" type="number" min={0} step={100} inputMode="numeric"
              value={minDraft}
              onChange={(e) => setMinDraft(e.target.value)}
              onBlur={commitMin}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitMin(); } }}
              placeholder={tx.salaryPlaceholder}
              aria-describedby="jf-sheet-min-hint"
              className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base tabular-nums text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:placeholder:text-dark-text-tertiary"
            />
            <p id="jf-sheet-min-hint" className="mt-1.5 text-[13px] text-slate-600 dark:text-dark-text-secondary">{tx.minSalaryHint}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-dark-border">
          <button
            type="button"
            onClick={() => { setMinDraft(''); onClear(); }}
            disabled={!hasAny && !minDraft}
            className="inline-flex h-12 items-center rounded-xl px-4 text-[15px] font-medium text-slate-700 underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue disabled:opacity-50 disabled:hover:no-underline dark:text-dark-text-primary"
          >
            {tx.clearFilters}
          </button>
          <button
            type="button"
            onClick={closeAndCommit}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-cv-blue px-5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-cv-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary"
          >
            {resultsLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobFiltersSheet;
