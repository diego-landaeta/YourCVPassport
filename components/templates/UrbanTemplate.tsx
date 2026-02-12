// @ts-nocheck
import React, { useState } from 'react';
import { FullProfileData } from '../../types';
import { CountryBadge } from '../CountrySelector';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../contexts/AuthContext';
import { CTATracker } from './CTATracker';
import { ChatBubbleLeftRightIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

interface UrbanTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const UrbanTemplate: React.FC<UrbanTemplateProps> = ({ data }) => {
    const {
        profile,
        experiences = [],
        education = [],
        skills = [],
        languages = [],
        certifications = [],
        portfolio = [],
        recommendations = []
    } = data || {};

    const t = useTranslations();
    const { user } = useAuth();

    const handleContactClick = () => {
        setIsContactModalOpen(true);
    };

    // Helper function to render barcode-like pattern
    const BarcodePattern = () => (
        <div className="h-12 w-full flex items-end justify-between gap-[2px]">
            {[...Array(30)].map((_, i) => (
                <div
                    key={i}
                    className="bg-black w-full print:bg-black"
                    style={{ height: Math.random() > 0.3 ? '100%' : '50%'}}
                />
            ))}
        </div>
    );

    return (
        <>
            <div className="font-sans text-black bg-[#f0f0f0] dark:bg-gray-900 dark:text-white min-h-screen p-4 sm:p-8 flex justify-center print:bg-[#f0f0f0] print:text-black print:p-0">
                <div className="w-full max-w-4xl flex flex-col gap-6 sm:gap-8 print:max-w-full print:p-8">

                {/* "Sticker" Header */}
                <header className="bg-black text-white p-6 sm:p-8 transform -rotate-1 shadow-[10px_10px_0px_0px_#ff0000] border-4 border-black relative print:shadow-[10px_10px_0px_0px_#ff0000]">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black font-black text-xs px-2 py-1 border-l-4 border-b-4 border-black print:bg-yellow-400 print:text-black print:border-black">
                        HELLO_MY_NAME_IS
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white border-4 border-black flex-shrink-0 overflow-hidden flex items-center justify-center rounded-full print:bg-white print:border-black">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl sm:text-4xl font-black text-black">N/A</span>
                            )}
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-none mb-2 uppercase">
                                {profile.full_name.split(' ')[0]}
                                <span className="text-transparent bg-clip-text bg-white/20 block sm:inline sm:ml-4 print:text-transparent">
                                    {profile.full_name.split(' ').slice(1).join(' ')}
                                </span>
                            </h1>
                            <div className="bg-red-600 text-white inline-block px-3 sm:px-4 py-1 font-bold text-lg sm:text-xl uppercase tracking-widest transform skew-x-12 border-2 border-white print:bg-red-600 print:text-white print:border-white">
                                {profile.headline}
                            </div>
                            {profile.country_code && (
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 print:hidden">
                                    <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang={profile.language || 'es'} />
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Verification Badge */}
                {profile.verification_status === 'verified' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] print:hidden">
                        <CheckBadgeIcon className="w-5 h-5 text-black dark:text-white" />
                        <span className="text-sm font-black uppercase">{t.cvSections.verifiedProfile}</span>
                    </div>
                )}

                {/* Contact Button */}
                {!user && (
                    <div className="print:hidden">
                        <CTATracker
                            profileId={profile.id}
                            ctaType="contact_button"
                            ctaLabel={t.cvSections.sendMessage}
                            onClick={handleContactClick}
                            className="group inline-flex items-center justify-center gap-3 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-black border-4 border-black font-black text-base sm:text-lg uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5"
                        >
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            <span>{t.cvSections.sendMessage}</span>
                        </CTATracker>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 flex-1">

                    {/* Main Content */}
                    <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">

                        {/* Bio "Ticket" */}
                        {profile.summary && (
                            <section className="bg-white dark:bg-gray-800 border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] print:bg-white print:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                                <h3 className="font-black text-2xl sm:text-3xl uppercase mb-4 underline decoration-4 decoration-yellow-400 underline-offset-4 dark:text-white print:text-black print:decoration-yellow-400">Manifesto</h3>
                                <p className="text-base sm:text-lg font-bold leading-tight uppercase text-zinc-800 dark:text-gray-300 whitespace-pre-wrap print:text-zinc-800">
                                    {profile.summary}
                                </p>
                            </section>
                        )}

                        {/* Experience "List" */}
                        {experiences.length > 0 && (
                            <section>
                                <h3 className="bg-black text-white inline-block px-4 sm:px-6 py-2 font-black text-xl sm:text-2xl uppercase mb-4 sm:mb-6 transform rotate-2 dark:bg-white dark:text-black print:bg-black print:text-white">Track Record</h3>
                                <div className="space-y-4 sm:space-y-6">
                                    {experiences.map(exp => (
                                        <div key={exp.id} className="border-b-4 border-black dark:border-white pb-4 print:border-black">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 gap-2">
                                                <h4 className="text-2xl sm:text-3xl font-black uppercase leading-none dark:text-white print:text-black">{exp.company_name}</h4>
                                                <span className="bg-yellow-400 px-2 font-bold border-2 border-black text-xs sm:text-sm whitespace-nowrap dark:bg-yellow-500 dark:border-white print:bg-yellow-400 print:border-black print:text-black">
                                                    {new Date(exp.start_date).getFullYear()} - {exp.end_date ? new Date(exp.end_date).getFullYear() : t.cvSections.now.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 uppercase mb-2 print:text-red-600">{exp.position}</div>
                                            {exp.description && (
                                                <p className="font-medium text-sm text-zinc-600 dark:text-gray-400 uppercase leading-snug whitespace-pre-wrap print:text-zinc-600">
                                                    {exp.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Projects */}
                        {portfolio.length > 0 && (
                            <section>
                                <h3 className="bg-black text-white inline-block px-4 sm:px-6 py-2 font-black text-xl sm:text-2xl uppercase mb-4 sm:mb-6 transform -rotate-1 dark:bg-white dark:text-black print:bg-black print:text-white">Drops</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {portfolio.map(proj => (
                                        <div key={proj.id} className="bg-black dark:bg-white text-white dark:text-black p-4 relative group hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-colors cursor-default print:bg-black print:text-white">
                                            <div className="font-black text-lg sm:text-xl uppercase mb-1">{proj.title}</div>
                                            {proj.description && (
                                                <div className="text-xs font-mono">{proj.description}</div>
                                            )}
                                            {proj.url && (
                                                <a
                                                    href={proj.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs mt-2 inline-block hover:underline"
                                                >
                                                    {t.cvSections.viewProject || 'VIEW'} →
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <section>
                                <h3 className="bg-black text-white inline-block px-4 sm:px-6 py-2 font-black text-xl sm:text-2xl uppercase mb-4 sm:mb-6 transform rotate-1 dark:bg-white dark:text-black print:bg-black print:text-white">Credentials</h3>
                                <div className="space-y-3">
                                    {certifications.map(cert => (
                                        <div key={cert.id} className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-4 print:bg-white print:border-black">
                                            <div className="font-black text-base sm:text-lg dark:text-white print:text-black">{cert.name}</div>
                                            <div className="text-xs sm:text-sm text-zinc-600 dark:text-gray-400 uppercase font-bold print:text-zinc-600">{cert.issuer}</div>
                                            <div className="text-xs text-red-600 dark:text-red-400 mt-1 print:text-red-600">
                                                {new Date(cert.issue_date).getFullYear()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recommendations */}
                        {recommendations.length > 0 && (
                            <section>
                                <h3 className="bg-black text-white inline-block px-4 sm:px-6 py-2 font-black text-xl sm:text-2xl uppercase mb-4 sm:mb-6 transform -rotate-2 dark:bg-white dark:text-black print:bg-black print:text-white">Testimonials</h3>
                                <div className="space-y-4">
                                    {recommendations.map(rec => (
                                        <div key={rec.id} className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white p-4 sm:p-5 relative print:bg-white print:border-black">
                                            <div className="absolute top-2 right-2 text-4xl sm:text-6xl text-yellow-400 font-black leading-none dark:text-yellow-500 print:text-yellow-400">"</div>
                                            <p className="text-sm font-medium italic mb-3 relative z-10 dark:text-gray-300 print:text-black">{rec.recommendation_text}</p>
                                            <div className="flex items-center gap-2 relative z-10">
                                                {rec.recommender_avatar_url && (
                                                    <img
                                                        src={rec.recommender_avatar_url}
                                                        alt={rec.recommender_name}
                                                        className="w-8 h-8 rounded-full border-2 border-black dark:border-white print:border-black"
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-black text-xs sm:text-sm dark:text-white print:text-black">{rec.recommender_name}</div>
                                                    <div className="text-xs text-zinc-600 dark:text-gray-400 uppercase print:text-zinc-600">{rec.recommender_position}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">

                        {/* Contact "Barcode" */}
                        <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white p-5 sm:p-6 text-center print:bg-white print:border-black">
                            <BarcodePattern />
                            <div className="space-y-2 text-xs sm:text-sm font-bold uppercase mt-4">
                                {profile.email && (
                                    <div className="truncate bg-zinc-100 dark:bg-gray-700 dark:text-white p-1 print:bg-zinc-100 print:text-black">{profile.email}</div>
                                )}
                                {profile.phone && (
                                    <div className="bg-zinc-100 dark:bg-gray-700 dark:text-white p-1 print:bg-zinc-100 print:text-black">{profile.phone}</div>
                                )}
                                {profile.location && (
                                    <div className="bg-zinc-100 dark:bg-gray-700 dark:text-white p-1 print:bg-zinc-100 print:text-black">{profile.location}</div>
                                )}
                                {profile.portfolio_url && (
                                    <div className="bg-zinc-100 dark:bg-gray-700 dark:text-white p-1 truncate print:bg-zinc-100 print:text-black">{profile.portfolio_url}</div>
                                )}
                            </div>
                        </div>

                        {/* Skills "Tags" */}
                        {skills.length > 0 && (
                            <div className="bg-yellow-400 dark:bg-yellow-500 border-4 border-black dark:border-white p-5 sm:p-6 print:bg-yellow-400 print:border-black">
                                <h3 className="font-black text-lg sm:text-xl uppercase mb-4 border-b-4 border-black dark:border-white pb-2 dark:text-black print:text-black print:border-black">Arsenal</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map(s => (
                                        <span
                                            key={s.id}
                                            className="bg-white border-2 border-black px-2 py-1 font-bold text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-black dark:text-white dark:border-white dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] print:bg-white print:text-black print:border-black print:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {education.length > 0 && (
                            <div>
                                <h3 className="font-black text-lg sm:text-xl uppercase mb-4 bg-red-600 text-white inline-block px-2 dark:bg-red-500 print:bg-red-600 print:text-white">Education</h3>
                                <div className="space-y-4">
                                    {education.map(edu => (
                                        <div key={edu.id} className="bg-black dark:bg-white text-white dark:text-black p-4 print:bg-black print:text-white">
                                            <div className="font-black text-base sm:text-lg">{edu.institution_name}</div>
                                            <div className="text-zinc-400 dark:text-zinc-600 font-bold text-xs print:text-zinc-400">{edu.degree}</div>
                                            {edu.field_of_study && (
                                                <div className="text-xs mt-1 dark:text-zinc-700 print:text-white">{edu.field_of_study}</div>
                                            )}
                                            <div className="text-right text-xs mt-2 text-yellow-400 dark:text-yellow-600 print:text-yellow-400">
                                                {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : t.cvSections.now}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Languages */}
                        {languages.length > 0 && (
                            <div>
                                <h3 className="font-black text-lg sm:text-xl uppercase mb-4 bg-black dark:bg-white text-white dark:text-black inline-block px-2 print:bg-black print:text-white">Languages</h3>
                                <div className="space-y-2">
                                    {languages.map(lang => (
                                        <div
                                            key={lang.id}
                                            className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-3 flex justify-between items-center print:bg-white print:border-black"
                                        >
                                            <span className="font-black text-sm dark:text-white print:text-black">{lang.name}</span>
                                            <span className="text-xs bg-black dark:bg-white text-white dark:text-black px-2 py-1 font-bold print:bg-black print:text-white">{lang.level}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                </div>
                </div>
            </div>
        </>
    );
};

export default UrbanTemplate;
