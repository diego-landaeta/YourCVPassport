import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  UserCircleIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  LanguageIcon,
  FolderIcon,
  Cog6ToothIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

// Import sections
import IdentitySection from './IdentitySection';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import LanguagesSection from './LanguagesSection';
import PortfolioSection from './PortfolioSection';
import PreferencesSection from './PreferencesSection';
import FinalizationStep from './FinalizationStep';

interface ProfileWizardProps {
  profile: any;
  experiences: any[];
  education: any[];
  skills: any[];
  languages: any[];
  portfolio: any[];
  visas: any[];
  certifications: any[];
  onSaveIdentity: (data: any) => Promise<void>;
  onSaveExperience: (data: any[]) => Promise<void>;
  onSaveEducation: (data: any[]) => Promise<void>;
  onSaveSkills: (data: any[]) => Promise<void>;
  onSaveLanguages: (data: any[]) => Promise<void>;
  onSavePortfolio: (data: any[]) => Promise<void>;
  onSavePreferences: (data: any) => Promise<void>;
  initialStep?: string; // Step ID to start with (e.g., 'identity', 'experience')
  onComplete: () => void;
}

const ProfileWizard: React.FC<ProfileWizardProps> = ({
  profile,
  experiences,
  education,
  skills,
  languages,
  portfolio,
  visas,
  certifications,
  onSaveIdentity,
  onSaveExperience,
  onSaveEducation,
  onSaveSkills,
  onSaveLanguages,
  onSavePortfolio,
  onSavePreferences,
  initialStep,
  onComplete
}) => {
  const t = useTranslations();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const stepRef = React.useRef<any>(null);
  const [showPremiumToast, setShowPremiumToast] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [preferencesCompletedInSession, setPreferencesCompletedInSession] = useState(false);


  // Check if user has completed the wizard
  // IMPORTANTE: El wizard SOLO se considera completado si wizard_completed = true en la base de datos
  // Esto se marca cuando el usuario completa el paso de Finalización (selecciona template y slug)
  // Ya no usamos localStorage porque debe persistir entre dispositivos y navegadores
  const hasCompletedWizard = profile?.wizard_completed === true;

  // ---------------------------------------------------------------------------
  // FUENTE UNICA DE COMPLETITUD
  //
  // Antes habia dos criterios distintos y divergian: el check verde del stepper
  // pintaba Identidad como completa con solo nombre+email, mientras la puerta de
  // finalizacion exigia ademas titular, resumen y foto. El usuario recorria los
  // ocho pasos en verde y era rechazado al final. Ahora ambos leen de aqui, asi
  // que no pueden volver a contradecirse.
  //
  // `required`   : bloquea la finalizacion.
  // `missing`    : lo que falta, en lenguaje del usuario. Vacio = cumplido.
  // `hasContent` : si el paso tiene algo. Solo para marcar en verde los opcionales.
  // ---------------------------------------------------------------------------
  const hasPreferences = Boolean(
    profile?.job_seeking_status ||
    profile?.availability ||
    profile?.salary_min ||
    profile?.salary_max ||
    profile?.remote_preference ||
    profile?.willing_to_relocate ||
    (profile?.preferred_locations && profile.preferred_locations.length > 0) ||
    (profile?.job_type && profile.job_type.length > 0)
  );

  const stepRules: Record<string, { required: boolean; missing: string[]; hasContent: boolean }> = {
    identity: {
      required: true,
      missing: [
        !profile?.full_name && t.wizardValidation.fullName,
        !profile?.email && t.wizardValidation.email,
        !profile?.headline && t.wizardValidation.headline,
        !profile?.summary && t.wizardValidation.summary,
        !profile?.avatar_url && t.wizardValidation.photo,
      ].filter(Boolean) as string[],
      hasContent: Boolean(profile?.full_name || profile?.email),
    },
    experience: {
      required: true,
      missing: !experiences || experiences.length === 0 ? [t.wizardValidation.atLeastOneExperience] : [],
      hasContent: (experiences?.length ?? 0) > 0,
    },
    education: { required: false, missing: [], hasContent: (education?.length ?? 0) > 0 },
    skills: {
      required: true,
      missing:
        !skills || skills.length < 3
          ? [`${t.wizardValidation.atLeastThreeSkills} (${t.wizardValidation.youHave} ${skills?.length || 0})`]
          : [],
      hasContent: (skills?.length ?? 0) > 0,
    },
    languages: { required: false, missing: [], hasContent: (languages?.length ?? 0) > 0 },
    portfolio: { required: false, missing: [], hasContent: (portfolio?.length ?? 0) > 0 },
    // Preferencias ya no bloquea. Antes exigia "haber visitado el paso" mediante
    // un flag de sesion que se perdia al recargar, y sus campos son opcionales:
    // era un requisito fantasma imposible de deducir desde la interfaz.
    preferences: { required: false, missing: [], hasContent: hasPreferences || preferencesCompletedInSession },
    finalization: { required: false, missing: [], hasContent: Boolean(profile?.template && profile?.slug) },
  };

  // Validate before allowing access to finalization step
  const canAccessFinalization = () => {
    if (hasCompletedWizard) return false; // Already completed wizard

    const blocking = Object.values(stepRules).some(r => r.required && r.missing.length > 0);
    if (blocking) {
      setShowIncompleteWarning(true);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    // Mark preferences as completed if we're leaving the preferences step
    const isLeavingPreferences = steps[currentStep]?.id === 'preferences';
    if (isLeavingPreferences) {
      setPreferencesCompletedInSession(true);
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      const isNextStepFinalization = steps[nextStep]?.id === 'finalization';

      // If next step is finalization, validate first
      // IMPORTANT: If we're leaving preferences step, consider it as already completed for validation
      if (isNextStepFinalization) {
        const canAccess = canAccessFinalization();
        if (!canAccess) {
          return; // Validation failed, warning shown
        }
      }

      setCurrentStep(prev => prev + 1);

      // Update dashboard activeSection to keep URL and navigation in sync
      const nextStepId = steps[nextStep]?.id;
      if (nextStepId) {
        window.dispatchEvent(new CustomEvent('change-dashboard-section', {
          detail: { section: `mi-perfil:${nextStepId}` }
        }));
      }

      window.scrollTo(0, 0);
    } else {
      onComplete();
    }
  };

  // Auto-save preferences when clicking on Finalize step
  const handlePreferencesSave = async () => {
    // Si el paso actual es Preferences, auto-guardar antes de validar
    if (steps[currentStep]?.id === 'preferences') {
      return new Promise<boolean>((resolve) => {
        let hasResolved = false;

        // Escuchar eventos de éxito/error
        const handleSuccess = () => {
          if (!hasResolved) {
            hasResolved = true;
            setPreferencesCompletedInSession(true);
            cleanup();
            resolve(true);
          }
        };

        const handleError = () => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            resolve(false);
          }
        };

        const cleanup = () => {
          window.removeEventListener('auto-save-preferences-success', handleSuccess);
          window.removeEventListener('auto-save-preferences-error', handleError);
        };

        // Registrar listeners
        window.addEventListener('auto-save-preferences-success', handleSuccess);
        window.addEventListener('auto-save-preferences-error', handleError);

        // Disparar evento para que PreferencesSection guarde
        window.dispatchEvent(new CustomEvent('auto-save-preferences'));

        // Timeout de seguridad (5 segundos)
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            resolve(false);
          }
        }, 5000);
      });
    }
    return Promise.resolve(true);
  };

  // Check if user has premium plan (lowercase: 'pro', 'premium', 'enterprise')
  const isPremiumUser = profile?.plan && ['pro', 'premium', 'enterprise'].includes(profile.plan.toLowerCase());

  // En un perfil gestionado, `profile.plan` es el del PERFIL EDITADO, no el del
  // gestor que lo esta editando. Los perfiles gestionados se crean siempre con
  // plan 'free' y no tienen login propio, asi que la comprobacion de premium
  // fallaba siempre y el gestor recibia un "pasate a Pro" que le invitaba a
  // mejorar el plan de otra persona. Mientras la IA siga gateada por plan del
  // perfil, en modo gestionado no se ofrece.
  const isManagedProfile = Boolean(profile?.managed_by);

  const handleAIClick = () => {
    // Check if user has premium access
    if (!isPremiumUser) {
      setShowPremiumToast(true);
      setTimeout(() => setShowPremiumToast(false), 5000);
      return;
    }

    // Trigger AI for current section only
    if (currentStep === 0) {
      // Identity section - trigger AI summary generation
      window.dispatchEvent(new Event('generateAISummary'));
    } else if (currentStep === 1 || currentStep === 2 || currentStep === 3) {
      // Experience, Education, or Skills - toggle AI suggestions
      stepRef.current?.toggleAISuggestions?.();
    }
  };

  // Build steps array - only include finalization step for first-time users
  const baseSteps = [
    { id: 'identity', title: t.wizardSteps.identity, icon: UserCircleIcon, component: IdentitySection, props: { profile, onSave: onSaveIdentity, onNext: handleNext } },
    { id: 'experience', title: t.wizardSteps.experience, icon: BriefcaseIcon, component: ExperienceSection, props: { initialData: experiences, onSave: onSaveExperience, onNext: handleNext } },
    { id: 'education', title: t.wizardSteps.education, icon: AcademicCapIcon, component: EducationSection, props: { initialData: education, onSave: onSaveEducation, onNext: handleNext } },
    { id: 'skills', title: t.wizardSteps.skills, icon: WrenchScrewdriverIcon, component: SkillsSection, props: { initialData: skills, onSave: onSaveSkills, onNext: handleNext } },
    { id: 'languages', title: t.wizardSteps.languages, icon: LanguageIcon, component: LanguagesSection, props: { initialData: languages, onSave: onSaveLanguages, onNext: handleNext } },
    { id: 'portfolio', title: t.wizardSteps.portfolio, icon: FolderIcon, component: PortfolioSection, props: { initialData: portfolio, onSave: onSavePortfolio, onNext: handleNext } },
    { id: 'preferences', title: t.wizardSteps.preferences, icon: Cog6ToothIcon, component: PreferencesSection, props: { initialData: profile, onSave: onSavePreferences, onNext: handleNext } },
  ];

  // Only add finalization step if user hasn't completed wizard yet
  const steps = hasCompletedWizard
    ? baseSteps
    : [...baseSteps, { id: 'finalization', title: t.wizardSteps.finalize, icon: CheckBadgeIcon, component: FinalizationStep, props: { currentTemplate: profile?.template, currentSlug: profile?.slug, onComplete } }];

  // Initialize currentStep from initialStep prop
  useEffect(() => {
    if (initialStep) {
      const index = steps.findIndex(step => step.id === initialStep);
      if (index !== -1) {
        setCurrentStep(index);
      }
    }
  }, []);

  // Estado de cada paso, derivado de stepRules. Ya no es useState + useEffect con
  // veinte dependencias: al calcularse en el render no puede quedar desincronizado
  // de la puerta de finalizacion, que lee exactamente las mismas reglas.
  //
  // Obligatorio -> verde solo si NO le falta nada.
  // Opcional    -> verde si tiene contenido; neutro si esta vacio (no bloquea).
  const completedSteps = steps.reduce<number[]>((acc, step, index) => {
    const rule = stepRules[step.id];
    if (!rule) return acc;
    const done = rule.required ? rule.missing.length === 0 : rule.hasContent;
    if (done) acc.push(index);
    return acc;
  }, []);

  // Lo que falta para poder publicar, con el paso al que pertenece cada item para
  // que el aviso pueda llevar al usuario directamente alli.
  const missingItems = steps.flatMap((step, index) => {
    const rule = stepRules[step.id];
    if (!rule?.required) return [];
    return rule.missing.map(label => ({ label, stepIndex: index, stepTitle: step.title }));
  });

  // Lo que falta en el paso que se esta viendo ahora mismo, para avisar in situ en
  // vez de acumular el diagnostico hasta el final del recorrido.
  const currentStepMissing = stepRules[steps[currentStep]?.id]?.missing ?? [];
  const isCurrentStepOptional = stepRules[steps[currentStep]?.id]?.required === false;

  // Reset currentStep if it's out of bounds (happens when wizard completes and finalization step is removed)
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(0); // Go back to first step
    }
  }, [currentStep, steps.length]);

  const CurrentComponent = steps[currentStep]?.component as any;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-0 px-2 sm:px-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(index);
            const rule = stepRules[step.id];
            // Obligatorio y sin cumplir: se marca en ambar. Antes era gris, igual
            // que un paso opcional vacio, asi que nada distinguia "te falta esto
            // para publicar" de "esto puedes saltartelo".
            const needsAttention = Boolean(rule?.required && rule.missing.length > 0);

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={`flex flex-col items-center cursor-pointer group transition-all ${
                    isActive
                      ? 'text-cv-blue'
                      : isCompleted
                        ? 'text-green-600'
                        : needsAttention
                          ? 'text-amber-600 dark:text-amber-500'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  onClick={async () => {
                    // Check if trying to access finalization step
                    const isFinalizationStep = step.id === 'finalization';

                    if (isFinalizationStep) {
                      // Auto-guardar Preferences si estamos en ese paso
                      const saveSuccess = await handlePreferencesSave();

                      // Si el guardado falló (porque no hay campos llenos), no avanzar
                      if (!saveSuccess && steps[currentStep]?.id === 'preferences') {
                        return; // Error already shown by PreferencesSection
                      }

                      const canAccess = canAccessFinalization();
                      if (!canAccess) {
                        return; // Validation failed, warning already shown
                      }
                    }

                    // Allow navigation
                    setCurrentStep(index);
                    window.scrollTo(0, 0);
                  }}
                >
                  <div className={`
                    relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all
                    group-hover:scale-110 group-hover:shadow-md
                    ${isActive
                      ? 'border-cv-blue bg-blue-50 dark:bg-blue-900/20'
                      : isCompleted
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20 group-hover:border-green-700'
                        : needsAttention
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 group-hover:border-amber-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary group-hover:border-gray-400 dark:group-hover:border-gray-500'
                    }
                  `}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    {needsAttention && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-dark-bg-secondary"
                        title={rule.missing.join(' · ')}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium mt-1 sm:mt-2 max-w-[50px] sm:max-w-none text-center truncate ${isActive ? '' : 'hidden sm:block'}`}>{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-4 sm:w-10 mx-0.5 sm:mx-2 ${completedSteps.includes(index) ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contexto del paso actual.
          En movil el stepper solo muestra iconos (los titulos van ocultos salvo el
          activo), asi que sin esto el usuario no sabe donde esta ni cuanto queda.
          Tambien es donde se dice si el paso es opcional y que le falta, in situ,
          en lugar de acumular el diagnostico hasta el final del recorrido. */}
      <div className="-mt-4 mb-6 px-2">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {t.profileWizard.stepCounter
              .replace('{n}', String(currentStep + 1))
              .replace('{total}', String(steps.length))}
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">{steps[currentStep]?.title}</span>
          {isCurrentStepOptional && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {t.profileWizard.optional}
            </span>
          )}
        </div>

        {currentStepMissing.length > 0 && (
          <div className="mt-3 mx-auto max-w-xl rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1.5">
              {t.profileWizard.missingHere}
            </p>
            <ul className="space-y-1">
              {currentStepMissing.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isCurrentStepOptional && currentStepMissing.length === 0 && (
          <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            {t.profileWizard.optionalHint}
          </p>
        )}
      </div>

      {/* Incomplete Warning Toast */}
      {showIncompleteWarning && (
        <div
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] animate-fadeIn max-w-2xl w-full mx-4"
          style={{
            position: 'fixed',
            zIndex: 9999,
            top: '96px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto'
          }}
        >
          <div className="bg-white dark:bg-gray-800 border-l-4 border-red-500 px-6 py-5 rounded-lg shadow-2xl max-w-lg">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                  {t.profileWizard.completeYourProfile}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {t.profileWizard.toCreateCv}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                  <ul className="space-y-1">
                    {missingItems.map((item, idx) => (
                      <li key={idx}>
                        {/* Cada item lleva a su paso. Antes era texto plano y el
                            usuario tenia que deducir a que icono corresponder. */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowIncompleteWarning(false);
                            setCurrentStep(item.stepIndex);
                            window.scrollTo(0, 0);
                          }}
                          className="w-full flex items-start gap-2 text-left text-sm text-gray-800 dark:text-gray-200 rounded-md px-2 py-1.5 hover:bg-white dark:hover:bg-gray-800 hover:text-cv-blue dark:hover:text-blue-400 transition-colors group/item"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <span className="flex-1">
                            {item.label}
                            <span className="text-gray-400 dark:text-gray-500"> · {item.stepTitle}</span>
                          </span>
                          <span className="opacity-0 group-hover/item:opacity-100 transition-opacity text-xs font-medium flex-shrink-0 mt-0.5">
                            {t.profileWizard.goToFix}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {t.profileWizard.navigateToSections}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowIncompleteWarning(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors hover:scale-110 transform"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {showPremiumToast && (
        <div className="fixed bottom-8 right-28 z-[60] animate-fadeIn max-w-sm">
          <div className="bg-gradient-to-r from-cv-blue to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-blue-400/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">
                  {t.profileWizard.premiumFeature}
                </p>
                <p className="text-xs text-blue-100 mb-3">
                  {t.profileWizard.premiumAiDescription}
                </p>
                <button
                  onClick={() => {
                    setShowPremiumToast(false);
                    navigate(lang === 'es' ? '/precios' : '/pricing');
                  }}
                  className="w-full bg-white text-cv-blue px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-md"
                >
                  {t.profileWizard.viewPlans}
                </button>
              </div>
              <button
                onClick={() => setShowPremiumToast(false)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Optimization Floating Button - Fixed bottom right */}
      {/* Show button based on current section's AI support */}
      {!isManagedProfile && steps[currentStep] && ((currentStep === 0 && profile?.full_name) || // Identity has About Me with AI
        (currentStep === 1 && experiences.length > 0) || // Experience has AI
        (currentStep === 2 && education.length > 0) || // Education has AI
        currentStep === 3) && ( // Skills has AI
        <button
          onClick={handleAIClick}
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-cv-blue to-purple-600 text-white rounded-full hover:from-cv-blue-dark hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 flex items-center justify-center z-50 group"
          title={t.profileWizard.improveWithAi}
        >
          {/* Premium Badge */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(lang === 'es' ? '/precios' : '/pricing');
            }}
            className="absolute -top-1 -right-1 px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-[9px] sm:text-xs font-bold rounded-full shadow-lg flex items-center gap-0.5 sm:gap-1 animate-pulse z-10 cursor-pointer hover:from-amber-500 hover:to-yellow-600 transition-colors"
          >
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            PRO
          </span>
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t.profileWizard.improveWithAi}
          </span>
        </button>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 min-h-[400px] sm:min-h-[500px]">
        {steps[currentStep] && (
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
              {React.createElement(steps[currentStep].icon, { className: "w-6 h-6 sm:w-8 sm:h-8 text-cv-blue" })}
              {steps[currentStep].title}
            </h2>
          </div>
        )}
        
        {/* Pass ref to sections that support AI features */}
        {steps[currentStep] && (['identity', 'experience', 'education', 'skills'].includes(steps[currentStep].id)) ? (
          <CurrentComponent {...steps[currentStep].props} ref={stepRef} />
        ) : steps[currentStep] ? (
          <CurrentComponent {...steps[currentStep].props} />
        ) : null}
      </div>

    </div>
  );
};

export default ProfileWizard;
