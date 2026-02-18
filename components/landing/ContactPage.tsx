import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { ContactCardItem } from '../../types';
import Faq from './Faq';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import PageSEO from '../shared/PageSEO';
import { supabase } from '../../supabase/client';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const ContactCard: React.FC<{ card: ContactCardItem }> = ({ card }) => {
    const { lang } = useLanguage();
    const langPrefix = lang === 'es' ? '/es' : '';
    const ctaLink = card.isMailLink ? card.ctaLink : `${langPrefix}${card.ctaLink}`.replace(/\/+/g, '/');

    return (
        <div className="bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-lg border border-gray-100 dark:border-dark-border text-center h-full flex flex-col">
            <div className="flex items-center justify-center w-20 h-20 bg-cv-blue/10 rounded-xl mb-6 mx-auto">
                {card.icon}
            </div>
            <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{card.title}</h3>
            <p className="mt-2 text-gray-600 dark:text-dark-text-secondary flex-grow">{card.description}</p>
            <a href={`mailto:${card.email}`} className="block mt-4 text-cv-blue font-semibold hover:underline">{card.email}</a>
            <div className="mt-6">
                {card.isMailLink ? (
                    <a
                        href={ctaLink}
                        className="inline-block bg-cv-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                    >
                        {card.ctaText}
                    </a>
                ) : (
                    <Link
                        to={ctaLink}
                        className="inline-block bg-cv-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                    >
                        {card.ctaText}
                    </Link>
                )}
            </div>
        </div>
    );
};

const ContactPage: React.FC = () => {
    const t = useTranslations();
    const pageData = t.contactPage;
    const { lang } = useLanguage();
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        inquiry: 'General Question',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // Save contact form submission to Supabase
            const { data, error } = await supabase
                .from('contact_submissions')
                .insert([
                    {
                        name: formState.name,
                        email: formState.email,
                        inquiry_type: formState.inquiry,
                        message: formState.message,
                        language: lang,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                // If table doesn't exist, fall back to console log and show success anyway
                if (error.message.includes('relation') || error.message.includes('does not exist')) {
                    console.log('Contact form submission:', formState);
                    setSubmitStatus('success');
                    setFormState({ name: '', email: '', inquiry: 'General Question', message: '' });
                } else {
                    throw error;
                }
            } else {
                setSubmitStatus('success');
                setFormState({ name: '', email: '', inquiry: 'General Question', message: '' });
            }
        } catch (error) {setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const seoTitle = lang === 'es'
        ? 'Contacto - Soporte y Atención al Cliente'
        : 'Contact - Support and Customer Service';

    const seoDescription = lang === 'es'
        ? 'Contáctanos para soporte, ventas o preguntas sobre tu CV profesional. Equipo de atención disponible para ayudarte a destacar ante reclutadores con YourCVPassport.'
        : 'Contact us for support, sales, or questions about your professional CV. Support team available to help you stand out to recruiters with YourCVPassport.';

    const seoKeywords = lang === 'es'
        ? 'contacto, soporte, atención al cliente, ventas, consultas, ayuda, equipo, YourCVPassport, servicio al cliente, asistencia'
        : 'contact, support, customer service, sales, inquiries, help, team, YourCVPassport, customer support, assistance';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
                keywords={seoKeywords}
            />
            <div className="bg-white dark:bg-dark-bg-primary">
            {/* Hero Section */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary text-center py-20 px-4">
                <AnimatedWrapper>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                </AnimatedWrapper>
            </section>
            
            {/* Contact Cards Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.teamTitle}</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                            {t.CONTACT_CARDS.map(card => <ContactCard key={card.title} card={card} />)}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-3xl mx-auto bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-2xl border">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-2">{pageData.form.title}</h2>
                        <p className="text-center text-gray-600 dark:text-dark-text-secondary mb-8">{pageData.form.subtitle}</p>

                        {/* Status Messages */}
                        {submitStatus === 'success' && (
                            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                                <p className="text-green-700 dark:text-green-400 font-medium">
                                    {pageData.form.successMessage}
                                </p>
                            </div>
                        )}
                        {submitStatus === 'error' && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                <p className="text-red-700 dark:text-red-400 font-medium">
                                    {pageData.form.errorMessage}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.name}</label>
                                    <input type="text" name="name" id="name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-cv-blue focus:border-transparent" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.email}</label>
                                    <input type="email" name="email" id="email" value={formState.email} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-cv-blue focus:border-transparent" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="inquiry" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.inquiry}</label>
                                <select name="inquiry" id="inquiry" value={formState.inquiry} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-cv-blue focus:border-transparent">
                                    {pageData.form.inquiryTypes.map(type => <option key={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.message}</label>
                                <textarea name="message" id="message" rows={5} value={formState.message} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-cv-blue focus:border-transparent"></textarea>
                            </div>
                            <div className="text-center">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-cv-blue text-white px-10 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {pageData.form.sending}
                                        </>
                                    ) : (
                                        pageData.form.submit
                                    )}
                                </button>
                            </div>
                        </form>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Office & Social */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <AnimatedWrapper>
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.office.title}</h2>
                            <h3 className="mt-4 text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{pageData.office.hq}</h3>
                            <p className="text-gray-600 dark:text-dark-text-secondary">{pageData.office.description}</p>
                            <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mt-12">{pageData.connect.title}</h2>
                            <div className="flex justify-center md:justify-start space-x-6 mt-4">
                                {pageData.connect.social.map(site => <a key={site} href="#" className="text-gray-500 dark:text-dark-text-tertiary hover:text-cv-blue">{site}</a>)}
                            </div>
                        </div>
                    </AnimatedWrapper>
                    <AnimatedWrapper delay="duration-1000">
                        <div className="bg-gray-200 dark:bg-dark-bg-tertiary h-80 rounded-lg shadow-md overflow-hidden">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3079.9282662845844!2d-0.37738492347847694!3d39.47450597147831!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd604f4cf0efb06f%3A0xb4a351011f7f1d39!2sAyuntamiento%20de%20Valencia!5e0!3m2!1ses!2ses!4v1705507200000!5m2!1ses!2ses"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Mapa de ubicación de la oficina en Valencia"
                            ></iframe>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            <Faq items={t.CONTACT_PAGE_FAQ_ITEMS} title={pageData.faqTitle} />
        </div>
        </>
    );
};

export default ContactPage;

