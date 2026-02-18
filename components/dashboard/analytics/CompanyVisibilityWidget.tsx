import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '../../../hooks/useTranslations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CountryData {
  country: string;
  views: number;
}

interface AnalyticsSummary {
  views: number;
  clicks: number;
  unique_visitors: number;
}

interface RecentView {
  viewed_at: string;
  city?: string;
  country?: string;
  referrer?: string;
}

interface CompanyVisibilityWidgetProps {
  isPremium?: boolean;
  topCountries?: CountryData[];
  summary?: AnalyticsSummary;
  recentViews?: RecentView[];
  growthPercentage?: number;
}

/**
 * CompanyVisibilityWidget - Premium feature teaser for analytics
 *
 * Shows blurred preview with upgrade CTA for free users
 * Shows actual stats for premium users (when implemented)
 */
const CompanyVisibilityWidget: React.FC<CompanyVisibilityWidgetProps> = ({
  isPremium = false,
  topCountries = [],
  summary = { views: 0, clicks: 0, unique_visitors: 0 },
  recentViews = [],
  growthPercentage = 0
}) => {
  const navigate = useNavigate();
  const t = useTranslations();
  const c = t.dashboard.analytics.companyWidget;

  const COLORS = {
    primary: '#6366F1',
  };

  // Helper to get time ago
  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const viewDate = new Date(date);
    const diffMs = now.getTime() - viewDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return c.minutesAgo(diffMins);
    } else if (diffHours < 24) {
      return c.hoursAgo(diffHours);
    } else {
      return c.daysAgo(diffDays);
    }
  };

  // Get initials from location
  const getInitials = (city?: string, country?: string): string => {
    if (city) {
      return city.substring(0, 2).toUpperCase();
    }
    if (country) {
      return country.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Determine action type from referrer
  const getActionType = (referrer?: string): string => {
    if (!referrer || referrer === '') {
      return c.directAccess;
    }
    const lower = referrer.toLowerCase();
    if (lower.includes('linkedin')) return c.viaLinkedIn;
    if (lower.includes('google')) return c.googleSearch;
    return c.viewedProfile;
  };

  const checkIcon = (
    <svg className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  const featureItems = [
    { title: c.features.identifyVisitors, desc: c.features.identifyVisitorsDesc },
    { title: c.features.realTimeActivity, desc: c.features.realTimeActivityDesc },
    { title: c.features.geoAnalysis, desc: c.features.geoAnalysisDesc },
    { title: c.features.trafficSources, desc: c.features.trafficSourcesDesc },
    { title: c.features.monthGrowth, desc: c.features.monthGrowthDesc },
    { title: c.features.completeHistory, desc: c.features.completeHistoryDesc },
  ];

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Content - hidden for non-premium, only show for premium */}
      {isPremium ? (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <EyeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {c.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {c.last30Days}
              </p>
            </div>
          </div>
          {growthPercentage !== 0 && (
            <span className={`px-3 py-1 ${growthPercentage > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'} text-xs font-bold rounded-full`}>
              {growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}% {c.thisMonth}
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.views}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {c.totalViews}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.unique_visitors}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {c.uniqueVisitors}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.clicks}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {c.ctaClicks}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {c.recentActivity}
          </h4>

          {recentViews.length > 0 ? (
            recentViews.slice(0, 5).map((view, index) => {
              const colors = [
                { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', gradient: 'from-purple-500 to-indigo-500', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400' },
                { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', gradient: 'from-green-500 to-teal-500', badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' },
                { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', gradient: 'from-blue-500 to-cyan-500', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' },
                { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-500', gradient: 'from-orange-500 to-red-500', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' },
                { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-500', gradient: 'from-pink-500 to-rose-500', badge: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-400' },
              ];
              const color = colors[index % colors.length];

              return (
                <div key={index} className={`flex items-start gap-3 p-3 ${color.bg} rounded-lg border-l-4 ${color.border}`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${color.gradient} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                    {getInitials(view.city, view.country)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {view.city && view.country ? `${view.city}, ${view.country}` : view.country || c.anonymousVisitor}
                      </span>
                      <span className={`px-2 py-0.5 ${color.badge} text-xs rounded-full font-medium`}>
                        {getActionType(view.referrer)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getTimeAgo(view.viewed_at)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {c.noRecentActivity}
              </p>
            </div>
          )}
        </div>

        {/* Top Countries Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {c.topCountries}
          </h4>
          {topCountries.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCountries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="country" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                  }}
                />
                <Bar dataKey="views" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {c.noCountryData}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* Premium Preview with fake blurred data */
        <div className="p-6 relative">
          {/* Placeholder content that looks realistic but is not real data */}
          <div className="filter blur-[8px] pointer-events-none select-none opacity-40">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <EyeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {c.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {c.last30Days}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                +247% {c.thisMonth}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1,247</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {c.totalViews}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">856</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {c.uniqueVisitors}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">342</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {c.ctaClicks}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {c.recentActivity}
              </h4>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border-l-4 border-gray-400">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    XX
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {c.topCountries}
              </h4>
              <div className="h-[250px] bg-gray-100 dark:bg-gray-900/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Lock Overlay */}
      {!isPremium && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
          <div className="text-center px-6 max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-5 ring-4 ring-white/30">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-3">
              {c.premiumTitle}
            </h4>
            <p className="text-white/95 text-base mb-6 leading-relaxed">
              {c.premiumDescription}
            </p>

            {/* Features list */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 mb-6">
              <div className="grid grid-cols-1 gap-3">
                {featureItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-white text-sm">
                    {checkIcon}
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-white/80 text-xs mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl mb-3"
            >
              <SparklesIcon className="w-6 h-6" />
              {c.upgradeToPremium}
            </button>
            <p className="text-white/80 text-sm">
              {c.pricing}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyVisibilityWidget;
