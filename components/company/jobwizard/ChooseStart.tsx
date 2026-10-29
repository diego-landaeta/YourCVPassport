import React, { useMemo, useState } from 'react';
import { ArrowRightIcon, DocumentDuplicateIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../../lib/jobPostingModel';
import type { JobText } from '../../../lib/jobPostingText';
import { JobStatusBadge } from './StatusBadge';
import { btnSecondaryCls, btnSmallCls, inputCls } from './fields';
import type { OfferListItem } from './jobApi';

interface Props {
  tx: JobText;
  lang: 'es' | 'en';
  offers: OfferListItem[];
  offersState: 'loading' | 'ready' | 'error';
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onRetry: () => void;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const optionCls =
  'group relative flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-[border-color,box-shadow,transform] duration-150 hover:border-cv-blue hover:shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-16px_rgba(15,23,42,.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:shadow-none dark:border-dark-border dark:bg-dark-bg-secondary dark:hover:border-blue-400 dark:focus-visible:ring-offset-dark-bg-primary';

/** Pantalla previa al paso 1: «crear nueva» o «duplicar una anterior». */
export const ChooseStart: React.FC<Props> = ({ tx, lang, offers, offersState, onNew, onDuplicate, onRetry }) => {
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const n = norm(q.trim());
    return n ? offers.filter((o) => norm(o.title).includes(n)) : offers;
  }, [offers, q]);
  const canDuplicate = offersState === 'ready' && offers.length > 0;

  const tile = (icon: React.ReactNode) => (
    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-cv-blue dark:bg-blue-500/15 dark:text-blue-300">
      {icon}
    </span>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-balance text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{tx.choose_title}</h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.choose_subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button type="button" onClick={onNew} className={optionCls} data-testid="choose-new">
          {tile(<PencilSquareIcon className="h-6 w-6" />)}
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-slate-900 dark:text-white">{tx.choose_new}</span>
            <span className="mt-1 block text-sm leading-snug text-slate-600 dark:text-dark-text-secondary">{tx.choose_new_desc}</span>
          </span>
          <ArrowRightIcon className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-cv-blue" aria-hidden="true" />
        </button>

        <button type="button" onClick={() => setPicking(true)} disabled={!canDuplicate && offersState !== 'loading'} className={optionCls} data-testid="choose-duplicate">
          {tile(<DocumentDuplicateIcon className="h-6 w-6" />)}
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-slate-900 dark:text-white">{tx.choose_dup}</span>
            <span className="mt-1 block text-sm leading-snug text-slate-600 dark:text-dark-text-secondary">
              {offersState === 'ready' && offers.length === 0 ? tx.choose_dup_none : tx.choose_dup_desc}
            </span>
          </span>
          <ArrowRightIcon className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-cv-blue group-disabled:opacity-0" aria-hidden="true" />
        </button>
      </div>

      {picking && (
        <section className="mt-8 border-t border-slate-200 pt-6 dark:border-dark-border" aria-labelledby="choose-pick-title">
          <h3 id="choose-pick-title" className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            {tx.choose_dup_pick}
          </h3>
          {offersState === 'loading' && <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{tx.choose_loading_list}</p>}
          {offersState === 'error' && (
            <div role="alert" className="text-sm text-red-700 dark:text-red-400">
              {tx.load_error}{' '}
              <button type="button" onClick={onRetry} className="underline">
                {tx.retry}
              </button>
            </div>
          )}
          {offersState === 'ready' && (
            <>
              {offers.length > 8 && (
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx.choose_search} aria-label={tx.choose_search} className={`${inputCls} mb-3`} />
              )}
              {filtered.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{tx.choose_dup_empty_search}</p>
              ) : (
                <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-dark-border">
                  {filtered.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900 dark:text-white">{o.title}</p>
                        <p className="text-[13px] text-slate-600 dark:text-dark-text-secondary">
                          {[o.location_city, formatDate(o.created_at, lang)].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <JobStatusBadge status={o.status} />
                      <button type="button" onClick={() => onDuplicate(o.id)} className={btnSmallCls} data-testid="choose-duplicate-item">
                        {tx.choose_use}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <div className="mt-4">
            <button type="button" onClick={() => setPicking(false)} className={btnSecondaryCls}>
              {tx.choose_back}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ChooseStart;
