import React, { useState } from 'react';
import { FullProfileData } from '../../types';
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  SparklesIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import ContactLeadModal from '../ContactLeadModal';
import { useAuth } from '../../contexts/AuthContext';
import { CTATracker } from './CTATracker';
import PublicStampBadges from '../PublicStampBadges';

interface PassportTemplateProps {
  data: FullProfileData;
  color?: string;
}

const PassportTemplate: React.FC<PassportTemplateProps> = ({ data, color = '#0052FF' }) => {
  const { profile, experiences = [], education = [], skills = [], portfolioItems = [], stamps = [] } = data || {};
  const { user, openModal } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = user?.id === profile.id;

  const handleContactClick = () => {
    if (!user) {
      openModal('login');
      return;
    }
    setShowContactModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary">
      {/* Premium Header with Gradient */}
      <header className="relative bg-white dark:bg-dark-bg-secondary shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar with Premium Styling */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-36 h-36 rounded-full overflow-hidden ring-4 ring-white dark:ring-dark-bg-primary shadow-2xl">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                    {profile.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full p-2.5 shadow-lg">
                <CheckBadgeIcon className="w-7 h-7" />
              </div>
            </div>

            {/* Info with Modern Typography */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                {profile.full_name}
              </h1>
              <p className="text-2xl text-gray-600 dark:text-gray-400 mb-4 font-medium">
                {profile.headline}
              </p>

              {/* Verification Badges */}
              {stamps && stamps.length > 0 && (
                <div className="mb-4 flex justify-center md:justify-start">
                  <PublicStampBadges stamps={stamps} compact={true} />
                </div>
              )}

              {profile.location && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 dark:text-gray-400 mb-6">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="font-medium">{profile.location}</span>
                </div>
              )}

              {/* Premium Action Buttons - Only show if NOT viewing own profile */}
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start print:hidden">
                  <CTATracker
                    profileId={profile.id}
                    ctaType="contact_button"
                    ctaLabel="Contact Me"
                    onClick={handleContactClick}
                    className="group relative inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <EnvelopeIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>Contact Me</span>
                  </CTATracker>
                  <CTATracker
                    profileId={profile.id}
                    ctaType="schedule_meeting"
                    ctaLabel="Schedule Meeting"
                    className="inline-flex items-center gap-2 px-7 py-3 bg-white dark:bg-dark-bg-tertiary border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    <CalendarIcon className="w-5 h-5" />
                    <span>Schedule Meeting</span>
                  </CTATracker>
                  <CTATracker
                    profileId={profile.id}
                    ctaType="download_cv"
                    ctaLabel="Download CV"
                    className="inline-flex items-center gap-2 px-7 py-3 bg-white dark:bg-dark-bg-tertiary border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 text-gray-700 dark:text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Download CV</span>
                  </CTATracker>
                </div>
              )}
              
              {/* Message for own profile */}
              {isOwnProfile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-6 py-3 text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    👋 Este es tu perfil. Los visitantes verán los botones de contacto aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Premium Cards */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section with Accent Border */}
            {profile.summary && (
              <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl border-l-4 border-blue-500 hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">About</h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-lg">
                  {profile.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Leadership', 'Innovation', 'Problem Solving', 'Team Player'].map((strength) => (
                    <span
                      key={strength}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold border border-blue-200 dark:border-blue-800"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Experience Section with Modern Timeline */}
            {experiences.length > 0 && (
              <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BriefcaseIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Experience</h2>
                </div>
                <div className="space-y-8">
                  {experiences.map((exp, index) => (
                    <div key={index} className="relative pl-10 pb-8 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
                      <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 ring-4 ring-white dark:ring-dark-bg-secondary -translate-x-[11px] shadow-lg"></div>
                      <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {exp.position}
                        </h3>
                        <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold mb-1">
                          {exp.company_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-3 font-medium">
                          {exp.start_date} - {exp.end_date || 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education Section */}
            {education.length > 0 && (
              <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Education</h2>
                </div>
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="flex gap-5 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-gray-800/50 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                        <AcademicCapIcon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {edu.degree}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 font-semibold">
                          {edu.institution_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {edu.start_date} - {edu.end_date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills Section with Modern Pills */}
            {skills.length > 0 && (
              <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="group relative px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-dark-bg-tertiary dark:to-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-semibold hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all cursor-default shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Verified Credentials Section */}
            {stamps && stamps.length > 0 && (
              <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow border-2 border-green-200 dark:border-green-800">
                <PublicStampBadges stamps={stamps} showDetails={true} />
              </section>
            )}
          </div>

          {/* Sidebar with Premium Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Availability Card - Optional */}
            {(profile.show_availability_badge !== false) && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 shadow-lg border-2 border-green-200 dark:border-green-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Availability
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">
                    Open to opportunities
                  </span>
                </div>
              </div>
            )}

            {/* Verified Stamps - Optional */}
            {profile.show_verified_credentials && (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                  Verified Credentials
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Email Verified</span>
                  </div>
                  {profile.linkedin_url && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">LinkedIn Connected</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <CheckBadgeIcon className="w-6 h-6 text-purple-500" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Identity Verified</span>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Links - Optional */}
            {profile.show_connect_links && (profile.linkedin_url || profile.portfolio_url || profile.github_url) && (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                  Connect With Me
                </h3>
                <div className="space-y-3">
                  {profile.linkedin_url && (
                    <CTATracker
                      profileId={profile.id}
                      ctaType="linkedin"
                      ctaLabel="LinkedIn Profile"
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all group"
                    >
                      <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">LinkedIn Profile</span>
                    </CTATracker>
                  )}
                  {profile.portfolio_url && (
                    <CTATracker
                      profileId={profile.id}
                      ctaType="portfolio"
                      ctaLabel="Portfolio Website"
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all group"
                    >
                      <GlobeAltIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Portfolio Website</span>
                    </CTATracker>
                  )}
                  {profile.github_url && (
                    <CTATracker
                      profileId={profile.id}
                      ctaType="github"
                      ctaLabel="GitHub Profile"
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all group"
                    >
                      <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">GitHub</span>
                    </CTATracker>
                  )}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Contact Lead Modal */}
      <ContactLeadModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        recipientId={profile.id}
        recipientName={profile.full_name}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default PassportTemplate;
