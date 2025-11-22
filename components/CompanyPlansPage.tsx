import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import Testimonials from './Testimonials';
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

const CompanyPlanCard: React.FC<{ plan: any }> = ({ plan }) => {
    const { openModal } = useAuth();
    return (
        <div className={`border dark:border-dark-border rounded-lg p-8 flex flex-col ${plan.highlight ? 'border-cv-blue dark:border-cv-blue-light scale-105 bg-white dark:bg-dark-bg-secondary ring-2 ring-cv-blue/20 dark:ring-cv-blue-light/30' : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary'} shadow-lg dark:shadow-2xl`}>
            <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{plan.title}</h3>
            <p className="mt-2 text-gray-500 dark:text-dark-text-tertiary">{plan.description}</p>
            <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">{plan.price}</span>
                <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-dark-text-tertiary">/ month</span>
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
    const [formState, setFormState] = useState({ name: '', company: '', email: '', message: '' });
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prevState => ({ ...prevState, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Demo request:', formState);
        alert(pageData.form.alert);
        setFormState({ name: '', company: '', email: '', message: '' });
    };

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
                    <div className="mt-8 flex justify-center gap-4">
                        <button className="bg-cv-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">{pageData.cta.requestDemo}</button>
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
                                <CompanyPlanCard key={plan.title} plan={plan} />
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

            {/* Demo Request Form */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-2xl border">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-2">{pageData.form.title}</h2>
                        <p className="text-center text-gray-600 dark:text-dark-text-secondary mb-8">{pageData.form.subtitle}</p>
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="grid md:grid-cols-2 gap-6">
                                <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.name}</label><input type="text" id="name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm" /></div>
                                <div><label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.company}</label><input type="text" id="company" value={formState.company} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm" /></div>
                             </div>
                            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.email}</label><input type="email" id="email" value={formState.email} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm" /></div>
                            <div><label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.message}</label><textarea id="message" rows={4} value={formState.message} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm"></textarea></div>
                            <div className="text-center"><button type="submit" className="bg-cv-blue text-white px-10 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all shadow-lg">{pageData.form.submit}</button></div>
                        </form>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default CompanyPlansPage;
