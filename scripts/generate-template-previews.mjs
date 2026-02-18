import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Template configurations - All dashboard templates
const templates = [
    { name: 'passport', selector: '#template-passport' },
    { name: 'classic', selector: '#template-classic' },
    { name: 'minimalist-yellow', selector: '#template-minimalist-yellow' },
    { name: 'gradient-blue', selector: '#template-gradient-blue' },
    { name: 'coral-pink', selector: '#template-coral-pink' },
    { name: 'green-minimal', selector: '#template-green-minimal' },
    { name: 'creative-orange', selector: '#template-creative-orange' },
    { name: 'classic-sidebar', selector: '#template-classic-sidebar' },
    { name: 'modern-clean', selector: '#template-modern-clean' },
    { name: 'elegant-minimal', selector: '#template-elegant-minimal' },
    { name: 'professional-blue', selector: '#template-professional-blue' },
    { name: 'creative-modern', selector: '#template-creative-modern' },
    { name: 'modern-minimalist', selector: '#template-modern-minimalist' },
    { name: 'creative-bold', selector: '#template-creative-bold' },
    { name: 'professional-classic', selector: '#template-professional-classic' },
    { name: 'healthcare-professional', selector: '#template-healthcare-professional' },
    { name: 'modern-professional', selector: '#template-modern-professional' },
    { name: 'corporate-classic', selector: '#template-corporate-classic' },
    { name: 'creative-minimalist', selector: '#template-creative-minimalist' },
    { name: 'academic-standard', selector: '#template-academic-standard' },
    { name: 'urban', selector: '#template-urban' }
];

async function generateTemplateScreenshots() {
    console.log('🚀 Iniciando generación de vistas previas de plantillas...\n');

    // Ensure output directory exists
    const outputDir = join(projectRoot, 'public', 'images', 'templates');
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
        console.log('✅ Directorio creado:', outputDir, '\n');
    }

    // Launch browser
    console.log('🌐 Iniciando navegador...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport for consistent screenshots
        await page.setViewport({
            width: 800,
            height: 1100,
            deviceScaleFactor: 1.5 // Balanced quality and file size
        });

        // Navigate to the preview page
        const previewUrl = 'http://localhost:5173/dev/template-preview';
        console.log('📄 Navegando a:', previewUrl);

        try {
            await page.goto(previewUrl, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            console.log('✅ Página cargada correctamente\n');
        } catch (error) {
            console.error('❌ Error: No se pudo cargar la página');
            console.error('   Asegúrate de que el servidor de desarrollo esté corriendo en localhost:5173');
            console.error('   Ejecuta: npm run dev\n');
            throw error;
        }

        // Generate screenshots for each template
        for (const template of templates) {
            console.log(`📸 Capturando: ${template.name}...`);

            try {
                const element = await page.$(template.selector);

                if (!element) {
                    console.warn(`   ⚠️  Elemento no encontrado: ${template.selector}`);
                    continue;
                }

                const outputPath = join(outputDir, `${template.name}.png`);

                await element.screenshot({
                    path: outputPath,
                    type: 'png',
                    omitBackground: false
                });

                console.log(`   ✅ Guardado: ${outputPath}`);
            } catch (error) {
                console.error(`   ❌ Error capturando ${template.name}:`, error.message);
            }
        }

        console.log('\n✨ ¡Generación de vistas previas completada!\n');
        console.log('📁 Las imágenes están en: public/images/templates/\n');

    } catch (error) {
        console.error('\n❌ Error durante la generación:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the script
generateTemplateScreenshots()
    .then(() => {
        console.log('👍 Proceso completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
