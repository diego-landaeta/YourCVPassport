#!/usr/bin/env node

/**
 * Script to optimize PNG images to WebP format for better performance
 * Reduces image sizes by 60-80% while maintaining quality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'public', 'images', 'templates');

console.log('🖼️  Optimizing template images...\n');

// Check if ImageMagick or sharp is available
let converter = null;
try {
    execSync('magick -version', { stdio: 'ignore' });
    converter = 'imagemagick';
    console.log('✓ Using ImageMagick for conversion\n');
} catch {
    console.log('⚠️  ImageMagick not found. Install it for image optimization:');
    console.log('   - Windows: choco install imagemagick');
    console.log('   - macOS: brew install imagemagick');
    console.log('   - Linux: apt-get install imagemagick\n');
    console.log('Alternatively, you can use online tools like https://squoosh.app/\n');
    process.exit(1);
}

// Find all PNG files
const pngFiles = fs.readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.png'));

if (pngFiles.length === 0) {
    console.log('No PNG files found to optimize.');
    process.exit(0);
}

console.log(`Found ${pngFiles.length} PNG files to optimize:\n`);

let totalOriginalSize = 0;
let totalNewSize = 0;

pngFiles.forEach((file, index) => {
    const inputPath = path.join(TEMPLATES_DIR, file);
    const outputPath = path.join(TEMPLATES_DIR, file.replace('.png', '.webp'));

    // Get original file size
    const originalSize = fs.statSync(inputPath).size;
    totalOriginalSize += originalSize;

    try {
        // Convert PNG to WebP with high quality
        execSync(`magick "${inputPath}" -quality 85 "${outputPath}"`, { stdio: 'ignore' });

        // Get new file size
        const newSize = fs.statSync(outputPath).size;
        totalNewSize += newSize;

        const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

        console.log(`[${index + 1}/${pngFiles.length}] ${file}`);
        console.log(`    ${(originalSize / 1024).toFixed(0)} KB → ${(newSize / 1024).toFixed(0)} KB (${savings}% reduction)`);
    } catch (error) {
        console.error(`    ❌ Failed to convert ${file}:`, error.message);
    }
});

const totalSavings = ((1 - totalNewSize / totalOriginalSize) * 100).toFixed(1);
console.log('\n📊 Summary:');
console.log(`   Original total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Optimized total: ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Total savings: ${totalSavings}%\n`);

console.log('✓ Optimization complete!');
console.log('\n⚠️  Next steps:');
console.log('   1. Update your code to use .webp extensions instead of .png');
console.log('   2. Keep .png files as fallback for older browsers if needed');
console.log('   3. Test the new images in your application\n');
