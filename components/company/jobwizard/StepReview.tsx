import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import {
  formatDate,
  linesOf,
  parseEmails,
  type CountryRow,
  type JobForm,
  type StepId,
} from '../../../lib/jobPostingModel';
import { jobCategoryLabel } from '../../../lib/jobCategories';
import { jobTextLength } from '../../../lib/jobPostingHtml';
import { fmt } from '../../../lib/bolsaText';
import { msg, pick, type JobText } from '../../../lib/jobPostingText';
import { btnPrimaryCls, btnSmallCls } from './fields';
import type { LegalDoc } from './jobApi';
import { JobPreview, salaryText } from './JobPreview';

export type ReviewMode = 'submit' | 'save';

export interface ReviewIssue {
  step: StepId;
  field: string;
  message: string;
}

interface Props {
  tx: JobText;
  lang: 'es' | 'en';
  form: JobForm;
  mode: ReviewMode;
  country: CountryRow | null;
  companyName: string;
  companyLogo: string | null;
  issues: ReviewIssue[];
  /** Lleva al paso (y, si se indica, al campo concreto). */
  onGoto: (step: StepId, field?: string) => void;
  terms: LegalDoc | null;
  termsState: 'loading' | 'ready' | 'error';
  checks: Record<string, boolean>;
  onChecks: (next: Record<string, boolean>) => void;
  busy: boolean;
  onPublish: () => void;
  rejectedReason?: string | null;
  publishedEdit?: boolean;
  /** Empresa aún PENDING: se puede preparar el borrador pero no publicar. */
  companyPending?: boolean;
}

const SummaryRow: React.FC<{ label: string; empty?: boolean; children: React.ReactNode }> = ({ label, empty, children }) => (
  <div className="grid grid-cols-1 gap-0.5 py-2.5 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
    <dt className="text-[13px] text-slate-600 dark:text-dark-text-secondary">{label}</dt>
    <dd className={`break-words text-[15px] leading-snug ${empty ? 'text-slate-500 dark:text-dark-text-tertiary' : 'text-slate-900 dark:text-white'}`}>{children}</dd>
  </div>
);

const SummaryBlock: React.FC<{ title: string; onEdit: () => void; editLabel: string; first?: boolean; children: React.ReactNode }> = ({ title, onEdit, editLabel, first, children }) => (
  <section className={first ? '' : 'mt-7 border-t border-slate-200 pt-6 dark:border-dark-border'}>
    <div className="mb-1 flex items-center justify-between gap-3">
      <h4 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h4>
      <button type="button" onClick={onEdit} className={btnSmallCls} aria-label={`${editLabel}: ${title}`}>
        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
        {editLabel}
      </button>
    </div>
    <dl className="divide-y divide-slate-100 dark:divide-dark-border">{children}</dl>
  </section>
);

const noteCls = 'flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed';

