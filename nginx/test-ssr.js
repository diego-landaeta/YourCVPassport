/**
 * Script de prueba para el servidor SSR
 * Verifica que los códigos de estado HTTP son correctos
 */

const http = require('http');

const SERVER_HOST = 'localhost';
const SERVER_PORT = 3001;

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function testRequest(path, expectedStatus, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)'
      }
    };

    const req = http.request(options, (res) => {
      const statusCode = res.statusCode;
      const success = statusCode === expectedStatus;

      console.log(
        `${success ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${description}`
      );
      console.log(
        `  Expected: ${colors.cyan}${expectedStatus}${colors.reset}, ` +
        `Got: ${success ? colors.green : colors.red}${statusCode}${colors.reset}`
      );
      console.log(`  Path: ${colors.blue}${path}${colors.reset}`);
      console.log('');

      // Consumir la respuesta para cerrar la conexión
      res.on('data', () => {});
      res.on('end', () => resolve(success));
    });

    req.on('error', (error) => {
      console.log(`${colors.red}✗${colors.reset} ${description}`);
      console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
      console.log('');
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log(`${colors.yellow}=================================${colors.reset}`);
  console.log(`${colors.yellow}  Pruebas del Servidor SSR${colors.reset}`);
  console.log(`${colors.yellow}=================================${colors.reset}`);
  console.log('');
  console.log(`Servidor: ${colors.cyan}http://${SERVER_HOST}:${SERVER_PORT}${colors.reset}`);
  console.log('');

  const tests = [
    {
      path: '/health',
      expectedStatus: 200,
      description: 'Health check endpoint'
    },
    {
      path: '/cv/perfil-inexistente-test-123',
      expectedStatus: 404,
      description: 'Perfil no encontrado (debería retornar 404)'
    },
    {
      path: '/cv/usuario-test-que-no-existe',
      expectedStatus: 404,
      description: 'Otro perfil inexistente (debería retornar 404)'
    },
    {
      path: '/profiles/spain/ux-designer',
      expectedStatus: 404,
      description: 'Ruta bloqueada /profiles/* (debería retornar 404)'
    },
    {
      path: '/perfiles/españa/barcelona/desarrollador',
      expectedStatus: 404,
      description: 'Ruta bloqueada /perfiles/* (debería retornar 404)'
    },
    {
      path: '/talent-search',
      expectedStatus: 404,
      description: 'Ruta bloqueada /talent-search (debería retornar 404)'
    },
    // Nota: Para probar un perfil existente, reemplaza con un slug real de tu DB
    // {
    //   path: '/cv/john-doe-software-engineer',
    //   expectedStatus: 200,
    //   description: 'Perfil existente (debería retornar 200)'
    // }
  ];

  const results = [];

  for (const test of tests) {
    const result = await testRequest(test.path, test.expectedStatus, test.description);
    results.push(result);
  }

  console.log(`${colors.yellow}=================================${colors.reset}`);
  console.log(`${colors.yellow}  Resumen${colors.reset}`);
  console.log(`${colors.yellow}=================================${colors.reset}`);
  console.log('');

  const passed = results.filter(r => r).length;
  const total = results.length;
  const failed = total - passed;

  console.log(`Total de pruebas: ${colors.cyan}${total}${colors.reset}`);
  console.log(`Pasadas: ${colors.green}${passed}${colors.reset}`);
  console.log(`Fallidas: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
  console.log('');

  if (failed === 0) {
    console.log(`${colors.green}✓ Todas las pruebas pasaron correctamente${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ ${failed} prueba(s) fallaron${colors.reset}`);
  }

  console.log('');
  console.log(`${colors.yellow}Nota:${colors.reset} Para probar con un perfil real, edita este script`);
  console.log(`y agrega un slug válido de tu base de datos.`);
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

// Verificar que el servidor está corriendo
http.get(`http://${SERVER_HOST}:${SERVER_PORT}/health`, (res) => {
  if (res.statusCode === 200) {
    console.log(`${colors.green}✓ Servidor SSR está corriendo${colors.reset}`);
    console.log('');
    runTests();
  }
}).on('error', (error) => {
  console.log(`${colors.red}✗ No se pudo conectar al servidor SSR${colors.reset}`);
  console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}Asegúrate de que el servidor está corriendo:${colors.reset}`);
  console.log(`  npm start`);
  console.log('');
  process.exit(1);
});
