import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, ChevronDownIcon, DocumentTextIcon, ExclamationCircleIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../shared/LoadingSpinner';
import {
  GUARDIAN_KEY,
  ageStatus,
  CANDIDATE_OPTIONAL,
  downloadLegalText,
  fetchMyBirthDate,
  fetchMyConsentPrefs,
  fetchPendingLegalDocuments,
  legalPagePath,
  registerAcceptance,
  rememberUnderageNotice,
  saveConsentPrefs,
  setMyBirthDate,
  type Casillas,
  type PendingLegalDocument,
} from '../../lib/legal';
import { casillaLabel, useLegalText } from './legalText';
import { fmt } from '../../lib/bolsaText';
import { ensureAlertSubscription } from '../../lib/jobsApi';
import LegalNoticeBanner, { useLegalNotices } from './LegalNoticeBanner';
import { useNoticeText } from './noticeText';

/**
 * Puerta de aceptación de las condiciones (#6).
 *
 * Envuelve las áreas con sesión (ProtectedRoute: candidato; CompanyProtectedRoute:
 * empleador). Pregunta a `documentos_pendientes()` qué versiones vigentes aún no
 * ha aceptado el usuario y:
 *   1. Si el alta guardó en `app_metadata.registro_aceptacion` las casillas que
 *      marcó al registrarse (la Edge `signup` las valida y las guarda ahí, donde
 *      el usuario no puede editarlas) y las versiones coinciden con las vigentes,
 *      registra la aceptación (contexto «registro») en este primer acceso con
 *      sesión, sin pedirla otra vez.
 *   2. Si quedan pendientes (usuarios existentes, OAuth, nueva versión...) muestra
 *      la pantalla de aceptación y BLOQUEA el uso hasta aceptar.
 *
 * Antes de las condiciones, si `profiles_full.fecha_nacimiento` es NULL (cuentas
 * creadas con Google/LinkedIn y cuentas anteriores al control de edad) pide la
 * fecha con la RPC `set_my_birth_date`: 16-17 años exige la casilla de padres o
 * tutores; menos de 16 no se guarda y se cierra la sesión con un mensaje claro.
 *
 * Casillas opcionales (perfil_publico, aparecer_google, empresas_contacto, alertas_novedades): las
 * marcadas al registrarse y las que la persona toque en esta pantalla se guardan con
 * `save_consent_prefs` (solo esas 4 claves; NO cambia la visibilidad del perfil). Las que no se tocan
 * no se envían, para no pisar lo que ya hubiera guardado.
 *
 * Cuando la puerta no bloquea, pinta encima del panel el aviso de «nueva versión» (15 días de
 * antelación, `legal_aviso_proximo()`): ver LegalNoticeBanner. Si la RPC no existe, no se ve nada.
 *
 * Esta puerta es SOLO de interfaz: no es una barrera de seguridad. Si la consulta
 * falla (p. ej. la migración aún no está aplicada) no bloquea la app, y quien se
 * salte la pantalla (llamando a la API directamente) tampoco evita nada: la
 * defensa real está en el servidor. `apply_to_job` y `submit_job_for_review`
 * comprueban que el usuario tenga aceptadas las versiones vigentes de sus
 * documentos (error `ACCEPTANCE_REQUIRED`) y que su fecha de nacimiento guardada
 * no sea de menor de 16 años (error `UNDERAGE`).
 */

interface LegalGateProps {
  /** candidato: terminos_candidato + privacidad; empleador: terminos_empleador + privacidad. */
  scope: 'candidato' | 'empleador';
  /** Empresa a la que se asocia la aceptación del empleador. */
  companyId?: string | null;
  children: React.ReactNode;
}

// Usuarios/ámbitos que ya no tienen nada pendiente en esta sesión de la SPA.
const clearedKeys = new Set<string>();

interface RegistroAceptacionMeta {
  casillas?: Record<string, unknown>;
  versiones?: Record<string, unknown>;
}

