import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { useFeed } from '../../../hooks/useFeed';
import { useFeedActions } from '../../../hooks/useFeedActions';
import { useGroups } from '../../../hooks/useGroups';
import { useFollows } from '../../../hooks/useFollows';
import CreatePostForm from './CreatePostForm';
import FeedPost from './FeedPost';
import ProfileCard from './ProfileCard';
import type { FeedContentType } from '../../../types/feed';
import type { Group } from '../../../types/groups';
import FeedSkeleton from './FeedSkeleton';
import EmptyFeed from './EmptyFeed';
import NotificationBell from '../NotificationBell';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNotifications } from '../../../hooks/useNotifications';
import PushNotificationPrompt from '../../shared/PushNotificationPrompt';
import { supabase } from '../../../supabase/client';
import {
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  UserCircleIcon,
  BookmarkIcon,
  UserGroupIcon,
  HashtagIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  PhotoIcon,
  TrophyIcon,
  BriefcaseIcon,
  FlagIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BellIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

/* ── Left Sidebar: Feed Navigation ────────────────────────── */
const FeedNavCard: React.FC<{
  onBookmarks: () => void;
  onMyPosts: () => void;
  onFilterEvents: () => void;
  onFollowing: () => void;
  onSectionChange?: (section: string) => void;
  showBookmarks: boolean;
  showMyPosts: boolean;
  showFollowing: boolean;
}> = ({ onBookmarks, onMyPosts, onFilterEvents, onFollowing, onSectionChange, showBookmarks, showMyPosts, showFollowing }) => {
  const { lang } = useLanguage();

  const items = [
    { label: lang === 'es' ? 'Siguiendo' : 'Following', icon: UsersIcon, action: onFollowing, active: showFollowing },
    { label: lang === 'es' ? 'Guardados' : 'Saved', icon: BookmarkIcon, action: onBookmarks, active: showBookmarks },
    { label: lang === 'es' ? 'Mis posts' : 'My posts', icon: UserCircleIcon, action: onMyPosts, active: showMyPosts },
    { label: lang === 'es' ? 'Perfiles' : 'Profiles', icon: UsersIcon, action: () => onSectionChange?.('perfiles'), active: false },
    { label: lang === 'es' ? 'Grupos' : 'Groups', icon: UserGroupIcon, action: () => onSectionChange?.('grupos'), active: false },
    { label: lang === 'es' ? 'Canales' : 'Channels', icon: HashtagIcon, action: () => onSectionChange?.('canales'), active: false },
    { label: lang === 'es' ? 'Notificaciones' : 'Notifications', icon: BellIcon, action: () => onSectionChange?.('notificaciones'), active: false },
    { label: lang === 'es' ? 'Eventos' : 'Events', icon: CalendarDaysIcon, action: onFilterEvents, active: false },
  ];

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm p-3">
      <nav className="space-y-1">
        {items.map(({ label, icon: Icon, action, active }) => (
          <button
            key={label}
            onClick={action}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
              active
                ? 'bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
            }`}
          >
            <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-cv-blue' : 'text-gray-400 dark:text-gray-500'}`} />
            <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

/* ── Left Sidebar: My Groups & Channels ──────────────────── */
const MyCommunitiesCard: React.FC<{
  myGroups: Group[];
  onSectionChange?: (section: string) => void;
}> = ({ myGroups, onSectionChange }) => {
  const { lang } = useLanguage();

  const groups   = myGroups.filter(g => (g.metadata as any)?.type !== 'channel').slice(0, 5);
  const channels = myGroups.filter(g => (g.metadata as any)?.type === 'channel').slice(0, 3);

  if (groups.length === 0 && channels.length === 0) return null;

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
      {/* Groups */}
      {groups.length > 0 && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <UserGroupIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {lang === 'es' ? 'Mis grupos' : 'My groups'}
              </span>
            </div>
            <button
              onClick={() => onSectionChange?.('grupos')}
              className="text-[10px] font-semibold text-cv-blue hover:underline"
            >
              {lang === 'es' ? 'Ver todos' : 'See all'}
            </button>
          </div>
          <ul className="space-y-0.5">
            {groups.map((g) => (
              <li key={g.id}>
                <button
                  onClick={() => onSectionChange?.('grupos')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors group"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cv-blue to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold text-white leading-none">
                      {g.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white truncate font-medium">
                    {g.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Channels */}
      {channels.length > 0 && (
        <div className={`p-3 ${groups.length > 0 ? 'border-t border-gray-100 dark:border-dark-border/50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <HashtagIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {lang === 'es' ? 'Canales' : 'Channels'}
              </span>
            </div>
            <button
              onClick={() => onSectionChange?.('canales')}
              className="text-[10px] font-semibold text-cv-blue hover:underline"
            >
              {lang === 'es' ? 'Ver todos' : 'See all'}
            </button>
          </div>
          <ul className="space-y-0.5">
            {channels.map((ch) => (
              <li key={ch.id}>
                <button
                  onClick={() => onSectionChange?.('canales')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors group"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <HashtagIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white truncate font-medium">
                    {ch.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discover CTA */}
      <div className="px-3 py-2.5 border-t border-gray-100 dark:border-dark-border/50">
        <button
          onClick={() => onSectionChange?.('grupos')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors group"
        >
          <PlusCircleIcon className="w-4 h-4 text-gray-400 group-hover:text-cv-blue transition-colors" />
          <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-cv-blue transition-colors font-medium">
            {lang === 'es' ? 'Descubrir comunidades' : 'Discover communities'}
          </span>
        </button>
      </div>
    </div>
  );
};

/* ── Left Sidebar: Active Members ────────────────────────── */
type ActiveMember = { id: string; full_name: string; avatar_url: string | null; slug: string | null; headline: string | null };

const ActiveMembersCard: React.FC<{ onSectionChange?: (section: string) => void }> = ({ onSectionChange }) => {
  const { lang } = useLanguage();
  const [members, setMembers] = useState<ActiveMember[]>([]);

  useEffect(() => {
    const load = async () => {
      // Query profiles directly — much faster than scanning 50 posts
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, slug, headline')
        .eq('is_public', true)
        .not('full_name', 'is', null)
        .not('avatar_url', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5);

      setMembers((data as ActiveMember[]) ?? []);
    };
    load();
  }, []);

  if (members.length === 0) return null;

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm p-3">
      <div className="flex items-center gap-1.5 px-1 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {lang === 'es' ? 'Miembros activos' : 'Active members'}
        </span>
      </div>
      <ul className="space-y-1">
        {members.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => onSectionChange?.(`perfil-usuario:${m.id}`)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors group text-left"
            >
              {m.avatar_url ? (
                <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cv-blue text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-cv-blue truncate transition-colors">
                  {m.full_name}
                </p>
                {m.headline && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
                    {m.headline}
                  </p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ── Right Sidebar: Trends Card ──────────────────────────── */
const TrendsCard: React.FC<{ onTagClick: (tag: string) => void }> = ({ onTagClick }) => {
  const t = useTranslations();
  const { lang } = useLanguage();
  const [trends, setTrends] = useState<{ tag: string; count: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('feed_posts')
          .select('content')
          .eq('is_hidden', false)
          .eq('visibility', 'PUBLIC')
          .gte('created_at', thirtyDaysAgo)
          .limit(50);

        if (!data?.length) { setLoading(false); return; }

        const counts: Record<string, number> = {};
        for (const { content } of data) {
          // Unicode-aware regex: matches accented chars (á, é, ñ, etc.)
          const tags = (content as string).match(/#[\p{L}\p{N}_]+/giu) ?? [];
          for (const tag of tags) {
            // Skip purely numeric hashtags like #1, #2, #123
            if (/^#\d+$/.test(tag)) continue;
            const normalized = tag.toLowerCase();
            counts[normalized] = (counts[normalized] ?? 0) + 1;
          }
        }

        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({
            tag,
            count: count >= 1000
              ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k posts`
              : `${count} post${count !== 1 ? 's' : ''}`,
          }));

        setTrends(sorted);
      } catch (err) {
        console.error('TrendsCard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const cardShell = (children: React.ReactNode) => (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <ArrowTrendingUpIcon className="w-4 h-4 text-cv-blue" />
        </div>
        <h4 className="font-bold text-gray-800 dark:text-white text-sm">{t.feed.trends.title}</h4>
      </div>
      {children}
    </div>
  );

  if (loading) return cardShell(
    <div className="space-y-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="animate-pulse h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      ))}
    </div>
  );

  if (!trends.length) {
    // Fallback: show suggested topics when no real trends exist
    const isEs = lang === 'es';
    const suggested = [
      { tag: '#OpenToWork', desc: isEs ? 'Busca oportunidades' : 'Find opportunities' },
      { tag: '#Tecnología', desc: isEs ? 'Innovación y desarrollo' : 'Innovation & development' },
      { tag: '#ConsejosCV', desc: isEs ? 'Mejora tu currículum' : 'Improve your resume' },
      { tag: '#Networking', desc: isEs ? 'Conecta y crece' : 'Connect & grow' },
      { tag: '#DesarrolloProfesional', desc: isEs ? 'Crece en tu carrera' : 'Grow your career' },
    ];
    return cardShell(
      <ul className="space-y-0.5">
        {suggested.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => onTagClick(item.tag)}
              className="w-full flex justify-between items-center p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary rounded-xl transition-colors text-left group"
            >
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-cv-blue transition-colors">{item.tag}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 group-hover:text-cv-blue transition-all" />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return cardShell(
    <ul className="space-y-0.5">
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
  );
};

/* ── Right Sidebar: Suggested Communities ────────────────── */
const SuggestedCommunitiesCard: React.FC<{
  suggestedGroups: Group[];
  onSectionChange?: (section: string) => void;
}> = ({ suggestedGroups, onSectionChange }) => {
  const { lang } = useLanguage();
  const items = suggestedGroups.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800 dark:text-white text-sm">
          {lang === 'es' ? 'Comunidades sugeridas' : 'Suggested communities'}
        </h4>
      </div>
      <ul className="space-y-3">
        {items.map((g) => {
          const isChannel = (g.metadata as any)?.type === 'channel';
          return (
            <li key={g.id} className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                isChannel
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                  : 'bg-gradient-to-br from-cv-blue to-indigo-600'
              }`}>
                {isChannel
                  ? <HashtagIcon className="w-4 h-4 text-white" />
                  : <span className="text-xs font-bold text-white">{g.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{g.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {g.member_count ?? 0} {lang === 'es' ? 'miembros' : 'members'}
                </p>
              </div>
              <button
                onClick={() => onSectionChange?.('grupos')}
                className="flex-shrink-0 text-[11px] font-semibold text-cv-blue border border-cv-blue/30 rounded-lg px-2 py-1 hover:bg-cv-blue hover:text-white transition-all"
              >
                {lang === 'es' ? 'Unirse' : 'Join'}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        onClick={() => onSectionChange?.('grupos')}
        className="mt-3 w-full text-xs font-semibold text-cv-blue hover:underline text-center"
      >
        {lang === 'es' ? 'Ver todas las comunidades' : 'See all communities'} →
      </button>
    </div>
  );
};

/* ── Right Sidebar: Footer Links ─────────────────────────── */
const SidebarFooter: React.FC = () => {
  const t = useTranslations();
  const fl = t.feed.footerLinks;
  const links = [fl.about, fl.privacy, fl.terms, fl.helpCenter, fl.accessibility];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-[11px] text-gray-400 dark:text-gray-600">
      {links.map((link) => (
        <a key={link} href="#" className="hover:underline hover:text-gray-600 dark:hover:text-gray-400 transition-colors">{link}</a>
      ))}
      <span className="block w-full mt-1">&copy; 2026 YourCVPassport</span>
    </div>
  );
};

/* ── Feed Header (sticky: filter tabs + search + actions — desktop only) ── */
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
  const { lang } = useLanguage();
  const [sortOpen, setSortOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);

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

  // Ctrl+K / Cmd+K focuses desktop search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        desktopSearchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const sortLabel = sortBy === 'recent' ? tt.sortRecent : tt.sortTop;

  const FILTERS: { value: FeedContentType | 'ALL'; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { value: 'ALL',          label: tt.all,                    icon: Squares2X2Icon },
    { value: 'TEXT',         label: tt.posts,                  icon: DocumentTextIcon },
    { value: 'IMAGE',        label: tt.photos,                 icon: PhotoIcon },
    { value: 'ACHIEVEMENT',  label: tt.achievements,           icon: TrophyIcon },
    { value: 'JOB_UPDATE',   label: tt.jobUpdates,             icon: BriefcaseIcon },
    { value: 'MILESTONE',    label: tt.milestones,             icon: FlagIcon },
    { value: 'POLL',         label: tt.polls || 'Polls',       icon: ChartBarIcon },
    { value: 'EVENT',        label: tt.events || 'Events',     icon: CalendarDaysIcon },
  ];

  return (
    <header className="hidden sm:block sticky top-0 z-40 bg-white/95 dark:bg-dark-bg-primary/95 backdrop-blur-md border-b border-gray-200/70 dark:border-dark-border shadow-sm">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: Search | Actions */}
          <div className="flex items-center gap-3 h-[52px]">
            {/* Brand */}
            <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cv-blue to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
                  <UserGroupIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 border-[1.5px] border-white dark:border-dark-bg-primary rounded-full" />
              </div>
              <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-tight">
                YourCVPassport
              </p>
            </div>

            {/* Search */}
            <div className={`relative flex items-center h-[36px] rounded-full flex-1 transition-all duration-200 ${
              searchFocused
                ? 'bg-white dark:bg-dark-bg-secondary border border-cv-blue/50 shadow-lg shadow-cv-blue/10 ring-2 ring-cv-blue/10'
                : 'bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <div className={`absolute left-3.5 transition-colors duration-200 ${searchFocused ? 'text-cv-blue' : 'text-gray-400'}`}>
                <MagnifyingGlassIcon className="w-4 h-4 pointer-events-none" />
              </div>
              <input
                ref={desktopSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={lang === 'es' ? 'Busca posts, personas, comunidades...' : 'Search posts, people, communities...'}
                className="h-full w-full pl-10 pr-14 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              {searchQuery ? (
                <button onClick={() => onSearchChange('')} className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="absolute right-3 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-bg-tertiary border border-gray-200/80 dark:border-dark-border/80 rounded-md select-none tracking-tight">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-0.5 flex-shrink-0">
              <div ref={sortRef} className="relative">
                <button onClick={() => setSortOpen((p) => !p)} title={sortLabel}
                  className={`p-1.5 rounded-lg transition-colors ${sortBy !== 'recent' ? 'text-cv-blue bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-dark-bg-secondary'}`}>
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl shadow-black/10 border border-gray-200 dark:border-dark-border overflow-hidden z-50">
                    {[{ value: 'recent' as const, label: tt.sortRecent }, { value: 'top' as const, label: tt.sortTop }].map((opt) => (
                      <button key={opt.value} onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs font-medium transition-colors flex items-center gap-2 ${sortBy === opt.value ? 'text-cv-blue bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'}`}>
                        {sortBy === opt.value && <span className="w-1 h-1 rounded-full bg-cv-blue flex-shrink-0" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={onRefresh} title={th.refreshFeed}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-dark-bg-secondary rounded-lg transition-colors">
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              <NotificationBell />
              <button onClick={onNewPost}
                className="flex items-center gap-1.5 ml-2 px-4 py-1.5 text-sm font-semibold text-white bg-cv-blue hover:bg-blue-700 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40">
                <PencilSquareIcon className="w-4 h-4" />
                {th.newPost}
              </button>
            </div>
          </div>

          {/* Row 2: filter tabs */}
          <div className="overflow-x-auto scrollbar-hide h-11">
            <div className="flex items-stretch h-full w-max mx-auto">
              {FILTERS.map((filter) => {
                const isActive = contentFilter === filter.value;
                const Icon = filter.icon;
                return (
                  <button key={filter.value} onClick={() => onContentFilterChange(filter.value)} title={filter.label}
                    className={`h-full relative flex-shrink-0 transition-all flex items-center gap-2 ${isActive ? 'px-4 text-cv-blue' : 'px-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                    <Icon className={`flex-shrink-0 transition-all ${isActive ? 'w-[18px] h-[18px]' : 'w-[17px] h-[17px]'}`} />
                    {isActive && <span className="text-[13px] font-semibold whitespace-nowrap">{filter.label}</span>}
                    {isActive && <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-cv-blue rounded-full" />}
                  </button>
                );
              })}
            </div>
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

  // Filter/search state declared BEFORE useFeed so they can be passed as args
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [contentFilter, setContentFilter] = useState<FeedContentType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (!q) setDebouncedSearch('');
  }, []);

  // Server-side filtering: useFeed refetches when contentFilter or debouncedSearch change
  const { posts, loading, error, hasMore, loadMore, createPost, refreshFeed, isCreating, postCooldown } = useFeed(contentFilter, debouncedSearch);
  const { votePoll } = useFeedActions();
  const { sendNotification } = useNotifications();
  const { myGroups, suggestedGroups } = useGroups();
  const { fetchFollowingIds } = useFollows();

  // contentFilter + debouncedSearch are handled server-side by useFeed
  // Only client-side operations: bookmarks, my-posts, following, sort, pinned
  const filteredPosts = useMemo(() => {
    let result = posts;

    if (showMyPosts) {
      result = result.filter(p => p.author_id === session?.user.id);
    }
    if (showBookmarks) {
      result = result.filter(p => p.hasBookmarked);
    }
    if (showFollowing && followingIds.length > 0) {
      result = result.filter(p => followingIds.includes(p.author_id));
    }
    if (sortBy === 'top') {
      result = [...result].sort((a, b) => b.likes_count - a.likes_count);
    }
    result = [...result].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

    return result;
  }, [posts, sortBy, showBookmarks, showMyPosts, showFollowing, followingIds, session?.user.id]);

  useEffect(() => {
    if (loading) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, loadMore]);

  useEffect(() => {
    const onCompose    = () => scrollToCreatePost();
    const onBookmarks  = () => { setShowBookmarks(true); setShowMyPosts(false); setContentFilter('ALL'); };
    const onMyPosts    = () => { setShowMyPosts(true); setShowBookmarks(false); setContentFilter('ALL'); };
    const onRefresh    = () => handleRefresh();
    const onFilterImage = () => { setContentFilter('IMAGE'); setShowBookmarks(false); setShowMyPosts(false); };
    const onFilterPoll  = () => { setContentFilter('POLL');  setShowBookmarks(false); setShowMyPosts(false); };
    const onFilterAll   = () => { setContentFilter('ALL');   setShowBookmarks(false); setShowMyPosts(false); };
    const onNavigateProfile = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.userId && onSectionChange) {
        onSectionChange(`perfil-usuario:${detail.userId}`);
      }
    };

    window.addEventListener('feed-open-composer',  onCompose);
    window.addEventListener('feed-show-bookmarks', onBookmarks);
    window.addEventListener('feed-show-my-posts',  onMyPosts);
    window.addEventListener('feed-refresh',        onRefresh);
    window.addEventListener('feed-filter-image',   onFilterImage);
    window.addEventListener('feed-filter-poll',    onFilterPoll);
    window.addEventListener('feed-filter-all',     onFilterAll);
    window.addEventListener('feed-navigate-to-profile', onNavigateProfile);
    return () => {
      window.removeEventListener('feed-open-composer',  onCompose);
      window.removeEventListener('feed-show-bookmarks', onBookmarks);
      window.removeEventListener('feed-show-my-posts',  onMyPosts);
      window.removeEventListener('feed-refresh',        onRefresh);
      window.removeEventListener('feed-filter-image',   onFilterImage);
      window.removeEventListener('feed-filter-poll',    onFilterPoll);
      window.removeEventListener('feed-filter-all',     onFilterAll);
      window.removeEventListener('feed-navigate-to-profile', onNavigateProfile);
    };
  }, []);

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
  }, [createPost]);

  const handlePollVote = useCallback(async (postId: string, optionIndex: number) => {
    return votePoll(postId, optionIndex);
  }, [votePoll]);

  const handleBookmarksClick = useCallback(() => {
    setShowBookmarks(prev => !prev);
    setShowMyPosts(false);
    setShowFollowing(false);
    if (!showBookmarks) {
      setContentFilter('ALL');
      handleSearchChange('');
    }
  }, [showBookmarks, handleSearchChange]);

  const handleFollowingClick = useCallback(async () => {
    const wasActive = showFollowing;
    setShowFollowing(prev => !prev);
    setShowBookmarks(false);
    setShowMyPosts(false);
    if (!wasActive) {
      setContentFilter('ALL');
      handleSearchChange('');
      const ids = await fetchFollowingIds();
      setFollowingIds(ids);
    }
  }, [showFollowing, handleSearchChange, fetchFollowingIds]);

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
    setTimeout(() => {
      const textarea = createPostRef.current?.querySelector('textarea');
      textarea?.focus();
    }, 400);
  };

  const handleRefresh = () => {
    handleSearchChange('');
    setShowBookmarks(false);
    setShowMyPosts(false);
    setShowFollowing(false);
    setContentFilter('ALL');
    refreshFeed();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 pb-6 sm:pb-0">
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

      {/*
        Three-column layout:
          mobile  → single column (full width)
          lg      → center (1fr) + right sidebar (296px)
          xl      → left sidebar (240px) + center (1fr) + right sidebar (296px)
      */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_296px] xl:grid-cols-[240px_minmax(0,1fr)_296px] gap-4 sm:gap-6 items-start">

        {/* ── Left sidebar (xl only) ── */}
        <aside className="hidden xl:flex flex-col gap-4 sticky top-24 max-h-[calc(100vh-6.5rem)] overflow-y-auto overflow-x-hidden scrollbar-thin">
          <FeedNavCard
            onBookmarks={handleBookmarksClick}
            onMyPosts={() => { setShowMyPosts(prev => !prev); setShowBookmarks(false); setShowFollowing(false); }}
            onFilterEvents={() => { setContentFilter('EVENT'); setShowBookmarks(false); setShowMyPosts(false); setShowFollowing(false); }}
            onFollowing={handleFollowingClick}
            onSectionChange={onSectionChange}
            showBookmarks={showBookmarks}
            showMyPosts={showMyPosts}
            showFollowing={showFollowing}
          />
          <MyCommunitiesCard myGroups={myGroups} onSectionChange={onSectionChange} />
          <ActiveMembersCard onSectionChange={onSectionChange} />
        </aside>

        {/* ── Center: feed ── */}
        <div className="min-w-0 space-y-3 sm:space-y-4">

          <div ref={createPostRef}>
            <CreatePostForm profile={profile} onSubmit={handlePostCreated} isSubmitting={isCreating} cooldown={postCooldown} />
          </div>

          {/* Mobile search bar (hidden on sm+ where FeedHeader has search) */}
          <div className="sm:hidden">
            <div className="flex items-center gap-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-2xl px-3.5 py-2 shadow-sm">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={lang === 'es' ? 'Buscar posts...' : 'Search posts...'}
                className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none min-w-0"
              />
              {searchQuery && (
                <button onClick={() => handleSearchChange('')} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              <button onClick={refreshFeed} className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline font-medium">{t.feed.errors.retry}</button>
            </div>
          )}

          {/* Active filter indicators */}
          {/* Filter indicators removed — sidebar active state is sufficient */}

          {showFollowing && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30">
              <UsersIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400 font-medium flex-1">
                {followingIds.length > 0
                  ? `${filteredPosts.length} ${lang === 'es' ? 'posts de personas que sigues' : 'posts from people you follow'}`
                  : (lang === 'es' ? 'Aún no sigues a nadie' : "You're not following anyone yet")
                }
              </p>
              <button onClick={() => setShowFollowing(false)} className="text-xs text-green-600 hover:text-green-700 font-semibold">
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

          {/* Post list */}
          {loading && posts.length === 0 ? (
            <FeedSkeleton count={3} />
          ) : filteredPosts.length === 0 ? (
            debouncedSearch.trim() || contentFilter !== 'ALL' || showBookmarks || showMyPosts || showFollowing ? (
              <div className="text-center py-16">
                {showBookmarks ? (
                  <>
                    <BookmarkIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{lang === 'es' ? 'No tienes publicaciones guardadas' : 'No saved posts yet'}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{lang === 'es' ? 'Guarda publicaciones para verlas aquí' : 'Bookmark posts to see them here'}</p>
                  </>
                ) : showMyPosts ? (
                  <>
                    <UserCircleIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{lang === 'es' ? 'Aún no tienes publicaciones' : 'No posts yet'}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{lang === 'es' ? 'Comparte algo con la comunidad' : 'Share something with the community'}</p>
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
              <div className="space-y-3 sm:space-y-4">
                {filteredPosts.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={post}
                    currentUserId={session?.user.id}
                    onPostUpdated={refreshFeed}
                    onHashtagClick={handleSearchChange}
                    onPollVote={handlePollVote}
                    onNotify={sendNotification}
                    onAuthorClick={onSectionChange ? (userId: string) => onSectionChange(`perfil-usuario:${userId}`) : undefined}
                  />
                ))}
              </div>
              <div ref={loadMoreRef} className="h-4" />
              {loading && <FeedSkeleton count={1} />}
              {!hasMore && filteredPosts.length > 0 && !debouncedSearch.trim() && (
                <p className="text-gray-400 dark:text-gray-600 text-sm py-10 text-center">
                  — {t.feed.endOfFeed} —
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Right sidebar (lg+) ── */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-24 max-h-[calc(100vh-6.5rem)] overflow-y-auto overflow-x-hidden scrollbar-thin">
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
          {suggestedGroups.length > 0 && (
            <SuggestedCommunitiesCard
              suggestedGroups={suggestedGroups}
              onSectionChange={onSectionChange}
            />
          )}
          <SidebarFooter />
        </aside>

      </main>

      {/* Push notification permission prompt */}
      <PushNotificationPrompt />
    </div>
  );
};

export default FeedSection;
