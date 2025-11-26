import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../context/ToastContext';
import OAuthButtons from './OAuthButtons';

const AuthScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail, user } = useAuth();
  const translations = useTranslations();
  const t = translations.dashboard.auth;
  const toast = useToastContext();

  // Detect if we're on /login or /signup and set initial view accordingly
  const [isLoginView, setIsLoginView] = useState(location.pathname === '/login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update view when route changes
  useEffect(() => {
    setIsLoginView(location.pathname === '/login');
  }, [location.pathname]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validatePassword = (pwd: string): boolean => {
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!email) {
      setError(t.errors.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.errors.invalidEmail);
      return;
    }
    if (!password) {
      setError(t.errors.passwordRequired);
      return;
    }

    if (isLoginView) {
      // Login flow
      setIsLoading(true);
      try {
        const { error: authError } = await signInWithEmail(email, password);
        if (authError) {
          if (authError.message?.includes('Invalid login credentials')) {
            setError(t.errors.invalidCredentials);
          } else if (authError.message?.includes('Email not confirmed')) {
            setError('Please confirm your email before logging in');
          } else {
            setError(t.errors.serverError);
          }
          setIsLoading(false);
          return;
        }
        navigate('/dashboard');
      } catch (err) {
        toast.error(t.errors.serverError);
        setError(t.errors.serverError);
        setIsLoading(false);
      }
    } else {
      // Signup flow
      if (!fullName.trim()) {
        setError(t.errors.fullNameRequired);
        return;
      }
      if (password.length < 8) {
        setError(t.errors.passwordTooShort);
        return;
      }
      if (!validatePassword(password)) {
        setError(t.errors.weakPassword);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.errors.passwordsNotMatch);
        return;
      }
      if (!agreeToTerms) {
        setError(t.errors.termsRequired);
        return;
      }

      setIsLoading(true);
      try {
        const { error: authError } = await signUpWithEmail(email, password, {
          full_name: fullName.trim(),
        });

        if (authError) {
          if (authError.message?.includes('already registered')) {
            setError(t.errors.emailAlreadyExists);
          } else if (authError.message?.includes('Password')) {
            setError(t.errors.passwordTooShort); // Fallback to passwordTooShort if weakPassword missing
            // Show the actual error message from the server/edge function
            const errorMsg = authError.message || t.errors.serverError;
            setError(errorMsg);
          }
          setIsLoading(false);
          return;
        }

        setSuccessMessage(t.success.signUpSuccess);
        toast.success(`${t.signup.checkEmail} ${t.signup.checkEmailAction}`, 8000);

        setIsLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        toast.error(t.errors.serverError);
        setError(t.errors.serverError);
        setIsLoading(false);
      }
    }
  };

  const formUI = (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isLoginView ? t.login.title : t.signup.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isLoginView ? t.login.subtitle : t.signup.subtitle}
        </p>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-2.5 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <p className="text-xs text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name (Signup only) */}
        {!isLoginView && (
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.signup.fullName}
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              placeholder="John Doe"
              disabled={isLoading || !!successMessage}
            />
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t.login.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            placeholder="name@example.com"
            disabled={isLoading || !!successMessage}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t.login.password}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isLoginView ? 'current-password' : 'new-password'}
            required
            minLength={isLoginView ? 1 : 8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            placeholder="••••••••"
            disabled={isLoading || !!successMessage}
          />
          {!isLoginView && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {t.signup.passwordRequirements}
            </p>
          )}
        </div>

        {/* Confirm Password (Signup only) */}
        {!isLoginView && (
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.signup.confirmPassword}
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              placeholder="••••••••"
              disabled={isLoading || !!successMessage}
            />
          </div>
        )}

        {/* Remember Me & Forgot Password (Login only) */}
        {isLoginView && (
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 text-cv-blue focus:ring-cv-blue border-gray-300 dark:border-dark-border dark:bg-dark-bg-tertiary rounded cursor-pointer"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {t.login.rememberMe}
              </span>
            </label>
            <Link
              to="/recovery"
              className="text-cv-blue hover:text-cv-blue-dark font-medium hover:underline"
            >
              {t.login.forgotPassword}
            </Link>
          </div>
        )}

        {/* Terms & Conditions (Signup only) */}
        {!isLoginView && (
          <div className="flex items-start gap-2 text-xs">
            <input
              id="agreeToTerms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="h-3.5 w-3.5 mt-0.5 text-cv-blue focus:ring-cv-blue border-gray-300 dark:border-dark-border dark:bg-dark-bg-tertiary rounded cursor-pointer"
              disabled={isLoading || !!successMessage}
            />
            <label htmlFor="agreeToTerms" className="text-gray-600 dark:text-gray-400 cursor-pointer leading-tight">
              {t.signup.agreeToTerms}{' '}
              <Link to="/terms" className="text-cv-blue hover:text-cv-blue-dark font-medium hover:underline">
                {t.signup.termsOfService}
              </Link>
              {' '}{t.signup.and}{' '}
              <Link to="/privacy" className="text-cv-blue hover:text-cv-blue-dark font-medium hover:underline">
                {t.signup.privacyPolicy}
              </Link>
            </label>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !!successMessage}
          className="w-full bg-cv-blue hover:bg-cv-blue-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </div>
          ) : isLoginView ? t.login.loginButton : t.signup.signupButton}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white dark:bg-dark-surface text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-2.5">
        <OAuthButtons />
      </div>

      {/* Toggle Login/Signup */}
      <div className="mt-6 text-center text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {isLoginView ? t.login.noAccount : t.signup.haveAccount}{' '}
        </span>
        <Link
          to={isLoginView ? '/signup' : '/login'}
          onClick={() => {
            setError(null);
            setSuccessMessage(null);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFullName('');
            setAgreeToTerms(false);
          }}
          className="text-cv-blue hover:text-cv-blue-dark font-semibold hover:underline"
        >
          {isLoginView ? t.login.signUpLink : t.signup.loginLink}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-bg">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 bg-white dark:bg-dark-surface rounded-2xl shadow-xl overflow-hidden">

        {/* Left Side - Image/Branding */}
        <div className="relative hidden lg:block overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cv-blue/90 to-indigo-600/90"></div>
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
            style={{
              backgroundImage: isLoginView
                ? "url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop')"
                : "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')",
            }}
          ></div>
          <div className={`absolute inset-0 ${isLoginView ? 'bg-gradient-to-br from-cv-blue/95 to-indigo-700/95' : 'bg-gradient-to-br from-indigo-700/95 to-purple-700/95'} flex flex-col justify-center p-12 text-white transition-all duration-700 ease-in-out`}>
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                {isLoginView ? (
                  <>Welcome<br />Back</>
                ) : (
                  <>Start Your<br />Journey</>
                )}
              </h1>
              <p className={`text-lg ${isLoginView ? 'text-blue-50' : 'text-purple-50'} leading-relaxed mb-8`}>
                {isLoginView
                  ? 'Continue building your professional future with our powerful CV tools and AI assistance.'
                  : 'Join thousands of professionals creating outstanding CVs with our AI-powered platform.'}
              </p>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 ${isLoginView ? 'text-blue-50' : 'text-purple-50'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{isLoginView ? 'Professional CV templates' : 'Free to get started'}</span>
                </div>
                <div className={`flex items-center gap-3 ${isLoginView ? 'text-blue-50' : 'text-purple-50'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{isLoginView ? 'AI-powered suggestions' : 'No credit card required'}</span>
                </div>
                <div className={`flex items-center gap-3 ${isLoginView ? 'text-blue-50' : 'text-purple-50'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{isLoginView ? 'Secure and private' : 'Setup in under 2 minutes'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-6 lg:p-8 flex flex-col justify-center">
          {formUI}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
