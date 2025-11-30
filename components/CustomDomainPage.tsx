import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import URLSimulator from './URLSimulator';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useTranslations } from '../hooks/useTranslations';
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

const CustomDomainPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Dominio Personalizado para tu CV'
        : 'Custom Domain for Your CV';
    const seoDescription = lang === 'es'
        ? 'Crea tu marca personal con un dominio profesional memorable. yourcvpassport.com/tu-nombre en lugar de URLs genéricas. Destaca ante reclutadores con YourCVPassport.'
        : 'Build your personal brand with a memorable professional domain. yourcvpassport.com/your-name instead of generic URLs. Stand out to recruiters with YourCVPassport.';

    const seoKeywords = lang === 'es'
        ? 'dominio personalizado, URL profesional, marca personal, reclutadores, networking, YourCVPassport, branding, profesional'
        : 'custom domain, professional URL, personal brand, recruiters, networking, YourCVPassport, branding, professional';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
                keywords={seoKeywords}
            />
            <div className="bg-white dark:bg-dark-bg-primary">
            {/* Hero Section */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <AnimatedWrapper>
                            <div className="text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                                    {t.customDomain.title}
                                </h1>
                                <p className="mt-6 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {t.customDomain.subtitle}
                                </p>
                                <div className="mt-10 bg-white dark:bg-dark-bg-primary rounded-lg shadow-lg p-2 flex items-center">
                                    <span className="text-gray-400 dark:text-dark-text-tertiary ml-4">https://</span>
                                    <span className="text-cv-dark-gray dark:text-dark-text-primary font-semibold">yourcvpassport.com/cv/janedoe</span>
                                </div>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&h=600&fit=crop"
                                alt={lang === 'es' ? 'Dominio Personalizado para tu CV' : 'Custom Domain for Your CV'}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Why it matters */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <AnimatedWrapper>
                        <div>
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.customDomain.standOutTitle}</h2>
                            <h3 className="text-xl font-semibold text-cv-blue mt-4">{t.customDomain.firstImpressionsTitle}</h3>
                            <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{t.customDomain.firstImpressionsBody}</p>
                            <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary mt-6">{t.customDomain.whyGenericDontWorkTitle}</h3>
                            <p className="mt-2 text-gray-600 dark:text-dark-text-secondary"><code className="bg-red-100 text-red-700 p-1 rounded text-sm">linkedin.com/in/jane-doe-a1b2c3d4</code> vs <code className="bg-green-100 text-green-700 p-1 rounded text-sm">yourcvpassport.com/cv/janedoe</code>. {t.customDomain.whyGenericDontWorkBody}</p>
                        </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                        <div className="bg-cv-light-gray dark:bg-dark-bg-secondary p-8 rounded-lg shadow-xl">
                            <h2 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-6">{t.customDomain.boostBrandTitle}</h2>
                             <ul className="space-y-3">
                                {t.customDomain.boostBrandItems.map((item: string, index: number) => (
                                     <li key={index} className="flex items-start"><span className="text-cv-green font-bold mr-3 text-xl">✓</span><span>{item}</span></li>
                                ))}
                            </ul>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* URL Simulator */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                 <div className="max-w-4xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.customDomain.setupTitle}</h2>
                         <div className="mt-8 text-left max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold text-cv-dark-gray dark:text-dark-text-primary"><span className="text-cv-blue font-bold">{t.customDomain.step1.title}:</span> {t.customDomain.step1.description}</h3>
                            <p className="text-gray-600 dark:text-dark-text-secondary mb-4">{t.customDomain.step1.subDescription}</p>
                            <h3 className="text-lg font-semibold text-cv-dark-gray dark:text-dark-text-primary"><span className="text-cv-blue font-bold">{t.customDomain.step1.formatsTitle}:</span> <code className="bg-gray-200 dark:bg-dark-bg-tertiary text-sm p-1 rounded">yourcvpassport.com/cv/yourname</code> {t.customDomain.step1.structureText} <code className="bg-gray-200 dark:bg-dark-bg-tertiary text-sm p-1 rounded">{t.customDomain.step1.slugOptionsText}</code>.</h3>
                         </div>
                        <URLSimulator />
                        <div className="mt-4 text-left max-w-2xl mx-auto">
                           <h3 className="text-lg font-semibold"><span className="text-cv-blue font-bold">{t.customDomain.step2.title}:</span> {t.customDomain.step2.description}</h3>
                           <p className="text-gray-600 dark:text-dark-text-secondary">{t.customDomain.step2.subDescription}</p>
                        </div>
                    </AnimatedWrapper>
                 </div>
            </section>

            {/* Mid-page CTA */}
            <div className="px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    <InlineCTA
                        title={lang === 'es' ? 'Reserva tu URL personalizada' : 'Reserve your custom URL'}
                        description={lang === 'es'
                            ? 'Crea tu marca personal profesional con una URL memorable que destaque ante reclutadores.'
                            : 'Create your professional personal brand with a memorable URL that stands out to recruiters.'}
                        buttonText={lang === 'es' ? 'Configurar mi URL ahora' : 'Set up my URL now'}
                        variant="blue"
                    />
                </div>
            </div>

            {/* QR Code & Business Card */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <AnimatedWrapper>
                        <div>
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.customDomain.qrTitle}</h2>
                            <p className="text-gray-600 dark:text-dark-text-secondary mt-4 text-lg">{t.customDomain.qrBody}</p>
                            <div className="mt-6 space-y-4">
                               {t.customDomain.qrFeatures.map((feature: string, index: number) => (
                                    <h3 key={index} className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary flex items-start"><svg className="w-6 h-6 mr-3 text-cv-green flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path></svg><span>{feature}</span></h3>
                               ))}
                           </div>
                        </div>
                    </AnimatedWrapper>
                     <AnimatedWrapper delay="duration-1000">
                        <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-2xl shadow-2xl transform rotate-3">
                            <h3 className="text-center font-bold text-2xl mb-4 text-cv-dark-gray dark:text-dark-text-primary">{t.customDomain.businessCardTitle}</h3>
                             <div className="bg-gray-800 text-white p-6 rounded-lg shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xl font-bold">Jane Doe</p>
                                        <p className="text-sm text-gray-300">Senior Product Manager</p>
                                    </div>
                                    <div className="w-16 h-16 bg-white dark:bg-dark-bg-primary p-1 rounded">
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example.com" alt="QR Code" className="w-full h-full"/>
                                    </div>
                                </div>
                                <div className="mt-4 border-t border-gray-600 pt-4 text-sm">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs text-gray-500 font-mono">ID: a1b2c3d4</p>
                                        <div className="text-right">
                                            <p className="text-cv-blue font-semibold">yourcvpassport.com/cv/janedoe</p>
                                            <p className="text-gray-400 dark:text-dark-text-tertiary">jane.doe@email.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Analytics & SEO */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                 <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <AnimatedWrapper>
                         <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-xl">
                            <h2 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-4 text-center">{t.customDomain.analyticsTitle}</h2>
                            <AnalyticsDashboard />
                         </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                        <div>
                             <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.customDomain.seoTitle}</h2>
                             <p className="text-gray-600 dark:text-dark-text-secondary mt-4 text-lg">{t.customDomain.seoBody}</p>
                             <div className="mt-6 space-y-4">
                                <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.customDomain.googleVisibilityTitle}</h3>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{t.customDomain.googleVisibilityBody}</p>
                                <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary mt-4">{t.customDomain.linkedinEnhancementTitle}</h3>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{t.customDomain.linkedinEnhancementBody}</p>
                             </div>
                        </div>
                    </AnimatedWrapper>
                 </div>
            </section>

            {/* Examples */}
            <section className="py-20 px-4 text-center">
                <AnimatedWrapper>
                    <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.customDomain.examplesTitle}</h2>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        {t.customDomain.examples.map((ex: string) => (
                             <span key={ex} className="bg-cv-blue/10 text-cv-blue font-mono p-3 rounded-md">{ex}</span>
                        ))}
                    </div>
                </AnimatedWrapper>
            </section>
            
            {/* Final CTA */}
            <section className="bg-cv-blue">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            {t.customDomain.ctaTitle}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                           {t.customDomain.ctaSubtitle}
                        </p>
                        <button
                        onClick={() => openModal('signup')}
                        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary sm:w-auto transform hover:scale-105 transition-transform"
                        >
                        {t.customDomain.ctaButton}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>

        </div>
        </>
    );
};

export default CustomDomainPage;
