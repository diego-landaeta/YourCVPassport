// Supabase Edge Function: send-verification-sms
// Sends phone verification code using Twilio

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRequest {
  phone: string
  userId: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, userId }: VerificationRequest = await req.json()

    if (!phone || !userId) {
      throw new Error('Phone and userId are required')
    }

    // Validate phone format (basic E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid phone format. Please use E.164 format (e.g., +1234567890)',
          code: 'INVALID_PHONE_FORMAT'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check rate limiting - max 3 attempts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAttempts, error: countError } = await supabase
      .from('verification_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('verification_type', 'PHONE')
      .gte('created_at', oneHourAgo)

    if (countError) throw countError

    if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait before requesting another code.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for required environment variables
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      
      throw new Error('Server configuration error: Missing SMS provider keys')
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store verification code with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Check if there's an existing pending stamp
    const { data: existingStamp, error: stampCheckError } = await supabase
      .from('stamps')
      .select('id')
      .eq('profile_id', userId)
      .eq('type', 'PHONE')
      .eq('status', 'PENDING')
      .single()

    if (stampCheckError && stampCheckError.code !== 'PGRST116') {
      throw stampCheckError
    }

    let stampId: string

    if (existingStamp) {
      // Update existing stamp
      const { data: updatedStamp, error: updateError } = await supabase
        .from('stamps')
        .update({
          evidence: {
            phone,
            verification_code: verificationCode,
            expires_at: expiresAt,
            attempts: 0
          }
        })
        .eq('id', existingStamp.id)
        .select('id')
        .single()

      if (updateError) throw updateError
      stampId = updatedStamp.id
    } else {
      // Create new stamp
      const { data: newStamp, error: createError } = await supabase
        .from('stamps')
        .insert({
          profile_id: userId,
          type: 'PHONE',
          status: 'PENDING',
          evidence: {
            phone,
            verification_code: verificationCode,
            expires_at: expiresAt,
            attempts: 0
          },
          provider: 'twilio'
        })
        .select('id')
        .single()

      if (createError) throw createError
      stampId = newStamp.id
    }

    // Log verification attempt
    await supabase
      .from('verification_attempts')
      .insert({
        user_id: userId,
        verification_type: 'PHONE',
        stamp_id: stampId,
        metadata: { phone }
      })

    

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const formData = new URLSearchParams()
    formData.append('To', phone)
    formData.append('From', TWILIO_PHONE_NUMBER)
    formData.append('Body', `Tu código de verificación de YourCVPassport es: ${verificationCode}\n\nEste código expira en 10 minutos.`)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
      },
      body: formData.toString()
    })

    if (!twilioResponse.ok) {
      const error = await twilioResponse.json()
      
      throw new Error(`Twilio error: ${JSON.stringify(error)}`)
    }

    const twilioData = await twilioResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent successfully',
        stampId,
        messageSid: twilioData.sid
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        code: 'INTERNAL_ERROR',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
