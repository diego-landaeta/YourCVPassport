import { useLanguage } from '../contexts/LanguageContext';
import type { TranslationsType } from '../types/translations';

/**
 * Hook to access translations with strict TypeScript typing.
 * Returns translations for the current language with full type safety.
 * TypeScript will throw an error if you try to access a key that doesn't exist in the English translations.
 *
 * Los diccionarios se cargan bajo demanda (un chunk por idioma) en LanguageProvider, que no
 * pinta a sus hijos hasta tener el del idioma activo: aqui la lectura sigue siendo sincrona.
 */
export const useTranslations = (): TranslationsType => {
    return useLanguage().translations;
};
