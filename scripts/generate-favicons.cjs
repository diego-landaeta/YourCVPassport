const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/favicon-original.png');
const outputDir = path.join(__dirname, '../public');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 }
];

async function generateFavicons() {
  console.log('Generando favicons...');

  // Verificar que el archivo original existe
  if (!fs.existsSync(inputFile)) {
    console.error('Error: No se encontró el archivo favicon-original.png');
    process.exit(1);
  }

  // Generar cada tamaño
  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Creado: ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Error creando ${name}:`, error.message);
    }
  }

  // Crear favicon.ico (combinando 16x16 y 32x32)
  // Para .ico usaremos solo el 32x32 como base
  const icoPath = path.join(outputDir, 'favicon.ico');
  try {
    await sharp(inputFile)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(icoPath);
    console.log('✓ Creado: favicon.ico (32x32)');
  } catch (error) {
    console.error('✗ Error creando favicon.ico:', error.message);
  }

  console.log('\n✓ Todos los favicons han sido generados exitosamente!');
}

generateFavicons().catch(console.error);
