import React from 'react';
import { FullProfileData } from '../../types';
import { CountryBadge } from '../shared/CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';

interface AcademicStandardTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const AcademicStandardTemplate: React.FC<AcademicStandardTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#059669'; // Academic green

    return (
        <div className="font-serif bg-white dark:bg-dark-bg-secondary">
            <div className="max-w-4xl mx-auto p-12 bg-white dark:bg-dark-bg-secondary">
                {/* Academic Header - Traditional and formal */}
                <header className="text-center mb-10 pb-6 border-b-2 border-gray-300 dark:border-gray-600">
                    <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden ring-2 ring-gray-300 dark:ring-gray-600 shadow-md">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-4xl font-bold">
                                {profile.full_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white uppercase tracking-wide">
                        {profile.full_name}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">{profile.headline}</p>
                    {profile.country_code && (
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                        </div>
                    )}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span>{profile.meta_description || 'N/A'}</span>
                        <span className="mx-2">|</span>
                        <span>Location</span>
                    </div>
                    {/* Contact Buttons */}
                    <div className="mt-4 flex justify-center">
                        <ProfileContactButtons
                            profileId={profile.id}
                            profileEmail={profile.email}
                            variant="minimal"
                            accentColor={accentColor}
                        />
                    </div>
                </header>

                {/* Research Interests / Summary */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 uppercase tracking-wide pb-2 border-b-2"
                        style={{ borderColor: accentColor, color: accentColor }}>
                        Perfil Académico
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-justify whitespace-pre-wrap">{profile.summary}</p>
                </section>

                {/* Education - Most important section for academic CV */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 uppercase tracking-wide pb-2 border-b-2"
                        style={{ borderColor: accentColor, color: accentColor }}>
                        Formación Académica
                    </h2>
                    <div className="space-y-4">
                        {education.map(edu => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                        {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Presente'}
                                    </p>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 italic">{edu.institution_name}</p>
                                {edu.description && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{edu.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Professional Experience */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 uppercase tracking-wide pb-2 border-b-2"
                        style={{ borderColor: accentColor, color: accentColor }}>
                        Experiencia Profesional
                    </h2>
                    <div className="space-y-4">
                        {experiences.map(exp => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap ml-4">
                                        {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Presente'}
                                    </p>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 italic">{exp.company_name}</p>
                                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm text-justify whitespace-pre-wrap">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Skills / Competencies */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 uppercase tracking-wide pb-2 border-b-2"
                        style={{ borderColor: accentColor, color: accentColor }}>
                        Competencias y Habilidades
                    </h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {skills.map(skill => (
                            <div key={skill.id} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-1.5">•</span>
                                <span className="text-gray-700 dark:text-gray-300">{skill.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Publications / Additional Sections would go here in a real academic CV */}
                <section>
                    <h2 className="text-xl font-bold mb-3 uppercase tracking-wide pb-2 border-b-2"
                        style={{ borderColor: accentColor, color: accentColor }}>
                        Información Adicional
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                        Referencias disponibles a petición.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default AcademicStandardTemplate;
