/**
 * Raices de seccion que se sirven con la misma pagina que su subpagina principal
 * (/producto = /producto/resumen...) y cuyo canonical apunta a esa subpagina.
 *
 * Todo enlace interno (migas de pan, menus, tarjetas) debe usar la URL canonica, no la raiz:
 * enlazar a la raiz reparte las senales entre dos URLs con el mismo contenido (auditoria
 * SEO del 25/10/2026, hallazgo 17). Mantener alineado con `pathMappings` de
 * config/routeConfig.ts (la primera ruta de cada seccion es la canonica; ver
 * utils/canonicalUrl.ts) y con el test tests/qa/seo-codigo.local.spec.ts.
 */
export const CANONICAL_SECTION_PATHS: Readonly<Record<string, string>> = {
  producto: '/producto/resumen',
  product: '/product/overview',
  profesionales: '/profesionales/como-funciona',
  professionals: '/professionals/how',
  empresas: '/empresas/busqueda',
  companies: '/companies/search',
};

/**
 * Ruta interna a la que debe enlazar un nivel de seccion (`producto`, `/product`, `companies`...).
 * Las secciones sin raiz duplicada (nosotros, about...) se devuelven tal cual, con barra inicial.
 */
export function canonicalSectionPath(section: string): string {
  const key = section.replace(/^\/+|\/+$/g, '');
  return CANONICAL_SECTION_PATHS[key] ?? `/${key}`;
}
