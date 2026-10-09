import { TranslationProvider, TranslationLanguage } from './types';
import { supabase } from '../../../supabase/client';

/**
 * Edge Function provider (`supabase/functions/translate-texts`)
 *
 * Vía segura y preferente: la función traduce en el servidor y es la ÚNICA que
 * escribe en la caché compartida `text_translations` (con service role). El
 * navegador ya no escribe en esa tabla (ver
 * supabase/migrations/20261005_cerrar_escritura_text_translations.sql).
 *
 * Si la función no está desplegada o falla, translationService pasa al
 * siguiente proveedor (las traducciones se siguen viendo, pero solo se cachean
 * en localStorage).
 */

const FUNCTION_NAME = 'translate-texts';
const TIMEOUT_MS = 12000;
// Límites de la función (ver MAX_TEXTS / MAX_TOTAL_CHARS en la Edge Function)
const MAX_TEXTS_PER_CALL = 40;
const MAX_CHARS_PER_CALL = 25000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('translate-texts timeout')), ms);
    promise.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

/** Parte la lista en llamadas que respeten los límites de la función. */
function splitIntoCalls(texts: string[]): string[][] {
  const calls: string[][] = [];
  let current: string[] = [];
  let chars = 0;
  for (const text of texts) {
    if (current.length > 0 && (current.length >= MAX_TEXTS_PER_CALL || chars + text.length > MAX_CHARS_PER_CALL)) {
      calls.push(current);
      current = [];
      chars = 0;
    }
    current.push(text);
    chars += text.length;
  }
  if (current.length > 0) calls.push(current);
  return calls;
}

async function invoke(texts: string[], sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<Record<string, string>> {
  const { data, error } = await withTimeout(
    supabase.functions.invoke(FUNCTION_NAME, { body: { texts, sourceLang, targetLang } }),
    TIMEOUT_MS
  );
  if (error) throw error;
  if (!data || typeof data !== 'object' || typeof (data as any).translations !== 'object') {
    throw new Error('translate-texts: respuesta inesperada');
  }
  return (data as { translations: Record<string, string> }).translations;
}

export const edgeFunctionProvider: TranslationProvider = {
  name: 'edge-function',

  async translate(text: string, sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<string> {
    if (!text || text.trim() === '') return text;
    if (sourceLang === targetLang) return text;
    const translations = await invoke([text], sourceLang, targetLang);
    const result = translations[text];
    if (!result) throw new Error('translate-texts: sin traducción');
    return result;
  },

  async translateBatch(texts: string[], sourceLang: TranslationLanguage, targetLang: TranslationLanguage): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    // Textos que la función no admitiría (demasiado largos) se dejan a otros proveedores
    const uniqueTexts = Array.from(new Set(texts.filter(t => t && t.trim() !== '' && t.length <= 5000)));
    if (uniqueTexts.length === 0) return results;
    if (sourceLang === targetLang) {
      uniqueTexts.forEach(t => results.set(t, t));
      return results;
    }

    for (const call of splitIntoCalls(uniqueTexts)) {
      const translations = await invoke(call, sourceLang, targetLang);
      Object.entries(translations).forEach(([original, translated]) => {
        if (typeof translated === 'string' && translated.trim() !== '') results.set(original, translated);
      });
    }

    // Si no ha traducido nada, que lo intente el siguiente proveedor
    if (results.size === 0) throw new Error('translate-texts: sin resultados');
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
