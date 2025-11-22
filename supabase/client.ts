import { createClient } from '@supabase/supabase-js';

// --- INSTRUCCIONES IMPORTANTES ---
// Para que la aplicación funcione, necesitas reemplazar los siguientes valores
// con la URL y la llave anónima (anon key) de tu proyecto de Supabase.
// Puedes encontrar esta información en la configuración de tu proyecto en Supabase,
// en la sección "Configuración del Proyecto" -> "API".

const supabaseUrl = 'https://djehzlzombqrzzuchcef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so it survives page refreshes
    storage: window.localStorage,
    storageKey: 'yourcvpassport-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
