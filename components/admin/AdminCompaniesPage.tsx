import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CompanyManagementSection from './CompanyManagementSection';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminCompaniesPage: React.FC = () => {
  const { lang } = useLanguage();

  const translations = {
    en: {
      title: 'Company Management',
      subtitle: 'Manage all registered companies',
      backToDashboard: 'Back to Dashboard'
    },
    es: {
      title: 'Gestión de Empresas',
      subtitle: 'Administra todas las empresas registradas',
      backToDashboard: 'Volver al Panel'
    }
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{t.backToDashboard}</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm mt-1">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompanyManagementSection />
      </div>
    </div>
  );
};

export default AdminCompaniesPage;
