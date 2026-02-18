import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Testimonials from './landing/Testimonials';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './shared/PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const CompanyPlanCard: React.FC<{ plan: any, isAnnual: boolean }> = ({ plan, isAnnual }) => {
    const { openModal } = useAuth();
    const { lang } = useLanguage();

    const monthlyPrice = plan.price && plan.price.startsWith('€')
        ? parseInt(plan.price.replace('€', ''))
        : null;

    const annualPrice = monthlyPrice ? Math.round(monthlyPrice * 12 * 0.8) : null;
    const monthlyFromAnnual = annualPrice ? Math.round(annualPrice / 12) : null;

    const displayPrice = isAnnual && annualPrice
        ? `€${annualPrice}`
        : plan.price;

    const t = useTranslations();
    const billing = t.companyPlansPage.billing;

    const displayPeriod = isAnnual && annualPrice
        ? billing.perYear
        : billing.perMonthShort;

    return (
        <div className={`border dark:border-dark-border rounded-lg p-8 flex flex-col ${plan.highlight ? 'border-cv-blue dark:border-cv-blue-light scale-105 bg-white dark:bg-dark-bg-secondary ring-2 ring-cv-blue/20 dark:ring-cv-blue-light/30' : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary'} shadow-lg dark:shadow-2xl`}>
            <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{plan.title}</h3>
            <p className="mt-2 text-gray-500 dark:text-dark-text-tertiary">{plan.description}</p>
            <div className="mt-4">
                <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">{displayPrice}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-dark-text-tertiary">{displayPeriod}</span>
                </div>
                {isAnnual && monthlyFromAnnual && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                        €{monthlyFromAnnual} {billing.perMonth}
                    </p>
                )}
            </div>
             <p className="mt-2 font-semibold text-cv-blue dark:text-cv-blue-light">{plan.credits}</p>
            <ul className="mt-8 space-y-4 flex-grow">
                {plan.features.map((feature: string) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0"><svg className="h-6 w-6 text-cv-green dark:text-cv-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                    <p className="ml-3 text-gray-700 dark:text-dark-text-secondary">{feature}</p>
                  </li>
                ))}
            </ul>
            <button onClick={() => openModal('signup')} className={`mt-10 block w-full text-center px-6 py-3 rounded-md font-semibold ${plan.highlight ? 'bg-cv-blue dark:bg-cv-blue text-white hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light' : 'bg-gray-100 dark:bg-dark-bg-tertiary text-cv-blue dark:text-cv-blue-light hover:bg-gray-200 dark:hover:bg-dark-border-light'}`}>
                {plan.cta}
            </button>
        </div>
    );
};

const CompanyPlansPage: React.FC = () => {
    const t = useTranslations();
    // FIX: Correctly reference the translation object for this page. The error was caused by this object missing from the Spanish translation file.
    const pageData = t.companyPlansPage;
    const [isAnnual, setIsAnnual] = useState(false);
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Planes para Empresas'
        : 'Company Plans';

    const seoDescription = lang === 'es'
        ? 'Soluciones de reclutamiento escalables para empresas. Planes flexibles con créditos, búsqueda avanzada de talento verificado, integración ATS completa y soporte dedicado con YourCVPassport.'
        : 'Scalable recruitment solutions for companies. Flexible credit-based plans, advanced verified talent search, complete ATS integration, and dedicated support with YourCVPassport.';

    const seoKeywords = lang === 'es'
        ? 'planes empresas, reclutamiento, talento, ATS, integración, créditos, búsqueda talento, verificación, YourCVPassport, empresa, soluciones HR'
        : 'company plans, recruitment, talent, ATS, integration, credits, talent search, verification, YourCVPassport, enterprise, HR solutions';

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
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary text-center py-20 px-4">
                <AnimatedWrapper>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                    <div className="mt-10 flex justify-center items-center space-x-4">
                        <span className={`font-semibold ${!isAnnual ? 'text-cv-blue dark:text-cv-blue-light' : 'text-gray-500 dark:text-dark-text-tertiary'}`}>
                            {pageData.billing.monthly}
                        </span>
                        <label htmlFor="billing-toggle-company" className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="billing-toggle-company" className="sr-only peer" checked={isAnnual} onChange={() => setIsAnnual(!isAnnual)} />
                            <div className="w-14 h-8 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white dark:after:bg-dark-text-primary after:border-gray-300 dark:border-dark-border-light after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cv-blue"></div>
                        </label>
                        <span className={`font-semibold ${isAnnual ? 'text-cv-blue dark:text-cv-blue-light' : 'text-gray-500 dark:text-dark-text-tertiary'}`}>
                            {pageData.billing.annual} <span className="text-cv-green">({pageData.billing.save})</span>
                        </span>
                    </div>
                </AnimatedWrapper>
            </section>
            
            {/* Pricing Tiers */}
            <section className="py-20 px-4">
                 <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.tiers.title}</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                            {pageData.tiers.plans.map((plan: any) => (
                                <CompanyPlanCard key={plan.title} plan={plan} isAnnual={isAnnual} />
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* How Credits Work */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-5xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.credits.title}</h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.credits.subtitle}</p>
                        <div className="mt-12 grid sm:grid-cols-3 gap-8 text-left">
                            {pageData.credits.items.map((item: any) => (
                                <div key={item.action} className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md">
                                    <h3 className="text-3xl font-bold text-cv-blue">{item.cost}</h3>
                                    <p className="mt-2 font-semibold text-cv-dark-gray dark:text-dark-text-primary">{item.action}</p>
                                </div>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Feature Matrix */}
            <section className="py-20 px-4">
                <AnimatedWrapper>
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.matrix.title}</h2>
                         <div className="overflow-x-auto shadow-lg rounded-lg border">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-dark-bg-secondary">
                                        {pageData.matrix.headers.map((header: string) => <th key={header} className="p-4 font-bold text-center">{header}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageData.matrix.rows.map((row: any) => (
                                        <tr key={row.feature} className="border-t">
                                            <td className="p-4">{row.feature}</td>
                                            <td className="p-4 text-center">{row.starter}</td>
                                            <td className="p-4 text-center">{row.growth}</td>
                                            <td className="p-4 text-center">{row.enterprise}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </AnimatedWrapper>
            </section>

            <Testimonials title={pageData.testimonialsTitle} testimonials={t.COMPANY_TESTIMONIALS} />

            {/* ROI Comparison */}
             <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <AnimatedWrapper>
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.roi.title}</h2>
                        <div className="grid md:grid-cols-2 gap-8 text-center">
                            <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.roi.timeToHire.title}</h3>
                                <p className="text-5xl font-extrabold text-cv-green mt-4">{pageData.roi.timeToHire.value}</p>
                            </div>
                            <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.roi.costPerHire.title}</h3>
                                <p className="text-5xl font-extrabold text-cv-green mt-4">{pageData.roi.costPerHire.value}</p>
                            </div>
                        </div>
                    </div>
                </AnimatedWrapper>
            </section>

        </div>
        </>
    );
};

export default CompanyPlansPage;

