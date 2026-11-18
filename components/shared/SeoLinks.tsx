import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrlForPath, getHreflangUrls } from '../../utils/canonicalUrl';

/**
 * Canonical y hreflang de la ruta actual, para las páginas que ponen su propio
 * <title> con Helmet en vez de usar PageSEO (legales, cookies, comunidad).
 * Sin esto, al hidratar Helmet quitaba las etiquetas data-rh del HTML estático
 * (seo/static-meta.mjs) y la página se quedaba sin canonical ni hreflang
 * (auditoría del 15/10/2026).
 */
const SeoLinks: React.FC = () => {
  const { pathname } = useLocation();
  const canonical = getCanonicalUrlForPath(pathname);
  const hreflang = getHreflangUrls(pathname);
  return (
    <Helmet>
      <link rel="canonical" href={canonical} />
      <meta property="og:url" content={canonical} />
      {hreflang && <link rel="alternate" hrefLang="en" href={hreflang.en} />}
      {hreflang && <link rel="alternate" hrefLang="es" href={hreflang.es} />}
      {hreflang && <link rel="alternate" hrefLang="x-default" href={hreflang.xDefault} />}
    </Helmet>
  );
};

export default SeoLinks;
