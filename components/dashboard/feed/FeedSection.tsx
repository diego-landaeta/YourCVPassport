import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { useFeed } from '../../../hooks/useFeed';
import { useFeedActions } from '../../../hooks/useFeedActions';
import CreatePostForm from './CreatePostForm';
import FeedPost from './FeedPost';
import ProfileCard from './ProfileCard';
import type { FeedContentType } from '../../../types/feed';
import FeedSkeleton from './FeedSkeleton';
import EmptyFeed from './EmptyFeed';
import NotificationBell from '../NotificationBell';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNotifications } from '../../../hooks/useNotifications';
import {
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  UserCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';

/* ── Left Sidebar: Quick Navigation ──────────────────────── */
const QuickNav: React.FC<{
  onSectionChange?: (section: string) => void;
  profileSlug?: string | null;
  onBookmarksClick?: () => void;
  bookmarksActive?: boolean;
}> = ({ onSectionChange, profileSlug, onBookmarksClick, bookmarksActive }) => {
  const t = useTranslations();
  const { lang } = useLanguage();
  const menu = t.dashboard.menu;

  const NAV_ITEMS: { id: string; icon: React.ReactNode; label: string; color: string }[] = [
    { id: 'mi-perfil',     icon: <UserCircleIcon className="w-[18px] h-[18px]" />,    label: menu.myProfile,       color: 'text-cv-blue'     },
    { id: 'analitica',     icon: <ChartBarIcon className="w-[18px] h-[18px]" />,      label: menu.analytics,       color: 'text-emerald-500' },
    { id: 'vacantes',      icon: <BriefcaseIcon className="w-[18px] h-[18px]" />,     label: menu.jobSearch,       color: 'text-indigo-500'  },
    { id: 'postulaciones', icon: <DocumentTextIcon className="w-[18px] h-[18px]" />,  label: menu.myApplications,  color: 'text-amber-500'   },
    { id: 'stamps',        icon: <ShieldCheckIcon className="w-[18px] h-[18px]" />,   label: menu.stamps,          color: 'text-purple-500'  },
    { id: 'ajustes',       icon: <Cog6ToothIcon className="w-[18px] h-[18px]" />,     label: menu.settings,        color: 'text-gray-500'    },
  ];

  return (
    <div className="space-y-4">
      {/* Quick navigation */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange?.(item.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* View CV button */}
      {profileSlug && (
        <a
          href={`/cv/${profileSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cv-blue to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all group text-sm font-semibold"
        >
          <EyeIcon className="w-4.5 h-4.5" />
          <span className="flex-1">{lang === 'es' ? 'Ver mi CV' : 'View my CV'}</span>
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>
      )}

      {/* Bookmarks shortcut */}
      <button
        onClick={() => onBookmarksClick?.()}
        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-sm text-sm font-medium transition-all group ${
          bookmarksActive
            ? 'bg-blue-50 dark:bg-blue-900/20 border-cv-blue/40 text-cv-blue'
            : 'bg-white dark:bg-dark-bg-secondary border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:text-cv-blue hover:border-cv-blue/30'
        }`}
      >
        <BookmarkIcon className="w-[18px] h-[18px] text-cv-blue" />
        <span>{lang === 'es' ? 'Guardados' : 'Saved posts'}</span>
      </button>
    </div>
  );
};

/* ── Sidebar: Trends Card ────────────────────────────────── */
const TrendsCard: React.FC<{ onTagClick: (tag: string) => void }> = ({ onTagClick }) => {
  const t = useTranslations();
  const trends = [
    { tag: '#ReactJS', count: '125k posts' },
    { tag: '#RemoteWork', count: '82k posts' },
    { tag: '#AIRevolution', count: '67k posts' },
    { tag: '#WebDev', count: '43k posts' },
  ];

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <ArrowTrendingUpIcon className="w-4 h-4 text-cv-blue" />
        </div>
        <h4 className="font-bold text-gray-800 dark:text-white text-sm">
          {t.feed.trends.title}
        </h4>
      </div>
      <ul className="space-y-1">
        {trends.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => onTagClick(item.tag)}
              className="w-full flex justify-between items-center p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary rounded-xl transition-colors text-left group"
            >
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-cv-blue transition-colors">{item.tag}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{item.count}</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 group-hover:text-cv-blue transition-all" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ── Sidebar: Footer Links ───────────────────────────────── */
const SidebarFooter: React.FC = () => {
  const t = useTranslations();
  const fl = t.feed.footerLinks;
  const links = [fl.about, fl.privacy, fl.terms, fl.helpCenter, fl.accessibility];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 px-1 text-[11px] text-gray-400 dark:text-gray-600">
      {links.map((link) => (
        <a key={link} href="#" className="hover:underline hover:text-gray-600 dark:hover:text-gray-400 transition-colors">{link}</a>
      ))}
      <span className="block w-full mt-1">&copy; 2026 YourCVPassport</span>
    </div>
  );
};

/* ── Feed Header (2 rows: top bar + filter pills) ────── */
const FeedHeader: React.FC<{
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewPost: () => void;
  onRefresh: () => void;
  contentFilter: FeedContentType | 'ALL';
  onContentFilterChange: (f: FeedContentType | 'ALL') => void;
  sortBy: 'recent' | 'top';
  onSortChange: (s: 'recent' | 'top') => void;
}> = ({ searchQuery, onSearchChange, onNewPost, onRefresh, contentFilter, onContentFilterChange, sortBy, onSortChange }) => {
  const t = useTranslations();
  const tt = t.feed.toolbar;
  const th = t.feed.header;
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  const sortLabel = sortBy === 'recent' ? tt.sortRecent : tt.sortTop;

  const FILTERS: { value: FeedContentType | 'ALL'; label: string }[] = [
    { value: 'ALL',          label: tt.all },
    { value: 'TEXT',         label: tt.posts },
    { value: 'IMAGE',        label: tt.photos },
    { value: 'ACHIEVEMENT',  label: tt.achievements },
    { value: 'JOB_UPDATE',   label: tt.jobUpdates },
    { value: 'MILESTONE',    label: tt.milestones },
    { value: 'POLL',         label: tt.polls || 'Polls' },
    { value: 'EVENT',        label: tt.events || 'Events' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
      {/* Row 1: Title + Search + Actions */}
      <div className="px-4 sm:px-5 h-14 flex items-center gap-3">
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex-shrink-0">
          Feed
        </h1>

        {/* Search */}
        <div className="flex-1 max-w-sm relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={tt.searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 dark:bg-dark-bg-tertiary rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cv-blue/20 focus:bg-white dark:focus:bg-dark-bg-primary border border-transparent focus:border-cv-blue/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
            title={th.refreshFeed}
          >
            <ArrowPathIcon className="w-[18px] h-[18px]" />
          </button>

          <NotificationBell />

          <button
            onClick={onNewPost}
            className="flex items-center gap-1.5 ml-1 px-4 py-2 text-sm font-semibold text-white bg-cv-blue hover:bg-blue-700 rounded-lg transition-colors active:scale-[0.97]"
          >
            <PencilSquareIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{th.newPost}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Filter tabs + Sort */}
      <div className="px-4 sm:px-5 pb-0 flex items-center gap-2">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 -mb-px">
          {FILTERS.map((filter) => {
            const isActive = contentFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => onContentFilterChange(filter.value)}
                className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors relative flex-shrink-0 ${
                  isActive
                    ? 'text-cv-blue'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {filter.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-cv-blue rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div ref={sortRef} className="relative flex-shrink-0 -mb-px">
          <button
            onClick={() => setSortOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {sortLabel}
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden z-50">
              {[
                { value: 'recent' as const, label: tt.sortRecent },
                { value: 'top' as const, label: tt.sortTop },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => { onSortChange(option.value); setSortOpen(false); }}
                  className={`w-full px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                    sortBy === option.value
                      ? 'text-cv-blue bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/* ── Main FeedSection ────────────────────────────────────── */
interface FeedSectionProps {
  onSectionChange?: (section: string) => void;
}

const FeedSection: React.FC<FeedSectionProps> = ({ onSectionChange }) => {
  const { profile, session } = useAuth();
  const t = useTranslations();
  const { lang } = useLanguage();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const createPostRef = useRef<HTMLDivElement>(null);

  const { posts, loading, error, hasMore, loadMore, createPost, refreshFeed, isCreating, postCooldown } = useFeed();
  const { votePoll } = useFeedActions();
  const { sendNotification } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [contentFilter, setContentFilter] = useState<FeedContentType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    // Clear debounce immediately when clearing search
    if (!q) setDebouncedSearch('');
  }, []);

  const filteredPosts = useMemo(() => {
    let result = posts;

    // Bookmarks filter
    if (showBookmarks) {
      result = result.filter(p => p.hasBookmarked);
    }

    // Content type filter
    if (contentFilter !== 'ALL') {
      result = result.filter(p => p.content_type === contentFilter);
    }

    // Search filter (uses debounced value)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(post =>
        post.content.toLowerCase().includes(q) ||
        post.author?.full_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'top') {
      result = [...result].sort((a, b) => b.likes_count - a.likes_count);
    }

    // Always float pinned posts to the top
    result = [...result].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

    return result;
  }, [posts, debouncedSearch, contentFilter, sortBy, showBookmarks]);

  useEffect(() => {
    if (loading) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, loadMore]);

  const handlePostCreated = useCallback(async (
    content: string,
    images: string[],
    contentType?: FeedContentType,
    achievementType?: string,
    achievementData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => {
    await createPost({
      content,
      imageUrls: images,
      contentType: contentType || (images.length > 0 ? 'IMAGE' : 'TEXT'),
      achievementType,
      achievementData,
      metadata,
    });
  }, [createPost]);

  const handlePollVote = useCallback(async (postId: string, optionIndex: number) => {
    return votePoll(postId, optionIndex);
  }, [votePoll]);

  const handleBookmarksClick = useCallback(() => {
    setShowBookmarks(prev => !prev);
    // Clear other filters when toggling bookmarks
    if (!showBookmarks) {
      setContentFilter('ALL');
      handleSearchChange('');
    }
  }, [showBookmarks, handleSearchChange]);

  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3B82F6&color=fff&size=80`;

  const { myPostsCount, myLikesReceived, myCommentsReceived } = useMemo(() => {
    if (!session?.user.id) return { myPostsCount: 0, myLikesReceived: 0, myCommentsReceived: 0 };
    const mine = posts.filter((p) => p.author_id === session.user.id);
    return {
      myPostsCount: mine.length,
      myLikesReceived: mine.reduce((a, p) => a + (p.likes_count || 0), 0),
      myCommentsReceived: mine.reduce((a, p) => a + (p.comments_count || 0), 0),
    };
  }, [posts, session?.user.id]);

  const scrollToCreatePost = () => {
    createPostRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus the textarea after scroll
    setTimeout(() => {
      const textarea = createPostRef.current?.querySelector('textarea');
      textarea?.focus();
    }, 400);
  };

  const handleRefresh = () => {
    handleSearchChange('');
    setShowBookmarks(false);
    refreshFeed();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen -mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Sticky header */}
      <FeedHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onNewPost={scrollToCreatePost}
        onRefresh={handleRefresh}
        contentFilter={contentFilter}
        onContentFilterChange={setContentFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left sidebar — quick nav */}
        <div className="hidden xl:flex xl:col-span-2 flex-col gap-4 sticky top-[6.5rem] z-10">
          <QuickNav onSectionChange={onSectionChange} profileSlug={profile?.slug} onBookmarksClick={handleBookmarksClick} bookmarksActive={showBookmarks} />
        </div>

        <div className="lg:col-span-8 xl:col-span-7 space-y-5">

          <div ref={createPostRef}>
            <CreatePostForm profile={profile} onSubmit={handlePostCreated} isSubmitting={isCreating} cooldown={postCooldown} />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              <button onClick={refreshFeed} className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline font-medium">{t.feed.errors.retry}</button>
            </div>
          )}

          {showBookmarks && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
              <BookmarkIcon className="w-4 h-4 text-cv-blue flex-shrink-0" />
              <p className="text-sm text-cv-blue font-medium flex-1">
                {filteredPosts.length} {lang === 'es' ? 'guardados' : 'saved'}
              </p>
              <button onClick={() => setShowBookmarks(false)} className="text-xs text-cv-blue hover:text-blue-700 font-semibold">
                {t.feed.search.clear}
              </button>
            </div>
          )}

          {debouncedSearch.trim() && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
              <MagnifyingGlassIcon className="w-4 h-4 text-cv-blue flex-shrink-0" />
              <p className="text-sm text-cv-blue font-medium flex-1">
                {filteredPosts.length} {filteredPosts.length !== 1 ? t.feed.search.resultMany : t.feed.search.resultOne} &ldquo;{debouncedSearch}&rdquo;
              </p>
              <button onClick={() => handleSearchChange('')} className="text-xs text-cv-blue hover:text-blue-700 font-semibold">
                {t.feed.search.clear}
              </button>
            </div>
          )}

          {loading && posts.length === 0 ? (
            <FeedSkeleton count={3} />
          ) : filteredPosts.length === 0 ? (
            debouncedSearch.trim() || contentFilter !== 'ALL' || showBookmarks ? (
              <div className="text-center py-12">
                {showBookmarks ? (
                  <>
                    <BookmarkIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{lang === 'es' ? 'No tienes publicaciones guardadas' : 'No saved posts yet'}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{lang === 'es' ? 'Guarda publicaciones para verlas aquí' : 'Bookmark posts to see them here'}</p>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t.feed.search.noResults}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t.feed.search.noResultsHint}</p>
                  </>
                )}
              </div>
            ) : (
              <EmptyFeed />
            )
          ) : (
            <>
              <div className="space-y-5">
                {filteredPosts.map((post) => (
                  <FeedPost key={post.id} post={post} currentUserId={session?.user.id} onPostUpdated={refreshFeed} onHashtagClick={handleSearchChange} onPollVote={handlePollVote} onNotify={sendNotification} />
                ))}
              </div>
              {/* Intersection observer target */}
              <div ref={loadMoreRef} className="h-4" />
              {loading && <FeedSkeleton count={1} />}
              {!hasMore && filteredPosts.length > 0 && !debouncedSearch.trim() && (
                <p className="text-gray-400 dark:text-gray-600 text-sm py-8 text-center">
                  — {t.feed.endOfFeed} —
                </p>
              )}
            </>
          )}
        </div>

        <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-5 sticky top-[6.5rem] z-10">
          {profile && (
            <ProfileCard
              profile={profile}
              avatarUrl={avatarUrl}
              myPostsCount={myPostsCount}
              myLikesReceived={myLikesReceived}
              myCommentsReceived={myCommentsReceived}
              onSectionChange={onSectionChange}
            />
          )}
          <TrendsCard onTagClick={handleSearchChange} />
          <SidebarFooter />
        </div>
      </main>

      {/* ── Bottom Floating Pill ── */}
      <div
        className="fixed left-1/2 lg:hidden"
        style={{
          bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
          transform: 'translateX(-50%)',
          zIndex: 9999,
        }}
      >
        <div
          className="flex items-center gap-1 bg-white dark:bg-gray-900 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-2"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-gray-900 font-bold text-[10px] tracking-tighter flex-shrink-0 mr-1">
            CV
          </div>
          {[
            { id: 'dashboard', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'feed', d: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
            { id: 'vacantes', d: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { id: 'leads', d: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange?.(item.id)}
              className="p-2.5 rounded-full transition-all text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.d} />
              </svg>
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1.5" />
          <img
            src={avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover flex-shrink-0"
          />
        </div>
      </div>
    </div>
  );
};

export default FeedSection;
