import React from 'react';
import { FullProfileData } from '../../types';
import { CountryBadge } from '../CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';

interface ModernProfessionalTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ModernProfessionalTemplate: React.FC<ModernProfessionalTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#2563EB'; // Professional blue
    const t = useTranslations();

    // Use portfolioItems if available (full array), otherwise fallback to portfolio (legacy projects only)
    const portfolioItems = data.portfolioItems || data.portfolio || [];

    // Filter certifications from portfolio
    const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');

    return (
        <div className="font-sans bg-white dark:bg-dark-bg-secondary">
            {/* Header with modern sidebar design */}
            <div className="flex min-h-screen">
                {/* Left sidebar */}
                <div className="w-1/3" style={{ backgroundColor: accentColor }}>
                    <div className="p-8 text-white">
                        {profile.avatar_url && (
                            <div className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white bg-cover bg-center"
                                 style={{ backgroundImage: `url('${profile.avatar_url}')` }}>
                            </div>
                        )}
                        <h1 className="text-3xl font-bold mb-2 text-center">{profile.full_name}</h1>
                        <p className="text-lg font-light opacity-90 mb-4 text-center">{profile.headline}</p>
                        {profile.country_code && (
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                            </div>
                        )}

                        {/* Contact Info */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/30 pb-2">{t.cvSections.contact}</h2>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                    </svg>
                                    <span className="break-all">{profile.meta_description || 'N/A'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                                    </svg>
                                    <span>{t.cvSections.location}</span>
                                </p>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/30 pb-2">{t.cvSections.skills}</h2>
                            <div className="space-y-2">
                                {skills.map(skill => (
                                    <div key={skill.id} className="bg-white/20 backdrop-blur-sm p-2 rounded text-sm font-medium">
                                        {skill.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/30 pb-2">{t.cvSections.education}</h2>
                            <div className="space-y-4">
                                {education.map(edu => (
                                    <div key={edu.id} className="text-sm">
                                        <h3 className="font-bold">{edu.degree}</h3>
                                        <p className="opacity-90">{edu.institution_name}</p>
                                        <p className="text-xs opacity-75">{new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.present}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/30 pb-2">
                                    {t.cvSections?.certifications || 'Certificaciones'}
                                </h2>
                                <div className="space-y-4">
                                    {certifications.map((cert, index) => (
                                        <div key={cert.id || index} className="text-sm">
                                            <h3 className="font-bold flex items-center gap-2 flex-wrap">
                                                {cert.title}
                                                {cert.verified && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/30 text-white text-xs font-semibold rounded-full">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="opacity-90 text-xs mt-1">{cert.issuer}</p>
                                            <p className="text-xs opacity-75">
                                                {cert.issue_date}
                                                {cert.expiry_date && <span> • {t.cvSections.expires} {cert.expiry_date}</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right content */}
                <div className="w-2/3 p-12 bg-gray-50 dark:bg-dark-bg-tertiary">
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold uppercase tracking-wider mb-4" style={{ color: accentColor }}>{t.cvSections.profile}</h2>
                        <div className="h-1 w-20 mb-6" style={{ backgroundColor: accentColor }}></div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold uppercase tracking-wider mb-4" style={{ color: accentColor }}>{t.cvSections.experience}</h2>
                        <div className="h-1 w-20 mb-6" style={{ backgroundColor: accentColor }}></div>
                        <div className="space-y-6">
                            {experiences.map(exp => (
                                <div key={exp.id} className="border-l-4 pl-6 pb-6" style={{ borderColor: accentColor }}>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{exp.position}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap ml-4">
                                            {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.present}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-gray-600 dark:text-gray-400 mb-2">{exp.company_name}</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ModernProfessionalTemplate;
