import React, { useState, lazy, Suspense, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { educationSchema, EducationFormData } from '../../schemas/profileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import { useConfirmDialog } from '../ConfirmDialog';
import { useToastContext } from '../../context/ToastContext';
import { validateDateRange } from '../../utils/dateValidation';
import { useAuth } from '../../contexts/AuthContext';
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

// Lazy load AI optimizer
const AITextOptimizer = lazy(() => import('./AITextOptimizer'));

interface EducationSectionProps {
  initialData?: EducationFormData[];
  onSave: (data: EducationFormData[]) => Promise<void>;
  onNavigateToVerifications?: () => void;
}

export interface EducationSectionHandle {
  toggleAISuggestions: () => void;
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
    // Parse date manually to avoid timezone issues
    const [year, month] = date.split('-').map(Number);
    // Create date using local time constructor (year, monthIndex)
    const d = new Date(year, month - 1);
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

/**
 * Normalize and expand common abbreviations in education fields
 */
const normalizeEducationText = (text: string): string => {
  if (!text) return '';
  
  let normalized = text.trim();
  
  // Expand common abbreviations
  const abbreviations: { [key: string]: string } = {
    'Ing\\.': 'Ingeniería de',
    'Lic\\.': 'Licenciatura en',
    'Dr\\.': 'Doctorado en',
    'Msc\\.': 'Maestría en',
    'MBA': 'Master en Administración de Empresas',
    'BSc': 'Licenciatura en Ciencias',
  };
  
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(abbr, 'gi');
    normalized = normalized.replace(regex, full);
  }
  
  // Fix common patterns like "Ingeniería de sistemas" -> "Ingeniería de Sistemas"
  // Capitalize first letter of each word after "de", "en", "y"
  normalized = normalized.replace(/\b(de|en|y)\s+([a-z])/g, (match, prep, letter) => {
    return `${prep} ${letter.toUpperCase()}`;
  });
  
  // Capitalize first letter
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  
  return normalized;
};

/**
 * Extract degree type from field of study
 * Returns a simplified degree name
 */
const extractDegreeType = (fieldOfStudy: string): string => {
  if (!fieldOfStudy) return '';
  
  // If it already contains degree type, extract it
  if (fieldOfStudy.toLowerCase().includes('ingeniería')) {
    return 'Ingeniería';
  } else if (fieldOfStudy.toLowerCase().includes('licenciatura')) {
    return 'Licenciatura';
  } else if (fieldOfStudy.toLowerCase().includes('maestría') || fieldOfStudy.toLowerCase().includes('master')) {
    return 'Maestría';
  } else if (fieldOfStudy.toLowerCase().includes('doctorado')) {
    return 'Doctorado';
  }
  
  // Default: assume it's a bachelor's degree
  return 'Licenciatura';
};

const EducationSection = forwardRef<EducationSectionHandle, EducationSectionProps>(({ initialData = [], onSave, onNavigateToVerifications }, ref) => {
  const { session } = useAuth();
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const { confirm, Dialog } = useConfirmDialog();
  const toast = useToastContext();
  const [education, setEducation] = useState<EducationFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
  });

  const isCurrent = watch('is_current');

  // Clear end_date when marking as current
  React.useEffect(() => {
    if (isCurrent) {
      reset((formValues) => ({
        ...formValues,
        end_date: null,
      }));
    }
  }, [isCurrent, reset]);

  // Auto-save form data to localStorage
  React.useEffect(() => {
    if (isFormOpen && shouldSaveDraft.current) {
      const subscription = watch((formData) => {
        // Only save if auto-save is still enabled (double-check)
        if (!shouldSaveDraft.current) return;

        try {
          localStorage.setItem('education_draft', JSON.stringify({
            formData,
            editingIndex,
            timestamp: Date.now()
          }));
        } catch (e) {
          toast.error('Error al guardar borrador');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isFormOpen, editingIndex]);

  // Restore draft on mount (only once per session)
  React.useEffect(() => {
    if (hasCheckedDraft.current) return;
    hasCheckedDraft.current = true;

    const checkDraft = async () => {
      try {
        const draft = localStorage.getItem('education_draft');
        const lastPromptTime = localStorage.getItem('education_draft_last_prompt');

        if (draft) {
          const parsed = JSON.parse(draft);

          // Only restore if less than 24 hours old
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            // Check if we've already asked about this draft in the last 5 minutes
            if (lastPromptTime && Date.now() - parseInt(lastPromptTime) < 5 * 60 * 1000) {
              return; // Don't ask again
            }

            // Update the last prompt time
            localStorage.setItem('education_draft_last_prompt', Date.now().toString());

            const shouldRestore = await confirm({
              title: 'Restaurar Borrador',
              message: modals.restoreDraft || '¿Restaurar borrador guardado?',
              confirmText: 'Restaurar',
              cancelText: 'Descartar',
              type: 'info'
            });
            if (shouldRestore && parsed.formData) {
              reset(parsed.formData);
              if (parsed.editingIndex !== null) setEditingIndex(parsed.editingIndex);
              setIsFormOpen(true);
            } else {
              localStorage.removeItem('education_draft');
              localStorage.removeItem('education_draft_last_prompt');
            }
          } else {
            localStorage.removeItem('education_draft');
            localStorage.removeItem('education_draft_last_prompt');
          }
        }
      } catch (e) {
        toast.error('Error al restaurar borrador');
        localStorage.removeItem('education_draft');
        localStorage.removeItem('education_draft_last_prompt');
      }
    };
    checkDraft();
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
      is_current: false,
    });
    shouldSaveDraft.current = true; // Reactivar guardado de borrador para nueva entrada
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    // CRITICAL: Disable auto-save FIRST, then clear draft immediately
    shouldSaveDraft.current = false;

    // Use setTimeout to ensure this runs after any pending watch() callbacks
    setTimeout(() => {
      localStorage.removeItem('education_draft');
      localStorage.removeItem('education_draft_last_prompt');
    }, 0);

    setIsFormOpen(false);
    reset();
  };

  /**
   * Remove markdown formatting (** for bold) from text
   */
  const cleanMarkdown = (text: string | null | undefined): string => {
    if (!text) return '';
    // Remove ** bold markers
    return text.replace(/\*\*/g, '');
  };

  const handleEdit = (index: number) => {
    const edu = education[index];
    setEditingIndex(index);

    // Clean markdown from description
    const cleanedDescription = cleanMarkdown(edu.description);
    
    // Try to extract structured information from description if fields are empty
    let institutionName = edu.institution_name || '';
    let degree = edu.degree || '';
    let fieldOfStudy = edu.field_of_study || '';
    let grade = edu.grade || '';
    let description = cleanedDescription;

    // If description contains structured data and other fields are empty, try to parse it
    if (cleanedDescription && (!edu.degree || !edu.field_of_study || !edu.institution_name)) {
      const lines = cleanedDescription.split('\n').map(l => l.trim()).filter(l => l);
      
      // Look for title line (format: "Field of Study - Institution")
      // Example: "Ingeniería de Sistemas - PSM"
      let titleLine = null;
      for (const line of lines) {
        if (line.includes(' - ') && !line.startsWith('*') && !line.startsWith('•') && !line.startsWith('-')) {
          titleLine = line;
          break;
        }
      }
      
      if (titleLine) {
        const parts = titleLine.split(' - ');
        if (parts.length >= 2) {
          if (!edu.field_of_study) {
            // Normalize and expand the field of study
            fieldOfStudy = normalizeEducationText(parts[0].trim());
          }
          if (!edu.institution_name) {
            // Normalize institution name (capitalize properly)
            institutionName = parts[1].trim().toUpperCase();
          }
          // Extract degree type from field of study
          if (!edu.degree) {
            degree = extractDegreeType(fieldOfStudy);
          }
        }
      }

      // Look for GPA/Grade info in any line
      const gradePattern = /(?:GPA|Promedio)[:\s]*([0-9.]+\/[0-9.]+|[0-9.]+)/i;
      for (const line of lines) {
        const gradeMatch = line.match(gradePattern);
        if (gradeMatch && !edu.grade) {
          grade = gradeMatch[1];
          break;
        }
      }

      // Extract only bullet points as description, excluding the title line
      const bulletPoints = lines.filter(l => {
        const isBullet = l.startsWith('*') || l.startsWith('•') || l.startsWith('-');
        const isNotTitle = l !== titleLine;
        return isBullet && isNotTitle;
      });
      
      // Clean bullet points (remove the bullet character)
      const cleanedBullets = bulletPoints.map(bp => {
        if (bp.startsWith('* ')) return bp.substring(2);
        if (bp.startsWith('• ')) return bp.substring(2);
        if (bp.startsWith('- ')) return bp.substring(2);
        return bp;
      });
      
      description = cleanedBullets.join('\n');
    } else {
      // Even if fields exist, normalize them
      if (edu.degree) {
        degree = normalizeEducationText(edu.degree);
      }
      if (edu.field_of_study) {
        fieldOfStudy = normalizeEducationText(edu.field_of_study);
      }
      if (edu.institution_name) {
        institutionName = edu.institution_name.toUpperCase();
      }
    }

    const cleanedEdu = {
      ...edu,
      institution_name: institutionName,
      degree: degree,
      field_of_study: fieldOfStudy,
      grade: grade,
      description: description,
    };

    reset(cleanedEdu);
    setIsFormOpen(true);
  };

  const handleDelete = async (index: number) => {
    const shouldDelete = await confirm({
      title: 'Eliminar Educación',
      message: modals.deleteEducationConfirm,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (shouldDelete) {
      const updated = education.filter((_, i) => i !== index);
      setEducation(updated);
      onSave(updated);
    }
  };

  const handleApplyAISuggestion = async (
    itemId: string,
    optimizedText: string,
    optimizedAchievements?: string[]
  ) => {
    try {
      // Clean markdown before saving
      const cleanDescription = cleanMarkdown(optimizedText);

      // Parse the optimized text to extract structured information
      const lines = cleanDescription.split('\n').map(l => l.trim()).filter(l => l);
      
      let institutionName = '';
      let degree = '';
      let fieldOfStudy = '';
      let description = cleanDescription;

      // Look for title line (format: "Field of Study | Institution")
      const titleLine = lines.find(l => l.includes(' | ') && !l.startsWith('*'));
      if (titleLine) {
        const parts = titleLine.split(' | ');
        if (parts.length >= 2) {
          fieldOfStudy = normalizeEducationText(parts[0].trim());
          institutionName = parts[1].trim().toUpperCase();
          degree = extractDegreeType(fieldOfStudy);
        }

        // Remove title line from description
        const bulletPoints = lines.filter(l => 
          (l.startsWith('*') || l.startsWith('•') || l.startsWith('-')) &&
          l !== titleLine
        );
        
        const cleanedBullets = bulletPoints.map(bp => {
          if (bp.startsWith('* ')) return bp.substring(2);
          if (bp.startsWith('• ')) return bp.substring(2);
          if (bp.startsWith('- ')) return bp.substring(2);
          return bp;
        });
        
        description = cleanedBullets.join('\n');
      }

      // Update local state with all normalized fields
      const updated = education.map(edu =>
        edu.id === itemId
          ? {
              ...edu,
              institution_name: institutionName || edu.institution_name,
              degree: degree || edu.degree,
              field_of_study: fieldOfStudy || edu.field_of_study,
              description: description,
            }
          : edu
      );

      // Update state
      setEducation(updated);

      // Save to database through parent component
      await onSave(updated);

      toast.success('Sugerencias de IA aplicadas correctamente');
    } catch (error) {
      console.error('Error applying AI suggestion:', error);
      toast.error('Error al aplicar la sugerencia');
      throw error;
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
    // Validar fechas antes de guardar
    const dateValidation = validateDateRange(
      data.start_date,
      data.end_date,
      data.is_current || false
    );

    if (!dateValidation.isValid) {
      toast.error(dateValidation.error || 'Las fechas no son válidas');
      return;
    }

    // Normalize and clean all fields before saving
    const formData = {
      ...data,
      // Normalize institution name (uppercase)
      institution_name: data.institution_name ? data.institution_name.toUpperCase() : '',
      // Normalize degree (expand abbreviations and capitalize)
      degree: data.degree ? normalizeEducationText(data.degree) : '',
      // Normalize field of study (expand abbreviations and capitalize)
      field_of_study: data.field_of_study ? normalizeEducationText(data.field_of_study) : '',
      // Clean markdown from description
      description: cleanMarkdown(data.description),
      // Keep the ID if editing
      id: editingIndex !== null ? education[editingIndex].id : undefined,
    };

    let updated: EducationFormData[];
    if (editingIndex !== null) {
      updated = education.map((edu, idx) => (idx === editingIndex ? formData : edu));
    } else {
      updated = [...education, formData];
    }

    setEducation(updated);

    // CRITICAL: Disable auto-save IMMEDIATELY to prevent any more draft saves
    shouldSaveDraft.current = false;

    // Clear draft immediately and synchronously
    setTimeout(() => {
      localStorage.removeItem('education_draft');
      localStorage.removeItem('education_draft_last_prompt');
    }, 0);

    try {
      await onSave(updated);
    } catch (error) {
      // Even if refetch fails, draft is already cleaned since DB save succeeded
      // The error toast will be shown from DashboardContent
    } finally {
      // Double-check cleanup and close form
      localStorage.removeItem('education_draft');
      localStorage.removeItem('education_draft_last_prompt');
      setIsFormOpen(false);
      reset();
    }
  };

  return (
    <>
      <Dialog />
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

      {/* Verification Info Banner */}
      {education.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {translations.lang === 'en' ? 'Verify your education' : 'Verifica tu educación'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {translations.lang === 'en'
                  ? 'Boost your credibility by verifying your educational background. Go to the Verifications section to submit your certificates or diplomas.'
                  : 'Aumenta tu credibilidad verificando tu formación académica. Ve a la sección de Verificaciones para enviar tus certificados o diplomas.'}
              </p>
              <button
                onClick={() => onNavigateToVerifications?.()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                {translations.lang === 'en' ? 'Go to Verifications' : 'Ir a Verificaciones'}
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
              type="education"
              items={education}
              onApplySuggestion={handleApplyAISuggestion}
            />
          </Suspense>
        </div>
      )}

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
                  {isCurrent && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Actual)</span>}
                </label>
                <input
                  {...register('end_date')}
                  type="month"
                  disabled={isCurrent}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder={isCurrent ? "Presente" : ""}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GPA
                  <span title="Grade Point Average - Promedio de calificaciones (ej: 3.8/4.0 o 85/100)" className="cursor-help">
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </label>
                <input
                  {...register('grade')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  placeholder="3.8/4.0 o 85/100"
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
                  {...register('is_current')}
                  type="checkbox"
                  className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {modals.currentStudy}
                </span>
              </label>
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
                {editingIndex !== null ? modals.update : modals.add} {modals.addEducation.replace('Añadir ', '')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </>
  );
});

EducationSection.displayName = 'EducationSection';

export default EducationSection;
