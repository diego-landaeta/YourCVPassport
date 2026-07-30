import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pathname } = useLocation();
    const { session } = useAuth();

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
            {!hideHeaderFooter && <Header />}
            <main className="flex-grow">
                {children}
            </main>
            {!hideHeaderFooter && <Footer />}
        </>
    );
};

export default MainLayout;
