import { translateBatch, detectSourceLanguage } from './translationService';
import type { TranslationLanguage } from './providers/types';

/**
 * Traducción automática de contenido de usuarios (posts, encuestas, comentarios,
 * nombre/descripción de grupos).
 *
 * - Detecta el idioma de cada "unidad" de contenido (p. ej. post + encuesta)
 *   con detectSourceLanguage sobre el texto conjunto, así una opción corta como
 *   "Remote" hereda el idioma de su pregunta.
 * - Agrupa en LOTES las peticiones que llegan casi a la vez (todos los posts
 *   visibles de una página) y llama una sola vez a translateBatch por par de
 *   idiomas. translateBatch ya usa localStorage → caché compartida
 *   `text_translations` (solo lectura) → Edge Function `translate-texts`.
 * - Memoria en proceso para no repetir peticiones al re-renderizar.
 */

const BATCH_DELAY_MS = 40;
const MAX_TEXTS_PER_BATCH = 40;

type PairKey = `${TranslationLanguage}>${TranslationLanguage}`;

interface PendingBatch {
  resolvers: Map<string, Array<(value: string) => void>>;
}

const memory = new Map<string, string>();
const pending = new Map<PairKey, PendingBatch>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const memoryKey = (text: string, source: TranslationLanguage, target: TranslationLanguage) =>
  `${source}>${target}\u0000${text}`;

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** true si `translated` aporta algo respecto al original (no vacío ni idéntico). */
export function isMeaningfulTranslation(original: string, translated: string | null | undefined): boolean {
  if (!translated || !translated.trim()) return false;
  return normalize(original) !== normalize(translated);
}

/** Idioma (es/en) de un conjunto de textos que pertenecen a la misma unidad. */
export function detectContentLanguage(texts: Array<string | null | undefined>): TranslationLanguage {
  const joined = texts.filter((t): t is string => !!t && t.trim() !== '').join('\n').slice(0, 4000);
  return detectSourceLanguage(joined);
}

/** Traducción ya resuelta en esta sesión (síncrono, para el primer render). */
export function peekAutoTranslation(
  text: string,
  source: TranslationLanguage,
  target: TranslationLanguage
): string | undefined {
  return memory.get(memoryKey(text, source, target));
}

async function flush() {
  flushTimer = null;
  const batches = Array.from(pending.entries());
  pending.clear();

  await Promise.all(batches.map(async ([pair, batch]) => {
    const [source, target] = pair.split('>') as [TranslationLanguage, TranslationLanguage];
    const texts = Array.from(batch.resolvers.keys());

    for (let i = 0; i < texts.length; i += MAX_TEXTS_PER_BATCH) {
      const chunk = texts.slice(i, i + MAX_TEXTS_PER_BATCH);
      let results = new Map<string, string>();
      try {
        // sourceLang explícito: translateBatch no re-detecta con el primer texto del lote
        results = await translateBatch(chunk, target, source);
      } catch (error) {
        console.warn('[autoTranslate] Error traduciendo lote:', error);
      }
      chunk.forEach((text) => {
        const translated = results.get(text);
        const value = isMeaningfulTranslation(text, translated) ? (translated as string) : text;
        // Solo se memoriza si hubo traducción real (si falló, se reintentará en otra vista)
        if (value !== text) memory.set(memoryKey(text, source, target), value);
        batch.resolvers.get(text)?.forEach((resolve) => resolve(value));
      });
    }
  }));
}

/**
 * Pide la traducción de `text`. Devuelve el texto traducido, o el original si
 * no hay traducción posible. Nunca rechaza.
 */
export function requestAutoTranslation(
  text: string,
  source: TranslationLanguage,
  target: TranslationLanguage
): Promise<string> {
  if (!text || !text.trim() || source === target) return Promise.resolve(text);
  const cached = memory.get(memoryKey(text, source, target));
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const pair = `${source}>${target}` as PairKey;
    let batch = pending.get(pair);
    if (!batch) {
      batch = { resolvers: new Map() };
      pending.set(pair, batch);
    }
    const list = batch.resolvers.get(text) || [];
    list.push(resolve);
    batch.resolvers.set(text, list);

    if (!flushTimer) flushTimer = setTimeout(() => { void flush(); }, BATCH_DELAY_MS);
  });
}
