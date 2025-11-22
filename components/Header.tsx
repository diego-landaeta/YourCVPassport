import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/client';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';

const DarkModeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(() => {
        return localStorage.theme === 'dark' ||
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const toggleDarkMode = () => {
        if (isDark) {
            localStorage.theme = 'light';
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            localStorage.theme = 'dark';
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    };

    return (
        <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-white dark:bg-dark-bg-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-primary focus:outline-none transition-all duration-200"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? (
                // Sun icon for light mode
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon icon for dark mode
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
};

const LanguageSwitcher: React.FC<{ closeMobileMenu?: () => void }> = ({ closeMobileMenu }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { lang, setLangWithNav } = useLanguage();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSetLang = (newLang: 'en' | 'es') => {
        setLangWithNav(newLang);
        setIsOpen(false);
        closeMobileMenu?.();
    }

    return (
        <div ref={wrapperRef} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white dark:bg-dark-bg-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-primary focus:outline-none transition-colors">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="font-medium text-sm">{lang.toUpperCase()}</span>
                <svg className={`h-4 w-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg dark:shadow-2xl ring-1 ring-black ring-opacity-5 dark:ring-dark-border-light z-20 border border-transparent dark:border-dark-border">
                    <div className="py-1">
                        <button onClick={() => handleSetLang('en')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">English (EN)</button>
                        <button onClick={() => handleSetLang('es')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">Español (ES)</button>
                    </div>
                </div>
            )}
        </div>
    );
};


const NavMenuItem: React.FC<{ item: NavItem; onClick: () => void; }> = ({ item, onClick }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const { lang } = useLanguage();

  const getPath = (id: string | undefined) => {
    if (!id) return '#';
    return `/${id}`.replace(/\/+/g, '/');
  }

  const getIcon = (itemName: string) => {
    const iconClass = "w-5 h-5";
    const iconMap: { [key: string]: React.ReactElement } = {
      'Inicio': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      'Home': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      'Product': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      'Producto': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      'For Professionals': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      'Para Profesionales': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      'For Recruiters': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      'Para Reclutadores': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      'Resources': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      'Recursos': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      'Company': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      'Empresa': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      'For Companies': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
      'Para Empresas': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
      'About Us': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      'Sobre Nosotros': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      'Pricing': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      'Precios': <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    };
    return iconMap[itemName] || <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;
  };

  if (!item.subItems) {
    return (
      <Link to={getPath(item.id)} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-colors group mx-2 rounded-md">
        <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{getIcon(item.name)}</span>
        <span className="text-sm font-medium">{item.name}</span>
      </Link>
    );
  }

  return (
    <div className="mx-2">
      <button onClick={() => setIsSubMenuOpen(!isSubMenuOpen)} className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-colors group rounded-md">
        <div className="flex items-center gap-3">
          <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{getIcon(item.name)}</span>
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        <svg className={`h-4 w-4 transform transition-transform duration-200 text-gray-500 dark:text-gray-400 ${isSubMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isSubMenuOpen && (
        <div className="mt-1 space-y-1">
          {item.subItems.map(subItem => (
            <Link key={subItem.id} to={getPath(subItem.id)} onClick={onClick} className="flex items-center px-4 py-2 pl-14 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-sm rounded-md">
              {subItem.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const DesktopNavLink: React.FC<{ item: NavItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useLanguage();
  const timeoutRef = useRef<number | null>(null);

  const getPath = (id: string | undefined) => {
    if (!id) return '#';
    return `/${id}`.replace(/\/+/g, '/');
  }
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 200); // 200ms delay
  };


  if (!item.subItems) {
    return (
      <Link
        to={getPath(item.id)}
        className="text-gray-700 dark:text-dark-text-primary hover:text-cv-blue dark:hover:text-cv-blue-light px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
      >
        {item.name}
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className="text-gray-700 dark:text-dark-text-primary hover:text-cv-blue dark:hover:text-cv-blue-light px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center focus:outline-none"
      >
        {item.name}
        <svg className={`ml-1 h-4 w-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && item.subItems && (
        <div className="absolute z-10 -ml-4 mt-1 w-60 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg dark:shadow-2xl ring-1 ring-black ring-opacity-5 dark:ring-dark-border-light border border-transparent dark:border-dark-border">
          <div className="py-1">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.name}
                to={getPath(subItem.id)}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary hover:text-cv-blue dark:hover:text-cv-blue-light transition-colors"
              >
                {subItem.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Header: React.FC = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { session, openModal, profile } = useAuth();
  const navigate = useNavigate();
  const t = useTranslations();
  const { lang } = useLanguage();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Agregar estilos de animación
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideInLeft {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setUserMenuOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);


  const handleLogout = async () => {
    closeMobileMenu();
    setUserMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleOpenLogin = () => {
    closeMobileMenu();
    navigate('/login');
  }

  const handleOpenSignup = () => {
    closeMobileMenu();
    navigate('/signup');
  }

  const homePath = '/';
  const adminPath = `/admin`;
  const dashboardPath = `/dashboard`;
  const profileEditPath = `/profile/edit`;
  const publicProfilePath = profile?.slug ? `/cv/${profile.slug}` : profileEditPath;

  return (
    <header className="bg-white/80 dark:bg-dark-bg-primary/95 backdrop-blur-md sticky top-0 z-50 shadow-sm dark:shadow-lg dark:shadow-dark-bg-primary/50 border-b border-transparent dark:border-dark-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex-shrink-0">
            <Link to={homePath} onClick={closeMobileMenu} className="text-xl lg:text-2xl font-bold text-cv-blue dark:text-cv-blue-light whitespace-nowrap">
              YourCVPassport
            </Link>
          </div>
          <nav className="hidden lg:flex items-center space-x-0.5 flex-1 justify-center">
            {t.NAV_LINKS.map((item) => (
              <DesktopNavLink key={item.name} item={item} />
            ))}
          </nav>
          <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
             <DarkModeToggle />
             <LanguageSwitcher />
            {session ? (
              <div ref={userMenuRef} className="relative">
                  <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light dark:focus:ring-offset-dark-bg-primary">
                      {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent dark:ring-dark-border" />
                      ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-bg-secondary flex items-center justify-center ring-2 ring-transparent dark:ring-dark-border">
                              <svg className="w-6 h-6 text-gray-400 dark:text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                      )}
                  </button>
                  {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary rounded-md shadow-lg dark:shadow-2xl ring-1 ring-black ring-opacity-5 dark:ring-dark-border-light z-20 py-1 border border-transparent dark:border-dark-border">
                          {profile?.role === 'admin' && (
                            <Link to={adminPath} onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-red-600 dark:text-status-error hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">Admin Panel</Link>
                          )}
                          <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">Dashboard</Link>
                          <Link to={publicProfilePath} onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">{t.header.dashboard}</Link>
                          <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">{t.header.logout}</button>
                      </div>
                  )}
              </div>
            ) : (
              <>
                <button onClick={handleOpenLogin} className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary hover:text-cv-blue dark:hover:text-cv-blue-light transition-colors">{t.header.login}</button>
                <button onClick={handleOpenSignup} className="bg-cv-blue dark:bg-cv-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light transition-colors shadow-sm">{t.header.signup}</button>
              </>
            )}
          </div>
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-dark-text-secondary hover:text-gray-500 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cv-blue dark:focus:ring-cv-blue-light transition-colors"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                 <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                 </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          {/* Overlay oscuro */}
          <div
            onClick={closeMobileMenu}
            className="lg:hidden fixed inset-0 bg-black/50 z-[9998]"
            style={{ animation: 'fadeIn 0.2s ease-in-out' }}
          />

          {/* Sidebar deslizante desde la izquierda */}
          <div
            className="lg:hidden fixed top-0 left-0 h-screen w-72 bg-white dark:bg-[#0f0f0f] shadow-2xl z-[9999] overflow-y-auto flex flex-col"
            style={{ animation: 'slideInLeft 0.3s ease-out' }}
          >
            {/* Header del sidebar con logo y botón cerrar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800/50">
              <Link to={homePath} onClick={closeMobileMenu} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cv-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">YC</span>
                </div>
                <span className="text-gray-800 dark:text-white font-semibold text-base">YourCVPassport</span>
              </Link>
              <button onClick={closeMobileMenu} className="text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items de navegación con iconos */}
            <div className="flex-1 py-3 overflow-y-auto">
              {t.NAV_LINKS.map((item) => (
                <NavMenuItem key={item.name} item={item} onClick={closeMobileMenu} />
              ))}
            </div>

            {/* Footer del sidebar con controles y perfil */}
            <div className="border-t border-gray-200 dark:border-gray-800/50 p-4 space-y-3 bg-white dark:bg-[#0f0f0f]">
              {/* Controles de idioma y modo oscuro */}
              <div className="flex items-center justify-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
                <LanguageSwitcher closeMobileMenu={closeMobileMenu} />
                <DarkModeToggle />
              </div>

              {/* Perfil de usuario o botones de login/signup */}
              {session ? (
                <>
                  {profile && (
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-300 dark:ring-gray-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{profile.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.headline}</p>
                      </div>
                    </div>
                  )}
                  {profile?.role === 'admin' && (
                    <Link to={adminPath} onClick={closeMobileMenu} className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <Link to={dashboardPath} onClick={closeMobileMenu} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-cv-blue text-white hover:bg-cv-blue-dark transition-colors text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link to={publicProfilePath} onClick={closeMobileMenu} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                    {t.header.dashboard}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                    {t.header.logout}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleOpenSignup} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-cv-blue text-white hover:bg-cv-blue-dark transition-colors text-sm font-medium">
                    {t.header.signup}
                  </button>
                  <button onClick={handleOpenLogin} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                    {t.header.login}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;