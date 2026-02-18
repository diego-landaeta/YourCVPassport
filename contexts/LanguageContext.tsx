// @refresh reset
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { routeConfig } from '../config/routeConfig';

type Language = 'en' | 'es';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    setLangWithNav: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to detect browser language preference
const detectBrowserLanguage = (): Language => {
    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    return browserLang.startsWith('es') ? 'es' : 'en';
};

// Helper function to detect language from URL path
const detectLanguageFromPath = (pathname: string): Language | null => {
    // Remove leading slash
    const cleanPath = pathname.replace(/^\//, '');

    // Check if current path matches any Spanish route
    for (const route of routeConfig) {
        if (cleanPath === route.path_es || cleanPath.startsWith(route.path_es + '/')) {
            return 'es';
        }
        if (cleanPath === route.path_en || cleanPath.startsWith(route.path_en + '/')) {
            return 'en';
        }
    }

    return null;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize language: first check URL, then localStorage, then browser language
    // Also sets document.documentElement.lang synchronously so it's always present from the first render
    const [lang, setLang] = useState<Language>(() => {
        const urlLang = detectLanguageFromPath(location.pathname);
        if (urlLang) {
            document.documentElement.lang = urlLang;
            return urlLang;
        }

        const savedLang = localStorage.getItem('language');
        if (savedLang === 'es' || savedLang === 'en') {
            document.documentElement.lang = savedLang;
            return savedLang;
        }

        const browserLang = detectBrowserLanguage();
        document.documentElement.lang = browserLang;
        return browserLang;
    });

    // Detect language from URL whenever route changes
    React.useEffect(() => {
        const urlLang = detectLanguageFromPath(location.pathname);
        if (urlLang && urlLang !== lang) {
            setLang(urlLang);
        }
    }, [location.pathname]);

    // Save language to localStorage and update HTML lang attribute whenever it changes
    React.useEffect(() => {
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const setLangWithNav = (newLang: Language) => {
        // Save language to localStorage
        localStorage.setItem('language', newLang);

        // Find the current route and navigate to the equivalent route in the new language
        const cleanPath = location.pathname.replace(/^\//, '');

        // Find which route we're currently on
        for (const route of routeConfig) {
            if (cleanPath === route.path_es || cleanPath.startsWith(route.path_es + '/')) {
                // Currently on Spanish route, navigate to English if switching
                if (newLang === 'en') {
                    navigate(`/${route.path_en}`);
                    setLang(newLang);
                    return;
                }
            } else if (cleanPath === route.path_en || cleanPath.startsWith(route.path_en + '/')) {
                // Currently on English route, navigate to Spanish if switching
                if (newLang === 'es') {
                    navigate(`/${route.path_es}`);
                    setLang(newLang);
                    return;
                }
            }
        }

        // If no matching route found, just update the language
        setLang(newLang);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, setLangWithNav }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};