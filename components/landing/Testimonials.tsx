import React, { useEffect } from 'react';
import { Testimonial } from '../types';
import { useTranslations } from '../../hooks/useTranslations';

const Testimonials: React.FC<{title?: string, description?: string, testimonials?: Testimonial[]}> = ({title, description, testimonials}) => {
  const t = useTranslations();
  const defaultTitle = t.testimonials.title;
  const defaultDescription = t.testimonials.subtitle;

  // Load Opynio widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://web.opynio.com/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
          <div className="opynio-widget" data-business-id="cee0e351-db95-4024-a5e0-2646e49b2756" data-type="horizontal-carousel" data-theme="light"></div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;