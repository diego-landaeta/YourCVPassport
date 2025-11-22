
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

const CompanyLogo: React.FC<{ name: string; url: string }> = ({ name, url }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center h-12 text-gray-500 dark:text-dark-text-tertiary text-2xl font-semibold grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:text-cv-blue dark:hover:text-cv-blue-light transition-all duration-300 cursor-pointer"
    >
      {name}
    </a>
);

const Companies: React.FC<{title?: string}> = ({title}) => {
  const t = useTranslations();
  const defaultTitle = t.companies.title;
  return (
    <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-12 border-y border-gray-100 dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text-primary mb-8">
          {title || defaultTitle}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
          {t.companies.logos.map((company: { name: string; url: string }) => (
            <CompanyLogo key={company.name} name={company.name} url={company.url} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Companies;