
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

const Features: React.FC = () => {
  const t = useTranslations();
  const features = t.features.items;

  return (
    <section id="features" className="py-20 bg-white dark:bg-dark-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
            {t.features.subtitle}
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-cv-light-gray dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border p-8 rounded-lg shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-cv-blue-light/10 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-cv-blue dark:bg-cv-blue-light mb-6 shadow-md">
                <div dangerouslySetInnerHTML={{ __html: feature.icon }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">{feature.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;