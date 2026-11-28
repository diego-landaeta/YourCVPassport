import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import { sanitizeJobHtml } from '../../lib/jobPostingHtml';
import {
  EDITABLE_STATUSES,
  STEP_IDS,
  SUBMITTABLE_STATUSES,
  dateInDays,
  editJobPath,
  emptyForm,
  formatDate,
  isReviewStatus,
  jobRowToForm,
  parseRpcError,
  titleIssue,
  validateAll,
  validateStep,
  type CountryRow,
  type FieldErrors,
  type JobForm,
  type StepId,
} from '../../lib/jobPostingModel';
import { msg, pick, useJobText, type JobText } from '../../lib/jobPostingText';
import { useCompanyPublishState } from './CompanyProtectedRoute';
import { ChooseStart } from './jobwizard/ChooseStart';
import { btnPrimaryCls, btnSecondaryCls, cardCls, surfaceCls } from './jobwizard/fields';
import { StepBar, type StepState } from './jobwizard/StepBar';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  loadCompanyContext,
  loadCompanyCountry,
  loadCountries,
  loadPublishTerms,
  loadJobRow,
  loadOfferList,
  loadQuestionRows,
  registerPublishAcceptance,
  saveJob,
  submitForReview,
  type CompanyContext,
  type LegalDoc,
  type OfferListItem,
} from './jobwizard/jobApi';
import { JobStatusBadge } from './jobwizard/StatusBadge';
import { StepBasics } from './jobwizard/StepBasics';
import { StepConditions } from './jobwizard/StepConditions';
import { StepDescription } from './jobwizard/StepDescription';
import { StepReview } from './jobwizard/StepReview';
import { StepScreening } from './jobwizard/StepScreening';

type Phase = 'choose' | 'wizard' | 'done';
type LoadState = 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface DoneInfo {
  kind: 'review' | 'changes';
  status: string;
  deadline: string | null;
  backInReview: boolean;
}

/** Id del control de cada campo del modelo (para llevar el foco desde la lista de errores). */
const FIELD_IDS: Record<string, string> = {
  country_code: 'f-country',
  title: 'f-title',
  category: 'f-category',
  category2: 'f-category2',
  work_mode: 'f-work-mode',
  location_city: 'f-city',
  vacancies: 'f-vacancies',
  description: 'f-description',
  experience_years: 'f-experience',
  languages: 'f-languages',
  contract_types: 'f-contract',
  schedule: 'f-schedule',
  start_date: 'f-start-date',
  show_salary: 'f-show-salary',
  salary_mode: 'f-salary-mode',
  salary_min: 'f-salary-min',
  salary_max: 'f-salary-max',
  questions: 'f-questions-title',
  notify_emails: 'f-notify',
  application_deadline: 'f-deadline',
};

function focusField(field: string) {
  const q = /^questions\.(\d+)\./.exec(field);
  const id = q ? `q${q[1]}-${field.endsWith('.text') ? 'text' : 'type'}` : FIELD_IDS[field];
  let el: HTMLElement | null = id ? document.getElementById(id) : null;
  // Los grupos (radios/casillas) son un fieldset: se enfoca su primer control.
  if (el && el.tagName === 'FIELDSET') el = el.querySelector<HTMLElement>('input,select,textarea');
  if (!el) return;
  el.scrollIntoView?.({ block: 'center' });
  el.focus?.({ preventScroll: true });
}

/** Mensaje del servidor traducido por prefijo (JOB_INVALID: ... lleva además la lista de motivos). */
function serverError(tx: JobText, err: unknown): { text: string; list: string[] } {
  const info = parseRpcError(err);
  if (!info.code) return { text: tx.err_unknown, list: [] };
  const text = msg(tx, `err_${info.code}`);
  const list = info.details.map((d) => msg(tx, `ji_${d}`)).filter((m, i) => m !== `ji_${info.details[i]}`);
  return { text: text === `err_${info.code}` ? tx.err_unknown : text, list };
}

