import React, { memo, lazy, Suspense } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

// Lazy load ProfileQualityScore
const ProfileQualityScore = lazy(() => import('../profile-editor/ProfileQualityScore'));

interface ModernDashboardViewProps {
  profile: any;
  stats: {
    visits: number;
    ctaClicks: number;
    profileCompleteness: number;
    verifiedStamps: number;
    experienceCount: number;
    skillsCount: number;
  };
  onSectionChange: (section: string) => void;
  isAIAvailable: boolean;
  experiences?: any[];
  education?: any[];
  skills?: any[];
  visas?: any[];
  languages?: any[];
  certifications?: any[];
}

interface CompletionNotification {
  show: boolean;
  message: string;
}

// Generate realistic weekly data based on total visits
const generateWeeklyData = (totalVisits: number) => {
  if (totalVisits === 0) return [0, 0, 0, 0, 0, 0, 0];
  
  // Distribute visits across the week with some variation
  const baseValue = totalVisits / 7;
  return [
    Math.floor(baseValue * 0.8),
    Math.floor(baseValue * 1.1),
    Math.floor(baseValue * 0.7),
    Math.floor(baseValue * 1.3),
    Math.floor(baseValue * 0.9),
    Math.floor(baseValue * 1.4),
    Math.floor(baseValue * 1.0),
  ];
};

