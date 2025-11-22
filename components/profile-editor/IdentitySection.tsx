import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { identitySchema, IdentityFormData } from '../../schemas/profileSchemas';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import CountrySelector from '../CountrySelector';

interface IdentitySectionProps {
  initialData?: Partial<IdentityFormData>;
  onSave: (data: IdentityFormData) => Promise<void>;
}

const IdentitySection: React.FC<IdentitySectionProps> = ({ initialData, onSave }) => {
  const translations = useTranslations();
  const t = translations.dashboard.identity;
  const { profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initialData?.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    getValues,
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues: initialData || {},
  });

  const watchedRemote = watch('remote');

  React.useEffect(() => {
    console.log('👤 IdentitySection mounted, profile:', profile);
  }, [profile]);

  // Auto-save form data to localStorage
  React.useEffect(() => {
    const subscription = watch((formData) => {
      try {
        localStorage.setItem('identity_draft', JSON.stringify({
          formData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error saving draft:', e);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Restore draft on mount
  React.useEffect(() => {
    try {
      const draft = localStorage.getItem('identity_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only restore if less than 24 hours old and different from initial data
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          const hasChanges = JSON.stringify(parsed.formData) !== JSON.stringify(initialData);
          if (hasChanges) {
            const shouldRestore = confirm(t.restoreDraft || '¿Restaurar borrador guardado?');
            if (shouldRestore && parsed.formData) {
              Object.keys(parsed.formData).forEach((key) => {
                if (parsed.formData[key] !== undefined) {
                  setValue(key as keyof IdentityFormData, parsed.formData[key], { shouldDirty: true });
                }
              });
            } else {
              localStorage.removeItem('identity_draft');
            }
          }
        } else {
          localStorage.removeItem('identity_draft');
        }
      }
    } catch (e) {
      console.error('Error restoring draft:', e);
    }
  }, []);

  const handleAvatarClick = () => {
    console.log('🖱️ handleAvatarClick called');
    console.log('📁 fileInputRef.current:', fileInputRef.current);
    if (fileInputRef.current) {
      console.log('✅ Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.error('❌ fileInputRef.current is null');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📂 handleFileChange called', e.target.files);
    const file = e.target.files?.[0];
    if (!file || !profile) {
      console.log('❌ No file selected or no profile:', { file, profile });
      return;
    }

    // Validar tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Tipo de archivo no válido. Usa JPG, PNG, GIF o WebP.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('Subiendo archivo:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error de Supabase:', uploadError);
        throw new Error(uploadError.message);
      }

      console.log('Archivo subido exitosamente:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-assets')
        .getPublicUrl(filePath);

      console.log('URL pública generada:', publicUrl);

      setAvatarPreview(publicUrl);
      setValue('avatar_url', publicUrl, { shouldDirty: true });
      setUploadError(null);

      // Guardar automáticamente en la base de datos
      console.log('💾 Guardando avatar en la base de datos...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error('❌ Error guardando avatar en BD:', updateError);
        setUploadError('Error al guardar la foto en tu perfil');
      } else {
        console.log('✅ Avatar guardado exitosamente en la base de datos');
      }
    } catch (error: any) {
      console.error('Error completo al subir avatar:', error);
      const errorMessage = error?.message || 'Error desconocido';
      setUploadError(`Error al subir la imagen: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: IdentityFormData) => {
    await onSave(data);
    // Clear draft on successful save
    localStorage.removeItem('identity_draft');
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Avatar Upload */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div
              onClick={handleAvatarClick}
              className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition-opacity border-2 border-gray-200 dark:border-gray-600"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="px-4 py-2 bg-cv-blue text-white rounded-md hover:bg-cv-blue-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? t.uploading : t.uploadPhoto}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t.photoHelper}</p>
            {uploadError && (
              <p className="text-xs text-red-500 mt-1">{uploadError}</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Name & Headline Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.fullNameRequired}
            </label>
            <input
              {...register('full_name')}
              type="text"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.headlineRequired}
            </label>
            <input
              {...register('headline')}
              type="text"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="Senior Software Engineer"
            />
            {errors.headline && (
              <p className="text-red-500 text-sm mt-1">{errors.headline.message}</p>
            )}
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            País
          </label>
          <CountrySelector
            value={watch('country_code')}
            onChange={(code) => setValue('country_code', code, { shouldDirty: true })}
            placeholder="Selecciona tu país"
            lang="es"
          />
        </div>

        {/* Location & Remote */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.location}
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="Madrid, Barcelona, Valencia..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ciudad o región específica
            </p>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                {...register('remote')}
                type="checkbox"
                className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.remoteWork}
              </span>
            </label>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.phone}
          </label>
          <input
            {...register('phone')}
            type="tel"
            onChange={(e) => {
              // Solo permitir números, espacios, guiones, paréntesis y el símbolo +
              const value = e.target.value.replace(/[^0-9+\s()-]/g, '');
              setValue('phone', value);
            }}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            placeholder="+1 (555) 123-4567"
            maxLength={20}
          />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.socialLinks}</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.linkedinUrl}
            </label>
            <input
              {...register('linkedin_url')}
              type="url"
              onBlur={(e) => {
                const value = e.target.value;
                if (value && !/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/.test(value)) {
                  alert(t.invalidLinkedin);
                  setValue('linkedin_url', '');
                }
              }}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="https://linkedin.com/in/username"
            />
            {errors.linkedin_url && (
              <p className="text-red-500 text-sm mt-1">{errors.linkedin_url.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.githubUrl}
            </label>
            <input
              {...register('github_url')}
              type="url"
              onBlur={(e) => {
                const value = e.target.value;
                if (value && !/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(value)) {
                  alert(t.invalidGithub);
                  setValue('github_url', '');
                }
              }}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="https://github.com/username"
            />
            {errors.github_url && (
              <p className="text-red-500 text-sm mt-1">{errors.github_url.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.portfolioUrl}
            </label>
            <input
              {...register('portfolio_url')}
              type="url"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="https://yourportfolio.com"
            />
            {errors.portfolio_url && (
              <p className="text-red-500 text-sm mt-1">{errors.portfolio_url.message}</p>
            )}
          </div>
        </div>

        {/* About / Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.aboutMe}
            </label>
            <button
              type="button"
              onClick={() => {
                // TODO: Implement AI generation
                alert('AI generation feature coming soon!');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cv-blue hover:text-cv-blue-dark bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Generate with AI
            </button>
          </div>
          <textarea
            {...register('summary')}
            rows={6}
            maxLength={500}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors"
            placeholder={t.aboutMePlaceholder}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recommended: 150-300 characters
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {watch('summary')?.length || 0} / 500 characters
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          {isDirty && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">{t.unsavedChanges}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={!isDirty}
            className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
          >
            {isDirty ? t.saveChanges : t.noChanges}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IdentitySection;
