import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { PressRelease, Executive } from '../../types';
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

// Activos descargables (public/press/). Se generan con el script build-press-kit.cjs
// (ver informe de QA): logo vectorial del logotipo de la cabecera, icono "Y" y ZIP con guia de marca.
const PRESS_ASSETS = {
    kit: { href: '/press/yourcvpassport-press-kit.zip', file: 'yourcvpassport-press-kit.zip' },
    logo: { href: '/press/yourcvpassport-logo.svg', file: 'yourcvpassport-logo.svg', format: 'SVG' },
    icon: { href: '/press/yourcvpassport-icon.png', file: 'yourcvpassport-icon.png', format: 'PNG · 512 × 512' },
};

// Colores reales de marca (tailwind.config.js: cv-blue, cv-dark-gray, cv-light-gray, cv-green).
const BRAND_SWATCHES = [
    { hex: '#2563EB', className: 'bg-cv-blue text-white' },
    { hex: '#1F2937', className: 'bg-cv-dark-gray text-white dark:border dark:border-dark-border-light' },
    { hex: '#F8F9FA', className: 'bg-cv-light-gray text-gray-900 border border-gray-200 dark:border-dark-border' },
    { hex: '#10B981', className: 'bg-cv-green text-gray-900' },
];

// Los comunicados no tienen pagina propia todavia: se muestran sin enlace "Leer mas"
// (antes apuntaba a href="#"). Si se publican, anadir una URL al tipo PressRelease.
const PressReleaseCard: React.FC<{ release: PressRelease }> = ({ release }) => {
    return (
        <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-border hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{release.date}</p>
            <h3 className="mt-2 text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{release.title}</h3>
            <p className="mt-3 text-gray-600 dark:text-dark-text-secondary">{release.summary}</p>
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
    const [formMailto, setFormMailto] = useState('');
    const PRESS_EMAIL = 'press@yourcvpassport.com';

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

    // PENDIENTE: no hay endpoint de contacto de prensa (ni tabla ni Edge Function) en el repo.
    // Mientras tanto se prepara la consulta como correo (mailto) a press@ y se ofrece un enlace
    // explicito para abrirla; no se navega solo ni se finge un envio.
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const f = pageData.form;
        const body = [
            `${f.name}: ${formState.name}`,
            `${f.outlet}: ${formState.outlet}`,
            `${f.email}: ${formState.email}`,
            '',
            formState.message,
        ].join('\n');
        setFormMailto(`mailto:${PRESS_EMAIL}?subject=${encodeURIComponent(`${f.mailSubject} - ${formState.outlet}`)}&body=${encodeURIComponent(body)}`);
    };

    const downloadBtn = 'inline-flex items-center gap-2 bg-cv-blue text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-cv-blue-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary';

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
                        <a href={PRESS_ASSETS.kit.href} download={PRESS_ASSETS.kit.file} data-testid="press-download-kit" className="w-full sm:w-auto bg-cv-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-colors shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary">{pageData.cta.download} <span className="text-base font-normal opacity-90">(ZIP)</span></a>
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
                                <h3 className="text-2xl font-semibold mb-6 text-cv-dark-gray dark:text-dark-text-primary">{pageData.assets.logoDownloads}</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: pageData.assets.primary, asset: PRESS_ASSETS.logo, preview: '/press/yourcvpassport-logo.svg', testId: 'press-download-logo' },
                                        { label: pageData.assets.icon, asset: PRESS_ASSETS.icon, preview: '/press/yourcvpassport-icon.svg', testId: 'press-download-icon' },
                                    ].map(item => (
                                        <div key={item.asset.file} className="bg-white dark:bg-dark-bg-primary p-4 rounded-lg shadow border border-gray-200 dark:border-dark-border flex flex-wrap justify-between items-center gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="h-12 w-28 flex items-center justify-center rounded bg-white border border-gray-100 dark:border-dark-border p-1">
                                                    <img src={item.preview} alt="" className="max-h-full max-w-full" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-cv-dark-gray dark:text-dark-text-primary">{item.label}</p>
                                                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">{item.asset.format}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={item.asset.href}
                                                download={item.asset.file}
                                                data-testid={item.testId}
                                                aria-label={`${pageData.assets.download} ${item.label} (${item.asset.format})`}
                                                className={downloadBtn}
                                            >
                                                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                                                {pageData.assets.download}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Guidelines */}
                            <div>
                                <h3 className="text-2xl font-semibold mb-6 text-cv-dark-gray dark:text-dark-text-primary">{pageData.assets.colors}</h3>
                                <ul className="flex flex-wrap gap-4" data-testid="press-brand-colors">
                                    {BRAND_SWATCHES.map(swatch => (
                                        <li key={swatch.hex} className={`w-16 h-16 rounded-lg shadow-inner flex items-center justify-center text-xs font-semibold text-center ${swatch.className}`}>
                                            {swatch.hex}
                                        </li>
                                    ))}
                                </ul>
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
                        <div role="status" aria-live="polite">
                            {formMailto && (
                                <div className="mb-6 p-4 bg-cv-blue/10 border-l-4 border-cv-blue rounded text-cv-dark-gray dark:text-dark-text-primary">
                                    <p>{pageData.form.mailNotice} {PRESS_EMAIL}</p>
                                    <a
                                        href={formMailto}
                                        className="mt-3 inline-flex items-center gap-2 bg-cv-blue text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-cv-blue-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary"
                                    >
                                        {pageData.form.openMail}
                                    </a>
                                </div>
                            )}
                        </div>
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

