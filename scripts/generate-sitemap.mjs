import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Dominio canonico: apex, sin www
const BASE_URL = 'https://yourcvpassport.com';

// Supabase client for fetching dynamic content (solo lecturas GET con la clave publica)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Sitemap] WARNING: Supabase credentials not found. Dynamic URLs (blog, CV, jobs) will be skipped.');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Paginas que no se indexan: /resources y /recursos solo muestran "pagina en construccion"
const EXCLUDED_COMPONENTS = new Set(['UnderConstructionPage']);

/**
 * Rutas ES/EN desde config/routeConfig.ts (fuente unica, la misma que usan la app y
 * utils/canonicalUrl.ts). Se lee el texto del fichero porque este script es Node puro
 * y no puede importar TS. En rutas duplicadas (mismo componente con varias URLs, p. ej.
 * /product y /product/overview) solo entra la principal: la primera que aparece, que es
 * a la que apunta su canonical.
 */
function readRoutePairs() {
  const source = readFileSync(join(__dirname, '..', 'config', 'routeConfig.ts'), 'utf-8');
  const re = /\{\s*en:\s*'([^']+)',\s*es:\s*'([^']+)',\s*componentName:\s*'([^']+)'(?:,\s*props:\s*(\{[^}]*\}))?/g;
  const seen = new Set();
  const pairs = [];
  let m;
  while ((m = re.exec(source)) !== null) {
    const [, en, es, componentName, props = ''] = m;
    if (en.startsWith('dev/') || EXCLUDED_COMPONENTS.has(componentName)) continue;
    const key = `${componentName}|${props}`;
    if (seen.has(key)) continue; // duplicada: su canonical apunta a la principal
    seen.add(key);
    pairs.push({ en: `/${en}`, es: `/${es}` });
  }
  if (pairs.length < 20) {
    throw new Error(`[Sitemap] Solo se leyeron ${pairs.length} rutas de config/routeConfig.ts; revisa el formato.`);
  }
  return pairs;
}

// Rutas bilingues declaradas a mano en App.tsx (fuera de routeConfig)
const EXTRA_ROUTE_PAIRS = [
  { en: '/jobs', es: '/empleos' },
  { en: '/feed', es: '/comunidad' },
];

// Prioridad y frecuencia por ruta inglesa (la espanola hereda las mismas)
const ROUTE_META = {
  '/pricing': { priority: '1.0', changefreq: 'weekly' },
  '/product/overview': { priority: '0.9', changefreq: 'weekly' },
  '/product/stamps': { priority: '0.9', changefreq: 'weekly' },
  '/product/ats': { priority: '0.9', changefreq: 'weekly' },
  '/product/domain': { priority: '0.9', changefreq: 'weekly' },
  '/product/analytics': { priority: '0.9', changefreq: 'weekly' },
  '/product/ai': { priority: '0.9', changefreq: 'weekly' },
  '/professionals/how': { priority: '0.9', changefreq: 'weekly' },
  '/professionals/templates': { priority: '0.9', changefreq: 'weekly' },
  '/professionals/help': { priority: '0.8', changefreq: 'weekly' },
  '/companies/search': { priority: '0.9', changefreq: 'weekly' },
  '/companies/plans': { priority: '0.9', changefreq: 'weekly' },
  '/companies/integrations': { priority: '0.8', changefreq: 'weekly' },
  '/companies/security': { priority: '0.8', changefreq: 'monthly' },
  '/resources/blog': { priority: '0.7', changefreq: 'daily' },
  '/resources/library': { priority: '0.8', changefreq: 'weekly' },
  '/resources/success-stories': { priority: '0.7', changefreq: 'monthly' },
  '/resources/status': { priority: '0.6', changefreq: 'daily' },
  '/about': { priority: '0.7', changefreq: 'monthly' },
  '/about/mission': { priority: '0.6', changefreq: 'monthly' },
  '/about/press': { priority: '0.6', changefreq: 'monthly' },
  '/about/contact': { priority: '0.8', changefreq: 'monthly' },
  '/jobs': { priority: '0.9', changefreq: 'daily' },
  '/feed': { priority: '0.6', changefreq: 'daily' },
  '/terms': { priority: '0.3', changefreq: 'yearly' },
  '/privacy': { priority: '0.3', changefreq: 'yearly' },
};
const DEFAULT_META = { priority: '0.7', changefreq: 'weekly' };

/**
 * Paginas estaticas: la home (misma URL para ambos idiomas, sin hreflang) y cada
 * pareja ES/EN como dos <url> con alternates es/en/x-default reciprocos.
 * Sin /login, /signup, /profiles ni /perfiles (esta ultima es duplicada de /companies/search).
 */
function buildStaticRoutes() {
  const routes = [{ path: '/', priority: '1.0', changefreq: 'daily', alternates: null }];
  for (const pair of [...readRoutePairs(), ...EXTRA_ROUTE_PAIRS]) {
    const meta = ROUTE_META[pair.en] || DEFAULT_META;
    routes.push({ path: pair.en, ...meta, alternates: pair });
    routes.push({ path: pair.es, ...meta, alternates: pair });
  }
  return routes;
}

/** Escapa los caracteres reservados de XML. */
function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * hreflang de una entrada. `alternates` = { en, es } para paginas con version en ambos
 * idiomas; `selfLang` para contenido en un solo idioma (articulos del blog). Sin
 * ninguno de los dos (home, /cv/:slug) no se emite hreflang.
 */
