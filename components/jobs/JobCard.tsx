import React from 'react';
import { Link } from 'react-router-dom';
import { CheckBadgeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { PublicJobRow } from '../../lib/jobsApi';
import { countryName, type JobCountry, type JobLang } from '../../lib/jobsCatalog';
import { daysUntil, jobHref, timeAgo } from '../../lib/jobsFormat';
import { fmt } from '../../lib/bolsaText';
import { useJobsText } from './textos';
import CompanyMark from './ui/CompanyMark';
import {
  formatSalaryParts, listCategoryLabel, listContractLabel, listScheduleLabel, listWorkModeLabel,
} from './JobListFormat';
import { JOB_ENTER_CLASS, JOB_ENTER_LIMIT, JOB_ENTER_STEP_MS } from './JobListMotion';

interface Props {
  job: PublicJobRow;
  lang: JobLang;
  countries: ReadonlyArray<JobCountry>;
  /** Estado de la candidatura del usuario en esta oferta (null = no inscrito). */
  appliedStatus?: 'APPLIED' | 'WITHDRAWN' | null;
  /** Posicion en el listado: las primeras tarjetas entran escalonadas (solo con movimiento permitido). */
  index?: number;
}

/**
 * Fila de oferta. Jerarquia: titulo > empresa > cifra del salario > metadatos > pie.
 * Un solo dato con peso visual (el salario) y color solo con significado:
 * verde = inscrito / empresa verificada, ambar = plazo proximo.
 */
const JobCard: React.FC<Props> = ({ job, lang, countries, appliedStatus, index }) => {
  const tx = useJobsText();

  const isRemote = job.work_mode === 'REMOTE';
  const salary = formatSalaryParts(job, lang);
  const left = daysUntil(job.application_deadline);
  const closesSoon = left != null && left >= 0 && left <= 7;
  const place = isRemote
    ? tx.remote
    : [job.location_city, job.country_code ? countryName(job.country_code, lang, countries) : null].filter(Boolean).join(', ');

  const meta = [
    place,
    job.work_mode && !isRemote ? listWorkModeLabel(job.work_mode, lang) : '',
    ...(job.contract_types || []).map((c) => listContractLabel(c, lang)),
    job.schedule ? listScheduleLabel(job.schedule, lang) : '',
  ].filter(Boolean).join(' · ');

  const footer: React.ReactNode[] = [];
  if (job.category) footer.push(<span key="cat">{listCategoryLabel(job.category, lang)}</span>);
  const ago = timeAgo(job.published_at, lang);
  if (ago) footer.push(<time key="ago" dateTime={job.published_at} className="tabular-nums">{ago}</time>);
  if (closesSoon) {
    footer.push(
      <span key="close" className="font-medium text-amber-700 dark:text-amber-400">
        {left === 0 ? tx.closesToday : left === 1 ? tx.closesTomorrow : fmt(tx.closesInDays, { n: left as number })}
      </span>,
    );
  }
  if (job.vacancies != null && job.vacancies > 1) footer.push(<span key="vac" className="tabular-nums">{fmt(tx.vacancies, { n: job.vacancies })}</span>);

  const animate = index != null && index < JOB_ENTER_LIMIT;

  return (
    <article
      className={`group relative rounded-2xl border border-slate-200 bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-16px_rgba(15,23,42,.18)] dark:border-dark-border dark:bg-dark-bg-secondary dark:hover:border-dark-border-light dark:hover:shadow-[0_1px_2px_rgba(0,0,0,.4),0_12px_32px_-16px_rgba(0,0,0,.6)] sm:p-5 ${animate ? JOB_ENTER_CLASS : ''}`}
      style={animate ? { animationDelay: `${(index as number) * JOB_ENTER_STEP_MS}ms` } : undefined}
    >
      <div className="flex gap-3.5 sm:gap-4">
        <CompanyMark name={job.company_name} logoUrl={job.company_logo_url} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-snug text-slate-900 dark:text-dark-text-primary">
                <Link
                  to={jobHref(job, lang)}
                  className="rounded-md decoration-slate-400 underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-2xl group-hover:underline focus-visible:underline focus-visible:after:ring-2 focus-visible:after:ring-cv-blue focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-cv-light-gray dark:decoration-dark-text-tertiary dark:focus-visible:after:ring-offset-dark-bg-primary"
                >
                  {job.title}
                </Link>
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[15px] text-slate-700 dark:text-dark-text-secondary">
                <span className="truncate">{job.company_name}</span>
                <span className="inline-flex shrink-0" title={tx.verifiedCompany}>
                  <CheckBadgeIcon className="h-[18px] w-[18px] stroke-2 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="sr-only">{tx.verifiedCompany}</span>
                </span>
              </p>
            </div>

            {salary && (
              <p className="shrink-0 text-base font-semibold tabular-nums text-slate-900 dark:text-dark-text-primary sm:pt-0.5 sm:text-right">
                {salary.value}
                {salary.period && <span className="ml-1 text-sm font-normal text-slate-600 dark:text-dark-text-secondary">{salary.period}</span>}
              </p>
            )}
          </div>

          {meta && <p className="mt-2 text-sm text-slate-600 dark:text-dark-text-secondary">{meta}</p>}

          {job.summary && (
            <p className="mt-2.5 line-clamp-2 max-w-[68ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{job.summary}</p>
          )}

          {(footer.length > 0 || appliedStatus) && (
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-slate-600 dark:text-dark-text-secondary">
                {footer.map((node, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-dark-border-light">·</span>}
                    {node}
                  </React.Fragment>
                ))}
              </p>
              {appliedStatus && (
                <span
                  className={`relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${appliedStatus === 'WITHDRAWN'
                    ? 'bg-slate-100 text-slate-700 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary'
                    : 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25'}`}
                >
                  {appliedStatus !== 'WITHDRAWN' && <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />}
                  {appliedStatus === 'WITHDRAWN' ? tx.withdrawn : tx.applied}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default JobCard;
