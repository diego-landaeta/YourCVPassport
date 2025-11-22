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
  let completeness = 0;

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
  } else {
    completeness += 20;
  }

  if (!profile.headline || profile.headline.trim() === '') {
    missingFields.push('Título profesional');
  } else {
    completeness += 15;
  }

  // Campos importantes
  if (!profile.summary || profile.summary.trim() === '') {
    warnings.push('Resumen profesional');
    completeness += 5; // Dar algo de crédito aunque esté vacío
  } else {
    completeness += 15;
  }

  if (!profile.location || profile.location.trim() === '') {
    warnings.push('Ubicación');
  } else {
    completeness += 5;
  }

  if (!profile.phone || profile.phone.trim() === '') {
    warnings.push('Teléfono');
  } else {
    completeness += 5;
  }

  if (!profile.avatar_url) {
    warnings.push('Foto de perfil');
  } else {
    completeness += 10;
  }

  // Redes sociales (al menos una)
  if (!profile.linkedin_url && !profile.github_url && !profile.portfolio_url) {
    warnings.push('Al menos una red social (LinkedIn, GitHub o Portfolio)');
  } else {
    completeness += 5;
  }

  // Experiencia laboral
  if (!experiences || experiences.length === 0) {
    missingFields.push('Experiencia laboral (al menos una)');
  } else {
    completeness += 15;
  }

  // Educación
  if (!education || education.length === 0) {
    warnings.push('Educación');
  } else {
    completeness += 5;
  }

  // Habilidades
  if (!skills || skills.length === 0) {
    warnings.push('Habilidades');
  } else {
    completeness += 5;
  }

  // Idiomas
  if (!languages || languages.length === 0) {
    warnings.push('Idiomas');
  } else {
    completeness += 5;
  }

  const isValid = missingFields.length === 0;

  return {
    isValid,
    missingFields,
    warnings,
    completeness: Math.min(completeness, 100),
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
