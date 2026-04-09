import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const BASE_URL = 'https://yourcvpassport.com';

// Supabase client for fetching dynamic content
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Sitemap] WARNING: Supabase credentials not found. Dynamic URLs (blog, CV, jobs) will be skipped.');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// English-to-Spanish route mapping for hreflang
const EN_TO_ES_MAPPING = {
  '/': '/',
  '/product/overview': '/producto/resumen',
  '/product/stamps': '/producto/sellos',
  '/product/ats': '/producto/ats',
  '/product/domain': '/producto/dominio',
  '/product/analytics': '/producto/analiticas',
  '/product/ai': '/producto/ia',
  '/product': '/producto',
  '/professionals/how': '/profesionales/como-funciona',
  '/professionals/templates': '/profesionales/plantillas',
  '/professionals/help': '/profesionales/ayuda',
  '/professionals': '/profesionales',
  '/companies/search': '/empresas/busqueda',
  '/companies/plans': '/empresas/planes',
  '/companies/integrations': '/empresas/integraciones',
  '/companies/security': '/empresas/seguridad',
  '/companies': '/empresas',
  '/resources/blog': '/recursos/blog',
  '/resources/library': '/recursos/biblioteca',
  '/resources/success': '/recursos/exito',
  '/resources/status': '/recursos/estado',
  '/resources': '/recursos',
  '/about': '/nosotros',
  '/about/mission': '/nosotros/mision',
  '/about/press': '/nosotros/prensa',
  '/about/contact': '/nosotros/contacto',
  '/pricing': '/precios',
  '/jobs': '/empleos',
};

