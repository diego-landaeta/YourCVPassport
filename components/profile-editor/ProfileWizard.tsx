import React, { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { 
  UserCircleIcon, 
  BriefcaseIcon, 
  AcademicCapIcon, 
  WrenchScrewdriverIcon, 
  LanguageIcon, 
  FolderIcon, 
  Cog6ToothIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Import sections
import IdentitySection from './IdentitySection';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import LanguagesSection from './LanguagesSection';
import PortfolioSection from './PortfolioSection';
import PreferencesSection from './PreferencesSection';

import AIImprovementStep from './AIImprovementStep';

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

  onComplete
}) => {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const stepRef = React.useRef<any>(null);

  const steps = [
    { id: 'identity', title: 'Identidad', icon: UserCircleIcon, component: IdentitySection, props: { profile, onSave: onSaveIdentity } },
    { id: 'experience', title: 'Experiencia', icon: BriefcaseIcon, component: ExperienceSection, props: { experiences, onSave: onSaveExperience } },
    { id: 'education', title: 'Educación', icon: AcademicCapIcon, component: EducationSection, props: { education, onSave: onSaveEducation } },
    { id: 'skills', title: 'Habilidades', icon: WrenchScrewdriverIcon, component: SkillsSection, props: { skills, onSave: onSaveSkills } },
    { id: 'languages', title: 'Idiomas', icon: LanguageIcon, component: LanguagesSection, props: { languages, onSave: onSaveLanguages } },
    { id: 'portfolio', title: 'Portafolio', icon: FolderIcon, component: PortfolioSection, props: { items: portfolio, onSave: onSavePortfolio } },
    { id: 'preferences', title: 'Preferencias', icon: Cog6ToothIcon, component: PreferencesSection, props: { preferences: profile, onSave: onSavePreferences } },
    { id: 'ai-improvement', title: 'Mejora con IA', icon: SparklesIcon, component: AIImprovementStep, props: { 
        experiences, 
        education, 
        onSaveExperience, 
        onSaveEducation,
        onComplete 
      } 
    }
  ];

  const handleNext = async () => {
    try {
      // Validate current step if it supports validation
      if (stepRef.current && stepRef.current.submit) {
        const isValid = await stepRef.current.submit();
        if (!isValid) {
          return;
        }
      }

      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        onComplete();
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const CurrentComponent = steps[currentStep].component;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max px-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(index) || index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex flex-col items-center cursor-pointer group ${
                    isActive ? 'text-cv-blue' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                  onClick={() => {
                    // Only allow clicking on completed steps or the current step
                    if (completedSteps.includes(index) || index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isActive 
                      ? 'border-cv-blue bg-blue-50 dark:bg-blue-900/20' 
                      : isCompleted 
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary'
                    }
                  `}>
                    {isCompleted && !isActive ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium mt-2">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-10 mx-2 ${index < currentStep ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[500px]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {React.createElement(steps[currentStep].icon, { className: "w-8 h-8 text-cv-blue" })}
            {steps[currentStep].title}
          </h2>
        </div>
        
        {/* Pass ref only to IdentitySection for now to avoid warnings on others */}
        {steps[currentStep].id === 'identity' ? (
          <CurrentComponent {...steps[currentStep].props} ref={stepRef} />
        ) : (
          <CurrentComponent {...steps[currentStep].props} />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-6 bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all
              ${currentStep === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
              }
            `}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Anterior
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-2.5 bg-cv-blue text-white rounded-lg font-bold shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
            >
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              {currentStep < steps.length - 1 && <ArrowRightIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileWizard;
