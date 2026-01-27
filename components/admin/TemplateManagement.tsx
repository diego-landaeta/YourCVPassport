import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { templates } from '../templates/templateData';
import { adminTemplatesList, AdminTemplateLoader } from '../templates/AdminTemplateLoader';
import { StandardTemplateLoader } from '../templates/StandardTemplateLoader';
import { SAMPLE_PROFILES } from './sampleProfiles';
import type { FullProfileData } from '../../types';

interface TemplateConfig {
  id: string;
  name: string;
  is_free: boolean;
  is_premium: boolean;
  is_hidden: boolean;
  preview_url?: string;
}

export const TemplateManagement: React.FC = () => {
  const { t } = useLanguage();
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

      console.log('✅ Template config updated');
    } catch (error) {
      console.error('Error updating template config:', error);
      alert('Error al actualizar la configuración de la plantilla');
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
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Cargando plantillas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Plantillas</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configura qué plantillas están disponibles para usuarios gratuitos y premium
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-sm text-blue-600">Total de Plantillas</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{stats.free}</div>
          <div className="text-sm text-green-600">Plantillas Gratuitas</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">{stats.premium}</div>
          <div className="text-sm text-purple-600">Plantillas Premium</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.hidden}</div>
          <div className="text-sm text-gray-600">Plantillas Ocultas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar plantilla por nombre o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todas ({stats.total})</option>
          <option value="free">Gratuitas ({stats.free})</option>
          <option value="premium">Premium ({stats.premium})</option>
          <option value="hidden">Ocultas ({stats.hidden})</option>
        </select>
      </div>

      {/* Template List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plantilla
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vista Previa
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gratuita
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Premium
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oculta
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <tr
                key={template.id}
                className={`hover:bg-gray-50 transition-colors ${template.is_hidden ? 'opacity-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      {template.id.startsWith('admin-') && (
                        <div className="text-xs text-purple-600 font-medium">Experimental</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-gray-500 font-mono">{template.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => setPreviewTemplate(template.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    👁️ Ver
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => toggleFree(template.id)}
                    disabled={saving || template.is_hidden}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      template.is_free
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {template.is_free ? '✓ Free' : 'No'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => togglePremium(template.id)}
                    disabled={saving || template.is_hidden}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      template.is_premium
                        ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {template.is_premium ? '✓ Premium' : 'No'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => toggleHidden(template.id)}
                    disabled={saving}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      template.is_hidden
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {template.is_hidden ? '✓ Oculta' : 'Visible'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {template.is_hidden ? (
                    <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                      Oculta
                    </span>
                  ) : template.is_free ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      Gratuita
                    </span>
                  ) : template.is_premium ? (
                    <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                      Premium
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                      Sin configurar
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron plantillas que coincidan con los filtros
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Cómo funciona</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Gratuita:</strong> Disponible para todos los usuarios (free)</li>
          <li><strong>Premium:</strong> Solo disponible para usuarios con plan premium</li>
          <li><strong>Oculta:</strong> No visible para ningún usuario (útil para plantillas en desarrollo)</li>
          <li>Una plantilla no puede ser gratuita y premium al mismo tiempo</li>
          <li>Las plantillas experimentales están marcadas con la etiqueta "Experimental"</li>
        </ul>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vista Previa: {templateConfigs.find(t => t.id === previewTemplate)?.name}
                </h3>
                <p className="text-sm text-gray-500 font-mono">{previewTemplate}</p>

                {/* Profile Selector */}
                <div className="mt-2">
                  <label className="text-xs text-gray-600 mr-2">Usuario de prueba:</label>
                  <select
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(SAMPLE_PROFILES).map(([key, profile]) => (
                      <option key={key} value={key}>{profile.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="bg-white rounded-lg shadow-lg overflow-auto" style={{ maxHeight: '70vh' }}>
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
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                💡 Vista previa con datos de ejemplo - Cambia el usuario de prueba arriba
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
