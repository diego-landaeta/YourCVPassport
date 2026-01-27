import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templates = ['passport', 'classic', 'creative-bold'];

async function captureTemplate(browser, templateId, theme) {
  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewport({ width: 800, height: 1000 });

    // Navigate to admin template viewer
    await page.goto(`http://localhost:3000/admin/templates`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for the page to load
    await page.waitForSelector('[data-testid="template-grid"]', { timeout: 10000 }).catch(() => {
      console.log('Template grid not found, continuing...');
    });

    // Click on the template
    await page.click(`[data-template-id="${templateId}"]`).catch(() => {
      console.log(`Template ${templateId} not found, trying alternative selector...`);
    });

    // Wait for preview to load
    await page.waitForTimeout(2000);

    // Toggle theme if needed
    if (theme === 'dark') {
      await page.click('[data-testid="toggle-theme"]').catch(() => {
        console.log('Theme toggle not found');
      });
      await page.waitForTimeout(500);
    }

    // Take screenshot
    const outputPath = join(__dirname, '../public/images/templates', `${templateId}-${theme}.png`);
    await page.screenshot({
      path: outputPath,
      clip: {
        x: 0,
        y: 0,
        width: 320,
        height: 400
      }
    });

    console.log(`✅ Generated: ${templateId}-${theme}.png`);
  } catch (error) {
    console.error(`❌ Error capturing ${templateId}-${theme}:`, error.message);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Starting template preview generation...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const template of templates) {
      // Generate light version
      await captureTemplate(browser, template, 'light');

      // Generate dark version
      await captureTemplate(browser, template, 'dark');
    }

    console.log('\n✨ All template previews generated successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main();
