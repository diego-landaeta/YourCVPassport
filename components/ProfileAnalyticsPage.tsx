import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Testimonials from './Testimonials';
import { useTranslations } from '../hooks/useTranslations';
import AnalyticsDashboard from './AnalyticsDashboard';
import PageSEO from './PageSEO';
import InlineCTA from './InlineCTA';
import { useLanguage } from '../contexts/LanguageContext';
import HeroImage from './HeroImage';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; trend: string }> = ({ icon, label, value, trend }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md border border-gray-100 dark:border-dark-border transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105 hover:border-cv-blue"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center">
                <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full mr-4 transition-all duration-300 ${isHovered ? 'bg-cv-blue/20 scale-110' : 'bg-cv-blue/10'}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{label}</p>
                    <p className={`text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary transition-all duration-300 ${isHovered ? 'text-cv-blue' : ''}`}>{value}</p>
                </div>
            </div>
            <p className={`mt-4 text-sm text-green-600 transition-all duration-300 ${isHovered ? 'font-semibold' : ''}`}>{trend}</p>
        </div>
    );
};

const TrafficBar: React.FC<{ label: string; percentage: number }> = ({ label, percentage }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-center mb-2">
                <h3 className={`font-semibold transition-colors duration-300 ${isHovered ? 'text-cv-blue' : ''}`}>{label}</h3>
                <span className={`text-sm font-bold transition-all duration-300 ${isHovered ? 'text-cv-blue scale-110' : 'text-gray-600 dark:text-gray-400'}`}>
                    {percentage}%
                </span>
            </div>
            <div className="bg-gray-200 dark:bg-dark-bg-tertiary rounded-full h-4 overflow-hidden cursor-pointer">
                <div
                    className={`h-4 rounded-full transition-all duration-500 ease-out ${isHovered ? 'bg-gradient-to-r from-cv-blue to-blue-400' : 'bg-cv-blue'}`}
                    style={{ width: isHovered ? `${Math.min(percentage + 5, 100)}%` : `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const ProfileAnalyticsPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const pageData = t.analyticsPage;
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Analítica de Perfil Profesional'
        : 'Professional Profile Analytics';

    const seoDescription = lang === 'es'
        ? 'Descubre quién visita tu CV profesional con analíticas detalladas. Métricas de engagement, fuentes de tráfico y distribución geográfica para optimizar tu búsqueda de empleo con YourCVPassport.'
        : 'Discover who visits your professional CV with detailed analytics. Engagement metrics, traffic sources, and geographic distribution to optimize your job search with YourCVPassport.';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
            />
            <div className="bg-white dark:bg-dark-bg-primary">
            {/* Hero Section */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <AnimatedWrapper>
                            <div className="text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                                    {pageData.title}
                                </h1>
                                <p className="mt-6 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {pageData.subtitle}
                                </p>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
                                alt={lang === 'es' ? 'Analítica de Perfil Profesional' : 'Professional Profile Analytics'}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Why it matters */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.whyTitle}</h2>
                        <h3 className="text-2xl font-semibold text-cv-blue mt-4">{pageData.whySubtitle}</h3>
                        <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                           {pageData.whyDescription}
                        </p>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Dashboard Demo */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.trackTitle}</h2>
                        <div className="bg-white dark:bg-dark-bg-primary p-4 sm:p-6 rounded-xl shadow-2xl border max-w-6xl mx-auto">
                            <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-6">{pageData.dashboardTitle}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <MetricCard icon={<svg className="w-6 h-6 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} label={pageData.metrics.views} value="1,287" trend={pageData.trends.views} />
                                <MetricCard icon={<svg className="w-6 h-6 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-5.197M15 21a6 6 0 00-3-5.197" /></svg>} label={pageData.metrics.visitors} value="945" trend={pageData.trends.visitors} />
                                <MetricCard icon={<svg className="w-6 h-6 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.53 16.53a8.026 8.026 0 01-3.187-3.187" /></svg>} label={pageData.metrics.engagement} value="68%" trend={pageData.trends.engagement} />
                            </div>
                            <h4 className="text-xl font-semibold mb-4 text-cv-dark-gray dark:text-dark-text-primary">{pageData.trendsTitle}</h4>
                            <div className="bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg overflow-hidden">
                                {/* Interactive Analytics Dashboard */}
                                <AnalyticsDashboard />
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Geo & Traffic */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <AnimatedWrapper>
                         <div>
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.geoTitle}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.geoDescription}</p>
                            <div className="mt-8 p-4 bg-cv-light-gray dark:bg-dark-bg-secondary rounded-lg shadow-md">
                                <img src={pageData.mapImageUrl} alt={pageData.mapImageAlt} className="rounded"/>
                            </div>
                         </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                         <div>
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.trafficTitle}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.trafficDescription}</p>
                            <div className="mt-8 space-y-6">
                                <TrafficBar label={pageData.trafficSources.linkedin} percentage={65} />
                                <TrafficBar label={pageData.trafficSources.direct} percentage={25} />
                                <TrafficBar label={pageData.trafficSources.search} percentage={10} />
                            </div>
                         </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Engagement Metrics */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                 <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.engagementTitle}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.engagementSubtitle}</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                           {pageData.engagementItems.map(item => (
                               <div key={item.title} className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md">
                                   <h3 className="font-semibold text-xl text-cv-blue">{item.title}</h3>
                                   <p className="text-gray-600 dark:text-dark-text-secondary mt-2">{item.description}</p>
                               </div>
                           ))}
                        </div>
                        <div className="mt-12 text-center">
                             <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.companyInsightsTitle}</h3>
                             <p className="mt-2 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.companyInsightsDescription}</p>
                        </div>
                    </AnimatedWrapper>
                 </div>
            </section>

            {/* Mid-page CTA */}
            <div className="px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    <InlineCTA
                        title={lang === 'es' ? 'Comienza a rastrear tus métricas hoy' : 'Start tracking your metrics today'}
                        description={lang === 'es'
                            ? 'Obtén insights detallados sobre quién visita tu perfil y optimiza tu estrategia de búsqueda de empleo.'
                            : 'Get detailed insights into who visits your profile and optimize your job search strategy.'}
                        buttonText={lang === 'es' ? 'Activar analíticas gratis' : 'Activate free analytics'}
                        variant="blue"
                    />
                </div>
            </div>

            <Testimonials 
                title={pageData.testimonialsTitle}
                description={pageData.testimonialsDescription}
                testimonials={t.analyticsPage.analyticsTestimonials}
            />

            {/* Final CTA */}
            <section className="bg-cv-blue">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            {pageData.finalCtaTitle}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                           {pageData.finalCtaSubtitle}
                        </p>
                        <button
                        onClick={() => openModal('signup')}
                        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary sm:w-auto transform hover:scale-105 transition-transform"
                        >
                        {pageData.finalCtaButton}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>

        </div>
        </>
    );
};

export default ProfileAnalyticsPage;
