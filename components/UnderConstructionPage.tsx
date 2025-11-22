import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

interface UnderConstructionPageProps {
  pageTitle: string;
}

const UnderConstructionPage: React.FC<UnderConstructionPageProps> = ({ pageTitle }) => {
  const { lang } = useLanguage();
  const t = useTranslations();

  const seoTitle = lang === 'es'
    ? 'Página en Construcción'
    : 'Page Under Construction';

  const seoDescription = lang === 'es'
    ? 'Esta sección está en desarrollo. Pronto estará disponible con nuevas características para mejorar tu experiencia profesional con YourCVPassport.'
    : 'This section is under development. It will soon be available with new features to enhance your professional experience with YourCVPassport.';

  return (
    <>
      <PageSEO
        title={seoTitle}
        description={seoDescription}
        lang={lang}
      />
      <section className="bg-cv-light-gray dark:bg-dark-bg-primary flex items-center justify-center min-h-[calc(100vh-128px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl p-8 md:p-12 text-center transform hover:scale-[1.02] transition-transform duration-300">
        {/* Icon */}
        <div className="flex justify-center items-center mx-auto w-20 h-20 bg-cv-blue/10 rounded-full">
            <svg className="w-12 h-12 text-cv-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                {/* Main board */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5v4.5H3.75v-4.5z" />
                {/* Legs */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 14.25l-2.25 3.75" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 14.25l2.25 3.75" />
                {/* Decorative stripes on board */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 9.75l-1.5 4.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75l-1.5 4.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.75l-1.5 4.5" />
            </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mt-6">
          {pageTitle}
        </h1>

        {/* Primary Message */}
        <h2 className="mt-4 text-lg font-semibold text-cv-blue">
            {t.underConstruction.title}
        </h2>
        
        {/* Secondary Message */}
        <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
            {t.underConstruction.subtitle}
        </p>
      </div>
      </section>
    </>
  );
};

export default UnderConstructionPage;