import React from 'react';
import { FullProfileData } from '../../types';
import { FolderIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';
import { useTemplateLabels } from './templateLabels';
import { HOVER_ONLY_EXPORT_VISIBLE } from './templateHelpers';

interface CreativeOrangeTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const CreativeOrangeTemplate: React.FC<CreativeOrangeTemplateProps> = ({ data, color }) => {
    const { profile, portfolioItems = [] } = data || {};
    const accentColor = color || '#EA580C'; // Default to orange-600
    const { L, lang } = useTemplateLabels();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary font-sans">
            <div className="max-w-7xl mx-auto px-5 py-16">
                <div className="grid md:grid-cols-2 gap-20 items-center mb-32 min-h-[70vh]">
                    <div className="text-center md:text-left space-y-8">
                        <span className="inline-block px-10 py-4 rounded-2xl text-lg font-black uppercase tracking-wider shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)`, color: 'white' }}>
                            {profile.headline}
                        </span>
                        <h1 className="text-7xl lg:text-8xl font-black text-gray-900 dark:text-white leading-tight tracking-tighter">
                            {L.hiIm}<br/>
                            <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                {profile.full_name?.split(' ')[0]}
                            </span>
                        </h1>
                        {profile.country_code && (
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang={lang} />
                            </div>
                        )}
                        <p className="text-2xl leading-relaxed text-gray-700 dark:text-gray-300 font-light">
                            {profile.summary}
                        </p>
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

                    <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}></div>
                        <div className="relative w-full max-w-md h-[500px] mx-auto rounded-full shadow-2xl overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-9xl font-bold" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {/* Antes había dos insignias fijas ("10+ Years", "50+ Awards") que
                            atribuían a todos los perfiles datos inventados: se han quitado. */}
                    </div>
                </div>

                {portfolioItems.length > 0 && (
                <div className="mb-16">
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #FBBF24)` }}>
                            <FolderIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-5xl font-black text-gray-900 dark:text-white">{L.featuredProjects}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {portfolioItems.map((item, i) => (
                            <div key={item.id} className="aspect-square rounded-2xl relative overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <div
                                        className="w-full h-full"
                                        style={{
                                            background: [
                                                `linear-gradient(135deg, #A855F7, #6366F1)`,
                                                `linear-gradient(135deg, #EC4899, #EF4444)`,
                                                `linear-gradient(135deg, #3B82F6, #06B6D4)`,
                                                `linear-gradient(135deg, #10B981, #14B8A6)`,
                                                `linear-gradient(135deg, ${accentColor}, #FBBF24)`,
                                                `linear-gradient(135deg, #6B7280, #1F2937)`
                                            ][i % 6]
                                        }}
                                    ></div>
                                )}
                                <div className={`absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-sm ${HOVER_ONLY_EXPORT_VISIBLE}`}>
                                    <div className="text-2xl font-bold mb-3">{item.title}</div>
                                    <div className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: `${accentColor}`, color: 'white' }}>
                                        {item.category}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
};

export default CreativeOrangeTemplate;
