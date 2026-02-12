import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { SuccessStory } from '../types';
import Modal from '../shared/Modal';
import ImageComparisonSlider from './ImageComparisonSlider';
import { useTranslations } from '../../hooks/useTranslations';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const StoryCard: React.FC<{ story: SuccessStory; onReadMore: () => void }> = ({ story, onReadMore }) => {
    const t = useTranslations();
    return (
        <div className="bg-white dark:bg-dark-bg-primary rounded-lg shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
            <div className="w-full h-56 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                    src={story.imageUrl}
                    alt={story.name}
                    className="w-full h-full object-cover object-[65%_center]"
                />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{story.name}</h3>
                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{story.role}</p>
                <p className="mt-3 text-cv-blue font-semibold">{story.headline}</p>
                <p className="mt-2 text-gray-600 dark:text-dark-text-secondary text-sm flex-grow">{story.fullStory.substring(0, 100)}...</p>
                <button onClick={onReadMore} className="mt-4 font-bold text-cv-blue self-start hover:underline">
                    {t.successStoriesPage.readFullStory} →
                </button>
            </div>
        </div>
    );
};

interface DBSuccessStory {
    id: string;
    name: string;
    role: string;
    headline: string;
    full_story: string;
    image_url: string;
    before_image_url?: string;
    after_image_url?: string;
    industry: string;
    goal: string;
    featured: boolean;
}

