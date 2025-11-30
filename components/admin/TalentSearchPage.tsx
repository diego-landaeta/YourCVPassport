import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { Profile } from '../../types';
import { useNavigate } from 'react-router-dom';

interface TalentFilters {
  niche: string;
  profession: string;
  specialization: string;
  location: string;
  availability: string;
  remotePreference: string;
  searchTerm: string;
}

const TalentSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [filters, setFilters] = useState<TalentFilters>({
    niche: '',
    profession: '',
    specialization: '',
    location: '',
    availability: '',
    remotePreference: '',
    searchTerm: ''
  });

  // Unique values for filters
  const [niches, setNiches] = useState<string[]>([]);
  const [professions, setProfessions] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Load profiles when filters change
  useEffect(() => {
    loadProfiles();
  }, [filters, currentPage]);

  const loadFilterOptions = async () => {
    try {
      // Get all profiles to extract unique values
      const { data } = await supabase
        .from('profiles')
        .select('title, headline')
        .not('title', 'is', null)
        .not('headline', 'is', null);

      if (data) {
        // Extract unique niches, professions, and specializations from titles and headlines
        const uniqueNiches = new Set<string>();
        const uniqueProfessions = new Set<string>();
        const uniqueSpecializations = new Set<string>();

        data.forEach(profile => {
          if (profile.title) {
            const titleParts = profile.title.split(/[,|/]/);
            titleParts.forEach(part => {
              const trimmed = part.trim();
              if (trimmed) uniqueProfessions.add(trimmed);
            });
          }

          if (profile.headline) {
            const headlineParts = profile.headline.split(/[,|/]/);
            headlineParts.forEach(part => {
              const trimmed = part.trim();
              if (trimmed) uniqueNiches.add(trimmed);
            });
          }
        });

        setNiches(Array.from(uniqueNiches).sort());
        setProfessions(Array.from(uniqueProfessions).sort());
        setSpecializations(Array.from(uniqueSpecializations).sort());
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,title.ilike.%${filters.searchTerm}%,headline.ilike.%${filters.searchTerm}%`);
      }

      if (filters.niche) {
        query = query.ilike('headline', `%${filters.niche}%`);
      }

      if (filters.profession) {
        query = query.ilike('title', `%${filters.profession}%`);
      }

      if (filters.specialization) {
        query = query.or(`title.ilike.%${filters.specialization}%,headline.ilike.%${filters.specialization}%`);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.availability) {
        query = query.eq('availability', filters.availability);
      }

      if (filters.remotePreference) {
        query = query.eq('remote_preference', filters.remotePreference);
      }

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

  const handleFilterChange = (key: keyof TalentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      niche: '',
      profession: '',
      specialization: '',
      location: '',
      availability: '',
      remotePreference: '',
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const viewProfile = (slug: string | null, id: string) => {
    if (slug) {
      window.open(`/cv/${slug}`, '_blank');
    } else {
      window.open(`/cv/${id}`, '_blank');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Búsqueda de Talentos
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Encuentra profesionales por nicho, profesión y especialización
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 mb-6">
        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Búsqueda General
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre, email, título o descripción..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-primary dark:text-white"
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Niche Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nicho
            </label>
            <select
              value={filters.niche}
              onChange={(e) => handleFilterChange('niche', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-primary dark:text-white"
            >
              <option value="">Todos los nichos</option>
              {niches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>

          {/* Profession Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profesión
            </label>
            <select
              value={filters.profession}
              onChange={(e) => handleFilterChange('profession', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-primary dark:text-white"
            >
              <option value="">Todas las profesiones</option>
              {professions.map((profession) => (
                <option key={profession} value={profession}>
                  {profession}
                </option>
              ))}
            </select>
          </div>

          {/* Specialization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Especialización
            </label>
            <select
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-primary dark:text-white"
            >
              <option value="">Todas las especializaciones</option>
              {specializations.map((specialization) => (
                <option key={specialization} value={specialization}>
                  {specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ubicación
            </label>
            <input
              type="text"
              placeholder="Ej: Madrid, España"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-primary dark:text-white"
            />
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Disponibilidad
            </label>
            <select
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-primary dark:text-white"
            >
              <option value="">Todas</option>
              <option value="immediate">Inmediata</option>
              <option value="2-weeks">2 semanas</option>
              <option value="1-month">1 mes</option>
              <option value="negotiable">Negociable</option>
            </select>
          </div>

          {/* Remote Preference Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modalidad de Trabajo
            </label>
            <select
              value={filters.remotePreference}
              onChange={(e) => handleFilterChange('remotePreference', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-primary dark:text-white"
            >
              <option value="">Todas</option>
              <option value="remote-only">Solo remoto</option>
              <option value="hybrid">Híbrido</option>
              <option value="on-site">Presencial</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        {/* Reset Filters Button */}
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {loading ? (
          'Cargando...'
        ) : (
          `${totalCount} talento${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`
        )}
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No se encontraron talentos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow"
            >
              {/* Avatar and Name */}
              <div className="flex items-start gap-4 mb-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cv-blue to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {profile.full_name}
                  </h3>
                  {profile.title && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {profile.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Headline */}
              {profile.headline && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                  {profile.headline}
                </p>
              )}

              {/* Info Tags */}
              <div className="space-y-2 mb-4">
                {profile.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.remote_preference && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="capitalize">{profile.remote_preference.replace('-', ' ')}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={() => viewProfile(profile.slug, profile.id)}
                className="w-full px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium"
              >
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
                  className={`w-10 h-10 rounded-lg ${
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
  );
};

export default TalentSearchPage;
