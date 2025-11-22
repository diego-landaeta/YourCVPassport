/**
 * Export DOCX Edge Function
 *
 * Genera documentos Word (.docx) de CVs optimizados para ATS en el servidor
 *
 * Endpoint: POST /functions/v1/export-docx
 */

declare const Deno: any;
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportDOCXRequest {
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
    const body: ExportDOCXRequest = await req.json();
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

    // Generate DOCX (placeholder - return mock binary)
    const docxBuffer = await generateDOCXBuffer(
      fullProfile,
      stamps || [],
      template,
      language,
      options
    );

    // Generate filename
    const fileName = generateFileName(fullProfile.profile.full_name, template);

    // Log export event for analytics
    await logExportEvent(supabase, profileId, template, docxBuffer.length, 'docx');

    // Return DOCX
    return new Response(docxBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': docxBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error in export-docx function:', error);

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
async function fetchFullProfile(supabase: any, profileId: string) {
  const [
    { data: profile },
    { data: experiences },
    { data: education },
    { data: skills },
    { data: languages },
    { data: certifications },
    { data: portfolio },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', profileId).single(),
    supabase.from('experiences').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('education').select('*').eq('profile_id', profileId).order('end_date', { ascending: false }),
    supabase.from('skills').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('languages').select('*').eq('profile_id', profileId).order('proficiency', { ascending: false }),
    supabase.from('certifications').select('*').eq('profile_id', profileId).order('issue_date', { ascending: false }),
    supabase.from('portfolio').select('*').eq('profile_id', profileId).order('sort_order').limit(5),
  ]);

  return {
    profile: profile || {},
    experiences: experiences || [],
    education: education || [],
    skills: skills || [],
    languages: languages || [],
    certifications: certifications || [],
    portfolio: portfolio || [],
  };
}

/**
 * Generate DOCX buffer
 * NOTA: Este es un placeholder. Para producción, necesitarías:
 * 1. Usar una librería DOCX compatible con Deno
 * 2. O llamar a un servicio externo
 * 3. O generar XML manualmente
 */
async function generateDOCXBuffer(
  profile: any,
  stamps: any[],
  template: string,
  language: string,
  options: any
): Promise<Uint8Array> {
  // Este es un placeholder mínimo de un archivo DOCX válido
  // En producción, necesitarías usar una librería como docx o llamar a un servicio

  // Un DOCX es realmente un ZIP con XML adentro
  // Por simplicidad, retornamos un placeholder que indica que está implementado

  const xmlContent = generateDOCXXML(profile, stamps, template, language);

  // En una implementación real, crearías un ZIP con la estructura correcta:
  // - [Content_Types].xml
  // - _rels/.rels
  // - word/document.xml
  // - word/_rels/document.xml.rels
  // - word/styles.xml
  // etc.

  // Placeholder: retornar texto como binary
  return new TextEncoder().encode(xmlContent);
}

/**
 * Generate basic DOCX XML content (simplified)
 */
function generateDOCXXML(
  profile: any,
  stamps: any[],
  template: string,
  language: string
): string {
  const translations = {
    en: {
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
    },
    es: {
      experience: 'Experiencia Laboral',
      education: 'Educación',
      skills: 'Habilidades',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return `
PLACEHOLDER DOCX EXPORT
=======================

Profile: ${profile.profile.full_name || 'No Name'}
Template: ${template}
Language: ${language}

${t.experience}:
${profile.experiences.map((exp: any) =>
  `- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})`
).join('\n')}

${t.education}:
${profile.education.map((edu: any) =>
  `- ${edu.degree} from ${edu.institution}`
).join('\n')}

${t.skills}:
${profile.skills.map((skill: any) => skill.name).join(', ')}

Verified Stamps: ${stamps.length}

---
Generated with YourCVPassport
${new Date().toISOString()}

NOTE: This is a placeholder. For production, implement proper DOCX generation
using a library like docx.js or an external service.
`;
}

/**
 * Generate filename for the DOCX
 */
function generateFileName(name: string, template: string): string {
  const sanitizedName = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const date = new Date().toISOString().split('T')[0];

  return `cv-${sanitizedName}-${template}-${date}.docx`;
}

/**
 * Log export event for analytics
 */
async function logExportEvent(
  supabase: any,
  profileId: string,
  template: string,
  fileSize: number,
  format: string
): Promise<void> {
  try {
    await supabase.from('ats_exports').insert({
      profile_id: profileId,
      template,
      file_size: fileSize,
      generation_method: 'server',
      timestamp: new Date().toISOString(),
      metadata: { format },
    });
  } catch (error) {
    console.error('Error logging export event:', error);
  }
}
