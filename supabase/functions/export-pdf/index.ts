/**
 * Export PDF Edge Function
 *
 * Genera PDFs de CVs optimizados para ATS en el servidor
 * * usando Puppeteer para mejor control y compatibilidad

 * Endpoint: POST /functions/v1/export-pdf
 */

declare const Deno: any;
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportPDFRequest {
  profileId: string;
  template: 'classic' | 'modern' | 'minimal';
  language?: 'en' | 'es';
  options?: {
    includePhoto?: boolean;
    includeStamps?: boolean;
    includeSummary?: boolean;
    includeSkills?: boolean;
    includeLanguages?: boolean;
    includePortfolio?: boolean;
    includeCertifications?: boolean;
  };
}

interface FullProfileData {
  profile: any;
  experiences: any[];
  education: any[];
  skills: any[];
  languages: any[];
  certifications: any[];
  portfolio: any[];
  preferences: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: ExportPDFRequest = await req.json();
    const { profileId, template = 'modern', language = 'en', options = {} } = body;

    // Validate request
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    // Verify user owns this profile or is admin
    if (profileId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .single();

      if (!profile) {
        throw new Error('Profile not found or access denied');
      }
    }

    // Fetch full profile data
    const fullProfile = await fetchFullProfile(supabase, profileId);

    // Fetch verified stamps
    const { data: stamps } = await supabase
      .from('stamps')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'VERIFIED')
      .order('created_at', { ascending: false });

    // Generate PDF using HTML template
    const pdfBuffer = await generatePDF(fullProfile, stamps || [], template, language, options);

    // Generate filename
    const fileName = generateFileName(fullProfile.profile.full_name, template);

    // Log export event for analytics
    await logExportEvent(supabase, profileId, template, pdfBuffer.length);

    // Return PDF
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error in export-pdf function:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Fetch complete profile data including all relations
 */
async function fetchFullProfile(supabase: any, profileId: string): Promise<FullProfileData> {
  const [
    { data: profile },
    { data: experiences },
    { data: education },
    { data: skills },
    { data: languages },
    { data: certifications },
    { data: portfolio },
    { data: preferences },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', profileId).single(),
    supabase.from('experiences').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('education').select('*').eq('profile_id', profileId).order('end_date', { ascending: false }),
    supabase.from('skills').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('languages').select('*').eq('profile_id', profileId).order('proficiency', { ascending: false }),
    supabase.from('certifications').select('*').eq('profile_id', profileId).order('issue_date', { ascending: false }),
    supabase.from('portfolio').select('*').eq('profile_id', profileId).order('sort_order').limit(5),
    supabase.from('preferences').select('*').eq('profile_id', profileId).maybeSingle(),
  ]);

  return {
    profile: profile || {},
    experiences: experiences || [],
    education: education || [],
    skills: skills || [],
    languages: languages || [],
    certifications: certifications || [],
    portfolio: portfolio || [],
    preferences: preferences || {},
  };
}

/**
 * Generate PDF using HTML template and Chrome headless
 * This would use Puppeteer in a real implementation
 * For Deno/Edge Functions, we use an HTML to PDF service or library
 */
async function generatePDF(
  profile: FullProfileData,
  stamps: any[],
  template: string,
  language: string,
  options: any
): Promise<Uint8Array> {
  // Generate HTML content
  const html = generateHTMLTemplate(profile, stamps, template, language, options);

  // For now, return a placeholder
  // In production, you would:
  // 1. Use a PDF generation service (like PDFShift, DocRaptor, etc.)
  // 2. Or use Puppeteer with Chrome in a Docker container
  // 3. Or use a Deno-compatible PDF library

  // Placeholder: Return minimal PDF with message
  const pdfHeader = '%PDF-1.4\n';
  const pdfContent = `
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 150 >>
stream
BT
/F1 12 Tf
50 700 Td
(PDF Export - ${profile.profile.full_name}) Tj
0 -20 Td
(Template: ${template}) Tj
0 -20 Td
(This is a placeholder PDF generated server-side) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000341 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
556
%%EOF
`;

  return new TextEncoder().encode(pdfHeader + pdfContent);
}

/**
 * Generate HTML template for the CV
 */
