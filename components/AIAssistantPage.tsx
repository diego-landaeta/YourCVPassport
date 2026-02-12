import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import CoverLetterGenerator from './CoverLetterGenerator';
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

const AIAssistantPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Asistente IA para CV'
        : 'AI Assistant for CV';
    const seoDescription = lang === 'es'
        ? 'Optimiza tu CV con inteligencia artificial. Mejora automática de descripciones, sugerencias de palabras clave ATS, generador de cartas de presentación personalizado con YourCVPassport.'
        : 'Optimize your CV with artificial intelligence. Automatic description enhancement, ATS keyword suggestions, personalized cover letter generator with YourCVPassport.';

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
                                    {t.aiPage.title}
                                </h1>
                                <p className="mt-6 text-lg text-gray-600 dark:text-dark-text-secondary">
                                   {t.aiPage.subtitle}
                                </p>
                                <button
                                    onClick={() => openModal('signup')}
                                    className="mt-8 bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    {t.aiPage.cta.try}
                                </button>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop"
                                alt={lang === 'es' ? 'Asistente de IA para CV' : 'AI Assistant for CV'}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Features section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-16">
                             <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                {t.aiPage.features.title}
                            </h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                {t.aiPage.features.subtitle}
                            </p>
                        </div>
                    </AnimatedWrapper>
                    <div className="grid md:grid-cols-3 gap-8">
                        <AnimatedWrapper>
                           <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 text-center h-full">
                              <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.aiPage.features.items.enhancement.title}</h3>
                              <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{t.aiPage.features.items.enhancement.description}</p>
                           </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                           <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 text-center h-full">
                              <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.aiPage.features.items.keywords.title}</h3>
                              <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{t.aiPage.features.items.keywords.description}</p>
                           </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1200">
                           <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 text-center h-full">
                              <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.aiPage.features.items.generator.title}</h3>
                              <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{t.aiPage.features.items.generator.description}</p>
                           </div>
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Mid-page CTA */}
            <div className="px-4">
                <div className="max-w-7xl mx-auto">
                    <InlineCTA
                        title={lang === 'es' ? 'Deja que la IA trabaje por ti' : 'Let AI work for you'}
                        description={lang === 'es'
                            ? 'Optimiza tu CV automáticamente y genera cartas de presentación personalizadas en segundos.'
                            : 'Optimize your CV automatically and generate personalized cover letters in seconds.'}
                        buttonText={lang === 'es' ? 'Probar IA gratis' : 'Try AI for free'}
                        variant="gradient"
                    />
                </div>
            </div>

            <CoverLetterGenerator />
            
            {/* Final CTA */}
            <section className="bg-cv-dark-gray">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            {t.aiPage.finalCta.title}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                            {t.aiPage.finalCta.subtitle}
                        </p>
                        <button
                        onClick={() => openModal('signup')}
                        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-cv-blue hover:bg-opacity-90 sm:w-auto transform hover:scale-105 transition-transform"
                        >
                        {t.aiPage.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default AIAssistantPage;
