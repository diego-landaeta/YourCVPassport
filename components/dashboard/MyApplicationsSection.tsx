import React, { useState, useMemo } from 'react';
import { DocumentCheckIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import MyApplicationsTab from './opportunities/MyApplicationsTab';
import { JobApplicationStatus, ACTIVE_APPLICATION_STATUSES } from '../../hooks/useJobApplications';

interface MyApplicationsSectionProps {
  profileId: string;
}

type FilterId = 'all' | 'active' | 'offers' | 'hired' | 'rejected';

interface StatusFilter {
  id: FilterId;
  labelKey: 'filterAll' | 'filterActive' | 'filterOffers' | 'filterAccepted' | 'filterRejected';
  color: string;
}

/**
 * My Applications Section - Complete application tracking interface
 *
 * Features:
 * - View all applications with timeline
 * - Simplified filters (All, Active, Offers, Hired, Rejected)
 * - Statistics overview
 * - Quick status changes
 */
const MyApplicationsSection: React.FC<MyApplicationsSectionProps> = ({ profileId }) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('all');

  const statusFilters: StatusFilter[] = [
    {
      id: 'all',
      labelKey: 'filterAll',
      color: 'bg-blue-600 text-white'
    },
    {
      id: 'active',
      labelKey: 'filterActive',
      color: 'bg-orange-500 text-white'
    },
    {
      id: 'offers',
      labelKey: 'filterOffers',
      color: 'bg-green-600 text-white'
    },
    {
      id: 'hired',
      labelKey: 'filterAccepted',
      color: 'bg-emerald-600 text-white'
    },
    {
      id: 'rejected',
      labelKey: 'filterRejected',
      color: 'bg-red-600 text-white'
    }
  ];

  // Map filter to actual status filter for the hook
  const actualStatusFilter = useMemo((): JobApplicationStatus[] | undefined => {
    switch (selectedFilter) {
      case 'all':
        return undefined; // Show all
      case 'active':
        return ACTIVE_APPLICATION_STATUSES; // NEW, REVIEWING, SHORTLISTED, INTERVIEW, OFFER
      case 'offers':
        return ['OFFER'];
      case 'hired':
        return ['HIRED'];
      case 'rejected':
        return ['REJECTED'];
      default:
        return undefined;
    }
  }, [selectedFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <DocumentCheckIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t.dashboard.opportunities.myApplications}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t.dashboard.opportunities.myApplicationsDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <FunnelIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.dashboard.opportunities.filterByStatus}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    selectedFilter === filter.id
                      ? `${filter.color} shadow-lg`
                      : `${filter.color} opacity-60 hover:opacity-100`
                  }
                `}
              >
                {t.dashboard.opportunities[filter.labelKey]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Content with Filter */}
      <MyApplicationsTab
        profileId={profileId}
        statusFilter={actualStatusFilter}
      />
    </div>
  );
};

export default MyApplicationsSection;
