import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';


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

const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const t = useTranslations();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

    // Determine the blog list path based on language
    const blogListPath = lang === 'es' ? '/recursos/blog' : '/resources/blog';

    useEffect(() => {
        if (slug) {
            fetchPost();
        }
    }, [slug]);

    const fetchPost = async () => {
        setLoading(true);

        // 1. Try static blog posts first (individual .ts files)
        try {
            const { getPostBySlug, getPublishedPosts } = await import('../../content/posts');
            const staticPost = await getPostBySlug(slug!);
            if (staticPost) {
                setPost(staticPost as unknown as BlogPost);
                const related = getPublishedPosts(staticPost.lang)
                    .filter(p => p.category === staticPost.category && p.slug !== slug)
                    .slice(0, 3)
                    .map(p => ({ ...p, content: '' } as unknown as BlogPost));
                setRelatedPosts(related);
                setLoading(false);
                return;
            }
        } catch (e) { /* static posts not available */ }

        // 2. Fallback to Supabase
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {navigate('/blog');
        } else {
            setPost(data as BlogPost);
            fetchRelatedPosts(data.category, data.id);
        }
        setLoading(false);
    };

    const fetchRelatedPosts = async (category: string, currentId: number) => {
        const { data } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('category', category)
            .neq('id', currentId)
            .limit(3);

        if (data) {
            setRelatedPosts(data as BlogPost[]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-cv-light-gray dark:bg-dark-bg-secondary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
            </div>
        );
    }

    if (!post) {
        return null;
    }

    const seoKeywords = lang === 'es'
        ? `${post.category}, blog, artículo, carrera profesional, YourCVPassport, consejos, desarrollo, CV, currículum`
        : `${post.category}, blog, article, professional career, YourCVPassport, advice, development, CV, resume`;

    return (
        <>
            <PageSEO
                title={post.meta_title || post.title}
                description={post.meta_description || post.summary}
                lang={lang}
                keywords={seoKeywords}
            />
            <div className="bg-cv-light-gray dark:bg-dark-bg-secondary min-h-screen">
                {/* Hero Section */}
                <div className="bg-white dark:bg-dark-bg-primary">
                    <div className="max-w-6xl mx-auto px-4 py-12">
                        <button
                            onClick={() => navigate(blogListPath)}
                            className="flex items-center gap-2 text-cv-blue hover:text-blue-700 mb-6 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            {t.blogPost.backToBlog}
                        </button>

                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-cv-blue/10 text-cv-blue rounded-full text-sm font-semibold">
                                {post.category}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-2 mb-8 text-gray-500 dark:text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">
                                {new Date(post.published_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>

                        <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-96 object-cover rounded-xl mb-8"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="bg-white dark:bg-dark-bg-primary rounded-xl p-8 md:p-12 shadow-lg">
                        <div className="prose prose-lg dark:prose-invert max-w-none blog-content">
                            <div
                                className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-6"
                                dangerouslySetInnerHTML={{
                                    __html: post.content
                                        // Cajas especiales (antes de los headers)
                                        .replace(/:::tip\s+(.*?)\s+:::/gs, '<div class="info-box tip-box"><div class="info-box-icon">💡</div><div class="info-box-content"><strong>CONSEJO PRO</strong><p>$1</p></div></div>')
                                        .replace(/:::info\s+(.*?)\s+:::/gs, '<div class="info-box info-box-blue"><div class="info-box-icon">ℹ️</div><div class="info-box-content"><strong>INFORMACIÓN</strong><p>$1</p></div></div>')
                                        .replace(/:::warning\s+(.*?)\s+:::/gs, '<div class="info-box warning-box"><div class="info-box-icon">⚠️</div><div class="info-box-content"><strong>IMPORTANTE</strong><p>$1</p></div></div>')
                                        .replace(/:::example\s+(.*?)\s+:::/gs, '<div class="info-box example-box"><div class="info-box-icon">📋</div><div class="info-box-content"><strong>EJEMPLO PRÁCTICO</strong><p>$1</p></div></div>')

                                        // Imágenes con caption
                                        .replace(/!\[(.*?)\]\((.*?)\)\{caption:(.*?)\}/g, '<figure class="image-figure"><img src="$2" alt="$1" class="blog-image" /><figcaption>$3</figcaption></figure>')
                                        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="blog-image" />')

                                        // Headers
                                        .replace(/### (.*?)(\n|$)/g, '<h3 class="blog-h3">$1</h3>')
                                        .replace(/## (.*?)(\n|$)/g, '<h2 class="blog-h2">$1</h2>')
                                        .replace(/# (.*?)(\n|$)/g, '<h1 class="blog-h1">$1</h1>')

                                        // Listas
                                        .replace(/\n- (.*?)(?=\n|$)/g, '<li class="blog-li">$1</li>')
                                        .replace(/(<li class="blog-li">.*?<\/li>)+/gs, '<ul class="blog-ul">$&</ul>')

                                        // Énfasis
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="blog-strong">$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

                                        // Párrafos
                                        .replace(/\n\n/g, '</p><p class="blog-p">')
                                        .replace(/\n/g, '<br />')
                                        .replace(/^(.+)/, '<p class="blog-p">$1')
                                        .replace(/(.+)$/, '$1</p>')
                                }}
                            />
                            <style>{`
                                .blog-content .info-box {
                                    border-radius: 0.75rem;
                                    padding: 1.5rem;
                                    margin: 2rem 0;
                                    display: flex;
                                    gap: 1rem;
                                    border-left: 4px solid;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                }
                                .blog-content .info-box-icon {
                                    font-size: 1.5rem;
                                    flex-shrink: 0;
                                }
                                .blog-content .info-box-content {
                                    flex: 1;
                                }
                                .blog-content .info-box-content strong {
                                    display: block;
                                    font-weight: 700;
                                    margin-bottom: 0.5rem;
                                    font-size: 0.875rem;
                                    letter-spacing: 0.05em;
                                }
                                .blog-content .tip-box {
                                    background: #ecfdf5;
                                    border-left-color: #10b981;
                                }
                                .dark .blog-content .tip-box {
                                    background: rgba(16, 185, 129, 0.1);
                                }
                                .blog-content .info-box-blue {
                                    background: #eff6ff;
                                    border-left-color: #3b82f6;
                                }
                                .dark .blog-content .info-box-blue {
                                    background: rgba(59, 130, 246, 0.1);
                                }
                                .blog-content .warning-box {
                                    background: #fef3c7;
                                    border-left-color: #f59e0b;
                                }
                                .dark .blog-content .warning-box {
                                    background: rgba(245, 158, 11, 0.1);
                                }
                                .blog-content .example-box {
                                    background: #faf5ff;
                                    border-left-color: #a855f7;
                                }
                                .dark .blog-content .example-box {
                                    background: rgba(168, 85, 247, 0.1);
                                }
                                .blog-content .blog-h1 {
                                    font-size: 2rem;
                                    font-weight: 800;
                                    color: #111827;
                                    margin-top: 3rem;
                                    margin-bottom: 1.5rem;
                                }
                                .dark .blog-content .blog-h1 {
                                    color: #f9fafb;
                                }
                                .blog-content .blog-h2 {
                                    font-size: 1.75rem;
                                    font-weight: 700;
                                    color: #111827;
                                    margin-top: 2.5rem;
                                    margin-bottom: 1.25rem;
                                    padding-bottom: 0.5rem;
                                    border-bottom: 2px solid #e5e7eb;
                                }
                                .dark .blog-content .blog-h2 {
                                    color: #f9fafb;
                                    border-bottom-color: #374151;
                                }
                                .blog-content .blog-h3 {
                                    font-size: 1.5rem;
                                    font-weight: 600;
                                    color: #1f2937;
                                    margin-top: 2rem;
                                    margin-bottom: 1rem;
                                }
                                .dark .blog-content .blog-h3 {
                                    color: #f3f4f6;
                                }
                                .blog-content .blog-p {
                                    margin-bottom: 1.25rem;
                                    line-height: 1.8;
                                }
                                .blog-content .blog-strong {
                                    font-weight: 700;
                                    color: #111827;
                                }
                                .dark .blog-content .blog-strong {
                                    color: #f9fafb;
                                }
                                .blog-content .blog-ul {
                                    margin: 1.5rem 0;
                                    padding-left: 0;
                                    list-style: none;
                                }
                                .blog-content .blog-li {
                                    position: relative;
                                    padding-left: 2rem;
                                    margin-bottom: 0.75rem;
                                    line-height: 1.7;
                                }
                                .blog-content .blog-li:before {
                                    content: "▸";
                                    position: absolute;
                                    left: 0.5rem;
                                    color: #3b82f6;
                                    font-weight: bold;
                                }
                                .blog-content .blog-image {
                                    width: 100%;
                                    height: auto;
                                    border-radius: 0.75rem;
                                    margin: 2rem 0;
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                }
                                .blog-content .image-figure {
                                    margin: 2.5rem 0;
                                }
                                .blog-content .image-figure figcaption {
                                    text-align: center;
                                    font-size: 0.875rem;
                                    color: #6b7280;
                                    margin-top: 0.75rem;
                                    font-style: italic;
                                }
                                .dark .blog-content .image-figure figcaption {
                                    color: #9ca3af;
                                }
                            `}</style>
                        </div>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                                {t.blogPost.relatedArticles}
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {relatedPosts.map(relatedPost => (
                                    <div
                                        key={relatedPost.id}
                                        onClick={() => navigate(`${blogListPath}/${relatedPost.slug}`)}
                                        className="bg-white dark:bg-dark-bg-primary rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
                                    >
                                        <img
                                            src={relatedPost.image_url}
                                            alt={relatedPost.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                                {relatedPost.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {relatedPost.summary}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default BlogPostPage;

