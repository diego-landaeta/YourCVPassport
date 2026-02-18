/**
 * Usage Limit Modal
 *
 * Shows when user reaches their plan limit for a feature
 * Encourages upgrade to higher plan
 */

import React from 'react';
import { X, Zap, Lock, TrendingUp, Crown } from 'lucide-react';
import { FeatureType, FeatureLimitCheck, PLAN_INFO, FEATURE_INFO, PlanType } from '../hooks/useUsageLimits';
import { useLanguage } from '../contexts/LanguageContext';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureType: FeatureType;
  limitInfo: FeatureLimitCheck | null;
  onUpgrade?: () => void;
}

// Translations
const translations = {
  en: {
    title: 'Usage Limit Reached',
    subtitle: 'You\'ve reached your monthly limit for this feature',
    currentPlan: 'Current Plan',
    usage: 'Usage This Month',
    upgradeTitle: 'Upgrade to unlock more',
    upgradeDescription: 'Get unlimited access and premium features',
    upgradeButton: 'Upgrade Now',
    continueButton: 'Continue with Free',
    features: {
      ats_export: {
        limitTitle: 'ATS Export Limit Reached',
        limitDescription: 'You\'ve used your free ATS export for this month. Upgrade to get more exports.',
        upgradeValue: 'Pro plan includes unlimited ATS exports in PDF and DOCX formats.',
      },
      ai_request: {
        limitTitle: 'AI Features Unavailable',
        limitDescription: 'AI-powered profile optimization is a premium feature.',
        upgradeValue: 'Unlock AI assistance to improve your headline, summary, and experience descriptions.',
      },
      stamp_request: {
        limitTitle: 'Verification Limit Reached',
        limitDescription: 'You\'ve reached your stamp verification limit for this month.',
        upgradeValue: 'Get unlimited verifications to build trust with employers.',
      },
      profile_view: {
        limitTitle: 'Analytics Limit',
        limitDescription: 'Detailed analytics are available on paid plans.',
        upgradeValue: 'See who viewed your profile and track engagement.',
      },
    },
    planBenefits: {
      free: ['1 ATS export/month', 'Basic templates', 'Limited stamps'],
      basic: ['5 ATS exports/month', '20 AI requests', '10 stamps/month'],
      pro: ['Unlimited exports', 'Unlimited AI', 'Unlimited stamps', 'Premium templates', 'Remove branding'],
      enterprise: ['Everything in Pro', 'Priority support', 'Custom integrations', 'Team features'],
    },
  },
  es: {
    title: 'Límite de Uso Alcanzado',
    subtitle: 'Has alcanzado tu límite mensual para esta función',
    currentPlan: 'Plan Actual',
    usage: 'Uso Este Mes',
    upgradeTitle: 'Mejora para desbloquear más',
    upgradeDescription: 'Obtén acceso ilimitado y funciones premium',
    upgradeButton: 'Mejorar Ahora',
    continueButton: 'Continuar con Free',
    features: {
      ats_export: {
        limitTitle: 'Límite de Exportación ATS',
        limitDescription: 'Has usado tu exportación ATS gratuita de este mes. Mejora para obtener más.',
        upgradeValue: 'El plan Pro incluye exportaciones ilimitadas en PDF y DOCX.',
      },
      ai_request: {
        limitTitle: 'Funciones de IA No Disponibles',
        limitDescription: 'La optimización de perfil con IA es una función premium.',
        upgradeValue: 'Desbloquea la asistencia de IA para mejorar tu titular, resumen y descripciones.',
      },
      stamp_request: {
        limitTitle: 'Límite de Verificaciones',
        limitDescription: 'Has alcanzado tu límite de verificaciones de stamps este mes.',
        upgradeValue: 'Obtén verificaciones ilimitadas para generar confianza con empleadores.',
      },
      profile_view: {
        limitTitle: 'Límite de Analíticas',
        limitDescription: 'Las analíticas detalladas están disponibles en planes de pago.',
        upgradeValue: 'Ve quién visitó tu perfil y rastrea el engagement.',
      },
    },
    planBenefits: {
      free: ['1 exportación ATS/mes', 'Plantillas básicas', 'Stamps limitados'],
      basic: ['5 exportaciones ATS/mes', '20 solicitudes IA', '10 stamps/mes'],
      pro: ['Exportaciones ilimitadas', 'IA ilimitada', 'Stamps ilimitados', 'Plantillas premium', 'Sin marca'],
      enterprise: ['Todo en Pro', 'Soporte prioritario', 'Integraciones custom', 'Funciones de equipo'],
    },
  },
};

