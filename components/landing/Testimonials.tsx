import React, { useEffect, useState } from 'react';
import { Testimonial } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';

const isDarkTheme = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const Testimonials: React.FC<{title?: string, description?: string, testimonials?: Testimonial[]}> = ({title, description, testimonials}) => {
  const t = useTranslations();
  const { lang } = useLanguage();
  const [widgetFailed, setWidgetFailed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(isDarkTheme() ? 'dark' : 'light');

  // El widget se configura con data-theme: hay que seguir el tema de la página
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(isDarkTheme() ? 'dark' : 'light'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setWidgetFailed(false);
    const existing = document.querySelector('script[src*="opynio.com/widget"]');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.src = 'https://web.opynio.com/widget.js';
    script.async = true;
    // Si el script externo no carga (Opynio caído, bloqueador de anuncios), se oculta
    // la sección entera: mejor nada que un título sin contenido.
    script.onerror = () => setWidgetFailed(true);
    document.head.appendChild(script);
  }, [lang, theme]);

  const defaultTitle = t.testimonials.title;
  const defaultDescription = t.testimonials.subtitle;

  if (widgetFailed) return null;

  return (
    <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary">
            {title || defaultTitle}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
            {description || defaultDescription}
          </p>
        </div>
        {/* Opynio Widget v6.0 - horizontal-carousel */}
        <div className="mt-12">
          <div key={`${lang}-${theme}`} className="opynio-widget" data-business-id="cee0e351-db95-4024-a5e0-2646e49b2756" data-type="horizontal-carousel" data-theme={theme}></div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
