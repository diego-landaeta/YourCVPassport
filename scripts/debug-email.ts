import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_ANON_KEY')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set')
  Deno.exit(1)
}

console.log('Testing send-verification-email function...')
console.log('URL:', `${SUPABASE_URL}/functions/v1/send-verification-email`)

try {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: 'nangelm.dev@gmail.com',
      userId: 'test-debug-user' // This might fail if user doesn't exist, but we want to see IF the function runs
    })
  })

  console.log('Status:', response.status)
  console.log('Headers:', Object.fromEntries(response.headers.entries()))
  
  const text = await response.text()
  console.log('Body:', text)

} catch (error) {
  console.error('Fetch error:', error)
}
