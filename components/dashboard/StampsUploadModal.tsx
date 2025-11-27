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
            { key: 'document_number', label: 'Número de Documento', type: 'text', required: true, placeholder: 'Ej: 12345678Z' }
          ]
        };
      case 'EDUCATION':
        return {
          title: 'Verificación de Educación',
          description: 'Sube tu título académico, diploma o certificado de estudios',
          icon: AcademicCapIcon,
          fields: [
            { key: 'institution', label: 'Institución', type: 'text', required: true, placeholder: 'Ej: Universidad de Madrid' },
            { key: 'degree', label: 'Título/Grado', type: 'text', required: true, placeholder: 'Ej: Licenciatura en Ingeniería Informática' },
            { key: 'graduation_year', label: 'Año de Graduación', type: 'number', required: false, placeholder: 'Ej: 2020' }
          ]
        };
      case 'CERTIFICATION':
        return {
          title: 'Verificación de Certificación',
          description: 'Sube tu certificado profesional o acreditación',
          icon: DocumentTextIcon,
          fields: [
            { key: 'name', label: 'Nombre de la Certificación', type: 'text', required: true, placeholder: 'Ej: TOEFL iBT, IELTS Academic, DELE C1' },
            { key: 'issuer', label: 'Emisor', type: 'text', required: true, placeholder: 'Ej: ETS, British Council, Instituto Cervantes' },
            { key: 'issue_date', label: 'Fecha de Emisión', type: 'date', required: false },
            { key: 'credential_id', label: 'ID de Credencial', type: 'text', required: false, placeholder: 'Ej: ABC123456789' }
          ]
        };
      case 'EMPLOYMENT':
        return {
          title: 'Verificación de Empleo',
          description: 'Sube carta de recomendación o certificado de empleo',
          icon: BriefcaseIcon,
          fields: [
            { key: 'company', label: 'Empresa', type: 'text', required: true, placeholder: 'Ej: Google Spain, Telefónica, Banco Santander' },
            { key: 'position', label: 'Cargo', type: 'text', required: true, placeholder: 'Ej: Desarrollador Senior, Gerente de Proyectos' },
            { key: 'reference_contact', label: 'Contacto de Referencia', type: 'email', required: false, placeholder: 'Ej: jefe@empresa.com' }
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

    } catch (err: any) {setError(err.message || 'Error al subir el documento. Intenta nuevamente.');
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
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header - Compact & Modern */}
        <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-100 dark:border-gray-700 p-6 flex-shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{stampInfo.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {stampInfo.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="upload-form" onSubmit={handleSubmit} className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              {/* Left Column: Form Fields */}
              <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                {stampInfo.fields.length > 0 && (
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">
                      Información del Documento
                    </h3>
                    <div className="grid grid-cols-1 gap-5">
                      {stampInfo.fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <div className="relative">
                              <select
                                value={formData[field.key] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                required={field.required}
                                className="w-full pl-4 pr-10 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                              >
                                <option value="">Selecciona una opción</option>
                                {field.options?.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </div>
                            </div>
                          ) : (
                            <input
                              type={field.type}
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                              required={field.required}
                              placeholder={(field as any).placeholder || ''}
                              className="w-full px-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Info Message - Moved to left column bottom */}
                <div className="mt-auto bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Proceso de Verificación</h4>
                    <ul className="space-y-1">
                      <li className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                        Revisión manual por nuestro equipo
                      </li>
                      <li className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                        Tiempo estimado: 1 a 3 días hábiles
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: Upload Zone */}
              <div className="flex flex-col h-full">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2 mb-5">
                  Documento Probatorio <span className="text-red-500">*</span>
                </h3>

                <div className="flex-1 flex flex-col">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`flex-1 relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 group flex flex-col items-center justify-center ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg-tertiary hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    {!file ? (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white dark:bg-dark-bg-secondary rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                          <CloudArrowUpIcon className="w-10 h-10 text-blue-500" />
                        </div>
                        <h4 className="text-lg text-gray-900 dark:text-white font-medium mb-2">
                          Arrastra tu documento aquí
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                          o haz clic para seleccionar
                        </p>
                        <label className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-bg-primary cursor-pointer transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                          Seleccionar Archivo
                          <input
                            type="file"
                            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                            accept="image/jpeg,image/png,image/jpg,application/pdf,image/webp"
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-6 max-w-xs mx-auto">
                          Formatos soportados: JPG, PNG, PDF, WEBP (Máx. 10MB)
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="relative w-full max-w-sm bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden group-hover:shadow-xl transition-shadow">
                          {/* Preview Image/Icon */}
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
                            {preview ? (
                              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                              <DocumentTextIcon className="w-16 h-16 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate text-sm">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFile(null);
                                  setPreview(null);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar archivo"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full w-fit">
                              <CheckCircleIcon className="w-4 h-4" />
                              Listo para subir
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                          }}
                          className="mt-6 text-sm text-gray-500 hover:text-red-500 underline decoration-dotted underline-offset-4 transition-colors"
                        >
                          Cambiar archivo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-shake">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions - Fixed */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary flex-shrink-0">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 px-6 py-3.5 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="upload-form"
              disabled={!file || uploading}
              className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:shadow-none transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Subiendo Documento...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampsUploadModal;

