import React from 'react';
import { useJobsText } from './textos';

const bar = 'rounded-md bg-slate-200 dark:bg-dark-bg-tertiary';

/** Esqueleto con la misma forma que JobCard: marca, titulo, empresa, metadatos, resumen y pie. */
const JobListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const tx = useJobsText();
  return (
    <div role="status" aria-label={tx.loading} aria-busy="true">
    <ul className="space-y-3 sm:space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-bg-secondary sm:p-5" aria-hidden="true">
          <div className="flex gap-3.5 motion-safe:animate-pulse sm:gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 dark:bg-dark-bg-tertiary" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className={`${bar} h-5 w-3/5 max-w-sm`} />
                  <div className={`${bar} h-4 w-2/5 max-w-[14rem]`} />
                </div>
                <div className={`${bar} hidden h-5 w-36 sm:block`} />
              </div>
              <div className={`${bar} mt-3 h-4 w-4/5 max-w-md`} />
              <div className="mt-3 space-y-2">
                <div className={`${bar} h-4 w-full max-w-[68ch]`} />
                <div className={`${bar} h-4 w-2/3 max-w-[44ch]`} />
              </div>
              <div className={`${bar} mt-4 h-3.5 w-1/2 max-w-xs`} />
            </div>
          </div>
        </li>
      ))}

    </ul>
    <span className="sr-only">{tx.loading}</span>
    </div>
  );
};

export default JobListSkeleton;
