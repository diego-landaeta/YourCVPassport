import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { translationPlugin } from './vite-plugins/vite-translation-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        allowedHosts: ['apply-kurt-describes-completely.trycloudflare.com'],
        proxy: {
          '/api': {
            // server.mjs pasa a escuchar por defecto en 127.0.0.1:3001 (cambio coordinado con
            // la unidad que edita server.mjs; hasta integrarlo, arrancarlo con PORT=3001)
            target: 'http://127.0.0.1:3001',
            changeOrigin: true,
          },
        },
      },
      plugins: [
        react(),
        translationPlugin(), // API de traduccion server-side en desarrollo
      ],
      // No inyectar aqui claves de terceros: todo lo que va en `define` acaba en el
      // bundle publico. La clave de Gemini vive solo en la Edge Function ai-cv-assistant.
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                return `assets/images/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
            // Los diccionarios (translations/en.ts, es.ts) ya salen en su propio chunk porque
            // LanguageProvider los importa con import(); aqui solo se les da un nombre
            // reconocible (i18n-en / i18n-es). Ojo: NO usar manualChunks para esto, porque
            // arrastra sus dependencias (React) al chunk del diccionario.
            chunkFileNames: (chunkInfo) =>
              /[\\/]translations[\\/](en|es)\.ts$/.test(chunkInfo.facadeModuleId ?? '')
                ? 'assets/js/i18n-[name]-[hash].js'
                : 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
          },
        },
        // Limite realista para que Vite avise si un chunk se dispara. Por encima quedan, a
        // proposito, los que solo se descargan bajo demanda (react-pdf al exportar ATS).
        chunkSizeWarningLimit: 800,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production',
            pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
          },
        },
        sourcemap: mode !== 'production',
        cssCodeSplit: true,
        assetsInlineLimit: 4096,
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@supabase/supabase-js',
          'react-helmet-async',
          'react-hot-toast',
        ],
      },
      esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
        legalComments: 'none',
      },
    };
});
