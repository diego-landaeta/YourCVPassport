import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { COVER_LETTER_MODES, MAX_DEADLINE_DAYS, NOTIFY_FREQUENCIES, dateInDays } from '../../../lib/jobPostingModel';
import { msg, pick } from '../../../lib/jobPostingText';
import { a11y, ChoicePill, Field, FieldGroup, FormSection, inputCls } from './fields';
import { QuestionsEditor } from './QuestionsEditor';
import type { StepProps } from './StepBasics';

export const StepScreening: React.FC<StepProps> = ({ tx, form, set, errors, disabled }) => {
  const e = (k: string) => (errors[k] ? msg(tx, errors[k]) : null);
  const qErrors = Object.fromEntries(Object.entries(errors).filter(([k]) => k.startsWith('questions')));

  return (
    <div>
      <section aria-labelledby="f-questions-title">
        <h3 id="f-questions-title" tabIndex={-1} className="text-base font-semibold text-slate-900 focus:outline-none dark:text-white">
          {tx.f_questions}
        </h3>
        <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.f_questions_help}</p>
        {errors.questions && (
          <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-400">
            <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{msg(tx, errors.questions)}</span>
          </p>
        )}
        <div className="mt-5">
          <QuestionsEditor tx={tx} questions={form.questions} onChange={(q) => set({ questions: q })} errors={qErrors} />
        </div>
      </section>

      <FormSection title={tx.grp_apply}>
        <FieldGroup id="f-cover" legend={tx.f_cover_letter} help={tx.no_cv_note}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx.f_cover_letter}>
            {COVER_LETTER_MODES.map((m) => (
              <ChoicePill
                key={m}
                type="radio"
                name="cover_letter_mode"
                checked={form.cover_letter_mode === m}
                disabled={disabled}
                onChange={() => set({ cover_letter_mode: m })}
                label={pick(tx, 'cover', m)}
              />
            ))}
          </div>
        </FieldGroup>
      </FormSection>

      <FormSection title={tx.grp_notify}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="f-notify" label={tx.f_notify_emails} optionalLabel={tx.optional} help={tx.f_notify_emails_help} error={e('notify_emails')}>
            <textarea
              {...a11y('f-notify', { help: true, error: errors.notify_emails })}
              rows={3}
              value={form.notify_emails}
              disabled={disabled}
              onChange={(ev) => set({ notify_emails: ev.target.value })}
              placeholder="rrhh@empresa.com, equipo@empresa.com"
              className={inputCls}
            />
          </Field>

          <FieldGroup id="f-freq" legend={tx.f_notify_freq}>
            <div className="flex flex-col items-start gap-2" role="radiogroup" aria-label={tx.f_notify_freq}>
              {NOTIFY_FREQUENCIES.map((f) => (
                <ChoicePill
                  key={f}
                  type="radio"
                  name="notify_frequency"
                  checked={form.notify_frequency === f}
                  disabled={disabled}
                  onChange={() => set({ notify_frequency: f })}
                  label={pick(tx, 'freq', f)}
                />
              ))}
            </div>
          </FieldGroup>
        </div>

        <Field id="f-deadline" label={tx.f_deadline} required help={tx.f_deadline_help} error={e('application_deadline')} className="max-w-xs">
          <input
            {...a11y('f-deadline', { help: true, error: errors.application_deadline })}
            type="date"
            min={dateInDays(1)}
            max={dateInDays(MAX_DEADLINE_DAYS)}
            value={form.application_deadline}
            disabled={disabled}
            onChange={(ev) => set({ application_deadline: ev.target.value })}
            className={`${inputCls} tabular-nums`}
          />
        </Field>
      </FormSection>
    </div>
  );
};

export default StepScreening;
