import React from 'react';
import { FullProfileData } from '../../types';
import { CountryBadge } from '../CountrySelector';

interface ModernProfessionalTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const ModernProfessionalTemplate: React.FC<ModernProfessionalTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#2563EB'; // Professional blue

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
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/30 pb-2">Contacto</h2>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <span>📧</span>
                                    <span className="break-all">{profile.meta_description || 'N/A'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span>📍</span>
                                    <span>Location</span>
                                </p>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/30 pb-2">Habilidades</h2>
                            <div className="space-y-2">
                                {skills.map(skill => (
                                    <div key={skill.id} className="bg-white/20 backdrop-blur-sm p-2 rounded text-sm font-medium">
                                        {skill.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Education */}
                        <div>
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/30 pb-2">Educación</h2>
                            <div className="space-y-4">
                                {education.map(edu => (
                                    <div key={edu.id} className="text-sm">
                                        <h3 className="font-bold">{edu.degree}</h3>
                                        <p className="opacity-90">{edu.institution_name}</p>
                                        <p className="text-xs opacity-75">{new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Presente'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right content */}
                <div className="w-2/3 p-12 bg-gray-50 dark:bg-dark-bg-tertiary">
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold uppercase tracking-wider mb-4" style={{ color: accentColor }}>Perfil Profesional</h2>
                        <div className="h-1 w-20 mb-6" style={{ backgroundColor: accentColor }}></div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold uppercase tracking-wider mb-4" style={{ color: accentColor }}>Experiencia</h2>
                        <div className="h-1 w-20 mb-6" style={{ backgroundColor: accentColor }}></div>
                        <div className="space-y-6">
                            {experiences.map(exp => (
                                <div key={exp.id} className="border-l-4 pl-6 pb-6" style={{ borderColor: accentColor }}>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{exp.position}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap ml-4">
                                            {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Presente'}
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
