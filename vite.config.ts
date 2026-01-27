import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        allowedHosts: ['apply-kurt-describes-completely.trycloudflare.com'],
      },
      plugins: [react()],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
          },
        },
        chunkSizeWarningLimit: 5000,
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
          'zustand',
          'react-hot-toast',
        ],
        exclude: ['@google/generative-ai', 'openai'],
      },
      esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
        legalComments: 'none',
      },
    };
});
