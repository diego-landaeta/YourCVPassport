import React, { memo, lazy, Suspense } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDashboardTour } from '../../hooks/useDashboardTour';
import DashboardTour from './DashboardTour';
import { supabase } from '../../supabase/client';
import { Sparkles, ArrowRight, X } from 'lucide-react';

// Lazy load components
const ProfileQualityScore = lazy(() => import('../profile-editor/ProfileQualityScore'));
const UsageStatsWidget = lazy(() => import('./UsageStatsWidget'));

interface ModernDashboardViewProps {
  profile: any;
  stats: {
    visits: number;
    ctaClicks: number;
    profileCompleteness: number;
    verifiedStamps: number;
    experienceCount: number;
    skillsCount: number;
    educationCount: number;
    certificationsCount?: number;
  };
  onSectionChange: (section: string) => void;
  isAIAvailable: boolean;
  experiences?: any[];
  education?: any[];
  skills?: any[];
  visas?: any[];
  languages?: any[];
  certifications?: any[];
  // Datos reales de visitas por día
  visitsData?: { name: string; visits: number }[];
  // Mobile menu control for tour
  isMobileMenuOpen?: boolean;
  onOpenMobileMenu?: () => void;
}

interface CompletionNotification {
  show: boolean;
  message: string;
}

// Generar datos semanales REALES a partir de visitsData
const generateWeeklyDataFromReal = (visitsData: { name: string; visits: number }[] | undefined): number[] => {
  if (!visitsData || visitsData.length === 0) {
    // Generate demo data for the last 7 days
    return [
      Math.floor(Math.random() * 4) + 2,  // Mon
      Math.floor(Math.random() * 6) + 3,  // Tue
      Math.floor(Math.random() * 5) + 2,  // Wed
      Math.floor(Math.random() * 8) + 4,  // Thu
      Math.floor(Math.random() * 6) + 2,  // Fri
      Math.floor(Math.random() * 4) + 1,  // Sat
      Math.floor(Math.random() * 10) + 5, // Sun (highest for visual impact)
    ];
  }

  // Tomar los últimos 7 días de datos reales
  const last7Days = visitsData.slice(-7);

  // Si hay menos de 7 días, rellenar con 0s al inicio
  const result = new Array(7).fill(0);
  const startIndex = 7 - last7Days.length;

  last7Days.forEach((day, index) => {
    result[startIndex + index] = day.visits;
  });

  return result;
};

