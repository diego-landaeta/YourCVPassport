import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { PressRelease, Executive } from '../types';
import { useTranslations } from '../../hooks/useTranslations';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const PressReleaseCard: React.FC<{ release: PressRelease }> = ({ release }) => {
    const t = useTranslations();
    return (
        <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{release.date}</p>
            <h3 className="mt-2 text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{release.title}</h3>
            <p className="mt-3 text-gray-600 dark:text-dark-text-secondary">{release.summary}</p>
            <a href="#" className="mt-4 inline-block font-semibold text-cv-blue hover:underline">{t.pressPage.readMore} →</a>
        </div>
    );
};

const ExecutiveCard: React.FC<{ exec: Executive }> = ({ exec }) => (
    <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-lg border text-center">
        <img src={exec.imageUrl} alt={exec.name} className="w-32 h-32 rounded-full mx-auto object-cover mb-4 ring-4 ring-cv-blue/20" />
        <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{exec.name}</h3>
        <p className="text-cv-blue font-semibold">{exec.title}</p>
        <p className="mt-2 text-gray-600 dark:text-dark-text-secondary text-sm">{exec.bio}</p>
    </div>
);

const MediaLogo: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-center justify-center h-20 bg-gray-100 dark:bg-dark-bg-secondary rounded-lg p-4">
      <span className="text-2xl font-bold text-gray-500 dark:text-dark-text-tertiary grayscale opacity-80">{name}</span>
    </div>
);

const PressKitPage: React.FC = () => {
    const { openModal } = useAuth();
    const { lang } = useLanguage();
    const t = useTranslations();
    const pageData = t.pressPage;
    const [formState, setFormState] = useState({ name: '', outlet: '', email: '', message: '' });

    const seoTitle = lang === 'es'
        ? 'Kit de Prensa'
        : 'Press Kit';
    const seoDescription = lang === 'es'
        ? 'Recursos de prensa para medios y periodistas. Logos oficiales, screenshots, información corporativa, comunicados de prensa y contacto de medios de YourCVPassport.'
        : 'Press resources for media and journalists. Official logos, screenshots, corporate information, press releases and media contact for YourCVPassport.';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        const key = id.replace('press-', ''); // e.g. 'press-name' -> 'name'
        setFormState(prevState => ({ ...prevState, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();alert(pageData.form.alert);
        setFormState({ name: '', outlet: '', email: '', message: '' });
    };

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
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
                    <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <a href="#" className="w-full sm:w-auto bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-colors shadow-md">{pageData.cta.download}</a>
                        <a href="#contact" className="w-full sm:w-auto bg-white dark:bg-dark-bg-primary text-cv-blue px-8 py-3 rounded-lg text-lg font-semibold border-2 border-cv-blue hover:bg-cv-blue hover:text-white transition-colors shadow-md">{pageData.cta.contact}</a>
                    </div>
                </AnimatedWrapper>
            </section>

            {/* Press Releases */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.releasesTitle}</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {t.PRESS_RELEASES.map(release => <PressReleaseCard key={release.id} release={release} />)}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Company Facts */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-5xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.factsTitle}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {t.COMPANY_FACTS.map(fact => (
                                <div key={fact.label} className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md">
                                    <div className="flex justify-center mb-3">{fact.icon}</div>
                                    <p className="text-4xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">{fact.value}</p>
                                    <p className="mt-1 text-gray-600 dark:text-dark-text-secondary">{fact.label}</p>
                                </div>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Brand Assets */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.assetsTitle}</h2>
                        <div className="grid md:grid-cols-2 gap-12 items-start">
                            {/* Downloads */}
                            <div>
                                <h3 className="text-2xl font-semibold mb-6">{pageData.assets.logoDownloads}</h3>
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-dark-bg-primary p-4 rounded-lg shadow border flex justify-between items-center"><span className="font-semibold">{pageData.assets.primary}</span> <a href="#" className="bg-cv-blue text-white px-4 py-1 rounded-md text-sm">{pageData.assets.download}</a></div>
                                    <div className="bg-white dark:bg-dark-bg-primary p-4 rounded-lg shadow border flex justify-between items-center"><span className="font-semibold">{pageData.assets.icon}</span> <a href="#" className="bg-cv-blue text-white px-4 py-1 rounded-md text-sm">{pageData.assets.download}</a></div>
                                </div>
                            </div>
                            {/* Guidelines */}
                            <div>
                                <h3 className="text-2xl font-semibold mb-6">{pageData.assets.colors}</h3>
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-lg bg-cv-blue shadow-inner flex items-center justify-center text-white text-xs text-center">#0052FF</div>
                                    <div className="w-16 h-16 rounded-lg bg-cv-dark-gray shadow-inner flex items-center justify-center text-white text-xs text-center">#1A1A2E</div>
                                    <div className="w-16 h-16 rounded-lg bg-cv-light-gray dark:bg-dark-bg-secondary shadow-inner border flex items-center justify-center text-black dark:text-dark-text-primary text-xs text-center">#F8F9FA</div>
                                    <div className="w-16 h-16 rounded-lg bg-cv-green shadow-inner flex items-center justify-center text-white text-xs text-center">#28A745</div>
                                </div>
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Executive Team */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.teamTitle}</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {t.EXECUTIVES.map(exec => <ExecutiveCard key={exec.name} exec={exec} />)}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Media Coverage */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.seenInTitle}</h2>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-8 items-center">
                            {t.MEDIA_COVERAGE.map(media => <MediaLogo key={media.name} name={media.name} />)}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Contact Form */}
            <section id="contact" className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-3xl mx-auto bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-2xl border">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-2">{pageData.contactTitle}</h2>
                        <p className="text-center text-gray-600 dark:text-dark-text-secondary mb-8">{pageData.contactSubtitle} <a href="mailto:press@yourcvpassport.com" className="text-cv-blue font-semibold">press@yourcvpassport.com</a></p>
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="grid md:grid-cols-2 gap-6">
                                <div><label htmlFor="press-name" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.name}</label><input type="text" id="press-name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm" /></div>
                                <div><label htmlFor="press-outlet" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.outlet}</label><input type="text" id="press-outlet" value={formState.outlet} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm" /></div>
                             </div>
                            <div><label htmlFor="press-email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.email}</label><input type="email" id="press-email" value={formState.email} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm" /></div>
                            <div><label htmlFor="press-message" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{pageData.form.message}</label><textarea id="press-message" rows={4} value={formState.message} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-md shadow-sm"></textarea></div>
                            <div className="text-center"><button type="submit" className="bg-cv-blue text-white px-10 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all shadow-lg">{pageData.form.submit}</button></div>
                        </form>
                    </AnimatedWrapper>
                </div>
            </section>
            </div>
        </>
    );
};

export default PressKitPage;

