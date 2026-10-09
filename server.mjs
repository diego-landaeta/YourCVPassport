/**
 * Servidor Express para Meta Tags SEO Dinámicos
 *
 * Este servidor intercepta peticiones a /cv/:slug y:
 * 1. Consulta el perfil del usuario en Supabase
 * 2. Genera meta tags personalizados desde los datos reales
 * 3. Inyecta los meta tags en el HTML (escapados: los datos vienen de usuarios)
 * 4. Sirve el HTML con los meta tags correctos
 *
 * Además sirve /api/translate, /api/admin/users/:id, /sitemap.xml y /health.
 *
 * Variables de entorno (ver nginx/README.md):
 * - PORT (3001 por defecto, el mismo que el upstream de nginx/*.conf)
 * - HOST (127.0.0.1 por defecto: solo nginx debe hablar con este proceso)
 * - DIST_DIR (carpeta del build; ./dist por defecto)
 * - TRUST_PROXY (proxies de confianza para X-Forwarded-*; 'loopback' por defecto)
 * - TRANSLATE_RATE_LIMIT / TRANSLATE_RATE_WINDOW_MS (límite de /api/translate por IP)
 * - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
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

// URL canónica del sitio: el APEX (sin www), igual que public/sitemap.xml y los canonical.
const SITE_URL = 'https://yourcvpassport.com';

const PORT = Number(process.env.PORT) || 3001;
// Por defecto solo loopback: en producción nginx hace de proxy y el puerto no debe
// quedar expuesto. HOST=0.0.0.0 si de verdad se quiere escuchar en todas las interfaces.
const HOST = process.env.HOST || '127.0.0.1';
const DIST_DIR = path.resolve(process.env.DIST_DIR || path.join(__dirname, 'dist'));
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

const app = express();

// No anunciar "X-Powered-By: Express"
app.disable('x-powered-by');

// Detrás de nginx (mismo host): req.ip y req.secure salen de X-Forwarded-For/-Proto.
// Solo se confía en proxies de loopback para que un cliente no pueda falsear su IP.
const TRUST_PROXY = process.env.TRUST_PROXY || 'loopback';
app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);

// ===== CABECERAS DE SEGURIDAD =====
// Mismo contenido que nginx/yourcvpassport-security-headers.conf: si cambias uno, cambia
// el otro. nginx oculta estas cabeceras del upstream (proxy_hide_header) para no duplicarlas.
// La CSP va en modo Report-Only: ver nginx/README.md para pasar a enforcing.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://web.opynio.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://djehzlzombqrzzuchcef.supabase.co https://flagcdn.com https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos https://ui-avatars.com https://images.pexels.com https://via.placeholder.com https://api.qrserver.com https://maps.googleapis.com https://media.tenor.com https://www.google.com https://*.gstatic.com https://iseie.com https://psikoaprende.com",
  "connect-src 'self' https://djehzlzombqrzzuchcef.supabase.co wss://djehzlzombqrzzuchcef.supabase.co https://translate.googleapis.com https://api.mymemory.translated.net https://api.ipify.org https://tenor.googleapis.com https://web.opynio.com https://hvtrrhxeqrsnjxhngdsj.supabase.co",
  "font-src 'self' data:",
  "frame-src https://www.google.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy-Report-Only': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  // El auditor XSS de los navegadores antiguos introducía fugas: se desactiva explícitamente
  'X-XSS-Protection': '0',
};

app.use((req, res, next) => {
  res.set(SECURITY_HEADERS);
  // HSTS solo tiene efecto (y sentido) sobre HTTPS
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
});

// Middleware para parsear JSON (límite explícito: /api/translate es el único body grande)
app.use(express.json({ limit: '256kb' }));

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

// ===== HEALTH CHECK =====
// Lo usa nginx/yourcvpassport-ssr-only.conf (location = /health). No toca servicios externos.
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
});

// ===== LÍMITE DE PETICIONES (en memoria, por IP) =====
// Suficiente para un único proceso Node detrás de nginx. Si se escala a varios
// procesos, el límite pasa a ser por proceso (documentado en nginx/README.md).
function createRateLimiter({ limit, windowMs, maxKeys = 10000 }) {
  const hits = new Map(); // ip -> { count, resetAt }

  const sweep = () => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  };
  setInterval(sweep, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      // Tope de memoria: si hay demasiadas IPs distintas, se purgan las caducadas
      if (!entry && hits.size >= maxKeys) {
        sweep();
        if (hits.size >= maxKeys) hits.clear();
      }
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count++;
    const remaining = Math.max(0, limit - entry.count);
    res.set('RateLimit-Limit', String(limit));
    res.set('RateLimit-Remaining', String(remaining));

    if (entry.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests', retryAfter });
    }
    next();
  };
}

const translateLimiter = createRateLimiter({
  limit: Number(process.env.TRANSLATE_RATE_LIMIT) || 60,
  windowMs: Number(process.env.TRANSLATE_RATE_WINDOW_MS) || 60 * 1000,
});

// ===== API DE TRADUCCIÓN =====
// Endpoint para traducir textos usando Google Translate (server-side, sin CORS).
// No es un proxy abierto: solo es<->en, con tope de textos y de longitud, y rate limit.

const TRANSLATE_LANGS = new Set(['es', 'en']);
const TRANSLATE_MAX_TEXTS = 200;          // autoTranslate manda lotes de 40
const TRANSLATE_MAX_TEXT_LENGTH = 5000;   // caracteres por texto
const TRANSLATE_MAX_TOTAL_CHARS = 50000;  // caracteres por petición

function validateTranslateBody(body) {
  const { texts, sourceLang, targetLang } = body || {};

  if (!Array.isArray(texts) || texts.length === 0) {
    return { status: 400, error: 'texts array is required' };
  }
  if (texts.length > TRANSLATE_MAX_TEXTS) {
    return { status: 413, error: `Too many texts (max ${TRANSLATE_MAX_TEXTS})` };
  }
  if (!texts.every(t => typeof t === 'string')) {
    return { status: 400, error: 'texts must be strings' };
  }
  if (texts.some(t => t.length > TRANSLATE_MAX_TEXT_LENGTH)) {
    return { status: 413, error: `Text too long (max ${TRANSLATE_MAX_TEXT_LENGTH} characters)` };
  }
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
  if (totalChars > TRANSLATE_MAX_TOTAL_CHARS) {
    return { status: 413, error: `Request too large (max ${TRANSLATE_MAX_TOTAL_CHARS} characters)` };
  }
  if (!TRANSLATE_LANGS.has(sourceLang) || !TRANSLATE_LANGS.has(targetLang)) {
    return { status: 400, error: 'sourceLang and targetLang must be "es" or "en"' };
  }
  return null;
}

app.post('/api/translate', translateLimiter, async (req, res) => {
  try {
    const invalid = validateTranslateBody(req.body);
    if (invalid) {
      return res.status(invalid.status).json({ error: invalid.error });
    }

    const { texts, sourceLang, targetLang } = req.body;

    // Filtrar textos vacíos y obtener únicos
    const uniqueTexts = [...new Set(texts.filter(t => t.trim() !== ''))];

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
            console.error(`[Translate API] Single error:`, singleError.message);
          }
        }
      }
    }

    console.log(`[Translate API] Completed: ${successCount}/${uniqueTexts.length} texts translated`);

    res.json({ translations, success: successCount, total: uniqueTexts.length });

  } catch (error) {
    console.error('[Translate API] Error:', error.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Endpoint de health check para la API de traducción.
// El resultado se cachea: cada llamada sin caché era una petición real a Google.
const TRANSLATE_HEALTH_TTL = 5 * 60 * 1000;
let translateHealthCache = { body: null, status: 0, timestamp: 0 };

app.get('/api/translate/health', translateLimiter, async (req, res) => {
  const now = Date.now();
  if (translateHealthCache.body && (now - translateHealthCache.timestamp) < TRANSLATE_HEALTH_TTL) {
    return res.status(translateHealthCache.status).json(translateHealthCache.body);
  }
  try {
    const result = await translate('hello', { from: 'en', to: 'es' });
    translateHealthCache = {
      status: 200,
      body: { status: 'ok', provider: 'google-translate-api-x', test: { input: 'hello', output: result.text } },
      timestamp: now,
    };
  } catch (error) {
    console.error('[Translate API] Health check failed:', error.message);
    translateHealthCache = { status: 503, body: { status: 'error' }, timestamp: now };
  }
  res.status(translateHealthCache.status).json(translateHealthCache.body);
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

    // Verificar que el usuario es admin. Con service_role: el cliente anon solo
    // ve perfiles publicados, y el del admin puede no estarlo.
    const { data: adminProfile, error: profileError } = await (supabaseAdmin || supabase)
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== SITEMAP DINÁMICO =====
// Se regenera en cada request - siempre incluye los últimos posts/CVs/jobs publicados
// Cache de 1 hora para no sobrecargar Supabase.
// Todas las URLs usan SITE_URL (apex), igual que public/sitemap.xml y los canonical.

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
  '/resources/success-stories': '/recursos/exito',
  '/resources/status': '/recursos/estado',
  '/about': '/nosotros',
  '/about/press': '/nosotros/prensa',
  '/about/contact': '/nosotros/contacto',
  '/jobs': '/empleos',
};

// Rutas fusionadas con otra pagina: 301 a la principal. Mismo listado que
// routeRedirects en config/routeConfig.ts (y el map $ycp_redirect de nginx/*.conf).
const ROUTE_REDIRECTS = {
  '/nosotros/mision': '/nosotros',
  '/about/mission': '/about',
  '/recursos/biblioteca': '/profesionales/plantillas',
  '/resources/library': '/professionals/templates',
};
const SITEMAP_ES_TO_EN = Object.fromEntries(Object.entries(SITEMAP_EN_TO_ES).map(([en, es]) => [es, en]));

/**
 * Destino 301 de una ruta retirada, o null. Ademas de las fusionadas, los enlaces de la
 * version antigua con prefijo de idioma: /es/pricing -> /precios,
 * /es/companies/plans -> /empresas/planes, /en/precios -> /pricing, /es -> /.
 */
