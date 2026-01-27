import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useCompanyUnreadMessages } from '../../hooks/useCompanyUnreadMessages';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import {
  MagnifyingGlassIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  BookmarkIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  EyeIcon,
  EnvelopeIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardStats {
  creditsRemaining: number;
  profilesViewed: number;
  contactsSent: number;
  savedSearches: number;
  profilesViewedChange?: number;
  contactsSentChange?: number;
  creditsUsedThisMonth?: number;
}

interface RecentActivity {
  id: string;
  type: 'profile_view' | 'contact_sent' | 'credit_purchase' | 'export';
  description: string;
  timestamp: string;
  metadata?: any;
}

interface ChartDataPoint {
  date: string;
  credits: number;
  views: number;
  contacts: number;
}

const CompanyDashboardPage: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();
  const navigate = useNavigate();
  const { unreadCount: unreadMessages } = useCompanyUnreadMessages(company?.id);

  const [stats, setStats] = useState<DashboardStats>({
    creditsRemaining: 0,
    profilesViewed: 0,
    contactsSent: 0,
    savedSearches: 0,
    profilesViewedChange: 0,
    contactsSentChange: 0,
    creditsUsedThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [creditHistoryData, setCreditHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚡ OPTIMIZATION: Cache dashboard data to prevent refetch on window focus/blur
  const dashboardCache = useRef<{
    companyId: string | null;
    timestamp: number;
    data: any;
  }>({ companyId: null, timestamp: 0, data: null });

  // Helper function to access translations
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  useEffect(() => {
    if (company?.id) {
      fetchDashboardData();
    }
  }, [company]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ⚡ OPTIMIZATION: Use cache if data is less than 45 seconds old
      const nowTimestamp = Date.now();
      const CACHE_DURATION = 45000; // 45 seconds
      if (
        dashboardCache.current.companyId === company.id &&
        dashboardCache.current.data &&
        nowTimestamp - dashboardCache.current.timestamp < CACHE_DURATION
      ) {
        // Restore from cache
        const cached = dashboardCache.current.data;
        setStats(cached.stats);
        setChartData(cached.chartData);
        setCreditHistoryData(cached.creditHistoryData);
        setRecentActivity(cached.recentActivity);
        setLoading(false);
        return;
      }

      // Fetch credits remaining
      const creditsRemaining = company.credit_balance || 0;

      // Get dates for comparison
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

      // Parallel fetch all data at once - MUCH faster than sequential
      const [
        { count: profilesViewedCount },
        { count: profilesViewedPrevCount },
        { count: contactsSentCount },
        { count: contactsSentPrevCount },
        { count: savedSearchesCount },
        { data: creditsData },
        { data: viewsData },
        { data: contactsData },
        { data: creditsHistory },
        { data: activityData }
      ] = await Promise.all([
        // Profiles viewed (last 30 days)
        supabase
          .from('company_profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        // Profiles viewed (previous 30 days)
        supabase
          .from('company_profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
        // Contacts sent (last 30 days)
        supabase
          .from('company_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        // Contacts sent (previous 30 days)
        supabase
          .from('company_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
        // Saved searches count
        supabase
          .from('company_saved_searches')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id),
        // Credits used this month
        supabase
          .from('company_credits_history')
          .select('amount')
          .eq('company_id', company.id)
          .gte('created_at', startOfMonth.toISOString())
          .lt('amount', 0),
        // Views data for chart
        supabase
          .from('company_profile_views')
          .select('created_at')
          .eq('company_id', company.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: true }),
        // Contacts data for chart
        supabase
          .from('company_contacts')
          .select('created_at')
          .eq('company_id', company.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: true }),
        // Credits history for chart
        supabase
          .from('company_credits_history')
          .select('created_at, amount, balance_after')
          .eq('company_id', company.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: true }),
        // Recent activity
        supabase
          .from('company_activity_log')
          .select('*')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const creditsUsedThisMonth = creditsData?.reduce((sum, record) => sum + Math.abs(record.amount), 0) || 0;

      // Calculate percentage changes
      const profilesViewedChange = profilesViewedPrevCount
        ? ((profilesViewedCount || 0) - profilesViewedPrevCount) / profilesViewedPrevCount * 100
        : 0;

      const contactsSentChange = contactsSentPrevCount
        ? ((contactsSentCount || 0) - contactsSentPrevCount) / contactsSentPrevCount * 100
        : 0;

      setStats({
        creditsRemaining,
        profilesViewed: profilesViewedCount || 0,
        contactsSent: contactsSentCount || 0,
        savedSearches: savedSearchesCount || 0,
        profilesViewedChange: Math.round(profilesViewedChange),
        contactsSentChange: Math.round(contactsSentChange),
        creditsUsedThisMonth,
      });

      // Aggregate data by day for chart
      const dailyData: { [key: string]: ChartDataPoint } = {};

      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = {
          date: dateKey,
          credits: 0,
          views: 0,
          contacts: 0,
        };
      }

      viewsData?.forEach((view: any) => {
        const dateKey = view.created_at.split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].views += 1;
        }
      });

      contactsData?.forEach((contact: any) => {
        const dateKey = contact.created_at.split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].contacts += 1;
        }
      });

      // Set chart data
      const chartDataArray = Object.values(dailyData).map((data) => ({
        ...data,
        date: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
      setChartData(chartDataArray);

      // Process credit history for chart
      if (creditsHistory && creditsHistory.length > 0) {
        const creditChartData = creditsHistory.map((record: any) => ({
          date: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          balance: record.balance_after,
          change: record.amount,
        }));
        setCreditHistoryData(creditChartData);
      }

      // Process recent activity (already fetched in parallel above)
      const activityList = activityData ? activityData.map((activity: any) => ({
        id: activity.id,
        type: activity.activity_type,
        description: activity.description,
        timestamp: activity.created_at,
        metadata: activity.metadata,
      })) : [];

      setRecentActivity(activityList);

      // ⚡ OPTIMIZATION: Save to cache
      dashboardCache.current = {
        companyId: company.id,
        timestamp: Date.now(),
        data: {
          stats: {
            creditsRemaining,
            profilesViewed: profilesViewedCount || 0,
            contactsSent: contactsSentCount || 0,
            savedSearches: savedSearchesCount || 0,
            profilesViewedChange: Math.round(profilesViewedChange),
            contactsSentChange: Math.round(contactsSentChange),
            creditsUsedThisMonth,
          },
          chartData: chartDataArray,
          creditHistoryData: creditHistoryData && creditHistoryData.length > 0
            ? creditHistoryData.map((record: any) => ({
                date: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                balance: record.balance_after,
                change: record.amount,
              }))
            : [],
          recentActivity: activityList,
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'profile_view':
        return EyeIcon;
      case 'contact_sent':
        return EnvelopeIcon;
      case 'credit_purchase':
        return CreditCardIcon;
      case 'export':
        return ArrowDownTrayIcon;
      default:
        return ClockIcon;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('common.justNow') || 'Just now';
    if (minutes < 60) return `${minutes} ${t('common.minutesAgo') || 'minutes ago'}`;
    if (hours < 24) return `${hours} ${t('common.hoursAgo') || 'hours ago'}`;
    return `${days} ${t('common.daysAgo') || 'days ago'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
                {t('company.dashboard.welcome') || 'Welcome back'}, {company.company_name}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
                {t('company.dashboard.welcomeMessage') || 'Manage your talent search and recruitment efforts'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Credits Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('company.dashboard.creditsRemaining') || 'Credits Remaining'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mt-2">
                  {stats.creditsRemaining}
                </p>
                <button
                  onClick={() => navigate('/company/credits')}
                  className="mt-3 text-sm font-medium text-cv-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center group"
                >
                  {t('company.dashboard.buyMore') || 'Buy more'}
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CreditCardIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Profiles Viewed Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('company.dashboard.profilesViewed') || 'Profiles Viewed'}
                  </p>
                  {stats.profilesViewedChange !== undefined && stats.profilesViewedChange !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${stats.profilesViewedChange > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {stats.profilesViewedChange > 0 ? '↑' : '↓'} {Math.abs(stats.profilesViewedChange)}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mt-2">
                  {stats.profilesViewed}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {t('company.dashboard.last30Days') || 'Last 30 days'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <EyeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Contacts Sent Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('company.dashboard.contactsSent') || 'Contacts Sent'}
                  </p>
                  {stats.contactsSentChange !== undefined && stats.contactsSentChange !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${stats.contactsSentChange > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {stats.contactsSentChange > 0 ? '↑' : '↓'} {Math.abs(stats.contactsSentChange)}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mt-2">
                  {stats.contactsSent}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {t('company.dashboard.last30Days') || 'Last 30 days'}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <EnvelopeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Saved Searches Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('company.dashboard.savedSearches') || 'Saved Searches'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mt-2">
                  {stats.savedSearches}
                </p>
                <button
                  onClick={() => navigate('/company/saved-searches')}
                  className="mt-3 text-sm font-medium text-cv-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center group"
                >
                  {t('company.dashboard.viewAll') || 'View all'}
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <BookmarkIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
            {t('company.dashboard.analytics') || 'Analytics'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend Chart */}
            <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                {t('company.dashboard.activityTrend') || 'Activity Trend (30 Days)'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    className="text-gray-600 dark:text-gray-400"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    className="text-gray-600 dark:text-gray-400"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name={t('company.dashboard.profileViews') || 'Profile Views'}
                  />
                  <Area
                    type="monotone"
                    dataKey="contacts"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                    name={t('company.dashboard.contacts') || 'Contacts'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Credit Balance Chart */}
            <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                {t('company.dashboard.creditBalance') || 'Credit Balance'}
              </h3>
              {creditHistoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={creditHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      className="text-gray-600 dark:text-gray-400"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      className="text-gray-600 dark:text-gray-400"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg, #ffffff)',
                        border: '1px solid var(--tooltip-border, #e5e7eb)',
                        borderRadius: '8px',
                        color: 'var(--tooltip-text, #111827)'
                      }}
                      wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 4 }}
                      name={t('company.dashboard.balance') || 'Balance'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-text-secondary" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">
                      {t('company.dashboard.noDataYet') || 'No transaction data yet'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-6">
            {t('company.dashboard.quickActions') || 'Quick Actions'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search Talent */}
            <button
              onClick={() => navigate('/company/search')}
              className="group bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4 hover:border-cv-blue dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                {t('company.dashboard.searchTalent') || 'Search Talent'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {t('company.dashboard.searchTalentDesc') || 'Find professionals'}
              </p>
            </button>

            {/* Job Postings */}
            <button
              onClick={() => navigate('/company/jobs')}
              className="group bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4 hover:border-cv-blue dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <BriefcaseIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                {t('company.dashboard.jobPostings') || 'Job Postings'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {t('company.dashboard.manageJobPostings') || 'Manage jobs'}
              </p>
            </button>

            {/* Messages */}
            <button
              onClick={() => navigate('/company/messages')}
              className="group relative bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4 hover:border-cv-blue dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-xl transition-all text-left"
            >
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-gray-50 dark:ring-dark-bg-primary">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                {t('company.messages.title') || 'Messages'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {t('company.messages.subtitle') || 'Communicate'}
              </p>
            </button>

            {/* Analytics */}
            <button
              onClick={() => navigate('/company/analytics')}
              className="group bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4 hover:border-cv-blue dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <ChartBarIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                {t('company.dashboard.analytics') || 'Analytics'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {t('company.dashboard.viewAnalytics') || 'View analytics'}
              </p>
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/company/settings')}
              className="group bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4 hover:border-cv-blue dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:scale-110 transition-transform">
                  <Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                {t('company.dashboard.settings') || 'Settings'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {t('company.dashboard.companySettings') || 'Configure'}
              </p>
            </button>

            {/* Team Management */}
            <button
              onClick={() => navigate('/company/team')}
              className="group bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4 hover:border-cv-blue dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <UsersIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                {t('company.team.title') || 'Team Members'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {t('company.dashboard.manageTeam') || 'Manage team'}
              </p>
            </button>
          </div>
        </div>

        {/* Bottom Section: Recent Activity */}
        <div>
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                {t('company.dashboard.recentActivity') || 'Recent Activity'}
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {recentActivity.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="mt-3 text-sm text-gray-500 dark:text-dark-text-secondary">
                    {t('company.dashboard.noActivity') || 'No recent activity'}
                  </p>
                </div>
              ) : (
                recentActivity.slice(0, 5).map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <ActivityIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-dark-text-primary truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboardPage;
