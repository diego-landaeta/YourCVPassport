import { Profile } from '../types';

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
  completeness: number;
}

export interface MissingFieldInfo {
  field: string;
  label: string;
  section: string;
  priority: 'critical' | 'important' | 'optional';
}

/**
 * FUNCIÓN ÚNICA Y CENTRALIZADA para calcular el completeness del perfil
 *
 * ⚠️ IMPORTANTE: Esta es la ÚNICA fuente de verdad para el cálculo del completeness
 * No usar cálculos ad-hoc en otros archivos - siempre usar esta función
 *
 * Distribución de puntos (total 100%):
 *
 * CAMPOS CRÍTICOS (60%):
 * - Nombre completo: 15% (CRÍTICO)
 * - Título profesional: 15% (CRÍTICO)
 * - Resumen/About me: 10%
 * - Foto de perfil: 10%
 * - Al menos 1 experiencia: 10% (CRÍTICO)
 *
 * CAMPOS IMPORTANTES (40%):
 * - Al menos 1 educación: 15%
 * - Al menos 3 skills: 20%
 * - Al menos 1 idioma: 5%
 *
 * NOTA: Ubicación, teléfono, portfolio, template y slug NO suman (son opcionales)
 */
export const calculateProfileCompleteness = (
  profile: any | null,
  counts: {
    experiences?: number;
    education?: number;
    skills?: number;
    languages?: number;
    portfolio?: number;
  } = {}
): number => {
  if (!profile) return 0;

  let completeness = 0;
  const debug: string[] = [];

  // Campos críticos del perfil (60%)
  if (profile.full_name?.trim()) {
    completeness += 15;
    debug.push('✅ Nombre: +15%');
  } else {
    debug.push('❌ Nombre: 0%');
  }

  if (profile.headline?.trim()) {
    completeness += 15;
    debug.push('✅ Título: +15%');
  } else {
    debug.push('❌ Título: 0%');
  }

  if (profile.summary?.trim()) {
    completeness += 10;
    debug.push('✅ Summary: +10%');
  } else {
    debug.push('❌ Summary: 0%');
  }

  if (profile.avatar_url) {
    completeness += 10;
    debug.push('✅ Avatar: +10%');
  } else {
    debug.push('❌ Avatar: 0%');
  }

  if (counts.experiences && counts.experiences > 0) {
    completeness += 10;
    debug.push(`✅ Experiencias (${counts.experiences}): +10%`);
  } else {
    debug.push('❌ Experiencias: 0%');
  }

  // Campos importantes (40%)
  if (counts.education && counts.education > 0) {
    completeness += 15;
    debug.push(`✅ Educación (${counts.education}): +15%`);
  } else {
    debug.push('❌ Educación: 0%');
  }

  if (counts.skills && counts.skills >= 3) {
    completeness += 20;
    debug.push(`✅ Skills (${counts.skills}): +20%`);
  } else {
    debug.push(`❌ Skills (${counts.skills || 0}): 0% (necesitas al menos 3)`);
  }

  if (counts.languages && counts.languages > 0) {
    completeness += 5;
    debug.push(`✅ Idiomas (${counts.languages}): +5%`);
  } else {
    debug.push('❌ Idiomas: 0%');
  }

  // NOTA: Ubicación, teléfono, portfolio, template y slug NO suman (son opcionales)

  console.log('📊 CÁLCULO DE COMPLETENESS:');
  debug.forEach(line => console.log(line));
  console.log(`🎯 TOTAL: ${completeness}%`);

  return Math.min(completeness, 100);
};

/**
 * Valida si el perfil tiene todos los datos necesarios para mostrar un CV
 */
