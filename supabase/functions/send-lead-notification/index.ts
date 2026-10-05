// Supabase Edge Function: send-lead-notification
//
// Seguridad (auditoría 2026-10-05, U4). Antes: sin autenticación, con CORS '*' y
// con sender_name / message del body metidos en el HTML sin escapar. Cualquiera
// con la anon key podía usarla de relay de spam/phishing desde
// notifications@yourcvpassport.com hacia el email de cualquier perfil.
//
// Hoy no la llama nadie (ni el frontend ni SQL: comprobado con grep), así que:
//   - Solo backend: Authorization: Bearer <service_role key>, comparada en
//     tiempo constante (mismo criterio que send-email). Un JWT de usuario o la
//     anon key -> 401/403.
//   - lead_id y profile_id deben ser UUID y el lead debe existir con
//     recipient_id = profile_id. Los datos del remitente salen del lead
//     guardado, no del body.
//   - Todo texto del usuario se escapa antes de entrar en el HTML; el asunto es
//     texto plano sin saltos de línea; sender_email validado (sirve de reply_to).
//   - CORS con la lista de _shared/cors.ts; errores { error, code } sin detalles.
//
// Contrato: POST { lead_id, profile_id } (el resto de campos se ignora)
//   200 { success, message, email_id } | 400 INVALID_INPUT | 401 UNAUTHORIZED |
//   403 FORBIDDEN | 404 NOT_FOUND | 500 INTERNAL_ERROR

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { getCorsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const MAX_BODY_BYTES = 8 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Sin caracteres que cambien al escapar: el mismo valor vale para HTML y reply_to.
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"'&]+@[^\s@<>()[\]\\,;:"'&]+\.[^\s@<>()[\]\\,;:"'&]{2,}$/;

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

// ¿Es la service_role key? 1) igual a la del entorno; 2) si no, solo una clave
// de servicio puede listar usuarios en la API admin de Auth (cubre rotaciones o
// claves sb_secret_ distintas de la inyectada). Igual que send-email.
async function isServiceRole(token: string): Promise<boolean> {
  if (!token) return false;
  if (SUPABASE_SERVICE_ROLE_KEY && timingSafeEqual(token, SUPABASE_SERVICE_ROLE_KEY)) return true;
  if (!SUPABASE_URL) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: { apikey: token, Authorization: `Bearer ${token}` },
    });
    await res.body?.cancel();
    return res.ok;
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  // 1. Solo service_role
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json(401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
  if (!(await isServiceRole(token))) return json(403, { error: 'Forbidden', code: 'FORBIDDEN' });

  try {
    // 2. Validar el cuerpo
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return json(413, { error: 'Payload too large', code: 'PAYLOAD_TOO_LARGE' });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { error: 'Invalid JSON', code: 'INVALID_INPUT' });
    }
    const lead_id = body?.lead_id;
    const profile_id = body?.profile_id;
    if (typeof lead_id !== 'string' || !UUID_RE.test(lead_id) || typeof profile_id !== 'string' || !UUID_RE.test(profile_id)) {
      return json(400, { error: 'lead_id and profile_id must be UUIDs', code: 'INVALID_INPUT' });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. El lead tiene que existir y ser de ese perfil
    const { data: lead } = await supabase
      .from('leads')
      .select('id, recipient_id, sender_name, sender_email, message')
      .eq('id', lead_id)
      .maybeSingle();

    if (!lead || lead.recipient_id !== profile_id) {
      return json(404, { error: 'Lead not found', code: 'NOT_FOUND' });
    }

    const rawSenderEmail = typeof lead.sender_email === 'string' ? lead.sender_email.trim() : '';
    if (!EMAIL_RE.test(rawSenderEmail) || rawSenderEmail.length > 254) {
      return json(400, { error: 'Invalid sender email', code: 'INVALID_INPUT' });
    }

    // Get profile owner's email
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', profile_id)
      .maybeSingle();

    if (!ownerProfile) {
      return json(404, { error: 'Profile not found', code: 'NOT_FOUND' });
    }

    if (!ownerProfile.email) {
      return json(400, { error: 'Profile has no email address', code: 'NO_RECIPIENT' });
    }

    // Valores que entran en el HTML: escapados. profile.email solo va en `to`.
    const plainSenderName = String(lead.sender_name ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 255);
    const sender_name = escapeHtml(plainSenderName);
    const sender_email = rawSenderEmail;
    const message = escapeHtml(String(lead.message ?? '').slice(0, 5000));
    const profile = {
      email: ownerProfile.email as string,
      full_name: ownerProfile.full_name ? escapeHtml(String(ownerProfile.full_name)) : '',
    };

    // Prepare email content (asunto en texto plano; en el <title> va escapado)
    const emailSubject = `New message from ${plainSenderName}`;
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #0052FF, #4F46E5); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">
                New Lead from Your Profile
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Someone is interested in connecting with you
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px;">
                Hi ${profile.full_name || 'there'},
              </p>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px;">
                You've received a new message through your YourCVPassport profile!
              </p>

              <!-- Lead Info Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                          From
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                            ${sender_name}
                          </p>
                          <p style="margin: 4px 0 0; color: #4b5563; font-size: 14px;">
                            ${sender_email}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                          Message
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${message}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <a href="https://www.yourcvpassport.com/dashboard/leads"
                       style="display: inline-block; background: linear-gradient(to right, #0052FF, #4F46E5); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Reply Instructions -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: #eff6ff; border-left: 4px solid #0052FF; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                      <strong>Quick Reply:</strong> You can reply directly to ${sender_email} or manage this lead from your dashboard.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Best regards,<br>
                The YourCVPassport Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} YourCVPassport. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                You're receiving this email because you have a profile on YourCVPassport.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'YourCVPassport <notifications@yourcvpassport.com>',
        to: [profile.email],
        reply_to: sender_email,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      
      throw new Error(`Failed to send email: ${error}`);
    }

    const resendData = await resendResponse.json();

    return json(200, {
      success: true,
      message: 'Lead notification sent successfully',
      email_id: resendData.id
    });

  } catch (error: any) {
    console.error('[send-lead-notification] error interno:', error?.message);
    return json(500, { error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});
