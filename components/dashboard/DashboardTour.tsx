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
        target: '[data-tour="stats"]',
        title: 'Estadísticas en Tiempo Real',
        content: 'Visualiza las visitas a tu perfil, clics en tus botones de acción, experiencias registradas y habilidades agregadas.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="chart"]',
        title: 'Gráfico de Visitas',
        content: 'Monitorea las visitas a tu perfil con diferentes vistas: calendario mensual, gráfico de barras o circular. Cambia entre vistas para analizar tus estadísticas.',
        placement: 'top',
      },
      {
        target: '[data-tour="sidebar-mi-perfil"]',
        title: '👤 Mi Perfil',
        content: 'Edita toda tu información personal: datos básicos, experiencia laboral, educación, habilidades, idiomas, certificaciones y más. Aquí construyes tu CV profesional completo.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ver-cv"]',
        title: '👁️ Ver mi CV',
        content: 'Visualiza cómo se ve tu CV público. Esta es la vista que verán los reclutadores y empresas cuando accedan a tu perfil. Comprueba que todo se vea perfecto antes de compartirlo.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-plantillas"]',
        title: '🎨 Plantillas',
        content: 'Elige entre diferentes diseños profesionales para tu CV. Cambia colores, estilos y formatos. Cada plantilla está optimizada para diferentes industrias y perfiles profesionales.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-stamps"]',
        title: '🛡️ Verificaciones',
        content: 'Obtén sellos de verificación para tu perfil. Verifica tu email y redes sociales. Los perfiles verificados generan más confianza y reciben hasta 3x más visitas de reclutadores.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-vacantes"]',
        title: '💼 Oportunidades',
        content: 'Busca ofertas de trabajo que coincidan con tu perfil. Explora vacantes de empresas verificadas, filtra por ubicación, salario y modalidad. Encuentra tu próxima oportunidad profesional.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-postulaciones"]',
        title: '📋 Mis Aplicaciones',
        content: 'Gestiona todas tus postulaciones en un solo lugar. Revisa el estado de tus aplicaciones, recibe notificaciones de empresas interesadas y da seguimiento a tus oportunidades.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-leads"]',
        title: '👥 Leads',
        content: 'Gestiona los contactos que te escriben. Aquí llegan los mensajes de reclutadores, empresas interesadas y contactos profesionales. Organiza tus conversaciones y oportunidades laborales.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-analitica"]',
        title: '📊 Analítica',
        content: 'Estadísticas detalladas sobre tu perfil: quién visitó tu CV, de qué países, qué secciones vieron más, clics en tus botones de contacto y tendencias semanales. Datos valiosos para mejorar tu perfil.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-visas"]',
        title: '📄 Visas',
        content: 'Gestiona tus permisos de trabajo y visas. Agrega información sobre tu situación migratoria, permisos de trabajo en diferentes países y fechas de validez. Esto ayuda a los reclutadores internacionales.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ajustes"]',
        title: '⚙️ Ajustes',
        content: 'Aquí configuras tu cuenta: privacidad del perfil, notificaciones, idioma y seguridad. Personaliza tu experiencia en YourCVPassport según tus preferencias.',
        placement: 'right',
      },
      {
        target: 'center',
        title: '¡Tour Completado! 🎉',
        content: '¡Felicitaciones! Has completado el tour del dashboard. Ahora conoces todas las herramientas disponibles para impulsar tu carrera profesional. ¡Mucho éxito en tu búsqueda laboral!',
        placement: 'center',
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
        target: '[data-tour="stats"]',
        title: 'Real-Time Statistics',
        content: 'View visits to your profile, clicks on your action buttons, registered experiences and added skills.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="chart"]',
        title: 'Visits Chart',
        content: 'Monitor your profile visits with different views: monthly calendar, bar chart or pie chart. Switch between views to analyze your statistics.',
        placement: 'top',
      },
      {
        target: '[data-tour="sidebar-mi-perfil"]',
        title: '👤 My Profile',
        content: 'Edit all your personal information: basic data, work experience, education, skills, languages, certifications and more. Here you build your complete professional CV.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ver-cv"]',
        title: '👁️ View my CV',
        content: 'Visualize how your public CV looks. This is the view that recruiters and companies will see when accessing your profile. Make sure everything looks perfect before sharing.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-plantillas"]',
        title: '🎨 Templates',
        content: 'Choose from different professional designs for your CV. Change colors, styles and formats. Each template is optimized for different industries and professional profiles.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-stamps"]',
        title: '🛡️ Verifications',
        content: 'Get verification badges for your profile. Verify your email and social media. Verified profiles generate more trust and receive up to 3x more visits from recruiters.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-vacantes"]',
        title: '💼 Opportunities',
        content: 'Search for job offers that match your profile. Explore positions from verified companies, filter by location, salary and work mode. Find your next professional opportunity.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-postulaciones"]',
        title: '📋 My Applications',
        content: 'Manage all your applications in one place. Check the status of your applications, receive notifications from interested companies and track your opportunities.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-leads"]',
        title: '👥 Leads',
        content: 'Manage contacts who write to you. Here you receive messages from recruiters, interested companies and professional contacts. Organize your conversations and job opportunities.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-analitica"]',
        title: '📊 Analytics',
        content: 'Detailed statistics about your profile: who visited your CV, from which countries, which sections they viewed most, clicks on your contact buttons and weekly trends. Valuable data to improve your profile.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-visas"]',
        title: '📄 Visas',
        content: 'Manage your work permits and visas. Add information about your immigration status, work permits in different countries and expiration dates. This helps international recruiters.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ajustes"]',
        title: '⚙️ Settings',
        content: 'Here you configure your account: profile privacy, notifications, language and security. Customize your YourCVPassport experience according to your preferences.',
        placement: 'right',
      },
      {
        target: 'center',
        title: 'Tour Completed! 🎉',
        content: 'Congratulations! You\'ve completed the dashboard tour. Now you know all the available tools to boost your professional career. Good luck with your job search!',
        placement: 'center',
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

    // Si el target es 'center', posicionar en el centro de la pantalla
    if (step.target === 'center') {
      const tooltipWidth = 360;
      const tooltipHeight = 240;
      const top = (window.innerHeight - tooltipHeight) / 2;
      const left = (window.innerWidth - tooltipWidth) / 2;
      setTooltipPosition({ top, left });
      setArrowPosition('top'); // No se mostrará la flecha en este caso
      return;
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    // Si es un elemento del sidebar, hacer scroll para que sea visible
    if (step.target.includes('sidebar-')) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 240;
    let offset = 24;
    const margin = 16;

    let top = 0;
    let left = 0;
    let placement = step.placement;

    // Para el gráfico de visitas, usar un offset mayor para que no tape el contenido
    if (step.target === '[data-tour="chart"]') {
      offset = 60; // Aumentar el offset para este paso específico
    }

    // Para elementos del sidebar, siempre colocar a la derecha
    if (step.target.includes('sidebar-')) {
      placement = 'right';
    }

    // Función para verificar si una posición es válida
    const isValidPosition = (t: number, l: number): boolean => {
      // Verificar si sale de pantalla
      if (t < margin || l < margin) return false;
      if (t + tooltipHeight > window.innerHeight - margin) return false;
      if (l + tooltipWidth > window.innerWidth - margin) return false;

      // Verificar si tapa el elemento objetivo
      const tooltipRect = { top: t, left: l, right: l + tooltipWidth, bottom: t + tooltipHeight };
      const overlap = !(
        tooltipRect.right < rect.left ||
        tooltipRect.left > rect.right ||
        tooltipRect.bottom < rect.top ||
        tooltipRect.top > rect.bottom
      );

      return !overlap; // Retornar true si NO hay overlap
    };

    // Probar diferentes posiciones en orden de prioridad
    const positions = [
      {
        name: placement,
        calculate: () => {
          switch (placement) {
            case 'bottom':
              return {
                top: rect.bottom + offset,
                left: rect.left + rect.width / 2 - tooltipWidth / 2,
                arrow: 'top' as const
              };
            case 'top':
              return {
                top: rect.top - tooltipHeight - offset,
                left: rect.left + rect.width / 2 - tooltipWidth / 2,
                arrow: 'bottom' as const
              };
            case 'left':
              return {
                top: rect.top + rect.height / 2 - tooltipHeight / 2,
                left: rect.left - tooltipWidth - offset,
                arrow: 'right' as const
              };
            case 'right':
              return {
                top: rect.top + rect.height / 2 - tooltipHeight / 2,
                left: rect.right + offset,
                arrow: 'left' as const
              };
            default:
              return { top: 0, left: 0, arrow: 'top' as const };
          }
        }
      },
      // Posiciones alternativas
      {
        name: 'right',
        calculate: () => ({
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + offset,
          arrow: 'left' as const
        })
      },
      {
        name: 'bottom',
        calculate: () => ({
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          arrow: 'top' as const
        })
      },
      {
        name: 'left',
        calculate: () => ({
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - offset,
          arrow: 'right' as const
        })
      },
      {
        name: 'top',
        calculate: () => ({
          top: rect.top - tooltipHeight - offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          arrow: 'bottom' as const
        })
      },
    ];

    // Intentar cada posición hasta encontrar una válida
    let finalPosition = { top: margin, left: margin, arrow: 'top' as const };

    for (const pos of positions) {
      const calculated = pos.calculate();
      if (isValidPosition(calculated.top, calculated.left)) {
        finalPosition = calculated;
        break;
      }
    }

    // Si ninguna posición es válida, ajustar manualmente para que no tape el elemento
    if (!isValidPosition(finalPosition.top, finalPosition.left)) {
      // Colocar a la derecha del elemento con ajuste vertical
      finalPosition = {
        top: Math.max(margin, Math.min(rect.top, window.innerHeight - tooltipHeight - margin)),
        left: Math.min(rect.right + offset, window.innerWidth - tooltipWidth - margin),
        arrow: 'left' as const
      };
    }

    setTooltipPosition({ top: finalPosition.top, left: finalPosition.left });
    setArrowPosition(finalPosition.arrow);

    // Add highlight to target element (solo si no es center)
    if (step.target !== 'center') {
      targetElement.classList.add('tour-highlight');

      // Remove highlight from all other elements
      document.querySelectorAll('.tour-highlight').forEach((el) => {
        if (el !== targetElement) {
          el.classList.remove('tour-highlight');
        }
      });
    } else {
      // Si es center, remover todos los highlights
      document.querySelectorAll('.tour-highlight').forEach((el) => {
        el.classList.remove('tour-highlight');
      });
    }
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

  // Determinar si estamos en pasos del sidebar (5-14) o dashboard (1-4, 15)
  const isSidebarStep = currentStep >= 4 && currentStep <= 13; // Steps 5-14 son sidebar (index 4-13), el paso 15 (index 14) vuelve al dashboard

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

      {/* Tooltip con mejor contraste */}
      <div
        className="fixed z-[10000] w-[360px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-3 border-blue-600 dark:border-blue-400 transition-all duration-300 animate-fadeIn"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(37, 99, 235, 0.3)',
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Arrow pointing to highlighted element - No mostrar si es el paso centrado */}
        {step.target !== 'center' && (
          <div
            className={`absolute w-0 h-0 ${
              arrowPosition === 'top'
                ? '-top-3 left-1/2 -translate-x-1/2 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[14px] border-b-blue-600 dark:border-b-blue-400'
                : arrowPosition === 'bottom'
                ? '-bottom-3 left-1/2 -translate-x-1/2 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] border-t-blue-600 dark:border-t-blue-400'
                : arrowPosition === 'left'
                ? '-left-3 top-1/2 -translate-y-1/2 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent border-r-[14px] border-r-blue-600 dark:border-r-blue-400'
                : '-right-3 top-1/2 -translate-y-1/2 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent border-l-[14px] border-l-blue-600 dark:border-l-blue-400'
            }`}
          />
        )}

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {currentStep + 1}
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  {currentStep + 1} / {steps.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {step.title}
              </h3>
            </div>
            <button
              onClick={handleSkipTour}
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors hover:scale-110"
              title={lang === 'en' ? 'Close tour' : 'Cerrar tutorial'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-medium">
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
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline transition-colors"
            >
              {lang === 'en' ? 'Skip Tour' : 'Saltar Tutorial'}
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm font-bold text-gray-800 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  {lang === 'en' ? 'Back' : 'Atrás'}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg hover:shadow-xl transition-all"
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
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 1),
                      0 0 30px 8px rgba(59, 130, 246, 0.8) !important;
          border-radius: 12px;
          pointer-events: auto !important;
          padding: 12px !important;
        }

        /* Light mode background for highlighted elements */
        :root:not(.dark) .tour-highlight {
          background: white !important;
        }

        /* Dark mode background for highlighted elements */
        :root.dark .tour-highlight,
        .dark .tour-highlight {
          background: rgb(31, 41, 55) !important;
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
