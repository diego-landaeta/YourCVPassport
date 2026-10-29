import React from 'react';
import { BanknotesIcon, BriefcaseIcon, BuildingOffice2Icon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDate, formatMoney, linesOf, salaryAmounts, type CountryRow, type JobForm } from '../../../lib/jobPostingModel';
import { jobCategoryLabel } from '../../../lib/jobCategories';
import { fmt } from '../../../lib/bolsaText';
import { pick, type JobText } from '../../../lib/jobPostingText';
import CompanyMark from '../../jobs/ui/CompanyMark';
import { JobRichText } from './JobRichText';

interface Props {
  tx: JobText;
  lang: 'es' | 'en';
  form: JobForm;
  companyName: string;
  companyLogo: string | null;
  country: CountryRow | null;
}

/** Texto del salario según el modo y el periodo (vacío si no hay o no se muestra). */
export function salaryText(tx: JobText, lang: 'es' | 'en', form: JobForm, currency: string | null, ignoreShow = false): string {
  if (!form.salary_mode || (!ignoreShow && form.show_salary !== true)) return '';
  const { min, max } = salaryAmounts(form);
  const period = pick(tx, 'period', form.salary_period);
  const m = (n: number | null) => formatMoney(n, currency, lang);
  switch (form.salary_mode) {
    case 'RANGE':
      return min !== null && max !== null ? fmt(tx.sum_salary_range, { min: m(min), max: m(max), period }) : '';
    case 'FROM':
      return min !== null ? fmt(tx.sum_salary_from, { min: m(min), period }) : '';
    case 'UP_TO':
      return max !== null ? fmt(tx.sum_salary_to, { max: m(max), period }) : '';
    case 'EXACT':
      return min !== null ? fmt(tx.sum_salary_exact, { min: m(min), period }) : '';
    default:
      return '';
  }
}

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-7">
    <h4 className="mb-2.5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h4>
    {children}
  </section>
);

const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-700 marker:text-slate-400 dark:text-slate-300">
    {items.map((r, i) => (
      <li key={i}>{r}</li>
    ))}
  </ul>
);

const Fact: React.FC<{ icon: React.ReactNode; label: string; value: string; strong?: boolean }> = ({ icon, label, value, strong }) => (
  <div className="flex items-start gap-3 bg-white px-4 py-3.5 dark:bg-dark-bg-secondary">
    <span className="mt-0.5 text-slate-500 dark:text-slate-400" aria-hidden="true">
      {icon}
    </span>
    <div className="min-w-0">
      <dt className="text-xs text-slate-600 dark:text-dark-text-secondary">{label}</dt>
      <dd className={`mt-0.5 break-words text-[15px] leading-snug text-slate-900 dark:text-white ${strong ? 'font-semibold tabular-nums' : 'font-medium'}`}>{value}</dd>
    </div>
  </div>
);

