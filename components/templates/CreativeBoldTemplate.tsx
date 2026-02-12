import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, LinkIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';

interface CreativeBoldTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const CreativeBoldTemplate: React.FC<CreativeBoldTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#3B82F6'; // Default to blue-500

    return (
        <div className="font-sans bg-white dark:bg-dark-bg-primary">
            {/* Hero Header with overlay effect */}
            <div className="relative h-96 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900"></div>
                <div className="relative h-full flex flex-col justify-end p-12 text-white">
                    <div className="flex items-end gap-8">
                        <div className="w-32 h-32 rounded-2xl shadow-2xl ring-4 ring-white/20 overflow-hidden flex items-center justify-center"
                             style={{ backgroundColor: profile.avatar_url ? 'transparent' : accentColor }}>
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <span className="text-white text-5xl font-bold">
                                    {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 pb-2">
                            <h1 className="text-6xl font-bold mb-3 text-white drop-shadow-lg">
                                {profile.full_name}
                            </h1>
                            <p className="text-2xl text-gray-200 mb-4">{profile.headline}</p>
                            {profile.country_code && (
                                <div className="flex items-center gap-2 mb-4">
                                    <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                                </div>
                            )}
                            <div className="flex gap-6 text-sm">
                                {profile.meta_description && (
                                    <a href={`mailto:${profile.meta_description}`} className="flex items-center gap-2 text-gray-300 hover:text-white">
                                        <EnvelopeIcon className="w-4 h-4" />
                                        <span>{profile.meta_description}</span>
                                    </a>
                                )}
                                {profile.linkedin_url && (
                                    <a href={profile.linkedin_url} className="flex items-center gap-2 text-gray-300 hover:text-white">
                                        <LinkIcon className="w-4 h-4" />
                                        <span>LinkedIn</span>
                                    </a>
                                )}
                            </div>
                            {/* Contact Buttons */}
                            <div className="mt-4">
                                <ProfileContactButtons
                                    profileId={profile.id}
                                    profileEmail={profile.email}
                                    variant="minimal"
                                    accentColor={accentColor}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-12">
                {/* About Section with bold styling */}
                <section className="mb-14">
                    <div className="mb-8">
                        <div className="inline-block px-6 py-2 rounded-lg mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                            <h2 className="text-2xl font-bold" style={{ color: accentColor }}>PERFIL PROFESIONAL</h2>
                        </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                        {profile.summary}
                    </p>
                </section>

                {/* Experience with bold headers */}
                <section className="mb-14">
                    <div className="mb-8">
                        <div className="inline-block px-6 py-2 rounded-lg mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                            <h2 className="text-2xl font-bold" style={{ color: accentColor }}>EXPERIENCIA</h2>
                        </div>
                    </div>
                    <div className="space-y-8">
                        {experiences.map(exp => (
                            <div key={exp.id} className="relative pl-8 border-l-4" style={{ borderColor: accentColor }}>
                                <div className="absolute left-0 top-0 w-4 h-4 rounded-full -translate-x-[10px]"
                                     style={{ backgroundColor: accentColor }}>
                                </div>
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                    <span className="text-sm font-semibold whitespace-nowrap ml-4" style={{ color: accentColor }}>
                                        {new Date(exp.start_date).getFullYear()} – {exp.end_date ? new Date(exp.end_date).getFullYear() : 'PRESENTE'}
                                    </span>
                                </div>
                                <p className="font-bold text-gray-600 dark:text-gray-400 mb-3 text-lg">{exp.company_name}</p>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Two-column layout for Education and Skills */}
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Education */}
                    <section>
                        <div className="mb-8">
                            <div className="inline-block px-6 py-2 rounded-lg mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                                <h2 className="text-2xl font-bold" style={{ color: accentColor }}>EDUCACIÓN</h2>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {education.map(edu => (
                                <div key={edu.id}>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{edu.degree}</h3>
                                    <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">{edu.institution_name}</p>
                                    <p className="text-sm font-semibold" style={{ color: accentColor }}>
                                        {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Presente'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Skills */}
                    <section>
                        <div className="mb-8">
                            <div className="inline-block px-6 py-2 rounded-lg mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                                <h2 className="text-2xl font-bold" style={{ color: accentColor }}>HABILIDADES</h2>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {skills.map(skill => (
                                <span
                                    key={skill.id}
                                    className="px-5 py-2 rounded-lg text-sm font-bold shadow-md"
                                    style={{
                                        backgroundColor: accentColor,
                                        color: 'white'
                                    }}
                                >
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CreativeBoldTemplate;
