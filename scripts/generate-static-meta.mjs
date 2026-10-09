/**
 * Copias de index.html por ruta pública con su título y descripción (issue #5, B2).
 *
 * La SPA servía el mismo index.html en todas las URLs: el título genérico llegaba
 * primero y el de la página, segundos después (React + Helmet). Este script, tras
 * `vite build`, escribe dist/<ruta>/index.html para cada página de seo/static-meta.mjs con:
 *   - <html lang>, <title>, description, og:title/description, twitter:title/description,
 *   - canonical (la propia URL), og:url, og:locale y hreflang es/en/x-default.
 * Las etiquetas llevan data-rh="true": al montar, react-helmet-async las sustituye por
 * las suyas (no quedan duplicadas).
 *
 * Quién las sirve:
 *   - nginx (yourcvpassport-with-ssr.conf): `try_files $uri $uri/ /index.html` encuentra
 *     dist/precios/ y sirve su index.html (sin redirigir a /precios/).
 *   - server.mjs: middleware antes del fallback de la SPA.
 * Si el servidor de producción no tiene `$uri/` en try_files, sigue sirviendo el
 * index.html raíz (título genérico en español): nada se rompe.
 *
 * Uso: node scripts/generate-static-meta.mjs [carpetaDist]   (por defecto ./dist o $DIST_DIR)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { STATIC_META_PAIRS, STATIC_META_SINGLE } from '../seo/static-meta.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://yourcvpassport.com';
const DIST_DIR = resolve(process.argv[2] || process.env.DIST_DIR || join(__dirname, '..', 'dist'));

/** Escapa un texto para contenido o valor de atributo HTML. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sustituye una etiqueta de index.html. Falla si no existe: si alguien cambia
 * index.html, mejor que el build avise a generar páginas con el título genérico.
 * Se usa una función en replace() para que "$&" o "$'" del texto no se interpreten.
 */
function replaceTag(html, pattern, tag, label) {
  if (!pattern.test(html)) throw new Error(`[static-meta] index.html no tiene ${label}`);
  return html.replace(pattern, () => tag);
}

/** HTML de una página: index.html con su idioma, título, descripción, canonical y hreflang. */
export function renderPage(baseHtml, { path, lang, title, description, alternates }) {
  const e = escapeHtml;
  const url = `${BASE_URL}${path}`;
  let html = baseHtml;
  html = replaceTag(html, /<html lang="[^"]*">/, `<html lang="${lang}">`, '<html lang>');
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${e(title)}</title>`, '<title>');
  html = replaceTag(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${e(description)}" data-rh="true" />`, 'description');
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${e(title)}" data-rh="true" />`, 'og:title');
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${e(description)}" data-rh="true" />`, 'og:description');
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${e(title)}" data-rh="true" />`, 'twitter:title');
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${e(description)}" data-rh="true" />`, 'twitter:description');

  const extra = [
    `<link rel="canonical" href="${e(url)}" data-rh="true" />`,
    `<meta property="og:url" content="${e(url)}" data-rh="true" />`,
    `<meta property="og:locale" content="${lang === 'es' ? 'es_ES' : 'en_US'}" data-rh="true" />`,
  ];
  if (alternates) {
    extra.push(
      `<link rel="alternate" hreflang="en" href="${e(`${BASE_URL}${alternates.en}`)}" data-rh="true" />`,
      `<link rel="alternate" hreflang="es" href="${e(`${BASE_URL}${alternates.es}`)}" data-rh="true" />`,
      `<link rel="alternate" hreflang="x-default" href="${e(`${BASE_URL}${alternates.en}`)}" data-rh="true" />`,
    );
  }
  return replaceTag(html, /<\/head>/i, `    ${extra.join('\n    ')}\n  </head>`, '</head>');
}

/** Lista de páginas a generar ({ path, lang, title, description, alternates }). */
export function listPages() {
  const pages = [];
  for (const pair of STATIC_META_PAIRS) {
    for (const lang of ['es', 'en']) {
      pages.push({ path: pair[lang], lang, title: pair.title[lang], description: pair.description[lang], alternates: { es: pair.es, en: pair.en } });
    }
  }
  for (const single of STATIC_META_SINGLE) {
    pages.push({ path: single.path, lang: 'es', title: single.title, description: single.description, alternates: null });
  }
  return pages;
}

function main() {
  const indexPath = join(DIST_DIR, 'index.html');
  if (!existsSync(indexPath)) {
    throw new Error(`[static-meta] No existe ${indexPath}: ejecuta antes "vite build"`);
  }
  const baseHtml = readFileSync(indexPath, 'utf-8');
  const pages = listPages();
  const seen = new Set();
  for (const page of pages) {
    if (!/^\/[a-z0-9/-]+$/.test(page.path) || page.path.includes('//') || seen.has(page.path)) {
      throw new Error(`[static-meta] Ruta no válida o repetida: ${page.path}`);
    }
    seen.add(page.path);
    const outDir = join(DIST_DIR, ...page.path.split('/').filter(Boolean));
    if (!outDir.startsWith(DIST_DIR + sep)) throw new Error(`[static-meta] Ruta fuera de dist: ${page.path}`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), renderPage(baseHtml, page));
  }
  // Carpetas intermedias (/empresas, /producto, /profesionales, /recursos): sin index.html,
  // nginx resolvería `$uri/` a la carpeta y respondería 403. Llevan el index.html genérico
  // (son rutas válidas de la SPA: React pone su título y canonical).
  let parents = 0;
  for (const path of seen) {
    const parts = path.split('/').filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      const dir = join(DIST_DIR, ...parts.slice(0, i));
      const file = join(dir, 'index.html');
      if (!existsSync(file)) {
        writeFileSync(file, baseHtml);
        parents++;
      }
    }
  }
  console.log(`[static-meta] ${pages.length} páginas con título propio (+${parents} carpetas con el index.html genérico) en ${DIST_DIR}`);
}

// Solo al ejecutarlo directamente (los tests importan renderPage/listPages)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
