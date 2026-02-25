import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../supabase/client';
import { FullProfileData, Profile, Experience, Education, Skill, Service, Stat, PortfolioItem } from '../../types';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import { templates } from '../templates/templateData';
import ClassicTemplate from '../templates/ClassicTemplate';
import YellowMinimalistTemplate from '../templates/YellowMinimalistTemplate';
import BlueGradientTemplate from '../templates/BlueGradientTemplate';
import CoralPinkTemplate from '../templates/CoralPinkTemplate';
import GreenMinimalTemplate from '../templates/GreenMinimalTemplate';
import CreativeOrangeTemplate from '../templates/CreativeOrangeTemplate';
import ClassicSidebarTemplate from '../templates/ClassicSidebarTemplate';
import ModernCleanTemplate from '../templates/ModernCleanTemplate';
import ElegantMinimalTemplate from '../templates/ElegantMinimalTemplate';
import ProfessionalBlueTemplate from '../templates/ProfessionalBlueTemplate';
import CreativeModernTemplate from '../templates/CreativeModernTemplate';
import PassportTemplate from '../templates/PassportTemplate';
import ModernMinimalistTemplate from '../templates/ModernMinimalistTemplate';
import CreativeBoldTemplate from '../templates/CreativeBoldTemplate';
import CreativeMinimalistTemplate from '../templates/CreativeMinimalistTemplate';
import ProfessionalClassicTemplate from '../templates/ProfessionalClassicTemplate';
import HealthcareProfessionalTemplate from '../templates/HealthcareProfessionalTemplate';
import CorporateClassicTemplate from '../templates/CorporateClassicTemplate';
import AcademicStandardTemplate from '../templates/AcademicStandardTemplate';
import ModernProfessionalTemplate from '../templates/ModernProfessionalTemplate';
import UrbanTemplate from '../templates/UrbanTemplate';
import { AdminTemplateLoader, adminTemplatesList } from '../templates/AdminTemplateLoader';
import SEOHead from '../shared/SEOHead';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslatedProfile } from '../../hooks/useTranslatedProfile';
import { TranslationProgressIndicator } from '../TranslationProgressIndicator';
import { useTranslations } from '../../hooks/useTranslations';


const ProfileViewPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { lang } = useLanguage();
    const t = useTranslations();
    const { profile: currentUserProfile } = useAuth();
    const [profileData, setProfileData] = useState<FullProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showContactMenu, setShowContactMenu] = useState(false);
    const [showProfessionalLinks, setShowProfessionalLinks] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactSubject, setContactSubject] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [contactSending, setContactSending] = useState(false);
    const [contactSent, setContactSent] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    // Check if current user is admin
    const isAdmin = currentUserProfile?.role === 'admin';

    // Track profile views
    useAnalytics(profileData?.profile?.id || null);

    // Auto-translate profile content when language changes
    const { translatedProfile, isTranslating, progress } = useTranslatedProfile(profileData);

    // Use translated data if available, otherwise fallback to original
    const displayData = translatedProfile || profileData;

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
                    throw new Error("PROFILE_NOT_COMPLETE");
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
                    portfolioItems: portfolioItems || [], // Array completo para templates que lo necesiten
                    portfolio: (portfolioItems || []).filter(item => item.type === 'PROJECT' || !item.type),
                    certifications: (portfolioItems || []).filter(item => item.type === 'CERTIFICATION'),
                    collaborations: (portfolioItems || []).filter(item => item.type === 'COLLABORATION'),
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

    // Expose profile data to window for PDF generation
    useEffect(() => {
        if (profileData?.profile) {
            (window as any).__PROFILE_DATA__ = profileData.profile;
        }
        return () => {
            delete (window as any).__PROFILE_DATA__;
        };
    }, [profileData]);

    // Generate canonical URL - Always use slug if available, fallback to id
    const canonicalUrl = profileData
        ? `https://yourcvpassport.com/cv/${profileData.profile.slug || profileData.profile.id}`
        : undefined;

    const handleContactClick = () => {
        setShowContactMenu(true);
    };

    const renderTemplate = () => {
        if (!displayData) return null;
        const color = displayData.profile.template_color;
        // If admin and selected a template, use that; otherwise use profile's default
        const templateToRender = isAdmin && selectedTemplate ? selectedTemplate : displayData.profile.template;

        // Check if it's an admin template
        if (templateToRender.startsWith('admin-')) {
            return <AdminTemplateLoader templateId={templateToRender} data={displayData} />;
        }

        switch(templateToRender) {
            // Free Templates
            case 'classic': return <ClassicTemplate data={displayData} color={color} />;
            case 'passport': return <PassportTemplate data={displayData} color={color} />;
            case 'modern-professional': return <ModernProfessionalTemplate data={displayData} color={color} />;

            // Premium: Professional/Corporate
            case 'corporate-classic': return <CorporateClassicTemplate data={displayData} color={color} />;
            case 'professional-classic': return <ProfessionalClassicTemplate data={displayData} color={color} />;
            case 'academic-standard': return <AcademicStandardTemplate data={displayData} color={color} />;

            // Premium: Creative/Design
            case 'creative-minimalist': return <CreativeMinimalistTemplate data={displayData} color={color} />;
            case 'creative-bold': return <CreativeBoldTemplate data={displayData} color={color} />;
            case 'creative-orange': return <CreativeOrangeTemplate data={displayData} color={color} />;
            case 'creative-modern': return <CreativeModernTemplate data={displayData} color={color} />;
            case 'urban': return <UrbanTemplate data={displayData} color={color} />;

            // Premium: Tech/Modern
            case 'gradient-blue': return <BlueGradientTemplate data={displayData} color={color} />;
            case 'modern-clean': return <ModernCleanTemplate data={displayData} color={color} />;
            case 'modern-minimalist': return <ModernMinimalistTemplate data={displayData} color={color} />;
            case 'professional-blue': return <ProfessionalBlueTemplate data={displayData} color={color} />;
            case 'elegant-minimal': return <ElegantMinimalTemplate data={displayData} color={color} />;

            // Premium: Colorful/Unique
            case 'minimalist-yellow': return <YellowMinimalistTemplate data={displayData} color={color} />;
            case 'coral-pink': return <CoralPinkTemplate data={displayData} color={color} />;
            case 'green-minimal': return <GreenMinimalTemplate data={displayData} color={color} />;
            case 'classic-sidebar': return <ClassicSidebarTemplate data={displayData} color={color} />;

            // Premium: Industry Specific
            case 'healthcare-professional': return <HealthcareProfessionalTemplate data={displayData} color={color} />;

            default:
                return <ClassicTemplate data={displayData} color={color} />;
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
        const isIncompleteProfile = error === "PROFILE_NOT_COMPLETE";

        return (
            <>
                <Helmet>
                    <title>404 - {isIncompleteProfile ? t.cvSections.incompleteProfile : t.cvSections.profileNotFound} | YourCVPassport</title>
                    <meta name="robots" content="noindex, nofollow" />
                    <meta name="prerender-status-code" content="404" />
                </Helmet>
                <div className="min-h-screen flex items-center justify-center text-center p-8 dark:bg-dark-bg-primary">
                    <div className="max-w-md">
                        {isIncompleteProfile ? (
                            <>
                                <div className="flex justify-center mb-6">
                                    <svg className="w-20 h-20 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t.cvSections.incompleteProfile}</h1>
                                <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                                    {t.cvSections.incompleteProfileDesc}
                                </p>
                                <Link
                                    to="/"
                                    className="inline-block px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
                                >
                                    {t.cvSections.backToHome}
                                </Link>
                            </>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-red-600 mb-4">{t.cvSections.profileNotFound}</h1>
                                <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{error}</p>
                                <Link
                                    to="/"
                                    className="inline-block px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
                                >
                                    {t.cvSections.backToHome}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </>
        );
    }

    if (!profileData) {
        return (
            <>
                <Helmet>
                    <title>404 - Profile Not Found | YourCVPassport</title>
                    <meta name="robots" content="noindex, nofollow" />
                    <meta name="prerender-status-code" content="404" />
                </Helmet>
                <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
                    <div className="text-center p-6 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-4">Profile Not Found</h2>
                        <p className="text-gray-700 dark:text-dark-text-primary mb-6">The profile you are looking for does not exist or is incomplete.</p>
                        <Link to="/" className="text-cv-blue hover:underline">Go to Homepage</Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {profileData && (
                <SEOHead
                    profile={profileData.profile}
                    currentLang={lang}
                    canonicalUrl={canonicalUrl}
                    profileSkills={profileData.skills?.slice(0, 7).map(skill => skill.name) || []}
                    profileExperience={profileData.experiences?.slice(0, 3).map(exp => exp.title) || []}
                />
            )}

            {/* Translation Progress Indicator */}
            {progress && (
                <TranslationProgressIndicator
                    current={progress.current}
                    total={progress.total}
                    percentage={progress.percentage}
                    isVisible={isTranslating}
                />
            )}

            <div className="dark:bg-dark-bg-primary">
                {/* Admin Template Selector */}
                {isAdmin && profileData && (
                    <div className="no-print fixed top-24 right-8 z-50 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-border p-4">
                        <label htmlFor="template-selector" className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                            🛡️ {t.cvSections.adminChangeTemplate}
                        </label>
                        <select
                            id="template-selector"
                            value={selectedTemplate || profileData.profile.template}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                        >
                            <optgroup label="📁 Plantillas Estándar">
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name[lang] || template.name.es}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="🎨 Plantillas Experimentales (Solo Admin)">
                                {adminTemplatesList.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                        <p className="mt-2 text-xs text-gray-500 dark:text-dark-text-secondary">
                            {t.cvSections.adminTestView}
                        </p>
                    </div>
                )}

                {/* Contact Menu Modal */}
                {showContactMenu && profileData && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="no-print fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm animate-fadeIn"
                            onClick={() => {
                                setShowContactMenu(false);
                                setShowProfessionalLinks(false);
                            }}
                        />
                        {/* Menu */}
                        <div className="no-print fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-visible min-w-[340px] max-w-lg w-full mx-4 animate-slideUp max-h-[85vh] flex flex-col">
                            {/* Header */}
                            <div className="relative p-6 pb-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white overflow-hidden flex-shrink-0">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                                <button
                                    onClick={() => {
                                        setShowContactMenu(false);
                                        setShowProfessionalLinks(false);
                                    }}
                                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-all hover:rotate-90 duration-300"
                                    aria-label="Close"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="relative">
                                    <h3 className="font-bold text-xl mb-1">Connect With Me</h3>
                                    <p className="text-xs text-blue-100">Choose your preferred contact method</p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-2.5 overflow-y-auto flex-1">
                                {/* Contact via App */}
                                {profileData.profile.is_open_to_messages === false ? (
                                    <div className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 opacity-60">
                                        <div className="w-11 h-11 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-500 dark:text-gray-400 text-sm">
                                                {lang === 'es' ? 'Mensajes cerrados' : 'Messages closed'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {lang === 'es' ? 'Este usuario ha desactivado los mensajes directos' : 'This user has disabled direct messages'}
                                            </p>
                                        </div>
                                    </div>
                                ) : !showContactForm ? (
                                    <button
                                        onClick={() => setShowContactForm(true)}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 rounded-xl transition-all text-left group border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:scale-[1.02] duration-200"
                                    >
                                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-md flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {lang === 'es' ? 'Enviar mensaje' : 'Send a message'}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {lang === 'es' ? 'Contacta directamente por la app' : 'Contact directly via the app'}
                                            </p>
                                        </div>
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : contactSent ? (
                                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="font-semibold text-green-800 dark:text-green-200 text-sm">
                                            {lang === 'es' ? '¡Mensaje enviado!' : 'Message sent!'}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            {lang === 'es' ? 'Recibirás una respuesta en tu bandeja de mensajes' : "You'll receive a reply in your messages inbox"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {lang === 'es' ? 'Enviar mensaje' : 'Send a message'}
                                            </p>
                                            <button onClick={() => setShowContactForm(false)} className="text-gray-400 hover:text-gray-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            placeholder={lang === 'es' ? 'Asunto (opcional)' : 'Subject (optional)'}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        <textarea
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            placeholder={lang === 'es' ? 'Escribe tu mensaje...' : 'Write your message...'}
                                            rows={3}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!contactMessage.trim()) return;
                                                setContactSending(true);
                                                try {
                                                    const senderName = currentUserProfile?.full_name || (lang === 'es' ? 'Visitante' : 'Visitor');
                                                    const senderEmail = currentUserProfile?.email || '';
                                                    const { data: lead, error: leadErr } = await supabase
                                                        .from('leads')
                                                        .insert({
                                                            sender_id: currentUserProfile?.id || null,
                                                            sender_name: senderName,
                                                            sender_email: senderEmail,
                                                            recipient_id: profileData!.profile.id,
                                                            recipient_name: profileData!.profile.full_name,
                                                            subject: contactSubject || `${lang === 'es' ? 'Mensaje de' : 'Message from'} ${senderName}`,
                                                            message: contactMessage,
                                                            lead_type: 'contact',
                                                            source: 'cv_page',
                                                            status: 'NEW',
                                                        })
                                                        .select('id')
                                                        .single();

                                                    if (leadErr) throw leadErr;

                                                    if (lead) {
                                                        await supabase.from('messages').insert({
                                                            lead_id: lead.id,
                                                            sender_id: currentUserProfile?.id || null,
                                                            sender_name: senderName,
                                                            content: contactMessage,
                                                        });
                                                    }
                                                    setContactSent(true);
                                                } catch (err) {
                                                    console.error('Contact error:', err);
                                                } finally {
                                                    setContactSending(false);
                                                }
                                            }}
                                            disabled={!contactMessage.trim() || contactSending}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {contactSending ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                    {lang === 'es' ? 'Enviar' : 'Send'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Professional Links - Dropdown Button */}
                                {(profileData.profile.linkedin_url || profileData.profile.github_url || profileData.profile.portfolio_url) && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowProfessionalLinks(!showProfessionalLinks)}
                                            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all text-left group border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                                        >
                                            <div className="w-11 h-11 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md flex-shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">Professional Links</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">LinkedIn, GitHub, Portfolio</p>
                                            </div>
                                            <svg
                                                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showProfessionalLinks ? 'rotate-180' : ''}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Submenu de enlaces profesionales */}
                                        {showProfessionalLinks && (
                                            <div className="mt-2 space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                {/* LinkedIn */}
                                                {profileData.profile.linkedin_url && (
                                                    <a
                                                        href={profileData.profile.linkedin_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => {
                                                            setShowContactMenu(false);
                                                            setShowProfessionalLinks(false);
                                                        }}
                                                        className="flex items-center gap-2.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all text-left group border border-blue-200 dark:border-blue-800 hover:shadow-sm"
                                                    >
                                                        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                                            </svg>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-white flex-1">LinkedIn</span>
                                                        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}

                                                {/* GitHub */}
                                                {profileData.profile.github_url && (
                                                    <a
                                                        href={profileData.profile.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => {
                                                            setShowContactMenu(false);
                                                            setShowProfessionalLinks(false);
                                                        }}
                                                        className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-left group border border-gray-200 dark:border-gray-700 hover:shadow-sm"
                                                    >
                                                        <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                                            <svg className="w-4 h-4 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                            </svg>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-white flex-1">GitHub</span>
                                                        <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}

                                                {/* Portfolio */}
                                                {profileData.profile.portfolio_url && (
                                                    <a
                                                        href={profileData.profile.portfolio_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => {
                                                            setShowContactMenu(false);
                                                            setShowProfessionalLinks(false);
                                                        }}
                                                        className="flex items-center gap-2.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all text-left group border border-purple-200 dark:border-purple-800 hover:shadow-sm"
                                                    >
                                                        <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-white flex-1">Portfolio</span>
                                                        <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
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

export default ProfileViewPage;