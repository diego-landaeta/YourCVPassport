import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../context/ToastContext';

interface PasswordRecoveryFormProps {
  mode?: 'request' | 'reset';
}

const PasswordRecoveryForm: React.FC<PasswordRecoveryFormProps> = ({ mode = 'request' }) => {
  const navigate = useNavigate();
  const { resetPassword, updatePassword } = useAuth();
  const translations = useTranslations();
  const t = translations.dashboard.auth.recovery;
  const errors = translations.dashboard.auth.errors;
  const success = translations.dashboard.auth.success;
  const toast = useToastContext();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const validatePassword = (pwd: string): boolean => {
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
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
      const { error: authError } = await resetPassword(email);

      if (authError) {
        if (authError.message?.includes('rate limit')) {
          setError(errors.tooManyRequests);
          toast.error(errors.tooManyRequests, 5000);
        } else {
          setError(errors.serverError);
          toast.error(errors.serverError, 5000);
        }
        setIsLoading(false);
        return;
      }

      // Success
      setEmailSent(true);
      setIsLoading(false);
    } catch (err) {
      setError(errors.serverError);
      toast.error(errors.serverError, 5000);
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newPassword) {
      setError(errors.passwordRequired);
      return;
    }
    if (newPassword.length < 8) {
      setError(errors.passwordTooShort);
      return;
    }
    if (!validatePassword(newPassword)) {
      setError(errors.weakPassword);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(errors.passwordsNotMatch);
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await updatePassword(newPassword);

      if (authError) {
        setError(errors.serverError);
        toast.error(errors.serverError, 5000);
        setIsLoading(false);
        return;
      }

      // Success
      setPasswordReset(true);
      toast.success(success.passwordUpdated, 5000);
      setIsLoading(false);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(errors.serverError);
      toast.error(errors.serverError, 5000);
      setIsLoading(false);
    }
  };

  // Request Recovery Mode - Email Sent Success
  if (mode === 'request' && emailSent) {
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

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.checkEmail}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t.checkEmailDesc} <span className="font-medium text-gray-900 dark:text-white">{email}</span>
          </p>

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

  // Reset Mode - Password Reset Success
  if (mode === 'reset' && passwordReset) {
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {success.passwordUpdated}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {success.passwordUpdated}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Request Recovery Mode - Email Form
  if (mode === 'request') {
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
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

          {/* Recovery Request Form */}
          <form onSubmit={handleRequestReset} className="space-y-6">
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
              {isLoading ? t.sending : t.sendButton}
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
  }

  // Reset Mode - New Password Form
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.newPasswordTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your new password
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Password Reset Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.newPassword}
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg dark:text-white"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.confirmPassword}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg dark:text-white"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cv-blue hover:bg-cv-blue-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t.resetting : t.resetButton}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordRecoveryForm;
