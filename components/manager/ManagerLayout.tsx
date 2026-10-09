import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  ChartBarIcon,
  Squares2X2Icon,
  PlusCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftOnRectangleIcon,
  GlobeAltIcon,
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

// Shell de la seccion de gestion. /manager es una herramienta de trabajo, no una
// pagina de marketing: antes se pintaba dentro del layout publico, con "Producto,
// Empresas, Recursos, Precios" en la cabecera. MainLayout ya oculta Header y
// Footer para /dashboard por el mismo motivo; aqui se aplica lo mismo y se aporta
// la navegacion propia.
//
// Importante: al quitar el Header se pierden el conmutador de tema y el acceso al
// sitio. El dashboard tiene ese hueco sin cubrir desde siempre; aqui no se repite.

// Solo destinos que existen de verdad. Rellenar el sidebar con entradas que no
// llevan a ningun sitio es peor que dejarlo con hueco: promete funcionalidad que
// no hay. `/dashboard` y `/comunidad` son rutas reales a las que el gestor tiene
// acceso; no existe pagina de ayuda enrutada, asi que no se enlaza.
const NAV_GESTION = [
  { to: '/manager', label: 'Perfiles gestionados', icon: UserGroupIcon, end: true },
  { to: '/manager/analiticas', label: 'Analíticas', icon: ChartBarIcon, end: true },
  { to: '/manager/revision', label: 'Revisión en lote', icon: Squares2X2Icon, end: true },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
   focus:outline-none focus:ring-2 focus:ring-cv-blue ${
     isActive
       ? 'bg-cv-blue text-white'
       : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
   }`;

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-tertiary">
    {children}
  </p>
);

const DarkModeToggle: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  // Misma logica que components/Header.tsx para que el tema siga siendo uno solo.
  const [isDark, setIsDark] = useState(
    () =>
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
  );

  const toggle = () => {
    if (isDark) {
      localStorage.theme = 'light';
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      localStorage.theme = 'dark';
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                 text-gray-600 dark:text-dark-text-secondary
                 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary
                 focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
      ) : (
        <MoonIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
      )}
      {!collapsed && <span>{isDark ? 'Tema claro' : 'Tema oscuro'}</span>}
    </button>
  );
};

const SidebarContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Gestor';
  const displayEmail = user?.email || '';

  const handleSignOut = async () => {
    onNavigate?.();
    await signOut();
    navigate('/');
  };

  const handleCreate = () => {
    onNavigate?.();
    if (window.location.pathname !== '/manager') navigate('/manager');
    // Se deja un tick para que ManagerDashboard este montado y escuchando.
    setTimeout(() => window.dispatchEvent(new CustomEvent('manager-open-create-form')), 0);
  };

  const handlePendientes = () => {
    onNavigate?.();
    if (window.location.pathname !== '/manager') navigate('/manager');
    setTimeout(() => window.dispatchEvent(new CustomEvent('manager-filter-incomplete')), 0);
  };

  return (
  <div className="flex flex-col h-full">
    <div className="px-5 py-5 border-b border-gray-200 dark:border-dark-border">
      <Link
        to="/"
        className="block focus:outline-none focus:ring-2 focus:ring-cv-blue rounded-md"
      >
        {/* dark:text-cv-blue-light es lo que usa el Header real: el azul de marca
            sin aclarar queda apagado sobre el fondo oscuro. */}
        <span className="text-xl font-bold text-cv-blue dark:text-cv-blue-light whitespace-nowrap">
          YourCVPassport
        </span>
      </Link>
      <span className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cv-blue/10 text-cv-blue dark:bg-cv-blue-light/15 dark:text-cv-blue-light">
        Panel de gestor
      </span>
    </div>

    <nav className="flex-1 px-3 pb-4 overflow-y-auto" aria-label="Navegación de gestión">
      <SectionLabel>Gestión</SectionLabel>
      <div className="space-y-1">
        {NAV_GESTION.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={navClass}>
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}

        {/* Accion primaria accesible desde cualquier pantalla del panel, tambien
            desde el editor de un perfil. Si no estamos en /manager navega alli
            primero; el evento lo recoge ManagerDashboard para abrir el formulario.
            Los CustomEvent ya son el patron del repo para este tipo de puente. */}
        {/* Atajo al filtro de incompletos. Es la pregunta que mas se repite al
            gestionar veinte perfiles: cuales no puedo publicar todavia. */}
        <button
          onClick={handlePendientes}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-700 dark:text-dark-text-secondary
                     hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary
                     focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
        >
          <ExclamationCircleIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
          Pendientes de completar
        </button>

        <button
          onClick={handleCreate}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-cv-blue dark:text-cv-blue-light
                     hover:bg-cv-blue/10 dark:hover:bg-cv-blue-light/10
                     focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
          Crear perfil
        </button>
      </div>


    </nav>

    {/* Identidad: en un panel donde se editan perfiles de OTRAS personas, saber
        con que cuenta estas trabajando no es un adorno. */}
    <div className="px-3 pt-4 border-t border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-3 px-2 pb-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-9 h-9 rounded-full object-cover object-top shrink-0 bg-gray-100 dark:bg-dark-bg-tertiary"
          />
        ) : (
          <div className="w-9 h-9 rounded-full shrink-0 bg-gradient-to-br from-cv-blue to-cv-blue-dark flex items-center justify-center text-white text-sm font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary truncate">
            {displayName}
          </p>
          {displayEmail && (
            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary truncate">{displayEmail}</p>
          )}
        </div>
      </div>
    </div>

    <div className="px-3 pb-4 space-y-1">
      <DarkModeToggle />
      <Link
        to="/"
        onClick={onNavigate}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                   text-gray-600 dark:text-dark-text-secondary
                   hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary
                   focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
      >
        <GlobeAltIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
        Volver al sitio
      </Link>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                   text-gray-600 dark:text-dark-text-secondary
                   hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400
                   focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
      >
        <ArrowLeftOnRectangleIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  </div>
  );
};

const ManagerLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // El cajon se cierra al cambiar de ruta: si no, en movil tapa la pantalla a la
  // que se acaba de navegar.
  useEffect(() => setOpen(false), [pathname]);

  // Escape cierra, que es lo que espera cualquiera con un panel superpuesto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Sidebar fijo desde lg. Por debajo seria un muro de 256px sobre 375. */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border">
        <SidebarContent />
      </aside>

      {/* Barra superior solo en movil */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú de gestión"
          aria-expanded={open}
          className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
        >
          <Bars3Icon className="w-6 h-6" aria-hidden="true" />
        </button>
        <span className="font-bold text-cv-blue dark:text-cv-blue-light">YourCVPassport</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cv-blue/10 text-cv-blue dark:bg-cv-blue-light/15 dark:text-cv-blue-light">
          Gestor
        </span>
      </div>

      {/* Cajon movil */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 animate-fadeIn"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de gestión"
            className="relative w-64 max-w-[80%] bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-4 right-3 p-1.5 rounded-lg text-gray-500 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
            >
              <XMarkIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