function getRedirectPath(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (ROUTE_REDIRECTS[clean]) return ROUTE_REDIRECTS[clean];
  const match = clean.match(/^\/(es|en)(\/.*)?$/);
  if (!match) return null;
  const rest = match[2] || '/';
  const merged = ROUTE_REDIRECTS[rest] || rest;
  if (match[1] === 'es') return SITEMAP_EN_TO_ES[merged] || merged;
  return SITEMAP_ES_TO_EN[merged] || merged;
}

function getEsPath(enPath) {
  if (SITEMAP_EN_TO_ES[enPath]) return SITEMAP_EN_TO_ES[enPath];
  if (enPath.startsWith('/resources/blog/')) return enPath.replace('/resources/blog/', '/recursos/blog/');
  if (enPath.startsWith('/jobs/')) return enPath.replace('/jobs/', '/empleos/');
  return null;
}

// Los slugs vienen de la BD: se codifican para que la URL y el XML sean válidos
const slugPath = (prefix, slug) => `${prefix}${encodeURIComponent(String(slug))}`;

function sitemapEntry(path, lastmod, priority, changefreq) {
  const loc = escapeHtml(`${SITE_URL}${path}`);
  const esPath = getEsPath(path);
  let hreflang = `    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />\n`;
  if (esPath) hreflang += `    <xhtml:link rel="alternate" hreflang="es" href="${escapeHtml(`${SITE_URL}${esPath}`)}" />\n`;
  hreflang += `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n${hreflang}\n  </url>`;
}

