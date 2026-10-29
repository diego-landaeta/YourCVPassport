import React from 'react';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { fmt } from '../../../lib/bolsaText';
import type { JobText } from '../../../lib/jobPostingText';

/**
 * Estado de cada paso, calculado por la PÁGINA con `validateStep` (la misma fuente que
 * usa «Continuar» y la revisión final): la barra no puede decir «completo» si la
 * validación no lo da por bueno.
 *   done    = alcanzado y sin errores (verde)
 *   missing = alcanzado pero falta algo obligatorio (ámbar)
 *   pending = todavía no alcanzado (gris)
 */
export type StepState = 'done' | 'missing' | 'pending';

export interface StepBarItem {
  id: string;
  label: string;
  state: StepState;
}

interface Props {
  tx: JobText;
  steps: StepBarItem[];
  current: number;
  busy?: boolean;
  onSelect: (index: number) => void;
}

const CIRCLE: Record<StepState, string> = {
  done: 'bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/70',
  missing: 'bg-amber-50 text-amber-800 border-amber-500 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/70',
  pending: 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-dark-bg-tertiary dark:text-slate-400 dark:border-dark-border',
};

export const StepBar: React.FC<Props> = ({ tx, steps, current, busy, onSelect }) => {
  const total = steps.length;
  const stateText = (s: StepState) => (s === 'done' ? tx.wz_step_done : s === 'missing' ? tx.wz_step_missing : tx.wz_step_pending);

  return (
    <nav aria-label={fmt(tx.wz_step_of, { n: current + 1, total })} className="mb-8">
      <p className="sm:hidden mb-3 text-sm font-medium text-slate-800 dark:text-slate-100">
        {fmt(tx.wz_step_of, { n: current + 1, total })} · {steps[current]?.label}
      </p>
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const reachable = s.state !== 'pending' || isCurrent;
          const prev = steps[i - 1];
          return (
            <li key={s.id} className="relative flex justify-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-[1.375rem] right-1/2 h-0.5 w-full -translate-y-1/2 ${
                    prev.state === 'done' ? 'bg-emerald-400 dark:bg-emerald-500/70' : 'bg-slate-200 dark:bg-dark-border'
                  }`}
                />
              )}
              <button
                type="button"
                disabled={!reachable || busy}
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${fmt(tx.wz_step_of, { n: i + 1, total })}: ${s.label}, ${stateText(s.state)}`}
                className="group relative z-10 flex min-h-[2.75rem] flex-col items-center gap-2 rounded-lg px-1 py-1 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg-primary disabled:cursor-not-allowed"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors ${
                    isCurrent
                      ? 'border-cv-blue bg-cv-blue text-white shadow-[0_0_0_4px_rgba(37,99,235,.15)] dark:shadow-[0_0_0_4px_rgba(96,165,250,.22)]'
                      : CIRCLE[s.state]
                  } ${!isCurrent && reachable ? 'group-hover:brightness-95' : ''}`}
                >
                  {!isCurrent && s.state === 'done' ? (
                    <CheckIcon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  ) : !isCurrent && s.state === 'missing' ? (
                    <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`hidden sm:block max-w-[8.5rem] text-[13px] leading-tight ${
                    isCurrent ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-dark-text-secondary'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 hidden sm:flex items-center justify-center gap-5 text-xs text-slate-600 dark:text-dark-text-secondary" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {tx.wz_legend_done}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {tx.wz_legend_missing}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          {tx.wz_legend_pending}
        </span>
      </p>
    </nav>
  );
};

export default StepBar;
