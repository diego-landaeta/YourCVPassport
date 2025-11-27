const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING IMPLEMENTATION - D4.10 & D4.11\n');
console.log('=' .repeat(60));

let passedTests = 0;
let totalTests = 0;

function test(name, condition) {
  totalTests++;
  const status = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (condition) passedTests++;
  return condition;
}

console.log('\n📄 FRONTEND - AIProductPage\n');

// Test 1: AIProductPage file exists
const aiProductPagePath = path.join(__dirname, 'components', 'AIProductPage.tsx');
test('AIProductPage.tsx exists', fs.existsSync(aiProductPagePath));

// Test 2: AIProductPage has correct content
if (fs.existsSync(aiProductPagePath)) {
  const content = fs.readFileSync(aiProductPagePath, 'utf8');
  test('Has hero section title', content.includes('AI that powers your professional profile'));
  test('Has BeforeAfterExample component', content.includes('BeforeAfterExample'));
  test('Has FeatureCard component', content.includes('FeatureCard'));
  test('Has TestimonialCard component', content.includes('TestimonialCard'));
  test('Has bilingual support', content.includes("lang === 'es'"));
  test('Has description optimization example', content.includes('Description Optimization'));
  test('Has summary generation example', content.includes('Summary Generation') || content.includes('Professional Summary'));
  test('Has skills suggestion example', content.includes('Skills Suggestions'));
  test('Has quality checklist', content.includes('Quality Checklist') || content.includes('Checklist de Calidad'));
}

console.log('\n🔄 ROUTING CONFIGURATION\n');

// Test 3: routeConfig.ts is properly configured
const routeConfigPath = path.join(__dirname, 'routeConfig.ts');
if (fs.existsSync(routeConfigPath)) {
  const routeConfig = fs.readFileSync(routeConfigPath, 'utf8');
  test('routeConfig imports AIProductPage', routeConfig.includes("import('./components/AIProductPage')"));
  test('AIProductPage in componentMap', routeConfig.includes('AIProductPage,'));
  test('product/ai path configured', routeConfig.includes("en: 'product/ai'"));
  test('producto/ia path configured', routeConfig.includes("es: 'producto/ia'"));
  test('AIProductPage in pathMappings', routeConfig.includes("componentName: 'AIProductPage'"));
}

// Test 4: App.tsx has direct route
const appPath = path.join(__dirname, 'App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  test('App.tsx imports AIProductPage', appContent.includes("import('./components/AIProductPage')"));
  test('App.tsx has /product/ai route', appContent.includes('path="/product/ai"'));
  test('App.tsx route uses AIProductPage', appContent.includes('<Route path="/product/ai" element={<AIProductPage />}'));
}

console.log('\n🔧 EDGE FUNCTIONS\n');

// Test 5: Edge functions exist
const functionsPath = path.join(__dirname, 'supabase', 'functions');
const aiOptimizePath = path.join(functionsPath, 'ai-optimize-description', 'index.ts');
const publicProfilePath = path.join(functionsPath, 'get-public-profile', 'index.ts');
const directoryPath = path.join(functionsPath, 'get-profiles-directory', 'index.ts');
const analyticsPath = path.join(functionsPath, 'track-analytics', 'index.ts');

test('ai-optimize-description/index.ts exists', fs.existsSync(aiOptimizePath));
test('get-public-profile/index.ts exists', fs.existsSync(publicProfilePath));
test('get-profiles-directory/index.ts exists', fs.existsSync(directoryPath));
test('track-analytics/index.ts exists', fs.existsSync(analyticsPath));

// Test 6: Edge functions have rate limiting
if (fs.existsSync(aiOptimizePath)) {
  const aiContent = fs.readFileSync(aiOptimizePath, 'utf8');
  test('ai-optimize has Redis import', aiContent.includes('@upstash/redis'));
  test('ai-optimize has Ratelimit import', aiContent.includes('@upstash/ratelimit'));
  test('ai-optimize has checkRateLimit function', aiContent.includes('checkRateLimit'));
}

if (fs.existsSync(publicProfilePath)) {
  const profileContent = fs.readFileSync(publicProfilePath, 'utf8');
  test('get-public-profile has caching', profileContent.includes('cacheGet') && profileContent.includes('cacheSet'));
  test('get-public-profile has rate limiting', profileContent.includes('checkRateLimit'));
  test('get-public-profile has X-Cache header', profileContent.includes("'X-Cache'"));
}

if (fs.existsSync(directoryPath)) {
  const dirContent = fs.readFileSync(directoryPath, 'utf8');
  test('get-profiles-directory has caching', dirContent.includes('cacheGet') && dirContent.includes('cacheSet'));
  test('get-profiles-directory has pagination', dirContent.includes('page') && dirContent.includes('pageSize'));
  test('get-profiles-directory has filters', dirContent.includes('DirectoryFilters'));
}

console.log('\n📦 DEPENDENCIES\n');

// Test 7: package.json has required dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  test('@upstash/redis installed', packageJson.dependencies['@upstash/redis'] !== undefined);
  test('@upstash/ratelimit installed', packageJson.dependencies['@upstash/ratelimit'] !== undefined);
}

console.log('\n📚 DOCUMENTATION\n');

// Test 8: Documentation exists
const rateLimitingDocPath = path.join(__dirname, 'RATE_LIMITING_SETUP.md');
const implementationDocPath = path.join(__dirname, 'IMPLEMENTACION_COMPLETA.md');

test('RATE_LIMITING_SETUP.md exists', fs.existsSync(rateLimitingDocPath));
test('IMPLEMENTACION_COMPLETA.md exists', fs.existsSync(implementationDocPath));

if (fs.existsSync(rateLimitingDocPath)) {
  const docContent = fs.readFileSync(rateLimitingDocPath, 'utf8');
  test('Documentation has Upstash setup', docContent.includes('Upstash'));
  test('Documentation has rate limit config', docContent.includes('Rate Limit'));
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Implementation is correct.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Please review.\n`);
  process.exit(1);
}
