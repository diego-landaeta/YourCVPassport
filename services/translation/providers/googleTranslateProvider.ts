import { TranslationProvider, TranslationLanguage } from './types';

/**
 * Google Translate Provider (unofficial gtx endpoint)
 * Works from browser without API key, CORS enabled
 * Fast, reliable, same quality as official Google Translate
 */

const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const MAX_TEXT_LENGTH = 1000; // Safe limit for URL encoding

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Split long text into chunks at sentence boundaries
 */
function splitTextIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitAt = maxLength;
    const searchArea = remaining.substring(0, maxLength);

    // Try to find sentence boundary
    const sentenceEnd = Math.max(
      searchArea.lastIndexOf('. '),
      searchArea.lastIndexOf('! '),
      searchArea.lastIndexOf('? ')
    );

    if (sentenceEnd > maxLength * 0.5) {
      splitAt = sentenceEnd + 2;
    } else {
      const lastSpace = searchArea.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.5) {
        splitAt = lastSpace + 1;
      }
    }

    chunks.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }

  return chunks;
}

/**
 * Translates a single chunk of text
 */
async function translateChunk(
  text: string,
  sourceLang: TranslationLanguage,
  targetLang: TranslationLanguage,
  retryCount = 0
): Promise<string> {
  const MAX_RETRIES = 4;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang,
      tl: targetLang,
      dt: 't',
      q: text,
    });

    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`[GoogleTranslate] Rate limited, retrying in ${delay}ms`);
        await sleep(delay);
        return translateChunk(text, sourceLang, targetLang, retryCount + 1);
      }
      throw new Error(`Google Translate error: ${response.status}`);
    }

    const data = await response.json();

    // Parse Google's nested array response format
    if (data && data[0] && Array.isArray(data[0])) {
      const translatedParts: string[] = [];
      for (const part of data[0]) {
        if (part && part[0]) {
          translatedParts.push(part[0]);
        }
      }
      const result = translatedParts.join('');
      if (result.length === 0) {
        console.warn(`[GoogleTranslate] Empty result from API for: "${text.substring(0, 50)}..."`);
        return text;
      }
      return result;
    }

    // Unexpected response format
    console.warn(`[GoogleTranslate] Unexpected response format:`, JSON.stringify(data).substring(0, 200));
    return text;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (retryCount < MAX_RETRIES && (error.name === 'AbortError' || error.message?.includes('fetch'))) {
      const delay = 1000 * Math.pow(2, retryCount);
      await sleep(delay);
      return translateChunk(text, sourceLang, targetLang, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Translates text, splitting into chunks if too long
 */
async function translateText(
  text: string,
  sourceLang: TranslationLanguage,
  targetLang: TranslationLanguage
): Promise<string> {
  const chunks = splitTextIntoChunks(text, MAX_TEXT_LENGTH);

  if (chunks.length === 1) {
    return translateChunk(text, sourceLang, targetLang);
  }

  console.log(`[GoogleTranslate] Splitting long text (${text.length} chars) into ${chunks.length} chunks`);

  const translatedChunks: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const translated = await translateChunk(chunks[i], sourceLang, targetLang);
    translatedChunks.push(translated);

    // Small delay between chunks
    if (i < chunks.length - 1) {
      await sleep(100);
    }
  }

  return translatedChunks.join(' ');
}

export const googleTranslateProvider: TranslationProvider = {
  name: 'google',

  async translate(
    text: string,
    sourceLang: TranslationLanguage,
    targetLang: TranslationLanguage
  ): Promise<string> {
    if (!text || text.trim() === '') return text;
    if (sourceLang === targetLang) return text;

    return translateText(text, sourceLang, targetLang);
  },

  async translateBatch(
    texts: string[],
    sourceLang: TranslationLanguage,
    targetLang: TranslationLanguage
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const uniqueTexts = Array.from(new Set(texts.filter(t => t && t.trim() !== '')));

    if (uniqueTexts.length === 0) return results;
    if (sourceLang === targetLang) {
      uniqueTexts.forEach(t => results.set(t, t));
      return results;
    }

    console.log(`[GoogleTranslate] Translating ${uniqueTexts.length} texts: ${sourceLang} -> ${targetLang}`);

    // Translate sequentially for reliability (avoid rate limits)
    let successCount = 0;
    let failCount = 0;
    const failedTexts: string[] = [];

    for (let i = 0; i < uniqueTexts.length; i++) {
      const text = uniqueTexts[i];
      const isLongText = text.length > 200;

      if (isLongText) {
        console.log(`[GoogleTranslate] Processing long text #${i}: "${text.substring(0, 80)}..." (${text.length} chars)`);
      }

      try {
        const translated = await this.translate(text, sourceLang, targetLang);

        if (translated && translated.length > 0) {
          results.set(text, translated);
          if (translated !== text) {
            successCount++;
            if (isLongText) {
              console.log(`[GoogleTranslate] Long text translated: "${translated.substring(0, 80)}..."`);
            }
          } else {
            // Same text returned - might already be in target language
            console.warn(`[GoogleTranslate] Same text returned for: "${text.substring(0, 50)}..."`);
            failedTexts.push(text);
            failCount++;
          }
        } else {
          // Empty translation
          console.warn(`[GoogleTranslate] Empty translation for: "${text.substring(0, 50)}..."`);
          failedTexts.push(text);
          failCount++;
        }
      } catch (error: any) {
        console.error(`[GoogleTranslate] Failed: "${text.substring(0, 50)}..." - ${error.message}`);
        failedTexts.push(text);
        failCount++;
      }

      // Progress logging every 5 items
      if ((i + 1) % 5 === 0 || i === uniqueTexts.length - 1) {
        console.log(`[GoogleTranslate] Progress: ${i + 1}/${uniqueTexts.length} (success: ${successCount})`);
      }

      // Small delay between requests to avoid rate limiting
      if (i < uniqueTexts.length - 1) {
        await sleep(150);
      }
    }

    // Retry failed texts once
    if (failedTexts.length > 0 && failedTexts.length <= 10) {
      console.log(`[GoogleTranslate] Retrying ${failedTexts.length} failed texts...`);
      await sleep(1000); // Wait before retry

      for (const text of failedTexts) {
        try {
          const translated = await this.translate(text, sourceLang, targetLang);
          if (translated && translated !== text) {
            results.set(text, translated);
            successCount++;
            failCount--;
            console.log(`[GoogleTranslate] Retry success: "${text.substring(0, 30)}..."`);
          }
        } catch {
          // Still failed, keep original
        }
        await sleep(200);
      }
    }

    console.log(`[GoogleTranslate] Completed: ${successCount} success, ${failCount} failed`);
    return results;
  },

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.translate('hello', 'en', 'es');
      return result !== 'hello' && result.length > 0;
    } catch {
      return false;
    }
  },
};
