import { TranslationProvider, TranslationLanguage } from './providers/types';
import { serverProvider } from './providers/serverProvider';
import { googleTranslateProvider } from './providers/googleTranslateProvider';
import { myMemoryProvider } from './providers/myMemoryProvider';
import {
  getBatchFromCache,
  saveBatchToCache,
  saveToCache,
  getFromCache,
} from './cache/translationCache';
import {
  getBatchFromDbCache,
  saveBatchToDbCache,
} from './cache/dbTextCache';

// Providers in order of preference:
// 1. Server API (uses google-translate-api-x) - works in localhost with Express
// 2. Google Translate (unofficial gtx endpoint, CORS enabled) - works in production
// 3. MyMemory as fallback (has rate limits: 10000 words/day with email)
const providers: TranslationProvider[] = [
  serverProvider,
  googleTranslateProvider,
  myMemoryProvider,
];

/**
 * Detects the probable language of a text based on common patterns
 * Uses a scoring system to avoid false positives from ambiguous words
 */
export function detectSourceLanguage(text: string): TranslationLanguage {
  if (!text || text.trim() === '') return 'en';

  // Spanish indicators: accented vowels, ñ, inverted punctuation (STRONG indicator)
  const spanishIndicators = /[áéíóúüñ¿¡]/i;

  // If has Spanish accents/special chars, it's definitely Spanish
  if (spanishIndicators.test(text)) {
    return 'es';
  }

  // Common Spanish-ONLY words (articles, prepositions that DON'T exist in English)
  // Removed ambiguous words like: en, son, no, a, para (similar to English words)
  const spanishOnlyWords = /\b(el|la|los|las|del|que|una|uno|pero|este|esta|estos|estas|tiene|hace|muy|mucho|poco|mejor|peor|nuevo|viejo|bueno|malo|cada|otro|mismo|todo|nada|algo|alguien|nadie|cual|quien|donde|cuando|cuanto|porque|aunque|mientras|sino|tambien|ademas|incluso|aun|todavia|apenas|casi|bastante|demasiado|tanto|desde|hacia|hasta|mediante|dentro|fuera|cerca|lejos|antes|despues|siempre|nunca|bien|mal|mayor|menor)\b/i;

  // Spanish professional words that are UNIQUE to Spanish (removed ambiguous ones)
  // Removed: personal, director, civil, social, federal, local, regional, nacional, industrial, comercial, digital, general, natural, cultural, normal, legal, total, final, rural, vital, mental, dental, fatal, moral, oral, etc.
  const spanishUniqueWords = /\b(ingeniero|ingeniera|arquitecto|arquitecta|abogado|abogada|medico|medica|profesor|profesora|maestro|maestra|contador|contadora|gerente|jefe|jefa|supervisor|supervisora|coordinador|coordinadora|consultor|consultora|especialista|tecnico|tecnica|programador|programadora|desarrollador|desarrolladora|vendedor|vendedora|ejecutivo|ejecutiva|asistente|secretario|secretaria|administrador|administradora|financiero|financiera|recursos|humanos|informatica|comunicaciones|operaciones|produccion|calidad|logistica|compras|proyectos|mantenimiento|seguridad|ambiental|mecanico|mecanica|electrico|electrica|quimico|quimica|biologo|biologa|psicologo|psicologa|sociologo|sociologa|economista|auditor|auditora|investigador|investigadora|cientifico|cientifica|renovable|sostenible|residencial|fotovoltaica|termicas|climatizacion|refrigeracion|edificacion|construccion|obras|instalaciones|normativa|regulaciones|eficiencia|energetica|gestion|planificacion|supervision|inspeccion|certificacion|homologacion|diseno|dibujo|planos|presupuestos|licitaciones|contratacion|subcontratacion|proveedores|clientes|usuarios|pacientes|estudiantes|alumnos|empleados|trabajadores|equipo|departamento|seccion|unidad|sede|oficina|planta|fabrica|almacen|bodega|taller|laboratorio|clinica|escuela|colegio|instituto|facultad|agencia|corporacion|grupo|filial|sucursal|matriz|negocio|comercio|tienda|establecimiento|inmueble|propiedad|terreno|parcela|lote|vivienda|apartamento|piso|edificio|torre|complejo|urbanizacion|barrio|colonia|zona|provincia|pais|publico|privado|mixto|comunitario|cooperativo|asociativo|sindical|gremial|profesional|academico|educativo|deportivo|recreativo|turistico|hotelero|restaurante|gastronomico|culinario|alimenticio|agricola|ganadero|pesquero|minero|petrolero|energetico|hidraulico|eolico|geotermico|biomasa|biogas|biocombustible|reciclaje|residuos|desechos|contaminacion|emision|vertido|impacto|evaluacion|estudio|informe|reporte|diagnostico|analisis|sintesis|recomendacion|propuesta|solucion|alternativa|opcion|estrategia|tactica|metodologia|procedimiento|proceso|patron|estandar|norma|ley|decreto|resolucion|acuerdo|convenio|contrato|clausula|parrafo|inciso|anexo|apendice|trabajo|empresa|desarrollo|experiencia|habilidades|sobre|entre)\b/i;

  // Count Spanish word matches - require at least 2 matches for longer texts
  const words = text.toLowerCase().split(/\s+/);
  let spanishWordCount = 0;

  for (const word of words) {
    if (spanishOnlyWords.test(word) || spanishUniqueWords.test(word)) {
      spanishWordCount++;
    }
  }

  // For short texts (< 50 chars), 1 Spanish word is enough
  // For longer texts, require at least 2 Spanish words to avoid false positives
  const threshold = text.length < 50 ? 1 : 2;

  if (spanishWordCount >= threshold) {
    return 'es';
  }

  return 'en';
}

