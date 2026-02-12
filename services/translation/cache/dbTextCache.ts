import { supabase } from '../../../supabase/client';

/**
 * Database cache for text translations
 * Shared across all users for efficiency
 */

/**
 * Generates a simple hash for the text (same as localStorage cache)
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
 * Get translation from database cache
 */
export async function getFromDbCache(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  try {
    const textHash = hashText(text);

    const { data, error } = await supabase
      .from('text_translations')
      .select('translated_text')
      .eq('text_hash', textHash)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .single();

    if (error || !data) return null;

    // Increment hit count in background (don't await)
    Promise.resolve(
      supabase.rpc('increment_translation_hit_count', {
        p_text_hash: textHash,
        p_source_lang: sourceLang,
        p_target_lang: targetLang,
      })
    ).catch(() => {});

    return data.translated_text;
  } catch {
    return null;
  }
}

/**
 * Save translation to database cache
 */
export async function saveToDbCache(
  originalText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  try {
    const textHash = hashText(originalText);

    await supabase
      .from('text_translations')
      .upsert({
        text_hash: textHash,
        source_lang: sourceLang,
        target_lang: targetLang,
        original_text: originalText,
        translated_text: translatedText,
      }, {
        onConflict: 'text_hash,source_lang,target_lang',
      });
  } catch (error) {
    console.warn('[DbTextCache] Error saving to cache:', error);
  }
}

/**
 * Get batch translations from database cache
 */
export async function getBatchFromDbCache(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<{ cached: Map<string, string>; uncached: string[] }> {
  const cached = new Map<string, string>();
  const uncached: string[] = [];

  if (texts.length === 0) return { cached, uncached };

  try {
    // Create hash to text mapping
    const hashToText = new Map<string, string>();
    texts.forEach(text => {
      hashToText.set(hashText(text), text);
    });

    const hashes = Array.from(hashToText.keys());

    const { data, error } = await supabase
      .from('text_translations')
      .select('text_hash, original_text, translated_text')
      .in('text_hash', hashes)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang);

    if (error) {
      console.warn('[DbTextCache] Error fetching batch:', error);
      return { cached, uncached: texts };
    }

    // Create map of found translations
    const foundHashes = new Set<string>();
    data?.forEach(row => {
      cached.set(row.original_text, row.translated_text);
      foundHashes.add(row.text_hash);
    });

    // Find uncached texts
    texts.forEach(text => {
      const hash = hashText(text);
      if (!foundHashes.has(hash)) {
        uncached.push(text);
      }
    });

    console.log(`[DbTextCache] Cache check: ${cached.size} hits, ${uncached.length} misses`);

    return { cached, uncached };
  } catch (error) {
    console.warn('[DbTextCache] Error in getBatchFromDbCache:', error);
    return { cached, uncached: texts };
  }
}

/**
 * Save batch translations to database cache
 */
export async function saveBatchToDbCache(
  translations: Map<string, string>,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  if (translations.size === 0) return;

  try {
    const records = Array.from(translations.entries()).map(([original, translated]) => ({
      text_hash: hashText(original),
      source_lang: sourceLang,
      target_lang: targetLang,
      original_text: original,
      translated_text: translated,
    }));

    // Upsert in batches of 50 to avoid payload limits
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await supabase
        .from('text_translations')
        .upsert(batch, {
          onConflict: 'text_hash,source_lang,target_lang',
        });
    }

    console.log(`[DbTextCache] Saved ${records.length} translations to DB cache`);
  } catch (error) {
    console.warn('[DbTextCache] Error saving batch to cache:', error);
  }
}
