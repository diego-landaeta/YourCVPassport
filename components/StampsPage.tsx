import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Testimonials from './landing/Testimonials';
import Companies from './landing/Companies';
import Faq from './landing/Faq';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './shared/PageSEO';
import { useLanguage } from '../contexts/LanguageContext';
import HeroImage from './landing/HeroImage';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const StampCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    subFeatures: string[];
}> = ({ icon, title, description, subFeatures }) => (
    <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-100 dark:border-dark-border">
        <div className="flex items-center mb-4">
            <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-xl bg-cv-blue/10 mr-5">
                {icon}
            </div>
            <h2 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{title}</h2>
        </div>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{description}</p>
        <div className="space-y-3">
            {subFeatures.map(feature => (
                <h3 key={feature} className="text-lg font-semibold text-cv-dark-gray dark:text-dark-text-primary flex items-center">
                    <svg className="w-5 h-5 mr-3 text-cv-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>{feature}</span>
                </h3>
            ))}
        </div>
    </div>
);

const StampsPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Verificación de Credenciales Blockchain'
        : 'Blockchain Credential Verification';

    const seoDescription = lang === 'es'
        ? 'Verifica tus logros profesionales con tecnología blockchain inmutable. Certificaciones, diplomas, experiencia laboral validados y confiables para reclutadores con YourCVPassport.'
        : 'Verify your professional achievements with immutable blockchain technology. Certifications, diplomas, work experience validated and trusted by recruiters with YourCVPassport.';

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
                                    {t.stampsPage.title}
                                </h1>
                                <p className="mt-6 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {t.stampsPage.subtitle}
                                </p>
                                <button
                                    onClick={() => openModal('signup')}
                                    className="mt-8 bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    {t.stampsPage.cta.start}
                                </button>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=600&fit=crop"
                                alt={t.stampsPage.heroImageAlt}
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
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.stampsPage.why.title}</h2>
                        <div className="mt-8 space-y-4">
                             <h3 className="text-2xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.stampsPage.why.trustGapTitle}</h3>
                             <p className="text-lg text-gray-600 dark:text-dark-text-secondary">{t.stampsPage.why.trustGapBody}</p>
                             <h3 className="text-2xl font-semibold text-cv-dark-gray dark:text-dark-text-primary mt-4">{t.stampsPage.why.whatIsTitle}</h3>
                             <p className="text-lg text-gray-600 dark:text-dark-text-secondary">{t.stampsPage.why.whatIsBody}</p>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Types of Stamps */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="grid md:grid-cols-2 gap-8">
                            {t.stampsPage.types.map((stamp: any) => (
                                <StampCard 
                                    key={stamp.title}
                                    icon={stamp.icon}
                                    title={stamp.title}
                                    description={stamp.description}
                                    subFeatures={stamp.subFeatures}
                                />
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* How It Works */}
            <section className="py-20 bg-white dark:bg-dark-bg-primary px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                {t.stampsPage.how.title}
                            </h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                {t.stampsPage.how.subtitle}
                            </p>
                        </div>
                        <div className="mt-16 grid md:grid-cols-3 gap-12 md:gap-8 items-start relative">
                            {/* Dotted line connectors - two segments that don't overlap circles */}
                            {/* Line from circle 1 to circle 2 */}
                            <div className="hidden md:block absolute top-12 left-[calc(16.67%+3rem)] w-[calc(33.33%-6rem)] h-0.5 z-0">
                                <svg width="100%" height="2" className="overflow-visible">
                                    <line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 8"/>
                                </svg>
                            </div>
                            {/* Line from circle 2 to circle 3 */}
                            <div className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(33.33%-6rem)] h-0.5 z-0">
                                <svg width="100%" height="2" className="overflow-visible">
                                    <line x1="0" y1="1" x2="100%" y2="1" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 8"/>
                                </svg>
                            </div>

                            {/* Global animation styles - 9 seconds total */}
                            <style>{`
                                /* Step visibility animations - when one is active, others fade */
                                @keyframes stepVisible1 {
                                    0%, 28% { opacity: 1; }
                                    35%, 100% { opacity: 0.3; }
                                }
                                @keyframes stepVisible2 {
                                    0%, 28% { opacity: 0.3; }
                                    35%, 61% { opacity: 1; }
                                    68%, 100% { opacity: 0.3; }
                                }
                                @keyframes stepVisible3 {
                                    0%, 61% { opacity: 0.3; }
                                    68%, 93% { opacity: 1; }
                                    100% { opacity: 0.3; }
                                }

                                /* Circle glow animations */
                                @keyframes glowCircle1 {
                                    0%, 28% {
                                        transform: scale(1.1);
                                        box-shadow: 0 0 40px rgba(59, 130, 246, 0.7);
                                    }
                                    35%, 100% {
                                        transform: scale(1);
                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                    }
                                }
                                @keyframes glowCircle2 {
                                    0%, 28% {
                                        transform: scale(1);
                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                    }
                                    35%, 61% {
                                        transform: scale(1.1);
                                        box-shadow: 0 0 40px rgba(59, 130, 246, 0.7);
                                    }
                                    68%, 100% {
                                        transform: scale(1);
                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                    }
                                }
                                @keyframes glowCircle3 {
                                    0%, 61% {
                                        transform: scale(1);
                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                    }
                                    68%, 93% {
                                        transform: scale(1.1);
                                        box-shadow: 0 0 40px rgba(34, 197, 94, 0.7);
                                    }
                                    100% {
                                        transform: scale(1);
                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                    }
                                }
                            `}</style>

                            {t.stampsPage.how.steps.map((step: any, index: number) => (
                                <div
                                    key={step.title}
                                    className="relative text-center"
                                    style={{
                                        animation: `stepVisible${index + 1} 9s ease-in-out infinite`,
                                    }}
                                >
                                    <div
                                        className={`flex items-center justify-center w-24 h-24 mx-auto mb-6 border-4 rounded-full text-4xl font-bold z-20 relative bg-white dark:bg-dark-bg-primary ${index === 2 ? 'border-cv-green text-cv-green' : 'border-cv-blue text-cv-blue'}`}
                                        style={{
                                            animation: `glowCircle${index + 1} 9s ease-in-out infinite`,
                                        }}
                                    >
                                    {index + 1}
                                    </div>
                                    <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{step.title}</h3>
                                    <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Benefits Section */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                 <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                {t.stampsPage.benefits.title}
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                           {t.stampsPage.benefits.items.map((item: any) => (
                                <div key={item.title} className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md">
                                    <h3 className="font-semibold text-xl text-cv-blue">{item.title}</h3>
                                    <p className="text-gray-600 dark:text-dark-text-secondary mt-2">{item.description}</p>
                                </div>
                           ))}
                        </div>
                    </AnimatedWrapper>
                 </div>
            </section>
            
            <Companies title={t.stampsPage.companiesTitle}/>

            <Testimonials 
                title={t.stampsPage.testimonials.title} 
                description={t.stampsPage.testimonials.description}
            />

            <Faq 
                items={t.STAMPS_FAQ_ITEMS} 
                title={t.stampsFaq.title}
                description={t.stampsFaq.description}
            />

            {/* Final CTA */}
            <section className="bg-cv-dark-gray">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            {t.stampsPage.finalCta.title}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                            {t.stampsPage.finalCta.subtitle}
                        </p>
                        <button
                        onClick={() => openModal('signup')}
                        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-cv-blue hover:bg-opacity-90 sm:w-auto transform hover:scale-105 transition-transform"
                        >
                        {t.stampsPage.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>

        </div>
        </>
    );
};

export default StampsPage;
