import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import Testimonials from './Testimonials';
import { ValueItem, MilestoneItem } from '../../types';
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

const ValueCard: React.FC<{ value: ValueItem }> = ({ value }) => (
    <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-lg shadow-lg border border-gray-100 dark:border-dark-border h-full">
        <div className="flex items-center justify-center w-16 h-16 bg-cv-blue/10 rounded-xl mb-4">
            {value.icon}
        </div>
        <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{value.title}</h3>
        <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{value.description}</p>
    </div>
);

const Milestone: React.FC<{ milestone: MilestoneItem; isLast?: boolean }> = ({ milestone, isLast }) => (
    <div className="relative pl-8">
        {!isLast && <div className="absolute top-5 left-[3px] w-0.5 h-full bg-cv-blue/20"></div>}
        <div className="absolute top-2 -left-2 w-4 h-4 bg-cv-blue rounded-full border-4 border-white"></div>
        <p className="font-bold text-cv-blue text-lg">{milestone.year}</p>
        <h4 className="font-bold text-xl text-cv-dark-gray dark:text-dark-text-primary mt-1">{milestone.title}</h4>
        <p className="text-gray-600 dark:text-dark-text-secondary">{milestone.description}</p>
    </div>
);

const MissionAndValuesPage: React.FC = () => {
    const { openModal } = useAuth();
    const { lang } = useLanguage();
    const t = useTranslations();
    const pageData = t.missionPage;

    const seoTitle = lang === 'es'
        ? 'Misión y Valores'
        : 'Mission and Values';

    const seoDescription = lang === 'es'
        ? 'Conoce nuestra misión de democratizar el acceso a oportunidades laborales globales mediante verificación blockchain. Valores de transparencia, innovación y equidad con YourCVPassport.'
        : 'Learn about our mission to democratize access to global job opportunities through blockchain verification. Values of transparency, innovation, and equity with YourCVPassport.';

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
                </AnimatedWrapper>
            </section>

            {/* Problem/Solution */}
            <section className="py-20 px-4 bg-gradient-to-b from-white to-cv-light-gray dark:from-dark-bg-primary dark:to-dark-bg-secondary">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-4">{pageData.problemTitle}</h2>
                            <p className="text-lg md:text-xl text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto">{pageData.problemSubtitle}</p>
                        </div>
                    </AnimatedWrapper>

                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        <AnimatedWrapper>
                            <div className="relative group h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-white dark:bg-dark-bg-primary p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-red-500 h-full">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-red-800 dark:text-red-400">{pageData.problem.title}</h3>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 dark:text-dark-text-secondary leading-relaxed">{pageData.problem.description}</p>
                                    <div className="mt-6 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                        </svg>
                                        <span>Status Actual</span>
                                    </div>
                                </div>
                            </div>
                        </AnimatedWrapper>

                        <AnimatedWrapper delay="duration-1000">
                            <div className="relative group h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-white dark:bg-dark-bg-primary p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-green-500 h-full">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-green-800 dark:text-green-400">{pageData.solution.title}</h3>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 dark:text-dark-text-secondary leading-relaxed">{pageData.solution.description}</p>
                                    <div className="mt-6 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-semibold">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                        </svg>
                                        <span>Nuestra Solución</span>
                                    </div>
                                </div>
                            </div>
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>
            
            {/* Vision Statement */}
            <section className="py-20 px-4 bg-cv-dark-gray text-white text-center">
                <AnimatedWrapper>
                    <h2 className="text-3xl md:text-4xl font-bold">{pageData.visionTitle}</h2>
                    <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300">
                        {pageData.visionDescription}
                    </p>
                </AnimatedWrapper>
            </section>
            
            {/* Core Values */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.valuesTitle}</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {t.CORE_VALUES.map(value => <ValueCard key={value.title} value={value} />)}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Impact Statistics */}
            <section className="py-20 px-4 text-center">
                 <AnimatedWrapper>
                     <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-10">{pageData.goal}</h2>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div><p className="text-4xl font-extrabold text-cv-blue">10,000+</p><p className="mt-2 font-semibold">{pageData.stats.verified}</p></div>
                        <div><p className="text-4xl font-extrabold text-cv-blue">98%</p><p className="mt-2 font-semibold">{pageData.stats.trustScore}</p></div>
                        <div><p className="text-4xl font-extrabold text-cv-blue">50+</p><p className="mt-2 font-semibold">{pageData.stats.countries}</p></div>
                     </div>
                </AnimatedWrapper>
            </section>
            
            {/* Timeline */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                 <div className="max-w-4xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-16">{pageData.journeyTitle}</h2>
                        <div className="space-y-12">
                            {t.COMPANY_MILESTONES.map((milestone, index) => (
                                <Milestone key={milestone.year} milestone={milestone} isLast={index === t.COMPANY_MILESTONES.length - 1} />
                            ))}
                        </div>
                    </AnimatedWrapper>
                 </div>
            </section>

            <Testimonials title={pageData.testimonialsTitle} testimonials={t.MISSION_TESTIMONIALS} />

            {/* CTA */}
            <section className="bg-cv-blue">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                           {pageData.finalCta.title}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                           {pageData.finalCta.subtitle}
                        </p>
                        <button onClick={() => openModal('signup')} className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary sm:w-auto transform hover:scale-105 transition-transform">
                            {pageData.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
            </div>
        </>
    );
};

export default MissionAndValuesPage;