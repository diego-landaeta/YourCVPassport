import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  completeProfiles: number;
  incompleteProfiles: number;
  averageProfileQuality: number;
}

interface ActivityData {
  date: string;
  logins: number;
  registrations: number;
}

interface ProfileCompletionData {
  range: string;
  count: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
}

interface TopSkill {
  skill: string;
  count: number;
}

const UserMonitoring: React.FC = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [profileCompletionData, setProfileCompletionData] = useState<ProfileCompletionData[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [topSkills, setTopSkills] = useState<TopSkill[]>([]);

  const translations = {
    en: {
      title: 'User Monitoring & Analytics',
      subtitle: 'Track user activity and engagement metrics',
      overview: 'Overview',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      newThisMonth: 'New This Month',
      completeProfiles: 'Complete Profiles',
      incompleteProfiles: 'Incomplete Profiles',
      avgQuality: 'Profile Completeness',
      activityTrends: 'Activity Trends',
      profileCompletion: 'Profile Completion Distribution',
      last30Days: 'Last 30 Days',
      logins: 'Logins',
      registrations: 'Registrations',
      loading: 'Loading analytics...',
      error: 'Error loading data',
      noData: 'No data available',
      completionRange: {
        '0-25': '0-25% Complete',
        '26-50': '26-50% Complete',
        '51-75': '51-75% Complete',
        '76-100': '76-100% Complete'
      }
    },
    es: {
      title: 'Monitoreo y Analíticas de Usuarios',
      subtitle: 'Rastrea la actividad y métricas de engagement de usuarios',
      overview: 'Resumen',
      totalUsers: 'Total de Usuarios',
      activeUsers: 'Usuarios Activos',
      newThisMonth: 'Nuevos Este Mes',
      completeProfiles: 'Perfiles Completos',
      incompleteProfiles: 'Perfiles Incompletos',
      avgQuality: 'Completitud de Perfil',
      activityTrends: 'Tendencias de Actividad',
      profileCompletion: 'Distribución de Completitud de Perfiles',
      last30Days: 'Últimos 30 Días',
      logins: 'Inicios de Sesión',
      registrations: 'Registros',
      loading: 'Cargando analíticas...',
      error: 'Error al cargar datos',
      noData: 'No hay datos disponibles',
      completionRange: {
        '0-25': '0-25% Completo',
        '26-50': '26-50% Completo',
        '51-75': '51-75% Completo',
        '76-100': '76-100% Completo'
      }
    }
  };

  const t = translations[lang];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get ALL profile data in ONE query for efficiency (excluding admins)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, updated_at, avatar_url, role')
        .neq('role', 'admin');

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          newUsersThisMonth: 0,
          completeProfiles: 0,
          incompleteProfiles: 0,
          averageProfileQuality: 0
        });
        setActivityData([]);
        setProfileCompletionData([]);
        setRecentUsers([]);
        setTopSkills([]);
        setLoading(false);
        return;
      }

      // Calculate all stats from the single profiles array
      const totalUsers = profiles.length;
      let activeUsers = 0;
      let newUsersThisMonth = 0;

      let completeProfiles = 0;
      let incompleteProfiles = 0;
      let totalQuality = 0;
      const completionDistribution: { [key: string]: number } = {
        '0-25': 0,
        '26-50': 0,
        '51-75': 0,
        '76-100': 0
      };

      // Activity tracking
      const activityMap = new Map<string, { logins: number; registrations: number }>();

      // Initialize the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        activityMap.set(dateStr, { logins: 0, registrations: 0 });
      }

      // Process all profiles in one loop for efficiency
      profiles.forEach(profile => {
        // Calculate a simple quality score based on profile completeness
        let quality = 0;
        if (profile.full_name) quality += 25;
        if (profile.email) quality += 25;
        if (profile.avatar_url) quality += 25;
        // Additional 25% would come from experience/education/skills (not loaded here for performance)
        // For now, give partial credit if updated recently (active user)
        if (profile.updated_at && new Date(profile.updated_at) >= thirtyDaysAgo) {
          quality += 25;
        }

        totalQuality += quality;

        // Count complete/incomplete
        if (quality >= 80) {
          completeProfiles++;
        } else {
          incompleteProfiles++;
        }

        // Distribution
        if (quality <= 25) completionDistribution['0-25']++;
        else if (quality <= 50) completionDistribution['26-50']++;
        else if (quality <= 75) completionDistribution['51-75']++;
        else completionDistribution['76-100']++;

        // Count active users (updated in last 30 days)
        if (profile.updated_at && new Date(profile.updated_at) >= thirtyDaysAgo) {
          activeUsers++;
        }

        // Count new users this month
        if (profile.created_at && new Date(profile.created_at) >= startOfMonth) {
          newUsersThisMonth++;
        }

        // Track registrations
        const createdDateStr = profile.created_at?.split('T')[0];
        if (createdDateStr && activityMap.has(createdDateStr)) {
          const current = activityMap.get(createdDateStr)!;
          current.registrations++;
        }

        // Track logins (based on updated_at)
        const updatedDateStr = profile.updated_at?.split('T')[0];
        if (updatedDateStr && activityMap.has(updatedDateStr)) {
          const current = activityMap.get(updatedDateStr)!;
          current.logins++;
        }
      });

      const averageProfileQuality = profiles.length > 0
        ? Math.round(totalQuality / profiles.length)
        : 0;

      setStats({
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        completeProfiles,
        incompleteProfiles,
        averageProfileQuality
      });

      // Convert activity map to array (already populated above)
      const activityDataArray: ActivityData[] = [];
      activityMap.forEach((value, date) => {
        activityDataArray.push({
          date,
          logins: value.logins,
          registrations: value.registrations
        });
      });
      setActivityData(activityDataArray);

      // Set profile completion distribution
      setProfileCompletionData([
        { range: t.completionRange['0-25'], count: completionDistribution['0-25'] },
        { range: t.completionRange['26-50'], count: completionDistribution['26-50'] },
        { range: t.completionRange['51-75'], count: completionDistribution['51-75'] },
        { range: t.completionRange['76-100'], count: completionDistribution['76-100'] }
      ]);

      // Get recent users from already loaded profiles (no additional query needed)
      const sortedProfiles = [...profiles].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentUsers(sortedProfiles.slice(0, 5));

      // Get top skills from the skills table
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('name');

      if (skillsError) {
        console.error('Error loading skills:', skillsError);
        setTopSkills([]);
      } else if (skillsData) {
        const skillCounts: { [key: string]: number } = {};
        skillsData.forEach(item => {
          const skill = item.name;
          if (skill) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          }
        });

        const sortedSkills = Object.entries(skillCounts)
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopSkills(sortedSkills);
      } else {
        setTopSkills([]);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-cv-blue dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-dark-text-secondary">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-text-secondary">{t.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
          {t.title}
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Stats Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
          {t.overview}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Users */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg flex-shrink-0">
                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cv-blue dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary truncate">{t.totalUsers}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <ArrowTrendingUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary truncate">{t.activeUsers}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {stats.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* New This Month */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary truncate">{t.newThisMonth}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {stats.newUsersThisMonth.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Complete Profiles */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary truncate">{t.completeProfiles}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {stats.completeProfiles.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Incomplete Profiles */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
                <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary truncate">{t.incompleteProfiles}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {stats.incompleteProfiles.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Average Quality */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg flex-shrink-0">
                <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cv-blue dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary truncate">{t.avgQuality}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {stats.averageProfileQuality}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Trends */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
          {t.activityTrends} - {t.last30Days}
        </h3>
        <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[500px] px-4 sm:px-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontSize: '12px'
                  }}
                  itemStyle={{
                    color: '#374151',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  name={t.logins}
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  name={t.registrations}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Users & Top Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              {lang === 'es' ? 'Usuarios Recientes' : 'Recent Users'}
            </h3>
            <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-cv-blue dark:text-blue-400 flex-shrink-0" />
          </div>

          {recentUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lang === 'es' ? 'No hay usuarios recientes' : 'No recent users'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'User'}
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-cv-blue/10 dark:bg-cv-blue/20 flex items-center justify-center">
                        <span className="text-cv-blue dark:text-blue-400 font-semibold text-xs sm:text-sm">
                          {(user.full_name || user.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-dark-text-primary truncate">
                      {user.full_name || (lang === 'es' ? 'Sin nombre' : 'No name')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-right">
                      {new Date(user.created_at).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Skills */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              {lang === 'es' ? 'Habilidades Más Populares' : 'Top Skills'}
            </h3>
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-cv-blue dark:text-blue-400 flex-shrink-0" />
          </div>

          {topSkills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lang === 'es' ? 'No hay habilidades registradas' : 'No skills registered'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {topSkills.map((skill, index) => {
                const maxCount = topSkills[0]?.count || 1;
                const percentage = (skill.count / maxCount) * 100;

                return (
                  <div key={skill.skill} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 w-5 sm:w-6 flex-shrink-0">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-dark-text-primary truncate">
                          {skill.skill}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-cv-blue dark:text-blue-400 flex-shrink-0">
                        {skill.count} {lang === 'es' ? 'usuarios' : 'users'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                      <div
                        className="bg-gradient-to-r from-cv-blue to-blue-400 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMonitoring;
