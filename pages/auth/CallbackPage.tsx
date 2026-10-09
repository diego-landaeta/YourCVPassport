import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// /callback: vuelta de OAuth (Google, LinkedIn) y destino del magic link.
//   - Magic link nuevo: /callback?token_hash=…&type=magiclink -> verifyOtp
//     (utils/emailLinkAuth.ts). GoTrue puede mandar type=signup a una cuenta nueva.
//   - OAuth y magic link antiguo: #access_token=… (supabase-js abre la sesión solo).
const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const t = useTranslations().dashboard.auth.emailLink;
  const [error, setError] = useState<string | null>(null);
  // Enlace del correo caducado o usado: tarjeta con "pedir otro" (sin redirigir).
  const [linkError, setLinkError] = useState<EmailLinkErrorKind | null>(null);
  // Se lee en el primer render, antes de que el efecto limpie la URL.
  const [link] = useState(() => readEmailLinkParams(window.location.search));

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    const redirectToLogin = (message: string, delay: number) => {
      if (cancelled) return;
      setError(message);
      redirectTimer = setTimeout(() => navigate('/login'), delay);
    };

    const handleAuthCallback = async () => {
      if (link) {
        stripEmailLinkParams();
        const result = await verifyEmailLink(link);
        if (cancelled) return;
        if (result.error) {
          setLinkError(result.error);
          return;
        }
        if (result.session) navigate('/dashboard');
        else redirectToLogin(t.noSessionRedirect, 2000);
        return;
      }

      // Magic link antiguo caducado o usado (#error_code=otp_expired).
      if (readEmailLinkUrlError(window.location.search, window.location.hash) === 'expired') {
        setLinkError('expired');
        return;
      }

      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          redirectToLogin(t.authFailedRedirect, 3000);
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to dashboard
          navigate('/dashboard');
        } else {
          // No session found
          redirectToLogin(t.noSessionRedirect, 2000);
        }
      } catch (err) {
        redirectToLogin(t.authFailedRedirect, 3000);
      }
    };

    handleAuthCallback();
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [navigate, link, t]);

  return (
    <>
      <SEOHead
        title="Authenticating - YourCVPassport"
        description="Completing authentication"
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center">
        {linkError ? (
          <EmailLinkError kind={linkError} actionTo="/magic-link" actionLabel={t.requestNewAccessLink} />
        ) : (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {error ? (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t.authFailedTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </>
          ) : (
            <>
              <LoadingSpinner size="large" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                {t.signingInTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.signingInDesc}
              </p>
            </>
          )}
        </div>
        )}
      </div>
    </>
  );
};

export default CallbackPage;
