import React, { useMemo, useRef, useState } from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import type { JobLang } from '../../lib/jobsCatalog';
import { fmt } from '../../lib/bolsaText';
import { useJobsText } from './textos';
import { buildFilterDefs, FOCUS_RING, optionLabel, type JobFilterKey, type JobFilterPatch, type JobFilterValues } from './JobFiltersDefs';
import { JobFiltersOptions, JobFiltersPill } from './JobFiltersPill';
import JobFiltersSheet from './JobFiltersSheet';
import { formatCount, formatMoney } from './JobListFormat';

interface Props {
  lang: JobLang;
  values: JobFilterValues;
  /** Moneda del pais elegido (null con «todos los paises»). */
  currency: string | null;
  /** Filtros activos en total (incluye buscador y ciudad) para el contador del boton movil. */
  activeCount: number;
  total: number;
  loading: boolean;
  onChange: (patch: JobFilterPatch) => void;
  onClear: () => void;
}

export function salaryAmountLabel(min: string, currency: string | null, lang: JobLang): string {
  const n = Number(min);
  return currency ? formatMoney(n, currency, lang) : formatCount(n, lang);
}

const SalaryPanel: React.FC<{ min: string; currency: string | null; onApply: (v: string | null) => void }> = ({ min, currency, onApply }) => {
  const tx = useJobsText();
  const [draft, setDraft] = useState(min);
  const ref = useRef<HTMLInputElement>(null);
  React.useEffect(() => { ref.current?.focus(); }, []);
  const submit = () => { const v = draft.trim(); onApply(v && Number(v) > 0 ? v : null); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="w-72 p-2.5">
      <label htmlFor="jf-min" className="block text-sm font-medium text-slate-800 dark:text-dark-text-primary">
        {fmt(tx.minSalary, { currency: currency || '—' })}
      </label>
      <input
        ref={ref} id="jf-min" type="number" min={0} step={100} inputMode="numeric" value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={tx.salaryPlaceholder}
        aria-describedby="jf-min-hint"
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base tabular-nums text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:placeholder:text-dark-text-tertiary"
      />
      <p id="jf-min-hint" className="mt-2 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">{tx.minSalaryHint}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {min ? (
          <button type="button" onClick={() => onApply(null)} className="rounded-md px-1 text-sm font-medium text-slate-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-dark-text-secondary">
            {tx.clearShort}
          </button>
        ) : <span />}
        <button type="submit" className="h-9 rounded-lg bg-cv-blue px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cv-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary">
          {tx.salaryApply}
        </button>
      </div>
    </form>
  );
};

/**
 * Filtros del listado. En escritorio/tableta: fila de pills desplegables. En movil: un boton
 * «Filtros (n)» que abre un panel inferior con los mismos filtros.
 */
const JobFiltersBar: React.FC<Props> = ({ lang, values, currency, activeCount, total, loading, onChange, onClear }) => {
  const tx = useJobsText();
  const defs = useMemo(() => buildFilterDefs(tx, lang), [tx, lang]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 md:flex" role="group" aria-label={tx.filters}>
        {defs.map((def) => {
          const value = values[def.key as JobFilterKey];
          return (
            <JobFiltersPill key={def.key} label={def.label} valueLabel={value ? optionLabel(def, value) : null} panelRole="listbox">
              {(close) => (
                <JobFiltersOptions
                  allLabel={def.allLabel}
                  options={def.options}
                  value={value}
                  onPick={(v) => { onChange({ [def.key]: v || null }); close(); }}
                />
              )}
            </JobFiltersPill>
          );
        })}
        <JobFiltersPill
          label={tx.salaryShort}
          valueLabel={values.min ? fmt(tx.chipSalary, { amount: salaryAmountLabel(values.min, currency, lang) }) : null}
          panelRole="dialog"
        >
          {(close) => <SalaryPanel min={values.min} currency={currency} onApply={(v) => { onChange({ min: v }); close(); }} />}
        </JobFiltersPill>
      </div>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-[15px] font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:hover:bg-dark-bg-tertiary md:hidden ${FOCUS_RING}`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
        {activeCount > 0 ? fmt(tx.filtersWithCount, { n: activeCount }) : tx.filters}
      </button>

      {sheetOpen && (
        <JobFiltersSheet
          lang={lang}
          defs={defs}
          values={values}
          currency={currency}
          total={total}
          loading={loading}
          onChange={onChange}
          onClear={onClear}
          onClose={() => { setSheetOpen(false); triggerRef.current?.focus(); }}
        />
      )}
    </>
  );
};

export default JobFiltersBar;
