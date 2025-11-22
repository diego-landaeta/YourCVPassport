import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const ATSLogo: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-center justify-center h-16 px-6 bg-white dark:bg-dark-bg-primary rounded-lg shadow-md border border-gray-100 dark:border-dark-border">
      <span className="text-2xl font-bold text-gray-500 dark:text-dark-text-tertiary">{name}</span>
    </div>
);

const ATSCard: React.FC<{ integration: any }> = ({ integration }) => {
    const t = useTranslations();
    return (
        <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-dark-border flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-cv-light-gray dark:bg-dark-bg-secondary rounded-full mb-4 border">
                <span className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{integration.logo}</span>
            </div>
            <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{integration.name}</h3>
            <p className="mt-2 text-gray-600 dark:text-dark-text-secondary flex-grow">{integration.description}</p>
            {/* FIX: Correctly reference the translation object for this page. */}
            <a href="#" className="mt-4 font-semibold text-cv-blue hover:underline">{t.atsIntegrationsPage.learnMore} →</a>
        </div>
    );
}

const ATSIntegrationsPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    // FIX: Correctly reference the translation object for this page. The error was caused by this object missing from the Spanish translation file.
    const pageData = t.atsIntegrationsPage;
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Integraciones ATS'
        : 'ATS Integrations';
    const seoDescription = lang === 'es'
        ? 'Conecta tu CV profesional con los principales sistemas ATS: Greenhouse, Lever, Workday, Taleo. Exportación directa y compatibilidad garantizada con YourCVPassport.'
        : 'Connect your professional CV with leading ATS systems: Greenhouse, Lever, Workday, Taleo. Direct export and guaranteed compatibility with YourCVPassport.';

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
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                    <div className="mt-10 flex justify-center flex-wrap gap-6">
                        {pageData.logos.map((logo: string) => <ATSLogo key={logo} name={logo} />)}
                    </div>
                </AnimatedWrapper>
            </section>

            {/* Integration Showcase */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.showcase.title}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.showcase.subtitle}</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {t.ATS_INTEGRATIONS.map(int => <ATSCard key={int.name} integration={int} />)}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Setup Flow Diagram */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-5xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.setup.title}</h2>
                        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
                            {pageData.setup.steps.map((step: any, index: number) => (
                                <React.Fragment key={step.title}>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex items-center justify-center w-24 h-24 bg-white dark:bg-dark-bg-primary rounded-full text-4xl font-bold text-cv-blue shadow-lg border">{index + 1}</div>
                                        <h3 className="mt-4 font-semibold text-lg text-cv-dark-gray dark:text-dark-text-primary">{step.title}</h3>
                                        <p className="text-gray-600 dark:text-dark-text-secondary">{step.description}</p>
                                    </div>
                                    {index < pageData.setup.steps.length - 1 && <div className="text-cv-blue/50 text-2xl transform md:-rotate-0 rotate-90">➝</div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* API Documentation Preview */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <AnimatedWrapper>
                        <div>
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.api.title}</h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.api.description}</p>
                             <ul className="mt-6 space-y-3">
                                {pageData.api.features.map((feature: string) => (
                                    <li key={feature} className="flex items-start">
                                        <h3 className="font-semibold ml-2 text-cv-dark-gray dark:text-dark-text-primary"><span className="text-cv-green font-bold">✓</span> {feature}</h3>
                                    </li>
                                ))}
                            </ul>
                            <button className="mt-8 bg-cv-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
                                {pageData.api.cta}
                            </button>
                        </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                        <div className="bg-cv-dark-gray p-6 rounded-lg shadow-2xl font-mono text-sm text-white overflow-x-auto">
                            <pre><code>
<span className="text-purple-400">const</span> candidateId = <span className="text-green-300">'uuid-goes-here'</span>;
<span className="text-purple-400">const</span> response = <span className="text-blue-300">await</span> fetch(
  <span className="text-green-300">`https://api.yourcvpassport.com/v1/candidates/</span><span className="text-yellow-300">${'{candidateId}'}</span><span className="text-green-300">`</span>,
  {'{'}
    headers: {'{'}
      <span className="text-red-300">'Authorization'</span>: <span className="text-green-300">'Bearer YOUR_API_KEY'</span>
    {'}'}
  {'}'}
);
<span className="text-purple-400">const</span> data = <span className="text-blue-300">await</span> response.json();
<span className="text-gray-400 dark:text-dark-text-tertiary">{pageData.api.comment}</span>
                            </code></pre>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Security Section */}
             <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                 <div className="max-w-7xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.security.title}</h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto">{pageData.security.description}</p>
                        <div className="mt-8 flex justify-center gap-8">
                            {pageData.security.badges.map((badge: string) => <div key={badge} className="font-semibold">✓ {badge}</div>)}
                        </div>
                    </AnimatedWrapper>
                 </div>
            </section>

            {/* Final CTA */}
            <section className="bg-cv-dark-gray">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">{pageData.finalCta.title}</h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                           {pageData.finalCta.subtitle}
                        </p>
                        <button onClick={() => openModal('signup')} className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-cv-blue hover:bg-opacity-90 sm:w-auto transform hover:scale-105 transition-transform">
                            {pageData.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default ATSIntegrationsPage;
