import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
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

const CategoryTile: React.FC<{ icon: React.ReactNode; title: string; description: string; to?: string }> = ({ icon, title, description, to }) => {
    const content = (
        <>
            <div className="flex items-center justify-center w-16 h-16 bg-cv-blue/10 rounded-lg mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{title}</h3>
            <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{description}</p>
        </>
    );
    // Sin destino conocido la tarjeta se queda como bloque informativo (sin el efecto de "clicable").
    if (!to) {
        return <div className="block bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md border border-gray-100 dark:border-dark-border">{content}</div>;
    }
    return (
        <Link to={to} className="block bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-dark-border">
            {content}
        </Link>
    );
};

const HelpCenterPage: React.FC = () => {
    const t = useTranslations();
    const pageData = t.helpCenterPage;
    const { lang } = useLanguage();
    const links = t.footer.links;
    const isEs = lang === 'es';

    // Destinos reales de cada bloque (antes todos apuntaban a "#"). Van por posición,
    // en el mismo orden que helpCenterPage.categories / popular.articles en es.ts y en.ts.
    // Primeros pasos → cómo funciona; Verificación → sellos; Cuenta → panel (pide login si no hay sesión).
    const categoryPaths = [links.professionals, links.stamps, '/dashboard'];
    // Verificar educación → sellos; dominio personalizado → dominio; exportación ATS → ATS.
    const articlePaths = [links.stamps, isEs ? '/producto/dominio' : '/product/domain', links.ats];
    const communityPath = isEs ? '/comunidad' : '/feed';

    const seoTitle = lang === 'es'
        ? 'Centro de Ayuda'
        : 'Help Center';

    const seoDescription = lang === 'es'
        ? 'Encuentra respuestas rápidas a tus preguntas. Guías completas, tutoriales paso a paso, videos explicativos y soporte técnico para sacar el máximo provecho de YourCVPassport.'
        : 'Find quick answers to your questions. Complete guides, step-by-step tutorials, explanatory videos, and technical support to get the most out of YourCVPassport.';

    const seoKeywords = lang === 'es'
        ? 'ayuda, soporte técnico, tutoriales, guías, preguntas frecuentes, FAQ, centro de ayuda, YourCVPassport, verificación CV, documentación'
        : 'help, technical support, tutorials, guides, FAQ, frequently asked questions, help center, YourCVPassport, CV verification, documentation';

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
                                <div className="mt-8">
                                    <div className="relative">
                                        <input
                                            type="search"
                                            placeholder={pageData.searchPlaceholder}
                                            className="w-full p-4 pr-12 text-lg border-2 border-gray-300 dark:border-dark-border-light rounded-lg shadow-sm focus:ring-cv-blue focus:border-cv-blue"
                                        />
                                        <div className="absolute top-1/2 right-4 -translate-y-1/2">
                                            <svg className="w-6 h-6 text-gray-400 dark:text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop"
                                alt={pageData.heroImageAlt}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Category Tiles */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {pageData.categories.map((cat: any, i: number) => <CategoryTile key={cat.title} {...cat} to={categoryPaths[i]} />)}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Popular Articles & Video */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
                    <AnimatedWrapper>
                        <div>
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-8">{pageData.popular.title}</h2>
                            <ul className="space-y-4">
                                {pageData.popular.articles.map((article: string, i: number) => {
                                    const icon = <svg className="w-5 h-5 mr-3 text-cv-blue/50 group-hover:text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;
                                    return (
                                        <li key={article}>
                                            {articlePaths[i] ? (
                                                <Link to={articlePaths[i]} className="flex items-center text-lg text-gray-700 dark:text-dark-text-secondary hover:text-cv-blue font-semibold group">
                                                    {icon}
                                                    {article}
                                                </Link>
                                            ) : (
                                                <span className="flex items-center text-lg text-gray-700 dark:text-dark-text-secondary font-semibold">
                                                    {icon}
                                                    {article}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                        <div>
                             <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-8">{pageData.video.title}</h2>
                             <div className="aspect-video bg-gray-300 rounded-lg shadow-lg flex items-center justify-center bg-cover bg-center relative overflow-hidden" style={{backgroundImage: "url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')"}}>
                                 <div className="absolute inset-0 bg-black/40"></div>
                                <div className="relative text-center">
                                    <div className="bg-white/90 dark:bg-dark-bg-primary/90 backdrop-blur-sm px-6 py-3 rounded-lg">
                                        <p className="text-cv-blue dark:text-cv-blue-light font-semibold text-lg">
                                            {pageData.videoComingSoon}
                                        </p>
                                    </div>
                                </div>
                             </div>
                             <p className="text-center mt-4 font-semibold text-lg">{pageData.video.caption}</p>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            <Faq items={t.HELP_CENTER_FAQ_ITEMS} title={pageData.faqTitle} />
            
            {/* Community & Contact */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
                     <AnimatedWrapper>
                        <div className="bg-cv-light-gray dark:bg-dark-bg-secondary p-10 rounded-lg text-center h-full flex flex-col justify-center">
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.community.title}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.community.description}</p>
                            <Link to={communityPath} className="mt-6 inline-block bg-cv-dark-gray text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition-colors">
                                {pageData.community.button}
                            </Link>
                        </div>
                    </AnimatedWrapper>
                     <AnimatedWrapper delay="duration-1000">
                         <div className="bg-cv-blue p-10 rounded-lg text-center text-white h-full flex flex-col justify-center">
                            <h2 className="text-3xl font-bold">{pageData.contact.title}</h2>
                            <p className="mt-4 text-lg text-white/80">{pageData.contact.description}</p>
                            <Link to={links.contact} className="mt-6 inline-block bg-white dark:bg-dark-bg-primary text-cv-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary transition-colors">
                                {pageData.contact.button}
                            </Link>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default HelpCenterPage;
