import React from 'react';
import { Testimonial } from '../types';
import { useTranslations } from '../hooks/useTranslations';

const Testimonials: React.FC<{title?: string, description?: string, testimonials?: Testimonial[]}> = ({title, description, testimonials}) => {
  const t = useTranslations();
  const defaultTitle = t.testimonials.title;
  const defaultDescription = t.testimonials.subtitle;
  // FIX: Explicitly type itemsToRender as Testimonial[] to solve type error.
  const itemsToRender: Testimonial[] = testimonials || t.TESTIMONIALS;

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
        <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {itemsToRender.map((testimonial) => (
            <div key={testimonial.name} className="bg-white dark:bg-dark-bg-primary border border-gray-100 dark:border-dark-border p-8 rounded-lg shadow-lg dark:shadow-2xl flex flex-col items-center text-center relative hover:-translate-y-1 transition-all duration-300">
                {testimonial.plan && (
                    <span className="absolute top-0 right-0 bg-cv-blue/10 dark:bg-cv-blue-light/20 text-cv-blue dark:text-cv-blue-light text-xs font-bold mr-4 mt-4 px-2.5 py-1 rounded-full">{testimonial.plan}</span>
                )}
                <img className="h-20 w-20 rounded-full object-cover mb-4 ring-2 ring-gray-200 dark:ring-dark-border" src={testimonial.imageUrl} alt={testimonial.name} />
                <blockquote className="text-gray-600 dark:text-dark-text-secondary italic">"{testimonial.quote}"</blockquote>
                <div className="mt-4">
                    <p className="font-semibold text-gray-800 dark:text-dark-text-primary">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{testimonial.role}</p>
                </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;