export const StepReview: React.FC<Props> = ({
  tx,
  lang,
  form,
  mode,
  country,
  companyName,
  companyLogo,
  issues,
  onGoto,
  terms,
  termsState,
  checks,
  onChecks,
  busy,
  onPublish,
  rejectedReason,
  publishedEdit,
  companyPending,
}) => {
  const notSet = tx.sum_not_set;
  const countryName = country ? (lang === 'en' ? country.name_en : country.name_es) : notSet;
  const casillas = terms?.casillas_obligatorias ?? [];
  const checkedCount = casillas.filter((k) => checks[k]).length;
  const allChecked = casillas.length > 0 && checkedCount === casillas.length;
  const needsTerms = mode === 'submit';
  const termsOk = !needsTerms || (termsState === 'ready' && !!terms && allChecked);
  const canPublish = issues.length === 0 && termsOk && !busy && !(needsTerms && companyPending);
  const salary = salaryText(tx, lang, form, country?.currency ?? null, true);
  const qCount = form.questions.length;
  const qKnock = form.questions.filter((q) => q.knockout).length;
  const emails = parseEmails(form.notify_emails).valid;
  const stepTitle = (s: StepId) => msg(tx, `step_${s}`);

  const row = (label: string, value: React.ReactNode, has = true) => (
    <SummaryRow label={label} empty={!has}>
      {has ? value : notSet}
    </SummaryRow>
  );

  return (
    <div>
      <p className="max-w-[64ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.rv_intro}</p>

      {rejectedReason !== undefined && rejectedReason !== null && (
        <div role="status" className={`${noteCls} mt-5 border-red-200 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100`}>
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{rejectedReason ? fmt(tx.rejected_banner, { reason: rejectedReason }) : tx.rejected_banner_nomotivo}</span>
        </div>
      )}

      {issues.length > 0 && (
        <div role="alert" className={`${noteCls} mt-5 border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100`}>
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h4 className="font-semibold">{tx.rv_errors_title}</h4>
            <ul className="mt-2 space-y-1.5">
              {issues.map((i) => (
                <li key={`${i.step}-${i.field}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{msg(tx, i.message)}</span>
                  <button
                    type="button"
                    onClick={() => onGoto(i.step, i.field)}
                    className="rounded font-medium underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
                  >
                    {tx.rv_go}: {stepTitle(i.step)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-start">
        <div aria-label={tx.rv_summary} role="group">
          <SummaryBlock first title={tx.step_basics} editLabel={tx.btn_edit} onEdit={() => onGoto('basics')}>
            {row(tx.f_country, countryName, !!country)}
            {row(tx.f_title, form.title.trim(), !!form.title.trim())}
            {row(
              tx.f_category,
              <>
                {form.category ? jobCategoryLabel(form.category, lang) : ''}
                {form.category2 ? ` · ${jobCategoryLabel(form.category2, lang)}` : ''}
              </>,
              !!form.category,
            )}
            {row(
              tx.f_work_mode,
              <>
                {form.work_mode ? pick(tx, 'workmode', form.work_mode) : ''}
                {form.work_mode !== 'REMOTE' && form.location_city.trim() ? ` · ${form.location_city.trim()}` : ''}
                {form.work_mode === 'REMOTE' && form.allowed_countries.length === 0 ? ` · ${tx.sum_remote_any}` : ''}
              </>,
              !!form.work_mode,
            )}
            {row(tx.f_vacancies, form.vacancies || '1')}
          </SummaryBlock>

          <SummaryBlock title={tx.step_conditions} editLabel={tx.btn_edit} onEdit={() => onGoto('conditions')}>
            {row(tx.f_contract, form.contract_types.map((c) => pick(tx, 'contract', c)).join(', '), form.contract_types.length > 0)}
            {row(tx.f_schedule, form.schedule ? pick(tx, 'schedule', form.schedule) : '', !!form.schedule)}
            {row(tx.f_start, form.start_immediate ? tx.start_immediate : form.start_date, form.start_immediate || !!form.start_date)}
            {row(tx.f_salary, <span className="tabular-nums">{salary}</span>, !!salary)}
            {row(tx.f_show_salary, form.show_salary ? tx.sum_show_salary_yes : tx.sum_show_salary_no, form.show_salary !== null)}
            {row(tx.f_benefits, form.benefits.join(', '), form.benefits.length > 0)}
          </SummaryBlock>

          <SummaryBlock title={tx.step_description} editLabel={tx.btn_edit} onEdit={() => onGoto('description')}>
            {row(tx.f_description, fmt(tx.desc_ok, { n: jobTextLength(form.description) }))}
            {row(tx.f_responsibilities, linesOf(form.responsibilities).length, linesOf(form.responsibilities).length > 0)}
            {row(tx.f_requirements, linesOf(form.requirements).length, linesOf(form.requirements).length > 0)}
            {row(tx.f_education, form.education_min ? pick(tx, 'edu', form.education_min) : '', !!form.education_min)}
            {row(tx.f_experience, form.experience_years, form.experience_years.trim() !== '')}
            {row(tx.f_languages, form.languages.map((l) => `${pick(tx, 'lang', l.language)} ${l.level}`).join(', '), form.languages.length > 0)}
            {row(tx.f_skills_required, form.required_skills.join(', '), form.required_skills.length > 0)}
          </SummaryBlock>

          <SummaryBlock title={tx.step_screening} editLabel={tx.btn_edit} onEdit={() => onGoto('screening')}>
            {row(tx.f_questions, qCount ? fmt(tx.sum_questions_n, { n: qCount, k: qKnock }) : tx.q_none)}
            {row(tx.f_cover_letter, pick(tx, 'cover', form.cover_letter_mode))}
            {row(tx.f_notify_emails, emails.join(', '), emails.length > 0)}
            {row(tx.f_notify_freq, pick(tx, 'freq', form.notify_frequency))}
            {row(tx.f_deadline, <span className="tabular-nums">{formatDate(`${form.application_deadline}T12:00:00`, lang)}</span>)}
          </SummaryBlock>
        </div>

        <div className="xl:sticky xl:top-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{tx.rv_preview}</h3>
          <p className="mb-3 text-[13px] text-slate-600 dark:text-dark-text-secondary">{tx.rv_preview_help}</p>
          <JobPreview tx={tx} lang={lang} form={form} companyName={companyName} companyLogo={companyLogo} country={country} />
        </div>
      </div>

      {needsTerms && (
        <section className="mt-10 border-t border-slate-200 pt-8 dark:border-dark-border" aria-labelledby="rv-terms-title">
          <h3 id="rv-terms-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {tx.rv_terms_title}
          </h3>
          {termsState === 'loading' && <p className="mt-3 text-sm text-slate-600 dark:text-dark-text-secondary">{tx.rv_terms_loading}</p>}
          {termsState === 'error' && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {tx.rv_terms_missing}
            </p>
          )}
          {termsState === 'ready' && terms && (
            <div className="mt-4 max-w-3xl space-y-4">
              <details className="group rounded-lg border border-slate-200 dark:border-dark-border">
                <summary className="cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-cv-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-blue-300">
                  {fmt(tx.rv_terms_read, { version: terms.version })}
                </summary>
                <div className="border-t border-slate-200 px-4 py-4 dark:border-dark-border">
                  {terms.borrador && <p className="mb-2 text-xs text-amber-800 dark:text-amber-300">{tx.rv_terms_draft}</p>}
                  <h4 className="mb-2 font-medium text-slate-900 dark:text-white">{terms.titulo}</h4>
                  <div className="max-h-64 max-w-[68ch] overflow-y-auto whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-300">{terms.texto}</div>
                </div>
              </details>

              <div>
                <p className={`mb-2 flex items-center gap-1.5 text-sm font-medium ${allChecked ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'}`}>
                  {allChecked ? <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> : <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />}
                  <span className="tabular-nums">{fmt(tx.rv_terms_progress, { n: checkedCount, total: casillas.length })}</span>
                </p>
                <div className="space-y-2">
                  {casillas.map((key) => (
                    <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1.5 text-[15px] leading-snug text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-dark-bg-tertiary">
                      <input
                        type="checkbox"
                        checked={!!checks[key]}
                        onChange={(ev) => onChecks({ ...checks, [key]: ev.target.checked })}
                        className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 rounded accent-cv-blue"
                        data-casilla={key}
                      />
                      <span>{msg(tx, `casilla_${key}`) === `casilla_${key}` ? tx.casilla_generic : msg(tx, `casilla_${key}`)}</span>
                    </label>
                  ))}
                </div>
                {!allChecked && <p className="mt-2 text-[13px] text-slate-600 dark:text-dark-text-secondary">{tx.rv_terms_required}</p>}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mt-8 max-w-3xl space-y-3">
        {mode === 'submit' && companyPending && (
          <p role="status" className={`${noteCls} border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100`}>
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{tx.rv_company_pending}</span>
          </p>
        )}
        {(publishedEdit || mode === 'save') && (
          <p role="note" className={`${noteCls} border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100`}>
            <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{tx.rv_edit_warning}</span>
          </p>
        )}
        {mode === 'submit' && (
          <div className="space-y-1 text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary">
            <p>{tx.rv_free_note}</p>
            <p>{tx.rv_review_note}</p>
          </div>
        )}
        <div className="pt-1">
          <button type="button" onClick={onPublish} disabled={!canPublish} className={`${btnPrimaryCls} !px-7 !py-3 text-base`} data-testid="publish-button">
            {busy ? tx.rv_publishing : mode === 'submit' ? (rejectedReason !== undefined && rejectedReason !== null ? tx.rv_resubmit : tx.rv_publish) : tx.rv_save_changes}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepReview;