const SuccessStoriesPage: React.FC = () => {
    const { openModal } = useAuth();
    const t = useTranslations();
    const pageData = t.successStoriesPage;
    const { lang } = useLanguage();
    const [activeIndustry, setActiveIndustry] = useState('All');
    const [activeGoal, setActiveGoal] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
    const [storyForm, setStoryForm] = useState({ name: '', email: '', message: '' });
    const [dbStories, setDbStories] = useState<DBSuccessStory[]>([]);
    const [loadingStories, setLoadingStories] = useState(true);

    useEffect(() => {
        loadStoriesFromDB();
    }, []);

    // Cargar script de Opynio
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://web.opynio.com/widget.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup: remover el script cuando el componente se desmonte
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const loadStoriesFromDB = async () => {
        try {
            setLoadingStories(true);
            const { data, error } = await supabase
                .from('success_stories')
                .select('*')
                .eq('approved', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDbStories(data || []);
        } catch (err) {// Si hay error, usar historias estáticas como fallback
        } finally {
            setLoadingStories(false);
        }
    };

    const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setStoryForm(prev => ({ ...prev, [name]: value }));
    };

    const handleStorySubmit = (e: React.FormEvent) => {
        e.preventDefault();alert(pageData.form.alert);
        setStoryForm({ name: '', email: '', message: '' });
    };

    // Convertir historias de DB al formato esperado
    const convertedDbStories: SuccessStory[] = useMemo(() => {
        return dbStories.map(story => ({
            id: story.id as string | number,
            name: story.name,
            role: story.role,
            headline: story.headline,
            fullStory: story.full_story,
            imageUrl: story.image_url,
            beforeImageUrl: story.before_image_url || undefined,
            afterImageUrl: story.after_image_url || undefined,
            industry: story.industry,
            goal: story.goal,
            featured: story.featured
        } as SuccessStory));
    }, [dbStories]);

    // Usar historias de DB si están disponibles, sino usar las estáticas
    const allStories = useMemo(() => {
        return convertedDbStories.length > 0 ? convertedDbStories : t.SUCCESS_STORIES;
    }, [convertedDbStories, t.SUCCESS_STORIES]);

    const featuredStory = useMemo(() => allStories.find(s => s.featured) || allStories[0], [allStories]);

    const filteredStories = useMemo(() => {
        return allStories
            .filter(story => activeIndustry === 'All' || story.industry === activeIndustry)
            .filter(story => activeGoal === 'All' || story.goal === activeGoal);
    }, [activeIndustry, activeGoal, allStories]);

    const handleReadMore = (story: SuccessStory) => {
        setSelectedStory(story);
        setIsModalOpen(true);
    };

    const seoTitle = lang === 'es'
        ? 'Casos de Éxito'
        : 'Success Stories';

    const seoDescription = lang === 'es'
        ? 'Lee historias reales de profesionales que consiguieron trabajo usando nuestras plantillas de CV. Transformaciones verificadas y resultados comprobados con YourCVPassport.'
        : 'Read real stories of professionals who got jobs using our CV templates. Verified transformations and proven results with YourCVPassport.';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
            />
            <div className="bg-cv-light-gray dark:bg-dark-bg-secondary">
             {isModalOpen && selectedStory && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="p-8 bg-white dark:bg-dark-bg-primary max-h-[90vh] overflow-y-auto">
                        <img src={selectedStory.imageUrl} alt={selectedStory.name} className="w-32 h-32 rounded-full mx-auto object-cover object-center mb-4 ring-4 ring-cv-blue/20" />
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center">{selectedStory.name}</h2>
                        <p className="text-center text-gray-500 dark:text-dark-text-tertiary mt-1">{selectedStory.role}</p>
                        <blockquote className="mt-6 text-center text-xl italic text-cv-dark-gray dark:text-dark-text-primary before:content-['\201C'] after:content-['\201D']">
                            {selectedStory.headline}
                        </blockquote>

                        <div className="mt-8 prose max-w-none text-gray-700 dark:text-dark-text-secondary">
                            <p>{selectedStory.fullStory}</p>
                        </div>
                        
                        {selectedStory.beforeImageUrl && selectedStory.afterImageUrl && (
                            <div className="mt-10">
                                <h3 className="text-2xl font-bold text-center mb-4">{pageData.modal.beforeAfter}</h3>
                                <ImageComparisonSlider before={selectedStory.beforeImageUrl} after={selectedStory.afterImageUrl} />
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Hero Section */}
            <section className="bg-white dark:bg-dark-bg-primary text-center py-20 px-4">
                <AnimatedWrapper>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-cv-light-gray dark:bg-dark-bg-secondary p-6 rounded-lg"><p className="text-3xl font-bold text-cv-blue">{pageData.stats.hires}</p><p className="mt-1 font-semibold">from our platform</p></div>
                        <div className="bg-cv-light-gray dark:bg-dark-bg-secondary p-6 rounded-lg"><p className="text-3xl font-bold text-cv-blue">{pageData.stats.promotion}</p><p className="mt-1 font-semibold">in promotion rate</p></div>
                        <div className="bg-cv-light-gray dark:bg-dark-bg-secondary p-6 rounded-lg"><p className="text-3xl font-bold text-cv-blue">{pageData.stats.timeSaved}</p><p className="mt-1 font-semibold">in hiring time for recruiters</p></div>
                    </div>
                </AnimatedWrapper>
            </section>

            {/* Featured Story */}
            {featuredStory && (
                <section className="py-20 px-4">
                    <AnimatedWrapper>
                        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center bg-white dark:bg-dark-bg-primary p-8 rounded-xl shadow-2xl border">
                            <div>
                                <p className="text-cv-blue font-semibold uppercase tracking-wider">{pageData.featured.label}</p>
                                <h2 className="mt-2 text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary">{featuredStory.name}</h2>
                                <p className="text-gray-500 dark:text-dark-text-tertiary">{featuredStory.role}</p>
                                <blockquote className="mt-4 text-xl italic text-cv-dark-gray dark:text-dark-text-primary border-l-4 border-cv-blue pl-4">"{featuredStory.headline}"</blockquote>
                                <p className="mt-4 text-gray-700 dark:text-dark-text-secondary">{featuredStory.fullStory.substring(0, 200)}...</p>
                                <button onClick={() => handleReadMore(featuredStory)} className="mt-6 font-bold text-cv-blue text-lg hover:underline">
                                    {pageData.readFullStory} →
                                </button>
                            </div>
                             {featuredStory.beforeImageUrl && featuredStory.afterImageUrl && (
                                <ImageComparisonSlider before={featuredStory.beforeImageUrl} after={featuredStory.afterImageUrl} />
                            )}
                        </div>
                    </AnimatedWrapper>
                </section>
            )}

            {/* Opynio Reviews Widget */}
            <section className="py-20 px-4 bg-white dark:bg-dark-bg-primary">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-8">
                            {lang === 'es' ? 'Lo que dicen nuestros usuarios' : 'What our users say'}
                        </h2>
                        {/* Opynio Widget v6.0 - horizontal-carousel */}
                        <div className="opynio-widget" data-business-id="cee0e351-db95-4024-a5e0-2646e49b2756" data-type="horizontal-carousel" data-theme="light"></div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Main Content: Filters & Grid */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12">
                            <div className="flex items-center gap-2">
                                <label className="font-semibold">{pageData.filters.industry}:</label>
                                <select value={activeIndustry} onChange={e => setActiveIndustry(e.target.value)} className="p-2 border border-gray-300 dark:border-dark-border-light rounded-md bg-white dark:bg-dark-bg-primary">
                                    {t.STORY_INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="font-semibold">{pageData.filters.goal}:</label>
                                <select value={activeGoal} onChange={e => setActiveGoal(e.target.value)} className="p-2 border border-gray-300 dark:border-dark-border-light rounded-md bg-white dark:bg-dark-bg-primary">
                                    {t.STORY_GOALS.map(goal => <option key={goal} value={goal}>{goal}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredStories.map(story => (
                                <StoryCard key={story.id} story={story} onReadMore={() => handleReadMore(story)} />
                            ))}
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Share Your Story Form */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto bg-white dark:bg-dark-bg-primary p-8 rounded-lg shadow-2xl border">
                    <AnimatedWrapper>
                        <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-2">{pageData.form.title}</h2>
                        <p className="text-center text-gray-600 dark:text-dark-text-secondary mb-8">{pageData.form.subtitle}</p>
                        <form onSubmit={handleStorySubmit} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div><label htmlFor="name" className="block text-sm font-medium">{pageData.form.name}</label><input type="text" name="name" id="name" value={storyForm.name} onChange={handleStoryChange} required className="mt-1 block w-full px-3 py-2 border rounded-md" /></div>
                                <div><label htmlFor="email" className="block text-sm font-medium">{pageData.form.email}</label><input type="email" name="email" id="email" value={storyForm.email} onChange={handleStoryChange} required className="mt-1 block w-full px-3 py-2 border rounded-md" /></div>
                            </div>
                            <div><label htmlFor="message" className="block text-sm font-medium">{pageData.form.message}</label><textarea name="message" id="message" rows={5} value={storyForm.message} onChange={handleStoryChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"></textarea></div>
                            <div className="text-center"><button type="submit" className="bg-cv-blue text-white px-10 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-90 shadow-lg">{pageData.form.submit}</button></div>
                        </form>
                    </AnimatedWrapper>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-cv-dark-gray">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">{pageData.finalCta.title}</h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">{pageData.finalCta.subtitle}</p>
                        <button onClick={() => openModal('signup')} className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-cv-blue hover:bg-opacity-90 sm:w-auto">
                            {pageData.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default SuccessStoriesPage;


