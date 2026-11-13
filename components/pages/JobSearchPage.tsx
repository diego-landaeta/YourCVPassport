import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowsUpDownIcon, BriefcaseIcon, ChevronDownIcon, ExclamationTriangleIcon, GlobeEuropeAfricaIcon,
  MagnifyingGlassIcon, MapPinIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import PageSEO from '../shared/PageSEO';
import NotFoundPage from '../../pages/NotFoundPage';
import JobCard from '../jobs/JobCard';
import JobFiltersBar from '../jobs/JobFiltersBar';
import JobFiltersChips, { type JobFilterChip } from '../jobs/JobFiltersChips';
import { buildFilterDefs, buildSortOptions, optionLabel, parseSort, type JobFilterValues } from '../jobs/JobFiltersDefs';
import JobListMotion from '../jobs/JobListMotion';
import JobListPagination from '../jobs/JobListPagination';
import JobListSkeleton from '../jobs/JobListSkeleton';
import { formatCount, formatMoney } from '../jobs/JobListFormat';
import { useJobsText } from '../jobs/textos';
import { useJobCountries } from '../jobs/useJobCountries';
import { fmt } from '../../lib/bolsaText';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { countryCurrency, countryName, isKnownCountry } from '../../lib/jobsCatalog';
import { jobsCountryPath, readSavedCountry, resolveDefaultCountry, saveCountry } from '../../lib/jobsFormat';
import { fetchMyApplicationStatuses, fetchSavedJobIds, searchPublicJobs, toggleSavedJob, type CandidateStatus, type PublicJobRow } from '../../lib/jobsApi';
import { loginUrlWithReturn, setPostLoginReturn } from '../../lib/jobsReturn';

const PAGE_SIZE = 20;
const ALL = 'ALL';

const primaryBtn = 'inline-flex h-11 items-center justify-center rounded-xl bg-cv-blue px-5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-cv-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cv-light-gray dark:focus-visible:ring-offset-dark-bg-primary';
const secondaryBtn = 'inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cv-light-gray dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:hover:bg-dark-bg-tertiary dark:focus-visible:ring-offset-dark-bg-primary';
const fieldInput = 'h-12 w-full bg-transparent pl-11 pr-3 text-base text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cv-blue rounded-xl dark:text-dark-text-primary dark:placeholder:text-dark-text-secondary';
const fieldIcon = 'pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-dark-text-secondary';

/**
 * Listado publico de ofertas. Rutas: /empleos y /jobs (pais por defecto o ?country=),
 * /:pais/empleos (pais en la direccion; fija el espanol, igual que /empleos).
 */
