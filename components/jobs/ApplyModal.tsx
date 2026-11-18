import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon, CheckCircleIcon, CheckIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import {
  applyToJob, errorCode, fetchJobQuestions, fetchLegalDoc, previewApplicationProfile, registerAcceptance,
  type ApplicationPreview, type JobDetail, type JobQuestion, type LegalDoc,
} from '../../lib/jobsApi';
import { tkey, useJobsText } from './textos';
import { useDetailText } from './DetailTextos';
import { FOCUS_RING, useDialogBehavior } from './ApplyDialog';
import { DetailStyles } from './DetailParts';
import CompanyMark, { initialsOf } from './ui/CompanyMark';

interface Props {
  job: JobDetail;
  onClose: () => void;
  /** Se inscribio (o ya estaba inscrito): la ficha actualiza su estado. */
  onApplied: () => void;
}

interface Opt { value: string; label: string }

function parseOptions(raw: unknown): Opt[] {
  let v: unknown = raw;
  if (typeof raw === 'string') {
    try { v = JSON.parse(raw); } catch { v = raw.split('|'); }
  }
  if (!Array.isArray(v)) return [];
  return v
    .map((o) => (typeof o === 'string' ? { value: o, label: o } : { value: String(o?.value ?? o?.label ?? ''), label: String(o?.label ?? o?.value ?? '') }))
    .filter((o) => o.value !== '');
}

const fieldCls = 'w-full min-h-12 px-4 py-3 bg-white dark:bg-dark-bg-primary border border-slate-300 dark:border-dark-border rounded-xl text-base text-slate-900 dark:text-dark-text-primary placeholder:text-slate-500 dark:placeholder:text-dark-text-tertiary transition-colors duration-150 hover:border-slate-400 dark:hover:border-dark-border-light focus:outline-none focus:ring-2 focus:ring-cv-blue focus:border-cv-blue';
const TRUTH_KEY = 'datos_verdaderos';
const PRIVACY_KEY = 'acepto_condiciones_privacidad';
const COVER_MAX = 10000;

const sectionTitle = 'text-base font-semibold text-slate-900 dark:text-dark-text-primary';

