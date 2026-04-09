/**
 * Servidor Express para Meta Tags SEO Dinámicos
 *
 * Este servidor intercepta peticiones a /cv/:slug y:
 * 1. Consulta el perfil del usuario en Supabase
 * 2. Genera meta tags personalizados desde los datos reales
 * 3. Inyecta los meta tags en el HTML
 * 4. Sirve el HTML con los meta tags correctos
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import translate from 'google-translate-api-x';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configurar Supabase (cliente anónimo para consultas públicas)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Cliente Admin de Supabase (para operaciones privilegiadas como eliminar usuarios)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.warn('[Server] WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Admin operations (like user deletion) will fail.');
}

const supabaseAdmin = serviceRoleKey ? createClient(
  process.env.VITE_SUPABASE_URL,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// ===== API DE TRADUCCIÓN =====
// Endpoint para traducir textos usando Google Translate (server-side, sin CORS)

app.post('/api/translate', async (req, res) => {
  try {
    const { texts, sourceLang, targetLang } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts array is required' });
    }

    if (!sourceLang || !targetLang) {
      return res.status(400).json({ error: 'sourceLang and targetLang are required' });
    }

    // Filtrar textos vacíos y obtener únicos
    const uniqueTexts = [...new Set(texts.filter(t => t && t.trim() !== ''))];

    if (uniqueTexts.length === 0) {
      return res.json({ translations: {} });
    }

    // Si mismo idioma, devolver sin cambios
    if (sourceLang === targetLang) {
      const translations = {};
      uniqueTexts.forEach(t => translations[t] = t);
      return res.json({ translations });
    }

    console.log(`[Translate API] Translating ${uniqueTexts.length} texts: ${sourceLang} -> ${targetLang}`);

    const translations = {};
    let successCount = 0;

    // Traducir en batches pequeños para evitar problemas
    const BATCH_SIZE = 10;

    for (let i = 0; i < uniqueTexts.length; i += BATCH_SIZE) {
      const batch = uniqueTexts.slice(i, i + BATCH_SIZE);

      try {
        // google-translate-api-x soporta arrays
        const results = await translate(batch, {
          from: sourceLang,
          to: targetLang,
        });

        // Procesar resultados (puede ser array o objeto único)
        const resultsArray = Array.isArray(results) ? results : [results];

        batch.forEach((text, idx) => {
          if (resultsArray[idx] && resultsArray[idx].text) {
            translations[text] = resultsArray[idx].text;
            successCount++;
          }
        });

        console.log(`[Translate API] Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} texts processed`);

      } catch (batchError) {
        console.error(`[Translate API] Batch error:`, batchError.message);
        // Intentar uno por uno si el batch falla
        for (const text of batch) {
          try {
            const result = await translate(text, { from: sourceLang, to: targetLang });
            translations[text] = result.text;
            successCount++;
          } catch (singleError) {
            console.error(`[Translate API] Single error for "${text.substring(0, 30)}...":`, singleError.message);
          }
        }
      }
    }

    console.log(`[Translate API] Completed: ${successCount}/${uniqueTexts.length} texts translated`);

    res.json({ translations, success: successCount, total: uniqueTexts.length });

  } catch (error) {
    console.error('[Translate API] Error:', error.message);
    res.status(500).json({ error: 'Translation failed', message: error.message });
  }
});

// Endpoint de health check para la API de traducción
app.get('/api/translate/health', async (req, res) => {
  try {
    const result = await translate('hello', { from: 'en', to: 'es' });
    res.json({
      status: 'ok',
      provider: 'google-translate-api-x',
      test: { input: 'hello', output: result.text }
    });
  } catch (error) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});

// ===== API DE ADMINISTRACIÓN =====

// Endpoint para eliminar usuarios (requiere admin)
app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar el token y obtener el usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verificar que el usuario es admin
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Prevenir que un admin se elimine a sí mismo
    if (userId === user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    console.log(`[Admin API] Admin ${user.id} deleting user ${userId}`);

    // Verificar que el cliente admin está configurado
    if (!supabaseAdmin) {
      console.error('[Admin API] supabaseAdmin not configured - SUPABASE_SERVICE_ROLE_KEY missing');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Admin operations not available. SUPABASE_SERVICE_ROLE_KEY not configured.'
      });
    }

    // Usar el cliente Admin para eliminar el usuario de auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(`[Admin API] Error deleting user:`, deleteError);
      return res.status(500).json({ error: 'Failed to delete user', details: deleteError.message });
    }

    console.log(`[Admin API] User ${userId} deleted successfully`);
    res.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('[Admin API] Error:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// ===== SITEMAP DINÁMICO =====
// Se regenera en cada request - siempre incluye los últimos posts/CVs/jobs publicados
// Cache de 1 hora para no sobrecargar Supabase

let sitemapCache = { xml: null, timestamp: 0 };
const SITEMAP_CACHE_TTL = 60 * 60 * 1000; // 1 hora

const SITEMAP_EN_TO_ES = {
  '/': '/',
  '/pricing': '/precios',
  '/product/overview': '/producto/resumen',
  '/product/stamps': '/producto/sellos',
  '/product/ats': '/producto/ats',
  '/product/domain': '/producto/dominio',
  '/product/analytics': '/producto/analiticas',
  '/product/ai': '/producto/ia',
  '/professionals/how': '/profesionales/como-funciona',
  '/professionals/templates': '/profesionales/plantillas',
  '/professionals/help': '/profesionales/ayuda',
  '/companies/search': '/empresas/busqueda',
  '/companies/plans': '/empresas/planes',
  '/companies/integrations': '/empresas/integraciones',
  '/companies/security': '/empresas/seguridad',
  '/resources/blog': '/recursos/blog',
  '/resources/library': '/recursos/biblioteca',
  '/resources/success-stories': '/recursos/exito',
  '/resources/status': '/recursos/estado',
  '/about': '/nosotros',
  '/about/mission': '/nosotros/mision',
  '/about/press': '/nosotros/prensa',
  '/about/contact': '/nosotros/contacto',
  '/jobs': '/empleos',
};

function getEsPath(enPath) {
  if (SITEMAP_EN_TO_ES[enPath]) return SITEMAP_EN_TO_ES[enPath];
  if (enPath.startsWith('/resources/blog/')) return enPath.replace('/resources/blog/', '/recursos/blog/');
  if (enPath.startsWith('/jobs/')) return enPath.replace('/jobs/', '/empleos/');
  return null;
}

function sitemapEntry(path, lastmod, priority, changefreq) {
  const base = 'https://yourcvpassport.com';
  const esPath = getEsPath(path);
  let hreflang = `    <xhtml:link rel="alternate" hreflang="en" href="${base}${path}" />\n`;
  if (esPath) hreflang += `    <xhtml:link rel="alternate" hreflang="es" href="${base}${esPath}" />\n`;
  hreflang += `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${path}" />`;
  return `  <url>\n    <loc>${base}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n${hreflang}\n  </url>`;
}

async function generateDynamicSitemap() {
  const now = new Date().toISOString().split('T')[0];
  const entries = [];

  // Static pages
  const staticPages = [
    ['/', '1.0', 'daily'], ['/pricing', '1.0', 'weekly'],
    ['/product/overview', '0.9', 'weekly'], ['/product/stamps', '0.9', 'weekly'],
    ['/product/ats', '0.9', 'weekly'], ['/product/domain', '0.9', 'weekly'],
    ['/product/analytics', '0.9', 'weekly'], ['/product/ai', '0.9', 'weekly'],
    ['/professionals/how', '0.9', 'weekly'], ['/professionals/templates', '0.9', 'weekly'],
    ['/professionals/help', '0.8', 'weekly'],
    ['/companies/search', '0.9', 'weekly'], ['/companies/plans', '0.9', 'weekly'],
    ['/companies/integrations', '0.8', 'weekly'], ['/companies/security', '0.8', 'monthly'],
    ['/resources/blog', '0.9', 'daily'], ['/resources/library', '0.8', 'weekly'],
    ['/resources/success-stories', '0.7', 'monthly'], ['/resources/status', '0.6', 'daily'],
    ['/about', '0.7', 'monthly'], ['/about/mission', '0.6', 'monthly'],
    ['/about/press', '0.6', 'monthly'], ['/about/contact', '0.8', 'monthly'],
    ['/jobs', '0.9', 'daily'],
  ];
  for (const [path, priority, freq] of staticPages) {
    entries.push(sitemapEntry(path, now, priority, freq));
  }

  // Blog posts (only published, published_at <= now)
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });
    if (posts) {
      for (const p of posts) {
        const lastmod = (p.updated_at || p.published_at || now).split('T')[0];
        entries.push(sitemapEntry(`/resources/blog/${p.slug}`, lastmod, '0.7', 'monthly'));
      }
    }
  } catch (e) { console.error('[Sitemap] Blog error:', e.message); }

  // CV profiles (active, not hidden, complete)
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('slug, updated_at')
      .eq('is_active', true)
      .eq('profile_hidden', false)
      .not('full_name', 'is', null)
      .not('headline', 'is', null)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false });
    if (profiles) {
      for (const p of profiles) {
        const lastmod = (p.updated_at || now).split('T')[0];
        entries.push(sitemapEntry(`/cv/${p.slug}`, lastmod, '0.6', 'weekly'));
      }
    }
  } catch (e) { console.error('[Sitemap] Profiles error:', e.message); }

  // Job postings
  try {
    const { data: jobs } = await supabase
      .from('job_postings')
      .select('slug, updated_at, published_at')
      .eq('status', 'PUBLISHED')
      .order('published_at', { ascending: false });
    if (jobs) {
      for (const j of jobs) {
        const lastmod = (j.updated_at || j.published_at || now).split('T')[0];
        entries.push(sitemapEntry(`/jobs/${j.slug}`, lastmod, '0.7', 'weekly'));
      }
    }
  } catch (e) { console.error('[Sitemap] Jobs error:', e.message); }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>`;
}

app.get('/sitemap.xml', async (req, res) => {
  try {
    const now = Date.now();
    if (sitemapCache.xml && (now - sitemapCache.timestamp) < SITEMAP_CACHE_TTL) {
      console.log('[Sitemap] Serving from cache');
      res.set('Content-Type', 'application/xml');
      return res.send(sitemapCache.xml);
    }

    console.log('[Sitemap] Generating fresh sitemap...');
    const xml = await generateDynamicSitemap();
    sitemapCache = { xml, timestamp: now };
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('[Sitemap] Error:', error.message);
    res.status(500).send('Error generating sitemap');
  }
});

// Servir archivos estáticos
app.use(express.static('dist'));

// Middleware para inyectar meta tags en perfiles
app.get('/cv/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userAgent = req.headers['user-agent'] || '';

    // Detectar si es un bot de SEO
    const isBot = /googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent);

    console.log(`[SEO] Request for /cv/${slug} - Bot: ${isBot ? 'Yes' : 'No'}`);

    // Consultar perfil en la base de datos
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, headline, summary, location, avatar_url, slug, meta_title, meta_description')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !profile) {
      console.log(`[SEO] Profile not found: ${slug}`);
      return next(); // Dejar que Vite/React maneje el 404
    }

    // Verificar que el perfil esté completo
    if (!profile.full_name || !profile.headline) {
      console.log(`[SEO] Profile incomplete: ${slug}`);
      return next();
    }

    console.log(`[SEO] Profile found: ${profile.full_name}`);

    // Obtener skills y experiencias
    const [
      { data: skills },
      { data: experiences }
    ] = await Promise.all([
      supabase.from('skills').select('name').eq('profile_id', profile.id).order('sort_order').limit(7),
      supabase.from('experiences').select('title').eq('profile_id', profile.id).order('start_date', { ascending: false }).limit(3)
    ]);

    // Generar meta tags personalizados
    const metaTags = generateMetaTags(profile, skills || [], experiences || []);

    // Leer el HTML base
    const htmlPath = path.resolve(__dirname, 'dist/index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Inyectar meta tags personalizados
    html = injectMetaTags(html, metaTags);

    // Log de meta tags generados
    console.log(`[SEO] Meta tags injected for ${profile.full_name}:`);
    console.log(`  - Title: ${metaTags.title}`);
    console.log(`  - Description: ${metaTags.description.substring(0, 80)}...`);

    // Servir HTML con meta tags personalizados
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('[SEO] Error:', error.message);
    next(); // Continuar con el siguiente middleware
  }
});

// Fallback: servir index.html para todas las demás rutas (SPA)
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist/index.html'));
});

// Funciones auxiliares

function generateMetaTags(profile, skills, experiences) {
  // Title
  const title = profile.meta_title ||
    `${profile.full_name} - ${profile.headline} | YourCVPassport`;

  // Description
  let description = profile.meta_description;

  if (!description) {
    const descParts = [];

    if (profile.headline) descParts.push(profile.headline);
    if (profile.location) descParts.push(`Based in ${profile.location}`);

    if (profile.summary && profile.summary.length > 0) {
      const currentLength = descParts.join('. ').length;
      const remainingChars = 160 - currentLength - 3;
      if (remainingChars > 50) {
        const summarySnippet = profile.summary.substring(0, remainingChars).trim();
        descParts.push(summarySnippet);
      }
    }

    description = descParts.join('. ');

    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    if (!description || description.length < 20) {
      description = `Professional profile of ${profile.full_name}. ${profile.headline}`;
    }

    if (!description.endsWith('.') && !description.endsWith('...')) {
      description += '.';
    }
  }

  // Keywords
  const keywordParts = [];
  if (profile.full_name) keywordParts.push(profile.full_name);
  if (profile.headline) keywordParts.push(profile.headline);
  if (profile.location) keywordParts.push(profile.location);

  skills.forEach(skill => {
    if (skill.name) keywordParts.push(skill.name);
  });

  experiences.forEach(exp => {
    if (exp.title) keywordParts.push(exp.title);
  });

  keywordParts.push('professional profile', 'CV', 'resume', 'YourCVPassport');
  const keywords = [...new Set(keywordParts.filter(Boolean))].join(', ');

  // Image
  const image = profile.avatar_url || 'https://yourcvpassport.com/default-avatar.png';

  // URL
  const url = `https://yourcvpassport.com/cv/${profile.slug}`;

  return {
    title,
    description,
    keywords,
    image,
    url,
    authorName: profile.full_name
  };
}

function injectMetaTags(html, metaTags) {
  // Escape special characters
  const escape = (str) => str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${escape(metaTags.title)}</title>`
  );

  // Replace description
  html = html.replace(
    /<meta name="description" content=".*?".*?>/i,
    `<meta name="description" content="${escape(metaTags.description)}">`
  );

  // Add/replace keywords
  if (html.match(/<meta name="keywords"/i)) {
    html = html.replace(
      /<meta name="keywords" content=".*?".*?>/i,
      `<meta name="keywords" content="${escape(metaTags.keywords)}">`
    );
  } else {
    html = html.replace(
      '</head>',
      `    <meta name="keywords" content="${escape(metaTags.keywords)}">\n</head>`
    );
  }

  // Replace Open Graph tags
  html = html.replace(
    /<meta property="og:title" content=".*?".*?>/i,
    `<meta property="og:title" content="${escape(metaTags.title)}">`
  );

  html = html.replace(
    /<meta property="og:description" content=".*?".*?>/i,
    `<meta property="og:description" content="${escape(metaTags.description)}">`
  );

  html = html.replace(
    /<meta property="og:image" content=".*?".*?>/i,
    `<meta property="og:image" content="${metaTags.image}">`
  );

  html = html.replace(
    /<meta property="og:type" content="website".*?>/i,
    `<meta property="og:type" content="profile">`
  );

  // Add og:url if not present
  if (!html.match(/<meta property="og:url"/i)) {
    html = html.replace(
      /<meta property="og:image"/i,
      `<meta property="og:url" content="${metaTags.url}">\n    <meta property="og:image"`
    );
  } else {
    html = html.replace(
      /<meta property="og:url" content=".*?".*?>/i,
      `<meta property="og:url" content="${metaTags.url}">`
    );
  }

  // Replace Twitter Card tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?".*?>/i,
    `<meta name="twitter:title" content="${escape(metaTags.title)}">`
  );

  html = html.replace(
    /<meta name="twitter:description" content=".*?".*?>/i,
    `<meta name="twitter:description" content="${escape(metaTags.description)}">`
  );

  // Add author meta tag
  if (!html.match(/<meta name="author"/i)) {
    html = html.replace(
      '</head>',
      `    <meta name="author" content="${escape(metaTags.authorName)}">\n</head>`
    );
  }

  return html;
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Servidor SEO iniciado en http://localhost:${PORT}`);
  console.log(`📊 Los perfiles en /cv/:slug tendrán meta tags personalizados`);
  console.log(`🔍 Detecta automáticamente bots de SEO\n`);
});
