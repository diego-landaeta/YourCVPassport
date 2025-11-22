import React from 'react';
import { FullProfileData } from '../../types';
import { CountryBadge } from '../CountrySelector';

interface CorporateClassicTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const CorporateClassicTemplate: React.FC<CorporateClassicTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#1E40AF'; // Classic corporate blue

    return (
        <div className="font-serif bg-white dark:bg-dark-bg-secondary">
            <div className="max-w-4xl mx-auto p-12">
                {/* Classic Header */}
                <header className="text-center border-b-4 pb-8 mb-8" style={{ borderColor: accentColor }}>
                    <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden ring-4 ring-white dark:ring-dark-bg-secondary shadow-lg">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold" style={{ backgroundColor: accentColor }}>
                                {profile.full_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h1 className="text-5xl font-bold mb-3 text-gray-900 dark:text-white">{profile.full_name}</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{profile.headline}</p>
                    {profile.country_code && (
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                        </div>
                    )}
                    <div className="flex justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
                        <span>📧 {profile.meta_description || 'N/A'}</span>
                        <span>📍 Location</span>
                    </div>
                </header>

                {/* Professional Summary */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4 uppercase text-gray-900 dark:text-white" style={{ color: accentColor }}>
                        Resumen Profesional
                    </h2>
                    <div className="border-l-4 pl-6" style={{ borderColor: accentColor }}>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
                    </div>
                </section>

                {/* Experience */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4 uppercase text-gray-900 dark:text-white" style={{ color: accentColor }}>
                        Experiencia Profesional
                    </h2>
                    <div className="space-y-6">
                        {experiences.map(exp => (
                            <div key={exp.id} className="border-l-4 pl-6" style={{ borderColor: accentColor }}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{exp.company_name}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap ml-4">
                                        {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Presente'}
                                    </p>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap mt-2">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4 uppercase text-gray-900 dark:text-white" style={{ color: accentColor }}>
                        Educación
                    </h2>
                    <div className="space-y-4">
                        {education.map(edu => (
                            <div key={edu.id} className="border-l-4 pl-6" style={{ borderColor: accentColor }}>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                                <p className="text-gray-700 dark:text-gray-300">{edu.institution_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Presente'}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Skills */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 uppercase text-gray-900 dark:text-white" style={{ color: accentColor }}>
                        Competencias Clave
                    </h2>
                    <div className="border-l-4 pl-6" style={{ borderColor: accentColor }}>
                        <div className="grid grid-cols-2 gap-3">
                            {skills.map(skill => (
                                <div key={skill.id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{skill.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CorporateClassicTemplate;
