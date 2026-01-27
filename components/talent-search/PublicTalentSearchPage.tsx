import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTalentFilters } from '../../hooks/useTalentFilters';
import { useTalentSearch } from '../../hooks/useTalentSearch';
import { supabase } from '../../supabase/client';
import TalentSearchFilters from './TalentSearchFilters';
import TalentProfileCard from './TalentProfileCard';
import type { CategoryCount } from './types';

const PublicTalentSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const {
    filters,
    updateFilter,
    updateFilters,
    addSkill,
    removeSkill,
    addLanguage,
    removeLanguage,
    clearFilters,
    activeFilterCount,
  } = useTalentFilters();

  const {
    results,
    loading,
    totalResults,
    search,
  } = useTalentSearch({ resultsPerPage: 50 });

  const [skillCategories, setSkillCategories] = useState<CategoryCount[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const translations = {
    en: {
      title: 'Discover Your Next Hire',
      subtitle: 'Find top-tier, verified talent faster than ever before.',
      hero: {
        title: 'Discover Top Talent',
        description: 'Search through thousands of verified professionals ready to join your team',
      },
      results: {
        resultsFound: 'Results Found',
        showing: 'Showing',
        professionals: 'professionals',
        noneFound: 'No professionals found',
        tryAdjusting: 'Try adjusting your filters or search query',
        update: 'Update Profile',
      },
      loading: 'Loading professionals...',
    },
    es: {
      title: 'Descubre tu Próxima Contratación',
      subtitle: 'Encuentra talento verificado de primer nivel más rápido que nunca.',
      hero: {
        title: 'Descubre el Mejor Talento',
        description: 'Busca entre miles de profesionales verificados listos para unirse a tu equipo',
      },
      results: {
        resultsFound: 'Resultados Encontrados',
        showing: 'Mostrando',
        professionals: 'profesionales',
        noneFound: 'No se encontraron profesionales',
        tryAdjusting: 'Intenta ajustar tus filtros o búsqueda',
        update: 'Actualizar Perfil',
      },
      loading: 'Cargando profesionales...',
    },
  };

  const t = translations[lang as keyof typeof translations];

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Load skill categories with counts
      const { data: skillsData } = await supabase
        .from('skills')
        .select('category')
        .not('category', 'is', null);

      if (skillsData) {
        const categoryCounts = skillsData.reduce((acc: Record<string, number>, skill: any) => {
          const category = skill.category || 'Other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const categoryArray = Object.entries(categoryCounts)
          .map(([category, count]) => ({ category, count: count as number }))
          .sort((a, b) => b.count - a.count);

        setSkillCategories(categoryArray);
      }

      // Load unique locations
      const { data: locationsData } = await supabase
        .from('profiles')
        .select('location')
        .not('location', 'is', null)
        .eq('is_public', true);

      if (locationsData) {
        const uniqueLocations = Array.from(new Set(locationsData.map((p: any) => p.location).filter(Boolean)));
        setLocations(uniqueLocations.sort());
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleSearch = () => {
    search(filters, 1);
  };

  const handleViewProfile = (profileId: string) => {
    const profile = results.find(p => p.id === profileId);
    if (profile && (profile.slug || profile.handle)) {
      navigate(`/cv/${profile.slug || profile.handle}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-8">
              <TalentSearchFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onSearch={handleSearch}
                onClearFilters={clearFilters}
                onAddSkill={addSkill}
                onRemoveSkill={removeSkill}
                onAddLanguage={addLanguage}
                onRemoveLanguage={removeLanguage}
                showAdvanced={false}
                companyMode={false}
                availableOptions={{
                  skillCategories,
                  locations,
                }}
                activeFilterCount={activeFilterCount()}
              />
            </div>
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* Results Count */}
            {!loading && totalResults > 0 && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t.results.resultsFound}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                    {totalResults}
                  </span>
                </div>
                <button
                  onClick={handleSearch}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t.results.update}
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t.loading}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && totalResults === 0 && results.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t.results.noneFound}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {t.results.tryAdjusting}
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {!loading && results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((profile) => (
                  <TalentProfileCard
                    key={profile.id}
                    profile={profile}
                    onViewProfile={handleViewProfile}
                    companyMode={false}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PublicTalentSearchPage;
