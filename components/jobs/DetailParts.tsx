import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, GiftIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { PublicJobRow } from '../../lib/jobsApi';
import {
  categoryLabel, contractLabel, countryName, type JobCountry, type JobLang,
} from '../../lib/jobsCatalog';
import { formatJobSalary, jobHref, timeAgo } from '../../lib/jobsFormat';
import { fmt } from '../../lib/bolsaText';
import CompanyMark from './ui/CompanyMark';
import { FOCUS_RING } from './ApplyDialog';
import type { DetailText } from './DetailTextos';
import type { JobsText } from './textos';

/** Detalles del navegador y movimiento de la ficha y del modal (todo el movimiento bajo prefers-reduced-motion). */
export const DetailStyles: React.FC = () => (
  <style>{`
    .jd-scope { accent-color: #2563EB; }
    .jd-scope ::selection { background: rgba(37, 99, 235, .22); }
    .dark .jd-scope { color-scheme: dark; }
    .jd-scope .jd-scroll { scrollbar-width: thin; }
    @media (prefers-reduced-motion: no-preference) {
      .jd-scope .jd-rise { animation: jd-rise .55s cubic-bezier(.16, 1, .3, 1) both; animation-delay: calc(var(--i, 0) * 60ms); }
      .jd-scope .jd-pop { animation: jd-pop .28s cubic-bezier(.16, 1, .3, 1) both; }
      .jd-scope .jd-fade { animation: jd-fade .2s ease-out both; }
      @keyframes jd-rise { from { opacity: 0; transform: translateY(6px); } }
      @keyframes jd-pop { from { opacity: 0; transform: translateY(12px) scale(.985); } }
      @keyframes jd-fade { from { opacity: 0; } }
    }
  `}</style>
);

/** Si falta la etiqueta traducida (el catalogo devuelve el codigo), humaniza el codigo: LOGISTICS -> Logistics. */
export function friendly(label: string): string {
  if (!label || !/^[A-Z0-9_]+$/.test(label)) return label;
  const t = label.toLowerCase().replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const catText = (key: string | null | undefined, lang: JobLang) => friendly(categoryLabel(key, lang));
export const contractText = (key: string | null | undefined, lang: JobLang) => friendly(contractLabel(key, lang));

/** Lista con vinetas finas (sin tarjeta). */
export const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-2.5 max-w-[68ch]">
    {items.map((i, idx) => (
      <li key={idx} className="relative pl-5 text-[15px] sm:text-base leading-[1.65] text-slate-700 dark:text-dark-text-secondary before:absolute before:left-0.5 before:top-[0.72em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-slate-400 dark:before:bg-dark-text-tertiary">
        {i}
      </li>
    ))}
  </ul>
);

/** Seccion de lectura: titular y contenido, sin tarjeta; el filete lo pone el contenedor. */
export const ReadSection: React.FC<{ id?: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section aria-labelledby={id} className="pt-9 first:pt-0">
    <h2 id={id} className="text-xl font-semibold tracking-tight text-slate-900 dark:text-dark-text-primary mb-4">{title}</h2>
    {children}
  </section>
);

export interface KeyFact { key: string; label: string; value: string; icon: React.ReactNode; muted?: boolean; strong?: boolean }

const COLS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

/** Tira de datos clave: celdas con icono en baldosa y valor grande separadas por filetes (no chips). */
export const KeyFacts: React.FC<{ facts: KeyFact[]; label: string }> = ({ facts, label }) => (
  <dl aria-label={label} className={`grid grid-cols-2 ${COLS[Math.min(4, Math.max(1, facts.length))]} gap-px overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-200 dark:bg-dark-border shadow-[0_1px_2px_rgba(15,23,42,.04)]`}>
    {facts.map((f) => (
      <div key={f.key} className="flex flex-col items-start gap-2.5 bg-white dark:bg-dark-bg-secondary px-4 py-4 sm:flex-row sm:items-start sm:gap-3.5 sm:px-5 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-6 [&>svg]:w-6 ${f.muted ? 'bg-slate-100 text-slate-500 dark:bg-dark-bg-tertiary dark:text-dark-text-tertiary' : 'bg-blue-50 text-cv-blue dark:bg-cv-blue/15 dark:text-blue-300'}`}
        >
          {f.icon}
        </span>
        <div className="min-w-0">
          <dt className="text-[13px] text-slate-600 dark:text-dark-text-secondary">{f.label}</dt>
          <dd className={`mt-0.5 break-words text-base sm:text-lg leading-snug tabular-nums ${f.muted ? 'font-medium text-slate-500 dark:text-dark-text-tertiary' : 'font-semibold text-slate-900 dark:text-dark-text-primary'}`}>
            {f.value}
          </dd>
        </div>
      </div>
    ))}
  </dl>
);

