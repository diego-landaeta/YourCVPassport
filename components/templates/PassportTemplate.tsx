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
import { useAuth } from '../../contexts/AuthContext';
import { CTATracker } from './CTATracker';
import PublicStampBadges from '../PublicStampBadges';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface PassportTemplateProps {
  data: FullProfileData;
  color?: string;
}

const PassportTemplate: React.FC<PassportTemplateProps> = ({ data, color = '#0052FF' }) => {
  const { profile, experiences = [], education = [], skills = [], languages = [], portfolioItems = [], stamps = [] } = data || {};
  const { user, openModal } = useAuth();
  const t = useTranslations();
  const toast = useToastContext();
  const { lang } = useLanguage();

  // Format date to show month and year (e.g., "Jan 2022" or "Ene 2022")
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Check if viewing own profile
  const isOwnProfile = user?.id === profile.id;

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
              {stamps && stamps.length >= 3 && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full p-2.5 shadow-lg">
                  <CheckBadgeIcon className="w-7 h-7" />
                </div>
              )}
            </div>

            {/* Info with Modern Typography */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
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
                  <button
                    onClick={() => toast.info('Funcionalidad en desarrollo')}
                    className="group relative inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <EnvelopeIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>{t.cvSections.contactMe}</span>
                  </button>
                  <button
                    onClick={() => toast.info('Funcionalidad en desarrollo')}
                    className="inline-flex items-center gap-2 px-7 py-3 bg-white dark:bg-dark-bg-tertiary border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <CalendarIcon className="w-5 h-5" />
                    <span>{t.cvSections.scheduleMeeting}</span>
                  </button>
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
      <div className="max-w-6xl mx-auto px-6 pb-10">
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
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.about}</h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  {profile.summary}
                </p>
              </section>
            )}

            {/* Experience Section with Modern Timeline */}
            {experiences.length > 0 && (
              <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BriefcaseIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.experience}</h2>
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
                          {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : t.cvSections.present}
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
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.education}</h2>
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
                          {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : t.cvSections.ongoing}
                        </p>
                      </div>
                    </div>
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
            {/* Availability Card - Only shown when actively looking for work */}
            {profile.job_seeking_status === 'OPEN' && (
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

            {/* Note: Verified credentials are now shown using stamps system only (see main content area)
                 Admins verify users through the stamps system, not user-controlled settings */}

            {/* Languages Section */}
            {languages.length > 0 && (
              <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5 text-teal-600" />
                  {t.cvSections.languages}
                </h3>
                <div className="space-y-3">
                  {languages.map((language, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-gray-800/50 rounded-lg">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{(t as any).languageNames?.[language.name] || language.name}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        language.is_native
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      }`}>
                        {language.is_native ? ((t.dashboard as any)?.native || 'Native') : language.level}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications Section - Compact Sidebar Version */}
            {(() => {
              const certifications = portfolioItems?.filter(item => item.type === 'CERTIFICATION') || [];
              return certifications.length > 0 && (
                <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {t.cvSections?.certifications || 'Certificaciones'}
                  </h3>
                  <div className="space-y-3">
                    {certifications.map((cert, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-gray-800/50 rounded-lg hover:shadow-md transition-shadow border-l-4 border-yellow-500">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2 flex-wrap">
                          {cert.title}
                          {cert.verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                            </span>
                          )}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">{cert.issuer}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(cert.issue_date)}
                          {cert.expiry_date && <span> • {t.cvSections.expires} {formatDate(cert.expiry_date)}</span>}
                        </p>
                        {cert.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {cert.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Skills Section - Compact Sidebar Version */}
            {skills.length > 0 && (
              <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                  {t.cvSections.skillsExpertise}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>

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
