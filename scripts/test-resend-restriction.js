import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = 'https://djehzlzombqrzzuchcef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The error message suggested this is the only allowed recipient in testing mode
const ALLOWED_EMAIL = 'support@yourcvpassport.com';

async function testAllowedEmail() {
  console.log(`\nTesting send-magic-link to ALLOWED email: ${ALLOWED_EMAIL}...`);
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: ALLOWED_EMAIL,
        redirectTo: 'http://localhost:52656/callback'
      })
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Success! Email sent to authorized address.');
      console.log('   Email ID:', data.emailId);
    } else {
      console.log('❌ Error:', data.error || data);
      if (data.senderEmail) console.log('   Sender:', data.senderEmail);
    }
  } catch (error) {
    console.error('💥 Exception:', error.message);
  }
}

testAllowedEmail();
