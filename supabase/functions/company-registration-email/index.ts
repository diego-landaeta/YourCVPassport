import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://yourcvpassport.com'

interface EmailRequest {
  companyId: string
  type: 'approved' | 'rejected'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { companyId, type }: EmailRequest = await req.json()

    if (!companyId || !type) {
      throw new Error('Missing required parameters: companyId and type')
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*, company_users!inner(user_id)')
      .eq('id', companyId)
      .single()

    if (companyError) {
      console.error('Error fetching company:', companyError)
      throw new Error(`Failed to fetch company: ${companyError.message}`)
    }

    if (!company) {
      throw new Error('Company not found')
    }

    // Get primary contact user email
    const userId = company.company_users[0]?.user_id
    if (!userId) {
      throw new Error('No user associated with company')
    }

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user?.email) {
      console.error('Error fetching user:', userError)
      throw new Error('Failed to fetch user email')
    }

    const userEmail = user.email

    // Prepare email content based on type
    let emailSubject: string
    let emailHtml: string

    if (type === 'approved') {
      emailSubject = `Welcome to YourCVPassport - Company Approved! 🎉`
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Company Approved</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1 style="margin: 0; font-size: 28px;">Company Approved!</h1>
              </div>

              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome to YourCVPassport, ${company.company_name}!</h2>

                <p>Great news! Your company registration has been approved by our team. You can now access the full company panel and start finding top talent.</p>

                <div class="info-box">
                  <strong>Company Details:</strong><br>
                  <strong>Name:</strong> ${company.company_name}<br>
                  <strong>Email:</strong> ${company.company_email}<br>
                  <strong>Tax ID:</strong> ${company.tax_id}
                </div>

                <h3 style="color: #1f2937;">What's Next?</h3>
                <ul style="line-height: 1.8;">
                  <li><strong>Purchase Credits:</strong> Buy credit packages to unlock candidate profiles</li>
                  <li><strong>Search Talent:</strong> Use advanced filters to find the perfect candidates</li>
                  <li><strong>Contact Candidates:</strong> Reach out directly to professionals</li>
                  <li><strong>Save Searches:</strong> Create saved searches with automated alerts</li>
                </ul>

                <div style="text-align: center;">
                  <a href="${APP_URL}/company/dashboard" class="button">Go to Company Dashboard</a>
                </div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  <strong>Need help getting started?</strong><br>
                  Contact our support team at <a href="mailto:support@yourcvpassport.com" style="color: #3b82f6;">support@yourcvpassport.com</a>
                </p>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} YourCVPassport. All rights reserved.</p>
                <p>
                  <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">Visit Website</a> |
                  <a href="${APP_URL}/help" style="color: #3b82f6; text-decoration: none;">Help Center</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    } else {
      // Rejected
      emailSubject = 'Company Registration Update - YourCVPassport'
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Update</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
              .icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">⚠️</div>
                <h1 style="margin: 0; font-size: 28px;">Registration Status Update</h1>
              </div>

              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Dear ${company.company_name},</h2>

                <p>Thank you for your interest in YourCVPassport. We've reviewed your company registration and unfortunately we're unable to approve it at this time.</p>

                <div class="warning-box">
                  <strong>Reason for rejection:</strong><br>
                  ${company.rejection_reason || 'Please contact support for more details.'}
                </div>

                <h3 style="color: #1f2937;">What can you do?</h3>
                <ul style="line-height: 1.8;">
                  <li>Review the rejection reason above</li>
                  <li>Gather any additional documentation or information</li>
                  <li>Contact our support team for clarification</li>
                  <li>Submit a new application with updated information</li>
                </ul>

                <div style="text-align: center;">
                  <a href="mailto:support@yourcvpassport.com" class="button">Contact Support</a>
                </div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  We're here to help! If you believe this is an error or need assistance, please don't hesitate to reach out to our team.
                </p>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} YourCVPassport. All rights reserved.</p>
                <p>
                  <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">Visit Website</a> |
                  <a href="mailto:support@yourcvpassport.com" style="color: #3b82f6; text-decoration: none;">support@yourcvpassport.com</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'YourCVPassport <noreply@yourcvpassport.com>',
        to: [userEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    console.log('Email sent successfully:', resendData)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${type} email sent successfully`,
        emailId: resendData.id,
        recipient: userEmail,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in company-registration-email function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
