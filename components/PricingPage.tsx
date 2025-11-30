import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Faq from './Faq';
import Testimonials from './Testimonials';
import { Plan } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

// Wrapper for animations
const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

// Pricing Card Component
const PricingCard: React.FC<{ plan: Plan, isAnnual: boolean }> = ({ plan, isAnnual }) => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const { lang } = useLanguage();

    const monthlyPrice = plan.price !== t.pricingPage.freePrice && plan.price !== t.pricingPage.customPrice
        ? parseInt(plan.price.replace('€', ''))
        : null;

    const annualPrice = monthlyPrice ? Math.round(monthlyPrice * 12 * 0.8) : null;
    const monthlyFromAnnual = annualPrice ? Math.round(annualPrice / 12) : null;

    const displayPrice = isAnnual && annualPrice
        ? `€${annualPrice}`
        : plan.price;

    const displayPeriod = isAnnual && annualPrice
        ? (lang === 'es' ? '/ año' : '/ year')
        : plan.period;

    return (
        <div className={`border dark:border-dark-border rounded-lg p-8 flex flex-col relative overflow-hidden ${plan.highlight ? 'border-cv-blue scale-105 bg-white dark:bg-dark-bg-secondary' : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary'} shadow-lg`}>
            {plan.highlight && <div className="absolute top-0 -right-12 transform rotate-45 bg-cv-green text-white text-center font-semibold py-1 w-40">{t.pricingPage.trialLabel}</div>}
            <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{plan.title}</h3>
            <div className="mt-4">
                <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">{displayPrice}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-dark-text-tertiary">{displayPeriod}</span>
                </div>
                {isAnnual && monthlyFromAnnual && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                        {lang === 'es'
                            ? `€${monthlyFromAnnual} por mes`
                            : `€${monthlyFromAnnual} per month`}
                    </p>
                )}
            </div>
            <p className="mt-5 text-gray-600 dark:text-dark-text-secondary h-12">{plan.description}</p>
            <ul className="mt-8 space-y-4 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0"><svg className="h-6 w-6 text-cv-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                    <p className="ml-3 text-gray-700 dark:text-dark-text-secondary">{feature}</p>
                  </li>
                ))}
            </ul>
            <button onClick={() => openModal('signup')} className={`mt-10 block w-full text-center px-6 py-3 rounded-md font-semibold ${plan.highlight ? 'bg-cv-blue text-white hover:bg-opacity-90' : 'bg-gray-100 dark:bg-dark-bg-tertiary text-cv-blue dark:text-cv-blue-light hover:bg-gray-200 dark:hover:bg-dark-border-light'}`}>
                {plan.cta}
            </button>
        </div>
    );
};

