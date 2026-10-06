import React, { useState } from 'react';
import { FullProfileData } from '../../types';
import { UserIcon, BriefcaseIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';
import { useTemplateLabels } from './templateLabels';
import { safeExternalUrl, publicContactEmail, EXTERNAL_LINK_PROPS, TAB_PANEL_INACTIVE, TAB_PANEL_EXPORT_GAP, TAB_EXPORT_TITLE, TAB_CONTROLS } from './templateHelpers';

interface CoralPinkTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const TABS = ['about', 'experience', 'work', 'contact'] as const;
type Tab = typeof TABS[number];

const CoralPinkTemplate: React.FC<CoralPinkTemplateProps> = ({ data, color }) => {
    const { profile, experiences = [], portfolioItems = [] } = data || {};
    const [activeTab, setActiveTab] = useState<Tab>('experience');
    const accentColor = color || '#F97316'; // Default to orange-500
    const t = useTranslations();
    const { L, lang } = useTemplateLabels();
    const email = publicContactEmail(profile.meta_description);

    const tabLabels: Record<Tab, string> = {
        about: L.tabAbout,
        experience: L.tabExperience,
        work: L.tabWork,
        contact: L.tabContact,
    };

    const renderContent = (tab: Tab) => {
        switch (tab) {
            case 'about':
                return (
                    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}>
                                <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{L.aboutMe}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{profile.summary}</p>
                    </div>
                );
            case 'work':
                return (
                    <div className="grid md:grid-cols-2 gap-8">
                        {portfolioItems.length > 0 ? portfolioItems.map(item => {
                            const href = safeExternalUrl(item.link || item.url);
                            const cardClass = 'block bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-xl overflow-hidden group';
                            const body = (
                                <>
                                    {item.image_url && (
                                        <div className="aspect-video w-full overflow-hidden">
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                        </div>
                                    )}
                                    <div className="p-8">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                        {item.category && (
                                            <p className="px-4 py-2 rounded-lg text-sm font-bold mb-4 inline-block" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                                {item.category}
                                            </p>
                                        )}
                                        {item.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{item.description}</p>
                                        )}
                                    </div>
                                </>
                            );
                            return href ? (
                                <a href={href} {...EXTERNAL_LINK_PROPS} key={item.id} className={`${cardClass} hover:shadow-2xl transition-all hover:-translate-y-1`}>
                                    {body}
                                </a>
                            ) : (
                                <div key={item.id} className={cardClass}>
                                    {body}
                                </div>
                            );
                        }) : <p className="col-span-full text-center text-gray-500 dark:text-gray-400">{L.noPortfolio}</p>}
                    </div>
                );
            case 'contact':
                return (
                    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}>
                            <EnvelopeIcon className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{L.contactMe}</h2>
                        <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                            {email && (
                                <p className="flex items-center justify-center gap-2">
                                    <strong>{t.cvSections.email}:</strong>
                                    <a href={`mailto:${email}`} className="hover:underline" style={{ color: accentColor }}>
                                        {email}
                                    </a>
                                </p>
                            )}
                            {profile.phone && (
                                <p className="flex items-center justify-center gap-2">
                                    <strong>{t.cvSections.phone}:</strong> {profile.phone}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'experience':
            default:
                return (
                    <div className="grid gap-8">
                        {experiences.length > 0 ? experiences.map((exp) => (
                            <div key={exp.id} className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all border-l-4 hover:-translate-y-0.5" style={{ borderColor: accentColor }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FB923C)` }}>
                                        <BriefcaseIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                        {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : L.present}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{exp.position}</div>
                                <div className="text-lg font-semibold mb-5" style={{ color: accentColor }}>{exp.company_name}</div>
                                {exp.description && (
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                )}
                            </div>
                        )) : <p className="text-center text-gray-500 dark:text-gray-400">{L.noExperience}</p>}
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
                                <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang={lang} />
                            </div>
                        )}
                        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mt-6">{profile.summary}</p>
                    </div>
                </div>

                {/* Pestañas: en pantalla, una a la vez; al imprimir/exportar se ocultan
                    y se muestran todas las secciones seguidas (ver templateHelpers). */}
                <div role="tablist" className={`flex flex-wrap justify-center gap-8 mb-16 pb-6 border-b-4 border-gray-200 dark:border-gray-700 ${TAB_CONTROLS}`}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls={`coral-pink-panel-${tab}`}
                            onClick={() => setActiveTab(tab)}
                            className={`text-2xl font-bold cursor-pointer pb-5 relative transition-all ${
                                activeTab === tab ? '' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                            }`}
                            style={{ color: activeTab === tab ? accentColor : undefined }}
                        >
                            {tabLabels[tab]}
                            {activeTab === tab && (
                                <span className="absolute block bottom-[-26px] left-0 right-0 h-1 rounded-full shadow-lg" style={{ backgroundColor: accentColor }}></span>
                            )}
                        </button>
                    ))}
                </div>

                {TABS.map(tab => (
                    <div
                        key={tab}
                        id={`coral-pink-panel-${tab}`}
                        role="tabpanel"
                        data-cv-tab={tab}
                        className={`${activeTab === tab ? '' : TAB_PANEL_INACTIVE} ${TAB_PANEL_EXPORT_GAP}`}
                    >
                        <h2 className={`${TAB_EXPORT_TITLE} text-3xl font-extrabold mb-8 pb-3 border-b-4 text-gray-900 dark:text-white`} style={{ borderColor: accentColor }}>
                            {tabLabels[tab]}
                        </h2>
                        {renderContent(tab)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CoralPinkTemplate;