/**
 * Translates a single text with automatic fallback
 */
export async function translateText(
  text: string,
  targetLang: TranslationLanguage,
  sourceLang?: TranslationLanguage
): Promise<string> {
  if (!text || text.trim() === '') return text;

  // Detect source language if not specified
  const detectedSource = sourceLang || detectSourceLanguage(text);

  // Don't translate if already in target language
  if (detectedSource === targetLang) return text;

  // Check cache first
  const cached = getFromCache(text, detectedSource, targetLang);
  if (cached) return cached;

  // Try each provider
  for (const provider of providers) {
    try {
      const result = await provider.translate(text, detectedSource, targetLang);
      // Save to cache
      saveToCache(text, result, detectedSource, targetLang);
      return result;
    } catch (error) {
      console.warn(`[TranslationService] ${provider.name} failed:`, error);
      continue;
    }
  }

  // If all fail, return original text
  console.error('[TranslationService] All providers failed, returning original text');
  return text;
}

/**
 * Translates multiple texts in batch (optimized)
 * Uses 2-level cache: localStorage (fast) + Database (persistent/shared)
 */
export async function translateBatch(
  texts: string[],
  targetLang: TranslationLanguage,
  sourceLang?: TranslationLanguage
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Filter empty texts
  const validTexts = texts.filter(t => t && t.trim() !== '');
  if (validTexts.length === 0) return results;

  // Detect source language from first significant text
  const detectedSource = sourceLang || detectSourceLanguage(validTexts[0]);

  // If same language, don't translate
  if (detectedSource === targetLang) {
    validTexts.forEach(t => results.set(t, t));
    return results;
  }

  // Level 1: Check localStorage cache first (fastest)
  const { cached: localCached, uncached: afterLocalCache } = getBatchFromCache(validTexts, detectedSource, targetLang);
  localCached.forEach((value, key) => results.set(key, value));

  if (afterLocalCache.length === 0) {
    return results;
  }

  // Level 2: Check database cache (persistent/shared)
  let textsToTranslate = afterLocalCache;
  try {
    const { cached: dbCached, uncached: afterDbCache } = await getBatchFromDbCache(afterLocalCache, detectedSource, targetLang);
    dbCached.forEach((value, key) => {
      results.set(key, value);
      // Also save to localStorage for faster future access
      saveToCache(key, value, detectedSource, targetLang);
    });

    textsToTranslate = afterDbCache;
  } catch (error) {
    console.warn('[TranslationService] DB cache check failed, continuing with API:', error);
  }

  if (textsToTranslate.length === 0) {
    return results;
  }

  // Level 3: Call translation API for remaining texts
  for (const provider of providers) {
    try {
      const translations = await provider.translateBatch(textsToTranslate, detectedSource, targetLang);

      // Add to results
      translations.forEach((value, key) => results.set(key, value));

      // Save to both caches
      saveBatchToCache(translations, detectedSource, targetLang);
      saveBatchToDbCache(translations, detectedSource, targetLang).catch(err => {
        console.warn('[TranslationService] Failed to save to DB cache:', err);
      });

      return results;
    } catch (error) {
      console.warn(`[TranslationService] ${provider.name} batch failed:`, error);
      continue;
    }
  }

  // If all fail, return original texts
  textsToTranslate.forEach(t => results.set(t, t));
  return results;
}

