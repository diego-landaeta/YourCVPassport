import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const t = useTranslations();
  const { lang } = useLanguage();

  const getPath = (path: string) => path.startsWith('/') ? path : `/${path}`;

  return (
    <footer className="bg-gray-900 dark:bg-dark-bg-primary text-white border-t border-transparent dark:border-dark-border">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link to={getPath('/')} className="text-xl font-bold text-cv-blue dark:text-cv-blue-light hover:text-cv-blue-dark dark:hover:text-cv-blue transition-colors">YourCVPassport</Link>
            <p className="mt-4 text-gray-400 dark:text-dark-text-secondary text-sm">{t.footer.tagline}</p>
          </div>
          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-100 dark:text-dark-text-primary">{t.footer.product.title}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to={getPath(t.footer.links.overview)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.product.overview}</Link></li>
              <li><Link to={getPath(t.footer.links.stamps)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.product.stamps}</Link></li>
              <li><Link to={getPath(t.footer.links.ats)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.product.ats}</Link></li>
              <li><Link to={getPath(t.footer.links.ai)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.product.ai}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-100 dark:text-dark-text-primary">{t.footer.solutions.title}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to={getPath(t.footer.links.professionals)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.solutions.professionals}</Link></li>
              <li><Link to={getPath(t.footer.links.companies)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.solutions.companies}</Link></li>
              <li><Link to={getPath(t.footer.links.pricing)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.solutions.pricing}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-100 dark:text-dark-text-primary">{t.footer.resources.title}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to={getPath(t.footer.links.blog)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.resources.blog}</Link></li>
              <li><Link to={getPath(t.footer.links.help)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.resources.help}</Link></li>
              <li><Link to={getPath(t.footer.links.status)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.resources.status}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-100 dark:text-dark-text-primary">{t.footer.company.title}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to={getPath(t.footer.links.about)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.company.about}</Link></li>
              <li><Link to={getPath(t.footer.links.press)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.company.press}</Link></li>
              <li><Link to={getPath(t.footer.links.contact)} className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors duration-200">{t.footer.company.contact}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 dark:border-dark-border flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 dark:text-dark-text-tertiary">&copy; {new Date().getFullYear()} YourCVPassport. {t.footer.rights}</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
             <a href="#" className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors">LinkedIn</a>
             <a href="#" className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors">X</a>
             <a href="#" className="text-gray-400 dark:text-dark-text-secondary hover:text-cv-blue-light dark:hover:text-cv-blue-light transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;