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
      .select('original_text, translated_text')
      .eq('text_hash', textHash)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .single();

    if (error || !data || data.original_text !== text) return null;

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
 *
 * YA NO ESCRIBE: el navegador no puede escribir en `text_translations`
 * (20261005_cerrar_escritura_text_translations.sql). La caché compartida la
 * mantiene la Edge Function `translate-texts`. Se conserva la firma por
 * compatibilidad con el código que la importa.
 */
export async function saveToDbCache(
  _originalText: string,
  _translatedText: string,
  _sourceLang: string,
  _targetLang: string
): Promise<void> {
  // Intencionadamente vacío (ver comentario).
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

    // Solo cuenta como acierto si coincide también el texto original
    // (el hash es de 32 bits: dos textos distintos pueden compartirlo)
    const requested = new Set(texts);
    data?.forEach(row => {
      if (requested.has(row.original_text)) {
        cached.set(row.original_text, row.translated_text);
      }
    });

    // Find uncached texts
    texts.forEach(text => {
      if (!cached.has(text)) {
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
 *
 * YA NO ESCRIBE (ver saveToDbCache). Firma conservada por compatibilidad.
 */
export async function saveBatchToDbCache(
  _translations: Map<string, string>,
  _sourceLang: string,
  _targetLang: string
): Promise<void> {
  // Intencionadamente vacío: solo la Edge Function translate-texts escribe en la caché compartida.
}
