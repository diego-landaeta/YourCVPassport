import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { educationSchema, EducationFormData } from '../../schemas/profileSchemas';
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

interface EducationSectionProps {
  initialData?: EducationFormData[];
  onSave: (data: EducationFormData[]) => Promise<void>;
}

interface SortableEducationItemProps {
  education: EducationFormData;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVerify: () => void;
}

const SortableEducationItem: React.FC<SortableEducationItemProps> = ({
  education,
  onEdit,
  onDelete,
  onToggleVerify,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: education.id || `temp-${Date.now()}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Present';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{education.degree}</h4>
              <p className="text-gray-700 dark:text-gray-300">{education.institution_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {education.field_of_study} • {formatDate(education.start_date)} - {formatDate(education.end_date)}
              </p>
              {education.grade && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">GPA: {education.grade}</p>
              )}
              {education.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {education.description}
                </p>
              )}
            </div>
            {education.verified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggleVerify}
            className={`${education.verified ? 'text-gray-400' : 'text-green-500'} hover:opacity-70`}
            title={education.verified ? 'Unverify' : 'Mark as Verified'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
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

const EducationSection: React.FC<EducationSectionProps> = ({ initialData = [], onSave }) => {
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const [education, setEducation] = useState<EducationFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
  });

  // Auto-save form data to localStorage
  React.useEffect(() => {
    if (isFormOpen) {
      const subscription = watch((formData) => {
        try {
          localStorage.setItem('education_draft', JSON.stringify({
            formData,
            editingIndex,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error saving draft:', e);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isFormOpen, editingIndex]);

  // Restore draft on mount
  React.useEffect(() => {
    try {
      const draft = localStorage.getItem('education_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only restore if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          const shouldRestore = confirm(modals.restoreDraft || '¿Restaurar borrador guardado?');
          if (shouldRestore && parsed.formData) {
            reset(parsed.formData);
            if (parsed.editingIndex !== null) setEditingIndex(parsed.editingIndex);
            setIsFormOpen(true);
          } else {
            localStorage.removeItem('education_draft');
          }
        } else {
          localStorage.removeItem('education_draft');
        }
      }
    } catch (e) {
      console.error('Error restoring draft:', e);
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setEducation((items) => {
        const oldIndex = items.findIndex((item) => (item.id || `temp-${Date.now()}`) === active.id);
        const newIndex = items.findIndex((item) => (item.id || `temp-${Date.now()}`) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAdd = () => {
    setEditingIndex(null);
    reset({
      institution_name: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: null,
      description: '',
      grade: '',
      verified: false,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    const edu = education[index];
    setEditingIndex(index);
    reset(edu);
    setIsFormOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm(modals.deleteEducationConfirm)) {
      const updated = education.filter((_, i) => i !== index);
      setEducation(updated);
      onSave(updated);
    }
  };

  const handleToggleVerify = (index: number) => {
    const updated = education.map((edu, i) =>
      i === index ? { ...edu, verified: !edu.verified } : edu
    );
    setEducation(updated);
    onSave(updated);
  };

  const onSubmit = async (data: EducationFormData) => {
    let updated: EducationFormData[];
    if (editingIndex !== null) {
      updated = education.map((edu, idx) => (idx === editingIndex ? data : edu));
    } else {
      updated = [...education, data];
    }

    setEducation(updated);
    await onSave(updated);
    
    // Clear draft on successful save
    localStorage.removeItem('education_draft');
    setIsFormOpen(false);
    reset();
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modals.addEducation.replace('Añadir ', '').replace('Add ', '')}</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {modals.addEducation}
        </button>
      </div>

      {/* Education List with Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={education.map((edu) => edu.id || `temp-${Date.now()}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 mb-6">
            {education.map((edu, index) => (
              <SortableEducationItem
                key={edu.id || index}
                education={edu}
                onEdit={() => handleEdit(index)}
                onDelete={() => handleDelete(index)}
                onToggleVerify={() => handleToggleVerify(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {education.length === 0 && !isFormOpen && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p>{modals.noEducationYet}</p>
        </div>
      )}

      {/* Education Form */}
      {isFormOpen && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? modals.editEducation : modals.addNewEducation}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.institution} *
                </label>
                <input
                  {...register('institution_name')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  placeholder={modals.institutionPlaceholder}
                />
                {errors.institution_name && <p className="text-red-500 text-sm mt-1">{errors.institution_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.degree} *
                </label>
                <input
                  {...register('degree')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  placeholder={modals.degreePlaceholder}
                />
                {errors.degree && <p className="text-red-500 text-sm mt-1">{errors.degree.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {modals.fieldOfStudy} *
              </label>
              <input
                {...register('field_of_study')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                placeholder={modals.fieldOfStudyPlaceholder}
              />
              {errors.field_of_study && <p className="text-red-500 text-sm mt-1">{errors.field_of_study.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GPA
                </label>
                <input
                  {...register('grade')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  placeholder="3.8/4.0"
                />
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
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  {...register('verified')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {modals.currentStudy}
                </span>
              </label>
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
                {editingIndex !== null ? modals.update : modals.add} {modals.addEducation.replace('Añadir ', '')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EducationSection;
