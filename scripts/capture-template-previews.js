/**
 * Script to automatically capture template preview screenshots using Puppeteer
 * Run with: node scripts/capture-template-previews.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templates = [
  'passport',
  'classic',
  'modern-professional',
  'corporate-classic',
  'creative-minimalist',
  'academic-standard',
  'modern-minimalist',
  'creative-bold',
  'professional-classic',
  'healthcare-professional',
  'minimalist-yellow',
  'gradient-blue',
  'coral-pink',
  'green-minimal',
  'creative-orange',
  'classic-sidebar',
  'modern-clean',
  'elegant-minimal',
  'professional-blue',
  'creative-modern',
];

async function captureTemplateScreenshots() {
  console.log('🚀 Starting template screenshot capture...');

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'public', 'images', 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('✅ Created output directory:', outputDir);
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('✅ Browser launched');

  try {
    const page = await browser.newPage();

    // Set viewport to match preview size
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2, // High DPI for better quality
    });

    // Navigate to the preview generator page
    const url = 'http://localhost:3002/dev/template-previews';
    console.log(`📍 Navigating to ${url}...`);

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('✅ Page loaded');

    // Capture each template
    for (const templateId of templates) {
      try {
        console.log(`📸 Capturing ${templateId}...`);

        const elementSelector = `#template-${templateId}`;
        const element = await page.$(elementSelector);

        if (!element) {
          console.warn(`⚠️  Element not found for template: ${templateId}`);
          continue;
        }

        // Wait a bit for template to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Screenshot the element
        const screenshot = await element.screenshot({
          type: 'png',
          omitBackground: false,
        });

        // Save to file
        const outputPath = path.join(outputDir, `${templateId}.png`);
        fs.writeFileSync(outputPath, screenshot);

        console.log(`✅ Saved ${templateId}.png`);
      } catch (error) {
        console.error(`❌ Error capturing ${templateId}:`, error.message);
      }
    }

    console.log('🎉 All template screenshots captured!');
    console.log(`📁 Output directory: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    console.log('✅ Browser closed');
  }
}

// Run the script
captureTemplateScreenshots().catch(console.error);
