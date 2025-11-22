/**
 * ATS Templates Export Index
 *
 * Centraliza la exportación de todas las plantillas ATS
 */

export { ClassicATSTemplate } from './ClassicATSTemplate';
export { ModernATSTemplate } from './ModernATSTemplate';
export { MinimalATSTemplate } from './MinimalATSTemplate';

// Re-exportar tipos y utilidades para fácil acceso
export type { ATSTemplateType } from '../../../types/ats-export.types';
export { ATS_TEMPLATE_CONFIGS } from '../../../utils/pdf/ats-optimizer';
