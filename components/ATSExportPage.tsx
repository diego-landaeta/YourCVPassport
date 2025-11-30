import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import ImageComparisonSlider from './ImageComparisonSlider';
import BadCVExample from './BadCVExample';
import GoodCVExample from './GoodCVExample';
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

const TemplateCard: React.FC<{ title: string; imageUrl: string; onClick: () => void }> = ({ title, imageUrl, onClick }) => (
  <div
    onClick={onClick}
    className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 aspect-[3/4] cursor-pointer"
  >
    <img src={imageUrl} alt={title} className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
    <h3 className="absolute bottom-0 left-0 p-6 text-xl font-bold text-white">{title}</h3>
    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    </div>
  </div>
);

const ATSExportPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const [selectedTemplate, setSelectedTemplate] = React.useState<{ title: string; imageUrl: string } | null>(null);
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Plantillas Optimizadas para ATS'
        : 'ATS-Optimized Templates';
    const seoDescription = lang === 'es'
        ? 'Exporta tu CV optimizado para sistemas ATS como Greenhouse, Lever y Workday. Formato PDF compatible, parsing 99% exitoso, plantillas profesionales con YourCVPassport.'
        : 'Export your optimized CV for ATS systems like Greenhouse, Lever and Workday. Compatible PDF format, 99% successful parsing, professional templates with YourCVPassport.';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
            />
            <div className="bg-white dark:bg-dark-bg-primary">
            {/* Hero Section */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary relative overflow-hidden py-20 px-4">
                 <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3">
                    <div className="w-96 h-96 bg-cv-blue/10 rounded-full filter blur-3xl"></div>
                </div>
                <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3">
                    <div className="w-96 h-96 bg-cv-green/10 rounded-full filter blur-3xl"></div>
                </div>
                <div className="max-w-7xl mx-auto z-10 relative">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <AnimatedWrapper>
                            <div className="text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary leading-tight">
                                    {t.atsPage.title}
                                </h1>
                                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-dark-text-secondary">
                                    {t.atsPage.subtitle}
                                </p>
                                <button
                                    onClick={() => openModal('signup')}
                                    className="mt-8 bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    {t.atsPage.cta.export}
                                </button>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop"
                                alt={lang === 'es' ? 'Plantillas Optimizadas para ATS' : 'ATS-Optimized Templates'}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>
            
            {/* What is ATS Section */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                           {t.atsPage.why.title}
                        </h2>
                        <h3 className="text-2xl font-semibold text-cv-blue mt-4">{t.atsPage.why.understanding}</h3>
                        <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                            {t.atsPage.why.description}
                        </p>
                    </AnimatedWrapper>
                </div>
                <div className="max-w-7xl mx-auto mt-16">
                    <AnimatedWrapper>
                        <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-xl border border-gray-100 dark:border-dark-border">
                            <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-8">{t.atsPage.how.title}</h3>
                            <div className="grid md:grid-cols-3 gap-8 items-start text-center">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-20 h-20 bg-cv-blue/10 rounded-full mb-4">
                                        <svg className="w-10 h-10 text-cv-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <h4 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.atsPage.how.steps[0].title}</h4>
                                    <p className="text-gray-600 dark:text-dark-text-secondary mt-2">{t.atsPage.how.steps[0].description}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-20 h-20 bg-cv-blue/10 rounded-full mb-4">
                                        <svg className="w-10 h-10 text-cv-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 7.5v6m3-3h-6" /></svg>
                                    </div>
                                    <h4 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.atsPage.how.steps[1].title}</h4>
                                    <p className="text-gray-600 dark:text-dark-text-secondary mt-2">{t.atsPage.how.steps[1].description}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                     <div className="flex items-center justify-center w-20 h-20 bg-cv-blue/10 rounded-full mb-4">
                                        <svg className="w-10 h-10 text-cv-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M4 8h16M4 12h16M4 16h16M4 20h16" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5-5 5-5m10 10l5-5-5-5" /></svg>
                                    </div>
                                    <h4 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{t.atsPage.how.steps[2].title}</h4>
                                    <p className="text-gray-600 dark:text-dark-text-secondary mt-2">{t.atsPage.how.steps[2].description}</p>
                                </div>
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Format Comparison */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
                    <AnimatedWrapper>
                        <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg h-full">
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-6">{t.atsPage.formats.pdf.title}</h2>
                             <ul className="space-y-4">
                                {t.atsPage.formats.pdf.features.map((feature: any) => (
                                    <li key={feature.title} className="flex items-start"><span className="text-cv-green font-bold mr-3 text-2xl">✓</span><div><h3 className="font-semibold text-lg text-cv-dark-gray dark:text-dark-text-primary">{feature.title}</h3><p className="text-gray-600 dark:text-dark-text-secondary">{feature.description}</p></div></li>
                                ))}
                            </ul>
                        </div>
                    </AnimatedWrapper>
                     <AnimatedWrapper delay="duration-1000">
                        <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg h-full">
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-6">{t.atsPage.formats.docx.title}</h2>
                             <ul className="space-y-4">
                                {t.atsPage.formats.docx.features.map((feature: any) => (
                                    <li key={feature.title} className="flex items-start"><span className="text-cv-green font-bold mr-3 text-2xl">✓</span><div><h3 className="font-semibold text-lg text-cv-dark-gray dark:text-dark-text-primary">{feature.title}</h3><p className="text-gray-600 dark:text-dark-text-secondary">{feature.description}</p></div></li>
                                ))}
                            </ul>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Template Gallery */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.atsPage.templates.title}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{t.atsPage.templates.subtitle}</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {t.atsPage.templates.items.map((template: any) => (
                                <TemplateCard
                                    key={template.title}
                                    title={template.title}
                                    imageUrl={template.imageUrl}
                                    onClick={() => setSelectedTemplate(template)}
                                />
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Mid-page CTA */}
            <div className="px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    <InlineCTA
                        title={lang === 'es' ? 'Optimiza tu CV para ATS ahora' : 'Optimize your CV for ATS now'}
                        description={lang === 'es'
                            ? 'Accede a plantillas profesionales optimizadas para sistemas ATS y aumenta tus posibilidades de ser contactado.'
                            : 'Access professional templates optimized for ATS systems and increase your chances of being contacted.'}
                        buttonText={lang === 'es' ? 'Probar plantillas ATS gratis' : 'Try ATS templates free'}
                        variant="gradient"
                    />
                </div>
            </div>

             {/* Before/After */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                 <div className="max-w-5xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.atsPage.optimization.title}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{t.atsPage.optimization.subtitle}</p>
                            <h3 className="text-2xl font-semibold text-cv-dark-gray dark:text-dark-text-primary mt-6">{t.atsPage.optimization.whatMakesDifferent}</h3>
                        </div>
                        <ImageComparisonSlider
                            beforeComponent={<GoodCVExample />}
                            afterComponent={<BadCVExample />}
                        />
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-center">
                            {t.atsPage.optimization.features.map((feature: string) => (
                                <div key={feature} className="bg-white dark:bg-dark-bg-primary p-4 rounded-lg shadow-sm"><h4 className="font-semibold text-cv-dark-gray dark:text-dark-text-primary">{feature}</h4></div>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Key Statistics Section */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-bg-secondary dark:to-dark-bg-primary px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.atsPage.statistics.title}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto">
                                {t.atsPage.statistics.subtitle}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h3 className="text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-2">{t.atsPage.statistics.stat1.value}</h3>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{t.atsPage.statistics.stat1.description}</p>
                            </div>
                            <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-2">{t.atsPage.statistics.stat2.value}</h3>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{t.atsPage.statistics.stat2.description}</p>
                            </div>
                            <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <h3 className="text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-2">{t.atsPage.statistics.stat3.value}</h3>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{t.atsPage.statistics.stat3.description}</p>
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Final CTA */}
            <section className="bg-cv-blue">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            {t.atsPage.finalCta.title}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                           {t.atsPage.finalCta.subtitle}
                        </p>
                        <button
                        onClick={() => openModal('signup')}
                        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary sm:w-auto transform hover:scale-105 transition-transform"
                        >
                        {t.atsPage.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Template Preview Modal */}
            {selectedTemplate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedTemplate(null)}
                >
                    <div
                        className="relative max-w-5xl w-full max-h-[90vh] bg-white dark:bg-dark-bg-secondary rounded-lg shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedTemplate(null)}
                            className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-dark-bg-tertiary hover:bg-white dark:hover:bg-dark-bg-primary rounded-full p-2 transition-colors"
                            aria-label="Cerrar"
                        >
                            <svg className="w-6 h-6 text-gray-800 dark:text-dark-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Template title */}
                        <div className="bg-gradient-to-r from-cv-blue to-cv-blue-dark p-6">
                            <h3 className="text-2xl font-bold text-white">{selectedTemplate.title}</h3>
                            <p className="text-white/80 mt-1">Click en la imagen para descargar o cerrar para volver</p>
                        </div>

                        {/* Template image */}
                        <div className="overflow-auto max-h-[calc(90vh-120px)] bg-gray-100 dark:bg-dark-bg-tertiary">
                            <img
                                src={selectedTemplate.imageUrl}
                                alt={selectedTemplate.title}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
        </>
    );
};

export default ATSExportPage;