export function UsageLimitModal({
  isOpen,
  onClose,
  featureType,
  limitInfo,
  onUpgrade,
}: UsageLimitModalProps) {
  const { lang: language } = useLanguage();
  const t = translations[language] || translations.en;

  if (!isOpen) return null;

  const currentPlan = (limitInfo?.plan || 'free') as PlanType;
  const planInfo = PLAN_INFO[currentPlan];
  const featureInfo = FEATURE_INFO[featureType];
  const featureTexts = t.features[featureType];

  const suggestedPlan: PlanType = currentPlan === 'free' ? 'pro' : 'enterprise';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center rounded-t-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{featureTexts.limitTitle}</h2>
            <p className="mt-2 text-amber-100">{featureTexts.limitDescription}</p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Current usage */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t.currentPlan}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${planInfo.badge}`}>
                  {planInfo.name}
                </span>
              </div>
              {limitInfo && typeof limitInfo.limit === 'number' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t.usage}</span>
                    <span className="font-medium text-gray-900">
                      {limitInfo.used} / {limitInfo.limit}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${Math.min(100, (limitInfo.used / limitInfo.limit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade suggestion */}
            <div className="mb-6 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <Crown className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">{t.upgradeTitle}</h3>
                  <p className="mt-1 text-sm text-indigo-700">{featureTexts.upgradeValue}</p>
                </div>
              </div>

              {/* Pro benefits */}
              <ul className="mt-4 space-y-2">
                {t.planBenefits[suggestedPlan].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-indigo-800">
                    <Zap className="h-4 w-4 text-indigo-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={onUpgrade}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300"
              >
                <TrendingUp className="h-5 w-5" />
                {t.upgradeButton}
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t.continueButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simpler inline warning component for feature limits
 */
interface UsageLimitWarningProps {
  featureType: FeatureType;
  limitInfo: FeatureLimitCheck | null;
  onUpgrade?: () => void;
  compact?: boolean;
}

export function UsageLimitWarning({
  featureType,
  limitInfo,
  onUpgrade,
  compact = false,
}: UsageLimitWarningProps) {
  const { lang: language } = useLanguage();

  if (!limitInfo || limitInfo.allowed) return null;

  const isSpanish = language === 'es';

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <Lock className="h-4 w-4" />
        <span>
          {isSpanish ? 'Límite alcanzado' : 'Limit reached'} •{' '}
          <button onClick={onUpgrade} className="font-medium underline hover:no-underline">
            {isSpanish ? 'Mejorar' : 'Upgrade'}
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Lock className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-amber-900">
            {isSpanish ? 'Función Premium' : 'Premium Feature'}
          </h4>
          <p className="mt-1 text-sm text-amber-700">
            {limitInfo.reason ||
              (isSpanish
                ? 'Esta función no está disponible en tu plan actual'
                : 'This feature is not available on your current plan')}
          </p>
          {limitInfo.plan && (
            <p className="mt-2 text-xs text-amber-600">
              {isSpanish ? 'Plan actual: ' : 'Current plan: '}
              <span className="font-medium capitalize">{limitInfo.plan}</span>
            </p>
          )}
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            {isSpanish ? 'Mejorar' : 'Upgrade'}
          </button>
        )}
      </div>
    </div>
  );
}

export default UsageLimitModal;
