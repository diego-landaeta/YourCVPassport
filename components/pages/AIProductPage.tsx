import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useTranslations } from '../../hooks/useTranslations';
import PageSEO from '../shared/PageSEO';
import InlineCTA from '../landing/InlineCTA';
import { useLanguage } from '../../contexts/LanguageContext';

const AnimatedWrapper: React.FC<{children: React.ReactNode, threshold?: number, delay?: string}> = ({ children, threshold = 0.1, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const BeforeAfterExample: React.FC<{ before: string; after: string; title: string; beforeLabel: string; afterLabel: string }> = ({ before, after, title, beforeLabel, afterLabel }) => (
    <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary mb-4">{title}</h3>
        <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">{beforeLabel}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{before}</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">{afterLabel}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{after}</p>
            </div>
        </div>
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; example?: React.ReactNode }> = ({ icon, title, description, example }) => (
    <div className="bg-white dark:bg-dark-bg-secondary p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 h-full">
        <div className="flex items-center mb-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-cv-blue/10 mr-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">{description}</p>
        {example && <div className="mt-4">{example}</div>}
    </div>
);

const TestimonialCard: React.FC<{ name: string; role: string; company: string; text: string; avatar: string }> = ({ name, role, company, text, avatar }) => (
    <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-cv-blue text-white flex items-center justify-center font-bold text-lg mr-4">
                {avatar}
            </div>
            <div>
                <h4 className="font-semibold text-cv-dark-gray dark:text-dark-text-primary">{name}</h4>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{role} • {company}</p>
            </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 italic">"{text}"</p>
    </div>
);

const AIProductPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const { lang } = useLanguage();

    const seoTitle = lang === 'es'
        ? 'IA que potencia tu perfil profesional - YourCVPassport'
        : 'AI that powers your professional profile - YourCVPassport';

    const seoDescription = lang === 'es'
        ? 'Descubre cómo nuestra IA optimiza tu CV automáticamente: mejora descripciones, genera summaries profesionales, sugiere skills relevantes y valida la calidad de tu perfil.'
        : 'Discover how our AI optimizes your CV automatically: improves descriptions, generates professional summaries, suggests relevant skills and validates your profile quality.';

    const seoKeywords = lang === 'es'
        ? 'IA CV, inteligencia artificial, optimización CV, generador summary, sugerencias skills, ATS optimization, YourCVPassport'
        : 'AI CV, artificial intelligence, CV optimization, summary generator, skills suggestions, ATS optimization, YourCVPassport';

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
                <section className="bg-gradient-to-br from-cv-blue to-purple-600 text-white text-center py-20 px-4">
                    <AnimatedWrapper>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                            {t.aiProductPage.heroTitle}
                        </h1>
                        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-white/90">
                            {t.aiProductPage.heroSubtitle}
                        </p>
                        <button
                            onClick={() => openModal('signup')}
                            className="mt-8 bg-white text-cv-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            {t.aiProductPage.heroCta}
                        </button>
                    </AnimatedWrapper>
                </section>

                {/* Features with Visual Examples */}
                <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                    <div className="max-w-7xl mx-auto">
                        <AnimatedWrapper>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                    {t.aiProductPage.featuresTitle}
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {t.aiProductPage.featuresSubtitle}
                                </p>
                            </div>
                        </AnimatedWrapper>

                        {/* Feature 1: Optimization of descriptions */}
                        <AnimatedWrapper>
                            <div className="mb-16">
                                <FeatureCard
                                    icon={
                                        <svg className="w-6 h-6 text-cv-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                    }
                                    title={t.aiProductPage.feature1Title}
                                    description={t.aiProductPage.feature1Description}
                                    example={
                                        <BeforeAfterExample
                                            title={t.aiProductPage.feature1ExampleTitle}
                                            before={t.aiProductPage.feature1Before}
                                            after={t.aiProductPage.feature1After}
                                            beforeLabel={t.aiProductPage.beforeLabel}
                                            afterLabel={t.aiProductPage.afterLabel}
                                        />
                                    }
                                />
                            </div>
                        </AnimatedWrapper>

                        {/* Feature 2: Summary Generation */}
                        <AnimatedWrapper delay="duration-1000">
                            <div className="mb-16">
                                <FeatureCard
                                    icon={
                                        <svg className="w-6 h-6 text-cv-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    }
                                    title={t.aiProductPage.feature2Title}
                                    description={t.aiProductPage.feature2Description}
                                    example={
                                        <BeforeAfterExample
                                            title={t.aiProductPage.feature2ExampleTitle}
                                            before={t.aiProductPage.feature2Before}
                                            after={t.aiProductPage.feature2After}
                                            beforeLabel={t.aiProductPage.beforeLabel}
                                            afterLabel={t.aiProductPage.afterLabel}
                                        />
                                    }
                                />
                            </div>
                        </AnimatedWrapper>

                        {/* Feature 3: Skills Suggestions */}
                        <AnimatedWrapper delay="duration-1200">
                            <div className="mb-16">
                                <FeatureCard
                                    icon={
                                        <svg className="w-6 h-6 text-cv-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                        </svg>
                                    }
                                    title={t.aiProductPage.feature3Title}
                                    description={t.aiProductPage.feature3Description}
                                    example={
                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                                            <p className="text-sm font-semibold text-cv-dark-gray dark:text-dark-text-primary mb-3">
                                                {t.aiProductPage.feature3SuggestionsLabel}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {['TypeScript', 'Docker', 'CI/CD', 'GraphQL', 'Microservices', 'Jest', 'Agile', 'Leadership'].map(skill => (
                                                    <span key={skill} className="bg-cv-blue text-white px-3 py-1 rounded-full text-sm font-medium">
                                                        {skill} ✨
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        </AnimatedWrapper>

                        {/* Feature 4: Quality Checklist */}
                        <AnimatedWrapper delay="duration-1400">
                            <div className="mb-16">
                                <FeatureCard
                                    icon={
                                        <svg className="w-6 h-6 text-cv-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                        </svg>
                                    }
                                    title={t.aiProductPage.feature4Title}
                                    description={t.aiProductPage.feature4Description}
                                    example={
                                        <div className="bg-white dark:bg-dark-bg-primary border-2 border-cv-blue/20 p-4 rounded-lg space-y-2">
                                            {[
                                                { text: t.aiProductPage.checklistItem1, done: true },
                                                { text: t.aiProductPage.checklistItem2, done: true },
                                                { text: t.aiProductPage.checklistItem3, done: true },
                                                { text: t.aiProductPage.checklistItem4, done: false },
                                                { text: t.aiProductPage.checklistItem5, done: false },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center">
                                                    {item.done ? (
                                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                                                        </svg>
                                                    )}
                                                    <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-cv-dark-gray dark:text-dark-text-primary'}`}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-cv-dark-gray dark:text-dark-text-primary">
                                                        {t.aiProductPage.profileQuality}
                                                    </span>
                                                    <span className="text-lg font-bold text-cv-blue">75%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                    <div className="bg-cv-blue h-2 rounded-full" style={{ width: '75%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        </AnimatedWrapper>
                    </div>
                </section>

                {/* Mid-page CTA */}
                <div className="px-4">
                    <div className="max-w-7xl mx-auto">
                        <InlineCTA
                            title={t.aiProductPage.midCtaTitle}
                            description={t.aiProductPage.midCtaDescription}
                            buttonText={t.aiProductPage.midCtaButton}
                            variant="gradient"
                        />
                    </div>
                </div>


                {/* Testimonials */}
                <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                    <div className="max-w-7xl mx-auto">
                        <AnimatedWrapper>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                    {t.aiProductPage.testimonialsTitle}
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {t.aiProductPage.testimonialsSubtitle}
                                </p>
                            </div>
                        </AnimatedWrapper>

                        <div className="grid md:grid-cols-3 gap-8">
                            <AnimatedWrapper>
                                <TestimonialCard
                                    name={t.aiProductPage.testimonial1Name}
                                    role={t.aiProductPage.testimonial1Role}
                                    company="Tech Corp"
                                    avatar="MG"
                                    text={t.aiProductPage.testimonial1Text}
                                />
                            </AnimatedWrapper>
                            <AnimatedWrapper delay="duration-1000">
                                <TestimonialCard
                                    name={t.aiProductPage.testimonial2Name}
                                    role={t.aiProductPage.testimonial2Role}
                                    company="StartupXYZ"
                                    avatar="CR"
                                    text={t.aiProductPage.testimonial2Text}
                                />
                            </AnimatedWrapper>
                            <AnimatedWrapper delay="duration-1200">
                                <TestimonialCard
                                    name={t.aiProductPage.testimonial3Name}
                                    role={t.aiProductPage.testimonial3Role}
                                    company="Design Studio"
                                    avatar="AM"
                                    text={t.aiProductPage.testimonial3Text}
                                />
                            </AnimatedWrapper>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="bg-gradient-to-r from-cv-blue to-purple-600 text-white py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <AnimatedWrapper>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                {t.aiProductPage.finalCtaTitle}
                            </h2>
                            <p className="text-lg md:text-xl text-white/90 mb-8">
                                {t.aiProductPage.finalCtaSubtitle}
                            </p>
                            <button
                                onClick={() => openModal('signup')}
                                className="bg-white text-cv-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                {t.aiProductPage.finalCtaButton}
                            </button>
                            <p className="mt-4 text-sm text-white/80">
                                {t.aiProductPage.finalCtaNote}
                            </p>
                        </AnimatedWrapper>
                    </div>
                </section>
            </div>
        </>
    );
};

export default AIProductPage;
