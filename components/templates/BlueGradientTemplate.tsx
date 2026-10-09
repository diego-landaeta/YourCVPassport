import React, { useState } from 'react';
import { FullProfileData } from '../../types';
import { UserIcon, BriefcaseIcon, AcademicCapIcon, EnvelopeIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '../../hooks/useTranslations';
import { useTemplateLabels } from './templateLabels';
import { safeExternalUrl, publicContactEmail, EXTERNAL_LINK_PROPS, TAB_PANEL_INACTIVE, TAB_PANEL_EXPORT_GAP, TAB_EXPORT_TITLE, TAB_CONTROLS } from './templateHelpers';

interface BlueGradientTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const TABS = ['about', 'resume', 'projects', 'contact'] as const;
type Tab = typeof TABS[number];

const BlueGradientTemplate: React.FC<BlueGradientTemplateProps> = ({ data, color }) => {
    const { profile, skills = [], experiences = [], education = [], portfolioItems = [] } = data || {};
    const [activeTab, setActiveTab] = useState<Tab>('about');
    const accentColor = color || '#6366F1'; // Default to indigo-500
    const t = useTranslations();
    const { L } = useTemplateLabels();

    const tabLabels: Record<Tab, string> = {
        about: L.tabAbout,
        resume: L.tabResume,
        projects: L.tabProjects,
        contact: L.tabContact,
    };

    const linkedinUrl = safeExternalUrl(profile.linkedin_url);
    const githubUrl = safeExternalUrl(profile.github_url);
    const email = publicContactEmail(profile.meta_description);

    const renderContent = (tab: Tab) => {
        switch (tab) {
            case 'resume':
                return (
                    <div className="grid md:grid-cols-2 gap-8">
                        <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                                    <BriefcaseIcon className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.experience}</h2>
                            </div>
                            <div className="space-y-6">
                                {experiences.length > 0 ? experiences.map((exp) => (
                                    <div key={exp.id} className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full ring-4 ring-white dark:ring-dark-bg-secondary -translate-x-[9px] shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}></div>
                                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 hover:shadow-md transition-all">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{exp.position}</h3>
                                            <p className="font-semibold text-lg mb-1" style={{ color: accentColor }}>{exp.company_name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.present}
                                            </p>
                                            {exp.description && (
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{exp.description}</p>
                                            )}
                                        </div>
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400">{L.noExperience}</p>}
                            </div>
                        </section>
                        <section className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                                    <AcademicCapIcon className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.cvSections.education}</h2>
                            </div>
                            <div className="space-y-6">
                                {education.length > 0 ? education.map(edu => (
                                    <div key={edu.id} className="flex gap-5 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl hover:shadow-md transition-all">
                                        <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                                            <AcademicCapIcon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{edu.degree}</h3>
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">{edu.institution_name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.present}
                                            </p>
                                        </div>
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400">{L.noEducation}</p>}
                            </div>
                        </section>
                    </div>
                );
            case 'projects':
                return (
                    <div>
                        <div className="flex items-center justify-center gap-3 mb-12">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                                <FolderIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{L.myProjects}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                        <div className="p-6">
                                            <div className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{item.title}</div>
                                            {item.category && (
                                                <div className="px-4 py-1.5 rounded-lg text-sm font-semibold mb-3 inline-block" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                                    {item.category}
                                                </div>
                                            )}
                                            {item.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                                            )}
                                            {href && (
                                                <span className="text-sm font-medium hover:underline" style={{ color: accentColor }}>{L.viewProject} →</span>
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
                            }) : <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">{L.noProjects}</p>}
                        </div>
                    </div>
                );
            case 'contact':
                return (
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-dark-bg-secondary p-10 rounded-2xl shadow-xl">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                                <EnvelopeIcon className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">{L.getInTouch}</h2>
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
                                {linkedinUrl && (
                                    <p className="flex items-center justify-center gap-2">
                                        <strong>LinkedIn:</strong>
                                        <a href={linkedinUrl} {...EXTERNAL_LINK_PROPS} className="hover:underline" style={{ color: accentColor }}>{L.profileLink}</a>
                                    </p>
                                )}
                                {githubUrl && (
                                    <p className="flex items-center justify-center gap-2">
                                        <strong>GitHub:</strong>
                                        <a href={githubUrl} {...EXTERNAL_LINK_PROPS} className="hover:underline" style={{ color: accentColor }}>{L.profileLink}</a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'about':
            default:
                return (
                     <>
                        <div className="max-w-4xl mx-auto mb-16 text-center bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                                <UserIcon className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-4xl mb-6 text-gray-900 dark:text-white font-bold">
                                {L.helloIm(profile.full_name?.split(' ')[0] || '')}
                            </h2>
                            <p className="text-xl leading-relaxed text-gray-700 dark:text-gray-300">{profile.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            {skills.map(skill => (
                                <div key={skill.id} className="bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl text-center shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 group">
                                    <div className="relative inline-block mb-4">
                                        <div className="absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}></div>
                                        <div className="relative text-6xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                                            {skill.percentage || 85}%
                                        </div>
                                    </div>
                                    <div className="text-gray-900 dark:text-white font-bold text-lg">{skill.name}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary font-sans">
            <div className="max-w-6xl mx-auto px-5 py-16">
                <div className="text-center rounded-3xl mb-16 p-16 text-white shadow-2xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accentColor}, #818CF8)` }}>
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative">
                        <div className="w-44 h-44 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-8 border-4 border-white/30 shadow-2xl ring-8 ring-white/10 overflow-hidden flex items-center justify-center">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <span className="text-white text-6xl font-bold">
                                    {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <h1 className="text-6xl font-extrabold mb-4 tracking-tight">{profile.full_name}</h1>
                        <span className="inline-block bg-white/20 backdrop-blur-sm px-10 py-4 rounded-2xl text-xl font-semibold shadow-lg">
                            {profile.headline}
                        </span>
                    </div>
                </div>

                {/* Pestañas: en pantalla, una a la vez; al imprimir/exportar se ocultan
                    y se muestran todas las secciones seguidas (ver templateHelpers). */}
                <div role="tablist" className={`flex flex-wrap justify-center gap-4 md:gap-6 mb-16 p-3 bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-xl ${TAB_CONTROLS}`}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls={`gradient-blue-panel-${tab}`}
                            onClick={() => setActiveTab(tab)}
                            className={`text-lg font-bold cursor-pointer transition-all px-6 py-4 rounded-xl ${
                                activeTab === tab
                                    ? 'shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                            style={activeTab === tab ? {
                                background: `linear-gradient(135deg, ${accentColor}, #818CF8)`,
                                color: 'white'
                            } : {}}
                        >
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>

                {TABS.map(tab => (
                    <div
                        key={tab}
                        id={`gradient-blue-panel-${tab}`}
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

export default BlueGradientTemplate;
