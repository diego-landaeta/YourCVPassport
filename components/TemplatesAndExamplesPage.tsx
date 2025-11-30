import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import TemplateGallery from './TemplateGallery';
import ImageComparisonSlider from './ImageComparisonSlider';
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

const TemplatesAndExamplesPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const pageData = t.templatesAndExamplesPage;
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Plantillas de CV Profesionales'
        : 'Professional CV Templates';
    const seoDescription = lang === 'es'
        ? 'Plantillas de CV diseñadas por expertos en RRHH, optimizadas para sistemas ATS como Greenhouse y Lever. Personalizables y exportables a PDF de alta calidad con YourCVPassport.'
        : 'CV templates designed by HR experts, optimized for ATS systems like Greenhouse and Lever. Customizable and exportable to high-quality PDF with YourCVPassport.';

    const seoKeywords = lang === 'es'
        ? 'plantillas CV, templates profesionales, ATS, Greenhouse, Lever, personalizable, PDF, diseño, RRHH, YourCVPassport'
        : 'CV templates, professional templates, ATS, Greenhouse, Lever, customizable, PDF, design, HR, YourCVPassport';

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
                                <p className="mt-4 text-base text-gray-600 dark:text-dark-text-secondary">
                                    Plantillas diseñadas por expertos en recursos humanos, optimizadas para sistemas ATS como Greenhouse, Lever y Workday.
                                    Personalizables en tiempo real y exportables a PDF de alta calidad.
                                </p>
                                <div className="mt-8">
                                    <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{pageData.templatesIncluded}</h3>
                                </div>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=600&fit=crop"
                                alt={lang === 'es' ? 'Plantillas de CV Profesionales' : 'Professional CV Templates'}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Template Gallery */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                     <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                {pageData.gallery.title}
                            </h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                {pageData.gallery.subtitle}
                            </p>
                            <p className="mt-4 max-w-2xl mx-auto text-base text-gray-600 dark:text-dark-text-secondary">
                                Cada plantilla incluye secciones para experiencia profesional, educación, habilidades técnicas, idiomas y proyectos destacados.
                                Cambia colores, fuentes y reorganiza el contenido con nuestro editor drag-and-drop. Todas compatibles con sistemas ATS para garantizar
                                que tu CV sea correctamente procesado por los reclutadores.
                            </p>
                        </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                        <TemplateGallery />
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Mid-page CTA */}
            <div className="px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    <InlineCTA
                        title={lang === 'es' ? 'Elige tu plantilla perfecta' : 'Choose your perfect template'}
                        description={lang === 'es'
                            ? 'Accede a todas nuestras plantillas profesionales optimizadas para ATS y empieza a destacar hoy.'
                            : 'Access all our professional ATS-optimized templates and start standing out today.'}
                        buttonText={lang === 'es' ? 'Explorar plantillas' : 'Explore templates'}
                        variant="gradient"
                    />
                </div>
            </div>

            {/* Real Success Stories: Before/After */}
            <section className="py-16 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                 <div className="max-w-4xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.successStories.title}</h2>
                            <p className="mt-3 text-base text-gray-600 dark:text-dark-text-secondary">{pageData.successStories.subtitle}</p>
                            <p className="mt-3 max-w-2xl mx-auto text-sm text-gray-600 dark:text-dark-text-secondary">
                                La diferencia entre un CV genérico y uno profesionalmente diseñado puede determinar tu éxito en la búsqueda de empleo.
                                Un diseño limpio y estructurado aumenta significativamente las probabilidades de que tu CV sea leído completamente
                                y capte la atención de los reclutadores desde el primer vistazo.
                            </p>
                        </div>
                        <div className="max-w-3xl mx-auto">
                            <ImageComparisonSlider
                                before="https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=600&h=400&fit=crop"
                                after="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop"
                            />
                        </div>
                         <div className="text-center mt-6">
                            <h3 className="text-lg font-semibold text-cv-dark-gray dark:text-dark-text-primary">{pageData.successStories.imageCaption}</h3>
                         </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Customize Your Template */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <AnimatedWrapper>
                        <div>
                             <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.customize.title}</h2>
                             <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.customize.subtitle}</p>
                             <p className="mt-4 text-base text-gray-600 dark:text-dark-text-secondary">
                                Editor visual intuitivo que te permite modificar cada elemento en tiempo real. Cambia fuentes, ajusta márgenes,
                                reorganiza secciones con drag-and-drop y visualiza los cambios instantáneamente. Todo sin necesidad de conocimientos
                                técnicos o de diseño gráfico.
                             </p>
                             <div className="mt-6 space-y-4">
                                {pageData.customize.features.map((feature: string) => (
                                    <h3 key={feature} className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary flex items-start">
                                        <svg className="w-6 h-6 mr-3 text-cv-green flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path></svg>
                                        <span>{feature}</span>
                                    </h3>
                                ))}
                            </div>
                        </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                         <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-cv-blue/5 to-purple-500/5 dark:from-cv-blue/10 dark:to-purple-500/10 p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center">{pageData.comparison.title}</h3>
                                <p className="text-center text-sm text-gray-600 dark:text-dark-text-secondary mt-2">
                                    Compara las ventajas de nuestras plantillas profesionales versus herramientas básicas.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                               <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-dark-bg-primary">
                                            {pageData.comparison.headers.map((header: string, index: number) => (
                                                <th key={header} className={`py-4 px-6 text-left font-bold text-sm ${index === 0 ? 'text-gray-700 dark:text-dark-text-primary' : index === 1 ? 'text-cv-blue dark:text-cv-blue-light' : 'text-gray-500 dark:text-dark-text-tertiary'} uppercase tracking-wider`}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {pageData.comparison.rows.map((row: any, rowIndex: number) => (
                                            <tr key={row.feature} className={`${rowIndex % 2 === 0 ? 'bg-white dark:bg-dark-bg-secondary' : 'bg-gray-50/50 dark:bg-dark-bg-primary/50'} hover:bg-cv-blue/5 dark:hover:bg-cv-blue/10 transition-colors`}>
                                                <td className="py-4 px-6 font-semibold text-gray-900 dark:text-dark-text-primary">{row.feature}</td>
                                                {row.values.map((value: string, index: number) => (
                                                    <td key={index} className="py-4 px-6 text-center">
                                                        {value === '✓' ? (
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cv-green/10 dark:bg-cv-green/20">
                                                                <svg className="w-5 h-5 text-cv-green" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                                </svg>
                                                            </span>
                                                        ) : value === '-' ? (
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                                                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                                                </svg>
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">{value}</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
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

export default TemplatesAndExamplesPage;
