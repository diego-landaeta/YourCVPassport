// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
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
  const { profile, session, profileLoading } = useAuth();
  const { lang } = useLanguage();
  const t = useTranslations();

  // Wait for profile to load ONLY on initial mount (when we don't have a profile yet)
  // Don't show loading spinner during refetch (profile updates), as that would unmount everything
  if (profileLoading && !profile) {
    return <LoadingSpinner message={t.dashboard.loading} size="large" />;
  }

  // Admins are NOT users - redirect them to admin panel
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const { hasTourBeenCompleted } = useDashboardTour(profile?.id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize state variables first
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
    const initialSection = hasCompletedWizardInDB ? 'dashboard' : 'mi-perfil';

    // DEBUG: Log initial section determination
    console.log('🔍 DashboardPage - Initial Section:', {
      profileExists: !!profile,
      wizardCompleted: profile?.wizard_completed,
      hasCompletedWizardInDB,
      initialSection,
    });

    // Return 'dashboard' if wizard completed, otherwise 'mi-perfil'
    return initialSection;
  };

  const [activeSection, setActiveSection] = useState<string>(getInitialSection());

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
        setActiveSection(section);
      }
    };

    window.addEventListener('change-dashboard-section' as any, handleSectionChange);

    return () => {
      window.removeEventListener('change-dashboard-section' as any, handleSectionChange);
    };
  }, []);

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
          onSectionChange={setActiveSection}
          experiences={experiences}
          education={education}
          skills={skills}
          languages={languages}
          profileCompleteness={profileCompleteness}
          tourCompleted={hasTourBeenCompleted}
        />
      </div>

      {/* Profile Editor Secondary Sidebar - only show when in Mi Perfil */}


      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav
          profile={profile}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={isMobileMenuOpen}
          onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          profileCompleteness={profileCompleteness}
        />
      </div>

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 lg:ml-64`}>
        <div className="pt-20 lg:pt-8 px-4 sm:px-6 lg:px-8 pb-8">
          <DashboardContent
            activeSection={activeSection}
            onSectionChange={setActiveSection}
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

