export {
  translateText,
  translateBatch,
  translateBatchWithProgress,
  detectSourceLanguage,
  checkTranslationAvailability,
} from './translationService';

export type { TranslationProgressCallback } from './translationService';

export {
  getFromCache,
  saveToCache,
  getBatchFromCache,
  saveBatchToCache,
  clearCache,
  pruneCache,
} from './cache/translationCache';

export {
  getCachedTranslation,
  saveCachedTranslation,
  deleteCachedTranslation,
  generateContentHash,
  applyCachedTranslations,
  extractTranslatedContent,
} from './cache/databaseCache';

export {
  getFromDbCache,
  saveToDbCache,
  getBatchFromDbCache,
  saveBatchToDbCache,
} from './cache/dbTextCache';

export type { TranslationLanguage, TranslationProvider } from './providers/types';
