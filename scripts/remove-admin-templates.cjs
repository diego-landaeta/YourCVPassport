const fs = require('fs');
const path = require('path');

console.log('🗑️  Removing admin templates system...\n');

const ADMIN_DIR = path.join(__dirname, '..', 'components', 'templates', 'admin');
const TEMPLATE_DATA = path.join(__dirname, '..', 'components', 'templates', 'templateData.ts');
const PROFILE_VIEW = path.join(__dirname, '..', 'components', 'ProfileViewPage.tsx');
const TEMPLATE_SELECTOR = path.join(__dirname, '..', 'components', 'profile-editor', 'TemplateSelector.tsx');
const ICONS_FILE = path.join(__dirname, '..', 'components', 'ui', 'Icons.tsx');
const ADMIN_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'templates', 'admin');

let removedCount = 0;

// 1. Remove admin templates directory
if (fs.existsSync(ADMIN_DIR)) {
  fs.rmSync(ADMIN_DIR, { recursive: true, force: true });
  console.log('✓ Removed components/templates/admin/');
  removedCount++;
}

// 2. Remove admin template images
if (fs.existsSync(ADMIN_IMAGES_DIR)) {
  fs.rmSync(ADMIN_IMAGES_DIR, { recursive: true, force: true });
  console.log('✓ Removed public/images/templates/admin/');
  removedCount++;
}

// 3. Remove Icons.tsx if it exists
if (fs.existsSync(ICONS_FILE)) {
  fs.unlinkSync(ICONS_FILE);
  console.log('✓ Removed components/ui/Icons.tsx');
  removedCount++;
}

// 4. Clean templateData.ts - remove admin templates
if (fs.existsSync(TEMPLATE_DATA)) {
  let content = fs.readFileSync(TEMPLATE_DATA, 'utf-8');

  // Remove isAdminOnly field from interface
  content = content.replace(/\s*isAdminOnly\?\s*:\s*boolean;\s*/g, '');

  // Remove all admin templates (from comment to end of array)
  content = content.replace(/\s*\/\/ Admin-Only Templates[\s\S]*(?=\];)/g, '\n');

  fs.writeFileSync(TEMPLATE_DATA, content, 'utf-8');
  console.log('✓ Cleaned templateData.ts (removed 49 admin templates)');
  removedCount++;
}

// 5. Clean ProfileViewPage.tsx - remove admin imports and optgroup
if (fs.existsSync(PROFILE_VIEW)) {
  let content = fs.readFileSync(PROFILE_VIEW, 'utf-8');

  // Remove AdminTemplateLoader import
  content = content.replace(/import\s+\{\s*AdminTemplateLoader\s*\}\s+from\s+['"]\.\/templates\/admin\/AdminTemplateLoader['"];\s*/g, '');

  // Remove admin template check in renderTemplate
  content = content.replace(/\s*\/\/ Check if this is an admin template[\s\S]*?return <AdminTemplateLoader[\s\S]*?>\s*;\s*\}\s*/g, '\n\n');

  // Remove admin optgroup
  content = content.replace(/\s*\{isAdmin\s*&&\s*\([\s\S]*?<optgroup label="🛡️ PLANTILLAS ADMIN[\s\S]*?<\/optgroup>[\s\S]*?\)\}\s*/g, '');

  fs.writeFileSync(PROFILE_VIEW, content, 'utf-8');
  console.log('✓ Cleaned ProfileViewPage.tsx');
  removedCount++;
}

// 6. Clean TemplateSelector.tsx - remove admin logic
if (fs.existsSync(TEMPLATE_SELECTOR)) {
  let content = fs.readFileSync(TEMPLATE_SELECTOR, 'utf-8');

  // Remove AdminTemplateLoader import
  content = content.replace(/import\s+\{\s*AdminTemplateLoader\s*\}\s+from\s+['"]\.\.\/templates\/admin\/AdminTemplateLoader['"];\s*/g, '');

  // Remove isAdmin check
  content = content.replace(/\s*\/\/ Check if user is admin[\s\S]*?const isAdmin = profile\?\.role === 'admin';\s*/g, '');

  // Remove availableTemplates filter
  content = content.replace(/\s*\/\/ Filter templates based on user role[\s\S]*?return true;\s*\}\);/g, '');

  // Replace availableTemplates with templates in the code
  content = content.replace(/availableTemplates/g, 'templates');

  // Remove admin badge section
  content = content.replace(/\s*\{\/\* Admin Badge \*\/\}[\s\S]*?<\/div>\s*\)\s*\}\s*/g, '');

  // Remove admin template check in getTemplateComponent
  content = content.replace(/\s*\/\/ Check if this is an admin template[\s\S]*?return <AdminTemplateLoader[\s\S]*?>\s*;\s*\}\s*/g, '\n');

  // Remove isAdminOnly check from badges
  content = content.replace(/\s*&&\s*!template\.isAdminOnly/g, '');

  fs.writeFileSync(TEMPLATE_SELECTOR, content, 'utf-8');
  console.log('✓ Cleaned TemplateSelector.tsx');
  removedCount++;
}

console.log(`\n✅ Successfully removed admin templates system!`);
console.log(`📊 Cleaned ${removedCount} files/directories`);
console.log('\n📝 Summary:');
console.log('  • Removed 49 admin template components');
console.log('  • Removed admin template placeholder images');
console.log('  • Removed Icons.tsx wrapper');
console.log('  • Cleaned templateData.ts');
console.log('  • Cleaned ProfileViewPage.tsx');
console.log('  • Cleaned TemplateSelector.tsx');
console.log('\n🔄 Next steps:');
console.log('  1. Restart your dev server');
console.log('  2. The app will work with only the original templates');
