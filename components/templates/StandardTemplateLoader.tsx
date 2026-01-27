import React, { lazy, Suspense } from 'react';
import { FullProfileData } from '../../types';

// Mapeo de IDs a componentes de plantillas estándar
const standardTemplateComponents: Record<string, any> = {
  'passport': lazy(() => import('./PassportTemplate')),
  'classic': lazy(() => import('./ClassicTemplate')),
  'modern-professional': lazy(() => import('./ModernProfessionalTemplate')),
  'corporate-classic': lazy(() => import('./CorporateClassicTemplate')),
  'creative-minimalist': lazy(() => import('./CreativeMinimalistTemplate')),
  'academic-standard': lazy(() => import('./AcademicStandardTemplate')),
  'modern-clean': lazy(() => import('./ModernCleanTemplate')),
  'professional-blue': lazy(() => import('./ProfessionalBlueTemplate')),
  'professional-classic': lazy(() => import('./ProfessionalClassicTemplate')),
  'elegant-minimal': lazy(() => import('./ElegantMinimalTemplate')),
  'modern-minimalist': lazy(() => import('./ModernMinimalistTemplate')),
  'creative-bold': lazy(() => import('./CreativeBoldTemplate')),
  'creative-modern': lazy(() => import('./CreativeModernTemplate')),
  'creative-orange': lazy(() => import('./CreativeOrangeTemplate')),
  'green-minimal': lazy(() => import('./GreenMinimalTemplate')),
  'healthcare-professional': lazy(() => import('./HealthcareProfessionalTemplate')),
  'yellow-minimalist': lazy(() => import('./YellowMinimalistTemplate')),
  'gradient-blue': lazy(() => import('./BlueGradientTemplate')),
  'classic-sidebar': lazy(() => import('./ClassicSidebarTemplate')),
  'coral-pink': lazy(() => import('./CoralPinkTemplate')),
  'urban': lazy(() => import('./UrbanTemplate')),
};

interface StandardTemplateLoaderProps {
  templateId: string;
  data: FullProfileData;
}

export const StandardTemplateLoader: React.FC<StandardTemplateLoaderProps> = ({ templateId, data }) => {
  const TemplateComponent = standardTemplateComponents[templateId];

  if (!TemplateComponent) {
    return <div className="p-8 text-center">Plantilla no encontrada: {templateId}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start p-8 print:p-0 print:bg-white">
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none print:max-w-full">
        <Suspense fallback={<div className="p-8 text-center">Cargando plantilla...</div>}>
          <TemplateComponent data={data} />
        </Suspense>
      </div>
    </div>
  );
};
