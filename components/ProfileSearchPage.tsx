import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { FullProfileData, Profile, Experience, Education, Skill, Service, Stat, PortfolioItem } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';
import ClassicTemplate from './templates/ClassicTemplate';
import YellowMinimalistTemplate from './templates/YellowMinimalistTemplate';
import BlueGradientTemplate from './templates/BlueGradientTemplate';
import CoralPinkTemplate from './templates/CoralPinkTemplate';
import GreenMinimalTemplate from './templates/GreenMinimalTemplate';
import CreativeOrangeTemplate from './templates/CreativeOrangeTemplate';
import ClassicSidebarTemplate from './templates/ClassicSidebarTemplate';
import ModernCleanTemplate from './templates/ModernCleanTemplate';
import ElegantMinimalTemplate from './templates/ElegantMinimalTemplate';
import ProfessionalBlueTemplate from './templates/ProfessionalBlueTemplate';
import CreativeModernTemplate from './templates/CreativeModernTemplate';
import PassportTemplate from './templates/PassportTemplate';
import ModernMinimalistTemplate from './templates/ModernMinimalistTemplate';
import CreativeBoldTemplate from './templates/CreativeBoldTemplate';
import ProfessionalClassicTemplate from './templates/ProfessionalClassicTemplate';
import HealthcareProfessionalTemplate from './templates/HealthcareProfessionalTemplate';
import SEOHead from './SEOHead';
import { useLanguage } from '../contexts/LanguageContext';
import ContactLeadFormModal from './ContactLeadFormModal';


const ProfileSearchPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { lang } = useLanguage();
    const [profileData, setProfileData] = useState<FullProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);

    // Track profile views
    useAnalytics(profileData?.profile?.id || null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!slug) {
                setError("Profile slug not provided.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Try to find profile by slug first, fallback to id for backward compatibility
                let { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                // If not found by slug, try by id (for backward compatibility)
                if (!profile) {
                    const { data: profileById, error: idError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', slug)
                        .maybeSingle();

                    profile = profileById;
                    profileError = idError;
                }

                if (profileError || !profile) {
                    throw new Error("Profile not found.");
                }

                // Verificar si el perfil está completo antes de mostrarlo
                if (!profile.full_name || !profile.headline || !profile.summary) {
                    throw new Error("Este perfil aún no está completo.");
                }

                const [
                    { data: experiences }, { data: education }, { data: skills },
                    { data: portfolioItems }, { data: languages }, { data: stamps }
                ] = await Promise.all([
                    supabase.from('experiences').select('*').eq('profile_id', profile.id).order('start_date', { ascending: false }),
                    supabase.from('education').select('*').eq('profile_id', profile.id).order('start_date', { ascending: false }),
                    supabase.from('skills').select('*').eq('profile_id', profile.id).order('sort_order', { ascending: true }),
                    supabase.from('portfolio_items').select('*').eq('profile_id', profile.id).order('sort_order', { ascending: true }),
                    supabase.from('languages').select('*').eq('profile_id', profile.id).order('sort_order', { ascending: true }),
                    supabase.from('stamps').select('*').eq('profile_id', profile.id).eq('status', 'VERIFIED').order('verified_at', { ascending: false }),
                ]);

                setProfileData({
                    profile,
                    experiences: experiences || [],
                    education: education || [],
                    skills: skills || [],
                    services: [], // Tabla no existe, usar array vacío
                    stats: [], // Tabla no existe, usar array vacío
                    portfolioItems: portfolioItems || [],
                    certifications: [],
                    languages: languages || [],
                    stamps: stamps || [],
                });

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [slug]);

    // Generate canonical URL - Always use slug if available, fallback to id
    const canonicalUrl = profileData
        ? `https://yourcvpassport.com/cv/${profileData.profile.slug || profileData.profile.id}`
        : undefined;

    const renderTemplate = () => {
        if (!profileData) return null;
        const color = profileData.profile.template_color;
        switch(profileData.profile.template) {
            case 'passport': return <PassportTemplate data={profileData} color={color} />;
            case 'minimalist-yellow': return <YellowMinimalistTemplate data={profileData} color={color} />;
            case 'gradient-blue': return <BlueGradientTemplate data={profileData} color={color} />;
            case 'coral-pink': return <CoralPinkTemplate data={profileData} color={color} />;
            case 'green-minimal': return <GreenMinimalTemplate data={profileData} color={color} />;
            case 'creative-orange': return <CreativeOrangeTemplate data={profileData} color={color} />;
            case 'classic-sidebar': return <ClassicSidebarTemplate data={profileData} color={color} />;
            case 'modern-clean': return <ModernCleanTemplate data={profileData} color={color} />;
            case 'elegant-minimal': return <ElegantMinimalTemplate data={profileData} color={color} />;
            case 'professional-blue': return <ProfessionalBlueTemplate data={profileData} color={color} />;
            case 'creative-modern': return <CreativeModernTemplate data={profileData} color={color} />;
            case 'modern-minimalist': return <ModernMinimalistTemplate data={profileData} color={color} />;
            case 'creative-bold': return <CreativeBoldTemplate data={profileData} color={color} />;
            case 'professional-classic': return <ProfessionalClassicTemplate data={profileData} color={color} />;
            case 'healthcare-professional': return <HealthcareProfessionalTemplate data={profileData} color={color} />;
            case 'classic':
            default:
                return <ClassicTemplate data={profileData} color={color} />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cv-blue mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-700 dark:text-dark-text-primary">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        const isIncompleteProfile = error.includes("no está completo");
        
        return <div className="min-h-screen flex items-center justify-center text-center p-8 dark:bg-dark-bg-primary">
            <div className="max-w-md">
                {isIncompleteProfile ? (
                    <>
                        <div className="flex justify-center mb-6">
                            <svg className="w-20 h-20 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Perfil Incompleto</h1>
                        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                            Este perfil aún no está disponible públicamente. El usuario necesita completar su información básica antes de compartir su CV.
                        </p>
                        <Link 
                            to="/" 
                            className="inline-block px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
                        >
                            Volver al inicio
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold text-red-600 mb-4">Perfil No Encontrado</h1>
                        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{error}</p>
                        <Link 
                            to="/" 
                            className="inline-block px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
                        >
                            Volver al inicio
                        </Link>
                    </>
                )}
            </div>
        </div>;
    }

    if (!profileData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
                <div className="text-center p-6 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-4">Profile Not Found</h2>
                    <p className="text-gray-700 dark:text-dark-text-primary mb-6">The profile you are looking for does not exist or is incomplete.</p>
                    <Link to="/" className="text-cv-blue hover:underline">Go to Homepage</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {profileData && (
                <SEOHead
                    profile={profileData.profile}
                    currentLang={lang}
                    canonicalUrl={canonicalUrl}
                />
            )}
            <div className="dark:bg-dark-bg-primary">
                {/* Back Button */}
                <Link
                    to="/"
                    className="no-print fixed top-8 left-8 z-50 bg-white dark:bg-dark-bg-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group border border-gray-200 dark:border-dark-border"
                    aria-label="Regresar"
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline">Regresar</span>
                </Link>

                {/* Floating Contact Button */}
                <button
                    onClick={() => setShowContactModal(true)}
                    className="no-print fixed bottom-8 right-8 z-50 bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-4 rounded-full font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-2 group"
                    aria-label="Contact"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Contact Me</span>
                </button>

                {/* Contact Modal */}
                {profileData && (
                    <ContactLeadFormModal
                        isOpen={showContactModal}
                        onClose={() => setShowContactModal(false)}
                        profileId={profileData.profile.id}
                        profileName={profileData.profile.full_name}
                    />
                )}

                {/* CV Template Container - Required for print styles */}
                <div className="cv-template">
                    {renderTemplate()}
                </div>

                <footer className="no-print text-center text-sm text-gray-500 dark:text-dark-text-tertiary py-4 bg-gray-50 dark:bg-dark-bg-secondary">
                    Powered by <Link to="/" className="font-bold text-cv-blue hover:underline">YourCVPassport</Link>
                </footer>
            </div>
        </>
    );
};

export default ProfileSearchPage;