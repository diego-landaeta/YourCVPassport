/**
 * Canonical y hreflang de las paginas publicas.
 *
 * Reglas:
 * - Cada idioma es canonico de si mismo: /precios -> https://yourcvpassport.com/precios,
 *   /pricing -> https://yourcvpassport.com/pricing. Nunca se apunta una pagina en espanol
 *   a su version inglesa.
 * - hreflang es/en/x-default reciprocos entre la pareja de rutas (x-default = ingles).
 * - Rutas duplicadas (mismo componente con varias URLs, p. ej. /product y
 *   /product/overview) apuntan su canonical a la principal del mismo idioma: la primera
 *   que aparece en config/routeConfig.ts.
 * - Las parejas salen de config/routeConfig.ts (fuente unica de rutas ES/EN) mas las
 *   rutas que App.tsx declara a mano (empleos y comunidad).
 */
import { routeConfig, routeRedirects } from '../config/routeConfig';

export const BASE_URL = 'https://yourcvpassport.com';

export type SeoLang = 'en' | 'es';

interface RoutePair {
  en: string;
  es: string;
}

export interface HreflangUrls {
  en: string;
  es: string;
  xDefault: string;
}

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

/** Quita query, hash y barra final; garantiza la barra inicial. */
export function normalizePath(path: string): string {
  let clean = (path || '/').split(/[?#]/)[0] || '/';
  if (!clean.startsWith('/')) clean = `/${clean}`;
  if (clean !== '/' && clean.endsWith('/')) clean = clean.replace(/\/+$/, '') || '/';
  return clean;
}

// ---------------------------------------------------------------------------
// Tabla de rutas ES/EN
// ---------------------------------------------------------------------------

/** Rutas bilingues declaradas directamente en App.tsx (no estan en routeConfig). */
const EXTRA_ROUTE_PAIRS: RoutePair[] = [
  { en: '/jobs', es: '/empleos' },
  { en: '/feed', es: '/comunidad' },
];

/** Rutas dinamicas bilingues: mismo identificador bajo ambos prefijos. */
const DYNAMIC_PREFIX_PAIRS: RoutePair[] = [
  { en: '/jobs/', es: '/empleos/' },
];

interface RouteEntry {
  lang: SeoLang;
  /** Pareja de la propia ruta. */
  pair: RoutePair;
  /** Pareja principal (la propia salvo en rutas duplicadas). */
  principal: RoutePair;
}

const ROUTE_TABLE: Map<string, RouteEntry> = (() => {
  const table = new Map<string, RouteEntry>();
  const publicRoutes = routeConfig.filter(r => !r.path_en.startsWith('dev/'));

  for (const route of publicRoutes) {
    const pair = { en: `/${route.path_en}`, es: `/${route.path_es}` };
    // Principal: primera ruta de routeConfig que pinta el mismo componente con las mismas props
    const first = publicRoutes.find(r => r.component === route.component && r.props === route.props) || route;
    const principal = { en: `/${first.path_en}`, es: `/${first.path_es}` };
    if (!table.has(pair.en)) table.set(pair.en, { lang: 'en', pair, principal });
    if (!table.has(pair.es)) table.set(pair.es, { lang: 'es', pair, principal });
  }

  for (const pair of EXTRA_ROUTE_PAIRS) {
    table.set(pair.en, { lang: 'en', pair, principal: pair });
    table.set(pair.es, { lang: 'es', pair, principal: pair });
  }

  return table;
})();

/** Prefijos de blog: cada articulo existe en un solo idioma, sin pareja. */
const BLOG_POST_PREFIX: Record<SeoLang, string> = {
  en: '/resources/blog/',
  es: '/recursos/blog/',
};

/** Busca la pareja de una ruta dinamica (/jobs/:slug <-> /empleos/:slug). */
function matchDynamic(path: string): { lang: SeoLang; pair: RoutePair } | null {
  for (const prefix of DYNAMIC_PREFIX_PAIRS) {
    for (const lang of ['en', 'es'] as const) {
      if (path.startsWith(prefix[lang]) && path.length > prefix[lang].length) {
        const rest = path.slice(prefix[lang].length);
        return { lang, pair: { en: `${prefix.en}${rest}`, es: `${prefix.es}${rest}` } };
      }
    }
  }
  return null;
}

/**
 * Idioma que fija la URL (null si la ruta sirve ambos idiomas, como la home o /cv/:slug).
 */
export function getPathLanguage(path: string): SeoLang | null {
  const clean = normalizePath(path);
  const entry = ROUTE_TABLE.get(clean);
  if (entry) return entry.lang;
  const dynamic = matchDynamic(clean);
  if (dynamic) return dynamic.lang;
  if (clean.startsWith(BLOG_POST_PREFIX.es)) return 'es';
  if (clean.startsWith(BLOG_POST_PREFIX.en)) return 'en';
  return null;
}

/**
 * Ruta equivalente en el idioma pedido (ya resuelta a la principal si es duplicada).
 * Devuelve null si la ruta no tiene version en ese idioma.
 */
export function getLocalizedPath(path: string, lang: SeoLang): string | null {
  const alternates = getAlternatePaths(path);
  return alternates ? alternates[lang] : null;
}

/** Pareja ES/EN de la ruta (principal en duplicadas) o null si no tiene pareja. */
function getAlternatePaths(path: string): RoutePair | null {
  const clean = normalizePath(path);
  const entry = ROUTE_TABLE.get(clean);
  if (entry) return entry.principal;
  const dynamic = matchDynamic(clean);
  return dynamic ? dynamic.pair : null;
}

/**
 * Ruta canonica de una pagina: la propia, en su idioma. En rutas duplicadas, la
 * principal del mismo idioma (/producto -> /producto/resumen).
 */
export function getCanonicalPath(currentPath: string): string {
  const clean = normalizePath(currentPath);
  const entry = ROUTE_TABLE.get(clean);
  if (entry) return entry.principal[entry.lang];
  return clean;
}

/** URL canonica absoluta de una ruta. */
export function getCanonicalUrlForPath(path: string): string {
  const canonicalPath = getCanonicalPath(path);
  return `${BASE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`;
}

/**
 * Gets the full canonical URL for the current page (en su propio idioma).
 */
export function getPageCanonicalUrl(): string {
  if (typeof window === 'undefined') {
    return `${BASE_URL}/`;
  }
  return getCanonicalUrlForPath(window.location.pathname);
}

/**
 * URLs hreflang reciprocas de una ruta. null si la ruta no tiene version en el otro
 * idioma (home, /cv/:slug, articulos del blog, paginas privadas...): en ese caso no se
 * emite hreflang.
 */
export function getHreflangUrls(path: string): HreflangUrls | null {
  const alternates = getAlternatePaths(path);
  if (!alternates) return null;
  const en = `${BASE_URL}${alternates.en}`;
  const es = `${BASE_URL}${alternates.es}`;
  return { en, es, xDefault: en };
}

// ---------------------------------------------------------------------------
// Redirecciones (rutas fusionadas y prefijos /es, /en antiguos)
// ---------------------------------------------------------------------------

const REDIRECTS: Map<string, string> = new Map(routeRedirects.map(r => [r.from, r.to]));

/** Version antigua en ingles con prefijo de idioma: /es/pricing, /es/companies/plans... */
const LEGACY_LANG_PREFIX = /^\/(es|en)(\/.*)?$/;

/**
 * Destino de una ruta que ya no existe, o null si la ruta es valida.
 * - Rutas fusionadas (config/routeConfig.ts, routeRedirects): /nosotros/mision -> /nosotros.
 * - Prefijo de idioma de la version antigua: /es/pricing -> /precios,
 *   /es/companies/plans -> /empresas/planes, /en/precios -> /pricing, /es -> /.
 *   Si la ruta sin prefijo no tiene pareja en ese idioma, se quita solo el prefijo.
 */
export function getRedirectPath(path: string): string | null {
  const clean = normalizePath(path);
  const direct = REDIRECTS.get(clean);
  if (direct) return direct;
  const match = clean.match(LEGACY_LANG_PREFIX);
  if (!match) return null;
  const lang = match[1] as SeoLang;
  const rest = match[2] || '/';
  const merged = REDIRECTS.get(rest) ?? rest;
  return getLocalizedPath(merged, lang) ?? merged;
}
