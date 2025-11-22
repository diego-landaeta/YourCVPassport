
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Security: React.FC = () => {
    const t = useTranslations();
    const { lang } = useLanguage();
    const langPrefix = lang === 'es' ? '/es' : '';

    return (
        <section className="bg-gray-900 dark:bg-dark-bg-primary text-white py-20 border-y border-transparent dark:border-dark-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-dark-text-primary">
                        {t.security.title}
                    </h2>
                    <p className="mt-4 text-lg text-gray-300 dark:text-dark-text-secondary">
                        {t.security.subtitle}
                    </p>
                    <Link to={`${langPrefix}/companies/security`} className="mt-8 inline-block bg-cv-blue dark:bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light transition-all shadow-lg">
                        {t.security.cta}
                    </Link>
                </div>
                <div className="md:w-1/2 flex justify-center">
                    <svg className="w-48 h-48 text-cv-blue dark:text-cv-blue-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            </div>
        </section>
    );
};

export default Security;