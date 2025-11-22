import { translations as enTranslations } from '../translations/en';

// Extract the type from the actual en.ts translations
export type TranslationsType = typeof enTranslations;

// Helper type to ensure nested keys are correctly typed
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