/** Vista previa «como candidato» de la ficha de una oferta (solo lectura): misma estructura que la ficha pública. */
export const JobPreview: React.FC<Props> = ({ tx, lang, form, companyName, companyLogo, country }) => {
  const countryName = country ? (lang === 'en' ? country.name_en : country.name_es) : '';
  const place = form.work_mode === 'REMOTE' ? tx.pv_remote : [form.location_city.trim(), countryName].filter(Boolean).join(', ');
  const salary = salaryText(tx, lang, form, country?.currency ?? null);
  const resp = linesOf(form.responsibilities);
  const req = linesOf(form.requirements);
  const nice = linesOf(form.nice_to_have);
  const vac = Number(form.vacancies) || 1;
  const dash = '—';

  let closes = '';
  if (form.application_deadline) {
    const days = Math.ceil((new Date(`${form.application_deadline}T23:59:59`).getTime() - Date.now()) / 86_400_000);
    if (Number.isFinite(days) && days >= 1) closes = days === 1 ? tx.pv_closes_one : fmt(tx.pv_closes, { n: days });
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-16px_rgba(15,23,42,.18)] dark:border-dark-border dark:bg-dark-bg-secondary dark:shadow-none"
      aria-label={tx.rv_preview}
      data-testid="job-preview"
    >
      <header className="flex items-start gap-4 p-5 sm:p-6">
        <CompanyMark name={companyName || tx.pv_company} logoUrl={companyLogo} size="lg" />
        <div className="min-w-0">
          <h3 className="text-balance break-words text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">{form.title.trim() || tx.pv_untitled}</h3>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-dark-text-secondary">
            <span className="font-medium text-slate-800 dark:text-slate-100">{companyName || tx.pv_company}</span>
            {place ? ` · ${place}` : ''}
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-px border-y border-slate-200 bg-slate-200 dark:border-dark-border dark:bg-dark-border sm:grid-cols-2">
        <Fact icon={<BanknotesIcon className="h-5 w-5" />} label={tx.f_salary} value={salary || dash} strong />
        <Fact icon={<BriefcaseIcon className="h-5 w-5" />} label={tx.f_contract} value={form.contract_types.length ? form.contract_types.map((c) => pick(tx, 'contract', c)).join(', ') : dash} />
        <Fact icon={<BuildingOffice2Icon className="h-5 w-5" />} label={tx.f_work_mode} value={form.work_mode ? pick(tx, 'workmode', form.work_mode) : dash} />
        <Fact icon={<ClockIcon className="h-5 w-5" />} label={tx.f_schedule} value={form.schedule ? pick(tx, 'schedule', form.schedule) : dash} />
      </dl>

      <div className="px-5 pb-6 sm:px-6">
        {form.category && <p className="mt-5 text-[13px] text-slate-600 dark:text-dark-text-secondary">{jobCategoryLabel(form.category, lang)}</p>}

        <Block title={tx.pv_about}>
          <JobRichText html={form.description} className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300" />
        </Block>

        {resp.length > 0 && (
          <Block title={tx.pv_responsibilities}>
            <Bullets items={resp} />
          </Block>
        )}
        {(req.length > 0 || form.education_min || form.experience_years || form.languages.length > 0) && (
          <Block title={tx.pv_requirements}>
            <Bullets
              items={[
                ...req,
                ...(form.education_min ? [`${tx.pv_education}: ${pick(tx, 'edu', form.education_min)}`] : []),
                ...(form.experience_years.trim() !== '' ? [`${tx.pv_experience}: ${Number(form.experience_years) === 1 ? tx.pv_year_one : fmt(tx.pv_years, { n: form.experience_years })}`] : []),
                ...form.languages.map((l) => `${pick(tx, 'lang', l.language)} (${l.level})`),
              ]}
            />
          </Block>
        )}
        {nice.length > 0 && (
          <Block title={tx.pv_nice}>
            <Bullets items={nice} />
          </Block>
        )}
        {(form.required_skills.length > 0 || form.optional_skills.length > 0) && (
          <Block title={tx.pv_skills}>
            <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
              {form.required_skills.map((s, i) => (
                <React.Fragment key={`r-${s}`}>
                  {i > 0 ? ' · ' : ''}
                  <span className="font-medium text-slate-900 dark:text-white">{s}</span>
                </React.Fragment>
              ))}
              {form.required_skills.length > 0 && form.optional_skills.length > 0 ? ' · ' : ''}
              {form.optional_skills.join(' · ')}
            </p>
          </Block>
        )}
        {form.benefits.length > 0 && (
          <Block title={tx.pv_benefits}>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 text-[15px] text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              {form.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-dark-border dark:bg-dark-bg-tertiary/50 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button type="button" disabled className="rounded-lg bg-cv-blue px-6 py-2.5 font-semibold text-white opacity-60 cursor-not-allowed">
            {tx.pv_apply}
          </button>
          <div className="min-w-0 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">
            <p>{tx.pv_apply_note}</p>
            <p className="tabular-nums">
              {[vac === 1 ? tx.pv_vacancy : fmt(tx.pv_vacancies, { n: vac }), closes, form.application_deadline ? fmt(tx.sum_deadline, { date: formatDate(`${form.application_deadline}T12:00:00`, lang) }) : ''].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </footer>
    </article>
  );
};

export default JobPreview;
