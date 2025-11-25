import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = 'https://djehzlzombqrzzuchcef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEmail(functionName) {
  console.log(`\nTesting ${functionName}...`);
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  console.log('URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: 'nangelm.dev@gmail.com',
        userId: '00000000-0000-0000-0000-000000000000' // Valid UUID format
      })
    });

    console.log('Status:', response.status);
    
    const text = await response.text();
    console.log('Body:', text);

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function runTests() {
  await testEmail('send-verification-email');
}

runTests();
