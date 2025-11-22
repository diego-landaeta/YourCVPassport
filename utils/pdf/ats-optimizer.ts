/**
 * ATS Optimization Utilities
 *
 * Funciones para optimizar el contenido del CV para sistemas ATS
 * (Applicant Tracking Systems)
 */

import {
  FullProfileData,
  Experience,
  Education,
  Skill,
  Certification,
  Language,
  Stamp,
  StampType,
  StampStatus,
} from '../../types';
import {
  ATSTemplateType,
  ATSTemplateConfig,
  ATSSectionConfig,
  ATSSectionType,
  ATSProcessedData,
  ATSFontConfig,
  ATSColorConfig,
  ATSSpacingConfig,
} from '../../types/ats-export.types';

/**
 * Configuraciones predefinidas de plantillas ATS
 */
export const ATS_TEMPLATE_CONFIGS: Record<ATSTemplateType, ATSTemplateConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional serif fonts, black & white, conservative layout',
    font: {
      family: 'Times-Roman',
      size: {
        h1: 18,
        h2: 14,
        h3: 12,
        body: 11,
        small: 9,
      },
      lineHeight: 1.5,
    },
    colors: {
      primary: '#000000',
      secondary: '#333333',
      text: '#000000',
      muted: '#666666',
    },
    spacing: {
      pageMargin: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      },
      sectionGap: 20,
      itemGap: 12,
      lineGap: 6,
    },
    showStamps: true,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sans-serif, subtle color accents, professional',
    font: {
      family: 'Helvetica',
      size: {
        h1: 20,
        h2: 14,
        h3: 12,
        body: 10,
        small: 9,
      },
      lineHeight: 1.6,
    },
    colors: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      accent: '#2563eb', // Blue accent
      text: '#1a1a1a',
      muted: '#6b7280',
    },
    spacing: {
      pageMargin: {
        top: 60,
        right: 50,
        bottom: 60,
        left: 50,
      },
      sectionGap: 24,
      itemGap: 14,
      lineGap: 7,
    },
    showStamps: true,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean, maximum whitespace, modern aesthetic',
    font: {
      family: 'Helvetica',
      size: {
        h1: 22,
        h2: 14,
        h3: 11,
        body: 10,
        small: 8,
      },
      lineHeight: 1.8,
    },
    colors: {
      primary: '#000000',
      secondary: '#404040',
      text: '#1f2937',
      muted: '#9ca3af',
    },
    spacing: {
      pageMargin: {
        top: 70,
        right: 60,
        bottom: 70,
        left: 60,
      },
      sectionGap: 30,
      itemGap: 16,
      lineGap: 8,
    },
    showStamps: true,
  },
};

/**
 * Orden estándar de secciones para optimización ATS
 */
const DEFAULT_SECTION_ORDER: ATSSectionType[] = [
  'contact',
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'languages',
  'portfolio',
  'visas',
];

/**
 * Títulos estándar de secciones reconocidos por ATS
 */
export const ATS_SECTION_TITLES: Record<ATSSectionType, { en: string; es: string }> = {
  contact: { en: 'Contact Information', es: 'Información de Contacto' },
  summary: { en: 'Professional Summary', es: 'Resumen Profesional' },
  experience: { en: 'Work Experience', es: 'Experiencia Laboral' },
  education: { en: 'Education', es: 'Educación' },
  skills: { en: 'Skills', es: 'Habilidades' },
  languages: { en: 'Languages', es: 'Idiomas' },
  certifications: { en: 'Certifications', es: 'Certificaciones' },
  portfolio: { en: 'Portfolio', es: 'Portafolio' },
  visas: { en: 'Key Achievements', es: 'Logros Destacados' },
};

/**
 * Extrae keywords del perfil para optimización ATS
 */
export function extractKeywords(profile: FullProfileData): string[] {
  const keywords = new Set<string>();

  // De skills
  profile.skills?.forEach((skill) => {
    keywords.add(skill.name.toLowerCase());
  });

  // De experiencia (posiciones y empresas)
  profile.experiences?.forEach((exp) => {
    keywords.add(exp.position.toLowerCase());
    keywords.add(exp.company_name.toLowerCase());
    // Extraer keywords de description si existe
    if (exp.description) {
      const words = exp.description
        .toLowerCase()
        .match(/\b[a-z]{4,}\b/g); // Palabras de 4+ letras
      words?.forEach((w) => keywords.add(w));
    }
  });

  // De educación (títulos y campos de estudio)
  profile.education?.forEach((edu) => {
    keywords.add(edu.degree.toLowerCase());
    keywords.add(edu.field_of_study.toLowerCase());
  });

  // De certificaciones
  profile.certifications?.forEach((cert) => {
    keywords.add(cert.name.toLowerCase());
    keywords.add(cert.issuer.toLowerCase());
  });

  // Del headline y summary
  if (profile.profile.headline) {
    const words = profile.profile.headline
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g);
    words?.forEach((w) => keywords.add(w));
  }

  if (profile.profile.summary) {
    const words = profile.profile.summary
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g);
    words?.forEach((w) => keywords.add(w));
  }

  // Filtrar palabras comunes (stopwords básicas)
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'been',
    'were', 'was', 'are', 'they', 'them', 'their', 'there', 'where',
    'when', 'what', 'which', 'who', 'will', 'would', 'could', 'should',
    'para', 'con', 'los', 'las', 'del', 'que', 'por', 'como', 'esta',
    'este', 'sobre', 'desde', 'hasta', 'entre', 'durante',
  ]);

  return Array.from(keywords).filter((kw) => !stopwords.has(kw));
}

