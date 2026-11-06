import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import { H1_CLS, PanelSkeleton, PanelTabs, TEXT_META, FOCUS } from '../jobs/PanelBits';
import { usePanelText } from '../jobs/textosPanel';
import { usePanelCounts } from '../jobs/usePanelCounts';
import { jobsRootPath } from '../../lib/jobsFormat';
import DownloadTermsButton from '../legal/DownloadTermsButton';

// Lazy load tab components for better performance
const RecommendedJobsTab = lazy(() => import('./opportunities/RecommendedJobsTab'));
const AllJobsTab = lazy(() => import('./opportunities/AllJobsTab'));
const SavedJobsTab = lazy(() => import('./opportunities/SavedJobsTab'));
const MyApplicationsTab = lazy(() => import('./opportunities/MyApplicationsTab'));
const JobAlertsTab = lazy(() => import('./opportunities/JobAlertsTab'));

interface OpportunitiesSectionProps {
  profileId: string;
  defaultTab?: 'recommended' | 'all' | 'saved' | 'applications' | 'alerts';
  className?: string;
}

type TabId = 'recommended' | 'all' | 'saved' | 'applications' | 'alerts';

const DESCRIPTIONS: Record<TabId, { es: string; en: string }> = {
  recommended: { es: 'Ofertas con mejor compatibilidad para tu perfil', en: 'Best matching jobs for your profile' },
  all: { es: 'Explora todas las vacantes disponibles', en: 'Explore all available positions' },
  saved: { es: 'Ofertas que has guardado para revisar más tarde', en: 'Jobs you saved for later review' },
  applications: { es: 'Seguimiento de tus postulaciones', en: 'Track your job applications' },
  alerts: { es: 'Avisos de ofertas nuevas según tus preferencias', en: 'New job alerts based on your preferences' },
};

/**
 * Opportunities Section - Complete job management interface
 *
 * Pestanas: Recomendadas, Mis candidaturas, Guardadas y Alertas, con contador. «Todas las ofertas»
 * es un enlace al listado publico (el unico buscador de ofertas).
 */
const OpportunitiesSection: React.FC<OpportunitiesSectionProps> = ({
  profileId,
  defaultTab = 'recommended',
  className = ''
}) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const tx = usePanelText();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const { counts, setCount } = usePanelCounts(user?.id || profileId);
  const onRecommended = useCallback((n: number) => setCount('recommended', n), [setCount]);
  const onApplications = useCallback((n: number) => setCount('applications', n), [setCount]);
  const onSaved = useCallback((n: number) => setCount('saved', n), [setCount]);

  const tabs = [
    { id: 'recommended', label: tx.tabRecommended, count: counts.recommended },
    { id: 'applications', label: tx.tabApplications, count: counts.applications },
    { id: 'saved', label: tx.tabSaved, count: counts.saved },
    { id: 'alerts', label: tx.tabAlerts },
  ];

  // Listen for custom events to change tab
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      if (tab && ['recommended', 'all', 'saved', 'applications', 'alerts'].includes(tab)) {
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
    const LoadingFallback = <PanelSkeleton rows={3} label={t.dashboard.loading} />;

    switch (activeTab) {
      case 'recommended':
        return (
          <Suspense fallback={LoadingFallback}>
            <RecommendedJobsTab profileId={profileId} onCount={onRecommended} />
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
            <SavedJobsTab profileId={profileId} onCount={onSaved} />
          </Suspense>
        );
      case 'applications':
        return (
          <Suspense fallback={LoadingFallback}>
            <MyApplicationsTab profileId={profileId} onCount={onApplications} />
          </Suspense>
        );
      case 'alerts':
        return (
          <Suspense fallback={LoadingFallback}>
            <JobAlertsTab profileId={profileId} />
          </Suspense>
        );
      default:
        return LoadingFallback;
    }
  };

  const allLink = (
    <Link to={jobsRootPath(lang)} className={`inline-flex items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-cv-blue hover:underline hover:underline-offset-4 dark:text-cv-blue-light ${FOCUS}`}>
      {tx.allOffersLink}
      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
    </Link>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className={H1_CLS}>{t.dashboard.opportunities.jobOpportunities}</h1>
          <p className={`mt-2 max-w-prose text-base ${TEXT_META}`}>{DESCRIPTIONS[activeTab][lang]}</p>
        </div>
        <DownloadTermsButton className="shrink-0" />
      </header>

      <PanelTabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} label={tx.tabsLabel} trailing={allLink} />
      <div className="sm:hidden">{allLink}</div>

      <div id="ppanel" role="tabpanel" aria-labelledby={`ptab-${activeTab}`} className="min-h-[24rem]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default OpportunitiesSection;
