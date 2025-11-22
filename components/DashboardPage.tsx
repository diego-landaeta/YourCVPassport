import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/client';
import Sidebar from './dashboard/Sidebar';
import MobileNav from './dashboard/MobileNav';
import DashboardContent from './dashboard/DashboardContent';
import ProfileEditorSidebar from './dashboard/ProfileEditorSidebar';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

const DashboardPage: React.FC = () => {
  const { profile, session } = useAuth();
  const { lang } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');

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

  // Load counts and data for profile sections - optimized to only load when in Mi Perfil section
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user.id) return;

      // Only load data if we're in the Mi Perfil section to reduce initial load time
      if (!activeSection.startsWith('mi-perfil')) return;

      try {
        const [
          { data: expData, count: expCount },
          { data: eduData, count: eduCount },
          { data: skillData, count: skillCount },
          { data: langData, count: langCount },
          { count: portCount }
        ] = await Promise.all([
          supabase.from('experiences').select('*', { count: 'exact' }).eq('profile_id', session.user.id),
          supabase.from('education').select('*', { count: 'exact' }).eq('profile_id', session.user.id),
          supabase.from('skills').select('*', { count: 'exact' }).eq('profile_id', session.user.id),
          supabase.from('languages').select('*', { count: 'exact' }).eq('profile_id', session.user.id),
          supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('profile_id', session.user.id)
        ]);

        setExperiences(expData || []);
        setEducation(eduData || []);
        setSkills(skillData || []);
        setLanguages(langData || []);

        setExperiencesCount(expCount || 0);
        setEducationCount(eduCount || 0);
        setSkillsCount(skillCount || 0);
        setLanguagesCount(langCount || 0);
        setPortfolioCount(portCount || 0);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [session, saveMessage, activeSection]); // Reload when save message changes or section changes

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
        />
      </div>

      {/* Profile Editor Secondary Sidebar - only show when in Mi Perfil */}
      {isInMiPerfil && (
        <div className="hidden lg:block">
          <ProfileEditorSidebar
            activeSubsection={subsection}
            onSubsectionChange={(newSubsection) => setActiveSection(`mi-perfil:${newSubsection}`)}
            profile={profile}
            lastSaved={lastSaved ? new Date(lastSaved).toLocaleTimeString() : undefined}
            saveMessage={saveMessage}
            experiencesCount={experiencesCount}
            educationCount={educationCount}
            skillsCount={skillsCount}
            languagesCount={languagesCount}
            portfolioCount={portfolioCount}
          />
        </div>
      )}

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
      <div className={`lg:ml-64 min-h-screen ${isInMiPerfil ? 'lg:ml-[calc(16rem+18rem)]' : ''}`}>
        <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
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
