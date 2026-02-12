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
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [missingSteps, setMissingSteps] = useState<string[]>([]);
  const [preferencesCompletedInSession, setPreferencesCompletedInSession] = useState(false);


  // Check if user has completed the wizard
  // IMPORTANTE: El wizard SOLO se considera completado si wizard_completed = true en la base de datos
  // Esto se marca cuando el usuario completa el paso de Finalización (selecciona template y slug)
  // Ya no usamos localStorage porque debe persistir entre dispositivos y navegadores
  const hasCompletedWizard = profile?.wizard_completed === true;

  // Check if all required steps are completed
  const checkRequiredSteps = (isCurrentlyLeavingPreferences = false) => {
    const missing = [];
    const details: string[] = [];

    // Validar Identidad - CAMPOS OBLIGATORIOS
    const identityIssues = [];
    if (!profile?.full_name) identityIssues.push(t.wizardValidation.fullName);
    if (!profile?.email) identityIssues.push(t.wizardValidation.email);
    if (!profile?.headline) identityIssues.push(t.wizardValidation.headline);
    if (!profile?.summary) identityIssues.push(t.wizardValidation.summary);
    if (!profile?.avatar_url) identityIssues.push(t.wizardValidation.photo);

    if (identityIssues.length > 0) {
      missing.push(t.wizardSteps.identity);
      details.push(...identityIssues.map(item => `• ${item} (${t.wizardSteps.identity})`));
    }

    // Validar Experiencia - AL MENOS 1
    if (!experiences || experiences.length === 0) {
      missing.push(t.wizardSteps.experience);
      details.push(`• ${t.wizardValidation.atLeastOneExperience}`);
    }

    // Validar Habilidades - AL MENOS 3
    if (!skills || skills.length < 3) {
      missing.push(t.wizardSteps.skills);
      details.push(`• ${t.wizardValidation.atLeastThreeSkills} (${t.wizardValidation.youHave} ${skills?.length || 0})`);
    }

    // Validar Preferencias - Debe completarse en esta sesión (pero los campos son opcionales)
    // Si estamos actualmente saliendo del paso de preferences, considerarlo como completado
    if (!preferencesCompletedInSession && !isCurrentlyLeavingPreferences) {
      missing.push(t.wizardSteps.preferences);
      details.push(`• ${t.wizardValidation.visitPreferences} (${t.wizardSteps.preferences})`);
    }

    return { sections: missing, details };
  };

  // Validate before allowing access to finalization step
  const canAccessFinalization = (isCurrentlyLeavingPreferences = false) => {
    if (hasCompletedWizard) return false; // Already completed wizard

    const validation = checkRequiredSteps(isCurrentlyLeavingPreferences);

    // Si hay validaciones pendientes, mostrar advertencia
    if (validation.details.length > 0) {
      setMissingSteps(validation.details);
      setShowIncompleteWarning(true);
      setTimeout(() => {
        setShowIncompleteWarning(false);
      }, 10000); // 10 segundos
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
        const canAccess = canAccessFinalization(isLeavingPreferences);
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

  // Initialize and update completed steps based on content
  useEffect(() => {
    const stepsWithContent: number[] = [];

    // Check each step for content
    if (profile?.full_name && profile?.email) {
      stepsWithContent.push(0); // identity
    }
    if (experiences && experiences.length > 0) {
      stepsWithContent.push(1); // experience
    }
    if (education && education.length > 0) {
      stepsWithContent.push(2); // education
    }
    if (skills && skills.length > 0) {
      stepsWithContent.push(3); // skills
    }
    if (languages && languages.length > 0) {
      stepsWithContent.push(4); // languages
    }
    if (portfolio && portfolio.length > 0) {
      stepsWithContent.push(5); // portfolio
    }
    // Preferences is completed if user has at least one preference saved
    const hasPreferences = profile?.job_seeking_status ||
                          profile?.availability ||
                          profile?.salary_min ||
                          profile?.salary_max ||
                          profile?.remote_preference ||
                          profile?.willing_to_relocate ||
                          (profile?.preferred_locations && profile.preferred_locations.length > 0) ||
                          (profile?.job_type && profile.job_type.length > 0);

    if (hasPreferences || preferencesCompletedInSession) {
      stepsWithContent.push(6); // preferences
    }
    // Finalization step is only completed when user has selected template and slug
    // Only track if finalization step exists (when wizard not completed)
    if (!hasCompletedWizard && profile?.template && profile?.slug) {
      stepsWithContent.push(7); // finalization
    }

    setCompletedSteps(stepsWithContent);
  }, [
    profile?.full_name,
    profile?.email,
    profile?.job_seeking_status,
    profile?.availability,
    profile?.salary_min,
    profile?.salary_max,
    profile?.remote_preference,
    profile?.willing_to_relocate,
    profile?.preferred_locations?.length,
    profile?.job_type?.length,
    profile?.template,
    profile?.slug,
    experiences?.length,
    education?.length,
    skills?.length,
    languages?.length,
    portfolio?.length,
    hasCompletedWizard,
    preferencesCompletedInSession
  ]);

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

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={`flex flex-col items-center cursor-pointer group transition-all ${
                    isActive ? 'text-cv-blue' : isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
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

                      // Validar con Preferences marcado como completado
                      const canAccess = canAccessFinalization(true);
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
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all
                    group-hover:scale-110 group-hover:shadow-md
                    ${isActive
                      ? 'border-cv-blue bg-blue-50 dark:bg-blue-900/20'
                      : isCompleted
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20 group-hover:border-green-700'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary group-hover:border-gray-400 dark:group-hover:border-gray-500'
                    }
                  `}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  {lang === 'es' ? 'Completa tu perfil' : 'Complete your profile'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {lang === 'es'
                    ? 'Para crear tu CV profesional, necesitas completar:'
                    : 'To create your professional CV, you need to complete:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {missingSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {lang === 'es'
                      ? 'Navega a las secciones correspondientes usando los iconos de arriba'
                      : 'Navigate to the corresponding sections using the icons above'}
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
                  {lang === 'es' ? 'Funcionalidad Premium' : 'Premium Feature'}
                </p>
                <p className="text-xs text-blue-100 mb-3">
                  {lang === 'es'
                    ? 'Las funcionalidades de IA están disponibles solo para usuarios Pro y Premium. Tu plan actual es Free.'
                    : 'AI features are only available for Pro and Premium users. Your current plan is Free.'}
                </p>
                <button
                  onClick={() => {
                    setShowPremiumToast(false);
                    navigate(lang === 'es' ? '/precios' : '/pricing');
                  }}
                  className="w-full bg-white text-cv-blue px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-md"
                >
                  {lang === 'es' ? 'Ver Planes' : 'View Plans'}
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
      {steps[currentStep] && ((currentStep === 0 && profile?.full_name) || // Identity has About Me with AI
        (currentStep === 1 && experiences.length > 0) || // Experience has AI
        (currentStep === 2 && education.length > 0) || // Education has AI
        currentStep === 3) && ( // Skills has AI
        <button
          onClick={handleAIClick}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-cv-blue to-purple-600 text-white rounded-full hover:from-cv-blue-dark hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 flex items-center justify-center z-50 group"
          title="Mejorar con IA"
        >
          {/* Premium Badge */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(lang === 'es' ? '/precios' : '/pricing');
            }}
            className="absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-pulse z-10 cursor-pointer hover:from-amber-500 hover:to-yellow-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            PREMIUM
          </span>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Mejorar con IA
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
