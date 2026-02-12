import { TranslationProvider, TranslationLanguage } from './types';

// MyMemory API - Free tier: 1000 words/day without key, 10000 with email
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

// Email for higher limits (10000 words/day instead of 1000)
const USER_EMAIL = 'api@yourcvpassport.com';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_TEXT_LENGTH = 450; // MyMemory limit is 500, use 450 for safety

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

    // Find a good split point (sentence end, or at least a space)
    let splitAt = maxLength;
    const searchArea = remaining.substring(0, maxLength);

    // Try to find sentence boundary
    const sentenceEnd = Math.max(
      searchArea.lastIndexOf('. '),
      searchArea.lastIndexOf('! '),
      searchArea.lastIndexOf('? ')
    );

    if (sentenceEnd > maxLength * 0.5) {
      splitAt = sentenceEnd + 2; // Include the punctuation and space
    } else {
      // Fallback to last space
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

async function translateSingleChunk(
  text: string,
  sourceLang: TranslationLanguage,
  targetLang: TranslationLanguage,
  retryCount = 0
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    });

    if (USER_EMAIL) {
      params.append('de', USER_EMAIL);
    }

    const response = await fetch(`${MYMEMORY_API}?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[MyMemory] Rate limited (HTTP 429), retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return translateSingleChunk(text, sourceLang, targetLang, retryCount + 1);
      }
      throw new Error(`MyMemory error: ${response.status}`);
    }

    const data = await response.json();

    // Check for quota exceeded or rate limit in response body
    if (data.responseStatus === 429 || data.responseStatus === 403) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[MyMemory] Rate limited (body ${data.responseStatus}), retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return translateSingleChunk(text, sourceLang, targetLang, retryCount + 1);
      }
      throw new Error('MyMemory quota exceeded after retries');
    }

    if (data.responseStatus !== 200) {
      throw new Error(`MyMemory error: ${data.responseStatus}`);
    }

    return data.responseData.translatedText;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Retry on network errors
    if (retryCount < MAX_RETRIES && error.name === 'AbortError') {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`[MyMemory] Timeout, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return translateSingleChunk(text, sourceLang, targetLang, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Translates text with automatic chunking for long texts
 */
async function translateWithRetry(
  text: string,
  sourceLang: TranslationLanguage,
  targetLang: TranslationLanguage
): Promise<string> {
  // Split long texts into chunks
  const chunks = splitTextIntoChunks(text, MAX_TEXT_LENGTH);

  if (chunks.length === 1) {
    return translateSingleChunk(text, sourceLang, targetLang);
  }

  console.log(`[MyMemory] Splitting long text (${text.length} chars) into ${chunks.length} chunks`);

  // Translate each chunk with a small delay between them
  const translatedChunks: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const translated = await translateSingleChunk(chunks[i], sourceLang, targetLang);
    translatedChunks.push(translated);

    // Small delay between chunks to avoid rate limiting
    if (i < chunks.length - 1) {
      await sleep(200);
    }
  }

  return translatedChunks.join(' ');
}

export const myMemoryProvider: TranslationProvider = {
  name: 'mymemory',

  async translate(text: string, sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<string> {
    if (!text || text.trim() === '') return text;
    if (sourceLang === targetLang) return text;

    const result = await translateWithRetry(text, sourceLang, targetLang);
    return result;
  },

  async translateBatch(texts: string[], sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const uniqueTexts = Array.from(new Set(texts.filter(t => t && t.trim() !== '')));

    if (uniqueTexts.length === 0) return results;
    if (sourceLang === targetLang) {
      uniqueTexts.forEach(t => results.set(t, t));
      return results;
    }

    // Translate ONE at a time with small delay
    const DELAY_BETWEEN_CALLS = 300; // 300ms between each call
    const MAX_CONSECUTIVE_FAILURES = 5; // Stop if too many failures in a row
    let successCount = 0;
    let failCount = 0;
    let consecutiveFailures = 0;

    for (let i = 0; i < uniqueTexts.length; i++) {
      const text = uniqueTexts[i];

      // Stop if too many consecutive failures (likely rate limited)
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(`[MyMemory] Stopping batch - ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
        break;
      }

      try {
        const translated = await this.translate(text, sourceLang, targetLang);

        // Only add if translation actually changed
        if (translated && translated !== text) {
          results.set(text, translated);
          successCount++;
          consecutiveFailures = 0; // Reset on success
        } else {
          console.log(`[MyMemory] Translation unchanged for: "${text.substring(0, 30)}..."`);
          failCount++;
          consecutiveFailures++;
        }
      } catch (error) {
        console.error(`[MyMemory] Failed to translate: "${text.substring(0, 30)}..."`);
        failCount++;
        consecutiveFailures++;
      }

      // Progress log every 5 items
      if ((i + 1) % 5 === 0 || i === uniqueTexts.length - 1) {
        console.log(`[MyMemory] Batch progress: ${i + 1}/${uniqueTexts.length} (success: ${successCount}, failed: ${failCount})`);
      }

      // Delay between calls (except for last one)
      if (i < uniqueTexts.length - 1) {
        await sleep(DELAY_BETWEEN_CALLS);
      }
    }

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
