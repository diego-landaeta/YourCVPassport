import React from 'react';
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  KNOCKOUT_TYPES,
  MAX_QUESTIONS,
  QUESTION_NUMBER_SUPPORTED,
  QUESTION_TYPES,
  emptyQuestion,
  type FieldErrors,
  type QuestionDraft,
  type QuestionType,
} from '../../../lib/jobPostingModel';
import { fmt } from '../../../lib/bolsaText';
import { msg, pick, type JobText } from '../../../lib/jobPostingText';
import { a11y, btnGhostCls, btnSmallCls, ChoicePill, Field, inputCls } from './fields';

interface Props {
  tx: JobText;
  questions: QuestionDraft[];
  onChange: (next: QuestionDraft[]) => void;
  errors: FieldErrors;
}

type Tpl = {
  id: string;
  type: QuestionType;
  textKey: 'qtpl_experience_text' | 'qtpl_education_text' | 'qtpl_language_text' | 'qtpl_license_text' | 'qtpl_travel_text' | 'qtpl_free_text';
  labelKey: 'qtpl_experience' | 'qtpl_education' | 'qtpl_language' | 'qtpl_license' | 'qtpl_travel' | 'qtpl_free';
};

const TEMPLATES: Tpl[] = [
  { id: 'experience', type: 'NUMBER', textKey: 'qtpl_experience_text', labelKey: 'qtpl_experience' },
  { id: 'education', type: 'YES_NO', textKey: 'qtpl_education_text', labelKey: 'qtpl_education' },
  { id: 'language', type: 'YES_NO', textKey: 'qtpl_language_text', labelKey: 'qtpl_language' },
  { id: 'license', type: 'YES_NO', textKey: 'qtpl_license_text', labelKey: 'qtpl_license' },
  { id: 'travel', type: 'YES_NO', textKey: 'qtpl_travel_text', labelKey: 'qtpl_travel' },
  { id: 'free', type: 'TEXT', textKey: 'qtpl_free_text', labelKey: 'qtpl_free' },
];

function parseNumberExpected(exp: string): { op: '>=' | '<=' | '='; value: string } {
  const m = /^(>=|<=|=)?\s*(.*)$/.exec(exp || '');
  return { op: (m?.[1] as '>=' | '<=' | '=') || '>=', value: m?.[2] || '' };
}

const ErrorLine: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p role="alert" className={`flex items-start gap-1.5 text-sm text-red-700 dark:text-red-400 ${className}`}>
    <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

const checkCls = 'h-4 w-4 rounded accent-cv-blue';

