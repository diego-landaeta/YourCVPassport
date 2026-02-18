import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabase/client';
import CompanyVisibilityWidget from './analytics/CompanyVisibilityWidget';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';

interface AnalyticsDashboardProps {
  profileId: string;
}

type DateRange = 7 | 30 | 90;

const COLORS = {
  primary: '#3B82F6',
  secondary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

const PIE_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F59E0B'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ profileId }) => {
  const [days, setDays] = useState<DateRange>(30);
  const t = useTranslations();
  const { lang } = useLanguage();
  const a = t.dashboard.analytics;

  // Helper to get date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
  };

  // Fetch analytics data from EXISTING tables (analytics_views, analytics_clicks)
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-existing-data', profileId, days],
    queryFn: async () => {
      const { startDate } = getDateRange();

      // Fetch views from analytics_views table
      const { data: views, error: viewsError, count: viewsCount } = await supabase
        .from('analytics_views')
        .select('*', { count: 'exact' })
        .eq('profile_id', profileId)
        .gte('viewed_at', startDate.toISOString())
        .order('viewed_at', { ascending: true });

      if (viewsError) throw viewsError;

      // Fetch clicks from analytics_clicks table
      const { data: clicks, error: clicksError, count: clicksCount } = await supabase
        .from('analytics_clicks')
        .select('*', { count: 'exact' })
        .eq('profile_id', profileId)
        .gte('clicked_at', startDate.toISOString());

      if (clicksError) throw clicksError;

      // Calculate unique visitors (based on visitor_id)
      const uniqueVisitors = new Set((views || []).map(v => v.visitor_id)).size;

      // Process views by day for time series
      const viewsByDay: { [key: string]: { views: number; clicks: number; date: string } } = {};
      (views || []).forEach((view) => {
        const date = new Date(view.viewed_at).toISOString().split('T')[0];
        if (!viewsByDay[date]) {
          viewsByDay[date] = { date, views: 0, clicks: 0 };
        }
        viewsByDay[date].views++;
      });

      (clicks || []).forEach((click) => {
        const date = new Date(click.clicked_at).toISOString().split('T')[0];
        if (viewsByDay[date]) {
          viewsByDay[date].clicks++;
        }
      });

      const timeSeries = Object.values(viewsByDay).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Process countries
      const countryMap: { [key: string]: number } = {};
      (views || []).forEach((view) => {
        if (view.country) {
          countryMap[view.country] = (countryMap[view.country] || 0) + 1;
        }
      });
      const topCountries = Object.entries(countryMap)
        .map(([country, count]) => ({
          country,
          views: count,
          percentage: ((count / (viewsCount || 1)) * 100).toFixed(2),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Process cities
      const cityMap: { [key: string]: { country: string; count: number } } = {};
      (views || []).forEach((view) => {
        if (view.city && view.country) {
          const key = `${view.city}, ${view.country}`;
          if (!cityMap[key]) {
            cityMap[key] = { country: view.country, count: 0 };
          }
          cityMap[key].count++;
        }
      });
      const topCities = Object.entries(cityMap)
        .map(([city, data]) => ({
          city,
          country: data.country,
          views: data.count,
          percentage: ((data.count / (viewsCount || 1)) * 100).toFixed(2),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Process referrers/traffic sources
      const getSourceType = (referrer: string): string => {
        if (!referrer || referrer === '') return 'direct';
        const lower = referrer.toLowerCase();
        if (lower.includes('linkedin') || lower.includes('facebook') ||
            lower.includes('twitter') || lower.includes('instagram')) return 'social';
        if (lower.includes('google') || lower.includes('bing') || lower.includes('yahoo')) return 'search';
        return 'referral';
      };

      const sourceMap: { [key: string]: number } = {};
      (views || []).forEach((view) => {
        const sourceType = getSourceType(view.referrer || '');
        sourceMap[sourceType] = (sourceMap[sourceType] || 0) + 1;
      });
      const trafficSources = Object.entries(sourceMap)
        .map(([source_type, count]) => ({
          source_type,
          views: count,
          percentage: ((count / (viewsCount || 1)) * 100).toFixed(2),
        }))
        .sort((a, b) => b.views - a.views);

      // Process device types (estimate from user_agent if available)
      const deviceMap: { [key: string]: number } = {};
      (views || []).forEach((view) => {
        const ua = (view.user_agent || '').toLowerCase();
        let deviceType = 'unknown';
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          deviceType = 'mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          deviceType = 'tablet';
        } else if (ua) {
          deviceType = 'desktop';
        }
        deviceMap[deviceType] = (deviceMap[deviceType] || 0) + 1;
      });
      const devices = Object.entries(deviceMap)
        .map(([device_type, count]) => ({
          device_type,
          views: count,
          percentage: ((count / (viewsCount || 1)) * 100).toFixed(2),
        }))
        .sort((a, b) => b.views - a.views);

      // Process CTA clicks
      const ctaMap: { [key: string]: { type: string; count: number } } = {};
      (clicks || []).forEach((click) => {
        const key = `${click.cta_type}__${click.cta_label || 'Unknown'}`;
        if (!ctaMap[key]) {
          ctaMap[key] = { type: click.cta_type, count: 0 };
        }
        ctaMap[key].count++;
      });
      const ctaClicks = Object.entries(ctaMap)
        .map(([key, data]) => {
          const [cta_type, cta_label] = key.split('__');
          return {
            cta_type,
            cta_label,
            clicks: data.count,
            percentage: ((data.count / (clicksCount || 1)) * 100).toFixed(2),
          };
        })
        .sort((a, b) => b.clicks - a.clicks);

      // Get recent views (last 10, sorted by most recent)
      const recentViews = (views || [])
        .sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())
        .slice(0, 10);

      // Calculate growth percentage (compare first half vs second half of period)
      const midPoint = Math.floor(timeSeries.length / 2);
      const firstHalfViews = timeSeries.slice(0, midPoint).reduce((sum, day) => sum + day.views, 0);
      const secondHalfViews = timeSeries.slice(midPoint).reduce((sum, day) => sum + day.views, 0);
      const growthPercentage = firstHalfViews > 0
        ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100
        : 0;

      return {
        summary: {
          views: viewsCount || 0,
          clicks: clicksCount || 0,
          downloads: 0,
          shares: 0,
          unique_visitors: uniqueVisitors,
          ctr: viewsCount && viewsCount > 0
            ? (((clicksCount || 0) / viewsCount) * 100).toFixed(2)
            : '0.00',
        },
        timeSeries,
        topCountries,
        topCities,
        trafficSources,
        devices,
        ctaClicks,
        recentViews,
        growthPercentage,
      };
    },
    enabled: !!profileId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Export to CSV
  const exportToCSV = () => {
    if (!analyticsData) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Views', analyticsData.summary.views],
      ['Unique Visitors', analyticsData.summary.unique_visitors],
      ['Total Clicks', analyticsData.summary.clicks],
      ['CTR (%)', analyticsData.summary.ctr],
      [''],
      ['Date', 'Views', 'Clicks'],
      ...analyticsData.timeSeries.map(d => [d.date, d.views, d.clicks]),
      [''],
      ['Country', 'Views', 'Percentage'],
      ...analyticsData.topCountries.map(c => [c.country, c.views, `${c.percentage}%`]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">{a.loading}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-6">
        <div className="max-w-lg text-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-10 shadow-lg">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-5">
                <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {a.noData.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {a.noData.description}
            </p>

            {/* Benefits List */}
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-5 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {a.noData.discoverTitle}
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {a.noData.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <a
                href="/cv/preview"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {a.noData.viewProfile}
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {a.noData.dataWillAppear}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have zero data (no visits at all)
  const hasNoActivity = analyticsData.summary.views === 0 && analyticsData.summary.unique_visitors === 0;

  if (hasNoActivity) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-6">
        <div className="max-w-lg text-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-10 shadow-lg">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-5">
                <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {a.noActivity.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {a.noActivity.description}
            </p>

            {/* Benefits List */}
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-5 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {a.noActivity.comingSoon}
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {a.noActivity.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  // Use custom event to change section without page reload
                  const event = new CustomEvent('change-dashboard-section', {
                    detail: { section: 'compartir' }
                  });
                  window.dispatchEvent(event);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {a.noActivity.shareProfile}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {a.noActivity.shareVia}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{a.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {a.subtitle}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {a.exportCSV}
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d as DateRange)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              days === d
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {a.lastDays(d)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={a.totalViews}
          value={analyticsData.summary.views}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <MetricCard
          title={a.uniqueVisitors}
          value={analyticsData.summary.unique_visitors}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <MetricCard
          title={a.ctaClicksLabel}
          value={analyticsData.summary.clicks}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          }
        />
        <MetricCard
          title={a.ctr}
          value={`${analyticsData.summary.ctr}%`}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {a.visitsOverTime}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="views" stroke={COLORS.primary} strokeWidth={2} name={a.visits} />
              <Line type="monotone" dataKey="clicks" stroke={COLORS.success} strokeWidth={2} name={a.clicks} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {a.trafficSources}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.trafficSources}
                dataKey="views"
                nameKey="source_type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.source_type}: ${entry.percentage}%`}
              >
                {analyticsData.trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Device Breakdown Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {a.devices}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.devices}
                dataKey="views"
                nameKey="device_type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.device_type}: ${entry.percentage}%`}
              >
                {analyticsData.devices.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Countries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {a.topCountries}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">{a.country}</th>
                <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{a.viewsLabel}</th>
                <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{a.percentage}</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topCountries.map((country, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{country.country}</td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{country.views}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {country.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Clicks Table */}
      {analyticsData.ctaClicks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {a.topCTAs}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">{a.type}</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">{a.label}</th>
                  <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{a.clicks}</th>
                  <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{a.percentage}</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.ctaClicks.map((cta, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{cta.cta_type}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{cta.cta_label}</td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{cta.clicks}</td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {cta.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Company Visibility Widget - Premium Feature */}
      <CompanyVisibilityWidget
        isPremium={false}
        topCountries={analyticsData.topCountries}
        summary={analyticsData.summary}
        recentViews={analyticsData.recentViews}
        growthPercentage={analyticsData.growthPercentage}
      />
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  }[color];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
