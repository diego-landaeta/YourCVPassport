/**
 * Configuracion de los tests de Edge Functions (tests/edge-functions).
 *
 * Estos specs llaman a Edge Functions REALES: algunas envian correos (confirmacion,
 * magic link, recuperacion de contrasena) o escriben datos (analitica, leads).
 * Por eso NUNCA corren por defecto:
 *
 *   - Hace falta RUN_LIVE_EDGE_TESTS=1 (sin el, la config raiz ni siquiera los carga
 *     y, si se lanzan a mano, se saltan con motivo).
 *   - Se usa un proyecto de Supabase de PRUEBAS con variables propias:
 *       EDGE_TEST_SUPABASE_URL, EDGE_TEST_SUPABASE_ANON_KEY
 *     No se leen las VITE_SUPABASE_* (en .env.local apuntan a produccion) y se
 *     rechaza cualquier URL que sea la de produccion.
 *   - Los tests que envian correo usan EDGE_TEST_EMAIL (un buzon de pruebas) y se
 *     saltan si no esta definido. No hay direcciones personales en el codigo.
 *
 *   RUN_LIVE_EDGE_TESTS=1 EDGE_TEST_SUPABASE_URL=https://<ref-pruebas>.supabase.co \
 *   EDGE_TEST_SUPABASE_ANON_KEY=... EDGE_TEST_EMAIL=qa@ejemplo.test \
 *   npx playwright test tests/edge-functions
 */
import { test } from '@playwright/test';

/** Ref del proyecto de produccion (supabase/client.ts). */
const PRODUCTION_REF = 'djehzlzombqrzzuchcef';

const url = (process.env.EDGE_TEST_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = process.env.EDGE_TEST_SUPABASE_ANON_KEY || '';

function skipReason(): string | null {
  if (process.env.RUN_LIVE_EDGE_TESTS !== '1') {
    return 'Edge Functions reales: solo con RUN_LIVE_EDGE_TESTS=1 y un proyecto de pruebas';
  }
  if (!url || !anonKey) return 'Faltan EDGE_TEST_SUPABASE_URL / EDGE_TEST_SUPABASE_ANON_KEY (proyecto de pruebas)';
  const prodUrl = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  if (url.includes(PRODUCTION_REF) || (prodUrl && url === prodUrl)) {
    return 'EDGE_TEST_SUPABASE_URL apunta a produccion: estos tests solo corren contra un proyecto de pruebas';
  }
  return null;
}

export const SKIP_REASON = skipReason();

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;

/** Buzon de pruebas para los tests que envian correo real (vacio = se saltan). */
export const TEST_EMAIL = process.env.EDGE_TEST_EMAIL || '';

/**
 * Llamar al principio de cada spec: salta todo el archivo si no se cumplen las
 * condiciones de arriba.
 */
export function requireLiveEdgeProject() {
  test.skip(SKIP_REASON !== null, SKIP_REASON ?? '');
}

/** Para los tests que envian un correo real al buzon de pruebas. */
export function requireTestEmail() {
  test.skip(!TEST_EMAIL, 'Envia un correo real: define EDGE_TEST_EMAIL con un buzon de pruebas');
}
