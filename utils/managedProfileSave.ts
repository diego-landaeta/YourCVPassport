// ============================================================================
// Guardado de las secciones del CV para un profileId arbitrario.
//
// Reproduce la lógica de escritura de DashboardContent (handleIdentitySave,
// handleExperienceSave, etc.) pero parametrizada por `profileId`, para que el
// rol `profile_manager` pueda editar los perfiles que gestiona reutilizando el
// mismo ProfileWizard. Las escrituras quedan autorizadas por las políticas RLS
// "Managers manage managed profile <tabla>" (ver migración 20260301).
//
// Sólo contiene lógica de datos (sin estado React ni toasts): el componente
// que la use se encarga de la UI.
// ============================================================================

import { supabase } from '../supabase/client';
import { sanitizeSlug } from './slugUtils';

// Normaliza fechas YYYY-MM -> YYYY-MM-01; deja YYYY-MM-DD; resto -> null.
const formatDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  return null;
};

// Genera un slug único a partir del nombre (excluyendo el propio perfil).
async function generateUniqueSlug(profileId: string, fullName: string, currentSlug?: string | null): Promise<string | null | undefined> {
  const needsSlug =
    !currentSlug ||
    /-\d{6}$/.test(currentSlug) || // sufijo timestamp antiguo
    currentSlug === profileId; // es el UUID

  if (!needsSlug || !fullName) return currentSlug;

  let base = sanitizeSlug(fullName, 50);

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', base)
    .maybeSingle();

  if (existing && existing.id !== profileId) {
    let counter = 2;
    // Busca el primer sufijo libre
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate = `${base}-${counter}`;
      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!taken) {
        base = candidate;
        break;
      }
      counter++;
    }
  }
  return base;
}

export async function saveIdentity(profileId: string, data: any, currentSlug?: string | null): Promise<void> {
  const slug = await generateUniqueSlug(profileId, data.full_name, currentSlug);

  const updateData: any = {
    full_name: data.full_name,
    gender: data.gender,
    headline: data.headline,
    summary: data.summary,
    country_code: data.country_code,
    location: data.location,
    phone: data.phone,
    linkedin_url: data.linkedin_url,
    github_url: data.github_url,
    portfolio_url: data.portfolio_url,
    avatar_url: data.avatar_url,
    slug,
    updated_at: new Date().toISOString(),
  };
  if (data.remote !== undefined) updateData.remote = data.remote;

  const { error } = await supabase.from('profiles').update(updateData).eq('id', profileId);
  if (error) throw error;
}

export async function saveExperience(profileId: string, data: any[]): Promise<void> {
  await supabase.from('experiences').delete().eq('profile_id', profileId);
  if (data.length > 0) {
    const rows = data.map((exp, index) => ({
      profile_id: profileId,
      position: exp.position,
      company_name: exp.company_name,
      start_date: formatDate(exp.start_date),
      end_date: formatDate(exp.end_date),
      description: exp.description || '',
      achievements: exp.achievements || null,
      is_current: exp.is_current || false,
      location: exp.location || null,
      employment_type: exp.employment_type || null,
      verified: exp.verified || false,
      sort_order: index,
    }));
    const { error } = await supabase.from('experiences').insert(rows);
    if (error) throw error;
  }
}

export async function saveEducation(profileId: string, data: any[]): Promise<void> {
  await supabase.from('education').delete().eq('profile_id', profileId);
  if (data.length > 0) {
    const rows = data.map((edu, index) => ({
      profile_id: profileId,
      institution_name: edu.institution_name,
      degree: edu.degree,
      field_of_study: edu.field_of_study,
      start_date: formatDate(edu.start_date),
      end_date: formatDate(edu.end_date),
      description: edu.description || '',
      sort_order: index,
    }));
    const { error } = await supabase.from('education').insert(rows);
    if (error) throw error;
  }
}

