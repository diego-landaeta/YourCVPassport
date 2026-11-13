import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon, ArrowTrendingUpIcon, ArrowsRightLeftIcon, BanknotesIcon, BookmarkIcon, BriefcaseIcon, BuildingOffice2Icon, CalendarDaysIcon,
  CheckBadgeIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, FlagIcon, GlobeAltIcon, HomeIcon, MapPinIcon, TagIcon,
  UserGroupIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import PageSEO from '../shared/PageSEO';
import NotFoundPage from '../../pages/NotFoundPage';
import JobRichText from '../jobs/JobRichText';
import ApplyModal from '../jobs/ApplyModal';
import ReportJobModal from '../jobs/ReportJobModal';
import CompanyMark from '../jobs/ui/CompanyMark';
import BrandBand from '../jobs/ui/BrandBand';
import { FOCUS_RING } from '../jobs/ApplyDialog';
import {
  BenefitsGrid, BulletList, DetailSkeleton, DetailStyles, KeyFacts, ReadSection, SimilarRows, SkillChips, catText, contractText, friendly,
  type KeyFact,
} from '../jobs/DetailParts';
import { useDetailText } from '../jobs/DetailTextos';
import { useJobsText } from '../jobs/textos';
import { useJobCountries } from '../jobs/useJobCountries';
import { fmt } from '../../lib/bolsaText';
import {
  countryName, educationLabel, languageReqLabel, scheduleLabel, workModeLabel,
} from '../../lib/jobsCatalog';
import {
  daysUntil, formatDate, formatJobSalary, jobAbsoluteUrl, jobPath, jobsCountryPath, jobsRootPath, parseJobRoute, timeAgo,
} from '../../lib/jobsFormat';
import { htmlToPlainText } from '../../lib/jobsHtml';
import { buildJobPostingJsonLd, jobCanonicalUrl } from '../../lib/jobsJsonLd';
import { loginUrlWithReturn, setPostLoginReturn } from '../../lib/jobsReturn';
import {
  fetchJobDetail, fetchMyApplicationStatuses, fetchSavedJobIds, searchPublicJobs, toggleSavedJob,
  type CandidateStatus, type JobDetail, type PublicJobRow,
} from '../../lib/jobsApi';

function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * Ficha publica de una oferta. URL canonica con pais: /<cc>/ofertas/<slug> (es) y /<cc>/jobs/<slug> (en).
 * Las antiguas /empleos/:slug y /jobs/:slug redirigen (replace) a la canonica si la oferta tiene pais.
 */
const JobDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const tx = useJobsText();
  const dx = useDetailText();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { lang, setLang } = useLanguage();
  const countries = useJobCountries();

  // /empleos/:slug y /<cc>/ofertas/:slug fijan el espanol; /jobs/:slug y /<cc>/jobs/:slug el ingles.
  const pathLang = parseJobRoute(location.pathname).lang;
  useEffect(() => {
    if (lang !== pathLang) setLang(pathLang);
    // Solo al entrar en la ruta: el selector de idioma puede cambiarlo despues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathLang]);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  const [appliedStatus, setAppliedStatus] = useState<CandidateStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const [similar, setSimilar] = useState<PublicJobRow[]>([]);
  const [showApply, setShowApply] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // --- Carga de la oferta -------------------------------------------------------
  useEffect(() => {
    if (!slug) { setStatus('notfound'); return; }
    let alive = true;
    setStatus('loading');
    setJob(null);
    fetchJobDetail(slug)
      .then((j) => {
        if (!alive) return;
        if (!j) { setStatus('notfound'); return; }
        setJob(j);
        setStatus('ready');
        // Visita (sin bloquear): una RPC suma views_count y el servidor pone el perfil
        void (async () => { try { await supabase.rpc('track_job_posting_view', { p_job_posting_id: j.id }); } catch { /* ignorar */ } })();
      })
      .catch((e) => {
        if (!alive) return;
        console.error('Error loading job', e);
        setStatus('error');
      });
    return () => { alive = false; };
  }, [slug, reloadKey]);

  // --- Estado del usuario en esta oferta --------------------------------------
  const refreshUserState = useCallback(async () => {
    if (!user || !job) { setAppliedStatus(null); setSaved(false); return; }
    const [apps, savedIds] = await Promise.allSettled([fetchMyApplicationStatuses(), fetchSavedJobIds(user.id)]);
    if (apps.status === 'fulfilled') setAppliedStatus(apps.value.get(job.id) ?? null);
    if (savedIds.status === 'fulfilled') setSaved(savedIds.value.has(job.id));
  }, [user, job]);
  useEffect(() => { void refreshUserState(); }, [refreshUserState]);

  // --- Ofertas parecidas ------------------------------------------------------
  useEffect(() => {
    if (!job) return;
    let alive = true;
    (async () => {
      try {
        let res = await searchPublicJobs({ country: job.country_code, category: job.category, limit: 4 });
        let rows = res.rows.filter((r) => r.id !== job.id);
        if (rows.length === 0 && job.category) {
          res = await searchPublicJobs({ country: job.country_code, limit: 4 });
          rows = res.rows.filter((r) => r.id !== job.id);
        }
        if (alive) setSimilar(rows.slice(0, 3));
      } catch { if (alive) setSimilar([]); }
    })();
    return () => { alive = false; };
  }, [job]);

  // --- Acciones ---------------------------------------------------------------
  const goLogin = (withApply: boolean) => {
    const ret = `${location.pathname}${withApply ? '?apply=1' : ''}`;
    setPostLoginReturn(ret);
    navigate(loginUrlWithReturn(ret));
  };

  const accepting = !!job?.accepting_applications;
  const alreadyApplied = !!appliedStatus;

  const onApplyClick = () => {
    if (!user) { goLogin(true); return; }
    if (alreadyApplied || !accepting) return;
    setShowApply(true);
  };

  // URL canonica: si la oferta tiene pais y la direccion es otra (ruta antigua sin pais, o pais
  // que no es el suyo), se sustituye (replace) por /<cc>/ofertas|jobs/<slug> conservando query y hash.
  // Va ANTES del efecto de ?apply=1: si coinciden en el mismo ciclo gana el ultimo `navigate`.
  const canonicalPath = job?.country_code ? jobPath(job.country_code, job.slug, pathLang) : null;
  useEffect(() => {
    if (!canonicalPath) return;
    let current = location.pathname;
    try { current = decodeURIComponent(current); } catch { /* ruta mal codificada: se redirige igualmente */ }
    let target = canonicalPath;
    try { target = decodeURIComponent(canonicalPath); } catch { /* ignorar */ }
    if (current !== target) navigate(`${canonicalPath}${location.search}${location.hash}`, { replace: true });
  }, [canonicalPath, location.pathname, location.search, location.hash, navigate]);

  // Vuelta del login con ?apply=1: abre la inscripcion una sola vez
  useEffect(() => {
    if (!job) return;
    const wantsApply = new URLSearchParams(location.search).get('apply') === '1';
    if (!wantsApply) return;
    if (user && accepting && !alreadyApplied) setShowApply(true);
    if (user) navigate(canonicalPath ?? location.pathname, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, user, accepting, alreadyApplied]);

  const onSaveClick = async () => {
    if (!job) return;
    if (!user) { goLogin(false); return; }
    try {
      await toggleSavedJob(job.id);
      setSaved((s) => !s);
      toast.success(saved ? tx.saveRemoved : tx.saved);
    } catch {
      toast.error(tx.saveError);
    }
  };

  const onReportClick = () => {
    if (!user) { toast(tx.reportLoginNeeded); goLogin(false); return; }
    setShowReport(true);
  };

  const closeApply = useCallback(() => setShowApply(false), []);
  const closeReport = useCallback(() => setShowReport(false), []);

  // --- Derivados --------------------------------------------------------------
  const salary = job ? formatJobSalary(job, pathLang) : null;
  const canonical = job ? jobCanonicalUrl(job.slug, pathLang, job.country_code) : '';
  // hreflang reciprocos con pais; sin pais se queda el par antiguo que calcula PageSEO.
  const alternates = job && job.country_code
    ? {
      en: jobAbsoluteUrl(job.country_code, job.slug, 'en'),
      es: jobAbsoluteUrl(job.country_code, job.slug, 'es'),
      xDefault: jobAbsoluteUrl(job.country_code, job.slug, 'en'),
    }
    : undefined;
  const jsonLd = useMemo(() => (job ? buildJobPostingJsonLd(job, canonical, pathLang) : null), [job, canonical, pathLang]);
  const listPath = job
    ? (pathLang === 'es' ? jobsCountryPath(job.country_code, 'es') : jobsRootPath('en'))
    : jobsRootPath(pathLang);

  if (status === 'notfound') return <NotFoundPage />;

  if (status === 'loading') return <DetailSkeleton label={tx.loading} />;

  if (status === 'error' || !job) {
    return (
      <div className="jd-scope min-h-screen bg-white dark:bg-dark-bg-primary flex items-center justify-center px-4">
        <DetailStyles />
        <div role="alert" className="max-w-md w-full text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300">
            <ExclamationTriangleIcon className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-dark-text-primary">{tx.loadError}</h1>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={`h-11 px-5 rounded-xl bg-cv-blue text-white font-semibold hover:bg-cv-blue-dark transition-colors duration-150 ${FOCUS_RING}`}>{tx.retry}</button>
            <Link to={jobsRootPath(pathLang)} className={`inline-flex h-11 items-center px-5 rounded-xl border border-slate-300 dark:border-dark-border text-slate-700 dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary transition-colors duration-150 ${FOCUS_RING}`}>{tx.back}</Link>
          </div>
        </div>
      </div>
    );
  }

  const isRemote = job.work_mode === 'REMOTE';
  const place = isRemote
    ? (job.allowed_countries && job.allowed_countries.length
      ? fmt(tx.remoteIn, { countries: job.allowed_countries.map((c) => countryName(c, pathLang, countries)).join(', ') })
      : tx.remote)
    : [job.location_city, job.location_state, job.country_code ? countryName(job.country_code, pathLang, countries) : job.location_country].filter(Boolean).join(', ');
  const contracts = (job.contract_types || []).map((c) => contractText(c, pathLang));
  const logoUrl = safeUrl(job.company_logo_url);
  const website = safeUrl(job.company_website);
  const deadline = job.application_deadline;
  const seoDescription = htmlToPlainText(job.description, 155) || `${job.title} - ${job.company_name}`;

  // Plazo en texto: cuenta atras, y ambar solo si queda poco
  const left = daysUntil(deadline);
  let deadlineMain: string;
  let deadlineSub = '';
  let urgent = false;
  if (!accepting) {
    if (deadline && left !== null && left < 0) { deadlineMain = dx.deadlineEnded; deadlineSub = fmt(dx.deadlineEndedOn, { date: formatDate(deadline, pathLang) }); }
    else deadlineMain = dx.closedShort;
  } else if (!deadline || left === null) {
    deadlineMain = dx.deadlineNone;
  } else {
    deadlineSub = fmt(dx.deadlineUntil, { date: formatDate(deadline, pathLang) });
    if (left <= 0) { deadlineMain = dx.deadlineLastDay; urgent = true; }
    else if (left === 1) { deadlineMain = dx.deadlineLeftOne; urgent = true; }
    else { deadlineMain = fmt(dx.deadlineLeftMany, { n: left }); urgent = left <= 7; }
  }
  const closedLook = !accepting;
  const vacanciesText = job.vacancies && job.vacancies > 1 ? fmt(tx.vacancies, { n: job.vacancies }) : (job.vacancies === 1 ? dx.vacanciesOne : '');
  const postedText = job.published_at ? fmt(dx.postedWhen, { when: timeAgo(job.published_at, pathLang) }) : '';

  const facts: KeyFact[] = [
    { key: 'salary', label: tx.detailSalary, value: salary || tx.salaryNotShown, icon: <BanknotesIcon />, muted: !salary },
    ...(contracts.length ? [{ key: 'contract', label: tx.detailContract, value: contracts.join(', '), icon: <BriefcaseIcon /> }] : []),
    ...(job.work_mode ? [{ key: 'mode', label: tx.detailWorkMode, value: workModeLabel(job.work_mode, pathLang), icon: job.work_mode === 'REMOTE' ? <HomeIcon /> : job.work_mode === 'HYBRID' ? <ArrowsRightLeftIcon /> : <BuildingOffice2Icon /> }] : []),
    ...(job.schedule ? [{ key: 'schedule', label: tx.detailSchedule, value: scheduleLabel(job.schedule, pathLang), icon: <ClockIcon /> }] : []),
  ];

  const detailRows: Array<[string, string]> = ([
    [tx.detailCategory, [catText(job.category, pathLang), job.category2 ? catText(job.category2, pathLang) : ''].filter(Boolean).join(' · ')],
    [tx.detailExperience, job.experience_years ? fmt(tx.detailExperienceYears, { n: job.experience_years }) : ''],
    [tx.detailEducation, friendly(educationLabel(job.education_min, pathLang))],
    [tx.detailLanguages, (job.languages || []).map((l) => languageReqLabel(l, pathLang)).filter(Boolean).join(', ')],
    [tx.detailStart, job.start_immediate ? tx.detailStartImmediate : formatDate(job.start_date, pathLang)],
    [tx.detailDuration, job.duration || ''],
  ] as Array<[string, string]>).filter(([, v]) => !!v);

  const listSections = ([
    [tx.sectionResponsibilities, job.responsibilities],
    [tx.sectionRequirements, job.requirements],
    [tx.sectionNiceToHave, job.nice_to_have],
  ] as Array<[string, string[] | null]>)
    .map(([title, items]) => [title, (items || []).filter((i) => i && i.trim())] as [string, string[]])
    .filter(([, items]) => items.length > 0);
  const benefits = (job.benefits || []).filter((b) => b && b.trim());
  const reqSkills = (job.required_skills || []).filter((x) => x && x.trim());
  const optSkills = (job.optional_skills || []).filter((x) => x && x.trim());
  const hasSkills = reqSkills.length + optSkills.length > 0;
  const experienceText = job.experience_years == null ? '' : job.experience_years <= 0 ? dx.experienceNone : fmt(dx.experienceYearsHeader, { n: job.experience_years });

  const metaRows = (
    <ul className="space-y-3 text-sm">
      {(accepting || deadlineMain !== dx.closedShort) && <li className="flex items-start gap-3">
        <ClockIcon className={`mt-0.5 h-5 w-5 shrink-0 ${urgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-dark-text-tertiary'}`} aria-hidden="true" />
        <span>
          <span className={`block font-semibold tabular-nums ${urgent ? 'text-amber-800 dark:text-amber-300' : 'text-slate-900 dark:text-dark-text-primary'}`}>{deadlineMain}</span>
          {deadlineSub && <span className="block text-[13px] text-slate-600 dark:text-dark-text-secondary tabular-nums">{deadlineSub}</span>}
        </span>
      </li>}
      {vacanciesText && (
        <li className="flex items-center gap-3 text-slate-700 dark:text-dark-text-secondary">
          <UserGroupIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />
          <span className="tabular-nums">{vacanciesText}</span>
        </li>
      )}
      {postedText && (
        <li className="flex items-center gap-3 text-slate-700 dark:text-dark-text-secondary">
          <CalendarDaysIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />
          <span className="tabular-nums">{postedText}</span>
        </li>
      )}
    </ul>
  );

  const reportBtn = (cls: string) => (
    <button
      type="button" onClick={onReportClick}
      className={`inline-flex min-h-11 lg:min-h-0 items-center gap-1.5 text-[13px] text-slate-600 dark:text-dark-text-secondary hover:text-red-700 dark:hover:text-red-400 transition-colors duration-150 rounded-md ${FOCUS_RING} ${cls}`}
    >
      <FlagIcon className="h-4 w-4" aria-hidden="true" />{tx.report}
    </button>
  );

  const applyArea = (compact: boolean) => {
    if (!accepting) {
      return (
        <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-dark-text-secondary">
          <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          {dx.closedShort}
        </p>
      );
    }
    if (alreadyApplied) {
      const withdrawn = appliedStatus === 'WITHDRAWN';
      return (
        <div className={compact ? 'flex-1 min-w-0' : 'space-y-2'}>
          <p className={`flex items-center gap-2 font-semibold ${withdrawn ? 'text-slate-700 dark:text-dark-text-secondary' : 'text-green-700 dark:text-green-400'}`}>
            <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className={compact ? 'text-sm leading-tight' : ''}>{withdrawn ? tx.withdrawnAlready : tx.appliedAlready}</span>
          </p>
          <Link to="/dashboard?seccion=postulaciones" className={`${compact ? 'text-[13px] pl-7' : 'text-sm pl-7'} block text-cv-blue dark:text-cv-blue-light underline underline-offset-2 rounded ${FOCUS_RING}`}>{tx.seeMyApplications}</Link>
        </div>
      );
    }
    return (
      <button
        type="button" onClick={onApplyClick}
        className={`${compact ? 'flex-1' : 'w-full'} h-12 px-5 rounded-xl bg-cv-blue text-white text-base font-semibold shadow-sm hover:bg-cv-blue-dark active:scale-[0.99] transition-[background-color,transform] duration-150 ${FOCUS_RING}`}
      >
        {user ? tx.apply : tx.loginToApply}
      </button>
    );
  };

  const saveBtn = (iconOnly: boolean) => (
    <button
      type="button" onClick={() => void onSaveClick()} aria-pressed={saved}
      aria-label={iconOnly ? (saved ? tx.saved : tx.save) : undefined}
      className={`inline-flex items-center justify-center gap-2 ${iconOnly ? 'h-12 w-12 shrink-0' : 'h-11 w-full px-4'} rounded-xl border text-sm font-medium transition-colors duration-150 ${saved
        ? 'border-cv-blue/40 bg-blue-50 text-cv-blue dark:bg-cv-blue/15 dark:text-cv-blue-light dark:border-cv-blue/40'
        : 'border-slate-300 dark:border-dark-border text-slate-700 dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary'} ${FOCUS_RING}`}
    >
      <BookmarkIcon className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
      {!iconOnly && (saved ? tx.saved : tx.save)}
    </button>
  );

  return (
    <div className={`jd-scope min-h-screen bg-white dark:bg-dark-bg-primary ${accepting ? 'pb-24 lg:pb-0' : ''}`}>
      <DetailStyles />
      <PageSEO
        title={pathLang === 'es' ? `${job.title} en ${job.company_name}` : `${job.title} at ${job.company_name}`}
        description={seoDescription}
        lang={pathLang}
        canonical={canonical}
        alternates={alternates}
        jsonLd={jsonLd}
        noindex={!accepting}
      />

      {/* Cabecera */}
      <div className="relative isolate overflow-hidden border-b border-slate-200 dark:border-dark-border bg-blue-50/70 dark:bg-dark-bg-secondary">
        <BrandBand name={job.company_name} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8 sm:pb-10">
          <Link to={listPath} className={`inline-flex min-h-11 items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary transition-colors duration-150 rounded-md ${FOCUS_RING}`}>
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            {tx.back}
          </Link>

          <header className="jd-rise mt-6 flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-7">
            <CompanyMark
              name={job.company_name} logoUrl={logoUrl} size="xl" eager
              className="!ring-2 !ring-white dark:!ring-white/20 shadow-[0_1px_2px_rgba(15,23,42,.08),0_14px_28px_-12px_rgba(15,23,42,.35)]"
            />
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.1] text-balance text-slate-900 dark:text-dark-text-primary">{job.title}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg text-slate-700 dark:text-dark-text-secondary">
                {website ? (
                  <a href={website} target="_blank" rel="noopener noreferrer nofollow" className={`font-medium hover:text-cv-blue dark:hover:text-cv-blue-light underline-offset-2 hover:underline rounded ${FOCUS_RING}`}>{job.company_name}</a>
                ) : (
                  <span className="font-medium">{job.company_name}</span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25">
                  <CheckBadgeIcon className="h-[18px] w-[18px]" aria-hidden="true" />{dx.verifiedCompany}
                </span>
              </p>
              <ul className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-slate-700 dark:text-dark-text-secondary">
                {place && (
                  <li className="inline-flex items-center gap-1.5">
                    <MapPinIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />{place}
                  </li>
                )}
                {job.category && (
                  <li className="inline-flex items-center gap-1.5">
                    <TagIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />{catText(job.category, pathLang)}
                  </li>
                )}
                {experienceText && (
                  <li className="inline-flex items-center gap-1.5">
                    <ArrowTrendingUpIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />{experienceText}
                  </li>
                )}
                {vacanciesText && (
                  <li className="inline-flex items-center gap-1.5 tabular-nums">
                    <UserGroupIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />{vacanciesText}
                  </li>
                )}
                {postedText && (
                  <li className="inline-flex items-center gap-1.5 tabular-nums">
                    <CalendarDaysIcon className="h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />{postedText}
                  </li>
                )}
              </ul>
            </div>
          </header>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {!accepting && (
          <div role="status" className="jd-rise mb-8 flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-5 py-4">
            <XCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-200">{tx.closedTitle}</p>
              <p className="mt-0.5 text-sm text-red-800 dark:text-red-200/90">{tx.closedText}</p>
            </div>
          </div>
        )}

        <div className="jd-rise" style={{ ['--i' as string]: 1 } as React.CSSProperties}>
          <KeyFacts facts={facts} label={dx.keyFacts} />
        </div>

        {/* Plazo y vacantes en movil (en escritorio viven en el panel lateral) */}
        <div className="lg:hidden mt-6 rounded-2xl border border-slate-200 dark:border-dark-border px-5 py-4">{metaRows}</div>

        <div className="mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19.5rem] gap-x-14 gap-y-10 items-start">
          <article className="min-w-0 divide-y divide-slate-200 dark:divide-dark-border [&>section:not(:first-child)]:pt-9 [&>section:not(:last-child)]:pb-9">
            {job.description && job.description.trim() && (
              <ReadSection id="sec-desc" title={tx.sectionDescription}>
                <JobRichText text={job.description} className="max-w-[68ch] text-[15px] sm:text-base leading-[1.7] text-slate-700 dark:text-dark-text-secondary" />
              </ReadSection>
            )}

            {listSections.map(([title, items]) => (
              <ReadSection key={title} title={title}>
                <BulletList items={items} />
              </ReadSection>
            ))}

            {hasSkills && (
              <ReadSection title={tx.sectionSkills}>
                <SkillChips required={reqSkills} optional={optSkills} dx={dx} />
              </ReadSection>
            )}

            {benefits.length > 0 && (
              <ReadSection id="sec-work-here" title={dx.workHereTitle}>
                <p className="-mt-2 mb-5 max-w-[68ch] text-[15px] text-slate-600 dark:text-dark-text-secondary">{fmt(dx.workHereLead, { company: job.company_name })}</p>
                <BenefitsGrid items={benefits} />
              </ReadSection>
            )}

            {detailRows.length > 0 && (
              <ReadSection title={dx.sectionDetails}>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 max-w-2xl">
                  {detailRows.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[13px] text-slate-600 dark:text-dark-text-secondary">{label}</dt>
                      <dd className="mt-0.5 text-[15px] font-medium text-slate-900 dark:text-dark-text-primary tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </ReadSection>
            )}

            {job.application_instructions && (
              <ReadSection title={tx.sectionHowToApply}>
                <p className="max-w-[68ch] whitespace-pre-line text-[15px] sm:text-base leading-[1.7] text-slate-700 dark:text-dark-text-secondary">{job.application_instructions}</p>
              </ReadSection>
            )}

            <ReadSection id="sec-company" title={tx.sectionAboutCompany}>
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
                <CompanyMark name={job.company_name} logoUrl={logoUrl} size="xl" className="shadow-[0_1px_2px_rgba(15,23,42,.06),0_10px_22px_-12px_rgba(15,23,42,.3)]" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-lg font-semibold text-slate-900 dark:text-dark-text-primary">
                    {job.company_name}
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckBadgeIcon className="h-[18px] w-[18px]" aria-hidden="true" />{dx.verifiedCompany}
                    </span>
                  </p>
                  {job.company_description && <p className="mt-2 max-w-[68ch] whitespace-pre-line text-[15px] leading-[1.65] text-slate-700 dark:text-dark-text-secondary">{job.company_description}</p>}
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer nofollow" className={`mt-3 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-cv-blue dark:text-cv-blue-light underline underline-offset-2 break-all rounded sm:min-h-0 ${FOCUS_RING}`}>
                      <GlobeAltIcon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="sr-only">{dx.companyWebsite}: </span>{hostOf(website)}
                    </a>
                  )}
                </div>
              </div>
            </ReadSection>

            <div className="lg:hidden pt-6">{reportBtn('')}</div>
          </article>

          {/* Panel de accion pegajoso (escritorio) */}
          <aside className="hidden lg:block lg:sticky lg:top-24" aria-label={job.title}>
            <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary p-5 shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-16px_rgba(15,23,42,.18)] dark:shadow-none">
              <div className="space-y-3">
                {applyArea(false)}
                {accepting && !alreadyApplied && saveBtn(false)}
                {accepting && alreadyApplied && saveBtn(false)}
                {accepting && !alreadyApplied && (
                  <p className="text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">{user ? dx.applyHintIn : dx.applyHintOut}</p>
                )}
                {!accepting && (
                  <a href="#sec-similar" className={`flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 dark:border-dark-border text-sm font-medium text-slate-700 dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary transition-colors duration-150 ${FOCUS_RING}`}>{dx.seeSimilar}</a>
                )}
              </div>
              <div className="mt-5 border-t border-slate-200 dark:border-dark-border pt-5">{metaRows}</div>
              <div className="mt-5 border-t border-slate-200 dark:border-dark-border pt-4">{reportBtn('')}</div>
            </div>
          </aside>
        </div>

        {/* Ofertas parecidas */}
        <section className="mt-16" aria-labelledby="sec-similar">
          <h2 id="sec-similar" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-dark-text-primary mb-4">{tx.similarTitle}</h2>
          {similar.length > 0 ? (
            <SimilarRows rows={similar} lang={pathLang} countries={countries} tx={tx} dx={dx} />
          ) : (
            <p className="text-slate-600 dark:text-dark-text-secondary">{tx.noSimilar}</p>
          )}
          <Link to={listPath} className={`mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-cv-blue dark:text-cv-blue-light hover:underline underline-offset-2 rounded ${FOCUS_RING}`}>{tx.allOffers}</Link>
        </section>
      </main>

      {/* Barra fija en movil y tablet */}
      {accepting && (
        <div role="region" aria-label={tx.mobileApplyBar}
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center gap-3 px-4 pt-3 bg-white/95 dark:bg-dark-bg-secondary/95 backdrop-blur border-t border-slate-200 dark:border-dark-border"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          {applyArea(true)}
          {saveBtn(true)}
        </div>
      )}

      {showApply && <ApplyModal job={job} onClose={closeApply} onApplied={() => void refreshUserState()} />}
      {showReport && user && <ReportJobModal jobId={job.id} userId={user.id} onClose={closeReport} />}
    </div>
  );
};

export default JobDetailPage;
