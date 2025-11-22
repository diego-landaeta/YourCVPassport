import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';


interface BlogPost {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    image_url: string;
    author_name: string;
    author_image_url: string;
    author_username?: string;
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
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        if (slug) {
            fetchPost();
        }
    }, [slug]);

    const fetchPost = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            navigate('/blog');
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
        ? `${post.category}, blog, artículo, carrera profesional, ${post.author_name}, YourCVPassport, consejos, desarrollo`
        : `${post.category}, blog, article, professional career, ${post.author_name}, YourCVPassport, advice, development`;

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
                    <div className="max-w-4xl mx-auto px-4 py-12">
                        <button
                            onClick={() => navigate('/recursos/blog')}
                            className="flex items-center gap-2 text-cv-blue hover:text-blue-700 mb-6 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver al Blog
                        </button>

                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-cv-blue/10 text-cv-blue rounded-full text-sm font-semibold">
                                {post.category}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-4 mb-8">
                            <img
                                src={post.author_image_url}
                                alt={post.author_name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                                {post.author_username ? (
                                    <button
                                        onClick={() => navigate(`/cv/${post.author_username}`)}
                                        className="font-semibold text-cv-blue hover:text-blue-700 transition-colors hover:underline"
                                    >
                                        {post.author_name}
                                    </button>
                                ) : (
                                    <p className="font-semibold text-gray-900 dark:text-white">{post.author_name}</p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(post.published_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-96 object-cover rounded-xl mb-8"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="bg-white dark:bg-dark-bg-primary rounded-xl p-8 md:p-12 shadow-lg">
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <div
                                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: post.content
                                        .replace(/### (.*?)(\n|$)/g, '<h3 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">$1</h3>')
                                        .replace(/## (.*?)(\n|$)/g, '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">$1</h2>')
                                        .replace(/# (.*?)(\n|$)/g, '<h1 class="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">$1</h1>')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                        .replace(/\n\n/g, '</p><p class="mb-4">')
                                        .replace(/\n/g, '<br />')
                                        .replace(/^(.+)/, '<p class="mb-4">$1')
                                        .replace(/(.+)$/, '$1</p>')
                                }}
                            />
                        </div>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                                Artículos Relacionados
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {relatedPosts.map(relatedPost => (
                                    <div
                                        key={relatedPost.id}
                                        onClick={() => navigate(`/blog/${relatedPost.slug}`)}
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
