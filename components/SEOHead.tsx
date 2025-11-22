import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Profile } from '../types';

interface SEOHeadProps {
  title?: string;
  description?: string;
  profile?: Profile;
  currentLang?: 'en' | 'es';
  canonicalUrl?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
  title: propTitle, 
  description: propDescription, 
  profile, 
  currentLang = 'en', 
  canonicalUrl 
}) => {
  const baseUrl = 'https://yourcvpassport.com';
  
  // Determine URL and Image
  let profileUrl = canonicalUrl;
  let imageUrl = `${baseUrl}/default-avatar.png`;
  
  if (profile) {
    profileUrl = canonicalUrl || `${baseUrl}/cv/${profile.slug}`;
    imageUrl = profile.avatar_url || `${baseUrl}/default-avatar.png`;
  } else {
    profileUrl = canonicalUrl || baseUrl;
  }
  
  // Generate title and description
  let title = propTitle || "YourCVPassport - Professional CV Verification";
  let description = propDescription || "Create, verify, and share your professional CV with YourCVPassport.";

  if (profile) {
    title = propTitle || profile.meta_title || `${profile.full_name} - ${profile.headline} | YourCVPassport`;
    description = propDescription || profile.meta_description || 
      profile.summary?.substring(0, 160) || 
      `Professional profile of ${profile.full_name}. ${profile.headline}`;
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

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
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

