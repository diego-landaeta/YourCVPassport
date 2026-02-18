/**
 * Template Preview Selector Component
 * Shows visual previews of all available CV templates with PRO badges
 */

import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

// All available templates with their properties and preview images
// Based on templateData.ts - 10 FREE + 10 PRO templates
export const ALL_TEMPLATES = [
  // FREE TEMPLATES (10)
  { id: 'passport', label: 'Pasaporte', description: 'Estilo pasaporte profesional', isPro: false, category: 'Gratis', previewImage: '/images/templates/passport.png' },
  { id: 'classic', label: 'Clásico', description: 'Diseño tradicional y profesional', isPro: false, category: 'Gratis', previewImage: '/images/templates/classic.png' },
  { id: 'modern-professional', label: 'Profesional Moderno', description: 'Profesional contemporáneo', isPro: false, category: 'Gratis', previewImage: '/images/templates/modern-professional.png' },
  { id: 'corporate-classic', label: 'Corporativo Clásico', description: 'Corporativo elegante', isPro: false, category: 'Gratis', previewImage: '/images/templates/corporate-classic.png' },
  { id: 'creative-minimalist', label: 'Creativo Minimalista', description: 'Minimalista creativo', isPro: false, category: 'Gratis', previewImage: '/images/templates/creative-minimalist.png' },
  { id: 'academic-standard', label: 'Estándar Académico', description: 'Estándar académico', isPro: false, category: 'Gratis', previewImage: '/images/templates/academic-standard.png' },
  { id: 'modern-minimalist', label: 'Moderno Minimalista', description: 'Minimalista moderno', isPro: false, category: 'Gratis', previewImage: '/images/templates/modern-minimalist.png' },
  { id: 'creative-bold', label: 'Creativo Audaz', description: 'Atrevido creativo', isPro: false, category: 'Gratis', previewImage: '/images/templates/creative-bold.png' },
  { id: 'professional-classic', label: 'Profesional Clásico', description: 'Clásico profesional', isPro: false, category: 'Gratis', previewImage: '/images/templates/professional-classic.png' },
  { id: 'healthcare-professional', label: 'Profesional de Salud', description: 'Profesional salud', isPro: false, category: 'Gratis', previewImage: '/images/templates/healthcare-professional.png' },

  // PRO TEMPLATES (10)
  { id: 'minimalist-yellow', label: 'Minimalista Amarillo', description: 'Minimalista amarillo', isPro: true, category: 'Premium', previewImage: '/images/templates/minimalist-yellow.png' },
  { id: 'gradient-blue', label: 'Gradiente Azul', description: 'Gradiente azul moderno', isPro: true, category: 'Premium', previewImage: '/images/templates/gradient-blue.png' },
  { id: 'coral-pink', label: 'Rosa Coral', description: 'Rosa coral vibrante', isPro: true, category: 'Premium', previewImage: '/images/templates/coral-pink.png' },
  { id: 'green-minimal', label: 'Verde Minimalista', description: 'Verde minimalista', isPro: true, category: 'Premium', previewImage: '/images/templates/green-minimal.png' },
  { id: 'creative-orange', label: 'Naranja Creativo', description: 'Naranja creativo', isPro: true, category: 'Premium', previewImage: '/images/templates/creative-orange.png' },
  { id: 'classic-sidebar', label: 'Barra Lateral Oscura', description: 'Clásico con barra lateral', isPro: true, category: 'Premium', previewImage: '/images/templates/classic-sidebar.png' },
  { id: 'modern-clean', label: 'Encabezado Gradiente', description: 'Moderno limpio', isPro: true, category: 'Premium', previewImage: '/images/templates/modern-clean.png' },
  { id: 'elegant-minimal', label: 'Línea de Tiempo Elegante', description: 'Elegante minimalista', isPro: true, category: 'Premium', previewImage: '/images/templates/elegant-minimal.png' },
  { id: 'professional-blue', label: 'Azul Profesional', description: 'Azul profesional', isPro: true, category: 'Premium', previewImage: '/images/templates/professional-blue.png' },
  { id: 'creative-modern', label: 'Banner Creativo', description: 'Moderno creativo', isPro: true, category: 'Premium', previewImage: '/images/templates/creative-modern.png' },
] as const;

interface TemplatePreviewSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  userIsPro: boolean;
}

// Template preview component with real image preview
function TemplatePreviewCard({
  template,
  isSelected,
  userIsPro,
  onClick
}: {
  template: typeof ALL_TEMPLATES[number];
  isSelected: boolean;
  userIsPro: boolean;
  onClick: () => void;
}) {
  const t = useTranslations();
  const tp = t.dashboard.templatePreview;
  const isLocked = template.isPro && !userIsPro;

  return (
    <button
      type="button"
      onClick={() => !isLocked && onClick()}
      disabled={isLocked}
      className={`relative group rounded-lg overflow-hidden transition-all ${
        isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'
      } ${
        isSelected
          ? 'ring-4 ring-blue-500 shadow-xl'
          : 'border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400'
      }`}
    >
      {/* Template Preview Image */}
      <div className="aspect-[8.5/11] bg-white relative overflow-hidden">
        <img
          src={template.previewImage}
          alt={template.label}
          className="w-full h-full object-cover object-top"
        />

        {/* PRO Badge */}
        {template.isPro && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            PRO
          </div>
        )}

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className={`p-2 bg-white dark:bg-gray-800 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
        <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
          {template.label}
        </div>
        {isSelected && (
          <div className="mt-1 flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {tp.selected}
          </div>
        )}
      </div>
    </button>
  );
}

export function TemplatePreviewSelector({
  selectedTemplate,
  onSelectTemplate,
  userIsPro
}: TemplatePreviewSelectorProps) {
  const t = useTranslations();
  const tp = t.dashboard.templatePreview;
  const [filter, setFilter] = useState<'all' | 'free' | 'pro'>('all');

  const filteredTemplates = ALL_TEMPLATES.filter(template => {
    if (filter === 'free') return !template.isPro;
    if (filter === 'pro') return template.isPro;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tp.all} ({ALL_TEMPLATES.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('free')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'free'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tp.free} ({ALL_TEMPLATES.filter(t => !t.isPro).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('pro')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'pro'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          PRO ({ALL_TEMPLATES.filter(t => t.isPro).length})
        </button>
      </div>

      {/* Template Grid - Improved scrolling */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {filteredTemplates.map((template) => (
          <TemplatePreviewCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            userIsPro={userIsPro}
            onClick={() => onSelectTemplate(template.id)}
          />
        ))}
      </div>

      {/* PRO Upgrade Message */}
      {!userIsPro && filter !== 'free' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {tp.unlockPro}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {tp.accessPremium(ALL_TEMPLATES.filter(t => t.isPro).length)}
              </p>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {tp.upgradeToPro} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
