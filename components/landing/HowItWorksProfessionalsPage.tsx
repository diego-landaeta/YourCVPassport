import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import Testimonials from './Testimonials';
import { useTranslations } from '../../hooks/useTranslations';
import PageSEO from '../shared/PageSEO';
import InlineCTA from './InlineCTA';
import { useLanguage } from '../../contexts/LanguageContext';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="relative text-center">
    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-cv-blue text-white rounded-full text-3xl font-bold shadow-lg">
      {number}
    </div>
    <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{title}</h3>
    <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{description}</p>
  </div>
);


const HowItWorksProfessionalsPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const pageData = t.howItWorksPage;
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Cómo Funciona para Profesionales'
        : 'How It Works for Professionals';

    const seoDescription = lang === 'es'
        ? 'Descubre cómo crear tu perfil profesional verificado en 3 simples pasos. Importa datos, verifica credenciales y destaca ante reclutadores con YourCVPassport.'
        : 'Discover how to create your verified professional profile in 3 simple steps. Import data, verify credentials, and stand out to recruiters with YourCVPassport.';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
            />
            <div className="bg-white dark:bg-dark-bg-primary">
            {/* Hero Section */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary text-center py-20 px-4">
                <AnimatedWrapper>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary leading-tight">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                    <div className="mt-16 max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8 items-start">
                            {pageData.heroSteps.map((step: any, index: number) => (
                                <Step
                                    key={step.title}
                                    number={`${index + 1}`}
                                    title={step.title}
                                    description={step.description}
                                />
                            ))}
                        </div>
                    </div>
                </AnimatedWrapper>
            </section>
            
            {/* H2: Getting Started */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.gettingStarted.title}</h2>
                        <h3 className="text-2xl font-semibold text-cv-blue mt-4">{pageData.gettingStarted.subtitle}</h3>
                    </AnimatedWrapper>
                </div>

                {/* Step-by-step Guide */}
                <div className="max-w-5xl mx-auto mt-16 space-y-16">
                    {pageData.mainSteps.map((step: any, index: number) => (
                         <AnimatedWrapper key={step.title}>
                            <div className={`grid md:grid-cols-2 gap-12 items-center`}>
                                <div className={`text-center md:text-left ${index === 1 ? 'md:order-last' : ''}`}>
                                    <span className="text-cv-blue font-bold text-lg">{step.stepLabel}</span>
                                    <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mt-2">{step.title}</h2>
                                    <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{step.description}</p>
                                    <ul className="mt-6 space-y-3 text-left">
                                        {step.features.map((feature: string) => (
                                            <li key={feature} className="flex items-start"><h3 className="font-semibold ml-2 text-cv-dark-gray dark:text-dark-text-primary"><span className="text-cv-green font-bold">✓</span> {feature}</h3></li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-gray-100 dark:bg-dark-bg-secondary p-8 rounded-lg shadow-lg">
                                    <h3 className="font-bold text-center text-lg mb-4 text-cv-dark-gray dark:text-dark-text-primary">{step.showcase.title}</h3>
                                    <div className={step.showcase.layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
                                        {step.showcase.items.map((item: any) => (
                                            <div key={item.title || item} className="bg-white dark:bg-dark-bg-primary p-4 rounded-md shadow-sm text-center">
                                                {item.title ? <><strong>{item.title}:</strong> {item.description}</> : item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedWrapper>
                    ))}
                </div>
            </section>

            {/* Mid-page CTA */}
            <div className="px-4">
                <div className="max-w-5xl mx-auto">
                    <InlineCTA
                        title={lang === 'es' ? '¿Listo para crear tu perfil?' : 'Ready to create your profile?'}
                        description={lang === 'es'
                            ? 'Sigue estos pasos y tendrás tu perfil profesional verificado en menos de 10 minutos.'
                            : 'Follow these steps and you will have your verified professional profile in less than 10 minutes.'}
                        buttonText={lang === 'es' ? 'Comenzar ahora' : 'Start now'}
                        variant="gradient"
                    />
                </div>
            </div>

            {/* Video Tutorial */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <AnimatedWrapper>
                    <div
                        className="max-w-4xl mx-auto aspect-video bg-gray-500 dark:bg-dark-bg-tertiary rounded-lg shadow-xl flex items-center justify-center bg-cover bg-center relative overflow-hidden"
                        style={{backgroundImage: "url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')"}}
                    >
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative text-center text-white">
                             <h2 className="text-3xl md:text-4xl font-bold">{pageData.video.title}</h2>
                             <p className="mt-2">{pageData.video.subtitle}</p>
                             <div className="mt-6 bg-white/90 dark:bg-dark-bg-primary/90 backdrop-blur-sm px-6 py-3 rounded-lg">
                                <p className="text-cv-blue dark:text-cv-blue-light font-semibold text-lg">
                                    {lang === 'es' ? 'Video próximamente' : 'Video coming soon'}
                                </p>
                             </div>
                        </div>
                    </div>
                </AnimatedWrapper>
            </section>

            {/* After Sharing Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <AnimatedWrapper>
                         <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.whatsNext.title}</h2>
                         <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.whatsNext.subtitle}</p>
                         <div className="mt-8 grid md:grid-cols-2 gap-8 text-left">
                            {pageData.whatsNext.items.map((item: any) => (
                                <div key={item.title} className="bg-cv-light-gray dark:bg-dark-bg-secondary p-6 rounded-lg">
                                    <h2 className="font-bold text-xl">{item.title}</h2>
                                    <h3 className="mt-2">{item.description}</h3>
                                </div>
                            ))}
                         </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            <Testimonials 
                title={pageData.testimonials.title}
                description={pageData.testimonials.description}
            />
            
            {/* CTA */}
            <section className="bg-cv-blue">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            {pageData.finalCta.title}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                            {pageData.finalCta.subtitle}
                        </p>
                        <button
                        onClick={() => openModal('signup')}
                        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary sm:w-auto transform hover:scale-105 transition-transform"
                        >
                        {pageData.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default HowItWorksProfessionalsPage;
