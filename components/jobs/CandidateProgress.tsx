import React from 'react';
import { CheckIcon, MinusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CandidateStatus } from '../../lib/jobsApi';
import { usePanelText } from './textosPanel';
import type { Tone } from './PanelBits';

type StepState = 'done' | 'current' | 'pending' | 'good' | 'bad' | 'neutral';

interface Props {
  status: CandidateStatus;
  className?: string;
}

const NODE_CLS: Record<StepState, string> = {
  done: 'bg-cv-blue text-white dark:bg-cv-blue-light dark:text-dark-bg-primary',
  current: 'bg-white ring-2 ring-cv-blue dark:bg-dark-bg-secondary dark:ring-cv-blue-light',
  pending: 'border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-dark-bg-secondary',
  good: 'bg-green-600 text-white dark:bg-green-500 dark:text-dark-bg-primary',
  bad: 'bg-red-600 text-white dark:bg-red-500 dark:text-dark-bg-primary',
  neutral: 'bg-slate-500 text-white dark:bg-slate-400 dark:text-dark-bg-primary',
};

const LABEL_CLS: Record<StepState, string> = {
  done: 'text-slate-700 dark:text-dark-text-primary',
  current: 'font-semibold text-slate-900 dark:text-white',
  pending: 'text-slate-500 dark:text-dark-text-secondary',
  good: 'font-semibold text-green-700 dark:text-green-400',
  bad: 'font-semibold text-red-700 dark:text-red-400',
  neutral: 'text-slate-600 dark:text-dark-text-secondary',
};

/** Clases del distintivo de estado del candidato (se conserva por compatibilidad; el panel usa punto + texto). */
export const CANDIDATE_BADGE_CLS: Record<CandidateStatus, string> = {
  SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  VIEWED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SELECTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  NOT_SELECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  WITHDRAWN: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

/** Tono del punto de color del estado del candidato (el texto siempre lo acompana). */
export const CANDIDATE_TONE: Record<CandidateStatus, Tone> = {
  SENT: 'neutral',
  VIEWED: 'info',
  IN_PROGRESS: 'active',
  SELECTED: 'success',
  NOT_SELECTED: 'danger',
  WITHDRAWN: 'neutral',
};

/** Enviada -> Vista -> En proceso -> Resultado, segun candidate_status. */
const CandidateProgress: React.FC<Props> = ({ status, className = '' }) => {
  const tx = usePanelText();

  const steps: Array<{ key: string; label: string; state: StepState }> = (() => {
    const sent = { key: 'sent', label: tx.step_sent };
    const viewed = { key: 'viewed', label: tx.step_viewed };
    const progress = { key: 'progress', label: tx.step_progress };
    const result = { key: 'result', label: tx.step_result };
    switch (status) {
      case 'SENT':
        return [{ ...sent, state: 'current' }, { ...viewed, state: 'pending' }, { ...progress, state: 'pending' }, { ...result, state: 'pending' }];
      case 'VIEWED':
        return [{ ...sent, state: 'done' }, { ...viewed, state: 'current' }, { ...progress, state: 'pending' }, { ...result, state: 'pending' }];
      case 'IN_PROGRESS':
        return [{ ...sent, state: 'done' }, { ...viewed, state: 'done' }, { ...progress, state: 'current' }, { ...result, state: 'pending' }];
      case 'SELECTED':
        return [{ ...sent, state: 'done' }, { ...viewed, state: 'done' }, { ...progress, state: 'done' }, { key: 'result', label: tx.st_SELECTED, state: 'good' }];
      case 'NOT_SELECTED':
        return [{ ...sent, state: 'done' }, { ...viewed, state: 'done' }, { ...progress, state: 'done' }, { key: 'result', label: tx.st_NOT_SELECTED, state: 'bad' }];
      default: // WITHDRAWN
        return [{ ...sent, state: 'done' }, { key: 'result', label: tx.st_WITHDRAWN, state: 'neutral' }];
    }
  })();

  const reached = (s: StepState) => s === 'done' || s === 'good' || s === 'bad' || s === 'neutral';
  const stateWord = (s: StepState) => (s === 'current' ? tx.step_current : s === 'pending' ? tx.step_pending : tx.step_done);

  return (
    <ol className={`grid ${className}`} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={tx.progressLabel}>
      {steps.map((s, i) => {
        const prev = steps[i - 1];
        const leftOn = !!prev && reached(prev.state);
        const rightOn = reached(s.state) && s.state !== 'neutral' && i < steps.length - 1;
        return (
          <li key={s.key} className="flex min-w-0 flex-col items-center text-center" aria-current={s.state === 'current' ? 'step' : undefined}>
            <div className="flex w-full items-center" aria-hidden="true">
              <span className={`h-0.5 flex-1 rounded-full ${i === 0 ? 'invisible' : leftOn ? 'bg-cv-blue dark:bg-cv-blue-light' : 'bg-slate-200 dark:bg-white/15'}`} />
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${NODE_CLS[s.state]}`}>
                {(s.state === 'done' || s.state === 'good') && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                {s.state === 'current' && <span className="h-2 w-2 rounded-full bg-cv-blue dark:bg-cv-blue-light" />}
                {s.state === 'bad' && <XMarkIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                {s.state === 'neutral' && <MinusIcon className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className={`h-0.5 flex-1 rounded-full ${i === steps.length - 1 ? 'invisible' : rightOn ? 'bg-cv-blue dark:bg-cv-blue-light' : 'bg-slate-200 dark:bg-white/15'}`} />
            </div>
            <span className={`mt-2 px-0.5 text-[13px] leading-tight ${LABEL_CLS[s.state]}`}>
              {s.label}
              <span className="sr-only"> ({stateWord(s.state)})</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default CandidateProgress;
