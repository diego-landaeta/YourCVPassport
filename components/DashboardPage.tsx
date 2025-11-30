import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/client';
import Sidebar from './dashboard/Sidebar';
import MobileNav from './dashboard/MobileNav';
import DashboardContent from './dashboard/DashboardContent';
import ProfileEditorSidebar from './dashboard/ProfileEditorSidebar';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { useDashboardTour } from '../hooks/useDashboardTour';

const DashboardPage: React.FC = () => {
  const { profile, session } = useAuth();
  const { lang } = useLanguage();
  const { hasTourBeenCompleted } = useDashboardTour(profile?.id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [profileCompleteness, setProfileCompleteness] = useState(0);

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

  // Load counts and data for profile sections
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user.id) return;

      // REMOVED: Conditional check that prevented data loading on dashboard
      // We need this data ALWAYS to calculate profile completeness for the Sidebar

      try {
        // Use Promise.allSettled to prevent one failure from blocking everything
        const results = await Promise.allSettled([
          supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          supabase.from('education').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          supabase.from('skills').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          supabase.from('languages').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id),
          // Optimized portfolio query
          supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id)
        ]);

        // Process results safely
        const expResult = results[0].status === 'fulfilled' ? results[0].value : { data: [], count: 0 };
        const eduResult = results[1].status === 'fulfilled' ? results[1].value : { data: [], count: 0 };
        const skillResult = results[2].status === 'fulfilled' ? results[2].value : { data: [], count: 0 };
        const langResult = results[3].status === 'fulfilled' ? results[3].value : { data: [], count: 0 };
        const portResult = results[4].status === 'fulfilled' ? results[4].value : { data: [], count: 0 };

        setExperiences(expResult.data || []);
        setEducation(eduResult.data || []);
        setSkills(skillResult.data || []);
        setLanguages(langResult.data || []);

        setExperiencesCount(expResult.count || 0);
        setEducationCount(eduResult.count || 0);
        setSkillsCount(skillResult.count || 0);
        setLanguagesCount(langResult.count || 0);
        setPortfolioCount(portResult.count || 0);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [session, saveMessage, activeSection]); // Reload when save message changes or section changes

  // Calculate profile completeness
  useEffect(() => {
    if (!profile) return;

    // Importar la función centralizada para calcular completeness
    import('../utils/profileValidation').then(({ calculateProfileCompleteness }) => {
      const completeness = calculateProfileCompleteness(profile, {
        experiences: experiencesCount,
        education: educationCount,
        skills: skillsCount,
        languages: languagesCount,
        portfolio: portfolioCount,
      });
      setProfileCompleteness(completeness);
    });
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
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default DashboardPage;

