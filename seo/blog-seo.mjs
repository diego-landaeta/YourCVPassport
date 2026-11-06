/**
 * Datos SEO de los artículos del blog para los generadores estáticos: título y descripción dentro
 * de rango y sin «...», cuerpo en texto para el HTML inicial, JSON-LD BlogPosting/BreadcrumbList y
 * hreflang recíproco entre artículos traducidos (seo/blog-translations.json).
 *
 * Los artículos viven como ficheros TS (content/posts/<slug>.ts) y su listado en
 * content/posts/index.ts (`allPostsMeta`). Esto es Node puro: se leen como texto y el objeto
 * literal de cada fichero se evalúa (contenido propio del repositorio, no datos de usuarios).
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  BASE_URL, BRAND, cleanText, escapeHtml, excerptBlocks, fitDescription, fitTitleWithBrand,
  jsonLdScript, markdownToBlocks, DESC_MIN, DESC_MAX,
} from './seo-text.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const POSTS_DIR = join(ROOT, 'content', 'posts');

export const BLOG_LIST_PATH = { es: '/recursos/blog', en: '/resources/blog' };

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(join(__dirname, file), 'utf-8'));
  } catch {
    return fallback;
  }
}

/** Listado (sin cuerpo) de allPostsMeta en content/posts/index.ts. */
export function readPostsMeta() {
  const src = readFileSync(join(POSTS_DIR, 'index.ts'), 'utf-8');
  const at = src.indexOf('allPostsMeta');
  const start = src.indexOf('[', src.indexOf('=', at));
  let depth = 0;
  let end = start;
  for (; end < src.length; end++) {
    if (src[end] === '[') depth++;
    else if (src[end] === ']' && --depth === 0) break;
  }
  const posts = JSON.parse(src.slice(start, end + 1));
  const now = Date.now();
  return posts.filter((p) => !p.published_at || new Date(p.published_at).getTime() <= now);
}

/** Cuerpo markdown de un artículo (content/posts/<slug>.ts), o '' si el fichero no existe. */
export function readPostContent(slug) {
  const file = join(POSTS_DIR, `${slug}.ts`);
  if (!/^[a-z0-9-]+$/.test(slug) || !existsSync(file)) return '';
  const src = readFileSync(file, 'utf-8');
  const marker = 'const post: BlogPostData = ';
  const from = src.indexOf(marker);
  const to = src.lastIndexOf('export default post');
  if (from === -1 || to === -1) return '';
  const literal = src.slice(from + marker.length, to).trim().replace(/;$/, '');
  try {
    // eslint-disable-next-line no-new-func
    const obj = new Function(`return (${literal});`)();
    return typeof obj?.content === 'string' ? obj.content : '';
  } catch {
    return '';
  }
}

/**
 * Pares de artículos traducidos [{ es, en }] (slug de cada idioma). Se descartan los pares
 * cuyo artículo no exista o no esté publicado: un hreflang solo sirve si es recíproco.
 */
export function loadTranslationPairs(postsMeta) {
  const raw = readJson('blog-translations.json', { pairs: [] });
  const bySlug = new Map(postsMeta.map((p) => [p.slug, p]));
  const pairs = [];
  const seen = new Set();
  for (const pair of raw.pairs || []) {
    const es = bySlug.get(pair.es);
    const en = bySlug.get(pair.en);
    if (!es || !en || es.lang !== 'es' || en.lang !== 'en') continue;
    if (seen.has(pair.es) || seen.has(pair.en)) continue; // un artículo, una sola traducción
    seen.add(pair.es);
    seen.add(pair.en);
    pairs.push({ es: pair.es, en: pair.en });
  }
  return pairs;
}

export function blogPath(slug, lang) {
  return `${BLOG_LIST_PATH[lang === 'en' ? 'en' : 'es']}/${slug}`;
}

