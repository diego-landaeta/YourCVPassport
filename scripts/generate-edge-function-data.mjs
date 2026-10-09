// Extracts blog post metadata from content/posts/index.ts and writes
// supabase/functions/sitemap/blog-posts-data.json so the Edge Function
// can bundle the same 300 blogs the static sitemap has.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const indexPath = join(__dirname, '..', 'content', 'posts', 'index.ts');
const outPath = join(__dirname, '..', 'supabase', 'functions', 'sitemap', 'blog-posts-data.json');

const source = readFileSync(indexPath, 'utf-8');
const metaStart = source.indexOf('allPostsMeta:');
if (metaStart === -1) {
  console.error('allPostsMeta not found');
  process.exit(1);
}
const block = source.slice(metaStart);

// Un objeto por entrada: slug, fecha e idioma. Cada artículo vive solo bajo la ruta de
// su idioma (/resources/blog/ en, /recursos/blog/ es), igual que el sitemap estático.
const entries = block.split(/\n  \},?/);
const field = (text, name) => (text.match(new RegExp(`"${name}":\\s*"([^"]+)"`)) || [])[1];
const now = new Date();
const out = [];
for (const entry of entries) {
  const slug = field(entry, 'slug');
  const publishedAt = field(entry, 'published_at');
  if (!slug || !publishedAt) continue;
  if (new Date(publishedAt) > now) continue;
  out.push({ slug, published_at: publishedAt, lang: field(entry, 'lang') === 'en' ? 'en' : 'es' });
}

writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
console.log(`Wrote ${out.length} blog post entries to ${outPath}`);
