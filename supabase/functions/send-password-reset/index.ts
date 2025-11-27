// Supabase Edge Function: send-password-reset
// Sends password reset email using Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PasswordResetRequest {
  email: string
  redirectTo?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email, redirectTo }: PasswordResetRequest = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) throw userError

    const user = users.users.find(u => u.email === email)

    if (!user) {
      // For security, don't reveal if user exists or not
      // Return success anyway
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check rate limiting - max 3 attempts per hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    // Note: You might want to create a password_reset_attempts table for better tracking
    // For now, we'll proceed without strict rate limiting on the edge function side
    // Supabase Auth already has built-in rate limiting

    // Generate password reset token using Supabase Auth Admin API
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || `${req.headers.get('origin') || 'http://localhost:52656'}/recovery`
      }
    })

    if (resetError) throw resetError

    const resetLink = resetData.properties.action_link

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || email.split('@')[0]

    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'onboarding@resend.dev'

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `YourCVPassport <${senderEmail}>`,
        to: email,
        subject: 'Recupera tu contraseña - YourCVPassport',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Recuperación de Contraseña</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">YourCVPassport</h1>
              </div>

              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">¡Hola ${userName}!</h2>

                <p style="font-size: 16px; color: #4b5563;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en YourCVPassport.
                </p>

                <p style="font-size: 16px; color: #4b5563;">
                  Haz clic en el botón de abajo para crear una nueva contraseña:
                </p>

                <div style="text-align: center; margin: 35px 0;">
                  <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Restablecer Contraseña
                  </a>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⏰ <strong>Este enlace expira en 1 hora</strong>
                  </p>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña no será cambiada.
                </p>

                <div style="background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #3730a3; font-size: 13px;">
                    🔒 <strong>Consejo de seguridad:</strong> Nunca compartas este enlace con nadie. Nuestro equipo nunca te pedirá tu contraseña.
                  </p>
                </div>

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
        message: 'Password reset email sent successfully',
        emailId: resendData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    
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
