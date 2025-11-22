import React from 'react';
import { FullProfileData } from '../../types';
import { EnvelopeIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { CountryBadge } from '../CountrySelector';

interface GreenMinimalTemplateProps {
    data: FullProfileData;
    color?: string | null;
}

const GreenMinimalTemplate: React.FC<GreenMinimalTemplateProps> = ({ data, color }) => {
    const { profile, stats = [] } = data || {};
    const accentColor = color || '#059669'; // Default to green-600

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary font-sans">
            <div className="max-w-4xl mx-auto px-5 py-20">
                <div className="text-center mb-28">
                    <div className="relative group mb-10">
                        <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: `linear-gradient(135deg, ${accentColor}, #2DD4BF)` }}></div>
                        <div className="relative w-44 h-44 rounded-full mx-auto shadow-2xl ring-8 ring-white dark:ring-dark-bg-primary overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold" style={{ background: `linear-gradient(135deg, ${accentColor}, #2DD4BF)` }}>
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-7xl font-black mb-4 text-gray-900 dark:text-white tracking-tighter">
                        {profile.full_name?.toUpperCase()}
                    </h1>
                    <span className="inline-block px-10 py-3 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ background: `linear-gradient(135deg, ${accentColor}, #2DD4BF)`, color: 'white' }}>
                        {profile.headline}
                    </span>
                    {profile.country_code && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <CountryBadge countryCode={profile.country_code} size="md" showName={true} lang="es" />
                        </div>
                    )}
                </div>

                <div className="w-20 h-1.5 mx-auto my-20 rounded-full shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #2DD4BF)` }}></div>

                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-12 shadow-xl hover:shadow-2xl transition-all mb-16">
                    <p className="text-4xl leading-relaxed text-center font-light text-gray-800 dark:text-gray-200">
                       <span dangerouslySetInnerHTML={{ __html: profile.summary || "I'm a <strong>full stack engineer</strong> who builds scalable web applications."}}></span>
                    </p>
                </div>

                {stats.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        {stats.map((stat, i) => (
                            <div key={stat.id} className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-center group">
                                <div className="relative inline-block mb-4">
                                    <div className="absolute inset-0 blur-xl opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: `linear-gradient(135deg, ${accentColor}, #2DD4BF)` }}></div>
                                    <div className="relative text-6xl font-black bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, #2DD4BF)` }}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-widest font-bold">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="rounded-3xl p-16 text-white shadow-2xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accentColor}, #2DD4BF)` }}>
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative">
                        <h2 className="text-4xl font-bold mb-6 text-center">Let's Work Together</h2>
                        <div className="text-center mb-8">
                            {profile.meta_description && (
                                <a href={`mailto:${profile.meta_description}`} className="text-2xl hover:underline flex items-center justify-center gap-3 mb-4">
                                    <EnvelopeIcon className="w-6 h-6" />
                                    {profile.meta_description}
                                </a>
                            )}
                            {profile.phone && (
                                <div className="text-xl flex items-center justify-center gap-3 mb-4">
                                    <PhoneIcon className="w-5 h-5" />
                                    {profile.phone}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center gap-5">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white hover:text-gray-900 transition-all shadow-lg group">
                                <GlobeAltIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white hover:text-gray-900 transition-all shadow-lg group">
                                <EnvelopeIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white hover:text-gray-900 transition-all shadow-lg group">
                                <PhoneIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GreenMinimalTemplate;
