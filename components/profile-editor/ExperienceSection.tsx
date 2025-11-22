import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { experienceSchema, ExperienceFormData } from '../../schemas/profileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ExperienceSectionProps {
  initialData?: ExperienceFormData[];
  onSave: (data: ExperienceFormData[]) => Promise<void>;
}

interface SortableExperienceItemProps {
  experience: ExperienceFormData;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableExperienceItem: React.FC<SortableExperienceItemProps> = ({
  experience,
  onEdit,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: experience.id || 'temp-new',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Presente';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border"
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{experience.position}</h4>
          <p className="text-gray-700 dark:text-gray-300">{experience.company_name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(experience.start_date)} - {formatDate(experience.end_date)}
            {experience.is_current && ' (Actual)'}
          </p>
          {experience.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {experience.description}
            </p>
          )}
          {experience.achievements && experience.achievements.length > 0 && (
            <ul className="mt-2 space-y-1">
              {experience.achievements.slice(0, 2).map((achievement, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="mr-2">•</span>
                  <span className="line-clamp-1">{achievement}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-cv-blue hover:text-cv-blue-dark"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ initialData = [], onSave }) => {
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const [experiences, setExperiences] = useState<ExperienceFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<string[]>(['']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
  });

  const isCurrent = watch('is_current');

  // Auto-save form data to localStorage
  React.useEffect(() => {
    if (isFormOpen) {
      const subscription = watch((formData) => {
        try {
          localStorage.setItem('experience_draft', JSON.stringify({
            formData,
            achievements,
            editingIndex,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error saving draft:', e);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isFormOpen, achievements, editingIndex]);

  // Restore draft on mount
  React.useEffect(() => {
    try {
      const draft = localStorage.getItem('experience_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only restore if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          const shouldRestore = confirm(modals.restoreDraft || '¿Restaurar borrador guardado?');
          if (shouldRestore && parsed.formData) {
            reset(parsed.formData);
            if (parsed.achievements) setAchievements(parsed.achievements);
            if (parsed.editingIndex !== null) setEditingIndex(parsed.editingIndex);
            setIsFormOpen(true);
          } else {
            localStorage.removeItem('experience_draft');
          }
        } else {
          localStorage.removeItem('experience_draft');
        }
      }
    } catch (e) {
      console.error('Error restoring draft:', e);
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setExperiences((items) => {
        const oldIndex = items.findIndex((item, idx) => {
          const itemId = item.id || `temp-${idx}`;
          return itemId === active.id;
        });
        const newIndex = items.findIndex((item, idx) => {
          const itemId = item.id || `temp-${idx}`;
          return itemId === over.id;
        });
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(items, oldIndex, newIndex);
          // Save the new order
          onSave(reordered);
          return reordered;
        }
        return items;
      });
    }
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setAchievements(['']);
    reset({
      position: '',
      company_name: '',
      start_date: '',
      end_date: null,
      description: '',
      is_current: false,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    const exp = experiences[index];
    setEditingIndex(index);
    setAchievements(exp.achievements || ['']);
    reset(exp);
    setIsFormOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm(modals.deleteConfirm)) {
      const updated = experiences.filter((_, i) => i !== index);
      setExperiences(updated);
      onSave(updated);
    }
  };

  const onSubmit = async (data: ExperienceFormData) => {
    const formData = {
      ...data,
      achievements: achievements.filter((a) => a.trim() !== ''),
      id: editingIndex !== null ? experiences[editingIndex].id : undefined,
    };

    let updated: ExperienceFormData[];
    if (editingIndex !== null) {
      updated = experiences.map((exp, idx) => (idx === editingIndex ? formData : exp));
    } else {
      updated = [...experiences, formData];
    }

    setExperiences(updated);
    await onSave(updated);
    
    // Clear draft on successful save
    localStorage.removeItem('experience_draft');
    setIsFormOpen(false);
    reset();
    setAchievements(['']);
  };

  const addAchievement = () => {
    setAchievements([...achievements, '']);
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const updateAchievement = (index: number, value: string) => {
    const updated = [...achievements];
    updated[index] = value;
    setAchievements(updated);
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modals.addExperience.replace('Añadir ', '').replace('Add ', '')}</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {modals.addExperience}
        </button>
      </div>

      {/* Experience List with Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext 
          items={experiences.map((exp, idx) => exp.id || `temp-${idx}`)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 mb-6">
            {experiences.map((exp, index) => (
              <SortableExperienceItem
                key={exp.id || `temp-${index}`}
                experience={{...exp, id: exp.id || `temp-${index}`}}
                onEdit={() => handleEdit(index)}
                onDelete={() => handleDelete(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {experiences.length === 0 && !isFormOpen && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p>{modals.noExperienceYet}</p>
        </div>
      )}

      {/* Experience Form */}
      {isFormOpen && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? modals.editExperience : modals.addNewExperience}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.jobTitle} *
                </label>
                <input
                  {...register('position')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  placeholder={modals.jobTitlePlaceholder}
                />
                {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.company} *
                </label>
                <input
                  {...register('company_name')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  placeholder={modals.companyPlaceholder}
                />
                {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.startDate} *
                </label>
                <input
                  {...register('start_date')}
                  type="month"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                />
                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.endDate}
                </label>
                <input
                  {...register('end_date')}
                  type="month"
                  disabled={isCurrent}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white disabled:opacity-50"
                />
                <label className="flex items-center mt-2">
                  <input
                    {...register('is_current')}
                    type="checkbox"
                    className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('end_date', null);
                      }
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{modals.currentJob}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {modals.description}
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white resize-none"
                placeholder={modals.descriptionPlaceholder}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {modals.keyAchievements}
                </label>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="text-sm text-cv-blue hover:text-cv-blue-dark"
                >
                  {modals.addAchievement}
                </button>
              </div>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={(e) => updateAchievement(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      placeholder={modals.achievementPlaceholder}
                    />
                    {achievements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAchievement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {modals.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
              >
                {editingIndex !== null ? modals.update : modals.add} {modals.addExperience.replace('Añadir ', '')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExperienceSection;
