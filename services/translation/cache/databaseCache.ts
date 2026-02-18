import { supabase } from '../../../supabase/client';
import { FullProfileData } from '../../../types';
import { TranslationLanguage } from '../providers/types';

export interface CachedTranslation {
  profile_id: string;
  target_language: TranslationLanguage;
  translated_content: TranslatedProfileContent;
  source_content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface TranslatedProfileContent {
  profile: {
    headline?: string | null;
    summary?: string | null;
  };
  experiences: Array<{
    id: string;
    position?: string | null;
    description?: string | null;
    achievements?: (string | null)[];
  }>;
  education: Array<{
    id: string;
    degree?: string | null;
    field_of_study?: string | null;
    description?: string | null;
    grade?: string | null;
  }>;
  portfolioItems?: Array<{
    id: string;
    title?: string | null;
    description?: string | null;
  }>;
  portfolio?: Array<{
    id: string;
    title?: string | null;
    description?: string | null;
  }>;
  skills: Array<{
    id: string;
    name: string;
  }>;
  certifications?: Array<{
    id: string;
    name?: string | null;
    title?: string | null;
    description?: string | null;
  }>;
}

/**
 * Generate a hash of the profile content to detect changes
 * Uses a simple string concatenation + basic hash for efficiency
 */
export function generateContentHash(profileData: FullProfileData): string {
  const contentParts: string[] = [];

  // Profile fields
  contentParts.push(profileData.profile.headline || '');
  contentParts.push(profileData.profile.summary || '');

  // Experiences (sorted by id for consistency)
  const sortedExperiences = [...(profileData.experiences || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  );
  sortedExperiences.forEach(exp => {
    contentParts.push(exp.id || '');
    contentParts.push(exp.position || '');
    contentParts.push(exp.description || '');
    (exp.achievements || []).forEach(a => contentParts.push(a || ''));
  });

  // Education (sorted by id)
  const sortedEducation = [...(profileData.education || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  );
  sortedEducation.forEach(edu => {
    contentParts.push(edu.id || '');
    contentParts.push(edu.degree || '');
    contentParts.push(edu.field_of_study || '');
    contentParts.push(edu.description || '');
    contentParts.push(edu.grade || '');
  });

  // Portfolio items
  const sortedPortfolio = [...(profileData.portfolioItems || profileData.portfolio || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  );
  sortedPortfolio.forEach(item => {
    contentParts.push(item.id || '');
    contentParts.push(item.title || '');
    contentParts.push(item.description || '');
  });

  // Skills (sorted by id)
  const sortedSkills = [...(profileData.skills || [])].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '')
  );
  sortedSkills.forEach(skill => {
    contentParts.push(skill.id || '');
    contentParts.push(skill.name || '');
  });

  // Certifications (sorted by id)
  const sortedCertifications = [...(profileData.certifications || [])].sort((a, b) =>
    ((a as any).id || '').localeCompare((b as any).id || '')
  );
  sortedCertifications.forEach(cert => {
    const certAny = cert as any;
    contentParts.push(certAny.id || '');
    contentParts.push(certAny.name || '');
    contentParts.push(certAny.title || '');
    contentParts.push(certAny.description || '');
  });

  // Create simple hash from concatenated content
  const content = contentParts.join('|');
  return simpleHash(content);
}

/**
 * Simple hash function (djb2 algorithm)
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Get cached translation from database
 */
export async function getCachedTranslation(
  profileId: string,
  targetLanguage: TranslationLanguage,
  currentContentHash: string
): Promise<TranslatedProfileContent | null> {
  try {
    console.log('[DatabaseCache] Checking cache for:', { profileId, targetLanguage, currentContentHash });

    const { data, error } = await supabase
      .from('profile_translations')
      .select('translated_content, source_content_hash')
      .eq('profile_id', profileId)
      .eq('target_language', targetLanguage)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - cache miss
        console.log('[DatabaseCache] Cache miss - no entry found');
        return null;
      }
      console.error('[DatabaseCache] Error fetching cache:', error);
      return null;
    }

    // Check if content hash matches (profile hasn't changed)
    if (data.source_content_hash !== currentContentHash) {
      console.log('[DatabaseCache] Cache invalid - content has changed', {
        cachedHash: data.source_content_hash,
        currentHash: currentContentHash,
      });
      return null;
    }

    console.log('[DatabaseCache] Cache hit!');
    return data.translated_content as TranslatedProfileContent;
  } catch (err) {
    console.error('[DatabaseCache] Error:', err);
    return null;
  }
}

/**
 * Save translation to database cache
 */
export async function saveCachedTranslation(
  profileId: string,
  targetLanguage: TranslationLanguage,
  translatedContent: TranslatedProfileContent,
  contentHash: string
): Promise<boolean> {
  try {
    console.log('[DatabaseCache] Saving to cache:', { profileId, targetLanguage, contentHash });

    const { error } = await supabase
      .from('profile_translations')
      .upsert({
        profile_id: profileId,
        target_language: targetLanguage,
        translated_content: translatedContent,
        source_content_hash: contentHash,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,target_language',
      });

    if (error) {
      console.error('[DatabaseCache] Error saving cache:', error);
      return false;
    }

    console.log('[DatabaseCache] Cache saved successfully');
    return true;
  } catch (err) {
    console.error('[DatabaseCache] Error saving:', err);
    return false;
  }
}

/**
 * Extract translatable content structure from profile data
 * Used to store/restore cached translations
 */
