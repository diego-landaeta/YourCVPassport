import React, { useRef, useEffect, useCallback } from 'react';
import { useUserFeedProfile } from '../../../hooks/useUserFeedProfile';
import { useFeed } from '../../../hooks/useFeed';
import { useFeedActions } from '../../../hooks/useFeedActions';
import { useNotifications } from '../../../hooks/useNotifications';
import { useFollows } from '../../../hooks/useFollows';
import { useTranslations } from '../../../hooks/useTranslations';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import FeedPost from './FeedPost';
import FeedSkeleton from './FeedSkeleton';
import CreatePostForm from './CreatePostForm';
import type { FeedContentType } from '../../../types/feed';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  MapPinIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LanguageIcon,
  SparklesIcon,
  FireIcon,
  UserPlusIcon,
  UserMinusIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ChartBarIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

interface UserFeedProfileProps {
  userId: string;
  onBack: () => void;
  onSectionChange?: (section: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  expert: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
  advanced: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
  intermediate: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/40',
  beginner: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700/40',
};

const UserFeedProfile: React.FC<UserFeedProfileProps> = ({ userId, onBack, onSectionChange }) => {
  const { profile, posts, stats, extras, loading, postsLoading, hasMore, loadMore, refreshPosts } = useUserFeedProfile(userId);
  const { createPost, isCreating, postCooldown } = useFeed();
  const { votePoll } = useFeedActions();
  const { sendNotification } = useNotifications();
  const { isFollowing, counts: followCounts, toggling: followToggling, toggleFollow, loading: followLoading } = useFollows(userId);
  const { session, profile: authProfile } = useAuth();
  const t = useTranslations();
  const { lang } = useLanguage();
  const tp = t.feed.userProfile;
  const isOwnProfile = session?.user.id === userId;
  const isEs = lang === 'es';

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();
    if (!hasMore || postsLoading) return;
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, postsLoading, loadMore]);

  const handlePollVote = useCallback(async (postId: string, optionIndex: number) => {
    return votePoll(postId, optionIndex);
  }, [votePoll]);

  const handlePostCreated = useCallback(async (
    content: string,
    images: string[],
    contentType?: FeedContentType,
    achievementType?: string,
    achievementData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => {
    const groupId = metadata?._group_id as string | undefined;
    const cleanMeta = metadata ? (({ _group_id, ...rest }) => rest)(metadata as Record<string, unknown> & { _group_id?: string }) : undefined;
    await createPost({
      content,
      imageUrls: images,
      contentType: contentType || (images.length > 0 ? 'IMAGE' : 'TEXT'),
      achievementType,
      achievementData,
      metadata: cleanMeta,
      ...(groupId ? { group_id: groupId } : {}),
    });
    refreshPosts();
  }, [createPost, refreshPosts]);

  const avatarUrl = profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3B82F6&color=fff`;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(isEs ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })
    : null;

  const engagementRate = stats.totalPosts > 0
    ? Math.round((stats.totalLikesReceived + stats.totalCommentsReceived) / stats.totalPosts)
    : 0;

  const currentJob = extras.experiences.find(e => e.is_current);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto xl:max-w-none">
          <div className="h-8 w-32 bg-gray-200 dark:bg-dark-border rounded-lg" />
          <div className="rounded-2xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900" />
            <div className="bg-white dark:bg-dark-bg-secondary p-5 space-y-3">
              <div className="flex items-end gap-4 -mt-12">
                <div className="w-20 h-20 bg-gray-200 dark:bg-dark-border rounded-full border-4 border-white dark:border-dark-bg-secondary" />
                <div className="flex-1 space-y-2 pb-1">
                  <div className="h-5 w-40 bg-gray-200 dark:bg-dark-border rounded" />
                  <div className="h-3 w-56 bg-gray-200 dark:bg-dark-border rounded" />
                </div>
              </div>
              <div className="h-16 bg-gray-100 dark:bg-dark-bg-tertiary rounded-xl" />
            </div>
          </div>
          <FeedSkeleton count={2} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-cv-blue transition-colors mb-6">
          <ArrowLeftIcon className="w-4 h-4" />
          {tp.backToFeed}
        </button>
        <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">{tp.notFound}</p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
   *  SIDEBAR CARDS (reused in left/right columns)
   * ═══════════════════════════════════════════════════ */

  // ── Stats Card ──
  const StatsCard = (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <ChartBarIcon className="w-4 h-4 text-cv-blue" />
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isEs ? 'Actividad' : 'Activity'}
        </h3>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <DocumentTextIcon className="w-3.5 h-3.5 text-cv-blue" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{isEs ? 'Posts' : 'Posts'}</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{stats.totalPosts}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <HeartIcon className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{isEs ? 'Likes recibidos' : 'Likes received'}</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{stats.totalLikesReceived}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-green-500" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{isEs ? 'Comentarios' : 'Comments'}</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{stats.totalCommentsReceived}</span>
        </div>
        {engagementRate > 0 && (
          <div className="pt-2 mt-1 border-t border-gray-100 dark:border-dark-border/50 flex items-center gap-2">
            <FireIcon className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              {engagementRate} {isEs ? 'interacciones/post' : 'interactions/post'}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // ── Skills Card ──
  const SkillsCard = extras.skills.length > 0 ? (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <SparklesIcon className="w-4 h-4 text-indigo-500" />
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isEs ? 'Habilidades' : 'Skills'}
        </h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {extras.skills.map(skill => {
          const colorClass = LEVEL_COLORS[skill.level?.toLowerCase() || ''] || LEVEL_COLORS.beginner;
          return (
            <span
              key={skill.id}
              className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${colorClass}`}
            >
              {skill.name}
            </span>
          );
        })}
      </div>
    </div>
  ) : null;

  // ── Professional Info Card ──
  const ProfessionalCard = (extras.experiences.length > 0 || extras.educationCount > 0 || extras.languages.length > 0) ? (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <BriefcaseIcon className="w-4 h-4 text-cv-blue" />
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isEs ? 'Perfil profesional' : 'Professional'}
        </h3>
      </div>
      <div className="space-y-2.5">
        {extras.experiences.map(exp => (
          <div key={exp.id} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BriefcaseIcon className="w-3.5 h-3.5 text-cv-blue" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {exp.position || (isEs ? 'Profesional' : 'Professional')}
              </p>
              {exp.company && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{exp.company}</p>
              )}
              {exp.is_current && (
                <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full uppercase">
                  {isEs ? 'actual' : 'current'}
                </span>
              )}
            </div>
          </div>
        ))}
        {extras.educationCount > 0 && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
              <AcademicCapIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {extras.educationCount} {isEs ? 'formaciones' : 'degrees'}
            </p>
          </div>
        )}
        {extras.languages.length > 0 && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
              <LanguageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {extras.languages.length} {isEs ? 'idiomas' : 'languages'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {extras.languages.slice(0, 3).map(l => l.language).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // ── Groups Card ──
  const GroupsCard = extras.groups.length > 0 ? (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <UserGroupIcon className="w-4 h-4 text-cv-blue" />
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isEs ? 'Grupos' : 'Groups'}
        </h3>
      </div>
      <div className="space-y-2">
        {extras.groups.map(group => {
          const isGroupChannel = group.metadata?.type === 'channel';
          return (
            <button
              key={group.id}
              onClick={() => onSectionChange?.(isGroupChannel ? 'canales' : 'grupos')}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-left"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isGroupChannel ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                {isGroupChannel
                  ? <MegaphoneIcon className="w-4 h-4 text-purple-500" />
                  : <UserGroupIcon className="w-4 h-4 text-cv-blue" />
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{group.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {group.member_count} {isEs ? 'miembros' : 'members'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  // ── View CV Card ──
  const ViewCVCard = profile.slug ? (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-100 dark:to-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
        {isEs ? 'CV profesional' : 'Professional CV'}
      </p>
      <p className="text-sm font-bold text-white dark:text-gray-900 mb-3 leading-snug">
        {isEs ? `Explora el perfil completo de ${profile.full_name.split(' ')[0]}` : `Explore ${profile.full_name.split(' ')[0]}'s full profile`}
      </p>
      <a
        href={`/cv/${profile.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-gray-900 bg-white dark:text-white dark:bg-gray-900 rounded-xl hover:opacity-90 transition-opacity"
      >
        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        {tp.viewFullCV}
      </a>
    </div>
  ) : null;

  /* ═══════════════════════════════════════════════════
   *  MAIN RENDER
   * ═══════════════════════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-cv-blue transition-colors mb-4 group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        {tp.backToFeed}
      </button>

      {/* 3-column layout on xl, single column otherwise */}
      <div className="xl:grid xl:grid-cols-[260px_1fr_260px] xl:gap-5">

        {/* ═══ LEFT SIDEBAR (desktop only) ═══ */}
        <aside className="hidden xl:block space-y-4 self-start sticky top-4">
          {StatsCard}
          {ProfessionalCard}
        </aside>

        {/* ═══ CENTER COLUMN ═══ */}
        <div className="max-w-2xl mx-auto xl:max-w-none">

          {/* ═══ Profile Hero Card ═══ */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-sm mb-4">
            {/* Banner with mesh gradient */}
            <div className="h-28 sm:h-32 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cv-blue via-indigo-500 to-purple-600" />
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `radial-gradient(at 20% 50%, rgba(99,102,241,0.8) 0, transparent 50%),
                                  radial-gradient(at 80% 20%, rgba(168,85,247,0.6) 0, transparent 50%),
                                  radial-gradient(at 50% 80%, rgba(59,130,246,0.5) 0, transparent 50%)`,
              }} />
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />
              <div className="absolute top-3 right-8 w-16 h-16 rounded-full bg-white/10 blur-sm" />
              <div className="absolute bottom-2 left-12 w-10 h-10 rounded-full bg-white/10 blur-sm" />
            </div>

            <div className="px-5 sm:px-6 pb-5 relative">
              {/* Avatar + name */}
              <div className="flex items-end gap-4 -mt-12 mb-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt={profile.full_name}
                    className="w-[88px] h-[88px] rounded-full border-4 border-white dark:border-dark-bg-secondary shadow-lg object-cover bg-gray-100 dark:bg-dark-bg-tertiary"
                  />
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-[2.5px] border-white dark:border-dark-bg-secondary rounded-full" />
                </div>
                <div className="min-w-0 pb-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{profile.full_name}</h1>
                  </div>
                  {profile.headline && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug mt-0.5 line-clamp-2">{profile.headline}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                    {profile.country_code && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        {profile.country_code}
                      </span>
                    )}
                    {memberSince && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {memberSince}
                      </span>
                    )}
                    {currentJob && (
                      <span className="flex items-center gap-1">
                        <BriefcaseIcon className="w-3 h-3" />
                        {currentJob.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Follow row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">{followCounts.followers}</span>{' '}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{isEs ? 'seguidores' : 'followers'}</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">{followCounts.following}</span>{' '}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{isEs ? 'siguiendo' : 'following'}</span>
                  </span>
                </div>
                {!isOwnProfile && session && (
                  <button
                    onClick={toggleFollow}
                    disabled={followToggling || followLoading}
                    className={`ml-auto flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/40 group'
                        : 'bg-cv-blue text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 hover:shadow-lg'
                    }`}
                  >
                    {followToggling ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinusIcon className="w-4 h-4 hidden group-hover:block" />
                        <UserPlusIcon className="w-4 h-4 block group-hover:hidden" />
                        <span className="group-hover:hidden">{isEs ? 'Siguiendo' : 'Following'}</span>
                        <span className="hidden group-hover:inline">{isEs ? 'Dejar' : 'Unfollow'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-4 h-4" />
                        {isEs ? 'Seguir' : 'Follow'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Summary */}
              {profile.summary && (
                <div className="mb-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-3.5">
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">{profile.summary}</p>
                </div>
              )}

              {/* ═══ Stats Grid (mobile/tablet only) ═══ */}
              <div className="grid grid-cols-3 gap-2.5 mb-4 xl:hidden">
                <div className="bg-blue-50 dark:bg-blue-900/15 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <DocumentTextIcon className="w-3.5 h-3.5 text-cv-blue" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{stats.totalPosts}</span>
                  </div>
                  <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{tp.posts}</span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/15 rounded-xl p-3 text-center border border-rose-100 dark:border-rose-800/30">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <HeartIcon className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{stats.totalLikesReceived}</span>
                  </div>
                  <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">{tp.likesReceived}</span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/15 rounded-xl p-3 text-center border border-green-100 dark:border-green-800/30">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{stats.totalCommentsReceived}</span>
                  </div>
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">{tp.commentsReceived}</span>
                </div>
              </div>

              {/* ═══ Engagement badge (mobile/tablet only) ═══ */}
              {engagementRate > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-amber-50 dark:bg-amber-900/15 rounded-xl border border-amber-100 dark:border-amber-800/30 xl:hidden">
                  <FireIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {engagementRate} {isEs ? 'interacciones/post en promedio' : 'avg interactions/post'}
                  </span>
                </div>
              )}

              {/* ═══ Professional Highlights (mobile/tablet only) ═══ */}
              {(extras.experiences.length > 0 || extras.educationCount > 0 || extras.languages.length > 0) && (
                <div className="mb-4 xl:hidden">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {isEs ? 'Perfil profesional' : 'Professional highlights'}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {extras.experiences.length > 0 && (
                      <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                          <BriefcaseIcon className="w-3.5 h-3.5 text-cv-blue" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {extras.experiences.map((exp, i) => (
                            <div key={exp.id} className={i > 0 ? 'mt-1.5 pt-1.5 border-t border-gray-100 dark:border-dark-border/50' : ''}>
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {exp.position || (isEs ? 'Profesional' : 'Professional')}
                                {exp.is_current && <span className="ml-1.5 text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full uppercase">{isEs ? 'actual' : 'current'}</span>}
                              </p>
                              {exp.company && <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{exp.company}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {extras.educationCount > 0 && (
                        <div className="flex items-center gap-2 flex-1 p-2.5 bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl">
                          <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex-shrink-0">
                            <AcademicCapIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums">{extras.educationCount}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{isEs ? 'Educación' : 'Education'}</p>
                          </div>
                        </div>
                      )}
                      {extras.languages.length > 0 && (
                        <div className="flex items-center gap-2 flex-1 p-2.5 bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl">
                          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <LanguageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums">{extras.languages.length}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                              {extras.languages.slice(0, 3).map(l => l.language).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Skills (mobile/tablet only) ═══ */}
              {extras.skills.length > 0 && (
                <div className="mb-4 xl:hidden">
                  <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    {isEs ? 'Habilidades' : 'Skills'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {extras.skills.map(skill => {
                      const colorClass = LEVEL_COLORS[skill.level?.toLowerCase() || ''] || LEVEL_COLORS.beginner;
                      return (
                        <span
                          key={skill.id}
                          className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${colorClass}`}
                        >
                          {skill.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ CTA Button (mobile/tablet only) ═══ */}
              {profile.slug && (
                <a
                  href={`/cv/${profile.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 dark:from-white dark:to-gray-100 dark:text-gray-900 dark:hover:from-gray-100 dark:hover:to-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md xl:hidden"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  {tp.viewFullCV}
                </a>
              )}
            </div>
          </div>

          {/* ═══ Groups Card (mobile/tablet inline) ═══ */}
          {extras.groups.length > 0 && (
            <div className="xl:hidden mb-4">
              {GroupsCard}
            </div>
          )}

          {/* ═══ Create Post (own profile only) ═══ */}
          {isOwnProfile && authProfile && (
            <div className="mb-4">
              <CreatePostForm
                profile={authProfile}
                onSubmit={handlePostCreated}
                isSubmitting={isCreating}
                cooldown={postCooldown}
              />
            </div>
          )}

          {/* ═══ Posts Section ═══ */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-dark-border" />
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex-shrink-0">
              {tp.postsBy} {profile.full_name.split(' ')[0]}
            </h2>
            <div className="h-px flex-1 bg-gray-200 dark:bg-dark-border" />
          </div>

          {posts.length === 0 && !postsLoading ? (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-8 text-center">
              {isOwnProfile ? (
                <>
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <PencilSquareIcon className="w-7 h-7 text-cv-blue" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 text-sm font-semibold">
                    {isEs ? '¡Comparte tu primera publicación!' : 'Share your first post!'}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 max-w-xs mx-auto">
                    {isEs ? 'Cuéntale a la comunidad sobre ti, tus logros o proyectos' : 'Tell the community about yourself, your achievements or projects'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-gray-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-3">
                    <DocumentTextIcon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{tp.noPosts}</p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                    {isEs ? 'Aún no ha compartido publicaciones' : 'No posts shared yet'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <FeedPost
                  key={post.id}
                  post={post}
                  currentUserId={session?.user.id}
                  onPostUpdated={refreshPosts}
                  onPollVote={handlePollVote}
                  onNotify={sendNotification}
                  onAuthorClick={onSectionChange ? (uid: string) => onSectionChange(`perfil-usuario:${uid}`) : undefined}
                />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-4" />
          {postsLoading && <FeedSkeleton count={2} />}

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-6">
              — {isEs ? 'No hay más posts' : 'No more posts'} —
            </p>
          )}
        </div>

        {/* ═══ RIGHT SIDEBAR (desktop only) ═══ */}
        <aside className="hidden xl:block space-y-4 self-start sticky top-4">
          {SkillsCard}
          {GroupsCard}
          {ViewCVCard}
        </aside>
      </div>
    </div>
  );
};

export default UserFeedProfile;
