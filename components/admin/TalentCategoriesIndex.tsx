import React from 'react';
import { Link } from 'react-router-dom';
import { talentCategories, getCategoryColor } from '../../data/talentCategories';
import PageSEO from '../PageSEO';

const TalentCategoriesIndex: React.FC = () => {
  return (
    <>
      <PageSEO
        title="Búsqueda de Talentos por Categorías - Admin"
        description="Explora talentos organizados por categorías profesionales"
        lang="es"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 border-b border-indigo-700 dark:border-indigo-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/admin"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium backdrop-blur-sm transition-all border border-white/30 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al Admin Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white">
                Búsqueda de Talentos por Categorías
              </h1>
            </div>
            <p className="text-indigo-100 text-lg">
              Explora profesionales organizados por nicho, profesión y especialización
            </p>

            {/* Development Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg backdrop-blur-sm">
              <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-yellow-100 font-medium">Sección en desarrollo</span>
            </div>
          </div>
        </header>

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talentCategories.map((category) => (
              <Link
                key={category.slug}
                to={`/admin/talentos/${category.slug}`}
                className="group bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border-2 border-gray-200 dark:border-dark-border p-6 hover:shadow-lg hover:border-cv-blue dark:hover:border-cv-blue transition-all"
              >
                {/* Icon and Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg-primary dark:to-dark-bg-tertiary p-4 rounded-xl group-hover:scale-110 transition-transform">
                    <span className="text-4xl">{category.icon}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category.color)}`}>
                    {category.color}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cv-blue transition-colors">
                  {category.name_es}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {category.description_es}
                </p>

                {/* Keywords Preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 dark:bg-dark-bg-primary text-xs text-gray-600 dark:text-gray-400 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {category.keywords.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-dark-bg-primary text-xs text-gray-600 dark:text-gray-400 rounded">
                      +{category.keywords.length - 3}
                    </span>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex items-center text-cv-blue font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Ver talentos</span>
                  <svg
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  ¿Cómo funciona la búsqueda por categorías?
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                  Los talentos se organizan automáticamente en categorías según las palabras clave encontradas en sus títulos profesionales y descripciones. Cada categoría agrupa perfiles relacionados para facilitar la búsqueda.
                </p>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Nicho:</strong> Extraído del campo "headline" (descripción profesional)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Profesión:</strong> Extraído del campo "title" (título profesional)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Especialización:</strong> Búsqueda combinada en ambos campos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TalentCategoriesIndex;