const CreateJobPostingPage: React.FC = () => {
  const tx = useJobText();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const { canPublish, companyPending } = useCompanyPublishState();
  const dupId = search.get('duplicar');
  const startStep = Number(search.get('paso')) || 1;

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [ctx, setCtx] = useState<CompanyContext | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [phase, setPhase] = useState<Phase>('choose');
  const [form, setForm] = useState<JobForm>(() => emptyForm());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('DRAFT');
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<{ text: string; list: string[] } | null>(null);
  const [offers, setOffers] = useState<OfferListItem[]>([]);
  const [offersState, setOffersState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [terms, setTerms] = useState<LegalDoc | null>(null);
  const [termsState, setTermsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<DoneInfo | null>(null);

  const jobIdRef = useRef<string | null>(null);
  const ctxRef = useRef<CompanyContext | null>(null);
  const originalDescRef = useRef<string | null>(null);
  const acceptedRef = useRef<string | null>(null);
  const termsRequested = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const step: StepId = STEP_IDS[stepIdx];
  const editable = EDITABLE_STATUSES.includes(jobStatus);
  const draftLike = SUBMITTABLE_STATUSES.includes(jobStatus);
  const country = useMemo(() => countries.find((c) => c.code === form.country_code) ?? null, [countries, form.country_code]);
  const countryName = country ? (lang === 'en' ? country.name_en : country.name_es) : '';
  const usedCities = useMemo(() => offers.map((o) => o.location_city || '').filter(Boolean), [offers]);

  const set = useCallback((patch: Partial<JobForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaveState((s) => (s === 'saved' ? 'idle' : s));
  }, []);

  // --- Carga inicial -------------------------------------------------------------------
  const refreshOffers = useCallback(async (companyId: string) => {
    setOffersState('loading');
    try {
      setOffers(await loadOfferList(companyId));
      setOffersState('ready');
    } catch {
      setOffersState('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Acabamos de crear esta oferta nosotros (la URL pasó de /new a /edit/:id): el estado ya es el bueno.
    if (id && jobIdRef.current === id && ctxRef.current) return;

    (async () => {
      setLoadState('loading');
      try {
        const [c, cs] = await Promise.all([loadCompanyContext(), loadCountries()]);
        if (cancelled) return;
        ctxRef.current = c;
        setCtx(c);
        setCountries(cs);

        // Sesión de edición limpia (también al pasar de una oferta a «nueva»).
        setDone(null);
        setErrors({});
        setChecks({});
        setSubmitError(null);
        setTermsState('idle');
        termsRequested.current = false;
        setSaveState('idle');
        acceptedRef.current = null;
        originalDescRef.current = null;

        const applyRow = async (srcId: string, duplicate: boolean) => {
          const row = await loadJobRow(srcId, c.companyId);
          if (cancelled) return;
          if (!row) {
            toast.error(tx.load_error);
            navigate('/company/jobs');
            return;
          }
          const qs = await loadQuestionRows(srcId);
          if (cancelled) return;
          if (duplicate) {
            const f = jobRowToForm(row, qs, { keepIds: false });
            f.application_deadline = dateInDays(30);
            if (f.start_date && f.start_date < dateInDays(0)) f.start_immediate = true;
            f.show_salary = f.show_salary ?? null;
            setForm(f);
            jobIdRef.current = null;
            setJobId(null);
            setJobStatus('DRAFT');
            setRejectedReason(null);
            originalDescRef.current = null;
            setPhase('wizard');
            setStepIdx(0);
            setMaxStep(0);
          } else {
            setForm(jobRowToForm(row, qs));
            jobIdRef.current = srcId;
            setJobId(srcId);
            setJobStatus(row.status);
            setRejectedReason(row.status === 'REJECTED' ? row.review_reason || '' : null);
            originalDescRef.current = row.description ?? '';
            setPhase('wizard');
            const idx = Math.min(Math.max(startStep, 1), STEP_IDS.length) - 1;
            setStepIdx(idx);
            setMaxStep(STEP_IDS.length - 1);
          }
        };

        if (id) {
          await applyRow(id, false);
        } else if (dupId) {
          await applyRow(dupId, true);
          void refreshOffers(c.companyId);
        } else {
          jobIdRef.current = null;
          setJobId(null);
          setJobStatus('DRAFT');
          setRejectedReason(null);
          const cc = await loadCompanyCountry(c.companyId);
          if (cancelled) return;
          setForm(emptyForm(cc && cs.some((x) => x.code === cc) ? cc : ''));
          setPhase('choose');
          void refreshOffers(c.companyId);
        }
        if (!cancelled) setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
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
        console.error('[CreateJobPostingPage] load', err);
        setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dupId, reloadKey]);

  // Al cambiar de paso se lleva el foco al título y se sube al principio.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [stepIdx, phase]);

  // Condiciones del empleador: se cargan al llegar al paso final.
  // (Una sola petición por sesión de edición: la guarda es un ref, no el estado, para que el
  // cambio de estado no cancele la propia petición.)
  useEffect(() => {
    if (phase !== 'wizard' || step !== 'review' || !draftLike || termsRequested.current) return;
    termsRequested.current = true;
    setTermsState('loading');
    loadPublishTerms(lang)
      .then((doc) => {
        setTerms(doc);
        setTermsState(doc ? 'ready' : 'error');
      })
      .catch((err) => {
        console.error('[CreateJobPostingPage] terms', err);
        setTermsState('error');
      });
  }, [phase, step, draftLike, lang]);

  // --- Guardado ------------------------------------------------------------------------
  const focusFirstError = () => {
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]') || document.querySelector<HTMLElement>('[role="alert"]');
      el?.focus?.();
      el?.scrollIntoView?.({ block: 'center' });
    }, 0);
  };

  /** Inserta o actualiza la oferta. Devuelve su id y el estado que tiene ahora en la base, o null si falla. */
  const persist = async (): Promise<{ id: string; status: string } | null> => {
    const c = ctxRef.current;
    if (!c) return null;
    setSaveState('saving');
    try {
      const wasNew = !jobIdRef.current;
      const res = await saveJob(form, c, jobIdRef.current, country?.currency ?? null, originalDescRef.current);
      jobIdRef.current = res.id;
      setJobId(res.id);
      setJobStatus(res.status);
      const clean = sanitizeJobHtml(form.description);
      if (originalDescRef.current === null || sanitizeJobHtml(originalDescRef.current) !== clean) originalDescRef.current = clean;
      setForm((f) => ({
        ...f,
        questions: f.questions.map((q) => {
          const m = res.questions.find((r) => r.key === q.key);
          return m?.id ? { ...q, id: m.id } : q;
        }),
      }));
      setSaveState('saved');
      if (wasNew) navigate(editJobPath(res.id, stepIdx + 1), { replace: true });
      return { id: res.id, status: res.status };
    } catch (err) {
      console.error('[CreateJobPostingPage] save', err);
      setSaveState('error');
      const e = serverError(tx, err);
      toast.error(e.text === tx.err_unknown ? tx.save_error : e.text);
      return null;
    }
  };

  const goTo = (idx: number) => {
    setStepIdx(idx);
    setMaxStep((m) => Math.max(m, idx));
  };

  const handleNext = async () => {
    const errs = validateStep(step, form, countries);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError();
      return;
    }
    // Autoguardado en cada «Continuar» (solo borradores/rechazadas: una publicada se guarda al final).
    if (draftLike) {
      const saved = await persist();
      if (!saved) return;
    }
    goTo(Math.min(stepIdx + 1, STEP_IDS.length - 1));
  };

  const handlePrev = () => {
    setErrors({});
    setStepIdx(Math.max(stepIdx - 1, 0));
  };

  const handleSaveDraft = async () => {
    const ti = titleIssue(form.title);
    if (ti) {
      setErrors({ title: `v_title_${ti}` });
      setStepIdx(0);
      focusFirstError();
      return;
    }
    const saved = await persist();
    if (saved) toast.success(tx.saved);
  };

  const jumpToStep = (s: StepId, field?: string) => {
    setErrors({});
    setStepIdx(STEP_IDS.indexOf(s));
    if (field) {
      // Lleva el foco al campo que falla (tras pintar el paso).
      window.setTimeout(() => focusField(field), 80);
    }
  };

  const issues = useMemo(() => (phase === 'wizard' && step === 'review' ? validateAll(form, countries) : []), [phase, step, form, countries]);

  // --- Publicar / guardar cambios --------------------------------------------------------
  const handlePublish = async () => {
    const c = ctxRef.current;
    if (!c || busy) return;
    setSubmitError(null);
    if (validateAll(form, countries).length > 0) return;
    const needsTerms = draftLike;
    if (needsTerms && !canPublish) return;
    if (needsTerms && (!terms || !terms.casillas_obligatorias.every((k) => checks[k]))) return;

    setBusy(true);
    try {
      const saved = await persist();
      if (!saved) return;

      if (!needsTerms) {
        // Oferta ya publicada o pausada: solo se guardan los cambios.
        const back = isReviewStatus(saved.status);
        setDone({ kind: 'changes', status: saved.status, deadline: null, backInReview: back });
        setPhase('done');
        return;
      }

      const acceptKey = `${saved.id}:${terms!.id}`;
      if (acceptedRef.current !== acceptKey) {
        const casillas = Object.fromEntries(terms!.casillas_obligatorias.map((k) => [k, !!checks[k]]));
        await registerPublishAcceptance(terms!, casillas, saved.id, c.companyId);
        acceptedRef.current = acceptKey;
      }
      const res = await submitForReview(saved.id);
      setJobStatus(res.status);
      setDone({ kind: 'review', status: res.status, deadline: res.application_deadline, backInReview: false });
      setPhase('done');
    } catch (err) {
      console.error('[CreateJobPostingPage] publish', err);
      const e = serverError(tx, err);
      setSubmitError(e);
      toast.error(e.text);
    } finally {
      setBusy(false);
    }
  };

  // --- Render --------------------------------------------------------------------------
  const pageTitle = jobId || id ? tx.wz_title_edit : tx.wz_title_new;

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg-primary">
      <div className="border-b border-slate-200 bg-blue-50/70 dark:border-dark-border dark:bg-dark-bg-secondary">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="min-w-0">
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{pageTitle}</h1>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.wz_subtitle}</p>
          </div>
          <button type="button" onClick={() => navigate('/company/jobs')} className={`${btnSecondaryCls} shrink-0`}>
            {phase === 'done' ? tx.wz_back_to_list : tx.btn_cancel}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</div>
    </div>
  );

  if (loadState === 'loading') {
    return shell(
      <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cv-blue" aria-hidden="true" />
        <span className="ml-3 text-slate-600 dark:text-dark-text-secondary">{tx.loading}</span>
      </div>,
    );
  }

  if (loadState === 'error') {
    return shell(
      <div role="alert" className={`${cardCls} mx-auto max-w-xl p-8 text-center`}>
        <p className="mb-4 text-slate-800 dark:text-slate-200">{tx.load_error}</p>
        <button type="button" className={btnPrimaryCls} onClick={() => setReloadKey((k) => k + 1)}>
          {tx.retry}
        </button>
      </div>,
    );
  }

  if (phase === 'choose') {
    return shell(
      <ChooseStart
        tx={tx}
        lang={lang}
        offers={offers}
        offersState={offersState}
        onNew={() => setPhase('wizard')}
        onDuplicate={(srcId) => navigate(`/company/jobs/new?duplicar=${encodeURIComponent(srcId)}`)}
        onRetry={() => ctx && refreshOffers(ctx.companyId)}
      />,
    );
  }

  if (phase === 'done' && done) {
    const manual = done.status === 'MANUAL_REVIEW';
    const title = done.kind === 'changes' ? (done.backInReview ? tx.res_ai_title : tx.saved_changes) : manual ? tx.res_manual_title : tx.res_ai_title;
    const body = done.kind === 'changes' ? (done.backInReview ? tx.res_back_in_review : '') : manual ? tx.res_manual_body : tx.res_ai_body;
    const waiting = done.kind === 'review' || done.backInReview;
    return shell(
      <div className={`${surfaceCls} mx-auto max-w-2xl p-8 text-center sm:p-10`} role="status" data-testid="publish-result" data-status={done.status}>
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
            waiting ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          }`}
        >
          {waiting ? <InformationCircleIcon className="h-7 w-7" aria-hidden="true" /> : <CheckCircleIcon className="h-7 w-7" aria-hidden="true" />}
        </div>
        <div className="mb-3 flex justify-center">
          <JobStatusBadge status={done.kind === 'changes' && !done.backInReview ? jobStatus : done.status} />
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="text-balance text-2xl font-bold tracking-tight text-slate-900 focus:outline-none dark:text-white">
          {title}
        </h2>
        {body && <p className="mx-auto mt-3 max-w-[56ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{body}</p>}
        {done.deadline && <p className="mt-2 text-sm tabular-nums text-slate-600 dark:text-dark-text-secondary">{fmt(tx.res_deadline, { date: formatDate(done.deadline, lang) })}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className={btnPrimaryCls} onClick={() => navigate('/company/jobs')}>
            {tx.res_to_list}
          </button>
          <button type="button" className={btnSecondaryCls} onClick={() => navigate('/company/jobs/new')}>
            {tx.res_create_another}
          </button>
        </div>
      </div>,
    );
  }

  // Estados en los que no se edita
  if (!editable) {
    const inReview = isReviewStatus(jobStatus);
    return shell(
      <div className={`${surfaceCls} mx-auto max-w-2xl p-8`} role="status">
        <div className="mb-3">
          <JobStatusBadge status={jobStatus} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{inReview ? tx.ro_review_title : tx.ro_closed_title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{inReview ? tx.ro_review_body : fmt(tx.ro_closed_body, { status: pick(tx, 'status', jobStatus).toLowerCase() })}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className={btnPrimaryCls} onClick={() => navigate('/company/jobs')}>
            {tx.wz_back_to_list}
          </button>
          {jobId && (
            <button type="button" className={btnSecondaryCls} onClick={() => navigate(`/company/jobs/new?duplicar=${encodeURIComponent(jobId)}`)}>
              {tx.ro_duplicate}
            </button>
          )}
        </div>
      </div>,
    );
  }

  const stepProps = { tx, lang, form, set, errors, disabled: busy };
  const stepName = msg(tx, `step_${step}`);
  const isLast = stepIdx === STEP_IDS.length - 1;

  // Estado de cada paso: misma validación que «Continuar» y la revisión final (una sola fuente).
  const stepItems = STEP_IDS.map((s, i) => {
    const reached = i <= maxStep || i === stepIdx;
    const valid = Object.keys(validateStep(s, form, countries)).length === 0;
    const state: StepState = !reached ? 'pending' : valid ? 'done' : 'missing';
    return { id: s, label: msg(tx, `step_${s}`), state };
  });

  const noteCls = 'mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed';

  return shell(
    <>
      <div className={isLast ? '' : 'mx-auto max-w-3xl'}>
        <StepBar
          tx={tx}
          steps={stepItems}
          current={stepIdx}
          busy={busy}
          onSelect={(i) => {
            setErrors({});
            setStepIdx(i);
          }}
        />
      </div>

      <div className={isLast ? '' : 'mx-auto max-w-3xl'}>
        {jobStatus === 'PUBLISHED' || jobStatus === 'PAUSED' ? (
          <p role="note" className={`${noteCls} border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100`}>
            <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {tx.published_edit_banner} {tx.rv_edit_warning}
            </span>
          </p>
        ) : null}
        {rejectedReason !== null && step !== 'review' && (
          <p role="note" className={`${noteCls} border-red-200 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100`}>
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{rejectedReason ? fmt(tx.rejected_banner, { reason: rejectedReason }) : tx.rejected_banner_nomotivo}</span>
          </p>
        )}

        <div className={isLast ? '' : `${surfaceCls} p-5 sm:p-8`}>
          <div className="mb-6 flex items-start justify-between gap-3">
            <h2 ref={headingRef} tabIndex={-1} className="text-balance text-xl font-bold tracking-tight text-slate-900 focus:outline-none dark:text-white sm:text-2xl">
              {stepName}
            </h2>
            <p className="min-h-[1.25rem] shrink-0 pt-1 text-xs text-slate-600 dark:text-dark-text-secondary" role="status" aria-live="polite" data-testid="save-state">
              {saveState === 'saving' ? tx.saving : saveState === 'saved' ? tx.saved : saveState === 'error' ? tx.save_error : ''}
            </p>
          </div>

          {step === 'basics' && <StepBasics {...stepProps} countries={countries} usedCities={usedCities} />}
          {step === 'description' && <StepDescription {...stepProps} />}
          {step === 'conditions' && <StepConditions {...stepProps} currency={country?.currency ?? null} countryName={countryName} />}
          {step === 'screening' && <StepScreening {...stepProps} />}
          {step === 'review' && (
            <>
              <StepReview
                tx={tx}
                lang={lang}
                form={form}
                mode={draftLike ? 'submit' : 'save'}
                country={country}
                companyName={ctx?.companyName || ''}
                companyLogo={ctx?.companyLogo ?? null}
                issues={issues}
                onGoto={jumpToStep}
                terms={terms}
                termsState={termsState === 'idle' ? 'loading' : termsState}
                checks={checks}
                onChecks={setChecks}
                busy={busy}
                onPublish={handlePublish}
                rejectedReason={rejectedReason}
                publishedEdit={jobStatus === 'PUBLISHED' || jobStatus === 'PAUSED'}
                companyPending={companyPending || !canPublish}
              />
              {submitError && (
                <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100" data-testid="submit-error">
                  <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{submitError.text}</p>
                    {submitError.list.length > 0 && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                        {submitError.list.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Navegación */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={handlePrev} disabled={stepIdx === 0 || busy} className={btnSecondaryCls}>
            {tx.btn_prev}
          </button>
          <div className="flex flex-wrap gap-3">
            {draftLike && (
              <button type="button" onClick={handleSaveDraft} disabled={busy || saveState === 'saving'} className={btnSecondaryCls} data-testid="save-draft">
                {saveState === 'saving' ? tx.saving : tx.btn_save_draft}
              </button>
            )}
            {!isLast && (
              <button type="button" onClick={handleNext} disabled={busy || saveState === 'saving'} className={btnPrimaryCls} data-testid="next-step">
                {saveState === 'saving' ? tx.saving : tx.btn_next}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
  );
};

export default CreateJobPostingPage;
