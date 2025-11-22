import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { Visa } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import VisaFormModal from './VisaFormModal';
import ConfirmDialog from '../ui/ConfirmDialog';

// Sortable Visa Card Component
interface SortableVisaCardProps {
  visa: Visa;
  onEdit: (visa: Visa) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
  t: any;
}

const SortableVisaCard: React.FC<SortableVisaCardProps> = ({ visa, onEdit, onDelete, deleting, t }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: visa.id! });

  const [imageLoaded, setImageLoaded] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:shadow-lg transition-shadow"
    >
      {/* Drag Handle */}
      <div className="flex items-start gap-3 mb-4">
        <button
          {...attributes}
          {...listeners}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg cursor-grab active:cursor-grabbing transition-colors"
          aria-label="Drag to reorder"
        >
          <Bars3Icon className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          {/* Image Preview with Lazy Loading */}
          {visa.media_urls && visa.media_urls.length > 0 && (
            <div className="aspect-video bg-gray-200 dark:bg-dark-bg-tertiary rounded-lg mb-4 overflow-hidden relative">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cv-blue"></div>
                </div>
              )}
              <img
                src={visa.media_urls[0]}
                alt={visa.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E';
                  setImageLoaded(true);
                }}
              />
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {visa.title}
          </h3>

          {/* Dates */}
          {visa.start_date && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
              <CalendarIcon className="w-4 h-4" aria-hidden="true" />
              <span>
                {visa.start_date} - {visa.end_date || t.present}
              </span>
            </div>
          )}

          {/* Context Preview */}
          {visa.context && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {visa.context}
            </p>
          )}

          {/* Metrics */}
          {visa.metrics && visa.metrics.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4">
              <ChartBarIcon className="w-4 h-4" aria-hidden="true" />
              <span>{visa.metrics.length} {t.metrics}</span>
            </div>
          )}

          {/* Tags */}
          {visa.tags && visa.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {visa.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-cv-blue bg-opacity-10 text-cv-blue text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {visa.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  +{visa.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
            <button
              onClick={() => onEdit(visa)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              aria-label={`Edit ${visa.title}`}
            >
              <PencilIcon className="w-4 h-4" aria-hidden="true" />
              {t.edit}
            </button>
            <button
              onClick={() => visa.id && onDelete(visa.id)}
              disabled={deleting === visa.id}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50"
              aria-label={`Delete ${visa.title}`}
            >
              {deleting === visa.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" aria-label="Deleting"></div>
              ) : (
                <TrashIcon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VisasSection: React.FC = () => {
  const { session } = useAuth();
  const translations = useTranslations();
  const t = translations.dashboard.visas;

  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<Visa | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; visaId: string | null }>({
    isOpen: false,
    visaId: null
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadVisas();
  }, [session]);

  const loadVisas = async () => {
    if (!session?.user.id) return;

    try {
      const { data, error } = await supabase
        .from('visas')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setVisas(data || []);
    } catch (error) {
      console.error('Error loading visas:', error);
      // toast.error('Error al cargar las visas');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = visas.findIndex(v => v.id === active.id);
    const newIndex = visas.findIndex(v => v.id === over.id);

    const newVisas = arrayMove(visas, oldIndex, newIndex);
    setVisas(newVisas);

    // Optimized batch update - prepare all updates
    try {
      const updates = newVisas.map((visa: Visa, index: number) =>
        supabase
          .from('visas')
          .update({ sort_order: index })
          .eq('id', visa.id)
      );

      // Execute all updates in parallel
      await Promise.all(updates);
      // toast.success('Orden actualizado');
    } catch (error) {
      console.error('Error updating sort order:', error);
      // toast.error('Error al actualizar el orden');
      // Revert on error
      loadVisas();
    }
  };

  const handleSaveVisa = async (visaData: Omit<Visa, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Validate user permission
      if (!session?.user.id || visaData.profile_id !== session.user.id) {
        alert('No tienes permisos para realizar esta acción');
        return;
      }

      if (editingVisa?.id) {
        // Update existing visa
        const { error } = await supabase
          .from('visas')
          .update(visaData)
          .eq('id', editingVisa.id)
          .eq('profile_id', session.user.id); // Security check

        if (error) throw error;
        // toast.success('Visa actualizada exitosamente');
      } else {
        // Create new visa
        const { error } = await supabase
          .from('visas')
          .insert([{ ...visaData, sort_order: visas.length }]);

        if (error) throw error;
        // toast.success('Visa creada exitosamente');
      }

      loadVisas();
      setIsFormOpen(false);
      setEditingVisa(undefined);
    } catch (error) {
      console.error('Error saving visa:', error);
      alert('Error al guardar la visa');
    }
  };

  const handleEditClick = (visa: Visa) => {
    setEditingVisa(visa);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setEditingVisa(undefined);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (visaId: string) => {
    setDeleteConfirm({ isOpen: true, visaId });
  };

  const handleDeleteConfirm = async () => {
    const visaId = deleteConfirm.visaId;
    if (!visaId) return;

    setDeleting(visaId);
    try {
      // Validate user permission
      if (!session?.user.id) {
        alert('No tienes permisos para realizar esta acción');
        return;
      }

      const { error } = await supabase
        .from('visas')
        .delete()
        .eq('id', visaId)
        .eq('profile_id', session.user.id); // Security check

      if (error) throw error;

      setVisas(visas.filter(v => v.id !== visaId));
      // toast.success('Visa eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting visa:', error);
      alert(t.deleteError);
    } finally {
      setDeleting(null);
      setDeleteConfirm({ isOpen: false, visaId: null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading visas">
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
            {t.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t.subtitle}
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-semibold transition-colors shadow-md"
          aria-label="Create new visa"
        >
          <PlusIcon className="w-5 h-5" aria-hidden="true" />
          {t.newVisa}
        </button>
      </div>

      {/* Empty State */}
      {visas.length === 0 && (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-12 text-center border border-gray-200 dark:border-dark-border">
          <BriefcaseIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t.noVisas}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t.noVisasDescription}
          </p>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-semibold transition-colors"
          >
            <PlusIcon className="w-5 h-5" aria-hidden="true" />
            {t.createFirstVisa}
          </button>
        </div>
      )}

      {/* Visas Grid with Drag & Drop */}
      {visas.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visas.map(v => v.id!)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {visas.map((visa) => (
                <SortableVisaCard
                  key={visa.id}
                  visa={visa}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  deleting={deleting}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Form Modal */}
      <VisaFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingVisa(undefined);
        }}
        onSave={handleSaveVisa}
        initialData={editingVisa}
        profileId={session?.user.id || ''}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, visaId: null })}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar Visa?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta visa?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting !== null}
      />
    </div>
  );
};

export default VisasSection;
