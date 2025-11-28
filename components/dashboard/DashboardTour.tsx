import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

interface DashboardTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const DashboardTour: React.FC<DashboardTourProps> = ({ onComplete, onSkip }) => {
  const { lang } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const tourSteps: Record<string, TourStep[]> = {
    es: [
      {
        target: '[data-tour="welcome"]',
        title: '¡Bienvenido a tu Dashboard!',
        content: 'Este es tu panel principal donde puedes ver todas las estadísticas y accesos rápidos a las funciones más importantes.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="quick-actions"]',
        title: 'Acciones Rápidas',
        content: 'Aquí puedes acceder rápidamente a las funciones más usadas: actualizar perfil, exportar CV, compartir y ver analíticas.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="profile-completion"]',
        title: 'Completitud del Perfil',
        content: 'Este indicador te muestra qué tan completo está tu perfil. Un perfil 100% completo aumenta tu visibilidad y oportunidades.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="stats"]',
        title: 'Estadísticas en Tiempo Real',
        content: 'Visualiza las visitas a tu perfil, clics en tus botones de acción, experiencias registradas y habilidades agregadas.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="chart"]',
        title: 'Gráfico de Visitas Semanales',
        content: 'Monitorea las visitas a tu perfil durante los últimos 7 días. Puedes cambiar entre vista de barras y gráfico circular.',
        placement: 'top',
      },
      {
        target: '[data-tour="next-steps"]',
        title: 'Próximos Pasos',
        content: 'Sigue esta lista de tareas para mejorar tu perfil. Cada tarea completada aumenta tu puntuación de calidad.',
        placement: 'top',
      },
      {
        target: '[data-tour="quality-score"]',
        title: 'Puntuación de Calidad',
        content: 'Nuestra IA analiza tu perfil y te da recomendaciones personalizadas para mejorarlo. Sigue los consejos para destacar.',
        placement: 'left',
      },
      {
        target: '[data-tour="sidebar-mi-perfil"]',
        title: '👤 Mi Perfil',
        content: 'Edita toda tu información personal: datos básicos, experiencia laboral, educación, habilidades, idiomas, certificaciones y más. Aquí construyes tu CV profesional completo.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-template"]',
        title: '🎨 Template',
        content: 'Elige entre diferentes diseños profesionales para tu CV. Cambia colores, estilos y formatos. Cada template está optimizado para diferentes industrias y perfiles profesionales.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ver-cv"]',
        title: '👁️ Ver mi CV',
        content: 'Visualiza cómo se ve tu CV público. Esta es la vista que verán los reclutadores y empresas cuando accedan a tu perfil. Comprueba que todo se vea perfecto antes de compartirlo.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-visas"]',
        title: '📄 Visas',
        content: 'Gestiona tus permisos de trabajo y visas. Agrega información sobre tu situación migratoria, permisos de trabajo en diferentes países y fechas de validez. Esto ayuda a los reclutadores internacionales.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-exportar"]',
        title: '⬇️ Exportar',
        content: 'Descarga tu CV en formato PDF profesional. Puedes elegir diferentes estilos de exportación y el PDF estará listo para enviar por email o imprimir.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-compartir"]',
        title: '🔗 Compartir',
        content: 'Comparte tu CV con empresas y reclutadores. Genera un enlace público único, comparte en redes sociales o envía por email. También puedes crear tu tarjeta de presentación digital.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-analitica"]',
        title: '📊 Analítica',
        content: 'Estadísticas detalladas sobre tu perfil: quién visitó tu CV, de qué países, qué secciones vieron más, clics en tus botones de contacto y tendencias semanales. Datos valiosos para mejorar tu perfil.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-leads"]',
        title: '👥 Leads',
        content: 'Gestiona los contactos que te escriben. Aquí llegan los mensajes de reclutadores, empresas interesadas y contactos profesionales. Organiza tus conversaciones y oportunidades laborales.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-stamps"]',
        title: '🛡️ Verificaciones',
        content: 'Obtén sellos de verificación para tu perfil. Verifica tu email y redes sociales. Los perfiles verificados generan más confianza y reciben hasta 3x más visitas de reclutadores.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ajustes"]',
        title: '⚙️ Ajustes',
        content: 'Configura tu cuenta: privacidad del perfil, notificaciones, preferencias de idioma, integración con redes sociales y configuración de seguridad. Personaliza tu experiencia.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ayuda"]',
        title: '❓ Ayuda',
        content: '¡Has completado el tour! 🎉 Si tienes dudas, aquí encuentras tutoriales, preguntas frecuentes, contacto con soporte y recursos para sacar el máximo provecho de la plataforma. ¡Éxito en tu búsqueda laboral!',
        placement: 'right',
      },
    ],
    en: [
      {
        target: '[data-tour="welcome"]',
        title: 'Welcome to your Dashboard!',
        content: 'This is your main panel where you can see all statistics and quick access to the most important features.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="quick-actions"]',
        title: 'Quick Actions',
        content: 'Here you can quickly access the most used features: update profile, export CV, share and view analytics.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="profile-completion"]',
        title: 'Profile Completion',
        content: 'This indicator shows how complete your profile is. A 100% complete profile increases your visibility and opportunities.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="stats"]',
        title: 'Real-Time Statistics',
        content: 'View visits to your profile, clicks on your action buttons, registered experiences and added skills.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="chart"]',
        title: 'Weekly Visits Chart',
        content: 'Monitor visits to your profile over the last 7 days. You can switch between bar view and pie chart.',
        placement: 'top',
      },
      {
        target: '[data-tour="next-steps"]',
        title: 'Next Steps',
        content: 'Follow this task list to improve your profile. Each completed task increases your quality score.',
        placement: 'top',
      },
      {
        target: '[data-tour="quality-score"]',
        title: 'Quality Score',
        content: 'Our AI analyzes your profile and gives you personalized recommendations to improve it. Follow the tips to stand out.',
        placement: 'left',
      },
      {
        target: '[data-tour="sidebar-mi-perfil"]',
        title: '👤 My Profile',
        content: 'Edit all your personal information: basic data, work experience, education, skills, languages, certifications and more. Here you build your complete professional CV.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-template"]',
        title: '🎨 Template',
        content: 'Choose from different professional designs for your CV. Change colors, styles and formats. Each template is optimized for different industries and professional profiles.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ver-cv"]',
        title: '👁️ View my CV',
        content: 'Visualize how your public CV looks. This is the view that recruiters and companies will see when accessing your profile. Make sure everything looks perfect before sharing.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-visas"]',
        title: '📄 Visas',
        content: 'Manage your work permits and visas. Add information about your immigration status, work permits in different countries and expiration dates. This helps international recruiters.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-exportar"]',
        title: '⬇️ Export',
        content: 'Download your CV in professional PDF format. You can choose different export styles and the PDF will be ready to send by email or print.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-compartir"]',
        title: '🔗 Share',
        content: 'Share your CV with companies and recruiters. Generate a unique public link, share on social media or send by email. You can also create your digital business card.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-analitica"]',
        title: '📊 Analytics',
        content: 'Detailed statistics about your profile: who visited your CV, from which countries, which sections they viewed most, clicks on your contact buttons and weekly trends. Valuable data to improve your profile.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-leads"]',
        title: '👥 Leads',
        content: 'Manage contacts who write to you. Here you receive messages from recruiters, interested companies and professional contacts. Organize your conversations and job opportunities.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-stamps"]',
        title: '🛡️ Verifications',
        content: 'Get verification badges for your profile. Verify your email and social media. Verified profiles generate more trust and receive up to 3x more visits from recruiters.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ajustes"]',
        title: '⚙️ Settings',
        content: 'Configure your account: profile privacy, notifications, language preferences, social media integration and security settings. Customize your experience.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ayuda"]',
        title: '❓ Help',
        content: 'You\'ve completed the tour! 🎉 If you have questions, here you\'ll find tutorials, FAQs, support contact and resources to get the most out of the platform. Good luck with your job search!',
        placement: 'right',
      },
    ],
  };

