import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CEFR_LEVELS, EDUCATION_LEVELS, JOB_LANGUAGES, MIN_DESCRIPTION } from '../../../lib/jobPostingModel';
import { jobTextLength } from '../../../lib/jobPostingHtml';
import { fmt } from '../../../lib/bolsaText';
import { msg, pick } from '../../../lib/jobPostingText';
import { a11y, btnGhostCls, btnSmallCls, ChipInput, Field, FieldGroup, FormSection, inputCls } from './fields';
import { RichTextEditor } from './RichTextEditor';
import type { StepProps } from './StepBasics';

export const StepDescription: React.FC<StepProps> = ({ tx, form, set, errors, disabled }) => {
  const len = jobTextLength(form.description);
  const e = (k: string) => (errors[k] ? msg(tx, errors[k]) : null);
  const usedLangs = form.languages.map((l) => l.language);
  const freeLangs = JOB_LANGUAGES.filter((l) => !usedLangs.includes(l));

  return (
    <div>
      <FormSection first title={tx.grp_text}>
        <Field id="f-description" label={tx.f_description} required help={tx.f_description_help} error={e('description')}>
          <RichTextEditor
            id="f-description"
            value={form.description}
            onChange={(html) => set({ description: html })}
            placeholder={tx.ed_placeholder}
            ariaLabel={tx.f_description}
            toolbarLabel={tx.ed_toolbar}
            labels={{ bold: tx.ed_bold, italic: tx.ed_italic, ul: tx.ed_ul, ol: tx.ed_ol }}
            invalid={!!errors.description}
            describedBy={['f-description-help', errors.description ? 'f-description-err' : ''].filter(Boolean).join(' ')}
            disabled={disabled}
          />
          <p
            data-testid="description-count"
            aria-live="polite"
            className={`mt-1.5 text-right text-[13px] tabular-nums ${len >= MIN_DESCRIPTION ? 'font-medium text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-dark-text-secondary'}`}
          >
            {len >= MIN_DESCRIPTION ? fmt(tx.desc_ok, { n: len }) : fmt(tx.desc_count, { n: len, min: MIN_DESCRIPTION })}
          </p>
        </Field>
      </FormSection>

      <FormSection title={tx.grp_lists}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="f-responsibilities" label={tx.f_responsibilities} optionalLabel={tx.optional} help={tx.f_lines_help}>
            <textarea
              {...a11y('f-responsibilities', { help: true })}
              rows={5}
              value={form.responsibilities}
              disabled={disabled}
              onChange={(ev) => set({ responsibilities: ev.target.value })}
              className={inputCls}
            />
          </Field>
          <Field id="f-requirements" label={tx.f_requirements} optionalLabel={tx.optional} help={tx.f_lines_help}>
            <textarea
              {...a11y('f-requirements', { help: true })}
              rows={5}
              value={form.requirements}
              disabled={disabled}
              onChange={(ev) => set({ requirements: ev.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <Field id="f-nice" label={tx.f_nice_to_have} optionalLabel={tx.optional} help={tx.f_lines_help}>
          <textarea
            {...a11y('f-nice', { help: true })}
            rows={3}
            value={form.nice_to_have}
            disabled={disabled}
            onChange={(ev) => set({ nice_to_have: ev.target.value })}
            className={inputCls}
          />
        </Field>
      </FormSection>

      <FormSection title={tx.grp_profile}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="f-education" label={tx.f_education} optionalLabel={tx.optional}>
            <select
              {...a11y('f-education', {})}
              value={form.education_min}
              disabled={disabled}
              onChange={(ev) => set({ education_min: ev.target.value as typeof form.education_min })}
              className={inputCls}
            >
              <option value="">—</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {pick(tx, 'edu', l)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-experience" label={tx.f_experience} optionalLabel={tx.optional} help={tx.f_experience_help} error={e('experience_years')}>
            <input
              {...a11y('f-experience', { help: true, error: errors.experience_years })}
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              value={form.experience_years}
              disabled={disabled}
              onChange={(ev) => set({ experience_years: ev.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title={tx.grp_langskills}>
        <FieldGroup id="f-languages" legend={tx.f_languages} help={tx.f_languages_help} error={e('languages')}>
          {form.languages.length === 0 && <p className="mb-3 text-sm text-slate-600 dark:text-dark-text-secondary">{tx.lang_none}</p>}
          <ul className="space-y-2">
            {form.languages.map((l, i) => (
              <li key={l.language} className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={tx.f_language}
                  value={l.language}
                  disabled={disabled}
                  onChange={(ev) => set({ languages: form.languages.map((x, j) => (j === i ? { ...x, language: ev.target.value } : x)) })}
                  className={`${inputCls} !w-auto min-w-[10rem]`}
                >
                  {[l.language, ...freeLangs].map((code) => (
                    <option key={code} value={code}>
                      {pick(tx, 'lang', code)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={tx.f_level}
                  value={l.level}
                  disabled={disabled}
                  onChange={(ev) => set({ languages: form.languages.map((x, j) => (j === i ? { ...x, level: ev.target.value } : x)) })}
                  className={`${inputCls} !w-auto`}
                >
                  {CEFR_LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={disabled}
                  className={btnGhostCls}
                  aria-label={`${tx.btn_remove}: ${pick(tx, 'lang', l.language)}`}
                  onClick={() => set({ languages: form.languages.filter((_, j) => j !== i) })}
                >
                  {tx.btn_remove}
                </button>
              </li>
            ))}
          </ul>
          {freeLangs.length > 0 && form.languages.length < 6 && (
            <button
              type="button"
              disabled={disabled}
              className={`${btnSmallCls} mt-3`}
              onClick={() => set({ languages: [...form.languages, { language: freeLangs[0], level: 'B2' }] })}
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              {tx.lang_add}
            </button>
          )}
        </FieldGroup>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="f-skills-req" label={tx.f_skills_required} optionalLabel={tx.optional} help={tx.f_skills_help}>
            <ChipInput
              id="f-skills-req"
              values={form.required_skills}
              onChange={(v) => set({ required_skills: v })}
              placeholder={tx.skill_ph}
              addLabel={tx.skill_add}
              removeLabel={tx.btn_remove}
            />
          </Field>
          <Field id="f-skills-opt" label={tx.f_skills_optional} optionalLabel={tx.optional}>
            <ChipInput
              id="f-skills-opt"
              values={form.optional_skills}
              onChange={(v) => set({ optional_skills: v })}
              placeholder={tx.skill_ph}
              addLabel={tx.skill_add}
              removeLabel={tx.btn_remove}
              tone="neutral"
            />
          </Field>
        </div>
      </FormSection>
    </div>
  );
};

export default StepDescription;
