import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import type { EmailLinkErrorKind } from '../../utils/emailLinkAuth';

interface EmailLinkErrorProps {
  kind: EmailLinkErrorKind;
  /** Texto de la acción principal (pedir un enlace nuevo). */
  actionLabel: string;
  /** Ruta de la acción principal; si se pasa onAction, se usa un botón. */
  actionTo?: string;
  onAction?: () => void;
}

/**
 * Tarjeta de error de los enlaces del correo (token caducado, usado o inválido)
 * para /confirm, /recovery y /callback. Ver utils/emailLinkAuth.ts.
 */
const EmailLinkError: React.FC<EmailLinkErrorProps> = ({ kind, actionLabel, actionTo, onAction }) => {
  const t = useTranslations().dashboard.auth.emailLink;
  const actionClass = 'inline-block bg-cv-blue hover:bg-cv-blue-dark text-white font-medium py-3 px-6 rounded-lg transition-colors';

  return (
    <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8 max-w-md w-full text-center" data-testid="email-link-error">
      <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {kind === 'expired' ? t.expiredTitle : t.failedTitle}
      </h2>
      <p role="alert" className="text-gray-600 dark:text-gray-400 mb-6">
        {kind === 'expired' ? t.expiredDesc : t.failedDesc}
      </p>
      <div className="flex flex-col items-center gap-4">
        {onAction ? (
          <button type="button" onClick={onAction} className={actionClass}>
            {actionLabel}
          </button>
        ) : (
          <Link to={actionTo || '/login'} className={actionClass}>
            {actionLabel}
          </Link>
        )}
        <Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-cv-blue">
          {t.backToLogin}
        </Link>
      </div>
    </div>
  );
};

export default EmailLinkError;
