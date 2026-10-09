/**
 * Export DOCX Edge Function
 *
 * Genera documentos Word (.docx) de CVs optimizados para ATS en el servidor
 *
 * Endpoint: POST /functions/v1/export-docx
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { getCorsHeaders } from '../_shared/cors.ts';

// Seguridad (auditoría 2026-10-05, U4). Antes: CORS '*' y, si profileId no era
// el del usuario, solo se comprobaba que el perfil existiera y se exportaba
// completo con service role (IDOR: cualquier usuario descargaba el CV de otro,
// con email, teléfono, etc.). Ahora solo se exporta:
//   - el perfil propio,
//   - un perfil gestionado por el llamante (profiles.managed_by = user.id,
//     mismo criterio que is_managed_profile),
//   - cualquiera si el llamante es admin (mismo criterio que current_user_is_admin).
// Si no -> 403 FORBIDDEN (también si el perfil no existe: no revela ids).
// Errores { error, code } sin detalles internos: 400 INVALID_INPUT,
// 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND (admin), 500 INTERNAL_ERROR.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEMPLATES = ['classic', 'modern', 'minimal'];
const LANGUAGES = ['en', 'es'];

class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ¿Puede el llamante exportar este perfil?
async function assertCanExport(supabase: any, callerId: string, profileId: string): Promise<void> {
  if (profileId === callerId) return;
  const [{ data: target }, { data: caller }] = await Promise.all([
    supabase.from('profiles').select('id, managed_by').eq('id', profileId).maybeSingle(),
    supabase.from('profiles').select('role').eq('id', callerId).maybeSingle(),
  ]);
  if (target && target.managed_by && target.managed_by === callerId) return;
  const isAdmin = typeof caller?.role === 'string' && caller.role.toLowerCase() === 'admin';
  if (isAdmin) {
    if (!target) throw new HttpError(404, 'NOT_FOUND', 'Profile not found');
    return;
  }
  throw new HttpError(403, 'FORBIDDEN', 'Not allowed to export this profile');
}

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
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify JWT token
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Missing authorization');
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired session');
    }

    // Parse request body
    let body: ExportDOCXRequest;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body');
    }
    const { profileId, template = 'modern', language = 'en' } = body ?? ({} as ExportDOCXRequest);
    const options = body?.options && typeof body.options === 'object' ? body.options : {};

    // Validate request
    if (typeof profileId !== 'string' || !UUID_RE.test(profileId)) {
      throw new HttpError(400, 'INVALID_INPUT', 'Profile ID is required');
    }
    if (!TEMPLATES.includes(template) || !LANGUAGES.includes(language)) {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid template or language');
    }

    // Solo perfil propio, gestionado o (admin) cualquiera
    await assertCanExport(supabase, user.id, profileId);

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
    const docxBuffer = await generateDOCXBuffer(fullProfile, stamps || [], template, language, options);

    // Generate filename
    const fileName = generateFileName(fullProfile.profile.full_name || 'perfil', template);

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
    const httpError = error instanceof HttpError
      ? error
      : new HttpError(500, 'INTERNAL_ERROR', 'Internal server error');
    if (!(error instanceof HttpError)) console.error('[export-docx] error interno:', (error as Error)?.message);

    return new Response(
      JSON.stringify({ error: httpError.message, code: httpError.code }),
      {
        status: httpError.status,
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
    
  }
}
