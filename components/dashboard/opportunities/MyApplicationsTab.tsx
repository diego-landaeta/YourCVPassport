import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronDownIcon, DocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useJobApplications, type JobApplication, type JobApplicationStatus } from '../../../hooks/useJobApplications';
import { useLanguage } from '../../../contexts/LanguageContext';
import CandidateProgress, { CANDIDATE_TONE } from '../../jobs/CandidateProgress';
import CompanyMark from '../../jobs/ui/CompanyMark';
import {
  BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FOCUS, LIFT, PanelEmpty, PanelError, PanelSkeleton, SEARCH_FROM, SURFACE,
  SearchBox, StatusDot, TEXT_META, TEXT_STRONG, Timeline, norm, notifyError, useReveal,
} from '../../jobs/PanelBits';
import { pkey, usePanelText } from '../../jobs/textosPanel';
import { fmt } from '../../../lib/bolsaText';
import { errorCode, fetchApplicationHistory, withdrawApplication, type ApplicationHistoryRow, type CandidateStatus } from '../../../lib/jobsApi';
import { formatDate, jobDetailPath, jobsRootPath } from '../../../lib/jobsFormat';

interface MyApplicationsTabProps {
  profileId: string;
  statusFilter?: JobApplicationStatus | JobApplicationStatus[]; // External status filter from parent (single or array)
  /** Avisa del total de candidaturas (para el contador de la pestana). */
  onCount?: (n: number) => void;
}

type Filter = 'all' | 'active' | 'selected' | 'notSelected' | 'withdrawn';

const FILTER_TEST: Record<Filter, (s: CandidateStatus) => boolean> = {
  all: () => true,
  active: (s) => s === 'SENT' || s === 'VIEWED' || s === 'IN_PROGRESS',
  selected: (s) => s === 'SELECTED',
  notSelected: (s) => s === 'NOT_SELECTED',
  withdrawn: (s) => s === 'WITHDRAWN',
};

