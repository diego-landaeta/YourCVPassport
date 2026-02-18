
import React, { useState } from 'react';
import { FaqItem } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';

const FaqItemComponent: React.FC<{ item: { question: string, answer: string } }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 dark:border-dark-border py-6">
            <dt>
                <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-start text-left text-gray-400 dark:text-dark-text-tertiary hover:text-cv-blue dark:hover:text-cv-blue-light transition-colors">
                    <span className="text-lg font-medium text-gray-800 dark:text-dark-text-primary">{item.question}</span>
                    <span className="ml-6 h-7 flex items-center">
                        <svg className={`h-6 w-6 transform transition-transform duration-200 text-cv-blue dark:text-cv-blue-light ${isOpen ? '-rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
                </button>
            </dt>
            {isOpen && (
                <dd className="mt-2 pr-12">
                    <p className="text-base text-gray-600 dark:text-dark-text-secondary">{item.answer}</p>
                </dd>
            )}
        </div>
    );
}

const Faq: React.FC<{ items?: FaqItem[], title?: string, description?: string }> = ({ items, title, description }) => {
    const t = useTranslations();
    const faqItems = items || t.FAQ_ITEMS;
    const defaultTitle = t.faq.title;
    const defaultDescription = t.faq.subtitle;

    return (
        <section className="bg-white dark:bg-dark-bg-primary py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary">
                        {title || defaultTitle}
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                        {description || defaultDescription}
                    </p>
                </div>
                <div className="mt-12 max-w-3xl mx-auto bg-cv-light-gray dark:bg-dark-bg-secondary p-8 rounded-xl border border-gray-100 dark:border-dark-border shadow-lg">
                    <dl className="space-y-4">
                        {faqItems.map((item, index) => (
                            <FaqItemComponent key={index} item={item} />
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
};

export default Faq;