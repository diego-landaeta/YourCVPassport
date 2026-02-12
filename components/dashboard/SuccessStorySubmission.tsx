import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import AlertModal from '../shared/AlertModal';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { useTranslations } from '../../hooks/useTranslations';

interface SuccessStory {
  id: string;
  name: string;
  role: string;
  headline: string;
  full_story: string;
  image_url: string;
  before_image_url?: string;
  after_image_url?: string;
  industry: string;
  goal: string;
  featured: boolean;
  approved: boolean;
  user_id: string;
  created_at: string;
  submitted_at: string;
}

const SuccessStorySubmission: React.FC = () => {
  const { session, profile } = useAuth();
  const t = useTranslations();
  const [myStories, setMyStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [formData, setFormData] = useState<Partial<SuccessStory>>({
    name: profile?.full_name || '',
    role: profile?.headline || '',
    headline: '',
    full_story: '',
    image_url: profile?.avatar_url || '',
    before_image_url: '',
    after_image_url: '',
    industry: 'Technology',
    goal: 'Career Change',
    featured: false
  });

  const { dialogState, showAlert, showConfirm, closeDialog, handleConfirm, handleCancel } = useCustomDialog();

  useEffect(() => {
    loadMyStories();
  }, [session]);

  const loadMyStories = async () => {
    if (!session?.user.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyStories(data || []);
    } catch (err: any) {
      showAlert({
        title: t.dashboard.successStories?.error || 'Error',
        message: t.dashboard.successStories?.loadError || 'Error al cargar tus historias: ' + err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user.id) return;

    try {
      if (editingStory) {
        // Update existing story (only if not approved)
        if (editingStory.approved) {
          showAlert({
            title: t.dashboard.successStories?.error || 'Error',
            message: t.dashboard.successStories?.cannotEditApproved || 'No puedes editar una historia que ya ha sido aprobada.',
            type: 'error'
          });
          return;
        }

        const { error } = await supabase
          .from('success_stories')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStory.id)
          .eq('user_id', session.user.id);

        if (error) throw error;
        showAlert({
          title: t.dashboard.successStories?.success || 'Éxito',
          message: t.dashboard.successStories?.updateSuccess || 'Historia actualizada correctamente. Está pendiente de aprobación.',
          type: 'success'
        });
      } else {
        // Create new story
        const { error } = await supabase
          .from('success_stories')
          .insert([{
            ...formData,
            user_id: session.user.id,
            approved: false,
            submitted_at: new Date().toISOString()
          }]);

        if (error) throw error;
        showAlert({
          title: t.dashboard.successStories?.success || 'Éxito',
          message: t.dashboard.successStories?.submitSuccess || '¡Historia enviada correctamente! Será revisada por nuestro equipo antes de ser publicada.',
          type: 'success'
        });
      }

      resetForm();
      loadMyStories();
    } catch (err: any) {
      showAlert({
        title: t.dashboard.successStories?.error || 'Error',
        message: t.dashboard.successStories?.saveError || 'Error al guardar: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleEdit = (story: SuccessStory) => {
    if (story.approved) {
      showAlert({
        title: t.dashboard.successStories?.error || 'Error',
        message: t.dashboard.successStories?.cannotEditApproved || 'No puedes editar una historia que ya ha sido aprobada.',
        type: 'error'
      });
      return;
    }
    setEditingStory(story);
    setFormData(story);
    setIsCreating(true);
  };

  const handleDelete = async (id: string, headline: string) => {
    const confirmed = await showConfirm({
      title: t.dashboard.successStories?.confirmDelete || 'Confirmar eliminación',
      message: t.dashboard.successStories?.deleteMessage?.replace('{headline}', headline) || `¿Eliminar tu historia "${headline}"? Esta acción no se puede deshacer.`,
      type: 'warning',
      confirmText: t.dashboard.successStories?.delete || 'Eliminar',
      cancelText: t.dashboard.successStories?.cancel || 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('success_stories')
        .delete()
        .eq('id', id)
        .eq('user_id', session?.user.id);

      if (error) throw error;
      showAlert({
        title: t.dashboard.successStories?.success || 'Éxito',
        message: t.dashboard.successStories?.deleteSuccess || 'Historia eliminada correctamente',
        type: 'success'
      });
      loadMyStories();
    } catch (err: any) {
      showAlert({
        title: t.dashboard.successStories?.error || 'Error',
        message: t.dashboard.successStories?.deleteError || 'Error al eliminar: ' + err.message,
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: profile?.full_name || '',
      role: profile?.headline || '',
      headline: '',
      full_story: '',
      image_url: profile?.avatar_url || '',
      before_image_url: '',
      after_image_url: '',
      industry: 'Technology',
      goal: 'Career Change',
      featured: false
    });
    setEditingStory(null);
    setIsCreating(false);
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
      <div className="bg-gradient-to-r from-cv-blue to-blue-600 dark:from-cv-blue/80 dark:to-blue-800 rounded-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          {t.dashboard.successStories?.title || '¡Comparte Tu Caso de Éxito!'}
        </h2>
        <p className="text-blue-100 text-lg">
          {t.dashboard.successStories?.subtitle || '¿Conseguiste un nuevo trabajo, un ascenso o un gran proyecto usando YourCVPassport? ¡Nos encantaría escucharlo!'}
        </p>
      </div>

      {/* Create Story Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full sm:w-auto px-6 py-3 bg-cv-blue hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {t.dashboard.successStories?.newStory || 'Compartir Mi Historia'}
        </button>
      )}

      {/* Form Modal */}
      {isCreating && (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingStory
                ? t.dashboard.successStories?.editStory || 'Editar Mi Historia'
                : t.dashboard.successStories?.shareStory || 'Compartir Mi Historia'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.dashboard.successStories?.form?.name || 'Tu Nombre'} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.dashboard.successStories?.form?.role || 'Tu Rol/Posición'} *
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.dashboard.successStories?.form?.headline || 'Titular de Tu Historia'} *
              </label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                required
                placeholder={t.dashboard.successStories?.form?.headlinePlaceholder || 'Ej: Conseguí mi trabajo soñado en solo 2 semanas'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.dashboard.successStories?.form?.fullStory || 'Tu Historia Completa'} *
              </label>
              <textarea
                name="full_story"
                value={formData.full_story}
                onChange={handleInputChange}
                required
                rows={8}
                placeholder={t.dashboard.successStories?.form?.storyPlaceholder || 'Cuéntanos cómo YourCVPassport te ayudó a alcanzar tu objetivo profesional...'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.dashboard.successStories?.form?.industry || 'Industria'} *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Education">Education</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.dashboard.successStories?.form?.goal || 'Objetivo Alcanzado'} *
                </label>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                >
                  <option value="Career Change">Career Change</option>
                  <option value="Promotion">Promotion</option>
                  <option value="First Job">First Job</option>
                  <option value="Remote Work">Remote Work</option>
                  <option value="Salary Increase">Salary Increase</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.dashboard.successStories?.form?.imageUrl || 'URL de Tu Foto'} *
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                required
                placeholder="https://ejemplo.com/mi-foto.jpg"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t.dashboard.successStories?.form?.imageHelp || 'Sugerencia: Puedes usar la URL de tu foto de perfil de YourCVPassport'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.dashboard.successStories?.form?.beforeImage || 'URL Imagen "Antes" (opcional)'}
                </label>
                <input
                  type="url"
                  name="before_image_url"
                  value={formData.before_image_url}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/cv-antes.jpg"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.dashboard.successStories?.form?.afterImage || 'URL Imagen "Después" (opcional)'}
                </label>
                <input
                  type="url"
                  name="after_image_url"
                  value={formData.after_image_url}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/cv-despues.jpg"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {t.dashboard.successStories?.cancel || 'Cancelar'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cv-blue hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingStory
                  ? t.dashboard.successStories?.update || 'Actualizar'
                  : t.dashboard.successStories?.submit || 'Enviar Historia'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Stories List */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.dashboard.successStories?.myStories || 'Mis Historias'} ({myStories.length})
          </h3>
        </div>

        {myStories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">
              {t.dashboard.successStories?.noStories || 'Aún no has compartido ninguna historia'}
            </p>
            <p className="mt-2 text-sm">
              {t.dashboard.successStories?.noStoriesHelp || 'Haz clic en el botón de arriba para compartir tu primera historia de éxito'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {myStories.map((story) => (
              <div key={story.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {story.headline}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        story.approved
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {story.approved
                          ? t.dashboard.successStories?.approved || '✓ Aprobada'
                          : t.dashboard.successStories?.pending || '⏳ Pendiente de aprobación'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {story.industry} • {story.goal}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {story.full_story}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {t.dashboard.successStories?.submitted || 'Enviada'}: {new Date(story.submitted_at).toLocaleDateString()}
                    </p>
                  </div>

                  {!story.approved && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(story)}
                        className="p-2 text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={t.dashboard.successStories?.edit || 'Editar'}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(story.id, story.headline)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t.dashboard.successStories?.delete || 'Eliminar'}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

export default SuccessStorySubmission;