export async function saveSkills(profileId: string, data: any[]): Promise<void> {
  const { error: deleteError } = await supabase.from('skills').delete().eq('profile_id', profileId);
  if (deleteError) throw deleteError;
  if (data.length > 0) {
    const rows = data.map((skill, index) => ({
      profile_id: profileId,
      name: skill.name,
      level: skill.level || null,
      years_of_experience: skill.years_of_experience || null,
      percentage: skill.percentage || null,
      sort_order: index,
    }));
    const { error } = await supabase.from('skills').insert(rows);
    if (error) throw error;
  }
}

export async function saveLanguages(profileId: string, data: any[]): Promise<void> {
  const { error: deleteError } = await supabase.from('languages').delete().eq('profile_id', profileId);
  if (deleteError) throw deleteError;
  if (data.length > 0) {
    const rows = data.map((lang, index) => ({
      profile_id: profileId,
      name: lang.name,
      level: lang.level,
      is_native: lang.is_native || lang.isNative || false,
      percentage: lang.percentage ?? null,
      sort_order: index,
    }));
    const { error } = await supabase.from('languages').insert(rows);
    if (error) throw error;
  }
}

export async function savePortfolio(profileId: string, data: any[]): Promise<void> {
  await supabase.from('portfolio_items').delete().eq('profile_id', profileId);
  if (data.length > 0) {
    const rows = data.map((item, index) => ({
      profile_id: profileId,
      title: item.title,
      description: item.description || null,
      type: item.type || 'PROJECT',
      category: item.category || null,
      url: item.url || null,
      image_url: item.image_url || null,
      file_url: item.file_url || null,
      issuer: item.issuer || null,
      issue_date: item.issue_date || null,
      expiry_date: item.expiry_date || null,
      credential_id: item.credential_id || null,
      credential_url: item.credential_url || null,
      organization: item.organization || null,
      role: item.role || null,
      start_date: item.start_date || null,
      end_date: item.end_date || null,
      is_current: item.is_current || null,
      collaborators: item.collaborators || null,
      sort_order: index,
      verified: item.verified || null,
    }));
    const { error } = await supabase.from('portfolio_items').insert(rows);
    if (error) throw error;
  }
}

export async function savePreferences(profileId: string, data: any): Promise<void> {
  const salary_min = data.salary_min && !isNaN(data.salary_min) ? data.salary_min : null;
  const salary_max = data.salary_max && !isNaN(data.salary_max) ? data.salary_max : null;

  const updateData = {
    job_seeking_status: data.job_seeking_status || null,
    job_type: data.job_type && data.job_type.length > 0 ? data.job_type : null,
    availability: data.availability || null,
    salary_min,
    salary_max,
    salary_currency: data.salary_currency || null,
    remote_preference: data.remote_preference || null,
    willing_to_relocate: data.willing_to_relocate || false,
    preferred_locations: data.preferred_locations && data.preferred_locations.length > 0 ? data.preferred_locations : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').update(updateData).eq('id', profileId);
  if (error) throw error;
}

// Carga todos los datos del CV de un perfil gestionado (para precargar el wizard).
export async function loadManagedProfileData(profileId: string) {
  const [
    { data: profile },
    { data: experiences },
    { data: education },
    { data: skills },
    { data: portfolio },
    { data: languages },
    { data: visas },
    { data: certifications },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', profileId).single(),
    supabase.from('experiences').select('*').eq('profile_id', profileId).order('start_date', { ascending: false }),
    supabase.from('education').select('*').eq('profile_id', profileId).order('start_date', { ascending: false }),
    supabase.from('skills').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
    supabase.from('portfolio_items').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
    supabase.from('languages').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
    supabase.from('visas').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
    supabase.from('certifications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
  ]);

  return {
    profile,
    experiences: experiences || [],
    education: education || [],
    skills: skills || [],
    portfolio: portfolio || [],
    languages: (languages || []).map((lang: any) => ({ ...lang, isNative: lang.is_native || false })),
    visas: visas || [],
    certifications: certifications || [],
  };
}