/**
 * Progress callback type for translation with progress tracking
 */
export type TranslationProgressCallback = (progress: {
  current: number;
  total: number;
  percentage: number;
  currentText?: string;
  translatedText?: string;
}) => void;

/**
 * Translates multiple texts with progress tracking
 * Calls onProgress after each text is translated
 */
export async function translateBatchWithProgress(
  texts: string[],
  targetLang: TranslationLanguage,
  sourceLang: TranslationLanguage,
  onProgress?: TranslationProgressCallback
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const validTexts = texts.filter(t => t && t.trim() !== '');

  if (validTexts.length === 0) return results;
  if (sourceLang === targetLang) {
    validTexts.forEach(t => results.set(t, t));
    return results;
  }

  const total = validTexts.length;
  let current = 0;

  // Check localStorage cache first
  const { cached: localCached, uncached: afterLocalCache } = getBatchFromCache(validTexts, sourceLang, targetLang);
  localCached.forEach((value, key) => {
    results.set(key, value);
    current++;
  });

  // Report cached progress
  if (localCached.size > 0 && onProgress) {
    onProgress({
      current,
      total,
      percentage: Math.round((current / total) * 100),
    });
  }

  if (afterLocalCache.length === 0) {
    return results;
  }

  // Check DB cache
  let textsToTranslate = afterLocalCache;
  try {
    const { cached: dbCached, uncached: afterDbCache } = await getBatchFromDbCache(afterLocalCache, sourceLang, targetLang);
    dbCached.forEach((value, key) => {
      results.set(key, value);
      saveToCache(key, value, sourceLang, targetLang);
      current++;
    });

    if (dbCached.size > 0 && onProgress) {
      onProgress({
        current,
        total,
        percentage: Math.round((current / total) * 100),
      });
    }

    textsToTranslate = afterDbCache;
  } catch {
    // Continue with API
  }

  if (textsToTranslate.length === 0) {
    return results;
  }

  // Translate remaining texts one by one with progress
  for (const text of textsToTranslate) {
    try {
      const translated = await translateText(text, targetLang, sourceLang);
      results.set(text, translated);
      current++;

      if (onProgress) {
        onProgress({
          current,
          total,
          percentage: Math.round((current / total) * 100),
          currentText: text.substring(0, 50),
          translatedText: translated.substring(0, 50),
        });
      }
    } catch {
      results.set(text, text);
      current++;
    }
  }

  return results;
}

/**
 * Checks translation service availability
 */
export async function checkTranslationAvailability(): Promise<{
  available: boolean;
  provider: string | null;
}> {
  for (const provider of providers) {
    if (await provider.isAvailable()) {
      return { available: true, provider: provider.name };
    }
  }
  return { available: false, provider: null };
}
