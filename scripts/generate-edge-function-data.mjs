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

const re = /"slug":\s*"([^"]+)"[\s\S]*?"published_at":\s*"([^"]+)"/g;
const now = new Date();
const out = [];
let m;
while ((m = re.exec(block)) !== null) {
  const slug = m[1];
  const publishedAt = m[2];
  if (!slug || !publishedAt) continue;
  if (new Date(publishedAt) > now) continue;
  out.push({ slug, published_at: publishedAt });
}

writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
console.log(`Wrote ${out.length} blog post entries to ${outPath}`);
