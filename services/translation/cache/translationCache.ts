interface CacheEntry {
  text: string;
  timestamp: number;
}

interface TranslationCacheStore {
  [key: string]: CacheEntry;
}

const CACHE_KEY = 'yourcvpassport_translation_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;

/**
 * Generates a simple hash for the text to use as cache key
 */
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generates cache key
 */
export function getCacheKey(text: string, sourceLang: string, targetLang: string): string {
  return `${hashText(text)}:${sourceLang}:${targetLang}`;
}

/**
 * Reads entire cache from localStorage
 */
function readCache(): TranslationCacheStore {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

/**
 * Writes cache to localStorage
 */
function writeCache(cache: TranslationCacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // If localStorage is full, prune old entries
    pruneCache();
  }
}

/**
 * Gets a translation from cache
 */
export function getFromCache(text: string, sourceLang: string, targetLang: string): string | null {
  const cache = readCache();
  const key = getCacheKey(text, sourceLang, targetLang);
  const entry = cache[key];

  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete cache[key];
    writeCache(cache);
    return null;
  }

  return entry.text;
}

/**
 * Saves a translation to cache
 * Now caches ALL translations, including when translation equals original
 * (some terms like "JavaScript" are the same in both languages)
 */
export function saveToCache(
  originalText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string
): void {
  const cache = readCache();
  const key = getCacheKey(originalText, sourceLang, targetLang);

  cache[key] = {
    text: translatedText,
    timestamp: Date.now(),
  };

  // Limit cache size
  const keys = Object.keys(cache);
  if (keys.length > MAX_CACHE_SIZE) {
    const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
    const toRemove = sorted.slice(0, keys.length - MAX_CACHE_SIZE);
    toRemove.forEach(k => delete cache[k]);
  }

  writeCache(cache);
}

/**
 * Gets multiple translations from cache
 */
export function getBatchFromCache(
  texts: string[],
  sourceLang: string,
  targetLang: string
): { cached: Map<string, string>; uncached: string[] } {
  const cached = new Map<string, string>();
  const uncached: string[] = [];

  texts.forEach(text => {
    const translation = getFromCache(text, sourceLang, targetLang);
    if (translation) {
      cached.set(text, translation);
    } else {
      uncached.push(text);
    }
  });

  return { cached, uncached };
}

/**
 * Saves multiple translations to cache
 */
export function saveBatchToCache(
  translations: Map<string, string>,
  sourceLang: string,
  targetLang: string
): void {
  translations.forEach((translatedText, originalText) => {
    saveToCache(originalText, translatedText, sourceLang, targetLang);
  });
}

/**
 * Cleans expired cache entries
 */
export function pruneCache(): void {
  const cache = readCache();
  const now = Date.now();

  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > CACHE_TTL) {
      delete cache[key];
    }
  });

  writeCache(cache);
}

/**
 * Clears entire translation cache
 */
export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
