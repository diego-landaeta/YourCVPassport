import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../context/ToastContext';

const MagicLinkForm: React.FC = () => {
  const { sendMagicLink } = useAuth();
  const translations = useTranslations();
  const t = translations.dashboard.auth.magicLink;
  const errors = translations.dashboard.auth.errors;
  const success = translations.dashboard.auth.success;
  const toast = useToastContext();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email) {
      setError(errors.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(errors.invalidEmail);
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await sendMagicLink(email);

      if (authError) {
        if (authError.message?.includes('rate limit')) {
          setError(errors.tooManyRequests);
          toast.warning(errors.tooManyRequests);
        } else {
          setError(errors.serverError);
          toast.error(errors.serverError);
        }
        setIsLoading(false);
        return;
      }

      // Success
      setEmailSent(true);
      toast.success(t.checkEmail);
      setIsLoading(false);
    } catch (err) {
      setError(errors.serverError);
      toast.error(errors.serverError);
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
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
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.checkEmail}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {t.checkEmailDesc} <span className="font-medium text-gray-900 dark:text-white">{email}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t.checkEmailAction}
          </p>

          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-block text-cv-blue hover:text-cv-blue-dark font-medium"
          >
            {t.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-cv-blue/10 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-cv-blue"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Magic Link Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.email}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg dark:text-white"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cv-blue hover:bg-cv-blue-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t.sending : t.submit}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-cv-blue"
          >
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkForm;