// Static routes (English canonical only - NO /login, /signup, /profiles, /perfiles)
const staticRoutes = [
  // Home Page (highest priority)
  { path: '/', priority: '1.0', changefreq: 'daily' },

  // Pricing Page
  { path: '/pricing', priority: '1.0', changefreq: 'weekly' },

  // Product Pages
  { path: '/product/overview', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/stamps', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/ats', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/domain', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/analytics', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/ai', priority: '0.9', changefreq: 'weekly' },
  { path: '/product', priority: '0.9', changefreq: 'weekly' },

  // Professionals Pages
  { path: '/professionals/how', priority: '0.9', changefreq: 'weekly' },
  { path: '/professionals/templates', priority: '0.9', changefreq: 'weekly' },
  { path: '/professionals/help', priority: '0.8', changefreq: 'weekly' },
  { path: '/professionals', priority: '0.9', changefreq: 'weekly' },

  // Companies Pages
  { path: '/companies/search', priority: '0.9', changefreq: 'weekly' },
  { path: '/companies/plans', priority: '0.9', changefreq: 'weekly' },
  { path: '/companies/integrations', priority: '0.8', changefreq: 'weekly' },
  { path: '/companies/security', priority: '0.8', changefreq: 'monthly' },
  { path: '/companies', priority: '0.9', changefreq: 'weekly' },

  // Resources Pages
  { path: '/resources/blog', priority: '0.7', changefreq: 'daily' },
  { path: '/resources/library', priority: '0.8', changefreq: 'weekly' },
  { path: '/resources/success', priority: '0.7', changefreq: 'monthly' },
  { path: '/resources/status', priority: '0.6', changefreq: 'daily' },
  { path: '/resources', priority: '0.7', changefreq: 'weekly' },

  // About Pages
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/about/mission', priority: '0.6', changefreq: 'monthly' },
  { path: '/about/press', priority: '0.6', changefreq: 'monthly' },
  { path: '/about/contact', priority: '0.8', changefreq: 'monthly' },

  // Jobs listing page
  { path: '/jobs', priority: '0.9', changefreq: 'daily' },
];

/**
 * Get Spanish path for an English path
 */
function getSpanishPath(enPath) {
  if (EN_TO_ES_MAPPING[enPath]) {
    return EN_TO_ES_MAPPING[enPath];
  }
  // Dynamic routes
  if (enPath.startsWith('/resources/blog/')) {
    return enPath.replace('/resources/blog/', '/recursos/blog/');
  }
  if (enPath.startsWith('/jobs/')) {
    return enPath.replace('/jobs/', '/empleos/');
  }
  // CV profiles and other routes without Spanish equivalents
  return null;
}

/**
 * Generate hreflang XML for a URL entry
 */
function generateHreflang(enPath) {
  const enUrl = `${BASE_URL}${enPath}`;
  const esPath = getSpanishPath(enPath);

  let hreflang = '';
  hreflang += `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />\n`;
  if (esPath) {
    const esUrl = `${BASE_URL}${esPath}`;
    hreflang += `    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}" />\n`;
  }
  hreflang += `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />`;
  return hreflang;
}

/**
 * Fetch published blog posts from Supabase
 */
async function fetchBlogPosts() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[Sitemap] Error fetching blog posts:', error.message);
      return [];
    }

    return (data || []).map(post => ({
      path: `/resources/blog/${post.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: (post.updated_at || post.published_at || new Date().toISOString()).split('T')[0],
    }));
  } catch (err) {
    console.error('[Sitemap] Error fetching blog posts:', err.message);
    return [];
  }
}

/**
 * Fetch public, completed CV profiles from Supabase
 */
async function fetchCVProfiles() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('slug, updated_at')
      .eq('is_active', true)
      .eq('profile_hidden', false)
      .not('full_name', 'is', null)
      .not('headline', 'is', null)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Sitemap] Error fetching CV profiles:', error.message);
      return [];
    }

    return (data || []).map(profile => ({
      path: `/cv/${profile.slug}`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: (profile.updated_at || new Date().toISOString()).split('T')[0],
    }));
  } catch (err) {
    console.error('[Sitemap] Error fetching CV profiles:', err.message);
    return [];
  }
}

/**
 * Fetch published job postings from Supabase
 */
async function fetchJobPostings() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('slug, updated_at, published_at')
      .eq('status', 'PUBLISHED')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[Sitemap] Error fetching job postings:', error.message);
      return [];
    }

    return (data || []).map(job => ({
      path: `/jobs/${job.slug}`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: (job.updated_at || job.published_at || new Date().toISOString()).split('T')[0],
    }));
  } catch (err) {
    console.error('[Sitemap] Error fetching job postings:', err.message);
    return [];
  }
}

async function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];

  // Fetch dynamic content in parallel
  const [blogPosts, cvProfiles, jobPostings] = await Promise.all([
    fetchBlogPosts(),
    fetchCVProfiles(),
    fetchJobPostings(),
  ]);

  // Combine all routes
  const allRoutes = [
    ...staticRoutes.map(r => ({ ...r, lastmod: currentDate })),
    ...blogPosts,
    ...cvProfiles,
    ...jobPostings,
  ];

  const urlEntries = allRoutes.map(route => {
    const lastmod = route.lastmod || currentDate;
    const hreflang = generateHreflang(route.path);

    return `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${hreflang}
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>
`;

  return { sitemap, totalStatic: staticRoutes.length, totalBlog: blogPosts.length, totalCV: cvProfiles.length, totalJobs: jobPostings.length };
}

// Generate and save sitemap
try {
  const { sitemap, totalStatic, totalBlog, totalCV, totalJobs } = await generateSitemap();
  const sitemapPath = join(__dirname, '..', 'public', 'sitemap.xml');

  writeFileSync(sitemapPath, sitemap, 'utf-8');
  console.log('Sitemap generated successfully at:', sitemapPath);
  console.log(`Total URLs: ${totalStatic + totalBlog + totalCV + totalJobs}`);
  console.log(`  Static pages: ${totalStatic}`);
  console.log(`  Blog posts: ${totalBlog}`);
  console.log(`  CV profiles: ${totalCV}`);
  console.log(`  Job postings: ${totalJobs}`);
} catch (error) {
  console.error('Error generating sitemap:', error);
  process.exit(1);
}
