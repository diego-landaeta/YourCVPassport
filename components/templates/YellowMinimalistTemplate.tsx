import React, { useState } from 'react';
import { FullProfileData } from '../../types';
import { SparklesIcon, BriefcaseIcon, FolderIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';
import { useLanguage } from '../../contexts/LanguageContext';

interface YellowMinimalistTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const YellowMinimalistTemplate: React.FC<YellowMinimalistTemplateProps> = ({ data, color }) => {
    const {
        profile,
        experiences = [],
        education = [],
        services = [],
        portfolioItems = []
    } = data || {};
    const [activeTab, setActiveTab] = useState('about');
    const accentColor = color || '#F59E0B'; // Default to yellow-500
    const { lang } = useLanguage();

    // Format date to show month and year (e.g., "Jan 2022" or "Ene 2022")
    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'resume':
                return (
                     <div className="grid md:grid-cols-2 gap-12">
                        <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                    <BriefcaseIcon className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Work Experience</h2>
                            </div>
                            <div className="space-y-6">
                                {experiences.map(exp => (
                                    <div key={exp.id} className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl hover:shadow-md transition-all border-l-4" style={{ borderColor: accentColor }}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                        <p className="font-semibold mt-1" style={{ color: accentColor }}>{exp.company_name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'}</p>
                                        {exp.description && (
                                            <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{exp.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Education</h2>
                             <div className="space-y-6">
                                {education.map(edu => (
                                    <div key={edu.id} className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl hover:shadow-md transition-all">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.institution_name}</h3>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300 mt-1">{edu.degree}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                );
            case 'portfolio':
                return (
                    <>
                        <div className="flex justify-center items-center gap-4 mb-12">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                <FolderIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-lg uppercase tracking-widest font-bold">Portfolio</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {portfolioItems.length > 0 ? portfolioItems.map((item, i) => (
                                <a href={item.link || '#'} target="_blank" rel="noopener noreferrer" key={item.id} className="group cursor-pointer">
                                    <div className="aspect-square bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-gray-800 dark:to-dark-bg-tertiary rounded-2xl mb-4 group-hover:shadow-2xl group-hover:-translate-y-1 transition-all overflow-hidden relative shadow-lg">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentColor}${Math.floor(50 + (i % 3) * 15).toString(16)}, #FBBF24${Math.floor(50 + (i % 3) * 15).toString(16)})` }}>
                                                <FolderIcon className="w-16 h-16 text-white opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{item.title}</div>
                                    <div className="px-4 py-1.5 rounded-lg text-sm font-medium inline-block" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{item.category}</div>
                                </a>
                            )) : (
                                <p className="col-span-full text-center text-gray-500 dark:text-gray-400">No portfolio items to display.</p>
                            )}
                        </div>
                    </>
                );
            case 'about':
            default:
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
                            <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}></div>
                                    <span className="text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest font-bold">A little about me</span>
                                </div>
                                <div className="text-2xl leading-relaxed text-gray-700 dark:text-gray-300 font-light">
                                    <p dangerouslySetInnerHTML={{ __html: profile.summary || 'Hello. I am a <strong>designer</strong>.' }}></p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}></div>
                                    <span className="text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest font-bold">Latest Updates</span>
                                </div>
                                <div className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">Working on new branding projects...</div>
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-3 mb-12">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-lg uppercase tracking-widest font-bold">Services</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {services.map((service, i) => (
                                <div key={service.id} className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                                    <div className="w-20 h-20 rounded-full mx-auto mb-5 shadow-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentColor}${Math.floor(255 - i * 40).toString(16)}, #FBBF24${Math.floor(255 - i * 40).toString(16)})` }}>
                                        <SparklesIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-white text-center">{service.title}</div>
                                    <div className="text-gray-600 dark:text-gray-400 text-sm text-center leading-relaxed">{service.description}</div>
                                </div>
                            ))}
                        </div>
                    </>
                );
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary font-sans">
            <div className="max-w-5xl mx-auto px-5 py-16">
                <div className="text-center mb-20">
                    <div className="relative group mb-8">
                        <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}></div>
                        <div className="relative w-48 h-48 rounded-full mx-auto shadow-2xl ring-4 ring-white dark:ring-dark-bg-primary overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-7xl font-bold" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-5xl font-light mb-4 text-gray-900 dark:text-white tracking-tight">{profile.full_name}</h1>
                    <span className="inline-block px-8 py-3 rounded-xl text-base font-bold mb-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)`, color: 'white' }}>
                        {profile.headline}
                    </span>
                    {profile.country_code && (
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                        </div>
                    )}
                    {/* Contact Buttons */}
                    <div className="mb-12 flex justify-center">
                        <ProfileContactButtons
                            profileId={profile.id}
                            profileEmail={profile.email}
                            variant="minimal"
                            accentColor={accentColor}
                        />
                    </div>

                    <div className="flex justify-center gap-8 flex-wrap mt-12">
                        <div
                            onClick={() => setActiveTab('resume')}
                            className={`text-2xl font-bold cursor-pointer px-8 py-4 rounded-2xl transition-all ${
                                activeTab === 'resume'
                                    ? 'bg-white dark:bg-dark-bg-secondary shadow-xl text-gray-900 dark:text-white'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                            }`}
                            style={activeTab === 'resume' ? { boxShadow: `0 10px 40px ${accentColor}40` } : {}}
                        >
                            resume
                        </div>
                        <div
                            onClick={() => setActiveTab('about')}
                            className={`text-2xl font-bold cursor-pointer px-8 py-4 rounded-2xl transition-all ${
                                activeTab === 'about'
                                    ? 'bg-white dark:bg-dark-bg-secondary shadow-xl text-gray-900 dark:text-white'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                            }`}
                            style={activeTab === 'about' ? { boxShadow: `0 10px 40px ${accentColor}40` } : {}}
                        >
                            about me
                        </div>
                        <div
                            onClick={() => setActiveTab('portfolio')}
                            className={`text-2xl font-bold cursor-pointer px-8 py-4 rounded-2xl transition-all ${
                                activeTab === 'portfolio'
                                    ? 'bg-white dark:bg-dark-bg-secondary shadow-xl text-gray-900 dark:text-white'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                            }`}
                            style={activeTab === 'portfolio' ? { boxShadow: `0 10px 40px ${accentColor}40` } : {}}
                        >
                            portfolio
                        </div>
                    </div>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default YellowMinimalistTemplate;