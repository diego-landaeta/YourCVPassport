import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, MapPinIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';
import { ProfileContactButtons } from './ProfileContactButtons';

interface ModernCleanTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ModernCleanTemplate: React.FC<ModernCleanTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#6366F1'; // Default to indigo-500
    const t = useTranslations();

    // Use portfolioItems if available (full array), otherwise fallback to portfolio (legacy projects only)
    const portfolioItems = data.portfolioItems || data.portfolio || [];

    // Filter certifications from portfolio
    const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');

    const lighterHex = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return hex;
        let r = parseInt(result[1], 16);
        let g = parseInt(result[2], 16);
        let b = parseInt(result[3], 16);
        r = Math.min(255, Math.floor(r + (255 - r) * 0.4));
        g = Math.min(255, Math.floor(g + (255 - g) * 0.4));
        b = Math.min(255, Math.floor(b + (255 - b) * 0.4));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    const gradient = `linear-gradient(135deg, ${lighterHex(accentColor)}, ${accentColor})`;

    return (
        <div className="min-h-screen font-sans bg-gray-50 dark:bg-dark-bg-primary">
            <header className="relative overflow-hidden shadow-2xl" style={{ background: gradient }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative p-20 text-white text-center">
                    <div className="relative group inline-block mb-8">
                        <div className="absolute inset-0 rounded-full blur-xl opacity-50 bg-white"></div>
                        <div className="relative w-48 h-48 rounded-full border-6 border-white/30 shadow-2xl overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-7xl font-bold">
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-6xl font-extrabold mb-4 tracking-tight drop-shadow-lg">{profile.full_name}</h1>
                    <p className="text-2xl font-light opacity-95 mb-6 drop-shadow-md">{profile.headline}</p>
                    {profile.country_code && (
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                        </div>
                    )}
                    <div className="flex justify-center gap-8 flex-wrap text-base">
                        {profile.meta_description && (
                            <div className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <EnvelopeIcon className="w-5 h-5" />
                                <span>{profile.meta_description}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <MapPinIcon className="w-5 h-5" />
                            <span>{profile.location || 'Remote'}</span>
                        </div>
                    </div>
                    {/* Contact Buttons */}
                    <div className="mt-8">
                        <ProfileContactButtons
                            profileId={profile.id}
                            profileEmail={profile.email}
                            variant="compact"
                            accentColor={accentColor}
                            showDownload={false}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: gradient }}>
                                <BriefcaseIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t.cvSections.about}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                            {profile.summary}
                        </p>
                    </section>

                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: gradient }}>
                                <BriefcaseIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t.cvSections.experience}</h2>
                        </div>
                        <div className="space-y-10">
                            {experiences.map((exp, index) => (
                                <div key={exp.id} className="relative pl-10 pb-10 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
                                    <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full ring-4 ring-white dark:ring-dark-bg-secondary -translate-x-[11px] shadow-lg" style={{ background: gradient }}></div>
                                    <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl p-6 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                            <p className="text-sm font-semibold px-4 py-1.5 rounded-lg whitespace-nowrap ml-4" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                                {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.present}
                                            </p>
                                        </div>
                                        <p className="font-bold text-lg mb-3" style={{ color: accentColor }}>
                                            {exp.company_name}
                                        </p>
                                        {exp.description && (
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="space-y-8">
                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: gradient }}>
                                <BriefcaseIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t.cvSections.skills}</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {skills.map(skill => (
                                <div key={skill.id} className="p-4 rounded-xl border-l-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-dark-bg-tertiary text-gray-900 dark:text-white font-semibold text-base shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ borderColor: accentColor }}>
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: gradient }}>
                                <AcademicCapIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t.cvSections.education}</h2>
                        </div>
                        <div className="space-y-6">
                            {education.map(edu => (
                                <div key={edu.id} className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl shadow-md hover:shadow-lg transition-all">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{edu.degree}</h3>
                                    <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm mb-1">{edu.institution_name}</p>
                                    <p className="text-xs font-medium px-3 py-1 rounded-lg inline-block mt-2" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                        {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.ongoing}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Certifications Section */}
                    {certifications.length > 0 && (
                        <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: gradient }}>
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                    {t.cvSections?.certifications || 'Certificaciones Profesionales'}
                                </h2>
                            </div>
                            <div className="space-y-6">
                                {certifications.map((cert, index) => (
                                    <div key={cert.id || index} className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl shadow-md hover:shadow-lg transition-all">
                                        <div className="flex gap-4">
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
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 flex-wrap">
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
                                                <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm mb-1">{cert.issuer}</p>
                                                <p className="text-xs font-medium px-3 py-1 rounded-lg inline-block mt-2" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                                    {cert.issue_date}
                                                    {cert.expiry_date && ` • ${t.cvSections.expires} ${cert.expiry_date}`}
                                                </p>
                                                {cert.description && (
                                                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
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
                </aside>
            </main>
        </div>
    );
};

export default ModernCleanTemplate;
