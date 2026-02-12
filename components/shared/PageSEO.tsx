import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getPageCanonicalUrl, normalizeUrl, getCanonicalPath, getHreflangUrls } from '../../utils/canonicalUrl';

interface PageSEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  lang?: 'en' | 'es';
  keywords?: string;
}

const PageSEO: React.FC<PageSEOProps> = ({
  title,
  description,
  canonical,
  ogImage = 'https://yourcvpassport.com/og-image.png',
  lang = 'en',
  keywords
}) => {
  const location = useLocation();
  const baseUrl = 'https://yourcvpassport.com';

  // Use provided canonical, or auto-generate from current page (maps ES to EN)
  const canonicalUrl = canonical
    ? normalizeUrl(canonical)
    : getPageCanonicalUrl();
  const fullTitle = `${title} - YourCVPassport`;

  // Get hreflang URLs for alternate language versions
  const canonicalPath = typeof window !== 'undefined'
    ? getCanonicalPath(window.location.pathname)
    : '/';
  const hreflangUrls = getHreflangUrls(canonicalPath);

  // Ensure description is max 160 characters
  const metaDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  // Force update on route change
  useEffect(() => {
    // Directly update document title as a fallback to ensure it updates immediately
    document.title = fullTitle;

    // Update description meta tag
    const metaDescTag = document.querySelector('meta[name="description"]');
    if (metaDescTag) {
      metaDescTag.setAttribute('content', metaDescription);
    }
  }, [location.pathname, fullTitle, metaDescription]);

  return (
    <Helmet key={location.pathname}>
      {/* Basic Meta Tags */}
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang Tags for Multilingual SEO */}
      <link rel="alternate" hrefLang="en" href={hreflangUrls.en} />
      <link rel="alternate" hrefLang="es" href={hreflangUrls.es} />
      <link rel="alternate" hrefLang="x-default" href={hreflangUrls.xDefault} />

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
