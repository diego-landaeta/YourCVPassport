import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { templates } from '../templates/templateData';
import { adminTemplatesList, AdminTemplateLoader } from '../templates/AdminTemplateLoader';
import { StandardTemplateLoader } from '../templates/StandardTemplateLoader';
import { SAMPLE_PROFILES } from './sampleProfiles';
import type { FullProfileData } from '../../types';

const LOCAL_TEXT = {
  es: {
    updateError: 'Error al actualizar la configuración de la plantilla',
    loading: 'Cargando plantillas...',
    title: 'Gestión de Plantillas',
    subtitle: 'Configura qué plantillas están disponibles para usuarios gratuitos y premium',
    statTotal: 'Total de Plantillas',
    statFree: 'Plantillas Gratuitas',
    statPremium: 'Plantillas Premium',
    statHidden: 'Plantillas Ocultas',
    searchPlaceholder: 'Buscar plantilla por nombre o ID...',
    searchLabel: 'Buscar plantilla',
    filterLabel: 'Filtrar plantillas',
    filterAll: 'Todas',
    filterFree: 'Gratuitas',
    filterPremium: 'Premium',
    filterHidden: 'Ocultas',
    cols: { template: 'Plantilla', id: 'ID', preview: 'Vista Previa', free: 'Gratuita', premium: 'Premium', hidden: 'Oculta', status: 'Estado' },
    experimental: 'Experimental',
    view: 'Ver',
    viewPreviewOf: (name: string) => `Ver vista previa de ${name}`,
    no: 'No',
    isFree: '✓ Free',
    isPremium: '✓ Premium',
    isHidden: '✓ Oculta',
    visible: 'Visible',
    statusHidden: 'Oculta',
    statusFree: 'Gratuita',
    statusPremium: 'Premium',
    statusUnset: 'Sin configurar',
    noResults: 'No se encontraron plantillas que coincidan con los filtros',
    helpTitle: 'Cómo funciona',
    help: [
      ['Gratuita:', 'Disponible para todos los usuarios (free)'],
      ['Premium:', 'Solo disponible para usuarios con plan premium'],
      ['Oculta:', 'No visible para ningún usuario (útil para plantillas en desarrollo)'],
    ],
    helpExclusive: 'Una plantilla no puede ser gratuita y premium al mismo tiempo',
    helpExperimental: 'Las plantillas experimentales están marcadas con la etiqueta "Experimental"',
    previewTitle: 'Vista Previa:',
    sampleUser: 'Usuario de prueba:',
    closePreview: 'Cerrar vista previa',
    previewHint: 'Vista previa con datos de ejemplo - Cambia el usuario de prueba arriba',
    close: 'Cerrar',
  },
  en: {
    updateError: 'Error updating the template configuration',
    loading: 'Loading templates...',
    title: 'Template Management',
    subtitle: 'Choose which templates are available to free and premium users',
    statTotal: 'Total templates',
    statFree: 'Free templates',
    statPremium: 'Premium templates',
    statHidden: 'Hidden templates',
    searchPlaceholder: 'Search template by name or ID...',
    searchLabel: 'Search template',
    filterLabel: 'Filter templates',
    filterAll: 'All',
    filterFree: 'Free',
    filterPremium: 'Premium',
    filterHidden: 'Hidden',
    cols: { template: 'Template', id: 'ID', preview: 'Preview', free: 'Free', premium: 'Premium', hidden: 'Hidden', status: 'Status' },
    experimental: 'Experimental',
    view: 'View',
    viewPreviewOf: (name: string) => `View preview of ${name}`,
    no: 'No',
    isFree: '✓ Free',
    isPremium: '✓ Premium',
    isHidden: '✓ Hidden',
    visible: 'Visible',
    statusHidden: 'Hidden',
    statusFree: 'Free',
    statusPremium: 'Premium',
    statusUnset: 'Not configured',
    noResults: 'No templates match the filters',
    helpTitle: 'How it works',
    help: [
      ['Free:', 'Available to all users (free)'],
      ['Premium:', 'Only available to users with a premium plan'],
      ['Hidden:', 'Not visible to any user (useful for templates in development)'],
    ],
    helpExclusive: 'A template cannot be free and premium at the same time',
    helpExperimental: 'Experimental templates are marked with the "Experimental" label',
    previewTitle: 'Preview:',
    sampleUser: 'Sample user:',
    closePreview: 'Close preview',
    previewHint: 'Preview with sample data - Change the sample user above',
    close: 'Close',
  },
};