export function extractTranslatedContent(
  profileData: FullProfileData,
  translations: Map<string, string>,
  translatedSkills: Array<{ id: string; name: string }>
): TranslatedProfileContent {
  const getTranslation = (text: string | null | undefined): string | null | undefined => {
    if (!text) return text;
    return translations.get(text) || text;
  };

  return {
    profile: {
      headline: getTranslation(profileData.profile.headline),
      summary: getTranslation(profileData.profile.summary),
    },
    experiences: (profileData.experiences || []).map(exp => ({
      id: exp.id || '',
      position: getTranslation(exp.position),
      description: getTranslation(exp.description),
      achievements: exp.achievements?.map(a => getTranslation(a) || a),
    })),
    education: (profileData.education || []).map(edu => ({
      id: edu.id || '',
      degree: getTranslation(edu.degree),
      field_of_study: getTranslation(edu.field_of_study),
      description: getTranslation(edu.description),
      grade: getTranslation(edu.grade),
    })),
    portfolioItems: profileData.portfolioItems?.map(item => ({
      id: item.id || '',
      title: getTranslation(item.title),
      description: getTranslation(item.description),
    })),
    portfolio: profileData.portfolio?.map(item => ({
      id: item.id || '',
      title: getTranslation(item.title),
      description: getTranslation(item.description),
    })),
    skills: translatedSkills.map(s => ({ id: s.id || '', name: s.name })),
    certifications: (profileData.certifications || []).map(cert => {
      const certAny = cert as any;
      return {
        id: certAny.id || '',
        name: certAny.name ? (getTranslation(certAny.name) || certAny.name) : certAny.name,
        title: certAny.title ? (getTranslation(certAny.title) || certAny.title) : certAny.title,
        description: getTranslation(certAny.description),
      };
    }),
  };
}

/**
 * Apply cached translations to profile data
 */
export function applyCachedTranslations(
  profileData: FullProfileData,
  cached: TranslatedProfileContent
): FullProfileData {
  // Create lookup maps by ID for efficient matching
  const expMap = new Map(cached.experiences.map(e => [e.id, e]));
  const eduMap = new Map(cached.education.map(e => [e.id, e]));
  const portfolioItemsMap = new Map((cached.portfolioItems || []).map(p => [p.id, p]));
  const portfolioMap = new Map((cached.portfolio || []).map(p => [p.id, p]));
  const skillsMap = new Map(cached.skills.map(s => [s.id, s]));

  return {
    ...profileData,
    profile: {
      ...profileData.profile,
      headline: cached.profile.headline || profileData.profile.headline,
      summary: cached.profile.summary || profileData.profile.summary,
    },
    experiences: (profileData.experiences || []).map(exp => {
      const cachedExp = expMap.get(exp.id || '');
      if (!cachedExp) return exp;
      return {
        ...exp,
        position: cachedExp.position || exp.position,
        description: cachedExp.description,
        achievements: cachedExp.achievements || exp.achievements,
      };
    }),
    education: (profileData.education || []).map(edu => {
      const cachedEdu = eduMap.get(edu.id || '');
      if (!cachedEdu) return edu;
      return {
        ...edu,
        degree: cachedEdu.degree || edu.degree,
        field_of_study: cachedEdu.field_of_study || edu.field_of_study,
        description: cachedEdu.description,
        grade: cachedEdu.grade,
      };
    }),
    portfolioItems: profileData.portfolioItems?.map(item => {
      const cachedItem = portfolioItemsMap.get(item.id || '');
      if (!cachedItem) return item;
      return {
        ...item,
        title: cachedItem.title || item.title,
        description: cachedItem.description,
      };
    }),
    portfolio: profileData.portfolio?.map(item => {
      const cachedItem = portfolioMap.get(item.id || '');
      if (!cachedItem) return item;
      return {
        ...item,
        title: cachedItem.title || item.title,
        description: cachedItem.description,
      };
    }),
    skills: (profileData.skills || []).map(skill => {
      const cachedSkill = skillsMap.get(skill.id || '');
      if (!cachedSkill) return skill;
      return {
        ...skill,
        name: cachedSkill.name,
      };
    }),
    certifications: (profileData.certifications || []).map(cert => {
      const certAny = cert as any;
      const certId = certAny.id || '';
      const cachedCert = (cached.certifications || []).find(c => c.id === certId);
      if (!cachedCert) return cert;
      return {
        ...cert,
        name: cachedCert.name || certAny.name,
        title: cachedCert.title || certAny.title,
        description: cachedCert.description,
      } as any;
    }),
    collaborations: profileData.collaborations,
    languages: profileData.languages,
    services: profileData.services,
    stats: profileData.stats,
    recommendations: profileData.recommendations,
    visas: profileData.visas,
    stamps: profileData.stamps,
  };
}

/**
 * Delete cached translation (useful when profile is updated)
 */
export async function deleteCachedTranslation(
  profileId: string,
  targetLanguage?: TranslationLanguage
): Promise<boolean> {
  try {
    let query = supabase
      .from('profile_translations')
      .delete()
      .eq('profile_id', profileId);

    if (targetLanguage) {
      query = query.eq('target_language', targetLanguage);
    }

    const { error } = await query;

    if (error) {
      console.error('[DatabaseCache] Error deleting cache:', error);
      return false;
    }

    console.log('[DatabaseCache] Cache deleted for profile:', profileId);
    return true;
  } catch (err) {
    console.error('[DatabaseCache] Error deleting:', err);
    return false;
  }
}
