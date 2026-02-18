/**
 * Usage Stats Widget
 *
 * Displays user's current plan usage statistics in the dashboard
 * Shows ATS exports, AI requests, and stamp usage
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsageLimits, PLAN_INFO, FeatureType } from '../../hooks/useUsageLimits';
import { useTranslations } from '../../hooks/useTranslations';
import {
  SparklesIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/solid';
import { Crown } from 'lucide-react';

interface UsageStatsWidgetProps {
  compact?: boolean;
}

// Feature icons mapping
const FEATURE_ICONS: Record<FeatureType, React.FC<{ className?: string }>> = {
  ats_export: DocumentArrowDownIcon,
  ai_request: SparklesIcon,
  stamp_request: ShieldCheckIcon,
  profile_view: ArrowTrendingUpIcon,
};

export function UsageStatsWidget({ compact = false }: UsageStatsWidgetProps) {
  const translations = useTranslations();
  const us = translations.dashboard.usageStats;
  const navigate = useNavigate();
  const { usageStats, isLoading, fetchUsageStats, getCurrentPlan } = useUsageLimits();

  const currentPlan = getCurrentPlan();
  const planInfo = PLAN_INFO[currentPlan];

  // Feature name/description mapping using translation keys
  const featureTranslations: Record<string, { name: string; description: string }> = {
    ats_export: {
      name: us.atsExportName,
      description: us.atsExportDescription,
    },
    ai_request: {
      name: us.aiRequestName,
      description: us.aiRequestDescription,
    },
    stamp_request: {
      name: us.verificationsName,
      description: us.verificationsDescription,
    },
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Compact version for sidebar
  if (compact) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{us.title}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planInfo.badge}`}>
            {planInfo.name}
          </span>
        </div>

        {/* Quick Stats */}
        <div className="space-y-2">
          {(['ats_export', 'ai_request', 'stamp_request'] as FeatureType[]).map((feature) => {
            const stats = usageStats?.[feature];
            const Icon = FEATURE_ICONS[feature];
            const isNotAvailable = stats?.allowed === false;
            const isUnlimited = !isNotAvailable && stats?.limit === 'unlimited';
            const percentage = isUnlimited || isNotAvailable ? 0 : stats ? Math.min(100, (stats.used / (stats.limit as number)) * 100) : 0;

            return (
              <div key={feature} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isNotAvailable ? 'text-gray-300' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`${isNotAvailable ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                      {featureTranslations[feature].name}
                    </span>
                    <span className={`font-medium ${isNotAvailable ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {isNotAvailable ? (
                        <span className="text-gray-400 dark:text-gray-500">{us.notAvailable}</span>
                      ) : isUnlimited ? (
                        <span className="text-green-600 dark:text-green-400">{us.unlimited}</span>
                      ) : (
                        `${stats?.used || 0}/${stats?.limit || 0}`
                      )}
                    </span>
                  </div>
                  {!isUnlimited && !isNotAvailable && (
                    <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade Button for Free Users */}
        {currentPlan === 'free' && (
          <button
            onClick={() => navigate('/pricing')}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
          >
            <Crown className="w-3.5 h-3.5" />
            {us.upgrade}
          </button>
        )}
      </div>
    );
  }

  // Full version for main dashboard
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{us.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{us.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${planInfo.badge}`}>
            {planInfo.name}
          </span>
          {currentPlan === 'free' && (
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
            >
              <Crown className="w-4 h-4" />
              {us.upgrade}
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['ats_export', 'ai_request', 'stamp_request'] as FeatureType[]).map((feature) => {
          const stats = usageStats?.[feature];
          const Icon = FEATURE_ICONS[feature];
          const isNotAvailable = stats?.allowed === false;
          const isUnlimited = !isNotAvailable && stats?.limit === 'unlimited';
          const percentage = isUnlimited || isNotAvailable ? 0 : stats ? Math.min(100, (stats.used / (stats.limit as number)) * 100) : 0;
          const isNearLimit = !isNotAvailable && percentage >= 80;
          const isAtLimit = !isNotAvailable && percentage >= 100;

          return (
            <div
              key={feature}
              className={`p-4 rounded-xl border transition-all ${
                isNotAvailable
                  ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-60'
                  : isAtLimit
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : isNearLimit
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isNotAvailable
                    ? 'bg-gray-100 dark:bg-gray-700/30'
                    : isAtLimit
                    ? 'bg-red-100 dark:bg-red-800/30'
                    : isNearLimit
                    ? 'bg-amber-100 dark:bg-amber-800/30'
                    : 'bg-blue-100 dark:bg-blue-800/30'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isNotAvailable
                      ? 'text-gray-400 dark:text-gray-500'
                      : isAtLimit
                      ? 'text-red-600 dark:text-red-400'
                      : isNearLimit
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                {isNotAvailable && (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">
                    {us.notAvailable}
                  </span>
                )}
                {isUnlimited && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    {us.unlimited}
                  </span>
                )}
              </div>

              <h4 className={`font-semibold mb-1 ${isNotAvailable ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {featureTranslations[feature].name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {featureTranslations[feature].description}
              </p>

              {/* Usage Display */}
              <div className="mt-auto">
                {isNotAvailable ? (
                  <div className="text-center py-2">
                    <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                      {us.notIncludedInPlan}
                    </div>
                  </div>
                ) : isUnlimited ? (
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ∞
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.used || 0}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        / {stats?.limit || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats?.remaining || 0} {us.remaining}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Period Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {us.periodInfo}
        </p>
      </div>
    </div>
  );
}

export default UsageStatsWidget;
