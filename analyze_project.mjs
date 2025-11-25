import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const rootDir = process.cwd();
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.json'];

// Directories to scan for files to potentially delete
const sourceDirs = ['src', 'components', 'contexts', 'hooks', 'lib', 'pages', 'utils', 'types', 'translations'];
// Directories that might import things (so we scan them) but we don't delete their contents
const keeperDirs = ['scripts', 'tests', 'supabase']; 
// Files to explicitly keep (Entry points)
const keepFiles = [
    'index.html', 'index.tsx', 'App.tsx', 'main.tsx', 'vite.config.ts', 
    'tailwind.config.js', 'postcss.config.js', 'playwright.config.ts', 
    'routeConfig.ts', 'constants.ts', 'types.ts', 'package.json', 'tsconfig.json',
    'index.css' // Global styles often not imported but used in index.html or main entry
];

// Helper to get all files
function getFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file === 'public' || file === '.next' || file === 'playwright-report' || file === 'test-results') return;
            getFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const allFiles = getFiles(rootDir);
const potentialOrphans = new Set();
const importedFiles = new Set();
const fileHashes = new Map();
const duplicates = [];

// Filter relevant files
const relevantFiles = allFiles.filter(f => {
    const ext = path.extname(f);
    // We only care about code files for orphans/imports
    return extensions.includes(ext);
});

// Initialize potential orphans
relevantFiles.forEach(f => {
    const relPath = path.relative(rootDir, f);
    const inSourceDir = sourceDirs.some(d => relPath.startsWith(d + path.sep) || relPath === d);
    const isRootFile = !relPath.includes(path.sep); // Files in root like App.tsx
    
    // If it's in a source dir or a root code file, it's a candidate
    if (inSourceDir || (isRootFile && extensions.includes(path.extname(f)))) {
        potentialOrphans.add(f);
    }
});

// Remove explicit keepers from orphans
keepFiles.forEach(k => {
    const fullPath = path.join(rootDir, k);
    potentialOrphans.delete(fullPath);
});

// Also remove anything in keeperDirs from orphans
keeperDirs.forEach(d => {
    const fullPath = path.join(rootDir, d);
    // Remove any file that starts with this path
    for (const f of potentialOrphans) {
        if (f.startsWith(fullPath)) {
            potentialOrphans.delete(f);
        }
    }
});

// Regex for imports
const importRegex = /import\s+(?:[\w\s{},*]+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)|import\(['"]([^'"]+)['"]\)|url\(['"]?([^'")]+)['"]?\)/g;

function resolveImport(sourceFile, importPath) {
    let targetPath = '';
    
    if (importPath.startsWith('.')) {
        targetPath = path.resolve(path.dirname(sourceFile), importPath);
    } else if (importPath.startsWith('@/')) {
        targetPath = path.join(rootDir, importPath.replace('@/', ''));
    } else if (importPath.startsWith('/')) {
        targetPath = path.join(rootDir, importPath.substring(1));
    } else {
        // Node module or alias we don't handle
        return null;
    }

    // Check exact match
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) return targetPath;

    // Check extensions
    for (const ext of extensions) {
        if (fs.existsSync(targetPath + ext)) return targetPath + ext;
    }

    // Check index files
    for (const ext of extensions) {
        const indexPath = path.join(targetPath, 'index' + ext);
        if (fs.existsSync(indexPath)) return indexPath;
    }

    return null;
}

// Scan all files for imports
relevantFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Hash for duplicates
    const hash = crypto.createHash('md5').update(content.replace(/\s+/g, '')).digest('hex'); // Ignore whitespace
    if (fileHashes.has(hash)) {
        // Only mark as duplicate if it's not the exact same file (sanity check)
        if (fileHashes.get(hash) !== file) {
             duplicates.push({ original: fileHashes.get(hash), duplicate: file });
        }
    } else {
        fileHashes.set(hash, file);
    }

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1] || match[2] || match[3] || match[4];
        if (importPath) {
            const resolved = resolveImport(file, importPath);
            if (resolved) {
                importedFiles.add(resolved);
            }
        }
    }
});

// Identify Orphans
const orphans = [];
potentialOrphans.forEach(f => {
    if (!importedFiles.has(f)) {
        orphans.push(f);
    }
});

// Output Report
const output = JSON.stringify({
    orphans: orphans.map(f => path.relative(rootDir, f)).filter(f => !f.includes('analyze_project.mjs') && !f.includes('analysis_result.json')),
    duplicates: duplicates.map(d => ({
        original: path.relative(rootDir, d.original),
        duplicate: path.relative(rootDir, d.duplicate)
    }))
}, null, 2);

fs.writeFileSync('analysis_result.json', output);
console.log("Analysis complete. Results written to analysis_result.json");