  const steps = tourSteps[lang] || tourSteps.es;

  useEffect(() => {
    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition);
    };
  }, [currentStep]);

  const updateTooltipPosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    // Si es un elemento del sidebar, hacer scroll para que sea visible
    if (step.target.includes('sidebar-')) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 240;
    const offset = 24;

    let top = 0;
    let left = 0;
    let placement = step.placement;

    // Para elementos del sidebar, siempre colocar a la derecha
    if (step.target.includes('sidebar-')) {
      placement = 'right';
    }

    switch (placement) {
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowPosition('top');
        break;
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowPosition('bottom');
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
        setArrowPosition('right');
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
        setArrowPosition('left');
        break;
    }

    // Ajustar si sale de pantalla
    const margin = 16;
    if (left < margin) {
      left = margin;
    }
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    if (top < margin) {
      top = margin;
    }
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tooltipHeight - margin;
    }

    setTooltipPosition({ top, left });

    // Add highlight to target element
    targetElement.classList.add('tour-highlight');

    // Remove highlight from all other elements
    document.querySelectorAll('.tour-highlight').forEach((el) => {
      if (el !== targetElement) {
        el.classList.remove('tour-highlight');
      }
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    document.querySelectorAll('.tour-highlight').forEach((el) => {
      el.classList.remove('tour-highlight');
    });
    onComplete();
  };

  const handleSkipTour = () => {
    document.querySelectorAll('.tour-highlight').forEach((el) => {
      el.classList.remove('tour-highlight');
    });
    onSkip();
  };

  const step = steps[currentStep];
  if (!step) return null;

  // Determinar si estamos en pasos del sidebar (8-18) o dashboard (1-7)
  const isSidebarStep = currentStep >= 7; // Steps 8-18 son sidebar (index 7-17)

  return (
    <>
      {/* Overlay - Bloqueante (no hace nada al hacer clic) */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // No hacer nada - el overlay bloquea los clics
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[10000] w-[360px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-blue-500 dark:border-blue-400 transition-all duration-300 animate-fadeIn"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Arrow pointing to highlighted element */}
        <div
          className={`absolute w-0 h-0 ${
            arrowPosition === 'top'
              ? '-top-3 left-1/2 -translate-x-1/2 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-blue-500 dark:border-b-blue-400'
              : arrowPosition === 'bottom'
              ? '-bottom-3 left-1/2 -translate-x-1/2 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-blue-500 dark:border-t-blue-400'
              : arrowPosition === 'left'
              ? '-left-3 top-1/2 -translate-y-1/2 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-blue-500 dark:border-r-blue-400'
              : '-right-3 top-1/2 -translate-y-1/2 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[12px] border-l-blue-500 dark:border-l-blue-400'
          }`}
        />

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {currentStep + 1}
                </div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {currentStep + 1} / {steps.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {step.title}
              </h3>
            </div>
            <button
              onClick={handleSkipTour}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors hover:scale-110"
              title={lang === 'en' ? 'Close tour' : 'Cerrar tutorial'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {step.content}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkipTour}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {lang === 'en' ? 'Skip Tour' : 'Saltar Tutorial'}
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                >
                  {lang === 'en' ? 'Back' : 'Atrás'}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                {currentStep === steps.length - 1
                  ? lang === 'en'
                    ? 'Finish'
                    : 'Finalizar'
                  : lang === 'en'
                  ? 'Next'
                  : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles for Tour Highlight */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 10001 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.9),
                      0 0 0 9999px rgba(0, 0, 0, 0) !important;
          border-radius: 8px;
          pointer-events: auto !important;
          background: inherit !important;
        }

        ${isSidebarStep ? `
          /* En pasos del sidebar: elevar z-index del sidebar */
          body:has(.tour-highlight) nav {
            position: relative;
            z-index: 10000 !important;
          }

          body:has(.tour-highlight) [data-tour="sidebar"] {
            z-index: 10000 !important;
          }
        ` : `
          /* En pasos del dashboard: BLOQUEAR sidebar (visible pero no clickeable) */
          body:has(.tour-highlight) [data-tour="sidebar"] {
            opacity: 0.3 !important;
            pointer-events: none !important;
            filter: grayscale(100%) !important;
          }
        `}

        /* Bloquear TODAS las interacciones excepto el tooltip */
        body:has(.tour-highlight) * {
          pointer-events: none !important;
        }

        /* SOLO permitir interacción con el tooltip (botones de navegación) */
        body:has(.tour-highlight) [class*="fixed"][class*="z-[10000]"],
        body:has(.tour-highlight) [class*="fixed"][class*="z-[10000]"] * {
          pointer-events: auto !important;
        }

        /* El elemento resaltado debe ser visible pero NO interactuable */
        body:has(.tour-highlight) .tour-highlight {
          pointer-events: none !important;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default DashboardTour;
