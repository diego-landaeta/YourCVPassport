import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { routeConfig } from '../../config/routeConfig';
import { useTranslations } from '../../hooks/useTranslations';
import { normalizeUrl } from '../../utils/canonicalUrl';

const BASE_URL = 'https://yourcvpassport.com';

/**
 * Secciones intermedias que tienen una pagina propia util y por tanto se enlazan.
 * Las demas no son enlace: /empresas abre la busqueda de talento (no una portada de
 * "Empresas") y /recursos es una pagina en construccion.
 */
const LINKABLE_SECTIONS = new Set(['producto', 'product', 'profesionales', 'professionals', 'nosotros', 'about']);

/** Rutas de routeConfig sin migas: herramientas internas. */
const isExcluded = (path: string) => path.startsWith('dev/');

interface Crumb {
    label: string;
    /** Ruta interna si el nivel es enlazable; undefined si es solo texto. */
    to?: string;
}

/**
 * Migas de pan de las paginas de marketing generadas desde config/routeConfig.ts.
 * Las etiquetas salen de t.breadcrumbs.labels (cortas y sin "/"); no se reutilizan los
 * textos del menu (NAV_LINKS) porque son largos ("Seguridad y Cumplimiento (RGPD)") o
 * parecen rutas ("Prensa/Kit de Medios").
 * Emite tambien el JSON-LD BreadcrumbList (solo con los niveles que tienen URL propia).
 */
const Breadcrumbs: React.FC = () => {
    const { pathname } = useLocation();
    const t = useTranslations();

    const crumbs = useMemo<Crumb[] | null>(() => {
        const path = pathname.replace(/^\/+|\/+$/g, '');
        if (!path || isExcluded(path)) return null;

        const route = routeConfig.find(r => r.path_es === path || r.path_en === path);
        if (!route) return null;
        const isEs = route.path_es === path && route.path_en !== path;
        const pathFor = (r: { path_es: string; path_en: string }) => (isEs ? r.path_es : r.path_en);

        const labels = t.breadcrumbs.labels as Record<string, string>;
        const labelFor = (id: string) => labels[id] ?? id;

        const list: Crumb[] = [{ label: t.breadcrumbs.home, to: '/' }];
        const segments = path.split('/');
        if (segments.length > 1) {
            const section = segments[0];
            const sectionRoute = routeConfig.find(r => pathFor(r) === section);
            list.push({
                label: labelFor(section),
                to: sectionRoute && LINKABLE_SECTIONS.has(section) ? `/${section}` : undefined,
            });
        }
        list.push({ label: labelFor(path) });
        return list;
    }, [pathname, t]);

    if (!crumbs) return null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs
            .map((crumb, index) => ({
                name: crumb.label,
                url: index === crumbs.length - 1 ? normalizeUrl(`${BASE_URL}${pathname}`) : crumb.to && normalizeUrl(`${BASE_URL}${crumb.to}`),
            }))
            .filter(item => item.url)
            .map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })),
    };

    return (
        <>
            <Helmet key={`breadcrumbs-${pathname}`}>
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Helmet>
            <nav
                aria-label={t.breadcrumbs.ariaLabel}
                data-testid="breadcrumbs"
                className="bg-white dark:bg-dark-bg-primary border-b border-gray-100 dark:border-dark-border"
            >
                <ol className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    {crumbs.map((crumb, index) => {
                        const isLast = index === crumbs.length - 1;
                        return (
                            <li key={`${index}-${crumb.label}`} className="flex items-center gap-2 min-w-0">
                                {index > 0 && (
                                    <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                                {isLast ? (
                                    <span aria-current="page" className="font-medium text-gray-900 dark:text-dark-text-primary break-words">
                                        {crumb.label}
                                    </span>
                                ) : crumb.to ? (
                                    <Link
                                        to={crumb.to}
                                        className="text-cv-blue dark:text-cv-blue-light hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-gray-600 dark:text-dark-text-secondary">{crumb.label}</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
};

export default Breadcrumbs;