// First Login Welcome Component (inline)
const FirstLoginWelcome: React.FC<{
  onDismiss: () => void;
  profileCompleteness: number;
  onSectionChange: (section: string) => void;
  userGender?: string;
}> = ({ onDismiss, profileCompleteness, onSectionChange, userGender }) => {
  const { lang } = useLanguage();
  const translations = useTranslations();
  const t = translations;
  const welcomeGreeting = userGender === 'female' ? 'Bienvenida' : 'Bienvenido';

  const handleStartProfile = () => {
    onDismiss();
    // Navegar directamente al wizard (primer paso: identidad)
    onSectionChange('mi-perfil:identity');
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6 relative animate-fade-in">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t.dashboard?.firstLoginWelcome?.title || `¡${welcomeGreeting} a YourCVPassport!`}
          </h3>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t.dashboard?.firstLoginWelcome?.description ||
              'Para comenzar a usar todas las funcionalidades del dashboard, completa tu perfil profesional. Solo te tomará unos minutos.'}
          </p>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.dashboard?.firstLoginWelcome?.progress || 'Progreso del perfil'}
              </span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {profileCompleteness}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleStartProfile}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {profileCompleteness === 0
              ? (t.dashboard?.firstLoginWelcome?.startButton || 'Comenzar mi perfil')
              : (t.dashboard?.firstLoginWelcome?.continueButton || 'Continuar mi perfil')
            }
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ⚡ OPTIMIZATION: Memoize the entire component to prevent re-renders when parent re-renders
// Only re-render when props actually change (shallow comparison)
const ModernDashboardView: React.FC<ModernDashboardViewProps> = memo(({
  profile,
  stats,
  onSectionChange,
  isAIAvailable,
  experiences = [],
  education = [],
  skills = [],
  visas = [],
  languages = [],
  certifications = [],
  visitsData = [],
  isMobileMenuOpen,
  onOpenMobileMenu,
}) => {
  const translations = useTranslations();
  const t = translations.dashboard;
  const { lang } = useLanguage();
  const [chartType, setChartType] = React.useState<'bar' | 'pie' | 'calendar'>('calendar');
  const [notification, setNotification] = React.useState<CompletionNotification>({ show: false, message: '' });
  const [previousStats, setPreviousStats] = React.useState(stats);

  // Calendar state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = React.useState(currentDate.getFullYear());

  // Dashboard Tour
  const { showTour, completeTour, skipTour, hasTourBeenCompleted } = useDashboardTour(
    profile?.id,
    stats.profileCompleteness,
    profile?.dashboard_tour_completed,
    profile?.wizard_completed
  );

  // First Login Welcome
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = React.useState(false);

  // Check if sections should be blocked
  // ⚠️ IMPORTANTE: Bloquear funcionalidades HASTA que el usuario haya completado su perfil al 100%
  // Lógica: El dashboard se desbloquea SOLO cuando el perfil está completo al 100%
  const shouldBlockSections = stats.profileCompleteness < 100;
  const [showBlockAlert, setShowBlockAlert] = React.useState(false);

  // Estado para controlar la visibilidad de la tarjeta de perfil completo
  const [showProfileCompleteCard, setShowProfileCompleteCard] = React.useState(true);
  const [isCardFadingOut, setIsCardFadingOut] = React.useState(false);

  const handleBlockedAction = () => {
    setShowBlockAlert(true);
    setTimeout(() => setShowBlockAlert(false), 4000);
  };

  // Usar datos REALES de visitas
  const weeklyData = generateWeeklyDataFromReal(visitsData);

  // Calculate total visits (use real data if available, otherwise calculate from demo data)
  const totalVisitsDisplay = React.useMemo(() => {
    if (stats.visits > 0) {
      return stats.visits;
    }
    // If no real visits, calculate from demo weekly data
    return weeklyData.reduce((sum, visits) => sum + visits, 0);
  }, [stats.visits, weeklyData]);

  // Handle first login welcome message
  React.useEffect(() => {
    if (!profile?.id) return;

    // Mostrar mensaje de bienvenida si:
    // 1. El usuario NO ha completado su primera sesión (first_login_completed === false)
    // 2. El perfil NO está completo (para no mostrar junto con el tour)
    if (!profile?.first_login_completed && stats.profileCompleteness < 100) {
      setShowFirstLoginWelcome(true);
    }
  }, [profile?.id, profile?.first_login_completed, stats.profileCompleteness]);

  const handleDismissFirstLoginWelcome = async () => {
    if (profile?.id) {
      // Marcar que el usuario ya vio el mensaje de bienvenida
      await supabase
        .from('profiles')
        .update({ first_login_completed: true })
        .eq('id', profile.id);
    }
    setShowFirstLoginWelcome(false);
  };

  // useEffect para manejar la tarjeta de perfil completo al 100%
  React.useEffect(() => {
    // Verificar si el perfil está completo
    if (stats.profileCompleteness === 100) {
      // Verificar localStorage para ver si ya se mostró la tarjeta
      const cardDismissed = localStorage.getItem('profile_complete_card_dismissed');

      if (cardDismissed === 'true') {
        // Si ya se descartó, no mostrar la tarjeta
        setShowProfileCompleteCard(false);
        return;
      }

      // Si es la primera vez que se completa, mostrar la tarjeta
      setShowProfileCompleteCard(true);
      setIsCardFadingOut(false);

      // Después de 3 segundos, iniciar la animación de fade out
      const fadeTimer = setTimeout(() => {
        setIsCardFadingOut(true);
      }, 3000);

      // Después de 3.5 segundos (3s + 0.5s de animación), ocultar completamente y guardar en localStorage
      const hideTimer = setTimeout(() => {
        setShowProfileCompleteCard(false);
        localStorage.setItem('profile_complete_card_dismissed', 'true');
      }, 3500);

      // Cleanup
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [stats.profileCompleteness]);

  // Check for completed tasks
  React.useEffect(() => {
    // ✅ Solo mostrar notificaciones si realmente cambió (no al cargar)
    // Evitar notificaciones falsas cuando se cargan datos desde 0
    const hasInitialData = previousStats.experienceCount > 0 || previousStats.skillsCount > 0;

    if (hasInitialData) {
      // Experience completed
      if (previousStats.experienceCount < 3 && stats.experienceCount >= 3) {
        showNotification('¡Excelente! Has agregado 3 experiencias laborales ✓');
      }

      // Skills completed
      if (previousStats.skillsCount < 5 && stats.skillsCount >= 5) {
        showNotification('¡Perfecto! Has agregado 5 habilidades clave ✓');
      }
    }

    setPreviousStats(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.experienceCount, stats.skillsCount]);

  const showNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Dashboard Tour - Solo para usuarios con perfil completo */}
        {showTour && stats.profileCompleteness === 100 && (
          <DashboardTour
            onComplete={completeTour}
            onSkip={skipTour}
            isMobileMenuOpen={isMobileMenuOpen}
            onOpenMobileMenu={onOpenMobileMenu}
            userGender={profile?.gender}
          />
        )}

        {/* Success Notification */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] border border-green-400">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{notification.message}</p>
                <p className="text-xs text-green-100 mt-0.5">Todo está en orden</p>
              </div>
            </div>
          </div>
        )}

        {/* Header with gradient accent */}
        <div className="mb-8" data-tour="welcome">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {profile?.first_login_completed === false
                ? t.modernView.welcomeFirstLogin(
                    profile?.full_name?.trim() && !profile.full_name.includes('@') ? profile.full_name.split(' ')[0] : undefined,
                    profile?.gender
                  )
                : (profile?.full_name?.trim() && !profile.full_name.includes('@')
                    ? t.welcome(profile.full_name, profile?.gender)
                    : t.modernView.welcomeNoName(profile?.gender))
              }
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-4">
            {profile?.first_login_completed === false
              ? t.newUserWelcome.startCreating
              : t.subtitle
            }
          </p>
        </div>

        {/* First Login Welcome Banner */}
        {showFirstLoginWelcome && (
          <FirstLoginWelcome
            onDismiss={handleDismissFirstLoginWelcome}
            profileCompleteness={stats.profileCompleteness}
            onSectionChange={onSectionChange}
            userGender={profile?.gender}
          />
        )}

        {/* ====== SIMPLIFIED DASHBOARD FOR NEW USERS (< 100%) ====== */}
        {stats.profileCompleteness < 100 ? (
          <div className="space-y-6">
            {/* Benefits/Features Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t.newUserWelcome.whatCanYouDo}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Feature 1 */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {t.modernView.features.professionalCVs}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t.modernView.features.professionalCVsDesc}
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {t.modernView.features.credentialVerification}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t.modernView.features.credentialVerificationDesc}
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {t.modernView.features.customURL}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t.modernView.features.customURLDesc}
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {t.modernView.features.realTimeAnalytics}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t.modernView.features.realTimeAnalyticsDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 shadow-lg border border-indigo-200 dark:border-indigo-700">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {`🚀 ${t.modernView.quickStartGuide.title}`}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t.modernView.quickStartGuide.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t.modernView.quickStartGuide.step1Title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {t.modernView.quickStartGuide.step1Desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t.modernView.quickStartGuide.step2Title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {t.modernView.quickStartGuide.step2Desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t.modernView.quickStartGuide.step3Title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {t.modernView.quickStartGuide.step3Desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t.modernView.quickStartGuide.step4Title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {t.modernView.quickStartGuide.step4Desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg border border-blue-300/50 dark:border-blue-700/50">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {`💡 ${t.modernView.quickStartGuide.tip}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t.modernView.statsPreview.profileViews}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t.modernView.statsPreview.verifiedStamps}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {t.quickSummary.today}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t.quickSummary.registrationDate}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ====== FULL DASHBOARD FOR COMPLETE PROFILES (100%) ====== */
          <div className="space-y-6">

        {/* Quick Actions Widget */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-border mb-8" data-tour="quick-actions">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.quickActions.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Update Profile */}
            <button
              onClick={() => onSectionChange('mi-perfil:identity')}
              className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 dark:hover:from-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">{t.quickActions.updateProfile}</span>
            </button>

            {/* Export CV */}
            <button
              onClick={() => shouldBlockSections ? handleBlockedAction() : onSectionChange('exportar')}
              className={`flex flex-col items-center gap-3 p-4 bg-gradient-to-br rounded-xl border transition-all group relative ${
                shouldBlockSections
                  ? 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700 opacity-50'
                  : 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 dark:hover:from-green-900/30 border-green-200 dark:border-green-800 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform ${
                shouldBlockSections
                  ? 'bg-gray-400 dark:bg-gray-600'
                  : 'bg-green-600 dark:bg-green-500 group-hover:scale-110'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className={`text-sm font-semibold text-center ${
                shouldBlockSections ? 'text-gray-500 dark:text-gray-600' : 'text-gray-900 dark:text-white'
              }`}>{t.quickActions.exportCV}</span>
              {shouldBlockSections && (
                <svg className="w-4 h-4 absolute top-2 right-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>

            {/* Share CV */}
            <button
              onClick={() => shouldBlockSections ? handleBlockedAction() : onSectionChange('compartir')}
              className={`flex flex-col items-center gap-3 p-4 bg-gradient-to-br rounded-xl border transition-all group relative ${
                shouldBlockSections
                  ? 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700 opacity-50'
                  : 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 dark:hover:from-purple-900/30 border-purple-200 dark:border-purple-800 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform ${
                shouldBlockSections
                  ? 'bg-gray-400 dark:bg-gray-600'
                  : 'bg-purple-600 dark:bg-purple-500 group-hover:scale-110'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <span className={`text-sm font-semibold text-center ${
                shouldBlockSections ? 'text-gray-500 dark:text-gray-600' : 'text-gray-900 dark:text-white'
              }`}>{t.quickActions.shareCV}</span>
              {shouldBlockSections && (
                <svg className="w-4 h-4 absolute top-2 right-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>

            {/* View Analytics */}
            <button
              onClick={() => shouldBlockSections ? handleBlockedAction() : onSectionChange('analitica')}
              className={`flex flex-col items-center gap-3 p-4 bg-gradient-to-br rounded-xl border transition-all group relative ${
                shouldBlockSections
                  ? 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700 opacity-50'
                  : 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:from-orange-100 dark:hover:from-orange-900/30 border-orange-200 dark:border-orange-800 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform ${
                shouldBlockSections
                  ? 'bg-gray-400 dark:bg-gray-600'
                  : 'bg-orange-600 dark:bg-orange-500 group-hover:scale-110'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className={`text-sm font-semibold text-center ${
                shouldBlockSections ? 'text-gray-500 dark:text-gray-600' : 'text-gray-900 dark:text-white'
              }`}>{t.quickActions.analytics}</span>
              {shouldBlockSections && (
                <svg className="w-4 h-4 absolute top-2 right-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Usage Stats Widget */}
        <Suspense fallback={
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-6 mb-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        }>
          <div className="mb-6">
            <UsageStatsWidget />
          </div>
        </Suspense>

        {/* Stats Grid - Only shown for complete profiles */}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-tour="stats">
          <StatCard
            title={t.stats.profileVisits}
            value={stats.visits}
            subtitle={t.stats.last30Days}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />

          <StatCard
            title={t.stats.ctaClicks}
            value={stats.ctaClicks}
            subtitle={t.stats.totalAccumulated}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            }
          />

          <StatCard
            title={t.stats.experiences}
            value={stats.experienceCount}
            subtitle={t.stats.registered}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <StatCard
            title={t.stats.skills}
            value={stats.skillsCount}
            subtitle={t.stats.added}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />
        </div>


        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Analytics Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-gray-300 dark:border-gray-600 shadow-lg" data-tour="chart">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.weeklyVisits.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {chartType === 'calendar'
                      ? t.weeklyVisits.monthlyView
                      : t.weeklyVisits.last7Days
                    }
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Chart Type Toggle */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setChartType('calendar')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        chartType === 'calendar'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={t.weeklyVisits.calendarView}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        chartType === 'bar'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={t.modernView.chartTitles.barChart}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setChartType('pie')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        chartType === 'pie'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={t.modernView.chartTitles.pieChart}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </button>
                  </div>
                  {chartType !== 'calendar' && (
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalVisitsDisplay}</p>
                      {totalVisitsDisplay > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          {t.weeklyVisits.active}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bar Chart */}
              {chartType === 'bar' && (
                <div className="h-56 flex items-end justify-between gap-3 px-2">
                  {weeklyData.map((value, i) => {
                    const maxValue = Math.max(...weeklyData, 1);
                    const heightPercent = (value / maxValue) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                        <div className="relative w-full">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer relative"
                            style={{ height: `${Math.max(heightPercent * 1.8, 20)}px` }}
                          >
                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {value} {t.weeklyVisits.visits}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {[t.weeklyVisits.days.mon, t.weeklyVisits.days.tue, t.weeklyVisits.days.wed, t.weeklyVisits.days.thu, t.weeklyVisits.days.fri, t.weeklyVisits.days.sat, t.weeklyVisits.days.sun][i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pie Chart */}
              {chartType === 'pie' && (
                <div className="h-56 flex items-center justify-center gap-8">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {weeklyData.map((value, i) => {
                        const total = weeklyData.reduce((a, b) => a + b, 0) || 1;
                        const percentage = (value / total) * 100;
                        const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#C026D3', '#DB2777', '#F43F5E'];

                        let cumulativePercent = 0;
                        for (let j = 0; j < i; j++) {
                          cumulativePercent += (weeklyData[j] / total) * 100;
                        }

                        const startAngle = (cumulativePercent / 100) * 360;
                        const endAngle = ((cumulativePercent + percentage) / 100) * 360;

                        const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                        const largeArc = percentage > 50 ? 1 : 0;

                        return value > 0 ? (
                          <path
                            key={i}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={colors[i]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ) : null;
                      })}
                      <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-800" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.visits}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.weeklyVisits.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[t.weeklyVisits.days.mon, t.weeklyVisits.days.tue, t.weeklyVisits.days.wed, t.weeklyVisits.days.thu, t.weeklyVisits.days.fri, t.weeklyVisits.days.sat, t.weeklyVisits.days.sun].map((day, i) => {
                      const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#C026D3', '#DB2777', '#F43F5E'];
                      return weeklyData[i] > 0 ? (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }}></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white ml-auto">{weeklyData[i]}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Calendar View */}
              {chartType === 'calendar' && (
                <CalendarView
                  visitsData={visitsData}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={(month, year) => {
                    setSelectedMonth(month);
                    setSelectedYear(year);
                  }}
                  lang={lang}
                />
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-300 dark:border-gray-600 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.recentActivity.title}
              </h3>
              <div className="space-y-3">
                {stats.visits > 0 && (
                  <ActivityItem
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    title={t.recentActivity.profileVisits(stats.visits)}
                    time={t.recentActivity.last7Days}
                    color="blue"
                  />
                )}
                {stats.ctaClicks > 0 && (
                  <ActivityItem
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
                    title={t.recentActivity.ctaClicks(stats.ctaClicks)}
                    time={t.recentActivity.totalAccumulated}
                    color="green"
                  />
                )}
                {profile?.updated_at && (
                  <ActivityItem
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                    title={t.recentActivity.profileUpdated}
                    time={new Date(profile.updated_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })}
                    color="purple"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Quality Score - AI Powered - Solo se muestra cuando el tour ha sido completado Y el perfil está al 100% */}
            {hasTourBeenCompleted && stats.profileCompleteness === 100 && (
              <Suspense fallback={
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              }>
                <div data-tour="quality-score">
                  <ProfileQualityScore
                    experiences={experiences}
                    education={education}
                    skills={skills}
                    visas={visas}
                    languages={languages}
                    certifications={certifications}
                    experienceCount={stats.experienceCount}
                    educationCount={stats.educationCount}
                    skillsCount={stats.skillsCount}
                    certificationsCount={stats.verifiedStamps}
                    onNavigateToSection={(sectionId) => {
                      // Special sections that don't need 'mi-perfil:' prefix
                      const directSections = ['visas', 'stamps', 'analitica'];
                      if (directSections.includes(sectionId)) {
                        onSectionChange(sectionId);
                      } else {
                        onSectionChange(`mi-perfil:${sectionId}`);
                      }
                    }}
                  />
                </div>
              </Suspense>
            )}

          </div>
          </div>
          </div>
        )}
        {/* Fin del renderizado condicional */}

      </div>
    </div>
  );
});

// Activity Item Component
const ActivityItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  time: string;
  color: string;
}> = memo(({ icon, title, time, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }[color];

  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-300">{time}</p>
      </div>
    </div>
  );
});

// Profile Strength Item
const ProfileStrengthItem: React.FC<{
  label: string;
  completed: boolean;
}> = memo(({ label, completed }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    {completed ? (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
    )}
  </div>
));

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}> = memo(({ title, value, subtitle, icon }) => (
  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
        {icon}
      </div>
    </div>
    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1.5 tracking-tight">{value}</p>
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">{title}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
  </div>
));

// Quick Action Card Component
const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  isBlocked?: boolean;
}> = memo(({ title, description, icon, onClick, isBlocked = false }) => (
  <button
    onClick={onClick}
    className={`rounded-xl p-5 border-2 transition-all duration-300 text-left group relative overflow-hidden ${
      isBlocked
        ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700 opacity-50'
        : 'bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl'
    }`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-300 ${
      isBlocked ? 'from-gray-500/0 to-gray-500/0' : 'from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5'
    }`}></div>
    <div className="relative flex items-start gap-3.5">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white transition-all duration-300 flex-shrink-0 shadow-md ${
        isBlocked
          ? 'bg-gray-400 dark:bg-gray-600'
          : 'bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 group-hover:scale-110 group-hover:rotate-6'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className={`text-base font-bold mb-1 transition-colors ${
          isBlocked
            ? 'text-gray-500 dark:text-gray-600'
            : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
        }`}>{title}</h3>
        <p className={`text-sm ${
          isBlocked ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'
        }`}>{description}</p>
      </div>
      {isBlocked ? (
        <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  </button>
));

// Calendar View Component
interface CalendarViewProps {
  visitsData: { name: string; visits: number }[];
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  lang: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  visitsData,
  selectedMonth,
  selectedYear,
  onMonthChange,
  lang,
}) => {
  const translations = useTranslations();
  const t = translations.dashboard;
  const currentDate = new Date();
  const monthNames = t.modernView.calendar.monthNames;
  const dayNames = t.modernView.calendar.dayNames;

  // Generate calendar data
  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Create a map of dates to visits
  const viewsMap = new Map<string, number>();
  const hasRealData = visitsData && visitsData.length > 0;

  if (hasRealData) {
    // Use real data
    visitsData.forEach(({ name, visits }) => {
      const dateObj = new Date(name);
      if (dateObj.getMonth() === selectedMonth && dateObj.getFullYear() === selectedYear) {
        viewsMap.set(name, visits);
      }
    });
  } else {
    // Generate demo data for current month only
    const today = new Date();
    if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth()) {
      // Generate some random visits for demo purposes (last 2 weeks)
      const demoVisits = [
        { day: today.getDate(), visits: Math.floor(Math.random() * 5) + 1 }, // Today
        { day: today.getDate() - 1, visits: Math.floor(Math.random() * 8) + 2 },
        { day: today.getDate() - 2, visits: Math.floor(Math.random() * 6) + 1 },
        { day: today.getDate() - 3, visits: Math.floor(Math.random() * 4) + 1 },
        { day: today.getDate() - 5, visits: Math.floor(Math.random() * 7) + 2 },
        { day: today.getDate() - 7, visits: Math.floor(Math.random() * 10) + 3 },
        { day: today.getDate() - 9, visits: Math.floor(Math.random() * 5) + 1 },
        { day: today.getDate() - 12, visits: Math.floor(Math.random() * 8) + 2 },
      ];

      demoVisits.forEach(({ day, visits }) => {
        if (day > 0 && day <= daysInMonth) {
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          viewsMap.set(dateStr, visits);
        }
      });
    }
  }

  const maxViews = Math.max(...Array.from(viewsMap.values()), 1);
  const totalViews = Array.from(viewsMap.values()).reduce((sum, views) => sum + views, 0);

  // Get intensity color based on views
  const getIntensityColor = (views: number) => {
    if (views === 0) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    const intensity = views / maxViews;
    if (intensity < 0.25) return 'bg-blue-200 dark:bg-blue-900 border-blue-300 dark:border-blue-800';
    if (intensity < 0.5) return 'bg-blue-400 dark:bg-blue-700 border-blue-500 dark:border-blue-600';
    if (intensity < 0.75) return 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500';
    return 'bg-blue-600 dark:bg-blue-500 border-blue-700 dark:border-blue-400';
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      onMonthChange(11, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onMonthChange(0, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  const isNextDisabled = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();

  return (
    <div className="space-y-3">
      {/* Month/Year Selector */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
          title={t.modernView.calendar.previousMonth}
        >
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h4 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {monthNames[selectedMonth]} {selectedYear}
          </h4>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></div>
            <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              {totalViews} {t.modernView.calendar.visits}
            </p>
          </div>
        </div>

        <button
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className={`p-2 rounded-lg transition-all duration-200 group ${
            isNextDisabled
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
          title={t.modernView.calendar.nextMonth}
        >
          <svg className={`w-4 h-4 transition-colors ${
            isNextDisabled
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-7 gap-1.5">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 pb-1">
              {day}
            </div>
          ))}

          {/* Empty cells before first day of month */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const views = viewsMap.get(dateStr) || 0;
            const isToday = day === currentDate.getDate() &&
                          selectedMonth === currentDate.getMonth() &&
                          selectedYear === currentDate.getFullYear();

            return (
              <div
                key={day}
                className={`aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md border-2 relative group ${
                  getIntensityColor(views)
                } ${isToday ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400 shadow-lg' : ''}`}
                title={`${day} ${monthNames[selectedMonth]}: ${views} ${t.modernView.calendar.visits}`}
              >
                <span className={`text-[10px] font-bold ${views > 0 ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {day}
                </span>
                {views > 0 && (
                  <span className="text-[8px] text-white/90 font-extrabold mt-0.5">
                    {views}
                  </span>
                )}
                {/* Hover tooltip */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                  {views} {t.modernView.calendar.visits}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 px-2">
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{t.weeklyVisits.less}</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 transition-transform hover:scale-125 cursor-pointer" title="0" />
          <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-800 transition-transform hover:scale-125 cursor-pointer" title="1-25%" />
          <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-700 border-2 border-blue-500 dark:border-blue-600 transition-transform hover:scale-125 cursor-pointer" title="26-50%" />
          <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-600 border-2 border-blue-600 dark:border-blue-500 transition-transform hover:scale-125 cursor-pointer" title="51-75%" />
          <div className="w-3 h-3 rounded-sm bg-blue-600 dark:bg-blue-500 border-2 border-blue-700 dark:border-blue-400 transition-transform hover:scale-125 cursor-pointer" title="76-100%" />
        </div>
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{t.weeklyVisits.more}</span>
      </div>
    </div>
  );
};

export default memo(ModernDashboardView);
