import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useTranslations } from '../../hooks/useTranslations';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import { Link, useLocation } from 'react-router-dom';
import { handleBlogImageError } from '../../utils/blogImageFallback';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    image_url: string;
    category: string;
    is_featured: boolean;
    published_at: string;
    meta_title: string;
    meta_description: string;
}

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ pointerEvents: 'auto' }}>
            {children}
        </div>
    );
};

// Identificador interno del filtro "todas las categorias" (la etiqueta visible sale de traducciones).
const ALL_CATEGORIES = '__all__';
// Tarjetas por tanda en la cuadricula ("Cargar mas").
const PAGE_SIZE = 12;

const ArticleCard: React.FC<{ post: BlogPost; basePath: string }> = ({ post, basePath }) => {
    return (
        <Link
            to={`${basePath}/${post.slug}`}
            data-testid="blog-card"
            className="flex flex-col bg-white dark:bg-dark-bg-primary rounded-lg shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary"
        >
        <div className="relative">
            <img src={post.image_url} alt="" loading="lazy" decoding="async" onError={handleBlogImageError} className="w-full h-56 object-cover bg-gray-100 dark:bg-dark-bg-tertiary" />
            <div className="absolute top-4 left-4 bg-cv-blue/80 text-white text-xs font-bold px-3 py-1 rounded-full">{post.category}</div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary group-hover:text-cv-blue transition-colors duration-300">{post.title}</h3>
            <p className="mt-2 text-gray-600 dark:text-dark-text-secondary flex-grow">{post.summary}</p>
            <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-dark-border text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">{new Date(post.published_at).toLocaleDateString()}</p>
            </div>
        </div>
    </Link>
    );
};

