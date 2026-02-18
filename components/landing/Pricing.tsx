import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';

const Pricing: React.FC = () => {
  const { openModal } = useAuth();
  const t = useTranslations();
  const { lang } = useLanguage();
  const langPrefix = lang === 'es' ? '/es' : '';
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="bg-white dark:bg-dark-bg-primary py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary">
            {t.pricing.title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
            {t.pricing.subtitle}
          </p>
          <div className="mt-10 flex justify-center items-center space-x-4">
            <span className={`font-semibold ${!isAnnual ? 'text-cv-blue dark:text-cv-blue-light' : 'text-gray-500 dark:text-dark-text-tertiary'}`}>
              {t.pricing.monthly}
            </span>
            <label htmlFor="billing-toggle-main" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="billing-toggle-main" className="sr-only peer" checked={isAnnual} onChange={() => setIsAnnual(!isAnnual)} />
              <div className="w-14 h-8 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white dark:after:bg-dark-text-primary after:border-gray-300 dark:border-dark-border-light after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cv-blue"></div>
            </label>
            <span className={`font-semibold ${isAnnual ? 'text-cv-blue dark:text-cv-blue-light' : 'text-gray-500 dark:text-dark-text-tertiary'}`}>
              {t.pricing.annual} <span className="text-cv-green">({t.pricing.save20})</span>
            </span>
          </div>
        </div>
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {t.PRICING_PLANS.map((plan) => {
            const monthlyPrice = plan.price && plan.price.startsWith('€') && !plan.price.includes('medida') && plan.price !== 'Gratis' && plan.price !== 'Free'
              ? parseInt(plan.price.replace('€', ''))
              : null;

            const annualPrice = monthlyPrice ? Math.round(monthlyPrice * 12 * 0.8) : null;
            const monthlyFromAnnual = annualPrice ? Math.round(annualPrice / 12) : null;

            const displayPrice = isAnnual && annualPrice
              ? `€${annualPrice}`
              : plan.price;

            const displayPeriod = isAnnual && annualPrice
              ? t.pricing.perYear
              : plan.period;

            return (
            <div key={plan.title} className={`border rounded-lg p-8 flex flex-col ${plan.highlight ? 'border-cv-blue dark:border-cv-blue-light scale-105 bg-white dark:bg-dark-bg-secondary ring-2 ring-cv-blue/20 dark:ring-cv-blue-light/30' : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary'} shadow-lg dark:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">{plan.title}</h3>
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-800 dark:text-dark-text-primary">{displayPrice}</span>
                  <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-dark-text-tertiary">{displayPeriod}</span>
                </div>
                {isAnnual && monthlyFromAnnual && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                    {`\u20AC${monthlyFromAnnual} ${t.pricing.perMonthAmount}`}
                  </p>
                )}
              </div>
              <p className="mt-5 text-gray-600 dark:text-dark-text-secondary">{plan.description}</p>
              <ul className="mt-8 space-y-4 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-status-success dark:text-cv-blue-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700 dark:text-dark-text-secondary">{feature}</p>
                  </li>
                ))}
              </ul>
              {plan.cta === 'Contact Sales' || plan.cta === 'Contactar Ventas' ? (
                <Link to={`${langPrefix}/companies/plans`} className={`mt-10 block w-full text-center px-6 py-3 rounded-md font-semibold transition-all ${plan.highlight ? 'bg-cv-blue dark:bg-cv-blue text-white hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light shadow-md' : 'bg-gray-100 dark:bg-dark-bg-tertiary text-cv-blue dark:text-cv-blue-light hover:bg-gray-200 dark:hover:bg-dark-bg-primary border border-transparent dark:border-dark-border'}`}>
                    {plan.cta}
                </Link>
              ) : (
                <button onClick={() => openModal('signup')} className={`mt-10 block w-full text-center px-6 py-3 rounded-md font-semibold transition-all ${plan.highlight ? 'bg-cv-blue dark:bg-cv-blue text-white hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light shadow-md' : 'bg-gray-100 dark:bg-dark-bg-tertiary text-cv-blue dark:text-cv-blue-light hover:bg-gray-200 dark:hover:bg-dark-bg-primary border border-transparent dark:border-dark-border'}`}>
                    {plan.cta}
                </button>
              )}
            </div>
            );
          })}
        </div>
        <div className="mt-16 text-center">
            <Link to={`${langPrefix}/pricing`} className="inline-block bg-cv-light-gray dark:bg-dark-bg-secondary text-gray-800 dark:text-dark-text-primary px-8 py-4 rounded-lg text-lg font-semibold border-2 border-gray-200 dark:border-dark-border hover:bg-gray-200 dark:hover:bg-dark-bg-tertiary hover:border-gray-300 dark:hover:border-dark-border-light transition-all duration-300 shadow-sm">
                {t.pricing.compareCta}
            </Link>
        </div>
      </div>
    </section>
  );
};

export default Pricing;