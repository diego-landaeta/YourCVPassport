/**
 * Copias de index.html por ruta pública con su título, descripción y contenido propios
 * (issue #5, B2; auditoría SEO del 25/10/2026, hallazgos 02, 03, 11 y 16).
 *
 * La SPA servía el mismo index.html en todas las URLs: el título genérico llegaba primero y el de
 * la página, segundos después (React + Helmet). Este script, tras `vite build`, escribe
 * dist/<ruta>/index.html para cada página de seo/static-meta.mjs y para cada artículo del blog con:
 *   - <html lang>, <title> de 50-60 caracteres, description de 120-155 (sin «...»),
 *   - og:title/description, twitter:title/description,
 *   - canonical (la propia URL), og:url, og:locale y hreflang es/en/x-default,
 *   - en los artículos: og:type article, og:image, JSON-LD BlogPosting y BreadcrumbList,
 *   - en el cuerpo, un H1 y contenido propios en lugar del bloque genérico #static-home
 *     (blog: título, descripción, ~1500 caracteres del cuerpo, lista de H2 y enlaces; páginas
 *     estáticas: H1, descripción y enlaces principales). React lo sustituye al montar.
 * Las etiquetas llevan data-rh="true": al montar, react-helmet-async las sustituye por las suyas.
 * La home (dist/index.html) recibe canonical, og:url y JSON-LD Organization/WebSite.
 *
 * Quién las sirve:
 *   - nginx (yourcvpassport-with-ssr.conf): `try_files $uri $uri/index.html /index.html`
 *     sirve dist/precios/index.html en /precios. Con `$uri/` nginx redirigiría con 301
 *     a /precios/, que no es la URL canónica.
 *   - server.mjs: middleware antes del fallback de la SPA.
 * Si el servidor de producción no tiene `$uri/` en try_files, sigue sirviendo el
 * index.html raíz (título genérico en español): nada se rompe.
 *
 * Uso: node scripts/generate-static-meta.mjs [carpetaDist]   (por defecto ./dist o $DIST_DIR)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { STATIC_META_ALIASES, STATIC_META_PAIRS, STATIC_META_SINGLE } from '../seo/static-meta.mjs';
import { COPY, LEGAL_LINKS, MAIN_LINKS, STATIC_SEO } from '../seo/static-seo.mjs';
import { BASE_URL, BRAND, cleanText, escapeHtml, fitDescription, jsonLdScript, pickTitle, stripManagedTags } from '../seo/seo-text.mjs';
import { blogIndexLinks, buildBlogPages } from '../seo/blog-seo.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : process.env.DIST_DIR || join(__dirname, '..', 'dist'));

const MAIN_STYLE = "max-width:720px;margin:48px auto;padding:0 16px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1F2937;line-height:1.6";
const STATIC_MAIN_RE = /<main id="static-home"[\s\S]*?<\/main>/;

/**
 * Sustituye una etiqueta de index.html. Falla si no existe: si alguien cambia
 * index.html, mejor que el build avise a generar páginas con el título genérico.
 * Se usa una función en replace() para que "$&" o "$'" del texto no se interpreten.
 */
function replaceTag(html, pattern, tag, label) {
  if (!pattern.test(html)) throw new Error(`[static-meta] index.html no tiene ${label}`);
  return html.replace(pattern, () => tag);
}

/** Sustituye una etiqueta si existe; si no, la añade antes de </head>. */
function upsertTag(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, () => tag);
  return html.replace(/<\/head>/i, () => `    ${tag}\n  </head>`);
}

