import React, { useState } from 'react';
import { FullProfileData } from '../../types';
import { SparklesIcon, BriefcaseIcon, FolderIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';
import { useTemplateLabels } from './templateLabels';
import { safeExternalUrl, EXTERNAL_LINK_PROPS, TAB_PANEL_INACTIVE, TAB_PANEL_EXPORT_GAP, TAB_EXPORT_TITLE, TAB_CONTROLS } from './templateHelpers';

interface YellowMinimalistTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const TABS = ['resume', 'about', 'portfolio'] as const;
type Tab = typeof TABS[number];

const YellowMinimalistTemplate: React.FC<YellowMinimalistTemplateProps> = ({ data, color }) => {
    const {
        profile,
        experiences = [],
        education = [],
        services = [],
        portfolioItems = []
    } = data || {};
    const [activeTab, setActiveTab] = useState<Tab>('about');
    const accentColor = color || '#F59E0B'; // Default to yellow-500
    const { L, lang } = useTemplateLabels();

    const tabLabels: Record<Tab, string> = {
        resume: L.tabResume,
        about: L.aboutMe,
        portfolio: L.tabPortfolio,
    };

    // Format date to show month and year (e.g., "Jan 2022" or "Ene 2022")
    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const renderContent = (tab: Tab) => {
        switch (tab) {
            case 'resume':
                return (
                     <div className="grid md:grid-cols-2 gap-12">
                        <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                    <BriefcaseIcon className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{L.workExperience}</h2>
                            </div>
                            <div className="space-y-6">
                                {experiences.length > 0 ? experiences.map(exp => (
                                    <div key={exp.id} className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl hover:shadow-md transition-all border-l-4" style={{ borderColor: accentColor }}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                                        <p className="font-semibold mt-1" style={{ color: accentColor }}>{exp.company_name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : L.present}</p>
                                        {exp.description && (
                                            <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{exp.description}</p>
                                        )}
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400">{L.noExperience}</p>}
                            </div>
                        </section>
                        <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{L.education}</h2>
                             <div className="space-y-6">
                                {education.length > 0 ? education.map(edu => (
                                    <div key={edu.id} className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-dark-bg-tertiary rounded-xl hover:shadow-md transition-all">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.institution_name}</h3>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300 mt-1">{edu.degree}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : L.present}
                                        </p>
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400">{L.noEducation}</p>}
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
                            <span className="text-gray-700 dark:text-gray-300 text-lg uppercase tracking-widest font-bold">{L.portfolio}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {portfolioItems.length > 0 ? portfolioItems.map((item, i) => {
                                const href = safeExternalUrl(item.link || item.url);
                                const body = (
                                    <>
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
                                        {item.category && (
                                            <div className="px-4 py-1.5 rounded-lg text-sm font-medium inline-block" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{item.category}</div>
                                        )}
                                    </>
                                );
                                return href ? (
                                    <a href={href} {...EXTERNAL_LINK_PROPS} key={item.id} className="group cursor-pointer">
                                        {body}
                                    </a>
                                ) : (
                                    <div key={item.id} className="group">
                                        {body}
                                    </div>
                                );
                            }) : (
                                <p className="col-span-full text-center text-gray-500 dark:text-gray-400">{L.noPortfolio}</p>
                            )}
                        </div>
                    </>
                );
            case 'about':
            default:
                return (
                    <>
                        {/* El resumen se pinta como texto: antes iba con dangerouslySetInnerHTML
                            (HTML del usuario sin sanear) y con un texto de relleno inventado. */}
                        {profile.summary && (
                            <div className="mb-20 bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}></div>
                                    <span className="text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest font-bold">{L.aLittleAboutMe}</span>
                                </div>
                                <p className="text-2xl leading-relaxed text-gray-700 dark:text-gray-300 font-light whitespace-pre-wrap">{profile.summary}</p>
                            </div>
                        )}
                        {services.length > 0 && (
                            <>
                                <div className="flex justify-center items-center gap-3 mb-12">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                        <SparklesIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300 text-lg uppercase tracking-widest font-bold">{L.services}</span>
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
                        )}
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
                            <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang={lang} />
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

                    {/* Pestañas: en pantalla, una a la vez; al imprimir/exportar se ocultan
                        y se muestran todas las secciones seguidas (ver templateHelpers). */}
                    <div role="tablist" className={`flex justify-center gap-8 flex-wrap mt-12 ${TAB_CONTROLS}`}>
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab}
                                aria-controls={`yellow-minimalist-panel-${tab}`}
                                onClick={() => setActiveTab(tab)}
                                className={`text-2xl font-bold lowercase cursor-pointer px-8 py-4 rounded-2xl transition-all ${
                                    activeTab === tab
                                        ? 'bg-white dark:bg-dark-bg-secondary shadow-xl text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                                style={activeTab === tab ? { boxShadow: `0 10px 40px ${accentColor}40` } : {}}
                            >
                                {tabLabels[tab]}
                            </button>
                        ))}
                    </div>
                </div>
                {TABS.map(tab => (
                    <div
                        key={tab}
                        id={`yellow-minimalist-panel-${tab}`}
                        role="tabpanel"
                        data-cv-tab={tab}
                        className={`${activeTab === tab ? '' : TAB_PANEL_INACTIVE} ${TAB_PANEL_EXPORT_GAP}`}
                    >
                        <h2 className={`${TAB_EXPORT_TITLE} text-3xl font-bold mb-8 pb-3 border-b-4 text-gray-900 dark:text-white`} style={{ borderColor: accentColor }}>
                            {tabLabels[tab]}
                        </h2>
                        {renderContent(tab)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default YellowMinimalistTemplate;
