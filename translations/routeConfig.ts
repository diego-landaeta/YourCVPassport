export interface PathMapping {
    en: string;
    es: string;
}

export const pathMappings: PathMapping[] = [
    // Páginas estáticas principales
    { en: '/', es: '/' },
    { en: '/login', es: '/login' },
    { en: '/signup', es: '/signup' },
    { en: '/pricing', es: '/precios' },
    { en: '/about', es: '/nosotros' },

    // Páginas de Producto
    { en: '/product/overview', es: '/producto/resumen' },
    { en: '/product/stamps', es: '/producto/sellos' },
    { en: '/product/ats', es: '/producto/ats' },
    { en: '/product/domain', es: '/producto/dominio' },
    { en: '/product/analytics', es: '/producto/analiticas' },
    { en: '/product/ai', es: '/producto/ia' },

    // Páginas para Profesionales
    { en: '/professionals/how', es: '/profesionales/como-funciona' },
    { en: '/professionals/templates', es: '/profesionales/plantillas' },
    { en: '/professionals/help', es: '/profesionales/ayuda' },

    // Páginas para Empresas
    { en: '/companies/search', es: '/empresas/busqueda' },
    { en: '/companies/plans', es: '/empresas/planes' },
    { en: '/companies/integrations', es: '/empresas/integraciones' },
    { en: '/companies/security', es: '/empresas/seguridad' },

    // Páginas de Recursos
    { en: '/resources/blog', es: '/recursos/blog' },
    { en: '/resources/library', es: '/recursos/biblioteca' },
    { en: '/resources/success', es: '/recursos/exito' },
    { en: '/resources/status', es: '/recursos/estado' },

    // Páginas "Sobre Nosotros"
    { en: '/about/mission', es: '/nosotros/mision' },
    { en: '/about/press', es: '/nosotros/prensa' },
    { en: '/about/contact', es: '/nosotros/contacto' },
];