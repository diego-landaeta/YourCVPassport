import React from 'react';
import { CONTRACT_TYPES, SALARY_MODES, SALARY_PERIODS, SCHEDULES, dateInDays, type ContractType, type SalaryMode } from '../../../lib/jobPostingModel';
import { fmt } from '../../../lib/bolsaText';
import { msg, pick } from '../../../lib/jobPostingText';
import { a11y, ChipInput, ChoicePill, Field, FieldGroup, FormSection, inputCls } from './fields';
import type { StepProps } from './StepBasics';

interface Props extends StepProps {
  /** Moneda local del país elegido (countries.currency). null si aún no hay país. */
  currency: string | null;
  countryName: string;
}

export const StepConditions: React.FC<Props> = ({ tx, form, set, errors, disabled, currency, countryName }) => {
  const e = (k: string) => (errors[k] ? msg(tx, errors[k]) : null);
  const showDuration = form.contract_types.some((c) => c !== 'INDEFINITE');
  const mode = form.salary_mode;
  const showMin = mode === 'RANGE' || mode === 'FROM' || mode === 'EXACT';
  const showMax = mode === 'RANGE' || mode === 'UP_TO';
  const suggestions = tx.benefits_suggestions.split('|').filter(Boolean);

  const toggleContract = (c: ContractType) => {
    const has = form.contract_types.includes(c);
    set({ contract_types: has ? form.contract_types.filter((x) => x !== c) : [...form.contract_types, c] });
  };

  return (
    <div>
      <FormSection first title={tx.grp_contract}>
        <FieldGroup id="f-contract" legend={tx.f_contract} required help={tx.f_contract_help} error={e('contract_types')}>
          <div className="flex flex-wrap gap-2">
            {CONTRACT_TYPES.map((c) => (
              <ChoicePill
                key={c}
                type="checkbox"
                name="contract_types"
                checked={form.contract_types.includes(c)}
                disabled={disabled}
                onChange={() => toggleContract(c)}
                label={pick(tx, 'contract', c)}
              />
            ))}
          </div>
        </FieldGroup>

        <FieldGroup id="f-schedule" legend={tx.f_schedule} required error={e('schedule')}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx.f_schedule}>
            {SCHEDULES.map((s) => (
              <ChoicePill
                key={s}
                type="radio"
                name="schedule"
                checked={form.schedule === s}
                disabled={disabled}
                onChange={() => set({ schedule: s })}
                label={pick(tx, 'schedule', s)}
              />
            ))}
          </div>
        </FieldGroup>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {showDuration && (
            <Field id="f-duration" label={tx.f_duration} optionalLabel={tx.optional} help={tx.f_duration_help}>
              <input
                {...a11y('f-duration', { help: true })}
                type="text"
                maxLength={60}
                value={form.duration}
                disabled={disabled}
                onChange={(ev) => set({ duration: ev.target.value })}
                placeholder={tx.f_duration_ph}
                className={inputCls}
              />
            </Field>
          )}

          <FieldGroup id="f-start" legend={tx.f_start}>
            <label className="mb-3 inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
              <input
                type="checkbox"
                checked={form.start_immediate}
                disabled={disabled}
                onChange={(ev) => set({ start_immediate: ev.target.checked })}
                className="h-4 w-4 rounded accent-cv-blue"
              />
              {tx.start_immediate}
            </label>
            {!form.start_immediate && (
              <Field id="f-start-date" label={tx.start_date_label} required error={e('start_date')}>
                <input
                  {...a11y('f-start-date', { error: errors.start_date })}
                  type="date"
                  min={dateInDays(0)}
                  value={form.start_date}
                  disabled={disabled}
                  onChange={(ev) => set({ start_date: ev.target.value })}
                  className={inputCls}
                />
              </Field>
            )}
          </FieldGroup>
        </div>
      </FormSection>

      <FormSection title={tx.f_salary}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field id="f-salary-mode" label={tx.f_salary_mode} error={e('salary_mode')}>
            <select
              {...a11y('f-salary-mode', { error: errors.salary_mode })}
              value={mode}
              disabled={disabled}
              onChange={(ev) => set({ salary_mode: ev.target.value as SalaryMode | '' })}
              className={inputCls}
            >
              <option value="">{tx.salmode_none}</option>
              {SALARY_MODES.map((m) => (
                <option key={m} value={m}>
                  {pick(tx, 'salmode', m)}
                </option>
              ))}
            </select>
          </Field>

          {mode && (
            <Field id="f-salary-period" label={tx.f_salary_period}>
              <select
                {...a11y('f-salary-period', {})}
                value={form.salary_period}
                disabled={disabled}
                onChange={(ev) => set({ salary_period: ev.target.value as typeof form.salary_period })}
                className={inputCls}
              >
                {SALARY_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {pick(tx, 'period', p)}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {mode && (
            <Field id="f-currency" label={tx.f_currency} help={currency ? fmt(tx.f_currency_help, { country: countryName }) : tx.f_currency_none}>
              <input
                {...a11y('f-currency', { help: true })}
                type="text"
                readOnly
                value={currency || ''}
                placeholder="—"
                className={`${inputCls} cursor-not-allowed bg-slate-50 dark:bg-dark-bg-primary`}
              />
            </Field>
          )}
        </div>

        {mode && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {showMin && (
              <Field id="f-salary-min" label={mode === 'EXACT' ? tx.f_salary_exact : tx.f_salary_from} required error={e('salary_min')}>
                <input
                  {...a11y('f-salary-min', { error: errors.salary_min })}
                  type="number"
                  min={0}
                  max={10000000}
                  inputMode="numeric"
                  value={form.salary_min}
                  disabled={disabled}
                  onChange={(ev) => set({ salary_min: ev.target.value })}
                  className={`${inputCls} tabular-nums`}
                />
              </Field>
            )}
            {showMax && (
              <Field id="f-salary-max" label={tx.f_salary_to} required error={e('salary_max')}>
                <input
                  {...a11y('f-salary-max', { error: errors.salary_max })}
                  type="number"
                  min={0}
                  max={10000000}
                  inputMode="numeric"
                  value={form.salary_max}
                  disabled={disabled}
                  onChange={(ev) => set({ salary_max: ev.target.value })}
                  className={`${inputCls} tabular-nums`}
                />
              </Field>
            )}
          </div>
        )}

        <FieldGroup id="f-show-salary" legend={tx.f_show_salary} required help={tx.show_help} error={e('show_salary')}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx.f_show_salary}>
            <ChoicePill type="radio" name="show_salary" checked={form.show_salary === true} disabled={disabled} onChange={() => set({ show_salary: true })} label={tx.show_yes} />
            <ChoicePill type="radio" name="show_salary" checked={form.show_salary === false} disabled={disabled} onChange={() => set({ show_salary: false })} label={tx.show_no} />
          </div>
        </FieldGroup>
      </FormSection>

      <FormSection title={tx.f_benefits}>
        <div>
          <label htmlFor="f-benefits" className="sr-only">
            {tx.f_benefits} ({tx.optional})
          </label>
          <ChipInput
            id="f-benefits"
            values={form.benefits}
            onChange={(v) => set({ benefits: v })}
            placeholder={tx.benefit_ph}
            addLabel={tx.benefit_add}
            removeLabel={tx.btn_remove}
            suggestions={suggestions}
            max={20}
          />
          <p className="mt-3 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">{tx.f_benefits_help}</p>
        </div>
      </FormSection>
    </div>
  );
};

export default StepConditions;
