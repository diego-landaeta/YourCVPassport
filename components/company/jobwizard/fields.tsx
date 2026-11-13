import React, { useState } from 'react';
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/** Anillo de foco común (con desplazamiento en claro y oscuro). */
const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg-primary';

/** Clases comunes de los campos del asistente (tokens del proyecto + modo oscuro). 16 px en móvil: iOS no hace zoom. */
export const inputCls =
  'w-full px-3.5 py-2.5 text-base sm:text-[15px] leading-6 border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-colors focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500 aria-[invalid=true]:focus:border-red-500';

export const btnPrimaryCls = `inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cv-blue text-white font-semibold rounded-lg shadow-sm hover:bg-cv-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${focusRing}`;

export const btnSecondaryCls = `inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-dark-border text-slate-700 dark:text-slate-200 font-medium bg-white dark:bg-dark-bg-secondary rounded-lg hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${focusRing}`;

export const btnSmallCls = `inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium border border-slate-300 dark:border-dark-border text-slate-700 dark:text-slate-200 bg-white dark:bg-dark-bg-secondary rounded-lg hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${focusRing}`;

/** Botón pequeño sin borde (acciones secundarias en filas y bloques). */
export const btnGhostCls = `inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${focusRing}`;

export const cardCls = 'bg-white dark:bg-dark-bg-secondary rounded-xl border border-slate-200 dark:border-dark-border';

/** Cuerpo del formulario por pasos: la única superficie elevada de la pantalla. */
export const surfaceCls =
  'bg-white dark:bg-dark-bg-secondary rounded-2xl border border-slate-200 dark:border-dark-border shadow-[0_1px_2px_rgba(15,23,42,.05),0_12px_32px_-20px_rgba(15,23,42,.2)] dark:shadow-none';

/** Atributos de accesibilidad de un control con ayuda y/o error. */
export function a11y(id: string, opts: { help?: boolean; error?: string | null }) {
  const ids = [opts.help ? `${id}-help` : '', opts.error ? `${id}-err` : ''].filter(Boolean).join(' ');
  return {
    id,
    'aria-describedby': ids || undefined,
    'aria-invalid': opts.error ? (true as const) : undefined,
  };
}

const labelCls = 'block text-sm font-medium text-slate-800 dark:text-slate-100 mb-1.5';
const helpCls = 'mt-1.5 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary';

/** Mensaje de error de un campo: icono + texto (nunca solo color). */
const FieldError: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-400">
    <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

/** Título de un grupo de campos dentro de un paso (sin cajas: espacio y un filete). */
export const FormSection: React.FC<{ title: string; help?: string; first?: boolean; children: React.ReactNode }> = ({ title, help, first, children }) => (
  <section className={first ? '' : 'mt-10 border-t border-slate-200 dark:border-dark-border pt-8'}>
    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
    {help ? <p className="mt-1 text-sm text-slate-600 dark:text-dark-text-secondary">{help}</p> : null}
    <div className="mt-5 space-y-6">{children}</div>
  </section>
);

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  help?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

/** Etiqueta + control + ayuda + error. El control debe usar `a11y(id, ...)`. */
export const Field: React.FC<FieldProps> = ({ id, label, required, optionalLabel, help, error, children, className }) => (
  <div className={className}>
    <label htmlFor={id} className={labelCls}>
      {label}
      {required ? <span className="text-red-600 dark:text-red-400" aria-hidden="true"> *</span> : null}
      {!required && optionalLabel ? <span className="ml-1.5 font-normal text-slate-500 dark:text-dark-text-secondary">({optionalLabel})</span> : null}
    </label>
    {children}
    {help ? (
      <p id={`${id}-help`} className={helpCls}>
        {help}
      </p>
    ) : null}
    {error ? <FieldError id={`${id}-err`}>{error}</FieldError> : null}
  </div>
);

/** Grupo de controles (radio/casillas) con leyenda. */
export const FieldGroup: React.FC<{
  legend: string;
  required?: boolean;
  help?: React.ReactNode;
  error?: string | null;
  id: string;
  children: React.ReactNode;
}> = ({ legend, required, help, error, id, children }) => (
  <fieldset id={id} aria-describedby={[help ? `${id}-help` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined}>
    <legend className={labelCls}>
      {legend}
      {required ? <span className="text-red-600 dark:text-red-400" aria-hidden="true"> *</span> : null}
    </legend>
    {children}
    {help ? (
      <p id={`${id}-help`} className={helpCls}>
        {help}
      </p>
    ) : null}
    {error ? <FieldError id={`${id}-err`}>{error}</FieldError> : null}
  </fieldset>
);

/** Opción tipo «píldora» para radios y casillas (el control nativo se mantiene visible). */
export const ChoicePill: React.FC<{
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}> = ({ type, name, checked, onChange, label, disabled }) => (
  <label
    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm cursor-pointer select-none transition-colors focus-within:ring-2 focus-within:ring-cv-blue focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-dark-bg-secondary ${
      checked
        ? 'border-cv-blue bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-blue-100 font-medium'
        : 'border-slate-300 dark:border-dark-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
  >
    <input type={type} name={name} checked={checked} onChange={onChange} disabled={disabled} className="h-4 w-4 accent-cv-blue focus:outline-none" />
    <span>{label}</span>
  </label>
);

interface ChipInputProps {
  id: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  suggestions?: string[];
  max?: number;
  maxLength?: number;
  /** Tono del chip: «brand» (azul suave, por defecto) o «neutral». */
  tone?: 'brand' | 'neutral';
}

const CHIP_TONE = {
  brand: 'bg-blue-50 text-blue-900 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:ring-blue-400/25',
  neutral: 'bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/20 dark:text-slate-100 dark:ring-slate-400/20',
} as const;

/** Etiquetas (habilidades, beneficios): Intro o coma añaden; sin duplicados. */
export const ChipInput: React.FC<ChipInputProps> = ({
  id,
  values,
  onChange,
  placeholder,
  addLabel,
  removeLabel,
  suggestions,
  max = 30,
  maxLength = 80,
  tone = 'brand',
}) => {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const v = raw.trim().slice(0, maxLength);
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft('');
      return;
    }
    if (values.length >= max) return;
    onChange([...values, v]);
    setDraft('');
  };

  const free = (suggestions || []).filter((s) => !values.some((x) => x.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(draft);
            }
          }}
          className={inputCls}
        />
        <button type="button" onClick={() => add(draft)} disabled={!draft.trim()} className={`${btnSmallCls} shrink-0`}>
          {addLabel}
        </button>
      </div>
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={placeholder}>
          {values.map((v) => (
            <li key={v} className={`inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-sm ${CHIP_TONE[tone]}`}>
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`${removeLabel}: ${v}`}
                className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {free.length > 0 && values.length < max && (
        <div className="mt-3 flex flex-wrap gap-2">
          {free.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="px-3 py-1 text-[13px] rounded-full border border-dashed border-slate-300 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-cv-blue hover:text-cv-blue dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
