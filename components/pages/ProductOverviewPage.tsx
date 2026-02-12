import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useTranslations } from '../../hooks/useTranslations';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';


const AnimatedWrapper: React.FC<{children: React.ReactNode, threshold?: number, delay?: string}> = ({ children, threshold = 0.1, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};


const FeatureSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; reverse?: boolean; subFeatures?: string[]; imageUrl: string; }> = ({ title, children, icon, reverse, subFeatures, imageUrl }) => (
  <div className={`flex flex-col md:flex-row items-center gap-12 ${reverse ? 'md:flex-row-reverse' : ''}`}>
    <div className="md:w-1/2">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-cv-blue/10 mr-4">
            {icon}
        </div>
        <h2 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{title}</h2>
      </div>
      <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
        {children}
      </p>
       {subFeatures && (
        <div className="mt-6 space-y-4">
          {subFeatures.map(feature => (
            <h3 key={feature} className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary flex items-start">
              <svg className="w-6 h-6 mr-3 text-cv-green flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path></svg>
              <span>{feature}</span>
            </h3>
          ))}
        </div>
      )}
    </div>
    <div className="md:w-1/2 flex justify-center items-center rounded-lg overflow-hidden shadow-xl min-h-[300px]">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" />
    </div>
  </div>
);


const ProductOverviewPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Plataforma Profesional de CV Verificado'
        : 'Professional Verified CV Platform';
    const seoDescription = lang === 'es'
        ? 'Crea, verifica y comparte tu CV profesional con tecnología blockchain. Plantillas ATS, dominio personalizado, analíticas avanzadas, IA integrada y más con YourCVPassport.'
        : 'Create, verify and share your professional CV with blockchain technology. ATS templates, custom domain, advanced analytics, integrated AI and more with YourCVPassport.';

    const seoKeywords = lang === 'es'
        ? 'producto, plataforma, CV verificado, blockchain, ATS, dominio personalizado, analíticas, IA, YourCVPassport, profesional'
        : 'product, platform, verified CV, blockchain, ATS, custom domain, analytics, AI, YourCVPassport, professional';

  return (
    <>
        <PageSEO
            title={seoTitle}
            description={seoDescription}
            lang={lang}
            keywords={seoKeywords}
            canonical="https://yourcvpassport.com/product/overview"
        />
        <div className="bg-white dark:bg-dark-bg-primary">
      {/* Hero Section */}
      <section className="bg-cv-light-gray dark:bg-dark-bg-secondary text-center py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
            {t.productOverview.title}
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
            {t.productOverview.subtitle}
        </p>
         <button 
            onClick={() => openModal('signup')}
            className="mt-8 bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg">
            {t.productOverview.cta.startFree}
          </button>
      </section>

      {/* Main Platform Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
            <AnimatedWrapper>
                <div className="text-center mb-16">
                     <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                        {t.productOverview.platform.title}
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                        {t.productOverview.platform.subtitle}
                    </p>
                </div>
            </AnimatedWrapper>
            <div className="space-y-20">
                <AnimatedWrapper>
                    <FeatureSection 
                        title={t.productOverview.features.verified.title}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                        subFeatures={t.productOverview.features.verified.subFeatures}
                        imageUrl="https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    >
                        {t.productOverview.features.verified.description}
                    </FeatureSection>
                </AnimatedWrapper>
                <AnimatedWrapper>
                    <FeatureSection 
                        title={t.productOverview.features.ats.title}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                        reverse
                        subFeatures={t.productOverview.features.ats.subFeatures}
                        imageUrl="https://images.pexels.com/photos/7688460/pexels-photo-7688460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    >
                         {t.productOverview.features.ats.description}
                    </FeatureSection>
                </AnimatedWrapper>
                <AnimatedWrapper>
                     <FeatureSection 
                        title={t.productOverview.features.domain.title}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                        subFeatures={t.productOverview.features.domain.subFeatures}
                        imageUrl="https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    >
                        {t.productOverview.features.domain.description}
                    </FeatureSection>
                </AnimatedWrapper>
                <AnimatedWrapper>
                     <FeatureSection 
                        title={t.productOverview.features.analytics.title}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
                        reverse
                        subFeatures={t.productOverview.features.analytics.subFeatures}
                        imageUrl="https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    >
                       {t.productOverview.features.analytics.description}
                    </FeatureSection>
                </AnimatedWrapper>
                <AnimatedWrapper>
                    <FeatureSection 
                        title={t.productOverview.features.ai.title}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                        subFeatures={t.productOverview.features.ai.subFeatures}
                        imageUrl="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    >
                        {t.productOverview.features.ai.description}
                    </FeatureSection>
                </AnimatedWrapper>
                <AnimatedWrapper>
                     <FeatureSection 
                        title={t.productOverview.features.security.title}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                        reverse
                        imageUrl="https://images.pexels.com/photos/577514/pexels-photo-577514.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                    >
                       {t.productOverview.features.security.description}
                    </FeatureSection>
                </AnimatedWrapper>
            </div>
        </div>
      </section>

      {/* Differentiator H3 */}
       <section className="py-12 bg-cv-light-gray dark:bg-dark-bg-secondary">
        <AnimatedWrapper>
            <div className="max-w-7xl mx-auto text-center px-4">
                <h3 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                    {t.productOverview.differentiator.title}
                </h3>
                <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto">
                    {t.productOverview.differentiator.subtitle}
                </p>
            </div>
        </AnimatedWrapper>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-white dark:bg-dark-bg-primary">
        <AnimatedWrapper>
            <div className="max-w-7xl mx-auto">
                 <div className="text-center mb-12">
                     <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                        {t.productOverview.comparison.title}
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                        {t.productOverview.comparison.subtitle}
                    </p>
                </div>
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                {t.PRICING_COMPARISON.headers.map((header: string, index: number) => (
                                    <th key={header} className={`py-4 px-6 bg-cv-light-gray dark:bg-dark-bg-secondary font-bold uppercase text-sm text-gray-600 dark:text-dark-text-secondary border-b border-gray-200 dark:border-dark-border ${index === 0 ? 'text-left' : 'text-center'}`}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {t.PRICING_COMPARISON.rows.map((row: any) => (
                                <tr key={row.feature} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                                    <td className="py-4 px-6 border-b border-gray-200 dark:border-dark-border font-semibold dark:text-dark-text-primary">{row.feature}</td>
                                    {row.values.map((value: string, index: number) => (
                                        <td key={index} className="py-4 px-6 border-b border-gray-200 dark:border-dark-border text-center">
                                            {value === '✓' ? <span className="text-cv-green font-bold text-2xl">✓</span> : <span className="text-gray-500 dark:text-dark-text-tertiary">{value}</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                         <tfoot>
                            <tr className="bg-cv-light-gray/50 dark:bg-dark-bg-tertiary">
                                <td className="p-6">
                                    <button onClick={() => openModal('signup')} className="font-bold text-cv-blue hover:underline">{t.productOverview.comparison.cta.getStarted}</button>
                                </td>
                                <td className="p-6 text-center">
                                    <button onClick={() => openModal('signup')} className="w-full bg-gray-200 dark:bg-dark-bg-tertiary text-cv-dark-gray dark:text-dark-text-primary px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-dark-border-light transition-colors">{t.productOverview.comparison.cta.chooseBasic}</button>
                                </td>
                                 <td className="p-6 text-center">
                                    <button onClick={() => openModal('signup')} className="w-full bg-cv-blue text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">{t.productOverview.comparison.cta.choosePro}</button>
                                </td>
                                 <td className="p-6 text-center">
                                    <button onClick={() => openModal('signup')} className="w-full bg-cv-dark-gray text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-80 transition-colors">{t.productOverview.comparison.cta.contactSales}</button>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AnimatedWrapper>
      </section>

      {/* Final CTA */}
      <section className="bg-cv-blue">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
             {t.productOverview.finalCta.title}
            </h2>
            <p className="mt-4 text-lg leading-6 text-white/80">
            {t.productOverview.finalCta.subtitle}
            </p>
            <button
            onClick={() => openModal('signup')}
            className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-secondary hover:bg-gray-100 sm:w-auto transform hover:scale-105 transition-transform"
            >
            {t.productOverview.finalCta.button}
            </button>
        </div>
      </section>
    </div>
    </>
  );
};

export default ProductOverviewPage;