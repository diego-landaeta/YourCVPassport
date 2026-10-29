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
  /** Datos estructurados JSON-LD (uno o varios objetos). Se emiten como <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  /** Paginas que no deben indexarse (busquedas filtradas, ofertas cerradas...). */
  noindex?: boolean;
  /**
   * Con `noindex`, deja que se sigan los enlaces de la pagina (`noindex, follow`):
   * para listados vacios que no deben indexarse pero cuyos enlaces si interesan.
   */
  followLinks?: boolean;
  /** Tipo Open Graph. `article` para entradas del blog (con las fechas de abajo). */
  ogType?: 'website' | 'article';
  /** ISO 8601. Solo con `ogType="article"` (`article:published_time`). */
  articlePublishedTime?: string;
  /** ISO 8601. Solo con `ogType="article"` (`article:modified_time`). */
  articleModifiedTime?: string;
}

/** Recorta por frase (si hay una que llegue al 60 %) o por palabra, sin anadir «...». */
export function fitMetaDescription(text: string, max = 155): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  const endsStop = /[.!?]$/.test(cut) ? cut.length - 1 : -1;
  const stop = Math.max(lastStop, endsStop);
  if (stop >= max * 0.6) return cut.slice(0, stop + 1).trim();
  const space = cut.lastIndexOf(' ');
  return cut.slice(0, space > 0 ? space : max).replace(/[,;:\s]+$/, '');
}

const PageSEO: React.FC<PageSEOProps> = ({
  title,
  description,
  canonical,
  ogImage = 'https://yourcvpassport.com/og-image.png',
  lang = 'en',
  keywords,
  alternates,
  jsonLd,
  noindex = false,
  followLinks = false,
  ogType = 'website',
  articlePublishedTime,
  articleModifiedTime
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

  // Descripcion de 155 caracteres como mucho, recortada por frase o por palabra y SIN puntos suspensivos
  // (auditoria SEO del 25/10, hallazgo 11: «...» a mitad de palabra en el DOM renderizado).
  const metaDescription = fitMetaDescription(description);

  const robots = noindex ? (followLinks ? 'noindex, follow' : 'noindex, nofollow') : 'index, follow';
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

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
      <meta property="og:type" content={ogType} />
      {ogType === 'article' && articlePublishedTime && <meta property="article:published_time" content={articlePublishedTime} />}
      {ogType === 'article' && articleModifiedTime && <meta property="article:modified_time" content={articleModifiedTime} />}
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
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="language" content={lang === 'es' ? 'Spanish' : 'English'} />
      {/* viewport: lo declara index.html (una sola vez; Helmet lo duplicaba en el DOM renderizado) */}

      {/* Datos estructurados (JSON-LD). Se escapa `<` para que el texto de una oferta no pueda cerrar el script. */}
      {jsonLdList.map((obj, i) => (
        <script key={`jsonld-${i}`} type="application/ld+json">
          {JSON.stringify(obj).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Helmet>
  );
};

export default PageSEO;
