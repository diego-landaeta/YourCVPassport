import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import PageSEO from './PageSEO';

/**
 * Lo que se ve en /precios y /empresas/planes mientras todo es gratis (#24,
 * lib/plans.ts). Las páginas de precios siguen en el código tal cual: vuelven
 * solas al compilar con VITE_TODO_GRATIS=false. La IA no se anuncia como gratis
 * porque no lo es (por eso no se dice «todo es gratis»).
 */
type Para = 'profesionales' | 'empresas';

const TEXTOS = {
  es: {
    profesionales: {
      titulo: 'YourCVPassport es gratis',
      texto: 'Por ahora es gratis crear tu perfil, usar todas las plantillas, exportar tu CV y verificarlo. Sin tarjeta.',
      cta: 'Crear mi perfil gratis', ctaTo: '/signup',
      otro: '¿Eres empresa? Publicar ofertas también es gratis', otroTo: '/company/register',
    },
    empresas: {
      titulo: 'Publicar ofertas es gratis',
      texto: 'Por ahora, registrar tu empresa y publicar ofertas no cuesta nada. Verificamos cada empresa antes de que publique.',
      cta: 'Registrar mi empresa', ctaTo: '/company/register',
      otro: '¿Buscas empleo? Crear tu perfil también es gratis', otroTo: '/signup',
    },
  },
  en: {
    profesionales: {
      titulo: 'YourCVPassport is free',
      texto: 'For now it is free to build your profile, use every template, export your CV and verify it. No card needed.',
      cta: 'Create my free profile', ctaTo: '/signup',
      otro: 'Are you a company? Posting jobs is free too', otroTo: '/company/register',
    },
    empresas: {
      titulo: 'Posting jobs is free',
      texto: 'For now, registering your company and posting jobs costs nothing. We verify every company before it can post.',
      cta: 'Register my company', ctaTo: '/company/register',
      otro: 'Looking for a job? Creating your profile is free too', otroTo: '/signup',
    },
  },
} as const;

const TodoGratisAviso: React.FC<{ para: Para }> = ({ para }) => {
  const { lang } = useLanguage();
  const tx = TEXTOS[lang === 'en' ? 'en' : 'es'][para];

  return (
    <>
      {/* Indexable: «es gratis» es contenido real y estas URL siguen en el sitemap. */}
      <PageSEO title={tx.titulo} description={tx.texto} lang={lang === 'en' ? 'en' : 'es'} />
      <section className="bg-white dark:bg-dark-bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p className="inline-block mb-4 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            {lang === 'en' ? 'Free' : 'Gratis'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white text-balance">
            {tx.titulo}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
            {tx.texto}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={tx.ctaTo}
              className="px-6 py-3 rounded-lg bg-cv-blue text-white font-semibold hover:bg-cv-blue-dark transition-colors"
            >
              {tx.cta}
            </Link>
            <Link
              to={tx.otroTo}
              className="px-6 py-3 rounded-lg text-cv-blue dark:text-cv-blue-light font-semibold hover:underline"
            >
              {tx.otro}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default TodoGratisAviso;
