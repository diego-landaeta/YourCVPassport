import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://www.yourcvpassport.com';

// Define all routes (only English paths, no Spanish)
const routes = [
  // Auth Pages
  { path: '/login', priority: '0.8', changefreq: 'monthly' },
  { path: '/signup', priority: '0.8', changefreq: 'monthly' },

  // Product Pages
  { path: '/product/overview', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/stamps', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/ats', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/domain', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/analytics', priority: '0.9', changefreq: 'weekly' },
  { path: '/product/ai', priority: '0.9', changefreq: 'weekly' },
  { path: '/product', priority: '0.9', changefreq: 'weekly' },

  // Professionals Pages
  { path: '/professionals/how', priority: '0.9', changefreq: 'weekly' },
  { path: '/professionals/templates', priority: '0.9', changefreq: 'weekly' },
  { path: '/professionals/help', priority: '0.8', changefreq: 'weekly' },
  { path: '/professionals', priority: '0.9', changefreq: 'weekly' },

  // Companies Pages
  { path: '/companies/search', priority: '0.9', changefreq: 'weekly' },
  { path: '/companies/plans', priority: '0.9', changefreq: 'weekly' },
  { path: '/companies/integrations', priority: '0.8', changefreq: 'weekly' },
  { path: '/companies/security', priority: '0.8', changefreq: 'monthly' },
  { path: '/companies', priority: '0.9', changefreq: 'weekly' },

  // Resources Pages
  { path: '/resources/blog', priority: '0.7', changefreq: 'daily' },
  { path: '/resources/library', priority: '0.8', changefreq: 'weekly' },
  { path: '/resources/success', priority: '0.7', changefreq: 'monthly' },
  { path: '/resources/status', priority: '0.6', changefreq: 'daily' },
  { path: '/resources', priority: '0.7', changefreq: 'weekly' },

  // About Pages
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/about/mission', priority: '0.6', changefreq: 'monthly' },
  { path: '/about/press', priority: '0.6', changefreq: 'monthly' },
  { path: '/about/contact', priority: '0.8', changefreq: 'monthly' },

  // Pricing Page
  { path: '/pricing', priority: '1.0', changefreq: 'weekly' },

  // Public Profiles
  { path: '/profiles', priority: '0.8', changefreq: 'daily' },

  // Home Page (highest priority)
  { path: '/', priority: '1.0', changefreq: 'daily' },
];

function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];

  const urlEntries = routes.map(route => {
    return `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>
`;

  return sitemap;
}

// Generate and save sitemap
const sitemap = generateSitemap();
const sitemapPath = join(__dirname, '..', 'public', 'sitemap.xml');

try {
  writeFileSync(sitemapPath, sitemap, 'utf-8');
  console.log('✅ Sitemap generated successfully at:', sitemapPath);
  console.log(`📊 Total URLs: ${routes.length}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
