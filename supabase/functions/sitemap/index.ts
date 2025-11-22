declare const Deno: any;
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Base URL of your website
const BASE_URL = 'https://www.yourcvpassport.com';

// Define your static routes here, mirroring routeConfig.ts for server-side generation.
const pathMappings = [
  // Static pages not in routeConfig
  { en: '', es: '' },
  { en: 'login', es: 'login' },
  { en: 'signup', es: 'signup' },
  
  // Dynamic pages from routeConfig.ts
  { en: 'product/overview', es: 'producto/resumen' },
  { en: 'product/stamps', es: 'producto/sellos' },
  { en: 'product/ats', es: 'producto/ats' },
  { en: 'product/domain', es: 'producto/dominio' },
  { en: 'product/analytics', es: 'producto/analiticas' },
  { en: 'product/ai', es: 'producto/ia' },
  { en: 'companies/search', es: 'empresas/busqueda' },
  { en: 'about', es: 'nosotros' },
  { en: 'about/mission', es: 'nosotros/mision' },
  { en: 'about/press', es: 'nosotros/prensa' },
  { en: 'about/contact', es: 'nosotros/contacto' },
  { en: 'professionals/how', es: 'profesionales/como-funciona' },
  { en: 'professionals/templates', es: 'profesionales/plantillas' },
  { en: 'pricing', es: 'precios' },
  { en: 'professionals/help', es: 'profesionales/ayuda' },
  { en: 'companies/plans', es: 'empresas/planes' },
  { en: 'companies/integrations', es: 'empresas/integraciones' },
  { en: 'companies/security', es: 'empresas/seguridad' },
  { en: 'resources/blog', es: 'recursos/blog' },
  { en: 'resources/library', es: 'recursos/biblioteca' },
  { en: 'resources/success', es: 'recursos/exito' },
  { en: 'resources/status', es: 'recursos/estado' },
  { en: 'profiles', es: 'perfiles' },
];

// Popular category combinations for SEO pages
const POPULAR_COUNTRIES = ['spain', 'mexico', 'argentina', 'colombia', 'chile', 'us', 'gb'];
const POPULAR_CITIES = {
  spain: ['madrid', 'barcelona', 'valencia', 'seville'],
  mexico: ['mexico-city', 'guadalajara', 'monterrey'],
  us: ['new-york', 'san-francisco', 'austin'],
  gb: ['london', 'manchester', 'edinburgh'],
};
const POPULAR_ROLES = [
  'frontend-developer',
  'backend-developer',
  'fullstack-developer',
  'ui-designer',
  'ux-designer',
  'product-manager',
  'data-scientist',
  'devops-engineer',
  'mobile-developer',
  'software-engineer',
];
const POPULAR_SKILLS = [
  'react',
  'javascript',
  'python',
  'typescript',
  'nodejs',
  'java',
  'aws',
  'docker',
  'kubernetes',
];

async function generateSitemap() {
  // Generate URLs for static pages with language alternates
  const staticUrls = pathMappings.map(({ en, es }) => {
    const enUrl = `${BASE_URL}/${en}`.replace(/\/$/, ''); // Remove trailing slash for root
    const esUrl = `${BASE_URL}/es/${es}`.replace(/\/es\/*$/, '/es'); // Handle root ES path

    return `
  <url>
    <loc>${enUrl}</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>
  </url>
  <url>
    <loc>${esUrl}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}"/>
  </url>`;
  }).join('');
  
  // Generate URLs for dynamic profile pages
  let profileUrls = '';
  try {
    // IMPORTANT: Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set as environment variables in your Supabase project.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
    );

    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('slug')
      .not('slug', 'is', null);

    if (error) {
      throw error;
    }

    if (profiles) {
      profileUrls = profiles.map(profile => `
  <url>
    <loc>${BASE_URL}/cv/${profile.slug}</loc>
  </url>`).join('');
    }
  } catch (err) {
    console.error('Error fetching profiles for sitemap:', err);
    // Continue without profile URLs if the database call fails
  }

  // Generate URLs for profile category pages (SEO optimized)
  const categoryUrls: string[] = [];

  // Country-only pages
  POPULAR_COUNTRIES.forEach(country => {
    categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/profiles/${country}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/perfiles/${country}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
  });

  // Country + City combinations
  Object.entries(POPULAR_CITIES).forEach(([country, cities]) => {
    cities.forEach(city => {
      categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/profiles/${country}/${city}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`);
      categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/perfiles/${country}/${city}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`);
    });
  });

  // Role-only pages
  POPULAR_ROLES.forEach(role => {
    categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/profiles/${role}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/perfiles/${role}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
  });

  // Country + Role combinations (top countries only)
  const topCountries = ['spain', 'mexico', 'us'];
  topCountries.forEach(country => {
    POPULAR_ROLES.slice(0, 5).forEach(role => {
      categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/profiles/${country}/${role}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });
  });

  // Country + City + Role combinations (most popular only)
  [
    { country: 'spain', city: 'madrid', role: 'frontend-developer' },
    { country: 'spain', city: 'barcelona', role: 'backend-developer' },
    { country: 'spain', city: 'valencia', role: 'ui-designer' },
    { country: 'mexico', city: 'mexico-city', role: 'fullstack-developer' },
    { country: 'us', city: 'new-york', role: 'software-engineer' },
    { country: 'us', city: 'san-francisco', role: 'product-manager' },
  ].forEach(({ country, city, role }) => {
    categoryUrls.push(`
  <url>
    <loc>${BASE_URL}/profiles/${country}/${city}/${role}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  });

  const categoryUrlsString = categoryUrls.join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">${staticUrls}${profileUrls}${categoryUrlsString}
</urlset>`;
}

serve(async (_req) => {
  try {
    const sitemap = await generateSitemap();
    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (err) {
    console.error(err);
    return new Response('Error generating sitemap', { status: 500 });
  }
});