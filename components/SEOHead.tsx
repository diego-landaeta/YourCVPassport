import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Profile } from '../types';
import { normalizeUrl } from '../utils/canonicalUrl';

interface SEOHeadProps {
  title?: string;
  description?: string;
  profile?: Profile;
  currentLang?: 'en' | 'es';
  canonicalUrl?: string;
  keywords?: string;
  profileSkills?: string[]; // Top skills from profile
  profileExperience?: string[]; // Job titles from experience
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title: propTitle,
  description: propDescription,
  profile,
  currentLang = 'en',
  canonicalUrl,
  keywords: propKeywords,
  profileSkills = [],
  profileExperience = []
}) => {
  const baseUrl = 'https://yourcvpassport.com';

  // Determine URL and Image
  let profileUrl = canonicalUrl;
  let imageUrl = `${baseUrl}/default-avatar.png`;

  if (profile) {
    // Always prefer slug over id for canonical URL
    const profilePath = profile.slug || profile.id;
    profileUrl = canonicalUrl || `${baseUrl}/cv/${profilePath}`;
    imageUrl = profile.avatar_url || `${baseUrl}/default-avatar.png`;
  } else {
    profileUrl = canonicalUrl || baseUrl;
  }

  // Normalize the canonical URL (remove query strings, trailing slashes, etc.)
  profileUrl = normalizeUrl(profileUrl);
  
  // Generate title and description
  let title = propTitle || "YourCVPassport - Professional CV Verification";
  let description = propDescription || "Create, verify, and share your professional CV with YourCVPassport.";

  if (profile) {
    title = propTitle || profile.meta_title || `${profile.full_name} - ${profile.headline} | YourCVPassport`;

    // Build a rich, profile-specific description
    if (!propDescription && !profile.meta_description) {
      // Create description from profile data
      let descParts: string[] = [];

      // Add headline
      if (profile.headline) {
        descParts.push(profile.headline);
      }

      // Add location if available
      if (profile.location) {
        descParts.push(`Based in ${profile.location}`);
      }

      // Add summary if available (truncated to fit within 160 chars total)
      if (profile.summary && profile.summary.length > 0) {
        const remainingChars = 160 - descParts.join('. ').length - 3; // -3 for ". " separator
        if (remainingChars > 50) {
          const summarySnippet = profile.summary.substring(0, remainingChars).trim();
          descParts.push(summarySnippet);
        }
      }

      description = descParts.join('. ');

      // Ensure we don't exceed 160 characters
      if (description.length > 160) {
        description = description.substring(0, 157) + '...';
      }

      // Fallback if we couldn't build a good description
      if (!description || description.length < 20) {
        description = `Professional profile of ${profile.full_name}. ${profile.headline}`;
      }
    } else {
      description = propDescription || profile.meta_description ||
        profile.summary?.substring(0, 160) ||
        `Professional profile of ${profile.full_name}. ${profile.headline}`;
    }

    // Ensure description doesn't end abruptly
    if (description && !description.endsWith('.') && !description.endsWith('...')) {
      description = description + '.';
    }
  }

  // Generate keywords automatically from profile data if not provided
  let keywords = propKeywords;
  if (!keywords && profile) {
    const keywordParts: string[] = [];

    // Add name and headline
    if (profile.full_name) keywordParts.push(profile.full_name);
    if (profile.headline) keywordParts.push(profile.headline);

    // Add location
    if (profile.location) keywordParts.push(profile.location);

    // Add top skills (limit to 5-7)
    if (profileSkills && profileSkills.length > 0) {
      keywordParts.push(...profileSkills.slice(0, 7));
    }

    // Add job titles from experience (limit to 3)
    if (profileExperience && profileExperience.length > 0) {
      keywordParts.push(...profileExperience.slice(0, 3));
    }

    // Add generic professional terms
    keywordParts.push('professional profile', 'CV', 'resume');

    // Create comma-separated keywords string
    keywords = keywordParts.filter(Boolean).join(', ');
  }

  // Person Schema.org structured data (Only if profile exists)
  const personSchema = profile ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name,
    jobTitle: profile.headline,
    url: profileUrl,
    image: imageUrl,
    description: profile.summary || description,
    address: profile.location ? {
      '@type': 'PostalAddress',
      addressLocality: profile.location
    } : undefined,
    sameAs: [
      profile.linkedin_url,
      profile.github_url,
      profile.portfolio_url
    ].filter(Boolean),
    knowsAbout: [], // Will be populated with skills
    alumniOf: [], // Will be populated with education
    hasCredential: [] // Will be populated with certifications
  } : null;

  // Alternate language URLs
  const alternateUrls = profile ? {
    en: `${baseUrl}/cv/${profile.slug}?lang=en`,
    es: `${baseUrl}/es/cv/${profile.slug}?lang=es`
  } : {
    en: `${baseUrl}?lang=en`,
    es: `${baseUrl}/es?lang=es`
  };

  // Generate unique key to force updates
  const helmetKey = profile ? `profile-${profile.slug || profile.id}` : 'default';

  return (
    <Helmet key={helmetKey}>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {profileUrl && <link rel="canonical" href={profileUrl} />}
      
      {/* Language Alternates */}
      <link rel="alternate" hrefLang="en" href={alternateUrls.en} />
      <link rel="alternate" hrefLang="es" href={alternateUrls.es} />
      <link rel="alternate" hrefLang="x-default" href={alternateUrls.en} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={profile ? "profile" : "website"} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {profileUrl && <meta property="og:url" content={profileUrl} />}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="YourCVPassport" />
      <meta property="og:locale" content={currentLang === 'es' ? 'es_ES' : 'en_US'} />
      <meta property="og:locale:alternate" content={currentLang === 'es' ? 'en_US' : 'es_ES'} />
      
      {/* Profile-specific OG tags */}
      {profile && (
        <>
          <meta property="profile:first_name" content={profile.full_name?.split(' ')[0] || ''} />
          <meta property="profile:last_name" content={profile.full_name?.split(' ').slice(1).join(' ') || ''} />
          <meta property="profile:username" content={profile.slug || ''} />
        </>
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@YourCVPassport" />
      <meta name="twitter:creator" content={profile?.linkedin_url ? `@${profile.slug}` : '@YourCVPassport'} />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      {profile && <meta name="author" content={profile.full_name} />}
      <meta name="language" content={currentLang === 'es' ? 'Spanish' : 'English'} />
      
      {/* Schema.org JSON-LD */}
      {personSchema && (
        <script type="application/ld+json">
          {JSON.stringify(personSchema, null, 2)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;

