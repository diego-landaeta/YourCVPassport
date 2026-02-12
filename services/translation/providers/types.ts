export type TranslationLanguage = 'en' | 'es';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: TranslationLanguage;
  targetLang: TranslationLanguage;
}

export interface TranslationProvider {
  name: string;
  translate(text: string, sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<string>;
  translateBatch(texts: string[], sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<Map<string, string>>;
  isAvailable(): Promise<boolean>;
}

export interface TranslationError {
  provider: string;
  error: Error;
  text?: string;
}