export const validateProfileForCV = (
  profile: Profile | null,
  experiences?: any[],
  education?: any[],
  skills?: any[],
  languages?: any[]
): ValidationResult => {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!profile) {
    return {
      isValid: false,
      missingFields: ['Perfil no encontrado'],
      warnings: [],
      completeness: 0,
    };
  }

  // Campos críticos (necesarios para mostrar el CV)
  if (!profile.full_name || profile.full_name.trim() === '') {
    missingFields.push('Nombre completo');
  }

  if (!profile.headline || profile.headline.trim() === '') {
    missingFields.push('Título profesional');
  }

  // Campos importantes
  if (!profile.summary || profile.summary.trim() === '') {
    warnings.push('Resumen profesional');
  }

  if (!profile.location || profile.location.trim() === '') {
    warnings.push('Ubicación');
  }

  if (!profile.phone || profile.phone.trim() === '') {
    warnings.push('Teléfono');
  }

  if (!profile.avatar_url) {
    warnings.push('Foto de perfil');
  }

  // Redes sociales (al menos una)
  if (!profile.linkedin_url && !profile.github_url && !profile.portfolio_url) {
    warnings.push('Al menos una red social (LinkedIn, GitHub o Portfolio)');
  }

  // Experiencia laboral
  if (!experiences || experiences.length === 0) {
    missingFields.push('Experiencia laboral (al menos una)');
  }

  // Educación
  if (!education || education.length === 0) {
    warnings.push('Educación');
  }

  // Habilidades
  if (!skills || skills.length === 0) {
    warnings.push('Habilidades');
  }

  // Idiomas
  if (!languages || languages.length === 0) {
    warnings.push('Idiomas');
  }

  const isValid = missingFields.length === 0;

  // Usar la función centralizada para calcular completeness
  const completeness = calculateProfileCompleteness(profile, {
    experiences: experiences?.length || 0,
    education: education?.length || 0,
    skills: skills?.length || 0,
    languages: languages?.length || 0,
  });

  return {
    isValid,
    missingFields,
    warnings,
    completeness,
  };
};

/**
 * Obtiene información detallada de los campos faltantes
 */
export const getMissingFieldsInfo = (
  profile: Profile | null,
  experiences?: any[],
  education?: any[],
  skills?: any[],
  languages?: any[]
): MissingFieldInfo[] => {
  const missing: MissingFieldInfo[] = [];

  if (!profile) {
    return missing;
  }

  // Campos críticos
  if (!profile.full_name || profile.full_name.trim() === '') {
    missing.push({
      field: 'full_name',
      label: 'Nombre completo',
      section: 'identity',
      priority: 'critical',
    });
  }

  if (!profile.headline || profile.headline.trim() === '') {
    missing.push({
      field: 'headline',
      label: 'Título profesional',
      section: 'identity',
      priority: 'critical',
    });
  }

  if (!experiences || experiences.length === 0) {
    missing.push({
      field: 'experiences',
      label: 'Experiencia laboral',
      section: 'experience',
      priority: 'critical',
    });
  }

  // Campos importantes
  if (!profile.summary || profile.summary.trim() === '') {
    missing.push({
      field: 'summary',
      label: 'Resumen profesional',
      section: 'identity',
      priority: 'important',
    });
  }

  if (!profile.location || profile.location.trim() === '') {
    missing.push({
      field: 'location',
      label: 'Ubicación',
      section: 'identity',
      priority: 'important',
    });
  }

  if (!profile.phone || profile.phone.trim() === '') {
    missing.push({
      field: 'phone',
      label: 'Teléfono',
      section: 'identity',
      priority: 'important',
    });
  }

  if (!profile.avatar_url) {
    missing.push({
      field: 'avatar_url',
      label: 'Foto de perfil',
      section: 'identity',
      priority: 'important',
    });
  }

  if (!profile.linkedin_url && !profile.github_url && !profile.portfolio_url) {
    missing.push({
      field: 'social_links',
      label: 'Redes sociales',
      section: 'identity',
      priority: 'important',
    });
  }

  // Campos opcionales
  if (!education || education.length === 0) {
    missing.push({
      field: 'education',
      label: 'Educación',
      section: 'education',
      priority: 'optional',
    });
  }

  if (!skills || skills.length === 0) {
    missing.push({
      field: 'skills',
      label: 'Habilidades',
      section: 'skills',
      priority: 'optional',
    });
  }

  if (!languages || languages.length === 0) {
    missing.push({
      field: 'languages',
      label: 'Idiomas',
      section: 'languages',
      priority: 'optional',
    });
  }

  return missing;
};

/**
 * Genera un mensaje amigable sobre los campos faltantes
 */
export const getValidationMessage = (validation: ValidationResult): string => {
  if (validation.isValid) {
    if (validation.warnings.length > 0) {
      return `Tu CV está listo, pero podrías mejorarlo agregando: ${validation.warnings.join(', ')}.`;
    }
    return '¡Tu CV está completo y listo para compartir!';
  }

  const critical = validation.missingFields;
  const warnings = validation.warnings;

  let message = 'Para mostrar tu CV necesitas completar:\n\n';
  
  if (critical.length > 0) {
    message += `📋 Campos obligatorios:\n${critical.map(f => `• ${f}`).join('\n')}\n`;
  }

  if (warnings.length > 0) {
    message += `\n💡 Campos recomendados:\n${warnings.map(f => `• ${f}`).join('\n')}`;
  }

  return message;
};
