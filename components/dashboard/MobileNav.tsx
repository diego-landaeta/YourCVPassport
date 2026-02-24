// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../hooks/useNotifications';

interface MobileNavProps {
  profile: any;
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  profileCompleteness?: number;
}

const MobileNav: React.FC<MobileNavProps> = ({ profile, activeSection, onSectionChange, isOpen, onToggle, profileCompleteness = 100 }) => {
  const translations = useTranslations();
  const menu = translations.dashboard.menu;
  const { lang, setLang } = useLanguage();
  const t = translations.dashboard.preferences.language;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, session } = useAuth();
  const [showProfileAlert, setShowProfileAlert] = React.useState(false);
  const { unreadCount } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {}
  };

  const cvUrl = profile?.slug
    ? `/cv/${profile.slug}`
    : profile?.full_name && profile?.headline
      ? `/cv/${profile.full_name.toLowerCase().replace(/\s+/g, '-')}-${profile.headline.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`
      : `/cv/${profile?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'mi-perfil'}`;

  const allMenuItems = [
    { id: 'dashboard', label: menu.dashboard, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'mi-perfil', label: menu.myProfile, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'ver-cv', label: menu.viewCV, link: cvUrl, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
    { id: 'plantillas', label: menu.templates, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" /></svg> },
    { id: 'stamps', label: menu.stamps, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { id: 'feed', label: menu.feed, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg> },
    { id: 'grupos', label: (menu as any).grupos || 'Grupos', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'canales', label: (menu as any).canales || 'Canales', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
    { id: 'notificaciones', label: (menu as any).notificaciones || (lang === 'es' ? 'Notificaciones' : 'Notifications'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { id: 'vacantes', label: menu.jobSearch, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'analitica', label: menu.analytics, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'ajustes', label: menu.settings, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  // Determinar si las secciones deben estar bloqueadas
  const wizardCompleted = profile?.template && profile?.slug;
  const shouldBlockSections = !wizardCompleted;

  const handleMenuClick = (item: any) => {
    if (item.id === 'mi-perfil') {
      if (item.link) {
        navigate(item.link);
        onToggle();
      } else {
        onSectionChange('mi-perfil:identity');
        onToggle();
      }
      return;
    }

    if (shouldBlockSections) {
      setShowProfileAlert(true);
      setTimeout(() => setShowProfileAlert(false), 4000);
      return;
    }

    if (item.link) {
      navigate(item.link);
      onToggle();
    } else {
      onSectionChange(item.id);
      onToggle();
    }
  };

  /* ── Pill navigation handler ── */
  const handlePillNav = (sectionId: string) => {
    if (shouldBlockSections && sectionId !== 'mi-perfil') {
      setShowProfileAlert(true);
      setTimeout(() => setShowProfileAlert(false), 4000);
      return;
    }
    onSectionChange(sectionId);
  };

  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.full_name || 'U'
    )}&background=3B82F6&color=fff&size=40`;

  return (
    <>
      {/* Profile Completion Alert */}
      {showProfileAlert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] animate-slideInDown">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-xl min-w-[280px] max-w-[90vw] border border-blue-400">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">
                  {menu.wizardAlertTitle}
                </p>
                <p className="text-xs text-blue-100">
                  {menu.wizardAlertDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header Bar — Facebook-style ── */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-dark-bg-secondary border-b border-gray-100 dark:border-dark-border flex items-center justify-between px-4 z-40">
        <span className="text-[15px] font-bold text-cv-blue dark:text-cv-blue-light tracking-tight">
          YourCVPassport
        </span>

        <div className="flex items-center gap-0.5">
          {/* Notification bell */}
          <button
            onClick={() => { onSectionChange('notificaciones'); }}
            className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>

          {/* Hamburger / close */}
          <button
            data-tour="mobile-menu-toggle"
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            {isOpen ? (
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}

      {/* ── Slide-out Menu ── */}
      <div
        data-tour="mobile-menu"
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-dark-border transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Menu header with profile */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={profile?.full_name || 'User'}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 dark:ring-dark-border"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {profile?.full_name || menu.user}
              </p>
              {profile?.headline && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {profile.headline}
                </p>
              )}
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="py-2 px-3 pb-32">
          <ul className="space-y-0.5">
            {allMenuItems.map((item) => {
              const isBlocked = shouldBlockSections && item.id !== 'dashboard' && item.id !== 'mi-perfil';
              return (
                <li key={item.id}>
                  <button
                    data-tour={`mobile-${item.id}`}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isBlocked
                        ? 'opacity-40 text-gray-400 dark:text-gray-600'
                        : activeSection === item.id ||
                          (item.id === 'mi-perfil' && activeSection.startsWith('mi-perfil:'))
                        ? 'bg-gray-100 dark:bg-dark-bg-tertiary text-cv-blue font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {isBlocked && (
                      <svg className="w-4 h-4 ml-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="px-1 py-4 mt-3 border-t border-gray-100 dark:border-dark-border space-y-3">
            {/* Language Selector */}
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2 font-semibold uppercase tracking-wider px-2">
                {t.label}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLang('en');
                    localStorage.setItem('language', 'en');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    lang === 'en'
                      ? 'bg-cv-blue text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    setLang('es');
                    localStorage.setItem('language', 'es');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    lang === 'es'
                      ? 'bg-cv-blue text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  ES
                </button>
              </div>
            </div>

            <Link
              to="/"
              onClick={onToggle}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {menu.backToHome}
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {menu.signOut}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Universal bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-dark-bg-secondary border-t border-gray-100 dark:border-dark-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-14">
          {/* Inicio */}
          <button
            onClick={() => handlePillNav('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              activeSection === 'dashboard' ? 'text-cv-blue' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-medium leading-none">{lang === 'es' ? 'Inicio' : 'Home'}</span>
          </button>

          {/* Feed */}
          <button
            onClick={() => handlePillNav('feed')}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              activeSection === 'feed' ? 'text-cv-blue' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <span className="text-[10px] font-medium leading-none">Feed</span>
          </button>

          {/* Grupos */}
          <button
            onClick={() => handlePillNav('grupos')}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              activeSection === 'grupos' ? 'text-cv-blue' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-[10px] font-medium leading-none">{lang === 'es' ? 'Grupos' : 'Groups'}</span>
          </button>

          {/* Notificaciones */}
          <button
            onClick={() => handlePillNav('notificaciones')}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              activeSection === 'notificaciones' ? 'text-cv-blue' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{lang === 'es' ? 'Avisos' : 'Alerts'}</span>
          </button>

          {/* Perfil */}
          <button
            onClick={() => handlePillNav(session?.user?.id ? `perfil-usuario:${session.user.id}` : 'mi-perfil:identity')}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              activeSection.startsWith('mi-perfil') || activeSection.startsWith('perfil-usuario') ? 'text-cv-blue' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {avatarUrl && profile?.avatar_url ? (
              <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${activeSection.startsWith('mi-perfil') ? 'border-cv-blue' : 'border-gray-300 dark:border-gray-600'}`}>
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
            <span className="text-[10px] font-medium leading-none">{lang === 'es' ? 'Perfil' : 'Profile'}</span>
          </button>
        </div>
      </nav>

    </>
  );
};

export default MobileNav;
