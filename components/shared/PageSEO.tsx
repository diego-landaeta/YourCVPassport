import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrlForPath, normalizeUrl, getHreflangUrls, type HreflangUrls } from '../../utils/canonicalUrl';

interface PageSEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  lang?: 'en' | 'es';
  keywords?: string;
  /**
   * URLs hreflang explicitas. Por defecto se calculan a partir de la ruta actual
   * (pareja ES/EN de config/routeConfig.ts); `null` no emite hreflang.
   */
  alternates?: HreflangUrls | null;
}

const PageSEO: React.FC<PageSEOProps> = ({
  title,
  description,
  canonical,
  ogImage = 'https://yourcvpassport.com/og-image.png',
  lang = 'en',
  keywords,
  alternates
}) => {
  const location = useLocation();

  // Canonical: el indicado o la propia URL en su idioma (principal en rutas duplicadas).
  // Nunca se apunta una pagina en espanol a su version inglesa.
  const canonicalUrl = canonical
    ? normalizeUrl(canonical)
    : getCanonicalUrlForPath(location.pathname);
  const fullTitle = `${title} - YourCVPassport`;

  // hreflang reciprocos es/en/x-default (solo si la ruta tiene version en ambos idiomas)
  const hreflangUrls = alternates === undefined ? getHreflangUrls(location.pathname) : alternates;

  // Ensure description is max 160 characters
  const metaDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  return (
    <Helmet key={location.pathname}>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang Tags for Multilingual SEO */}
      {hreflangUrls && <link rel="alternate" hrefLang="en" href={hreflangUrls.en} />}
      {hreflangUrls && <link rel="alternate" hrefLang="es" href={hreflangUrls.es} />}
      {hreflangUrls && <link rel="alternate" hrefLang="x-default" href={hreflangUrls.xDefault} />}

      {/* Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="YourCVPassport" />
      <meta property="og:locale" content={lang === 'es' ? 'es_ES' : 'en_US'} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@YourCVPassport" />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content={lang === 'es' ? 'Spanish' : 'English'} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  );
};

export default PageSEO;
