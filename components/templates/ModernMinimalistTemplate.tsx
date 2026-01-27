import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, LinkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';
import { ProfileContactButtons } from './ProfileContactButtons';

interface ModernMinimalistTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ModernMinimalistTemplate: React.FC<ModernMinimalistTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#60A5FA'; // Default to blue-400
    const t = useTranslations();

    // Use portfolioItems if available (full array), otherwise fallback to portfolio (legacy projects only)
    const portfolioItems = data.portfolioItems || data.portfolio || [];

    // Filter certifications from portfolio
    const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');

    return (
        <div className="font-sans bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary min-h-screen">
            <div className="max-w-4xl mx-auto p-16">
                {/* Header with clean minimalist design */}
                <header className="mb-16 pb-12 border-b-2" style={{ borderColor: `${accentColor}40` }}>
                    <div className="flex items-start gap-8">
                        <div className="w-28 h-28 rounded-2xl shadow-xl ring-4 ring-white dark:ring-dark-bg-secondary overflow-hidden flex items-center justify-center"
                             style={{ backgroundColor: profile.avatar_url ? 'transparent' : accentColor }}>
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <span className="text-white text-4xl font-bold">
                                    {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-5xl font-light mb-3 tracking-tight text-gray-900 dark:text-white">
                                {profile.full_name}
                            </h1>
                            <p className="text-2xl text-gray-600 dark:text-gray-400 font-light mb-4">{profile.headline}</p>
                            {profile.country_code && (
                                <div className="flex items-center gap-2 mb-4">
                                    <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                                </div>
                            )}
                            <div className="flex flex-wrap gap-5 text-sm text-gray-600 dark:text-gray-400">
                                {profile.meta_description && (
                                    <a href={`mailto:${profile.meta_description}`} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white">
                                        <EnvelopeIcon className="w-4 h-4" style={{ color: accentColor }} />
                                        <span>{profile.meta_description}</span>
                                    </a>
                                )}
                                {profile.linkedin_url && (
                                    <a href={profile.linkedin_url} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white">
                                        <LinkIcon className="w-4 h-4" style={{ color: accentColor }} />
                                        <span>LinkedIn</span>
                                    </a>
                                )}
                            </div>
                            {/* Contact Buttons */}
                            <div className="mt-4">
                                <ProfileContactButtons
                                    profileId={profile.id}
                                    profileEmail={profile.email}
                                    variant="minimal"
                                    accentColor={accentColor}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* About */}
                <section className="mb-14">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        <h2 className="text-2xl font-light text-gray-900 dark:text-white">{t.cvSections.about}</h2>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-light text-base whitespace-pre-wrap pl-6">
                        {profile.summary}
                    </p>
                </section>

                {/* Experience */}
                <section className="mb-14">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        <h2 className="text-2xl font-light text-gray-900 dark:text-white">{t.cvSections.professionalExperience}</h2>
                    </div>
                    <div className="space-y-8 pl-6">
                        {experiences.map(exp => (
                            <div key={exp.id} className="relative">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">{exp.position}</h3>
                                    <span className="text-sm font-light whitespace-nowrap ml-4" style={{ color: accentColor }}>
                                        {new Date(exp.start_date).getFullYear()} – {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.present}
                                    </span>
                                </div>
                                <p className="font-medium text-gray-600 dark:text-gray-400 mb-2">{exp.company_name}</p>
                                <p className="text-gray-600 dark:text-gray-400 font-light leading-relaxed whitespace-pre-wrap text-sm">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="mb-14">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        <h2 className="text-2xl font-light text-gray-900 dark:text-white">{t.cvSections.education}</h2>
                    </div>
                    <div className="space-y-6 pl-6">
                        {education.map(edu => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{edu.degree}</h3>
                                    <span className="text-sm font-light whitespace-nowrap ml-4" style={{ color: accentColor }}>
                                        {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.present}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 font-light">{edu.institution_name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Certifications */}
                {certifications.length > 0 && (
                    <section className="mb-14">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColor }}></div>
                            <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                                {t.cvSections?.certifications || 'Certificaciones Profesionales'}
                            </h2>
                        </div>
                        <div className="space-y-6 pl-6">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index} className="relative">
                                    <div className="flex items-start gap-4">
                                        {cert.image_url && (
                                            <img
                                                src={cert.image_url}
                                                alt={cert.title}
                                                className="w-12 h-12 object-contain"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
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
                                            <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">{cert.issuer}</p>
                                            <p className="text-sm font-light" style={{ color: accentColor }}>
                                                {cert.issue_date}
                                                {cert.expiry_date && ` – ${cert.expiry_date}`}
                                            </p>
                                            {cert.description && (
                                                <p className="text-gray-600 dark:text-gray-400 font-light leading-relaxed text-sm mt-2">
                                                    {cert.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        <h2 className="text-2xl font-light text-gray-900 dark:text-white">{t.cvSections.skills}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 pl-6">
                        {skills.map(skill => (
                            <span
                                key={skill.id}
                                className="px-5 py-2 rounded-full text-sm font-light shadow-sm border"
                                style={{
                                    backgroundColor: `${accentColor}15`,
                                    borderColor: `${accentColor}30`,
                                    color: accentColor
                                }}
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ModernMinimalistTemplate;
