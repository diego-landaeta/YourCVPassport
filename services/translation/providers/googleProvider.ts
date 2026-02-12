import { TranslationProvider, TranslationLanguage } from './types';
import translate from 'google-translate-api-x';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const googleProvider: TranslationProvider = {
  name: 'google',

  async translate(text: string, sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<string> {
    if (!text || text.trim() === '') return text;
    if (sourceLang === targetLang) return text;

    try {
      const result = await translate(text, {
        from: sourceLang,
        to: targetLang,
      });
      return result.text;
    } catch (error: any) {
      console.error('[Google] Translation error:', error.message);
      throw error;
    }
  },

  async translateBatch(texts: string[], sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const uniqueTexts = Array.from(new Set(texts.filter(t => t && t.trim() !== '')));

    if (uniqueTexts.length === 0) return results;
    if (sourceLang === targetLang) {
      uniqueTexts.forEach(t => results.set(t, t));
      return results;
    }

    // Translate with small delay to avoid rate limiting
    const DELAY_BETWEEN_CALLS = 100; // 100ms
    let successCount = 0;

    for (let i = 0; i < uniqueTexts.length; i++) {
      const text = uniqueTexts[i];

      try {
        const translated = await this.translate(text, sourceLang, targetLang);

        if (translated && translated !== text) {
          results.set(text, translated);
          successCount++;
        }
      } catch (error) {
        console.error(`[Google] Failed: "${text.substring(0, 30)}..."`);
      }

      // Progress every 10 items
      if ((i + 1) % 10 === 0 || i === uniqueTexts.length - 1) {
        console.log(`[Google] Progress: ${i + 1}/${uniqueTexts.length} (success: ${successCount})`);
      }

      // Small delay
      if (i < uniqueTexts.length - 1) {
        await sleep(DELAY_BETWEEN_CALLS);
      }
    }

    return results;
  },

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.translate('hello', 'en', 'es');
      return result === 'hola' || result.toLowerCase().includes('hola');
    } catch {
      return false;
    }
  },
};
