import React, { useState, useMemo } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { templates } from './templates/templateData';

const TemplateCard: React.FC<{ title: string; imageUrl: string; isPro: boolean }> = ({ title, imageUrl, isPro }) => (
  <div className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 aspect-[3/4]">
    <img src={imageUrl} alt={title} className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
    {isPro && (
      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
        PRO
      </div>
    )}
    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 p-4">
        <button className="bg-cv-blue text-white px-6 py-2 rounded-md font-semibold mb-3">Preview</button>
        <button className="bg-white dark:bg-dark-bg-secondary text-cv-blue px-6 py-2 rounded-md font-semibold">Customize</button>
    </div>
    <h3 className="absolute bottom-0 left-0 p-6 text-xl font-bold text-white group-hover:opacity-0 transition-opacity duration-300">{title}</h3>
  </div>
);

const TemplateGallery: React.FC = () => {
    const t = useTranslations();
    const { lang } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('All');

    // Separate free and pro templates
    const freeTemplates = templates.filter(template => !template.isPro);
    const proTemplates = templates.filter(template => template.isPro);

    return (
        <div>
            <div className="flex justify-center flex-wrap gap-4 mb-12">
                {t.templatesAndExamplesPage.gallery.categories.map((category: any) => (
                    <button
                        key={category.key}
                        onClick={() => setActiveCategory(category.key)}
                        className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200 ${
                            activeCategory === category.key
                            ? 'bg-cv-blue text-white shadow-md'
                            : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-border-light'
                        }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
            
            {/* Free Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                {freeTemplates.map((template) => (
                    <TemplateCard key={template.id} title={template.name[lang]} imageUrl={template.previewImg} isPro={false} />
                ))}
            </div>

            {/* Separator */}
            <div className="flex items-center justify-center my-12">
                <div className="flex-grow border-t border-gray-300 dark:border-dark-border"></div>
                <div className="mx-6 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold rounded-full shadow-lg">
                    {lang === 'es' ? 'PLANTILLAS PRO' : 'PRO TEMPLATES'}
                </div>
                <div className="flex-grow border-t border-gray-300 dark:border-dark-border"></div>
            </div>

            {/* Pro Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {proTemplates.map((template) => (
                    <TemplateCard key={template.id} title={template.name[lang]} imageUrl={template.previewImg} isPro={true} />
                ))}
            </div>
        </div>
    );
};

export default TemplateGallery;