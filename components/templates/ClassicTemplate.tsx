import React from 'react';
import { FullProfileData } from '../../types';
import { BriefcaseIcon, AcademicCapIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import VerifiedStampsBadge from '../VerifiedStampsBadge';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProfileContactButtons } from './ProfileContactButtons';

interface ClassicTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#0052FF'; // Default to cv-blue
    const t = useTranslations();
    const { lang } = useLanguage();

    // Use portfolioItems if available (full array), otherwise fallback to portfolio (legacy projects only)
    const portfolioItems = data.portfolioItems || data.portfolio || [];

    // Filter certifications and collaborations from portfolio
    const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');
    const collaborations = data.collaborations || [];

    const formatDate = (dateString: string) => {
        const formatted = new Date(dateString).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    // Helper to generate a lighter version of the accent color for backgrounds
    const lighterAccentColor = `${accentColor}1A`; // Add 10% opacity in hex

    return (
        <div className="max-w-5xl mx-auto my-12 bg-gradient-to-br from-white to-gray-50 dark:from-dark-bg-secondary dark:to-dark-bg-primary rounded-2xl shadow-2xl p-10 md:p-16">
            <header className="text-center border-b-2 border-gray-200 dark:border-gray-700 pb-10 mb-12">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 shadow-xl ring-4 ring-white dark:ring-dark-bg-primary overflow-hidden">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 text-5xl font-bold">
                            {profile.full_name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                    {profile.full_name}
                </h1>
                {/* Verified Stamps Badge */}
                {profile.show_verified_credentials !== false && (
                    <div className="flex items-center justify-center mb-3">
                        <VerifiedStampsBadge profileId={profile.id} size="md" />
                    </div>
                )}
                <p className="mt-3 text-2xl md:text-3xl font-serif font-medium bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, ${accentColor}CC)` }}>
                    {profile.headline}
                </p>
                {profile.country_code && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                    </div>
                )}
                {/* Contact Buttons */}
                <div className="mt-6 flex justify-center">
                    <ProfileContactButtons
                        profileId={profile.id}
                        profileEmail={profile.email}
                        variant="compact"
                        accentColor={accentColor}
                        showDownload={false}
                    />
                </div>
            </header>

            <main className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-1 space-y-8">
                    <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)` }}>
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">{t.cvSections.summary}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-serif">
                            {profile.summary}
                        </p>
                    </section>
                    <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6">{t.cvSections.skills}</h2>
                        <div className="flex flex-wrap gap-3">
                            {skills.map(skill => (
                                <span
                                    key={skill.id}
                                    className="text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-default border border-gray-200 dark:border-gray-700"
                                    style={{
                                        background: `linear-gradient(135deg, ${lighterAccentColor}, ${accentColor}10)`,
                                        color: accentColor
                                    }}
                                >
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="md:col-span-2 space-y-10">
                    <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)` }}>
                                <BriefcaseIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">{t.cvSections.workExperience}</h2>
                        </div>
                        <div className="space-y-8">
                            {experiences.map((exp, index) => (
                                <div key={exp.id} className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full ring-4 ring-white dark:ring-dark-bg-tertiary -translate-x-[9px] shadow-lg" style={{ backgroundColor: accentColor }}></div>
                                    <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl p-6 hover:shadow-lg transition-all">
                                        <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                                            {exp.position}
                                        </h3>
                                        <p className="text-lg font-semibold mb-1" style={{ color: accentColor }}>
                                            {exp.company_name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                                            {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : t.cvSections.present}
                                        </p>
                                        {exp.description && (
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)` }}>
                                <AcademicCapIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">{t.cvSections.education}</h2>
                        </div>
                         <div className="space-y-6">
                            {education.map(edu => (
                                <div key={edu.id} className="flex gap-5 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-primary dark:to-gray-800 rounded-xl hover:shadow-md transition-all">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)` }}>
                                        <AcademicCapIcon className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-1">
                                            {edu.institution_name}
                                        </h3>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">
                                            {edu.degree}{edu.field_of_study && `, ${edu.field_of_study}`}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : t.cvSections.ongoing}
                                        </p>
                                        {edu.description && (
                                            <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                                                {edu.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Certifications Section */}
                    {certifications.length > 0 && (
                        <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)` }}>
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                                    {t.cvSections?.certifications || 'Certificaciones Profesionales'}
                                </h2>
                            </div>
                            <div className="space-y-6">
                                {certifications.map((cert, index) => (
                                    <div key={cert.id || index} className="flex gap-5 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-primary dark:to-gray-800 rounded-xl hover:shadow-md transition-all">
                                        {cert.image_url && (
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={cert.image_url}
                                                    alt={cert.title}
                                                    className="w-16 h-16 object-contain rounded-lg"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 flex-wrap">
                                                {cert.title}
                                                {cert.verified && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        {t.cvSections.verified}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                                {cert.issuer}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {cert.issue_date}
                                                {cert.expiry_date && ` • ${t.cvSections.expires} ${cert.expiry_date}`}
                                            </p>
                                            {cert.description && (
                                                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {cert.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Collaborations Section */}
                    {collaborations.length > 0 && (
                        <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)` }}>
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                                    {t.cvSections?.collaborations || 'Collaborations'}
                                </h2>
                            </div>
                            <div className="space-y-6">
                                {collaborations.map((collab, index) => (
                                    <div key={collab.id || index} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-primary dark:to-gray-800 rounded-xl hover:shadow-md transition-all">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-1">
                                                {collab.title}
                                            </h3>
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                                {collab.organization} {collab.role && `• ${collab.role}`}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {collab.start_date && formatDate(collab.start_date)}
                                                {collab.end_date && !collab.is_current && ` - ${formatDate(collab.end_date)}`}
                                                {collab.is_current && ' - Present'}
                                            </p>
                                            {collab.description && (
                                                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {collab.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ClassicTemplate;