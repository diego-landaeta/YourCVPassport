import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useA11yLabels } from './shared/a11y';
import Header from './Header';
import Footer from './Footer';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pathname } = useLocation();
    const { session } = useAuth();
    const a11y = useA11yLabels();

    useEffect(() => {
        // Apply saved theme on initial load
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Routes that should not show Header/Footer (dashboard with its own navigation)
    // Also hide for /comunidad and /feed when logged in (CommunityRoute renders full DashboardPage)
    const isCommunityRoute = pathname === '/comunidad' || pathname === '/feed';
    const hideHeaderFooter =
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/') ||
        // El panel de gestor trae su propio sidebar (ManagerLayout): es una
        // herramienta de trabajo, no una pagina publica, y la cabecera de
        // marketing ahi solo estorba.
        pathname === '/manager' ||
        pathname.startsWith('/manager/') ||
        (isCommunityRoute && !!session);

    return (
        <>
            {/* Skip-link: invisible hasta recibir foco con teclado; lleva el foco al
                contenido principal saltando cabecera y navegacion. Se gestiona con
                onClick (y no solo con el hash) para no ensuciar la URL del router. */}
            <a
                href="#main-content"
                onClick={(e) => {
                    e.preventDefault();
                    const main = document.getElementById('main-content');
                    if (main) {
                        main.focus();
                        main.scrollIntoView();
                    }
                }}
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white dark:focus:bg-dark-bg-secondary focus:text-cv-blue dark:focus:text-cv-blue-light focus:font-semibold focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:focus-visible:ring-cv-blue-light"
            >
                {a11y.skipToContent}
            </a>
            {!hideHeaderFooter && <Header />}
            <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
                {children}
            </main>
            {!hideHeaderFooter && <Footer />}
        </>
    );
};

export default MainLayout;
