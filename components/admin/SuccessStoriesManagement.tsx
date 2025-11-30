import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import AlertModal from '../AlertModal';
import { useCustomDialog } from '../../hooks/useCustomDialog';

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
  user_id?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

const SuccessStoriesManagement: React.FC = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<SuccessStory>>({
    name: '',
    role: '',
    headline: '',
    full_story: '',
    image_url: '',
    before_image_url: '',
    after_image_url: '',
    industry: 'Technology',
    goal: 'Career Change',
    featured: false,
    approved: true
  });

  const { dialogState, showAlert, showConfirm, closeDialog, handleConfirm, handleCancel } = useCustomDialog();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err: any) {showAlert({
        title: 'Error',
        message: 'Error al cargar historias: ' + err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStory) {
        // Actualizar historia existente
        const { error } = await supabase
          .from('success_stories')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStory.id);

        if (error) throw error;
        showAlert({
          title: 'Éxito',
          message: 'Historia actualizada correctamente',
          type: 'success'
        });
      } else {
        // Crear nueva historia
        const { error } = await supabase
          .from('success_stories')
          .insert([formData]);

        if (error) throw error;
        showAlert({
          title: 'Éxito',
          message: 'Historia creada correctamente',
          type: 'success'
        });
      }

      resetForm();
      loadStories();
    } catch (err: any) {showAlert({
        title: 'Error',
        message: 'Error al guardar: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleEdit = (story: SuccessStory) => {
    setEditingStory(story);
    setFormData(story);
    setIsCreating(true);
  };

  const handleApprove = async (id: string, currentApprovalStatus: boolean) => {
    const action = currentApprovalStatus ? 'rechazar' : 'aprobar';
    const confirmed = await showConfirm({
      title: `Confirmar ${action}`,
      message: `¿Deseas ${action} esta historia?`,
      type: 'info',
      confirmText: action === 'aprobar' ? 'Aprobar' : 'Rechazar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('success_stories')
        .update({ approved: !currentApprovalStatus })
        .eq('id', id);

      if (error) throw error;
      showAlert({
        title: 'Éxito',
        message: `Historia ${action === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`,
        type: 'success'
      });
      loadStories();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error al actualizar: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: 'Confirmar eliminación',
      message: `¿Eliminar la historia de "${name}"? Esta acción no se puede deshacer.`,
      type: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('success_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showAlert({
        title: 'Éxito',
        message: 'Historia eliminada correctamente',
        type: 'success'
      });
      loadStories();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error al eliminar: ' + err.message,
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      headline: '',
      full_story: '',
      image_url: '',
      before_image_url: '',
      after_image_url: '',
      industry: 'Technology',
      goal: 'Career Change',
      featured: false,
      approved: true
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historias de Éxito
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las historias de éxito mostradas en el sitio
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-cv-blue hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          + Nueva Historia
        </button>
      </div>

      {/* Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingStory ? 'Editar Historia' : 'Nueva Historia'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rol/Posición *
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titular (Quote) *
                  </label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Conseguí mi trabajo soñado en solo 2 semanas"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Historia Completa *
                  </label>
                  <textarea
                    name="full_story"
                    value={formData.full_story}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Industria *
                    </label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Objetivo *
                    </label>
                    <select
                      name="goal"
                      value={formData.goal}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL de Imagen Principal *
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    required
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL Imagen "Antes" (opcional)
                    </label>
                    <input
                      type="url"
                      name="before_image_url"
                      value={formData.before_image_url}
                      onChange={handleInputChange}
                      placeholder="https://ejemplo.com/antes.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL Imagen "Después" (opcional)
                    </label>
                    <input
                      type="url"
                      name="after_image_url"
                      value={formData.after_image_url}
                      onChange={handleInputChange}
                      placeholder="https://ejemplo.com/despues.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    id="featured"
                    checked={formData.featured || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-cv-blue focus:ring-cv-blue border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Marcar como historia destacada
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cv-blue hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {editingStory ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stories List */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historias Publicadas ({stories.length})
          </h3>
        </div>
        
        {stories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay historias publicadas. Crea la primera historia.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Historia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Industria/Objetivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {stories.map((story) => (
                  <tr key={story.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={story.image_url}
                          alt={story.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {story.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {story.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{story.industry}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{story.goal}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          story.approved
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {story.approved ? '✓ Aprobada' : '⏳ Pendiente'}
                        </span>
                        {story.featured && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            ⭐ Destacada
                          </span>
                        )}
                        {story.user_id && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            👤 Usuario
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(story.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(story.id, story.approved)}
                          className={`px-3 py-1 rounded ${
                            story.approved
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {story.approved ? 'Rechazar' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => handleEdit(story)}
                          className="text-cv-blue hover:text-blue-700 px-3 py-1"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(story.id, story.name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 px-3 py-1"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default SuccessStoriesManagement;

