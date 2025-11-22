// Supabase Edge Function: verify-phone-code
// Verifies phone verification code

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  code: string
  userId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, userId }: VerifyRequest = await req.json()

    if (!code || !userId) {
      throw new Error('Code and userId are required')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find pending phone stamp for user
    const { data: stamp, error: stampError } = await supabase
      .from('stamps')
      .select('*')
      .eq('profile_id', userId)
      .eq('type', 'PHONE')
      .eq('status', 'PENDING')
      .single()

    if (stampError || !stamp) {
      return new Response(
        JSON.stringify({
          error: 'No pending phone verification found',
          code: 'NO_PENDING_VERIFICATION'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const evidence = stamp.evidence as any

    // Check if code has expired
    if (evidence.expires_at && new Date(evidence.expires_at) < new Date()) {
      await supabase
        .from('stamps')
        .update({ status: 'EXPIRED' })
        .eq('id', stamp.id)

      return new Response(
        JSON.stringify({
          error: 'Verification code has expired. Please request a new one.',
          code: 'CODE_EXPIRED'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check attempts (max 5)
    const attempts = evidence.attempts || 0
    if (attempts >= 5) {
      await supabase
        .from('stamps')
        .update({ status: 'REJECTED' })
        .eq('id', stamp.id)

      return new Response(
        JSON.stringify({
          error: 'Too many incorrect attempts. Please request a new code.',
          code: 'TOO_MANY_ATTEMPTS'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify code
    if (evidence.verification_code !== code) {
      // Increment attempts
      await supabase
        .from('stamps')
        .update({
          evidence: {
            ...evidence,
            attempts: attempts + 1
          }
        })
        .eq('id', stamp.id)

      return new Response(
        JSON.stringify({
          error: 'Invalid verification code',
          code: 'INVALID_CODE',
          attemptsRemaining: 5 - (attempts + 1)
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Code is correct - mark as verified
    const { error: updateError } = await supabase
      .from('stamps')
      .update({
        status: 'VERIFIED',
        verified_at: new Date().toISOString(),
        evidence: {
          phone: evidence.phone,
          verified: true
        }
      })
      .eq('id', stamp.id)

    if (updateError) throw updateError

    // Update profile verified_credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('verified_credentials')
      .eq('id', userId)
      .single()

    const verifiedCredentials = profile?.verified_credentials || []
    if (!verifiedCredentials.includes('phone')) {
      await supabase
        .from('profiles')
        .update({
          verified_credentials: [...verifiedCredentials, 'phone']
        })
        .eq('id', userId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Phone verified successfully',
        stampId: stamp.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