const JobSearchPage: React.FC = () => {
  const tx = useJobsText();
  const navigate = useNavigate();
  const location = useLocation();
  const { country: routeCountry } = useParams<{ country?: string }>();
  const [params, setParams] = useSearchParams();
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const { lang, setLang } = useLanguage();
  const countries = useJobCountries();

  // /empleos y /xx/empleos fijan el espanol, /jobs el ingles (rutas fuera de routeConfig:
  // LanguageContext no las detecta por la URL).
  const pathLang = location.pathname.startsWith('/jobs') ? 'en' : 'es';
  useEffect(() => {
    if (lang !== pathLang) setLang(pathLang);
    // Solo al entrar en la ruta: el selector de idioma puede cambiarlo despues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathLang]);

  // --- Pais -----------------------------------------------------------------
  const queryCountry = params.get('country');
  const urlCountry = (routeCountry || queryCountry || '').toUpperCase();
  const invalidRouteCountry = !!routeCountry && !isKnownCountry(routeCountry, countries);
  const authReady = !authLoading && !profileLoading;

  const country = useMemo<string>(() => {
    if (urlCountry === ALL) return ALL;
    if (urlCountry && isKnownCountry(urlCountry, countries)) return urlCountry;
    const saved = readSavedCountry();
    if (saved === ALL) return ALL;
    if (saved && isKnownCountry(saved, countries)) return saved.toUpperCase();
    return resolveDefaultCountry(profile?.country_code, countries);
  }, [urlCountry, countries, profile?.country_code]);

  const changeCountry = (code: string) => {
    saveCountry(code);
    if (pathLang === 'es') {
      navigate(code === ALL ? '/empleos?country=all' : jobsCountryPath(code, 'es'));
    } else {
      navigate(code === ALL ? '/jobs?country=all' : jobsCountryPath(code, 'en'));
    }
  };

  // --- Filtros (en la URL, para poder compartir la busqueda) -------------------
  const category = params.get('cat') || '';
  const workMode = params.get('mode') || '';
  const contract = params.get('contract') || '';
  const schedule = params.get('sched') || '';
  const minSalaryRaw = params.get('min') || '';
  const days = params.get('days') || '';
  const expRaw = params.get('exp') || '';
  // Solo enteros 0-60; un valor raro en la URL se ignora
  const maxExperience = /^\d{1,2}$/.test(expRaw) && Number(expRaw) <= 60 ? Number(expRaw) : null;
  const exp = maxExperience === null ? '' : String(maxExperience);
  const page = Math.max(1, Number(params.get('page')) || 1);
  // Orden: «Más afines» solo con sesión de candidato (la base cae a «recientes» sin sesión); la URL puede traer
  // sort=affinity de un enlace compartido y entonces simplemente no se aplica.
  const canSortByAffinity = !!user && profile?.role !== 'employer' && profile?.role !== 'admin';
  const sortWanted = parseSort(params.get('sort'));
  const sort = canSortByAffinity ? sortWanted : 'recent';

  const [qInput, setQInput] = useState(params.get('q') || '');
  const [cityInput, setCityInput] = useState(params.get('city') || '');
  const qDebounced = useDebouncedValue(qInput, 400);
  const cityDebounced = useDebouncedValue(cityInput, 400);

  const setParam = useCallback((patch: Record<string, string | null>, resetPage = true) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v); else next.delete(k);
      }
      if (resetPage) next.delete('page');
      return next;
    }, { replace: true });
  }, [setParams]);

  // Texto escrito -> URL (con retardo)
  useEffect(() => {
    if ((params.get('q') || '') !== qDebounced.trim()) setParam({ q: qDebounced.trim() || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);
  useEffect(() => {
    if ((params.get('city') || '') !== cityDebounced.trim()) setParam({ city: cityDebounced.trim() || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityDebounced]);

  const q = params.get('q') || '';
  const city = params.get('city') || '';
  const hasFilters = !!(q || city || category || workMode || contract || schedule || minSalaryRaw || days || exp);

  const clearFilters = () => {
    setQInput('');
    setCityInput('');
    setParams((prev) => {
      const next = new URLSearchParams();
      const c = prev.get('country');
      if (c) next.set('country', c);
      const s = prev.get('sort');
      if (s) next.set('sort', s);
      return next;
    }, { replace: true });
  };

  // «Buscar»: aplica ya lo escrito, sin esperar al retardo
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam({ q: qInput.trim() || null, city: cityInput.trim() || null });
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  // --- Datos ------------------------------------------------------------------
  const [rows, setRows] = useState<PublicJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applied, setApplied] = useState<Map<string, CandidateStatus>>(new Map());
  const requestId = useRef(0);

  const minSalary = minSalaryRaw && Number(minSalaryRaw) > 0 ? Number(minSalaryRaw) : null;

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const res = await searchPublicJobs({
        country: country === ALL ? null : country,
        category: category || null,
        workMode: workMode || null,
        contract: contract || null,
        schedule: schedule || null,
        minSalary,
        postedWithinDays: days ? Number(days) : null,
        maxExperienceYears: maxExperience,
        sort,
        search: q || null,
        city: city || null,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      if (id !== requestId.current) return;
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      if (id !== requestId.current) return;
      console.error('Error loading jobs', e);
      setError(true);
      setRows([]);
      setTotal(0);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [country, category, workMode, contract, schedule, minSalary, days, maxExperience, sort, q, city, page]);

  useEffect(() => {
    if (!authReady) return;
    void load();
  }, [authReady, load]);

  // «Ya inscrito»: la RPC ya lo marca, y ademas se cruza con my_job_applications
  useEffect(() => {
    if (!user) { setApplied(new Map()); return; }
    let alive = true;
    fetchMyApplicationStatuses().then((m) => { if (alive) setApplied(m); }).catch(() => { /* la RPC ya marca los inscritos */ });
    return () => { alive = false; };
  }, [user]);

  // Ofertas guardadas del usuario (boton «Guardar» de cada tarjeta)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    let alive = true;
    fetchSavedJobIds(user.id).then((ids) => { if (alive) setSavedIds(ids); }).catch(() => { /* sin guardadas: el boton sigue funcionando */ });
    return () => { alive = false; };
  }, [user]);

  const onToggleSave = useCallback(async (job: PublicJobRow) => {
    if (!user) {
      const ret = `${location.pathname}${location.search}`;
      setPostLoginReturn(ret);
      navigate(loginUrlWithReturn(ret));
      return;
    }
    const wasSaved = savedIds.has(job.id);
    // Optimista: el boton responde al instante y se deshace si la RPC falla
    setSavedIds((prev) => { const n = new Set(prev); if (wasSaved) n.delete(job.id); else n.add(job.id); return n; });
    try {
      await toggleSavedJob(job.id);
      toast.success(wasSaved ? tx.saveRemoved : tx.saved);
    } catch {
      setSavedIds((prev) => { const n = new Set(prev); if (wasSaved) n.add(job.id); else n.delete(job.id); return n; });
      toast.error(tx.saveError);
    }
  }, [user, savedIds, location.pathname, location.search, navigate, tx]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goPage = (p: number) => {
    setParam({ page: p > 1 ? String(p) : null }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currency = country !== ALL ? countryCurrency(country, countries) : null;
  const countryLabel = country === ALL ? tx.allCountries : countryName(country, pathLang, countries);

  // Filtros de las pills y chips quitables (el texto y la ciudad viven en el buscador)
  const filterValues: JobFilterValues = { cat: category, contract, sched: schedule, mode: workMode, days, exp, min: minSalaryRaw };
  const defs = useMemo(() => buildFilterDefs(tx, pathLang), [tx, pathLang]);
  const chips = useMemo<JobFilterChip[]>(() => {
    const out: JobFilterChip[] = [];
    if (q) out.push({ id: 'q', label: fmt(tx.chipSearch, { q }), onRemove: () => { setQInput(''); setParam({ q: null }); } });
    if (city) out.push({ id: 'city', label: fmt(tx.chipCity, { city }), onRemove: () => { setCityInput(''); setParam({ city: null }); } });
    for (const def of defs) {
      const v = filterValues[def.key];
      if (v) out.push({ id: def.key, label: optionLabel(def, v), onRemove: () => setParam({ [def.key]: null }) });
    }
    if (minSalaryRaw) {
      const n = Number(minSalaryRaw);
      out.push({
        id: 'min',
        label: fmt(tx.chipSalary, { amount: currency ? formatMoney(n, currency, pathLang) : formatCount(n, pathLang) }),
        onRemove: () => setParam({ min: null }),
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, city, category, contract, schedule, workMode, days, exp, minSalaryRaw, currency, defs, tx, pathLang]);

  if (invalidRouteCountry) return <NotFoundPage />;

  // El titulo depende del pais SOLO si va en la direccion (/mx/empleos): /empleos y /jobs llevan
  // el titulo generico (es el que sirven seo/static-meta.mjs y el servidor, igual para todos).
  const seoByCountry = !!routeCountry && country !== ALL;
  const seoTitle = seoByCountry ? fmt(tx.seoTitleCountry, { country: countryLabel }) : tx.seoTitle;
  const seoDescription = seoByCountry ? fmt(tx.seoDescriptionCountry, { country: countryLabel }) : tx.seoDescription;
  // Busquedas filtradas y paginas sucesivas no se indexan (contenido duplicado)
  const noindexFiltered = hasFilters || page > 1 || queryCountry === 'all' || sortWanted !== 'recent';
  // Listado vacio SIN filtros (aun no hay ofertas publicas): no se indexa, pero se siguen sus enlaces.
  // Con ofertas la pagina es indexable. Mientras carga o si falla la carga no se decide: no se
  // desindexa una portada por un error pasajero (auditoria SEO 25/10/2026, hallazgo 8).
  const noindexEmpty = !noindexFiltered && !loading && !error && total === 0;
  const noindex = noindexFiltered || noindexEmpty;

  return (
    <div className="min-h-screen bg-cv-light-gray accent-cv-blue selection:bg-cv-blue/20 dark:bg-dark-bg-primary dark:selection:bg-cv-blue/40">
      <PageSEO title={seoTitle} description={seoDescription} lang={pathLang} noindex={noindex} followLinks={noindexEmpty} />
      <JobListMotion />

      <section className="border-b border-blue-100 bg-blue-50/70 dark:border-dark-border dark:bg-dark-bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 md:py-12 lg:px-8">
          <h1 className="max-w-3xl text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-dark-text-primary">
            {seoByCountry ? fmt(tx.seoTitleCountry, { country: countryLabel }) : tx.heroTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-slate-700 sm:text-lg dark:text-dark-text-secondary">{tx.heroSubtitle}</p>

          <form
            role="search"
            onSubmit={submitSearch}
            className="mt-7 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-16px_rgba(15,23,42,.18)] md:flex-row md:items-center dark:border-dark-border dark:bg-dark-bg-primary dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,.6)]"
          >
            <div className="flex min-w-0 flex-1 flex-col divide-y divide-slate-200 md:flex-row md:divide-x md:divide-y-0 dark:divide-dark-border">
              <div className="relative min-w-0 md:flex-[1.6]">
                <label htmlFor="jf-q" className="sr-only">{tx.searchLabel}</label>
                <MagnifyingGlassIcon className={fieldIcon} aria-hidden="true" />
                <input id="jf-q" type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={tx.searchPlaceholder} className={fieldInput} />
              </div>
              <div className="relative min-w-0 md:flex-1">
                <label htmlFor="jf-city" className="sr-only">{tx.cityLabel}</label>
                <MapPinIcon className={fieldIcon} aria-hidden="true" />
                <input id="jf-city" type="text" value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder={tx.cityPlaceholder} className={fieldInput} />
              </div>
              <div className="relative min-w-0 md:flex-1">
                <label htmlFor="jf-country" className="sr-only">{tx.countryLabel}</label>
                <GlobeEuropeAfricaIcon className={fieldIcon} aria-hidden="true" />
                <select
                  id="jf-country"
                  value={country}
                  onChange={(e) => changeCountry(e.target.value)}
                  className={`${fieldInput} cursor-pointer appearance-none pr-10`}
                >
                  <option value={ALL}>{tx.allCountries}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{pathLang === 'en' ? c.name_en : c.name_es}</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 stroke-2 text-slate-500 dark:text-dark-text-secondary" aria-hidden="true" />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-cv-blue px-8 text-base font-semibold text-white transition-colors duration-150 hover:bg-cv-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary"
            >
              {tx.searchButton}
            </button>
          </form>

          <div className="mt-4">
            <JobFiltersBar
              lang={pathLang}
              values={filterValues}
              currency={currency}
              activeCount={chips.length}
              total={total}
              loading={loading}
              onChange={(patch) => setParam(patch)}
              onClear={clearFilters}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="min-h-6 text-[15px] text-slate-600 tabular-nums dark:text-dark-text-secondary" aria-live="polite">
              {!loading && !error && (
                <>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">
                    {total === 1 ? tx.resultsOne : fmt(tx.resultsMany, { n: formatCount(total, pathLang) })}
                  </span>
                  {country !== ALL && ` ${fmt(tx.resultsIn, { country: countryLabel })}`}
                </>
              )}
            </p>
            {!loading && !error && (rows.length > 1 || sort !== 'recent') && (
              <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-dark-text-secondary">
                <ArrowsUpDownIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <label htmlFor="jf-sort" className="shrink-0">{tx.sortLabel}:</label>
                <select
                  id="jf-sort"
                  value={sort}
                  onChange={(e) => setParam({ sort: e.target.value === 'affinity' ? 'affinity' : null })}
                  aria-describedby={canSortByAffinity ? undefined : 'jf-sort-hint'}
                  title={canSortByAffinity ? undefined : tx.sortAffinityHint}
                  data-testid="job-sort"
                  className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white py-0 pl-2.5 pr-8 text-sm font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cv-light-gray dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:focus-visible:ring-offset-dark-bg-primary"
                >
                  {buildSortOptions(tx).map((o) => (
                    <option key={o.value} value={o.value} disabled={o.value === 'affinity' && !canSortByAffinity}>{o.label}</option>
                  ))}
                </select>
                {!canSortByAffinity && <span id="jf-sort-hint" className="sr-only">{tx.sortAffinityHint}</span>}
              </div>
            )}
          </div>
          <JobFiltersChips chips={chips} onClear={clearFilters} />
        </div>

        {loading && <JobListSkeleton />}

        {!loading && error && (
          <div role="alert" className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-dark-border dark:bg-dark-bg-secondary">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-dark-text-primary">{tx.errorTitle}</h2>
            <p className="mx-auto mt-1 max-w-md text-slate-600 dark:text-dark-text-secondary">{tx.errorHint}</p>
            <button type="button" onClick={() => void load()} className={`${primaryBtn} mt-6`}>{tx.retry}</button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-dark-border-light">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary">
              {hasFilters ? <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" /> : <BriefcaseIcon className="h-6 w-6" aria-hidden="true" />}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-dark-text-primary">
              {hasFilters ? tx.noResultsTitle : tx.emptyTitle}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-slate-600 dark:text-dark-text-secondary">{hasFilters ? tx.noResultsHint : tx.emptyHint}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {hasFilters && (
                <button type="button" onClick={clearFilters} className={primaryBtn}>{tx.clearFilters}</button>
              )}
              {country !== ALL && (
                <button type="button" onClick={() => changeCountry(ALL)} className={hasFilters ? secondaryBtn : primaryBtn}>
                  {hasFilters ? tx.emptyAllCountries : tx.allCountries}
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <>
            <ul className="space-y-3 sm:space-y-4" aria-label={tx.offersListLabel}>
              {rows.map((job, i) => {
                const st = applied.get(job.id);
                const appliedStatus = st === 'WITHDRAWN' ? 'WITHDRAWN' : st || job.already_applied ? 'APPLIED' : null;
                return (
                  <li key={job.id}>
                    <JobCard job={job} lang={pathLang} countries={countries} appliedStatus={appliedStatus} index={i} saved={savedIds.has(job.id)} onToggleSave={onToggleSave} />
                  </li>
                );
              })}
            </ul>

            <JobListPagination lang={pathLang} page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPage={goPage} />
          </>
        )}
      </main>
    </div>
  );
};

export default JobSearchPage;