const PricingPage: React.FC = () => {
    const [isAnnual, setIsAnnual] = useState(false);
    const t = useTranslations();
    const pageData = t.pricingPage;
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'Precios y Planes'
        : 'Pricing and Plans';

    const seoDescription = lang === 'es'
        ? 'Elige el plan perfecto para impulsar tu carrera profesional. Desde gratis hasta enterprise, todas las opciones incluyen plantillas profesionales optimizadas para ATS con YourCVPassport.'
        : 'Choose the perfect plan to boost your professional career. From free to enterprise, all options include professional ATS-optimized templates with YourCVPassport.';

    const seoKeywords = lang === 'es'
        ? 'precios, planes, suscripción, gratis, premium, enterprise, CV profesional, plantillas, ATS, YourCVPassport, carrera'
        : 'pricing, plans, subscription, free, premium, enterprise, professional CV, templates, ATS, YourCVPassport, career';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
                keywords={seoKeywords}
                canonical="https://yourcvpassport.com/pricing"
            />
            <div className="bg-white dark:bg-dark-bg-primary">
            {/* Hero */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary leading-tight">
                            {pageData.title}
                        </h1>
                        <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                            {pageData.subtitle}
                        </p>
                        <div className="mt-10 flex justify-center items-center space-x-4">
                            <span className={`font-semibold ${!isAnnual ? 'text-cv-blue dark:text-cv-blue-light' : 'text-gray-500 dark:text-dark-text-tertiary'}`}>{pageData.billingToggle.monthly}</span>
                            <label htmlFor="billing-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="billing-toggle" className="sr-only peer" checked={isAnnual} onChange={() => setIsAnnual(!isAnnual)} />
                                <div className="w-14 h-8 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white dark:after:bg-dark-text-primary after:border-gray-300 dark:border-dark-border-light after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cv-blue"></div>
                            </label>
                            <span className={`font-semibold ${isAnnual ? 'text-cv-blue dark:text-cv-blue-light' : 'text-gray-500 dark:text-dark-text-tertiary'}`}>{pageData.billingToggle.annually} <span className="text-cv-green">({pageData.billingToggle.save})</span></span>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Pricing Cards */}
            <section id="pricing" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.plans.title}</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                            {t.PRICING_PAGE_PLANS.map((plan) => (
                                <PricingCard key={plan.title} plan={plan} isAnnual={isAnnual} />
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Comparison Table */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <AnimatedWrapper>
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.comparison.title}</h2>
                        </div>
                        <div className="overflow-x-auto shadow-lg rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        {t.PRICING_COMPARISON.headers.map((header, index) => (
                                            <th key={header} className={`py-4 px-6 bg-white dark:bg-dark-bg-secondary font-bold uppercase text-sm text-gray-600 dark:text-dark-text-secondary border-b border-gray-200 dark:border-dark-border ${index === 0 ? 'text-left' : 'text-center'}`}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {t.PRICING_COMPARISON.rows.map((row: any, rowIndex: number) => (
                                        <tr key={row.feature} className={`hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors ${(t.PRICING_COMPARISON.rows[rowIndex-1] as any)?.category !== row.category && rowIndex > 0 ? 'border-t-4 border-cv-light-gray dark:border-dark-border' : ''}`}>
                                            <td className="py-4 px-6 border-b border-gray-200 dark:border-dark-border font-semibold text-gray-800 dark:text-dark-text-primary">{row.feature}</td>
                                            {row.values.map((value: string, index: number) => (
                                                <td key={index} className="py-4 px-6 border-b border-gray-200 dark:border-dark-border text-center">
                                                    {value === '✓' ? <span className="text-cv-green font-bold text-2xl">✓</span> : <span className="text-gray-500 dark:text-dark-text-tertiary">{value}</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </AnimatedWrapper>
            </section>
            
            {/* ROI Calculator */}
            <section className="py-20 px-4 bg-white dark:bg-dark-bg-primary">
                <div className="max-w-5xl mx-auto text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.roi.title}</h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">{pageData.roi.subtitle}</p>
                        <div className="mt-12 grid md:grid-cols-3 gap-8">
                            {pageData.roi.stats.map((stat: any) => (
                                <div key={stat.label} className="bg-cv-light-gray dark:bg-dark-bg-secondary p-8 rounded-lg">
                                    <p className="text-4xl font-bold text-cv-blue dark:text-cv-blue-light">{stat.value}</p>
                                    <p className="mt-2 font-semibold text-gray-800 dark:text-dark-text-primary">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Guarantee Section */}
            <section className="py-20 px-4 bg-cv-dark-gray text-white">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <AnimatedWrapper><h2 className="text-3xl font-bold col-span-full mb-8">{pageData.guarantee.title}</h2></AnimatedWrapper>
                    {pageData.guarantee.items.map((item: any, index: number) => (
                        <AnimatedWrapper key={item.title} delay={`duration-${900 + index*200}`}>
                            <h3 className="text-xl font-semibold">{item.title}</h3>
                            <p className="mt-2 text-gray-300">{item.description}</p>
                        </AnimatedWrapper>
                    ))}
                </div>
            </section>
            
            <Testimonials title={pageData.testimonialsTitle} testimonials={t.PRICING_PAGE_TESTIMONIALS} />

            <Faq items={t.PRICING_PAGE_FAQ_ITEMS} title={pageData.faqTitle} />
            
            {/* Final CTA */}
            <section className="bg-cv-blue">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">{pageData.finalCta.title}</h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                            {pageData.finalCta.subtitle}
                        </p>
                        <button onClick={() => { useAuth().openModal('signup')}} className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary sm:w-auto transform hover:scale-105 transition-transform">
                            {pageData.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default PricingPage;