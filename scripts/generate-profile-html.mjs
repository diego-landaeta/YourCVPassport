/**
 * Genera el HTML estático de los perfiles públicos /cv/<slug> con sus meta etiquetas, canonical
 * y og:url autorreferentes (sin barra final), JSON-LD Person y contenido propio (H1 con el nombre,
 * titular y resumen del perfil público).
 *
 * Uso:
 *   node scripts/generate-profile-html.mjs [slug]
 *   node scripts/generate-profile-html.mjs --all
 *
 * Opciones:
 *   --dist=<carpeta>     Carpeta de salida (por defecto ./dist; o $DIST_DIR).
 *   --fixture=<carpeta>  Sin Supabase: lee <carpeta>/profiles.json (para pruebas y revisión local;
 *                        también $SEO_FIXTURE_DIR). Cada perfil puede llevar `skills` y `experiences`.
 *   --optional           Sin credenciales (o con el listado incompleto) no hace nada y sale con 0,
 *                        para engancharlo al build sin romper builds locales. Sin esta opción, la
 *                        falta de credenciales o un error de lectura salen con 1.
 *
 * Nunca escribe con una lista incompleta: si faltan credenciales, si la lectura de perfiles falla
 * o devuelve 0 filas, no toca dist/cv. Escribe dist/cv/<slug>/index.html. Los perfiles de prueba o
 * internos (seo/excluded-profiles.json, is_test, is_internal) salen con meta robots noindex.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import { escapeHtml, stripManagedTags } from '../seo/seo-text.mjs';
import { buildProfileSeo, fetchPublicProfiles, loadExcludedSlugs, PUBLIC_PROFILE_COLUMNS } from '../seo/profile-seo.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const argv = process.argv.slice(2);
const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const FIXTURE_DIR = flag('fixture') || process.env.SEO_FIXTURE_DIR || '';
const OPTIONAL = argv.includes('--optional');
const DIST_DIR = path.resolve(flag('dist') || process.env.DIST_DIR || path.join(__dirname, '..', 'dist'));

// Solo al ejecutarlo como script: importado (tests) expone injectMetaTags sin tocar Supabase
const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

const hasCredentials = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
if (isMain && !FIXTURE_DIR && !hasCredentials) {
  if (OPTIONAL) {
    console.warn('[profile-seo] Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: no se generan perfiles (dist/cv intacto).');
    process.exit(0);
  }
  console.error('Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidos en .env.local (o usa --fixture=<carpeta>)');
  process.exit(1);
}

const supabase = isMain && !FIXTURE_DIR ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/** HTML base: el index.html construido (con el JS/CSS del bundle) o, si no hay dist, el de la raíz. */
function readBaseHtml() {
  const distIndexPath = path.join(DIST_DIR, 'index.html');
  const sourceIndexPath = path.resolve(__dirname, '../index.html');
  return fs.readFileSync(fs.existsSync(distIndexPath) ? distIndexPath : sourceIndexPath, 'utf-8');
}

