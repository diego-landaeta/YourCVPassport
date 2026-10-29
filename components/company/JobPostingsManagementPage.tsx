import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import { dateInDays, deadlineToInstant, duplicateJobPath, editJobPath, formatDate, isReviewStatus, parseRpcError } from '../../lib/jobPostingModel';
import { msg, useJobText, type JobText } from '../../lib/jobPostingText';
import { BriefcaseIcon, ExclamationCircleIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { btnGhostCls, btnPrimaryCls, btnSecondaryCls, btnSmallCls, cardCls, inputCls } from './jobwizard/fields';
import { deleteDraft, loadCompanyContext, setJobStatus } from './jobwizard/jobApi';
import { jobPath } from '../../lib/jobsFormat';
import { JobStatusBadge } from './jobwizard/StatusBadge';

interface JobRow {
  id: string;
  title: string;
  slug: string | null;
  country_code: string | null;
  status: string;
  location_city: string | null;
  work_mode: string | null;
  is_remote: boolean | null;
  published_at: string | null;
  application_deadline: string | null;
  views_count: number | null;
  applications_count: number | null;
  review_reason: string | null;
  created_at: string;
}

type FilterKey = 'ALL' | 'DRAFT' | 'REVIEW' | 'REJECTED' | 'PUBLISHED' | 'PAUSED' | 'ENDED';
type SortKey = 'newest' | 'oldest' | 'apps' | 'views';
type Confirm = { id: string; kind: 'close' | 'filled' | 'delete' | 'renew' } | null;

const JOB_LIST_COLUMNS =
  'id, title, slug, country_code, status, location_city, work_mode, is_remote, published_at, application_deadline, views_count, applications_count, review_reason, created_at';

const FILTERS: FilterKey[] = ['ALL', 'DRAFT', 'REVIEW', 'REJECTED', 'PUBLISHED', 'PAUSED', 'ENDED'];

function inFilter(status: string, f: FilterKey): boolean {
  switch (f) {
    case 'ALL':
      return true;
    case 'REVIEW':
      return isReviewStatus(status);
    case 'ENDED':
      return status === 'CLOSED' || status === 'FILLED' || status === 'EXPIRED';
    default:
      return status === f;
  }
}

function filterLabel(tx: JobText, f: FilterKey): string {
  switch (f) {
    case 'ALL':
      return tx.mg_filter_all;
    case 'REVIEW':
      return tx.mg_filter_review;
    case 'ENDED':
      return tx.mg_filter_ended;
    default:
      return msg(tx, `status_${f}`);
  }
}

const JobPostingsManagementPage: React.FC = () => {
  const tx = useJobText();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [newCounts, setNewCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [sort, setSort] = useState<SortKey>('newest');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const load = useCallback(async () => {
    setState((s) => (s === 'ready' ? s : 'loading'));
    try {
      const ctx = await loadCompanyContext();
      setCompanyId(ctx.companyId);
      const { data, error } = await supabase
        .from('job_postings')
        .select(JOB_LIST_COLUMNS)
        .eq('company_id', ctx.companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs((data || []) as unknown as JobRow[]);

      // Candidaturas nuevas = recibidas y aún sin abrir por la empresa. Si falla no rompe la tabla.
      try {
        const { data: apps, error: appsErr } = await supabase
          .from('job_applications')
          .select('job_posting_id')
          .eq('company_id', ctx.companyId)
          .eq('status', 'NEW')
          .eq('viewed_by_company', false)
          .limit(5000);
        if (appsErr) throw appsErr;
        const counts: Record<string, number> = {};
        for (const a of (apps || []) as { job_posting_id: string }[]) counts[a.job_posting_id] = (counts[a.job_posting_id] || 0) + 1;
        setNewCounts(counts);
      } catch {
        setNewCounts({});
      }
      setState('ready');
    } catch (err) {
      const m = (err as Error)?.message;
      if (m === 'AUTH') {
        navigate('/login');
        return;
      }
      if (m === 'NO_COMPANY') {
        toast.error(tx.no_company);
        navigate('/company/register');
        return;
      }
      console.error('[JobPostingsManagement] load', err);
      setState('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c = {} as Record<FilterKey, number>;
    for (const f of FILTERS) c[f] = jobs.filter((j) => inFilter(j.status, f)).length;
    return c;
  }, [jobs]);

  const visible = useMemo(() => {
    const q = query.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const list = jobs.filter((j) => {
      if (!inFilter(j.status, filter)) return false;
      if (!q) return true;
      const hay = `${j.title} ${j.location_city || ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      return hay.includes(q);
    });
    const t = (s: string) => new Date(s).getTime();
    list.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return t(a.created_at) - t(b.created_at);
        case 'apps':
          return (b.applications_count || 0) - (a.applications_count || 0);
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0);
        default:
          return t(b.created_at) - t(a.created_at);
      }
    });
    return list;
  }, [jobs, filter, sort, query]);

  // --- Acciones -----------------------------------------------------------------------
  const run = async (job: JobRow, fn: () => Promise<void>) => {
    setBusyId(job.id);
    try {
      await fn();
      await load();
    } catch (err) {
      console.error('[JobPostingsManagement] action', err);
      const info = parseRpcError(err);
      toast.error(info.code ? msg(tx, `err_${info.code}`) : tx.err_unknown);
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const pause = (j: JobRow) =>
    run(j, async () => {
      await setJobStatus(j.id, 'PAUSED');
      toast.success(tx.tt_paused);
    });

  const resume = (j: JobRow) =>
    run(j, async () => {
      const status = await setJobStatus(j.id, 'PUBLISHED');
      // Si el texto cambió durante la pausa, el servidor la devuelve a revisión.
      if (isReviewStatus(status)) toast(tx.tt_resumed_review);
      else toast.success(tx.tt_resumed);
    });

  const close = (j: JobRow, kind: 'CLOSED' | 'FILLED') =>
    run(j, async () => {
      await setJobStatus(j.id, kind);
      toast.success(kind === 'CLOSED' ? tx.tt_closed : tx.tt_filled);
    });

  const remove = (j: JobRow) =>
    run(j, async () => {
      await deleteDraft(j.id);
      toast.success(tx.tt_deleted);
    });

  // Renovar una caducada: vuelve a borrador con 30 días y se revisa/publica desde el último paso
  // (hay que aceptar de nuevo las condiciones de publicación).
  const renew = (j: JobRow) =>
    run(j, async () => {
      await setJobStatus(j.id, 'DRAFT', { application_deadline: deadlineToInstant(dateInDays(30)) });
      toast.success(tx.tt_renewed);
      navigate(editJobPath(j.id, 5));
    });

  const askConfirm = (id: string, kind: NonNullable<Confirm>['kind']) => setConfirm({ id, kind });

  const place = (j: JobRow) => (j.is_remote || j.work_mode === 'REMOTE' ? tx.mg_city_remote : j.location_city || '—');
  const newOf = (j: JobRow) => newCounts[j.id] || 0;
  const appsCell = (j: JobRow) => ((j.applications_count || 0) === 0 ? tx.mg_apps_cell_none : fmt(tx.mg_apps_cell, { new: newOf(j), total: j.applications_count || 0 }));

  const confirmText = (j: JobRow, kind: NonNullable<Confirm>['kind']) =>
    fmt(kind === 'close' ? tx.cf_close : kind === 'filled' ? tx.cf_filled : kind === 'renew' ? tx.cf_renew : tx.cf_delete, { title: j.title });

  const renderActions = (j: JobRow) => {
    const busy = busyId === j.id;
    // Orden fijo: principal (azul) → secundarias (grises) → destructivas (rojo al final).
    const btn = (label: string, onClick: () => void, kind: 'primary' | 'quiet' | 'danger' = 'quiet') => (
      <button
        type="button"
        disabled={busy}
        onClick={onClick}
        className={
          kind === 'primary'
            ? 'inline-flex items-center justify-center rounded-lg bg-cv-blue px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-dark-bg-secondary'
            : kind === 'danger'
              ? `${btnGhostCls} !text-red-700 hover:!bg-red-50 dark:!text-red-300 dark:hover:!bg-red-500/10`
              : btnGhostCls
        }
        aria-label={`${label}: ${j.title}`}
      >
        {label}
      </button>
    );
    const s = j.status;
    const duplicate = btn(tx.act_duplicate, () => navigate(duplicateJobPath(j.id)));
    const applications = btn(tx.act_applications, () => navigate(`/company/jobs/applications?job=${j.id}`), s === 'PUBLISHED' ? 'primary' : 'quiet');

    if (confirm && confirm.id === j.id) {
      const proceed = () => (confirm.kind === 'close' ? close(j, 'CLOSED') : confirm.kind === 'filled' ? close(j, 'FILLED') : confirm.kind === 'renew' ? renew(j) : remove(j));
      const destructive = confirm.kind === 'delete' || confirm.kind === 'close';
      return (
        <div
          role="alertdialog"
          aria-label={confirmText(j, confirm.kind)}
          className={`flex flex-col gap-3 rounded-lg border p-3 ${
            destructive ? 'border-red-200 bg-red-50 dark:border-red-400/30 dark:bg-red-500/10' : 'border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10'
          }`}
        >
          <p className="text-sm leading-snug text-slate-900 dark:text-slate-100">{confirmText(j, confirm.kind)}</p>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={proceed} className={`${btnPrimaryCls} !px-3.5 !py-1.5 text-sm`}>
              {tx.cf_yes}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirm(null)} className={btnSmallCls}>
              {tx.cf_no}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
        {s === 'DRAFT' && (
          <>
            {btn(tx.act_edit, () => navigate(editJobPath(j.id)), 'primary')}
            {duplicate}
            {btn(tx.act_delete, () => askConfirm(j.id, 'delete'), 'danger')}
          </>
        )}
        {isReviewStatus(s) && duplicate}
        {s === 'REJECTED' && (
          <>
            {btn(tx.act_resubmit, () => navigate(editJobPath(j.id)), 'primary')}
            {duplicate}
          </>
        )}
        {s === 'PUBLISHED' && (
          <>
            {applications}
            {btn(tx.act_edit, () => navigate(editJobPath(j.id)))}
            {btn(tx.act_pause, () => pause(j))}
            {duplicate}
            {j.slug && (
              <a
                href={jobPath(j.country_code, j.slug, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className={btnGhostCls}
                aria-label={`${tx.act_view_public}: ${j.title}`}
              >
                {tx.act_view_public}
              </a>
            )}
            {btn(tx.act_filled, () => askConfirm(j.id, 'filled'))}
            {btn(tx.act_close, () => askConfirm(j.id, 'close'), 'danger')}
          </>
        )}
        {s === 'PAUSED' && (
          <>
            {btn(tx.act_resume, () => resume(j), 'primary')}
            {btn(tx.act_edit, () => navigate(editJobPath(j.id)))}
            {duplicate}
            {btn(tx.act_filled, () => askConfirm(j.id, 'filled'))}
            {btn(tx.act_close, () => askConfirm(j.id, 'close'), 'danger')}
          </>
        )}
        {(s === 'CLOSED' || s === 'FILLED') && (
          <>
            {applications}
            {duplicate}
          </>
        )}
        {s === 'EXPIRED' && (
          <>
            {btn(tx.act_renew, () => askConfirm(j.id, 'renew'), 'primary')}
            {applications}
            {duplicate}
          </>
        )}
      </div>
    );
  };

  const renderHint = (j: JobRow) => {
    if (j.status === 'REJECTED' && j.review_reason)
      return (
        <p className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-red-700 dark:text-red-300">
          <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{fmt(tx.mg_rejected_reason, { reason: j.review_reason })}</span>
        </p>
      );
    if (isReviewStatus(j.status)) return <p className="mt-1.5 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">{tx.mg_in_review_hint}</p>;
    if (j.status === 'EXPIRED') return <p className="mt-1.5 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">{tx.mg_expired_hint}</p>;
    return null;
  };

  // --- Render --------------------------------------------------------------------------
  const header = (
    <div className="border-b border-slate-200 bg-blue-50/70 dark:border-dark-border dark:bg-dark-bg-secondary">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{tx.mg_title}</h1>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.mg_subtitle}</p>
        </div>
        <button type="button" onClick={() => navigate('/company/jobs/new')} className={btnPrimaryCls} data-testid="new-job">
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          {tx.mg_new}
        </button>
      </div>
    </div>
  );

  const page = (children: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg-primary">
      {header}
      {children}
    </div>
  );

  if (state === 'loading') {
    return page(
      <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cv-blue" aria-hidden="true" />
        <span className="ml-3 text-slate-600 dark:text-dark-text-secondary">{tx.mg_loading}</span>
      </div>,
    );
  }

  if (state === 'error') {
    return page(
      <div className="mx-auto max-w-xl px-4 py-16">
        <div role="alert" className={`${cardCls} p-8 text-center`}>
          <p className="mb-4 text-slate-800 dark:text-slate-200">{tx.mg_error}</p>
          <button type="button" className={btnPrimaryCls} onClick={() => void load()}>
            {tx.retry}
          </button>
        </div>
      </div>,
    );
  }

  const surface = 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.05),0_12px_32px_-20px_rgba(15,23,42,.2)] dark:border-dark-border dark:bg-dark-bg-secondary dark:shadow-none';

  return page(
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {jobs.length === 0 ? (
        <div className={`${cardCls} mx-auto max-w-xl px-8 py-14 text-center`}>
          <span aria-hidden="true" className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-cv-blue dark:bg-blue-500/15 dark:text-blue-300">
            <BriefcaseIcon className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h2 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">{tx.mg_empty_title}</h2>
          <p className="mx-auto mb-7 max-w-[44ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.mg_empty_desc}</p>
          <button type="button" onClick={() => navigate('/company/jobs/new')} className={btnPrimaryCls}>
            {tx.mg_empty_action}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tx.mg_search}
                  aria-label={tx.mg_search}
                  className={`${inputCls} !pl-10`}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                <span className="whitespace-nowrap">{tx.mg_sort_label}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${inputCls} !w-auto`}>
                  <option value="newest">{tx.mg_sort_newest}</option>
                  <option value="oldest">{tx.mg_sort_oldest}</option>
                  <option value="apps">{tx.mg_sort_apps}</option>
                  <option value="views">{tx.mg_sort_views}</option>
                </select>
              </label>
            </div>
            <div role="group" aria-label={tx.mg_filter_label} className="flex flex-wrap gap-2">
              {FILTERS.filter((f) => f === 'ALL' || counts[f] > 0 || f === filter).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary ${
                    filter === f
                      ? 'border-cv-blue bg-cv-blue text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-slate-200 dark:hover:bg-dark-bg-tertiary'
                  }`}
                >
                  {filterLabel(tx, f)} <span className="tabular-nums opacity-80">({counts[f]})</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className={`${cardCls} px-8 py-12 text-center`}>
              <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{tx.mg_noresults_title}</h2>
              <p className="mb-5 text-slate-600 dark:text-dark-text-secondary">{tx.mg_noresults_desc}</p>
              <button
                type="button"
                className={btnSecondaryCls}
                onClick={() => {
                  setFilter('ALL');
                  setQuery('');
                }}
              >
                {tx.mg_clear_filters}
              </button>
            </div>
          ) : (
            <>
              {/* Escritorio: tabla */}
              <div className={`${surface} hidden lg:block`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" data-testid="jobs-table">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[13px] text-slate-600 dark:border-dark-border dark:bg-dark-bg-tertiary dark:text-dark-text-secondary">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-medium">{tx.mg_col_title}</th>
                        <th scope="col" className="px-4 py-3 font-medium">{tx.mg_col_status}</th>
                        <th scope="col" className="px-4 py-3 font-medium">{tx.mg_col_published}</th>
                        <th scope="col" className="px-4 py-3 font-medium">{tx.mg_col_closes}</th>
                        <th scope="col" className="px-4 py-3 font-medium">{tx.mg_col_apps}</th>
                        <th scope="col" className="px-4 py-3 font-medium">{tx.mg_col_views}</th>
                        <th scope="col" className="px-5 py-3 font-medium">{tx.mg_col_actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                      {visible.map((j) => (
                        <tr key={j.id} data-job-id={j.id} data-status={j.status} className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-dark-bg-tertiary/40">
                          <td className="max-w-xs px-5 py-4">
                            <p className="break-words font-semibold leading-snug text-slate-900 dark:text-white">{j.title}</p>
                            <p className="mt-0.5 text-[13px] text-slate-600 dark:text-dark-text-secondary">{place(j)}</p>
                            {renderHint(j)}
                          </td>
                          <td className="px-4 py-4">
                            <JobStatusBadge status={j.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm tabular-nums text-slate-700 dark:text-slate-300">{formatDate(j.published_at, lang)}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm tabular-nums text-slate-700 dark:text-slate-300">{formatDate(j.application_deadline, lang)}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium tabular-nums text-slate-900 dark:text-white" data-testid="apps-cell">{appsCell(j)}</td>
                          <td className="px-4 py-4 text-sm tabular-nums text-slate-700 dark:text-slate-300">{j.views_count || 0}</td>
                          <td className="min-w-[17rem] px-5 py-3.5">
                            {renderActions(j)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Móvil y tablet: lista en una sola superficie */}
              <ul className={`${surface} divide-y divide-slate-100 dark:divide-dark-border lg:hidden`}>
                {visible.map((j) => (
                  <li key={j.id} data-job-id={j.id} data-status={j.status} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold leading-snug text-slate-900 dark:text-white">{j.title}</p>
                        <p className="mt-0.5 text-[13px] text-slate-600 dark:text-dark-text-secondary">{place(j)}</p>
                      </div>
                      <JobStatusBadge status={j.status} />
                    </div>
                    {renderHint(j)}
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs text-slate-600 dark:text-dark-text-secondary">{tx.mg_col_published}</dt>
                        <dd className="mt-0.5 tabular-nums text-slate-900 dark:text-white">{formatDate(j.published_at, lang)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-600 dark:text-dark-text-secondary">{tx.mg_col_closes}</dt>
                        <dd className="mt-0.5 tabular-nums text-slate-900 dark:text-white">{formatDate(j.application_deadline, lang)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-600 dark:text-dark-text-secondary">{tx.mg_col_apps}</dt>
                        <dd className="mt-0.5 font-medium tabular-nums text-slate-900 dark:text-white">{appsCell(j)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-600 dark:text-dark-text-secondary">{tx.mg_col_views}</dt>
                        <dd className="mt-0.5 tabular-nums text-slate-900 dark:text-white">{j.views_count || 0}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 -ml-2.5">
                      {renderActions(j)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>,
  );
};

export default JobPostingsManagementPage;
