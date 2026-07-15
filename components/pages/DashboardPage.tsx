// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import Sidebar from '../dashboard/Sidebar';
import MobileNav from '../dashboard/MobileNav';
import DashboardContent from '../dashboard/DashboardContent';
import ProfileEditorSidebar from '../dashboard/ProfileEditorSidebar';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useDashboardTour } from '../../hooks/useDashboardTour';
import LoadingSpinner from '../shared/LoadingSpinner';
import { calculateProfileCompleteness } from '../../utils/profileValidation';

const DashboardPage: React.FC = () => {
  // ⚠️ ALL hooks must be called before any conditional returns (React Rules of Hooks)
  const { profile, session, profileLoading } = useAuth();
  const { lang } = useLanguage();
  const t = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();

  const { hasTourBeenCompleted } = useDashboardTour(profile?.id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  // ⚠️ CRITICAL: Initialize activeSection based on wizard completion status
  // New users who haven't completed wizard should start at 'mi-perfil' (wizard)
  // Users who completed wizard should start at 'dashboard'
  //
  // Check wizard_completed field in database (set when user completes Finalization step)
  const getInitialSection = () => {
    const hasCompletedWizardInDB = profile?.wizard_completed === true;
    if (!hasCompletedWizardInDB) return 'mi-perfil';

    const searchParams = new URLSearchParams(location.search);

    // If accessed via /comunidad or /feed route, open the community section
    if (location.pathname === '/comunidad' || location.pathname === '/feed') {
      // ?grupo= param → jump straight to grupos section
      if (searchParams.get('grupo')) return 'grupos';
      return 'feed';
    }

    return 'dashboard';
  };

  const [activeSection, setActiveSection] = useState<string>(getInitialSection());

  // ── Browser history integration for back/forward button support ──
  const isPopStateRef = useRef(false);

  const changeSectionWithHistory = useCallback((section: string) => {
    setActiveSection(prev => {
      if (prev === section) return prev; // no-op
      // Push current section so back button can return to it
      window.history.pushState({ section }, '');
      return section;
    });
  }, []);

  // Set initial history state on mount
  useEffect(() => {
    const initial = getInitialSection();
    window.history.replaceState({ section: initial }, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for popstate (browser back/forward, mouse back button)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const section = e.state?.section;
      if (section) {
        isPopStateRef.current = true;
        setActiveSection(section);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const seoTitle = lang === 'es'
    ? 'Panel de Control'
    : 'Dashboard';
  const seoDescription = lang === 'es'
    ? 'Gestiona tu perfil profesional, edita tu CV, revisa analíticas y optimiza tu presencia profesional en línea con YourCVPassport.'
    : 'Manage your professional profile, edit your CV, review analytics and optimize your online professional presence with YourCVPassport.';

  // Counts for profile completion
  const [experiencesCount, setExperiencesCount] = useState(0);
  const [educationCount, setEducationCount] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);
  const [languagesCount, setLanguagesCount] = useState(0);
  const [portfolioCount, setPortfolioCount] = useState(0);

  // Data for validation
  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  // Check if we're in Mi Perfil section
  const isInMiPerfil = activeSection.startsWith('mi-perfil:');
  const subsection = isInMiPerfil ? activeSection.split(':')[1] : null;

  // ⚡ OPTIMIZATION: Cache data to prevent refetch on window focus/blur
  const dataCache = useRef<{
    userId: string | null;
    timestamp: number;
    data: {
      experiencesCount: number;
      educationCount: number;
      skillsCount: number;
      languagesCount: number;
      portfolioCount: number;
    } | null;
  }>({ userId: null, timestamp: 0, data: null });

  // Load counts and data for profile sections
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user.id) return;

      // ⚡ OPTIMIZATION: Use cache if data is less than 30 seconds old
      const now = Date.now();
      const CACHE_DURATION = 30000; // 30 seconds
      if (
        dataCache.current.userId === session.user.id &&
        dataCache.current.data &&
        now - dataCache.current.timestamp < CACHE_DURATION
      ) {
        // Use cached data
        const cached = dataCache.current.data;
        setExperiencesCount(cached.experiencesCount);
        setEducationCount(cached.educationCount);
        setSkillsCount(cached.skillsCount);
        setLanguagesCount(cached.languagesCount);
        setPortfolioCount(cached.portfolioCount);
        return;
      }

      try {
        // Use Promise.all for parallel queries - much faster than sequential
        const [expResult, eduResult, skillResult, langResult, portResult] = await Promise.all([
          supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          supabase.from('education').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          supabase.from('skills').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          supabase.from('languages').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id)
        ]);

        // Set empty arrays since we're using head: true (we only need counts)
        setExperiences([]);
        setEducation([]);
        setSkills([]);
        setLanguages([]);

        // Set counts
        const counts = {
          experiencesCount: expResult.count || 0,
          educationCount: eduResult.count || 0,
          skillsCount: skillResult.count || 0,
          languagesCount: langResult.count || 0,
          portfolioCount: portResult.count || 0,
        };

        setExperiencesCount(counts.experiencesCount);
        setEducationCount(counts.educationCount);
        setSkillsCount(counts.skillsCount);
        setLanguagesCount(counts.languagesCount);
        setPortfolioCount(counts.portfolioCount);

        // Update cache
        dataCache.current = {
          userId: session.user.id,
          timestamp: now,
          data: counts,
        };
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [session?.user.id, saveMessage]); // REMOVED activeSection to prevent unnecessary reloads when changing sections

  // Calculate profile completeness
  useEffect(() => {
    if (!profile) return;

    const completeness = calculateProfileCompleteness(profile, {
      experiences: experiencesCount,
      education: educationCount,
      skills: skillsCount,
      languages: languagesCount,
      portfolio: portfolioCount,
    });
    setProfileCompleteness(completeness);
  }, [profile, experiencesCount, educationCount, skillsCount, languagesCount, portfolioCount]);

  // Listen for custom events to change dashboard section
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      const { section } = event.detail;
      if (section) {
        changeSectionWithHistory(section);
      }
    };

    window.addEventListener('change-dashboard-section' as any, handleSectionChange);

    return () => {
      window.removeEventListener('change-dashboard-section' as any, handleSectionChange);
    };
  }, [changeSectionWithHistory]);

  // Sync URL with community section:
  // /comunidad (es) or /feed (en) when any community section is active, /dashboard otherwise.
  // grupos, canales and notificaciones are sub-sections of /comunidad — don't redirect away from it.
  useEffect(() => {
    const communityPath = lang === 'es' ? '/comunidad' : '/feed';
    const isCommunityPath = location.pathname === '/comunidad' || location.pathname === '/feed';
    const COMMUNITY_SECTIONS = ['feed', 'grupos', 'canales', 'notificaciones', 'perfiles'];
    const isCommunitySection = COMMUNITY_SECTIONS.includes(activeSection) || activeSection.startsWith('perfil-usuario:');

    if (activeSection === 'feed' && !isCommunityPath) {
      navigate(communityPath, { replace: true });
    } else if (!isCommunitySection && isCommunityPath) {
      // Use replaceState to avoid remounting DashboardPage (navigate() would unmount/remount
      // the component because /dashboard and /comunidad are separate route configs,
      // which resets activeSection back to 'dashboard').
      window.history.replaceState({ section: activeSection }, '', '/dashboard');
    }
  }, [activeSection, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Early returns AFTER all hooks ───────────────────────────────────────────

  // Wait for profile to load ONLY on initial mount (when we don't have a profile yet)
  // Don't show loading spinner during refetch (profile updates), as that would unmount everything
  if (profileLoading && !profile) {
    return <LoadingSpinner message={t.dashboard.loading} size="large" />;
  }

  // Los gestores (profile_manager) no usan el dashboard/CV personal: van a su panel.
  if (profile?.role === 'profile_manager') {
    return <Navigate to="/manager" replace />;
  }


  return (
    <>
      <PageSEO
        title={seoTitle}
        description={seoDescription}
        lang={lang}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          profile={profile}
          activeSection={activeSection}
          onSectionChange={changeSectionWithHistory}
          experiences={experiences}
          education={education}
          skills={skills}
          languages={languages}
          profileCompleteness={profileCompleteness}
          tourCompleted={hasTourBeenCompleted}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      </div>

      {/* Profile Editor Secondary Sidebar - only show when in Mi Perfil */}


      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav
          profile={profile}
          activeSection={activeSection}
          onSectionChange={changeSectionWithHistory}
          isOpen={isMobileMenuOpen}
          onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          profileCompleteness={profileCompleteness}
        />
      </div>


      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className={`pt-16 lg:pt-8 pb-24 lg:pb-8 ${
          activeSection === 'feed' || activeSection.startsWith('perfil-usuario:')
            ? 'px-0'
            : 'px-4 sm:px-6 lg:px-8'
        }`}>
          <DashboardContent
            activeSection={activeSection}
            onSectionChange={changeSectionWithHistory}
            onSaveStatusChange={(message, timestamp) => {
              setSaveMessage(message);
              if (timestamp) setLastSaved(timestamp);
            }}
            isMobileMenuOpen={isMobileMenuOpen}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default DashboardPage;

