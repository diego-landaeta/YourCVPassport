import React from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './shared/PageSEO';
import InlineCTA from './landing/InlineCTA';
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

// Simple component for security badges in the hero
const SecurityBadge: React.FC<{ text: string }> = ({ text }) => (
    <div className="bg-white dark:bg-dark-bg-primary/80 backdrop-blur-sm text-cv-dark-gray dark:text-dark-text-primary font-semibold px-4 py-2 rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
        {text}
    </div>
);

// Component for feature cards
const SecurityFeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-lg border border-gray-100 dark:border-dark-border h-full">
        <div className="flex items-center justify-center w-16 h-16 bg-cv-blue/10 rounded-xl mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{title}</h3>
        <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{description}</p>
    </div>
);

const SecurityCompliancePage: React.FC = () => {
    const { lang } = useLanguage();
    const t = useTranslations();
    // FIX: Correctly reference the translation object for this page. The error was caused by this object missing from the Spanish translation file.
    const pageData = t.securityCompliancePage;

    const seoTitle = lang === 'es'
        ? 'Seguridad y Cumplimiento'
        : 'Security and Compliance';
    const seoDescription = lang === 'es'
        ? 'Máxima seguridad para tus datos profesionales. Encriptación end-to-end, certificación SOC 2, cumplimiento GDPR, backups automáticos y auditorías de seguridad con YourCVPassport.'
        : 'Maximum security for your professional data. End-to-end encryption, SOC 2 certification, GDPR compliance, automatic backups and security audits with YourCVPassport.';

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
                                <div className="mt-10 flex justify-center md:justify-start flex-wrap gap-4">
                                    {pageData.heroBadges.map((badge: string) => <SecurityBadge key={badge} text={badge} />)}
                                </div>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=600&fit=crop"
                                alt={pageData.heroImageAlt}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Our Commitment Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
                    <AnimatedWrapper>
                        <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-xl border h-full">
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-6">{pageData.commitment.security.title}</h2>
                            <p className="text-lg text-gray-600 dark:text-dark-text-secondary mb-6">{pageData.commitment.security.description}</p>
                            <ul className="space-y-4">
                                {pageData.commitment.security.features.map((feature: any) => (
                                    <li key={feature.title} className="flex items-start">
                                        <span className="text-cv-green font-bold mr-3 text-2xl">✓</span>
                                        <div>
                                            <h3 className="font-semibold text-lg">{feature.title}</h3>
                                            <p className="text-gray-600 dark:text-dark-text-secondary">{feature.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                        <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-xl border h-full">
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-6">{pageData.commitment.privacy.title}</h2>
                            <p className="text-lg text-gray-600 dark:text-dark-text-secondary mb-6">{pageData.commitment.privacy.description}</p>
                             <ul className="space-y-4">
                                 {pageData.commitment.privacy.features.map((feature: any) => (
                                    <li key={feature.title} className="flex items-start">
                                        <span className="text-cv-green font-bold mr-3 text-2xl">✓</span>
                                        <div>
                                            <h3 className="font-semibold text-lg">{feature.title}</h3>
                                            <p className="text-gray-600 dark:text-dark-text-secondary">{feature.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Certifications grid */}
            <section className="py-12 bg-cv-light-gray dark:bg-dark-bg-secondary">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-2xl md:text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-8">
                        {pageData.certifications.title}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                        {pageData.certifications.items.map((item: string) => (
                            <div key={item} className="text-center font-semibold text-gray-600 dark:text-dark-text-secondary">{item}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Data Flow Diagram */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.dataFlow.title}</h2>
                         <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-center font-semibold">
                            {pageData.dataFlow.steps.map((step: string, index: number) => (
                                <React.Fragment key={step}>
                                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-dark-bg-secondary">{step}</div>
                                    {index < pageData.dataFlow.steps.length - 1 && <div className="text-cv-blue/50 text-2xl transform md:-rotate-0 rotate-90">→</div>}
                                </React.Fragment>
                            ))}
                         </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Mid-page CTA */}
            <div className="px-4">
                <div className="max-w-5xl mx-auto">
                    <InlineCTA
                        title={pageData.inlineCta.title}
                        description={pageData.inlineCta.description}
                        buttonText={pageData.inlineCta.button}
                        variant="blue"
                    />
                </div>
            </div>

            {/* Security Features Cards */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-7xl mx-auto">
                     <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                {pageData.transparency.title}
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {pageData.transparency.features.map((feature: any) => (
                                <SecurityFeatureCard 
                                    key={feature.title}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            ))}
                        </div>
                     </AnimatedWrapper>
                </div>
            </section>
            
            {/* Final CTA / Trust Center */}
            <section className="bg-white dark:bg-dark-bg-primary">
                <div className="max-w-4xl mx-auto py-16 px-4 sm:py-24 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.finalCta.title}</h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                           {pageData.finalCta.subtitle}
                        </p>
                        <a href="#" className="mt-8 inline-block bg-cv-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
                            {pageData.finalCta.button}
                        </a>
                    </AnimatedWrapper>
                </div>
            </section>
            </div>
        </>
    );
};

export default SecurityCompliancePage;
