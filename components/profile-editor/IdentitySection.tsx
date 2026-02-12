// @ts-nocheck
import React, { useState, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IdentityFormData } from '../../schemas/profileSchemas';
import { getProfileSchemas } from '../../schemas/getProfileSchemas';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToastContext } from '../../contexts/ToastContext';
import { generateSummary, optimizeHeadline } from '../../lib/ai';
import CountrySelector from '../shared/CountrySelector';
import PhotoPreviewModal, { CropData } from '../PhotoPreviewModal';

interface IdentitySectionProps {
  profile: any;
  onSave: (data: IdentityFormData) => Promise<void>;
  onNext?: () => void;
}

export interface WizardStepHandle {
  submit: () => Promise<boolean>;
}

const IdentitySection = forwardRef<WizardStepHandle, IdentitySectionProps>(({ profile: initialData, onSave, onNext }, ref) => {
  const translations = useTranslations();
  const { lang } = useLanguage();
  const t = translations.dashboard.identity;
  const { profile, session, refetchProfile } = useAuth();
  const toast = useToastContext();

  // Get schema with translated error messages
  const { identitySchema } = useMemo(() => getProfileSchemas(translations), [translations]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initialData?.avatar_url);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummaryVariants, setAiSummaryVariants] = useState<string[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiHeadlineVariants, setAiHeadlineVariants] = useState<string[]>([]);
  const [showHeadlineModal, setShowHeadlineModal] = useState(false);
  const [showRestoreDraftModal, setShowRestoreDraftModal] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(true);

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

  // Auto-save form data to localStorage ONLY if there are unsaved changes
  React.useEffect(() => {
    const subscription = watch((formData) => {
      // Solo guardar draft si hay cambios sin guardar (isDirty)
      if (!isDirty) return;

      try {
        localStorage.setItem('identity_draft', JSON.stringify({
          formData,
          timestamp: Date.now()
        }));
      } catch (e) {}
    });
    return () => subscription.unsubscribe();
  }, [watch, isDirty]);

  // Restore draft on mount
  React.useEffect(() => {
    try {
      const draft = localStorage.getItem('identity_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only restore if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          // Comparar solo los campos relevantes (ignorar campos que pueden ser null vs undefined)
          const draftData = parsed.formData;
          const currentData = initialData;

          // Función para normalizar valores (null, undefined, '' -> null)
          const normalize = (val: any) => {
            if (val === undefined || val === '' || val === null) return null;
            return val;
          };

          // Comparar campos importantes
          const hasRealChanges =
            normalize(draftData.full_name) !== normalize(currentData?.full_name) ||
            normalize(draftData.headline) !== normalize(currentData?.headline) ||
            normalize(draftData.summary) !== normalize(currentData?.summary) ||
            normalize(draftData.country_code) !== normalize(currentData?.country_code) ||
            normalize(draftData.linkedin_url) !== normalize(currentData?.linkedin_url) ||
            normalize(draftData.github_url) !== normalize(currentData?.github_url) ||
            normalize(draftData.portfolio_url) !== normalize(currentData?.portfolio_url) ||
            normalize(draftData.remote) !== normalize(currentData?.remote);

          if (hasRealChanges) {
            setDraftToRestore(parsed.formData);
            setShowRestoreDraftModal(true);
          } else {
            // Si no hay cambios reales, eliminar el draft
            localStorage.removeItem('identity_draft');
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) {
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

    setUploadError(null);

    // Crear URL temporal para previsualización
    const tempUrl = URL.createObjectURL(file);
    setPreviewImageUrl(tempUrl);
    setSelectedFile(file);
    setShowPhotoPreview(true);

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  };

  const handlePhotoConfirm = async (file: File, cropData: CropData) => {
    if (!profile) return;

    setIsUploading(true);
    setShowPhotoPreview(false);

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
        toast.error('Error al guardar la foto en tu perfil');
      } else {
        // ✅ Refrescar perfil en contexto para que la foto aparezca en toda la app
        await refetchProfile();
        // ✅ Mostrar feedback al usuario
        toast.success('Foto de perfil actualizada correctamente');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error desconocido';
      const fullError = `Error al subir la imagen: ${errorMessage}`;
      setUploadError(fullError);
      toast.error(fullError);
    } finally {
      setIsUploading(false);
      // Limpiar URL temporal
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
        setPreviewImageUrl(null);
      }
      setSelectedFile(null);
    }
  };

  const handlePhotoCancel = () => {
    setShowPhotoPreview(false);
    // Limpiar URL temporal
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
    setSelectedFile(null);
  };

  const handleGenerateSummary = React.useCallback(async () => {
    if (!session?.user?.id) {
      toast.error('Debes estar autenticado para usar esta función');
      return;
    }

    // Check if user has AI access
    const { checkAIAccess } = await import('../../lib/ai');
    const { hasAccess, plan } = await checkAIAccess(session.user.id);

    if (!hasAccess) {
      toast.error(`Las funcionalidades de IA están disponibles solo para usuarios Pro y Premium. Tu plan actual es: ${plan || 'Free'}. Actualiza tu plan para acceder a estas funciones.`);
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

  const handleOptimizeHeadline = React.useCallback(async () => {
    if (!session?.user?.id) {
      toast.error('Debes estar autenticado para usar esta función');
      return;
    }

    // Check if user has AI access
    const { checkAIAccess } = await import('../../lib/ai');
    const { hasAccess, plan } = await checkAIAccess(session.user.id);

    if (!hasAccess) {
      toast.error(`Las funcionalidades de IA están disponibles solo para usuarios Pro y Premium. Tu plan actual es: ${plan || 'Free'}. Actualiza tu plan para acceder a estas funciones.`);
      return;
    }

    const currentValues = getValues();
    const currentHeadline = currentValues.headline;

    if (!currentHeadline || currentHeadline.trim() === '') {
      toast.error('Primero escribe un headline profesional para optimizarlo');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await optimizeHeadline(currentHeadline, session.user.id);

      if (response.success && response.data) {
        setValue('headline', response.data, { shouldDirty: true });
        toast.success('Headline optimizado con IA');
      } else {
        toast.error(response.error || 'Error al optimizar el headline');
      }
    } catch (error) {
      toast.error('Error al optimizar el headline con IA');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [session, toast, getValues, setValue]);

  const handleSelectSummaryVariant = async (variant: string) => {
    setValue('summary', variant, { shouldDirty: true });
    setShowAIModal(false);
    setAiSummaryVariants([]);
    toast.success('Resumen aplicado.');

    // After selecting summary, automatically optimize headline
    const currentHeadline = getValues('headline');
    if (currentHeadline && currentHeadline.trim() !== '') {
      setIsGeneratingAI(true);
      try {
        const response = await optimizeHeadline(currentHeadline, session?.user?.id);

        if (response.success && response.data) {
          setAiHeadlineVariants(response.data);
          setShowHeadlineModal(true);
          setIsGeneratingAI(false);
        } else {
          toast.error(response.error || 'Error al optimizar el headline');
          setIsGeneratingAI(false);
        }
      } catch (error) {
        toast.error('Error al optimizar el headline con IA');
        setIsGeneratingAI(false);
      }
    }
  };

  const handleSelectHeadlineVariant = (variant: string) => {
    setValue('headline', variant, { shouldDirty: true });
    setShowHeadlineModal(false);
    setAiHeadlineVariants([]);
    toast.success('Headline optimizado. No olvides guardar los cambios.');
  };

  const handleRejectHeadline = () => {
    setShowHeadlineModal(false);
    setAiHeadlineVariants([]);
    toast.info('Headline original mantenido.');
  };

  // Combined AI optimization - only generates summary (NOT headline)
  // Headline optimization must be explicitly requested by user
  const handleOptimizeWithAI = React.useCallback(async () => {
    // Only generate summary, do NOT touch headline
    await handleGenerateSummary();
  }, [handleGenerateSummary]);

  const onSubmit = async (data: IdentityFormData) => {
    // Transform URLs to add https:// if missing, handle null/undefined values
    const transformUrl = (url: string | null | undefined) => {
      if (!url || url.trim() === '') return null;
      return url.startsWith('http') ? url : `https://${url}`;
    };

    const transformedData = {
      ...data,
      linkedin_url: transformUrl(data.linkedin_url),
      github_url: transformUrl(data.github_url),
      portfolio_url: transformUrl(data.portfolio_url),
    };

    try {
      // Only save if there are actual changes
      if (isDirty) {
        toast.info('Guardando cambios...');
        await onSave(transformedData);
        // Clear draft on successful save
        localStorage.removeItem('identity_draft');
        // Reset form to mark as clean (no unsaved changes)
        reset(transformedData);
        // Update toast to success
        toast.success('Cambios guardados correctamente');
      }

      // Advance to next section after save (or if no changes to save)
      if (onNext) {
        onNext();
      }
    } catch (error) {
      // If save fails, show error and don't advance
      toast.error('Error al guardar. Por favor, intenta de nuevo.');
      console.error('Error saving identity:', error);
    }
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

  // Listen for AI optimization trigger from floating button
  React.useEffect(() => {
    const handleGenerateAISummaryEvent = () => {
      handleOptimizeWithAI();
    };

    window.addEventListener('generateAISummary', handleGenerateAISummaryEvent);

    return () => {
      window.removeEventListener('generateAISummary', handleGenerateAISummaryEvent);
    };
  }, [handleOptimizeWithAI]);

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-4 sm:p-6">
      <form onSubmit={handleSubmit(onSubmit as any)} noValidate className="space-y-6">
        {/* Main Info Section */}
        <div className="space-y-5">
          {/* Avatar + Name + Headline Row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
              <div className="relative group">
                <div
                  onClick={handleAvatarClick}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm group-hover:border-cv-blue transition-colors"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                {t.changePhoto}
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
            <div className="flex-1 space-y-3 min-w-0 w-full">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t.fullNameRequired} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400">
                    {watch('full_name')?.length || 0}/50
                  </span>
                </div>
                <input
                  {...register('full_name')}
                  type="text"
                  maxLength={50}
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm ${
                    errors.full_name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t.fullNamePlaceholder}
                />
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t.headlineRequired} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400">
                    {watch('headline')?.length || 0}/150
                  </span>
                </div>
                <input
                  {...register('headline')}
                  type="text"
                  maxLength={150}
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm ${
                    errors.headline ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t.headlinePlaceholder}
                />
                {errors.headline && (
                  <p className="text-red-500 text-xs mt-1">{errors.headline.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Country + Gender + Remote Row */}
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4 items-start">
            {/* Country */}
            <div className="col-span-2 sm:col-span-5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.country} <span className="text-red-500">*</span>
              </label>
              <CountrySelector
                value={watch('country_code')}
                onChange={(code) => setValue('country_code', code, { shouldDirty: true })}
                placeholder={t.countryPlaceholder}
                lang={lang}
              />
              {errors.country_code && (
                <p className="text-red-500 text-xs mt-1">{errors.country_code.message}</p>
              )}
            </div>

            {/* Gender Selection */}
            <div className="col-span-1 sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'es' ? 'Género' : 'Gender'} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                <label className={`flex-1 flex items-center justify-center py-[9px] rounded-lg border cursor-pointer transition-all text-sm ${
                  watch('gender') === 'male'
                    ? 'border-cv-blue bg-cv-blue/10 text-cv-blue font-medium'
                    : 'border-gray-300 dark:border-gray-600 hover:border-cv-blue/50 text-gray-700 dark:text-gray-300'
                }`}>
                  <input
                    type="radio"
                    {...register('gender')}
                    value="male"
                    className="sr-only"
                  />
                  <span>M</span>
                </label>
                <label className={`flex-1 flex items-center justify-center py-[9px] rounded-lg border cursor-pointer transition-all text-sm ${
                  watch('gender') === 'female'
                    ? 'border-cv-blue bg-cv-blue/10 text-cv-blue font-medium'
                    : 'border-gray-300 dark:border-gray-600 hover:border-cv-blue/50 text-gray-700 dark:text-gray-300'
                }`}>
                  <input
                    type="radio"
                    {...register('gender')}
                    value="female"
                    className="sr-only"
                  />
                  <span>F</span>
                </label>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
              )}
            </div>

            {/* Remote Work */}
            <div className="col-span-1 sm:col-span-4 flex items-end h-full pb-1">
              <div className="flex items-center">
                <input
                  {...register('remote')}
                  type="checkbox"
                  id="remote-check"
                  className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
                />
                <label htmlFor="remote-check" className="ml-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap">
                  {t.remoteWork}
                </label>
              </div>
            </div>
          </div>

          {/* About / Summary */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                {t.aboutMe} <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">
                {watch('summary')?.length || 0}/500
              </span>
            </div>
            <textarea
              {...register('summary')}
              rows={4}
              maxLength={500}
              className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white resize-none text-sm ${
                errors.summary ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t.aboutMePlaceholder}
            />
            {errors.summary && (
              <p className="text-red-500 text-xs mt-1">{errors.summary.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information - Collapsible Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowContactInfo(!showContactInfo)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium text-gray-900 dark:text-white">
                {translations.profileEditor.identity.contactInfo}
              </span>
              <span className="text-xs text-gray-500">({lang === 'es' ? 'Opcional' : 'Optional'})</span>
            </div>
            <svg className={`w-5 h-5 text-gray-500 transition-transform ${showContactInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showContactInfo && (
            <div className="p-4 space-y-4 bg-white dark:bg-dark-bg-secondary">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.linkedinUrl}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </div>
                    <input
                      {...register('linkedin_url')}
                      type="url"
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
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
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <input
                      {...register('github_url')}
                      type="url"
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
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
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                      </svg>
                    </div>
                    <input
                      {...register('portfolio_url')}
                      type="url"
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:text-white text-sm"
                      placeholder="yourportfolio.com"
                    />
                  </div>
                  {errors.portfolio_url && (
                    <p className="text-red-500 text-xs mt-1">{errors.portfolio_url.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            {translations.common?.next || 'Next'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
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

      {/* Restore Draft Modal */}
      {showRestoreDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Borrador guardado
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tienes cambios sin guardar de una sesión anterior. ¿Deseas restaurarlos?
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem('identity_draft');
                    setShowRestoreDraftModal(false);
                    setDraftToRestore(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Descartar
                </button>
                <button
                  onClick={() => {
                    if (draftToRestore) {
                      Object.keys(draftToRestore).forEach((key) => {
                        if (draftToRestore[key] !== undefined) {
                          setValue(key as keyof IdentityFormData, draftToRestore[key], { shouldDirty: true });
                        }
                      });
                    }
                    setShowRestoreDraftModal(false);
                    setDraftToRestore(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-cv-blue hover:bg-cv-blue-dark text-white rounded-lg font-medium transition-colors"
                >
                  Restaurar
                </button>
              </div>
            </div>
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

      {/* Headline Optimization Modal */}
      {showHeadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Headline Optimizado
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                La IA ha optimizado tu headline profesional corrigiendo errores y mejorando su impacto.
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Original Headline */}
              <div className="border border-gray-200 dark:border-dark-border rounded-lg p-4 bg-gray-50 dark:bg-dark-bg-tertiary">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Original</span>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {getValues('headline')}
                </p>
              </div>

              {/* Optimized Headline Variants */}
              {aiHeadlineVariants.map((variant, index) => (
                <div
                  key={index}
                  className="border-2 border-cv-blue rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10 hover:border-purple-600 transition-colors cursor-pointer group"
                  onClick={() => handleSelectHeadlineVariant(variant)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-cv-blue uppercase">
                      Opción {index + 1} - Optimizado con IA
                    </span>
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium mb-3">
                    {variant}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectHeadlineVariant(variant);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-cv-blue group-hover:bg-purple-600 rounded-lg transition-colors"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary">
              <button
                onClick={handleRejectHeadline}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors"
              >
                Mantener Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {showPhotoPreview && previewImageUrl && selectedFile && (
        <PhotoPreviewModal
          imageUrl={previewImageUrl}
          originalFile={selectedFile}
          onConfirm={handlePhotoConfirm}
          onCancel={handlePhotoCancel}
        />
      )}
    </div>
  );
});

export default IdentitySection;

