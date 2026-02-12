import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, LinkIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';
import { ProfileContactButtons } from './ProfileContactButtons';

interface ProfessionalBlueTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ProfessionalBlueTemplate: React.FC<ProfessionalBlueTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#0284C7'; // default to sky-600
    const t = useTranslations();

    // Use portfolioItems if available (full array), otherwise fallback to portfolio (legacy projects only)
    const portfolioItems = data.portfolioItems || data.portfolio || [];

    // Filter certifications from portfolio
    const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');

    const SkillDots: React.FC<{ level: number }> = ({ level }) => {
        const totalDots = 5;
        return (
            <div className="flex gap-2">
                {[...Array(totalDots)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full shadow-md transition-all ${i < level ? 'scale-110' : 'bg-gray-300 dark:bg-gray-600'}`}
                        style={{ backgroundColor: i < level ? accentColor : undefined }}
                    ></div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[420px_1fr] bg-gray-50 dark:bg-dark-bg-primary">
            <aside className="p-12 border-r-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary shadow-xl" style={{ backgroundColor: `${accentColor}08` }}>
                 <div className="relative group mb-10">
                    <div className="absolute inset-0 rounded-2xl blur-2xl opacity-30" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}></div>
                    <div className="relative w-56 h-56 rounded-2xl mx-auto shadow-2xl ring-4 ring-white dark:ring-dark-bg-primary overflow-hidden">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-7xl font-bold" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                                {profile.full_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-3">
                    {profile.full_name}
                </h1>
                <p className="text-center font-bold text-lg mb-4" style={{ color: accentColor }}>
                    {profile.headline}
                </p>
                {profile.country_code && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                    </div>
                )}
                {/* Contact Buttons */}
                <div className="mb-8 flex justify-center">
                    <ProfileContactButtons
                        profileId={profile.id}
                        profileEmail={profile.email}
                        variant="minimal"
                        accentColor={accentColor}
                    />
                </div>

                <div className="space-y-10">
                    <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2" style={{ borderColor: accentColor }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                                <EnvelopeIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="font-black text-lg uppercase tracking-wider text-gray-900 dark:text-white">{t.cvSections.contact}</h2>
                        </div>
                        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            {profile.meta_description && (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-500 font-semibold mb-1 text-xs uppercase tracking-wide">{t.cvSections.email}</p>
                                    <p className="break-all">{profile.meta_description}</p>
                                </div>
                            )}
                            {profile.phone && (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-500 font-semibold mb-1 text-xs uppercase tracking-wide">{t.cvSections.phone}</p>
                                    <p>{profile.phone}</p>
                                </div>
                            )}
                            {profile.linkedin_url && (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-500 font-semibold mb-1 text-xs uppercase tracking-wide">LinkedIn</p>
                                    <a href={profile.linkedin_url} className="hover:underline break-all" style={{ color: accentColor }}>
                                        View Profile
                                    </a>
                                </div>
                            )}
                        </div>
                    </section>
                    <section className="bg-white dark:bg-dark-bg-tertiary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2" style={{ borderColor: accentColor }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                                <BriefcaseIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="font-black text-lg uppercase tracking-wider text-gray-900 dark:text-white">{t.cvSections.skills}</h2>
                        </div>
                        <div className="space-y-5">
                            {skills.map(skill => (
                                <div key={skill.id}>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{skill.name}</p>
                                    <SkillDots level={Math.round((skill.percentage || 0) / 20)} />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </aside>
            <main className="p-12 lg:p-16 bg-white dark:bg-dark-bg-secondary">
                <section className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                            <BriefcaseIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white">{t.cvSections.profile}</h2>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                        {profile.summary}
                    </p>
                </section>

                <section className="mb-16">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                            <BriefcaseIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white">{t.cvSections.workExperience}</h2>
                    </div>
                    <div className="space-y-10">
                        {experiences.map((exp, index) => (
                            <div key={exp.id} className="relative pl-10 pb-10 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0 group">
                                <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full ring-4 ring-white dark:ring-dark-bg-secondary -translate-x-[11px] shadow-lg transition-all group-hover:scale-125" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}></div>
                                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-dark-bg-tertiary dark:to-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-l-4" style={{ borderColor: accentColor }}>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {exp.position}
                                    </h3>
                                    <div className="flex justify-between items-baseline mb-4 flex-wrap gap-2">
                                        <p className="font-black text-lg" style={{ color: accentColor }}>{exp.company_name}</p>
                                        <p className="text-sm px-4 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                            {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.present}
                                        </p>
                                    </div>
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

                <section className="mb-16">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                            <AcademicCapIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white">{t.cvSections.education}</h2>
                    </div>
                     <div className="space-y-6">
                        {education.map(edu => (
                            <div key={edu.id} className="flex gap-6 p-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                                <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                                    <AcademicCapIcon className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{edu.degree}</h3>
                                    <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{edu.institution_name}</p>
                                    <p className="text-sm px-3 py-1 rounded-lg inline-block font-semibold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                        {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.ongoing}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Certifications Section */}
                {certifications.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #0EA5E9)` }}>
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white">
                                {t.cvSections?.certifications || 'Certificaciones Profesionales'}
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index} className="flex gap-6 p-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border-l-4" style={{ borderColor: accentColor }}>
                                    {cert.image_url && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={cert.image_url}
                                                alt={cert.title}
                                                className="w-16 h-16 object-contain rounded-lg bg-white p-2"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 flex-wrap">
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
                                        <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{cert.issuer}</p>
                                        <p className="text-sm px-3 py-1 rounded-lg inline-block font-semibold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                            {cert.issue_date}
                                            {cert.expiry_date && ` • ${t.cvSections.expires} ${cert.expiry_date}`}
                                        </p>
                                        {cert.description && (
                                            <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                                                {cert.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default ProfessionalBlueTemplate;
