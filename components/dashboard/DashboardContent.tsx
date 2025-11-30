import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { getAnalyticsStats } from '../../hooks/useAnalytics';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToastContext } from '../../context/ToastContext';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import ModernDashboardView from './ModernDashboardView';
import { ErrorBoundary } from '../ErrorBoundary';
import { CVVersionsSection } from './CVVersionsSection';
import Modal from '../ui/Modal';
import { generateCVPDF } from '../../utils/pdfGenerator';

// Lazy load heavy components for better performance

const TemplateSelector = lazy(() => import('../profile-editor/TemplateSelector'));
const OnboardingWizard = lazy(() => import('../OnboardingWizard'));
const AIQuestionnaireAssistant = lazy(() => import('../AIQuestionnaireAssistant'));

const ProfileWizard = lazy(() => import('../profile-editor/ProfileWizard')); // New Wizard Component
const VisasSection = lazy(() => import('./VisasSection'));
const BlogManagementSection = lazy(() => import('../BlogManagementSection'));
const InteractiveAnalyticsPanel = lazy(() => import('./InteractiveAnalyticsPanel'));
const BusinessCardPreview = lazy(() => import('./BusinessCardPreview'));
const BusinessCardGallery = lazy(() => import('./BusinessCardGallery'));
const LeadsInbox = lazy(() => import('./LeadsInboxModern'));
const DisplaySettingsSection = lazy(() => import('../profile-editor/DisplaySettingsSection'));

const MessagingView = lazy(() => import('./MessagingView'));
const EnhancedMessaging = lazy(() => import('./EnhancedMessaging'));
const StampsSection = lazy(() => import('./StampsSection'));
const ATSExportModal = lazy(() => import('../ats-export/ATSExportModal'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const SuccessStorySubmission = lazy(() => import('./SuccessStorySubmission'));
import {
  IdentityFormData,
  ExperienceFormData,
  EducationFormData,
  SkillFormData,
  LanguageFormData,
  PortfolioItemFormData,
  PreferencesFormData,
} from '../../schemas/profileSchemas';

interface DashboardContentProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSaveStatusChange?: (message: string, timestamp?: string) => void;
}

interface DashboardStats {
  visits: number;
  ctaClicks: number;
  profileCompleteness: number;
  verifiedStamps: number;
  experienceCount: number;
  skillsCount: number;
  educationCount: number;
  languagesCount: number;
  portfolioCount: number;
}

type ProfileSectionKey = 'identity' | 'experience' | 'education' | 'skills' | 'languages' | 'portfolio' | 'preferences' | 'template' | 'stamps' | 'ai-assistant';

// Loading component for Suspense
const SectionLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando...</p>
    </div>
  </div>
);

