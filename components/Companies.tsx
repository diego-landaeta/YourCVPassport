
import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';

const CompanyLogo: React.FC<{ name: string; url: string; logoUrl: string; logoUrlLight?: string }> = ({ name, url, logoUrl, logoUrlLight }) => {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const currentLogoUrl = (!isDark && logoUrlLight) ? logoUrlLight : logoUrl;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center p-4 transition-all duration-300 cursor-pointer"
      aria-label={name}
    >
      <img
        src={currentLogoUrl}
        alt={name}
        className="h-20 w-auto object-contain opacity-60 hover:opacity-100 hover:scale-105 transition-all duration-300"
        style={{ filter: 'grayscale(100%) brightness(0.5) contrast(1.2)' }}
        onMouseEnter={(e) => e.currentTarget.style.filter = 'grayscale(0%) brightness(1) contrast(1)'}
        onMouseLeave={(e) => e.currentTarget.style.filter = 'grayscale(100%) brightness(0.5) contrast(1.2)'}
      />
    </a>
  );
};

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
          {t.companies.logos.map((company: { name: string; url: string; logoUrl: string; logoUrlLight?: string }) => (
            <CompanyLogo key={company.name} name={company.name} url={company.url} logoUrl={company.logoUrl} logoUrlLight={company.logoUrlLight} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Companies;