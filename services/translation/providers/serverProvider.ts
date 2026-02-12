import { TranslationProvider, TranslationLanguage } from './types';

/**
 * Server-side translation provider
 * Calls the Express API endpoint which uses google-translate-api-x
 * No rate limits, no CORS issues
 */

// API URL - works in both dev (Vite plugin) and production (Express)
const getApiUrl = () => '/api/translate';

export const serverProvider: TranslationProvider = {
  name: 'server',

  async translate(text: string, sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<string> {
    if (!text || text.trim() === '') return text;
    if (sourceLang === targetLang) return text;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: [text],
          sourceLang,
          targetLang,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server translation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.translations[text] || text;
    } catch (error) {
      clearTimeout(timeoutId);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      console.log(`[ServerProvider] Sending ${uniqueTexts.length} texts to server API...`);

      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: uniqueTexts,
          sourceLang,
          targetLang,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server translation failed: ${response.status}`);
      }

      const data = await response.json();

      console.log(`[ServerProvider] Server translated ${data.success}/${data.total} texts`);

      // Convert object to Map
      Object.entries(data.translations).forEach(([key, value]) => {
        results.set(key, value as string);
      });

      return results;

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('[ServerProvider] API call failed:', error.message);
      throw error;
    }
  },

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/translate/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch {
      return false;
    }
  },
};
