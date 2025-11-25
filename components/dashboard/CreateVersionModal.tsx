/**
 * Create/Edit CV Version Modal
 * Allows users to create or edit CV versions with section selection and reordering
 */

import React, { useState, useEffect } from 'react';
import { useCVVersions } from '../../hooks/useCVVersions';
import {
  CVVersion,
  CVSectionType,
  CreateCVVersionRequest
} from '../../types';
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
import { TemplatePreviewSelector, ALL_TEMPLATES } from './TemplatePreviewSelector';
import { useAuth } from '../../contexts/AuthContext';

// SVG Icons as simple functions
function FiX({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FiCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FiMove({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function FiFileText({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function FiGlobe({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FiBriefcase({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function FiPalette({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVersion?: CVVersion | null;
}

const AVAILABLE_SECTIONS: Array<{
  id: CVSectionType;
  label: string;
  description: string;
}> = [
  { id: 'profile', label: 'Perfil', description: 'Información básica y resumen' },
  { id: 'experience', label: 'Experiencia', description: 'Historial laboral' },
  { id: 'education', label: 'Educación', description: 'Formación académica' },
  { id: 'skills', label: 'Habilidades', description: 'Competencias técnicas' },
  { id: 'languages', label: 'Idiomas', description: 'Conocimientos lingüísticos' },
  { id: 'certifications', label: 'Certificaciones', description: 'Certificados y acreditaciones' },
  { id: 'portfolio', label: 'Portfolio', description: 'Proyectos y trabajos destacados' },
  { id: 'services', label: 'Servicios', description: 'Servicios ofrecidos' },
  { id: 'stats', label: 'Estadísticas', description: 'Métricas y logros' }
];

// Template type - support all template IDs
type TemplateType = typeof ALL_TEMPLATES[number]['id'];

export function CreateVersionModal({
  isOpen,
  onClose,
  editingVersion
}: CreateVersionModalProps) {
  const { createVersion, updateVersion, isCreating, error: hookError } = useCVVersions();
  const { profile } = useAuth();

  // Form state
  const [versionName, setVersionName] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('');
  const [selectedSections, setSelectedSections] = useState<CVSectionType[]>([
    'profile',
    'experience',
    'education',
    'skills',
    'languages'
  ]);
  const [template, setTemplate] = useState<TemplateType>('passport');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check if user is PRO
  const userIsPro = profile?.is_pro || false;

  // Load editing version data
  useEffect(() => {
    if (editingVersion) {
      setVersionName(editingVersion.version_name);
      setCountry(editingVersion.country || '');
      setRole(editingVersion.role || '');
      setSelectedSections(editingVersion.sections);
      setTemplate(editingVersion.template || 'modern');
      setNotes(editingVersion.notes || '');
    } else {
      // Reset form for new version
      setVersionName('');
      setCountry('');
      setRole('');
      setSelectedSections(['profile', 'experience', 'education', 'skills', 'languages']);
      setTemplate('passport');
      setNotes('');
    }
    setError(null);
  }, [editingVersion, isOpen]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedSections((sections) => {
        const oldIndex = sections.indexOf(active.id as CVSectionType);
        const newIndex = sections.indexOf(over.id as CVSectionType);
        return arrayMove(sections, oldIndex, newIndex);
      });
    }
  };

  const toggleSection = (sectionId: CVSectionType) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        return prev.filter((s) => s !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!versionName.trim()) {
      setError('El nombre de la versión es obligatorio');
      return;
    }

    if (selectedSections.length === 0) {
      setError('Debes seleccionar al menos una sección');
      return;
    }

    const request: CreateCVVersionRequest = {
      version_name: versionName.trim(),
      country: country.trim() || undefined,
      role: role.trim() || undefined,
      sections: selectedSections,
      template,
      notes: notes.trim() || undefined
    };

    try {
      if (editingVersion) {
        console.log('Updating version with data:', request);
        const updated = await updateVersion(editingVersion.id, request);
        console.log('Update result:', updated);
        if (updated) {
          onClose();
        } else {
          // Get the error from the hook state
          const errorMsg = hookError || 'Error al actualizar la versión';
          setError(errorMsg);
          console.error('Update failed with error:', hookError);
        }
      } else {
        const created = await createVersion(request);
        if (created) {
          onClose();
        } else {
          // Get the error from the hook state
          const errorMsg = hookError || 'Error al crear la versión';
          setError(errorMsg);
          console.error('Create failed with error:', hookError);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Exception during save:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal - Clean and Spacious Layout */}
        <div className="inline-block w-full max-w-6xl my-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-dark-bg-secondary shadow-2xl rounded-xl">
          {/* Header - Ultra Compact */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {editingVersion ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar Versión
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Nueva Versión
                    </>
                  )}
                </h3>
                <p className="text-blue-100 text-[11px] mt-0.5">
                  {editingVersion ? 'Personaliza tu CV para diferentes necesidades' : 'Crea una versión personalizada de tu CV'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white hover:bg-white/10 transition-all rounded-lg p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content - Smooth Scroll with Better Spacing */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {/* Error Message - Compact */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-3 py-2 rounded">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Basic Information - Ultra Compact */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-800/10 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información Básica
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nombre de la versión *
                  </label>
                  <input
                    type="text"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="Ej: CV USA - Frontend Developer"
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    País (opcional)
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ej: Estados Unidos"
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Rol (opcional)
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ej: Frontend Developer"
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Template Selection - Ultra Compact */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/30 rounded-lg p-3 border border-blue-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <FiPalette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Plantilla
                  </h4>
                </div>
                <div className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                  {userIsPro ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Acceso completo
                    </span>
                  ) : '10 gratis + 10 PRO'}
                </div>
              </div>
              <TemplatePreviewSelector
                selectedTemplate={template}
                onSelectTemplate={(templateId) => setTemplate(templateId as TemplateType)}
                userIsPro={userIsPro}
              />
            </div>

            {/* Section Selection - Ultra Compact */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-800/10 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Secciones
                  </h4>
                </div>
                <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                    {selectedSections.length} seleccionada{selectedSections.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2.5">
                {AVAILABLE_SECTIONS.map((section) => {
                  const isSelected = selectedSections.includes(section.id);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={`p-2 border-2 rounded-md text-left transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                          : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-gray-900 dark:text-white truncate">
                            {section.label}
                          </div>
                        </div>
                        {isSelected && (
                          <FiCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Section Reordering - Ultra Compact */}
              {selectedSections.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiMove className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      Orden
                    </span>
                    <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400 italic">
                      Arrastra para reordenar
                    </span>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedSections}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {selectedSections.map((sectionId, index) => (
                          <SortableSectionItem
                            key={sectionId}
                            id={sectionId}
                            index={index}
                            label={
                              AVAILABLE_SECTIONS.find((s) => s.id === sectionId)
                                ?.label || sectionId
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>

            {/* Notes - Ultra Compact */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-800/10 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5 flex items-center gap-1">
                <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade notas internas (ej: 'Sin foto para EE.UU.')..."
                rows={2}
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Actions - Fixed at bottom with shadow */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-dark-bg-secondary -mx-4 -mb-4 px-4 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isCreating ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingVersion ? 'Actualizando...' : 'Creando...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {editingVersion ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Actualizar
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Crear
                      </>
                    )}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sortable Section Item Component
interface SortableSectionItemProps {
  id: CVSectionType;
  index: number;
  label: string;
}

function SortableSectionItem({ id, index, label }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: String(id) });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md cursor-move hover:border-blue-400 dark:hover:border-blue-600 transition-all"
      {...attributes}
      {...listeners}
    >
      <FiMove className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      <div className="flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[9px] font-bold flex-shrink-0">
        {index + 1}
      </div>
      <span className="text-xs text-gray-900 dark:text-white font-medium truncate">{label}</span>
    </div>
  );
}