const FRESH_ACCOUNT_MS = 24 * 60 * 60 * 1000;

const LegalGate: React.FC<LegalGateProps> = ({ scope, companyId = null, children }) => {
  const { user, profile, profileLoading, signOut } = useAuth();
  const { lang } = useLanguage();
  const tx = useLegalText();
  const nx = useNoticeText();

  const userId = user?.id ?? null;
  // Cuenta de EMPRESA (role employer o alta con tipo=empresa): a sus miembros NO se les pide la fecha de
  // nacimiento (el control de edad es de candidatos). Se espera a conocer el perfil para no pedirla por error.
  const isCompanyAccount = profile?.role === 'employer' || (user?.user_metadata as { tipo?: string } | undefined)?.tipo === 'empresa';
  const accountReady = !profileLoading || !!profile || (user?.user_metadata as { tipo?: string } | undefined)?.tipo === 'empresa';
  const cacheKey = userId ? `${userId}:${scope}:${companyId ?? ''}` : '';

  const [status, setStatus] = useState<'checking' | 'ready' | 'birth' | 'underage' | 'blocked'>(
    !userId || clearedKeys.has(cacheKey) ? 'ready' : 'checking',
  );
  const [pending, setPending] = useState<PendingLegalDocument[]>([]);
  const [checked, setChecked] = useState<Casillas>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Casillas opcionales (solo candidatos): se guardan con save_consent_prefs, las 4 claves y nada mas
  const [optChecked, setOptChecked] = useState<Record<string, boolean>>({});
  const [optTouched, setOptTouched] = useState<Record<string, boolean>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Fecha de nacimiento que falta (S4)
  const [birthDate, setBirthDate] = useState('');
  const [guardian, setGuardian] = useState(false);
  const [birthTouched, setBirthTouched] = useState(false);
  const [birthSaving, setBirthSaving] = useState(false);
  const [birthServerError, setBirthServerError] = useState(false);
  const [recheck, setRecheck] = useState(0);
  const birthDoneRef = useRef(false);
  const guardianConfirmedRef = useRef(false);
  const ageSt = ageStatus(birthDate);
  // Versiones futuras (<= 15 dias) para avisar en esta pantalla; solo se consultan cuando esta visible.
  const upcoming = useLegalNotices(status === 'blocked' ? scope : null);

  const handleUnderage = () => {
    rememberUnderageNotice();
    setStatus('underage');
    void signOut();
  };

  const contexto = useMemo(() => {
    const created = user?.created_at ? new Date(user.created_at).getTime() : 0;
    return created && Date.now() - created < FRESH_ACCOUNT_MS ? ('registro' as const) : ('nueva_version' as const);
  }, [user?.created_at]);

  useEffect(() => {
    if (!userId) {
      setStatus('ready');
      return;
    }
    if (clearedKeys.has(cacheKey)) {
      setStatus('ready');
      return;
    }
    if (!accountReady) return; // el perfil aún carga: se vuelve a lanzar al llegar
    let cancelled = false;
    setStatus('checking');

    (async () => {
      // 1. Edad: si falta la fecha de nacimiento se pide antes que las condiciones (no a cuentas de empresa).
      if (!birthDoneRef.current && !isCompanyAccount) {
        const stored = await fetchMyBirthDate(userId);
        if (cancelled) return;
        if (stored === null) {
          setBirthDate('');
          setGuardian(false);
          setBirthTouched(false);
          setBirthServerError(false);
          setStatus('birth');
          return;
        }
        if (typeof stored === 'string' && ageStatus(stored) === 'underage') {
          handleUnderage();
          return;
        }
      }

      // 2. Condiciones pendientes
      const { docs, error } = await fetchPendingLegalDocuments();
      if (cancelled) return;
      if (error) {
        console.warn('[LegalGate] documentos_pendientes falló; no se bloquea (el servidor valida el consentimiento):', error);
        setStatus('ready');
        return;
      }

      let relevant = docs.filter((d) =>
        scope === 'candidato' ? d.audiencia !== 'empleador' : d.audiencia !== 'candidato',
      );

      // Aceptación hecha en el formulario de registro (casillas validadas por la Edge `signup`).
      const meta = (user?.app_metadata as { registro_aceptacion?: RegistroAceptacionMeta } | undefined)
        ?.registro_aceptacion;
      if (relevant.length > 0 && meta?.casillas && meta.versiones) {
        const casillas = Object.fromEntries(
          Object.entries(meta.casillas).filter(([, v]) => typeof v === 'boolean'),
        ) as Casillas;
        const matched = relevant.filter(
          (d) =>
            meta.versiones?.[d.tipo] === d.version &&
            d.casillas_obligatorias.every((k) => casillas[k] === true),
        );
        if (matched.length > 0) {
          const { error: regError } = await registerAcceptance({
            documentIds: matched.map((d) => d.documento_id),
            casillas,
            contexto: 'registro',
            companyId: scope === 'empleador' ? companyId : null,
          });
          if (cancelled) return;
          if (!regError) {
            const done = new Set(matched.map((d) => d.documento_id));
            relevant = relevant.filter((d) => !done.has(d.documento_id));
            // F15: la casilla opcional «alertas_novedades» crea la alerta de ofertas. Las demas
            // (perfil_publico, aparecer_google, empresas_contacto) no tienen columna donde
            // aplicarse todavia: ver el informe de la oleada. No bloquea ni lanza.
            if (scope === 'candidato' && casillas.alertas_novedades === true) void ensureAlertSubscription(userId);
            // Las 4 casillas opcionales marcadas (o no) al registrarse se guardan en consent_prefs.
            if (scope === 'candidato') void saveConsentPrefs(casillas);
          }
        }
      }

      if (relevant.length === 0) {
        clearedKeys.add(cacheKey);
        setStatus('ready');
        return;
      }
      if (scope === 'candidato') {
        const stored = await fetchMyConsentPrefs(userId);
        if (cancelled) return;
        setOptChecked(stored);
        setOptTouched({});
      }
      setPending(relevant);
      setChecked({});
      setStatus('blocked');
    })();

    return () => {
      cancelled = true;
    };
    // user?.app_metadata cambia solo con la sesión; la clave ya incluye el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, scope, companyId, recheck, accountReady, isCompanyAccount]);

  useEffect(() => {
    if (status === 'blocked' || status === 'birth' || status === 'underage') headingRef.current?.focus();
  }, [status]);

  const birthIssue: 'required' | 'invalid' | 'guardian' | null =
    ageSt === 'empty' ? 'required' : ageSt === 'invalid' ? 'invalid' : ageSt === 'minor' && !guardian ? 'guardian' : null;

  const handleSaveBirth = async () => {
    if (birthSaving) return;
    setBirthTouched(true);
    setBirthServerError(false);
    if (ageSt === 'empty' || ageSt === 'invalid' || (ageSt === 'minor' && !guardian)) return;
    setBirthSaving(true);
    const { status: result, error } = await setMyBirthDate(birthDate);
    setBirthSaving(false);
    if (error || !result) {
      console.error('[LegalGate] set_my_birth_date falló:', error);
      setBirthServerError(true);
      return;
    }
    if (result === 'underage') {
      handleUnderage();
      return;
    }
    if (result === 'invalid') {
      setBirthServerError(true);
      return;
    }
    // ok | already_set: la fecha ya está guardada; se siguen las condiciones.
    birthDoneRef.current = true;
    guardianConfirmedRef.current = ageSt === 'minor' && guardian;
    setStatus('checking');
    setRecheck((n) => n + 1);
  };

  const requiredKeys = useMemo(
    () => Array.from(new Set(pending.flatMap((d) => d.casillas_obligatorias))),
    [pending],
  );
  const allChecked = requiredKeys.every((k) => checked[k] === true);
  // Documentos sin casillas propias (p. ej. privacidad) se aceptan junto a los demás:
  // si no hay ninguna casilla, basta el botón.

  const handleAccept = async () => {
    if (!allChecked || saving) return;
    setSaving(true);
    setSaveError(false);
    const casillas: Casillas = Object.fromEntries(requiredKeys.map((k) => [k, true]));
    // 16-17 años: queda constancia de la autorización de tutores marcada en esta puerta.
    if (scope === 'candidato' && guardianConfirmedRef.current) casillas[GUARDIAN_KEY] = true;
    const { error } = await registerAcceptance({
      documentIds: pending.map((d) => d.documento_id),
      casillas,
      contexto,
      companyId: scope === 'empleador' ? companyId : null,
    });
    setSaving(false);
    if (error) {
      console.error('[LegalGate] registrar_aceptacion falló:', error);
      setSaveError(true);
      return;
    }
    // Casillas opcionales que la persona ha tocado en esta pantalla (no pisa lo que ya tenia guardado).
    if (scope === 'candidato') {
      const touched = Object.fromEntries(Object.keys(optTouched).filter((k) => optTouched[k]).map((k) => [k, optChecked[k] === true]));
      if (Object.keys(touched).length > 0) {
        const { error: prefsError } = await saveConsentPrefs(touched);
        if (prefsError) console.warn('[LegalGate] save_consent_prefs falló (no bloquea):', prefsError);
        if (touched.alertas_novedades === true) void ensureAlertSubscription(userId as string);
      }
    }
    clearedKeys.add(cacheKey);
    setPending([]);
    setStatus('ready');
  };

  const dateFmt = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));

  if (status === 'checking') {
    return <LoadingSpinner message={tx.gateChecking} size="medium" />;
  }
  if (status === 'ready') {
    return (
      <>
        {userId && <LegalNoticeBanner scope={scope} />}
        {children}
      </>
    );
  }

  if (status === 'underage') {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="legal-gate-title" className="fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-dark-bg-primary">
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-10">
          <div className="w-full max-w-md text-center">
            <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300">
              <ExclamationCircleIcon className="h-8 w-8" />
            </span>
            <h1 id="legal-gate-title" ref={headingRef} tabIndex={-1} className="mt-5 text-balance text-2xl font-extrabold tracking-tight text-slate-900 focus:outline-none dark:text-white">
              {tx.underageGateTitle}
            </h1>
            <p role="alert" className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.underageGateText}</p>
            <button
              type="button"
              onClick={() => { void signOut(); }}
              className="mt-6 rounded-lg bg-cv-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary"
            >
              {tx.underageGateClose}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'birth') {
    const msgId = 'gate-birth-msg';
    const showError = birthTouched && (birthIssue === 'required' || birthIssue === 'invalid');
    const showGuardianError = birthTouched && birthIssue === 'guardian';
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="legal-gate-title" className="fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-dark-bg-primary">
        <header className="border-b border-slate-200 bg-white dark:border-dark-border dark:bg-dark-bg-secondary">
          <div className="mx-auto flex w-full max-w-3xl items-start gap-4 px-4 py-5 sm:px-6 sm:py-6">
            <span aria-hidden="true" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-cv-blue dark:bg-blue-500/15 dark:text-blue-300 sm:flex">
              <ShieldCheckIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 id="legal-gate-title" ref={headingRef} tabIndex={-1} className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 focus:outline-none dark:text-white sm:text-3xl">
                {tx.birthGateTitle}
              </h1>
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.birthGateIntro}</p>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <form
            className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 sm:px-6"
            onSubmit={(e) => { e.preventDefault(); void handleSaveBirth(); }}
            noValidate
          >
            <div>
              <label htmlFor="gate-birthdate" className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-100">{tx.birthDate}</label>
              <input
                id="gate-birthdate"
                type="date"
                value={birthDate}
                min="1900-01-01"
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBirthDate(e.target.value)}
                autoComplete="bday"
                disabled={birthSaving}
                aria-invalid={showError ? true : undefined}
                aria-describedby={`gate-birth-help ${msgId}`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base leading-6 tabular-nums text-slate-900 shadow-sm transition-colors focus:border-cv-blue focus:outline-none focus:ring-2 focus:ring-cv-blue disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-500 dark:border-dark-border dark:bg-dark-bg-tertiary dark:text-white sm:max-w-[16rem] sm:text-[15px]"
              />
              <p id="gate-birth-help" className="mt-1.5 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">
                {tx.birthDateHelp} {tx.birthDateHelpShort}
              </p>
              <div id={msgId} aria-live="polite">
                {showError && (
                  <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700 dark:text-red-400">
                    <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{birthIssue === 'required' ? tx.birthDateRequired : tx.birthDateInvalid}</span>
                  </p>
                )}
                {ageSt === 'underage' && (
                  <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700 dark:text-red-400">
                    <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{tx.underage}</span>
                  </p>
                )}
              </div>
            </div>

            {ageSt === 'minor' && (
              <div className="space-y-3">
                <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tx.minorNotice}</span>
                </p>
                <div className="flex items-start gap-3">
                  <input
                    id="gate-guardian"
                    type="checkbox"
                    checked={guardian}
                    onChange={(e) => setGuardian(e.target.checked)}
                    disabled={birthSaving}
                    aria-invalid={showGuardianError ? true : undefined}
                    aria-describedby={showGuardianError ? 'gate-guardian-err' : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-cv-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:border-dark-border dark:focus-visible:ring-offset-dark-bg-primary"
                  />
                  <label htmlFor="gate-guardian" className="cursor-pointer text-sm leading-snug text-slate-800 dark:text-slate-100">{tx.guardianCheck}</label>
                </div>
                {showGuardianError && (
                  <p id="gate-guardian-err" role="alert" className="flex items-start gap-1.5 text-sm font-medium text-red-700 dark:text-red-400">
                    <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{tx.errGuardian}</span>
                  </p>
                )}
              </div>
            )}

            <div aria-live="polite">
              {birthServerError && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                  <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tx.birthGateError}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => { void signOut(); }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-slate-300 dark:hover:text-white"
              >
                {tx.gateLogout}
              </button>
              <button
                type="submit"
                disabled={birthSaving}
                className="rounded-lg bg-cv-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-dark-bg-primary"
              >
                {birthSaving ? tx.birthGateSaving : tx.birthGateSave}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  const total = requiredKeys.length;
  const checkedCount = requiredKeys.filter((k) => checked[k] === true).length;

  // Cada documento se lee en su propia página (pestaña nueva): aquí solo se enlaza, no se incrusta el texto.
  const docHref = (doc: PendingLegalDocument): string => {
    switch (doc.tipo) {
      case 'privacidad': return legalPagePath('privacy', lang);
      case 'terminos_empleador': return legalPagePath('terms', lang, '?tipo=empleador');
      case 'condiciones_publicacion': return legalPagePath('terms', lang, '?tipo=publicacion');
      default: return legalPagePath('terms', lang);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-gate-title"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-50 px-4 py-6 dark:bg-dark-bg-primary sm:items-center sm:py-10"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-dark-border dark:bg-dark-bg-secondary sm:p-8">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-cv-blue dark:bg-blue-500/15 dark:text-blue-300">
            <ShieldCheckIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1
              id="legal-gate-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-balance text-xl font-bold tracking-tight text-slate-900 focus:outline-none dark:text-white sm:text-2xl"
            >
              {tx.gateTitle}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.gateIntro}</p>
          </div>
        </div>

        {upcoming.length > 0 && (
          <div role="note" data-testid="legal-gate-upcoming" className="mt-5 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm leading-snug text-amber-950 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
            {upcoming.map((n) => (
              <p key={`${n.tipo}:${n.version}:${n.idioma}`} className="flex items-start gap-2.5">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <span>
                  <span className="font-semibold">{nx.gateTitle}.</span>{' '}
                  {fmt(nx.gateLine, { date: dateFmt(n.vigente_desde), version: n.version, titulo: n.titulo })}
                </span>
              </p>
            ))}
          </div>
        )}

        <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-dark-border dark:border-dark-border">
          {pending.map((doc) => (
            <li key={doc.documento_id} className="flex items-center gap-3 px-4 py-3">
              <DocumentTextIcon className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a
                  href={docHref(doc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-slate-900 hover:text-cv-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-white dark:hover:text-blue-300"
                >
                  <span>{doc.titulo}</span>
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">({tx.gateNewTab})</span>
                </a>
                <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-dark-text-secondary">
                  {fmt(tx.gateVersion, { version: doc.version })} · {fmt(tx.gateSince, { date: dateFmt(doc.vigente_desde) })}
                </p>
                {doc.borrador && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <ExclamationTriangleIcon className="h-3 w-3" aria-hidden="true" />
                    {tx.draftBadge}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => downloadLegalText(doc)}
                aria-label={`${tx.download}: ${doc.titulo}`}
                title={tx.download}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        {requiredKeys.length > 0 && (
          <fieldset className="mt-6 min-w-0">
            <legend className="mb-2.5 flex w-full flex-wrap items-center justify-between gap-x-3 text-sm font-semibold text-slate-900 dark:text-white">
              <span>{tx.gateConfirmGroup}</span>
              <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium tabular-nums ${checkedCount === total ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                {checkedCount === total ? <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> : <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />}
                {fmt(tx.gateProgress, { n: checkedCount, total })}
              </span>
            </legend>
            <div className="space-y-3">
              {requiredKeys.map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <input
                    id={`gate-${key}`}
                    type="checkbox"
                    checked={checked[key] === true}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                    disabled={saving}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-cv-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:border-slate-500"
                  />
                  <label htmlFor={`gate-${key}`} className="cursor-pointer text-sm leading-snug text-slate-800 dark:text-slate-100">
                    {casillaLabel(tx, key)}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {scope === 'candidato' && (
          <details className="group mt-4 rounded-lg border border-slate-200 dark:border-dark-border" data-testid="gate-optional">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-slate-200 dark:hover:bg-white/5">
              <span>{tx.optionalGroup}</span>
              <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <div className="border-t border-slate-200 px-3 pb-3 pt-3 dark:border-dark-border">
              <p className="mb-3 text-[13px] text-slate-600 dark:text-dark-text-secondary">{nx.gateOptHint}</p>
              <div className="space-y-2.5">
                {CANDIDATE_OPTIONAL.map((key) => (
                  <div key={key} className="flex items-start gap-3">
                    <input
                      id={`gate-opt-${key}`}
                      type="checkbox"
                      checked={optChecked[key] === true}
                      onChange={(e) => {
                        setOptChecked((prev) => ({ ...prev, [key]: e.target.checked }));
                        setOptTouched((prev) => ({ ...prev, [key]: true }));
                      }}
                      disabled={saving}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-cv-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:border-slate-500"
                    />
                    <label htmlFor={`gate-opt-${key}`} className="cursor-pointer text-sm leading-snug text-slate-700 dark:text-slate-200">
                      {casillaLabel(tx, key)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}

        <div aria-live="polite">
          {saveError && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
              <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{tx.gateError}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAccept}
          disabled={!allChecked || saving}
          className="mt-6 w-full rounded-lg bg-cv-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? tx.gateAccepting : tx.gateAccept}
        </button>
        <button
          type="button"
          onClick={() => { void signOut(); }}
          className="mx-auto mt-3 block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-slate-300 dark:hover:text-white"
        >
          {tx.gateLogout}
        </button>
      </div>
    </div>
  );
};

export default LegalGate;
