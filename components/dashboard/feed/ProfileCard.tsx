import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { getAnalyticsStats } from '../../../hooks/useAnalytics';
import {
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
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
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
        >
          <img
            src={avatarUrl}
            alt={profile.full_name || 'User'}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-dark-border flex-shrink-0"
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
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-cv-blue via-indigo-500 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            {/* Collapse button */}
            <button
              onClick={() => setCollapsed(true)}
              className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
            >
              <ChevronUpIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Profile info */}
          <div className="px-5 pb-5 relative">
            <div className="flex justify-between items-end -mt-10 mb-3">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={profile.full_name || 'Usuario'}
                  className="w-20 h-20 rounded-full border-4 border-white dark:border-dark-bg-secondary shadow-sm object-cover"
                />
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-dark-bg-secondary rounded-full" />
              </div>
              {profile.plan && profile.plan !== 'free' && (
                <span className="mb-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-800/50 uppercase tracking-wider">
                  {profile.plan}
                </span>
              )}
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{profile.full_name}</h3>
              {profile.headline ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug line-clamp-2">{profile.headline}</p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1 italic">{tp.noHeadline}</p>
              )}
            </div>

            {/* Post stats */}
            <div className="flex justify-between py-3 border-t border-gray-100 dark:border-dark-border">
              {[
                { value: myPostsCount, label: 'Posts' },
                { value: myLikesReceived, label: 'Likes' },
                { value: myCommentsReceived, label: tp.comments },
              ].map(({ value, label }) => (
                <div key={label} className="text-center flex-1 first:border-r last:border-l border-gray-100 dark:border-dark-border cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors rounded-lg p-1">
                  <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* Analytics section */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-1.5 mb-3">
                <ChartBarIcon className="w-3.5 h-3.5 text-cv-blue" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tp.analytics}
                </span>
              </div>

              {analyticsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-2.5 animate-pulse">
                      <div className="h-5 bg-gray-200 dark:bg-dark-border rounded w-8 mx-auto mb-1" />
                      <div className="h-3 bg-gray-200 dark:bg-dark-border rounded w-12 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <EyeIcon className="w-3 h-3 text-blue-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{analytics?.totalViews ?? 0}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide leading-tight">
                      {tp.views}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <CursorArrowRaysIcon className="w-3 h-3 text-green-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{analytics?.totalClicks ?? 0}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide leading-tight">
                      {tp.ctaClicks}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ChartBarIcon className="w-3 h-3 text-purple-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{ctr}%</span>
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide leading-tight">
                      CTR
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile link */}
            {profile.slug ? (
              <a
                href={`/cv/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl transition-all shadow-sm"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                {tp.viewProfile}
              </a>
            ) : (
              <button
                onClick={() => onSectionChange?.('mi-perfil:identity')}
                className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-cv-blue border border-cv-blue/30 rounded-xl hover:bg-cv-blue hover:text-white transition-all"
              >
                <PencilSquareIcon className="w-4 h-4" />
                {tp.completeProfile}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileCard;
