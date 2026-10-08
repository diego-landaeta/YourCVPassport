import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../contexts/ToastContext';
import OAuthButtons from './OAuthButtons';

const AuthScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail, resendConfirmationEmail, user } = useAuth();
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
  // Issue #3: cuenta creada pero pendiente (correo no enviado o alta repetida).
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  // Email al que se ofrece "Reenviar correo de confirmación" (null: no se ofrece).
  const [resendEmail, setResendEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const formLocked = isLoading || !!successMessage || !!pendingNotice;

  // Update view when route changes
  useEffect(() => {
    setIsLoginView(location.pathname === '/login');
    setPendingNotice(null);
    setResendEmail(null);
    setResendFeedback(null);
  }, [location.pathname]);

  // Cuenta atrás entre reenvíos (el servidor limita a 3 cada 15 min por email).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

  // Traduce el `code` de la Edge Function `signup` (ver utils/authFunctionErrors.ts).
  const signupErrorMessage = (err: { code?: string } | null | undefined): string => {
    switch (err?.code) {
      case 'EMAIL_ALREADY_REGISTERED': return t.errors.emailAlreadyExists;
      case 'WEAK_PASSWORD': return t.errors.weakPassword;
      case 'INVALID_INPUT': return t.errors.invalidInput;
      case 'EMAIL_SEND_FAILED': return t.errors.signupEmailSendFailed;
      case 'RATE_LIMITED': return t.errors.tooManyRequests;
      case 'TIMEOUT': return t.errors.signupTimeout;
      case 'NETWORK_ERROR': return t.errors.networkError;
      default: return t.errors.serverError;
    }
  };

  // "Reenviar correo de confirmación": la función responde lo mismo exista o no
  // una cuenta pendiente, así que el texto de éxito es neutro.
  const handleResend = async () => {
    if (!resendEmail || isResending || resendCooldown > 0) return;
    setIsResending(true);
    setResendFeedback(null);
    const { error: resendError } = await resendConfirmationEmail(resendEmail);
    setIsResending(false);
    if (!resendError) {
      setResendFeedback({ ok: true, text: t.signup.resendSent });
      setResendCooldown(60);
      return;
    }
    const code = resendError?.code;
    const text = code === 'RATE_LIMITED' ? t.errors.tooManyRequests
      : code === 'NETWORK_ERROR' ? t.errors.networkError
      : t.signup.resendFailed;
    setResendFeedback({ ok: false, text });
    if (code === 'RATE_LIMITED') setResendCooldown(60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setPendingNotice(null);
    setResendEmail(null);
    setResendFeedback(null);

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
            setError(t.errors.emailNotConfirmed);
            setResendEmail(email.trim().toLowerCase());
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
        const { data: signUpData, error: authError } = await signUpWithEmail(email, password, {
          full_name: fullName.trim(),
        });

        if (authError) {
          // Todo error del alta se muestra (formulario + toast); antes casi todos se tragaban.
          const msg = signupErrorMessage(authError);
          setError(msg);
          toast.error(msg, 8000);
          setIsLoading(false);
          return;
        }

        // Cuenta pendiente sin correo, o alta repetida de una cuenta sin
        // confirmar: sin redirección, con aviso y botón "Reenviar".
        if (signUpData?.emailSent === false || signUpData?.alreadyPending) {
          const notice = !signUpData.alreadyPending ? t.signup.accountCreatedEmailNotSent
            : signUpData.emailSent ? t.signup.alreadyPendingResent
            : t.signup.alreadyPendingNotSent;
          setPendingNotice(notice);
          setResendEmail(email.trim().toLowerCase());
          // Si el correo acaba de salir, no se ofrece reenviar enseguida.
          if (signUpData.emailSent) setResendCooldown(60);
          if (signUpData.emailSent) toast.success(notice, 8000);
          else toast.warning(notice, 8000);
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
        <div role="alert" className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-2.5 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <p className="text-xs text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}
      {pendingNotice && (
        <div role="status" className="mb-4 p-2.5 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded">
          <p className="text-xs text-amber-800 dark:text-amber-300">{pendingNotice}</p>
        </div>
      )}
      {resendEmail && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="w-full px-3 py-2 text-sm font-medium border border-cv-blue text-cv-blue dark:text-blue-300 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? t.signup.resendSending : t.signup.resendButton}
          </button>
          <div aria-live="polite">
            {resendFeedback && (
              <p className={`mt-2 text-xs ${resendFeedback.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {resendFeedback.text}
              </p>
            )}
          </div>
          {resendCooldown > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t.signup.resendCooldown.replace('{seconds}', String(resendCooldown))}
            </p>
          )}
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
              disabled={formLocked}
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
            disabled={formLocked}
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
            disabled={formLocked}
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
              disabled={formLocked}
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
              disabled={formLocked}
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
          disabled={formLocked}
          className="w-full bg-cv-blue hover:bg-cv-blue-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{isLoginView ? t.login.loggingIn : t.signup.creatingAccount}</span>
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
            {isLoginView ? t.login.orContinue : t.signup.orContinue}
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
                {isLoginView ? t.login.welcomeTitle : t.signup.welcomeTitle}
              </h1>
              <p className={`text-lg ${isLoginView ? 'text-blue-50' : 'text-purple-50'} leading-relaxed mb-8`}>
                {isLoginView ? t.login.welcomeSubtitle : t.signup.welcomeSubtitle}
              </p>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 ${isLoginView ? 'text-blue-50' : 'text-purple-50'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{isLoginView ? t.login.feature1 : t.signup.feature1}</span>
                </div>
                <div className={`flex items-center gap-3 ${isLoginView ? 'text-blue-50' : 'text-purple-50'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{isLoginView ? t.login.feature2 : t.signup.feature2}</span>
                </div>
                <div className={`flex items-center gap-3 ${isLoginView ? 'text-blue-50' : 'text-purple-50'}`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{isLoginView ? t.login.feature3 : t.signup.feature3}</span>
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
