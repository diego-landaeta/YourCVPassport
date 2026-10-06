// Supabase Edge Function: send-email-confirmation
// Sends email confirmation via Brevo (_shared/email.ts)
//
// Enlace del correo: <origen permitido>/confirm?token_hash=…&type=signup (dominio
// propio, sin supabase.co); ConfirmPage lo verifica con verifyOtp. Ver
// _shared/authLink.ts. redirectTo: solo un origen de la lista de CORS con path
// /confirm (resolveAuthRedirect en _shared/cors.ts); si no, el origen permitido de
// la petición o https://www.yourcvpassport.com. Antes el valor por defecto era
// http://localhost:52656 y se aceptaba cualquier redirectTo.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, resolveAuthRedirect } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/email.ts'
import { buildAuthEmailLink } from '../_shared/authLink.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailConfirmationRequest {
  email: string
  userId: string
  redirectTo?: string
}

// full_name lo controla el usuario y va dentro del HTML del correo.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const payload: EmailConfirmationRequest = await req.json()
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    const userId = typeof payload?.userId === 'string' ? payload.userId : ''

    if (!email || !userId) {
      throw new Error('Email and userId are required')
    }

    const redirectTo = resolveAuthRedirect(req, payload?.redirectTo, '/confirm')

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Generate email confirmation link using Supabase Auth Admin API
    const { data: confirmData, error: confirmError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: { redirectTo }
    })

    if (confirmError) throw confirmError

    // Enlace con el dominio propio, no el action_link de <proyecto>.supabase.co.
    const confirmationLink = buildAuthEmailLink(redirectTo, confirmData?.properties, 'signup')
    if (!confirmationLink) throw new Error('Could not generate confirmation link')

    // Nombre del perfil para personalizar. Se busca por el usuario del enlace
    // (el del email), no por el userId del cuerpo, que podría ser de otra cuenta.
    const linkUserId: string | undefined = confirmData.user?.id
    const { data: profile } = linkUserId
      ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', linkUserId)
        .maybeSingle()
      : { data: null }

    const userName = escapeHtml(profile?.full_name || email.split('@')[0])

    // Envío por Brevo (_shared/email.ts)
    const emailResult = await sendEmail({
      to: email,
      subject: '¡Bienvenido a YourCVPassport! Confirma tu email',
      tags: ['email-confirmation'],
      html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Confirma tu Email</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">YourCVPassport</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Tu CV Profesional Verificado</p>
              </div>

              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">¡Bienvenido ${userName}! 🎉</h2>

                <p style="font-size: 16px; color: #4b5563;">
                  Estamos emocionados de tenerte en YourCVPassport. Estás a un paso de crear tu CV profesional verificado.
                </p>

                <p style="font-size: 16px; color: #4b5563;">
                  Para comenzar, por favor confirma tu dirección de email haciendo clic en el botón de abajo:
                </p>

                <div style="text-align: center; margin: 35px 0;">
                  <a href="${confirmationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Confirmar Email
                  </a>
                </div>

                <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    ✨ <strong>¿Qué puedes hacer con YourCVPassport?</strong>
                  </p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                    <li>Crear CVs profesionales con plantillas modernas</li>
                    <li>Verificar tus credenciales y experiencia</li>
                    <li>Compartir tu perfil con un enlace único</li>
                    <li>Exportar en PDF y DOCX</li>
                  </ul>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⏰ <strong>Este enlace expira en 24 horas</strong>
                  </p>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Si no creaste una cuenta en YourCVPassport, puedes ignorar este email de forma segura.
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

    if (!emailResult.ok) {
      console.error('[send-email-confirmation] email send failed:', emailResult.code, emailResult.status, emailResult.detail)
      throw new Error(`Email send failed: ${emailResult.code}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Confirmation email sent successfully',
        emailId: emailResult.messageId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    
    return new Response(
      JSON.stringify({
        error: (error as any).message || 'An error occurred',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
