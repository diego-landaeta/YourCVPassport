import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = 're_Ancd1uP3_2VPxp32mKewFD61LvVPPny61';

async function checkDomains() {
  console.log('Checking Resend domains...');
  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Domains:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDomains();
