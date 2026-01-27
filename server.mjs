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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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