/**
 * Posts estáticos del blog (content/posts/index.ts), los mismos que incluye
 * scripts/generate-sitemap.mjs. Si el archivo no está junto al servidor, se omiten.
 */
function readStaticBlogPosts() {
  try {
    const source = fs.readFileSync(path.resolve(__dirname, 'content/posts/index.ts'), 'utf-8');
    const metaStart = source.indexOf('allPostsMeta:');
    if (metaStart === -1) return [];
    const re = /"slug":\s*"([^"]+)"[\s\S]*?"published_at":\s*"([^"]+)"/g;
    const block = source.slice(metaStart);
    const now = new Date();
    const out = [];
    let m;
    while ((m = re.exec(block)) !== null) {
      if (new Date(m[2]) > now) continue;
      out.push({ slug: m[1], lastmod: m[2].split('T')[0] });
    }
    return out;
  } catch {
    return [];
  }
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
    ['/resources/blog', '0.9', 'daily'],
    ['/resources/success-stories', '0.7', 'monthly'], ['/resources/status', '0.6', 'daily'],
    ['/about', '0.7', 'monthly'],
    ['/about/press', '0.6', 'monthly'], ['/about/contact', '0.8', 'monthly'],
    ['/jobs', '0.9', 'daily'],
  ];
  for (const [path, priority, freq] of staticPages) {
    entries.push(sitemapEntry(path, now, priority, freq));
  }

  // Blog posts: estáticos (content/posts) + tabla blog_posts (publicados, published_at <= now).
  // Si un slug está en ambos, gana el estático (mismo criterio que generate-sitemap.mjs).
  const blogBySlug = new Map();
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });
    for (const p of posts || []) {
      if (!p.slug) continue;
      blogBySlug.set(p.slug, (p.updated_at || p.published_at || now).split('T')[0]);
    }
  } catch (e) { console.error('[Sitemap] Blog error:', e.message); }
  for (const p of readStaticBlogPosts()) blogBySlug.set(p.slug, p.lastmod);
  for (const [slug, lastmod] of blogBySlug) {
    entries.push(sitemapEntry(slugPath('/resources/blog/', slug), lastmod, '0.7', 'monthly'));
  }

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
        entries.push(sitemapEntry(slugPath('/cv/', p.slug), lastmod, '0.6', 'weekly'));
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
        if (!j.slug) continue;
        const lastmod = (j.updated_at || j.published_at || now).split('T')[0];
        entries.push(sitemapEntry(slugPath('/jobs/', j.slug), lastmod, '0.7', 'weekly'));
      }
    }
  } catch (e) { console.error('[Sitemap] Jobs error:', e.message); }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>`;
}

// Redirecciones permanentes (antes que los estáticos y el fallback de la SPA)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const target = getRedirectPath(req.path);
  if (!target || target === req.path) return next();
  const qIndex = req.originalUrl.indexOf('?');
  res.redirect(301, target + (qIndex >= 0 ? req.originalUrl.slice(qIndex) : ''));
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const now = Date.now();
    if (sitemapCache.xml && (now - sitemapCache.timestamp) < SITEMAP_CACHE_TTL) {
      console.log('[Sitemap] Serving from cache');
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
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

// Servir archivos estáticos.
// - /assets/* lleva hash en el nombre (Vite): caché larga e inmutable.
// - index.html y sw.js: no-cache (siempre revalidar, si no un deploy no llega a los usuarios).
// - Resto (favicons, imágenes de public/): caché corta.
app.use(express.static(DIST_DIR, {
  // /precios es una carpeta del build (dist/precios/index.html, ver más abajo): sin
  // esto express.static respondería 301 a /precios/
  redirect: false,
  setHeaders(res, filePath) {
    const rel = path.relative(DIST_DIR, filePath).split(path.sep).join('/');
    if (rel.startsWith('assets/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (rel === 'index.html' || rel.endsWith('/index.html') || rel === 'sw.js') {
      res.set('Cache-Control', 'no-cache');
    } else {
      res.set('Cache-Control', 'public, max-age=86400');
    }
  },
}));

// Middleware para inyectar meta tags en perfiles
app.get('/cv/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userAgent = req.headers['user-agent'] || '';

    // Detectar si es un bot de SEO
    const isBot = /googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent);

    console.log(`[SEO] Request for /cv/${slug} - Bot: ${isBot ? 'Yes' : 'No'}`);

    // Consultar perfil en la base de datos (mismos filtros que el sitemap: un perfil
    // oculto o inactivo no debe exponer nombre/titular a los crawlers)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, headline, summary, location, avatar_url, slug, meta_title, meta_description')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('profile_hidden', false)
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

    console.log(`[SEO] Profile found: ${profile.slug}`);

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
    let html = await fs.promises.readFile(INDEX_HTML, 'utf-8');

    // Inyectar meta tags personalizados
    html = injectMetaTags(html, metaTags);

    console.log(`[SEO] Meta tags injected for /cv/${profile.slug}`);

    // Servir HTML con meta tags personalizados
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(html);

  } catch (error) {
    console.error('[SEO] Error:', error.message);
    next(); // Continuar con el siguiente middleware
  }
});

// Las rutas /api/* que no existen responden 404 JSON, no el index.html de la SPA
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Páginas públicas con su título y descripción en el HTML (dist/<ruta>/index.html, que
// genera scripts/generate-static-meta.mjs tras el build). nginx las sirve igual con
// try_files $uri $uri/ /index.html.
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const rel = req.path.replace(/^\/+|\/+$/g, '');
  if (!rel || rel.includes('..') || rel.includes('\0')) return next();
  const file = path.join(DIST_DIR, rel, 'index.html');
  if (!file.startsWith(DIST_DIR + path.sep)) return next();
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(file);
  });
});

// Fallback: servir index.html para todas las demás rutas (SPA)
app.use((req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(INDEX_HTML);
});

// Errores (JSON inválido, body demasiado grande...): respuesta corta, sin stack trace
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = Number(err.status || err.statusCode) || 500;
  if (status >= 500) console.error('[Server] Error:', err.message);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : (err.expose ? err.message : 'Bad request') });
});

// Funciones auxiliares

/** Escapa un texto para usarlo dentro de HTML/XML (contenido o valor de atributo). */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Orígenes desde los que se acepta avatar_url como og:image. Cualquier otra cosa
// (http, javascript:, data:, dominios ajenos) se sustituye por la imagen por defecto.
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const ALLOWED_IMAGE_HOSTS = new Set([
  'yourcvpassport.com',
  'djehzlzombqrzzuchcef.supabase.co',
  'images.unsplash.com',
  'images.pexels.com',
  'ui-avatars.com',
  // Avatares de instructores sembrados por migraciones (supabase/migrations/*seed*)
  'iseie.com',
  'psikoaprende.com',
]);
try {
  const envSupabase = new URL(process.env.VITE_SUPABASE_URL || '');
  if (envSupabase.protocol === 'https:') ALLOWED_IMAGE_HOSTS.add(envSupabase.hostname);
} catch { /* VITE_SUPABASE_URL ausente o no válida */ }

function safeImageUrl(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return DEFAULT_OG_IMAGE;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return DEFAULT_OG_IMAGE;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) return DEFAULT_OG_IMAGE;
    return url.href;
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

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

  // Image (solo https de un origen permitido)
  const image = safeImageUrl(profile.avatar_url);

  // URL canónica (apex)
  const url = `${SITE_URL}${slugPath('/cv/', profile.slug)}`;

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
  // Todo valor pasa por escapeHtml (&, <, >, " y '). Las sustituciones usan una
  // función: con un string, patrones como "$&" o "$'" en los datos del usuario
  // serían interpretados por String.replace y reinyectarían HTML.
  const e = escapeHtml;
  const set = (pattern, tag) => { html = html.replace(pattern, () => tag); };
  const appendToHead = (tag) => { html = html.replace('</head>', () => `    ${tag}\n</head>`); };

  set(/<title>[\s\S]*?<\/title>/i, `<title>${e(metaTags.title)}</title>`);
  set(/<meta name="description" content=".*?".*?>/i, `<meta name="description" content="${e(metaTags.description)}">`);

  // Add/replace keywords
  if (/<meta name="keywords"/i.test(html)) {
    set(/<meta name="keywords" content=".*?".*?>/i, `<meta name="keywords" content="${e(metaTags.keywords)}">`);
  } else {
    appendToHead(`<meta name="keywords" content="${e(metaTags.keywords)}">`);
  }

  // Replace Open Graph tags
  set(/<meta property="og:title" content=".*?".*?>/i, `<meta property="og:title" content="${e(metaTags.title)}">`);
  set(/<meta property="og:description" content=".*?".*?>/i, `<meta property="og:description" content="${e(metaTags.description)}">`);
  set(/<meta property="og:image" content=".*?".*?>/i, `<meta property="og:image" content="${e(metaTags.image)}">`);
  set(/<meta property="og:type" content="website".*?>/i, `<meta property="og:type" content="profile">`);

  // Add og:url if not present
  if (!/<meta property="og:url"/i.test(html)) {
    set(/<meta property="og:image"/i, `<meta property="og:url" content="${e(metaTags.url)}">\n    <meta property="og:image"`);
  } else {
    set(/<meta property="og:url" content=".*?".*?>/i, `<meta property="og:url" content="${e(metaTags.url)}">`);
  }

  // Canonical (apex) del perfil
  if (/<link rel="canonical"/i.test(html)) {
    set(/<link rel="canonical" href=".*?".*?>/i, `<link rel="canonical" href="${e(metaTags.url)}">`);
  } else {
    appendToHead(`<link rel="canonical" href="${e(metaTags.url)}">`);
  }

  // Replace Twitter Card tags
  set(/<meta name="twitter:title" content=".*?".*?>/i, `<meta name="twitter:title" content="${e(metaTags.title)}">`);
  set(/<meta name="twitter:description" content=".*?".*?>/i, `<meta name="twitter:description" content="${e(metaTags.description)}">`);

  // Add author meta tag
  if (!/<meta name="author"/i.test(html)) {
    appendToHead(`<meta name="author" content="${e(metaTags.authorName)}">`);
  }

  return html;
}

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log(`\n✅ Servidor SEO iniciado en http://${HOST}:${PORT}`);
  console.log(`📊 Los perfiles en /cv/:slug tendrán meta tags personalizados`);
  console.log(`🔍 Detecta automáticamente bots de SEO\n`);
});
