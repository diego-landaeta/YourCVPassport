import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { H1_CLS, PanelSkeleton, PanelTabs, TEXT_META } from '../jobs/PanelBits';
import { usePanelText } from '../jobs/textosPanel';
import { usePanelCounts } from '../jobs/usePanelCounts';

// Lazy load tab components
const RecommendedJobsTab = lazy(() => import('./opportunities/RecommendedJobsTab'));
const AllJobsTab = lazy(() => import('./opportunities/AllJobsTab'));
const SavedJobsTab = lazy(() => import('./opportunities/SavedJobsTab'));
const JobAlertsTab = lazy(() => import('./opportunities/JobAlertsTab'));

interface JobSearchSectionProps {
  profileId: string;
}

type TabId = 'recommended' | 'all' | 'saved' | 'alerts';

/**
 * Job Search Section - Complete job discovery interface
 *
 * Pestanas con texto y contador: Recomendadas, Todas (lleva al listado), Guardadas y Alertas.
 */
const JobSearchSection: React.FC<JobSearchSectionProps> = ({ profileId }) => {
  const t = useTranslations();
  const tx = usePanelText();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('recommended');
  const { counts, setCount } = usePanelCounts(user?.id || profileId);
  const onRecommended = useCallback((n: number) => setCount('recommended', n), [setCount]);
  const onSaved = useCallback((n: number) => setCount('saved', n), [setCount]);

  const tabs = [
    { id: 'recommended', label: tx.tabRecommended, count: counts.recommended },
    // Lleva al listado publico (el buscador propio del panel se retiro)
    { id: 'all', label: tx.tabAll },
    { id: 'saved', label: tx.tabSaved, count: counts.saved },
    { id: 'alerts', label: tx.tabAlerts },
  ];

  const renderTabContent = () => {
    const LoadingFallback = <PanelSkeleton rows={3} label={t.dashboard.loading} />;

    switch (activeTab) {
      case 'recommended':
        return (
          <Suspense fallback={LoadingFallback}>
            <RecommendedJobsTab
              profileId={profileId}
              onSwitchToAllJobs={() => setActiveTab('all')}
              onCount={onRecommended}
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
            <SavedJobsTab profileId={profileId} onCount={onSaved} />
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className={H1_CLS}>{t.dashboard.opportunities.searchJobs}</h1>
        <p className={`mt-2 max-w-prose text-base ${TEXT_META}`}>{t.dashboard.opportunities.searchJobsDescription}</p>
      </header>

      <PanelTabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} label={tx.tabsLabel} idPrefix="jtab" panelId="jpanel" />

      <div id="jpanel" role="tabpanel" aria-labelledby={`jtab-${activeTab}`} className="min-h-[24rem]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default JobSearchSection;
