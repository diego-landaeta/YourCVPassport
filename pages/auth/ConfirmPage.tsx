import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import SEOHead from '../../components/SEOHead';

const ConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the session after email confirmation
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          
          setStatus('error');
          setMessage('Email confirmation failed. The link may have expired.');
          return;
        }

        if (data.session) {
          // Email confirmed and user is authenticated
          setStatus('success');
          setMessage('Your email has been confirmed successfully!');

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          // Email might be confirmed, but no active session
          setStatus('success');
          setMessage('Your email has been confirmed! You can now log in.');
        }
      } catch (err) {
        
        setStatus('error');
        setMessage('Something went wrong during confirmation.');
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <>
      <SEOHead
        title="Email Confirmation - YourCVPassport"
        description="Confirming your email address"
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center">
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <LoadingSpinner size="large" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                Confirming Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address...
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
                Email Confirmed!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block bg-cv-blue hover:bg-cv-blue-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Confirmation Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block bg-cv-blue hover:bg-cv-blue-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ConfirmPage;
