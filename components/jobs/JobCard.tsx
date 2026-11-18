import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon, BookmarkIcon, BriefcaseIcon, BuildingOffice2Icon, CheckBadgeIcon, CheckCircleIcon, ClockIcon,
  HomeIcon, MapPinIcon, TagIcon, UserGroupIcon, ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import type { PublicJobRow } from '../../lib/jobsApi';
import { countryName, type JobCountry, type JobLang } from '../../lib/jobsCatalog';
import { daysUntil, jobHref, timeAgo } from '../../lib/jobsFormat';
import { fmt } from '../../lib/bolsaText';
import { useJobsText } from './textos';
import { useCardText } from './CardTextos';
import CompanyMark from './ui/CompanyMark';
import { FOCUS_RING } from './ApplyDialog';
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
  /** La oferta esta en las guardadas del usuario. */
  saved?: boolean;
  /** Si se pasa, la tarjeta muestra el boton «Guardar» (visible al pasar el raton o enfocar; siempre en movil). */
  onToggleSave?: (job: PublicJobRow) => void;
}

const NEW_WINDOW_MS = 48 * 3600_000;

const MODE_ICON: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  ONSITE: BuildingOffice2Icon,
  HYBRID: ArrowsRightLeftIcon,
  REMOTE: HomeIcon,
};

/**
 * Tarjeta de oferta. Jerarquia: titulo > empresa > cifra del salario > datos clave con icono > resumen > pie.
 * Un solo dato con peso visual (el salario) y color solo con significado:
 * verde = inscrito / empresa verificada, ambar = plazo proximo, azul = oferta nueva.
 */
