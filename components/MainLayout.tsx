import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pathname } = useLocation();
    // Language is now managed by localStorage in LanguageContext, no need to set it based on pathname

    useEffect(() => {
        // Apply saved theme on initial load
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Routes that should not show Header/Footer (dashboard with its own navigation)
    const hideHeaderFooter = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

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
