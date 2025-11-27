// Supabase Edge Function: send-magic-link
// Sends magic link for passwordless authentication using Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MagicLinkRequest {
  email: string
  redirectTo?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email, redirectTo }: MagicLinkRequest = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) throw userError

    const user = users.users.find((u: any) => u.email === email)

    // Generate magic link using Supabase Auth Admin API
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectTo || `${req.headers.get('origin') || 'http://localhost:52656'}/callback`
      }
    })

    if (magicLinkError) throw magicLinkError

    const magicLink = magicLinkData.properties.action_link

    // Get user profile for personalization (if user exists)
    let userName = email.split('@')[0]
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      userName = profile?.full_name || userName
    }

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
        subject: 'Tu enlace de acceso a YourCVPassport',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Magic Link - Acceso Rápido</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">YourCVPassport</h1>
              </div>

              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">¡Hola ${userName}! 👋</h2>

                <p style="font-size: 16px; color: #4b5563;">
                  Has solicitado un enlace mágico para acceder a tu cuenta de YourCVPassport sin necesidad de contraseña.
                </p>

                <p style="font-size: 16px; color: #4b5563;">
                  Haz clic en el botón de abajo para iniciar sesión de forma segura:
                </p>

                <div style="text-align: center; margin: 35px 0;">
                  <a href="${magicLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    ✨ Acceder a mi Cuenta
                  </a>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⏰ <strong>Este enlace expira en 1 hora</strong>
                  </p>
                </div>

                <div style="background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #3730a3; font-size: 13px;">
                    🔒 <strong>Consejo de seguridad:</strong> Este enlace es de un solo uso y solo funciona en el dispositivo desde el que lo solicitaste. Nunca lo compartas con nadie.
                  </p>
                </div>

                <div style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Si no solicitaste este enlace, puedes ignorar este email de forma segura. Nadie podrá acceder a tu cuenta sin este enlace.
                </div>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; font-weight: bold;">
                    💡 ¿Prefieres usar contraseña?
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 13px;">
                    Puedes iniciar sesión con tu email y contraseña en cualquier momento desde nuestra página de login.
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
        message: 'Magic link sent successfully',
        emailId: resendData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    
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
