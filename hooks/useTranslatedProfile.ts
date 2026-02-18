import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FullProfileData } from '../types';
import {
  translateBatch,
  translateBatchWithProgress,
  detectSourceLanguage,
  TranslationLanguage,
  getCachedTranslation,
  saveCachedTranslation,
  generateContentHash,
  applyCachedTranslations,
  extractTranslatedContent,
} from '../services/translation';
import { correctGender, correctGenderBatch, inferGenderFromName } from '../utils/genderCorrection';

interface TranslationProgress {
  current: number;
  total: number;
  percentage: number;
  currentText?: string;
}

interface TranslatedProfileResult {
  translatedProfile: FullProfileData | null;
  isTranslating: boolean;
  error: string | null;
  refreshTranslation: () => void;
  progress: TranslationProgress | null;
  pendingTexts: Set<string>;
}

/**
 * Hook to automatically translate profile data when user changes app language
 * All content (including skills) is translated via API for consistency
 */
export function useTranslatedProfile(
  profileData: FullProfileData | null
): TranslatedProfileResult {
  const { lang } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiTranslations, setApiTranslations] = useState<Map<string, string>>(new Map());
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [pendingTexts, setPendingTexts] = useState<Set<string>>(new Set());
  const [cachedFullProfile, setCachedFullProfile] = useState<FullProfileData | null>(null);
  const lastTranslationKey = useRef<string>('');

  /**
   * Extracts all translatable texts from profile (including skills and certifications)
   */
  const extractTranslatableTexts = useCallback((data: FullProfileData): string[] => {
    const texts: string[] = [];

    if (data.profile.headline) texts.push(data.profile.headline);
    if (data.profile.summary) texts.push(data.profile.summary);

    data.experiences?.forEach(exp => {
      if (exp.position) texts.push(exp.position);
      // company_name excluded: proper nouns should not go to translation API
      // Only known overrides (e.g. "Self-Employed") are handled via getCompanyTranslation
      if (exp.description) texts.push(exp.description);
      exp.achievements?.forEach(a => a && texts.push(a));
    });

    data.education?.forEach(edu => {
      if (edu.degree) texts.push(edu.degree);
      if (edu.field_of_study) texts.push(edu.field_of_study);
      if (edu.description) texts.push(edu.description);
      if (edu.grade) texts.push(edu.grade);
    });

    data.portfolioItems?.forEach(item => {
      if (item.title) texts.push(item.title);
      if (item.description) texts.push(item.description);
    });

    data.portfolio?.forEach(item => {
      if (item.title) texts.push(item.title);
      if (item.description) texts.push(item.description);
    });

    // Skills - translated via API for consistency
    data.skills?.forEach(skill => {
      if (skill.name) texts.push(skill.name);
    });

    // Certifications - translate name/title and description
    // Note: Certification type uses 'name', PortfolioItem uses 'title'
    data.certifications?.forEach(cert => {
      const certAny = cert as any;
      if (certAny.name) texts.push(certAny.name);
      if (certAny.title) texts.push(certAny.title);
      if (certAny.description) texts.push(certAny.description);
    });

    return texts.filter(t => t && t.trim() !== '');
  }, []);

  // Known company name translations that the API gets wrong
  const companyNameOverrides: Record<string, Record<string, string>> = {
    es: {
      'Self-Employed': 'Trabajo por cuenta propia',
      'self-employed': 'Trabajo por cuenta propia',
      'Self Employed': 'Trabajo por cuenta propia',
      'Freelance': 'Trabajo independiente',
      'Independent': 'Independiente',
      'Independent Consultant': 'Consultor independiente',
      'Independent Consulting': 'Consultoría independiente',
    },
    en: {
      'Trabajo por cuenta propia': 'Self-Employed',
      'Trabajo independiente': 'Freelance',
      'Independiente': 'Independent',
      'Consultor independiente': 'Independent Consultant',
      'Consultoría independiente': 'Independent Consulting',
      'Autónomo': 'Self-Employed',
    },
  };

  // Build the translated profile
  const translatedProfile = useMemo(() => {
    if (!profileData) return null;

    // Helper: apply known company name overrides (Self-Employed, Freelance, etc.)
    // For all other company names, preserve the ORIGINAL from DB (never the cached/translated version)
    // This prevents the API from mistranslating proper nouns (e.g. "Solvenic" → "Solvenico")
    const getCompanyName = (originalName: string | undefined, _cachedName?: string): string | undefined => {
      if (!originalName) return originalName;
      const override = companyNameOverrides[lang]?.[originalName.trim()];
      return override || originalName;
    };

    // If we have a cached full profile translation from Supabase, use it
    // but fix company names + apply gender correction (cache may have wrong gender)
    if (cachedFullProfile) {
      const gender = profileData.profile.gender || inferGenderFromName(profileData.profile.full_name);
      const genderFix = (text: string | null | undefined): string | null | undefined => {
        if (!text || lang !== 'es' || !gender) return text;
        return correctGender(text, gender);
      };

      return {
        ...cachedFullProfile,
        profile: {
          ...cachedFullProfile.profile,
          headline: genderFix(cachedFullProfile.profile.headline) || cachedFullProfile.profile.headline,
          summary: genderFix(cachedFullProfile.profile.summary) || cachedFullProfile.profile.summary,
        },
        experiences: cachedFullProfile.experiences?.map((exp, i) => ({
          ...exp,
          company_name: getCompanyName(
            profileData.experiences?.[i]?.company_name,
            exp.company_name
          ) || exp.company_name,
          position: genderFix(exp.position) || exp.position,
          description: genderFix(exp.description),
        })) || [],
      };
    }

    // Normalize text for consistent Map lookups (trim whitespace)
    const normalizeKey = (text: string): string => text.trim();

    const getTranslation = (text: string | null | undefined): string | null | undefined => {
      if (!text) return text;
      const normalized = normalizeKey(text);
      // Try both normalized and original key
      return apiTranslations.get(normalized) || apiTranslations.get(text) || text;
    };

    const getCompanyTranslation = (text: string | null | undefined): string | null | undefined => {
      if (!text) return text;
      // Only apply known overrides, never send to API (company names are proper nouns)
      return companyNameOverrides[lang]?.[text.trim()] || text;
    };

    return {
      ...profileData,
      profile: {
        ...profileData.profile,
        headline: getTranslation(profileData.profile.headline) || profileData.profile.headline,
        summary: getTranslation(profileData.profile.summary) || profileData.profile.summary,
      },
      experiences: profileData.experiences?.map(exp => ({
        ...exp,
        position: getTranslation(exp.position) || exp.position,
        company_name: getCompanyTranslation(exp.company_name) || exp.company_name,
        description: getTranslation(exp.description),
        achievements: exp.achievements?.map(a => getTranslation(a) || a),
      })) || [],
      education: profileData.education?.map(edu => ({
        ...edu,
        degree: getTranslation(edu.degree) || edu.degree,
        field_of_study: getTranslation(edu.field_of_study) || edu.field_of_study,
        description: getTranslation(edu.description),
        grade: getTranslation(edu.grade),
      })) || [],
      portfolioItems: profileData.portfolioItems?.map(item => ({
        ...item,
        title: getTranslation(item.title) || item.title,
        description: getTranslation(item.description),
      })),
      portfolio: profileData.portfolio?.map(item => ({
        ...item,
        title: getTranslation(item.title) || item.title,
        description: getTranslation(item.description),
      })),
      // Skills translated via API
      skills: profileData.skills?.map(skill => ({
        ...skill,
        name: getTranslation(skill.name) || skill.name,
      })) || [],
      // Certifications translated via API
      // Note: Certification type uses 'name', PortfolioItem uses 'title'
      certifications: profileData.certifications?.map(cert => {
        const certAny = cert as any;
        return {
          ...cert,
          name: certAny.name ? (getTranslation(certAny.name) || certAny.name) : certAny.name,
          title: certAny.title ? (getTranslation(certAny.title) || certAny.title) : certAny.title,
          description: getTranslation(certAny.description),
        };
      }),
      collaborations: profileData.collaborations,
      languages: profileData.languages,
      services: profileData.services,
      stats: profileData.stats,
      recommendations: profileData.recommendations,
      visas: profileData.visas,
      stamps: profileData.stamps,
    };
  }, [profileData, apiTranslations, cachedFullProfile]);

  // Effect to fetch API translations for all content
  useEffect(() => {
    if (!profileData) {
      setApiTranslations(new Map());
      setCachedFullProfile(null);
      return;
    }

    const translationKey = `${profileData.profile.id}-${lang}`;

    // Skip if already translated this combination
    if (lastTranslationKey.current === translationKey) {
      return;
    }

    const doTranslate = async () => {
      setError(null);
      setCachedFullProfile(null);

      const profileId = profileData.profile.id;
      const contentHash = generateContentHash(profileData);

      try {
        // === STEP 1: Check profile-level cache in Supabase ===
        console.log(`[useTranslatedProfile] Checking profile cache: ${profileId}, lang: ${lang}`);

        const cachedContent = await getCachedTranslation(
          profileId,
          lang as TranslationLanguage,
          contentHash
        );

        if (cachedContent) {
          console.log(`[useTranslatedProfile] CACHE HIT! Applying cached translation for ${profileId}`);
          const applied = applyCachedTranslations(profileData, cachedContent);
          setCachedFullProfile(applied);
          lastTranslationKey.current = translationKey;
          return; // Skip API translation entirely
        }

        console.log(`[useTranslatedProfile] Cache miss, proceeding with API translation`);

        // === STEP 2: Normal translation flow (cache miss) ===
        setIsTranslating(true);

        const allTexts = extractTranslatableTexts(profileData);

        if (allTexts.length === 0) {
          lastTranslationKey.current = translationKey;
          setIsTranslating(false);
          return;
        }

        // Detect language of each text and group them
        const textsInSpanish: string[] = [];
        const textsInEnglish: string[] = [];

        allTexts.forEach(text => {
          const textLang = detectSourceLanguage(text);
          if (textLang === 'es') {
            textsInSpanish.push(text);
          } else {
            textsInEnglish.push(text);
          }
        });

        // Determine what needs translation based on current UI language
        const textsToTranslate = lang === 'en' ? textsInSpanish : textsInEnglish;
        const sourceLang: TranslationLanguage = lang === 'en' ? 'es' : 'en';

        const uniqueTexts = [...new Set(textsToTranslate)];

        console.log(`[useTranslatedProfile] Language: ${lang}, Spanish: ${textsInSpanish.length}, English: ${textsInEnglish.length}, To translate: ${uniqueTexts.length}`);

        if (uniqueTexts.length === 0) {
          // Clear previous translations to show original texts when returning to original language
          setApiTranslations(new Map());
          lastTranslationKey.current = translationKey;
          setIsTranslating(false);
          return;
        }

        // Trim all texts to ensure consistent keys
        const trimmedTexts = uniqueTexts.map(t => t.trim());

        // PRIORITY: Translate summary first (if present) to ensure it gets translated
        const summaryText = profileData.profile.summary?.trim();
        const summaryInBatch = summaryText && trimmedTexts.includes(summaryText);

        if (summaryInBatch) {
          console.log(`[useTranslatedProfile] PRIORITY: Summary found in batch (${summaryText.length} chars)`);
          // Move summary to front of the array
          const summaryIndex = trimmedTexts.indexOf(summaryText);
          if (summaryIndex > 0) {
            trimmedTexts.splice(summaryIndex, 1);
            trimmedTexts.unshift(summaryText);
          }
        }

        console.log(`[useTranslatedProfile] Translating ${trimmedTexts.length} texts, summary included: ${summaryInBatch}`);

        // Set pending texts for skeleton display
        setPendingTexts(new Set(trimmedTexts));

        // Initialize progress
        setProgress({ current: 0, total: trimmedTexts.length, percentage: 0 });

        let translations = await translateBatchWithProgress(
          trimmedTexts,
          lang as TranslationLanguage,
          sourceLang,
          (progressUpdate) => {
            setProgress(progressUpdate);
            // Remove translated text from pending set
            if (progressUpdate.currentText) {
              setPendingTexts(prev => {
                const next = new Set(prev);
                // Find and remove the full text that starts with currentText
                for (const text of next) {
                  if (text.startsWith(progressUpdate.currentText!)) {
                    next.delete(text);
                    break;
                  }
                }
                return next;
              });
            }
          }
        );

        // Clear pending texts when done
        setPendingTexts(new Set());

        // Verify summary was translated
        if (summaryText && summaryInBatch) {
          const summaryTranslation = translations.get(summaryText);
          if (summaryTranslation && summaryTranslation !== summaryText) {
            console.log(`[useTranslatedProfile] SUCCESS: Summary translated to: "${summaryTranslation.substring(0, 80)}..."`);
          } else {
            console.error(`[useTranslatedProfile] FAILED: Summary NOT translated! Original: "${summaryText.substring(0, 50)}..."`);
          }
        }

        // Apply gender correction if translating to Spanish
        if (lang === 'es') {
          const gender = profileData.profile.gender || inferGenderFromName(profileData.profile.full_name);
          if (gender) {
            console.log(`[useTranslatedProfile] Applying gender correction: ${gender}`);
            translations = correctGenderBatch(translations, gender);
          }
        }

        let translatedCount = 0;
        translations.forEach((trans, orig) => {
          if (trans !== orig) translatedCount++;
        });

        console.log(`[useTranslatedProfile] Translated ${translatedCount}/${uniqueTexts.length} texts`);

        // === STEP 3: Save to profile-level cache for future users ===
        try {
          const translatedSkills = (profileData.skills || []).map(skill => ({
            id: skill.id || '',
            name: translations.get(skill.name?.trim()) || skill.name,
          }));
          const contentToCache = extractTranslatedContent(profileData, translations, translatedSkills);
          saveCachedTranslation(
            profileId,
            lang as TranslationLanguage,
            contentToCache,
            contentHash
          ).catch(err => {
            console.warn('[useTranslatedProfile] Failed to save profile cache:', err);
          });
          console.log(`[useTranslatedProfile] Profile cache saved for ${profileId} (${lang})`);
        } catch (cacheErr) {
          console.warn('[useTranslatedProfile] Error preparing cache save:', cacheErr);
        }

        setApiTranslations(translations);
        lastTranslationKey.current = translationKey;

      } catch (err) {
        console.error('[useTranslatedProfile] Translation error:', err);
        setError('Error al traducir contenido del perfil');
      } finally {
        setIsTranslating(false);
      }
    };

    const timeoutId = setTimeout(doTranslate, 200);
    return () => clearTimeout(timeoutId);
  }, [profileData, lang, extractTranslatableTexts]);

  const refreshTranslation = useCallback(() => {
    lastTranslationKey.current = '';
    setApiTranslations(new Map());
    setCachedFullProfile(null);
  }, []);

  return {
    translatedProfile,
    isTranslating,
    error,
    refreshTranslation,
    progress,
    pendingTexts,
  };
}

/**
 * Simplified hook for translating a single text
 */
export function useTranslatedText(text: string | null | undefined): {
  translatedText: string | null | undefined;
  isTranslating: boolean;
} {
  const { lang } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string | null | undefined>(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslatedText(text);
      return;
    }

    const sourceLanguage = detectSourceLanguage(text);
    if (lang === sourceLanguage) {
      setTranslatedText(text);
      return;
    }

    setIsTranslating(true);
    translateBatch([text], lang as TranslationLanguage, sourceLanguage)
      .then(translations => {
        setTranslatedText(translations.get(text) || text);
      })
      .catch(() => {
        setTranslatedText(text);
      })
      .finally(() => {
        setIsTranslating(false);
      });
  }, [text, lang]);

  return { translatedText, isTranslating };
}
