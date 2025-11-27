import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BlogPost {
    id?: number;
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

const BlogManagementSection: React.FC = () => {
    const { session } = useAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {} else {
            setPosts(data as BlogPost[]);
        }
        setLoading(false);
    };

    const handleSave = async (post: Partial<BlogPost>) => {
        if (!session) {
            setErrorMessage('No hay sesión activa');
            return;
        }

        // Clear any previous messages
        setErrorMessage(null);
        setSuccessMessage(null);

        // Validate required fields
        if (!post.title || post.title.trim().length < 10) {
            const msg = 'El título debe tener al menos 10 caracteres';
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }

        if (!post.slug || post.slug.trim().length === 0) {
            const msg = 'El slug es requerido. Usa el botón "Auto-generar" para crear uno automáticamente';
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }

        if (!post.content || post.content.trim().length === 0) {
            const msg = 'El contenido del artículo es requerido. Completa la pestaña "Contenido"';
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }

        if (!post.summary || post.summary.trim().length === 0) {
            const msg = 'El resumen del artículo es requerido. Completa la pestaña "Contenido"';
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }

        if (!post.category || post.category.trim().length === 0) {
            const msg = 'La categoría es requerida. Completa la pestaña "Contenido"';
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }

        if (!post.image_url || post.image_url.trim().length === 0) {
            const msg = 'La URL de la imagen destacada es requerida. Completa la pestaña "Imagen Destacada"';
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }

        try {
            // Get author data from profile if not provided
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('slug, full_name, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (profileError) {const msg = 'Error al obtener datos del perfil: ' + profileError.message;
                setErrorMessage(msg);
                setTimeout(() => setErrorMessage(null), 5000);
                return;
            }

            const postToSave = {
                ...post,
                user_id: session.user.id,
                author_username: post.author_username || profileData?.slug || undefined,
                author_name: post.author_name || profileData?.full_name || 'Usuario',
                author_image_url: post.author_image_url || profileData?.avatar_url || 'https://via.placeholder.com/100',
                published_at: post.published_at || new Date().toISOString(),
            };let response;
            if (post.id) {
                response = await supabase.from('blog_posts').update(postToSave).eq('id', post.id);
            } else {
                response = await supabase.from('blog_posts').insert([postToSave]);
            }

            if (response.error) {let errorMsg = response.error.message;
                if (errorMsg.includes('blog_posts_slug_format')) {
                    errorMsg = 'El slug debe contener solo letras minúsculas, números y guiones. Usa el botón "Auto-generar" para crear un slug válido.';
                } else if (errorMsg.includes('blog_posts_title_length')) {
                    errorMsg = 'El título debe tener al menos 10 caracteres.';
                } else if (errorMsg.includes('duplicate key')) {
                    errorMsg = 'Ya existe un artículo con ese slug. Por favor, usa uno diferente.';
                }
                setErrorMessage(errorMsg);
                setTimeout(() => setErrorMessage(null), 5000);
            } else {setSuccessMessage('✅ Artículo guardado exitosamente');
                setEditingPost(null);
                fetchPosts();
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (error: any) {const msg = 'Error inesperado: ' + (error.message || 'Por favor, intenta de nuevo');
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
        }
    };

    const handleDelete = async (postId: number) => {
        setPostToDelete(postId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!postToDelete) return;

        const { error } = await supabase.from('blog_posts').delete().eq('id', postToDelete);
        if (error) {
            setErrorMessage('Error al eliminar el artículo: ' + error.message);
        } else {
            setSuccessMessage('Artículo eliminado exitosamente');
            fetchPosts();
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        setShowDeleteModal(false);
        setPostToDelete(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div></div>;
    }

    if (editingPost) {
        return <PostForm post={editingPost} onSave={handleSave} onCancel={() => setEditingPost(null)} />;
    }

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] bg-red-500 text-white px-8 py-4 rounded-lg shadow-2xl max-w-2xl animate-bounce">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="font-bold text-lg">{errorMessage}</p>
                        </div>
                        <button onClick={() => setErrorMessage(null)} className="flex-shrink-0 hover:bg-red-600 rounded p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmar eliminación</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            ¿Estás seguro de que deseas eliminar este artículo? Se eliminará permanentemente de la base de datos.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPostToDelete(null);
                                }}
                                className="px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Eliminar artículo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Blog</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Crea y administra los artículos de tu blog. Total: {posts.length} artículo{posts.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => setEditingPost({ 
                        title: '', 
                        slug: '', 
                        summary: '', 
                        content: '', 
                        image_url: '', 
                        author_name: '', 
                        author_image_url: '', 
                        category: '', 
                        is_featured: false, 
                        published_at: new Date().toISOString().split('T')[0], 
                        meta_title: '', 
                        meta_description: '' 
                    })}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nuevo Artículo
                </button>
            </div>

            {posts.length === 0 ? (
                <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No hay artículos todavía
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Comienza creando tu primer artículo de blog para compartir contenido con tu audiencia.
                        </p>
                        <button
                            onClick={() => setEditingPost({ 
                                title: '', 
                                slug: '', 
                                summary: '', 
                                content: '', 
                                image_url: '', 
                                author_name: '', 
                                author_image_url: '', 
                                category: '', 
                                is_featured: false, 
                                published_at: new Date().toISOString().split('T')[0], 
                                meta_title: '', 
                                meta_description: '' 
                            })}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-semibold transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Crear Primer Artículo
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {posts.map(post => (
                        <div 
                            key={post.id} 
                            className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row">
                                {/* Image */}
                                <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-dark-bg-tertiary">
                                    {post.image_url ? (
                                        <img 
                                            src={post.image_url} 
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                {post.is_featured && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                                        ⭐ Destacado
                                                    </span>
                                                )}
                                                {post.category && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                                        {post.category}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                                {post.title}
                                            </h3>
                                            
                                            {post.summary && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                    {post.summary}
                                                </p>
                                            )}
                                            
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(post.published_at).toLocaleDateString('es-ES', { 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </span>
                                                {post.author_name && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {post.author_name}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                    /blog/{post.slug}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => setEditingPost(post)} 
                                                className="p-2 text-gray-500 hover:text-cv-blue rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg-primary transition-colors"
                                                title="Editar"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(post.id!)} 
                                                className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PostForm: React.FC<{ post: Partial<BlogPost>, onSave: (post: Partial<BlogPost>) => void, onCancel: () => void }> = ({ post, onSave, onCancel }) => {
    const [formData, setFormData] = useState(post);
    const [activeTab, setActiveTab] = useState<'content' | 'media' | 'metadata'>('content');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        // Auto-sanitize slug field to ensure it only contains lowercase letters, numbers, and hyphens
        if (name === 'slug') {
            const sanitizedSlug = value
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")  // Remove accents
                .replace(/[^a-z0-9-]/g, '')  // Only allow lowercase letters, numbers, and hyphens
                .replace(/-+/g, '-')  // Replace multiple hyphens with single hyphen
                .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
            setFormData(prev => ({ ...prev, [name]: sanitizedSlug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const generateSlug = () => {
        if (formData.title) {
            let slug = formData.title
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            
            slug = slug.replace(/^-+|-+$/g, '');
            
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                slug = slug.replace(/[^a-z0-9-]/g, '');
            }
            
            if (!slug) {
                slug = 'articulo-' + Date.now();
            }
            
            setFormData(prev => ({ ...prev, slug }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-xl border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {post.id ? 'Editar Artículo' : 'Nuevo Artículo'}
                    </h2>
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-semibold transition-colors shadow-md"
                        >
                            Guardar Artículo
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="border-b border-gray-200 dark:border-dark-border">
                    <nav className="flex -mb-px">
                        <button
                            type="button"
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                                activeTab === 'content'
                                    ? 'border-b-2 border-cv-blue text-cv-blue'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            📝 Contenido
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('media')}
                            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                                activeTab === 'media'
                                    ? 'border-b-2 border-cv-blue text-cv-blue'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            🖼️ Imagen Destacada
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('metadata')}
                            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                                activeTab === 'metadata'
                                    ? 'border-b-2 border-cv-blue text-cv-blue'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            🏷️ Metadatos SEO
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Content Tab */}
                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Título del Artículo *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title || ''}
                                    onChange={handleChange}
                                    onBlur={generateSlug}
                                    required
                                    placeholder="Ej: Cómo Crear un CV Profesional en 2025"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Slug (URL amigable) *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug || ''}
                                        onChange={handleChange}
                                        required
                                        placeholder="como-crear-un-cv-profesional-2025"
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white font-mono text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateSlug}
                                        className="px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                                    >
                                        Auto-generar
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    URL: /blog/{formData.slug || 'slug-del-articulo'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Categoría
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white"
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        <option value="Para Reclutadores">Para Reclutadores</option>
                                        <option value="CV y Currículums">CV y Currículums</option>
                                        <option value="Consejos de Carrera">Consejos de Carrera</option>
                                        <option value="Entrevistas">Entrevistas</option>
                                        <option value="Desarrollo Profesional">Desarrollo Profesional</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Fecha de Publicación
                                    </label>
                                    <input
                                        type="date"
                                        name="published_at"
                                        value={formData.published_at?.split('T')[0] || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Resumen (Extracto)
                                </label>
                                <textarea
                                    name="summary"
                                    value={formData.summary || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Breve descripción del artículo que aparecerá en las tarjetas de vista previa..."
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white resize-none"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formData.summary?.length || 0} caracteres (recomendado: 120-160)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Contenido (Markdown)
                                </label>
                                <textarea
                                    name="content"
                                    value={formData.content || ''}
                                    onChange={handleChange}
                                    rows={20}
                                    placeholder="Escribe el contenido del artículo en formato Markdown...&#10;&#10;## Título de sección&#10;&#10;Párrafo de texto con **negrita** y *cursiva*.&#10;&#10;- Lista item 1&#10;- Lista item 2"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white font-mono text-sm resize-none"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Soporta Markdown: **negrita**, *cursiva*, [enlaces](url), ## títulos, listas, etc.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    name="is_featured"
                                    checked={!!formData.is_featured}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-cv-blue rounded border-gray-300 focus:ring-cv-blue"
                                />
                                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    ⭐ Marcar como artículo destacado (aparecerá en la página principal)
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    URL de Imagen Destacada
                                </label>
                                <input
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url || ''}
                                    onChange={handleChange}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Recomendado: 1200x630px (formato 16:9) para mejor visualización en redes sociales
                                </p>
                            </div>

                            {formData.image_url && (
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista Previa</p>
                                    </div>
                                    <div className="p-4">
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-full h-auto rounded-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x630?text=Error+al+cargar+imagen';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Nombre del Autor
                                    </label>
                                    <input
                                        type="text"
                                        name="author_name"
                                        value={formData.author_name || ''}
                                        onChange={handleChange}
                                        placeholder="Ej: María García"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        URL de Imagen del Autor
                                    </label>
                                    <input
                                        type="url"
                                        name="author_image_url"
                                        value={formData.author_image_url || ''}
                                        onChange={handleChange}
                                        placeholder="https://ejemplo.com/avatar.jpg"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white"
                                    />
                                </div>
                            </div>

                            {formData.author_image_url && (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                                    <img
                                        src={formData.author_image_url}
                                        alt="Author preview"
                                        className="w-16 h-16 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=?';
                                        }}
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{formData.author_name || 'Nombre del autor'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Vista previa del autor</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Metadata Tab */}
                    {activeTab === 'metadata' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Meta Título (SEO)
                                </label>
                                <input
                                    type="text"
                                    name="meta_title"
                                    value={formData.meta_title || ''}
                                    onChange={handleChange}
                                    placeholder={formData.title || 'Título optimizado para motores de búsqueda'}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formData.meta_title?.length || 0} caracteres (recomendado: 50-60)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Meta Descripción (SEO)
                                </label>
                                <textarea
                                    name="meta_description"
                                    value={formData.meta_description || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder={formData.summary || 'Descripción que aparecerá en los resultados de búsqueda de Google...'}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white resize-none"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formData.meta_description?.length || 0} caracteres (recomendado: 150-160)
                                </p>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista Previa en Google</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-dark-bg-primary">
                                    <div className="max-w-2xl">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            yourcvpassport.com › blog › {formData.slug || 'slug-del-articulo'}
                                        </div>
                                        <div className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-2 hover:underline cursor-pointer">
                                            {formData.meta_title || formData.title || 'Título del artículo'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {formData.meta_description || formData.summary || 'Descripción del artículo que aparecerá en los resultados de búsqueda...'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

export default BlogManagementSection;