function generateHreflang(route) {
  if (route.alternates) {
    const enUrl = xmlEscape(`${BASE_URL}${route.alternates.en}`);
    const esUrl = xmlEscape(`${BASE_URL}${route.alternates.es}`);
    return [
      `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}" />`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
    ].join('\n');
  }
  if (route.selfLang) {
    return `    <xhtml:link rel="alternate" hreflang="${route.selfLang}" href="${xmlEscape(`${BASE_URL}${route.path}`)}" />`;
  }
  return '';
}

/** Ruta del blog segun el idioma del articulo: cada post vive solo bajo la suya. */
function blogPostPath(slug, lang) {
  return lang === 'en' ? `/resources/blog/${slug}` : `/recursos/blog/${slug}`;
}

/**
 * Read static blog posts from content/posts/index.ts.
 * Posts live as TS files (not in Supabase). We extract slug + published_at + lang
 * from each object of the allPostsMeta block with a regex — robust against any
 * stray characters inside titles/summaries that would break strict JSON.
 */
function readStaticBlogPosts() {
  try {
    const indexPath = join(__dirname, '..', 'content', 'posts', 'index.ts');
    const source = readFileSync(indexPath, 'utf-8');

    const metaStart = source.indexOf('allPostsMeta:');
    if (metaStart === -1) {
      console.warn('[Sitemap] allPostsMeta not found in content/posts/index.ts');
      return [];
    }
    const block = source.slice(metaStart);

    // Cada objeto de allPostsMeta va de "{" a "}" sin llaves internas
    const objRe = /\{[^{}]*"slug":\s*"[^"]+"[^{}]*\}/g;
    const now = new Date();
    const out = [];
    let m;
    while ((m = objRe.exec(block)) !== null) {
      const obj = m[0];
      const slug = obj.match(/"slug":\s*"([^"]+)"/)?.[1];
      const publishedAt = obj.match(/"published_at":\s*"([^"]+)"/)?.[1];
      const lang = obj.match(/"lang":\s*"([^"]+)"/)?.[1] === 'en' ? 'en' : 'es';
      if (!slug || !publishedAt) continue;
      if (new Date(publishedAt) > now) continue;
      out.push({ slug, lang, lastmod: publishedAt.split('T')[0] });
    }
    return out;
  } catch (err) {
    console.error('[Sitemap] Error reading static blog posts:', err.message);
    return [];
  }
}

/**
 * Fetch published blog posts from Supabase (legacy/fallback table)
 */
async function fetchSupabaseBlogPosts() {
  if (!supabase) return [];

  const query = (columns) => supabase
    .from('blog_posts')
    .select(columns)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  try {
    let { data, error } = await query('slug, updated_at, published_at, lang');
    if (error) {
      // Compatibilidad: sin la columna lang los posts de la tabla son en espanol (su DEFAULT)
      console.warn('[Sitemap] blog_posts sin columna lang, se asume "es":', error.message);
      ({ data, error } = await query('slug, updated_at, published_at'));
    }

    if (error) {
      console.error('[Sitemap] Error fetching blog posts:', error.message);
      return [];
    }

    return (data || []).map(post => ({
      slug: post.slug,
      lang: post.lang === 'en' ? 'en' : 'es',
      lastmod: (post.updated_at || post.published_at || new Date().toISOString()).split('T')[0],
    }));
  } catch (err) {
    console.error('[Sitemap] Error fetching blog posts:', err.message);
    return [];
  }
}

/**
 * Combine static + Supabase blog posts, dedup by slug (static wins).
 */
async function fetchBlogPosts() {
  const staticPosts = readStaticBlogPosts();
  const dbPosts = await fetchSupabaseBlogPosts();

  const bySlug = new Map();
  for (const p of dbPosts) bySlug.set(p.slug, p);
  for (const p of staticPosts) bySlug.set(p.slug, p); // static overrides

  return Array.from(bySlug.values()).map(p => ({
    path: blogPostPath(p.slug, p.lang),
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: p.lastmod,
    selfLang: p.lang,
  }));
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

    // Cada oferta existe en /jobs/:slug y /empleos/:slug con hreflang reciprocos
    return (data || []).flatMap(job => {
      const pair = { en: `/jobs/${job.slug}`, es: `/empleos/${job.slug}` };
      const base = {
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: (job.updated_at || job.published_at || new Date().toISOString()).split('T')[0],
        alternates: pair,
      };
      return [{ ...base, path: pair.en }, { ...base, path: pair.es }];
    });
  } catch (err) {
    console.error('[Sitemap] Error fetching job postings:', err.message);
    return [];
  }
}

async function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  const staticRoutes = buildStaticRoutes();

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
    const hreflang = generateHreflang(route);

    return `  <url>
    <loc>${xmlEscape(`${BASE_URL}${route.path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${hreflang ? `${hreflang}\n` : ''}  </url>`;
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

/**
 * Ruta de salida: por defecto public/sitemap.xml (la que usan el build y el workflow
 * diario). Para validar sin tocar el fichero publicado:
 *   node scripts/generate-sitemap.mjs --output=/ruta/temporal/sitemap.xml
 *   SITEMAP_OUTPUT=/ruta/temporal/sitemap.xml node scripts/generate-sitemap.mjs
 */
function resolveOutputPath() {
  const arg = process.argv.slice(2).find(a => a.startsWith('--output='));
  const custom = arg ? arg.slice('--output='.length) : process.env.SITEMAP_OUTPUT;
  return custom ? resolve(custom) : join(__dirname, '..', 'public', 'sitemap.xml');
}

// Generate and save sitemap
try {
  const { sitemap, totalStatic, totalBlog, totalCV, totalJobs } = await generateSitemap();
  const sitemapPath = resolveOutputPath();

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
