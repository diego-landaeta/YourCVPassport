import React, { useState, Suspense, lazy } from 'react';
import { SparklesIcon, BriefcaseIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import LoadingSpinner from '../LoadingSpinner';

// Lazy load tab components
const RecommendedJobsTab = lazy(() => import('./opportunities/RecommendedJobsTab'));
const AllJobsTab = lazy(() => import('./opportunities/AllJobsTab'));
const SavedJobsTab = lazy(() => import('./opportunities/SavedJobsTab'));

interface JobSearchSectionProps {
  profileId: string;
}

type TabId = 'recommended' | 'all' | 'saved';

interface Tab {
  id: TabId;
  label: { es: string; en: string };
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Job Search Section - Complete job discovery interface
 *
 * Features 3 tabs:
 * 1. Recommended - Jobs with best match score
 * 2. All Jobs - Full search with advanced filters
 * 3. Saved - Bookmarked jobs for later review
 */
const JobSearchSection: React.FC<JobSearchSectionProps> = ({ profileId }) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>('recommended');

  const tabs: Tab[] = [
    {
      id: 'recommended',
      label: { es: 'Recomendadas', en: 'Recommended' },
      icon: SparklesIcon
    },
    {
      id: 'all',
      label: { es: 'Todas', en: 'All Jobs' },
      icon: BriefcaseIcon
    },
    {
      id: 'saved',
      label: { es: 'Guardadas', en: 'Saved' },
      icon: BookmarkIcon
    }
  ];

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
            <RecommendedJobsTab
              profileId={profileId}
              onSwitchToAllJobs={() => setActiveTab('all')}
            />
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
      default:
        return LoadingFallback;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <BriefcaseIcon className="w-8 h-8 text-cv-blue dark:text-cv-blue-light" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {lang === 'es' ? 'Buscar Vacantes' : 'Search Jobs'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {lang === 'es'
                ? 'Encuentra ofertas personalizadas y gestiona tus favoritas'
                : 'Find personalized offers and manage your favorites'}
            </p>
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

export default JobSearchSection;
