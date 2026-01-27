/**
 * Vite Plugin: SEO Meta Tags Injection for Profile Pages
 *
 * This plugin intercepts requests to /cv/:slug and injects
 * profile-specific meta tags into the HTML response.
 * This allows SEO bots to see personalized meta tags without
 * needing to execute JavaScript.
 */

import { Plugin } from 'vite';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export default function seoMetaInjection(): Plugin {
  return {
    name: 'seo-meta-injection',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle GET requests to /cv/:slug
        if (req.method !== 'GET' || !req.url?.match(/^\/cv\/[a-zA-Z0-9-]+$/)) {
          return next();
        }

        try {
          // Extract slug from URL
          const slug = req.url.split('/cv/')[1]?.split('?')[0];
          if (!slug) return next();

          // Fetch profile data from Supabase
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, headline, summary, location, avatar_url, slug, meta_title, meta_description')
            .eq('slug', slug)
            .single();

          if (error || !profile) {
            console.log(`[SEO Plugin] Profile not found for slug: ${slug}`);
            return next();
          }

          // Check if profile is complete
          if (!profile.full_name || !profile.headline) {
            console.log(`[SEO Plugin] Profile incomplete for slug: ${slug}`);
            return next();
          }

          // Fetch additional data
          const [
            { data: skills },
            { data: experiences }
          ] = await Promise.all([
            supabase.from('skills').select('name').eq('profile_id', profile.id).limit(7),
            supabase.from('experiences').select('title').eq('profile_id', profile.id).order('start_date', { ascending: false }).limit(3)
          ]);

          // Generate meta tags
          const metaTags = generateMetaTags(profile, skills || [], experiences || []);

          // Read index.html
          const indexPath = path.resolve(__dirname, '../index.html');
          let html = fs.readFileSync(indexPath, 'utf-8');

          // Replace default meta tags with profile-specific ones
          html = html.replace(
            /<title>.*?<\/title>/,
            `<title>${metaTags.title}</title>`
          );

          html = html.replace(
            /<meta name="description" content=".*?".*?>/,
            `<meta name="description" content="${metaTags.description}">`
          );

          html = html.replace(
            /<meta property="og:title" content=".*?".*?>/,
            `<meta property="og:title" content="${metaTags.title}">`
          );

          html = html.replace(
            /<meta property="og:description" content=".*?".*?>/,
            `<meta property="og:description" content="${metaTags.description}">`
          );

          html = html.replace(
            /<meta property="og:image" content=".*?".*?>/,
            `<meta property="og:image" content="${metaTags.image}">`
          );

          html = html.replace(
            /<meta name="twitter:title" content=".*?".*?>/,
            `<meta name="twitter:title" content="${metaTags.title}">`
          );

          html = html.replace(
            /<meta name="twitter:description" content=".*?".*?>/,
            `<meta name="twitter:description" content="${metaTags.description}">`
          );

          // Add keywords meta tag if not present
          if (metaTags.keywords && !html.includes('name="keywords"')) {
            html = html.replace(
              '</head>',
              `<meta name="keywords" content="${metaTags.keywords}">\n</head>`
            );
          }

          // Process HTML with Vite's transform pipeline
          html = await server.transformIndexHtml(req.url, html);

          res.setHeader('Content-Type', 'text/html');
          res.end(html);

        } catch (error) {
          console.error('[SEO Plugin] Error:', error);
          return next();
        }
      });
    }
  };
}

function generateMetaTags(profile: any, skills: any[], experiences: any[]) {
  // Generate title
  const title = profile.meta_title ||
    `${profile.full_name} - ${profile.headline} | YourCVPassport`;

  // Generate description
  let description = profile.meta_description;

  if (!description) {
    const descParts: string[] = [];

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

  // Generate keywords
  const keywordParts: string[] = [];
  if (profile.full_name) keywordParts.push(profile.full_name);
  if (profile.headline) keywordParts.push(profile.headline);
  if (profile.location) keywordParts.push(profile.location);

  skills.forEach(skill => {
    if (skill.name) keywordParts.push(skill.name);
  });

  experiences.forEach(exp => {
    if (exp.title) keywordParts.push(exp.title);
  });

  keywordParts.push('professional profile', 'CV', 'resume');
  const keywords = keywordParts.filter(Boolean).join(', ');

  // Image
  const image = profile.avatar_url || 'https://yourcvpassport.com/default-avatar.png';

  return {
    title,
    description,
    keywords,
    image
  };
}
