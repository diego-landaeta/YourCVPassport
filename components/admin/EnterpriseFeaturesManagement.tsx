/**
 * Enterprise Features Management
 *
 * Panel de administración para gestionar las funcionalidades Enterprise
 * Permite crear, editar y asignar features a usuarios
 */

import React, { useState, useEffect } from 'react';
import { useEnterpriseAdmin, FeatureCategory } from '../../hooks/useEnterpriseFeatures';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import AlertModal from '../shared/AlertModal';

interface EnterpriseFeatureRow {
  id: string;
  feature_key: string;
  name_en: string;
  name_es: string;
  description_en: string | null;
  description_es: string | null;
  icon: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORY_OPTIONS: { value: FeatureCategory; label_es: string; label_en: string; color: string }[] = [
  { value: 'support', label_es: 'Soporte', label_en: 'Support', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'integration', label_es: 'Integración', label_en: 'Integration', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'customization', label_es: 'Personalización', label_en: 'Customization', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'analytics', label_es: 'Analytics', label_en: 'Analytics', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'team', label_es: 'Equipo', label_en: 'Team', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'content', label_es: 'Contenido', label_en: 'Content', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'general', label_es: 'General', label_en: 'General', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
];

const ICON_OPTIONS = [
  'star', 'headset', 'user-tie', 'clock', 'code', 'bell', 'link', 'key',
  'palette', 'globe', 'brush', 'mail', 'chart-bar', 'download', 'users',
  'users-cog', 'shield', 'layers', 'cpu', 'video', 'check', 'sparkles'
];

const enterpriseTranslations = {
  en: {
    title: 'Enterprise Features',
    featuresConfigured: 'features configured',
    newFeature: 'New Feature',
    editFeature: 'Edit Feature',
    table: {
      feature: 'Feature',
      category: 'Category',
      status: 'Status',
      order: 'Order',
      actions: 'Actions',
    },
    edit: 'Edit',
    delete: 'Delete',
    noFeaturesInCategory: 'No features in this category',
    form: {
      uniqueKey: 'Unique key *',
      keyPlaceholder: 'e.g.: custom_feature',
      nameEn: 'Name (EN) *',
      nameEnPlaceholder: 'Feature Name',
      nameEs: 'Name (ES) *',
      nameEsPlaceholder: 'Feature Name',
      descriptionEn: 'Description (EN)',
      descriptionEnPlaceholder: 'Description...',
      descriptionEs: 'Description (ES)',
      descriptionEsPlaceholder: 'Description...',
      category: 'Category',
      icon: 'Icon',
      displayOrder: 'Display order',
      featureActive: 'Feature active',
      saving: 'Saving...',
      save: 'Save',
      cancel: 'Cancel',
    },
    alerts: {
      loadError: 'Error loading features',
      requiredFields: 'Please fill in all required fields',
      success: 'Success',
      updated: 'Feature updated successfully',
      created: 'Feature created successfully',
      saveError: 'Error saving feature',
      deleteTitle: 'Delete Feature',
      deleteConfirm: 'Are you sure you want to delete',
      deleteWarning: 'This will remove the feature from all users.',
      deleteText: 'Delete',
      cancelText: 'Cancel',
      deleted: 'Feature deleted successfully',
      deleteError: 'Error deleting feature',
      updateError: 'Error updating feature',
    },
  },
  es: {
    title: 'Funcionalidades Enterprise',
    featuresConfigured: 'funcionalidades configuradas',
    newFeature: 'Nueva Funcionalidad',
    editFeature: 'Editar Funcionalidad',
    table: {
      feature: 'Funcionalidad',
      category: 'Categoría',
      status: 'Estado',
      order: 'Orden',
      actions: 'Acciones',
    },
    edit: 'Editar',
    delete: 'Eliminar',
    noFeaturesInCategory: 'No hay funcionalidades en esta categoría',
    form: {
      uniqueKey: 'Clave única *',
      keyPlaceholder: 'ej: custom_feature',
      nameEn: 'Nombre (EN) *',
      nameEnPlaceholder: 'Feature Name',
      nameEs: 'Nombre (ES) *',
      nameEsPlaceholder: 'Nombre de la Funcionalidad',
      descriptionEn: 'Descripción (EN)',
      descriptionEnPlaceholder: 'Description...',
      descriptionEs: 'Descripción (ES)',
      descriptionEsPlaceholder: 'Descripción...',
      category: 'Categoría',
      icon: 'Icono',
      displayOrder: 'Orden de visualización',
      featureActive: 'Funcionalidad activa',
      saving: 'Guardando...',
      save: 'Guardar',
      cancel: 'Cancelar',
    },
    alerts: {
      loadError: 'Error al cargar las funcionalidades',
      requiredFields: 'Por favor completa todos los campos requeridos',
      success: 'Éxito',
      updated: 'Funcionalidad actualizada correctamente',
      created: 'Funcionalidad creada correctamente',
      saveError: 'Error al guardar la funcionalidad',
      deleteTitle: 'Eliminar Funcionalidad',
      deleteConfirm: '¿Estás seguro de eliminar',
      deleteWarning: 'Esto eliminará la funcionalidad de todos los usuarios.',
      deleteText: 'Eliminar',
      cancelText: 'Cancelar',
      deleted: 'Funcionalidad eliminada correctamente',
      deleteError: 'Error al eliminar la funcionalidad',
      updateError: 'Error al actualizar la funcionalidad',
    },
  },
};

const EnterpriseFeaturesManagement: React.FC = () => {
  const { getAllFeatures, createFeature, updateFeature, deleteFeature, isLoading } = useEnterpriseAdmin();
  const { dialogState, showAlert, showConfirm, handleConfirm, handleCancel } = useCustomDialog();
  const { lang } = useLanguage();
  const et = enterpriseTranslations[lang];

  const [features, setFeatures] = useState<EnterpriseFeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<EnterpriseFeatureRow | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    feature_key: '',
    name_en: '',
    name_es: '',
    description_en: '',
    description_es: '',
    icon: 'star',
    category: 'general' as FeatureCategory,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const data = await getAllFeatures();
      setFeatures(data || []);
    } catch (err) {
      console.error('Error loading features:', err);
      showAlert({
        title: 'Error',
        message: et.alerts.loadError,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingFeature(null);
    setFormData({
      feature_key: '',
      name_en: '',
      name_es: '',
      description_en: '',
      description_es: '',
      icon: 'star',
      category: 'general',
      is_active: true,
      sort_order: features.length * 10,
    });
    setShowModal(true);
  };

  const handleEdit = (feature: EnterpriseFeatureRow) => {
    setEditingFeature(feature);
    setFormData({
      feature_key: feature.feature_key,
      name_en: feature.name_en,
      name_es: feature.name_es,
      description_en: feature.description_en || '',
      description_es: feature.description_es || '',
      icon: feature.icon,
      category: feature.category as FeatureCategory,
      is_active: feature.is_active,
      sort_order: feature.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.feature_key || !formData.name_en || !formData.name_es) {
        showAlert({
          title: 'Error',
          message: et.alerts.requiredFields,
          type: 'error'
        });
        return;
      }

      if (editingFeature) {
        // Update existing
        await updateFeature(editingFeature.feature_key, {
          name_en: formData.name_en,
          name_es: formData.name_es,
          description_en: formData.description_en,
          description_es: formData.description_es,
          icon: formData.icon,
          category: formData.category,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        });
        showAlert({
          title: et.alerts.success,
          message: et.alerts.updated,
          type: 'success'
        });
      } else {
        // Create new
        await createFeature({
          feature_key: formData.feature_key.toLowerCase().replace(/\s+/g, '_'),
          name_en: formData.name_en,
          name_es: formData.name_es,
          description_en: formData.description_en,
          description_es: formData.description_es,
          icon: formData.icon,
          category: formData.category,
          sort_order: formData.sort_order,
        });
        showAlert({
          title: et.alerts.success,
          message: et.alerts.created,
          type: 'success'
        });
      }

      setShowModal(false);
      loadFeatures();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || et.alerts.saveError,
        type: 'error'
      });
    }
  };

  const handleDelete = async (feature: EnterpriseFeatureRow) => {
    const featureDisplayName = lang === 'es' ? feature.name_es : feature.name_en;
    const confirmed = await showConfirm({
      title: et.alerts.deleteTitle,
      message: `${et.alerts.deleteConfirm} "${featureDisplayName}"? ${et.alerts.deleteWarning}`,
      type: 'warning',
      confirmText: et.alerts.deleteText,
      cancelText: et.alerts.cancelText
    });

    if (!confirmed) return;

    try {
      await deleteFeature(feature.feature_key);
      showAlert({
        title: et.alerts.success,
        message: et.alerts.deleted,
        type: 'success'
      });
      loadFeatures();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || et.alerts.deleteError,
        type: 'error'
      });
    }
  };

  const handleToggleActive = async (feature: EnterpriseFeatureRow) => {
    try {
      await updateFeature(feature.feature_key, {
        is_active: !feature.is_active
      });
      loadFeatures();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || et.alerts.updateError,
        type: 'error'
      });
    }
  };

  const filteredFeatures = filterCategory === 'all'
    ? features
    : features.filter(f => f.category === filterCategory);

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === category);
    return cat || CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
  };

  const getCategoryLabel = (cat: typeof CATEGORY_OPTIONS[0]) => {
    return lang === 'es' ? cat.label_es : cat.label_en;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {et.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {features.length} {et.featuresConfigured}
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {et.newFeature}
        </button>
      </div>

      {/* Stats by Category */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {CATEGORY_OPTIONS.map(cat => {
          const count = features.filter(f => f.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(filterCategory === cat.value ? 'all' : cat.value)}
              className={`rounded-lg p-3 border transition-all ${
                filterCategory === cat.value
                  ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              } ${cat.color.replace('text-', 'bg-').split(' ')[0]}/10`}
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{getCategoryLabel(cat)}</div>
            </button>
          );
        })}
      </div>

      {/* Features Table */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md overflow-hidden">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {et.table.feature}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {et.table.category}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {et.table.status}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {et.table.order}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {et.table.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFeatures.map(feature => {
              const catBadge = getCategoryBadge(feature.category);
              return (
                <tr key={feature.id} className={`hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary ${!feature.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <span className="text-lg">{getIconEmoji(feature.icon)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {lang === 'es' ? feature.name_es : feature.name_en}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {feature.feature_key}
                        </div>
                        {(lang === 'es' ? feature.description_es : feature.description_en) && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-md truncate">
                            {lang === 'es' ? feature.description_es : feature.description_en}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${catBadge.color}`}>
                      {getCategoryLabel(catBadge)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(feature)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        feature.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          feature.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.sort_order}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(feature)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:text-indigo-400 rounded transition-colors"
                        title={et.edit}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(feature)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 rounded transition-colors"
                        title={et.delete}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {et.noFeaturesInCategory}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingFeature ? et.editFeature : et.newFeature}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Feature Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {et.form.uniqueKey}
                  </label>
                  <input
                    type="text"
                    value={formData.feature_key}
                    onChange={(e) => setFormData({ ...formData, feature_key: e.target.value })}
                    disabled={!!editingFeature}
                    placeholder={et.form.keyPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white disabled:opacity-50"
                  />
                </div>

                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {et.form.nameEn}
                    </label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder={et.form.nameEnPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {et.form.nameEs}
                    </label>
                    <input
                      type="text"
                      value={formData.name_es}
                      onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
                      placeholder={et.form.nameEsPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {et.form.descriptionEn}
                    </label>
                    <textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      rows={2}
                      placeholder={et.form.descriptionEnPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {et.form.descriptionEs}
                    </label>
                    <textarea
                      value={formData.description_es}
                      onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                      rows={2}
                      placeholder={et.form.descriptionEsPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white"
                    />
                  </div>
                </div>

                {/* Category & Icon */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {et.form.category}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as FeatureCategory })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white"
                    >
                      {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat.value} value={cat.value}>{getCategoryLabel(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {et.form.icon}
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white"
                    >
                      {ICON_OPTIONS.map(icon => (
                        <option key={icon} value={icon}>{getIconEmoji(icon)} {icon}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {et.form.displayOrder}
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-dark-bg-tertiary dark:text-white"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {et.form.featureActive}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? et.form.saving : et.form.save}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {et.form.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={dialogState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        showCancel={dialogState.showCancel}
      />
    </div>
  );
};

// Helper function to get emoji for icon names
function getIconEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    'star': '⭐',
    'headset': '🎧',
    'user-tie': '👔',
    'clock': '🕐',
    'code': '💻',
    'bell': '🔔',
    'link': '🔗',
    'key': '🔑',
    'palette': '🎨',
    'globe': '🌐',
    'brush': '🖌️',
    'mail': '📧',
    'chart-bar': '📊',
    'download': '📥',
    'users': '👥',
    'users-cog': '⚙️',
    'shield': '🛡️',
    'layers': '📚',
    'cpu': '🤖',
    'video': '🎬',
    'check': '✅',
    'sparkles': '✨',
  };
  return iconMap[icon] || '⭐';
}

export default EnterpriseFeaturesManagement;
