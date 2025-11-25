
const SUPABASE_URL = 'https://djehzlzombqrzzuchcef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

async function testSignup() {
  // Use a random email to avoid "User already registered" if rollback fails or if we want a fresh test
  const uniqueId = Date.now();
  const email = `test.signup.${uniqueId}@example.com`; 
  const password = 'TestPassword123!';
  const fullName = 'Test User';

  console.log(`Testing signup for ${email}...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/signup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email,
        password,
        full_name: fullName,
        redirectTo: 'http://localhost:52656/confirm'
      })
    });

    const data = await response.json();
    console.log('Function status:', response.status);
    
    if (!response.ok) {
        console.log('❌ ERROR RESPONSE:');
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log('✅ SUCCESS RESPONSE:');
        console.log(JSON.stringify(data, null, 2));
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSignup();