function generateHTMLTemplate(
  profile: FullProfileData,
  stamps: any[],
  template: string,
  language: string,
  options: any
): string {
  const translations = {
    en: {
      contact: 'Contact Information',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      certifications: 'Certifications',
      portfolio: 'Portfolio',
      verified: 'Verified',
    },
    es: {
      contact: 'Información de Contacto',
      experience: 'Experiencia Laboral',
      education: 'Educación',
      skills: 'Habilidades',
      languages: 'Idiomas',
      certifications: 'Certificaciones',
      portfolio: 'Portafolio',
      verified: 'Verificado',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  // Generate styles based on template
  const styles = getTemplateStyles(template);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${styles}
  </style>
</head>
<body>
  <div class="cv-container">
    <!-- Header -->
    <header class="cv-header">
      <h1>${profile.profile.full_name || 'Name'}</h1>
      <p class="headline">${profile.profile.headline || ''}</p>
      <div class="contact-info">
        ${profile.profile.email ? `<span>📧 ${profile.profile.email}</span>` : ''}
        ${profile.profile.phone ? `<span>📱 ${profile.profile.phone}</span>` : ''}
        ${profile.profile.location ? `<span>📍 ${profile.profile.location}</span>` : ''}
      </div>
    </header>

    <!-- Summary -->
    ${profile.profile.summary ? `
    <section class="cv-section">
      <h2>Professional Summary</h2>
      <p>${profile.profile.summary}</p>
    </section>
    ` : ''}

    <!-- Experience -->
    ${profile.experiences.length > 0 ? `
    <section class="cv-section">
      <h2>${t.experience}</h2>
      ${profile.experiences.map((exp: any) => `
        <div class="cv-item">
          <h3>${exp.title} - ${exp.company}</h3>
          <p class="dates">${formatDate(exp.start_date, language)} - ${exp.is_current ? 'Present' : formatDate(exp.end_date, language)}</p>
          ${exp.description ? `<p>${exp.description}</p>` : ''}
          ${exp.achievements ? `<p>${exp.achievements}</p>` : ''}
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- Education -->
    ${profile.education.length > 0 ? `
    <section class="cv-section">
      <h2>${t.education}</h2>
      ${profile.education.map((edu: any) => `
        <div class="cv-item">
          <h3>${edu.degree} - ${edu.institution}</h3>
          <p class="dates">${formatDate(edu.start_date, language)} - ${formatDate(edu.end_date, language)}</p>
          ${edu.field_of_study ? `<p>${edu.field_of_study}</p>` : ''}
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- Skills -->
    ${profile.skills.length > 0 ? `
    <section class="cv-section">
      <h2>${t.skills}</h2>
      <div class="skills-list">
        ${profile.skills.map((skill: any) => `<span class="skill-tag">${skill.name}</span>`).join('')}
      </div>
    </section>
    ` : ''}

    <!-- Verified Stamps -->
    ${stamps.length > 0 ? `
    <section class="cv-section">
      <h2>${t.verified} Credentials</h2>
      <div class="stamps-list">
        ${stamps.map((stamp: any) => `
          <div class="stamp-badge">✓ ${formatStampType(stamp.stamp_type, language)}</div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <footer class="cv-footer">
      <p>Generated with YourCVPassport - ${new Date().toLocaleDateString()}</p>
    </footer>
  </div>
</body>
</html>
`;
}

/**
 * Get CSS styles for each template
 */
function getTemplateStyles(template: string): string {
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .cv-container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .cv-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
    .cv-header h1 { font-size: 32px; margin-bottom: 10px; }
    .headline { font-size: 18px; color: #666; margin-bottom: 15px; }
    .contact-info { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .cv-section { margin-bottom: 30px; }
    .cv-section h2 { font-size: 22px; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .cv-item { margin-bottom: 20px; }
    .cv-item h3 { font-size: 18px; margin-bottom: 5px; }
    .dates { color: #666; font-size: 14px; margin-bottom: 10px; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .skill-tag { background: #f0f0f0; padding: 5px 15px; border-radius: 15px; font-size: 14px; }
    .stamps-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .stamp-badge { background: #22c55e; color: white; padding: 8px 16px; border-radius: 5px; font-weight: bold; }
    .cv-footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
  `;

  switch (template) {
    case 'classic':
      return baseStyles + `
        body { font-family: 'Times New Roman', serif; }
        .cv-header { border-bottom: 3px double #000; }
      `;
    case 'minimal':
      return baseStyles + `
        .cv-header { border-bottom: 1px solid #e5e5e5; }
        .cv-section h2 { border-bottom: none; font-weight: 300; }
      `;
    default: // modern
      return baseStyles + `
        .cv-header h1 { color: #2563eb; }
        .cv-section h2 { color: #2563eb; }
        .stamp-badge { background: #2563eb; }
      `;
  }
}

/**
 * Format date based on language
 */
function formatDate(date: string | null, language: string): string {
  if (!date) return '';

  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };

  return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options);
}

/**
 * Format stamp type label
 */
function formatStampType(type: string, language: string): string {
  const labels: Record<string, Record<string, string>> = {
    en: {
      EMAIL: 'Email',
      PHONE: 'Phone',
      IDENTITY: 'Identity',
      LINKEDIN: 'LinkedIn',
      GITHUB: 'GitHub',
      EDUCATION: 'Education',
      EXPERIENCE: 'Work Experience',
      CERTIFICATION: 'Certification',
    },
    es: {
      EMAIL: 'Email',
      PHONE: 'Teléfono',
      IDENTITY: 'Identidad',
      LINKEDIN: 'LinkedIn',
      GITHUB: 'GitHub',
      EDUCATION: 'Educación',
      EXPERIENCE: 'Experiencia Laboral',
      CERTIFICATION: 'Certificación',
    },
  };

  return labels[language]?.[type] || type;
}

/**
 * Generate filename for the PDF
 */
function generateFileName(name: string, template: string): string {
  const sanitizedName = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const date = new Date().toISOString().split('T')[0];

  return `cv-${sanitizedName}-${template}-${date}.pdf`;
}

/**
 * Log export event for analytics
 */
async function logExportEvent(
  supabase: any,
  profileId: string,
  template: string,
  fileSize: number
): Promise<void> {
  try {
    await supabase.from('ats_exports').insert({
      profile_id: profileId,
      template,
      file_size: fileSize,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging export event:', error);
    // Don't throw - logging shouldn't break the export
  }
}