/** Una candidatura: estado en lenguaje del candidato, progreso, historial y «Retirarme». */
const ApplicationCard: React.FC<{ app: JobApplication; onChanged: () => void }> = ({ app, onChanged }) => {
  const tx = usePanelText();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ApplicationHistoryRow[] | null>(null);
  const [historyState, setHistoryState] = useState<'idle' | 'loading' | 'error'>('idle');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const withdrawRef = useRef<HTMLButtonElement>(null);

  const cs = app.candidate_status;
  const closed = ['CLOSED', 'FILLED', 'EXPIRED'].includes(app.job_status || '');
  const unavailable = !app.job_status && !app.job_posting?.slug;
  const canWithdraw = cs !== 'WITHDRAWN' && cs !== 'SELECTED' && cs !== 'NOT_SELECTED' && !closed;
  const company = app.job_posting?.company;
  const title = app.job_posting?.title || tx.jobUnavailable;
  const detailPath = jobDetailPath(app.job_posting?.slug || '', lang);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const closeConfirm = () => {
    setConfirming(false);
    // El foco vuelve al boton que abrio la confirmacion
    requestAnimationFrame(() => withdrawRef.current?.focus());
  };

  const toggleHistory = async () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && history === null) {
      setHistoryState('loading');
      try {
        setHistory(await fetchApplicationHistory(app.id));
        setHistoryState('idle');
      } catch {
        setHistoryState('error');
      }
    }
  };

  const doWithdraw = async () => {
    setWithdrawing(true);
    try {
      await withdrawApplication(app.id);
      toast.success(tx.withdrawDone);
      setConfirming(false);
      setHistory(null);
      onChanged();
    } catch (e) {
      notifyError(pkey(tx, `wd_${errorCode(e)}`, tx.withdrawError), tx.closeNotice);
    } finally {
      setWithdrawing(false);
    }
  };

  // El historial del candidato junta los pasos consecutivos que se ven igual («En proceso»)
  const visibleHistory = (history || []).reduce<Array<{ label: string; at: string }>>((acc, h) => {
    const label = pkey(tx, `hs_${h.to_status}`, h.to_status);
    if (acc.length && acc[acc.length - 1].label === label) return acc;
    acc.push({ label, at: h.created_at });
    return acc;
  }, []);

  const meta: string[] = [];
  if (company?.company_name) meta.push(company.company_name);
  meta.push(fmt(tx.appliedOn, { date: formatDate(app.created_at, lang) }));
  if (app.viewed_at && cs !== 'VIEWED' && cs !== 'SENT') meta.push(fmt(tx.viewedOn, { date: formatDate(app.viewed_at, lang) }));
  if (app.match_score != null) meta.push(`${tx.matchLabel} ${app.match_score} %`);

  return (
    <article className={`${SURFACE} ${LIFT} p-5`} aria-labelledby={`app-t-${app.id}`}>
      <div className="flex items-start gap-4">
        <CompanyMark name={company?.company_name || title} logoUrl={company?.logo_url} size="card" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
            <div className="min-w-0">
              <h3 id={`app-t-${app.id}`} className={`text-lg font-semibold leading-snug break-words ${TEXT_STRONG}`}>
                {unavailable ? (
                  title
                ) : (
                  <a
                    href={detailPath}
                    onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); navigate(detailPath); } }}
                    className={`rounded hover:underline hover:decoration-slate-400 hover:underline-offset-4 ${FOCUS}`}
                  >
                    {title}
                  </a>
                )}
              </h3>
              <p className={`mt-0.5 text-sm tabular-nums ${TEXT_META}`}>{meta.join(' · ')}</p>
            </div>
            <StatusDot tone={CANDIDATE_TONE[cs]} className="shrink-0">{pkey(tx, `st_${cs}`, cs)}</StatusDot>
          </div>
          {closed && <p className="mt-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">{tx.jobClosed}</p>}
        </div>
      </div>

      <div className="mt-5">
        <CandidateProgress status={cs} />
      </div>

      {confirming ? (
        <div role="alertdialog" aria-labelledby={`wd-${app.id}`} aria-describedby={`wd-d-${app.id}`} className="mt-5 rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <p id={`wd-${app.id}`} className="flex items-center gap-2 font-semibold text-red-900 dark:text-red-200">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />{tx.withdrawConfirmTitle}
          </p>
          <p id={`wd-d-${app.id}`} className="mt-1 text-sm text-red-900 dark:text-red-200">{tx.withdrawConfirmText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void doWithdraw()} disabled={withdrawing} className={BTN_DANGER}>
              {withdrawing ? tx.withdrawing : tx.withdrawConfirmYes}
            </button>
            <button ref={cancelRef} type="button" onClick={closeConfirm} disabled={withdrawing} className={BTN_SECONDARY}>
              {tx.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
          {!unavailable && (
            <button type="button" onClick={() => navigate(detailPath)} className={BTN_SECONDARY}>{tx.viewJob}</button>
          )}
          {canWithdraw && (
            <button ref={withdrawRef} type="button" onClick={() => setConfirming(true)} className={BTN_GHOST}>{tx.withdraw}</button>
          )}
          <button
            type="button"
            onClick={() => void toggleHistory()}
            aria-expanded={historyOpen}
            aria-controls={`hist-${app.id}`}
            className={`${BTN_GHOST} ml-auto !text-cv-blue dark:!text-cv-blue-light`}
          >
            {historyOpen ? tx.hideHistory : tx.history}
            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-150 ${historyOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
      )}

      {historyOpen && (
        <div id={`hist-${app.id}`} className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10" aria-live="polite">
          {historyState === 'loading' && <p className={`text-sm ${TEXT_META}`}>{tx.historyLoading}</p>}
          {historyState === 'error' && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{tx.historyError}</p>}
          {historyState === 'idle' && history && (
            visibleHistory.length === 0 ? (
              <p className={`text-sm ${TEXT_META}`}>{tx.historyEmpty}</p>
            ) : (
              <Timeline label={tx.history} items={visibleHistory.map((h, i) => ({ key: String(i), label: h.label, at: formatDate(h.at, lang) }))} />
            )
          )}
        </div>
      )}
    </article>
  );
};