const JobCard: React.FC<Props> = ({ job, lang, countries, appliedStatus, index, saved = false, onToggleSave }) => {
  const tx = useJobsText();
  const cx = useCardText();

  const isRemote = job.work_mode === 'REMOTE';
  const salary = formatSalaryParts(job, lang);
  const currency = (job.salary_currency || '').toUpperCase();
  // Moneda local distinta del euro: se muestra el codigo si la cifra no lo trae ya
  const showCurrency = !!salary && !!currency && currency !== 'EUR' && !salary.value.includes(currency);
  const left = daysUntil(job.application_deadline);
  const closesSoon = left != null && left >= 0 && left <= 7;
  const isNew = !!job.published_at && Date.now() - new Date(job.published_at).getTime() < NEW_WINDOW_MS;
  const place = isRemote
    ? tx.remote
    : [job.location_city, job.country_code ? countryName(job.country_code, lang, countries) : null].filter(Boolean).join(', ');

  const ModeIcon = (job.work_mode && MODE_ICON[job.work_mode]) || BuildingOffice2Icon;
  const facts: Array<{ key: string; icon: React.ReactNode; text: string }> = [];
  if (place) facts.push({ key: 'place', icon: isRemote ? <HomeIcon /> : <MapPinIcon />, text: place });
  if (job.work_mode && !isRemote) facts.push({ key: 'mode', icon: <ModeIcon />, text: listWorkModeLabel(job.work_mode, lang) });
  const contracts = (job.contract_types || []).map((c) => listContractLabel(c, lang)).filter(Boolean);
  if (contracts.length) facts.push({ key: 'contract', icon: <BriefcaseIcon />, text: contracts.join(', ') });
  if (job.schedule) facts.push({ key: 'schedule', icon: <ClockIcon />, text: listScheduleLabel(job.schedule, lang) });
  if (job.experience_years != null) {
    facts.push({
      key: 'exp', icon: <ArrowTrendingUpIcon />,
      text: job.experience_years <= 0 ? tx.exp0 : job.experience_years === 1 ? cx.experienceOne : fmt(cx.experienceFrom, { n: job.experience_years }),
    });
  }
  if (job.vacancies != null && job.vacancies > 1) facts.push({ key: 'vac', icon: <UserGroupIcon />, text: fmt(tx.vacancies, { n: job.vacancies }) });

  const ago = timeAgo(job.published_at, lang);
  const closesText = left === 0 ? tx.closesToday : left === 1 ? tx.closesTomorrow : fmt(tx.closesInDays, { n: left as number });

  const animate = index != null && index < JOB_ENTER_LIMIT;
  const SaveIcon = saved ? BookmarkSolidIcon : BookmarkIcon;

  return (
    <article
      className={`group relative rounded-2xl border border-slate-200 bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(15,23,42,.06),0_14px_36px_-14px_rgba(15,23,42,.24)] dark:border-dark-border dark:bg-dark-bg-secondary dark:hover:border-dark-border-light dark:hover:shadow-[0_1px_2px_rgba(0,0,0,.4),0_14px_36px_-14px_rgba(0,0,0,.7)] sm:p-5 ${animate ? JOB_ENTER_CLASS : ''}`}
      style={animate ? { animationDelay: `${(index as number) * JOB_ENTER_STEP_MS}ms` } : undefined}
    >
      <div className="flex gap-3.5 sm:gap-4">
        <CompanyMark name={job.company_name} logoUrl={job.company_logo_url} size="card" className="shadow-sm" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h3 className="text-lg font-semibold leading-snug text-slate-900 dark:text-dark-text-primary">
                  <Link
                    to={jobHref(job, lang)}
                    className="rounded-md decoration-slate-400 underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-2xl group-hover:underline focus-visible:underline focus-visible:after:ring-2 focus-visible:after:ring-cv-blue focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-cv-light-gray dark:decoration-dark-text-tertiary dark:focus-visible:after:ring-offset-dark-bg-primary"
                  >
                    {job.title}
                  </Link>
                </h3>
                {isNew && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20 dark:bg-cv-blue/20 dark:text-blue-200 dark:ring-blue-400/30">
                    {cx.newTag}
                  </span>
                )}
                {closesSoon && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {cx.deadlineSoonTag}
                  </span>
                )}
              </div>
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
                {showCurrency && (
                  <abbr title={fmt(cx.salaryCurrencyNote, { currency })} className="ml-1.5 align-[1px] text-[11px] font-semibold tracking-wide text-slate-600 no-underline dark:text-dark-text-secondary">{currency}</abbr>
                )}
              </p>
            )}
          </div>

          {facts.length > 0 && (
            <ul aria-label={cx.factsLabel} className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px] text-slate-700 dark:text-dark-text-secondary">
              {facts.map((f) => (
                <li key={f.key} className="inline-flex items-center gap-1.5">
                  <span className="shrink-0 text-slate-500 dark:text-dark-text-tertiary [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{f.icon}</span>
                  {f.text}
                </li>
              ))}
            </ul>
          )}

          {job.summary && (
            <p className="mt-3 line-clamp-2 max-w-[68ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{job.summary}</p>
          )}

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-3 dark:border-dark-border/70">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600 dark:text-dark-text-secondary">
              {job.category && (
                <span className="inline-flex items-center gap-1.5">
                  <TagIcon className="h-4 w-4 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />
                  {listCategoryLabel(job.category, lang)}
                </span>
              )}
              {ago && (
                <time dateTime={job.published_at} className="inline-flex items-center gap-1.5 tabular-nums">
                  <ClockIcon className="h-4 w-4 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />
                  {ago}
                </time>
              )}
              {closesSoon && <span className="font-medium text-amber-700 dark:text-amber-400">{closesText}</span>}
            </p>
            <div className="flex items-center gap-2">
              {onToggleSave && (
                <button
                  type="button"
                  aria-pressed={saved}
                  aria-label={fmt(saved ? cx.unsaveAria : cx.saveAria, { title: job.title })}
                  onClick={() => onToggleSave(job)}
                  className={`relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-[background-color,opacity] duration-150 sm:min-h-9 ${saved
                    ? 'border-cv-blue/40 bg-blue-50 text-cv-blue dark:border-cv-blue/40 dark:bg-cv-blue/15 dark:text-cv-blue-light'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-bg-tertiary dark:text-dark-text-secondary dark:hover:bg-dark-bg-primary'} ${saved ? '' : 'sm:[@media(hover:hover)]:opacity-0 sm:[@media(hover:hover)]:group-focus-within:opacity-100 sm:[@media(hover:hover)]:group-hover:opacity-100'} focus-visible:opacity-100 ${FOCUS_RING}`}
                >
                  <SaveIcon className="h-4 w-4" aria-hidden="true" />
                  {saved ? cx.savedShort : cx.saveShort}
                </button>
              )}
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
          </div>
        </div>
      </div>
    </article>
  );
};

export default JobCard;
