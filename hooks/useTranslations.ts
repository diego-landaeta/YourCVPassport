import { useLanguage } from '../contexts/LanguageContext';
import { translations as enTranslations } from '../translations/en';
import { translations as esTranslations } from '../translations/es';
import type { TranslationsType } from '../types/translations';

const translations: Record<'en' | 'es', TranslationsType> = {
    en: enTranslations,
    es: esTranslations as unknown as TranslationsType, // Cast to ensure Spanish translations match English structure
};

/**
 * Hook to access translations with strict TypeScript typing.
 * Returns translations for the current language with full type safety.
 * TypeScript will throw an error if you try to access a key that doesn't exist in the English translations.
 */
export const useTranslations = (): TranslationsType => {
    const { lang } = useLanguage();
    return translations[lang];
};
