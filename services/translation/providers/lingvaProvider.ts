import { TranslationProvider, TranslationLanguage } from './types';

// Lingva Translate - A free frontend for Google Translate
// Multiple public instances available (updated Jan 2025)
// Source: https://github.com/thedaviddelta/lingva-translate
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.lunar.icu',
  'https://lingva.garudalinux.org',
  'https://translate.projectsegfau.lt',
  'https://translate.dr460nf1r3.org',
  'https://translate.jae.fi',
];

let currentInstanceIndex = 0;
let lastWorkingInstance: string | null = null;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWorkingInstance(): Promise<string | null> {
  // If we have a recent working instance, try it first
  if (lastWorkingInstance) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${lastWorkingInstance}/api/v1/languages`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return lastWorkingInstance;
      }
    } catch {
      lastWorkingInstance = null;
    }
  }

  // Try all instances
  for (let i = 0; i < LINGVA_INSTANCES.length; i++) {
    const instance = LINGVA_INSTANCES[(currentInstanceIndex + i) % LINGVA_INSTANCES.length];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${instance}/api/v1/languages`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        currentInstanceIndex = (currentInstanceIndex + i) % LINGVA_INSTANCES.length;
        lastWorkingInstance = instance;
        console.log(`[Lingva] Using instance: ${instance}`);
        return instance;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function translateWithRetry(
  text: string,
  sourceLang: TranslationLanguage,
  targetLang: TranslationLanguage,
  retryCount = 0
): Promise<string> {
  const MAX_RETRIES = 2;

  const instance = await getWorkingInstance();
  if (!instance) {
    throw new Error('No Lingva instance available');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Lingva API uses GET with URL-encoded text
    const encodedText = encodeURIComponent(text);
    const url = `${instance}/api/v1/${sourceLang}/${targetLang}/${encodedText}`;

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if ((response.status === 429 || response.status >= 500) && retryCount < MAX_RETRIES) {
        const delay = 2000 * Math.pow(2, retryCount);
        console.log(`[Lingva] Error ${response.status}, retrying in ${delay}ms`);
        lastWorkingInstance = null; // Try another instance
        await sleep(delay);
        return translateWithRetry(text, sourceLang, targetLang, retryCount + 1);
      }
      throw new Error(`Lingva error: ${response.status}`);
    }

    const data = await response.json();
    return data.translation || text;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (retryCount < MAX_RETRIES) {
      const delay = 2000 * Math.pow(2, retryCount);
      lastWorkingInstance = null;
      await sleep(delay);
      return translateWithRetry(text, sourceLang, targetLang, retryCount + 1);
    }

    throw error;
  }
}

export const lingvaProvider: TranslationProvider = {
  name: 'lingva',

  async translate(text: string, sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<string> {
    if (!text || text.trim() === '') return text;
    if (sourceLang === targetLang) return text;

    return translateWithRetry(text, sourceLang, targetLang);
  },

  async translateBatch(texts: string[], sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const uniqueTexts = Array.from(new Set(texts.filter(t => t && t.trim() !== '')));

    if (uniqueTexts.length === 0) return results;
    if (sourceLang === targetLang) {
      uniqueTexts.forEach(t => results.set(t, t));
      return results;
    }

    // Translate ONE at a time with delays
    const DELAY_BETWEEN_CALLS = 500; // Lingva is generally more lenient
    const MAX_CONSECUTIVE_FAILURES = 3;
    let successCount = 0;
    let consecutiveFailures = 0;

    for (let i = 0; i < uniqueTexts.length; i++) {
      const text = uniqueTexts[i];

      // Stop if too many consecutive failures
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(`[Lingva] Stopping batch - ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
        break;
      }

      try {
        const translated = await this.translate(text, sourceLang, targetLang);

        if (translated && translated !== text) {
          results.set(text, translated);
          successCount++;
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
        }
      } catch (error) {
        console.error(`[Lingva] Failed: "${text.substring(0, 30)}..."`);
        consecutiveFailures++;
      }

      // Progress every 5 items
      if ((i + 1) % 5 === 0 || i === uniqueTexts.length - 1) {
        console.log(`[Lingva] Progress: ${i + 1}/${uniqueTexts.length} (success: ${successCount})`);
      }

      // Delay between calls
      if (i < uniqueTexts.length - 1) {
        await sleep(DELAY_BETWEEN_CALLS);
      }
    }

    return results;
  },

  async isAvailable(): Promise<boolean> {
    const instance = await getWorkingInstance();
    return instance !== null;
  },
};
