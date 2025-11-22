import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import SEOHead from '../../components/SEOHead';

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // No session found
          setError('No session found. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('Callback handling error:', err);
        setError('Something went wrong. Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <>
      <SEOHead
        title="Authenticating - YourCVPassport"
        description="Completing authentication"
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center">
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
                Authentication Error
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </>
          ) : (
            <>
              <LoadingSpinner size="large" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                Completing Sign In
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we authenticate you...
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CallbackPage;