const ApplyModal: React.FC<Props> = ({ job, onClose, onApplied }) => {
  const tx = useJobsText();
  const dx = useDetailText();
  const { lang } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [preview, setPreview] = useState<ApplicationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<JobQuestion[]>([]);
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cover, setCover] = useState('');
  const [boxes, setBoxes] = useState<Record<string, boolean>>({});
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ warnings: string[] } | null>(null);

  const coverMode = (job.cover_letter_mode || 'NONE').toUpperCase();

  // Carga: resumen del perfil, preguntas y documento legal vigente
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([
      previewApplicationProfile(),
      fetchJobQuestions(job.id),
      fetchLegalDoc('terminos_candidato', lang),
    ]).then(([p, q, d]) => {
      if (!alive) return;
      if (p.status === 'fulfilled') setPreview(p.value);
      else setPreviewError(tkey(tx, `err_${errorCode(p.reason)}`, tx.applyProfileError));
      if (q.status === 'fulfilled') setQuestions(q.value);
      if (d.status === 'fulfilled') setDoc(d.value);
      setLoading(false);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id, lang]);

  // Foco atrapado, Escape, scroll de fondo y foco de vuelta
  useDialogBehavior(dialogRef, onClose, !submitting);

  // Casillas que el documento exige ademas de la cesion del perfil
  const extraKeys = useMemo(
    () => (doc?.casillas_obligatorias || []).filter((k) => k !== PRIVACY_KEY),
    [doc],
  );
  const requiredKeys = useMemo(() => doc?.casillas_obligatorias || [], [doc]);

  const missingQuestions = questions.filter((q) => (q.is_required || q.is_knockout) && !(answers[q.id] || '').trim());
  const coverMissing = coverMode === 'REQUIRED' && !cover.trim();
  const consentOk = consent && extraKeys.every((k) => boxes[k]);
  const canSubmit = !!preview && !submitting;

  const scrollToFirstProblem = () => {
    window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  };

  const submit = async () => {
    setTouched(true);
    setSubmitError(null);
    if (missingQuestions.length || coverMissing || !consentOk) { scrollToFirstProblem(); return; }
    setSubmitting(true);
    try {
      const clean: Record<string, string> = {};
      for (const q of questions) {
        const v = (answers[q.id] || '').trim();
        if (v) clean[q.id] = v;
      }
      // Registro legal de la aceptacion ANTES de inscribirse (la IP y el navegador los pone el
      // servidor). El servidor exige la aceptacion vigente en `apply_to_job` (ACCEPTANCE_REQUIRED),
      // asi que se espera el resultado y, si falla, se aborta sin inscribir. Si no hay documento
      // vigente, no se exige nada.
      if (doc) {
        const casillas: Record<string, boolean> = {};
        for (const k of requiredKeys) casillas[k] = true;
        try {
          await registerAcceptance([doc.id], casillas, job.id);
        } catch (e) {
          console.warn('registrar_aceptacion', e);
          setSubmitError(tkey(tx, `err_${errorCode(e)}`, tx.err_ACCEPTANCE_FAILED));
          return;
        }
      }
      const res = await applyToJob({
        jobId: job.id,
        coverLetter: coverMode === 'NONE' ? null : cover.trim() || null,
        answers: clean,
        consentDocVersion: doc?.version ?? null,
      });
      setDone({ warnings: res.warnings });
      onApplied();
    } catch (e) {
      const code = errorCode(e);
      if (code === 'ALREADY_APPLIED') onApplied();
      setSubmitError(tkey(tx, `err_${code}`, tx.err_GENERIC));
    } finally {
      setSubmitting(false);
    }
  };

  const profile = preview?.profile;
  const name = profile?.profile?.full_name || tx.profileNoName;
  const counts = [
    [tx.profileExperiences, profile?.experiences?.length ?? 0],
    [tx.profileEducation, profile?.education?.length ?? 0],
    [tx.profileSkills, profile?.skills?.length ?? 0],
    [tx.profileLanguages, profile?.languages?.length ?? 0],
  ] as const;
  const contact = [preview?.profile.contact?.email, preview?.profile.contact?.phone].filter(Boolean).join(' · ');
  const subline = [profile?.profile?.headline, profile?.profile?.location].filter(Boolean).join(' · ');

  const renderQuestion = (q: JobQuestion) => {
    const type = (q.question_type || 'TEXT').toUpperCase();
    const id = `aq-${q.id}`;
    const value = answers[q.id] || '';
    const isReq = q.is_required || !!q.is_knockout;
    const invalid = touched && isReq && !value.trim();
    const set = (v: string) => setAnswers((a) => ({ ...a, [q.id]: v }));
    const opts = type === 'YES_NO'
      ? [{ value: 'YES', label: tx.yes }, { value: 'NO', label: tx.no }]
      : parseOptions(q.options);
    const isChoice = type === 'YES_NO' || type === 'MULTIPLE_CHOICE' || type === 'SELECT' || type === 'LIST' || (opts.length > 0 && type !== 'TEXT' && type !== 'TEXTAREA' && !type.includes('NUM'));
    const short = opts.length > 0 && opts.length <= 3 && opts.every((o) => o.label.length <= 18);
    const gridCls = type === 'YES_NO' ? 'grid-cols-2' : short ? `grid-cols-1 ${opts.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}` : 'grid-cols-1 sm:grid-cols-2';
    const answered = !!value.trim();

    return (
      <fieldset key={q.id} data-invalid={invalid ? 'true' : undefined} className="space-y-3 min-w-0" aria-invalid={invalid} aria-describedby={invalid ? `${id}-err` : undefined}>
        <legend className="text-[15px] font-medium leading-snug text-slate-900 dark:text-dark-text-primary">
          {q.question_text}
          <span className={`ml-2 text-[13px] font-normal ${!isReq ? 'text-slate-500 dark:text-dark-text-tertiary' : answered ? 'text-slate-600 dark:text-dark-text-secondary' : 'text-amber-700 dark:text-amber-400'}`}>
            {isReq ? tx.required : tx.optional}
          </span>
        </legend>
        {isChoice ? (
          <div className={`grid gap-2 ${gridCls}`} role="radiogroup">
            {opts.map((o) => (
              <label key={o.value} className="relative block cursor-pointer">
                <input type="radio" name={id} value={o.value} checked={value === o.value} onChange={() => set(o.value)} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <span className={`flex min-h-12 items-center gap-3 rounded-xl border bg-white dark:bg-dark-bg-primary px-4 py-2.5 text-[15px] text-slate-800 dark:text-dark-text-primary transition-colors duration-150 hover:border-slate-400 dark:hover:border-dark-border-light peer-checked:border-cv-blue peer-checked:bg-blue-50 dark:peer-checked:bg-cv-blue/15 peer-checked:ring-1 peer-checked:ring-cv-blue peer-focus-visible:ring-2 peer-focus-visible:ring-cv-blue peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-dark-bg-secondary ${invalid ? 'border-red-400 dark:border-red-500/60' : 'border-slate-300 dark:border-dark-border'}`}>
                  <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${value === o.value ? 'border-cv-blue bg-cv-blue text-white' : 'border-slate-400 dark:border-dark-border-light'}`}>
                    {value === o.value && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        ) : type === 'TEXTAREA' ? (
          <textarea id={id} rows={3} value={value} onChange={(e) => set(e.target.value)} className={fieldCls} placeholder={tx.textAnswer} maxLength={2000} aria-label={q.question_text} />
        ) : type.includes('NUM') ? (
          <input id={id} type="number" inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} className={fieldCls} placeholder={tx.numberAnswer} aria-label={q.question_text} />
        ) : (
          <input id={id} type="text" value={value} onChange={(e) => set(e.target.value)} className={fieldCls} placeholder={tx.textAnswer} maxLength={500} aria-label={q.question_text} />
        )}
        {invalid && <p id={`${id}-err`} className="text-sm text-red-700 dark:text-red-400">{tx.fixRequired}</p>}
      </fieldset>
    );
  };

  const checkLabel = 'flex min-h-11 items-start gap-3 rounded-xl p-2.5 -mx-2.5 text-[15px] leading-snug text-slate-700 dark:text-dark-text-secondary cursor-pointer transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cv-blue';
  const checkBox = 'mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 dark:border-dark-border-light cursor-pointer';

  const gaps = preview?.gaps ?? [];

  return (
    <div className="jd-scope">
      <DetailStyles />
      <div
        className="jd-fade fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/55 dark:bg-black/65 backdrop-blur-[2px] sm:items-center sm:p-6"
        onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
      >
        <div
          ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="apply-title"
          className="jd-pop relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white dark:bg-dark-bg-secondary focus:outline-none sm:h-auto sm:max-h-[min(92vh,56rem)] sm:max-w-[40rem] sm:rounded-2xl sm:border sm:border-slate-200 dark:sm:border-dark-border sm:shadow-[0_28px_70px_-28px_rgba(15,23,42,.55)]"
        >
          {/* Cabecera */}
          <div className={`flex shrink-0 items-center gap-3.5 px-5 py-4 sm:px-7 ${done ? '' : 'border-b border-slate-200 dark:border-dark-border'}`}>
            {!done && <CompanyMark name={job.company_name} logoUrl={job.company_logo_url} size="md" />}
            <div className="min-w-0 flex-1">
              {!done ? (
                <>
                  <h2 id="apply-title" className="text-lg font-semibold leading-tight text-slate-900 dark:text-dark-text-primary">{tx.applyTitle}</h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-dark-text-secondary">
                    {fmt(tx.applySubtitle, { title: job.title, company: job.company_name })}
                  </p>
                </>
              ) : <span aria-hidden="true" />}
            </div>
            <button type="button" onClick={onClose} disabled={submitting} aria-label={tx.close}
              className={`-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary dark:hover:text-dark-text-primary disabled:opacity-60 ${FOCUS_RING}`}>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {done ? (
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-10 sm:px-10 sm:py-12">
              <div className="mx-auto max-w-md text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                  <CheckCircleIcon className="h-9 w-9" aria-hidden="true" />
                </span>
                <h2 id="apply-title" className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-text-primary">{tx.successTitle}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-dark-text-secondary">{tx.successText}</p>

                <div className="mt-8 text-left">
                  <h3 className={sectionTitle}>{dx.successNextTitle}</h3>
                  <ol className="mt-3 space-y-3 text-[15px] leading-snug text-slate-700 dark:text-dark-text-secondary">
                    {[dx.successNext1, dx.successNext2].map((t, i) => (
                      <li key={t} className="flex gap-3">
                        <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-700 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary">{i + 1}</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {done.warnings.length > 0 && (
                  <p className="mt-6 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm leading-snug text-amber-900 ring-1 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25">
                    <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                    {tx.successWarnings}
                  </p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link to="/dashboard?seccion=postulaciones" className={`inline-flex h-12 items-center justify-center rounded-xl bg-cv-blue px-6 font-semibold text-white transition-colors duration-150 hover:bg-cv-blue-dark ${FOCUS_RING}`}>
                    {tx.seeMyApplications}
                  </Link>
                  <button type="button" onClick={onClose} className={`h-12 rounded-xl border border-slate-300 px-6 font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:border-dark-border dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary ${FOCUS_RING}`}>
                    {tx.close}
                  </button>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7" role="status">
              <span className="sr-only">{tx.applyLoadingProfile}</span>
              <div className="space-y-4" aria-hidden="true">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-200/80 dark:bg-dark-bg-tertiary motion-safe:animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-200/80 dark:bg-dark-bg-tertiary motion-safe:animate-pulse" />
                    <div className="h-3.5 w-1/2 rounded bg-slate-200/80 dark:bg-dark-bg-tertiary motion-safe:animate-pulse" />
                  </div>
                </div>
                <div className="h-20 rounded-xl bg-slate-200/60 dark:bg-dark-bg-tertiary/70 motion-safe:animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-slate-200/80 dark:bg-dark-bg-tertiary motion-safe:animate-pulse" />
                <div className="h-12 rounded-xl bg-slate-200/60 dark:bg-dark-bg-tertiary/70 motion-safe:animate-pulse" />
                <div className="h-12 rounded-xl bg-slate-200/60 dark:bg-dark-bg-tertiary/70 motion-safe:animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              <div className="jd-scroll flex-1 space-y-8 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
                {/* Tu perfil */}
                <section aria-labelledby="apply-profile">
                  <h3 id="apply-profile" className={sectionTitle}>{dx.applyYourProfile}</h3>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-dark-text-secondary">{tx.profileSummary}</p>
                  {previewError ? (
                    <p role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/30">
                      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                      {previewError}
                    </p>
                  ) : (
                    <div className="mt-4">
                      <div className="flex items-center gap-4">
                        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-full bg-cv-blue/10 text-base font-bold text-cv-blue dark:bg-cv-blue/20 dark:text-cv-blue-light">
                          {initialsOf(name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900 dark:text-dark-text-primary">{name}</p>
                          {subline && <p className="truncate text-sm text-slate-600 dark:text-dark-text-secondary">{subline}</p>}
                          {contact && <p className="truncate text-sm text-slate-600 dark:text-dark-text-secondary">{contact}</p>}
                        </div>
                      </div>
                      <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                        {counts.map(([label, n]) => (
                          <div key={label} className="flex items-baseline justify-between gap-3 border-b border-slate-200 py-2 text-sm dark:border-dark-border">
                            <dt className="text-slate-600 dark:text-dark-text-secondary">{label}</dt>
                            <dd className={`font-semibold tabular-nums ${n > 0 ? 'text-slate-900 dark:text-dark-text-primary' : 'text-slate-500 dark:text-dark-text-tertiary'}`}>{n}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">
                        <InformationCircleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                        {tx.profileSummaryHint}
                      </p>
                    </div>
                  )}

                  {preview && gaps.length > 0 && (
                    <div role="note" className="mt-4 rounded-xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200/70 dark:bg-amber-500/10 dark:ring-amber-500/25">
                      <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                        <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                        {tx.gapsTitle}
                      </p>
                      <ul className="mt-2 space-y-1 pl-7 text-sm text-amber-900 dark:text-amber-200">
                        {gaps.map((g) => <li key={g} className="list-disc marker:text-amber-600 dark:marker:text-amber-400">{tkey(tx, `gap_${g}`, g)}</li>)}
                      </ul>
                      <p className="mt-2 pl-7 text-[13px] leading-snug text-amber-900/90 dark:text-amber-200/90">{tx.gapsHint}</p>
                      <Link to="/dashboard?seccion=mi-perfil" target="_blank" rel="noopener"
                        className={`mt-1.5 -ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg pl-8 pr-2 text-sm font-semibold text-amber-950 underline underline-offset-2 hover:text-amber-800 dark:text-amber-100 dark:hover:text-white ${FOCUS_RING}`}>
                        {tx.completeProfile}
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                  {preview && gaps.length === 0 && (
                    <p className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                      <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />{dx.profileComplete}
                    </p>
                  )}
                </section>

                {/* Preguntas */}
                {questions.length > 0 && (
                  <section aria-labelledby="apply-questions" className="space-y-6 border-t border-slate-200 pt-8 dark:border-dark-border">
                    <h3 id="apply-questions" className={sectionTitle}>{tx.questionsTitle}</h3>
                    {questions.map(renderQuestion)}
                  </section>
                )}

                {/* Carta */}
                {coverMode !== 'NONE' && (
                  <section aria-labelledby="apply-cover" className="border-t border-slate-200 pt-8 dark:border-dark-border" data-invalid={touched && coverMissing ? 'true' : undefined}>
                    <h3 id="apply-cover" className={sectionTitle}>{tx.coverLetterTitle}</h3>
                    <p className={`mt-0.5 text-sm ${coverMode === 'REQUIRED' && !cover.trim() ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-dark-text-secondary'}`}>
                      {coverMode === 'REQUIRED' ? tx.coverLetterRequired : tx.coverLetterOptional}
                    </p>
                    <textarea
                      rows={6} value={cover} onChange={(e) => setCover(e.target.value)} maxLength={COVER_MAX}
                      aria-label={tx.coverLetterTitle} aria-required={coverMode === 'REQUIRED'}
                      placeholder={tx.coverLetterPlaceholder} className={`${fieldCls} mt-3 resize-y leading-relaxed`}
                    />
                    <div className="mt-1.5 flex items-start justify-between gap-3">
                      <span>
                        {touched && coverMissing && <span className="text-sm text-red-700 dark:text-red-400">{tx.err_COVER_LETTER_REQUIRED}</span>}
                      </span>
                      <span className="text-[13px] tabular-nums text-slate-500 dark:text-dark-text-tertiary">{fmt(dx.applyCharCount, { n: cover.length, max: COVER_MAX })}</span>
                    </div>
                  </section>
                )}

                {/* Consentimiento */}
                <section aria-labelledby="apply-consent" className="border-t border-slate-200 pt-8 dark:border-dark-border" data-invalid={touched && !consentOk ? 'true' : undefined}>
                  <h3 id="apply-consent" className={sectionTitle}>{tx.consentTitle}</h3>
                  <div className="mt-3 space-y-1">
                    <label className={checkLabel}>
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className={checkBox} />
                      <span>
                        {fmt(tx.consentCession, { company: job.company_name })}{' '}
                        <Link to={lang === 'es' ? '/terminos' : '/terms'} target="_blank" className="whitespace-nowrap text-cv-blue underline underline-offset-2 dark:text-cv-blue-light">{tx.consentDoc}</Link>
                      </span>
                    </label>
                    {(extraKeys.length ? extraKeys : [TRUTH_KEY]).map((k) => (
                      <label key={k} className={checkLabel}>
                        <input
                          type="checkbox" checked={!!boxes[k]} onChange={(e) => setBoxes((b) => ({ ...b, [k]: e.target.checked }))}
                          className={checkBox}
                        />
                        <span>{k === TRUTH_KEY ? tx.consentTruth : k.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                  {touched && !consentOk && (
                    <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />{tx.consentNeeded}
                    </p>
                  )}
                </section>
              </div>

              {/* Pie fijo */}
              <div className="shrink-0 border-t border-slate-200 bg-white dark:border-dark-border dark:bg-dark-bg-secondary" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {submitError && (
                  <div role="alert" className="mx-5 mt-3 flex items-start gap-2.5 rounded-xl bg-red-50 py-2.5 pl-4 pr-1.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/30 sm:mx-7">
                    <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <span className="flex-1 pt-px leading-snug">{submitError}</span>
                    <button type="button" onClick={() => setSubmitError(null)} aria-label={tx.close}
                      className={`-my-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-700 transition-colors duration-150 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-500/20 ${FOCUS_RING}`}>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-end gap-3 px-5 py-4 sm:px-7">
                  <button type="button" onClick={onClose} disabled={submitting}
                    className={`h-12 rounded-xl px-5 font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-60 dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary ${FOCUS_RING}`}>
                    {tx.cancel}
                  </button>
                  <button type="button" onClick={() => void submit()} disabled={!canSubmit}
                    className={`h-12 flex-1 rounded-xl bg-cv-blue px-6 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-cv-blue-dark disabled:opacity-60 sm:flex-none sm:min-w-[11rem] ${FOCUS_RING}`}>
                    {submitting ? tx.submitting : tx.submit}
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

export default ApplyModal;
