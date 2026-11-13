/**
 * «Todo gratis hasta nuevo aviso» (#24, lib/plans.ts). Mismo criterio que la app:
 * encendido salvo VITE_TODO_GRATIS=false. Vite toma la variable del entorno con que
 * arranca el webServer, así que las specs y la app ven el mismo modo:
 *
 *   VITE_TODO_GRATIS=false QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts ...
 *
 * (con un Vite ya levantado en ese puerto, reuseExistingServer lo reutiliza tal cual:
 * tiene que haber arrancado con el mismo valor).
 */
export const TODO_GRATIS = process.env.VITE_TODO_GRATIS !== 'false';

/** h1 del aviso que sustituye a las páginas de precios (components/shared/TodoGratisAviso.tsx). */
export const AVISO_H1 = {
  profesionales: { es: 'YourCVPassport es gratis', en: 'YourCVPassport is free' },
  empresas: { es: 'Publicar ofertas es gratis', en: 'Posting jobs is free' },
} as const;

/** Rutas de precios y planes que salen del menú, del pie y de la comunidad. */
export const RUTAS_DE_PRECIOS = ['/precios', '/pricing', '/empresas/planes', '/companies/plans'] as const;
