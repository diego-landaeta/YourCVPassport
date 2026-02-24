import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface DashboardTourProps {
  onComplete: () => void;
  onSkip: () => void;
  onOpenMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  userGender?: string;
}

const DashboardTour: React.FC<DashboardTourProps> = ({ onComplete, onSkip, onOpenMobileMenu, isMobileMenuOpen, userGender }) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const tourUI = t.dashboard.tour;
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right' | 'center'>('bottom');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Map sidebar targets to mobile menu targets
  const sidebarToMobileMap: Record<string, string> = {
    '[data-tour="sidebar-mi-perfil"]': '[data-tour="mobile-mi-perfil"]',
    '[data-tour="sidebar-ver-cv"]': '[data-tour="mobile-ver-cv"]',
    '[data-tour="sidebar-plantillas"]': '[data-tour="mobile-plantillas"]',
    '[data-tour="sidebar-stamps"]': '[data-tour="mobile-stamps"]',
    '[data-tour="sidebar-feed"]': '[data-tour="mobile-feed"]',
    '[data-tour="sidebar-vacantes"]': '[data-tour="mobile-vacantes"]',
    '[data-tour="sidebar-ajustes"]': '[data-tour="mobile-ajustes"]',
  };

  // Gender-aware greeting for Spanish
  const welcomeGreeting = userGender === 'female' ? 'Bienvenida' : 'Bienvenido';

  const tourSteps: Record<string, TourStep[]> = {
    es: [
      {
        target: '[data-tour="welcome"]',
        title: `¡${welcomeGreeting} a tu Dashboard!`,
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
        content: 'Visualiza cómo se ve tu CV público. Esta es la vista que verán los reclutadores y empresas cuando accedan a tu perfil.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-plantillas"]',
        title: '🎨 Plantillas',
        content: 'Elige entre diferentes diseños profesionales para tu CV. Cada plantilla está optimizada para diferentes industrias y perfiles.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-stamps"]',
        title: '🛡️ Verificaciones',
        content: 'Obtén sellos de verificación para tu perfil. Los perfiles verificados generan más confianza y reciben hasta 3x más visitas.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-feed"]',
        title: '🌐 Comunidad',
        content: 'Conecta con otros profesionales en el Feed, únete a Grupos y Canales de tu interés, y mantente al día con las Notificaciones.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-vacantes"]',
        title: '💼 Oportunidades',
        content: 'Explora ofertas de trabajo, postúlate a vacantes y revisa tus analíticas de perfil.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ajustes"]',
        title: '⚙️ Ajustes',
        content: 'Configura tu cuenta: privacidad, notificaciones, idioma y seguridad.',
        placement: 'right',
      },
      {
        target: 'center',
        title: '¡Tour Completado! 🎉',
        content: '¡Felicitaciones! Has completado el tour del dashboard. Ahora conoces todas las herramientas disponibles para impulsar tu carrera profesional. ¡Mucho éxito!',
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
        content: 'See how your public CV looks. This is the view that recruiters and companies will see when accessing your profile.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-plantillas"]',
        title: '🎨 Templates',
        content: 'Choose from different professional designs for your CV. Each template is optimized for different industries and profiles.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-stamps"]',
        title: '🛡️ Verifications',
        content: 'Get verification badges for your profile. Verified profiles generate more trust and receive up to 3x more recruiter views.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-feed"]',
        title: '🌐 Community',
        content: 'Connect with other professionals in the Feed, join Groups and Channels that match your interests, and stay up to date with Notifications.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-vacantes"]',
        title: '💼 Opportunities',
        content: 'Explore job listings, apply to positions and review your profile analytics.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-ajustes"]',
        title: '⚙️ Settings',
        content: 'Configure your account: privacy, notifications, language and security.',
        placement: 'right',
      },
      {
        target: 'center',
        title: 'Tour Completed! 🎉',
        content: 'Congratulations! You\'ve completed the dashboard tour. Now you know all the available tools to boost your professional career. Good luck!',
        placement: 'center',
      },
    ],
  };

  // Get steps and map sidebar targets to mobile targets when on mobile
  const allSteps = tourSteps[lang] || tourSteps.es;
  const steps = isMobile
    ? allSteps.map(step => {
        // If this is a sidebar step and we're on mobile, map to mobile menu target
        if (sidebarToMobileMap[step.target]) {
          return {
            ...step,
            target: sidebarToMobileMap[step.target],
            placement: 'left' as const, // Mobile menu items should have tooltip on left
          };
        }
        return step;
      })
    : allSteps;

  // Open mobile menu when we reach a mobile menu step
  useEffect(() => {
    const step = steps[currentStep];
    if (isMobile && step && step.target.includes('mobile-') && step.target !== '[data-tour="mobile-menu-toggle"]') {
      // This is a mobile menu item step - ensure menu is open
      if (!isMobileMenuOpen && onOpenMobileMenu) {
        onOpenMobileMenu();
      }
    }
  }, [currentStep, isMobile, isMobileMenuOpen, onOpenMobileMenu, steps]);

  // Scroll to target element when step changes
  useEffect(() => {
    const step = steps[currentStep];
    if (!step || step.target === 'center') return;

    // For mobile menu items, wait until menu is open
    const isMobileMenuItem = step.target.includes('mobile-') && !step.target.includes('mobile-menu-toggle');
    if (isMobile && isMobileMenuItem && !isMobileMenuOpen) {
      // Don't scroll yet - wait for menu to open
      return;
    }

    // Wait for DOM to update and animations to complete
    // Mobile menu has 300ms transition, so we wait 400ms for mobile menu items
    const delay = isMobile && isMobileMenuItem ? 400 : 150;

    const timeoutId = setTimeout(() => {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const currentIsMobile = window.innerWidth < 1024;

        if (currentIsMobile && !isMobileMenuItem) {
          // En móvil, usar scroll manual para evitar problemas con el header fijo
          const headerHeight = 80; // pt-20 = 80px
          const elementTop = rect.top + window.scrollY;
          const scrollTarget = elementTop - headerHeight - 20; // 20px extra margin

          window.scrollTo({
            top: Math.max(0, scrollTarget),
            behavior: 'smooth'
          });
        } else {
          // En desktop o para items del menú móvil, usar scrollIntoView
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isMobile, isMobileMenuOpen]);

  useEffect(() => {
    updateTooltipPosition();

    // Use an interval to continuously track the element position
    const intervalId = setInterval(() => {
      updateTooltipPosition();
    }, 16); // ~60fps

    window.addEventListener('resize', updateTooltipPosition);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [currentStep, isMobileMenuOpen]);

  const updateTooltipPosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    const currentIsMobile = window.innerWidth < 1024;
    const tooltipWidth = currentIsMobile ? Math.min(window.innerWidth - 32, 360) : 360;
    const tooltipHeight = 240;

    // Si el target es 'center', posicionar en el centro de la pantalla
    if (step.target === 'center') {
      const top = (window.innerHeight - tooltipHeight) / 2;
      const left = currentIsMobile ? 16 : (window.innerWidth - tooltipWidth) / 2;
      setTooltipPosition({ top, left });
      setArrowPosition('top'); // No se mostrará la flecha en este caso
      return;
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    let offset = 24;
    const margin = 16;

    let top = 0;
    let left = 0;
    let placement = step.placement;

    // Para el gráfico de visitas, usar un offset mayor para que no tape el contenido
    if (step.target === '[data-tour="chart"]') {
      offset = 60; // Aumentar el offset para este paso específico
    }

    // En móvil
    if (currentIsMobile) {
      // Para elementos del menú móvil, posicionar basándose en la posición del elemento
      // Si el elemento está en la mitad superior, poner tooltip abajo; si está abajo, poner arriba
      if (step.target.includes('mobile-') && !step.target.includes('mobile-menu-toggle')) {
        const elementCenterY = rect.top + rect.height / 2;
        const screenMidpoint = window.innerHeight / 2;

        let tooltipTop;
        if (elementCenterY < screenMidpoint) {
          // Elemento en la mitad superior -> tooltip en la parte inferior
          tooltipTop = window.innerHeight - tooltipHeight - margin - 20;
        } else {
          // Elemento en la mitad inferior -> tooltip en la parte superior
          tooltipTop = margin + 70; // Debajo del header
        }

        setArrowPosition('top');
        setTooltipPosition({ top: tooltipTop, left: 16 });

        // Add highlight to target element
        targetElement.classList.add('tour-highlight');
        document.querySelectorAll('.tour-highlight').forEach((el) => {
          if (el !== targetElement) {
            el.classList.remove('tour-highlight');
          }
        });
        return;
      }

      // Para otros elementos en móvil, posicionar en la parte SUPERIOR de la pantalla
      const fixedMobileTop = 80;
      setArrowPosition('bottom');
      setTooltipPosition({ top: fixedMobileTop, left: 16 });

      // Add highlight to target element
      targetElement.classList.add('tour-highlight');
      document.querySelectorAll('.tour-highlight').forEach((el) => {
        if (el !== targetElement) {
          el.classList.remove('tour-highlight');
        }
      });
      return;
    }

    // Para elementos del sidebar, siempre colocar a la derecha (solo en desktop)
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
    let finalPosition: { top: number; left: number; arrow: 'top' | 'bottom' | 'left' | 'right' | 'center' } = { top: margin, left: margin, arrow: 'top' };

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
        arrow: 'left'
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

  // Determinar si estamos en pasos del sidebar o menú móvil basándose en el target del paso actual
  const isSidebarStep = step.target.includes('sidebar-');
  const isMobileMenuItem = step.target.includes('mobile-') && !step.target.includes('mobile-menu-toggle');

  return (
    <>
      {/* Overlay - Visual only, allows scroll through */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm pointer-events-none"
      />

      {/* Tooltip con mejor contraste - responsive para móvil */}
      <div
        data-tour-tooltip
        className={`fixed z-[10000] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-3 border-blue-600 dark:border-blue-400 transition-all duration-300 animate-fadeIn ${
          isMobile
            ? 'w-[calc(100vw-32px)] max-w-[400px]' // Full width en móvil
            : 'w-[360px]'
        }`}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(37, 99, 235, 0.3)',
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Arrow pointing to highlighted element - No mostrar en móvil ni si es el paso centrado */}
        {step.target !== 'center' && !isMobile && (
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
              title={tourUI.closeTour}
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
              {tourUI.skipTour}
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm font-bold text-gray-800 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  {tourUI.back}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                {currentStep === steps.length - 1
                  ? tourUI.finish
                  : tourUI.next}
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
        ` : isMobileMenuItem ? `
          /* En pasos del menú móvil: elevar z-index del menú móvil */
          body:has(.tour-highlight) [data-tour="mobile-menu"] {
            z-index: 10000 !important;
          }
        ` : ``}

        /* Tooltip siempre interactivo */
        [data-tour-tooltip] {
          pointer-events: auto !important;
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
