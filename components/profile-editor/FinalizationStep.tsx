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
import { useToastContext } from '../../context/ToastContext';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

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
  const { width, height } = useWindowSize();

  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [customSlug, setCustomSlug] = useState('');
  const [isSlugValid, setIsSlugValid] = useState(true);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [hasGeneratedSlug, setHasGeneratedSlug] = useState(false);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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

  // Generate default slug from profile name and headline
  useEffect(() => {
    // ✅ Solo generar si no se ha generado antes
    if (hasGeneratedSlug) {
      console.log('⏭️ Slug ya generado, saltando');
      return;
    }

    console.log('🔄 Generando slug para:', profile?.full_name, profile?.headline);

    if (profile?.full_name && profile?.headline) {
      // ✅ Use EXACT same logic as DashboardContent for consistency
      const occupation = extractOccupation(profile.headline);
      console.log('📝 Ocupación extraída:', occupation);

      // Generate slug from full_name and short occupation
      const namePart = profile.full_name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const headlinePart = occupation
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const generatedSlug = headlinePart ? `${namePart}-${headlinePart}` : namePart;
      const finalSlug = generatedSlug.substring(0, 50);

      console.log('✅ Slug generado:', finalSlug);
      setCustomSlug(finalSlug);
      setHasGeneratedSlug(true);
    } else if (profile?.full_name) {
      // Fallback to just name if no headline
      const generatedSlug = profile.full_name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);

      console.log('✅ Slug generado (solo nombre):', generatedSlug);
      setCustomSlug(generatedSlug);
      setHasGeneratedSlug(true);
    } else {
      console.log('⚠️ No hay suficiente información para generar slug');
    }
  }, [profile?.full_name, profile?.headline, hasGeneratedSlug]);

  const templates = [
    {
      id: 'passport',
      name: 'Moderno',
      description: 'Diseño limpio y profesional con toques modernos',
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
      name: 'Clásico',
      description: 'Formato tradicional para empresas corporativas',
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
      name: 'Creativo',
      description: 'Ideal para diseñadores e industrias creativas',
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
    if (slug === currentSlug) {
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
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .substring(0, 50);
    setCustomSlug(sanitized);
  };

  const handleSlugBlur = () => {
    if (customSlug) {
      validateSlug(customSlug);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!session?.user?.id) return;

    // Validate slug
    if (!customSlug || customSlug.length < 3) {
      toast.error('La URL debe tener al menos 3 caracteres');
      return;
    }

    const isValid = await validateSlug(customSlug);
    if (!isValid) {
      toast.error('Esta URL ya está en uso. Por favor elige otra.');
      return;
    }

    setIsSaving(true);

    try {
      console.log('🔵 Guardando slug:', customSlug, 'para usuario:', session.user.id);

      const { error } = await supabase
        .from('profiles')
        .update({
          template: selectedTemplate,
          slug: customSlug,
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('❌ Error al guardar:', error);
        throw error;
      }

      console.log('✅ Slug guardado exitosamente');

      // ✅ Verificar que realmente se guardó en la BD
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('slug, template')
        .eq('id', session.user.id)
        .single();

      console.log('🔍 Verificando slug guardado:', verifyData);

      if (verifyError || !verifyData?.slug) {
        console.error('❌ El slug NO se guardó correctamente:', verifyError);
        throw new Error('El slug no se guardó en la base de datos');
      }

      // ✅ Refetch profile to update slug in context - wait for it to complete
      await refetchProfile();

      console.log('✅ Profile refetched');

      // ✅ CRITICAL: Mark wizard as just completed to prevent WelcomeModal from showing
      localStorage.setItem('wizard_just_completed', 'true');
      localStorage.setItem('wizard_completed_at', Date.now().toString());

      // ✅ Wait a bit for the profile to fully update in context
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('¡Perfil completado exitosamente!', { duration: 3000 });

      // ✅ Wait another moment before completing to ensure toast is visible
      await new Promise(resolve => setTimeout(resolve, 800));

      // ✅ Complete immediately - no setTimeout needed
      onComplete();
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
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
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
          ¡Felicidades!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Has completado tu perfil profesional
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Selecciona tu plantilla de CV
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Elige el diseño que mejor represente tu estilo profesional
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedTemplate === template.id
                  ? `border-${template.gradient.split(' ')[1].replace('to-', '')} bg-gradient-to-br ${template.bgGradient} ${template.darkBgGradient} shadow-lg`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary hover:border-gray-300 dark:hover:border-gray-600'
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

              {/* Template Preview Image */}
              <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={template.previewImage}
                  alt={`${template.name} template preview`}
                  className="w-full h-48 object-cover object-top"
                />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* URL Customization */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Personaliza tu URL
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esta será la dirección donde podrás compartir tu CV
        </p>

        <div className="flex items-center gap-2 bg-white dark:bg-dark-bg-secondary border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium whitespace-nowrap">
            {window.location.origin}/cv/
          </span>
          <input
            type="text"
            value={customSlug}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={handleSlugBlur}
            placeholder="tu-nombre-profesional"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white font-medium"
          />
          {isCheckingSlug && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {!isCheckingSlug && customSlug && (
            <div>
              {isSlugValid ? (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {!isSlugValid && customSlug && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Esta URL ya está en uso. Por favor elige otra.
          </p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
        </p>
      </div>

      {/* Preview URL */}
      {customSlug && isSlugValid && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Tu CV estará disponible en:
          </p>
          <a
            href={`/cv/${customSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
          >
            {window.location.origin}/cv/{customSlug}
          </a>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-border">
        <button
          onClick={handleSaveAndComplete}
          disabled={isSaving || !customSlug || !isSlugValid || isCheckingSlug}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center gap-3"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Ir al Dashboard
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FinalizationStep;
