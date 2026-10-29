import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import OAuthButtons from './OAuthButtons';
import LegalConsentFields from '../legal/LegalConsentFields';
import { useLegalText } from '../legal/legalText';
import {
  CANDIDATE_OPTIONAL,
  CANDIDATE_REQUIRED,
  GUARDIAN_KEY,
  ageStatus,
  clearUnderageNotice,
  emptyCasillas,
  hasUnderageNotice,
  type Casillas,
} from '../../lib/legal';
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

type FieldId =
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'birthDate'
  | 'agreeToTerms'
  | 'consent-datos_verdaderos'
  | 'consent-autorizacion_tutores';

type SignupType = 'candidato' | 'empresa';

// ?tipo=empresa|candidato preselecciona el camino (enlaces desde la home, /company/register...).
const typeFromSearch = (search: string): SignupType | null => {
  const v = new URLSearchParams(search).get('tipo');
  return v === 'empresa' || v === 'candidato' ? v : null;
};

// Hoy en calendario local (AAAA-MM-DD), para el max del <input type="date">.
const todayLocalISO = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail, resendConfirmationEmail, user } = useAuth();
  const translations = useTranslations();
  const t = translations.dashboard.auth;
  const toast = useToastContext();
  const { lang } = useLanguage();
  const tx = useLegalText();

  // Detect if we're on /login or /signup and set initial view accordingly
  const [isLoginView, setIsLoginView] = useState(location.pathname === '/login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // Bolsa de empleo, fase 1 (#6): primer paso «¿buscas empleo o contratas?», fecha de
  // nacimiento y casillas legales (todas SIN marcar). La aceptación se registra en
  // el primer acceso con sesión (components/legal/LegalGate.tsx).
  const [signupType, setSignupType] = useState<SignupType | null>(() => typeFromSearch(location.search));
  const [birthDate, setBirthDate] = useState('');
  const [consents, setConsents] = useState<Casillas>(() =>
    emptyCasillas([...CANDIDATE_REQUIRED, ...CANDIDATE_OPTIONAL, GUARDIAN_KEY]),
  );
  const ageSt = ageStatus(birthDate);
  const [isLoading, setIsLoading] = useState(false);
  // Si la puerta de edad cerró la sesión de un menor de 16 años, /login lo explica (una sola vez).
  const [error, setError] = useState<string | null>(() => (hasUnderageNotice() ? tx.underageLoginNotice : null));
  useEffect(() => { clearUnderageNotice(); }, []);
  // Campo al que se refiere el error de validación (aria-invalid + foco).
  const [errorField, setErrorField] = useState<FieldId | null>(null);
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
    setSignupType(typeFromSearch(location.search));
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
      // Quien se registró como empresa continúa en el área de empresa (si aún no
      // tiene una, CompanyProtectedRoute lo lleva a /company/register).
      navigate(user.user_metadata?.tipo === 'empresa' ? '/company/dashboard' : '/dashboard');
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

  // Validación propia, en el orden visual del formulario. El formulario lleva
  // noValidate: la validación nativa del navegador (required / type=email)
  // bloqueaba el envío sin mostrar nuestro mensaje traducido y además se saltaba
  // «Nombre completo», que no tenía required (issue #4, puntos 8 y 9).
  const validateForm = (): { field: FieldId; message: string } | null => {
    if (!isLoginView && !fullName.trim()) return { field: 'fullName', message: t.errors.fullNameRequired };
    if (!email.trim()) return { field: 'email', message: t.errors.emailRequired };
    if (!EMAIL_RE.test(email.trim())) return { field: 'email', message: t.errors.invalidEmail };
    if (!password) return { field: 'password', message: t.errors.passwordRequired };
    if (isLoginView) return null;
    if (password.length < 8) return { field: 'password', message: t.errors.passwordTooShort };
    if (!validatePassword(password)) return { field: 'password', message: t.errors.weakPassword };
    if (password !== confirmPassword) return { field: 'confirmPassword', message: t.errors.passwordsNotMatch };
    // Camino de empresa: las casillas de empleador se aceptan al registrar la empresa.
    if (signupType === 'empresa') return null;
    if (ageSt === 'empty') return { field: 'birthDate', message: tx.birthDateRequired };
    if (ageSt === 'invalid') return { field: 'birthDate', message: tx.birthDateInvalid };
    if (ageSt === 'underage') return { field: 'birthDate', message: tx.underage };
    if (!consents.acepto_condiciones_privacidad) return { field: 'agreeToTerms', message: t.errors.termsRequired };
    if (!consents.datos_verdaderos) return { field: 'consent-datos_verdaderos', message: tx.errTruthful };
    if (ageSt === 'minor' && !consents[GUARDIAN_KEY]) return { field: 'consent-autorizacion_tutores', message: tx.errGuardian };
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorField(null);
    setSuccessMessage(null);
    setPendingNotice(null);
    setResendEmail(null);
    setResendFeedback(null);

    const invalid = validateForm();
    if (invalid) {
      setError(invalid.message);
      setErrorField(invalid.field);
      // Lleva el foco al campo que falla (el aviso se anuncia por role="alert").
      document.getElementById(invalid.field)?.focus();
      return;
    }

    if (isLoginView) {
      // Login flow
      setIsLoading(true);
      try {
        const { error: authError } = await signInWithEmail(email.trim(), password);
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
        // La navegación la hace el efecto de `user` (arriba) en cuanto hay sesión.
        // Navegar también aquí, cuando termina signInWithEmail (que además registra
        // la actividad), devolvía al admin de /admin a /dashboard.
      } catch (err) {
        toast.error(t.errors.serverError);
        setError(t.errors.serverError);
        setIsLoading(false);
      }
    } else {
      // Signup flow (ya validado arriba)
      setIsLoading(true);
      try {
        const { data: signUpData, error: authError } = await signUpWithEmail(email.trim(), password, {
          full_name: fullName.trim(),
          // Idioma de registro = el de la interfaz; la plataforma se mostrará en él.
          registro_idioma: lang,
          tipo: signupType ?? 'candidato',
          ...(signupType === 'empresa' ? {} : { fecha_nacimiento: birthDate, casillas: consents }),
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

  // aria-invalid / aria-describedby del campo que tiene el error de validación.
  const fieldA11y = (field: FieldId) =>
    errorField === field ? { 'aria-invalid': true as const, 'aria-describedby': 'auth-form-error' } : {};

  // Casilla legal con el error de validación (la marca LegalConsentFields).
  const consentInvalidKey =
    errorField === 'agreeToTerms' ? 'acepto_condiciones_privacidad'
    : errorField?.startsWith('consent-') ? errorField.slice('consent-'.length)
    : null;

  // Primer paso del registro: sin camino elegido solo se ofrece elegirlo.
  const showChooser = !isLoginView && !signupType;
  const isSignup = !isLoginView;

  // Clases comunes de la pantalla (16 px en móvil: iOS no hace zoom al enfocar).
  const labelCls = 'block text-sm font-medium text-slate-800 dark:text-slate-100 mb-1.5';
  const fieldCls =
    'w-full px-3.5 py-2.5 text-base sm:text-[15px] leading-6 border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-colors focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500 aria-[invalid=true]:focus:border-red-500';
  const helpCls = 'mt-1.5 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary';
  const groupTitleCls = 'text-sm font-semibold text-slate-900 dark:text-white';

  // Error de validación junto al campo que falla (un solo elemento: lo enlaza aria-describedby).
  const inlineError = (field: FieldId) =>
    error && errorField === field ? (
      <p id="auth-form-error" role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-400">
        <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    ) : null;

  const typeOptions: { id: SignupType; testId: string; title: string; desc: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'candidato', testId: 'signup-type-candidato', title: tx.typeCandidate, desc: tx.typeCandidateDesc, Icon: IdentificationIcon },
    { id: 'empresa', testId: 'signup-type-empresa', title: tx.typeCompany, desc: tx.typeCompanyDesc, Icon: BuildingOffice2Icon },
  ];
  const SelectedIcon = signupType === 'empresa' ? BuildingOffice2Icon : IdentificationIcon;

  const alertBase = 'mb-5 flex items-start gap-3 rounded-lg border p-3.5 text-sm leading-snug';

  const formUI = (
    <div className="w-full">
      <div className={showChooser ? 'mb-8' : 'mb-6'}>
        <h2 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {showChooser ? tx.typeTitle : isLoginView ? t.login.title : t.signup.title}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">
          {showChooser ? tx.typeSubtitle : isLoginView ? t.login.subtitle : t.signup.subtitle}
        </p>
      </div>

      {/* Errores generales (los de campo salen junto al campo) */}
      {error && !errorField && (
        <div id="auth-form-error" role="alert" className={`${alertBase} border-red-200 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200`}>
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}
      {successMessage && (
        <div role="status" className={`${alertBase} border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200`}>
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{successMessage}</p>
        </div>
      )}
      {pendingNotice && (
        <div role="status" className={`${alertBase} border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100`}>
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{pendingNotice}</p>
        </div>
      )}
      {resendEmail && (
        <div className="mb-5">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="w-full px-3 py-2.5 text-sm font-medium border border-cv-blue text-cv-blue dark:text-blue-300 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-surface"
          >
            {isResending ? t.signup.resendSending : t.signup.resendButton}
          </button>
          <div aria-live="polite">
            {resendFeedback && (
              <p className={`mt-2 text-sm ${resendFeedback.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                {resendFeedback.text}
              </p>
            )}
          </div>
          {resendCooldown > 0 && (
            <p className="mt-1 text-[13px] tabular-nums text-slate-600 dark:text-dark-text-secondary">
              {t.signup.resendCooldown.replace('{seconds}', String(resendCooldown))}
            </p>
          )}
        </div>
      )}

      {/* Paso 1 del registro: ¿buscas empleo o contratas? */}
      {showChooser && (
        <div role="group" aria-label={tx.typeTitle} className="grid gap-4">
          {typeOptions.map(({ id, testId, title, desc, Icon }) => (
            <button
              key={id}
              type="button"
              data-testid={testId}
              onClick={() => setSignupType(id)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-[border-color,box-shadow,background-color] duration-150 hover:border-cv-blue hover:bg-blue-50/50 hover:shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-16px_rgba(15,23,42,.18)] focus:outline-none focus-visible:border-cv-blue focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 active:bg-blue-50 dark:border-dark-border dark:bg-dark-bg-tertiary/40 dark:hover:border-blue-400 dark:hover:bg-blue-500/10 dark:focus-visible:ring-offset-dark-surface"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-cv-blue transition-colors duration-150 group-hover:bg-cv-blue group-hover:text-white dark:bg-blue-500/15 dark:text-blue-300 dark:group-hover:bg-blue-500 dark:group-hover:text-white"
              >
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold leading-snug text-slate-900 dark:text-white">{title}</span>
                <span className="mt-1 block text-sm leading-snug text-slate-600 dark:text-dark-text-secondary">{desc}</span>
              </span>
              <ArrowRightIcon
                className="h-5 w-5 shrink-0 text-slate-400 transition-[transform,color] duration-150 group-hover:text-cv-blue motion-safe:group-hover:translate-x-1 dark:text-slate-500 dark:group-hover:text-blue-300"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}

      {!showChooser && (<>
      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Camino elegido (solo registro) */}
        {isSignup && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 dark:border-blue-400/30 dark:bg-blue-500/10">
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-cv-blue shadow-sm dark:bg-dark-bg-tertiary dark:text-blue-300">
                <SelectedIcon className="h-5 w-5" />
              </span>
              <span className="truncate text-sm font-semibold text-blue-950 dark:text-blue-100">
                {signupType === 'empresa' ? tx.typeSelectedCompany : tx.typeSelectedCandidate}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSignupType(null)}
              disabled={formLocked}
              className="shrink-0 rounded-md px-1.5 py-1 text-sm font-medium text-cv-blue underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue disabled:opacity-50 dark:text-blue-300"
            >
              {tx.typeChange}
            </button>
          </div>
        )}

        {isSignup && <h3 className={`${groupTitleCls} !mt-7`}>{tx.typeGroupAccount}</h3>}

        {/* Full Name (Signup only) */}
        {isSignup && (
          <div>
            <label htmlFor="fullName" className={labelCls}>
              {t.signup.fullName}
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              {...fieldA11y('fullName')}
              className={fieldCls}
              placeholder={t.signup.fullNamePlaceholder}
              disabled={formLocked}
            />
            {inlineError('fullName')}
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelCls}>
            {t.login.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...fieldA11y('email')}
            className={fieldCls}
            placeholder={isLoginView ? t.login.emailPlaceholder : t.signup.emailPlaceholder}
            disabled={formLocked}
          />
          {inlineError('email')}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className={labelCls}>
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
            {...fieldA11y('password')}
            className={fieldCls}
            placeholder="••••••••"
            disabled={formLocked}
          />
          {isSignup && <p className={helpCls}>{t.signup.passwordRequirements}</p>}
          {inlineError('password')}
        </div>

        {/* Confirm Password (Signup only) */}
        {isSignup && (
          <div>
            <label htmlFor="confirmPassword" className={labelCls}>
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
              {...fieldA11y('confirmPassword')}
              className={fieldCls}
              placeholder="••••••••"
              disabled={formLocked}
            />
            {inlineError('confirmPassword')}
          </div>
        )}

        {/* Remember Me & Forgot Password (Login only) */}
        {isLoginView && (
          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-cv-blue dark:border-dark-border dark:bg-dark-bg-tertiary"
              />
              <span className="ml-2 text-slate-700 dark:text-slate-200">
                {t.login.rememberMe}
              </span>
            </label>
            <Link
              to="/recovery"
              className="rounded font-medium text-cv-blue hover:text-cv-blue-dark hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-blue-300"
            >
              {t.login.forgotPassword}
            </Link>
          </div>
        )}

        {/* Fecha de nacimiento y casillas legales (solo candidato) */}
        {isSignup && signupType === 'candidato' && (
          <>
            <h3 className={`${groupTitleCls} !mt-8`}>{tx.typeGroupAbout}</h3>
            <div>
              <label htmlFor="birthDate" className={labelCls}>
                {tx.birthDate}
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                min="1900-01-01"
                max={todayLocalISO()}
                onChange={(e) => setBirthDate(e.target.value)}
                autoComplete="bday"
                aria-invalid={errorField === 'birthDate' ? true : undefined}
                aria-describedby={[
                  'birthDate-help',
                  ageSt === 'underage' || ageSt === 'minor' || errorField === 'birthDate' ? 'birthDate-msg' : '',
                ].filter(Boolean).join(' ')}
                className={`${fieldCls} tabular-nums sm:max-w-[16rem]`}
                disabled={formLocked}
              />
              <p id="birthDate-help" className={helpCls}>
                {tx.birthDateHelp} {tx.birthDateHelpShort}
              </p>
              {ageSt === 'underage' && (
                <p id="birthDate-msg" role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700 dark:text-red-400">
                  <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tx.underage}</span>
                </p>
              )}
              {ageSt === 'minor' && (
                <p id="birthDate-msg" role="status" className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tx.minorNotice}</span>
                </p>
              )}
              {ageSt !== 'underage' && ageSt !== 'minor' && (
                <span id="birthDate-msg">{inlineError('birthDate')}</span>
              )}
            </div>

            <h3 className={`${groupTitleCls} !mt-8`}>{tx.typeGroupTerms}</h3>
            <LegalConsentFields
              kind="candidato"
              values={consents}
              onChange={(key, value) => setConsents((prev) => ({ ...prev, [key]: value }))}
              disabled={formLocked}
              showGuardian={ageSt === 'minor'}
              invalidKey={consentInvalidKey}
              errorId="auth-form-error"
              errorMessage={consentInvalidKey ? error : null}
            />
          </>
        )}

        {isSignup && signupType === 'empresa' && (
          <p className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm leading-snug text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100">
            <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{tx.companyAccountNote}</span>
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formLocked}
          className="w-full rounded-lg bg-cv-blue px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-dark-surface"
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
      {(isLoginView || signupType === 'candidato') && (<>
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-dark-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-slate-600 dark:bg-dark-surface dark:text-dark-text-secondary">
            {isLoginView ? t.login.orContinue : t.signup.orContinue}
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-2.5">
        <OAuthButtons />
      </div>
      </>)}
      </>)}

      {/* Toggle Login/Signup */}
      <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm dark:border-dark-border">
        <span className="text-slate-600 dark:text-dark-text-secondary">
          {isLoginView ? t.login.noAccount : t.signup.haveAccount}{' '}
        </span>
        <Link
          to={isLoginView ? '/signup' : '/login'}
          onClick={() => {
            setError(null);
            setErrorField(null);
            setSuccessMessage(null);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFullName('');
            setSignupType(null);
            setBirthDate('');
            setConsents(emptyCasillas([...CANDIDATE_REQUIRED, ...CANDIDATE_OPTIONAL, GUARDIAN_KEY]));
          }}
          className="rounded font-semibold text-cv-blue hover:text-cv-blue-dark hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-blue-300"
        >
          {isLoginView ? t.login.signUpLink : t.signup.loginLink}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-bg">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 bg-white dark:bg-dark-surface rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,.06),0_24px_48px_-24px_rgba(15,23,42,.28)] dark:shadow-none dark:ring-1 dark:ring-dark-border overflow-hidden lg:min-h-[38rem]">

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
        <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
          {formUI}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
