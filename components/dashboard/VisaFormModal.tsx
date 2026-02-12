import React, { useState, useEffect } from 'react';
import { Visa } from '../../types';
import Modal from '../shared/Modal';
import { useTranslations } from '../../hooks/useTranslations';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VisaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visa: Omit<Visa, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData?: Visa;
  profileId: string;
}

const VisaFormModal: React.FC<VisaFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  profileId
}) => {
  const translations = useTranslations();
  const t = translations.dashboard.visas;

  const [formData, setFormData] = useState({
    title: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    context: '',
    start_date: '',
    end_date: '',
    tags: [] as string[],
    images: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        situation: initialData.situation || '',
        task: initialData.task || '',
        action: initialData.action || '',
        result: initialData.result || '',
        context: initialData.context || '',
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        tags: initialData.tags || [],
        images: initialData.images || []
      });
    } else {
      setFormData({
        title: '',
        situation: '',
        task: '',
        action: '',
        result: '',
        context: '',
        start_date: '',
        end_date: '',
        tags: [],
        images: []
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.context.trim() && !formData.situation.trim()) {
      newErrors.context = 'Debes proporcionar al menos el contexto o la situación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const visaData: Omit<Visa, 'id' | 'created_at' | 'updated_at'> = {
        profile_id: profileId,
        slug,
        title: formData.title,
        situation: formData.situation || null,
        task: formData.task || null,
        action: formData.action || null,
        result: formData.result || null,
        context: formData.context || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        images: formData.images.length > 0 ? formData.images : null,
        media_urls: formData.images.length > 0 ? formData.images : [],
        sort_order: initialData?.sort_order || 0,
        metrics: null,
        video_urls: null,
        results: null
      };

      await onSave(visaData);
      onClose();
    } catch (error) {} finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()]
      });
      setImageInput('');
    }
  };

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter(img => img !== image)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Visa' : 'Nueva Visa'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Implementación de Sistema de Pagos"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="text-sm text-red-500 mt-1">
              {errors.title}
            </p>
          )}
        </div>

        {/* Context */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contexto <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.context}
            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white ${
              errors.context ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe brevemente el contexto del proyecto..."
            aria-invalid={!!errors.context}
            aria-describedby={errors.context ? 'context-error' : undefined}
          />
          {errors.context && (
            <p id="context-error" className="text-sm text-red-500 mt-1">
              {errors.context}
            </p>
          )}
        </div>

        {/* CAR Method (Optional) */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Metodología CAR (Opcional)
          </h3>

          {/* Situation */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Situación (Context)
            </label>
            <textarea
              value={formData.situation}
              onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white"
              placeholder="¿Cuál era el contexto o situación?"
            />
          </div>

          {/* Action */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Acción (Action)
            </label>
            <textarea
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white"
              placeholder="¿Qué acciones tomaste?"
            />
          </div>

          {/* Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resultado (Result)
            </label>
            <textarea
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white"
              placeholder="¿Cuáles fueron los resultados?"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Etiquetas
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white"
              placeholder="Añadir etiqueta..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Añadir
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-cv-blue bg-opacity-10 text-cv-blue rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-cv-blue hover:bg-opacity-20 rounded-full p-0.5"
                  aria-label={`Remove tag ${tag}`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Imágenes (URLs)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-white"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            <button
              type="button"
              onClick={addImage}
              className="px-4 py-2 bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Añadir
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(image)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {formData.images.length === 0 && (
              <div className="col-span-2 md:col-span-3 flex items-center justify-center h-24 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg">
                <div className="text-center text-gray-400">
                  <PhotoIcon className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Sin imágenes</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              initialData ? 'Actualizar' : 'Crear'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VisaFormModal;

