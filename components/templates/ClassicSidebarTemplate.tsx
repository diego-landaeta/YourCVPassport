import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, PhoneIcon, LinkIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';

interface ClassicSidebarTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ClassicSidebarTemplate: React.FC<ClassicSidebarTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#1E293B'; // Default to slate-800
    const { lang } = useLanguage();
    const t = useTranslations();

    const formatDate = (dateString: string) => {
        const formatted = new Date(dateString).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[380px_1fr] bg-gray-50 dark:bg-dark-bg-primary">
            <aside className="bg-gradient-to-b from-slate-800 to-slate-900 text-white p-10 shadow-2xl">
                <div className="relative group mb-8">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-50 bg-blue-500"></div>
                    <div className="relative w-56 h-56 rounded-full mx-auto border-8 border-slate-700 shadow-2xl overflow-hidden">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-7xl font-bold">
                                {profile.full_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-center mb-3">{profile.full_name}</h1>
                <p className="text-center text-blue-300 font-semibold text-lg mb-4" style={{ color: accentColor === '#1E293B' ? '#93C5FD' : accentColor }}>
                    {profile.headline}
                </p>
                {profile.country_code && (
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                    </div>
                )}

                <div className="space-y-10">
                    <section className="bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-5">
                            <EnvelopeIcon className="w-6 h-6 text-blue-300" />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-blue-300">Contact</h2>
                        </div>
                        <div className="space-y-4 text-sm">
                            {profile.meta_description && (
                                <div className="flex items-start gap-3">
                                    <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Email</p>
                                        <p className="break-all">{profile.meta_description}</p>
                                    </div>
                                </div>
                            )}
                            {profile.phone && (
                                <div className="flex items-start gap-3">
                                    <PhoneIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Phone</p>
                                        <p>{profile.phone}</p>
                                    </div>
                                </div>
                            )}
                            {profile.linkedin_url && (
                                <div className="flex items-start gap-3">
                                    <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">LinkedIn</p>
                                        <a href={profile.linkedin_url} className="hover:text-blue-300 transition-colors break-all">
                                            View Profile
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                    <section className="bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-5">
                            <BriefcaseIcon className="w-6 h-6 text-blue-300" />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-blue-300">Skills</h2>
                        </div>
                        <div className="space-y-5">
                            {skills.map(skill => (
                                <div key={skill.id}>
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span>{skill.name}</span>
                                        <span className="text-blue-300">{skill.percentage || 80}%</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-600 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-full shadow-lg transition-all"
                                            style={{
                                                width: `${skill.percentage || 80}%`,
                                                background: 'linear-gradient(90deg, #3B82F6, #60A5FA)'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </aside>

            <main className="p-12 lg:p-16 bg-white dark:bg-dark-bg-secondary">
                <section className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <BriefcaseIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-20 after:h-1 after:bg-blue-500 after:rounded-full">
                            About Me
                        </h2>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                        {profile.summary}
                    </p>
                </section>

                <section className="mb-16">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <BriefcaseIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-20 after:h-1 after:bg-purple-500 after:rounded-full">
                            Experience
                        </h2>
                    </div>
                    <div className="space-y-10">
                        {experiences.map((exp, index) => (
                            <div key={exp.id} className="relative pl-10 pb-10 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
                                <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 ring-4 ring-white dark:ring-dark-bg-secondary -translate-x-[11px] shadow-lg"></div>
                                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-dark-bg-tertiary rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-2">
                                        {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : t.cvSections.present}
                                    </p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {exp.position}
                                    </h3>
                                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-4">
                                        {exp.company_name}
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

                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <AcademicCapIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-20 after:h-1 after:bg-green-500 after:rounded-full">
                            Education
                        </h2>
                    </div>
                     <div className="space-y-6">
                        {education.map(edu => (
                            <div key={edu.id} className="flex gap-6 p-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <AcademicCapIcon className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                        {edu.degree}
                                    </h3>
                                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {edu.institution_name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Ongoing'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ClassicSidebarTemplate;
