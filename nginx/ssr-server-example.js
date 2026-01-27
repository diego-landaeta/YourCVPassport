/**
 * Ejemplo de servidor SSR (Server-Side Rendering) para YourCVPassport
 * Este servidor verifica si un perfil existe y retorna el código HTTP correcto
 *
 * NOTA: Este es un ejemplo básico. Para una implementación completa,
 * considera usar frameworks como Next.js o Remix que manejan SSR automáticamente.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Servir archivos estáticos desde la carpeta dist
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Configurar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Leer el HTML base
const indexPath = path.join(__dirname, '../dist/index.html');
const html404Path = path.join(__dirname, '../dist/404.html');

/**
 * Verifica si un perfil existe en la base de datos
 */
async function checkProfileExists(slug) {
  try {
    // Intentar buscar por slug
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, headline, summary')
      .eq('slug', slug)
      .maybeSingle();

    // Si no se encuentra por slug, intentar por ID (backward compatibility)
    if (!profile) {
      const { data: profileById, error: idError } = await supabase
        .from('profiles')
        .select('id, full_name, headline, summary')
        .eq('id', slug)
        .maybeSingle();

      profile = profileById;
      error = idError;
    }

    if (error) {
      console.error('Error checking profile:', error);
      return { exists: false, profile: null };
    }

    // Verificar que el perfil esté completo
    if (!profile || !profile.full_name || !profile.headline || !profile.summary) {
      return { exists: false, profile: null };
    }

    return { exists: true, profile };
  } catch (err) {
    console.error('Exception checking profile:', err);
    return { exists: false, profile: null };
  }
}

/**
 * Ruta para perfiles
 */
app.get('/cv/:slug', async (req, res) => {
  const { slug } = req.params;

  console.log(`[SSR] Checking profile: ${slug}`);

  // Verificar si el perfil existe
  const { exists, profile } = await checkProfileExists(slug);

  if (!exists) {
    console.log(`[SSR] Profile not found: ${slug} - Returning 404`);

    // Retornar 404 con el HTML de la app (React Router manejará el error)
    res.status(404);

    // Leer el HTML base
    let html = fs.readFileSync(indexPath, 'utf8');

    // Inyectar meta tags para 404
    html = html.replace(
      '<head>',
      `<head>
      <meta name="robots" content="noindex, nofollow">
      <meta name="prerender-status-code" content="404">
      <title>404 - Perfil No Encontrado | YourCVPassport</title>`
    );

    return res.send(html);
  }

  console.log(`[SSR] Profile found: ${slug} - ${profile.full_name}`);

  // Perfil existe - servir con código 200 y meta tags SEO
  res.status(200);

  let html = fs.readFileSync(indexPath, 'utf8');

  // Inyectar meta tags SEO
  const seoTags = `
    <title>${profile.full_name} - ${profile.headline} | YourCVPassport</title>
    <meta name="description" content="${profile.summary.substring(0, 160)}...">
    <meta property="og:title" content="${profile.full_name} - ${profile.headline}">
    <meta property="og:description" content="${profile.summary.substring(0, 160)}...">
    <meta property="og:url" content="https://yourcvpassport.com/cv/${slug}">
    <link rel="canonical" href="https://yourcvpassport.com/cv/${slug}">
  `;

  html = html.replace('<head>', `<head>${seoTags}`);

  res.send(html);
});

/**
 * Rutas bloqueadas - Retornar 404 directo
 */
const blockedRoutes = [
  /^\/profiles\//,
  /^\/perfiles\//,
  /^\/talent-search$/
];

function isBlockedRoute(path) {
  return blockedRoutes.some(regex => regex.test(path));
}

/**
 * Ruta para health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Middleware para bloquear rutas prohibidas
 */
app.use((req, res, next) => {
  if (isBlockedRoute(req.path)) {
    console.log(`[SSR] Blocked route: ${req.path} - Returning 404`);
    res.status(404);

    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(
      '<head>',
      `<head>
      <meta name="robots" content="noindex, nofollow">
      <meta name="prerender-status-code" content="404">
      <title>404 - Página No Encontrada | YourCVPassport</title>`
    );

    return res.send(html);
  }
  next();
});

/**
 * Todas las demás rutas - servir index.html con código 200
 * EXCEPTO rutas que React Router no reconoce, que devolverán 404 desde el cliente
 */
app.get('*', (req, res) => {
  // Lista de rutas válidas conocidas (las que NO deberían ser 404 del servidor)
  const validRoutePatterns = [
    /^\/$/,
    /^\/login/,
    /^\/signup/,
    /^\/dashboard/,
    /^\/admin/,
    /^\/company/,
    /^\/jobs/,
    /^\/empleos/,
    /^\/recursos/,
    /^\/resources/,
    /^\/callback/,
    /^\/confirm/,
    /^\/recovery/,
    /^\/magic-link/,
    /^\/product/,
    /^\/404$/,
    /^\/cv\//,  // Ya manejado arriba, pero por si acaso
  ];

  const isValidRoute = validRoutePatterns.some(regex => regex.test(req.path));

  if (!isValidRoute && req.path !== '/') {
    // Ruta no reconocida - 404 del servidor
    console.log(`[SSR] Unknown route: ${req.path} - Returning 404`);
    res.status(404);

    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(
      '<head>',
      `<head>
      <meta name="robots" content="noindex, nofollow">
      <meta name="prerender-status-code" content="404">
      <title>404 - Página No Encontrada | YourCVPassport</title>`
    );

    return res.send(html);
  }

  // Ruta válida - servir con 200
  res.sendFile(indexPath);
});

/**
 * Iniciar servidor
 */
app.listen(PORT, () => {
  console.log(`[SSR Server] Running on port ${PORT}`);
  console.log(`[SSR Server] Supabase URL: ${process.env.VITE_SUPABASE_URL}`);
});

/**
 * INSTRUCCIONES DE USO:
 *
 * 1. Instalar dependencias:
 *    npm install express @supabase/supabase-js
 *
 * 2. Crear archivo .env con:
 *    VITE_SUPABASE_URL=tu_supabase_url
 *    VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
 *    PORT=3001
 *
 * 3. Ejecutar el servidor:
 *    node ssr-server-example.js
 *
 * 4. Configurar nginx para hacer proxy a este servidor (ver yourcvpassport-with-ssr.conf)
 *
 * 5. Asegúrate de que nginx preserve el código de estado HTTP del backend:
 *    proxy_intercept_errors on;
 *
 * NOTA: Para producción, considera usar PM2 para manejar el proceso:
 *    npm install -g pm2
 *    pm2 start ssr-server-example.js --name yourcvpassport-ssr
 *    pm2 save
 *    pm2 startup
 */
