import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, LinkIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';
import { ProfileContactButtons } from './ProfileContactButtons';

interface ElegantMinimalTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ElegantMinimalTemplate: React.FC<ElegantMinimalTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#8B5CF6'; // Default to violet-500
    const t = useTranslations();

    // Use portfolioItems if available (full array), otherwise fallback to portfolio (legacy projects only)
    const portfolioItems = data.portfolioItems || data.portfolio || [];

    // Filter certifications from portfolio
    const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');

    return (
        <div className="max-w-5xl mx-auto p-12 md:p-20 font-sans bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary min-h-screen">
            <header className="text-center mb-20 pb-16 border-b-2 border-gray-200 dark:border-gray-700">
                <div className="relative group inline-block mb-8">
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}></div>
                    <div className="relative w-32 h-32 rounded-full shadow-2xl ring-4 ring-white dark:ring-dark-bg-primary overflow-hidden">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br flex items-center justify-center text-white text-5xl font-bold" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                                {profile.full_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                <h1 className="text-6xl md:text-7xl font-thin text-gray-900 dark:text-white mb-4 tracking-tight uppercase">
                    {profile.full_name}
                </h1>
                <p className="text-2xl text-gray-600 dark:text-gray-400 mb-6 font-light tracking-wide">
                    {profile.headline}
                </p>
                {profile.country_code && (
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                    </div>
                )}
                <div className="flex justify-center gap-8 flex-wrap text-base text-gray-600 dark:text-gray-400">
                    {profile.meta_description && (
                        <a href={`mailto:${profile.meta_description}`} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <EnvelopeIcon className="w-5 h-5" />
                            <span>{profile.meta_description}</span>
                        </a>
                    )}
                    <span>•</span>
                    {profile.linkedin_url && (
                        <a href={profile.linkedin_url} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <LinkIcon className="w-5 h-5" />
                            <span>LinkedIn</span>
                        </a>
                    )}
                </div>
                {/* Contact Buttons */}
                <div className="mt-8 flex justify-center">
                    <ProfileContactButtons
                        profileId={profile.id}
                        profileEmail={profile.email}
                        variant="minimal"
                        accentColor={accentColor}
                    />
                </div>
            </header>

            <main>
                <section className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                            <BriefcaseIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">{t.cvSections.summary}</h2>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-loose text-lg whitespace-pre-wrap pl-14">
                        {profile.summary}
                    </p>
                </section>

                <section className="mb-20">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                            <BriefcaseIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">{t.cvSections.experience}</h2>
                    </div>
                    <div className="space-y-12">
                        {experiences.map((exp, index) => (
                            <div key={exp.id} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-16 gap-y-4 group">
                                <div className="md:text-right">
                                    <div className="inline-block px-5 py-2 rounded-xl shadow-md mb-3" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}>
                                        <p className="font-bold text-sm" style={{ color: accentColor }}>
                                            {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.present}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-wider">
                                        {exp.company_name}
                                    </p>
                                </div>
                                <div className="relative pl-8 border-l-2 group-hover:border-l-4 transition-all" style={{ borderColor: `${accentColor}40` }}>
                                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full ring-4 ring-white dark:ring-dark-bg-primary -translate-x-[9px] shadow-lg transition-all group-hover:scale-125" style={{ backgroundColor: accentColor }}></div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                        {exp.position}
                                    </h3>
                                    {exp.description && (
                                        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                                            {exp.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-20">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                            <AcademicCapIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">{t.cvSections.education}</h2>
                    </div>
                    <div className="space-y-8">
                        {education.map((edu, index) => (
                             <div key={edu.id} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-16 gap-y-4">
                                <div className="md:text-right">
                                    <div className="inline-block px-5 py-2 rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}>
                                        <p className="font-bold text-sm" style={{ color: accentColor }}>
                                            {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.present}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                        {edu.degree}
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-base font-semibold">
                                        {edu.institution_name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Certifications Section */}
                {certifications.length > 0 && (
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">
                                {t.cvSections?.certifications || 'Certificaciones'}
                            </h2>
                        </div>
                        <div className="space-y-8">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-16 gap-y-4">
                                    <div className="md:text-right">
                                        <div className="inline-block px-5 py-2 rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}>
                                            <p className="font-bold text-sm" style={{ color: accentColor }}>
                                                {cert.issue_date}
                                                {cert.expiry_date && <><br/>Exp: {cert.expiry_date}</>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        {cert.image_url && (
                                            <img
                                                src={cert.image_url}
                                                alt={cert.title}
                                                className="w-16 h-16 object-contain"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 flex-wrap">
                                                {cert.title}
                                                {cert.verified && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Verificado
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-300 text-base font-semibold">{cert.issuer}</p>
                                            {cert.description && (
                                                <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{cert.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                            <BriefcaseIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">{t.cvSections.skills}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 pl-14">
                        {skills.map(skill => (
                            <span key={skill.id} className="px-6 py-3 rounded-xl text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-default" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ElegantMinimalTemplate;