const BlogPage: React.FC = () => {
    const { openModal } = useAuth();
    const location = useLocation();
    const t = useTranslations();
    const pageData = t.blogPage;
    const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [email, setEmail] = useState('');
    const [newsletterMailto, setNewsletterMailto] = useState('');
    const { lang } = useLanguage();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Determine blog base path based on current route
    const blogBasePath = location.pathname.startsWith('/recursos/blog') ? '/recursos/blog' : 
                        location.pathname.startsWith('/resources/blog') ? '/resources/blog' : '/blog';

    useEffect(() => {
        fetchPosts();
    }, [lang]);

    const fetchPosts = async () => {
        setLoading(true);
        const now = new Date();

        // Fetch from Supabase
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('lang', lang)
            .lte('published_at', now.toISOString())
            .order('published_at', { ascending: false });

        let allPosts = (data || []) as BlogPost[];

        // Merge static blog posts (from individual .ts files)
        try {
            const { getPublishedPosts } = await import('../../content/posts');
            const staticPosts = getPublishedPosts(lang) as unknown as BlogPost[];
            const existingSlugs = new Set(allPosts.map(p => p.slug));
            const newStatic = staticPosts.filter(p => !existingSlugs.has(p.slug));
            allPosts = [...allPosts, ...newStatic].sort(
                (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            );
        } catch (e) { /* static posts not available */ }

        setPosts(allPosts);
        setLoading(false);
    };

    const seoTitle = lang === 'es'
        ? 'Blog - Recursos y Consejos de Carrera'
        : 'Blog - Career Resources and Advice';

    const seoDescription = lang === 'es'
        ? 'Artículos expertos sobre desarrollo profesional, estrategias de búsqueda de empleo, optimización de CV, tendencias de reclutamiento y consejos para destacar en el mercado laboral.'
        : 'Expert articles on professional development, job search strategies, CV optimization, recruitment trends, and tips to stand out in the job market.';

    const seoKeywords = lang === 'es'
        ? 'blog, carrera, desarrollo profesional, búsqueda empleo, CV, optimización, reclutamiento, consejos, recursos, YourCVPassport'
        : 'blog, career, professional development, job search, CV, optimization, recruitment, advice, resources, YourCVPassport';

    const categories = useMemo(() => {
        const uniqueCategories = [ALL_CATEGORIES, ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];
        return uniqueCategories;
    }, [posts]);

    const featuredPost = useMemo(() => posts.find(p => p.is_featured) || posts[0], [posts]);
    const popularPosts = useMemo(() => posts.slice(0, 4), [posts]);

    const filteredPosts = useMemo(() => {
        return posts
            .filter(post => activeCategory === ALL_CATEGORIES || post.category === activeCategory)
            .filter(post =>
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.summary?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [activeCategory, searchTerm, posts]);

    // Al cambiar de idioma, categoria o busqueda se vuelve a la primera tanda.
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [activeCategory, searchTerm, lang]);

    // Las categorias dependen del idioma: si la activa ya no existe, se vuelve a "Todos".
    useEffect(() => {
        if (activeCategory !== ALL_CATEGORIES && !categories.includes(activeCategory)) {
            setActiveCategory(ALL_CATEGORIES);
        }
    }, [categories, activeCategory]);

    const visiblePosts = useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
    const formatCount = (template: string) => template
        .replace('{shown}', String(visiblePosts.length))
        .replace('{total}', String(filteredPosts.length));

    // PENDIENTE: no existe endpoint de boletin (Brevo u otro) en el repo. Hasta que exista,
    // no se finge un alta: se prepara un correo (mailto) y el usuario decide enviarlo.
    // Se muestra como enlace explicito en lugar de navegar solo (evita salir de la pagina).
    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        const newsletter = pageData.sidebar.newsletter;
        const subject = encodeURIComponent(newsletter.mailSubject);
        const body = encodeURIComponent(`${newsletter.mailBody} ${email}`);
        setNewsletterMailto(`mailto:${newsletter.mailTo}?subject=${subject}&body=${body}`);
    };

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
                keywords={seoKeywords}
            />
            <div className="bg-cv-light-gray dark:bg-dark-bg-secondary">
            {/* Hero Section */}
            <section className="bg-white dark:bg-dark-bg-primary text-center py-20 px-4">
                <AnimatedWrapper>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                </AnimatedWrapper>
            </section>
            
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-dark-text-secondary">{pageData.noPosts}</p>
                </div>
            ) : (
                <>
                    {/* Featured Article */}
                    {featuredPost && (
                        <section className="py-12 px-4">
                            <AnimatedWrapper>
                                <Link
                                    to={`${blogBasePath}/${featuredPost.slug}`}
                                    data-testid="blog-featured"
                                    className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center bg-white dark:bg-dark-bg-primary p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary"
                                >
                                    <img src={featuredPost.image_url} alt="" onError={handleBlogImageError} className="w-full h-full object-cover rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary" />
                                    <div>
                                        <p className="text-cv-blue font-semibold">{pageData.featured.label}</p>
                                        <h2 className="mt-2 text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary hover:text-cv-blue transition-colors">{featuredPost.title}</h2>
                                        <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{featuredPost.summary}</p>
                                        <div className="mt-6 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm">{new Date(featuredPost.published_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </Link>
                            </AnimatedWrapper>
                        </section>
                    )}
            
            {/* Main Content */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Filters and Search */}
                    <AnimatedWrapper>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                            <div role="group" aria-label={pageData.categoriesLabel} className="flex-grow flex justify-center md:justify-start flex-wrap gap-2">
                               {categories.map(category => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => setActiveCategory(category)}
                                        aria-pressed={activeCategory === category}
                                        className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary ${
                                            activeCategory === category 
                                            ? 'bg-cv-blue text-white shadow-md' 
                                            : 'bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-bg-tertiary'
                                        }`}
                                    >
                                        {category === ALL_CATEGORIES ? pageData.allCategories : category}
                                    </button>
                                ))}
                            </div>
                             <div className="relative w-full md:w-auto">
                                <input
                                    type="search"
                                    aria-label={pageData.searchLabel}
                                    placeholder={pageData.searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-64 p-3 pr-10 border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-primary text-gray-800 dark:text-dark-text-primary rounded-lg shadow-sm focus:ring-cv-blue focus:border-cv-blue"
                                />
                                <div className="absolute top-1/2 right-3 -translate-y-1/2"><svg className="w-5 h-5 text-gray-400 dark:text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            </div>
                        </div>
                    </AnimatedWrapper>

                    {/* Articles Grid & Sidebar */}
                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Articles */}
                        {/* La cuadricula NO va dentro de AnimatedWrapper: con decenas de tarjetas mide
                            miles de px y el umbral de visibilidad (10 %) no se alcanzaba nunca. */}
                        <div className="lg:col-span-8 min-w-0">
                            {filteredPosts.length === 0 ? (
                                <p className="text-center py-12 text-gray-600 dark:text-dark-text-secondary">{pageData.noResults}</p>
                            ) : (
                                <>
                                    <div className="grid md:grid-cols-2 gap-8" data-testid="blog-grid">
                                        {visiblePosts.map(post => <ArticleCard key={post.id} post={post} basePath={blogBasePath} />)}
                                    </div>
                                    <div className="mt-10 flex flex-col items-center gap-4">
                                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary" role="status" aria-live="polite">
                                            {formatCount(pageData.showingCount)}
                                        </p>
                                        {visiblePosts.length < filteredPosts.length && (
                                            <button
                                                type="button"
                                                onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                                                className="px-6 py-3 rounded-lg font-semibold bg-cv-blue text-white shadow-md hover:bg-cv-blue-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary"
                                            >
                                                {pageData.loadMore}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Sidebar */}
                        <aside className="lg:col-span-4">
                            <AnimatedWrapper delay="duration-1000">
                                <div className="sticky top-24 space-y-10">
                                    {/* Popular Posts */}
                                    <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-lg">
                                        <h3 className="text-xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-4">{pageData.sidebar.popular.title}</h3>
                                        <ul className="space-y-4">
                                            {popularPosts.map(post => (
                                                <li key={post.id}>
                                                    <Link
                                                        to={`${blogBasePath}/${post.slug}`}
                                                        className="font-semibold text-gray-700 dark:text-dark-text-secondary hover:text-cv-blue"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-1">{new Date(post.published_at).toLocaleDateString()}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Newsletter */}
                                    <div className="bg-cv-blue text-white p-8 rounded-lg shadow-lg text-center">
                                        <h3 className="text-2xl font-bold">{pageData.sidebar.newsletter.title}</h3>
                                        <p className="mt-2 text-white/80">{pageData.sidebar.newsletter.subtitle}</p>
                                        <form onSubmit={handleSubscribe} className="mt-6">
                                            <input 
                                                type="email" 
                                                aria-label={pageData.sidebar.newsletter.placeholder}
                                                placeholder={pageData.sidebar.newsletter.placeholder}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full p-3 rounded-md bg-white dark:bg-dark-bg-primary text-gray-800 dark:text-dark-text-primary" />
                                            <button type="submit" className="mt-4 w-full bg-white dark:bg-dark-bg-primary text-cv-blue dark:text-cv-blue-light font-bold py-3 rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                                                {pageData.sidebar.newsletter.button}
                                            </button>
                                        </form>
                                        <div className="mt-3 text-sm text-white" role="status" aria-live="polite">
                                            {newsletterMailto && (
                                                <>
                                                    <p>{pageData.sidebar.newsletter.notice} {pageData.sidebar.newsletter.mailTo}</p>
                                                    <a
                                                        href={newsletterMailto}
                                                        className="mt-3 inline-block font-semibold underline underline-offset-2 hover:no-underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                                    >
                                                        {pageData.sidebar.newsletter.openMail}
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </AnimatedWrapper>
                        </aside>
                    </div>
                </div>
            </section>
                </>
            )}
            
             {/* CTA */}
            <section className="bg-white dark:bg-dark-bg-primary">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary">
                           {pageData.finalCta.title}
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-gray-600 dark:text-dark-text-secondary">
                          {pageData.finalCta.subtitle}
                        </p>
                        <button
                        onClick={() => openModal('signup')}
                        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-cv-blue hover:bg-opacity-90 sm:w-auto"
                        >
                        {pageData.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
        </div>
        </>
    );
};

export default BlogPage;

