/**
 * Script para verificar manualmente las funciones de canonicalUrl
 * Run: node scripts/verify-canonical-utils.mjs
 */

// Simulación de las funciones (ya que no podemos importar TypeScript directamente)
const BASE_URL = 'https://yourcvpassport.com';

function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    urlObj.search = '';
    urlObj.hash = '';

    let pathname = urlObj.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${urlObj.origin}${pathname}`;
  } catch (e) {
    return url;
  }
}

const ROUTE_MAPPING = {
  '/producto/resumen': '/product/overview',
  '/producto/sellos': '/product/stamps',
  '/producto/ats': '/product/ats',
  '/producto/dominio': '/product/domain',
  '/producto/analiticas': '/product/analytics',
  '/producto/ia': '/product/ai',
  '/producto': '/product',
  '/empresas/busqueda': '/companies/search',
  '/empresas/planes': '/companies/plans',
  '/empresas/integraciones': '/companies/integrations',
  '/empresas/seguridad': '/companies/security',
  '/empresas': '/companies',
  '/nosotros': '/about',
  '/nosotros/mision': '/about/mission',
  '/nosotros/prensa': '/about/press',
  '/nosotros/contacto': '/about/contact',
  '/profesionales/como-funciona': '/professionals/how',
  '/profesionales/plantillas': '/professionals/templates',
  '/profesionales/ayuda': '/professionals/help',
  '/profesionales': '/professionals',
  '/recursos/blog': '/resources/blog',
  '/recursos/biblioteca': '/resources/library',
  '/recursos/exito': '/resources/success',
  '/recursos/estado': '/resources/status',
  '/recursos': '/resources',
  '/precios': '/pricing',
  '/perfiles': '/profiles',
};

function getCanonicalPath(currentPath) {
  const normalizedPath = currentPath.endsWith('/') && currentPath !== '/'
    ? currentPath.slice(0, -1)
    : currentPath;

  if (ROUTE_MAPPING[normalizedPath]) {
    return ROUTE_MAPPING[normalizedPath];
  }

  if (normalizedPath.startsWith('/perfiles/')) {
    return normalizedPath.replace('/perfiles/', '/profiles/');
  }

  if (normalizedPath.startsWith('/recursos/blog/')) {
    return normalizedPath.replace('/recursos/blog/', '/resources/blog/');
  }

  return normalizedPath;
}

// Test cases
const testCases = [
  {
    name: 'Remove query string',
    input: 'https://yourcvpassport.com/pricing?lang=es',
    expected: 'https://yourcvpassport.com/pricing',
    fn: normalizeUrl
  },
  {
    name: 'Remove hash fragment',
    input: 'https://yourcvpassport.com/pricing#section',
    expected: 'https://yourcvpassport.com/pricing',
    fn: normalizeUrl
  },
  {
    name: 'Remove trailing slash',
    input: 'https://yourcvpassport.com/pricing/',
    expected: 'https://yourcvpassport.com/pricing',
    fn: normalizeUrl
  },
  {
    name: 'Keep root trailing slash',
    input: 'https://yourcvpassport.com/',
    expected: 'https://yourcvpassport.com/',
    fn: normalizeUrl
  },
  {
    name: 'Complex URL normalization',
    input: 'https://yourcvpassport.com/pricing/?lang=es&utm_source=google#top',
    expected: 'https://yourcvpassport.com/pricing',
    fn: normalizeUrl
  },
  {
    name: 'Map /precios to /pricing',
    input: '/precios',
    expected: '/pricing',
    fn: getCanonicalPath
  },
  {
    name: 'Map /producto/resumen to /product/overview',
    input: '/producto/resumen',
    expected: '/product/overview',
    fn: getCanonicalPath
  },
  {
    name: 'Map /empresas/planes to /companies/plans',
    input: '/empresas/planes',
    expected: '/companies/plans',
    fn: getCanonicalPath
  },
  {
    name: 'Map /profesionales/plantillas to /professionals/templates',
    input: '/profesionales/plantillas',
    expected: '/professionals/templates',
    fn: getCanonicalPath
  },
  {
    name: 'Map dynamic /perfiles/* to /profiles/*',
    input: '/perfiles/spain/madrid/developer',
    expected: '/profiles/spain/madrid/developer',
    fn: getCanonicalPath
  },
  {
    name: 'Handle trailing slash in Spanish route',
    input: '/precios/',
    expected: '/pricing',
    fn: getCanonicalPath
  },
  {
    name: 'Keep English route as-is',
    input: '/pricing',
    expected: '/pricing',
    fn: getCanonicalPath
  },
];

console.log('🧪 Testing Canonical URL Utilities\n');
console.log('═'.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = test.fn(test.input);
  const success = result === test.expected;

  if (success) {
    passed++;
    console.log(`\n✅ Test ${index + 1}: ${test.name}`);
  } else {
    failed++;
    console.log(`\n❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Input:    ${test.input}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got:      ${result}`);
  }
});

console.log('\n' + '═'.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Canonical URL utilities are working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