export const QuestionsEditor: React.FC<Props> = ({ tx, questions, onChange, errors }) => {
  const types = QUESTION_TYPES.filter((t) => t !== 'NUMBER' || QUESTION_NUMBER_SUPPORTED);
  const full = questions.length >= MAX_QUESTIONS;

  const patch = (idx: number, p: Partial<QuestionDraft>) => onChange(questions.map((q, i) => (i === idx ? { ...q, ...p } : q)));

  const addFromTemplate = (tplId: string) => {
    if (full) return;
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    const type = tpl.type === 'NUMBER' && !QUESTION_NUMBER_SUPPORTED ? 'TEXT' : tpl.type;
    onChange([...questions, { ...emptyQuestion(type), text: tx[tpl.textKey] }]);
  };

  const changeType = (idx: number, type: QuestionType) => {
    const q = questions[idx];
    patch(idx, {
      type,
      options: type === 'MULTIPLE_CHOICE' ? (q.options.length >= 2 ? q.options : ['', '']) : [],
      knockout: KNOCKOUT_TYPES.includes(type) ? q.knockout : false,
      expected: '',
    });
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-slate-800 dark:text-slate-100">{tx.qtpl_label}:</span>
        {TEMPLATES.map((t) => (
          <button key={t.id} type="button" onClick={() => addFromTemplate(t.id)} disabled={full} className={btnSmallCls}>
            + {tx[t.labelKey]}
          </button>
        ))}
      </div>

      {questions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600 dark:border-dark-border dark:text-dark-text-secondary">{tx.q_none}</p>
      )}

      <ol className="space-y-4">
        {questions.map((q, idx) => {
          const base = `q${idx}`;
          const eText = errors[`questions.${idx}.text`];
          const eOpts = errors[`questions.${idx}.options`];
          const eExp = errors[`questions.${idx}.expected`];
          const canKnockout = KNOCKOUT_TYPES.includes(q.type);
          const num = parseNumberExpected(q.expected);
          const accepted = q.expected ? q.expected.split('|') : [];
          return (
            <li key={q.key} className="rounded-xl bg-slate-50 p-4 sm:p-5 dark:bg-dark-bg-tertiary/60" data-testid="question-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900 dark:text-white">
                  <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold tabular-nums text-slate-700 ring-1 ring-slate-300 dark:bg-dark-bg-secondary dark:text-slate-200 dark:ring-dark-border">
                    {idx + 1}
                  </span>
                  {fmt(tx.q_n, { n: idx + 1 })}
                </h4>
                <button
                  type="button"
                  onClick={() => onChange(questions.filter((_, i) => i !== idx))}
                  className={btnGhostCls}
                  aria-label={`${tx.q_remove} ${idx + 1}`}
                >
                  {tx.btn_remove}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field id={`${base}-text`} label={tx.q_text} required error={eText ? msg(tx, eText) : null} className="md:col-span-2">
                  <input
                    {...a11y(`${base}-text`, { error: eText })}
                    type="text"
                    maxLength={300}
                    value={q.text}
                    onChange={(e) => patch(idx, { text: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field id={`${base}-type`} label={tx.q_type}>
                  <select {...a11y(`${base}-type`, {})} value={q.type} onChange={(e) => changeType(idx, e.target.value as QuestionType)} className={inputCls}>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {pick(tx, 'qtype', t)}
                      </option>
                    ))}
                    {!types.includes(q.type) && <option value={q.type}>{pick(tx, 'qtype', q.type)}</option>}
                  </select>
                </Field>
              </div>

              {q.type === 'MULTIPLE_CHOICE' && (
                <div className="mt-4">
                  <p className="mb-1.5 text-sm font-medium text-slate-800 dark:text-slate-100">{tx.q_options}</p>
                  <ul className="space-y-2">
                    {q.options.map((o, oi) => (
                      <li key={oi} className="flex gap-2">
                        <input
                          type="text"
                          maxLength={100}
                          aria-label={fmt(tx.q_option_ph, { n: oi + 1 })}
                          placeholder={fmt(tx.q_option_ph, { n: oi + 1 })}
                          value={o}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\|/g, '');
                            const next = q.options.map((x, i) => (i === oi ? clean : x));
                            // Si se edita una opción aceptada, se actualiza también la respuesta esperada.
                            const nextAccepted = accepted.map((a) => (a === o ? clean : a)).filter(Boolean);
                            patch(idx, { options: next, expected: nextAccepted.join('|') });
                          }}
                          className={inputCls}
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            className={`${btnGhostCls} shrink-0 !px-2`}
                            aria-label={`${tx.btn_remove}: ${fmt(tx.q_option_ph, { n: oi + 1 })}`}
                            onClick={() =>
                              patch(idx, {
                                options: q.options.filter((_, i) => i !== oi),
                                expected: accepted.filter((a) => a !== o).join('|'),
                              })
                            }
                          >
                            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {q.options.length < 8 && (
                    <button type="button" className={`${btnSmallCls} mt-3`} onClick={() => patch(idx, { options: [...q.options, ''] })}>
                      + {tx.q_option_add}
                    </button>
                  )}
                  {eOpts && <ErrorLine className="mt-2">{msg(tx, eOpts)}</ErrorLine>}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={q.required || q.knockout}
                    disabled={q.knockout}
                    onChange={(e) => patch(idx, { required: e.target.checked })}
                    className={checkCls}
                  />
                  {tx.q_required}
                </label>
                {canKnockout && (
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                    <input
                      type="checkbox"
                      checked={q.knockout}
                      onChange={(e) => patch(idx, { knockout: e.target.checked, required: e.target.checked ? true : q.required })}
                      className={checkCls}
                    />
                    {tx.q_knockout}
                  </label>
                )}
              </div>

              {q.knockout && canKnockout && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-500/10">
                  <p className="mb-3 text-[13px] leading-snug text-amber-900 dark:text-amber-100">{tx.q_knockout_help}</p>
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-white">{tx.q_expected}</p>

                  {q.type === 'YES_NO' && (
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx.q_expected}>
                      {(['YES', 'NO'] as const).map((v) => (
                        <ChoicePill
                          key={v}
                          type="radio"
                          name={`${base}-exp`}
                          checked={q.expected === v}
                          onChange={() => patch(idx, { expected: v })}
                          label={v === 'YES' ? tx.yes : tx.no}
                        />
                      ))}
                    </div>
                  )}

                  {q.type === 'NUMBER' && (
                    <div className="flex max-w-sm gap-2">
                      <select
                        aria-label={tx.q_expected}
                        value={num.op}
                        onChange={(e) => patch(idx, { expected: `${e.target.value}${num.value}` })}
                        className={inputCls}
                      >
                        <option value=">=">{tx.q_expected_number_ge}</option>
                        <option value="<=">{tx.q_expected_number_le}</option>
                        <option value="=">{tx.q_expected_number_eq}</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        inputMode="decimal"
                        aria-label={tx.q_expected}
                        value={num.value}
                        onChange={(e) => patch(idx, { expected: `${num.op}${e.target.value}` })}
                        className={`${inputCls} tabular-nums`}
                      />
                    </div>
                  )}

                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="flex flex-col items-start gap-2">
                      <p className="text-[13px] text-slate-700 dark:text-slate-200">{tx.q_expected_options}</p>
                      {q.options
                        .map((o) => o.trim())
                        .filter(Boolean)
                        .map((o) => (
                          <ChoicePill
                            key={o}
                            type="checkbox"
                            name={`${base}-exp`}
                            checked={accepted.includes(o)}
                            onChange={() => {
                              const next = accepted.includes(o) ? accepted.filter((a) => a !== o) : [...accepted, o];
                              patch(idx, { expected: next.join('|') });
                            }}
                            label={o}
                          />
                        ))}
                    </div>
                  )}

                  {eExp && <ErrorLine className="mt-3">{msg(tx, eExp)}</ErrorLine>}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => onChange([...questions, emptyQuestion('YES_NO')])} disabled={full} className={btnSmallCls}>
          + {tx.q_add}
        </button>
        {full && <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{tx.q_max}</p>}
      </div>
    </div>
  );
};

export default QuestionsEditor;
