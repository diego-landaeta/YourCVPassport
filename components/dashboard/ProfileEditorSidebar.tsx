import React from 'react';
import { CheckCircleIcon, CircleStackIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { useTranslations } from '../../hooks/useTranslations';

interface ProfileEditorSidebarProps {
  activeSubsection: string | null;
  onSubsectionChange: (subsection: string) => void;
  profile: any;
  lastSaved?: string;
  saveMessage?: string;
  experiencesCount?: number;
  educationCount?: number;
  skillsCount?: number;
  languagesCount?: number;
  portfolioCount?: number;
}

interface SubsectionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  checkComplete: (profile: any) => boolean;
}

const ProfileEditorSidebar: React.FC<ProfileEditorSidebarProps> = ({
  activeSubsection,
  onSubsectionChange,
  profile,
  lastSaved,
  saveMessage,
  experiencesCount = 0,
  educationCount = 0,
  skillsCount = 0,
  languagesCount = 0,
  portfolioCount = 0
}) => {
  const translations = useTranslations();
  const t = translations.dashboard.editor;

  // Check if AI is available
  // @ts-ignore
  const isAIAvailable = Boolean(import.meta.env?.VITE_GOOGLE_AI_API_KEY);

  const subsections: SubsectionItem[] = [
    {
      id: 'identity',
      label: translations.dashboard.identity.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      checkComplete: (p) => !!p?.full_name && !!p?.headline,
    },
    {
      id: 'experience',
      label: translations.dashboard.cards.experience.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      checkComplete: () => experiencesCount > 0,
    },
    {
      id: 'education',
      label: translations.dashboard.cards.education.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      checkComplete: () => educationCount > 0,
    },
    {
      id: 'skills',
      label: translations.dashboard.cards.skills.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      checkComplete: () => skillsCount > 0,
    },
    {
      id: 'languages',
      label: translations.dashboard.preferences.language.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      checkComplete: () => languagesCount > 0,
    },
    {
      id: 'portfolio',
      label: translations.dashboard.cards.portfolio.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      checkComplete: () => portfolioCount > 0,
    },
    {
      id: 'preferences',
      label: translations.dashboard.preferences.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      checkComplete: (p) => {
        // Verifica si hay preferencias laborales guardadas
        return (
          p?.availability ||
          p?.salary_min ||
          p?.salary_max ||
          p?.work_type?.length > 0 ||
          p?.preferred_locations?.length > 0 ||
          p?.willing_to_relocate !== undefined
        );
      },
    },
  ];

  return (
    <div className="fixed left-64 top-0 h-screen w-72 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-border">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t.subtitle}
        </p>

        {/* Last Saved */}
        {lastSaved && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.lastSaved(lastSaved)}
          </p>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className={`mt-3 p-2 rounded text-xs ${
            saveMessage.includes('Failed') || saveMessage.includes('Error')
              ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200'
              : 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200'
          }`}>
            {saveMessage}
          </div>
        )}
      </div>

      {/* Subsections List */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {subsections.map((item) => {
            const isComplete = item.checkComplete(profile);
            const isActive = activeSubsection === item.id;
            const isAISection = item.id === 'ai-assistant';
            const isDisabled = isAISection && !isAIAvailable;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onSubsectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cv-blue text-white'
                      : isDisabled
                      ? 'text-gray-400 dark:text-gray-600 opacity-60 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
                  }`}
                  title={isDisabled ? 'Asistente de IA no disponible' : ''}
                >
                  <div className={isActive ? 'text-white' : isDisabled ? 'text-gray-400' : 'text-cv-blue'}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                  {isDisabled && (
                    <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                      ⚠️
                    </span>
                  )}
                  {!isDisabled && isComplete && !isActive && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  )}
                  {!isDisabled && !isComplete && !isActive && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default ProfileEditorSidebar;
