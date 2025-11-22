import { Profile, Experience, Education, Skill } from '../types';

/**
 * Generate Person Schema with complete information
 */
export function generatePersonSchema(
  profile: Profile,
  experiences?: Experience[],
  education?: Education[],
  skills?: Skill[],
  baseUrl: string = 'https://yourcvpassport.com'
) {
  const profileUrl = `${baseUrl}/cv/${profile.slug}`;
  const imageUrl = profile.avatar_url || `${baseUrl}/default-avatar.png`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name,
    jobTitle: profile.headline,
    url: profileUrl,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 400,
      height: 400
    },
    description: profile.summary,
    email: `contact@yourcvpassport.com`, // Masked email
    telephone: profile.phone,
    address: profile.location ? {
      '@type': 'PostalAddress',
      addressLocality: profile.location
    } : undefined,
    sameAs: [
      profile.linkedin_url,
      profile.github_url,
      profile.portfolio_url
    ].filter(Boolean)
  };

  // Add skills to knowsAbout
  if (skills && skills.length > 0) {
    schema.knowsAbout = skills.map(skill => ({
      '@type': 'Thing',
      name: skill.name
    }));
  }

  // Add education to alumniOf
  if (education && education.length > 0) {
    schema.alumniOf = education.map(edu => ({
      '@type': 'EducationalOrganization',
      name: edu.institution_name,
      description: `${edu.degree}${edu.field_of_study ? ` in ${edu.field_of_study}` : ''}`
    }));
  }

  // Add work experience
  if (experiences && experiences.length > 0) {
    schema.worksFor = experiences
      .filter(exp => !exp.end_date) // Current positions
      .map(exp => ({
        '@type': 'Organization',
        name: exp.company_name
      }));

    schema.hasOccupation = experiences.map(exp => ({
      '@type': 'Occupation',
      name: exp.position,
      occupationLocation: {
        '@type': 'Place',
        name: exp.company_name
      },
      estimatedSalary: undefined, // Optional
      experienceRequirements: exp.description
    }));
  }

  return schema;
}

/**
 * Generate EducationalOccupationalCredential Schema for certifications
 */
export function generateCredentialSchema(
  certification: {
    name: string;
    issuer: string;
    dateIssued: string;
    credentialUrl?: string;
  },
  personUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: certification.name,
    credentialCategory: 'certificate',
    recognizedBy: {
      '@type': 'Organization',
      name: certification.issuer
    },
    dateCreated: certification.dateIssued,
    url: certification.credentialUrl,
    about: {
      '@type': 'Person',
      url: personUrl
    }
  };
}

/**
 * Generate ProfilePage Schema
 */
export function generateProfilePageSchema(
  profile: Profile,
  baseUrl: string = 'https://yourcvpassport.com'
) {
  const profileUrl = `${baseUrl}/cv/${profile.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${profile.full_name} - Professional Profile`,
    url: profileUrl,
    mainEntity: {
      '@type': 'Person',
      name: profile.full_name,
      jobTitle: profile.headline,
      url: profileUrl
    },
    dateCreated: (profile as any).created_at,
    dateModified: (profile as any).updated_at,
    inLanguage: ['en', 'es']
  };
}

/**
 * Generate BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(
  profile: Profile,
  baseUrl: string = 'https://yourcvpassport.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Profiles',
        item: `${baseUrl}/profiles`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: profile.full_name,
        item: `${baseUrl}/cv/${profile.slug}`
      }
    ]
  };
}

/**
 * Generate WebSite Schema for the main site
 */
export function generateWebSiteSchema(baseUrl: string = 'https://yourcvpassport.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'YourCVPassport',
    url: baseUrl,
    description: 'Create and share your professional CV passport with the world',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: ['en', 'es']
  };
}

/**
 * Combine all schemas into a single JSON-LD script
 */
export function generateAllSchemas(
  profile: Profile,
  experiences?: Experience[],
  education?: Education[],
  skills?: Skill[],
  certifications?: any[],
  baseUrl: string = 'https://yourcvpassport.com'
) {
  const schemas = [
    generatePersonSchema(profile, experiences, education, skills, baseUrl),
    generateProfilePageSchema(profile, baseUrl),
    generateBreadcrumbSchema(profile, baseUrl)
  ];

  // Add certification schemas if available
  if (certifications && certifications.length > 0) {
    const personUrl = `${baseUrl}/cv/${profile.slug}`;
    certifications.forEach(cert => {
      schemas.push(generateCredentialSchema(cert, personUrl));
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas
  };
}
