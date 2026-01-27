import { useMemo } from 'react';
import { translateSkills } from '../utils/skillsTranslation';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Hook that automatically translates skills to the current language
 * @param skills - Array of skills with 'name' property
 * @returns Translated skills array
 */
export function useTranslatedSkills<T extends { name: string }>(skills: T[]): T[] {
  const { lang } = useLanguage();

  return useMemo(() => {
    if (!skills || skills.length === 0) return skills;
    return translateSkills(skills, lang);
  }, [skills, lang]);
}
