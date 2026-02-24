import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { getAnalyticsStats } from '../../../hooks/useAnalytics';
import {
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ProfileCardProps {
  profile: NonNullable<ReturnType<typeof useAuth>['profile']>;
  avatarUrl: string;
  myPostsCount: number;
  myLikesReceived: number;
  myCommentsReceived: number;
  onSectionChange?: (section: string) => void;
}

interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  avatarUrl,
  myPostsCount,
  myLikesReceived,
  myCommentsReceived,
  onSectionChange,
}) => {
  const t = useTranslations();
  const tp = t.feed.profileCard;
  const [collapsed, setCollapsed] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch analytics on mount
  useEffect(() => {
    if (!profile.id) return;
    let cancelled = false;
    setAnalyticsLoading(true);
    getAnalyticsStats(profile.id).then((data) => {
      if (cancelled) return;
      if (data) {
        setAnalytics({ totalViews: data.totalViews, totalClicks: data.totalClicks });
      } else {
        setAnalytics({ totalViews: 0, totalClicks: 0 });
      }
      setAnalyticsLoading(false);
    });
    return () => { cancelled = true; };
  }, [profile.id]);

  const ctr = analytics && analytics.totalViews > 0
    ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Collapsed header */}
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
        >
          <img
            src={avatarUrl}
            alt={profile.full_name || 'User'}
            className="w-9 h-9 rounded-full object-cover bg-gray-100 dark:bg-dark-bg-tertiary border-2 border-gray-200 dark:border-dark-border flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{profile.full_name}</h3>
            {profile.headline && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.headline}</p>
            )}
          </div>
          <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      ) : (
        <>
          {/* Banner — compact */}
          <div className="h-16 bg-gradient-to-r from-cv-blue via-indigo-500 to-purple-600 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <button
              onClick={() => setCollapsed(true)}
              className="absolute top-1.5 right-1.5 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-lg transition-colors"
            >
              <ChevronUpIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Profile info — compact */}
          <div className="px-4 pb-4 relative">
            {/* Avatar + name inline */}
            <div
              className="flex items-end gap-3 -mt-7 mb-2 cursor-pointer group"
              onClick={() => onSectionChange?.(`perfil-usuario:${profile.id}`)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={profile.full_name || 'Usuario'}
                  className="w-14 h-14 rounded-full border-3 border-white dark:border-dark-bg-secondary shadow-sm object-cover bg-gray-100 dark:bg-dark-bg-tertiary group-hover:ring-2 group-hover:ring-cv-blue/30 transition-all"
                />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-dark-bg-secondary rounded-full" />
              </div>
              <div className="min-w-0 pb-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate group-hover:text-cv-blue transition-colors">{profile.full_name}</h3>
                  {profile.plan && profile.plan !== 'free' && (
                    <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] font-bold rounded-full border border-amber-200 dark:border-amber-800/50 uppercase tracking-wider flex-shrink-0">
                      {profile.plan}
                    </span>
                  )}
                </div>
                {profile.headline ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-1">{profile.headline}</p>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-600 italic">{tp.noHeadline}</p>
                )}
              </div>
            </div>

            {/* Post stats — compact row */}
            <div className="flex justify-between py-2 border-t border-gray-100 dark:border-dark-border">
              {[
                { value: myPostsCount, label: tp.posts },
                { value: myLikesReceived, label: tp.likes },
                { value: myCommentsReceived, label: tp.comments },
              ].map(({ value, label }) => (
                <div key={label} className="text-center flex-1 first:border-r last:border-l border-gray-100 dark:border-dark-border">
                  <div className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-tight">{value}</div>
                  <div className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* Analytics — single compact row */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-1.5 mb-2">
                <ChartBarIcon className="w-3 h-3 text-cv-blue" />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tp.analytics}
                </span>
              </div>

              {analyticsLoading ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-2 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-6 mx-auto mb-0.5" />
                      <div className="h-2.5 bg-gray-200 dark:bg-dark-border rounded w-10 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg py-1.5 px-1 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <EyeIcon className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{analytics?.totalViews ?? 0}</span>
                    </div>
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide leading-tight">
                      {tp.views}
                    </p>
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg py-1.5 px-1 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <CursorArrowRaysIcon className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{analytics?.totalClicks ?? 0}</span>
                    </div>
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide leading-tight">
                      {tp.ctaClicks}
                    </p>
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg py-1.5 px-1 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <ChartBarIcon className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{ctr}%</span>
                    </div>
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide leading-tight">
                      CTR
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile link — opens in-app feed profile */}
            <button
              onClick={() => onSectionChange?.(`perfil-usuario:${profile.id}`)}
              className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl transition-all shadow-sm"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              {tp.viewProfile}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileCard;
