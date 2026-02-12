/**
 * Vite plugin to handle translation API during development
 * Uses google-translate-api-x server-side (no CORS issues)
 */
import type { Plugin, ViteDevServer } from 'vite';

export function translationPlugin(): Plugin {
  return {
    name: 'translation-api',
    configureServer(server: ViteDevServer) {
      // Add middleware for translation API
      server.middlewares.use('/api/translate', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';

          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const { texts, sourceLang, targetLang } = JSON.parse(body);

              if (!texts || !Array.isArray(texts) || texts.length === 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'texts array is required' }));
                return;
              }

              if (!sourceLang || !targetLang) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'sourceLang and targetLang are required' }));
                return;
              }

              // Dynamic import of google-translate-api-x
              const { default: translate } = await import('google-translate-api-x');

              const uniqueTexts = [...new Set(texts.filter((t: string) => t && t.trim() !== ''))];

              if (uniqueTexts.length === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ translations: {} }));
                return;
              }

              if (sourceLang === targetLang) {
                const translations: Record<string, string> = {};
                uniqueTexts.forEach((t: string) => translations[t] = t);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ translations }));
                return;
              }

              console.log(`[Vite Translate] Translating ${uniqueTexts.length} texts: ${sourceLang} -> ${targetLang}`);

              const translations: Record<string, string> = {};
              let successCount = 0;
              const BATCH_SIZE = 10;

              for (let i = 0; i < uniqueTexts.length; i += BATCH_SIZE) {
                const batch = uniqueTexts.slice(i, i + BATCH_SIZE);

                try {
                  const results = await translate(batch, {
                    from: sourceLang,
                    to: targetLang,
                  });

                  const resultsArray = Array.isArray(results) ? results : [results];

                  batch.forEach((text: string, idx: number) => {
                    if (resultsArray[idx] && resultsArray[idx].text) {
                      translations[text] = resultsArray[idx].text;
                      successCount++;
                    }
                  });

                  console.log(`[Vite Translate] Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} texts`);

                } catch (batchError: any) {
                  console.error(`[Vite Translate] Batch error:`, batchError.message);
                  // Try one by one
                  for (const text of batch) {
                    try {
                      const result = await translate(text, { from: sourceLang, to: targetLang });
                      translations[text] = result.text;
                      successCount++;
                    } catch (e: any) {
                      console.error(`[Vite Translate] Single error:`, e.message);
                    }
                  }
                }
              }

              console.log(`[Vite Translate] Done: ${successCount}/${uniqueTexts.length}`);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ translations, success: successCount, total: uniqueTexts.length }));

            } catch (error: any) {
              console.error('[Vite Translate] Error:', error.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Translation failed', message: error.message }));
            }
          });
        } else if (req.method === 'GET' && (req.url === '/health' || req.url?.startsWith('/health'))) {
          try {
            const { default: translate } = await import('google-translate-api-x');
            const result = await translate('hello', { from: 'en', to: 'es' });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              provider: 'google-translate-api-x (vite)',
              test: { input: 'hello', output: result.text }
            }));
          } catch (error: any) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: error.message }));
          }
        } else {
          next();
        }
      });

      console.log('\n[Vite] Translation API enabled at /api/translate\n');
    },
  };
}
