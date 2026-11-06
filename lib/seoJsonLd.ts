/**
 * Datos estructurados (JSON-LD) de las paginas publicas de marketing.
 *
 * - BlogPosting + BreadcrumbList en cada articulo del blog.
 * - Organization + WebSite en la home.
 *
 * Son funciones puras: PageSEO las emite con su soporte `jsonLd`.
 */
import { BASE_URL } from '../utils/canonicalUrl';

const SCHEMA = 'https://schema.org';
export const SITE_NAME = 'YourCVPassport';
const LOGO_URL = `${BASE_URL}/favicon-512x512.png`;
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

type JsonLd = Record<string, unknown>;

/** Organization: la marca (una sola, con id estable para referenciarla desde otros nodos). */
export function organizationJsonLd(): JsonLd {
  return {
    '@context': SCHEMA,
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: SITE_NAME,
    url: `${BASE_URL}/`,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
  };
}

/** WebSite: el sitio, con su idioma principal y el editor (la Organization). */
export function webSiteJsonLd(lang: 'es' | 'en'): JsonLd {
  return {
    '@context': SCHEMA,
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: SITE_NAME,
    url: `${BASE_URL}/`,
    inLanguage: lang,
    publisher: { '@id': `${BASE_URL}/#organization` },
  };
}

export interface BreadcrumbItem {
  name: string;
  /** URL absoluta. */
  url: string;
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': SCHEMA,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Fecha ISO 8601 valida o `undefined` (una fecha rota no debe llegar al JSON-LD ni a las meta). */
export function toIsoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export interface BlogPostingInput {
  /** URL canonica absoluta del articulo. */
  url: string;
  headline: string;
  description?: string;
  image?: string | null;
  lang: 'es' | 'en';
  authorName?: string | null;
  category?: string | null;
  /** ISO 8601 */
  datePublished?: string;
  /** ISO 8601 */
  dateModified?: string;
}

export function blogPostingJsonLd(input: BlogPostingInput): JsonLd {
  const author = input.authorName?.trim()
    ? { '@type': 'Person', name: input.authorName.trim() }
    : { '@id': `${BASE_URL}/#organization` };
  const ld: JsonLd = {
    '@context': SCHEMA,
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    url: input.url,
    headline: input.headline,
    inLanguage: input.lang,
    image: [input.image || DEFAULT_IMAGE],
    author,
    publisher: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
  };
  if (input.description) ld.description = input.description;
  if (input.category) ld.articleSection = input.category;
  if (input.datePublished) ld.datePublished = input.datePublished;
  if (input.dateModified || input.datePublished) ld.dateModified = input.dateModified || input.datePublished;
  return ld;
}
