/**
 * Utility functions for handling canonical URLs to avoid SEO duplicates
 */

const BASE_URL = 'https://yourcvpassport.com';

/**
 * Normalizes a URL by removing query strings, hash fragments, and trailing slashes
 * @param url - The URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query string and hash
    urlObj.search = '';
    urlObj.hash = '';

    // Remove trailing slash (except for root)
    let pathname = urlObj.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${urlObj.origin}${pathname}`;
  } catch (e) {
    // If URL parsing fails, return as-is
    return url;
  }
}

/**
 * Gets the canonical URL for a page, handling bilingual routes
 * @param path_en - English path
 * @param path_es - Spanish path (optional)
 * @returns Canonical URL (always uses English version)
 */
export function getCanonicalUrl(path_en: string, path_es?: string): string {
  // Always use English path as canonical to avoid duplicates
  const cleanPath = path_en.startsWith('/') ? path_en : `/${path_en}`;
  return `${BASE_URL}${cleanPath}`;
}

/**
 * Gets the current page's canonical URL from window.location
 * Falls back to base URL if window is not available (SSR)
 */
export function getCurrentCanonicalUrl(): string {
  if (typeof window === 'undefined') {
    return BASE_URL;
  }

  return normalizeUrl(window.location.href);
}

/**
 * Maps Spanish routes to their English canonical equivalents
 */
const ROUTE_MAPPING: Record<string, string> = {
  // Product routes
  '/producto/resumen': '/product/overview',
  '/producto/sellos': '/product/stamps',
  '/producto/ats': '/product/ats',
  '/producto/dominio': '/product/domain',
  '/producto/analiticas': '/product/analytics',
  '/producto/ia': '/product/ai',
  '/producto': '/product',

  // Company routes
  '/empresas/busqueda': '/companies/search',
  '/empresas/planes': '/companies/plans',
  '/empresas/integraciones': '/companies/integrations',
  '/empresas/seguridad': '/companies/security',
  '/empresas': '/companies',

  // About routes
  '/nosotros': '/about',
  '/nosotros/mision': '/about/mission',
  '/nosotros/prensa': '/about/press',
  '/nosotros/contacto': '/about/contact',

  // Professional routes
  '/profesionales/como-funciona': '/professionals/how',
  '/profesionales/plantillas': '/professionals/templates',
  '/profesionales/ayuda': '/professionals/help',
  '/profesionales': '/professionals',

  // Resource routes
  '/recursos/blog': '/resources/blog',
  '/recursos/biblioteca': '/resources/library',
  '/recursos/exito': '/resources/success',
  '/recursos/estado': '/resources/status',
  '/recursos': '/resources',

  // Pricing
  '/precios': '/pricing',

  // Profiles
  '/perfiles': '/profiles',
};

/**
 * Gets the canonical path by mapping Spanish routes to English
 * @param currentPath - The current path
 * @returns English canonical path
 */
export function getCanonicalPath(currentPath: string): string {
  // Remove trailing slash for comparison
  const normalizedPath = currentPath.endsWith('/') && currentPath !== '/'
    ? currentPath.slice(0, -1)
    : currentPath;

  // Check if it's a Spanish route that needs mapping
  if (ROUTE_MAPPING[normalizedPath]) {
    return ROUTE_MAPPING[normalizedPath];
  }

  // Check for dynamic routes (profiles, blog posts, etc.)
  if (normalizedPath.startsWith('/perfiles/')) {
    return normalizedPath.replace('/perfiles/', '/profiles/');
  }

  if (normalizedPath.startsWith('/recursos/blog/')) {
    return normalizedPath.replace('/recursos/blog/', '/resources/blog/');
  }

  // Return as-is (already in English or root)
  return normalizedPath;
}

/**
 * Gets the full canonical URL for the current page
 * Automatically maps Spanish routes to English equivalents
 */
export function getPageCanonicalUrl(): string {
  if (typeof window === 'undefined') {
    return BASE_URL;
  }

  const currentPath = window.location.pathname;
  const canonicalPath = getCanonicalPath(currentPath);

  return `${BASE_URL}${canonicalPath}`;
}

/**
 * Gets the Spanish equivalent path for an English path
 * @param englishPath - The English path
 * @returns Spanish path or the same path if no mapping exists
 */
export function getSpanishPath(englishPath: string): string {
  // Reverse mapping EN -> ES
  const EN_TO_ES_MAPPING: Record<string, string> = {
    '/product/overview': '/producto/resumen',
    '/product/stamps': '/producto/sellos',
    '/product/ats': '/producto/ats',
    '/product/domain': '/producto/dominio',
    '/product/analytics': '/producto/analiticas',
    '/product/ai': '/producto/ia',
    '/product': '/producto',
    '/companies/search': '/empresas/busqueda',
    '/companies/plans': '/empresas/planes',
    '/companies/integrations': '/empresas/integraciones',
    '/companies/security': '/empresas/seguridad',
    '/companies': '/empresas',
    '/about': '/nosotros',
    '/about/mission': '/nosotros/mision',
    '/about/press': '/nosotros/prensa',
    '/about/contact': '/nosotros/contacto',
    '/professionals/how': '/profesionales/como-funciona',
    '/professionals/templates': '/profesionales/plantillas',
    '/professionals/help': '/profesionales/ayuda',
    '/professionals': '/profesionales',
    '/resources/blog': '/recursos/blog',
    '/resources/library': '/recursos/biblioteca',
    '/resources/success': '/recursos/exito',
    '/resources/status': '/recursos/estado',
    '/resources': '/recursos',
    '/pricing': '/precios',
    '/profiles': '/perfiles',
  };

  const normalizedPath = englishPath.endsWith('/') && englishPath !== '/'
    ? englishPath.slice(0, -1)
    : englishPath;

  if (EN_TO_ES_MAPPING[normalizedPath]) {
    return EN_TO_ES_MAPPING[normalizedPath];
  }

  // Handle dynamic routes
  if (normalizedPath.startsWith('/profiles/')) {
    return normalizedPath.replace('/profiles/', '/perfiles/');
  }

  if (normalizedPath.startsWith('/resources/blog/')) {
    return normalizedPath.replace('/resources/blog/', '/recursos/blog/');
  }

  // If no mapping, return as-is
  return normalizedPath;
}

/**
 * Gets hreflang URLs for a given canonical path
 * @param canonicalPath - The canonical English path
 * @returns Object with en, es, and x-default URLs
 */
export function getHreflangUrls(canonicalPath: string): {
  en: string;
  es: string;
  xDefault: string;
} {
  const englishUrl = `${BASE_URL}${canonicalPath}`;
  const spanishPath = getSpanishPath(canonicalPath);
  const spanishUrl = `${BASE_URL}${spanishPath}`;

  return {
    en: englishUrl,
    es: spanishUrl,
    xDefault: englishUrl, // Default to English
  };
}