const DashboardContent: React.FC<DashboardContentProps> = ({ activeSection, onSectionChange, onSaveStatusChange }) => {
  const { profile, session, refetchProfile } = useAuth();
  const translations = useTranslations();
  const { lang } = useLanguage();
  const toast = useToastContext();
  const t = translations.dashboard;
  const [stats, setStats] = useState<DashboardStats>({
    visits: 0,
    ctaClicks: 0,
    profileCompleteness: 0,
    verifiedStamps: 0,
    experienceCount: 0,
    skillsCount: 0,
    educationCount: 0,
    languagesCount: 0,
    portfolioCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando dashboard');
  const dashboardDataLoadedRef = useRef(false);

  const [showCardGallery, setShowCardGallery] = useState(false);
  const [showATSExportModal, setShowATSExportModal] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [stamps, setStamps] = useState<any[]>([]);

  // Check if AI is available
  // @ts-ignore
  const isAIAvailable = Boolean(import.meta.env?.VITE_GOOGLE_AI_API_KEY);

  // Check if AI is available


  // Profile editor states

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [experiences, setExperiences] = useState<ExperienceFormData[]>([]);
  const [education, setEducation] = useState<EducationFormData[]>([]);
  const [skills, setSkills] = useState<SkillFormData[]>([]);
  const [languages, setLanguages] = useState<LanguageFormData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItemFormData[]>([]);
  const [visas, setVisas] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);

  // Mock data for charts (replace with real data from analytics)
  // Real analytics data from database
  const [visitsData, setVisitsData] = useState<{ name: string; visits: number }[]>([]);
  const [countriesData, setCountriesData] = useState<{ country: string; visits: number; flag: string }[]>([]);
  const [trafficSourcesData, setTrafficSourcesData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [urlKey, setUrlKey] = useState(0); // Force re-render on URL change

  // ✅ Track user ID to prevent unnecessary re-renders when session object changes
  const currentUserIdRef = useRef<string | null>(null);

  // ✅ Mensajes de carga progresivos
  useEffect(() => {
    if (!loading) return;

    const messages = [
      'Cargando dashboard',
      'Obteniendo información',
      'Procesando datos',
      'Finalizando'
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex]);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  // ✅ SOLUCIÓN MEJORADA: Solo ejecutar cuando el user.id REALMENTE cambia
  useEffect(() => {
    const userId = session?.user.id || null;

    // Solo ejecutar si el user.id es diferente al anterior
    if (userId && userId !== currentUserIdRef.current) {currentUserIdRef.current = userId;
      loadDashboardData();
      checkAndUpdateSlug();
    } else if (!userId && currentUserIdRef.current) {
      // Usuario se deslogueócurrentUserIdRef.current = null;
      dashboardDataLoadedRef.current = false;
    }
  }, [session?.user.id]); // Dependencia necesaria para detectar cambios

  // ✅ SOLUCIÓN: Cargar datos del perfil solo cuando se necesite
  useEffect(() => {
    if (activeSection.includes('mi-perfil') && session?.user.id) {
      loadProfileEditorData();
    }
  }, [activeSection, session?.user.id]); // Separar en dos useEffect

  // ✅ CRITICAL FIX: Recalculate completeness when profile loads
  // This fixes the race condition where stats are loaded before profile
  useEffect(() => {
    if (!profile) return;

    import('../../utils/profileValidation').then(({ calculateProfileCompleteness }) => {
      const completeness = calculateProfileCompleteness(profile, {
        experiences: stats.experienceCount,
        education: stats.educationCount,
        skills: stats.skillsCount,
        languages: stats.languagesCount,
        portfolio: stats.portfolioCount,
      });

      setStats(prev => {
        if (prev.profileCompleteness === completeness) return prev;
        return { ...prev, profileCompleteness: completeness };
      });
    });
  }, [
    profile,
    profile?.template, // ✅ Detectar cambios en template
    profile?.slug, // ✅ Detectar cambios en slug
    stats.experienceCount,
    stats.educationCount,
    stats.skillsCount,
    stats.languagesCount,
    stats.portfolioCount
  ]);

  // Listen for URL changes (for messaging navigation)
  useEffect(() => {
    const handlePopState = () => {
      setUrlKey(prev => prev + 1);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check and update slug if needed - solo una vez
  const slugCheckedRef = useRef(false);

  const checkAndUpdateSlug = async () => {
    if (!session?.user.id || !profile) return;

    // ✅ PREVENIR ejecuciones múltiples
    if (slugCheckedRef.current) {return;
    }

    slugCheckedRef.current = true; // ✅ Marcar INMEDIATAMENTE antes de hacer queries

    try {// Check if slug needs to be updated
      const shouldRegenerateSlug = !profile.slug ||
                                   profile.slug.match(/-\d{6}$/) || // Has timestamp suffix
                                   profile.slug === profile.id || // Is UUID
                                   profile.slug.startsWith('user-'); // Is generic user-id format

      if (shouldRegenerateSlug && profile.full_name && profile.headline) {
        // Generate slug from full_name and headline
        const namePart = profile.full_name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        const headlinePart = profile.headline
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 30)
          .trim();

        let generatedSlug = headlinePart ? `${namePart}-${headlinePart}` : namePart;// Check if slug already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', generatedSlug)
          .maybeSingle();

        // If slug exists, add a number suffix
        if (existingProfile && existingProfile.id !== session.user.id) {
          let counter = 1;
          let uniqueSlug = `${generatedSlug}-${counter}`;

          while (true) {
            const { data: checkProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('slug', uniqueSlug)
              .maybeSingle();

            if (!checkProfile) {
              generatedSlug = uniqueSlug;
              break;
            }
            counter++;
            uniqueSlug = `${generatedSlug}-${counter}`;
          }
        }

        // Update the slug
        const { error } = await supabase
          .from('profiles')
          .update({ slug: generatedSlug, updated_at: new Date().toISOString() })
          .eq('id', session.user.id);

        if (error) {
          toast.error('Error al actualizar el slug del perfil');
          slugCheckedRef.current = false; // ✅ Permitir reintentar si falla
        } else {
          // NO recargar la página, ya marcado como completado
        }
      } else {}
    } catch (error) {
      // Silent fail - will retry on next load
      slugCheckedRef.current = false; // ✅ Permitir reintentar si falla
    }
  };



  const loadProfileEditorData = async () => {
    if (!session?.user.id) return;

    try {
      const [
        { data: expData },
        { data: eduData },
        { data: skillsData },
        { data: portfolioData },
        { data: languagesData },
        { data: visasData },
        { data: certificationsData },
      ] = await Promise.all([
        supabase.from('experiences').select('*').eq('profile_id', session.user.id).order('start_date', { ascending: false }),
        supabase.from('education').select('*').eq('profile_id', session.user.id).order('start_date', { ascending: false }),
        supabase.from('skills').select('*').eq('profile_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('portfolio_items').select('*').eq('profile_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('languages').select('*').eq('profile_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('visas').select('*').eq('profile_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('certifications').select('*').eq('profile_id', session.user.id).order('created_at', { ascending: false }),
      ]);setExperiences(expData || []);
      setEducation(eduData || []);
      setSkills(skillsData || []);
      setPortfolio(portfolioData || []);
      // Map is_native to isNative for languages
      setLanguages((languagesData || []).map((lang: any) => ({
        ...lang,
        isNative: lang.is_native || false,
      })));
      setVisas(visasData || []);
      setCertifications(certificationsData || []);
    } catch (error) {
      toast.error('Error al cargar datos del perfil');
    }
  };

  const loadDashboardData = async () => {
    if (!session?.user.id) return;

    // ✅ PREVENIR múltiples ejecuciones
    if (dashboardDataLoadedRef.current) {
      return;
    }

    dashboardDataLoadedRef.current = true; // Marcar como cargado INMEDIATAMENTE

    try {
      
      // 🚀 OPTIMIZACIÓN: Cargar TODO de una vez con Promise.allSettled
      const results = await Promise.allSettled([
        // Counts con limit(1) - MUY rápido
        supabase
          .from('experiences')
          .select('id', { count: 'exact' })
          .eq('profile_id', session.user.id)
          .limit(1),

        supabase
          .from('skills')
          .select('id', { count: 'exact' })
          .eq('profile_id', session.user.id)
          .limit(1),

        supabase
          .from('education')
          .select('id', { count: 'exact' })
          .eq('profile_id', session.user.id)
          .limit(1),

        supabase
          .from('stamps')
          .select('id', { count: 'exact' })
          .eq('profile_id', session.user.id)
          .eq('status', 'verified')
          .limit(1),

        // Datos mínimos
        supabase
          .from('stamps')
          .select('id, type, status')
          .eq('profile_id', session.user.id)
          .eq('status', 'verified')
          .limit(3),

        supabase
          .from('leads')
          .select('id, created_at')
          .eq('profile_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(2),

        // Analytics (puede fallar sin bloqueartodo)
        getAnalyticsStats(session.user.id),

        // Additional counts needed for completeness
        supabase
          .from('languages')
          .select('id', { count: 'exact' })
          .eq('profile_id', session.user.id)
          .limit(1),

        supabase
          .from('portfolio_items')
          .select('id', { count: 'exact' })
          .eq('profile_id', session.user.id)
          .limit(1),
      ]);

      // Extraer resultados con fallbacks
      const expCount = results[0].status === 'fulfilled' ? results[0].value.count : 0;
      const skillsCount = results[1].status === 'fulfilled' ? results[1].value.count : 0;
      const eduCount = results[2].status === 'fulfilled' ? results[2].value.count : 0;
      const stampsCount = results[3].status === 'fulfilled' ? results[3].value.count : 0;
      const stampsData = results[4].status === 'fulfilled' ? results[4].value.data : [];
      const leadsData = results[5].status === 'fulfilled' ? results[5].value.data : [];
      const analytics = results[6].status === 'fulfilled' ? results[6].value : null;
      const langCount = results[7].status === 'fulfilled' ? results[7].value.count : 0;
      const portCount = results[8].status === 'fulfilled' ? results[8].value.count : 0;

      console.log('📊 CONTEOS DASHBOARD:', {
        experiences: expCount,
        skills: skillsCount,
        education: eduCount,
        languages: langCount,
        portfolio: portCount,
      });

      if (results[6].status === 'rejected') {
        
      }

      // Calcular completeness usando la función centralizada
      const { calculateProfileCompleteness } = await import('../../utils/profileValidation');
      const profileCompleteness = calculateProfileCompleteness(profile, {
        experiences: expCount || 0,
        education: eduCount || 0,
        skills: skillsCount || 0,
        languages: langCount || 0,
        portfolio: portCount || 0,
      });

      // ✅ Configurar stamps y leads
      setStamps(stampsData || []);
      setRecentLeads(leadsData || []);

      // ✅ Configurar analytics (ya cargado en el Promise.allSettled)
      if (analytics) {
        // Process views by day for chart
        const chartData = analytics.viewsByDay.map((item: any, index: number) => ({
          name: `Día ${index + 1}`,
          visits: item.views,
        }));
        setVisitsData(chartData.slice(-30)); // Last 30 days

        // Process countries with flags
        const countryFlags: { [key: string]: string } = {
          'España': '🇪🇸',
          'México': '🇲🇽',
          'Argentina': '🇦🇷',
          'Colombia': '🇨🇴',
          'Chile': '🇨🇱',
          'United States': '🇺🇸',
          'Brasil': '🇧🇷',
          'Peru': '🇵🇪',
          'Venezuela': '🇻🇪',
          'Ecuador': '🇪🇨',
        };
        const countries = analytics.topCountries.map((item: any) => ({
          country: item.country,
          visits: item.count,
          flag: countryFlags[item.country] || '🌍',
        }));
        setCountriesData(countries);

        // Process traffic sources with colors
        const sourceColors: { [key: string]: string } = {
          'LinkedIn': '#0077B5',
          'Google': '#4285F4',
          'Facebook': '#1877F2',
          'Twitter': '#1DA1F2',
          'Instagram': '#E4405F',
          'Directo': '#34A853',
          'Otros': '#9E9E9E',
        };
        const sources = analytics.trafficSources.map((item: any) => ({
          name: item.source,
          value: item.count,
          color: sourceColors[item.source] || '#9E9E9E',
        }));
        setTrafficSourcesData(sources);
      }

      // ✅ Mostrar dashboard con TODOS los datos de una vez
      setStats({
        visits: analytics?.totalViews || 0,
        ctaClicks: analytics?.totalClicks || 0,
        profileCompleteness,
        verifiedStamps: stampsCount || 0,
        experienceCount: expCount || 0,
        skillsCount: skillsCount || 0,
        educationCount: eduCount || 0,
        languagesCount: langCount || 0,
        portfolioCount: portCount || 0,
      });

      
      setLoading(false); // ✅ Dashboard visible con TODO cargado

    } catch (error) {
      toast.error('Error al cargar datos del dashboard');
      dashboardDataLoadedRef.current = false; // ✅ Permitir reintentar si falla
      setLoading(false); // ✅ Mostrar error pero no bloquear UI
    }
  };

  const showSaveMessage = (message: string, isError = false) => {
    const timestamp = new Date().toISOString();
    setSaveMessage(message);
    setLastSaved(new Date());

    // Notify parent component
    if (onSaveStatusChange) {
      onSaveStatusChange(message, timestamp);
    }

    setTimeout(() => {
      setSaveMessage('');
      if (onSaveStatusChange) {
        onSaveStatusChange('');
      }
    }, 3000);
  };

  const handleIdentitySave = async (data: IdentityFormData) => {
    setIsSaving(true);
    try {
      // Generate slug automatically - always regenerate if it has timestamp or is not clean
      let generatedSlug = profile?.slug;
      const shouldRegenerateSlug = !generatedSlug ||
                                     generatedSlug.match(/-\d{6}$/) || // Has timestamp suffix
                                     generatedSlug === profile?.id; // Is UUID

      if (shouldRegenerateSlug && data.full_name) {
        // Create slug from full_name and headline (SEO-friendly, no timestamp)
        const namePart = data.full_name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove accents
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Remove consecutive hyphens
          .trim();

        const headlinePart = data.headline
          ? data.headline
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .substring(0, 30)
              .trim()
          : '';

        generatedSlug = headlinePart
          ? `${namePart}-${headlinePart}`
          : namePart;

        // Check if slug already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', generatedSlug)
          .maybeSingle();

        // If slug exists, add a number suffix
        if (existingProfile && existingProfile.id !== session?.user.id) {
          let counter = 1;
          let uniqueSlug = `${generatedSlug}-${counter}`;

          while (true) {
            const { data: checkProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('slug', uniqueSlug)
              .maybeSingle();

            if (!checkProfile) {
              generatedSlug = uniqueSlug;
              break;
            }
            counter++;
            uniqueSlug = `${generatedSlug}-${counter}`;
          }
        }
      }

      // Preparar datos para actualizar
      const updateData: any = {
        full_name: data.full_name,
        headline: data.headline,
        summary: data.summary,
        country_code: data.country_code,
        location: data.location,
        phone: data.phone,
        linkedin_url: data.linkedin_url,
        github_url: data.github_url,
        portfolio_url: data.portfolio_url,
        avatar_url: data.avatar_url,
        slug: generatedSlug,
        updated_at: new Date().toISOString(),
      };

      // Agregar remote solo si está definido
      if (data.remote !== undefined) {
        updateData.remote = data.remote;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session?.user.id);

      if (error) throw error;

      // Refetch profile to update UI in real-time
      await refetchProfile();

      setLastSaved(new Date());
      showSaveMessage('Identity saved successfully!');
    } catch (error) {
      toast.error('Error al guardar identidad');
      showSaveMessage('Failed to save identity', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExperienceSave = async (data: ExperienceFormData[]) => {setIsSaving(true);

    // Detect if this is a deletion (array got smaller)
    const isDeleting = data.length < experiences.length;

    try {
      await supabase.from('experiences').delete().eq('profile_id', session?.user.id);

      if (data.length > 0) {
        const experiencesToInsert = data.map((exp, index) => {
          // Format dates properly - only add -01 if date is in YYYY-MM format
          const formatDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return null;
            // If already in YYYY-MM-DD format, return as is
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
            // If in YYYY-MM format, add -01
            if (dateStr.match(/^\d{4}-\d{2}$/)) return `${dateStr}-01`;
            // Invalid format, return null
            return null;
          };

          return {
            profile_id: session?.user.id,
            position: exp.position,
            company_name: exp.company_name,
            start_date: formatDate(exp.start_date),
            end_date: formatDate(exp.end_date),
            description: exp.description || '',
            achievements: exp.achievements || null,
            is_current: exp.is_current || false,
            location: exp.location || null,
            employment_type: exp.employment_type || null,
            verified: exp.verified || false,
            sort_order: index,
          };
        });

        const { error } = await supabase.from('experiences').insert(experiencesToInsert);
        if (error) throw error;
      }

      // Refetch experiences from database to ensure UI is synced
      const { data: freshExperiences } = await supabase
        .from('experiences')
        .select('*')
        .eq('profile_id', session?.user.id)
        .order('sort_order', { ascending: true });

      setExperiences(freshExperiences || []);
      await refetchProfile(); // Refetch to update UI
      setLastSaved(new Date());

      // Show appropriate message based on action
      if (isDeleting) {
        showSaveMessage('Experience deleted successfully!');
        toast.success('Experiencia eliminada exitosamente');
      } else {
        showSaveMessage('Experience saved successfully!');
        toast.success('Experiencia guardada exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || 'Error desconocido';
      const errorDetails = error?.details || '';
      const fullError = errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage;
      toast.error(`Error al guardar: ${fullError}`, 10000);
      showSaveMessage('Failed to save experience', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEducationSave = async (data: EducationFormData[]) => {
    setIsSaving(true);
    try {
      await supabase.from('education').delete().eq('profile_id', session?.user.id);

      if (data.length > 0) {
        const educationToInsert = data.map((edu, index) => {
          // Format dates properly - only add -01 if date is in YYYY-MM format
          const formatDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return null;
            // If already in YYYY-MM-DD format, return as is
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
            // If in YYYY-MM format, add -01
            if (dateStr.match(/^\d{4}-\d{2}$/)) return `${dateStr}-01`;
            // Invalid format, return null
            return null;
          };

          return {
            profile_id: session?.user.id,
            institution_name: edu.institution_name,
            degree: edu.degree,
            field_of_study: edu.field_of_study,
            start_date: formatDate(edu.start_date),
            end_date: formatDate(edu.end_date),
            description: edu.description || '',
            sort_order: index,
          };
        });

        const { error } = await supabase.from('education').insert(educationToInsert);
        if (error) throw error;
      }

      setEducation(data);
      await refetchProfile(); // Refetch to update UI
      setLastSaved(new Date());
      showSaveMessage('Education saved successfully!');
    } catch (error) {
      toast.error('Error al guardar educación');
      showSaveMessage('Failed to save education', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkillsSave = async (data: SkillFormData[]) => {
    setIsSaving(true);
    try {
      await supabase.from('skills').delete().eq('profile_id', session?.user.id);

      if (data.length > 0) {
        const skillsToInsert = data.map((skill, index) => ({
          profile_id: session?.user.id,
          name: skill.name,
          level: skill.level || null,
          years_of_experience: skill.years_of_experience || null,
          percentage: skill.percentage || null,
          sort_order: index,
        }));

        const { error } = await supabase.from('skills').insert(skillsToInsert);
        if (error) throw error;
      }

      setSkills(data);
      await refetchProfile(); // Refetch to update UI
      setLastSaved(new Date());
      showSaveMessage('Skills saved successfully!');
    } catch (error) {
      toast.error('Error al guardar habilidades');
      showSaveMessage('Failed to save skills', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguagesSave = async (data: LanguageFormData[]) => {
    setIsSaving(true);
    try {
      await supabase.from('languages').delete().eq('profile_id', session?.user.id);

      if (data.length > 0) {
        const languagesToInsert = data.map((lang, index) => ({
          profile_id: session?.user.id,
          name: lang.name,
          level: lang.level,
          is_native: lang.is_native || false,
          sort_order: index,
        }));

        const { error } = await supabase.from('languages').insert(languagesToInsert);
        if (error) throw error;
      }

      setLanguages(data);
      await refetchProfile(); // Refetch to update UI
      setLastSaved(new Date());
      showSaveMessage('Languages saved successfully!');
      toast.success('Idiomas guardados correctamente');
    } catch (error) {
      console.error('Error saving languages:', error);
      toast.error('Error al guardar idiomas');
      showSaveMessage('Failed to save languages', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePortfolioSave = async (data: PortfolioItemFormData[]) => {
    setIsSaving(true);
    try {
      await supabase.from('portfolio_items').delete().eq('profile_id', session?.user.id);

      if (data.length > 0) {
        const items = data.map((item, index) => ({
          profile_id: session?.user.id,
          title: item.title,
          category: item.category || null,
          link: item.link || null,
          description: item.description || null,
          image_url: item.image_url || null,
          file_url: item.file_url || null,
          sort_order: index,
        }));const { error } = await supabase.from('portfolio_items').insert(items);
        if (error) {throw error;
        }
      }

      setPortfolio(data);
      await refetchProfile(); // Refetch to update UI
      setLastSaved(new Date());
      showSaveMessage('Portfolio guardado correctamente');
    } catch (error) {toast.error('Error al guardar portfolio');
      showSaveMessage('Error al guardar portfolio', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async (data: PreferencesFormData) => {
    setIsSaving(true);
    try {
      // Ensure numeric values are valid or null
      const salary_min = data.salary_min && !isNaN(data.salary_min) ? data.salary_min : null;
      const salary_max = data.salary_max && !isNaN(data.salary_max) ? data.salary_max : null;
      
      const updateData = {
        job_seeking_status: data.job_seeking_status || null,
        job_type: data.job_type && data.job_type.length > 0 ? data.job_type : null,
        availability: data.availability || null,
        salary_min,
        salary_max,
        salary_currency: data.salary_currency || null,
        remote_preference: data.remote_preference || null,
        willing_to_relocate: data.willing_to_relocate || false,
        preferred_locations: data.preferred_locations && data.preferred_locations.length > 0 ? data.preferred_locations : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session?.user.id);

      if (error) {
        throw error;
      }

      await refetchProfile(); // Refetch to update UI
      setLastSaved(new Date());
      showSaveMessage('Preferences saved successfully!');
      toast.success('Preferencias guardadas correctamente');
    } catch (error: any) {
      toast.error(`Error al guardar preferencias: ${error?.message || 'Error desconocido'}`);
      showSaveMessage('Failed to save preferences', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIQuizComplete = async (formData: any) => {
    setIsSaving(true);
    try {
      // Update profile with AI-generated data
      const updates: any = {};

      if (formData.summary) {
        updates.summary = formData.summary;
      }

      if (formData.slug) {
        updates.slug = formData.slug;
      }

      // Save basic profile data
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', session?.user.id);

        if (error) throw error;
      }

      // Save experiences if provided
      if (formData.experience && Array.isArray(formData.experience) && formData.experience.length > 0) {
        // Convert AI-generated experience strings to experience objects
        const experiencePromises = formData.experience.map((expText: string, index: number) => {
          return supabase
            .from('experiences')
            .insert({
              profile_id: session?.user.id,
              title: `Position ${index + 1}`,
              company: 'Company',
              description: expText,
              start_date: new Date().toISOString().split('T')[0],
              currently_working: false,
              order_index: index
            });
        });

        await Promise.all(experiencePromises);
      }

      showSaveMessage('Profile created successfully with AI assistance!');

    } catch (error) {
      toast.error('Error al guardar cuestionario de IA');
      showSaveMessage('Failed to save profile data', true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        {/* Simple spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <p className="text-base text-gray-700 dark:text-gray-300">
            {loadingMessage}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esto puede tomar unos segundos
          </p>
        </div>
      </div>
    );
  }

  // Dashboard Home View
  if (activeSection === 'dashboard') {
    return (
      <ModernDashboardView
        profile={profile}
        stats={stats}
        onSectionChange={onSectionChange}
        isAIAvailable={isAIAvailable}
        experiences={experiences}
        education={education}
        skills={skills}
        visas={visas}
        languages={languages}
        certifications={certifications}
      />
    );
  }

  // OLD DASHBOARD - KEEPING AS BACKUP
  if (false && activeSection === 'dashboard-old') {
    return (
      <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.welcome(profile?.full_name || t.menu.user)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t.welcomeCard.title}
          </p>
        </div>

        {/* Missing Fields Alert */}
        {stats.profileCompleteness < 100 && (() => {
          const missingFields = [];
          if (!profile?.full_name) missingFields.push(t.welcomeCard.missingFields.fullName);
          if (!profile?.headline) missingFields.push(t.welcomeCard.missingFields.headline);
          if (!profile?.summary) missingFields.push(t.welcomeCard.missingFields.summary);
          if (!profile?.avatar_url) missingFields.push(t.welcomeCard.missingFields.avatar);
          if (!profile?.location) missingFields.push(t.welcomeCard.missingFields.location);
          if (!profile?.phone) missingFields.push(t.welcomeCard.missingFields.phone);
          if (!profile?.linkedin_url && !profile?.github_url) missingFields.push(t.welcomeCard.missingFields.social);
          if (stats.experienceCount === 0) missingFields.push(t.welcomeCard.missingFields.experience);
          if (!education || education.length === 0) missingFields.push(t.welcomeCard.missingFields.education);
          if (stats.skillsCount === 0) missingFields.push(t.welcomeCard.missingFields.skills);

          return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {t.welcomeCard.title} 🎉
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
                    {t.welcomeCard.description(5)}
                  </p>
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.welcomeCard.progressLabel}</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.profileCompleteness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${stats.profileCompleteness}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => onSectionChange('mi-perfil:ai-assistant')}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ${
                        isAIAvailable
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                          : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-75'
                      }`}
                      title={!isAIAvailable ? 'Asistente de IA no disponible' : ''}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t.welcomeCard.completeButton}
                      {!isAIAvailable && (
                        <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                          No disponible
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => onSectionChange('mi-perfil:identity')}
                      className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 transition-colors"
                    >
                      {t.welcomeCard.editManually}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.analytics.visits30Days}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.visits}</p>
                {stats.visits > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.analytics.visits30Days}</p>
                )}
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.analytics.ctaClicks}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.ctaClicks}</p>
                {stats.ctaClicks > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.analytics.totalAccumulated}</p>
                )}
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.analytics.completed}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.profileCompleteness}%</p>
                {stats.profileCompleteness < 100 && (
                  <button
                    onClick={() => onSectionChange('mi-perfil')}
                    className="text-sm text-cv-blue hover:underline mt-1 inline-block"
                  >
                    {t.analytics.completeProfile}
                  </button>
                )}
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.analytics.verifiedStamps}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.verifiedStamps}</p>
                <p className="text-sm text-gray-500 mt-1">{t.analytics.credentials}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Create Your Own CV Section */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 md:p-10 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{t.cvBuilder.title}</h2>
              </div>
              <p className="text-blue-100 text-lg mb-4">
                {t.cvBuilder.description}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-blue-100">{t.cvBuilder.features[0]}</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-blue-100">{t.cvBuilder.features[1]}</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-blue-100">{t.cvBuilder.features[2]}</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onSectionChange('mi-perfil:template')}
                className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                {t.cvBuilder.createCV}
              </button>
              <button
                onClick={() => onSectionChange('ver-cv')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {t.cvBuilder.viewCV}
              </button>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visits Chart */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.visitsChart.title}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={visitsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Sources Chart */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.trafficSources.title}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={trafficSourcesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trafficSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Countries */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top 5 Países</h3>
            <div className="space-y-3">
              {countriesData.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-cv-blue h-2 rounded-full"
                        style={{ width: `${(country.visits / 120) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-medium w-12 text-right">
                      {country.visits}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.leads.recentLeads}</h3>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-dark-border last:border-0">
                  <div className="w-10 h-10 rounded-full bg-cv-blue/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{lead.name}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {new Date(lead.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{lead.message}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      {lead.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm font-medium text-cv-blue hover:text-cv-blue/80 transition-colors">
              {t.leads.viewAllMessages} →
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Mi Perfil Section (Profile Editor)
  if (activeSection.startsWith('mi-perfil')) {
    // Extract step from activeSection (e.g., 'mi-perfil:identity' -> 'identity')
    const stepMatch = activeSection.match(/^mi-perfil:(.+)$/);
    const initialStep = stepMatch ? stepMatch[1] : undefined;

    return (
      <div className="animate-fade-in">
        <Suspense fallback={<SectionLoader />}>
          <ProfileWizard
            profile={profile}
            experiences={experiences}
            education={education}
            skills={skills}
            languages={languages}
            portfolio={portfolio}
            visas={visas}
            certifications={certifications}
            initialStep={initialStep}
            onSaveIdentity={handleIdentitySave}
            onSaveExperience={handleExperienceSave}
            onSaveEducation={handleEducationSave}
            onSaveSkills={handleSkillsSave}
            onSaveLanguages={handleLanguagesSave}
            onSavePortfolio={handlePortfolioSave}
            onSavePreferences={handlePreferencesSave}

            onComplete={() => {
              toast.success('¡Perfil completado y optimizado con éxito!');
              onSectionChange('dashboard');
            }}
          />
        </Suspense>
      </div>
    );
  }

  // Visas Section
  if (activeSection === 'visas') {
    return (
      <Suspense fallback={<SectionLoader />}>
        <VisasSection />
      </Suspense>
    );
  }

  // CV Versions Section
  if (activeSection === 'cv-versions') {
    return <CVVersionsSection />;
  }

  // Stamps Section (Verificaciones)
  if (activeSection === 'stamps') {
    return (
      <Suspense fallback={<SectionLoader />}>
        <StampsSection onStampsUpdate={loadDashboardData} />
      </Suspense>
    );
  }

  // Analytics Section
  if (activeSection === 'analitica') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <AnalyticsDashboard profileId={session?.user.id || ''} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Exportar Section
  if (activeSection === 'exportar') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.export.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            {lang === 'en'
              ? 'Download and share your professional CV in multiple formats. Choose the best option based on your needs: PDF with full design for presentations, ATS-optimized PDF for job applications through automated systems, JSON for data backup, or a public link to share your always-updated CV online.'
              : 'Descarga y comparte tu CV profesional en múltiples formatos. Elige la mejor opción según tus necesidades: PDF con diseño completo para presentaciones, PDF optimizado para ATS en aplicaciones a través de sistemas automatizados, JSON para respaldo de datos, o un enlace público para compartir tu CV siempre actualizado en línea.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PDF Export */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-lg mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.export.pdf.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {lang === 'en'
                ? 'Download your CV in PDF format with your selected template design. Perfect for printing and email attachments. Includes colors and graphics from your chosen template.'
                : 'Descarga tu CV en formato PDF con el diseño de tu plantilla seleccionada. Perfecto para imprimir y adjuntar en correos. Incluye colores y gráficos de tu plantilla elegida.'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                {lang === 'en' ? '🎨 Full Design' : '🎨 Diseño Completo'}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                {lang === 'en' ? '🖨️ Print Ready' : '🖨️ Listo para Imprimir'}
              </span>
            </div>
            <button
              onClick={() => setShowPDFExportModal(true)}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.export.pdf.button}
            </button>
          </div>

          {/* JSON Export */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.export.json.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {lang === 'en'
                ? 'Export all your profile data in JSON format. Ideal for developers, data backups, or importing into other systems. Includes all sections: experience, education, skills, and more.'
                : 'Exporta todos los datos de tu perfil en formato JSON. Ideal para desarrolladores, respaldos de datos, o importar a otros sistemas. Incluye todas las secciones: experiencia, educación, habilidades, y más.'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                {lang === 'en' ? '💾 Data Backup' : '💾 Respaldo de Datos'}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                {lang === 'en' ? '🔄 Portable' : '🔄 Portable'}
              </span>
            </div>
            <button
              onClick={async () => {
                const data = {
                  profile,
                  experiences,
                  education,
                  skills,
                  languages,
                  portfolio,
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cv-${profile?.full_name?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t.export.json.button}
            </button>
          </div>

          {/* ATS Export - TEMPORARILY HIDDEN */}
          {/* <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {lang === 'en' ? 'ATS-Friendly PDF' : 'PDF ATS-Optimizado'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {lang === 'en'
                ? 'Optimized PDF for Applicant Tracking Systems (ATS) used by HR departments. Simple formatting ensures your CV is properly parsed by automated systems. Choose from 3 professional templates designed to pass ATS screening.'
                : 'PDF optimizado para Sistemas de Seguimiento de Candidatos (ATS) usados por departamentos de RRHH. Formato simple que garantiza que tu CV sea procesado correctamente por sistemas automatizados. Elige entre 3 plantillas profesionales diseñadas para superar filtros ATS.'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                {lang === 'en' ? '✅ ATS Compatible' : '✅ Compatible ATS'}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                {lang === 'en' ? '📋 3 Templates' : '📋 3 Plantillas'}
              </span>
            </div>
            <button
              onClick={async () => {
                // Cargar datos del perfil si no están cargados
                if (experiences.length === 0 || education.length === 0 || skills.length === 0) {
                  await loadProfileEditorData();
                }
                setShowATSExportModal(true);
              }}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {lang === 'en' ? 'Export ATS PDF' : 'Exportar PDF ATS'}
            </button>
          </div> */}


          {/* Public Link */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.export.publicLink}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {lang === 'en'
                ? 'Share your CV with a personalized public link. Perfect for adding to email signatures, LinkedIn profiles, or sharing with recruiters. Your CV will be displayed with your selected template and always up-to-date.'
                : 'Comparte tu CV con un enlace público personalizado. Perfecto para agregar a firmas de correo, perfiles de LinkedIn, o compartir con reclutadores. Tu CV se mostrará con tu plantilla seleccionada y siempre actualizado.'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                {lang === 'en' ? '🔗 Easy Share' : '🔗 Fácil Compartir'}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                {lang === 'en' ? '🔄 Auto-Update' : '🔄 Auto-Actualización'}
              </span>
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/cv/${profile?.slug || session?.user.id}`;
                navigator.clipboard.writeText(url);
                showSaveMessage(t.share.linkCopied);
              }}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {t.export.copyLink}
            </button>
          </div>
        </div>

        {/* ATS Export Modal */}
        {showATSExportModal && profile && (
          <Suspense fallback={<SectionLoader />}>
            <ATSExportModal
              isOpen={showATSExportModal}
              onClose={() => setShowATSExportModal(false)}
              profile={{
                profile: profile,
                experiences: experiences.map(exp => ({ 
                  ...exp, 
                  profile_id: session?.user.id || '',
                  end_date: exp.end_date || null,
                  description: exp.description || null,
                  achievements: exp.achievements || null,
                  is_current: exp.is_current || false,
                  location: exp.location || null,
                  employment_type: exp.employment_type || null,
                  sort_order: exp.sort_order || 0
                })) as any,
                education: education.map(edu => ({ 
                  ...edu, 
                  profile_id: session?.user.id || '',
                  end_date: edu.end_date || null,
                  description: edu.description || null,
                  grade: edu.grade || null,
                  is_current: edu.is_current || false,
                  verified: edu.verified || false,
                  sort_order: edu.sort_order || 0
                })) as any,
                skills: skills.map(skill => ({ 
                  ...skill, 
                  profile_id: session?.user.id || '',
                  level: skill.level || null,
                  years_of_experience: skill.years_of_experience || null,
                  percentage: skill.percentage || null,
                  category: skill.category || null,
                  sort_order: skill.sort_order || 0
                })) as any,
                languages: languages.map(lang => ({ 
                  ...lang, 
                  profile_id: session?.user.id || '',
                  is_native: lang.is_native || false,
                  sort_order: lang.sort_order || 0
                })) as any,
                portfolioItems: portfolio.map(item => ({ 
                  ...item, 
                  profile_id: session?.user.id || '',
                  description: item.description || null,
                  type: item.type || null,
                  url: item.url || null,
                  thumbnail_url: item.thumbnail_url || null,
                  file_url: item.file_url || null,
                  tags: item.tags || null,
                  featured: item.featured || false,
                  sort_order: item.sort_order || 0
                })) as any,
                certifications: [], // Will be loaded if needed
                services: [],
                stats: [],
                visas: [],
              }}
              stamps={stamps}
              language={lang as 'en' | 'es'}
            />
          </Suspense>
        )}

        {/* PDF Export Instructions Modal */}
        <Modal
          isOpen={showPDFExportModal}
          onClose={() => setShowPDFExportModal(false)}
          title={t.export.pdf.printDialog.title}
          maxWidth="md"
        >
          <div className="p-6 space-y-6">
            {!isGeneratingPDF ? (
              <>
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{t.export.pdf.printDialog.description}</p>
                </div>

                <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{t.export.pdf.printDialog.tip}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPDFExportModal(false)}
                    className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    {lang === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    onClick={async () => {
                      setIsGeneratingPDF(true);
                      setPdfProgress(0);
                      try {
                        await generateCVPDF({
                          profileSlug: profile?.slug || '',
                          profileId: session?.user.id || '',
                          fileName: `CV-${profile?.full_name || 'YourCV'}.pdf`,
                          onProgress: (progress) => {
                            setPdfProgress(progress);
                          },
                          onSuccess: () => {
                            setTimeout(() => {
                              setIsGeneratingPDF(false);
                              setPdfProgress(0);
                              setShowPDFExportModal(false);
                            }, 1000);
                          },
                          onError: (error) => {
                            setIsGeneratingPDF(false);
                            setPdfProgress(0);
                            toast.error(error.message || t.export.popupBlocked, 8000);
                          }
                        });
                      } catch (error) {
                        setIsGeneratingPDF(false);
                        setPdfProgress(0);
                        toast.error(t.export.popupBlocked, 8000);
                      }
                    }}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.export.pdf.printDialog.confirm}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                  <svg className="animate-spin h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>

                <div className="space-y-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-red-600 dark:bg-red-500 transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${pdfProgress}%` }}
                    ></div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {pdfProgress < 30 && (lang === 'en' ? 'Preparing CV...' : 'Preparando CV...')}
                    {pdfProgress >= 30 && pdfProgress < 60 && (lang === 'en' ? 'Capturing design...' : 'Capturando diseño...')}
                    {pdfProgress >= 60 && pdfProgress < 90 && (lang === 'en' ? 'Generating PDF...' : 'Generando PDF...')}
                    {pdfProgress >= 90 && (lang === 'en' ? 'Downloading...' : 'Descargando...')}
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pdfProgress}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  // Compartir Section
  if (activeSection === 'compartir') {
    // Verificar si el perfil está completo
    const isProfileComplete = !!(
      profile?.full_name &&
      profile?.headline &&
      profile?.summary
    );

    if (!isProfileComplete) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-10 text-center shadow-lg">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-4">
                <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            {/* Title and Description */}
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Completa tu perfil para compartir
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Solo necesitas completar estos campos básicos para empezar a compartir tu CV profesional
            </p>

            {/* Checklist */}
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 mb-8 max-w-md mx-auto shadow-sm">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-left">
                Campos requeridos:
              </p>
              <ul className="space-y-3">
                <li className={`flex items-center gap-3 p-3 rounded-lg ${profile?.full_name ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  {profile?.full_name ? (
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <span className={`font-medium ${profile?.full_name ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Nombre completo
                  </span>
                </li>
                <li className={`flex items-center gap-3 p-3 rounded-lg ${profile?.headline ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  {profile?.headline ? (
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <span className={`font-medium ${profile?.headline ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Título profesional
                  </span>
                </li>
                <li className={`flex items-center gap-3 p-3 rounded-lg ${profile?.summary ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  {profile?.summary ? (
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <span className={`font-medium ${profile?.summary ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Resumen profesional
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => onSectionChange('mi-perfil:identity')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Completar perfil ahora
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Solo te tomará 2 minutos
            </p>
          </div>
        </div>
      );
    }

    // Generate production URL for sharing
    const getProductionOrigin = () => {
      const origin = window.location.origin;
      // Replace localhost with production domain
      if (origin.includes('localhost')) {
        return 'https://yourcvpassport.com';
      }
      return origin;
    };

    const shareUrl = `${getProductionOrigin()}/cv/${profile?.slug || session?.user.id}`;

    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.share.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            {lang === 'en'
              ? 'Share your professional CV with recruiters, colleagues, and on social networks. Use your personalized public link, share on LinkedIn, Twitter, or embed your CV on your website. Your CV will always display the latest information and your selected design template.'
              : 'Comparte tu CV profesional con reclutadores, colegas y en redes sociales. Usa tu enlace público personalizado, comparte en LinkedIn, Twitter, o incrusta tu CV en tu sitio web. Tu CV siempre mostrará la información más reciente y tu plantilla de diseño seleccionada.'}
          </p>
        </div>

        {/* URL Section */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-start justify-between mb-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.share.yourPublicUrl}
              </label>
                  {profile?.slug && 
               !profile.slug.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) && 
               !profile.slug.startsWith('user-') && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.share.seoOptimizedUrl}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white font-mono text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                showSaveMessage(t.share.linkCopied);
              }}
              className="px-6 py-2 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
            >
              {t.share.copy}
            </button>
          </div>
          {profile?.slug && (profile.slug.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) || profile.slug.startsWith('user-')) && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>{t.share.improveUrl}</strong> {t.share.improveUrlDescription} <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">tu-nombre-tu-profesion</code>, 
                  completa tu <button 
                    onClick={() => onSectionChange('mi-perfil:identity')}
                    className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100"
                  >{t.share.completeNameAndTitle}</button> en tu perfil.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-4 bg-[#0077B5] hover:bg-[#006399] text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            {t.share.linkedin}
          </a>

          {/* Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(t.share.shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            {t.share.twitter}
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {t.share.facebook}
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(t.share.shareText + ': ' + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {t.share.whatsapp}
          </a>
        </div>

        {/* Business Card Section */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.share.businessCard.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {showCardGallery
                  ? t.share.businessCard.galleryDescription
                  : t.share.businessCard.description}
              </p>
            </div>
            <button
              onClick={() => setShowCardGallery(!showCardGallery)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              {showCardGallery ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {t.share.businessCard.viewCard}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {t.share.businessCard.viewGallery}
                </>
              )}
            </button>
          </div>

          {showCardGallery ? (
            <BusinessCardGallery
              profile={profile}
              shareUrl={shareUrl}
              userEmail={session?.user.email}
            />
          ) : (
            <BusinessCardPreview
              profile={profile}
              shareUrl={shareUrl}
              userEmail={session?.user.email}
              onDownload={() => showSaveMessage(t.share.businessCard.downloaded)}
            />
          )}
        </div>

        {/* QR Code Section */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.share.qrCode.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t.share.qrCode.description}
          </p>
          <div className="flex justify-center p-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareUrl)}`;
              link.download = `qr-cv-${profile?.full_name?.replace(/\s+/g, '-')}.png`;
              link.click();
            }}
            className="w-full mt-4 py-2 px-4 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
          >
            {t.share.qrCode.download}
          </button>
        </div>
      </div>
    );
  }

  // Analitica Section (Extended Analytics) - Now using Interactive Panel
  if (activeSection === 'analitica') {
    return (
      <Suspense fallback={<SectionLoader />}>
        <InteractiveAnalyticsPanel
          data={{
            visitsData,
            countriesData,
            trafficSourcesData,
            stats,
            recentLeads
          }}
        />
      </Suspense>
    );
  }

  // Leads Section - Enhanced with messaging
  if (activeSection === 'leads') {
    // Check if we have a leadId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const leadId = urlParams.get('leadId');

    if (leadId) {
      // Show messaging view for specific lead
      return (
        <Suspense fallback={<SectionLoader />}>
          <MessagingView
            key={`messaging-${leadId}-${urlKey}`}
            leadId={leadId}
            onBack={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('leadId');
              window.history.pushState({}, '', url.toString());
              setUrlKey(prev => prev + 1);
            }}
          />
        </Suspense>
      );
    }

    // Show leads inbox by default
    return (
      <Suspense fallback={<SectionLoader />}>
        <LeadsInbox key={`leads-inbox-${urlKey}`} />
      </Suspense>
    );
  }

  // Messages Section - Direct messaging view
  if (activeSection === 'messages' || activeSection.startsWith('messages:')) {
    const leadId = activeSection.split(':')[1];
    return (
      <Suspense fallback={<SectionLoader />}>
        <MessagingView leadId={leadId} onBack={() => onSectionChange('leads')} />
      </Suspense>
    );
  }

  // Success Stories Section
  if (activeSection === 'casos-exito') {
    return (
      <Suspense fallback={<SectionLoader />}>
        <SuccessStorySubmission />
      </Suspense>
    );
  }

  // Ajustes Section
  if (activeSection === 'ajustes') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.settings.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            {lang === 'en'
              ? 'Configure your account preferences, display settings, and privacy options. Customize your CV visibility, manage your custom domain, update your personal information, and control how recruiters and visitors interact with your profile.'
              : 'Configura las preferencias de tu cuenta, ajustes de visualización y opciones de privacidad. Personaliza la visibilidad de tu CV, administra tu dominio personalizado, actualiza tu información personal y controla cómo los reclutadores y visitantes interactúan con tu perfil.'}
          </p>
        </div>

        {/* Display Settings */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <Suspense fallback={<SectionLoader />}>
            <DisplaySettingsSection />
          </Suspense>
        </div>

        {/* Profile Settings */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.settings.accountInfo}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={session?.user.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={profile?.full_name || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username (URL personalizada)
              </label>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-500 dark:text-gray-400">
                  {window.location.origin}/cv/
                </span>
                <input
                  type="text"
                  value={profile?.handle || profile?.slug || session?.user.id?.slice(0, 8)}
                  placeholder="username"
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onSectionChange('mi-perfil')}
            className="mt-6 w-full py-2 px-4 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
          >
            {t.cards.profile.editProfile}
          </button>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.settings.privacy}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t.settings.publicProfile}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t.settings.publicProfileDescription}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t.settings.trackAnalytics}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t.settings.trackAnalyticsDescription}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-4">{t.settings.dangerZone}</h3>
          <p className="text-sm text-red-800 dark:text-red-300 mb-4">
            {t.settings.dangerZoneDescription}
          </p>
          <button className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
            {t.settings.deleteAccount}
          </button>
        </div>
      </div>
    );
  }

  // Template section
  if (activeSection === 'template') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.templateSection.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            {lang === 'en'
              ? 'Choose from our collection of professional CV templates. Each template is carefully designed to highlight your experience and skills. Select a modern design for creative industries, a classic template for corporate positions, or an ATS-friendly format for automated application systems. Your selection will apply to your public CV and PDF exports.'
              : 'Elige entre nuestra colección de plantillas profesionales de CV. Cada plantilla está cuidadosamente diseñada para destacar tu experiencia y habilidades. Selecciona un diseño moderno para industrias creativas, una plantilla clásica para puestos corporativos, o un formato compatible con ATS para sistemas de aplicación automatizados. Tu selección se aplicará a tu CV público y exportaciones PDF.'}
          </p>
        </div>
        <Suspense fallback={<SectionLoader />}>
          <TemplateSelector
          currentTemplate={profile?.template || 'passport'}
          onTemplateChange={async (templateId) => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ template: templateId })
                .eq('id', session?.user.id);

              if (error) throw error;

              if (onSaveStatusChange) {
                onSaveStatusChange(t.templateSection.templateUpdated, new Date().toISOString());
              }
            } catch (error) {
              toast.error('Error al actualizar plantilla');
              if (onSaveStatusChange) {
                onSaveStatusChange(t.templateSection.templateUpdateError, new Date().toISOString());
              }
            }
          }}
        />
        </Suspense>
      </div>
    );
  }

  // Help section
  if (activeSection === 'ayuda') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-cv-blue to-blue-600 rounded-xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">{t.helpSection.title}</h2>
          <p className="text-blue-100">
            {t.helpSection.subtitle}
          </p>
        </div>

        {/* Quick Help Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Getting Started */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-100 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.helpSection.gettingStarted.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t.helpSection.gettingStarted.description}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{t.helpSection.gettingStarted.step1}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{t.helpSection.gettingStarted.step2}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{t.helpSection.gettingStarted.step3}</span>
              </li>
            </ul>
          </div>

          {/* Profile Editor */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-100 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.helpSection.profileEditor}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t.helpSection.profileEditorDesc}
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• {t.helpSection.profileEditorTips.tip1}</li>
              <li>• {t.helpSection.profileEditorTips.tip2}</li>
              <li>• {t.helpSection.profileEditorTips.tip3}</li>
            </ul>
          </div>

          {/* Templates */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-100 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.helpSection.cvTemplates}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t.helpSection.cvTemplatesDesc}
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• {t.helpSection.cvTemplatesTips.tip1}</li>
              <li>• {t.helpSection.cvTemplatesTips.tip2}</li>
              <li>• {t.helpSection.cvTemplatesTips.tip3}</li>
            </ul>
          </div>

          {/* Share & Export */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-100 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.helpSection.shareExport}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t.helpSection.shareExportDesc}
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• {t.helpSection.shareExportTips.tip1}</li>
              <li>• {t.helpSection.shareExportTips.tip2}</li>
              <li>• {t.helpSection.shareExportTips.tip3}</li>
            </ul>
          </div>

          {/* Privacy */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-100 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.helpSection.privacy.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t.helpSection.privacy.description}
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• {t.helpSection.privacy.tip1}</li>
              <li>• {t.helpSection.privacy.tip2}</li>
              <li>• {t.helpSection.privacy.tip3}</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-100 dark:border-dark-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.helpSection.support.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t.helpSection.support.description}
            </p>
            <button className="w-full mt-2 px-4 py-2 bg-cv-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              {t.helpSection.support.contact}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-8 border border-gray-100 dark:border-dark-border">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.helpSection.faq.title}</h3>

          <div className="space-y-4">
            <details className="group border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                {t.helpSection.faq.q1}
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                {t.helpSection.faq.a1}
              </p>
            </details>

            <details className="group border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                {t.helpSection.faq.q2}
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                {t.helpSection.faq.a2}
              </p>
            </details>

            <details className="group border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                {t.helpSection.faq.q3}
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                {t.helpSection.faq.a3}
              </p>
            </details>

            <details className="group border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                {t.helpSection.faq.q4}
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                {t.helpSection.faq.a4}
              </p>
            </details>

            <details className="group border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                {t.helpSection.faq.q5}
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                {t.helpSection.faq.a5}
              </p>
            </details>
          </div>
        </div>

        {/* Video Tutorial Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-8 border border-indigo-100 dark:border-indigo-800">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.helpSection.videoTutorial.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.helpSection.videoTutorial.description}
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-cv-blue mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{t.helpSection.initialSetup}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-cv-blue mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{t.helpSection.videoTutorial.bestPractices}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-cv-blue mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{t.helpSection.videoTutorial.tips}</span>
                </li>
              </ul>
              <button className="px-6 py-3 bg-cv-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {t.helpSection.videoTutorial.watchVideo}
              </button>
            </div>
            <div className="aspect-video bg-gray-800 rounded-lg shadow-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cv-blue/20 to-purple-600/20"></div>
              <svg className="w-20 h-20 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Other sections (placeholder content)
  return (
    <>
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-12 border border-gray-100 dark:border-dark-border">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Esta sección está en desarrollo
          </p>
        </div>
      </div>
    </>
  );
};

export default DashboardContent;

