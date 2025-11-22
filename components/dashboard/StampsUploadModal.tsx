import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { StampType } from '../../types';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  IdentificationIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

interface StampsUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  stampType: StampType;
  onSuccess?: () => void;
}

const StampsUploadModal: React.FC<StampsUploadModalProps> = ({
  isOpen,
  onClose,
  stampType,
  onSuccess
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const getStampInfo = () => {
    switch (stampType) {
      case 'IDENTITY':
        return {
          title: 'Verificación de Identidad',
          description: 'Sube una foto de tu DNI, Pasaporte o documento de identidad válido',
          icon: IdentificationIcon,
          fields: [
            { key: 'document_type', label: 'Tipo de Documento', type: 'select', options: ['DNI', 'Pasaporte', 'NIE', 'Licencia de Conducir'], required: true },
            { key: 'document_number', label: 'Número de Documento', type: 'text', required: true }
          ]
        };
      case 'EDUCATION':
        return {
          title: 'Verificación de Educación',
          description: 'Sube tu título académico, diploma o certificado de estudios',
          icon: AcademicCapIcon,
          fields: [
            { key: 'institution', label: 'Institución', type: 'text', required: true },
            { key: 'degree', label: 'Título/Grado', type: 'text', required: true },
            { key: 'graduation_year', label: 'Año de Graduación', type: 'number', required: false }
          ]
        };
      case 'CERTIFICATION':
        return {
          title: 'Verificación de Certificación',
          description: 'Sube tu certificado profesional o acreditación',
          icon: DocumentTextIcon,
          fields: [
            { key: 'name', label: 'Nombre de la Certificación', type: 'text', required: true },
            { key: 'issuer', label: 'Emisor', type: 'text', required: true },
            { key: 'issue_date', label: 'Fecha de Emisión', type: 'date', required: false },
            { key: 'credential_id', label: 'ID de Credencial', type: 'text', required: false }
          ]
        };
      case 'EMPLOYMENT':
        return {
          title: 'Verificación de Empleo',
          description: 'Sube carta de recomendación o certificado de empleo',
          icon: BriefcaseIcon,
          fields: [
            { key: 'company', label: 'Empresa', type: 'text', required: true },
            { key: 'position', label: 'Cargo', type: 'text', required: true },
            { key: 'reference_contact', label: 'Contacto de Referencia', type: 'email', required: false }
          ]
        };
      default:
        return {
          title: 'Verificación',
          description: 'Sube el documento necesario para la verificación',
          icon: DocumentTextIcon,
          fields: []
        };
    }
  };

  const stampInfo = getStampInfo();
  const Icon = stampInfo.icon;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (selectedFile: File) => {
    setError(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Tipo de archivo no válido. Solo se permiten: JPG, PNG, PDF, WEBP');
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setFile(selectedFile);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    // Validate required fields
    for (const field of stampInfo.fields) {
      if (field.required && !formData[field.key]) {
        setError(`El campo "${field.label}" es obligatorio`);
        return;
      }
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${stampType.toLowerCase()}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Store only the file path (not the full URL)
      // The admin panel will generate signed URLs when needed

      // 3. Create stamp record
      const evidence = {
        ...formData,
        document_url: fileName, // Store path only: "user_id/filename.ext"
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date().toISOString()
      };

      const { error: stampError } = await supabase
        .from('stamps')
        .insert({
          profile_id: user.id,
          type: stampType,
          status: 'PENDING',
          evidence,
          provider: 'manual_upload'
        });

      if (stampError) {
        // If stamp creation fails, delete the uploaded file
        await supabase.storage.from('documents').remove([fileName]);
        throw stampError;
      }

      // Success!
      onSuccess?.();
      onClose();
      resetForm();

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir el documento. Intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setFormData({});
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white dark:bg-dark-bg-tertiary rounded-lg flex items-center justify-center">
                <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{stampInfo.title}</h2>
                <p className="text-blue-100 dark:text-blue-200 text-sm mt-1">
                  {stampInfo.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Form Fields */}
          {stampInfo.fields.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Información del Documento</h3>
              {stampInfo.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      required={field.required}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecciona una opción</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      required={field.required}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Documento <span className="text-red-500">*</span>
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary'
              }`}
            >
              {!file ? (
                <div className="text-center">
                  <CloudArrowUpIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Arrastra tu documento aquí o
                  </p>
                  <label className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors">
                    Selecciona un archivo
                    <input
                      type="file"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      accept="image/jpeg,image/png,image/jpg,application/pdf,image/webp"
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    JPG, PNG, PDF o WEBP (máx. 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Preview */}
                  {preview ? (
                    <div className="flex justify-center">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-64 rounded-lg border border-gray-200 dark:border-dark-border"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-dark-bg-secondary rounded-lg">
                      <DocumentTextIcon className="w-12 h-12 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          PDF • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File Info & Remove */}
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Archivo seleccionado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Proceso de Verificación</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Tu documento será revisado por nuestro equipo</li>
                <li>El proceso puede tomar de 1-3 días hábiles</li>
                <li>Recibirás una notificación con el resultado</li>
                <li>Asegúrate de que el documento sea legible y válido</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Enviar para Verificación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StampsUploadModal;
