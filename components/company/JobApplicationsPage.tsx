import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, BriefcaseIcon, StarIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import { downloadCsv, toCsv } from '../../lib/jobsCsv';
import { formatDate } from '../../lib/jobsFormat';
import { COMPANY_APPLICATION_COLUMNS, markApplicationViewed } from '../../lib/jobsApi';
import { ckey, useCompanyAppsText } from '../jobs/textosEmpresa';
import ApplicantDrawer from '../jobs/ApplicantDrawer';
import { STATUS_TONE, currentRole, matchCls, totalYears, type CompanyApp, type JobLite } from '../jobs/ApplicantShared';
import {
  BTN_GHOST, BTN_SECONDARY, FIELD_CLS, FOCUS, H1_CLS, PanelEmpty, PanelError, PanelSkeleton, PanelTabs, PersonAvatar,
  SearchBox, StatusDot, SURFACE, TEXT_META, TEXT_STRONG, norm, notifyError, useReveal,
} from '../jobs/PanelBits';

type TabKey = 'received' | 'viewed' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn' | 'notQualified';

const TABS: Array<{ key: TabKey; test: (a: CompanyApp) => boolean }> = [
  { key: 'received', test: (a) => a.status === 'NEW' && !a.viewed_by_company },
  { key: 'viewed', test: (a) => (a.status === 'NEW' && !!a.viewed_by_company) || a.status === 'REVIEWING' },
  { key: 'shortlisted', test: (a) => ['SHORTLISTED', 'INTERVIEW', 'OFFER'].includes(a.status) },
  { key: 'rejected', test: (a) => a.status === 'REJECTED' },
  { key: 'hired', test: (a) => a.status === 'HIRED' },
  { key: 'withdrawn', test: (a) => a.status === 'WITHDRAWN' },
  { key: 'notQualified', test: (a) => a.status === 'NOT_QUALIFIED' },
];

const MAX_ROWS = 500;

// Una sola rejilla para cabecera y filas: casilla | candidato | oferta | afinidad | valoracion | fecha | estado
const GRID = 'lg:grid-cols-[1.25rem_minmax(0,2fr)_minmax(0,1.3fr)_4.5rem_6rem_6rem_9.5rem]';

