import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { JobLang } from '../../lib/jobsCatalog';
import { fmt } from '../../lib/bolsaText';
import { useJobsText } from './textos';
import { formatCount } from './JobListFormat';

interface Props {
  lang: JobLang;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}

/** 1 … 4 5 6 … 20: primera, ultima y la actual con una vecina a cada lado. */
export function pageWindow(page: number, totalPages: number): Array<number | 'gap'> {
  const keep = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const nums = [...keep].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
}

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cv-light-gray dark:focus-visible:ring-offset-dark-bg-primary';
const base = `inline-flex h-11 min-w-[2.75rem] items-center justify-center gap-1 rounded-xl border px-3 text-sm font-medium tabular-nums transition-colors duration-150 sm:h-10 sm:min-w-[2.5rem] ${ring}`;
const idle = 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:hover:border-dark-border-light dark:hover:bg-dark-bg-tertiary';
const off = 'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-dark-bg-secondary';

const JobListPagination: React.FC<Props> = ({ lang, page, totalPages, total, pageSize, onPage }) => {
  const tx = useJobsText();
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between" aria-label={tx.paginationLabel}>
      <p className="text-sm tabular-nums text-slate-600 dark:text-dark-text-secondary">
        {fmt(tx.showingRange, { from: formatCount(from, lang), to: formatCount(to, lang), total: formatCount(total, lang) })}
      </p>

      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${base} ${idle} ${off}`}>
          <ChevronLeftIcon className="h-4 w-4 stroke-2" aria-hidden="true" />
          <span className="max-sm:sr-only">{tx.prev}</span>
        </button>

        {/* Movil: «Pagina 2 de 7»; desde sm, los numeros */}
        <span className="px-2 text-sm tabular-nums text-slate-700 dark:text-dark-text-secondary sm:hidden">{fmt(tx.pageOf, { p: page, t: totalPages })}</span>
        <ol className="hidden items-center gap-2 sm:flex">
          {pageWindow(page, totalPages).map((n, i) => (
            <li key={n === 'gap' ? `gap-${i}` : n}>
              {n === 'gap' ? (
                <span className="px-1 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true">…</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onPage(n)}
                  aria-current={n === page ? 'page' : undefined}
                  aria-label={fmt(tx.goToPage, { p: n })}
                  className={`${base} ${n === page ? 'border-cv-blue bg-cv-blue text-white hover:bg-cv-blue-dark' : idle}`}
                >
                  {n}
                </button>
              )}
            </li>
          ))}
        </ol>

        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${base} ${idle} ${off}`}>
          <span className="max-sm:sr-only">{tx.next}</span>
          <ChevronRightIcon className="h-4 w-4 stroke-2" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default JobListPagination;
