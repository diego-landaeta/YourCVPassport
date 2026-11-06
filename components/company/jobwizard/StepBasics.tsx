import React from 'react';
import { WORK_MODES, MAX_TITLE, type CountryRow, type FieldErrors, type JobForm } from '../../../lib/jobPostingModel';
import { sortedJobCategories } from '../../../lib/jobCategories';
import { citySuggestions } from '../../../lib/jobPostingCities';
import { fmt } from '../../../lib/bolsaText';
import { msg, pick, type JobText } from '../../../lib/jobPostingText';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { a11y, ChoicePill, Field, FieldGroup, FormSection, inputCls, btnSmallCls } from './fields';

export interface StepProps {
  tx: JobText;
  lang: 'es' | 'en';
  form: JobForm;
  set: (patch: Partial<JobForm>) => void;
  errors: FieldErrors;
  disabled?: boolean;
}

interface BasicsProps extends StepProps {
  countries: CountryRow[];
  usedCities: string[];
}

export const StepBasics: React.FC<BasicsProps> = ({ tx, lang, form, set, errors, countries, usedCities, disabled }) => {
  const cats = sortedJobCategories(lang);
  const countryName = (c: CountryRow) => (lang === 'en' ? c.name_en : c.name_es);
  const sortedCountries = countries.slice().sort((a, b) => countryName(a).localeCompare(countryName(b), lang));
  const needsCity = form.work_mode === 'ONSITE' || form.work_mode === 'HYBRID';
  const remote = form.work_mode === 'REMOTE';
  const cities = citySuggestions(form.country_code, usedCities);
  const addable = sortedCountries.filter((c) => !form.allowed_countries.includes(c.code));
  const e = (k: string) => (errors[k] ? msg(tx, errors[k]) : null);

  return (
    <div>
      <FormSection first title={tx.grp_position}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="f-country" label={tx.f_country} required help={tx.f_country_help} error={e('country_code')}>
          <select
            {...a11y('f-country', { help: true, error: errors.country_code })}
            value={form.country_code}
            disabled={disabled}
            onChange={(ev) => set({ country_code: ev.target.value })}
            className={inputCls}
          >
            <option value="">{tx.select_placeholder}</option>
            {sortedCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {countryName(c)}
              </option>
            ))}
          </select>
        </Field>

        <Field id="f-vacancies" label={tx.f_vacancies} required help={tx.f_vacancies_help} error={e('vacancies')}>
          <input
            {...a11y('f-vacancies', { help: true, error: errors.vacancies })}
            type="number"
            min={1}
            max={999}
            inputMode="numeric"
            value={form.vacancies}
            disabled={disabled}
            onChange={(ev) => set({ vacancies: ev.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field id="f-title" label={tx.f_title} required help={tx.f_title_help} error={e('title')}>
        <input
          {...a11y('f-title', { help: true, error: errors.title })}
          type="text"
          value={form.title}
          disabled={disabled}
          onChange={(ev) => set({ title: ev.target.value })}
          placeholder={tx.f_title_ph}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right" aria-live="polite">
          {fmt(tx.chars_count, { n: form.title.trim().length, max: MAX_TITLE })}
        </p>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="f-category" label={tx.f_category} required help={tx.f_category_help} error={e('category')}>
          <select
            {...a11y('f-category', { help: true, error: errors.category })}
            value={form.category}
            disabled={disabled}
            onChange={(ev) => set({ category: ev.target.value })}
            className={inputCls}
          >
            <option value="">{tx.select_placeholder}</option>
            {cats.map((c) => (
              <option key={c.code} value={c.code}>
                {c[lang]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="f-category2" label={tx.f_category2} optionalLabel={tx.optional} help={tx.f_category2_help} error={e('category2')}>
          <select
            {...a11y('f-category2', { help: true, error: errors.category2 })}
            value={form.category2}
            disabled={disabled}
            onChange={(ev) => set({ category2: ev.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {cats
              .filter((c) => c.code !== form.category)
              .map((c) => (
                <option key={c.code} value={c.code}>
                  {c[lang]}
                </option>
              ))}
          </select>
        </Field>
      </div>

      </FormSection>

      <FormSection title={tx.grp_place}>
      <FieldGroup id="f-work-mode" legend={tx.f_work_mode} required error={e('work_mode')}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx.f_work_mode}>
          {WORK_MODES.map((m) => (
            <ChoicePill
              key={m}
              type="radio"
              name="work_mode"
              checked={form.work_mode === m}
              disabled={disabled}
              onChange={() => set({ work_mode: m })}
              label={pick(tx, 'workmode', m)}
            />
          ))}
        </div>
      </FieldGroup>

      {needsCity && (
        <Field id="f-city" label={tx.f_city} required help={tx.f_city_help} error={e('location_city')}>
          <input
            {...a11y('f-city', { help: true, error: errors.location_city })}
            type="text"
            list="f-city-list"
            autoComplete="off"
            value={form.location_city}
            disabled={disabled}
            onChange={(ev) => set({ location_city: ev.target.value })}
            placeholder={tx.f_city_ph}
            className={inputCls}
          />
          <datalist id="f-city-list">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      )}

      {remote && (
        <FieldGroup id="f-allowed" legend={tx.f_allowed} help={tx.f_allowed_help}>
          {form.allowed_countries.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {form.allowed_countries.map((code) => {
                const c = countries.find((x) => x.code === code);
                const name = c ? countryName(c) : code;
                return (
                  <li key={code} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-sm bg-blue-50 text-blue-900 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:ring-blue-400/25">
                    {name}
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`${tx.btn_remove}: ${name}`}
                      onClick={() => set({ allowed_countries: form.allowed_countries.filter((x) => x !== code) })}
                      className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-2 max-w-md">
            <select
              aria-label={tx.f_allowed_add}
              value=""
              disabled={disabled}
              onChange={(ev) => {
                if (ev.target.value) set({ allowed_countries: [...form.allowed_countries, ev.target.value] });
              }}
              className={inputCls}
            >
              <option value="">{tx.f_allowed_add}…</option>
              {addable.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryName(c)}
                </option>
              ))}
            </select>
            {form.allowed_countries.length > 0 && (
              <button type="button" className={btnSmallCls} onClick={() => set({ allowed_countries: [] })}>
                {tx.btn_remove}
              </button>
            )}
          </div>
        </FieldGroup>
      )}
      </FormSection>
    </div>
  );
};

export default StepBasics;
