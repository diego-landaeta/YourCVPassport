import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import { jobCategoryLabel } from '../../lib/jobCategories';
import { JOB_STATUSES, formatDate, isReviewStatus, parseRpcError } from '../../lib/jobPostingModel';
import { msg, pick, useJobText } from '../../lib/jobPostingText';
import { useJobAdminText } from '../../lib/jobPostingAdminText';
import { JobRichText } from '../company/jobwizard/JobRichText';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { JobStatusBadge } from '../company/jobwizard/StatusBadge';

/** Panel de administración de ofertas: cola de revisión (aprobar/rechazar con motivo) y denuncias. */

interface AdminJob {
  id: string;
  title: string;
  company_id: string;
  status: string;
  country_code: string | null;
  category: string | null;
  work_mode: string | null;
  location_city: string | null;
  is_remote: boolean | null;
  contract_types: string[] | null;
  schedule: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  show_salary: boolean | null;
  description: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  benefits: string[] | null;
  review_reason: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  applications_count: number | null;
  created_at: string;
  companies: { company_name: string | null } | { company_name: string | null }[] | null;
}

interface Report {
  id: string;
  job_id: string;
  reason: string;
  details: string | null;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  created_at: string;
}

interface HistoryRow {
  id: number;
  from_status: string | null;
  to_status: string;
  source: string;
  reason: string | null;
  created_at: string;
}

type Tab = 'queue' | 'reported' | 'all';
type Panel = null | { kind: 'reject' | 'manual'; job: AdminJob };

const ADMIN_JOB_COLUMNS =
  'id, title, company_id, status, country_code, category, work_mode, location_city, is_remote, contract_types, schedule, salary_min, salary_max, salary_currency, salary_period, show_salary, description, responsibilities, requirements, benefits, review_reason, reviewed_at, published_at, applications_count, created_at, companies(company_name)';

const companyName = (j: AdminJob) => (Array.isArray(j.companies) ? j.companies[0]?.company_name : j.companies?.company_name) || '—';

