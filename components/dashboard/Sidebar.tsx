// @ts-nocheck
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';

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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  profile,
  activeSection,
  onSectionChange,
  profileCompleteness = 100,
  tourCompleted = false,
  collapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const { signOut, isCompanyUser } = useAuth();
  const { lang, setLang } = useLanguage();
  const translations = useTranslations();
  const t = translations.dashboard.preferences.language;
  const menu = translations.dashboard.menu;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {}
  };

  // Wizard lock
  const wizardCompleted = profile?.wizard_completed === true;
  const shouldBlockSections = !wizardCompleted;

  const [showProfileAlert, setShowProfileAlert] = React.useState(false);

  const handleMenuClick = (item: any) => {
    if (item.id === 'mi-perfil') {
      if (item.link) {
        navigate(item.link);
      } else {
        onSectionChange('mi-perfil:identity');
      }
      return;
    }

    if (shouldBlockSections) {
      setShowProfileAlert(true);
      setTimeout(() => setShowProfileAlert(false), 4000);
      return;
    }

    // "Ver mi CV" opens in a new tab so user doesn't leave the dashboard
    if (item.id === 'ver-cv' && item.link) {
      window.open(item.link, '_blank', 'noopener');
      return;
    }

    if (item.link) {
      navigate(item.link);
    } else {
      onSectionChange(item.id);
    }
  };

  const isActive = (id: string) => {
    if (id === 'mi-perfil') return activeSection === id || activeSection.startsWith('mi-perfil:');
    if (id === 'grupos') return activeSection === id || activeSection.startsWith('grupos:');
    if (id === 'canales') return activeSection === id || activeSection.startsWith('canales:');
    return activeSection === id;
  };

  // CV link
  const cvUrl = profile?.slug
    ? `/cv/${profile.slug}`
    : `/cv/${profile?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'mi-perfil'}`;

  // ── Menu structure with section groups ──
  const menuGroups = [
    {
      items: [
        {
          id: 'dashboard',
          label: menu.dashboard,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
        },
      ],
    },
    {
      label: (menu as any).sectionProfile || (lang === 'es' ? 'MI PERFIL' : 'MY PROFILE'),
      items: [
        {
          id: 'mi-perfil',
          label: menu.myProfile,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        },
        {
          id: 'ver-cv',
          label: menu.viewCV,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
          link: cvUrl,
        },
        {
          id: 'plantillas',
          label: menu.templates,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" /></svg>,
        },
        {
          id: 'stamps',
          label: menu.stamps,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
        },
      ],
    },
    {
      label: (menu as any).sectionCommunity || (lang === 'es' ? 'COMUNIDAD' : 'COMMUNITY'),
      items: [
        {
          id: 'feed',
          label: 'Feed',
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>,
        },
        {
          id: 'grupos',
          label: (menu as any).grupos || 'Grupos',
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        },
        {
          id: 'canales',
          label: (menu as any).canales || 'Canales',
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
        },
        {
          id: 'notificaciones',
          label: (menu as any).notificaciones || (lang === 'es' ? 'Notificaciones' : 'Notifications'),
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
        },
      ],
    },
    {
      label: (menu as any).sectionCareer || (lang === 'es' ? 'CARRERA' : 'CAREER'),
      items: [
        {
          id: 'vacantes',
          label: menu.jobSearch,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        },
        {
          id: 'analitica',
          label: menu.analytics,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        },
        ...(isCompanyUser ? [{
          id: 'empresa',
          label: menu.companyDashboard,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
          link: '/company/dashboard',
        }] : []),
      ],
    },
    {
      items: [
        {
          id: 'ajustes',
          label: menu.settings,
          icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        },
      ],
    },
  ];

  // ── Collapsed item renderer ──
  const renderCollapsedItem = (item: any) => {
    const blocked = shouldBlockSections && item.id !== 'dashboard' && item.id !== 'mi-perfil';
    const active = isActive(item.id);

    return (
      <li key={item.id} className="relative group">
        <button
          onClick={() => handleMenuClick(item)}
          data-section-btn={item.id}
          data-tour={`sidebar-${item.id}`}
          title={item.label}
          className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${
            blocked
              ? 'opacity-30 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : active
              ? 'bg-cv-blue text-white shadow-md shadow-blue-500/25'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {item.icon}
        </button>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[200] pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
            {item.label}
          </div>
        </div>
      </li>
    );
  };

  // ── Expanded item renderer ──
  const renderItem = (item: any) => {
    const blocked = shouldBlockSections && item.id !== 'dashboard' && item.id !== 'mi-perfil';
    const active = isActive(item.id);

    return (
      <li key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          data-section-btn={item.id}
          data-tour={`sidebar-${item.id}`}
          className={`group/item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-left ${
            blocked
              ? 'opacity-30 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : active
              ? 'bg-cv-blue text-white shadow-md shadow-blue-500/25'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className={`flex-shrink-0 transition-colors duration-200 ${
            active ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-300'
          }`}>
            {item.icon}
          </div>
          <span className={`text-[13px] flex-1 ${active ? 'font-semibold' : 'font-medium'}`}>
            {item.label}
          </span>
          {blocked && (
            <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className={`fixed left-0 top-0 h-screen bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border flex flex-col transition-all duration-300 overflow-visible ${collapsed ? 'w-16' : 'w-64'}`} data-tour="sidebar">
      {/* Profile Completion Alert */}
      {showProfileAlert && (
        <div className={`fixed top-20 ${collapsed ? 'left-20' : 'left-72'} z-50 animate-slideInRight`}>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-xl min-w-[320px] border border-blue-400">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">{menu.wizardAlertTitle}</p>
                <p className="text-xs text-blue-100">{menu.wizardAlertDescription}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapse toggle (positioned fully outside the sidebar) ── */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`absolute top-5 -right-4 translate-x-1/2 w-7 h-7 bg-cv-blue text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-110 transition-all z-[60]`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
        </button>
      )}

      {/* ── Profile Card ── */}
      <div className={`relative ${collapsed ? 'p-2' : 'p-4'}`}>

        {collapsed ? (
          <div className="flex justify-center py-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cv-blue to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-dark-bg-secondary shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile?.full_name || ''} className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cv-blue to-indigo-600 flex items-center justify-center text-white font-bold text-base overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-dark-bg-tertiary shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate text-sm leading-tight">
                {profile?.full_name || menu.user}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 leading-tight">
                {profile?.headline || menu.user}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className={`flex-1 overflow-y-auto scrollbar-hide ${collapsed ? 'px-1.5 py-2' : 'px-3 py-1'}`}>
        {collapsed ? (
          <ul className="space-y-1">
            {menuGroups.map((group, gi) => (
              <React.Fragment key={gi}>
                {gi > 0 && (
                  <li className="my-2 px-1">
                    <div className="border-t border-gray-200 dark:border-dark-border" />
                  </li>
                )}
                {group.items.map(renderCollapsedItem)}
              </React.Fragment>
            ))}
          </ul>
        ) : (
          <div className="space-y-4">
            {menuGroups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 select-none">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map(renderItem)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      {collapsed ? (
        <div className="p-2 border-t border-gray-200 dark:border-dark-border space-y-1">
          <div className="flex gap-1 justify-center mb-1">
            <button
              onClick={() => { setLang('en'); localStorage.setItem('language', 'en'); }}
              title="English"
              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-cv-blue text-white' : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'}`}
            >EN</button>
            <button
              onClick={() => { setLang('es'); localStorage.setItem('language', 'es'); }}
              title="Español"
              className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${lang === 'es' ? 'bg-cv-blue text-white' : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'}`}
            >ES</button>
          </div>
          <div className="relative group">
            <Link to="/" title={menu.backToHome}
              className="flex items-center justify-center p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[200] pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">{menu.backToHome}</div>
            </div>
          </div>
          <div className="relative group">
            <button onClick={handleSignOut} title={menu.signOut}
              className="flex items-center justify-center w-full p-2.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[200] pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">{menu.signOut}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-gray-200 dark:border-dark-border">
          {/* Language toggle — compact pill */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-3">
            <button
              onClick={() => { setLang('en'); localStorage.setItem('language', 'en'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                lang === 'en'
                  ? 'bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >English</button>
            <button
              onClick={() => { setLang('es'); localStorage.setItem('language', 'es'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                lang === 'es'
                  ? 'bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >Español</button>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300 transition-all text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {menu.backToHome}
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/15 transition-all text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {menu.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
