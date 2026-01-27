import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, LinkIcon } from '@heroicons/react/24/solid';
import { CountryBadge } from '../CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';
import { ProfileContactButtons } from './ProfileContactButtons';

interface ProfessionalClassicTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ProfessionalClassicTemplate: React.FC<ProfessionalClassicTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#1F2937'; // Default to gray-800
    const t = useTranslations();

    // Use portfolioItems if available (full array), otherwise fallback to portfolio (legacy projects only)
    const portfolioItems = data.portfolioItems || data.portfolio || [];

    // Filter certifications from portfolio
    const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');

    return (
        <div className="font-serif bg-white dark:bg-dark-bg-primary">
            {/* Centered header with circular design */}
            <header className="text-center py-16 px-12 bg-gray-50 dark:bg-dark-bg-secondary border-b-2 border-gray-200 dark:border-dark-border">
                <div className="flex justify-center mb-8">
                    <div className="relative w-40 h-40 rounded-full" style={{ backgroundColor: accentColor }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-dark-bg-primary shadow-xl overflow-hidden flex items-center justify-center"
                                 style={{ backgroundColor: profile.avatar_url ? 'transparent' : 'white' }}>
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.full_name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="text-5xl font-bold" style={{ color: accentColor }}>
                                        {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <h1 className="text-5xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight">
                    {profile.full_name}
                </h1>
                <p className="text-2xl text-gray-600 dark:text-gray-400 mb-4 font-light">{profile.headline}</p>
                {profile.country_code && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                    </div>
                )}
                <div className="flex justify-center flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                    {profile.meta_description && (
                        <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4" style={{ color: accentColor }} />
                            <span>{profile.meta_description}</span>
                        </div>
                    )}
                    {profile.linkedin_url && (
                        <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" style={{ color: accentColor }} />
                            <span>LinkedIn</span>
                        </div>
                    )}
                </div>
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

            <div className="max-w-4xl mx-auto p-12">
                {/* Professional Summary */}
                <section className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.profile}</h2>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-wrap pl-16">
                        {profile.summary}
                    </p>
                </section>

                {/* Experience */}
                <section className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.professionalExperience}</h2>
                    </div>
                    <div className="space-y-8 pl-16">
                        {experiences.map(exp => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                                        {new Date(exp.start_date).getFullYear()} – {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.present}
                                    </span>
                                </div>
                                <p className="font-semibold mb-3" style={{ color: accentColor }}>{exp.company_name}</p>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.education}</h2>
                    </div>
                    <div className="space-y-6 pl-16">
                        {education.map(edu => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                                        {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.present}
                                    </span>
                                </div>
                                <p className="font-semibold" style={{ color: accentColor }}>{edu.institution_name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.education}</h2>
                    </div>
                    <div className="space-y-6 pl-16">
                        {education.map(edu => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                                        {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.present}
                                    </span>
                                </div>
                                <p className="font-semibold" style={{ color: accentColor }}>{edu.institution_name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Certifications */}
                {certifications.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {t.cvSections?.certifications || 'Certificaciones Profesionales'}
                            </h2>
                        </div>
                        <div className="space-y-6 pl-16">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index}>
                                    <div className="flex items-start gap-4">
                                        {cert.image_url && (
                                            <img
                                                src={cert.image_url}
                                                alt={cert.title}
                                                className="w-12 h-12 object-contain"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
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
                                            <p className="font-semibold" style={{ color: accentColor }}>{cert.issuer}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {cert.issue_date}
                                                {cert.expiry_date && ` – ${cert.expiry_date}`}
                                            </p>
                                            {cert.description && (
                                                <p className="text-gray-600 dark:text-gray-400 mt-2">{cert.description}</p>
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
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.competencies}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pl-16">
                        {skills.map(skill => (
                            <div
                                key={skill.id}
                                className="px-4 py-3 text-center font-semibold border-2 rounded-lg"
                                style={{
                                    borderColor: accentColor,
                                    color: accentColor
                                }}
                            >
                                {skill.name}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProfessionalClassicTemplate;
