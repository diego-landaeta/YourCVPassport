import React, { useState, lazy, Suspense, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { skillSchema, SkillFormData } from '../../schemas/profileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Lazy load AISkillsSuggestion
const AISkillsSuggestion = lazy(() => import('./AISkillsSuggestion'));

interface SkillsSectionProps {
  initialData?: SkillFormData[];
  onSave: (data: SkillFormData[]) => Promise<void>;
  onNext?: () => void;
}

export interface SkillsSectionHandle {
  toggleAISuggestions: () => void;
}

// Common skills for autocomplete
const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'SQL', 'MongoDB', 'PostgreSQL',
  'GraphQL', 'REST API', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Git', 'Agile', 'Scrum', 'CI/CD', 'TDD', 'UI/UX Design', 'Figma', 'Photoshop',
  'Machine Learning', 'Data Analysis', 'Leadership', 'Communication', 'Project Management',
];

interface SortableSkillItemProps {
  skill: SkillFormData;
  onEdit: () => void;
  onDelete: () => void;
  translations: any;
}

const SortableSkillItem: React.FC<SortableSkillItemProps> = ({ skill, onEdit, onDelete, translations }) => {
  const modals = translations.dashboard.modals;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: skill.id || `temp-${skill.name}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'BEGINNER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'INTERMEDIATE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ADVANCED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'EXPERT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-3 border border-gray-200 dark:border-dark-border flex items-center gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
          {skill.level && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${getLevelColor(skill.level)}`}>
              {skill.level.toLowerCase()}
            </span>
          )}
          {skill.years_of_experience !== undefined && skill.years_of_experience > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {skill.years_of_experience} {skill.years_of_experience === 1 ? (modals.year || 'año') : (modals.years || 'años')}
            </span>
          )}
        </div>
        {skill.percentage !== undefined && (
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-cv-blue h-1.5 rounded-full"
              style={{ width: `${skill.percentage}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-1">
        <button type="button" onClick={onEdit} className="text-cv-blue hover:text-cv-blue-dark p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const SkillsSection = forwardRef<SkillsSectionHandle, SkillsSectionProps>(({ initialData = [], onSave, onNext }, ref) => {
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const { session } = useAuth();
  const [skills, setSkills] = useState<SkillFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Expose toggleAISuggestions method to parent component
  useImperativeHandle(ref, () => ({
    toggleAISuggestions: () => {
      setShowAISuggestions(prev => !prev);
    },
  }));

  // Load skills from database
  const loadSkills = React.useCallback(async () => {
    if (!session?.user.id) return;const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('profile_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {} else {setSkills(data || []);
    }
  }, [session?.user.id]);

  // Load experiences for AI suggestions
  React.useEffect(() => {
    const loadExperiences = async () => {
      if (!session?.user.id) return;const { data, error } = await supabase
        .from('experiences')
        .select('position, company_name, description')
        .eq('profile_id', session.user.id)
        .order('start_date', { ascending: false });

      if (error) {} else {// Map position to title for compatibility with AISkillsSuggestion
        const mappedData = data.map(exp => ({
          title: exp.position,
          company_name: exp.company_name,
          description: exp.description || ''
        }));
        setExperiences(mappedData);
      }
    };

    loadExperiences();
  }, [session]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
  });

  const watchedLevel = watch('level');

  // Log de errores de validación
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {}
  }, [errors]);

  // DISABLED: Auto-save draft functionality was causing issues with form editing
  // The draft was interfering with normal editing operations and showing unwanted dialogs

  const filteredSuggestions = COMMON_SKILLS.filter((skill) =>
    skill.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSkills((items) => {
        const oldIndex = items.findIndex((item) => (item.id || `temp-${item.name}`) === active.id);
        const newIndex = items.findIndex((item) => (item.id || `temp-${item.name}`) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setSearchTerm('');
    reset({ name: '', level: undefined, years_of_experience: undefined, percentage: undefined });
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    // Limpiar cualquier borrador previo antes de editar
    localStorage.removeItem('skill_draft');

    const skill = skills[index];
    setEditingIndex(index);
    setSearchTerm(skill.name);
    reset(skill);
    setIsFormOpen(true);
  };

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const handleDelete = (index: number) => {
    setDeleteIndex(index);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updated = skills.filter((_, i) => i !== deleteIndex);
      setSkills(updated);
      onSave(updated);
      setDeleteIndex(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setValue('name', suggestion);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: SkillFormData) => {try {
      let updated: SkillFormData[];
      if (editingIndex !== null) {updated = skills.map((skill, idx) => (idx === editingIndex ? data : skill));
      } else {updated = [...skills, data];
      }setSkills(updated);
      await onSave(updated);// Clear draft on successful save
      localStorage.removeItem('skill_draft');
      setIsFormOpen(false);
      reset();
      setSearchTerm('');
      setEditingIndex(null);
    } catch (error) {alert('Error al guardar la habilidad: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modals.addSkill.replace('Añadir ', '').replace('Add ', '')}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {modals.addSkill}
          </button>
        </div>
      </div>

      {/* Skills Grid with Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={skills.map((skill) => skill.id || `temp-${skill.name}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {skills.map((skill, index) => (
              <SortableSkillItem
                key={skill.id || `${skill.name}-${index}`}
                skill={skill}
                onEdit={() => handleEdit(index)}
                onDelete={() => handleDelete(index)}
                translations={translations}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {skills.length === 0 && !isFormOpen && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>{modals.noSkillsYet}</p>
        </div>
      )}

      {/* Botón Continuar - Solo cuando hay habilidades y no está abierto el formulario */}
      {skills.length > 0 && !isFormOpen && onNext && (
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={onNext}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            Siguiente
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {modals.deleteSkillConfirm || '¿Eliminar habilidad?'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteIndex(null)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors font-medium"
              >
                {modals.cancel || 'Cancelar'}
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Form */}
      {isFormOpen && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? modals.editSkill : modals.addSkill}
          </h3>

          {/* DEBUG: Mostrar errores de validación */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-4">
              <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">⚠️ Errores de validación:</h4>
              <ul className="list-disc list-inside text-red-700 dark:text-red-400">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>{key}: {error?.message || 'Error desconocido'}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {modals.skillName} *
              </label>
              <input
                {...register('name')}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setValue('name', e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                placeholder={modals.skillNamePlaceholder}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}

              {/* Autocomplete Suggestions */}
              {showSuggestions && searchTerm && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-primary text-gray-900 dark:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.skillLevel} (Opcional)
                </label>
                <select
                  {...register('level', {
                    setValueAs: (v) => v === '' ? undefined : v,
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                >
                  <option value="">Sin especificar</option>
                  <option value="BEGINNER">{modals.beginner}</option>
                  <option value="INTERMEDIATE">{modals.intermediate}</option>
                  <option value="ADVANCED">{modals.advanced}</option>
                  <option value="EXPERT">{modals.expert}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.yearsOfExperience}
                </label>
                <input
                  {...register('years_of_experience', {
                    valueAsNumber: true,
                    setValueAs: (v) => isNaN(v) || v === '' ? null : Number(v),
                  })}
                  type="number"
                  min="0"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {modals.skillPercentage}
              </label>
              <input
                {...register('percentage', {
                  valueAsNumber: true,
                  setValueAs: (v) => isNaN(v) || v === '' ? null : Number(v),
                })}
                type="range"
                min="0"
                max="100"
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>{watch('percentage') || 0}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('skill_draft');
                  setIsFormOpen(false);
                  setShowSuggestions(false);
                  reset();
                  setSearchTerm('');
                  setEditingIndex(null);
                }}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {modals.cancel}
              </button>
              <button
                type="submit"
                onClick={() => {}}
                disabled={isSubmitting}
                className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : editingIndex !== null ? modals.update : modals.add} {modals.addSkill.replace('Añadir ', '').replace('Add ', '')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});

SkillsSection.displayName = 'SkillsSection';

export default SkillsSection;

