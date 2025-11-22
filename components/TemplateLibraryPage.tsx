import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Template } from '../types';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const TemplateCard: React.FC<{ template: Template; onPreview: () => void; }> = ({ template, onPreview }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    const [imgLoaded, setImgLoaded] = React.useState(false);

    return (
        <div ref={ref} className="bg-white dark:bg-dark-bg-primary rounded-lg shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 border border-gray-100 dark:border-dark-border">
            <div className="relative cursor-pointer" onClick={onPreview}>
                {isVisible && (
                    <>
                        <img
                            src={template.imageUrl}
                            alt={template.title}
                            className={`w-full h-80 object-cover object-top transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            loading="lazy"
                            onLoad={() => setImgLoaded(true)}
                        />
                        {!imgLoaded && (
                            <div className="w-full h-80 bg-gray-200 dark:bg-dark-bg-secondary animate-pulse" />
                        )}
                    </>
                )}
                {!isVisible && <div className="w-full h-80 bg-gray-200 dark:bg-dark-bg-secondary" />}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">Preview</span>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-cv-dark-gray dark:text-dark-text-primary truncate">{template.title}</h3>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500 dark:text-dark-text-tertiary">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <span>{template.rating}</span>
                    </div>
                    <span>{template.downloads.toLocaleString()} downloads</span>
                </div>
            </div>
        </div>
    );
};

const TemplateLibraryPage: React.FC = () => {
    const { openModal } = useAuth();
    const { lang } = useLanguage();
    const t = useTranslations();
    const pageData = t.libraryPage;

    const seoTitle = lang === 'es'
        ? 'Biblioteca de Plantillas'
        : 'Template Library';
    const seoDescription = lang === 'es'
        ? 'Explora nuestra colección completa de plantillas de CV profesionales. Diseños modernos, minimalistas, creativos y ejecutivos optimizados para ATS con YourCVPassport.'
        : 'Explore our complete collection of professional CV templates. Modern, minimalist, creative and executive designs optimized for ATS with YourCVPassport.';

    const [activeCategory, setActiveCategory] = useState<Template['category'] | 'All'>('All');
    const [activeIndustry, setActiveIndustry] = useState('All');
    const [activeLevel, setActiveLevel] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    const filteredTemplates = useMemo(() => {
        return t.TEMPLATES
            .filter(t => activeCategory === 'All' || t.category === activeCategory)
            .filter(t => activeIndustry === 'All' || t.industry === activeIndustry)
            .filter(t => activeLevel === 'All' || t.level === activeLevel);
    }, [activeCategory, activeIndustry, activeLevel, t.TEMPLATES]);

    const handlePreview = (template: Template) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
            />
            <div className="bg-cv-light-gray dark:bg-dark-bg-secondary">
            {isModalOpen && selectedTemplate && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="p-4 sm:p-6 bg-white dark:bg-dark-bg-primary max-h-[90vh] overflow-y-auto">
                        <img src={selectedTemplate.imageUrl} alt={selectedTemplate.title} className="w-full h-auto object-contain rounded-lg shadow-lg border"/>
                        <div className="mt-4 text-center">
                            <h2 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{selectedTemplate.title}</h2>
                            <button onClick={() => openModal('signup')} className="mt-4 bg-cv-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90">
                                {pageData.modal.useTemplate}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <section className="bg-white dark:bg-dark-bg-primary text-center py-20 px-4">
                <AnimatedWrapper>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                </AnimatedWrapper>
            </section>
            
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md mb-12 flex flex-col sm:flex-row justify-center items-center gap-6">
                             {/* Category filters */}
                            <div className="flex-grow flex justify-center flex-wrap gap-2">
                                {(['All', ...t.TEMPLATE_CATEGORIES]).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category as Template['category'] | 'All')}
                                        className={`px-4 py-2 rounded-full font-semibold text-sm ${activeCategory === category ? 'bg-cv-blue text-white' : 'bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-dark-border-light text-gray-700 dark:text-dark-text-primary'}`}
                                    >
                                        {category === 'All' ? 'All' : t.TEMPLATE_CATEGORY_NAMES[category as Template['category']]}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <select value={activeIndustry} onChange={e => setActiveIndustry(e.target.value)} className="p-2 border border-gray-300 dark:border-dark-border-light rounded-md bg-white dark:bg-dark-bg-primary">
                                    {t.TEMPLATE_INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind === 'All' ? pageData.filters.allIndustries : ind}</option>)}
                                </select>
                                <select value={activeLevel} onChange={e => setActiveLevel(e.target.value)} className="p-2 border border-gray-300 dark:border-dark-border-light rounded-md bg-white dark:bg-dark-bg-primary">
                                    {t.TEMPLATE_LEVELS.map(level => <option key={level} value={level}>{level === 'All' ? pageData.filters.allLevels : level}</option>)}
                                </select>
                            </div>
                        </div>

                        {filteredTemplates.length > 0 ? (
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                {filteredTemplates.map(template => (
                                    <TemplateCard key={template.id} template={template} onPreview={() => handlePreview(template)} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.notFound.title}</h3>
                                <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{pageData.notFound.subtitle}</p>
                            </div>
                        )}
                    </AnimatedWrapper>
                </div>
            </section>

            <section className="bg-cv-dark-gray">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">{pageData.cta.title}</h2>
                        <p className="mt-4 text-lg text-white/80">{pageData.cta.subtitle}</p>
                        <button onClick={() => openModal('signup')} className="mt-8 bg-cv-blue text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90">
                            {pageData.cta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
            </div>
        </>
    );
};

export default TemplateLibraryPage;
