import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublicFeed } from '../../hooks/usePublicFeed';
import { useFeedActions } from '../../hooks/useFeedActions';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { FeedContentType } from '../../types/feed';
import FeedPost from '../dashboard/feed/FeedPost';
import FeedSkeleton from '../dashboard/feed/FeedSkeleton';
import {
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  UserGroupIcon,
  DocumentTextIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  TagIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BellIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';

/* ── Left sidebar: profile card ────────────────────────── */
type UserProfile = { full_name: string; headline: string | null; avatar_url: string | null; slug: string | null };

const LeftProfileCard: React.FC<{ session: Session | null; lang: string }> = ({ session, lang }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from('profiles')
      .select('full_name, headline, avatar_url, slug')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data as UserProfile); });
  }, [session?.user.id]);

  if (session) {
    const avatarUrl = profile?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3B82F6&color=fff`;
    const profileHref = profile?.slug ? `/profesionales/${profile.slug}` : '/dashboard';

    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-14 bg-gradient-to-r from-cv-blue via-blue-500 to-violet-500" />
        {/* Avatar */}
        <div className="px-4 pb-4">
          <div className="-mt-7 mb-2">
            <img
              src={avatarUrl}
              alt={profile?.full_name || ''}
              className="w-14 h-14 rounded-full border-4 border-white dark:border-dark-bg-secondary object-cover"
            />
          </div>
          {profile ? (
            <>
              <p className="text-sm font-bold text-gray-900 dark:text-dark-text-primary leading-tight">{profile.full_name}</p>
              {profile.headline && (
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-0.5 line-clamp-2">{profile.headline}</p>
              )}
            </>
          ) : (
            <div className="space-y-1.5">
              <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            </div>
          )}
          <div className="mt-3 flex flex-col gap-1.5">
            <Link
              to={profileHref}
              className="text-center w-full px-3 py-1.5 border border-cv-blue text-cv-blue text-xs font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              {lang === 'es' ? 'Ver mi perfil' : 'View my profile'}
            </Link>
            <Link
              to="/dashboard"
              className="text-center w-full px-3 py-1.5 bg-cv-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {lang === 'es' ? 'Ir al dashboard' : 'Open dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guest: platform highlights
  const features = lang === 'es'
    ? ['Perfil profesional verificado', 'Conecta con empresas', 'Publica logros y proyectos', 'Encuentra tutores y mentores']
    : ['Verified professional profile', 'Connect with companies', 'Share achievements & projects', 'Find tutors and mentors'];

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-900 dark:text-dark-text-primary mb-3">YourCVPassport</p>
      <ul className="space-y-2">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-dark-text-secondary">
            <CheckBadgeIcon className="w-4 h-4 text-cv-blue flex-shrink-0 mt-px" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/signup"
        className="mt-4 flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-cv-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        {lang === 'es' ? 'Crear cuenta gratis' : 'Create free account'}
        <ArrowRightIcon className="w-3 h-3" />
      </Link>
    </div>
  );
};

/* ── Left sidebar: explore nav ──────────────────────────── */
const ExploreCard: React.FC<{ lang: string }> = ({ lang }) => {
  const nav = [
    { label: lang === 'es' ? 'Profesionales' : 'Professionals', icon: UserGroupIcon,          to: lang === 'es' ? '/profesionales' : '/professionals' },
    { label: lang === 'es' ? 'Empleos' : 'Jobs',                icon: BriefcaseIcon,          to: lang === 'es' ? '/empleos' : '/jobs' },
    { label: lang === 'es' ? 'Empresas' : 'Companies',          icon: BuildingOffice2Icon,    to: lang === 'es' ? '/empresas/busqueda' : '/companies' },
    { label: lang === 'es' ? 'Blog' : 'Blog',                   icon: BookOpenIcon,           to: lang === 'es' ? '/recursos/blog' : '/resources/blog' },
    { label: lang === 'es' ? 'Precios' : 'Pricing',             icon: TagIcon,                to: lang === 'es' ? '/precios' : '/pricing' },
    { label: lang === 'es' ? 'Comunidad' : 'Community',         icon: ChatBubbleLeftRightIcon, to: lang === 'es' ? '/comunidad' : '/feed' },
  ];

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-dark-text-tertiary uppercase tracking-wider mb-2">
        {lang === 'es' ? 'Explorar' : 'Explore'}
      </p>
      <nav className="space-y-0.5">
        {nav.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-cv-blue transition-colors"
          >
            <Icon className="w-4 h-4 flex-shrink-0 text-gray-400" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border/50 text-[10px] text-gray-400 dark:text-dark-text-tertiary flex flex-wrap gap-x-2 gap-y-0.5">
        <span>© 2026 YourCVPassport</span>
        <Link to="/privacidad" className="hover:underline">{lang === 'es' ? 'Privacidad' : 'Privacy'}</Link>
        <Link to="/terminos" className="hover:underline">{lang === 'es' ? 'Términos' : 'Terms'}</Link>
      </div>
    </div>
  );
};

/* ── Sidebar: join CTA ──────────────────────────────────── */
const JoinCard: React.FC<{ isLoggedIn: boolean; lang: string }> = ({ isLoggedIn, lang }) => {
  const navigate = useNavigate();

  if (isLoggedIn) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
          {lang === 'es' ? 'Ir a tu feed' : 'Go to your feed'}
        </p>
        <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4">
          {lang === 'es'
            ? 'Publica, comenta y conecta desde tu dashboard.'
            : 'Post, comment and connect from your dashboard.'}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cv-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4" />
          {lang === 'es' ? 'Ir al dashboard' : 'Open dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cv-blue to-blue-700 rounded-2xl p-5 shadow-sm text-white">
      <ChatBubbleLeftRightIcon className="w-8 h-8 mb-3 opacity-90" />
      <p className="font-semibold text-base mb-1">
        {lang === 'es' ? 'Únete a la comunidad' : 'Join the community'}
      </p>
      <p className="text-sm text-blue-100 mb-4">
        {lang === 'es'
          ? 'Publica logros, conecta con profesionales y crece en tu carrera.'
          : 'Share achievements, connect with professionals and grow your career.'}
      </p>
      <Link
        to="/signup"
        className="block w-full text-center px-4 py-2 bg-white text-cv-blue text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors"
      >
        {lang === 'es' ? 'Crear cuenta gratis' : 'Create free account'}
      </Link>
      <Link
        to="/login"
        className="block w-full text-center mt-2 px-4 py-2 border border-white/40 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
      >
        {lang === 'es' ? 'Iniciar sesión' : 'Log in'}
      </Link>
    </div>
  );
};

/* ── Sidebar: community stats (live) ───────────────────── */
type Poster = { id: string; full_name: string; avatar_url: string | null; slug: string | null };

const CommunityCard: React.FC<{ lang: string; isLoggedIn: boolean }> = ({ lang, isLoggedIn }) => {
  const [stats, setStats] = useState<{ professionals: number; posts: number } | null>(null);
  const [posters, setPosters] = useState<Poster[]>([]);

  useEffect(() => {
    const load = async () => {
      const [profRes, postsRes, feedRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('feed_posts').select('id', { count: 'exact', head: true }).eq('visibility', 'PUBLIC').eq('is_hidden', false),
        supabase.from('feed_posts')
          .select('author:profiles!author_id(id, full_name, avatar_url, slug)')
          .eq('visibility', 'PUBLIC').eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      setStats({ professionals: profRes.count ?? 0, posts: postsRes.count ?? 0 });

      const seen = new Set<string>();
      const unique: Poster[] = [];
      for (const p of feedRes.data ?? []) {
        const a = p.author as unknown as Poster;
        if (a?.id && !seen.has(a.id)) { seen.add(a.id); unique.push(a); }
        if (unique.length >= 6) break;
      }
      setPosters(unique);
    };
    load();
  }, []);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-5 shadow-sm space-y-4">
      {/* Header */}
      <p className="text-xs font-semibold text-gray-400 dark:text-dark-text-tertiary uppercase tracking-wider">
        {lang === 'es' ? 'La comunidad' : 'The community'}
      </p>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <UserGroupIcon className="w-3.5 h-3.5 text-cv-blue" />
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              {lang === 'es' ? 'Profesionales' : 'Professionals'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary leading-none">
            {stats ? fmt(stats.professionals) : <span className="text-gray-300 dark:text-gray-600">—</span>}
          </p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <DocumentTextIcon className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">
              {lang === 'es' ? 'Publicaciones' : 'Posts'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary leading-none">
            {stats ? fmt(stats.posts) : <span className="text-gray-300 dark:text-gray-600">—</span>}
          </p>
        </div>
      </div>

      {/* Recent posters */}
      {posters.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 dark:text-dark-text-tertiary mb-2">
            {lang === 'es' ? 'Publicando recientemente' : 'Recently posting'}
          </p>
          <div className="flex items-center -space-x-2">
            {posters.map(p => (
              <Link
                key={p.id}
                to={`/profesionales/${p.slug ?? p.id}`}
                title={p.full_name}
                className="relative hover:z-10"
              >
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={p.full_name}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-bg-secondary object-cover hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-bg-secondary bg-cv-blue text-white text-xs font-bold flex items-center justify-center hover:scale-110 transition-transform select-none">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-bg-secondary bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-[10px] font-semibold flex items-center justify-center">
              +
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {!isLoggedIn && (
        <Link
          to="/signup"
          className="flex items-center gap-1.5 text-cv-blue dark:text-cv-blue-light text-sm font-semibold hover:underline"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          {lang === 'es' ? 'Crear tu perfil gratis' : 'Create your free profile'}
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
};

/* ── Mobile Facebook-style header ───────────────────────── */
const FeedMobileHeader: React.FC<{ session: Session | null; lang: string }> = ({ session, lang }) => {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-dark-bg-secondary/95 backdrop-blur-md border-b border-gray-200/70 dark:border-dark-border z-50 flex items-center justify-between px-4 lg:hidden shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cv-blue to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
          <UserGroupIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
          YourCVPassport
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        {session ? (
          <>
            <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">
              <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => navigate('/dashboard', { state: { openComposer: true } })}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              <PencilSquareIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-dark-border rounded-full text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              {lang === 'es' ? 'Entrar' : 'Log in'}
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1.5 text-xs font-medium bg-cv-blue text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              {lang === 'es' ? 'Registro' : 'Sign up'}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

/* ── Mobile Facebook-style bottom tab bar ───────────────── */
const FeedTabBar: React.FC<{
  session: Session | null;
  lang: string;
  activeFilter: FeedContentType | 'ALL';
  onFilterChange: (f: FeedContentType | 'ALL') => void;
}> = ({ session, lang, activeFilter, onFilterChange }) => {
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'home',
      label: lang === 'es' ? 'Inicio' : 'Home',
      icon: <HomeIcon className="w-6 h-6" />,
      action: () => navigate(session ? '/dashboard' : '/'),
      active: false,
    },
    {
      id: 'fotos',
      label: lang === 'es' ? 'Fotos' : 'Photos',
      icon: <PhotoIcon className="w-6 h-6" />,
      action: () => onFilterChange(activeFilter === 'IMAGE' ? 'ALL' : 'IMAGE'),
      active: activeFilter === 'IMAGE',
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: <QuestionMarkCircleIcon className="w-6 h-6" />,
      action: () => onFilterChange(activeFilter === 'POLL' ? 'ALL' : 'POLL'),
      active: activeFilter === 'POLL',
    },
    {
      id: 'guardados',
      label: lang === 'es' ? 'Guardados' : 'Saved',
      icon: <BookmarkIcon className="w-6 h-6" />,
      action: () => navigate(session ? '/dashboard' : '/login'),
      active: false,
    },
    {
      id: 'perfil',
      label: lang === 'es' ? 'Perfil' : 'Profile',
      icon: <UserCircleIcon className="w-6 h-6" />,
      action: () => navigate(session ? '/dashboard' : '/login'),
      active: false,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[999] lg:hidden bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-dark-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={tab.action}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              tab.active
                ? 'text-cv-blue'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

/* ── Guest interaction banner ───────────────────────────── */
const GuestBanner: React.FC<{ lang: string }> = ({ lang }) => (
  <div className="sticky top-14 lg:top-0 z-30 bg-gradient-to-r from-cv-blue to-indigo-600 text-white px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shadow-md shadow-blue-500/20">
    <div className="flex items-center gap-2 min-w-0">
      <SparklesIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
      <span className="font-medium text-xs sm:text-sm truncate">
        {lang === 'es'
          ? 'Únete a YourCVPassport y conecta con profesionales'
          : 'Join YourCVPassport and connect with professionals'}
      </span>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Link to="/login" className="px-2.5 sm:px-3 py-1 text-xs font-medium border border-white/40 rounded-full hover:bg-white/10 transition-colors whitespace-nowrap">
        {lang === 'es' ? 'Entrar' : 'Log in'}
      </Link>
      <Link to="/signup" className="px-2.5 sm:px-3 py-1 text-xs font-semibold bg-white text-cv-blue rounded-full hover:bg-blue-50 transition-colors whitespace-nowrap">
        {lang === 'es' ? 'Registrarse' : 'Sign up'}
      </Link>
    </div>
  </div>
);

/* ── Compose bar (logged-in users) ─────────────────────── */
const ComposeBar: React.FC<{ session: Session; lang: string }> = ({ session, lang }) => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(
    `https://ui-avatars.com/api/?name=U&background=3B82F6&color=fff`
  );

  useEffect(() => {
    supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        else if (data?.full_name)
          setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=3B82F6&color=fff`);
      });
  }, [session.user.id]);

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm p-3 flex items-center gap-3">
      <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
      <button
        onClick={() => navigate('/dashboard', { state: { openComposer: true } })}
        className="flex-1 text-left px-4 py-2 bg-gray-50 dark:bg-dark-bg-tertiary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm text-gray-400 dark:text-gray-500 transition-colors"
      >
        {lang === 'es' ? '¿Qué quieres compartir?' : 'What do you want to share?'}
      </button>
      <button
        onClick={() => navigate('/dashboard', { state: { openComposer: true } })}
        className="flex-shrink-0 p-2 rounded-full bg-cv-blue text-white hover:bg-blue-700 transition-colors"
        aria-label={lang === 'es' ? 'Publicar' : 'Post'}
      >
        <PencilSquareIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ── Filter pills + search ──────────────────────────────── */
const FEED_FILTERS: { value: FeedContentType | 'ALL'; labelEs: string; labelEn: string }[] = [
  { value: 'ALL',         labelEs: 'Todo',        labelEn: 'All'          },
  { value: 'TEXT',        labelEs: 'Posts',       labelEn: 'Posts'        },
  { value: 'IMAGE',       labelEs: 'Fotos',       labelEn: 'Photos'       },
  { value: 'ACHIEVEMENT', labelEs: 'Logros',      labelEn: 'Achievements' },
  { value: 'MILESTONE',   labelEs: 'Hitos',       labelEn: 'Milestones'   },
  { value: 'JOB_UPDATE',  labelEs: 'Empleo',      labelEn: 'Jobs'         },
  { value: 'POLL',        labelEs: 'Encuestas',   labelEn: 'Polls'        },
  { value: 'EVENT',       labelEs: 'Eventos',     labelEn: 'Events'       },
];

const FeedFilters: React.FC<{
  activeFilter: FeedContentType | 'ALL';
  onFilterChange: (f: FeedContentType | 'ALL') => void;
  searchTerm: string;
  onSearchChange: (s: string) => void;
  lang: string;
}> = ({ activeFilter, onFilterChange, searchTerm, onSearchChange, lang }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    onSearchChange('');
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
      {searchOpen ? (
        <div className="flex items-center gap-2 px-3 py-2.5">
          <MagnifyingGlassIcon className="w-4 h-4 text-cv-blue flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={lang === 'es' ? 'Buscar en la comunidad...' : 'Search community...'}
            className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <button onClick={closeSearch} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="flex items-center flex-wrap gap-1 flex-1 px-2.5 py-2">
            {FEED_FILTERS.map((f) => {
              const isActive = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => onFilterChange(f.value)}
                  className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all rounded-full ${
                    isActive
                      ? 'bg-cv-blue text-white shadow-sm shadow-blue-500/30'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary hover:text-gray-700'
                  }`}
                >
                  {lang === 'es' ? f.labelEs : f.labelEn}
                </button>
              );
            })}
          </div>
          <button
            onClick={openSearch}
            className="flex-shrink-0 p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-l border-gray-100 dark:border-dark-border/50 transition-colors"
            aria-label={lang === 'es' ? 'Buscar' : 'Search'}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};


/* ── Main page ──────────────────────────────────────────── */
const PublicFeedPage: React.FC = () => {
  const { session } = useAuth();
  const { lang } = useLanguage();

  // Filter + search state
  const [activeFilter, setActiveFilter] = useState<FeedContentType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { posts, loading, error, hasMore, loadMore, refreshFeed } = usePublicFeed(activeFilter, debouncedSearch);
  const { votePoll } = useFeedActions();
  const handlePollVote = useCallback(
    (postId: string, optionIndex: number) => votePoll(postId, optionIndex),
    [votePoll]
  );
  const { sendNotification } = useNotifications();
  const handleAuthRequired = useCallback(() => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-dark-bg-secondary shadow-xl rounded-2xl border border-gray-200 dark:border-dark-border pointer-events-auto flex flex-col gap-3 p-4`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-cv-blue/10 flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-cv-blue" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
              {lang === 'es' ? 'Crea una cuenta gratis' : 'Create a free account'}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-0.5">
              {lang === 'es'
                ? 'Regístrate para reaccionar, comentar y publicar en la comunidad.'
                : 'Sign up to react, comment and post in the community.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/signup"
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 text-center px-3 py-2 bg-cv-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {lang === 'es' ? 'Registrarse' : 'Sign up'}
          </Link>
          <Link
            to="/login"
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 text-center px-3 py-2 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-primary text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            {lang === 'es' ? 'Iniciar sesión' : 'Log in'}
          </Link>
        </div>
      </div>
    ), { duration: 5000, position: 'bottom-center' });
  }, [lang]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, loadMore]);

  // Hashtag click → search
  const handleHashtagClick = useCallback((tag: string) => {
    setSearchTerm(tag);
    setActiveFilter('ALL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Helmet>
        <title>{lang === 'es' ? 'Comunidad — YourCVPassport' : 'Community — YourCVPassport'}</title>
        <meta
          name="description"
          content={lang === 'es'
            ? 'Descubre publicaciones de profesionales verificados. Logros, empleos, eventos y más.'
            : 'Discover posts from verified professionals. Achievements, jobs, events and more.'}
        />
      </Helmet>

      {/* Mobile header — Facebook-style, only on small screens */}
      <FeedMobileHeader session={session} lang={lang} />

      {/* Guest banner */}
      {!session && <GuestBanner lang={lang} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-6 lg:pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left sidebar — desktop only */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-4 sticky top-[6.5rem] self-start">
          <LeftProfileCard session={session} lang={lang} />
          <ExploreCard lang={lang} />
        </aside>

        {/* Center: feed */}
        <div className="lg:col-span-6 space-y-4">

          {/* Page header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cv-blue to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary leading-tight">
                {lang === 'es' ? 'Comunidad' : 'Community'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                {lang === 'es'
                  ? 'Profesionales verificados en todo el mundo'
                  : 'Verified professionals worldwide'}
              </p>
            </div>
          </div>

          {/* Compose bar — logged-in users only */}
          {session && <ComposeBar session={session} lang={lang} />}

          {/* Filter pills + search */}
          <FeedFilters
            activeFilter={activeFilter}
            onFilterChange={(f) => { setActiveFilter(f); setSearchTerm(''); }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            lang={lang}
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading && posts.length === 0 ? (
            <FeedSkeleton count={4} />
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-600">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {searchTerm || activeFilter !== 'ALL'
                  ? (lang === 'es' ? 'No hay resultados' : 'No results found')
                  : (lang === 'es' ? 'Aún no hay publicaciones' : 'No posts yet')}
              </p>
              {(searchTerm || activeFilter !== 'ALL') && (
                <button
                  onClick={() => { setSearchTerm(''); setActiveFilter('ALL'); }}
                  className="mt-3 text-sm text-cv-blue hover:underline"
                >
                  {lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map(post => (
                <FeedPost
                  key={post.id}
                  post={post}
                  currentUserId={session?.user.id}
                  onPostUpdated={refreshFeed}
                  onHashtagClick={handleHashtagClick}
                  onPollVote={session ? handlePollVote : undefined}
                  onNotify={session ? sendNotification : undefined}
                  onAuthRequired={!session ? handleAuthRequired : undefined}
                />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-4" />
          {loading && posts.length > 0 && <FeedSkeleton count={1} />}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-600 py-8">
              — {lang === 'es' ? 'Has llegado al final' : 'End of feed'} —
            </p>
          )}
        </div>

        {/* Right sidebar — desktop only */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-4 sticky top-[6.5rem] self-start">
          <JoinCard isLoggedIn={!!session} lang={lang} />
          <CommunityCard lang={lang} isLoggedIn={!!session} />
        </aside>
      </main>

      {/* Mobile bottom tab bar — Facebook-style, only on small screens */}
      <FeedTabBar
        session={session}
        lang={lang}
        activeFilter={activeFilter}
        onFilterChange={(f) => { setActiveFilter(f); setSearchTerm(''); }}
      />
    </>
  );
};

export default PublicFeedPage;
