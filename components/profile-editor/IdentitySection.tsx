import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { identitySchema, IdentityFormData } from '../../schemas/profileSchemas';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../context/ToastContext';
import { generateSummary } from '../../lib/ai';
import CountrySelector from '../CountrySelector';

interface IdentitySectionProps {
  profile: any;
  onSave: (data: IdentityFormData) => Promise<void>;
}

export interface WizardStepHandle {
  submit: () => Promise<boolean>;
}

const IdentitySection = forwardRef<WizardStepHandle, IdentitySectionProps>(({ profile: initialData, onSave }, ref) => {
  const translations = useTranslations();
  const t = translations.dashboard.identity;
  const { profile, session } = useAuth();
  const toast = useToastContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initialData?.avatar_url);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummaryVariants, setAiSummaryVariants] = useState<string[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    getValues,
    trigger,
    reset,
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues: initialData || {},
  });

  const watchedRemote = watch('remote');

  React.useEffect(() => {}, [profile]);

  // Auto-save form data to localStorage
  React.useEffect(() => {
    const subscription = watch((formData) => {
      try {
        localStorage.setItem('identity_draft', JSON.stringify({
          formData,
          timestamp: Date.now()
        }));
      } catch (e) {}
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
    } catch (e) {}
  }, []);

  const handleAvatarClick = () => {if (fileInputRef.current) {fileInputRef.current.click();
    } else {}
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {const file = e.target.files?.[0];
    if (!file || !profile) {return;
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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-assets')
        .getPublicUrl(filePath);

      setAvatarPreview(publicUrl);
      // ✅ NO marcar como dirty ya que se guarda automáticamente
      setValue('avatar_url', publicUrl, { shouldDirty: false });
      setUploadError(null);

      // Guardar automáticamente en la base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        setUploadError('Error al guardar la foto en tu perfil');
      } else {
        // ✅ Mostrar feedback al usuario
        toast.success('Foto de perfil actualizada');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error desconocido';
      setUploadError(`Error al subir la imagen: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSummary = React.useCallback(async () => {
    if (!session?.user?.id) {
      toast.error('Debes estar autenticado para usar esta función');
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Fetch user's experiences and skills from database
      const [{ data: experiencesData }, { data: skillsData }] = await Promise.all([
        supabase
          .from('experiences')
          .select('position, company_name, description')
          .eq('profile_id', session.user.id)
          .limit(3),
        supabase
          .from('skills')
          .select('name')
          .eq('profile_id', session.user.id)
          .limit(10),
      ]);

      const experiences = experiencesData?.map(exp => `${exp.position} en ${exp.company_name}`) || [];
      const skills = skillsData?.map(skill => skill.name) || [];

      if (experiences.length === 0 && skills.length === 0) {
        toast.error('Agrega primero experiencias y habilidades para generar un resumen profesional');
        return;
      }

      // Get current headline as objective
      const currentValues = getValues();
      const objective = currentValues.headline || undefined;

      const response = await generateSummary(
        experiences,
        skills,
        objective,
        'formal',
        3,
        session.user.id
      );

      if (response.success && response.data) {
        setAiSummaryVariants(response.data);
        setShowAIModal(true);
      } else {
        toast.error(response.error || 'Error al generar el resumen');
      }
    } catch (error) {toast.error('Error al generar el resumen con IA');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [session, toast, getValues]);

  const handleSelectSummaryVariant = (variant: string) => {
    setValue('summary', variant, { shouldDirty: true });
    setShowAIModal(false);
    setAiSummaryVariants([]);
    toast.success('Resumen aplicado. No olvides guardar los cambios.');
  };

  const onSubmit = async (data: IdentityFormData) => {
    // Transform URLs to add https:// if missing
    const transformedData = {
      ...data,
      linkedin_url: data.linkedin_url && data.linkedin_url.length > 0 && !data.linkedin_url.startsWith('http') 
        ? `https://${data.linkedin_url}` 
        : data.linkedin_url,
      github_url: data.github_url && data.github_url.length > 0 && !data.github_url.startsWith('http')
        ? `https://${data.github_url}`
        : data.github_url,
      portfolio_url: data.portfolio_url && data.portfolio_url.length > 0 && !data.portfolio_url.startsWith('http')
        ? `https://${data.portfolio_url}`
        : data.portfolio_url,
    };
    
    await onSave(transformedData);
    // Clear draft on successful save
    localStorage.removeItem('identity_draft');
    // Reset form to mark as clean (no unsaved changes)
    reset(data);
  };

  useImperativeHandle(ref, () => ({
    submit: async () => {
      const isValid = await trigger();
      if (isValid) {
        await handleSubmit(onSubmit as any)();
        return true;
      }
      return false;
    }
  }));

  // Listen for AI summary generation trigger from floating button
  React.useEffect(() => {
    const handleGenerateAISummaryEvent = () => {
      handleGenerateSummary();
    };

    window.addEventListener('generateAISummary', handleGenerateAISummaryEvent);

    return () => {
      window.removeEventListener('generateAISummary', handleGenerateAISummaryEvent);
    };
  }, [handleGenerateSummary]);

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h2>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Professional Information */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Información Profesional
            </h3>

            {/* Avatar + Main Info Group */}
            <div className="flex gap-5 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="relative group">
                  <div
                    onClick={handleAvatarClick}
                    className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm group-hover:border-cv-blue transition-colors"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="text-xs text-cv-blue hover:text-cv-blue-dark font-medium"
                >
                  Cambiar
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Name & Headline Inputs */}
              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.fullNameRequired}
                  </label>
                  <input
                    {...register('full_name')}
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.headlineRequired}
                  </label>
                  <input
                    {...register('headline')}
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                    placeholder="Senior Software Engineer"
                  />
                  {errors.headline && (
                    <p className="text-red-500 text-xs mt-1">{errors.headline.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Country & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  País
                </label>
                <CountrySelector
                  value={watch('country_code')}
                  onChange={(code) => setValue('country_code', code, { shouldDirty: true })}
                  placeholder="País"
                  lang="es"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.location}
                </label>
                <input
                  {...register('location')}
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                  placeholder="Ciudad"
                />
              </div>
            </div>
            
            <div className="flex items-center pt-1">
              <input
                {...register('remote')}
                type="checkbox"
                id="remote-check"
                className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
              />
              <label htmlFor="remote-check" className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                {t.remoteWork}
              </label>
            </div>

            {/* About / Summary */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t.aboutMe}
                </label>
                <span className="text-xs text-gray-400">
                  {watch('summary')?.length || 0}/500
                </span>
              </div>
              <textarea
                {...register('summary')}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white resize-none text-sm"
                placeholder={t.aboutMePlaceholder}
              />
            </div>
          </div>

          {/* Right Column: Contact Information */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Información de Contacto
            </h3>

            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.phone}
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9+\s()-]/g, '');
                    setValue('phone', value);
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                  placeholder="+1 (555) 123-4567"
                  maxLength={20}
                />
              </div>

              {/* Social Links Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.linkedinUrl}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </div>
                    <input
                      {...register('linkedin_url')}
                      type="url"
                      className="w-full pl-12 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                      placeholder="linkedin.com/in/user"
                    />
                  </div>
                  {errors.linkedin_url && (
                    <p className="text-red-500 text-xs mt-1">{errors.linkedin_url.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.githubUrl}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <input
                      {...register('github_url')}
                      type="url"
                      className="w-full pl-12 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                      placeholder="github.com/user"
                    />
                  </div>
                  {errors.github_url && (
                    <p className="text-red-500 text-xs mt-1">{errors.github_url.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.portfolioUrl}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                      </svg>
                    </div>
                    <input
                      {...register('portfolio_url')}
                      type="url"
                      className="w-full pl-12 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                      placeholder="yourportfolio.com"
                    />
                  </div>
                  {errors.portfolio_url && (
                    <p className="text-red-500 text-xs mt-1">{errors.portfolio_url.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
          {isDirty && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-medium">{t.unsavedChanges}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={!isDirty}
            className="px-5 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm ml-auto"
          >
            {isDirty ? t.saveChanges : t.noChanges}
          </button>
        </div>
      </form>

      {/* Loading Modal */}
      {isGeneratingAI && !showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Cargando las opciones...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
              La IA está generando tu resumen profesional basado en tu experiencia y habilidades
            </p>
          </div>
        </div>
      )}

      {/* AI Summary Variants Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Selecciona un resumen profesional
                </h3>
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiSummaryVariants([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                La IA ha generado {aiSummaryVariants.length} versiones de resumen profesional basadas en tu experiencia y habilidades.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {aiSummaryVariants.map((variant, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:border-cv-blue dark:hover:border-cv-blue transition-colors cursor-pointer"
                  onClick={() => handleSelectSummaryVariant(variant)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-cv-blue">Opción {index + 1}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSummaryVariant(variant);
                      }}
                      className="px-3 py-1 text-xs font-medium text-white bg-cv-blue hover:bg-cv-blue-dark rounded transition-colors"
                    >
                      Seleccionar
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {variant}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary">
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setAiSummaryVariants([]);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default IdentitySection;

