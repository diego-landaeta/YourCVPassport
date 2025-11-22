import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';

const AboutUs: React.FC = () => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const langPrefix = lang === 'es' ? '/es' : '';
  const pressPath = `${langPrefix}/${t.aboutUs.pressLink}`.replace(/\/+/g, '/');
  const contactPath = `${langPrefix}/${t.aboutUs.contactLink}`.replace(/\/+/g, '/');

  return (
    <div className="bg-white dark:bg-dark-bg-primary">
      <section className="bg-cv-light-gray dark:bg-dark-bg-secondary border-b border-transparent dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary leading-tight">
            {t.aboutUs.title}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-dark-text-secondary">
            {t.aboutUs.subtitle}
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.aboutUs.valuesTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {t.aboutUs.values.map(value => (
              <div key={value.title} className="text-center p-6">
                <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-dark-text-secondary">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 border-y border-transparent dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{t.aboutUs.pressTitle}</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                {t.aboutUs.pressSubtitle}
            </p>
            <div className="mt-8 flex justify-center gap-4">
                 <Link to={pressPath} className="bg-cv-blue dark:bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light transition-colors shadow-lg">
                    {t.aboutUs.ctaDownload}
                 </Link>
                 <Link to={contactPath} className="bg-white dark:bg-dark-bg-tertiary text-cv-blue dark:text-cv-blue-light px-8 py-3 rounded-lg text-lg font-semibold border-2 border-cv-blue dark:border-cv-blue-light hover:bg-cv-blue hover:text-white dark:hover:bg-cv-blue dark:hover:text-white transition-colors">
                    {t.aboutUs.ctaContact}
                 </Link>
            </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;