import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';

const NotFoundPage: React.FC = () => {
  const { lang } = useLanguage();
  const t = useTranslations();

  return (
    <>
      <Helmet>
        <title>{t.notFoundPage.title} | YourCVPassport</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-dark-bg-primary dark:via-dark-bg-secondary dark:to-dark-bg-tertiary flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full">
          {/* 404 Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <h1 className="text-[180px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 leading-none">
                {t.notFoundPage.code}
              </h1>
              <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"></div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t.notFoundPage.heading}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t.notFoundPage.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <HomeIcon className="w-5 h-5" />
                {t.notFoundPage.homeButton}
              </Link>
              <Link
                to={lang === 'es' ? '/empresas/busqueda' : '/companies/search'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-dark-bg-tertiary border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                {t.notFoundPage.searchButton}
              </Link>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-dark-bg-tertiary border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                {t.notFoundPage.goBack}
              </button>
            </div>

            {/* Helpful Links */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {t.notFoundPage.suggestions}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → {t.notFoundPage.link1}
                </Link>
                <Link
                  to="/dashboard"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → {t.notFoundPage.link2}
                </Link>
                <Link
                  to={lang === 'es' ? '/empresas/busqueda' : '/companies/search'}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → {t.notFoundPage.link3}
                </Link>
                <Link
                  to={lang === 'es' ? '/nosotros/contacto' : '/about/contact'}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → {t.notFoundPage.link4}
                </Link>
              </div>
            </div>
          </div>

          {/* Fun Illustration */}
          <div className="mt-8 text-center">
            <svg
              className="w-64 h-64 mx-auto opacity-50"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="100" r="80" fill="currentColor" className="text-blue-100 dark:text-blue-900/30" />
              <path
                d="M70 80 C70 70, 80 70, 80 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-gray-400 dark:text-gray-600"
              />
              <path
                d="M120 80 C120 70, 130 70, 130 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-gray-400 dark:text-gray-600"
              />
              <path
                d="M70 130 Q100 110, 130 130"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="text-gray-400 dark:text-gray-600"
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
