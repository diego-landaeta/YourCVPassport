import React, { useState } from 'react';
import { FullProfileData } from '../../types';
import { UserIcon, BriefcaseIcon, FolderIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';

interface CoralPinkTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const CoralPinkTemplate: React.FC<CoralPinkTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], portfolioItems = [] } = data || {};
    const [activeTab, setActiveTab] = useState('Experience');
    const accentColor = color || '#F97316'; // Default to orange-500

    const renderContent = () => {
        switch (activeTab) {
            case 'About':
                return (
                    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}>
                                <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">About Me</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{profile.summary}</p>
                    </div>
                );
            case 'Work':
                return (
                    <div className="grid md:grid-cols-2 gap-8">
                        {portfolioItems.length > 0 ? portfolioItems.map(item => (
                            <a href={item.link || '#'} target="_blank" rel="noopener noreferrer" key={item.id} className="block bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden group">
                                {item.image_url && (
                                    <div className="aspect-video w-full overflow-hidden">
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    </div>
                                )}
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                    <p className="px-4 py-2 rounded-lg text-sm font-bold mb-4 inline-block" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                        {item.category}
                                    </p>
                                    {item.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{item.description}</p>
                                    )}
                                </div>
                            </a>
                        )) : <p className="col-span-full text-center text-gray-500 dark:text-gray-400">No portfolio items to display.</p>}
                    </div>
                );
            case 'Contact':
                return (
                    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}>
                            <EnvelopeIcon className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Contact Me</h2>
                        <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                            {profile.meta_description && (
                                <p className="flex items-center justify-center gap-2">
                                    <strong>Email:</strong>
                                    <a href={`mailto:${profile.meta_description}`} className="hover:underline" style={{ color: accentColor }}>
                                        {profile.meta_description}
                                    </a>
                                </p>
                            )}
                            {profile.phone && (
                                <p className="flex items-center justify-center gap-2">
                                    <strong>Phone:</strong> {profile.phone}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'Experience':
            default:
                return (
                    <div className="grid gap-8">
                        {experiences.length > 0 ? experiences.map((exp, index) => (
                            <div key={exp.id} className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all border-l-4 hover:-translate-y-0.5" style={{ borderColor: accentColor }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}>
                                        <BriefcaseIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                        {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{exp.position}</div>
                                <div className="text-lg font-semibold mb-5" style={{ color: accentColor }}>{exp.company_name}</div>
                                {exp.description && (
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                )}
                            </div>
                        )) : <p className="text-center text-gray-500 dark:text-gray-400">No experience to display.</p>}
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary font-sans">
            <div className="max-w-5xl mx-auto px-5 py-16">
                <div className="flex flex-col md:flex-row items-center gap-12 mb-20 p-12 bg-white dark:bg-dark-bg-secondary rounded-3xl shadow-2xl">
                    <div className="relative group flex-shrink-0">
                        <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}></div>
                        <div className="relative w-56 h-56 rounded-full shadow-2xl ring-4 ring-white dark:ring-dark-bg-primary overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-8xl font-bold" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}>
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
                            {profile.full_name}
                        </h1>
                        <span className="inline-block px-8 py-3 rounded-xl text-base font-bold mb-6 shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)`, color: 'white' }}>
                            {profile.headline}
                        </span>
                        {profile.country_code && (
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                            </div>
                        )}
                        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mt-6">{profile.summary}</p>
                    </div>
                </div>

                <div className="flex justify-center gap-8 mb-16 pb-6 border-b-4 border-gray-200 dark:border-gray-700">
                    {['About', 'Experience', 'Work', 'Contact'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-2xl font-bold cursor-pointer pb-5 relative transition-all ${
                                activeTab === tab ? '' : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
                            }`}
                            style={{ color: activeTab === tab ? accentColor : undefined }}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-[-26px] left-0 right-0 h-1 rounded-full shadow-lg" style={{ backgroundColor: accentColor }}></div>
                            )}
                        </div>
                    ))}
                </div>

                {renderContent()}
            </div>
        </div>
    );
};

export default CoralPinkTemplate;
