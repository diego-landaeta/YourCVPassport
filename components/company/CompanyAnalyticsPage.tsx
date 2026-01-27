import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import {
  ChartBarIcon,
  EyeIcon,
  EnvelopeIcon,
  CreditCardIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AnalyticsData {
  profileViewsToday: number;
  profileViewsThisWeek: number;
  profileViewsThisMonth: number;
  contactsSentToday: number;
  contactsSentThisWeek: number;
  contactsSentThisMonth: number;
  creditsUsedToday: number;
  creditsUsedThisWeek: number;
  creditsUsedThisMonth: number;
  topSkillsSearched: { skill: string; count: number }[];
  activityByDayOfWeek: { day: string; views: number; contacts: number }[];
  creditUsageByType: { type: string; amount: number }[];
}

const CompanyAnalyticsPage: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [cacheKey, setCacheKey] = useState<string>('');

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
      const newCacheKey = `analytics-${company.id}-${timeRange}`;

      // Check if we have cached data
      const cachedData = sessionStorage.getItem(newCacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${newCacheKey}-timestamp`);

      // Use cache if it's less than 5 minutes old
      if (cachedData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < 5 * 60 * 1000) { // 5 minutes
          setAnalytics(JSON.parse(cachedData));
          setLoading(false);
          setCacheKey(newCacheKey);
          return;
        }
      }

      fetchAnalytics();
      setCacheKey(newCacheKey);
    }
  }, [company, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch profile views
      const { count: viewsToday } = await supabase
        .from('company_profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', todayStart.toISOString());

      const { count: viewsWeek } = await supabase
        .from('company_profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', weekStart.toISOString());

      const { count: viewsMonth } = await supabase
        .from('company_profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', monthStart.toISOString());

      // Fetch contacts sent
      const { count: contactsToday } = await supabase
        .from('company_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', todayStart.toISOString());

      const { count: contactsWeek } = await supabase
        .from('company_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', weekStart.toISOString());

      const { count: contactsMonth } = await supabase
        .from('company_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .gte('created_at', monthStart.toISOString());

      // Fetch credit usage
      const { data: creditsToday } = await supabase
        .from('company_credits_history')
        .select('amount')
        .eq('company_id', company.id)
        .gte('created_at', todayStart.toISOString())
        .lt('amount', 0);

      const { data: creditsWeek } = await supabase
        .from('company_credits_history')
        .select('amount')
        .eq('company_id', company.id)
        .gte('created_at', weekStart.toISOString())
        .lt('amount', 0);

      const { data: creditsMonth } = await supabase
        .from('company_credits_history')
        .select('amount')
        .eq('company_id', company.id)
        .gte('created_at', monthStart.toISOString())
        .lt('amount', 0);

      // Credit usage by type
      const { data: creditsByType } = await supabase
        .from('company_credits_history')
        .select('transaction_type, amount')
        .eq('company_id', company.id)
        .gte('created_at', monthStart.toISOString())
        .lt('amount', 0);

      const creditUsageByType = creditsByType?.reduce((acc: any[], record: any) => {
        const existing = acc.find(item => item.type === record.transaction_type);
        if (existing) {
          existing.amount += Math.abs(record.amount);
        } else {
          acc.push({ type: record.transaction_type, amount: Math.abs(record.amount) });
        }
        return acc;
      }, []) || [];

      // Fetch activity by day of week (REAL DATA)
      const { data: viewsByDay } = await supabase
        .from('company_profile_views')
        .select('created_at')
        .eq('company_id', company.id)
        .gte('created_at', weekStart.toISOString());

      const { data: contactsByDay } = await supabase
        .from('company_contacts')
        .select('created_at')
        .eq('company_id', company.id)
        .gte('created_at', weekStart.toISOString());

      // Aggregate by day of week
      const dayOfWeekData = generateDayOfWeekData(viewsByDay || [], contactsByDay || []);

      const analyticsData = {
        profileViewsToday: viewsToday || 0,
        profileViewsThisWeek: viewsWeek || 0,
        profileViewsThisMonth: viewsMonth || 0,
        contactsSentToday: contactsToday || 0,
        contactsSentThisWeek: contactsWeek || 0,
        contactsSentThisMonth: contactsMonth || 0,
        creditsUsedToday: creditsToday?.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0,
        creditsUsedThisWeek: creditsWeek?.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0,
        creditsUsedThisMonth: creditsMonth?.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0,
        topSkillsSearched: [],
        activityByDayOfWeek: dayOfWeekData,
        creditUsageByType,
      };

      setAnalytics(analyticsData);

      // Cache the data
      if (cacheKey) {
        sessionStorage.setItem(cacheKey, JSON.stringify(analyticsData));
        sessionStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDayOfWeekData = (views: any[], contacts: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap: { [key: string]: { views: number; contacts: number } } = {};

    // Initialize all days with 0
    days.forEach(day => {
      dayMap[day] = { views: 0, contacts: 0 };
    });

    // Count views by day
    views.forEach(view => {
      const date = new Date(view.created_at);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = days[(dayIndex + 6) % 7]; // Convert to Mon-Sun format
      dayMap[dayName].views++;
    });

    // Count contacts by day
    contacts.forEach(contact => {
      const date = new Date(contact.created_at);
      const dayIndex = date.getDay();
      const dayName = days[(dayIndex + 6) % 7];
      dayMap[dayName].contacts++;
    });

    return days.map(day => ({
      day,
      views: dayMap[day].views,
      contacts: dayMap[day].contacts,
    }));
  };

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('company.analytics.title') || 'Analytics'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('company.analytics.subtitle') || 'Track your recruitment performance and activity'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('company.analytics.week') || 'Week'}
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('company.analytics.month') || 'Month'}
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('company.analytics.year') || 'Year'}
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <EyeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('company.analytics.today') || 'Today'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.profileViewsToday}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('company.analytics.profileViews') || 'Profile Views'}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                {analytics.profileViewsThisWeek} {t('company.analytics.thisWeek') || 'this week'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <EnvelopeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('company.analytics.today') || 'Today'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.contactsSentToday}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('company.analytics.contactsSent') || 'Contacts Sent'}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                {analytics.contactsSentThisWeek} {t('company.analytics.thisWeek') || 'this week'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <CreditCardIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('company.analytics.today') || 'Today'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.creditsUsedToday}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('company.analytics.creditsUsed') || 'Credits Used'}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {analytics.creditsUsedThisMonth} {t('company.analytics.thisMonth') || 'this month'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <UserGroupIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('company.analytics.available') || 'Available'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {company.credit_balance || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('company.analytics.remainingCredits') || 'Remaining Credits'}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity by Day of Week */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('company.analytics.activityByDay') || 'Activity by Day of Week'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.activityByDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Bar dataKey="views" fill="#3B82F6" name={t('company.analytics.views') || 'Views'} />
                <Bar dataKey="contacts" fill="#8B5CF6" name={t('company.analytics.contacts') || 'Contacts'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Credit Usage by Type */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('company.analytics.creditUsage') || 'Credit Usage Breakdown'}
            </h3>
            {analytics.creditUsageByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.creditUsageByType}
                    dataKey="amount"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analytics.creditUsageByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('company.analytics.noData') || 'No credit usage data yet'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <CalendarIcon className="inline h-5 w-5 mr-2" />
            {t('company.analytics.monthlySummary') || 'Monthly Summary'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-600 dark:border-blue-400 pl-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('company.analytics.totalProfileViews') || 'Total Profile Views'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics.profileViewsThisMonth}
              </p>
            </div>
            <div className="border-l-4 border-purple-600 dark:border-purple-400 pl-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('company.analytics.totalContacts') || 'Total Contacts Sent'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics.contactsSentThisMonth}
              </p>
            </div>
            <div className="border-l-4 border-green-600 dark:border-green-400 pl-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('company.analytics.totalCreditsUsed') || 'Total Credits Used'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics.creditsUsedThisMonth}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAnalyticsPage;