/** Habilidades como chips con icono: con marca de verificacion las imprescindibles, con «+» las que se valoran. */
export const SkillChips: React.FC<{ required: string[]; optional: string[]; dx: DetailText }> = ({ required, optional, dx }) => (
  <ul className="flex flex-wrap gap-2">
    {required.map((s) => (
      <li key={`r-${s}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-sm font-medium text-slate-800 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text-primary">
        <CheckIcon className="h-4 w-4 shrink-0 stroke-[2.5] text-cv-blue dark:text-blue-300" aria-hidden="true" />
        {s}<span className="sr-only"> ({dx.skillRequired})</span>
      </li>
    ))}
    {optional.map((s) => (
      <li key={`o-${s}`} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1.5 pl-2 pr-3 text-sm text-slate-700 dark:border-dark-border-light dark:bg-transparent dark:text-dark-text-secondary">
        <PlusIcon className="h-4 w-4 shrink-0 stroke-2 text-slate-500 dark:text-dark-text-tertiary" aria-hidden="true" />
        {s}<span className="sr-only"> ({dx.skillNice})</span>
      </li>
    ))}
  </ul>
);

/** «Cómo es trabajar aquí»: los beneficios como lista de dos columnas con icono (sin tarjetas). */
export const BenefitsGrid: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="grid max-w-3xl grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
    {items.map((i, idx) => (
      <li key={idx} className="flex items-start gap-3 text-[15px] leading-snug text-slate-700 dark:text-dark-text-secondary">
        <span aria-hidden="true" className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-cv-blue dark:bg-cv-blue/15 dark:text-blue-300">
          <GiftIcon className="h-4 w-4" />
        </span>
        <span className="pt-0.5">{i}</span>
      </li>
    ))}
  </ul>
);

/** Esqueleto con la misma forma que la ficha. */
export const DetailSkeleton: React.FC<{ label: string }> = ({ label }) => {
  const bar = 'rounded-md bg-slate-200/80 dark:bg-dark-bg-tertiary motion-safe:animate-pulse';
  return (
    <div className="jd-scope min-h-screen bg-white dark:bg-dark-bg-primary" role="status" aria-label={label}>
      <DetailStyles />
      <div className="border-b border-slate-200 dark:border-dark-border bg-blue-50/70 dark:bg-dark-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
          <div className={`${bar} h-4 w-40`} />
          <div className="mt-6 flex gap-5">
            <div className={`${bar} h-20 w-20 rounded-2xl shrink-0`} />
            <div className="flex-1 space-y-3 pt-1">
              <div className={`${bar} h-9 w-3/4 max-w-lg`} />
              <div className={`${bar} h-5 w-1/2 max-w-xs`} />
              <div className={`${bar} h-4 w-1/3 max-w-[14rem]`} />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${bar} h-24 w-full rounded-2xl`} />
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-12">
          <div className="space-y-4">
            <div className={`${bar} h-6 w-40`} />
            <div className={`${bar} h-4 w-full`} />
            <div className={`${bar} h-4 w-11/12`} />
            <div className={`${bar} h-4 w-4/5`} />
            <div className={`${bar} h-6 w-32 mt-8`} />
            <div className={`${bar} h-4 w-3/4`} />
            <div className={`${bar} h-4 w-2/3`} />
          </div>
          <div className={`${bar} hidden lg:block h-72 rounded-2xl`} />
        </div>
      </div>
    </div>
  );
};

interface SimilarProps { rows: PublicJobRow[]; lang: JobLang; countries: ReadonlyArray<JobCountry>; tx: JobsText; dx: DetailText }

/** Ofertas parecidas como filas compactas: una linea de titulo, una de metadatos y el salario a la derecha. */
export const SimilarRows: React.FC<SimilarProps> = ({ rows, lang, countries, tx, dx }) => (
  <ul className="divide-y divide-slate-200 dark:divide-dark-border border-y border-slate-200 dark:border-dark-border">
    {rows.map((s) => {
      const salary = formatJobSalary(s, lang);
      const place = s.work_mode === 'REMOTE'
        ? tx.remote
        : [s.location_city, s.country_code ? countryName(s.country_code, lang, countries) : null].filter(Boolean).join(', ');
      const meta = [s.company_name, place, (s.contract_types || []).map((c) => contractText(c, lang)).join(', ')].filter(Boolean).join(' · ');
      return (
        <li key={s.id}>
          <Link
            to={jobHref(s, lang)}
            className={`group flex items-center gap-4 py-4 px-1 -mx-1 rounded-xl transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-dark-bg-secondary ${FOCUS_RING}`}
          >
            <CompanyMark name={s.company_name} logoUrl={s.company_logo_url} size="md" />
            <span className="min-w-0 flex-1">
              <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-dark-text-primary truncate group-hover:underline underline-offset-2 decoration-slate-400">{s.title}</h3>
              <span className="mt-0.5 block text-sm text-slate-600 dark:text-dark-text-secondary truncate">{meta}</span>
              {salary && <span className="mt-0.5 block text-sm font-semibold tabular-nums text-slate-900 dark:text-dark-text-primary sm:hidden">{salary}</span>}
            </span>
            <span className="hidden sm:block shrink-0 text-right">
              {salary && <span className="block text-sm font-semibold tabular-nums text-slate-900 dark:text-dark-text-primary">{salary}</span>}
              <span className="block text-[13px] text-slate-600 dark:text-dark-text-secondary">{fmt(dx.similarWhen, { when: timeAgo(s.published_at, lang) })}</span>
            </span>
          </Link>
        </li>
      );
    })}
  </ul>
);