interface TemplateConfig {
  id: string;
  name: string;
  is_free: boolean;
  is_premium: boolean;
  is_hidden: boolean;
  preview_url?: string;
}

export const TemplateManagement: React.FC = () => {
  const { lang } = useLanguage();
  const lt = LOCAL_TEXT[lang === 'en' ? 'en' : 'es'];
  const [templateConfigs, setTemplateConfigs] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'premium' | 'hidden'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('jane-developer');

  // Combinar todas las plantillas (estándar + experimentales)
  const allTemplates = [
    ...templates.map(t => ({
      id: t.id,
      name: typeof t.name === 'string' ? t.name : t.name.es,
      type: 'standard' as const,
      isPro: t.isPro || false,
    })),
    ...adminTemplatesList.map(t => ({
      id: t.id,
      name: t.name,
      type: 'experimental' as const,
      isPro: true, // Por defecto las experimentales son premium
    })),
  ];

  useEffect(() => {
    loadTemplateConfigs();
  }, []);

  const loadTemplateConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('template_configs')
        .select('*');

      if (error) throw error;

      // Crear configuración por defecto para plantillas que no existen en BD
      const configs: TemplateConfig[] = allTemplates.map(template => {
        const existingConfig = data?.find(c => c.template_id === template.id);

        if (existingConfig) {
          return {
            id: existingConfig.template_id,
            name: template.name,
            is_free: existingConfig.is_free,
            is_premium: existingConfig.is_premium,
            is_hidden: existingConfig.is_hidden,
            preview_url: existingConfig.preview_url,
          };
        }

        // Configuración por defecto
        return {
          id: template.id,
          name: template.name,
          is_free: !template.isPro,
          is_premium: template.isPro,
          is_hidden: false,
        };
      });

      setTemplateConfigs(configs);
    } catch (error) {
      console.error('Error loading template configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTemplateConfig = async (templateId: string, updates: Partial<TemplateConfig>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('template_configs')
        .upsert({
          template_id: templateId,
          is_free: updates.is_free ?? false,
          is_premium: updates.is_premium ?? false,
          is_hidden: updates.is_hidden ?? false,
          preview_url: updates.preview_url,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'template_id'
        });

      if (error) throw error;

      // Actualizar estado local
      setTemplateConfigs(prev => prev.map(config =>
        config.id === templateId
          ? { ...config, ...updates }
          : config
      ));

    } catch (error) {
      console.error('Error updating template config:', error);
      alert(lt.updateError);
    } finally {
      setSaving(false);
    }
  };

  const toggleFree = (templateId: string) => {
    const config = templateConfigs.find(c => c.id === templateId);
    if (!config) return;

    updateTemplateConfig(templateId, {
      is_free: !config.is_free,
      is_premium: config.is_free ? false : config.is_premium, // Si se marca free, se quita premium
    });
  };

  const togglePremium = (templateId: string) => {
    const config = templateConfigs.find(c => c.id === templateId);
    if (!config) return;

    updateTemplateConfig(templateId, {
      is_premium: !config.is_premium,
      is_free: config.is_premium ? false : config.is_free, // Si se marca premium, se quita free
    });
  };

  const toggleHidden = (templateId: string) => {
    const config = templateConfigs.find(c => c.id === templateId);
    if (!config) return;

    updateTemplateConfig(templateId, {
      is_hidden: !config.is_hidden,
    });
  };

  const filteredTemplates = templateConfigs.filter(template => {
    // Filtro por búsqueda
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro por tipo
    switch (filterType) {
      case 'free':
        return template.is_free;
      case 'premium':
        return template.is_premium;
      case 'hidden':
        return template.is_hidden;
      default:
        return true;
    }
  });

  const stats = {
    total: templateConfigs.length,
    free: templateConfigs.filter(t => t.is_free).length,
    premium: templateConfigs.filter(t => t.is_premium).length,
    hidden: templateConfigs.filter(t => t.is_hidden).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border">
        <div className="text-gray-600 dark:text-dark-text-secondary">{lt.loading}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{lt.title}</h2>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
            {lt.subtitle}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{stats.total}</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">{lt.statTotal}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900 dark:text-green-200">{stats.free}</div>
          <div className="text-sm text-green-700 dark:text-green-300">{lt.statFree}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">{stats.premium}</div>
          <div className="text-sm text-purple-700 dark:text-purple-300">{lt.statPremium}</div>
        </div>
        <div className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.hidden}</div>
          <div className="text-sm text-gray-600 dark:text-dark-text-secondary">{lt.statHidden}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder={lt.searchPlaceholder}
          aria-label={lt.searchLabel}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          aria-label={lt.filterLabel}
          className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">{lt.filterAll} ({stats.total})</option>
          <option value="free">{lt.filterFree} ({stats.free})</option>
          <option value="premium">{lt.filterPremium} ({stats.premium})</option>
          <option value="hidden">{lt.filterHidden} ({stats.hidden})</option>
        </select>
      </div>

      {/* Template List */}
      <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                {lt.cols.template}
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                {lt.cols.id}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                {lt.cols.preview}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                {lt.cols.free}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                {lt.cols.premium}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                {lt.cols.hidden}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                {lt.cols.status}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
            {filteredTemplates.map((template) => (
              <tr
                key={template.id}
                className={`hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors ${template.is_hidden ? 'opacity-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{template.name}</div>
                      {template.id.startsWith('admin-') && (
                        <div className="text-xs text-purple-700 dark:text-purple-400 font-medium">{lt.experimental}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-gray-600 dark:text-dark-text-secondary font-mono">{template.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template.id)}
                    aria-label={lt.viewPreviewOf(template.name)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <span aria-hidden="true">👁️</span> {lt.view}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => toggleFree(template.id)}
                    disabled={saving || template.is_hidden}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      template.is_free
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {template.is_free ? lt.isFree : lt.no}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => togglePremium(template.id)}
                    disabled={saving || template.is_hidden}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      template.is_premium
                        ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {template.is_premium ? lt.isPremium : lt.no}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => toggleHidden(template.id)}
                    disabled={saving}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      template.is_hidden
                        ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {template.is_hidden ? lt.isHidden : lt.visible}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {template.is_hidden ? (
                    <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                      {lt.statusHidden}
                    </span>
                  ) : template.is_free ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                      {lt.statusFree}
                    </span>
                  ) : template.is_premium ? (
                    <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                      {lt.statusPremium}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary rounded-full">
                      {lt.statusUnset}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-600 dark:text-dark-text-secondary">
            {lt.noResults}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2"><span aria-hidden="true">ℹ️</span> {lt.helpTitle}</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          {lt.help.map(([term, desc]) => (
            <li key={term}><strong>{term}</strong> {desc}</li>
          ))}
          <li>{lt.helpExclusive}</li>
          <li>{lt.helpExperimental}</li>
        </ul>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex-1 min-w-0">
                <h3 id="template-preview-title" className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                  {lt.previewTitle} {templateConfigs.find(t => t.id === previewTemplate)?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary font-mono">{previewTemplate}</p>

                {/* Profile Selector */}
                <div className="mt-2">
                  <label htmlFor="template-preview-profile" className="text-xs text-gray-600 dark:text-dark-text-secondary mr-2">{lt.sampleUser}</label>
                  <select
                    id="template-preview-profile"
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="text-xs border border-gray-300 dark:border-dark-border rounded px-2 py-1 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(SAMPLE_PROFILES).map(([key, profile]) => (
                      <option key={key} value={key}>{profile.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                aria-label={lt.closePreview}
                className="text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary transition-colors ml-4"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-dark-bg-primary">
              {/* Lienzo del CV: siempre claro. `cv-force-light` anula las variantes
                  dark: de la plantilla aunque la pagina este en modo oscuro
                  (ver darkMode en tailwind.config.js); `text-black` corta la herencia
                  del color de texto claro de la pagina oscura. */}
              <div className="cv-force-light text-black bg-white rounded-lg shadow-lg overflow-auto" style={{ maxHeight: '70vh' }}>
                {previewTemplate.startsWith('admin-') ? (
                  <AdminTemplateLoader
                    templateId={previewTemplate}
                    data={SAMPLE_PROFILES[selectedProfile].data}
                  />
                ) : (
                  <StandardTemplateLoader
                    templateId={previewTemplate}
                    data={SAMPLE_PROFILES[selectedProfile].data}
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary rounded-b-lg">
              <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                <span aria-hidden="true">💡</span> {lt.previewHint}
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {lt.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
