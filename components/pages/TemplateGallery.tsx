import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { templates } from '../templates/templateData';

interface TemplateCardProps {
  title: string;
  imageUrl: string;
  isPro: boolean;
  onPreview: () => void;
  onCustomize: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ title, imageUrl, isPro, onPreview, onCustomize }) => (
  <div className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 aspect-[3/4]">
    <img src={imageUrl} alt={title} className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
    {isPro && (
      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
        PRO
      </div>
    )}
    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 p-4">
        <button
          onClick={onPreview}
          className="bg-cv-blue text-white px-6 py-2 rounded-md font-semibold mb-3 hover:bg-cv-blue/90 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={onCustomize}
          className="bg-white dark:bg-dark-bg-secondary text-cv-blue px-6 py-2 rounded-md font-semibold hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
        >
          Customize
        </button>
    </div>
    <h3 className="absolute bottom-0 left-0 p-6 text-xl font-bold text-white group-hover:opacity-0 transition-opacity duration-300">{title}</h3>
  </div>
);

const TemplateGallery: React.FC = () => {
    const t = useTranslations();
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const { session, openModal } = useAuth();
    const [activeCategory, setActiveCategory] = useState('All');
    const [previewTemplate, setPreviewTemplate] = useState<typeof templates[0] | null>(null);

    // Filter templates by category
    const filteredTemplates = useMemo(() => {
        if (activeCategory === 'All') {
            return templates;
        }
        return templates.filter(template => template.category === activeCategory);
    }, [activeCategory]);

    // Separate free and pro templates from filtered results
    const freeTemplates = filteredTemplates.filter(template => !template.isPro);
    const proTemplates = filteredTemplates.filter(template => template.isPro);

    const handlePreview = (template: typeof templates[0]) => {
        setPreviewTemplate(template);
    };

    const handleCustomize = () => {
        // Check if user is authenticated
        if (!session) {
            // If not authenticated, open signup modal
            openModal('signup');
            return;
        }

        // If authenticated, navigate to dashboard templates section
        navigate('/dashboard');
        // Use setTimeout to allow navigation to complete before changing section
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('change-dashboard-section', {
                detail: { section: 'mi-perfil:template' }
            }));
        }, 100);
    };

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
                    <TemplateCard
                        key={template.id}
                        title={template.name[lang]}
                        imageUrl={template.previewImg}
                        isPro={false}
                        onPreview={() => handlePreview(template)}
                        onCustomize={handleCustomize}
                    />
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
                    <TemplateCard
                        key={template.id}
                        title={template.name[lang]}
                        imageUrl={template.previewImg}
                        isPro={true}
                        onPreview={() => handlePreview(template)}
                        onCustomize={handleCustomize}
                    />
                ))}
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreviewTemplate(null)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] bg-white dark:bg-dark-bg-secondary rounded-lg shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg-tertiary">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {previewTemplate.name[lang]}
                                </h3>
                                {previewTemplate.isPro && (
                                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        PRO
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                            <img
                                src={previewTemplate.previewImg}
                                alt={previewTemplate.name[lang]}
                                className="w-full h-auto rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg-tertiary">
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="px-6 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-dark-bg-primary hover:bg-gray-300 dark:hover:bg-dark-border-light transition-colors"
                            >
                                {lang === 'es' ? 'Cerrar' : 'Close'}
                            </button>
                            <button
                                onClick={() => {
                                    setPreviewTemplate(null);
                                    handleCustomize();
                                }}
                                className="px-6 py-2 rounded-md font-semibold text-white bg-cv-blue hover:bg-cv-blue/90 transition-colors"
                            >
                                {lang === 'es' ? 'Personalizar' : 'Customize'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateGallery;