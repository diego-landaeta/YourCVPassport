import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, LinkIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';

interface ElegantMinimalTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ElegantMinimalTemplate: React.FC<ElegantMinimalTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#8B5CF6'; // Default to violet-500

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
            </header>

            <main>
                <section className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                            <BriefcaseIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">Summary</h2>
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
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">Experience</h2>
                    </div>
                    <div className="space-y-12">
                        {experiences.map((exp, index) => (
                            <div key={exp.id} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-16 gap-y-4 group">
                                <div className="md:text-right">
                                    <div className="inline-block px-5 py-2 rounded-xl shadow-md mb-3" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}>
                                        <p className="font-bold text-sm" style={{ color: accentColor }}>
                                            {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'}
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
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">Education</h2>
                    </div>
                    <div className="space-y-8">
                        {education.map((edu, index) => (
                             <div key={edu.id} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-16 gap-y-4">
                                <div className="md:text-right">
                                    <div className="inline-block px-5 py-2 rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}>
                                        <p className="font-bold text-sm" style={{ color: accentColor }}>
                                            {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}
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

                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #D946EF)` }}>
                            <BriefcaseIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-300">Skills</h2>
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
