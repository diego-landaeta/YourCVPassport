import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { fmt } from '../../lib/bolsaText';
import { useJobsText } from './textos';

export interface JobFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface Props {
  chips: JobFilterChip[];
  onClear: () => void;
}

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cv-light-gray dark:focus-visible:ring-offset-dark-bg-primary';

/** Filtros activos como chips quitables, con una sola accion «Limpiar» al final. */
const JobFiltersChips: React.FC<Props> = ({ chips, onClear }) => {
  const tx = useJobsText();
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={tx.activeFilters}>
      {chips.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={c.onRemove}
            aria-label={fmt(tx.removeFilter, { name: c.label })}
            className={`group inline-flex h-10 max-w-full items-center gap-1.5 rounded-full border border-slate-300 bg-white pl-3.5 pr-2.5 text-sm font-medium text-slate-800 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 sm:h-8 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:hover:border-dark-border-light dark:hover:bg-dark-bg-tertiary ${ring}`}
          >
            <span className="truncate">{c.label}</span>
            <XMarkIcon className="h-4 w-4 shrink-0 stroke-2 text-slate-500 transition-colors duration-150 group-hover:text-slate-900 dark:text-dark-text-secondary dark:group-hover:text-dark-text-primary" aria-hidden="true" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={onClear}
          aria-label={tx.clearFilters}
          className={`inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-cv-blue underline-offset-4 hover:underline sm:h-8 dark:text-cv-blue-light ${ring}`}
        >
          {tx.clearShort}
        </button>
      </li>
    </ul>
  );
};

export default JobFiltersChips;
