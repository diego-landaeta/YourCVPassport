const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing imports in NUEVOS templates...\n');

const NUEVOS_DIR = path.join(__dirname, '..', 'NUEVOS');

// Get all .tsx files in NUEVOS
const files = fs.readdirSync(NUEVOS_DIR).filter(f => f.endsWith('.tsx'));

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(NUEVOS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix the Icons import path (both single and double quotes)
  const oldImportSingle = `from '../ui/Icons'`;
  const oldImportDouble = `from "../ui/Icons"`;
  const newImport = `from '../../components/ui/Icons'`;

  let modified = false;

  if (content.includes(oldImportSingle)) {
    content = content.replace(new RegExp(oldImportSingle.replace(/'/g, "\\'"), 'g'), newImport);
    modified = true;
  }

  if (content.includes(oldImportDouble)) {
    content = content.replace(new RegExp(oldImportDouble, 'g'), newImport);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed ${file}`);
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
