/**
 * Aviso del estado de la suscripción del plan Profesional en el panel (dentro de
 * «Uso del plan»): días de prueba que quedan, renovación o fin programado, cobro
 * fallido, con el botón «Gestionar suscripción» (portal de Stripe).
 *
 * Solo pide el estado (get-billing-status) si el perfil tiene un plan de pago, y
 * no pinta nada si no hay suscripción viva: para quien no paga, el panel no cambia.
 */
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useBillingActions, useBillingStatus } from '../../hooks/useBilling';
import { isLiveSubscription, trialDaysLeft } from '../../lib/billingApi';
import { isPremiumProfile } from '../../utils/profileSorting';

const BillingStatusBanner: React.FC = () => {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const t = useTranslations().payments;
  const paid = !!profile && isPremiumProfile(profile as { id: string; plan?: string | null });
  const { status } = useBillingStatus(paid);
  const { busy, portal } = useBillingActions();

  const sub = status?.profile.subscription;
  if (!sub || !isLiveSubscription(sub) || (sub.productKey && !sub.productKey.startsWith('pro_'))) return null;

  const date = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  let title = t.banner.activeTitle;
  let text = '';
  if (sub.status === 'trialing') {
    title = t.banner.trialTitle;
    const days = trialDaysLeft(sub.trialEnd);
    text = `${days === null ? '' : `${t.banner.trialDaysLeft(days)} `}${t.banner.trialHint}`;
  } else if (sub.status === 'past_due') {
    text = t.banner.pastDue;
  } else if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
    text = t.banner.endsOn(date(sub.currentPeriodEnd));
  } else if (sub.currentPeriodEnd) {
    text = t.banner.renewsOn(date(sub.currentPeriodEnd));
  }

  const warn = sub.status === 'past_due';
  return (
    <div
      role="status"
      className={`mb-6 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
        warn
          ? 'border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10'
          : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${warn ? 'text-amber-950 dark:text-amber-100' : 'text-blue-900 dark:text-blue-300'}`}>{title}</p>
        {text && <p className={`mt-0.5 text-sm ${warn ? 'text-amber-900 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>{text}</p>}
      </div>
      <button
        type="button"
        onClick={() => { void portal('profile'); }}
        disabled={busy !== null}
        aria-busy={busy !== null ? true : undefined}
        className="shrink-0 rounded-lg bg-cv-blue px-4 py-2 text-sm font-medium text-white hover:bg-cv-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t.manageSubscription}
      </button>
    </div>
  );
};

export default BillingStatusBanner;
