import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { ChangelogChangeType } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Modal from './ui/Modal';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const getChangeTypeColor = (type: ChangelogChangeType) => {
    switch (type) {
        case 'New Feature': return 'bg-cv-green/10 dark:bg-cv-green/20 text-cv-green dark:text-cv-green';
        case 'Improvement': return 'bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue dark:text-cv-blue-light';
        case 'Bug Fix': return 'bg-yellow-400/10 dark:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400';
        default: return 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-800 dark:text-dark-text-primary';
    }
};

const SystemStatusPage: React.FC = () => {
    const { openModal } = useAuth();
    const { lang } = useLanguage();
    const [email, setEmail] = useState('');
    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
    const t = useTranslations();
    const pageData = t.statusPage;

    const seoTitle = lang === 'es'
        ? 'Estado del Sistema'
        : 'System Status';
    const seoDescription = lang === 'es'
        ? 'Monitoreo en tiempo real del estado de YourCVPassport. Uptime, métricas de rendimiento, historial de incidentes y notificaciones de mantenimiento programado.'
        : 'Real-time monitoring of YourCVPassport status. Uptime, performance metrics, incident history and scheduled maintenance notifications.';

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            alert(`${pageData.subscribe.alert}, ${email}!`);
            setEmail('');
        }
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
                    <div className="mt-8 inline-flex items-center gap-3 bg-cv-green/10 text-cv-green border-2 border-cv-green/20 font-bold px-8 py-4 rounded-xl text-lg shadow-lg">
                        <div className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cv-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-cv-green"></span>
                        </div>
                        {pageData.operational}
                    </div>
                </AnimatedWrapper>
            </section>

            {/* No Incidents Banner - Highlighted Section */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <AnimatedWrapper>
                        <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-10">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-green-200 dark:bg-green-800 rounded-full opacity-20"></div>
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-emerald-200 dark:bg-emerald-800 rounded-full opacity-20"></div>
                            <div className="relative flex items-center justify-center gap-6">
                                <div className="flex-shrink-0 w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-extrabold text-green-800 dark:text-green-400">{pageData.incidents.noIncidents}</p>
                                    <p className="text-lg text-green-700 dark:text-green-500 mt-2 font-medium">Sistema operando con normalidad</p>
                                </div>
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Current Status Grid */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.healthTitle}</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {t.SYSTEM_STATUS_ITEMS.map(item => (
                                <div key={item.name} className="bg-white dark:bg-dark-bg-primary p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow duration-300 flex justify-between items-center">
                                    <span className="font-semibold text-gray-700 dark:text-dark-text-secondary">{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cv-green opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cv-green"></span>
                                        </div>
                                        <span className="text-cv-green font-semibold">{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* Uptime and Changelog Section */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
                    {/* Uptime */}
                    <aside className="lg:col-span-4">
                         <AnimatedWrapper>
                            <div className="sticky top-24 space-y-8">
                                <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-lg">
                                    <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-6">{pageData.uptimeTitle}</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-baseline"><p>{pageData.uptime.day}</p><p className="font-bold text-2xl text-cv-green">{t.UPTIME_STATS.day}</p></div>
                                        <div className="flex justify-between items-baseline"><p>{pageData.uptime.week}</p><p className="font-bold text-2xl text-cv-green">{t.UPTIME_STATS.week}</p></div>
                                        <div className="flex justify-between items-baseline"><p>{pageData.uptime.month}</p><p className="font-bold text-2xl text-cv-green">{t.UPTIME_STATS.month}</p></div>
                                    </div>
                                </div>
                                 <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-lg">
                                    <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-4">{pageData.subscribe.title}</h3>
                                    <p className="text-gray-600 dark:text-dark-text-secondary mb-4">{pageData.subscribe.description}</p>
                                     <form onSubmit={handleSubscribe} className="space-y-3">
                                        <input 
                                            type="email" 
                                            placeholder={pageData.subscribe.placeholder} 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full p-2 border rounded-md" />
                                        <button type="submit" className="w-full bg-cv-blue text-white font-bold py-2 rounded-md hover:bg-opacity-90">{pageData.subscribe.button}</button>
                                     </form>
                                </div>
                            </div>
                        </AnimatedWrapper>
                    </aside>
                    {/* Changelog */}
                    <main className="lg:col-span-8">
                        <AnimatedWrapper delay="duration-900">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-16">{pageData.changelogTitle}</h2>
                            <div className="space-y-6">
                                {t.CHANGELOG_ENTRIES.map((entry, index) => (
                                    <div
                                        key={entry.version}
                                        className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                                        onClick={() => setSelectedVersion(index)}
                                    >
                                        <div className="bg-gradient-to-r from-cv-blue/5 to-purple-500/5 dark:from-cv-blue/10 dark:to-purple-500/10 px-8 py-6 flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-3 h-3 bg-cv-blue rounded-full shadow-md"></div>
                                                    <p className="text-xs font-bold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-widest">{entry.date}</p>
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                                                    {pageData.version} {entry.version}
                                                </h3>
                                                <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                                                    {entry.changes.length} {entry.changes.length === 1 ? 'cambio' : 'cambios'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-cv-blue group-hover:translate-x-1 transition-transform">
                                                <span className="font-semibold text-sm">{lang === 'es' ? 'Ver detalles' : 'View details'}</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AnimatedWrapper>
                    </main>
                </div>
            </section>
            
             {/* Upcoming Features */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.roadmapTitle}</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {t.ROADMAP_ITEMS.map(item => (
                                <div key={item.title} className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-lg border">
                                    <p className="font-semibold text-cv-blue">{item.quarter}</p>
                                    <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary mt-2">{item.title}</h3>
                                    <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Incident History */}
             <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-6xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-4">{pageData.historyTitle}</h2>
                            <p className="text-lg text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
                                Historial completo de incidentes, mantenimientos y actualizaciones del sistema
                            </p>
                        </div>

                        <div className="grid gap-6">
                            {/* Incident 1 */}
                            <div className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-white dark:from-green-900/10 dark:to-dark-bg-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.incidents.latency}</h3>
                                                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                                                    {pageData.dates.june15} • Duración: 45 minutos
                                                </p>
                                                <p className="mt-3 text-gray-700 dark:text-dark-text-secondary">
                                                    Se identificó y resolvió un problema de latencia temporal en la API que afectaba a un subconjunto de usuarios en la región EU-West.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                            {pageData.incidentStatus.resolved}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Incident 2 */}
                            <div className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-dark-bg-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{pageData.incidents.maintenance}</h3>
                                                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                                                    {pageData.dates.may30} • Ventana: 02:00 - 04:00 UTC
                                                </p>
                                                <p className="mt-3 text-gray-700 dark:text-dark-text-secondary">
                                                    Actualización programada de infraestructura para mejorar el rendimiento y la seguridad. Se implementaron nuevas optimizaciones de base de datos.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                            {pageData.incidentStatus.completed}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Incident 3 - New */}
                            <div className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-white dark:from-green-900/10 dark:to-dark-bg-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">Error de Autenticación OAuth</h3>
                                                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                                                    15 de octubre de 2025 • Duración: 2 horas
                                                </p>
                                                <p className="mt-3 text-gray-700 dark:text-dark-text-secondary">
                                                    Problema con el proveedor de autenticación OAuth que impedía el inicio de sesión a algunos usuarios. Se solucionó actualizando las credenciales y renovando los certificados SSL.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                            Resuelto
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Incident 4 - New */}
                            <div className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-dark-bg-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">Actualización de Seguridad v2.1.0</h3>
                                                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                                                    5 de octubre de 2025 • Ventana: 01:00 - 03:30 UTC
                                                </p>
                                                <p className="mt-3 text-gray-700 dark:text-dark-text-secondary">
                                                    Despliegue de parches de seguridad críticos y actualización del sistema de verificación blockchain. Mejoras en la encriptación de datos end-to-end.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                            Completado
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Incident 5 - New */}
                            <div className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-white dark:from-green-900/10 dark:to-dark-bg-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">Lentitud en Generación de PDFs</h3>
                                                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                                                    20 de septiembre de 2025 • Duración: 1 hora 15 minutos
                                                </p>
                                                <p className="mt-3 text-gray-700 dark:text-dark-text-secondary">
                                                    Degradación del rendimiento en el servicio de generación de CVs en formato PDF. Se escalaron recursos del servidor y optimizó el proceso de renderizado.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                            Resuelto
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Incident 6 - New */}
                            <div className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-dark-bg-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">Migración de Base de Datos</h3>
                                                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                                                    5 de septiembre de 2025 • Ventana: 00:00 - 05:00 UTC
                                                </p>
                                                <p className="mt-3 text-gray-700 dark:text-dark-text-secondary">
                                                    Migración exitosa a nueva infraestructura de base de datos con mayor capacidad y redundancia. Mejora significativa en tiempos de respuesta (reducción del 40%).
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 ml-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                            Completado
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            </div>

            {/* Changelog Detail Modal */}
            {selectedVersion !== null && (
                <Modal
                    isOpen={selectedVersion !== null}
                    onClose={() => setSelectedVersion(null)}
                    title={`${pageData.version} ${t.CHANGELOG_ENTRIES[selectedVersion].version}`}
                    maxWidth="4xl"
                >
                    <div className="p-8">
                        {/* Date Badge */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-cv-blue rounded-full shadow-md"></div>
                            <p className="text-sm font-bold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-widest">
                                {t.CHANGELOG_ENTRIES[selectedVersion].date}
                            </p>
                        </div>

                        {/* Changes List */}
                        <div className="space-y-4">
                            {t.CHANGELOG_ENTRIES[selectedVersion].changes.map((change, changeIndex) => (
                                <div
                                    key={changeIndex}
                                    className="group hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary rounded-xl px-6 py-5 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className={`flex-shrink-0 text-xs font-bold px-4 py-1.5 rounded-full ${getChangeTypeColor(change.type)} shadow-sm whitespace-nowrap`}>
                                            {t.changelogTypes[change.type]}
                                        </span>
                                        <p className="text-base text-gray-700 dark:text-dark-text-secondary flex-1 leading-relaxed">
                                            {change.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default SystemStatusPage;