const JobApplicationsPage: React.FC = () => {
  const tx = useCompanyAppsText();
  const { lang } = useLanguage();
  const { user, company } = useAuth();
  const navigate = useNavigate();
  // /company/jobs/applications?job=<id> abre el panel ya filtrado por esa oferta («Mis ofertas» enlaza asi)
  const [searchParams] = useSearchParams();

  const [apps, setApps] = useState<CompanyApp[]>([]);
  const [jobs, setJobs] = useState<Map<string, JobLite>>(new Map());
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'nocompany'>('loading');
  const [jobFilter, setJobFilter] = useState(searchParams.get('job') || '');
  const [tab, setTab] = useState<TabKey>('received');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const requestId = useRef(0);
  const allBox = useRef<HTMLInputElement>(null);

  const companyId = company?.id || null;

  const load = useCallback(async () => {
    if (!user) return;
    if (!companyId) { setState('nocompany'); return; }
    const id = ++requestId.current;
    setState('loading');
    try {
      const [appsRes, jobsRes] = await Promise.all([
        supabase.from('job_applications').select(COMPANY_APPLICATION_COLUMNS)
          .eq('company_id', companyId).order('created_at', { ascending: false }).range(0, MAX_ROWS - 1),
        supabase.from('job_postings').select('id, title, location_city').eq('company_id', companyId),
      ]);
      if (appsRes.error) throw appsRes.error;
      if (id !== requestId.current) return;
      setApps((appsRes.data || []) as unknown as CompanyApp[]);
      setJobs(new Map(((jobsRes.data || []) as JobLite[]).map((j) => [j.id, j])));
      setState('ready');
    } catch (e) {
      if (id !== requestId.current) return;
      console.error('Error loading applications', e);
      setState('error');
    }
  }, [user, companyId]);

  useEffect(() => { void load(); }, [load]);

  const scoped = useMemo(() => (jobFilter ? apps.filter((a) => a.job_posting_id === jobFilter) : apps), [apps, jobFilter]);
  const counts = useMemo(() => {
    const c = {} as Record<TabKey, number>;
    for (const t of TABS) c[t.key] = scoped.filter(t.test).length;
    return c;
  }, [scoped]);

  const nameOf = (a: CompanyApp) => a.perfil_copia?.profile?.full_name || tx.noName;

  const inTab = useMemo(() => scoped.filter(TABS.find((t) => t.key === tab)!.test), [scoped, tab]);
  const visible = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return inTab;
    return inTab.filter((a) => norm(`${a.perfil_copia?.profile?.full_name || ''} ${a.perfil_copia?.profile?.headline || ''}`).includes(q));
  }, [inTab, query]);
  const openApp = useMemo(() => apps.find((a) => a.id === openId) || null, [apps, openId]);

  // La seleccion es de la lista que se ve: cambiar de pestana, oferta o busqueda la vacia
  useEffect(() => { setSelected(new Set()); }, [tab, jobFilter, query]);
  const selectedRows = useMemo(() => visible.filter((a) => selected.has(a.id)), [visible, selected]);
  const allSelected = visible.length > 0 && selectedRows.length === visible.length;
  useEffect(() => {
    if (allBox.current) allBox.current.indeterminate = selectedRows.length > 0 && !allSelected;
  }, [selectedRows.length, allSelected]);

  const toggleRow = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((a) => a.id)));

  const listRef = useReveal<HTMLUListElement>(state === 'ready' && visible.length > 0);

  // Abrir una candidatura la marca como vista (RPC; ya no hay UPDATE directo)
  const openApplication = (a: CompanyApp) => {
    setOpenId(a.id);
    if (!a.viewed_by_company) {
      setApps((prev) => prev.map((x) => (x.id === a.id ? { ...x, viewed_by_company: true, viewed_at: x.viewed_at || new Date().toISOString() } : x)));
      markApplicationViewed(a.id).catch((e) => console.warn('mark_application_viewed', e));
    }
  };

  const exportCsv = (list: CompanyApp[]) => {
    try {
      const header = [tx.csv_candidate, tx.csv_headline, tx.csv_email, tx.csv_phone, tx.csv_job, tx.csv_match, tx.csv_status, tx.csv_rating, tx.csv_date, tx.csv_location];
      const rows = list.map((a) => [
        nameOf(a),
        a.perfil_copia?.profile?.headline || '',
        a.perfil_copia?.contact?.email || '',
        a.perfil_copia?.contact?.phone || '',
        jobs.get(a.job_posting_id)?.title || '',
        a.match_score ?? '',
        ckey(tx, `st_${a.status}`, a.status),
        a.rating ?? '',
        new Date(a.created_at).toISOString().slice(0, 10),
        a.perfil_copia?.profile?.location || '',
      ]);
      downloadCsv(`candidaturas_${new Date().toISOString().slice(0, 10)}.csv`, toCsv([header, ...rows]));
      toast.success(tx.csvDone);
    } catch {
      notifyError(tx.csvError, tx.closeNotice);
    }
  };

  const onSaved = (patch: Partial<CompanyApp> & { id: string }) =>
    setApps((prev) => prev.map((x) => (x.id === patch.id ? { ...x, ...patch } : x)));

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</div>
  );

  if (state === 'loading') {
    return shell(
      <>
        <h1 className={H1_CLS}>{tx.title}</h1>
        <div className="mt-8"><PanelSkeleton rows={4} label={tx.loading} /></div>
      </>
    );
  }

  if (state === 'nocompany' || state === 'error') {
    return shell(
      <div className="mx-auto max-w-xl py-10">
        <PanelError message={state === 'nocompany' ? tx.noCompany : tx.loadError} retryLabel={state === 'error' ? tx.retry : undefined} onRetry={state === 'error' ? () => void load() : undefined} />
      </div>
    );
  }

  return shell(
    <>
      <header>
        <h1 className={H1_CLS}>{tx.title}</h1>
        <p className={`mt-2 max-w-prose text-base ${TEXT_META}`}>{tx.subtitle}</p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-72">
          <label htmlFor="ja-job" className={`mb-1.5 block text-sm font-semibold ${TEXT_STRONG}`}>{tx.filterJob}</label>
          <select id="ja-job" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className={FIELD_CLS}>
            <option value="">{tx.allJobs}</option>
            {[...jobs.values()].map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <SearchBox className="sm:w-72" value={query} onChange={setQuery} label={tx.searchLabel} placeholder={tx.searchPlaceholder} clearLabel={tx.clearSearch} />
        <button type="button" onClick={() => exportCsv(visible)} disabled={visible.length === 0} className={`${BTN_SECONDARY} !py-2.5 sm:ml-auto`}>
          <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />{tx.csv}
        </button>
      </div>

      <div className="mt-6">
        <PanelTabs
          tabs={TABS.map((t) => ({ id: t.key, label: ckey(tx, `tab_${t.key}`), count: counts[t.key] }))}
          active={tab}
          onChange={(id) => setTab(id as TabKey)}
          label={tx.tabsLabel}
          idPrefix="tab"
          panelId="ja-panel"
        />
      </div>

      <div id="ja-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-5">
        {visible.length === 0 ? (
          apps.length === 0 ? (
            <PanelEmpty icon={BriefcaseIcon} title={tx.emptyTitle} text={tx.emptyText} action={{ label: tx.viewMyJobs, onClick: () => navigate('/company/jobs') }} />
          ) : query ? (
            <PanelEmpty icon={BriefcaseIcon} title={tx.emptyTitle} text={tx.emptySearch} action={{ label: tx.clearSearch, onClick: () => setQuery('') }} />
          ) : (
            <PanelEmpty icon={BriefcaseIcon} title={tx.emptyTitle} text={tx.emptyTabText} />
          )
        ) : (
          <div className={`${SURFACE} overflow-hidden`}>
            <div className={`grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-semibold dark:border-dark-border dark:bg-white/5 ${GRID} lg:gap-x-4 ${TEXT_META}`}>
              <input
                ref={allBox}
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label={tx.selectAll}
                className={`h-4 w-4 rounded accent-cv-blue ${FOCUS}`}
              />
              {selectedRows.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:col-span-6">
                  <span className={`tabular-nums ${TEXT_STRONG}`} aria-live="polite">
                    {selectedRows.length === 1 ? tx.selectedOne : fmt(tx.selectedMany, { n: selectedRows.length })}
                  </span>
                  <button type="button" onClick={() => exportCsv(selectedRows)} className={`${BTN_GHOST} !px-2 !py-1 !text-cv-blue dark:!text-cv-blue-light`}>
                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />{tx.csvSelected}
                  </button>
                  <button type="button" onClick={() => setSelected(new Set())} className={`${BTN_GHOST} !px-2 !py-1`}>{tx.clearSelection}</button>
                </div>
              ) : (
                <>
                  <span className="lg:hidden">{visible.length === 1 ? tx.resultsOne : fmt(tx.resultsMany, { n: visible.length })}</span>
                  <span className="hidden lg:block">{tx.colCandidate}</span>
                  <span className="hidden lg:block">{tx.colJob}</span>
                  <span className="hidden text-right lg:block">{tx.factMatch}</span>
                  <span className="hidden text-center lg:block">{tx.colRating}</span>
                  <span className="hidden lg:block">{tx.colDate}</span>
                  <span className="hidden lg:block">{tx.colStatus}</span>
                </>
              )}
            </div>

            <ul ref={listRef} aria-label={tx.tableLabel} className="divide-y divide-slate-200 dark:divide-dark-border">
              {visible.map((a) => {
                const snap = a.perfil_copia;
                const years = totalYears(snap?.experiences);
                const role = currentRole(snap?.experiences);
                const isNew = !a.viewed_by_company;
                const name = nameOf(a);
                const sub = role ? fmt(tx.currentRole, { role }) : snap?.profile?.headline || '';
                const yearsText = years > 0 ? (years === 1 ? tx.yearShort : fmt(tx.yearsShort, { n: years })) : '';
                return (
                  <li key={a.id} className={`relative transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/5 ${selected.has(a.id) ? 'bg-blue-50/60 dark:bg-cv-blue/10' : ''}`}>
                    <button
                      type="button"
                      onClick={() => openApplication(a)}
                      aria-label={fmt(tx.openCandidate, { name })}
                      className="absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cv-blue"
                    />
                    <div className={`pointer-events-none relative grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 ${GRID} lg:gap-x-4`}>
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggleRow(a.id)}
                        aria-label={fmt(tx.selectRow, { name })}
                        className={`pointer-events-auto relative z-10 col-start-1 row-span-3 row-start-1 h-4 w-4 self-start rounded accent-cv-blue lg:row-span-1 lg:self-center ${FOCUS}`}
                      />
                      <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-3">
                        <PersonAvatar name={name} url={snap?.profile?.avatar_url as string | undefined} size="sm" />
                        <div className="min-w-0">
                          <p className={`flex min-w-0 items-center gap-2 text-[15px] leading-tight ${isNew ? 'font-bold' : 'font-semibold'} ${TEXT_STRONG}`}>
                            {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-cv-blue dark:bg-cv-blue-light" aria-hidden="true" />}
                            <span className="truncate">{name}</span>
                            {isNew && <span className="hidden shrink-0 text-xs font-semibold text-cv-blue dark:text-cv-blue-light sm:inline">{tx.newBadge}</span>}
                            {isNew && <span className="sr-only sm:hidden">{tx.newBadge}</span>}
                          </p>
                          {sub && <p className={`mt-0.5 truncate text-[13px] ${TEXT_META}`}>{sub}{yearsText && <span className="hidden sm:inline"> · {yearsText}</span>}</p>}
                        </div>
                      </div>
                      <p className={`col-span-2 col-start-2 row-start-2 truncate text-sm lg:col-span-1 lg:col-start-3 lg:row-start-1 ${TEXT_META}`}>{jobs.get(a.job_posting_id)?.title}</p>
                      <p className={`col-start-3 row-start-1 text-right text-base font-bold tabular-nums lg:col-start-4 ${matchCls(a.match_score || 0)}`} title={tx.matchHelp}>
                        {a.match_score ?? 0}<span className="text-xs font-semibold">%</span>
                      </p>
                      <div className="col-start-5 row-start-1 hidden items-center justify-center lg:flex">
                        {a.rating ? (
                          <span className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${TEXT_STRONG}`} role="img" aria-label={fmt(tx.starLabel, { n: a.rating })}>
                            <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />{a.rating}
                          </span>
                        ) : (
                          <span className={`text-sm ${TEXT_META}`} aria-label={tx.noRating}>—</span>
                        )}
                      </div>
                      <p className={`col-start-2 row-start-3 text-[13px] tabular-nums lg:col-start-6 lg:row-start-1 lg:text-sm ${TEXT_META}`}>{formatDate(a.created_at, lang)}</p>
                      <div className="col-start-3 row-start-3 justify-self-end lg:col-start-7 lg:row-start-1 lg:justify-self-start">
                        <StatusDot tone={STATUS_TONE[a.status] || 'info'} className="!text-[13px] lg:!text-sm">{ckey(tx, `st_${a.status}`, a.status)}</StatusDot>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {openApp && companyId && user && (
        <ApplicantDrawer
          app={openApp}
          job={jobs.get(openApp.job_posting_id) || null}
          companyId={companyId}
          userId={user.id}
          onClose={() => setOpenId(null)}
          onSaved={onSaved}
          onOpenPublicProfile={(slug) => navigate(`/cv/${encodeURIComponent(slug)}`)}
        />
      )}
    </>
  );
};

export default JobApplicationsPage;
