import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PasswordRecoveryForm from '../../components/auth/PasswordRecoveryForm';
import EmailLinkError from '../../components/auth/EmailLinkError';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import SEOHead from '../../components/shared/SEOHead';
import { useTranslations } from '../../hooks/useTranslations';
import {
  readEmailLinkParams,
  readEmailLinkUrlError,
  stripEmailLinkParams,
  verifyEmailLink,
  type EmailLinkErrorKind,
} from '../../utils/emailLinkAuth';
import { consumeInitialAuthHashType } from '../../utils/initialAuthUrl';

// /recovery: formulario para pedir el correo y destino del enlace de recuperación.
//   - Enlace nuevo: /recovery?token_hash=…&type=recovery -> verifyOtp abre la sesión
//     y se muestra el formulario de nueva contraseña (utils/emailLinkAuth.ts).
//   - Enlace antiguo: #access_token=…&type=recovery (supabase-js abre la sesión solo).
const RecoveryPage: React.FC = () => {
  const location = useLocation();
  const t = useTranslations().dashboard.auth.emailLink;
  // Se lee en el primer render, antes de que el efecto limpie la URL.
  const [link] = useState(() => readEmailLinkParams(window.location.search));
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [linkState, setLinkState] = useState<'none' | 'verifying' | EmailLinkErrorKind>(link ? 'verifying' : 'none');

  // Enlace nuevo con token_hash.
  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    stripEmailLinkParams();
    verifyEmailLink(link).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setLinkState(result.error);
      } else {
        setLinkState('none');
        setMode('reset');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [link]);

  // Formato antiguo.
  useEffect(() => {
    if (link) return;
    // Check if this is a password reset link (has access_token in URL)
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));

    if (readEmailLinkUrlError(location.search, location.hash) === 'expired') {
      setLinkState('expired');
    } else if (
      params.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery' ||
      // supabase-js ya ha vaciado el hash al llegar aquí: se usa el guardado al arrancar.
      consumeInitialAuthHashType('/recovery') === 'recovery'
    ) {
      setMode('reset');
    }
  }, [location, link]);

  // "Pedir un nuevo enlace": vuelve al formulario de solicitud.
  const requestNewLink = () => {
    setLinkState('none');
    setMode('request');
  };

  return (
    <>
      <SEOHead
        title={mode === 'reset' ? 'Reset Password - YourCVPassport' : 'Recover Password - YourCVPassport'}
        description={mode === 'reset' ? 'Set your new password' : 'Recover your YourCVPassport account password'}
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {linkState === 'verifying' ? (
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <LoadingSpinner size="large" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
              {t.verifyingLink}
            </h2>
          </div>
        ) : linkState === 'expired' || linkState === 'failed' ? (
          <EmailLinkError kind={linkState} onAction={requestNewLink} actionLabel={t.requestNewRecoveryLink} />
        ) : (
          <PasswordRecoveryForm mode={mode} />
        )}
      </div>
    </>
  );
};

export default RecoveryPage;
