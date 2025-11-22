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

const TEMPLATES = [
  { id: 'classic' as const, label: 'Clásico', description: 'Diseño tradicional y profesional' },
  { id: 'modern' as const, label: 'Moderno', description: 'Diseño actual con colores vibrantes' },
  { id: 'minimal' as const, label: 'Minimalista', description: 'Diseño limpio y simple' }
];

export function CreateVersionModal({
  isOpen,
  onClose,
  editingVersion
}: CreateVersionModalProps) {
  const { createVersion, updateVersion, isCreating } = useCVVersions();

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
  const [template, setTemplate] = useState<'classic' | 'modern' | 'minimal'>('modern');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      setTemplate('modern');
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
        const updated = await updateVersion(editingVersion.id, request);
        if (updated) {
          onClose();
        } else {
          setError('Error al actualizar la versión');
        }
      } else {
        const created = await createVersion(request);
        if (created) {
          onClose();
        } else {
          setError('Error al crear la versión');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
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

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {editingVersion ? 'Editar Versión de CV' : 'Nueva Versión de CV'}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiFileText className="inline w-4 h-4 mr-1" />
                  Nombre de la versión *
                </label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="Ej: CV USA - Frontend Developer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiGlobe className="inline w-4 h-4 mr-1" />
                  País (opcional)
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ej: Estados Unidos, España"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiBriefcase className="inline w-4 h-4 mr-1" />
                  Rol (opcional)
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ej: Frontend Developer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiPalette className="inline w-4 h-4 mr-1" />
                Plantilla
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setTemplate(tmpl.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      template === tmpl.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{tmpl.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{tmpl.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secciones a incluir ({selectedSections.length} seleccionadas)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {AVAILABLE_SECTIONS.map((section) => {
                  const isSelected = selectedSections.includes(section.id);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {section.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {section.description}
                          </div>
                        </div>
                        {isSelected && (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Section Reordering */}
              {selectedSections.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FiMove className="w-4 h-4" />
                    Orden de las secciones (arrastra para reordenar)
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

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade notas sobre esta versión..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingVersion ? 'Actualizando...' : 'Creando...'}
                  </span>
                ) : (
                  editingVersion ? 'Actualizar Versión' : 'Crear Versión'
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
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-gray-300 transition-colors"
      {...attributes}
      {...listeners}
    >
      <FiMove className="w-4 h-4 text-gray-400" />
      <span className="font-medium text-gray-500">{index + 1}.</span>
      <span className="text-gray-900">{label}</span>
    </div>
  );
}