const FILLER = {
  es: ['Guía práctica de YourCVPassport.', 'Consejos prácticos para tu búsqueda de empleo.', 'Con ejemplos y consejos prácticos.', 'Consejos y ejemplos.', 'Guía paso a paso.'],
  en: ['A practical guide from YourCVPassport.', 'Practical advice for your job search.', 'With examples and practical tips.', 'Tips and examples.', 'A step-by-step guide.'],
};

const COPY = {
  es: { breadcrumbRoot: 'Inicio', blog: 'Blog', back: 'Volver al blog', related: 'Artículos relacionados', toc: 'En este artículo', translation: 'Leer este artículo en inglés', by: 'Por' },
  en: { breadcrumbRoot: 'Home', blog: 'Blog', back: 'Back to the blog', related: 'Related articles', toc: 'In this article', translation: 'Read this article in Spanish', by: 'By' },
};

function formatDate(iso, lang) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** Título de la copia estática: `seoTitle` escrito a mano si existe, o el ajustado por algoritmo. */
export function blogSeoTitle(post, overrides) {
  const manual = overrides?.posts?.[post.slug]?.title;
  if (manual) return manual;
  return fitTitleWithBrand(post.meta_title || post.title).title;
}

/** Descripción de 120 a 155 con frase completa; si falta largo se completa con el cuerpo. */
export function blogSeoDescription(post, overrides, content) {
  const manual = overrides?.posts?.[post.slug]?.description;
  if (manual) return manual;
  const base = post.meta_description || post.summary || '';
  const lang = post.lang === 'en' ? 'en' : 'es';
  // Los cuerpos generados repiten plantillas («Veamos los aspectos...»): no sirven de relleno.
  // Si la descripción original es corta se completa con una frase neutra de FILLER.
  let desc = fitDescription(base);
  if (desc.length < DESC_MIN) {
    // Frases de relleno: la primera que deje la descripción en rango, sola o en pareja
    const fillers = FILLER[lang];
    const tries = [...fillers.map((f) => [f]), ...fillers.flatMap((f, i) => fillers.slice(i + 1).map((g) => [f, g]))];
    for (const combo of tries) {
      const next = [desc, ...combo].join(' ').trim();
      if (next.length >= DESC_MIN && next.length <= DESC_MAX) { desc = next; break; }
    }
  }
  return desc;
}

const STYLE = "max-width:720px;margin:48px auto;padding:0 16px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1F2937;line-height:1.6";

