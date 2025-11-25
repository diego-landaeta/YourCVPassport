import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = 'https://djehzlzombqrzzuchcef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPasswordReset() {
  const email = 'nangelm.dev@gmail.com'; // Usar el email del usuario
  console.log(`Testing send-password-reset for ${email}...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email,
        redirectTo: 'http://localhost:52656/recovery'
      })
    });

    const data = await response.json();
    console.log('Function status:', response.status);
    if (data.error) {
      console.log('FULL ERROR:', data.error);
    }
    console.log('Function response:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testPasswordReset();