/** HTML de una página: index.html con su idioma, título, descripción, canonical, hreflang y contenido. */
export function renderPage(baseHtml, page) {
  const { path, lang, title, description, alternates, canonical } = page;
  const e = escapeHtml;
  // canonical: solo en las raíces duplicadas (STATIC_META_ALIASES), que apuntan a su principal.
  const url = `${BASE_URL}${canonical ?? path}`;
  let html = stripManagedTags(baseHtml);
  html = replaceTag(html, /<html lang="[^"]*">/, `<html lang="${lang}">`, '<html lang>');
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${e(title)}</title>`, '<title>');
  html = replaceTag(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${e(description)}" data-rh="true" />`, 'description');
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${e(title)}" data-rh="true" />`, 'og:title');
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${e(description)}" data-rh="true" />`, 'og:description');
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${e(title)}" data-rh="true" />`, 'twitter:title');
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${e(description)}" data-rh="true" />`, 'twitter:description');

  if (page.ogType) html = upsertTag(html, /<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${e(page.ogType)}" data-rh="true" />`);
  if (page.ogImage) {
    html = upsertTag(html, /<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${e(page.ogImage)}" data-rh="true" />`);
    html = upsertTag(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${e(page.ogImage)}" data-rh="true" />`);
  }
  if (page.robots) {
    html = html.replace(/[ \t]*<meta name="(?:robots|googlebot)" content="[^"]*"[^>]*>\s*\n?/gi, '');
    html = html.replace(/<\/head>/i, () => `    <meta name="robots" content="${e(page.robots)}" data-rh="true" />\n  </head>`);
  }

  const extra = [
    `<link rel="canonical" href="${e(url)}" data-rh="true" />`,
    `<meta property="og:url" content="${e(url)}" data-rh="true" />`,
    `<meta property="og:locale" content="${lang === 'es' ? 'es_ES' : 'en_US'}" data-rh="true" />`,
  ];
  if (page.publishedTime) extra.push(`<meta property="article:published_time" content="${e(page.publishedTime)}" data-rh="true" />`);
  if (alternates) {
    extra.push(
      `<link rel="alternate" hreflang="en" href="${e(`${BASE_URL}${alternates.en}`)}" data-rh="true" />`,
      `<link rel="alternate" hreflang="es" href="${e(`${BASE_URL}${alternates.es}`)}" data-rh="true" />`,
      `<link rel="alternate" hreflang="x-default" href="${e(`${BASE_URL}${alternates.en}`)}" data-rh="true" />`,
    );
  }
  for (const ld of page.jsonLd ?? []) extra.push(ld);
  html = replaceTag(html, /<\/head>/i, `    ${extra.join('\n    ')}\n  </head>`, '</head>');

  if (page.bodyHtml && STATIC_MAIN_RE.test(html)) html = html.replace(STATIC_MAIN_RE, () => page.bodyHtml);
  return html;
}

/** Home: canonical autorreferente, og:url y JSON-LD Organization + WebSite (sin tocar su contenido). */
export function renderHome(baseHtml) {
  const home = `${BASE_URL}/`;
  const jsonLd = [
    jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND,
      url: home,
      logo: `${BASE_URL}/favicon-512x512.png`,
      email: 'support@yourcvpassport.com',
    }),
    jsonLdScript({ '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: home, inLanguage: ['es', 'en'] }),
  ];
  let html = stripManagedTags(baseHtml);
  const extra = [
    `<link rel="canonical" href="${home}" data-rh="true" />`,
    `<meta property="og:url" content="${home}" data-rh="true" />`,
    `<meta property="og:locale" content="es_ES" data-rh="true" />`,
    ...jsonLd,
  ];
  return replaceTag(html, /<\/head>/i, `    ${extra.join('\n    ')}\n  </head>`, '</head>');
}

/** H1 de una página estática: el título corto sin la marca. */
function h1FromTitle(title) {
  return cleanText(title).replace(/\s*[-|–—:]\s*YourCVPassport\s*$/i, '').replace(/\s*\|\s*YourCVPassport\s*$/i, '').trim() || title;
}

/** Cuerpo estático de una página (H1, descripción y enlaces principales). */
function staticBodyHtml(page) {
  const lang = page.lang;
  const t = COPY[lang];
  const self = page.canonical ?? page.path;
  const links = MAIN_LINKS[lang].filter(([href]) => href !== self);
  const legal = LEGAL_LINKS[lang].filter(([href]) => href !== self);
  const list = (items) => items.map(([href, text]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(text)}</a></li>`).join('');
  const isBlogIndex = self === '/recursos/blog' || self === '/resources/blog';
  const articles = isBlogIndex
    ? `\n        <section aria-label="${escapeHtml(t.articles)}">\n          <h2>${escapeHtml(t.articles)}</h2>\n          <ul>${blogIndexLinks(lang).map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a></li>`).join('')}</ul>\n        </section>`
    : '';
  return `<main id="static-home" data-static-page="page" style="${MAIN_STYLE}">
        <nav aria-label="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(page.h1)}</nav>
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.description)}</p>${articles}
        <nav aria-label="${escapeHtml(t.nav)}">
          <h2>${escapeHtml(t.nav)}</h2>
          <ul>${list(links)}</ul>
        </nav>
        <nav aria-label="${escapeHtml(t.legal)}"><ul>${list(legal)}</ul></nav>
      </main>`;
}

/** Título y descripción de la copia estática: el escrito a mano (STATIC_SEO) o el ajustado. */
function resolveStatic(path, lang, rawTitle, rawDescription) {
  const manual = STATIC_SEO[path] ?? {};
  const title = manual.title ?? pickTitle([rawTitle]).title;
  const description = manual.description ?? fitDescription(rawDescription);
  return { title, description, h1: manual.h1 ?? h1FromTitle(title) };
}

/**
 * Artículos del blog (content/posts): cada uno existe en un solo idioma
 * (/recursos/blog/<slug> o /resources/blog/<slug>), con canonical propio. Los pares traducidos
 * (seo/blog-translations.json) llevan hreflang es/en/x-default en ambas copias.
 */
export function listBlogPages() {
  return buildBlogPages();
}

/** Lista de páginas a generar ({ path, lang, title, description, alternates, h1, bodyHtml... }). */
export function listPages() {
  const pages = [];
  const push = (page) => {
    const seo = resolveStatic(page.rawPath ?? page.path, page.lang, page.title, page.description);
    pages.push({ ...page, spaTitle: page.title, title: seo.title, description: seo.description, h1: seo.h1 });
  };
  for (const pair of STATIC_META_PAIRS) {
    for (const lang of ['es', 'en']) {
      push({ path: pair[lang], lang, title: pair.title[lang], description: pair.description[lang], alternates: { es: pair.es, en: pair.en } });
    }
  }
  for (const single of STATIC_META_SINGLE) {
    push({ path: single.path, lang: 'es', title: single.title, description: single.description, alternates: null });
  }
  for (const alias of STATIC_META_ALIASES) {
    const principal = pages.find((p) => p.path === alias.of);
    if (!principal) throw new Error(`[static-meta] Alias ${alias.path} apunta a una ruta sin meta: ${alias.of}`);
    pages.push({ ...principal, path: alias.path, canonical: principal.path });
  }
  for (const page of pages) page.bodyHtml = staticBodyHtml(page);
  pages.push(...listBlogPages());
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
  // La home se escribe la última: las copias anteriores salen del index.html original, sin su canonical.
  writeFileSync(indexPath, renderHome(baseHtml));
  console.log(`[static-meta] ${pages.length} páginas con título y contenido propios (+${parents} carpetas con el index.html genérico) y la home con canonical en ${DIST_DIR}`);
}

// Solo al ejecutarlo directamente (los tests importan renderPage/listPages)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
