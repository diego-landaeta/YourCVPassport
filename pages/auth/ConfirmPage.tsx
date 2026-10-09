import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import SEOHead from '../../components/shared/SEOHead';
import EmailLinkError from '../../components/auth/EmailLinkError';
import { useTranslations } from '../../hooks/useTranslations';
import {
  readEmailLinkParams,
  readEmailLinkUrlError,
  stripEmailLinkParams,
  verifyEmailLink,
  type EmailLinkErrorKind,
} from '../../utils/emailLinkAuth';

// /confirm: destino del correo de alta.
//   - Enlace nuevo: /confirm?token_hash=…&type=signup -> verifyOtp (utils/emailLinkAuth.ts).
//   - Enlace antiguo: #access_token=… (supabase-js abre la sesión solo) -> getSession().
// Con sesión se va al panel a los 2 s; sin sesión, a iniciar sesión.
const ConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const t = useTranslations().dashboard.auth.emailLink;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [hasSession, setHasSession] = useState(false);
  const [errorKind, setErrorKind] = useState<EmailLinkErrorKind>('expired');
  // Se lee en el primer render, antes de que el efecto limpie la URL (StrictMode
  // repite el efecto y en la segunda pasada la URL ya no trae el token).
  const [link] = useState(() => readEmailLinkParams(window.location.search));

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (session: boolean) => {
      if (cancelled) return;
      setHasSession(session);
      setStatus('success');
      // Email confirmed and user is authenticated: dashboard after 2 seconds
      if (session) redirectTimer = setTimeout(() => navigate('/dashboard'), 2000);
    };
    const fail = (kind: EmailLinkErrorKind) => {
      if (cancelled) return;
      setErrorKind(kind);
      setStatus('error');
    };

    const handleEmailConfirmation = async () => {
      if (link) {
        stripEmailLinkParams();
        const result = await verifyEmailLink(link);
        if (result.error) fail(result.error);
        else finish(Boolean(result.session));
        return;
      }

      // Formato antiguo (#access_token o #error=… si el enlace caducó).
      const urlError = readEmailLinkUrlError(window.location.search, window.location.hash);
      if (urlError) {
        fail(urlError);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          fail('expired');
          return;
        }
        finish(Boolean(data.session));
      } catch {
        fail('failed');
      }
    };

    handleEmailConfirmation();
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [navigate, link]);

  return (
    <>
      <SEOHead
        title="Email Confirmation - YourCVPassport"
        description="Confirming your email address"
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center">
        {status === 'error' ? (
          // Token caducado, ya usado o inválido: mensaje claro y enlace para pedir otro.
          <EmailLinkError kind={errorKind} actionTo="/magic-link" actionLabel={t.requestNewAccessLink} />
        ) : (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <LoadingSpinner size="large" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                {t.confirmingTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.confirmingDesc}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t.confirmedTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasSession ? t.confirmedRedirect : t.confirmedLogin}
              </p>
              <Link
                to="/login"
                className="inline-block bg-cv-blue hover:bg-cv-blue-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {t.goToLogin}
              </Link>
            </>
          )}
        </div>
        )}
      </div>
    </>
  );
};

export default ConfirmPage;
