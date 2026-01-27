import React from 'react';
import { FullProfileData } from '../../types';
import { BriefcaseIcon, AcademicCapIcon, FolderIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';

interface CreativeModernTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const CreativeModernTemplate: React.FC<CreativeModernTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], education = [], portfolioItems = [] } = data || {};
    const accentColor = color || '#DB2777'; // Default to pink-600

    return (
        <div className="min-h-screen font-sans bg-gradient-to-br from-pink-50 via-fuchsia-50 to-purple-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary">
            <header className="relative overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${accentColor}, #F093FB)` }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 p-16">
                    <div className="relative group flex-shrink-0">
                        <div className="absolute inset-0 rounded-full blur-xl opacity-50 bg-white"></div>
                        <div className="relative w-56 h-56 rounded-full border-8 border-white shadow-2xl overflow-hidden">
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
                    <div className="text-white text-center md:text-left flex-1">
                        <h1 className="text-6xl font-black tracking-tight mb-4 drop-shadow-lg">
                            {profile.full_name}
                        </h1>
                        <p className="text-2xl font-light opacity-95 drop-shadow-md">
                            {profile.headline}
                        </p>
                        {profile.country_code && (
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                                <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                            </div>
                        )}
                        {/* Contact Buttons */}
                        <div className="mt-6 flex justify-center md:justify-start">
                            <ProfileContactButtons
                                profileId={profile.id}
                                profileEmail={profile.email}
                                variant="minimal"
                                accentColor={accentColor}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <aside className="lg:col-span-1 space-y-8">
                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2" style={{ borderColor: accentColor }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #F093FB)` }}>
                                <BriefcaseIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">About</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                            {profile.summary}
                        </p>
                    </section>
                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2" style={{ borderColor: accentColor }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #F093FB)` }}>
                                <AcademicCapIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">Education</h2>
                        </div>
                        <div className="space-y-5">
                            {education.map(edu => (
                                <div key={edu.id} className="p-5 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl hover:shadow-md transition-all">
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{edu.degree}</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{edu.institution_name}</p>
                                    <p className="text-xs mt-2 inline-block px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                        {new Date(edu.start_date).getFullYear()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>

                <div className="lg:col-span-2 space-y-10">
                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-10 pb-4 border-b-2" style={{ borderColor: accentColor }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #F093FB)` }}>
                                <BriefcaseIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-wider text-gray-900 dark:text-white">Experience</h2>
                        </div>
                        <div className="space-y-10">
                            {experiences.map((exp, index) => (
                                <div key={exp.id} className="relative pl-10 pb-10 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0 group">
                                    <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full ring-4 ring-white dark:ring-dark-bg-secondary -translate-x-[11px] shadow-lg transition-all group-hover:scale-125" style={{ background: `linear-gradient(135deg, ${accentColor}, #F093FB)` }}></div>
                                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-6 hover:shadow-md transition-all">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {exp.position}
                                        </h3>
                                        <div className="flex justify-between items-baseline flex-wrap gap-2 mb-4">
                                            <p className="font-bold text-base" style={{ color: accentColor }}>
                                                {exp.company_name}
                                            </p>
                                            <p className="text-sm px-4 py-1 rounded-lg font-semibold" style={{ backgroundColor: `${accentColor}30`, color: accentColor }}>
                                                {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'}
                                            </p>
                                        </div>
                                        {exp.description && (
                                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-10 pb-4 border-b-2" style={{ borderColor: accentColor }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #F093FB)` }}>
                                <FolderIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-wider text-gray-900 dark:text-white">Portfolio</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {portfolioItems.map((item, index) => (
                                <div key={item.id} className="aspect-square rounded-2xl relative overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                                    {item.image_url ? (
                                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.image_url}')` }}></div>
                                    ) : (
                                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accentColor}, #F093FB)` }}></div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 transition-all"></div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <h4 className="font-bold text-base mb-1 text-center">{item.title}</h4>
                                        <p className="text-xs opacity-90 text-center">{item.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default CreativeModernTemplate;
