import React from 'react';
import { FullProfileData } from '../../types';
import { CountryBadge } from '../CountrySelector';

interface CreativeMinimalistTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const CreativeMinimalistTemplate: React.FC<CreativeMinimalistTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#EC4899'; // Creative pink/magenta

    return (
        <div className="font-sans bg-white dark:bg-dark-bg-secondary">
            <div className="max-w-4xl mx-auto p-16">
                {/* Minimalist Header with creative typography */}
                <header className="mb-16">
                    <div className="flex items-center gap-8 mb-8">
                        {profile.avatar_url && (
                            <div className="w-24 h-24 rounded-full bg-cover bg-center border-4"
                                 style={{
                                     backgroundImage: `url('${profile.avatar_url}')`,
                                     borderColor: accentColor
                                 }}>
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-6xl font-light mb-2 tracking-tight text-gray-900 dark:text-white">
                                {profile.full_name}
                            </h1>
                            <div className="h-1 w-32 mb-3" style={{ backgroundColor: accentColor }}></div>
                            <p className="text-xl text-gray-600 dark:text-gray-400 font-light">{profile.headline}</p>
                            {profile.country_code && (
                                <div className="flex items-center gap-2 mt-3">
                                    <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400 font-light">
                        <span>{profile.meta_description || 'N/A'}</span>
                        <span>•</span>
                        <span>Location</span>
                    </div>
                </header>

                {/* About */}
                <section className="mb-12">
                    <h2 className="text-sm uppercase tracking-widest font-bold mb-4 text-gray-400">Sobre Mí</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-light text-lg whitespace-pre-wrap">{profile.summary}</p>
                </section>

                {/* Experience - Clean and minimal */}
                <section className="mb-12">
                    <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-gray-400">Experiencia</h2>
                    <div className="space-y-8">
                        {experiences.map(exp => (
                            <div key={exp.id} className="relative pl-8 border-l" style={{ borderColor: accentColor }}>
                                <div className="absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px]"
                                     style={{ backgroundColor: accentColor }}>
                                </div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-2xl font-light text-gray-900 dark:text-white">{exp.position}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light whitespace-nowrap ml-4">
                                        {new Date(exp.start_date).getFullYear()} – {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Ahora'}
                                    </p>
                                </div>
                                <p className="font-medium mb-2" style={{ color: accentColor }}>{exp.company_name}</p>
                                <p className="text-gray-600 dark:text-gray-400 font-light leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Two-column layout for Education and Skills */}
                <div className="grid grid-cols-2 gap-12">
                    {/* Education */}
                    <section>
                        <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-gray-400">Educación</h2>
                        <div className="space-y-6">
                            {education.map(edu => (
                                <div key={edu.id}>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{edu.degree}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 font-light">{edu.institution_name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                                        {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Ahora'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Skills */}
                    <section>
                        <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-gray-400">Habilidades</h2>
                        <div className="space-y-3">
                            {skills.map(skill => (
                                <div key={skill.id} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></div>
                                    <span className="text-gray-700 dark:text-gray-300 font-light">{skill.name}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CreativeMinimalistTemplate;
