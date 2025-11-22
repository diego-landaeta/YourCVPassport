/**
 * ATS-Friendly PDF Export Types
 *
 * Tipos para el sistema de exportación de CVs optimizados para ATS
 * (Applicant Tracking Systems)
 */

import { FullProfileData, Stamp } from '../types';

/**
 * Plantillas de CV disponibles optimizadas para ATS
 */
export type ATSTemplateType = 'classic' | 'modern' | 'minimal';

/**
 * Configuración de fuente para el PDF
 */
export interface ATSFontConfig {
  family: 'Times-Roman' | 'Helvetica' | 'Courier';
  size: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
  };
  lineHeight: number;
}

/**
 * Configuración de colores para la plantilla
 * ATS-friendly significa usar principalmente negro con acentos mínimos
 */
export interface ATSColorConfig {
  primary: string;      // Color principal (negro por defecto)
  secondary: string;    // Color secundario/acento (gris oscuro)
  accent?: string;      // Color de acento opcional (solo para Modern)
  text: string;         // Color del texto principal
  muted: string;        // Color del texto secundario
}

/**
 * Configuración de espaciado para el PDF
 */
export interface ATSSpacingConfig {
  pageMargin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sectionGap: number;    // Espacio entre secciones
  itemGap: number;       // Espacio entre items dentro de una sección
  lineGap: number;       // Espacio entre líneas
}

/**
 * Configuración completa de una plantilla ATS
 */
export interface ATSTemplateConfig {
  id: ATSTemplateType;
  name: string;
  description: string;
  font: ATSFontConfig;
  colors: ATSColorConfig;
  spacing: ATSSpacingConfig;
  showStamps: boolean;   // Si mostrar badges de verificación
}

/**
 * Opciones de exportación del PDF
 */
export interface ATSExportOptions {
  template: ATSTemplateType;
  includePhoto: boolean;
  includeStamps: boolean;
  includeSummary: boolean;
  includeSkills: boolean;
  includeLanguages: boolean;
  includePortfolio: boolean;
  includeCertifications: boolean;
  includeVisas: boolean; // STAR stories
  optimizeKeywords: boolean;
  fileName?: string;
}

/**
 * Orden de secciones para optimización ATS
 * Las secciones se pueden reordenar según preferencias
 */
export type ATSSectionType =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'portfolio'
  | 'visas';

export interface ATSSectionConfig {
  type: ATSSectionType;
  title: string;
  enabled: boolean;
  order: number;
}

/**
 * Datos procesados para la exportación ATS
 * Incluye optimizaciones y formato específico
 */
export interface ATSProcessedData {
  profile: FullProfileData;
  stamps: Stamp[];
  keywords: string[];        // Keywords extraídas del perfil
  sections: ATSSectionConfig[];
}

/**
 * Metadata del PDF generado
 */
export interface ATSPDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate: Date;
}

/**
 * Resultado de la exportación
 */
export interface ATSExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  fileName: string;
  error?: string;
}

/**
 * Estadísticas de la exportación (para analytics)
 */
export interface ATSExportAnalytics {
  profileId: string;
  template: ATSTemplateType;
  timestamp: Date;
  fileSize?: number;
  duration?: number; // ms
}
