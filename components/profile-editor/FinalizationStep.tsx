// @ts-nocheck
/**
 * Finalization Step Component
 *
 * Último paso del wizard que muestra:
 * - Selección de template (Modern/Classic/Creative)
 * - Personalización de URL
 * - Animación de celebración con confetti
 * - Botón para ir al Dashboard
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { useToastContext } from '../../contexts/ToastContext';
import { useTranslations } from '../../hooks/useTranslations';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { canChangeSlug, getNextSlugChangeDate } from '../../utils/slugValidation';
import { sanitizeSlug } from '../../utils/slugUtils';
import PassportTemplate from '../templates/PassportTemplate';
import ClassicTemplate from '../templates/ClassicTemplate';
import CreativeBoldTemplate from '../templates/CreativeBoldTemplate';

interface FinalizationStepProps {
  onComplete: () => void;
  currentTemplate?: string;
  currentSlug?: string;
}

const FinalizationStep: React.FC<FinalizationStepProps> = ({
  onComplete,
  currentTemplate = 'passport',
  currentSlug = '',
}) => {
  const { session, profile, refetchProfile } = useAuth();
  const toast = useToastContext();
  const translations = useTranslations();
  const { width, height } = useWindowSize();

  // Use profile.slug if available, otherwise use the prop
  const existingSlug = profile?.slug || currentSlug;
  const existingTemplate = profile?.template || currentTemplate;

  const [selectedTemplate, setSelectedTemplate] = useState(existingTemplate);
  const [customSlug, setCustomSlug] = useState(existingSlug || '');
  const [isSlugValid, setIsSlugValid] = useState(true);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [hasGeneratedSlug, setHasGeneratedSlug] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Check if user can change slug (90-day restriction)
  // For users with existing slug but no last_changed_at, assume they just created it (90 days restriction applies)
  const effectiveLastChangedAt = profile?.last_slug_changed_at || (existingSlug ? new Date().toISOString() : null);
  const { canChange: canChangeSlugNow, daysRemaining } = canChangeSlug(effectiveLastChangedAt);
  const nextChangeDate = getNextSlugChangeDate(effectiveLastChangedAt);
  const isEditingExistingSlug = Boolean(existingSlug && existingSlug.length > 0);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Hide confetti when preview modal opens
  useEffect(() => {
    if (previewTemplate) {
      setShowConfetti(false);
    }
  }, [previewTemplate]);

  // Load profile data for preview
  useEffect(() => {
    const loadProfileData = async () => {
      if (!session?.user.id || !profile) return;

      try {
        const [
          { data: expData },
          { data: eduData },
          { data: skillsData },
          { data: portfolioData },
        ] = await Promise.all([
          supabase.from('experiences').select('*').eq('profile_id', session.user.id).order('start_date', { ascending: false }),
          supabase.from('education').select('*').eq('profile_id', session.user.id).order('start_date', { ascending: false }),
          supabase.from('skills').select('*').eq('profile_id', session.user.id),
          supabase.from('portfolio_items').select('*').eq('profile_id', session.user.id),
        ]);

        setProfileData({
          profile: profile,
          experiences: expData || [],
          education: eduData || [],
          skills: skillsData || [],
          certifications: [],
          languages: [],
          services: [],
          stats: [],
          portfolioItems: portfolioData || [],
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [session, profile]);

  // Extract short occupation from headline (e.g., "desarrollador-full-stack" from long description)
  const extractOccupation = (headline: string): string => {
    if (!headline) return '';

    // Common patterns to extract occupation
    const occupationPatterns = [
      /^([^,.]+)/i, // Everything before first comma or period
    ];

    for (const pattern of occupationPatterns) {
      const match = headline.match(pattern);
      if (match) {
        let occupation = match[1].trim();

        // Limit to first 3-4 words max
        const words = occupation.split(/\s+/);
        if (words.length > 4) {
          occupation = words.slice(0, 4).join(' ');
        }

        return occupation;
      }
    }

    // Fallback: use first 30 characters
    return headline.substring(0, 30);
  };

  // ❌ REMOVED: Auto-generation of slug - slug should only be created when user explicitly configures it
  // in Display Settings, not automatically during wizard completion
  // useEffect(() => {
  //   ... auto-generation code removed ...
  // }, []);

  const templates = [
    {
      id: 'passport',
      name: translations.profileEditor.finalization.templates.modern.name,
      description: translations.profileEditor.finalization.templates.modern.description,
      previewImage: '/images/templates/passport.png',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      darkBgGradient: 'dark:from-blue-900/20 dark:to-cyan-900/20',
    },
    {
      id: 'classic',
      name: translations.profileEditor.finalization.templates.classic.name,
      description: translations.profileEditor.finalization.templates.classic.description,
      previewImage: '/images/templates/classic.png',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: 'from-gray-600 to-gray-800',
      bgGradient: 'from-gray-50 to-slate-50',
      darkBgGradient: 'dark:from-gray-900/20 dark:to-slate-900/20',
    },
    {
      id: 'creative',
      name: translations.profileEditor.finalization.templates.creative.name,
      description: translations.profileEditor.finalization.templates.creative.description,
      previewImage: '/images/templates/creative-bold.png',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      darkBgGradient: 'dark:from-purple-900/20 dark:to-pink-900/20',
    },
  ];

  const validateSlug = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setIsSlugValid(false);
      return false;
    }

    // Check if slug matches current user's slug
    if (slug === existingSlug) {
      setIsSlugValid(true);
      return true;
    }

    setIsCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found - slug is available
        setIsSlugValid(true);
        return true;
      }

      // Slug already exists
      setIsSlugValid(false);
      return false;
    } catch (err) {
      setIsSlugValid(false);
      return false;
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Use centralized sanitization utility
    const sanitized = sanitizeSlug(value, 50);
    setCustomSlug(sanitized);
  };

  const handleSlugBlur = () => {
    if (customSlug) {
      validateSlug(customSlug);
    }
  };

  const getTemplateComponent = (templateId: string) => {
    if (!profileData) return null;

    switch (templateId) {
      case 'passport':
        return <PassportTemplate data={profileData} />;
      case 'classic':
        return <ClassicTemplate data={profileData} />;
      case 'creative':
        return <CreativeBoldTemplate data={profileData} />;
      default:
        return <PassportTemplate data={profileData} />;
    }
  };

  // Get theme-appropriate preview image
  const getTemplatePreviewImage = (templateId: string) => {
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains('dark');
    const theme = isDark ? 'dark' : 'light';

    // Try to load theme-specific image, fallback to default
    return `/images/templates/${templateId}-${theme}.png`;
  };

  const handleSaveAndComplete = async (redirectToCV = false) => {
    if (!session?.user?.id) return;

    // ✅ VALIDACIÓN COMPLETA DEL PERFIL ANTES DE FINALIZAR
    const validationErrors: string[] = [];

    // Validar Identidad
    if (!profile?.full_name) validationErrors.push('• Nombre completo (Identidad)');
    if (!profile?.email) validationErrors.push('• Email (Identidad)');
    if (!profile?.headline) validationErrors.push('• Título profesional (Identidad)');
    if (!profile?.summary) validationErrors.push('• Resumen profesional (Identidad)');
    if (!profile?.avatar_url) validationErrors.push('• Foto de perfil (Identidad)');

    // ⚠️ CRITICAL FIX: Query database directly for fresh counts instead of using stale profile context
    // Validar Experiencia - Query database for actual count
    const { count: experienceCount, error: expError } = await supabase
      .from('experiences')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', session.user.id);

    if (expError) {
      console.error('Error fetching experience count:', expError);
    }

    if (!experienceCount || experienceCount === 0) {
      validationErrors.push('• Al menos 1 experiencia laboral (Experiencia)');
    }

    // Validar Habilidades - Query database for actual count
    const { count: skillsCount, error: skillsError } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', session.user.id);

    if (skillsError) {
      console.error('Error fetching skills count:', skillsError);
    }

    if (!skillsCount || skillsCount < 3) {
      validationErrors.push(`• Al menos 3 habilidades - tienes ${skillsCount || 0} (Habilidades)`);
    }

    // Validar Preferencias
    if (!profile?.job_seeking_status) {
      validationErrors.push('• Estado de búsqueda de empleo (Preferencias)');
    }

    // Si hay errores de validación, mostrarlos con toast MUY VISIBLE
    if (validationErrors.length > 0) {
      const errorMessage = `⚠️ PERFIL INCOMPLETO\n\nPara finalizar tu CV, completa lo siguiente:\n\n${validationErrors.join('\n')}\n\n👆 Usa los iconos arriba para navegar a cada sección`;

      toast.error(errorMessage);

      // Scroll to top para que vea los pasos del wizard
      window.scrollTo({ top: 0, behavior: 'smooth' });

      return;
    }

    // ✅ Validate slug before saving
    if (!customSlug || customSlug.length < 3) {
      toast.error(translations.profileEditor.finalization.errors.urlTooShort);
      return;
    }

    const isValid = await validateSlug(customSlug);
    if (!isValid) {
      toast.error(translations.profileEditor.finalization.errors.urlAlreadyInUse);
      return;
    }

    setIsSaving(true);

    try {
      // ✅ Save template AND slug AND mark wizard as completed
      // This is where users create their URL for the first time and complete the onboarding wizard
      const { error } = await supabase
        .from('profiles')
        .update({
          template: selectedTemplate,
          slug: customSlug,
          last_slug_changed_at: new Date().toISOString(),
          wizard_completed: true, // ✅ Mark wizard as completed in database
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('❌ Error al guardar:', error);
        throw error;
      }

      // ✅ Verificar que realmente se guardó en la BD
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('template, slug')
        .eq('id', session.user.id)
        .single();

      if (verifyError || !verifyData?.template || !verifyData?.slug) {
        console.error('❌ El template o slug NO se guardó correctamente:', verifyError);
        throw new Error('El template y slug no se guardaron en la base de datos');
      }

      // ✅ Show success message for slug/template save
      toast.success(translations.profileEditor?.finalization?.templateSaved || 'Template y URL configurados');

      // ✅ If user clicked on CV URL, open CV in new tab instead of completing wizard
      if (redirectToCV) {
        window.open(`/cv/${customSlug}`, '_blank', 'noopener,noreferrer');
        // Keep the wizard open so user can see the success message
      } else {
        // ✅ Complete wizard - let DashboardContent handle the final refetch and navigation
        // DashboardContent will refetch profile and show the final success toast
        onComplete();
      }
    } catch (error) {
      console.error('❌ Error saving finalization:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Confetti Animation */}
      {showConfetti && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 40, pointerEvents: 'none' }}>
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        </div>
      )}

      {/* Celebration Header */}
      <div className="text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {translations.profileEditor.finalization.congratulations}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {translations.profileEditor.finalization.completedProfile}
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {translations.profileEditor.finalization.selectTemplate}
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {translations.profileEditor.finalization.chooseDesign}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                selectedTemplate === template.id
                  ? `border-${template.gradient.split(' ')[1].replace('to-', '')} bg-gradient-to-br ${template.bgGradient} ${template.darkBgGradient} shadow-lg`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary'
              }`}
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Template Preview - Theme-aware Image */}
              <div className="mb-4 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-inner relative group cursor-pointer"
                   onClick={() => setPreviewTemplate(template.id)}>
                <img
                  src={getTemplatePreviewImage(template.id)}
                  alt={`${template.name} template preview`}
                  className="w-full h-48 object-cover object-top"
                  onError={(e) => {
                    // Fallback to default image if theme-specific not found
                    const target = e.target as HTMLImageElement;
                    if (!target.src.endsWith(template.previewImage)) {
                      target.src = template.previewImage;
                    }
                  }}
                />
                {/* Hover Overlay for Preview */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                    <svg className="w-10 h-10 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-xs font-semibold">Vista Previa</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>

              {/* Select Button */}
              <button
                onClick={() => setSelectedTemplate(template.id)}
                disabled={selectedTemplate === template.id}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedTemplate === template.id
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-cv-blue hover:bg-opacity-90 text-white'
                }`}
              >
                {selectedTemplate === template.id ? 'Seleccionada' : 'Seleccionar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-border">
        <button
          onClick={handleSaveAndComplete}
          disabled={isSaving}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center gap-3"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {translations.profileEditor.finalization.saving}
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              {translations.profileEditor.finalization.completeProfile}
            </>
          )}
        </button>
      </div>

      {/* Full Preview Modal */}
      {previewTemplate && profileData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative bg-white dark:bg-dark-bg-secondary rounded-xl max-w-5xl w-full max-h-[90vh] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between rounded-t-xl z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Vista Previa: {templates.find(t => t.id === previewTemplate)?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vista previa completa de tu CV
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-4 py-2 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
                >
                  Usar esta plantilla
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable Preview */}
            <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-8 rounded-b-xl">
              <div className="max-w-4xl mx-auto bg-white shadow-xl">
                {getTemplateComponent(previewTemplate)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalizationStep;
