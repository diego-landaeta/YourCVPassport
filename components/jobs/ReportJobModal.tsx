import React, { useRef, useState } from 'react';
import { CheckCircleIcon, CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { reportJob } from '../../lib/jobsApi';
import { tkey, useJobsText } from './textos';
import { FOCUS_RING, useDialogBehavior } from './ApplyDialog';
import { DetailStyles } from './DetailParts';

const REASONS = ['SCAM', 'DISCRIMINATORY', 'MISLEADING', 'ADULT_ILLEGAL', 'DUPLICATE', 'OTHER'] as const;

interface Props {
  jobId: string;
  userId: string;
  onClose: () => void;
}

/** «Denunciar oferta»: INSERT en job_reports (una denuncia por usuario y oferta). */
const ReportJobModal: React.FC<Props> = ({ jobId, userId, onClose }) => {
  const tx = useJobsText();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [touched, setTouched] = useState(false);

  useDialogBehavior(dialogRef, onClose, !sending);

  const send = async () => {
    setTouched(true);
    if (!reason) return;
    setSending(true);
    setMessage(null);
    try {
      await reportJob(jobId, userId, reason, details.slice(0, 2000));
      setMessage({ kind: 'ok', text: tx.reportThanks });
    } catch (e) {
      // 23505: unique (job_id, reporter_id) -> ya la habia denunciado
      const code = (e as { code?: string } | null)?.code;
      setMessage(code === '23505'
        ? { kind: 'ok', text: tx.reportAlready }
        : { kind: 'error', text: tx.reportError });
    } finally {
      setSending(false);
    }
  };

  const done = message?.kind === 'ok';

  return (
    <div className="jd-scope">
      <DetailStyles />
      <div className="jd-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-900/55 dark:bg-black/65 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onClose(); }}>
        <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="report-title"
          className="jd-pop flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white focus:outline-none dark:bg-dark-bg-secondary sm:max-w-md sm:rounded-2xl sm:border sm:border-slate-200 dark:sm:border-dark-border sm:shadow-[0_28px_70px_-28px_rgba(15,23,42,.55)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-dark-border sm:px-6">
            <h2 id="report-title" className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary">{tx.reportTitle}</h2>
            <button type="button" onClick={onClose} disabled={sending} aria-label={tx.close}
              className={`-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary dark:hover:text-dark-text-primary ${FOCUS_RING}`}>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {done ? (
            <div className="space-y-5 overflow-y-auto px-6 py-8 text-center" role="status">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                <CheckCircleIcon className="h-8 w-8" aria-hidden="true" />
              </span>
              <p className="text-[15px] leading-relaxed text-slate-700 dark:text-dark-text-secondary">{message?.text}</p>
              <button type="button" onClick={onClose} className={`h-12 rounded-xl bg-cv-blue px-8 font-semibold text-white transition-colors duration-150 hover:bg-cv-blue-dark ${FOCUS_RING}`}>{tx.close}</button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.reportIntro}</p>
                <fieldset>
                  <legend className="mb-2.5 text-[15px] font-medium text-slate-900 dark:text-dark-text-primary">{tx.reportReason}</legend>
                  <div className="space-y-2">
                    {REASONS.map((r) => (
                      <label key={r} className="relative block cursor-pointer">
                        <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                        <span className={`flex min-h-11 items-center gap-3 rounded-xl border bg-white px-4 py-2 text-[15px] text-slate-800 transition-colors duration-150 hover:border-slate-400 peer-checked:border-cv-blue peer-checked:bg-blue-50 peer-checked:ring-1 peer-checked:ring-cv-blue peer-focus-visible:ring-2 peer-focus-visible:ring-cv-blue peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:bg-dark-bg-primary dark:text-dark-text-primary dark:hover:border-dark-border-light dark:peer-checked:bg-cv-blue/15 dark:peer-focus-visible:ring-offset-dark-bg-secondary ${touched && !reason ? 'border-red-400 dark:border-red-500/60' : 'border-slate-300 dark:border-dark-border'}`}>
                          <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${reason === r ? 'border-cv-blue bg-cv-blue text-white' : 'border-slate-400 dark:border-dark-border-light'}`}>
                            {reason === r && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                          </span>
                          {tkey(tx, `reason_${r}`, r)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {touched && !reason && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">{tx.reportReason}</p>}
                </fieldset>
                <div>
                  <label htmlFor="report-details" className="mb-1.5 block text-[15px] font-medium text-slate-900 dark:text-dark-text-primary">{tx.reportDetails}</label>
                  <textarea id="report-details" rows={4} maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} aria-describedby="report-details-hint"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 transition-colors duration-150 hover:border-slate-400 focus:border-cv-blue focus:outline-none focus:ring-2 focus:ring-cv-blue dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:hover:border-dark-border-light" />
                  <p id="report-details-hint" className="mt-1.5 text-[13px] text-slate-600 dark:text-dark-text-secondary">{tx.reportDetailsHint}</p>
                </div>
              </div>
              <div className="shrink-0 border-t border-slate-200 dark:border-dark-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {message?.kind === 'error' && (
                  <div role="alert" className="mx-5 mt-3 flex items-start gap-2.5 rounded-xl bg-red-50 py-2.5 pl-4 pr-1.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/30 sm:mx-6">
                    <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <span className="flex-1 pt-px leading-snug">{message.text}</span>
                    <button type="button" onClick={() => setMessage(null)} aria-label={tx.close}
                      className={`-my-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-700 transition-colors duration-150 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-500/20 ${FOCUS_RING}`}>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <div className="flex justify-end gap-3 px-5 py-4 sm:px-6">
                  <button type="button" onClick={onClose} disabled={sending} className={`h-12 rounded-xl px-5 font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-60 dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary ${FOCUS_RING}`}>{tx.cancel}</button>
                  <button type="button" onClick={() => void send()} disabled={sending} className={`h-12 rounded-xl bg-red-600 px-6 font-semibold text-white transition-colors duration-150 hover:bg-red-700 disabled:opacity-60 ${FOCUS_RING} focus-visible:ring-red-500`}>
                    {sending ? tx.reportSending : tx.reportSend}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportJobModal;
