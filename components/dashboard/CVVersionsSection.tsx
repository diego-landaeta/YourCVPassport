/**
 * CV Versions Management Section
 * Allows users to create and manage multiple CV versions for different countries/roles
 */

import { useState } from 'react';
import { useCVVersions } from '../../hooks/useCVVersions';
import { CVVersion } from '../../types';
import { CreateVersionModal } from './CreateVersionModal';

// SVG Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export function CVVersionsSection() {
  const {
    versions,
    stats,
    isLoading,
    error,
    deleteVersion,
    duplicateVersion
  } = useCVVersions();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CVVersion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Check if error is due to missing table
  const isTableMissing = error && (
    error.includes('relation "cv_versions" does not exist') ||
    error.includes('table') ||
    error.includes('does not exist')
  );

  const handleDelete = async (versionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta versión?')) {
      return;
    }

    setDeletingId(versionId);
    const success = await deleteVersion(versionId);
    setDeletingId(null);

    if (!success) {
      alert('Error al eliminar la versión');
    }
  };

  const handleDuplicate = async (version: CVVersion) => {
    const newName = prompt(
      'Nombre para la copia:',
      `${version.version_name} (Copia)`
    );

    if (!newName) return;

    const newId = await duplicateVersion(version.id, newName);
    if (!newId) {
      alert('Error al duplicar la versión');
    }
  };

  const handleExport = async (version: CVVersion) => {
    setExportingId(version.id);

    try {
      // Simple alert for now - full export functionality requires PDF generation
      alert(`Exportando versión: ${version.version_name}\n\nFuncionalidad de exportación completa próximamente.`);

      // TODO: Implement full PDF export with:
      // 1. Generate PDF from snapshot_data
      // 2. Apply template and styling
      // 3. Download file

    } catch (error) {
      console.error('Error exporting version:', error);
      alert('Error al exportar la versión');
    } finally {
      setExportingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If table is missing, show setup instructions
  if (isTableMissing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-10 text-center shadow-lg">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-full p-5">
              <svg className="w-16 h-16 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Configuración de Base de Datos Requerida
          </h2>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
            La función "CV Versions" requiere que apliques una migración de base de datos.
            Esta es una configuración única que solo necesitas hacer una vez.
          </p>

          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 text-left max-w-2xl mx-auto">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Instrucciones de Configuración
            </h3>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Opción 1: Supabase Dashboard (Recomendado)</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Abre <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                  <li>Ve a tu proyecto → <strong>SQL Editor</strong></li>
                  <li>Abre el archivo: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">supabase/migrations/20250120_cv_versions_fix.sql</code></li>
                  <li>Copia todo el contenido y pégalo en el SQL Editor</li>
                  <li>Click en <strong>Run</strong></li>
                  <li>Refresca esta página</li>
                </ol>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Opción 2: Supabase CLI</p>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`cd c:\\Users\\molin\\Downloads\\yourcvpassport
supabase db push`}
                </pre>
              </div>
            </div>
          </div>

          {/* Help Link */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Consulta <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">APPLY_CV_VERSIONS_FIX.md</code> para más detalles</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Versiones de CV
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Crea versiones personalizadas de tu CV para diferentes países y roles
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Nueva Versión
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total_versions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de Versiones</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.keys(stats.versions_by_country || {}).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Países</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(stats.versions_by_template || {}).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Plantillas Usadas</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty State */}
      {versions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-600">
            <FileTextIcon />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No tienes versiones de CV
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Crea diferentes versiones de tu CV optimizadas para distintos países,
            roles o industrias. Cada versión puede tener secciones y contenido personalizado.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Crear Primera Versión
          </button>
        </div>
      ) : (
        /* Versions List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {versions.map((version) => (
            <VersionCard
              key={version.id}
              version={version}
              onEdit={() => {
                setSelectedVersion(version);
                setIsCreateModalOpen(true);
              }}
              onDelete={() => handleDelete(version.id)}
              onDuplicate={() => handleDuplicate(version)}
              onExport={() => handleExport(version)}
              isDeleting={deletingId === version.id}
              isExporting={exportingId === version.id}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <CreateVersionModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedVersion(null);
          }}
          editingVersion={selectedVersion}
        />
      )}
    </div>
  );
}

// Version Card Component
interface VersionCardProps {
  version: CVVersion;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  isDeleting: boolean;
  isExporting: boolean;
}

function VersionCard({
  version,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  isDeleting,
  isExporting
}: VersionCardProps) {
  const templateColors = {
    classic: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    modern: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
    minimal: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  };

  const templateColor = version.template
    ? templateColors[version.template]
    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
            {version.version_name}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${templateColor}`}
          >
            {version.template}
          </span>
        </div>

        {/* Country and Role */}
        <div className="space-y-1">
          {version.country && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <GlobeIcon />
              <span>{version.country}</span>
            </div>
          )}
          {version.role && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <BriefcaseIcon />
              <span>{version.role}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Sections */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Secciones incluidas ({version.sections.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {version.sections.slice(0, 4).map((section) => (
              <span
                key={section}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {section}
              </span>
            ))}
            {version.sections.length > 4 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                +{version.sections.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <CalendarIcon />
          <span>
            Creada: {new Date(version.created_at).toLocaleDateString('es-ES')}
          </span>
        </div>

        {/* Notes */}
        {version.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {version.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <DownloadIcon />
                Exportar
              </>
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Editar"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
            title="Duplicar"
          >
            <CopyIcon />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
            title="Eliminar"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrashIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