/**
 * Configura las secciones según las opciones de exportación
 */
export function configureSections(
  profile: FullProfileData,
  language: 'en' | 'es' = 'en'
): ATSSectionConfig[] {
  const sections: ATSSectionConfig[] = [];

  DEFAULT_SECTION_ORDER.forEach((type, index) => {
    let enabled = true;

    // Verificar si hay datos para esta sección
    switch (type) {
      case 'contact':
        enabled = true; // Siempre mostrar
        break;
      case 'summary':
        enabled = !!profile.profile.summary;
        break;
      case 'experience':
        enabled = (profile.experiences?.length ?? 0) > 0;
        break;
      case 'education':
        enabled = (profile.education?.length ?? 0) > 0;
        break;
      case 'skills':
        enabled = (profile.skills?.length ?? 0) > 0;
        break;
      case 'languages':
        enabled = (profile.languages?.length ?? 0) > 0;
        break;
      case 'certifications':
        enabled = (profile.certifications?.length ?? 0) > 0;
        break;
      case 'portfolio':
        enabled = (profile.portfolioItems?.length ?? 0) > 0;
        break;
      case 'visas':
        enabled = (profile.visas?.length ?? 0) > 0;
        break;
    }

    sections.push({
      type,
      title: ATS_SECTION_TITLES[type][language],
      enabled,
      order: index,
    });
  });

  return sections;
}

/**
 * Filtra stamps verificados
 */
export function getVerifiedStamps(stamps: Stamp[]): Stamp[] {
  return stamps.filter((stamp) => stamp.status === 'VERIFIED');
}

/**
 * Obtiene un resumen de stamps por tipo
 */
export function getStampsSummary(stamps: Stamp[]): Record<StampType, number> {
  const summary: Record<StampType, number> = {
    EMAIL: 0,
    PHONE: 0,
    IDENTITY: 0,
    EDUCATION: 0,
    CERTIFICATION: 0,
    EMPLOYMENT: 0,
    SKILL: 0,
  };

  stamps.forEach((stamp) => {
    if (stamp.status === 'VERIFIED') {
      summary[stamp.type] = (summary[stamp.type] || 0) + 1;
    }
  });

  return summary;
}

/**
 * Formatea fechas para el CV
 */
export function formatDate(
  date: string | null | undefined,
  language: 'en' | 'es' = 'en'
): string {
  if (!date) return language === 'en' ? 'Present' : 'Presente';

  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
  };

  return d.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', options);
}

/**
 * Formatea período de tiempo (fecha inicio - fecha fin)
 */
export function formatDateRange(
  startDate: string,
  endDate: string | null | undefined,
  isCurrent?: boolean,
  language: 'en' | 'es' = 'en'
): string {
  const start = formatDate(startDate, language);
  const end = isCurrent
    ? language === 'en'
      ? 'Present'
      : 'Presente'
    : formatDate(endDate, language);

  return `${start} - ${end}`;
}

/**
 * Sanitiza texto para PDF (elimina caracteres problemáticos)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/\u2013|\u2014/g, '-') // En/em dashes
    .replace(/\u2026/g, '...') // Ellipsis
    .trim();
}

/**
 * Procesa el perfil para exportación ATS
 */
export function processProfileForATS(
  profile: FullProfileData,
  stamps: Stamp[],
  language: 'en' | 'es' = 'en'
): ATSProcessedData {
  return {
    profile,
    stamps: getVerifiedStamps(stamps),
    keywords: extractKeywords(profile),
    sections: configureSections(profile, language),
  };
}

/**
 * Genera nombre de archivo para el PDF
 */
export function generateFileName(
  fullName: string,
  template: ATSTemplateType
): string {
  const sanitizedName = fullName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const date = new Date().toISOString().split('T')[0];

  return `cv-${sanitizedName}-${template}-${date}.pdf`;
}

/**
 * Valida que el perfil tiene datos mínimos para exportar
 */
export function validateProfileForExport(profile: FullProfileData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!profile.profile.full_name || profile.profile.full_name.trim() === '') {
    errors.push('Full name is required');
  }

  if (!profile.profile.email || profile.profile.email.trim() === '') {
    errors.push('Email is required');
  }

  if (!profile.experiences || profile.experiences.length === 0) {
    errors.push('At least one work experience is recommended');
  }

  if (!profile.education || profile.education.length === 0) {
    errors.push('At least one education entry is recommended');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
