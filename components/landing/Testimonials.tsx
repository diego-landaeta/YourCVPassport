import React, { useEffect, useState } from 'react';
import { Testimonial } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOpynioWidget, OPYNIO_BUSINESS_ID } from '../../hooks/useOpynioWidget';

const isDarkTheme = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const Testimonials: React.FC<{title?: string, description?: string, testimonials?: Testimonial[]}> = ({title, description}) => {
  const t = useTranslations();
  const { lang } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>(isDarkTheme() ? 'dark' : 'light');

  // El widget se configura con data-theme: hay que seguir el tema de la página
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(isDarkTheme() ? 'dark' : 'light'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const widgetKey = `${lang}-${theme}`;
  const { ref: widgetRef, status } = useOpynioWidget(widgetKey);

  const defaultTitle = t.testimonials.title;
  const defaultDescription = t.testimonials.subtitle;

  // Sin reseñas (API vacía o caída, script bloqueado): fuera la sección entera, también
  // el título. Mientras carga, el título queda oculto (sin mover el diseño) para no
  // acabar en "título sin contenido".
  if (status === 'empty') return null;
  const ready = status === 'ready';

  return (
    <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20" data-testid="testimonials-section" aria-busy={!ready}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center ${ready ? '' : 'invisible'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary">
            {title || defaultTitle}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
            {description || defaultDescription}
          </p>
        </div>
        {/* Opynio Widget v6.0 - horizontal-carousel */}
        <div className="mt-12">
          <div ref={widgetRef} key={widgetKey} className="opynio-widget" data-business-id={OPYNIO_BUSINESS_ID} data-type="horizontal-carousel" data-theme={theme}></div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
