import React, { useState, lazy, Suspense, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { experienceSchema, ExperienceFormData } from '../../schemas/profileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import { useConfirmDialog } from '../ConfirmDialog';
import { useToastContext } from '../../context/ToastContext';
import { validateDateRange } from '../../utils/dateValidation';
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
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Lazy load AI optimizer
const AITextOptimizer = lazy(() => import('./AITextOptimizer'));

interface ExperienceSectionProps {
  initialData?: ExperienceFormData[];
  onSave: (data: ExperienceFormData[]) => Promise<void>;
  onNavigateToVerifications?: () => void;
}

export interface ExperienceSectionHandle {
  toggleAISuggestions: () => void;
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
    // Parse date manually to avoid timezone issues
    const [year, month] = date.split('-').map(Number);
    // Create date using local time constructor (year, monthIndex)
    const d = new Date(year, month - 1);
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
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{experience.position}</h4>
            {experience.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verificado
              </span>
            )}
          </div>
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

const ExperienceSection = forwardRef<ExperienceSectionHandle, ExperienceSectionProps>(({ initialData = [], onSave, onNavigateToVerifications }, ref) => {
  const { session } = useAuth();
  const { lang } = useLanguage();
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const { confirm, Dialog } = useConfirmDialog();
  const toast = useToastContext();
  const [experiences, setExperiences] = useState<ExperienceFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<string[]>(['']);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const hasCheckedDraft = React.useRef(false);
  const shouldSaveDraft = React.useRef(true);

  // Expose toggleAISuggestions method to parent component
  useImperativeHandle(ref, () => ({
    toggleAISuggestions: () => {
      setShowAISuggestions(prev => !prev);
    },
  }));

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
    defaultValues: {
      is_current: false,
    },
  });

  const isCurrent = watch('is_current');

  // Auto-save form data to localStorage
  React.useEffect(() => {
    if (isFormOpen && shouldSaveDraft.current) {
      const subscription = watch((formData) => {
        // Only save if auto-save is still enabled (double-check)
        if (!shouldSaveDraft.current) return;

        try {
          localStorage.setItem('experience_draft', JSON.stringify({
            formData,
            achievements,
            editingIndex,
            timestamp: Date.now()
          }));
        } catch (e) {
          toast.error('Error al guardar borrador');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isFormOpen, achievements, editingIndex]);

  // Restore draft on mount (only once per session)
  React.useEffect(() => {
    if (hasCheckedDraft.current) return;
    hasCheckedDraft.current = true;

    const checkDraft = async () => {
      try {
        const draft = localStorage.getItem('experience_draft');
        const lastPromptTime = localStorage.getItem('experience_draft_last_prompt');

        if (draft) {
          const parsed = JSON.parse(draft);

          // Only restore if less than 24 hours old
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            // Check if we've already asked about this draft in the last 5 minutes
            if (lastPromptTime && Date.now() - parseInt(lastPromptTime) < 5 * 60 * 1000) {
              return; // Don't ask again
            }

            // Update the last prompt time
            localStorage.setItem('experience_draft_last_prompt', Date.now().toString());

            const shouldRestore = await confirm({
              title: 'Restaurar Borrador',
              message: modals.restoreDraft || '¿Restaurar borrador guardado?',
              confirmText: 'Restaurar',
              cancelText: 'Descartar',
              type: 'info'
            });
            if (shouldRestore && parsed.formData) {
              reset(parsed.formData);
              if (parsed.achievements) setAchievements(parsed.achievements);
              if (parsed.editingIndex !== null) setEditingIndex(parsed.editingIndex);
              setIsFormOpen(true);
              shouldSaveDraft.current = true; // Reactivar guardado de borrador
            } else {
              // Usuario descartó el borrador - deshabilitar guardado automático
              shouldSaveDraft.current = false;
              localStorage.removeItem('experience_draft');
              localStorage.removeItem('experience_draft_last_prompt');
            }
          } else {
            localStorage.removeItem('experience_draft');
            localStorage.removeItem('experience_draft_last_prompt');
          }
        }
      } catch (e) {
        toast.error('Error al restaurar borrador');
        localStorage.removeItem('experience_draft');
        localStorage.removeItem('experience_draft_last_prompt');
      }
    };
    checkDraft();
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

  const handleCancel = () => {
    // CRITICAL: Disable auto-save FIRST, then clear draft immediately
    shouldSaveDraft.current = false;

    // Use setTimeout to ensure this runs after any pending watch() callbacks
    setTimeout(() => {
      localStorage.removeItem('experience_draft');
      localStorage.removeItem('experience_draft_last_prompt');
    }, 0);

    setIsFormOpen(false);
    reset();
    setAchievements(['']);
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
    shouldSaveDraft.current = true; // Reactivar guardado de borrador para nueva entrada
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    const exp = experiences[index];
    setEditingIndex(index);

    // Clean markdown from achievements before editing
    const cleanedAchievements = (exp.achievements || ['']).map(a => cleanMarkdown(a));
    setAchievements(cleanedAchievements);

    // Clean markdown from description before loading into form
    const cleanedExp = {
      ...exp,
      description: cleanMarkdown(exp.description),
      achievements: cleanedAchievements,
      is_current: exp.is_current || false, // Ensure boolean value
    };

    reset(cleanedExp);
    setIsFormOpen(true);
  };

  const handleDelete = async (index: number) => {
    const shouldDelete = await confirm({
      title: 'Eliminar Experiencia',
      message: modals.deleteConfirm,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (shouldDelete) {
      const updated = experiences.filter((_, i) => i !== index);
      setExperiences(updated);
      onSave(updated);
    }
  };

  /**
   * Remove markdown formatting (** for bold) from text
   */
  const cleanMarkdown = (text: string | null | undefined): string => {
    if (!text) return '';
    // Remove ** bold markers
    return text.replace(/\*\*/g, '');
  };

  const onSubmit = async (data: ExperienceFormData) => {
    // Debug: verificar el valor de is_current// Validar fechas antes de guardar
    const dateValidation = validateDateRange(
      data.start_date,
      data.end_date,
      data.is_current || false
    );

    if (!dateValidation.isValid) {toast.error(dateValidation.error || 'Las fechas no son válidas');
      return;
    }// Clean markdown from description and achievements before saving
    const formData = {
      ...data,
      description: cleanMarkdown(data.description),
      achievements: achievements
        .filter((a) => a.trim() !== '')
        .map((a) => cleanMarkdown(a)),
      id: editingIndex !== null ? experiences[editingIndex].id : undefined,
    };

    let updated: ExperienceFormData[];
    if (editingIndex !== null) {
      updated = experiences.map((exp, idx) => (idx === editingIndex ? formData : exp));
    } else {
      updated = [...experiences, formData];
    }

    setExperiences(updated);

    // CRITICAL: Disable auto-save IMMEDIATELY to prevent any more draft saves
    shouldSaveDraft.current = false;

    // Clear draft immediately and synchronously
    setTimeout(() => {
      localStorage.removeItem('experience_draft');
      localStorage.removeItem('experience_draft_last_prompt');
    }, 0);

    try {
      await onSave(updated);
    } catch (error) {
      // Even if refetch fails, draft is already cleaned since DB save succeeded
      // The error toast will be shown from DashboardContent
    } finally {
      // Double-check cleanup and close form
      localStorage.removeItem('experience_draft');
      localStorage.removeItem('experience_draft_last_prompt');
      setIsFormOpen(false);
      reset();
      setAchievements(['']);
    }
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

  const handleApplyAISuggestion = async (
    itemId: string,
    optimizedText: string,
    optimizedAchievements?: string[]
  ) => {
    try {
      // Clean markdown before saving
      const cleanDescription = cleanMarkdown(optimizedText);
      const cleanAchievements = optimizedAchievements?.map(a => cleanMarkdown(a)) || [];

      // Update local state with cleaned text
      const updated = experiences.map(exp =>
        exp.id === itemId
          ? {
              ...exp,
              description: cleanDescription,
              achievements: cleanAchievements.length > 0 ? cleanAchievements : exp.achievements,
            }
          : exp
      );

      // Update state
      setExperiences(updated);

      // Save to database through parent component
      await onSave(updated);

      toast.success('Sugerencias de IA aplicadas correctamente');
    } catch (error) {toast.error('Error al aplicar la sugerencia');
      throw error;
    }
  };

  return (
    <>
      <Dialog />
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

      {/* Verification Info Banner */}
      {experiences.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {lang === 'en' ? 'Verify your work experience' : 'Verifica tu experiencia laboral'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {lang === 'en'
                  ? 'Add credibility to your profile by verifying your work experience. Go to the Verifications section to submit documentation.'
                  : 'Añade credibilidad a tu perfil verificando tu experiencia laboral. Ve a la sección de Verificaciones para enviar la documentación.'}
              </p>
              <button
                onClick={() => onNavigateToVerifications?.()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {lang === 'en' ? 'Go to Verifications' : 'Ir a Verificaciones'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <div className="mb-6">
          <Suspense fallback={
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-purple-200 dark:bg-purple-700 rounded w-1/3"></div>
                <div className="h-20 bg-purple-200 dark:bg-purple-700 rounded"></div>
              </div>
            </div>
          }>
            <AITextOptimizer
              type="experience"
              items={experiences}
              onApplySuggestion={handleApplyAISuggestion}
            />
          </Suspense>
        </div>
      )}

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
                  {isCurrent && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Actual)</span>}
                </label>
                <input
                  {...register('end_date')}
                  type="month"
                  disabled={isCurrent}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder={isCurrent ? "Presente" : ""}
                />
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    {...register('is_current', {
                      onChange: (e) => {
                        if (e.target.checked) {
                          setValue('end_date', null, { shouldValidate: true });
                        }
                      }
                    })}
                    className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
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
                onClick={handleCancel}
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
    </>
  );
});

ExperienceSection.displayName = 'ExperienceSection';

export default ExperienceSection;

