import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = 'https://djehzlzombqrzzuchcef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = 'nangelm.dev@gmail.com';

async function testFunction(name, payload) {
  console.log(`\nTesting ${name}...`);
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Success:', data.message || 'OK');
      if (data.emailId) console.log('   Email ID:', data.emailId);
    } else {
      console.log('❌ Error:', data.error || data);
      if (data.senderEmail) console.log('   Sender:', data.senderEmail);
      if (data.fromAddress) console.log('   From:', data.fromAddress);
    }
    return response.ok;
  } catch (error) {
    console.error('💥 Exception:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Auth Flow Tests');
  console.log('Target Email:', TEST_EMAIL);

  // 1. Test Magic Link
  await testFunction('send-magic-link', {
    email: TEST_EMAIL,
    redirectTo: 'http://localhost:52656/callback'
  });

  // 2. Test Password Reset
  await testFunction('send-password-reset', {
    email: TEST_EMAIL,
    redirectTo: 'http://localhost:52656/recovery'
  });

  // 3. Test Signup (might fail if user exists, which is expected)
  // Using a random email to ensure it works at least once, or just testing the existing one
  // to see the "User already exists" error which confirms the function runs.
  await testFunction('signup', {
    email: TEST_EMAIL,
    password: 'TestPassword123!',
    full_name: 'Test User',
    redirectTo: 'http://localhost:52656/confirm'
  });
  
  // 4. Test Email Confirmation (requires userId, skipping for now or need to fetch user first)
  // We can try to fetch the user ID if we had service role key, but client doesn't have it.
  // We'll skip this one for this simple script unless we want to login first.
}

runTests();
