// @refresh reset
import React, { createContext, useContext, useState, useRef, useEffect, useReducer, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { routeConfig } from '../config/routeConfig';
import type { TranslationsType } from '../types/translations';

type Language = 'en' | 'es';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    setLangWithNav: (lang: Language) => void;
    /** Diccionario del idioma activo (siempre cargado: el proveedor no pinta nada hasta tenerlo). */
    translations: TranslationsType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// --- Carga diferida de los diccionarios -------------------------------------------
// translations/en.ts y es.ts pesan ~300 kB cada uno. Antes iban los dos en el chunk de
// entrada; ahora cada idioma es un chunk propio que solo se descarga cuando hace falta.
const loadedTranslations: Partial<Record<Language, TranslationsType>> = {};
const pendingTranslations: Partial<Record<Language, Promise<TranslationsType>>> = {};

const importTranslations = (lang: Language): Promise<TranslationsType> =>
    lang === 'es'
        // Cast: es.ts tiene la misma forma que en.ts (como hacia useTranslations antes)
        ? import('../translations/es').then((m) => m.translations as unknown as TranslationsType)
        : import('../translations/en').then((m) => m.translations);

/** Carga (una sola vez) el diccionario de un idioma. Si falla, se puede reintentar. */
export const loadTranslations = (lang: Language): Promise<TranslationsType> => {
    const cached = loadedTranslations[lang];
    if (cached) return Promise.resolve(cached);
    let pending = pendingTranslations[lang];
    if (!pending) {
        pending = importTranslations(lang)
            .then((dict) => {
                loadedTranslations[lang] = dict;
                return dict;
            })
            .finally(() => {
                delete pendingTranslations[lang];
            });
        pendingTranslations[lang] = pending;
    }
    return pending;
};

/** Igual que loadTranslations, con un reintento al segundo (red movil, chunk perdido...). */
const loadWithRetry = (lang: Language): Promise<TranslationsType> =>
    loadTranslations(lang).catch(() =>
        new Promise((resolve) => setTimeout(resolve, 1000)).then(() => loadTranslations(lang))
    );

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

// Idioma inicial: primero la URL, luego localStorage y por ultimo el navegador
const detectInitialLanguage = (pathname: string): Language => {
    const urlLang = detectLanguageFromPath(pathname);
    if (urlLang) return urlLang;

    const savedLang = localStorage.getItem('language');
    if (savedLang === 'es' || savedLang === 'en') return savedLang;

    return detectBrowserLanguage();
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize language: first check URL, then localStorage, then browser language
    // Also sets document.documentElement.lang synchronously so it's always present from the first render.
    // La descarga del diccionario empieza aqui mismo, en el primer render.
    const [lang, setLangState] = useState<Language>(() => {
        const initial = detectInitialLanguage(location.pathname);
        document.documentElement.lang = initial;
        loadTranslations(initial).catch(() => { /* lo gestiona el efecto de carga */ });
        return initial;
    });

    // Fuerza un render cuando termina de cargarse un diccionario
    const [, notifyLoaded] = useReducer((n: number) => n + 1, 0);
    const [loadError, setLoadError] = useState<Error | null>(null);

    // Ultimo idioma pedido: evita que una carga lenta pise un cambio posterior
    const requestedLang = useRef<Language>(lang);
    const locationRef = useRef(location);
    locationRef.current = location;
    const langRef = useRef(lang);
    langRef.current = lang;

    // Diccionario a mostrar: el del idioma activo o, mientras se descarga el nuevo,
    // el ultimo que se mostro (nunca claves crudas)
    const lastShown = useRef<TranslationsType | null>(null);
    const translations = loadedTranslations[lang] ?? lastShown.current;
    if (translations) lastShown.current = translations;

    // Si el diccionario del idioma activo aun no esta, se espera a que llegue (1 reintento)
    useEffect(() => {
        if (loadedTranslations[lang]) return;
        let active = true;
        loadWithRetry(lang)
            .then(
                () => { if (active) notifyLoaded(); },
                (err) => { if (active) setLoadError(err instanceof Error ? err : new Error(String(err))); }
            );
        return () => { active = false; };
    }, [lang]);

    // Cambia de idioma cuando su diccionario ya esta cargado: el cambio es atomico,
    // sin un render intermedio con el texto del idioma anterior
    // Si no se puede descargar, no se cambia nada (ni URL ni idioma): mejor seguir en el
    // idioma actual que mostrar una URL/lang en un idioma y el texto en otro.
    const whenLoaded = useCallback((newLang: Language, apply: () => void) => {
        requestedLang.current = newLang;
        if (loadedTranslations[newLang]) {
            apply();
            return;
        }
        loadWithRetry(newLang).then(
            () => {
                if (requestedLang.current === newLang) apply();
            },
            (err) => {
                if (requestedLang.current === newLang) requestedLang.current = langRef.current;
                console.error(`[i18n] No se pudo cargar el idioma "${newLang}"`, err);
            }
        );
    }, []);

    const setLang = useCallback((newLang: Language) => {
        whenLoaded(newLang, () => setLangState(newLang));
    }, [whenLoaded]);

    // Detect language from URL whenever route changes
    React.useEffect(() => {
        const urlLang = detectLanguageFromPath(location.pathname);
        // Tambien si hay otro idioma pendiente de carga: la URL manda y anula esa peticion
        if (urlLang && (urlLang !== lang || requestedLang.current !== urlLang)) {
            setLang(urlLang);
        }
    }, [location.pathname]);

    // Save language to localStorage and update HTML lang attribute whenever it changes
    React.useEffect(() => {
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const setLangWithNav = (newLang: Language) => {
        whenLoaded(newLang, () => {
            // Save language to localStorage
            localStorage.setItem('language', newLang);

            // Find the current route and navigate to the equivalent route in the new language
            const cleanPath = locationRef.current.pathname.replace(/^\//, '');

            // Find which route we're currently on
            for (const route of routeConfig) {
                if (cleanPath === route.path_es || cleanPath.startsWith(route.path_es + '/')) {
                    // Currently on Spanish route, navigate to English if switching
                    if (newLang === 'en') {
                        navigate(`/${route.path_en}`);
                        setLangState(newLang);
                        return;
                    }
                } else if (cleanPath === route.path_en || cleanPath.startsWith(route.path_en + '/')) {
                    // Currently on English route, navigate to Spanish if switching
                    if (newLang === 'es') {
                        navigate(`/${route.path_es}`);
                        setLangState(newLang);
                        return;
                    }
                }
            }

            // If no matching route found, just update the language
            setLangState(newLang);
        });
    };

    // Sin diccionario no se pinta nada (solo ocurre en la primera carga, unos ms).
    // Si no se pudo descargar, el error sube al ErrorBoundary como un chunk perdido.
    if (!translations && loadError) throw loadError;

    // El <Helmet> va siempre en la misma posicion: si se desmonta y se vuelve a montar al
    // llegar el diccionario, react-helmet-async borra el atributo lang de <html>.
    return (
        <>
            <Helmet>
                <html lang={lang} />
            </Helmet>
            {translations && (
                <LanguageContext.Provider value={{ lang, setLang, setLangWithNav, translations }}>
                    {children}
                </LanguageContext.Provider>
            )}
        </>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
