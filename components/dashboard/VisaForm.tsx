import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../context/ToastContext';
import { Visa } from '../../types';
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  PhotoIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

const VisaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const toast = useToastContext();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Visa>>({
    title: '',
    slug: '',
    start_date: null,
    end_date: null,
    context: '',
    action: '',
    results: '',
    metrics: [],
    media_urls: [],
    video_urls: [],
    sort_order: 0
  });

  useEffect(() => {
    if (isEditing) {
      loadVisa();
    }
  }, [id]);

  const loadVisa = async () => {
    if (!id || !session?.user.id) return;

    try {
      const { data, error } = await supabase
        .from('visas')
        .select('*')
        .eq('id', id)
        .eq('profile_id', session.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading visa:', error);
      toast.error('Error al cargar la Visa');
      navigate('/dashboard/visas');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const addMetric = () => {
    setFormData(prev => ({
      ...prev,
      metrics: [...(prev.metrics || []), { key: '', value: '' }]
    }));
  };

  const updateMetric = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics?.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      ) || []
    }));
  };

  const removeMetric = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics?.filter((_, i) => i !== index) || []
    }));
  };

  const addMediaUrl = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        media_urls: [...(prev.media_urls || []), url]
      }));
    }
  };

  const removeMediaUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls?.filter((_, i) => i !== index) || []
    }));
  };

  const addVideoUrl = () => {
    const url = prompt('Ingresa la URL del video (YouTube o Vimeo):');
    if (url) {
      setFormData(prev => ({
        ...prev,
        video_urls: [...(prev.video_urls || []), url]
      }));
    }
  };

  const removeVideoUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      video_urls: prev.video_urls?.filter((_, i) => i !== index) || []
    }));
  };

  const generateWithAI = async (field: 'context' | 'action' | 'results') => {
    if (!formData.title) {
      toast.warning('Por favor ingresa un título primero');
      return;
    }

    setAiGenerating(field);
    try {
      // Simulated AI generation - replace with actual OpenAI call
      const prompts = {
        context: `Basándote en el título "${formData.title}", genera un contexto profesional que describa la situación inicial del proyecto. Incluye el problema o necesidad que se buscaba resolver.`,
        action: `Basándote en el título "${formData.title}", describe las acciones específicas que se tomaron para completar este proyecto. Incluye tecnologías, metodologías y pasos clave.`,
        results: `Basándote en el título "${formData.title}", describe los resultados obtenidos y el impacto del proyecto. Incluye beneficios cuantificables y mejoras logradas.`
      };

      // TODO: Replace with actual OpenAI API call
      // For now, just show a placeholder
      const placeholder = `[IA] ${prompts[field]}\n\nEste es un texto de ejemplo generado por IA. Configura tu API key de OpenAI para usar esta funcionalidad.`;
      
      setFormData(prev => ({
        ...prev,
        [field]: placeholder
      }));
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Error al generar contenido con IA');
    } finally {
      setAiGenerating(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 10) {
      newErrors.title = 'El título debe tener al menos 10 caracteres';
    }

    if (!formData.slug) {
      newErrors.slug = 'El slug es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !session?.user.id) return;

    setSaving(true);
    try {
      const visaData = {
        ...formData,
        profile_id: session.user.id,
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        const { error } = await supabase
          .from('visas')
          .update(visaData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visas')
          .insert([visaData]);

        if (error) throw error;
      }

      navigate('/dashboard/visas');
    } catch (error: any) {
      console.error('Error saving visa:', error);
      if (error.message?.includes('visas_slug_unique')) {
        setErrors({ slug: 'Este slug ya existe. Por favor usa otro.' });
      } else {
        toast.error('Error al guardar la Visa');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/visas')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Visa' : 'Nueva Visa'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Metodología CAR: Context, Action, Results
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Información Básica
          </h3>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                placeholder="Ej: Desarrollo de plataforma e-commerce que aumentó ventas en 150%"
                required
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug (auto-generado)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                readOnly
              />
              {errors.slug && (
                <p className="text-red-600 text-sm mt-1">{errors.slug}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CAR Methodology */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Metodología CAR
          </h3>

          <div className="space-y-6">
            {/* Context */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Context (Contexto)
                </label>
                <button
                  type="button"
                  onClick={() => generateWithAI('context')}
                  disabled={aiGenerating === 'context'}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {aiGenerating === 'context' ? 'Generando...' : 'IA Assistant'}
                </button>
              </div>
              <textarea
                value={formData.context || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                placeholder="Describe el contexto y la situación inicial del proyecto..."
              />
            </div>

            {/* Action */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action (Acción)
                </label>
                <button
                  type="button"
                  onClick={() => generateWithAI('action')}
                  disabled={aiGenerating === 'action'}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {aiGenerating === 'action' ? 'Generando...' : 'IA Assistant'}
                </button>
              </div>
              <textarea
                value={formData.action || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                placeholder="Describe las acciones que tomaste..."
              />
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Results (Resultados)
                </label>
                <button
                  type="button"
                  onClick={() => generateWithAI('results')}
                  disabled={aiGenerating === 'results'}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {aiGenerating === 'results' ? 'Generando...' : 'IA Assistant'}
                </button>
              </div>
              <textarea
                value={formData.results || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, results: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                placeholder="Describe los resultados obtenidos..."
              />
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Métricas
            </h3>
            <button
              type="button"
              onClick={addMetric}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar Métrica
            </button>
          </div>

          <div className="space-y-3">
            {formData.metrics?.map((metric, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={metric.key}
                  onChange={(e) => updateMetric(index, 'key', e.target.value)}
                  placeholder="Ej: Revenue"
                  className="flex-1 px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
                <input
                  type="text"
                  value={metric.value}
                  onChange={(e) => updateMetric(index, 'value', e.target.value)}
                  placeholder="Ej: +150%"
                  className="flex-1 px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeMetric(index)}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Media
          </h3>

          {/* Images */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Imágenes (hasta 5)
              </label>
              <button
                type="button"
                onClick={addMediaUrl}
                disabled={(formData.media_urls?.length || 0) >= 5}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <PhotoIcon className="w-4 h-4" />
                Agregar Imagen
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {formData.media_urls?.map((url, index) => (
                <div key={index} className="relative aspect-video bg-gray-200 dark:bg-dark-bg-tertiary rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMediaUrl(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Videos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Videos (YouTube/Vimeo)
              </label>
              <button
                type="button"
                onClick={addVideoUrl}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                <VideoCameraIcon className="w-4 h-4" />
                Agregar Video
              </button>
            </div>
            <div className="space-y-2">
              {formData.video_urls?.map((url, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <VideoCameraIcon className="w-5 h-5 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeVideoUrl(index)}
                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/visas')}
            className="px-6 py-2 bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              isEditing ? 'Actualizar Visa' : 'Crear Visa'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VisaForm;
