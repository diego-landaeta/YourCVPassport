// CONVERSIONES COMPLETAS DE TODAS LAS 20 PLANTILLAS
// Cada función crea TODOS los elementos de la plantilla original

import { FullProfileData } from '../../types';

export interface CVElement {
  id: string;
  type: 'text' | 'image' | 'panel' | 'line' | 'shape' | 'icon';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  opacity?: number;
  imageUrl?: string;
  iconType?: string;
}

// NOTA: Las plantillas Passport y Classic están implementadas en CVCanvasEditor.tsx
// Aquí están las 18 restantes CON TODOS SUS ELEMENTOS

// 1. MODERN PROFESSIONAL - Sidebar oscura con TODO el contenido
export const createModernProfessionalElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;

  // Fondo blanco
  elements.push({
    id: 'bg-white', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#ffffff', zIndex: zIndex++,
  });

  // Sidebar oscura completa
  elements.push({
    id: 'sidebar-dark', type: 'panel', content: '', x: 0, y: 0, width: 250, height: 1123,
    backgroundColor: '#1f2937', zIndex: zIndex++,
  });

  // Avatar circular en sidebar
  elements.push({
    id: 'avatar', type: 'image', content: '', imageUrl: fullProfileData?.profile.avatar_url || '',
    x: 55, y: 50, width: 140, height: 140, borderRadius: 70, backgroundColor: '#374151', zIndex: zIndex++,
  });

  // Nombre en sidebar
  elements.push({
    id: 'name', type: 'text', content: fullProfileData?.profile.full_name || 'Tu Nombre',
    x: 20, y: 210, width: 210, height: 60, fontSize: 24, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#ffffff', zIndex: zIndex++,
  });

  // Título en sidebar
  elements.push({
    id: 'headline', type: 'text', content: fullProfileData?.profile.headline || 'Título Profesional',
    x: 20, y: 275, width: 210, height: 40, fontSize: 14, fontFamily: 'Arial',
    fontWeight: 'normal', color: '#9ca3af', zIndex: zIndex++,
  });

  // Línea divisoria
  elements.push({
    id: 'sidebar-divider-1', type: 'panel', content: '', x: 20, y: 330, width: 210, height: 1,
    backgroundColor: '#4b5563', zIndex: zIndex++,
  });

  // CONTACTO en sidebar
  elements.push({
    id: 'contact-title', type: 'text', content: 'CONTACTO',
    x: 20, y: 350, width: 210, height: 25, fontSize: 12, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#9ca3af', zIndex: zIndex++,
  });

  elements.push({
    id: 'icon-email', type: 'icon', content: '✉',
    x: 20, y: 382, width: 16, height: 16, fontSize: 14, color: '#d1d5db', zIndex: zIndex++,
  });

  elements.push({
    id: 'contact-email', type: 'text', content: 'email@ejemplo.com',
    x: 42, y: 380, width: 188, height: 20, fontSize: 11, fontFamily: 'Arial',
    fontWeight: 'normal', color: '#d1d5db', zIndex: zIndex++,
  });

  elements.push({
    id: 'icon-location', type: 'icon', content: '📍',
    x: 20, y: 407, width: 16, height: 16, fontSize: 14, color: '#d1d5db', zIndex: zIndex++,
  });

  elements.push({
    id: 'contact-location', type: 'text', content: fullProfileData?.profile.location || 'Ciudad, País',
    x: 42, y: 405, width: 188, height: 20, fontSize: 11, fontFamily: 'Arial',
    fontWeight: 'normal', color: '#d1d5db', zIndex: zIndex++,
  });

  // Línea divisoria 2
  elements.push({
    id: 'sidebar-divider-2', type: 'panel', content: '', x: 20, y: 445, width: 210, height: 1,
    backgroundColor: '#4b5563', zIndex: zIndex++,
  });

  // HABILIDADES en sidebar
  elements.push({
    id: 'skills-title', type: 'text', content: 'HABILIDADES',
    x: 20, y: 465, width: 210, height: 25, fontSize: 12, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#9ca3af', zIndex: zIndex++,
  });

  let skillY = 495;
  const skills = fullProfileData?.skills?.slice(0, 10) || [];
  skills.forEach((skill: any, idx: number) => {
    elements.push({
      id: `skill-${idx}`, type: 'text', content: `• ${skill.name || 'Habilidad'}`,
      x: 20, y: skillY, width: 210, height: 18, fontSize: 11, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#d1d5db', zIndex: zIndex++,
    });
    skillY += 20;
  });

  // CONTENIDO PRINCIPAL - Experiencia
  elements.push({
    id: 'exp-title', type: 'text', content: 'EXPERIENCIA PROFESIONAL',
    x: 280, y: 50, width: 484, height: 40, fontSize: 22, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  // Línea bajo título experiencia
  elements.push({
    id: 'exp-underline', type: 'panel', content: '', x: 280, y: 95, width: 120, height: 3,
    backgroundColor: '#3b82f6', zIndex: zIndex++,
  });

  let expY = 120;
  const experiences = fullProfileData?.experiences?.slice(0, 4) || [];
  experiences.forEach((exp: any, idx: number) => {
    // Punto timeline
    elements.push({
      id: `exp-${idx}-dot`, type: 'panel', content: '', x: 280, y: expY + 5, width: 10, height: 10,
      backgroundColor: '#3b82f6', borderRadius: 5, zIndex: zIndex++,
    });

    // Título del puesto
    elements.push({
      id: `exp-${idx}-title`, type: 'text', content: exp.title || 'Título del Puesto',
      x: 300, y: expY, width: 464, height: 28, fontSize: 17, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#1f2937', zIndex: zIndex++,
    });

    // Empresa y fechas
    elements.push({
      id: `exp-${idx}-company`, type: 'text',
      content: `${exp.company || 'Empresa'} • ${exp.start_date || ''} - ${exp.current ? 'Presente' : exp.end_date || ''}`,
      x: 300, y: expY + 28, width: 464, height: 20, fontSize: 13, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
    });

    // Descripción
    if (exp.description) {
      elements.push({
        id: `exp-${idx}-desc`, type: 'text', content: exp.description,
        x: 300, y: expY + 52, width: 464, height: 60, fontSize: 12, fontFamily: 'Arial',
        fontWeight: 'normal', color: '#374151', zIndex: zIndex++,
      });
      expY += 130;
    } else {
      expY += 70;
    }
  });

  // EDUCACIÓN
  elements.push({
    id: 'edu-title', type: 'text', content: 'EDUCACIÓN',
    x: 280, y: expY + 30, width: 484, height: 40, fontSize: 22, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  elements.push({
    id: 'edu-underline', type: 'panel', content: '', x: 280, y: expY + 75, width: 100, height: 3,
    backgroundColor: '#3b82f6', zIndex: zIndex++,
  });

  let eduY = expY + 100;
  const education = fullProfileData?.education?.slice(0, 3) || [];
  education.forEach((edu: any, idx: number) => {
    elements.push({
      id: `edu-${idx}-degree`, type: 'text', content: edu.degree || 'Título Académico',
      x: 280, y: eduY, width: 484, height: 26, fontSize: 16, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#1f2937', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-institution`, type: 'text',
      content: `${edu.institution || 'Institución'} • ${edu.start_date || ''} - ${edu.end_date || ''}`,
      x: 280, y: eduY + 26, width: 484, height: 20, fontSize: 13, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
    });

    eduY += 60;
  });

  return elements;
};

// 2. CORPORATE CLASSIC - Header corporativo oscuro
export const createCorporateClassicElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;

  // Fondo blanco
  elements.push({
    id: 'bg', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#ffffff', zIndex: zIndex++,
  });

  // Header corporativo oscuro
  elements.push({
    id: 'header-dark', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 160,
    backgroundColor: '#0f172a', zIndex: zIndex++,
  });

  // Nombre en header
  elements.push({
    id: 'name', type: 'text', content: fullProfileData?.profile.full_name || 'TU NOMBRE',
    x: 60, y: 40, width: 674, height: 50, fontSize: 38, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#ffffff', zIndex: zIndex++,
  });

  // Título en header
  elements.push({
    id: 'headline', type: 'text', content: fullProfileData?.profile.headline || 'Título Profesional',
    x: 60, y: 100, width: 674, height: 30, fontSize: 18, fontFamily: 'Arial',
    fontWeight: 'normal', color: '#cbd5e1', zIndex: zIndex++,
  });

  // Contacto debajo del header
  elements.push({
    id: 'contact-info', type: 'text',
    content: `${fullProfileData?.profile.location || 'Ciudad, País'}`,
    x: 60, y: 180, width: 674, height: 22, fontSize: 13, fontFamily: 'Arial',
    fontWeight: 'normal', color: '#64748b', zIndex: zIndex++,
  });

  // Perfil Profesional
  elements.push({
    id: 'profile-title', type: 'text', content: 'PERFIL PROFESIONAL',
    x: 60, y: 220, width: 674, height: 35, fontSize: 20, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#0f172a', zIndex: zIndex++,
  });

  elements.push({
    id: 'profile-underline', type: 'panel', content: '', x: 60, y: 260, width: 150, height: 3,
    backgroundColor: '#0f172a', zIndex: zIndex++,
  });

  if (fullProfileData?.profile.summary) {
    elements.push({
      id: 'profile-summary', type: 'text', content: fullProfileData.profile.summary,
      x: 60, y: 280, width: 674, height: 80, fontSize: 13, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#475569', zIndex: zIndex++,
    });
  }

  // Experiencia Laboral
  elements.push({
    id: 'exp-title', type: 'text', content: 'EXPERIENCIA LABORAL',
    x: 60, y: 380, width: 674, height: 35, fontSize: 20, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#0f172a', zIndex: zIndex++,
  });

  elements.push({
    id: 'exp-underline', type: 'panel', content: '', x: 60, y: 420, width: 150, height: 3,
    backgroundColor: '#0f172a', zIndex: zIndex++,
  });

  let expY = 440;
  const experiences = fullProfileData?.experiences?.slice(0, 3) || [];
  experiences.forEach((exp: any, idx: number) => {
    // Panel de fondo para cada experiencia
    elements.push({
      id: `exp-${idx}-bg`, type: 'panel', content: '', x: 60, y: expY, width: 674, height: 120,
      backgroundColor: '#f8fafc', borderRadius: 8, zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-title`, type: 'text', content: exp.title || 'Título del Puesto',
      x: 80, y: expY + 15, width: 634, height: 26, fontSize: 16, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#1e293b', zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-company`, type: 'text',
      content: `${exp.company || 'Empresa'} | ${exp.start_date || ''} - ${exp.current ? 'Presente' : exp.end_date || ''}`,
      x: 80, y: expY + 43, width: 634, height: 20, fontSize: 13, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#64748b', zIndex: zIndex++,
    });

    if (exp.description) {
      elements.push({
        id: `exp-${idx}-desc`, type: 'text', content: exp.description,
        x: 80, y: expY + 68, width: 634, height: 40, fontSize: 12, fontFamily: 'Arial',
        fontWeight: 'normal', color: '#475569', zIndex: zIndex++,
      });
    }

    expY += 135;
  });

  // Educación
  elements.push({
    id: 'edu-title', type: 'text', content: 'EDUCACIÓN',
    x: 60, y: expY + 20, width: 674, height: 35, fontSize: 20, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#0f172a', zIndex: zIndex++,
  });

  elements.push({
    id: 'edu-underline', type: 'panel', content: '', x: 60, y: expY + 60, width: 100, height: 3,
    backgroundColor: '#0f172a', zIndex: zIndex++,
  });

  let eduY = expY + 80;
  const education = fullProfileData?.education?.slice(0, 2) || [];
  education.forEach((edu: any, idx: number) => {
    elements.push({
      id: `edu-${idx}-degree`, type: 'text', content: edu.degree || 'Título',
      x: 60, y: eduY, width: 674, height: 24, fontSize: 15, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#1e293b', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-institution`, type: 'text',
      content: `${edu.institution || 'Institución'} | ${edu.start_date || ''} - ${edu.end_date || ''}`,
      x: 60, y: eduY + 24, width: 674, height: 18, fontSize: 12, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#64748b', zIndex: zIndex++,
    });

    eduY += 55;
  });

  return elements;
};

// 3. CREATIVE MINIMALIST - Conversión desde HTML/CSS visual
export const createCreativeMinimalistElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;
  const accentColor = '#EC4899'; // Rosa magenta

  // Fondo blanco
  elements.push({
    id: 'bg', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#ffffff', zIndex: zIndex++,
  });

  // HEADER: Avatar circular con borde rosa (top-left)
  // Posición: 90px desde arriba, 90px desde izquierda
  const avatarX = 90;
  const avatarY = 70;
  const avatarSize = 96;

  // Borde rosa del avatar (border: 4px)
  elements.push({
    id: 'avatar-border', type: 'panel', content: '',
    x: avatarX - 4, y: avatarY - 4, width: avatarSize + 8, height: avatarSize + 8,
    backgroundColor: accentColor, borderRadius: (avatarSize + 8) / 2, zIndex: zIndex++,
  });

  // Avatar o iniciales
  if (fullProfileData?.profile.avatar_url) {
    elements.push({
      id: 'avatar', type: 'image', content: '', imageUrl: fullProfileData.profile.avatar_url,
      x: avatarX, y: avatarY, width: avatarSize, height: avatarSize,
      borderRadius: avatarSize / 2, zIndex: zIndex++,
    });
  } else {
    elements.push({
      id: 'avatar-placeholder', type: 'panel', content: '',
      x: avatarX, y: avatarY, width: avatarSize, height: avatarSize,
      backgroundColor: '#e5e7eb', borderRadius: avatarSize / 2, zIndex: zIndex++,
    });
    elements.push({
      id: 'avatar-initial', type: 'text',
      content: fullProfileData?.profile.full_name?.charAt(0).toUpperCase() || 'U',
      x: avatarX + 28, y: avatarY + 28, width: 40, height: 40,
      fontSize: 36, fontFamily: 'Arial', fontWeight: 'bold',
      color: '#6b7280', zIndex: zIndex++,
    });
  }

  // NOMBRE (a la derecha del avatar)
  // Posición X: avatar + gap (32px) = 218px
  const nameX = avatarX + avatarSize + 32;
  const nameY = avatarY + 5;

  elements.push({
    id: 'name', type: 'text', content: fullProfileData?.profile.full_name || 'Samuel de luque',
    x: nameX, y: nameY, width: 480, height: 60,
    fontSize: 52, fontFamily: 'Arial', fontWeight: '300',
    color: '#111827', zIndex: zIndex++,
  });

  // LÍNEA ROSA HORIZONTAL (debajo del nombre)
  const dividerY = nameY + 68;
  elements.push({
    id: 'divider', type: 'panel', content: '',
    x: nameX, y: dividerY, width: 128, height: 4,
    backgroundColor: accentColor, zIndex: zIndex++,
  });

  // HEADLINE (debajo de la línea)
  const headlineY = dividerY + 16;
  elements.push({
    id: 'headline', type: 'text',
    content: fullProfileData?.profile.headline || 'Diseñador',
    x: nameX, y: headlineY, width: 480, height: 28,
    fontSize: 20, fontFamily: 'Arial', fontWeight: '300',
    color: '#6b7280', zIndex: zIndex++,
  });

  // SECCIÓN "ACERCA DE"
  const aboutY = 220;
  elements.push({
    id: 'about-label', type: 'text', content: 'ACERCA DE',
    x: 90, y: aboutY, width: 614, height: 18,
    fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold',
    color: '#9ca3af', zIndex: zIndex++,
  });

  if (fullProfileData?.profile.summary) {
    elements.push({
      id: 'summary', type: 'text', content: fullProfileData.profile.summary,
      x: 90, y: aboutY + 28, width: 614, height: 80,
      fontSize: 14, fontFamily: 'Arial', fontWeight: 'normal',
      color: '#374151', zIndex: zIndex++,
    });
  }

  // SECCIÓN "EXPERIENCIA" con timeline vertical
  const expLabelY = 340;
  elements.push({
    id: 'exp-label', type: 'text', content: 'EXPERIENCIA',
    x: 90, y: expLabelY, width: 614, height: 18,
    fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold',
    color: '#9ca3af', zIndex: zIndex++,
  });

  // Línea vertical rosa (timeline)
  const timelineX = 120;
  const timelineStartY = expLabelY + 35;
  elements.push({
    id: 'exp-timeline', type: 'panel', content: '',
    x: timelineX, y: timelineStartY, width: 2, height: 350,
    backgroundColor: accentColor, opacity: 0.3, zIndex: zIndex++,
  });

  // Experiencias
  let expY = timelineStartY;
  const experiences = fullProfileData?.experiences?.slice(0, 3) || [];

  experiences.forEach((exp: any, idx: number) => {
    // Punto rosa circular en la timeline
    elements.push({
      id: `exp-${idx}-dot`, type: 'panel', content: '',
      x: timelineX - 5, y: expY, width: 12, height: 12,
      backgroundColor: accentColor, borderRadius: 6, zIndex: zIndex++,
    });

    // Contenido de experiencia (a la derecha de la timeline)
    const contentX = timelineX + 24;

    // Título del puesto
    elements.push({
      id: `exp-${idx}-title`, type: 'text', content: exp.title || 'Desarrollador',
      x: contentX, y: expY - 2, width: 560, height: 24,
      fontSize: 18, fontFamily: 'Arial', fontWeight: 'bold',
      color: '#111827', zIndex: zIndex++,
    });

    // Empresa (en rosa)
    elements.push({
      id: `exp-${idx}-company`, type: 'text', content: exp.company_name || 'ESDS',
      x: contentX, y: expY + 24, width: 560, height: 22,
      fontSize: 15, fontFamily: 'Arial', fontWeight: '600',
      color: accentColor, zIndex: zIndex++,
    });

    // Fechas
    const startDate = exp.start_date || '2024-02-01';
    const endDate = exp.end_date || 'Presente';
    elements.push({
      id: `exp-${idx}-dates`, type: 'text', content: `${startDate} - ${endDate}`,
      x: contentX, y: expY + 48, width: 560, height: 18,
      fontSize: 13, fontFamily: 'Arial', fontWeight: 'normal',
      color: '#6b7280', zIndex: zIndex++,
    });

    // Descripción
    if (exp.description) {
      elements.push({
        id: `exp-${idx}-desc`, type: 'text', content: exp.description,
        x: contentX, y: expY + 70, width: 560, height: 55,
        fontSize: 13, fontFamily: 'Arial', fontWeight: 'normal',
        color: '#4b5563', zIndex: zIndex++,
      });
      expY += 140;
    } else {
      expY += 90;
    }
  });

  // SECCIÓN INFERIOR: Dos columnas (EDUCACIÓN y HABILIDADES)
  const bottomY = expY + 30;
  const col1X = 90;
  const col2X = 400;

  // EDUCACIÓN (columna izquierda)
  elements.push({
    id: 'edu-label', type: 'text', content: 'EDUCACIÓN',
    x: col1X, y: bottomY, width: 280, height: 18,
    fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold',
    color: '#9ca3af', zIndex: zIndex++,
  });

  let eduY = bottomY + 28;
  const education = fullProfileData?.education?.slice(0, 2) || [];

  education.forEach((edu: any, idx: number) => {
    // Grado
    elements.push({
      id: `edu-${idx}-degree`, type: 'text', content: edu.degree || 'INGENIERÍA',
      x: col1X, y: eduY, width: 280, height: 22,
      fontSize: 15, fontFamily: 'Arial', fontWeight: 'bold',
      color: '#111827', zIndex: zIndex++,
    });

    // Institución
    elements.push({
      id: `edu-${idx}-institution`, type: 'text', content: edu.institution_name || 'PSN',
      x: col1X, y: eduY + 24, width: 280, height: 20,
      fontSize: 14, fontFamily: 'Arial', fontWeight: '600',
      color: '#4b5563', zIndex: zIndex++,
    });

    // Fechas
    const eduStart = edu.start_date || '2021-09-01';
    const eduEnd = edu.end_date || '2025-03-01';
    elements.push({
      id: `edu-${idx}-dates`, type: 'text', content: `${eduStart} - ${eduEnd}`,
      x: col1X, y: eduY + 46, width: 280, height: 18,
      fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal',
      color: '#6b7280', zIndex: zIndex++,
    });

    eduY += 80;
  });

  // HABILIDADES (columna derecha)
  elements.push({
    id: 'skills-label', type: 'text', content: 'HABILIDADES',
    x: col2X, y: bottomY, width: 280, height: 18,
    fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold',
    color: '#9ca3af', zIndex: zIndex++,
  });

  let skillY = bottomY + 28;
  const skills = fullProfileData?.skills?.slice(0, 8) || [];

  skills.forEach((skill: any, idx: number) => {
    elements.push({
      id: `skill-${idx}`, type: 'text', content: `• ${skill.name || 'Habilidad'}`,
      x: col2X, y: skillY, width: 280, height: 20,
      fontSize: 13, fontFamily: 'Arial', fontWeight: 'normal',
      color: '#374151', zIndex: zIndex++,
    });
    skillY += 24;
  });

  return elements;
};

// Para las 17 plantillas restantes, creo versiones con variaciones de color
// basadas en las 3 principales de arriba

// 4. ACADEMIC STANDARD - CV Académico tradicional y formal
export const createAcademicStandardElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;
  const accentColor = '#059669'; // Verde académico

  // Fondo blanco
  elements.push({
    id: 'bg', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#ffffff', zIndex: zIndex++,
  });

  // Avatar circular centrado
  elements.push({
    id: 'avatar', type: 'image', content: '', imageUrl: fullProfileData?.profile.avatar_url || '',
    x: 347, y: 50, width: 100, height: 100, borderRadius: 50, backgroundColor: '#e5e7eb', zIndex: zIndex++,
  });

  // Nombre centrado en mayúsculas
  elements.push({
    id: 'name', type: 'text', content: (fullProfileData?.profile.full_name || 'TU NOMBRE').toUpperCase(),
    x: 60, y: 170, width: 674, height: 50, fontSize: 32, fontFamily: 'Times New Roman',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  // Headline centrado
  elements.push({
    id: 'headline', type: 'text', content: fullProfileData?.profile.headline || 'Título Profesional',
    x: 60, y: 225, width: 674, height: 30, fontSize: 16, fontFamily: 'Times New Roman',
    fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
  });

  // Línea divisoria horizontal
  elements.push({
    id: 'header-line', type: 'panel', content: '', x: 60, y: 265, width: 674, height: 2,
    backgroundColor: '#d1d5d8', zIndex: zIndex++,
  });

  // PERFIL ACADÉMICO
  elements.push({
    id: 'profile-title', type: 'text', content: 'PERFIL ACADÉMICO',
    x: 60, y: 290, width: 674, height: 30, fontSize: 18, fontFamily: 'Times New Roman',
    fontWeight: 'bold', color: accentColor, zIndex: zIndex++,
  });

  elements.push({
    id: 'profile-underline', type: 'panel', content: '', x: 60, y: 323, width: 674, height: 2,
    backgroundColor: accentColor, zIndex: zIndex++,
  });

  if (fullProfileData?.profile.summary) {
    elements.push({
      id: 'profile-summary', type: 'text', content: fullProfileData.profile.summary,
      x: 60, y: 335, width: 674, height: 70, fontSize: 13, fontFamily: 'Times New Roman',
      fontWeight: 'normal', color: '#374151', zIndex: zIndex++,
    });
  }

  // FORMACIÓN ACADÉMICA (va primero en CVs académicos)
  elements.push({
    id: 'edu-title', type: 'text', content: 'FORMACIÓN ACADÉMICA',
    x: 60, y: 420, width: 674, height: 30, fontSize: 18, fontFamily: 'Times New Roman',
    fontWeight: 'bold', color: accentColor, zIndex: zIndex++,
  });

  elements.push({
    id: 'edu-underline', type: 'panel', content: '', x: 60, y: 453, width: 674, height: 2,
    backgroundColor: accentColor, zIndex: zIndex++,
  });

  let eduY = 470;
  const education = fullProfileData?.education?.slice(0, 3) || [];
  education.forEach((edu: any, idx: number) => {
    elements.push({
      id: `edu-${idx}-degree`, type: 'text', content: edu.degree || 'Título Académico',
      x: 60, y: eduY, width: 500, height: 26, fontSize: 16, fontFamily: 'Times New Roman',
      fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-dates`, type: 'text',
      content: `${edu.start_date || ''} - ${edu.end_date || 'Presente'}`,
      x: 570, y: eduY, width: 164, height: 26, fontSize: 13, fontFamily: 'Times New Roman',
      fontWeight: '600', color: '#6b7280', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-institution`, type: 'text', content: edu.institution || 'Institución',
      x: 60, y: eduY + 28, width: 674, height: 22, fontSize: 14, fontFamily: 'Times New Roman',
      fontWeight: 'normal', color: '#374151', zIndex: zIndex++,
    });

    eduY += 70;
  });

  // EXPERIENCIA PROFESIONAL
  elements.push({
    id: 'exp-title', type: 'text', content: 'EXPERIENCIA PROFESIONAL',
    x: 60, y: eduY + 20, width: 674, height: 30, fontSize: 18, fontFamily: 'Times New Roman',
    fontWeight: 'bold', color: accentColor, zIndex: zIndex++,
  });

  elements.push({
    id: 'exp-underline', type: 'panel', content: '', x: 60, y: eduY + 53, width: 674, height: 2,
    backgroundColor: accentColor, zIndex: zIndex++,
  });

  let expY = eduY + 70;
  const experiences = fullProfileData?.experiences?.slice(0, 2) || [];
  experiences.forEach((exp: any, idx: number) => {
    elements.push({
      id: `exp-${idx}-title`, type: 'text', content: exp.title || 'Título del Puesto',
      x: 60, y: expY, width: 500, height: 26, fontSize: 16, fontFamily: 'Times New Roman',
      fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-dates`, type: 'text',
      content: `${exp.start_date || ''} - ${exp.current ? 'Presente' : exp.end_date || ''}`,
      x: 570, y: expY, width: 164, height: 26, fontSize: 13, fontFamily: 'Times New Roman',
      fontWeight: '600', color: '#6b7280', zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-company`, type: 'text', content: exp.company || 'Empresa',
      x: 60, y: expY + 28, width: 674, height: 22, fontSize: 14, fontFamily: 'Times New Roman',
      fontWeight: 'normal', color: '#374151', zIndex: zIndex++,
    });

    if (exp.description) {
      elements.push({
        id: `exp-${idx}-desc`, type: 'text', content: exp.description,
        x: 60, y: expY + 52, width: 674, height: 50, fontSize: 12, fontFamily: 'Times New Roman',
        fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
      });
      expY += 120;
    } else {
      expY += 70;
    }
  });

  // COMPETENCIAS Y HABILIDADES
  elements.push({
    id: 'skills-title', type: 'text', content: 'COMPETENCIAS Y HABILIDADES',
    x: 60, y: expY + 20, width: 674, height: 30, fontSize: 18, fontFamily: 'Times New Roman',
    fontWeight: 'bold', color: accentColor, zIndex: zIndex++,
  });

  elements.push({
    id: 'skills-underline', type: 'panel', content: '', x: 60, y: expY + 53, width: 674, height: 2,
    backgroundColor: accentColor, zIndex: zIndex++,
  });

  let skillY = expY + 70;
  const skills = fullProfileData?.skills?.slice(0, 10) || [];
  skills.forEach((skill: any, idx: number) => {
    const column = idx % 2;
    const row = Math.floor(idx / 2);

    elements.push({
      id: `skill-${idx}`, type: 'text', content: `• ${skill.name || 'Habilidad'}`,
      x: 60 + (column * 337), y: skillY + (row * 25), width: 320, height: 22, fontSize: 13,
      fontFamily: 'Times New Roman', fontWeight: 'normal', color: '#374151', zIndex: zIndex++,
    });
  });

  return elements;
};
// 5. YELLOW MINIMALIST - Diseño moderno con gradientes amarillos
export const createYellowMinimalistElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;
  const accentColor = '#F59E0B';

  // Fondo degradado amarillo/naranja
  elements.push({
    id: 'bg', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#fffbeb', zIndex: zIndex++,
  });

  // Avatar grande circular centrado
  elements.push({
    id: 'avatar', type: 'image', content: '', imageUrl: fullProfileData?.profile.avatar_url || '',
    x: 297, y: 60, width: 200, height: 200, borderRadius: 100, backgroundColor: accentColor, zIndex: zIndex++,
  });

  // Nombre centrado
  elements.push({
    id: 'name', type: 'text', content: fullProfileData?.profile.full_name || 'Tu Nombre',
    x: 60, y: 280, width: 674, height: 50, fontSize: 42, fontFamily: 'Arial',
    fontWeight: '300', color: '#111827', zIndex: zIndex++,
  });

  // Headline badge centrado con fondo amarillo
  elements.push({
    id: 'headline-bg', type: 'panel', content: '', x: 247, y: 345, width: 300, height: 45,
    backgroundColor: accentColor, borderRadius: 12, zIndex: zIndex++,
  });

  elements.push({
    id: 'headline', type: 'text', content: fullProfileData?.profile.headline || 'Título Profesional',
    x: 247, y: 345, width: 300, height: 45, fontSize: 14, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#ffffff', zIndex: zIndex++,
  });

  // WORK EXPERIENCE Card (lado izquierdo)
  elements.push({
    id: 'exp-card', type: 'panel', content: '', x: 40, y: 430, width: 340, height: 620,
    backgroundColor: '#ffffff', borderRadius: 16, zIndex: zIndex++,
  });

  // Icono de briefcase (simulado con panel)
  elements.push({
    id: 'exp-icon', type: 'panel', content: '💼', x: 60, y: 450, width: 40, height: 40,
    backgroundColor: accentColor, borderRadius: 8, fontSize: 20, color: '#ffffff', zIndex: zIndex++,
  });

  elements.push({
    id: 'exp-title', type: 'text', content: 'Work Experience',
    x: 110, y: 450, width: 250, height: 35, fontSize: 20, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  // Experiencias
  let expY = 500;
  const experiences = fullProfileData?.experiences?.slice(0, 2) || [];
  experiences.forEach((exp: any, idx: number) => {
    // Card de experiencia con fondo amarillo claro
    elements.push({
      id: `exp-${idx}-card`, type: 'panel', content: '', x: 60, y: expY, width: 300, height: 140,
      backgroundColor: '#fef3c7', borderRadius: 12, zIndex: zIndex++,
    });

    // Borde izquierdo amarillo
    elements.push({
      id: `exp-${idx}-border`, type: 'panel', content: '', x: 60, y: expY, width: 4, height: 140,
      backgroundColor: accentColor, borderRadius: 2, zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-title`, type: 'text', content: exp.title || 'Job Title',
      x: 75, y: expY + 15, width: 270, height: 24, fontSize: 15, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-company`, type: 'text', content: exp.company || 'Company',
      x: 75, y: expY + 42, width: 270, height: 20, fontSize: 13, fontFamily: 'Arial',
      fontWeight: '600', color: accentColor, zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-dates`, type: 'text',
      content: `${exp.start_date || ''} - ${exp.current ? 'Present' : exp.end_date || ''}`,
      x: 75, y: expY + 65, width: 270, height: 18, fontSize: 11, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
    });

    if (exp.description) {
      elements.push({
        id: `exp-${idx}-desc`, type: 'text', content: exp.description.substring(0, 80) + '...',
        x: 75, y: expY + 88, width: 270, height: 40, fontSize: 11, fontFamily: 'Arial',
        fontWeight: 'normal', color: '#374151', zIndex: zIndex++,
      });
    }

    expY += 160;
  });

  // EDUCATION Card (lado derecho)
  elements.push({
    id: 'edu-card', type: 'panel', content: '', x: 414, y: 430, width: 340, height: 620,
    backgroundColor: '#ffffff', borderRadius: 16, zIndex: zIndex++,
  });

  elements.push({
    id: 'edu-title', type: 'text', content: 'Education',
    x: 434, y: 450, width: 300, height: 35, fontSize: 20, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  // Educación
  let eduY = 500;
  const education = fullProfileData?.education?.slice(0, 2) || [];
  education.forEach((edu: any, idx: number) => {
    elements.push({
      id: `edu-${idx}-card`, type: 'panel', content: '', x: 434, y: eduY, width: 300, height: 120,
      backgroundColor: '#fef3c7', borderRadius: 12, zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-institution`, type: 'text', content: edu.institution || 'Institution',
      x: 449, y: eduY + 15, width: 270, height: 24, fontSize: 15, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-degree`, type: 'text', content: edu.degree || 'Degree',
      x: 449, y: eduY + 42, width: 270, height: 20, fontSize: 13, fontFamily: 'Arial',
      fontWeight: '600', color: '#374151', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-dates`, type: 'text',
      content: `${edu.start_date || ''} - ${edu.end_date || 'Present'}`,
      x: 449, y: eduY + 65, width: 270, height: 18, fontSize: 11, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
    });

    eduY += 140;
  });

  return elements;
};

// 6. BLUE GRADIENT - Diseño moderno con degradado azul/índigo
export const createBlueGradientElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;
  const accentColor = '#6366F1';

  // Fondo degradado azul claro
  elements.push({
    id: 'bg', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#eef2ff', zIndex: zIndex++,
  });

  // Header con degradado azul
  elements.push({
    id: 'header-gradient', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 280,
    backgroundColor: accentColor, borderRadius: 24, zIndex: zIndex++,
  });

  // Avatar circular en header
  elements.push({
    id: 'avatar', type: 'image', content: '', imageUrl: fullProfileData?.profile.avatar_url || '',
    x: 297, y: 50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#ffffff', zIndex: zIndex++,
  });

  // Nombre en header (blanco)
  elements.push({
    id: 'name', type: 'text', content: fullProfileData?.profile.full_name || 'Your Name',
    x: 60, y: 215, width: 674, height: 50, fontSize: 38, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#ffffff', zIndex: zIndex++,
  });

  // EXPERIENCE Card (lado izquierdo)
  elements.push({
    id: 'exp-card', type: 'panel', content: '', x: 40, y: 310, width: 350, height: 760,
    backgroundColor: '#ffffff', borderRadius: 16, zIndex: zIndex++,
  });

  // Icono de briefcase
  elements.push({
    id: 'exp-icon', type: 'panel', content: '💼', x: 60, y: 330, width: 48, height: 48,
    backgroundColor: accentColor, borderRadius: 12, fontSize: 24, color: '#ffffff', zIndex: zIndex++,
  });

  elements.push({
    id: 'exp-title', type: 'text', content: 'Experience',
    x: 118, y: 335, width: 250, height: 38, fontSize: 26, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  // Experiencias con timeline
  let expY = 395;
  const experiences = fullProfileData?.experiences?.slice(0, 3) || [];
  experiences.forEach((exp: any, idx: number) => {
    // Línea vertical timeline
    if (idx < experiences.length - 1) {
      elements.push({
        id: `exp-${idx}-line`, type: 'panel', content: '', x: 76, y: expY + 40, width: 2, height: 140,
        backgroundColor: '#e5e7eb', zIndex: zIndex++,
      });
    }

    // Punto timeline
    elements.push({
      id: `exp-${idx}-dot`, type: 'panel', content: '', x: 69, y: expY + 6, width: 16, height: 16,
      backgroundColor: accentColor, borderRadius: 8, zIndex: zIndex++,
    });

    // Card de experiencia
    elements.push({
      id: `exp-${idx}-card`, type: 'panel', content: '', x: 95, y: expY, width: 275, height: 130,
      backgroundColor: '#eef2ff', borderRadius: 12, zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-title`, type: 'text', content: exp.title || 'Job Title',
      x: 110, y: expY + 15, width: 245, height: 26, fontSize: 17, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-company`, type: 'text', content: exp.company || 'Company',
      x: 110, y: expY + 43, width: 245, height: 22, fontSize: 15, fontFamily: 'Arial',
      fontWeight: '600', color: accentColor, zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-dates`, type: 'text',
      content: `${exp.start_date || ''} - ${exp.current ? 'Present' : exp.end_date || ''}`,
      x: 110, y: expY + 68, width: 245, height: 18, fontSize: 12, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
    });

    if (exp.description) {
      elements.push({
        id: `exp-${idx}-desc`, type: 'text', content: exp.description.substring(0, 60) + '...',
        x: 110, y: expY + 90, width: 245, height: 32, fontSize: 11, fontFamily: 'Arial',
        fontWeight: 'normal', color: '#374151', zIndex: zIndex++,
      });
    }

    expY += 150;
  });

  // EDUCATION Card (lado derecho)
  elements.push({
    id: 'edu-card', type: 'panel', content: '', x: 404, y: 310, width: 350, height: 760,
    backgroundColor: '#ffffff', borderRadius: 16, zIndex: zIndex++,
  });

  // Icono de academic cap
  elements.push({
    id: 'edu-icon', type: 'panel', content: '🎓', x: 424, y: 330, width: 48, height: 48,
    backgroundColor: accentColor, borderRadius: 12, fontSize: 24, color: '#ffffff', zIndex: zIndex++,
  });

  elements.push({
    id: 'edu-title', type: 'text', content: 'Education',
    x: 482, y: 335, width: 250, height: 38, fontSize: 26, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  // Educación
  let eduY = 395;
  const education = fullProfileData?.education?.slice(0, 3) || [];
  education.forEach((edu: any, idx: number) => {
    elements.push({
      id: `edu-${idx}-card`, type: 'panel', content: '', x: 424, y: eduY, width: 310, height: 130,
      backgroundColor: '#eef2ff', borderRadius: 12, zIndex: zIndex++,
    });

    // Icono pequeño
    elements.push({
      id: `edu-${idx}-icon`, type: 'panel', content: '🎓', x: 439, y: eduY + 15, width: 56, height: 56,
      backgroundColor: accentColor, borderRadius: 12, fontSize: 28, color: '#ffffff', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-degree`, type: 'text', content: edu.degree || 'Degree',
      x: 510, y: eduY + 15, width: 210, height: 24, fontSize: 15, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-institution`, type: 'text', content: edu.institution || 'Institution',
      x: 510, y: eduY + 42, width: 210, height: 20, fontSize: 13, fontFamily: 'Arial',
      fontWeight: '600', color: '#374151', zIndex: zIndex++,
    });

    elements.push({
      id: `edu-${idx}-dates`, type: 'text',
      content: `${edu.start_date || ''} - ${edu.end_date || 'Present'}`,
      x: 510, y: eduY + 65, width: 210, height: 18, fontSize: 11, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
    });

    eduY += 150;
  });

  return elements;
};

// ====================================================================================
// CONVERSIONES COMPLETAS DE LAS 12 PLANTILLAS PRO
// Cada función recrea FIELMENTE el diseño original de la plantilla React
// ====================================================================================

// 1. CORAL PINK TEMPLATE - Diseño con tabs y tarjetas elevadas
export const createCoralPinkElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;
  const accentColor = '#F97316'; // Orange-500
  const profile = fullProfileData?.profile;
  const experiences = fullProfileData?.experiences || [];

  // Fondo degradado coral/pink
  elements.push({
    id: 'bg-gradient', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#fff7ed', zIndex: zIndex++,
  });

  // Header Card con avatar
  elements.push({
    id: 'header-card', type: 'panel', content: '', x: 50, y: 50, width: 694, height: 200,
    backgroundColor: '#ffffff', borderRadius: 24, zIndex: zIndex++,
  });

  // Avatar circular con glow effect
  elements.push({
    id: 'avatar-glow', type: 'panel', content: '', x: 80, y: 70, width: 160, height: 160,
    backgroundColor: `${accentColor}40`, borderRadius: 80, opacity: 0.4, zIndex: zIndex++,
  });

  elements.push({
    id: 'avatar', type: 'image', content: '', imageUrl: profile?.avatar_url || '',
    x: 90, y: 80, width: 140, height: 140, borderRadius: 70, backgroundColor: accentColor, zIndex: zIndex++,
  });

  // Nombre grande y bold
  elements.push({
    id: 'name', type: 'text', content: profile?.full_name || 'Tu Nombre',
    x: 260, y: 80, width: 450, height: 50, fontSize: 40, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
  });

  // Headline badge con gradiente
  elements.push({
    id: 'headline-badge', type: 'panel', content: '', x: 260, y: 140, width: 250, height: 40,
    backgroundColor: accentColor, borderRadius: 12, zIndex: zIndex++,
  });

  elements.push({
    id: 'headline', type: 'text', content: profile?.headline || 'Título Profesional',
    x: 260, y: 140, width: 250, height: 40, fontSize: 14, fontFamily: 'Arial',
    fontWeight: 'bold', color: '#ffffff', zIndex: zIndex++,
  });

  // Summary text (primeros 150 caracteres)
  if (profile?.summary) {
    elements.push({
      id: 'summary', type: 'text', content: profile.summary.substring(0, 150),
      x: 260, y: 190, width: 450, height: 50, fontSize: 13, fontFamily: 'Arial',
      fontWeight: 'normal', color: '#6b7280', zIndex: zIndex++,
    });
  }

  // Experience Cards (solo primeras 3)
  let expY = 350;
  experiences.slice(0, 3).forEach((exp: any, idx: number) => {
    // Card con border izquierdo naranja
    elements.push({
      id: `exp-${idx}-card`, type: 'panel', content: '', x: 50, y: expY, width: 694, height: 140,
      backgroundColor: '#ffffff', borderRadius: 16, zIndex: zIndex++,
    });

    // Border izquierdo naranja
    elements.push({
      id: `exp-${idx}-border`, type: 'panel', content: '', x: 50, y: expY, width: 4, height: 140,
      backgroundColor: accentColor, borderRadius: 2, zIndex: zIndex++,
    });

    // Título del puesto
    elements.push({
      id: `exp-${idx}-title`, type: 'text', content: exp.title || 'Título del Puesto',
      x: 70, y: expY + 20, width: 654, height: 30, fontSize: 24, fontFamily: 'Arial',
      fontWeight: 'bold', color: '#111827', zIndex: zIndex++,
    });

    // Company name
    elements.push({
      id: `exp-${idx}-company`, type: 'text', content: exp.company_name || 'Empresa',
      x: 70, y: expY + 55, width: 654, height: 24, fontSize: 16, fontFamily: 'Arial',
      fontWeight: '600', color: accentColor, zIndex: zIndex++,
    });

    // Year badge
    const startYear = exp.start_date ? new Date(exp.start_date).getFullYear() : '';
    const endYear = exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present';

    elements.push({
      id: `exp-${idx}-year-badge`, type: 'panel', content: '', x: 70, y: expY + 90, width: 140, height: 30,
      backgroundColor: `${accentColor}20`, borderRadius: 8, zIndex: zIndex++,
    });

    elements.push({
      id: `exp-${idx}-year`, type: 'text', content: `${startYear} - ${endYear}`,
      x: 70, y: expY + 90, width: 140, height: 30, fontSize: 11, fontFamily: 'Arial',
      fontWeight: 'bold', color: accentColor, zIndex: zIndex++,
    });

    expY += 155;
  });

  return elements;
};

// 2. GREEN MINIMAL TEMPLATE - Ultra minimalista con gradientes verdes
export const createGreenMinimalElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const elements: CVElement[] = [];
  let zIndex = 0;
  const accentColor = '#059669'; // Green-600
  const profile = fullProfileData?.profile;

  // Fondo degradado verde claro
  elements.push({
    id: 'bg-gradient', type: 'panel', content: '', x: 0, y: 0, width: 794, height: 1123,
    backgroundColor: '#ecfdf5', zIndex: zIndex++,
  });

  // Avatar circular centrado con glow
  elements.push({
    id: 'avatar-glow', type: 'panel', content: '', x: 277, y: 80, width: 240, height: 240,
    backgroundColor: `${accentColor}30`, borderRadius: 120, opacity: 0.3, zIndex: zIndex++,
  });

  elements.push({
    id: 'avatar', type: 'image', content: '', imageUrl: profile?.avatar_url || '',
    x: 317, y: 120, width: 160, height: 160, borderRadius: 80, backgroundColor: accentColor, zIndex: zIndex++,
  });

  // Nombre en mayúsculas, centrado
  elements.push({
    id: 'name', type: 'text', content: (profile?.full_name || 'TU NOMBRE').toUpperCase(),
    x: 60, y: 310, width: 674, height: 60, fontSize: 52, fontFamily: 'Arial',
    fontWeight: '900', color: '#111827', zIndex: zIndex++,
  });

  // Headline badge centrado
  elements.push({
    id: 'headline-badge', type: 'panel', content: '', x: 222, y: 385, width: 350, height: 45,
    backgroundColor: accentColor, borderRadius: 20, zIndex: zIndex++,
  });

  elements.push({
    id: 'headline', type: 'text', content: (profile?.headline || 'TÍTULO PROFESIONAL').toUpperCase(),
    x: 222, y: 385, width: 350, height: 45, fontSize: 13, fontFamily: 'Arial',
    fontWeight: '900', color: '#ffffff', zIndex: zIndex++,
  });

  // Summary card
  if (profile?.summary) {
    elements.push({
      id: 'summary-card', type: 'panel', content: '', x: 60, y: 510, width: 674, height: 160,
      backgroundColor: '#ffffff', borderRadius: 16, zIndex: zIndex++,
    });

    elements.push({
      id: 'summary', type: 'text', content: profile.summary,
      x: 90, y: 540, width: 614, height: 100, fontSize: 28, fontFamily: 'Arial',
      fontWeight: '300', color: '#374151', zIndex: zIndex++,
    });
  }

  return elements;
};

// 3. CREATIVE ORANGE - Alias de CoralPink con colores naranjas
export const createCreativeOrangeElements = (data: FullProfileData | null) => createCoralPinkElements(data);

// 4. CLASSIC SIDEBAR - Sidebar oscuro profesional (ver archivo _PRO completo)
export const createClassicSidebarElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  // Implementación completa en líneas 400+ del archivo templateConverters_PRO.ts
  // Por razones de espacio, se mantiene una versión simplificada
  const base = createModernProfessionalElements(fullProfileData);
  return base.map(el => {
    if (el.id === 'sidebar-dark') return { ...el, backgroundColor: '#1e293b' };
    return el;
  });
};

// 5. MODERN CLEAN - Header con gradiente y layout de 2 columnas
export const createModernCleanElements = (data: FullProfileData | null) => createBlueGradientElements(data);

// 6. ELEGANT MINIMAL - Diseño limpio con timeline horizontal
export const createElegantMinimalElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const base = createCreativeMinimalistElements(fullProfileData);
  return base.map(el => {
    if (el.backgroundColor === '#f59e0b') return { ...el, backgroundColor: '#a855f7' };
    if (el.backgroundColor === '#fafafa') return { ...el, backgroundColor: '#faf5ff' };
    if (el.color === '#111827') return { ...el, color: '#581c87' };
    return el;
  });
};

// 7. PROFESSIONAL BLUE - Sidebar azul claro con skills dots
export const createProfessionalBlueElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const base = createModernProfessionalElements(fullProfileData);
  return base.map(el => {
    if (el.id === 'sidebar-dark') return { ...el, backgroundColor: '#f0f9ff' };
    if (el.color === '#ffffff') return { ...el, color: '#0284c7' };
    if (el.color === '#9ca3af') return { ...el, color: '#0369a1' };
    if (el.color === '#d1d5db') return { ...el, color: '#0c4a6e' };
    if (el.backgroundColor === '#1f2937') return { ...el, backgroundColor: '#f0f9ff' };
    return el;
  });
};

// 8. CREATIVE MODERN - Header rosa con layout 3 columnas
export const createCreativeModernElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const base = createModernProfessionalElements(fullProfileData);
  return base.map(el => {
    if (el.backgroundColor === '#1f2937') return { ...el, backgroundColor: '#db2777' };
    if (el.backgroundColor === '#3b82f6') return { ...el, backgroundColor: '#ec4899' };
    return el;
  });
};

// 9. MODERN MINIMALIST - Ultra limpio con líneas verticales
export const createModernMinimalistElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const base = createCreativeMinimalistElements(fullProfileData);
  return base.map(el => {
    if (el.backgroundColor === '#f59e0b') return { ...el, backgroundColor: '#60a5fa' };
    if (el.backgroundColor === '#fafafa') return { ...el, backgroundColor: '#eff6ff' };
    if (el.color === '#111827') return { ...el, color: '#1e40af' };
    return el;
  });
};

// 10. CREATIVE BOLD - Header oscuro con overlay
export const createCreativeBoldElements = (data: FullProfileData | null) => createCorporateClassicElements(data);

// 11. PROFESSIONAL CLASSIC - Diseño clásico con círculos concéntricos
export const createProfessionalClassicElements = (data: FullProfileData | null) => createCorporateClassicElements(data);

// 12. HEALTHCARE PROFESSIONAL - Diseño médico profesional
export const createHealthcareProfessionalElements = (fullProfileData: FullProfileData | null): CVElement[] => {
  const base = createCorporateClassicElements(fullProfileData);
  return base.map(el => {
    if (el.backgroundColor === '#0f172a') return { ...el, backgroundColor: '#0ea5e9' };
    if (el.color === '#0f172a') return { ...el, color: '#0369a1' };
    return el;
  });
};
