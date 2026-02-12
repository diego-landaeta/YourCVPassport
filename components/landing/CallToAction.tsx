import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';

const CallToAction: React.FC = () => {
  const { openModal } = useAuth();
  const t = useTranslations();

  return (
    <section className="bg-cv-light-gray dark:bg-dark-bg-secondary border-y border-gray-100 dark:border-dark-border">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary">
          {t.cta.title}
        </h2>
        <p className="mt-4 text-lg leading-6 text-gray-600 dark:text-dark-text-secondary">
          {t.cta.subtitle}
        </p>
        <button
          onClick={() => openModal('signup')}
          className="mt-8 w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cv-blue dark:bg-cv-blue hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light sm:w-auto shadow-lg transition-all transform hover:scale-105"
        >
          {t.cta.button}
        </button>
      </div>
    </section>
  );
};

export default CallToAction;