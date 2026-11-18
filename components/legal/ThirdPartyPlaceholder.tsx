import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { getConsent, openCookieSettings, setConsent } from '../../lib/consent';

// Hueco del widget de reseñas de Opynio mientras el visitante no ha aceptado el
// contenido de terceros (issue #11, cookies). «Mostrar reseñas» acepta solo esa
// categoría y respeta lo que ya hubiera decidido sobre la analítica.
const ThirdPartyPlaceholder: React.FC = () => {
  const t = useTranslations().cookieConsent;
  const enable = () => setConsent({ analytics: getConsent()?.analytics ?? false, thirdParty: true });

  return (
    <div
      data-testid="reviews-consent-placeholder"
      className="mx-auto max-w-xl rounded-xl border border-dashed border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary p-6 text-center"
    >
      <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.reviewsBlocked}</p>
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
        <button
          type="button"
          onClick={enable}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg bg-cv-blue text-white text-sm font-semibold hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-tertiary"
        >
          {t.reviewsEnable}
        </button>
        <button
          type="button"
          onClick={openCookieSettings}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium text-cv-blue dark:text-cv-blue-light underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue"
        >
          {t.settings}
        </button>
      </div>
    </div>
  );
};

export default ThirdPartyPlaceholder;
