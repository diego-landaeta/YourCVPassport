import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { Profile } from '../../types';
import { getCategoryBySlug, talentCategories, getCategoryColor } from '../../data/talentCategories';
import PageSEO from '../PageSEO';

const TalentCategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const categoryData = category ? getCategoryBySlug(category) : undefined;

  useEffect(() => {
    if (category && !categoryData) {
      // Invalid category, redirect to category list
      navigate('/admin/talentos');
    }
  }, [category, categoryData, navigate]);

  useEffect(() => {
    if (categoryData) {
      loadProfiles();
    }
  }, [categoryData, currentPage]);

  const loadProfiles = async () => {
    if (!categoryData) return;

    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Build OR condition for all keywords
      const orConditions = categoryData.keywords.map(keyword =>
        `title.ilike.%${keyword}%,headline.ilike.%${keyword}%`
      ).join(',');

      query = query.or(orConditions);

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setProfiles(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const viewProfile = (slug: string | null, id: string) => {
    if (slug) {
      window.open(`/cv/${slug}`, '_blank');
    } else {
      window.open(`/cv/${id}`, '_blank');
    }
  };

  if (!categoryData) {
    return null;
  }

  return (
    <>
      <PageSEO
        title={`${categoryData.name_es} - Búsqueda de Talentos`}
        description={categoryData.description_es}
        lang="es"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 border-b border-indigo-700 dark:border-indigo-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/admin"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium backdrop-blur-sm transition-all border border-white/30 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al Admin
              </Link>

              <Link
                to="/admin/talentos"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium backdrop-blur-sm transition-all border border-white/30 flex items-center gap-2"
              >
                Ver todas las categorías
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <span className="text-4xl">{categoryData.icon}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {categoryData.name_es}
                </h1>
                <p className="text-indigo-100 text-lg">
                  {categoryData.description_es}
                </p>
              </div>
            </div>

            {/* Development Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg backdrop-blur-sm">
              <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-yellow-100 font-medium">Sección en desarrollo</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {loading ? (
                'Cargando...'
              ) : (
                <>
                  <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
                  {' '}talento{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''} en esta categoría
                </>
              )}
            </p>
          </div>

          {/* Profiles Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
              <div className="text-6xl mb-4">{categoryData.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron talentos en esta categoría
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Aún no hay perfiles registrados que coincidan con esta categoría
              </p>
              <Link
                to="/admin/talentos"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
              >
                Ver otras categorías
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 hover:shadow-md transition-all hover:border-cv-blue"
                >
                  {/* Avatar and Name */}
                  <div className="flex items-start gap-4 mb-4">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-dark-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cv-blue to-purple-600 flex items-center justify-center ring-2 ring-gray-200 dark:ring-dark-border">
                        <span className="text-white text-2xl font-bold">
                          {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                        {profile.full_name}
                      </h3>
                      {profile.title && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {profile.title}
                        </p>
                      )}
                      {profile.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                          {profile.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Headline */}
                  {profile.headline && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                      {profile.headline}
                    </p>
                  )}

                  {/* Info Tags */}
                  <div className="space-y-2 mb-4">
                    {profile.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{profile.location}</span>
                      </div>
                    )}
                    {profile.remote_preference && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="capitalize truncate">{profile.remote_preference.replace('-', ' ')}</span>
                      </div>
                    )}
                    {profile.availability && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate capitalize">{profile.availability.replace('-', ' ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => viewProfile(profile.slug, profile.id)}
                    className="w-full px-4 py-2.5 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Perfil Completo
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-bg-primary dark:text-white transition-colors"
              >
                Anterior
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        currentPage === pageNum
                          ? 'bg-cv-blue text-white'
                          : 'border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-primary dark:text-white'
                      } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-bg-primary dark:text-white transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TalentCategoryPage;