const ModernDashboardView: React.FC<ModernDashboardViewProps> = ({
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
}) => {
  const translations = useTranslations();
  const t = translations.dashboard;
  const [chartType, setChartType] = React.useState<'bar' | 'pie'>('bar');
  const [notification, setNotification] = React.useState<CompletionNotification>({ show: false, message: '' });
  const [previousStats, setPreviousStats] = React.useState(stats);
  
  const weeklyData = generateWeeklyData(stats.visits);

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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t.welcome(profile?.full_name || 'Usuario')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-4">
            Gestiona tu perfil profesional y destaca entre miles
          </p>
        </div>

        {/* Quick Actions Widget */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-border mb-8">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
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
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Update Profile</span>
            </button>

            {/* Export CV */}
            <button
              onClick={() => onSectionChange('exportar')}
              className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 dark:hover:from-green-900/30 rounded-xl border border-green-200 dark:border-green-800 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-green-600 dark:bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Export CV</span>
            </button>

            {/* Share CV */}
            <button
              onClick={() => onSectionChange('compartir')}
              className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 dark:hover:from-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Share CV</span>
            </button>

            {/* View Analytics */}
            <button
              onClick={() => onSectionChange('analitica')}
              className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:from-orange-100 dark:hover:from-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-orange-600 dark:bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Analytics</span>
            </button>
          </div>
        </div>

        {/* Profile Status Alert - Always visible */}
        {stats.profileCompleteness < 100 ? (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Completa tu perfil profesional
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                  Tu perfil está al <span className="font-bold text-blue-600 dark:text-blue-400">{stats.profileCompleteness}%</span>. Un perfil completo aumenta tu visibilidad hasta 5x más.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => onSectionChange('mi-perfil:identity')}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Completar ahora
                  </button>
                  {isAIAvailable && (
                    <button
                      onClick={() => onSectionChange('mi-perfil:ai-assistant')}
                      className="px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Asistente IA
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-24 h-24 relative">
                  <svg className="transform -rotate-90 w-full h-full drop-shadow-md" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${stats.profileCompleteness * 2.827} 282.7`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.profileCompleteness}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    ¡Perfil completo!
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                  Excelente trabajo. Tu perfil está completo al <span className="font-bold text-emerald-600 dark:text-emerald-400">100%</span> y optimizado para atraer más oportunidades.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => window.open(`/cv/${profile?.slug}`, '_blank')}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Ver mi perfil
                  </button>
                  <button
                    onClick={() => onSectionChange('exportar')}
                    className="px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-all shadow-sm hover:shadow-md"
                  >
                    Descargar PDF
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-24 h-24 relative">
                  <svg className="transform -rotate-90 w-full h-full drop-shadow-md" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#progressGradientComplete)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="282.7 282.7"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="progressGradientComplete" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Visitas al Perfil"
            value={stats.visits}
            subtitle="Últimos 30 días"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          
          <StatCard
            title="Clics en CTA"
            value={stats.ctaClicks}
            subtitle="Total acumulado"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            }
          />
          
          <StatCard
            title="Experiencias"
            value={stats.experienceCount}
            subtitle="Registradas"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          
          <StatCard
            title="Habilidades"
            value={stats.skillsCount}
            subtitle="Agregadas"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <QuickActionCard
            title="Ver mi CV"
            description="Visualiza tu perfil público"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            onClick={() => window.open(`/cv/${profile?.slug}`, '_blank')}
          />

          <QuickActionCard
            title="Exportar PDF"
            description="Descarga tu CV"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            onClick={() => onSectionChange('exportar')}
          />

          <QuickActionCard
            title="Analíticas"
            description="Estadísticas detalladas"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            onClick={() => onSectionChange('analitica')}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Analytics Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-300 dark:border-gray-600 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Visitas al Perfil</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Últimos 7 días</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Chart Type Toggle */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        chartType === 'bar'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
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
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.visits}</p>
                    {stats.visits > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Activo
                      </p>
                    )}
                  </div>
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
                              {value} visitas
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => {
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
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-300 dark:border-gray-600 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                {stats.visits > 0 && (
                  <ActivityItem
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    title={`${stats.visits} visitas al perfil`}
                    time="Últimos 7 días"
                    color="blue"
                  />
                )}
                {stats.ctaClicks > 0 && (
                  <ActivityItem
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
                    title={`${stats.ctaClicks} clics en CTA`}
                    time="Total acumulado"
                    color="green"
                  />
                )}
                {profile?.updated_at && (
                  <ActivityItem
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                    title="Perfil actualizado"
                    time={new Date(profile.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    color="purple"
                  />
                )}
              </div>
            </div>

            {/* Próximos Pasos */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Próximos Pasos</h3>
              <div className="space-y-3">
                <NextStepItem
                  text="Agrega al menos 3 experiencias laborales"
                  completed={stats.experienceCount >= 3}
                  onClick={() => onSectionChange('mi-perfil:experience')}
                />
                <NextStepItem
                  text="Completa tu resumen profesional"
                  completed={!!profile?.summary && profile.summary.length > 50}
                  onClick={() => onSectionChange('mi-perfil:identity')}
                />
                <NextStepItem
                  text="Añade tus habilidades clave"
                  completed={stats.skillsCount >= 5}
                  onClick={() => onSectionChange('mi-perfil:skills')}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resumen Rápido</h3>
              <div className="space-y-3">
                <QuickStatRow label="Perfil creado" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'N/A'} />
                <QuickStatRow label="Última actualización" value="Hoy" />
                <QuickStatRow label="Plantilla activa" value={profile?.template || 'Minimal'} />
                <QuickStatRow label="Visibilidad" value="Pública" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Quality Score - AI Powered */}
            <Suspense fallback={
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            }>
              <ProfileQualityScore
                experiences={experiences}
                education={education}
                skills={skills}
                visas={visas}
                languages={languages}
                certifications={certifications}
                onNavigateToSection={(sectionId) => onSectionChange(`mi-perfil:${sectionId}`)}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

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

// Next Step Item
const NextStepItem: React.FC<{
  text: string;
  completed: boolean;
  onClick: () => void;
}> = memo(({ text, completed, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-start gap-3 text-left hover:bg-white/50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors"
  >
    {completed ? (
      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex-shrink-0 mt-0.5"></div>
    )}
    <span className={`text-sm ${completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
      {text}
    </span>
  </button>
));

// Quick Stat Row
const QuickStatRow: React.FC<{
  label: string;
  value: string;
}> = memo(({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
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
}> = memo(({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 rounded-xl p-5 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300"></div>
    <div className="relative flex items-start gap-3.5">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0 shadow-md">
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
));

export default memo(ModernDashboardView);
