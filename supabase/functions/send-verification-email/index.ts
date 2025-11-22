// Supabase Edge Function: send-verification-email
// Sends email verification code using Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRequest {
  email: string
  userId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email, userId }: VerificationRequest = await req.json()

    if (!email || !userId) {
      throw new Error('Email and userId are required')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check rate limiting - max 3 attempts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAttempts, error: countError } = await supabase
      .from('verification_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('verification_type', 'EMAIL')
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

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store verification code with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Check if there's an existing pending stamp
    const { data: existingStamp, error: stampCheckError } = await supabase
      .from('stamps')
      .select('id')
      .eq('profile_id', userId)
      .eq('type', 'EMAIL')
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
            email,
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
          type: 'EMAIL',
          status: 'PENDING',
          evidence: {
            email,
            verification_code: verificationCode,
            expires_at: expiresAt,
            attempts: 0
          },
          provider: 'resend'
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
        verification_type: 'EMAIL',
        stamp_id: stampId,
        metadata: { email }
      })

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const userName = profile?.full_name || 'Usuario'

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'YourCVPassport <verify@yourcvpassport.com>',
        to: email,
        subject: 'Verifica tu email - YourCVPassport',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verificación de Email</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">YourCVPassport</h1>
              </div>

              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">¡Hola ${userName}!</h2>

                <p style="font-size: 16px; color: #4b5563;">
                  Has solicitado verificar tu dirección de email. Usa el siguiente código para completar la verificación:
                </p>

                <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                  <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                    Código de Verificación
                  </div>
                  <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${verificationCode}
                  </div>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⏰ <strong>Este código expira en 15 minutos</strong>
                  </p>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Si no solicitaste esta verificación, puedes ignorar este email de forma segura.
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                  © 2025 YourCVPassport. Todos los derechos reservados.<br>
                  Este es un email automático, por favor no respondas a este mensaje.
                </p>
              </div>
            </body>
          </html>
        `
      })
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.json()
      throw new Error(`Resend error: ${JSON.stringify(error)}`)
    }

    const resendData = await resendResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent successfully',
        stampId,
        emailId: resendData.id
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