const JobPostingsManagement: React.FC = () => {
  const { lang } = useLanguage();
  const t = useJobAdminText();
  const tx = useJobText();

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [countries, setCountries] = useState<Record<string, { es: string; en: string }>>({});
  const [tab, setTab] = useState<Tab>('queue');
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminJob | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Huella del texto moderado tal como estaba al abrir el detalle (null = la RPC no respondió).
  // Se envía al aprobar: si el texto cambió entre la lectura y la aprobación, el servidor responde HASH_MISMATCH.
  const hashes = useRef<Record<string, string | null>>({});

  const load = useCallback(async () => {
    setState((s) => (s === 'ready' ? s : 'loading'));
    try {
      const { data, error } = await supabase.from('job_postings').select(ADMIN_JOB_COLUMNS).order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      setJobs((data || []) as unknown as AdminJob[]);

      // Denuncias y países son accesorios: si fallan (p. ej. migración sin aplicar) la tabla sigue funcionando.
      const [rep, cs] = await Promise.all([
        supabase.from('job_reports').select('id, job_id, reason, details, status, created_at').order('created_at', { ascending: false }).limit(2000),
        supabase.from('countries').select('code, name_es, name_en'),
      ]);
      setReports(rep.error ? [] : ((rep.data || []) as Report[]));
      const map: Record<string, { es: string; en: string }> = {};
      for (const c of (cs.data || []) as { code: string; name_es: string; name_en: string }[]) map[c.code] = { es: c.name_es, en: c.name_en };
      setCountries(map);
      setState('ready');
    } catch (err) {
      console.error('[AdminJobPostings] load', err);
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openReports = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of reports) if (r.status === 'OPEN') m[r.job_id] = (m[r.job_id] || 0) + 1;
    return m;
  }, [reports]);

  const stats = useMemo(
    () => ({
      total: jobs.length,
      queue: jobs.filter((j) => isReviewStatus(j.status)).length,
      published: jobs.filter((j) => j.status === 'PUBLISHED').length,
      rejected: jobs.filter((j) => j.status === 'REJECTED').length,
      reported: Object.keys(openReports).length,
    }),
    [jobs, openReports],
  );

  const visible = useMemo(() => {
    const q = query.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    return jobs.filter((j) => {
      if (tab === 'queue' && !isReviewStatus(j.status)) return false;
      if (tab === 'reported' && !openReports[j.id]) return false;
      if (statusFilter && j.status !== statusFilter) return false;
      if (!q) return true;
      return `${j.title} ${companyName(j)}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q);
    });
  }, [jobs, tab, openReports, statusFilter, query]);

  // Cola: las más antiguas primero (llevan más tiempo esperando).
  const ordered = useMemo(() => {
    const list = visible.slice();
    if (tab === 'queue') list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return list;
  }, [visible, tab]);

  // --- Detalle --------------------------------------------------------------------------
  /** Lee la huella actual del texto moderado. Si la RPC no existe o falla, null (se aprueba sin comprobarla). */
  const readHash = async (jobId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('get_job_moderation_hash', { p_job_id: jobId });
      return !error && typeof data === 'string' && data ? data : null;
    } catch {
      return null;
    }
  };

  const openDetail = async (job: AdminJob) => {
    setSelected(job);
    setHistory(null);
    setPanel(null);
    hashes.current[job.id] = await readHash(job.id);
    const { data, error } = await supabase
      .from('job_posting_status_history')
      .select('id, from_status, to_status, source, reason, created_at')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setHistory(error ? [] : ((data || []) as HistoryRow[]));
  };

  const closeDetail = useCallback(() => {
    setSelected(null);
    setPanel(null);
    setNote('');
    setNoteError(false);
  }, []);

  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, closeDetail]);

  // --- Acciones ---------------------------------------------------------------------------
  const failToast = (err: unknown) => {
    console.error('[AdminJobPostings] action', err);
    const info = parseRpcError(err);
    toast.error(info.code ? msg(tx, `err_${info.code}`) : t.t_error);
  };

  const moderate = async (job: AdminJob, decision: 'PUBLISHED' | 'MANUAL_REVIEW' | 'REJECTED', motivo: string | null) => {
    setBusy(job.id);
    try {
      const args: Record<string, unknown> = { p_job_id: job.id, p_decision: decision, p_motivo: motivo };
      const expected = hashes.current[job.id];
      if (decision === 'PUBLISHED' && expected) args.p_expected_hash = expected;
      const { error } = await supabase.rpc('moderar_oferta', args);
      if (error) throw error;
      delete hashes.current[job.id];
      toast.success(decision === 'PUBLISHED' ? t.t_approved : decision === 'REJECTED' ? t.t_rejected : t.t_manual);
      closeDetail();
      await load();
    } catch (err) {
      if (parseRpcError(err).code === 'HASH_MISMATCH') {
        // El texto cambió tras abrirlo: se recarga todo, se vuelve a abrir con la huella nueva y se avisa.
        toast.error(t.t_hash_changed);
        await load();
        const { data: fresh } = await supabase.from('job_postings').select(ADMIN_JOB_COLUMNS).eq('id', job.id).maybeSingle();
        if (fresh) await openDetail(fresh as unknown as AdminJob);
      } else {
        failToast(err);
      }
    } finally {
      setBusy(null);
    }
  };

  const confirmPanel = async () => {
    if (!panel) return;
    const motivo = note.trim();
    if (panel.kind === 'reject' && !motivo) {
      setNoteError(true);
      return;
    }
    await moderate(panel.job, panel.kind === 'reject' ? 'REJECTED' : 'MANUAL_REVIEW', motivo || null);
    setNote('');
    setNoteError(false);
  };

  /** Revisión automática por reglas (Edge Function `moderate-job-posting`). */
  const runAuto = async (job: AdminJob) => {
    setBusy(job.id);
    try {
      const { data, error } = await supabase.functions.invoke('moderate-job-posting', { body: { job_id: job.id } });
      if (error) throw error;
      const res = (data || {}) as { results?: { outcome?: string }[] };
      const outcome = res.results?.[0]?.outcome;
      if (outcome === 'PUBLISHED') toast.success(t.t_auto_published);
      else if (outcome === 'MANUAL_REVIEW') toast(t.t_auto_manual);
      else if (outcome === 'SKIPPED') toast(t.t_auto_skipped);
      else toast(t.t_auto_manual);
      await load();
      closeDetail();
    } catch (err) {
      console.error('[AdminJobPostings] auto', err);
      toast.error(t.t_auto_error);
    } finally {
      setBusy(null);
    }
  };

  const resolveReport = async (r: Report, status: 'REVIEWED' | 'DISMISSED') => {
    setBusy(r.id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('job_reports')
        .update({ status, resolved_by: auth?.user?.id ?? null, resolved_at: new Date().toISOString() })
        .eq('id', r.id);
      if (error) throw error;
      toast.success(t.t_report_done);
      await load();
    } catch (err) {
      failToast(err);
    } finally {
      setBusy(null);
    }
  };

  // --- Utilidades de render -----------------------------------------------------------------
  const countryName = (code: string | null) => (code ? countries[code]?.[lang] || code : '—');
  const place = (j: AdminJob) => (j.is_remote || j.work_mode === 'REMOTE' ? pick(tx, 'workmode', 'REMOTE') : [j.location_city, countryName(j.country_code)].filter(Boolean).join(', '));
  const salary = (j: AdminJob): string => {
    if (j.salary_min == null && j.salary_max == null) return '—';
    const fmtN = (n: number | null) => (n == null ? '' : n.toLocaleString(lang === 'en' ? 'en-GB' : 'es-ES'));
    const range = j.salary_min != null && j.salary_max != null && j.salary_min !== j.salary_max ? `${fmtN(j.salary_min)} – ${fmtN(j.salary_max)}` : fmtN(j.salary_min ?? j.salary_max);
    const body = `${range} ${j.salary_currency || ''} ${j.salary_period ? pick(tx, 'period', j.salary_period) : ''}`.replace(/\s+/g, ' ').trim();
    return j.show_salary ? body : `${body} (${t.d_salary_hidden})`;
  };

  const actionButtons = (j: AdminJob, size: 'sm' | 'md' = 'sm') => {
    const base = `inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
      size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
    }`;
    const disabled = busy === j.id;
    const inQueue = isReviewStatus(j.status);
    return (
      <div className="flex flex-wrap gap-2">
        {(inQueue || j.status === 'REJECTED') && (
          <button type="button" disabled={disabled} onClick={() => {
              // Aprobar exige haber abierto el detalle (así se tiene la huella de lo que se leyó).
              if (!(j.id in hashes.current)) {
                toast(t.t_review_first);
                void openDetail(j);
                return;
              }
              void moderate(j, 'PUBLISHED', null);
            }} className={`${base} bg-green-600 text-white hover:bg-green-700`} aria-label={`${t.approve}: ${j.title}`}>
            {t.approve}
          </button>
        )}
        {(inQueue || j.status === 'PUBLISHED') && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              void openDetail(j);
              setPanel({ kind: 'reject', job: j });
            }}
            className={`${base} bg-red-600 text-white hover:bg-red-700`}
            aria-label={`${j.status === 'PUBLISHED' ? t.withdraw : t.reject}: ${j.title}`}
          >
            {j.status === 'PUBLISHED' ? t.withdraw : t.reject}
          </button>
        )}
      </div>
    );
  };

  const th = 'px-4 py-3 text-left text-[13px] font-medium text-slate-600 dark:text-dark-text-secondary';
  const card = 'bg-white dark:bg-dark-bg-secondary rounded-2xl border border-slate-200 dark:border-dark-border';
  const input =
    'w-full px-3.5 py-2.5 text-base sm:text-[15px] border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-slate-900 dark:text-dark-text-primary shadow-sm focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none';

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cv-blue" aria-hidden="true" />
        <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">{t.loading}</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div role="alert" className={`${card} p-8 text-center`}>
        <p className="text-gray-800 dark:text-dark-text-primary mb-4">{t.error}</p>
        <button type="button" onClick={() => void load()} className="px-4 py-2 rounded-lg bg-cv-blue text-white hover:bg-blue-700">
          {t.retry}
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'queue', label: t.tab_queue, count: stats.queue },
    { id: 'reported', label: t.tab_reported, count: stats.reported },
    { id: 'all', label: t.tab_all, count: stats.total },
  ];
  const emptyText = tab === 'queue' && !query && !statusFilter ? t.empty_queue : tab === 'reported' && !query && !statusFilter ? t.empty_reported : jobs.length === 0 ? t.empty_all : t.no_results;
  const jobReports = selected ? reports.filter((r) => r.job_id === selected.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-balance text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-text-primary sm:text-3xl">{t.title}</h2>
        <p className="mt-1.5 max-w-[64ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{t.subtitle}</p>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          [t.stat_total, stats.total, ''],
          [t.stat_queue, stats.queue, 'bg-amber-500'],
          [t.stat_published, stats.published, 'bg-emerald-500'],
          [t.stat_rejected, stats.rejected, 'bg-red-500'],
          [t.stat_reported, stats.reported, 'bg-amber-500'],
        ].map(([label, n, dot]) => (
          <div key={String(label)} className={`${card} px-4 py-3.5`}>
            <dt className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-dark-text-secondary">
              {dot && Number(n) > 0 ? <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} /> : null}
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-dark-text-primary">{n}</dd>
          </div>
        ))}
      </dl>

      <div className={`${card} p-4 space-y-4`}>
        <div role="tablist" aria-label={t.title} className="flex flex-wrap gap-2">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => setTab(x.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary ${
                tab === x.id
                  ? 'border-cv-blue bg-cv-blue text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-tertiary dark:text-dark-text-primary dark:hover:bg-dark-bg-primary'
              }`}
            >
              {x.label} <span className="tabular-nums opacity-80">({x.count})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} className={`${input} sm:flex-1`} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={t.status_filter} className={`${input} sm:!w-56`}>
            <option value="">{t.all_statuses}</option>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {pick(tx, 'status', s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {ordered.length === 0 ? (
          <p className="text-center py-12 text-gray-600 dark:text-dark-text-secondary">{emptyText}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem]" data-testid="admin-jobs-table">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-dark-border dark:bg-dark-bg-tertiary">
                <tr>
                  <th scope="col" className={th}>{t.col_title}</th>
                  <th scope="col" className={th}>{t.col_company}</th>
                  <th scope="col" className={th}>{t.col_country}</th>
                  <th scope="col" className={th}>{t.col_status}</th>
                  <th scope="col" className={th}>{t.col_reports}</th>
                  <th scope="col" className={th}>{t.col_created}</th>
                  <th scope="col" className={`${th} text-right`}>{t.col_actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {ordered.map((j) => (
                  <tr key={j.id} data-job-id={j.id} data-status={j.status} className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-dark-bg-tertiary/40">
                    <td className="px-4 py-3 max-w-xs">
                      <button
                        type="button"
                        onClick={() => void openDetail(j)}
                        className="text-left font-medium text-cv-blue dark:text-blue-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue rounded break-words"
                      >
                        {j.title}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{place(j)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-dark-text-primary">{companyName(j)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-dark-text-secondary">{countryName(j.country_code)}</td>
                    <td className="px-4 py-3">
                      <JobStatusBadge status={j.status} />
                    </td>
                    <td className="px-4 py-3 text-sm">{openReports[j.id] ? <span className="inline-flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300"><ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />{fmt(t.reports_n, { n: openReports[j.id] })}</span> : <span className="text-slate-600 dark:text-dark-text-secondary">{t.reports_none}</span>}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-slate-600 dark:text-dark-text-secondary whitespace-nowrap">{formatDate(j.created_at, lang)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">{actionButtons(j)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]" onClick={closeDetail}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-job-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-dark-bg-secondary dark:ring-1 dark:ring-dark-border"
          >
            <div className="p-5 border-b border-gray-200 dark:border-dark-border flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 id="admin-job-title" className="break-words text-xl font-bold tracking-tight text-slate-900 dark:text-dark-text-primary">
                  {selected.title}
                </h3>
                <p className="text-gray-600 dark:text-dark-text-secondary">{companyName(selected)}</p>
                <div className="mt-2">
                  <JobStatusBadge status={selected.status} />
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={closeDetail}
                aria-label={t.d_close}
                className="h-9 w-9 shrink-0 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
              >
                <XMarkIcon className="mx-auto h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-dark-text-secondary">{t.d_location}</dt>
                  <dd className="text-gray-900 dark:text-dark-text-primary">{place(selected) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-dark-text-secondary">{t.d_category}</dt>
                  <dd className="text-gray-900 dark:text-dark-text-primary">{selected.category ? jobCategoryLabel(selected.category, lang) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-dark-text-secondary">{t.d_contract}</dt>
                  <dd className="text-gray-900 dark:text-dark-text-primary">
                    {[...(selected.contract_types || []).map((c) => pick(tx, 'contract', c)), selected.schedule ? pick(tx, 'schedule', selected.schedule) : ''].filter(Boolean).join(' · ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-dark-text-secondary">{t.d_salary}</dt>
                  <dd className="text-gray-900 dark:text-dark-text-primary">{salary(selected)}</dd>
                </div>
              </dl>

              <section>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">{t.d_reason}</h4>
                <p className="text-sm text-gray-700 dark:text-dark-text-secondary whitespace-pre-wrap">{selected.review_reason || t.d_reason_none}</p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">{t.d_description}</h4>
                <JobRichText html={selected.description} className="text-sm text-gray-700 dark:text-dark-text-secondary" />
              </section>

              {(selected.responsibilities?.length || 0) > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">{t.d_responsibilities}</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-dark-text-secondary space-y-0.5">
                    {selected.responsibilities!.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </section>
              )}
              {(selected.requirements?.length || 0) > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">{t.d_requirements}</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-dark-text-secondary space-y-0.5">
                    {selected.requirements!.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </section>
              )}
              {(selected.benefits?.length || 0) > 0 && (
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">{t.d_benefits}</h4>
                  <p className="text-sm text-gray-700 dark:text-dark-text-secondary">{selected.benefits!.join(', ')}</p>
                </section>
              )}

              <section aria-labelledby="admin-job-reports">
                <h4 id="admin-job-reports" className="font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                  {t.d_reports} ({jobReports.length})
                </h4>
                {jobReports.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{t.d_reports_none}</p>
                ) : (
                  <ul className="space-y-2">
                    {jobReports.map((r) => (
                      <li key={r.id} className="rounded-lg border border-gray-200 dark:border-dark-border p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 dark:text-dark-text-primary">{(t as Record<string, string>)[`rep_${r.reason}`] || r.reason}</span>
                          <span className="text-xs text-gray-500 dark:text-dark-text-secondary">
                            {(t as Record<string, string>)[`rstat_${r.status}`] || r.status} · {formatDate(r.created_at, lang)}
                          </span>
                        </div>
                        {r.details && <p className="mt-1 text-gray-700 dark:text-dark-text-secondary whitespace-pre-wrap break-words">{r.details}</p>}
                        {r.status === 'OPEN' && (
                          <div className="mt-2 flex gap-2">
                            <button type="button" disabled={busy === r.id} onClick={() => resolveReport(r, 'REVIEWED')} className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue">
                              {t.rep_resolve}
                            </button>
                            <button type="button" disabled={busy === r.id} onClick={() => resolveReport(r, 'DISMISSED')} className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue">
                              {t.rep_dismiss}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="admin-job-history">
                <h4 id="admin-job-history" className="font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                  {t.d_history}
                </h4>
                {history === null ? (
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{t.loading}</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{t.d_history_none}</p>
                ) : (
                  <ol className="space-y-1 text-sm text-gray-700 dark:text-dark-text-secondary">
                    {history.map((h) => (
                      <li key={h.id}>
                        <span className="text-gray-500 dark:text-dark-text-secondary">{formatDate(h.created_at, lang)}</span>{' '}
                        {h.from_status ? pick(tx, 'status', h.from_status) : '∅'} → <strong>{pick(tx, 'status', h.to_status)}</strong> ·{' '}
                        {(t as Record<string, string>)[`src_${h.source}`] || h.source}
                        {h.reason ? ` — ${h.reason}` : ''}
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {panel && (
                <section aria-labelledby="admin-job-panel" className="rounded-lg border border-gray-200 dark:border-dark-border p-4 bg-gray-50 dark:bg-dark-bg-tertiary">
                  <h4 id="admin-job-panel" className="font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                    {panel.kind === 'reject' ? t.reject_title : t.manual_title}
                  </h4>
                  <label htmlFor="admin-job-note" className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                    {panel.kind === 'reject' ? t.reject_label : t.manual_label}
                    {panel.kind === 'reject' && <span className="text-red-600" aria-hidden="true"> *</span>}
                  </label>
                  <textarea
                    id="admin-job-note"
                    rows={3}
                    maxLength={1000}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      if (e.target.value.trim()) setNoteError(false);
                    }}
                    aria-invalid={noteError || undefined}
                    aria-describedby="admin-job-note-help"
                    className={input}
                  />
                  <p id="admin-job-note-help" className="mt-1 text-xs text-gray-500 dark:text-dark-text-secondary">
                    {panel.kind === 'reject' ? t.reject_help : ''}
                  </p>
                  {noteError && (
                    <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {t.reject_required}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busy === selected.id}
                      onClick={() => void confirmPanel()}
                      className={`px-4 py-2 text-sm rounded-lg text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue disabled:opacity-60 ${panel.kind === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-cv-blue hover:bg-blue-700'}`}
                      data-testid="admin-panel-confirm"
                    >
                      {panel.kind === 'reject' ? t.reject_confirm : t.manual_confirm}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPanel(null);
                        setNote('');
                        setNoteError(false);
                      }}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary hover:bg-white dark:hover:bg-dark-bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
                    >
                      {t.reject_cancel}
                    </button>
                  </div>
                </section>
              )}
            </div>

            {!panel && (
              <div className="p-5 border-t border-gray-200 dark:border-dark-border flex flex-wrap items-center gap-3">
                {actionButtons(selected, 'md')}
                {selected.status === 'AI_REVIEW' && (
                  <button
                    type="button"
                    disabled={busy === selected.id}
                    onClick={() => void runAuto(selected)}
                    title={t.auto_hint}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue disabled:opacity-60"
                  >
                    {t.run_auto}
                  </button>
                )}
                {selected.status === 'AI_REVIEW' && (
                  <button
                    type="button"
                    onClick={() => setPanel({ kind: 'manual', job: selected })}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
                  >
                    {t.manual}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingsManagement;
