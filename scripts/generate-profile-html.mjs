/**
 * Script para generar HTML estático con meta tags específicos para cada perfil público
 *
 * Uso:
 *   node scripts/generate-profile-html.mjs [slug]
 *   node scripts/generate-profile-html.mjs --all
 *
 * Genera archivos HTML en dist/cv/:slug/index.html con meta tags correctos
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidos en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateProfileHTML(slug) {
  try {
    console.log(`\n🔍 Buscando perfil: ${slug}...`);

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (profileError || !profile) {
      console.error(`❌ Perfil no encontrado: ${slug}`);
      return false;
    }

    if (!profile.full_name || !profile.headline) {
      console.error(`❌ Perfil incompleto: ${slug}`);
      return false;
    }

    console.log(`✅ Perfil encontrado: ${profile.full_name}`);

    // Fetch additional data
    const [
      { data: skills },
      { data: experiences }
    ] = await Promise.all([
      supabase.from('skills').select('name').eq('profile_id', profile.id).order('sort_order').limit(7),
      supabase.from('experiences').select('title').eq('profile_id', profile.id).order('start_date', { ascending: false }).limit(3)
    ]);

    // Generate meta tags
    const metaTags = generateMetaTags(profile, skills || [], experiences || []);

    console.log(`\n📝 Meta tags generados:`);
    console.log(`   Title: ${metaTags.title}`);
    console.log(`   Description: ${metaTags.description}`);
    console.log(`   Keywords: ${metaTags.keywords.substring(0, 80)}...`);

    // Read base index.html from dist (the built one with bundled JS/CSS), not the source
    const distIndexPath = path.resolve(__dirname, '../dist/index.html');
    const sourceIndexPath = path.resolve(__dirname, '../index.html');
    const indexPath = fs.existsSync(distIndexPath) ? distIndexPath : sourceIndexPath;
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Replace meta tags
    html = injectMetaTags(html, metaTags);

    // Create output directory
    const outputDir = path.resolve(__dirname, `../dist/cv/${slug}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write HTML file
    const outputPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(outputPath, html, 'utf-8');

    console.log(`✅ HTML generado: ${outputPath}`);
    return true;

  } catch (error) {
    console.error(`❌ Error generando HTML para ${slug}:`, error.message);
    return false;
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
  // Escape special characters in content
  const escape = (str) => str.replace(/"/g, '&quot;');

  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${escape(metaTags.title)}</title>`
  );

  // Replace description
  html = html.replace(
    /<meta name="description" content=".*?".*?>/,
    `<meta name="description" content="${escape(metaTags.description)}">`
  );

  // Add/replace keywords
  if (html.includes('name="keywords"')) {
    html = html.replace(
      /<meta name="keywords" content=".*?".*?>/,
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
    /<meta property="og:title" content=".*?".*?>/,
    `<meta property="og:title" content="${escape(metaTags.title)}">`
  );

  html = html.replace(
    /<meta property="og:description" content=".*?".*?>/,
    `<meta property="og:description" content="${escape(metaTags.description)}">`
  );

  html = html.replace(
    /<meta property="og:image" content=".*?".*?>/,
    `<meta property="og:image" content="${metaTags.image}">`
  );

  // Add og:url
  if (html.includes('property="og:url"')) {
    html = html.replace(
      /<meta property="og:url" content=".*?".*?>/,
      `<meta property="og:url" content="${metaTags.url}">`
    );
  } else {
    html = html.replace(
      /<meta property="og:image"/,
      `<meta property="og:url" content="${metaTags.url}">\n    <meta property="og:image"`
    );
  }

  // Replace Twitter Card tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?".*?>/,
    `<meta name="twitter:title" content="${escape(metaTags.title)}">`
  );

  html = html.replace(
    /<meta name="twitter:description" content=".*?".*?>/,
    `<meta name="twitter:description" content="${escape(metaTags.description)}">`
  );

  // Add author meta tag
  if (!html.includes('name="author"')) {
    html = html.replace(
      '</head>',
      `    <meta name="author" content="${escape(metaTags.authorName)}">\n</head>`
    );
  }

  // Change og:type to profile
  html = html.replace(
    /<meta property="og:type" content="website".*?>/,
    `<meta property="og:type" content="profile">`
  );

  return html;
}

async function generateAllProfiles() {
  console.log('\n🚀 Generando HTML para todos los perfiles públicos...\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('slug, full_name, headline')
    .eq('is_active', true)
    .eq('profile_hidden', false)
    .not('slug', 'is', null)
    .not('full_name', 'is', null)
    .not('headline', 'is', null);

  if (error || !profiles || profiles.length === 0) {
    console.error('❌ No se encontraron perfiles públicos');
    return;
  }

  console.log(`📊 Total de perfiles a procesar: ${profiles.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const profile of profiles) {
    const success = await generateProfileHTML(profile.slug);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ Completado:`);
  console.log(`   Exitosos: ${successCount}`);
  console.log(`   Errores: ${errorCount}`);
  console.log(`   Total: ${profiles.length}`);
  console.log('\n' + '='.repeat(50));
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('\n❌ Error: Debes especificar un slug o usar --all\n');
  console.log('Uso:');
  console.log('  node scripts/generate-profile-html.mjs emily-harper');
  console.log('  node scripts/generate-profile-html.mjs --all');
  process.exit(1);
}

if (args[0] === '--all') {
  generateAllProfiles();
} else {
  const slug = args[0];
  generateProfileHTML(slug).then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}
