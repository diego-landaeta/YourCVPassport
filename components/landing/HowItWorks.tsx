
import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../contexts/AuthContext';


const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="relative text-center">
    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-cv-blue dark:bg-cv-blue-light text-white rounded-full text-3xl font-bold shadow-lg dark:shadow-cv-blue-light/20">
      {number}
    </div>
    <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">{title}</h3>
    <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{description}</p>
  </div>
);

const HowItWorks: React.FC = () => {
  const t = useTranslations();
  const { openModal } = useAuth();

  return (
    <section className="py-20 bg-cv-light-gray dark:bg-dark-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary">
            {t.howItWorks.title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
            {t.howItWorks.subtitle}
          </p>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-12 md:gap-8 items-start">
          {t.howItWorks.steps.map((step, index) => (
             <Step
                key={index}
                number={(index + 1).toString()}
                title={step.title}
                description={step.description}
            />
          ))}
        </div>
        <div className="mt-12 text-center">
          <button
            onClick={() => openModal('signup')}
            className="bg-cv-blue text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cv-blue-dark transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {t.howItWorks.ctaButton}
          </button>
          <p className="mt-3 text-sm text-gray-500 dark:text-dark-text-tertiary">
            {t.howItWorks.ctaSubtext}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;