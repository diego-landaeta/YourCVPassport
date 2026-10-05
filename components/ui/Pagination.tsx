import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Paginacion numerica reutilizable (extraida de CompanyTalentSearchPage).
 *
 * Muestra: anterior · 1 … (n-1) [n] (n+1) … total · siguiente.
 * No se pinta si solo hay una pagina. `currentPage` empieza en 1.
 */
export interface PaginationLabels {
  nav: string;
  previous: string;
  next: string;
  goTo: (page: number) => string;
}

const DEFAULT_LABELS: Record<'es' | 'en', PaginationLabels> = {
  es: {
    nav: 'Paginación',
    previous: 'Página anterior',
    next: 'Página siguiente',
    goTo: (page) => `Ir a la página ${page}`,
  },
  en: {
    nav: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    goTo: (page) => `Go to page ${page}`,
  },
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Clases del contenedor (por defecto, centrado con margen superior). */
  className?: string;
  labels?: Partial<PaginationLabels>;
}

const pageButton =
  'px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all';

const arrowButton = (enabled: boolean) =>
  `p-2 rounded-lg border transition-all ${
    enabled
      ? 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
  }`;

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = 'mt-8 flex flex-wrap items-center justify-center gap-2',
  labels,
}) => {
  const { lang } = useLanguage();
  const l: PaginationLabels = { ...DEFAULT_LABELS[lang === 'en' ? 'en' : 'es'], ...labels };

  if (totalPages <= 1) return null;

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) onPageChange(page);
  };

  return (
    <nav aria-label={l.nav} className={className}>
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={!canGoPrevious}
        aria-label={l.previous}
        className={arrowButton(canGoPrevious)}
      >
        <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2">
        {/* Primera pagina */}
        {currentPage > 3 && (
          <>
            <button type="button" onClick={() => goToPage(1)} aria-label={l.goTo(1)} className={pageButton}>
              1
            </button>
            {currentPage > 4 && <span className="text-gray-400" aria-hidden="true">...</span>}
          </>
        )}

        {/* Pagina anterior */}
        {currentPage > 1 && (
          <button type="button" onClick={() => goToPage(currentPage - 1)} aria-label={l.goTo(currentPage - 1)} className={pageButton}>
            {currentPage - 1}
          </button>
        )}

        {/* Pagina actual */}
        <button
          type="button"
          aria-current="page"
          aria-label={l.goTo(currentPage)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold border border-blue-600"
        >
          {currentPage}
        </button>

        {/* Pagina siguiente */}
        {currentPage < totalPages && (
          <button type="button" onClick={() => goToPage(currentPage + 1)} aria-label={l.goTo(currentPage + 1)} className={pageButton}>
            {currentPage + 1}
          </button>
        )}

        {/* Ultima pagina */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && <span className="text-gray-400" aria-hidden="true">...</span>}
            <button type="button" onClick={() => goToPage(totalPages)} aria-label={l.goTo(totalPages)} className={pageButton}>
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!canGoNext}
        aria-label={l.next}
        className={arrowButton(canGoNext)}
      >
        <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;
