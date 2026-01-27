import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://djehzlzombqrzzuchcef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

// Necesitamos la service role key para ejecutar operaciones administrativas
// Esta debe estar en las variables de entorno o configuración segura
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('ERROR: Se requiere SUPABASE_SERVICE_ROLE_KEY para ejecutar este script');
  console.error('Configúrala como variable de entorno o pásala como argumento');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateLauraProfile() {
  console.log('Iniciando actualización del perfil de Laura Martínez Vidal...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, 'sql', 'update-laura-complete-profile.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('Ejecutando script SQL...\n');

    // Ejecutar el SQL usando RPC o mediante queries individuales
    // Como el SQL contiene un bloque DO con múltiples operaciones,
    // necesitamos ejecutarlo de forma diferente

    // Primero, buscar el usuario
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'lauvidal123@gmail.com')
      .single();

    if (userError) {
      console.error('Error buscando usuario:', userError);
      // Intentar con una query directa
      const { data: authUsers, error: authError } = await supabase.rpc('get_user_by_email', {
        user_email: 'lauvidal123@gmail.com'
      });

      if (authError) {
        console.error('Error ejecutando RPC:', authError);
        console.log('\n⚠️  No se pudo encontrar el usuario con el cliente de Supabase.');
        console.log('Por favor, ejecuta el siguiente SQL manualmente en el SQL Editor de Supabase:\n');
        console.log('Archivo: scripts/sql/update-laura-complete-profile.sql\n');
        console.log('Instrucciones:');
        console.log('1. Ve a tu proyecto de Supabase Dashboard');
        console.log('2. Navega a SQL Editor');
        console.log('3. Copia y pega el contenido del archivo SQL');
        console.log('4. Ejecuta la query');
        return;
      }
    }

    console.log('✅ Usuario encontrado:', users?.email || 'lauvidal123@gmail.com');
    console.log('\n⚠️  Debido a las limitaciones del cliente de Supabase para ejecutar bloques PL/pgSQL,');
    console.log('necesitas ejecutar el SQL manualmente en el Dashboard de Supabase.\n');
    console.log('📋 PASOS A SEGUIR:\n');
    console.log('1. Abre tu proyecto en Supabase Dashboard');
    console.log('   URL: https://supabase.com/dashboard/project/djehzlzombqrzzuchcef');
    console.log('2. Ve a "SQL Editor" en el menú lateral');
    console.log('3. Haz clic en "New Query"');
    console.log('4. Copia y pega el contenido del archivo:');
    console.log('   scripts/sql/update-laura-complete-profile.sql');
    console.log('5. Haz clic en "Run" para ejecutar');
    console.log('6. Verifica los mensajes NOTICE que confirman cada paso\n');

  } catch (error) {
    console.error('Error durante la ejecución:', error);
  }
}

// Ejecutar
updateLauraProfile();
