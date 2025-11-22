import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

const AnimatedWrapper: React.FC<{children: React.ReactNode, threshold?: number, delay?: string}> = ({ children, threshold = 0.1, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const BeforeAfterExample: React.FC<{ before: string; after: string; title: string }> = ({ before, after, title }) => (
    <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-cv-dark-gray dark:text-dark-text-primary mb-4">{title}</h3>
        <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">Antes</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{before}</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">Después (con IA)</span>
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
                            {lang === 'es' ? 'IA que potencia tu perfil profesional' : 'AI that powers your professional profile'}
                        </h1>
                        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-white/90">
                            {lang === 'es'
                                ? 'Transforma tu CV en una herramienta profesional optimizada con el poder de la inteligencia artificial. Mejora automática, sugerencias inteligentes y análisis de calidad en tiempo real.'
                                : 'Transform your CV into an optimized professional tool with the power of artificial intelligence. Automatic improvement, smart suggestions and real-time quality analysis.'}
                        </p>
                        <button
                            onClick={() => openModal('signup')}
                            className="mt-8 bg-white text-cv-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            {lang === 'es' ? 'Optimizar mi perfil con IA' : 'Optimize my profile with AI'}
                        </button>
                    </AnimatedWrapper>
                </section>

                {/* Features with Visual Examples */}
                <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                    <div className="max-w-7xl mx-auto">
                        <AnimatedWrapper>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                    {lang === 'es' ? 'Funcionalidades de IA' : 'AI Features'}
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {lang === 'es'
                                        ? 'Descubre cómo la IA mejora cada aspecto de tu CV profesional'
                                        : 'Discover how AI improves every aspect of your professional CV'}
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
                                    title={lang === 'es' ? 'Optimización de descripciones' : 'Description Optimization'}
                                    description={lang === 'es'
                                        ? 'La IA analiza y mejora automáticamente las descripciones de tu experiencia laboral para hacerlas más impactantes y profesionales, optimizadas para ATS.'
                                        : 'AI analyzes and automatically improves your work experience descriptions to make them more impactful and professional, ATS-optimized.'}
                                    example={
                                        <BeforeAfterExample
                                            title={lang === 'es' ? 'Ejemplo: Descripción de puesto' : 'Example: Job Description'}
                                            before={lang === 'es'
                                                ? 'Trabajé en proyectos de desarrollo web y ayudé al equipo con varias tareas.'
                                                : 'Worked on web development projects and helped the team with various tasks.'}
                                            after={lang === 'es'
                                                ? 'Lideré el desarrollo full-stack de 5+ aplicaciones web empresariales, implementando arquitecturas escalables con React y Node.js que mejoraron la eficiencia operativa en un 40%. Colaboré con equipos multifuncionales en metodología ágil para entregar soluciones de alta calidad.'
                                                : 'Led full-stack development of 5+ enterprise web applications, implementing scalable architectures with React and Node.js that improved operational efficiency by 40%. Collaborated with cross-functional teams in agile methodology to deliver high-quality solutions.'}
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
                                    title={lang === 'es' ? 'Generación de Summary Profesional' : 'Professional Summary Generation'}
                                    description={lang === 'es'
                                        ? 'Genera automáticamente un resumen profesional convincente que destaque tus fortalezas, experiencia y valor único en 2-3 párrafos impactantes.'
                                        : 'Automatically generates a compelling professional summary that highlights your strengths, experience and unique value in 2-3 impactful paragraphs.'}
                                    example={
                                        <BeforeAfterExample
                                            title={lang === 'es' ? 'Ejemplo: Summary profesional' : 'Example: Professional Summary'}
                                            before={lang === 'es'
                                                ? 'Desarrollador con experiencia en programación. Me gusta trabajar en equipo.'
                                                : 'Developer with programming experience. I like working in teams.'}
                                            after={lang === 'es'
                                                ? 'Ingeniero de Software Full-Stack con 5+ años de experiencia construyendo aplicaciones web escalables para empresas Fortune 500. Especializado en React, Node.js y arquitecturas cloud (AWS). Reconocido por liderar equipos técnicos y entregar proyectos complejos 30% más rápido que el promedio de la industria, con un enfoque en código limpio y mejores prácticas.'
                                                : 'Full-Stack Software Engineer with 5+ years of experience building scalable web applications for Fortune 500 companies. Specialized in React, Node.js and cloud architectures (AWS). Recognized for leading technical teams and delivering complex projects 30% faster than industry average, with a focus on clean code and best practices.'}
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
                                    title={lang === 'es' ? 'Sugerencias de Skills' : 'Skills Suggestions'}
                                    description={lang === 'es'
                                        ? 'Recibe recomendaciones inteligentes de habilidades técnicas y blandas relevantes para tu industria y rol, basadas en análisis de miles de perfiles exitosos.'
                                        : 'Receive intelligent recommendations for technical and soft skills relevant to your industry and role, based on analysis of thousands of successful profiles.'}
                                    example={
                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                                            <p className="text-sm font-semibold text-cv-dark-gray dark:text-dark-text-primary mb-3">
                                                {lang === 'es' ? 'Sugerencias basadas en tu perfil:' : 'Suggestions based on your profile:'}
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
                                    title={lang === 'es' ? 'Checklist de Calidad' : 'Quality Checklist'}
                                    description={lang === 'es'
                                        ? 'Análisis en tiempo real de la calidad de tu CV con recomendaciones accionables para mejorar cada sección y aumentar tus posibilidades de éxito.'
                                        : 'Real-time analysis of your CV quality with actionable recommendations to improve each section and increase your chances of success.'}
                                    example={
                                        <div className="bg-white dark:bg-dark-bg-primary border-2 border-cv-blue/20 p-4 rounded-lg space-y-2">
                                            {[
                                                { text: lang === 'es' ? 'Foto profesional agregada' : 'Professional photo added', done: true },
                                                { text: lang === 'es' ? 'Summary optimizado para ATS' : 'ATS-optimized summary', done: true },
                                                { text: lang === 'es' ? '3+ años de experiencia documentados' : '3+ years of experience documented', done: true },
                                                { text: lang === 'es' ? 'Agregar al menos 2 certificaciones' : 'Add at least 2 certifications', done: false },
                                                { text: lang === 'es' ? 'Incluir enlaces a portfolio/GitHub' : 'Include portfolio/GitHub links', done: false },
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
                                                        {lang === 'es' ? 'Calidad del perfil:' : 'Profile quality:'}
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

                {/* Demo Video Section (Optional) */}
                <section className="py-20 px-4 bg-white dark:bg-dark-bg-primary">
                    <div className="max-w-5xl mx-auto">
                        <AnimatedWrapper>
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                    {lang === 'es' ? 'Ve la IA en acción' : 'See AI in action'}
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {lang === 'es'
                                        ? 'Descubre cómo transformar tu CV en minutos'
                                        : 'Discover how to transform your CV in minutes'}
                                </p>
                            </div>
                            <div className="relative bg-gradient-to-br from-cv-blue/10 to-purple-600/10 rounded-lg overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-cv-blue rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"></path>
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 dark:text-dark-text-secondary">
                                            {lang === 'es' ? 'Video demo próximamente' : 'Demo video coming soon'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AnimatedWrapper>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                    <div className="max-w-7xl mx-auto">
                        <AnimatedWrapper>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                                    {lang === 'es' ? 'Lo que dicen nuestros usuarios' : 'What our users say'}
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {lang === 'es'
                                        ? 'Miles de profesionales han transformado sus CVs con nuestra IA'
                                        : 'Thousands of professionals have transformed their CVs with our AI'}
                                </p>
                            </div>
                        </AnimatedWrapper>

                        <div className="grid md:grid-cols-3 gap-8">
                            <AnimatedWrapper>
                                <TestimonialCard
                                    name={lang === 'es' ? 'María García' : 'Maria Garcia'}
                                    role={lang === 'es' ? 'Ingeniera de Software' : 'Software Engineer'}
                                    company="Tech Corp"
                                    avatar="MG"
                                    text={lang === 'es'
                                        ? 'La IA transformó mi CV en algo realmente profesional. Recibí 3 ofertas de trabajo en las primeras dos semanas después de optimizarlo.'
                                        : 'The AI transformed my CV into something truly professional. I received 3 job offers in the first two weeks after optimizing it.'}
                                />
                            </AnimatedWrapper>
                            <AnimatedWrapper delay="duration-1000">
                                <TestimonialCard
                                    name={lang === 'es' ? 'Carlos Rodríguez' : 'Carlos Rodriguez'}
                                    role={lang === 'es' ? 'Gerente de Producto' : 'Product Manager'}
                                    company="StartupXYZ"
                                    avatar="CR"
                                    text={lang === 'es'
                                        ? 'Las sugerencias de skills fueron increíbles. Agregué competencias que no sabía que eran importantes para mi industria y ahora paso todos los filtros ATS.'
                                        : 'The skills suggestions were amazing. I added competencies I didn\'t know were important for my industry and now I pass all ATS filters.'}
                                />
                            </AnimatedWrapper>
                            <AnimatedWrapper delay="duration-1200">
                                <TestimonialCard
                                    name={lang === 'es' ? 'Ana Martínez' : 'Ana Martinez'}
                                    role={lang === 'es' ? 'Diseñadora UX' : 'UX Designer'}
                                    company="Design Studio"
                                    avatar="AM"
                                    text={lang === 'es'
                                        ? 'El checklist de calidad me ayudó a identificar exactamente qué faltaba en mi CV. En 30 minutos tenía un perfil completo y profesional.'
                                        : 'The quality checklist helped me identify exactly what was missing from my CV. In 30 minutes I had a complete and professional profile.'}
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
                                {lang === 'es'
                                    ? '¿Listo para optimizar tu perfil con IA?'
                                    : 'Ready to optimize your profile with AI?'}
                            </h2>
                            <p className="text-lg md:text-xl text-white/90 mb-8">
                                {lang === 'es'
                                    ? 'Únete a miles de profesionales que ya están usando nuestra IA para destacar en el mercado laboral'
                                    : 'Join thousands of professionals already using our AI to stand out in the job market'}
                            </p>
                            <button
                                onClick={() => openModal('signup')}
                                className="bg-white text-cv-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                {lang === 'es' ? 'Comenzar gratis ahora' : 'Start free now'}
                            </button>
                            <p className="mt-4 text-sm text-white/80">
                                {lang === 'es' ? 'No se requiere tarjeta de crédito' : 'No credit card required'}
                            </p>
                        </AnimatedWrapper>
                    </div>
                </section>
            </div>
        </>
    );
};

export default AIProductPage;
