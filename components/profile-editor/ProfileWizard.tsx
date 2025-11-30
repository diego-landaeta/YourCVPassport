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
  const stepRef = React.useRef<any>(null);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      onComplete();
    }
  };

  const steps = [
    { id: 'identity', title: 'Identidad', icon: UserCircleIcon, component: IdentitySection, props: { profile, onSave: onSaveIdentity, onNext: handleNext } },
    { id: 'experience', title: 'Experiencia', icon: BriefcaseIcon, component: ExperienceSection, props: { initialData: experiences, onSave: onSaveExperience, onNext: handleNext } },
    { id: 'education', title: 'Educación', icon: AcademicCapIcon, component: EducationSection, props: { initialData: education, onSave: onSaveEducation, onNext: handleNext } },
    { id: 'skills', title: 'Habilidades', icon: WrenchScrewdriverIcon, component: SkillsSection, props: { initialData: skills, onSave: onSaveSkills, onNext: handleNext } },
    { id: 'languages', title: 'Idiomas', icon: LanguageIcon, component: LanguagesSection, props: { initialData: languages, onSave: onSaveLanguages, onNext: handleNext } },
    { id: 'portfolio', title: 'Portafolio', icon: FolderIcon, component: PortfolioSection, props: { initialData: portfolio, onSave: onSavePortfolio, onNext: handleNext } },
    { id: 'preferences', title: 'Preferencias', icon: Cog6ToothIcon, component: PreferencesSection, props: { initialData: profile, onSave: onSavePreferences, onNext: handleNext } },
    { id: 'finalization', title: 'Finalizar', icon: CheckBadgeIcon, component: FinalizationStep, props: { currentTemplate: profile?.template, currentSlug: profile?.slug, onComplete } }
  ];

  // Find initial step index based on initialStep prop
  const getInitialStepIndex = () => {
    if (initialStep) {
      const index = steps.findIndex(step => step.id === initialStep);
      return index !== -1 ? index : 0;
    }
    return 0;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStepIndex());
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

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
    if (profile) {
      stepsWithContent.push(6); // preferences
    }
    // Finalization step is only completed when template and slug are set
    if (profile?.template && profile?.slug) {
      stepsWithContent.push(7); // finalization
    }

    setCompletedSteps(stepsWithContent);
  }, [profile?.full_name, profile?.email, profile?.template, profile?.slug, experiences?.length, education?.length, skills?.length, languages?.length, portfolio?.length]);

  // Update currentStep when initialStep changes
  useEffect(() => {
    if (initialStep) {
      const index = steps.findIndex(step => step.id === initialStep);
      if (index !== -1 && index !== currentStep) {
        setCurrentStep(index);
        window.scrollTo(0, 0);
      }
    }
  }, [initialStep]);

  const CurrentComponent = steps[currentStep].component as any;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-center min-w-max px-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(index);

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex flex-col items-center cursor-pointer group transition-all ${
                    isActive ? 'text-cv-blue' : isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  onClick={() => {
                    // Allow free navigation to any step
                    setCurrentStep(index);
                    window.scrollTo(0, 0);
                  }}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    group-hover:scale-110 group-hover:shadow-md
                    ${isActive
                      ? 'border-cv-blue bg-blue-50 dark:bg-blue-900/20'
                      : isCompleted
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20 group-hover:border-green-700'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary group-hover:border-gray-400 dark:group-hover:border-gray-500'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium mt-2">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-10 mx-2 ${completedSteps.includes(index) ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Optimization Floating Button - Fixed bottom right */}
      {/* Show button based on current section's AI support */}
      {((currentStep === 0 && profile?.full_name) || // Identity has About Me with AI
        (currentStep === 1 && experiences.length > 0) || // Experience has AI
        (currentStep === 2 && education.length > 0) || // Education has AI
        (currentStep === 3 && skills.length > 0)) && ( // Skills has AI
        <button
          onClick={() => {
            // Trigger AI for current section only
            if (currentStep === 0) {
              // Identity section - trigger AI summary generation
              window.dispatchEvent(new Event('generateAISummary'));
            } else if (currentStep === 1 || currentStep === 2 || currentStep === 3) {
              // Experience, Education, or Skills - toggle AI suggestions
              stepRef.current?.toggleAISuggestions?.();
            }
          }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-cv-blue to-purple-600 text-white rounded-full hover:from-cv-blue-dark hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 flex items-center justify-center z-50 group"
          title="Mejorar con IA"
        >
          {/* Premium Badge */}
          <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-pulse z-10">
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

    </div>
  );
};

export default ProfileWizard;
