// @ts-nocheck
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useUnreadLeadsCount } from '../../hooks/useUnreadLeadsCount';
import { useJobApplications } from '../../hooks/useJobApplications';

interface SidebarProps {
  profile: any;
  activeSection: string;
  onSectionChange: (section: string) => void;
  experiences?: any[];
  education?: any[];
  skills?: any[];
  languages?: any[];
  profileCompleteness?: number;
  tourCompleted?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  profile,
  activeSection,
  onSectionChange,
  profileCompleteness = 100,
  tourCompleted = false
}) => {
  const navigate = useNavigate();
  const { signOut, isCompanyUser } = useAuth();
  const { lang, setLang } = useLanguage();
  const translations = useTranslations();
  const t = translations.dashboard.preferences.language;
  const menu = translations.dashboard.menu;
  const { unreadCount } = useUnreadLeadsCount();
  const { activeCount: activeApplicationsCount } = useJobApplications(profile?.id, {
    includeJobDetails: false
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {}
  };

  const menuItems = [
    // MAIN OVERVIEW
    {
      id: 'dashboard',
      label: menu.dashboard,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },

    // PROFILE MANAGEMENT
    {
      id: 'mi-perfil',
      label: menu.myProfile,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'ver-cv',
      label: menu.viewCV,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      link: profile?.slug
        ? `/cv/${profile.slug}`
        : profile?.full_name && profile?.headline
          ? `/cv/${profile.full_name.toLowerCase().replace(/\s+/g, '-')}-${profile.headline.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`
          : `/cv/${profile?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'mi-perfil'}`,
    },
    {
      id: 'plantillas',
      label: menu.templates,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
        </svg>
      ),
    },
    {
      id: 'stamps',
      label: menu.stamps,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },

    // JOB OPPORTUNITIES (Unified section)
    {
      id: 'vacantes',
      label: menu.jobSearch,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      // No link - uses internal navigation
    },
    {
      id: 'postulaciones',
      label: menu.myApplications,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      // No link - uses internal navigation
    },

    // COMMUNICATIONS & NETWORKING
    {
      id: 'leads',
      label: menu.leads,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },

    // ANALYTICS & INSIGHTS
    {
      id: 'analitica',
      label: menu.analytics,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },

    // DOCUMENTS & LEGAL
    {
      id: 'visas',
      label: menu.visas,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },

    // COMPANY DASHBOARD (if applicable)
    ...(isCompanyUser ? [{
      id: 'empresa',
      label: menu.companyDashboard,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/company/dashboard',
    }] : []),

    // SETTINGS
    {
      id: 'ajustes',
      label: menu.settings,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ].filter(item => item && item.id); // Filter out commented/undefined items

  // Determinar si las secciones deben estar bloqueadas
  // ⚠️ CRÍTICO: Bloquear TODO HASTA que el usuario COMPLETE EL WIZARD (paso de finalización)
  // El wizard se considera completo SOLO cuando wizard_completed = true en la base de datos
  // Esto se marca cuando el usuario completa el paso de Finalización (selecciona template y slug)
  // Esto asegura que nuevos usuarios DEBEN completar el wizard antes de acceder al dashboard
  const wizardCompleted = profile?.wizard_completed === true;
  const shouldBlockSections = !wizardCompleted;

  const [showProfileAlert, setShowProfileAlert] = React.useState(false);

  const handleMenuClick = (item: any) => {
    // Permitir SOLO "Mi Perfil" siempre (para que puedan acceder al wizard)
    if (item.id === 'mi-perfil') {
      if (item.link) {
        navigate(item.link);
      } else {
        onSectionChange('mi-perfil:identity');
      }
      return;
    }

    // Bloquear TODO (incluido Dashboard) si el wizard no está completo
    if (shouldBlockSections) {
      setShowProfileAlert(true);
      setTimeout(() => setShowProfileAlert(false), 4000);
      return;
    }

    // Permitir navegación normal SOLO si el wizard está completo
    if (item.link) {
      navigate(item.link);
    } else {
      onSectionChange(item.id);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border flex flex-col" data-tour="sidebar">
      {/* Profile Completion Alert */}
      {showProfileAlert && (
        <div className="fixed top-20 left-72 z-50 animate-slideInRight">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-xl min-w-[320px] border border-blue-400">
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

        {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-cv-blue flex items-center justify-center text-white font-bold text-lg overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {profile?.full_name || menu.user}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {profile?.headline || menu.user}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isBlocked = shouldBlockSections && item.id !== 'dashboard' && item.id !== 'mi-perfil';
            return (
              <li key={item.id} className="relative">
                <button
                  onClick={() => handleMenuClick(item)}
                  data-section-btn={item.id}
                  data-tour={`sidebar-${item.id}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isBlocked
                      ? 'opacity-50 text-gray-400 dark:text-gray-600'
                      : activeSection === item.id ||
                        (item.id === 'mi-perfil' && activeSection.startsWith('mi-perfil:'))
                      ? 'bg-cv-blue text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
                  }`}
                >
                  <div className="relative">
                    {item.icon}
                    {item.id === 'leads' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </span>
                    )}
                    {item.id === 'postulaciones' && activeApplicationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-white text-[10px] font-bold items-center justify-center">
                          {activeApplicationsCount > 9 ? '9+' : activeApplicationsCount}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {isBlocked && (
                    <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  {!isBlocked && item.id === 'leads' && unreadCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {!isBlocked && item.id === 'postulaciones' && activeApplicationsCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                      {activeApplicationsCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-border space-y-2">
        {/* Language Selector */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">
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
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors text-sm font-medium"
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
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
          YourCVPassport © 2025
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

