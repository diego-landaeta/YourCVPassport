import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, PhoneIcon, AcademicCapIcon, BriefcaseIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';

interface HealthcareProfessionalTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const HealthcareProfessionalTemplate: React.FC<HealthcareProfessionalTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], skills = [] } = data || {};
    const accentColor = color || '#0EA5E9'; // Default to sky-500 (medical blue)

    return (
        <div className="font-sans bg-white dark:bg-dark-bg-primary">
            {/* Professional header with medical theme */}
            <header className="bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 dark:from-dark-bg-secondary dark:to-dark-bg-tertiary py-12 px-12 border-b-4" style={{ borderColor: accentColor }}>
                <div className="max-w-5xl mx-auto flex items-center gap-10">
                    <div className="w-36 h-36 rounded-full shadow-xl ring-4 ring-white dark:ring-dark-bg-primary overflow-hidden flex items-center justify-center"
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
                    <div className="flex-1">
                        <h1 className="text-5xl font-bold mb-3 text-gray-900 dark:text-white">
                            {profile.full_name}
                        </h1>
                        <p className="text-2xl mb-4 font-medium" style={{ color: accentColor }}>{profile.headline}</p>
                        {profile.country_code && (
                            <div className="flex items-center gap-2 mb-4">
                                <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                            </div>
                        )}
                        <div className="flex flex-wrap gap-6 text-sm text-gray-700 dark:text-gray-300">
                            {profile.meta_description && (
                                <div className="flex items-center gap-2">
                                    <EnvelopeIcon className="w-5 h-5" style={{ color: accentColor }} />
                                    <span className="font-medium">{profile.meta_description}</span>
                                </div>
                            )}
                            {profile.linkedin_url && (
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-5 h-5" style={{ color: accentColor }} />
                                    <span className="font-medium">LinkedIn</span>
                                </div>
                            )}
                        </div>
                        {/* Contact Buttons */}
                        <div className="mt-4">
                            <ProfileContactButtons
                                profileId={profile.id}
                                profileEmail={profile.email}
                                variant="compact"
                                accentColor={accentColor}
                                showDownload={false}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto p-12">
                {/* Professional Profile */}
                <section className="mb-12 pb-10 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <BeakerIcon className="w-6 h-6" style={{ color: accentColor }} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PERFIL PROFESIONAL</h2>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-wrap">
                        {profile.summary}
                    </p>
                </section>

                {/* Experience */}
                <section className="mb-12 pb-10 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <BriefcaseIcon className="w-6 h-6" style={{ color: accentColor }} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">EXPERIENCIA PROFESIONAL</h2>
                    </div>
                    <div className="space-y-8">
                        {experiences.map(exp => (
                            <div key={exp.id} className="relative pl-8 border-l-2 border-gray-200 dark:border-dark-border">
                                <div className="absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px]"
                                     style={{ backgroundColor: accentColor }}>
                                </div>
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                    <span className="text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-4"
                                          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                        {new Date(exp.start_date).getFullYear()} – {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Actual'}
                                    </span>
                                </div>
                                <p className="font-bold text-gray-600 dark:text-gray-400 mb-3">{exp.company_name}</p>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="mb-12 pb-10 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                            <AcademicCapIcon className="w-6 h-6" style={{ color: accentColor }} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">FORMACIÓN ACADÉMICA</h2>
                    </div>
                    <div className="space-y-6">
                        {education.map(edu => (
                            <div key={edu.id} className="relative pl-8 border-l-2 border-gray-200 dark:border-dark-border">
                                <div className="absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px]"
                                     style={{ backgroundColor: accentColor }}>
                                </div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                                    <span className="text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-4"
                                          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                        {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Actual'}
                                    </span>
                                </div>
                                <p className="font-bold text-gray-600 dark:text-gray-400">{edu.institution_name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Skills & Competencies */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">COMPETENCIAS PROFESIONALES</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {skills.map(skill => (
                            <div
                                key={skill.id}
                                className="px-4 py-3 text-center font-semibold rounded-lg shadow-sm"
                                style={{
                                    backgroundColor: `${accentColor}10`,
                                    borderLeft: `4px solid ${accentColor}`,
                                    color: accentColor
                                }}
                            >
                                {skill.name}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default HealthcareProfessionalTemplate;