function readFixtureProfiles() {
  const file = path.join(path.resolve(FIXTURE_DIR), 'profiles.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/** Escribe dist/cv/<slug>/index.html a partir de un perfil ya leído. Devuelve true si escribió. */
async function writeProfile(profile, baseHtml, exclusions) {
  if (!profile?.slug || !/^[a-z0-9][a-z0-9_-]*$/i.test(profile.slug)) {
    console.error(`Perfil con slug no válido: ${profile?.slug}`);
    return false;
  }
  if (!profile.full_name || !profile.headline) {
    console.error(`Perfil incompleto: ${profile.slug}`);
    return false;
  }
  let skills = profile.skills;
  let experiences = profile.experiences;
  if (!skills && !FIXTURE_DIR && supabase && profile.id) {
    const [s, e] = await Promise.all([
      supabase.from('skills').select('name').eq('profile_id', profile.id).order('sort_order').limit(7),
      supabase.from('experiences').select('title').eq('profile_id', profile.id).order('start_date', { ascending: false }).limit(3),
    ]);
    skills = s.data || [];
    experiences = e.data || [];
  }
  const metaTags = generateMetaTags(profile, skills || [], experiences || [], exclusions);
  const html = injectMetaTags(baseHtml, metaTags);
  const outputDir = path.join(DIST_DIR, 'cv', profile.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf-8');
  return true;
}

async function generateProfileHTML(slug) {
  try {
    console.log(`Buscando perfil: ${slug}...`);
    let profile;
    if (FIXTURE_DIR) {
      profile = readFixtureProfiles().find((p) => p.slug === slug);
    } else {
      const { data, error } = await supabase
        .from('profiles')
        // Columnas explícitas: con la anon key, select('*') da 42501 (columnas privadas)
        .select(PUBLIC_PROFILE_COLUMNS)
        .eq('slug', slug)
        .single();
      if (!error) profile = data;
    }
    if (!profile) {
      console.error(`Perfil no encontrado: ${slug}`);
      return false;
    }
    const ok = await writeProfile(profile, readBaseHtml(), loadExcludedSlugs());
    if (ok) console.log(`HTML generado: ${path.join(DIST_DIR, 'cv', slug, 'index.html')}`);
    return ok;
  } catch (error) {
    console.error(`Error generando HTML para ${slug}:`, error.message);
    return false;
  }
}

/**
 * Meta etiquetas de un perfil. `exclusions` (Set de slugs) es opcional: por defecto se lee
 * seo/excluded-profiles.json. Devuelve también canonical, jsonLd, bodyHtml, lang y robots.
 */
export function generateMetaTags(profile, skills, experiences, exclusions) {
  return buildProfileSeo(profile, skills, experiences, exclusions);
}

/** Inserta las meta etiquetas del perfil en el HTML base (idempotente: no duplica canonical ni JSON-LD). */
export function injectMetaTags(html, metaTags) {
  const escape = escapeHtml;
  // Reemplazo por función: con un string, `$&` o `$'` en los datos del usuario se
  // interpretarían como patrones de String.replace y reinyectarían HTML.
  const rep = (pattern, value) => { html = html.replace(pattern, () => value); };
  const upsert = (pattern, tag) => {
    if (pattern.test(html)) rep(pattern, tag);
    else rep(/<\/head>/i, `    ${tag}\n  </head>`);
  };

  html = stripManagedTags(html);
  const lang = metaTags.lang === 'en' ? 'en' : 'es';
  html = html.replace(/<html lang="[^"]*">/, () => `<html lang="${lang}">`);

  rep(/<title>[\s\S]*?<\/title>/, `<title>${escape(metaTags.title)}</title>`);
  upsert(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escape(metaTags.description)}" data-rh="true">`);
  upsert(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${escape(metaTags.keywords)}" data-rh="true">`);

  upsert(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escape(metaTags.title)}" data-rh="true">`);
  upsert(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escape(metaTags.description)}" data-rh="true">`);
  upsert(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escape(metaTags.image)}" data-rh="true">`);
  upsert(/<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="profile" data-rh="true">`);
  upsert(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escape(metaTags.title)}" data-rh="true">`);
  upsert(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escape(metaTags.description)}" data-rh="true">`);
  upsert(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escape(metaTags.image)}" data-rh="true">`);
  if (!/name="author"/.test(html)) rep(/<\/head>/i, `    <meta name="author" content="${escape(metaTags.authorName)}" data-rh="true">\n  </head>`);

  // Marca de no indexar (perfiles de prueba o internos): sustituye el robots de la plantilla
  if (metaTags.robots) {
    html = html.replace(/[ \t]*<meta name="(?:robots|googlebot)" content="[^"]*"[^>]*>\s*\n?/gi, '');
    rep(/<\/head>/i, `    <meta name="robots" content="${escape(metaTags.robots)}" data-rh="true">\n  </head>`);
  }

  const url = metaTags.canonical || metaTags.url;
  const extra = [
    `<link rel="canonical" href="${escape(url)}" data-rh="true">`,
    `<meta property="og:url" content="${escape(metaTags.url)}" data-rh="true">`,
    `<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'es_ES'}" data-rh="true">`,
    ...(metaTags.jsonLd || []),
  ];
  rep(/<\/head>/i, `    ${extra.join('\n    ')}\n  </head>`);

  if (metaTags.bodyHtml) {
    const main = /<main id="static-home"[\s\S]*?<\/main>/;
    if (main.test(html)) rep(main, metaTags.bodyHtml);
  }
  return html;
}

async function generateAllProfiles() {
  console.log('Generando HTML para todos los perfiles públicos...');
  const exclusions = loadExcludedSlugs();

  let profiles;
  if (FIXTURE_DIR) {
    profiles = readFixtureProfiles();
  } else {
    const res = await fetchPublicProfiles(supabase);
    if (res.error) {
      // Lista incompleta o ilegible: no se escribe nada (mejor las copias del build anterior)
      console.error(`No se pudo leer la lista de perfiles (${res.error.message || res.error}): dist/cv intacto.`);
      process.exit(OPTIONAL ? 0 : 1);
    }
    profiles = res.profiles;
  }
  if (!profiles || profiles.length === 0) {
    console.error('No se encontraron perfiles públicos: dist/cv intacto.');
    process.exit(OPTIONAL ? 0 : 1);
  }

  const baseHtml = readBaseHtml();
  let ok = 0;
  let failed = 0;
  let noindex = 0;
  for (const profile of profiles) {
    const full = profile;
    if (await writeProfile(full, baseHtml, exclusions)) {
      ok++;
      if (buildProfileSeo(full, [], [], exclusions).excluded) noindex++;
    } else {
      failed++;
    }
  }
  console.log(`Perfiles: ${ok} generados (${noindex} con noindex), ${failed} con error, ${profiles.length} en total. Salida: ${path.join(DIST_DIR, 'cv')}`);
  if (failed > 0 && ok === 0) process.exit(1);
}

// Main execution (solo al ejecutarlo como script; importado no hace nada)
if (isMain) {
  const slugArg = argv.find((a) => !a.startsWith('--'));
  if (argv.includes('--all')) {
    generateAllProfiles();
  } else if (slugArg) {
    generateProfileHTML(slugArg).then((success) => {
      if (!success) process.exit(1);
    });
  } else {
    console.error('\nError: Debes especificar un slug o usar --all\n');
    console.log('Uso:');
    console.log('  node scripts/generate-profile-html.mjs emily-harper');
    console.log('  node scripts/generate-profile-html.mjs --all [--dist=<carpeta>] [--fixture=<carpeta>] [--optional]');
    process.exit(1);
  }
}
