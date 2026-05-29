declare const Deno: any;
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import blogPosts from './blog-posts-data.json' with { type: 'json' };

const BASE_URL = 'https://yourcvpassport.com';

const EN_TO_ES: Record<string, string> = {
  '/': '/',
  '/pricing': '/precios',
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
  '/jobs': '/empleos',
};

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/pricing', priority: '1.0', changefreq: 'weekly' },
  { path: '/product/overview', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/stamps', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/ats', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/domain', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/analytics', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/ai', priority: '0.9', changefreq: 'weekly' },
  { path: '/product', priority: '0.9', changefreq: 'weekly' },
  { path: '/professionals/how', priority: '0.9', changefreq: 'weekly' },
  { path: '/professionals/templates', priority: '0.9', changefreq: 'weekly' },
  { path: '/professionals/help', priority: '0.8', changefreq: 'weekly' },
  { path: '/professionals', priority: '0.9', changefreq: 'weekly' },
  { path: '/companies/search', priority: '0.9', changefreq: 'weekly' },
  { path: '/companies/plans', priority: '0.9', changefreq: 'weekly' },
  { path: '/companies/integrations', priority: '0.8', changefreq: 'weekly' },
  { path: '/companies/security', priority: '0.8', changefreq: 'monthly' },
  { path: '/companies', priority: '0.9', changefreq: 'weekly' },
  { path: '/resources/blog', priority: '0.7', changefreq: 'daily' },
  { path: '/resources/library', priority: '0.8', changefreq: 'weekly' },
  { path: '/resources/success', priority: '0.7', changefreq: 'monthly' },
  { path: '/resources/status', priority: '0.6', changefreq: 'daily' },
  { path: '/resources', priority: '0.7', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/about/mission', priority: '0.6', changefreq: 'monthly' },
  { path: '/about/press', priority: '0.6', changefreq: 'monthly' },
  { path: '/about/contact', priority: '0.8', changefreq: 'monthly' },
  { path: '/jobs', priority: '0.9', changefreq: 'daily' },
];

function getSpanishPath(enPath: string): string | null {
  if (EN_TO_ES[enPath]) return EN_TO_ES[enPath];
  if (enPath.startsWith('/resources/blog/')) return enPath.replace('/resources/blog/', '/recursos/blog/');
  if (enPath.startsWith('/jobs/')) return enPath.replace('/jobs/', '/empleos/');
  return null;
}

type Entry = { path: string; lastmod: string; priority: string; changefreq: string };

function renderEntry(e: Entry): string {
  return `  <url>
    <loc>${BASE_URL}${e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`;
}

async function generateSitemap(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const staticEntries: Entry[] = [];
  const blogEntries: Entry[] = [];
  const cvEntries: Entry[] = [];

  // Static pages — keep declared order so jerarchy reads naturally (home → pricing → product → ...).
  // Each EN entry is followed immediately by its ES counterpart when one exists.
  for (const r of STATIC_ROUTES) {
    staticEntries.push({ path: r.path, lastmod: today, priority: r.priority, changefreq: r.changefreq });
    const esPath = getSpanishPath(r.path);
    if (esPath && esPath !== r.path) {
      staticEntries.push({ path: esPath, lastmod: today, priority: r.priority, changefreq: r.changefreq });
    }
  }

  // Blog posts — alphabetical by slug
  for (const post of blogPosts as Array<{ slug: string; published_at: string }>) {
    const lastmod = post.published_at.split('T')[0];
    blogEntries.push({ path: `/resources/blog/${post.slug}`, lastmod, priority: '0.7', changefreq: 'monthly' });
  }
  blogEntries.sort((a, b) => a.path.localeCompare(b.path));

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('slug, updated_at')
      .eq('is_active', true)
      .eq('profile_hidden', false)
      .not('full_name', 'is', null)
      .not('headline', 'is', null)
      .not('slug', 'is', null);

    if (!error && profiles) {
      for (const p of profiles) {
        const lastmod = p.updated_at ? p.updated_at.split('T')[0] : today;
        cvEntries.push({ path: `/cv/${p.slug}`, lastmod, priority: '0.6', changefreq: 'weekly' });
      }
      cvEntries.sort((a, b) => a.path.localeCompare(b.path));
    }
  } catch (_err) {
    // Continue without CV profiles if the DB query fails.
  }

  const rendered = [...staticEntries, ...blogEntries, ...cvEntries].map(renderEntry);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rendered.join('\n')}
</urlset>`;
}

let cache: { xml: string | null; ts: number } = { xml: null, ts: 0 };
const TTL_MS = 60 * 60 * 1000;

serve(async (_req: Request) => {
  try {
    const now = Date.now();
    if (cache.xml && now - cache.ts < TTL_MS) {
      return new Response(cache.xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    const xml = await generateSitemap();
    cache = { xml, ts: now };
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (_err) {
    return new Response('Error generating sitemap', { status: 500 });
  }
});
