import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  SparklesIcon,
  BriefcaseIcon,
  BookmarkIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import LoadingSpinner from '../shared/LoadingSpinner';

// Lazy load tab components for better performance
const RecommendedJobsTab = lazy(() => import('./opportunities/RecommendedJobsTab'));
const AllJobsTab = lazy(() => import('./opportunities/AllJobsTab'));
const SavedJobsTab = lazy(() => import('./opportunities/SavedJobsTab'));
const MyApplicationsTab = lazy(() => import('./opportunities/MyApplicationsTab'));

interface OpportunitiesSectionProps {
  profileId: string;
  defaultTab?: 'recommended' | 'all' | 'saved' | 'applications';
  className?: string;
}

type TabId = 'recommended' | 'all' | 'saved' | 'applications';

interface Tab {
  id: TabId;
  label: {
    es: string;
    en: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  description: {
    es: string;
    en: string;
  };
}

/**
 * Opportunities Section - Complete job management interface
 *
 * Features 4 tabs:
 * 1. Recommended - Jobs with best match score for user
 * 2. All Jobs - Full search with advanced filters
 * 3. Saved - Bookmarked jobs for later review
 * 4. My Applications - Track application status with timeline
 */
const OpportunitiesSection: React.FC<OpportunitiesSectionProps> = ({
  profileId,
  defaultTab = 'recommended',
  className = ''
}) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'recommended',
      label: { es: 'Recomendadas', en: 'Recommended' },
      icon: SparklesIcon,
      description: {
        es: 'Ofertas con mejor compatibilidad para tu perfil',
        en: 'Best matching jobs for your profile'
      }
    },
    {
      id: 'all',
      label: { es: 'Todas las Ofertas', en: 'All Jobs' },
      icon: BriefcaseIcon,
      description: {
        es: 'Explora todas las vacantes disponibles',
        en: 'Explore all available positions'
      }
    },
    {
      id: 'saved',
      label: { es: 'Guardadas', en: 'Saved' },
      icon: BookmarkIcon,
      description: {
        es: 'Ofertas que has guardado para revisar más tarde',
        en: 'Jobs you saved for later review'
      }
    },
    {
      id: 'applications',
      label: { es: 'Mis Aplicaciones', en: 'My Applications' },
      icon: DocumentCheckIcon,
      description: {
        es: 'Seguimiento de tus postulaciones',
        en: 'Track your job applications'
      }
    }
  ];

  // Listen for custom events to change tab
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      if (tab && ['recommended', 'all', 'saved', 'applications'].includes(tab)) {
        setActiveTab(tab as TabId);
      }
    };

    window.addEventListener('change-opportunities-tab' as any, handleTabChange);

    return () => {
      window.removeEventListener('change-opportunities-tab' as any, handleTabChange);
    };
  }, []);

  // Render tab content
  const renderTabContent = () => {
    const LoadingFallback = (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner message={t.dashboard.loading} size="large" />
      </div>
    );

    switch (activeTab) {
      case 'recommended':
        return (
          <Suspense fallback={LoadingFallback}>
            <RecommendedJobsTab profileId={profileId} />
          </Suspense>
        );
      case 'all':
        return (
          <Suspense fallback={LoadingFallback}>
            <AllJobsTab profileId={profileId} />
          </Suspense>
        );
      case 'saved':
        return (
          <Suspense fallback={LoadingFallback}>
            <SavedJobsTab profileId={profileId} />
          </Suspense>
        );
      case 'applications':
        return (
          <Suspense fallback={LoadingFallback}>
            <MyApplicationsTab profileId={profileId} />
          </Suspense>
        );
      default:
        return LoadingFallback;
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t.dashboard.opportunities.jobOpportunities}
            </h1>
            {activeTabData && (
              <p className="text-gray-600 dark:text-gray-400">
                {activeTabData.description[lang]}
              </p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap
                    ${
                      isActive
                        ? 'border-cv-blue dark:border-cv-blue-light text-cv-blue dark:text-cv-blue-light'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5 transition-all
                      ${
                        isActive
                          ? 'text-cv-blue dark:text-cv-blue-light'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                      }
                    `}
                  />
                  <span>{tab.label[lang]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default OpportunitiesSection;
