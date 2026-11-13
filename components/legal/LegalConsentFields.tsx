import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, ChevronDownIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import {
  CANDIDATE_OPTIONAL,
  EMPLOYER_OPTIONAL,
  GUARDIAN_KEY,
  consentFieldId,
  legalPagePath,
  type Casillas,
} from '../../lib/legal';
import { casillaLabel, useLegalText } from './legalText';

interface LegalConsentFieldsProps {
  kind: 'candidato' | 'empleador';
  values: Casillas;
  onChange: (key: string, value: boolean) => void;
  disabled?: boolean;
  /** Candidato de 16 o 17 años: se añade la casilla de autorización de tutores. */
  showGuardian?: boolean;
  /** Casilla con error de validación (aria-invalid + descripción del error). */
  invalidKey?: string | null;
  errorId?: string;
  /** Texto del error de validación: se pinta bajo las casillas obligatorias, con id `errorId`. */
  errorMessage?: string | null;
}

const linkClass =
  'font-medium text-cv-blue underline underline-offset-2 hover:text-cv-blue-dark hover:no-underline dark:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue rounded-sm';
const boxClass =
  'mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-cv-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed dark:border-dark-border dark:focus-visible:ring-offset-dark-surface';

/**
 * Casillas legales del registro: una por línea, SIN marcar por defecto, con
 * enlace al texto completo. Las opcionales van aparte y nunca impiden registrarse.
 * La aceptación se REGISTRA con registrar_aceptacion (lib/legal.ts), no aquí.
 *
 * Jerarquía (escala del proyecto): las obligatorias van en un bloque ámbar mientras
 * falta alguna y verde cuando están todas; las opcionales, en gris y más discretas.
 */
const LegalConsentFields: React.FC<LegalConsentFieldsProps> = ({
  kind,
  values,
  onChange,
  disabled,
  showGuardian,
  invalidKey,
  errorId,
  errorMessage,
}) => {
  const tx = useLegalText();
  const { lang } = useLanguage();

  const row = (key: string, content: React.ReactNode, plainLabel: string, strong: boolean) => {
    const id = consentFieldId(key);
    return (
      <div key={key} className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={!!values[key]}
          onChange={(e) => onChange(key, e.target.checked)}
          disabled={disabled}
          // Nombre accesible completo: algunos lectores omiten el texto de los
          // enlaces dentro del <label>.
          aria-label={plainLabel}
          {...(invalidKey === key && errorId ? { 'aria-invalid': true as const, 'aria-describedby': errorId } : {})}
          className={boxClass}
        />
        <label
          htmlFor={id}
          className={`text-sm leading-snug ${strong ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-dark-text-secondary'}`}
        >
          {content}
        </label>
      </div>
    );
  };

  const newTab = { target: '_blank', rel: 'noopener noreferrer' } as const;
  const termsHref = legalPagePath('terms', lang, kind === 'candidato' ? '' : '?tipo=empleador');
  const privacyHref = legalPagePath('privacy', lang);
  const annexHref = legalPagePath('terms', lang, '?tipo=empleador', '#anexo');

  const required: React.ReactNode[] = [];
  const requiredKeys: string[] = [];
  const optionalKeys: readonly string[] = kind === 'candidato' ? CANDIDATE_OPTIONAL : EMPLOYER_OPTIONAL;

  if (kind === 'candidato') {
    requiredKeys.push('acepto_condiciones_privacidad', 'datos_verdaderos');
    required.push(
      row(
        'acepto_condiciones_privacidad',
        <>
          {tx.acceptLead}
          <Link to={termsHref} {...newTab} className={linkClass}>{tx.termsLinkCandidate}</Link>
          {tx.acceptAnd}
          <Link to={privacyHref} {...newTab} className={linkClass}>{tx.privacyLink}</Link>
          <span className="sr-only"> {tx.readInNewTab}</span>
        </>,
        casillaLabel(tx, 'acepto_condiciones_privacidad'),
        true,
      ),
      row('datos_verdaderos', tx.truthful, casillaLabel(tx, 'datos_verdaderos'), true),
    );
    if (showGuardian) {
      requiredKeys.push(GUARDIAN_KEY);
      required.push(row(GUARDIAN_KEY, tx.guardianCheck, casillaLabel(tx, GUARDIAN_KEY), true));
    }
  } else {
    requiredKeys.push('poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento');
    required.push(
      row(
        'poder_representacion',
        <>
          {tx.employerPowerLead}
          <Link to={termsHref} {...newTab} className={linkClass}>{tx.termsLinkEmployer}</Link>
          {tx.acceptAnd}
          <Link to={privacyHref} {...newTab} className={linkClass}>{tx.privacyLink}</Link>
          <span className="sr-only"> {tx.readInNewTab}</span>
        </>,
        casillaLabel(tx, 'poder_representacion'),
        true,
      ),
      row('ofertas_reales_no_discriminatorias', tx.employerOffers, casillaLabel(tx, 'ofertas_reales_no_discriminatorias'), true),
      row(
        'anexo_encargo_tratamiento',
        <>
          {tx.employerAnnexLead}
          <Link to={annexHref} {...newTab} className={linkClass}>{tx.employerAnnexLink}</Link>
          <span className="sr-only"> {tx.readInNewTab}</span>
        </>,
        casillaLabel(tx, 'anexo_encargo_tratamiento'),
        true,
      ),
    );
  }

  const done = requiredKeys.filter((k) => values[k]).length;
  const complete = done === requiredKeys.length;
  const hasError = !!errorMessage;

  const reqTone = hasError
    ? 'border-red-300 bg-red-50/60 dark:border-red-400/40 dark:bg-red-500/10'
    : complete
      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-500/10'
      : 'border-amber-300 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-500/10';
  const statusTone = complete ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-900 dark:text-amber-200';

  return (
    <div className="space-y-3">
      <fieldset className={`min-w-0 rounded-xl border px-4 pb-4 pt-3.5 transition-colors ${reqTone}`}>
        <legend className="float-left mb-3 w-full p-0">
          <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{tx.requiredGroup}</span>
            <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium tabular-nums ${statusTone}`}>
              {complete ? (
                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
              )}
              {fmt(tx.gateProgress, { n: done, total: requiredKeys.length })}
            </span>
          </span>
          <span className="mt-0.5 block text-[13px] font-normal text-slate-600 dark:text-dark-text-secondary">{tx.requiredHint}</span>
        </legend>
        <div className="clear-both space-y-3.5">{required}</div>
        {errorMessage && (
          <p id={errorId} role="alert" className="mt-3 flex items-start gap-1.5 text-sm font-medium text-red-700 dark:text-red-400">
            <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        )}
      </fieldset>

      <details className="group rounded-lg border border-slate-200 dark:border-dark-border" data-testid="signup-optional">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-slate-200 dark:hover:bg-white/5">
          <span>{tx.optionalGroup} <span className="font-normal text-slate-500 dark:text-dark-text-secondary">({optionalKeys.length})</span></span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <div className="border-t border-slate-200 px-3 pb-3 pt-3 dark:border-dark-border">
          <p className="mb-3 text-[13px] text-slate-600 dark:text-dark-text-secondary">{tx.optionalHint}</p>
          <div className="space-y-3">
            {optionalKeys.map((key) => row(key, casillaLabel(tx, key), casillaLabel(tx, key), false))}
          </div>
        </div>
      </details>
    </div>
  );
};

export default LegalConsentFields;