/**
 * Mis candidaturas: lee la vista my_job_applications (estados del candidato), con
 * historial por candidatura y «Retirarme». Se actualiza sola (ver useJobApplications).
 */
const MyApplicationsTab: React.FC<MyApplicationsTabProps> = ({ profileId, statusFilter: externalStatusFilter, onCount }) => {
  const tx = usePanelText();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const { applications, loading, error, refetch } = useJobApplications(profileId, {
    statusFilter: externalStatusFilter
      ? Array.isArray(externalStatusFilter) ? externalStatusFilter : [externalStatusFilter]
      : undefined,
  });

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    (Object.keys(FILTER_TEST) as Filter[]).forEach((f) => { c[f] = applications.filter((a) => FILTER_TEST[f](a.candidate_status)).length; });
    return c;
  }, [applications]);

  useEffect(() => {
    if (!loading && !error && !externalStatusFilter) onCount?.(applications.length);
  }, [loading, error, externalStatusFilter, applications.length, onCount]);

  const visible = useMemo(() => {
    const q = norm(query.trim());
    return applications.filter((a) => FILTER_TEST[filter](a.candidate_status)
      && (!q || norm(`${a.job_posting?.title || ''} ${a.job_posting?.company?.company_name || ''}`).includes(q)));
  }, [applications, filter, query]);

  const listRef = useReveal<HTMLUListElement>(!loading && !error && applications.length > 0);
  const goJobs = () => navigate(jobsRootPath(lang));

  if (loading) return <PanelSkeleton rows={3} label={tx.appsLoading} />;
  if (error) return <PanelError message={tx.appsError} retryLabel={tx.retry} onRetry={() => void refetch()} />;

  if (applications.length === 0) {
    return (
      <PanelEmpty
        icon={DocumentCheckIcon}
        title={externalStatusFilter ? tx.appsFilteredEmpty : tx.appsEmptyTitle}
        text={externalStatusFilter ? undefined : tx.appsEmptyText}
        action={{ label: tx.exploreJobs, onClick: goJobs }}
      />
    );
  }

  const filters: Array<{ id: Filter; label: string }> = [
    { id: 'all', label: tx.fltAll },
    { id: 'active', label: tx.fltActive },
    { id: 'selected', label: tx.fltSelected },
    { id: 'notSelected', label: tx.fltNotSelected },
    { id: 'withdrawn', label: tx.fltWithdrawn },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={tx.filterLabel} className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${FOCUS} ${
                  on
                    ? 'border-cv-blue bg-cv-blue text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-transparent dark:text-dark-text-secondary dark:hover:bg-white/5'
                }`}
              >
                {f.label}
                <span className={`tabular-nums ${on ? 'text-white/90' : 'text-slate-500 dark:text-dark-text-secondary'}`}>{counts[f.id]}</span>
              </button>
            );
          })}
        </div>
        {applications.length >= SEARCH_FROM && (
          <SearchBox className="sm:w-72" value={query} onChange={setQuery} label={tx.searchLabel} placeholder={tx.searchPlaceholder} clearLabel={tx.searchClear} />
        )}
      </div>

      {visible.length === 0 ? (
        <PanelEmpty
          icon={DocumentCheckIcon}
          title={query ? tx.searchEmpty : tx.appsFilteredEmpty}
          action={{ label: query ? tx.searchClear : tx.showAll, onClick: () => { setQuery(''); if (!query) setFilter('all'); } }}
        />
      ) : (
        <ul ref={listRef} className="space-y-3">
          {visible.map((app) => (
            <li key={app.id}>
              <ApplicationCard app={app} onChanged={() => void refetch()} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyApplicationsTab;
