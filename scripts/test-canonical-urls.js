/**
 * Script para verificar que las URLs canónicas estén correctamente implementadas
 *
 * Uso:
 * 1. Asegúrate de que tu servidor esté corriendo
 * 2. Ejecuta: node scripts/test-canonical-urls.js
 */

const testCases = [
  {
    url: 'https://yourcvpassport.com/',
    expectedCanonical: 'https://yourcvpassport.com/',
    description: 'Homepage'
  },
  {
    url: 'https://yourcvpassport.com/?utm_source=google',
    expectedCanonical: 'https://yourcvpassport.com/',
    description: 'Homepage with query string'
  },
  {
    url: 'https://yourcvpassport.com/pricing',
    expectedCanonical: 'https://yourcvpassport.com/pricing',
    description: 'Pricing page (EN)'
  },
  {
    url: 'https://yourcvpassport.com/precios',
    expectedCanonical: 'https://yourcvpassport.com/pricing',
    description: 'Pricing page (ES) - should use EN canonical'
  },
  {
    url: 'https://yourcvpassport.com/pricing/',
    expectedCanonical: 'https://yourcvpassport.com/pricing',
    description: 'Pricing with trailing slash'
  },
  {
    url: 'https://yourcvpassport.com/pricing?lang=es',
    expectedCanonical: 'https://yourcvpassport.com/pricing',
    description: 'Pricing with lang parameter'
  },
  {
    url: 'https://yourcvpassport.com/product/overview',
    expectedCanonical: 'https://yourcvpassport.com/product/overview',
    description: 'Product overview (EN)'
  },
  {
    url: 'https://yourcvpassport.com/producto/resumen',
    expectedCanonical: 'https://yourcvpassport.com/product/overview',
    description: 'Product overview (ES) - should use EN canonical'
  },
];

console.log('🔍 Testing Canonical URLs...\n');
console.log('═'.repeat(80));

// Test each URL
testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}/${testCases.length}: ${test.description}`);
  console.log(`URL: ${test.url}`);
  console.log(`Expected Canonical: ${test.expectedCanonical}`);
  console.log('Status: ⏳ Run this test manually in browser');
  console.log('-'.repeat(80));
});

console.log('\n📝 Manual Testing Instructions:\n');
console.log('1. Start your development server:');
console.log('   npm run dev\n');
console.log('2. Open each URL in your browser\n');
console.log('3. Open DevTools Console (F12)\n');
console.log('4. Run this command:');
console.log('   ');
console.log('   const canonical = document.querySelector(\'link[rel="canonical"]\');');
console.log('   console.log(\'Canonical:\', canonical?.href);');
console.log('   ');
console.log('5. Verify the canonical matches the expected value\n');
console.log('═'.repeat(80));

console.log('\n✅ Automated Testing (if you have a testing framework):\n');
console.log('You can also use Playwright/Puppeteer to automate this.\n');
console.log('Example with Playwright:');
console.log(`
const { test, expect } = require('@playwright/test');

test.describe('Canonical URLs', () => {
  const testCases = ${JSON.stringify(testCases, null, 2)};

  testCases.forEach((testCase) => {
    test(\`\${testCase.description}\`, async ({ page }) => {
      await page.goto(testCase.url);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(canonical).toBe(testCase.expectedCanonical);
    });
  });
});
`);

console.log('\n💡 Quick Browser Test:\n');
console.log('Paste this in your browser console on any page:');
console.log(`
(function() {
  const canonical = document.querySelector('link[rel="canonical"]');
  const current = window.location.href;

  console.log('═'.repeat(60));
  console.log('🔍 Canonical URL Checker');
  console.log('═'.repeat(60));
  console.log('Current URL:', current);
  console.log('Canonical URL:', canonical ? canonical.href : '❌ NOT FOUND');

  // Check for issues
  const issues = [];

  if (!canonical) {
    issues.push('❌ No canonical tag found!');
  } else {
    if (canonical.href.includes('?')) {
      issues.push('⚠️  Canonical contains query string');
    }
    if (canonical.href.endsWith('/') && canonical.href !== 'https://yourcvpassport.com/') {
      issues.push('⚠️  Canonical has trailing slash');
    }
    if (canonical.href.includes('#')) {
      issues.push('⚠️  Canonical contains hash fragment');
    }
  }

  console.log('\\nIssues:', issues.length === 0 ? '✅ None' : issues.join('\\n       '));
  console.log('═'.repeat(60));
})();
`);
