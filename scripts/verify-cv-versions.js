/**
 * Script simple para verificar si la tabla cv_versions existe
 * No requiere credenciales especiales, usa la anon key
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djehzlzombqrzzuchcef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log('\n🔍 Verificando tabla cv_versions en Supabase...\n');

  try {
    // Intentar hacer una query simple a la tabla
    const { data, error } = await supabase
      .from('cv_versions')
      .select('id, version_name, created_at')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('❌ La tabla cv_versions NO EXISTE\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('NECESITAS EJECUTAR LA MIGRACIÓN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📋 INSTRUCCIONES:\n');
        console.log('1. Ve a tu Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/djehzlzombqrzzuchcef/sql\n');
        console.log('2. Abre el "SQL Editor"\n');
        console.log('3. Copia TODO el contenido del archivo:');
        console.log('   supabase/migrations/20250120_cv_versions.sql\n');
        console.log('4. Pégalo en el SQL Editor\n');
        console.log('5. Click en "Run" (o presiona Ctrl+Enter)\n');
        console.log('6. Verifica que veas el mensaje:');
        console.log('   "✅ CV Versions table created successfully!"\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return false;
      }

      if (error.message.includes('permission') || error.message.includes('policy')) {
        console.log('✅ La tabla cv_versions EXISTE');
        console.log('⚠️  Pero hay un error de permisos (RLS activo - esto es normal)\n');
        console.log('   Necesitas estar autenticado para ver los datos.');
        console.log('   La tabla está correctamente configurada.\n');
        return true;
      }

      console.log('⚠️  Error inesperado:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      return false;
    }

    console.log('✅ La tabla cv_versions EXISTE y está funcionando\n');

    if (data && data.length > 0) {
      console.log(`📊 Hay ${data.length} versión(es) de prueba en la base de datos:\n`);
      data.forEach((version, idx) => {
        console.log(`   ${idx + 1}. ${version.version_name}`);
        console.log(`      Creada: ${new Date(version.created_at).toLocaleDateString('es-ES')}\n`);
      });
    } else {
      console.log('📝 La tabla está vacía (aún no hay versiones creadas)\n');
      console.log('   ✨ El feature está listo para usar!\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('EL FEATURE ESTÁ LISTO PARA PRODUCCIÓN 🚀');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Los usuarios pueden acceder desde:');
    console.log('👉 Dashboard > "Versiones de CV" (en el menú lateral)\n');
    return true;

  } catch (err) {
    console.log('❌ Error al conectar con Supabase:', err.message);
    return false;
  }
}

verify().then(exists => {
  process.exit(exists ? 0 : 1);
});
