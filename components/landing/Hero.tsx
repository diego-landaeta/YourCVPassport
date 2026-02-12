import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';

const Hero: React.FC = () => {
  const { openModal, user } = useAuth();
  const t = useTranslations();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const langPrefix = lang === 'es' ? '/es' : '';

  const handleAuthRedirect = (defaultAction?: () => void) => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <section className="bg-cv-light-gray dark:bg-dark-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 dark:text-dark-text-primary leading-tight">
          {t.hero.title.split(': ')[0]}: <span className="text-cv-blue dark:text-cv-blue-light">{t.hero.title.split(': ')[1]}</span>
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-dark-text-secondary">
          {t.hero.subtitle}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => handleAuthRedirect()}
            className="w-full sm:w-auto bg-cv-blue dark:bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light transition-all duration-300 transform hover:scale-105 shadow-lg">
            {t.hero.ctaCreate}
          </button>
          <button
            onClick={() => handleAuthRedirect()}
            className="w-full sm:w-auto bg-white dark:bg-dark-bg-secondary text-cv-blue dark:text-cv-blue-light px-8 py-3 rounded-lg text-lg font-semibold border-2 border-cv-blue dark:border-cv-blue-light hover:bg-cv-blue hover:text-white dark:hover:bg-cv-blue-light dark:hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg">
            {t.hero.ctaSearch}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;