function renderBlocks(blocks) {
  return blocks.map((b) => {
    if (b.type === 'h2') return `<h2>${escapeHtml(b.text)}</h2>`;
    if (b.type === 'h3') return `<h3>${escapeHtml(b.text)}</h3>`;
    if (b.type === 'ul') return `<ul>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    return `<p>${escapeHtml(b.text)}</p>`;
  }).join('\n        ');
}

/**
 * Páginas del blog para generate-static-meta: [{ path, lang, title, description, h1, bodyHtml,
 * jsonLd, ogType, ogImage, alternates, publishedTime, bodyChars }].
 */
export function buildBlogPages() {
  const posts = readPostsMeta();
  const overrides = readJson('seo-titles.json', { posts: {} });
  const pairs = loadTranslationPairs(posts);
  const byEs = new Map(pairs.map((p) => [p.es, p.en]));
  const byEn = new Map(pairs.map((p) => [p.en, p.es]));
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const sortedByDate = [...posts].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  return posts.map((post) => {
    const lang = post.lang === 'en' ? 'en' : 'es';
    const path = blogPath(post.slug, lang);
    const content = readPostContent(post.slug);
    const parsed = markdownToBlocks(content);
    const { blocks } = parsed;
    // Sin encabezados repetidos en la lista del artículo
    const h2s = [...new Set(parsed.h2s)];
    const excerpt = excerptBlocks(blocks, 1500);
    const t = COPY[lang];
    const title = blogSeoTitle(post, overrides);
    const description = blogSeoDescription(post, overrides, content);

    // hreflang recíproco solo si el par está declarado y ambos artículos existen
    const partnerSlug = lang === 'es' ? byEs.get(post.slug) : byEn.get(post.slug);
    const partner = partnerSlug ? bySlug.get(partnerSlug) : null;
    const alternates = partner
      ? (lang === 'es'
        ? { es: path, en: blogPath(partner.slug, 'en') }
        : { es: blogPath(partner.slug, 'es'), en: path })
      : null;

    const related = sortedByDate
      .filter((p) => p.lang === post.lang && p.category === post.category && p.slug !== post.slug)
      .slice(0, 3);

    const url = `${BASE_URL}${path}`;
    const listUrl = `${BASE_URL}${BLOG_LIST_PATH[lang]}`;
    const image = post.image_url || `${BASE_URL}/og-image.png`;
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: cleanText(post.title).slice(0, 110),
        description,
        image: [image],
        datePublished: post.published_at,
        dateModified: post.published_at,
        inLanguage: lang,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        url,
        author: { '@type': 'Organization', name: post.author_name || `${BRAND} Team`, url: BASE_URL },
        publisher: { '@type': 'Organization', name: BRAND, url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon-512x512.png` } },
        articleSection: post.category,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.breadcrumbRoot, item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: t.blog, item: listUrl },
          { '@type': 'ListItem', position: 3, name: cleanText(post.title), item: url },
        ],
      },
    ];

    const h2List = h2s.length
      ? `\n        <nav aria-label="${escapeHtml(t.toc)}">\n          <h2>${escapeHtml(t.toc)}</h2>\n          <ul>${h2s.slice(0, 12).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>\n        </nav>`
      : '';
    const relatedHtml = related.length
      ? `\n        <aside aria-label="${escapeHtml(t.related)}">\n          <h2>${escapeHtml(t.related)}</h2>\n          <ul>${related.map((r) => `<li><a href="${escapeHtml(blogPath(r.slug, lang))}">${escapeHtml(cleanText(r.title))}</a></li>`).join('')}</ul>\n        </aside>`
      : '';
    const translationHtml = alternates
      ? `\n        <p><a href="${escapeHtml(lang === 'es' ? alternates.en : alternates.es)}" hreflang="${lang === 'es' ? 'en' : 'es'}">${escapeHtml(t.translation)}</a></p>`
      : '';

    const bodyHtml = `<main id="static-home" data-static-page="blog-post" style="${STYLE}">
        <nav aria-label="breadcrumb"><a href="/">${escapeHtml(t.breadcrumbRoot)}</a> / <a href="${BLOG_LIST_PATH[lang]}">${escapeHtml(t.blog)}</a></nav>
        <article>
          <h1>${escapeHtml(cleanText(post.title))}</h1>
          <p><small>${escapeHtml(post.category || '')} · <time datetime="${escapeHtml(post.published_at)}">${escapeHtml(formatDate(post.published_at, lang))}</time></small></p>
          <p><strong>${escapeHtml(cleanText(post.meta_description || post.summary || description))}</strong></p>
          ${renderBlocks(excerpt.blocks)}
        </article>${h2List}${relatedHtml}${translationHtml}
        <p><a href="${BLOG_LIST_PATH[lang]}">${escapeHtml(t.back)}</a></p>
      </main>`;

    return {
      path, lang, title, description, alternates,
      h1: cleanText(post.title),
      bodyHtml,
      jsonLd: jsonLd.map(jsonLdScript),
      ogType: 'article',
      ogImage: image,
      publishedTime: post.published_at,
      bodyChars: excerpt.chars,
      slug: post.slug,
    };
  });
}

/** Listado de enlaces a todos los artículos de un idioma (para la portada del blog). */
export function blogIndexLinks(lang) {
  return readPostsMeta()
    .filter((p) => p.lang === lang)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .map((p) => ({ href: blogPath(p.slug, lang), text: cleanText(p.title) }));
}
