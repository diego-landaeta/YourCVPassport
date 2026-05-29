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

function buildHreflang(enPath: string): string {
  const enUrl = `${BASE_URL}${enPath}`;
  const esPath = getSpanishPath(enPath);
  let out = `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />\n`;
  if (esPath) {
    out += `    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}${esPath}" />\n`;
  }
  out += `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />`;
  return out;
}

function urlEntry(path: string, lastmod: string | null, priority: string, changefreq: string): string {
  const lastmodLine = lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '';
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
${lastmodLine}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${buildHreflang(path)}
  </url>`;
}

async function generateSitemap(): Promise<string> {
  const entries: string[] = [];

  // Static pages — no lastmod (we don't know when their content really changed)
  for (const r of STATIC_ROUTES) {
    entries.push(urlEntry(r.path, null, r.priority, r.changefreq));
  }

  // Blog posts — lastmod = published_at
  for (const post of blogPosts as Array<{ slug: string; published_at: string }>) {
    const lastmod = post.published_at.split('T')[0];
    entries.push(urlEntry(`/resources/blog/${post.slug}`, lastmod, '0.7', 'monthly'));
  }

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
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false });

    // CV profiles — lastmod = profiles.updated_at
    if (!error && profiles) {
      for (const p of profiles) {
        const lastmod = p.updated_at ? p.updated_at.split('T')[0] : null;
        entries.push(urlEntry(`/cv/${p.slug}`, lastmod, '0.6', 'weekly'));
      }
    }
  } catch (_err) {
    // Continue without CV profiles if the DB query fails — better a partial sitemap than none.
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join('\n')}
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
