import React from 'react';
import { ChangelogEntry, Template, MilestoneItem } from '../types';

const transparencyIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }));
const trustIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }));
const innovationIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" }));
const inclusivityIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 3c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8z" }));
const factFoundedIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }));
const factUsersIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }));
const factCountriesIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 3c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8z" }));
const factTeamIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-5.197M15 21a6 6 0 00-3-5.197" }));
const contactSupportIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9 12l2 2 4-4M5 12H3m4 4l-2 2m14-4l2 2m-2-14l2-2m-14 2l-2-2" }));
const contactSalesIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" }));
const contactPartnershipsIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 3a2 2 0 11-4 0 2 2 0 014 0z" }));
const identityStampIcon = React.createElement('svg', { className: "w-10 h-10 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6" }));
const educationStampIcon = React.createElement('svg', { className: "w-10 h-10 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { d: "M12 14l9-5-9-5-9 5 9 5z" }), React.createElement('path', { d: "M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 14l9-5-9-5-9 5 9 5zm0 0v6" }));


export const translations = {
    common: {
        characters: 'caracteres',
        of: 'de',
        current: 'Actual',
        optional: 'Opcional',
        required: 'Requerido',
        from: 'desde',
        to: 'hasta',
        next: 'Siguiente',
        backToHome: 'Volver al Inicio',
        contactSupport: 'Contactar Soporte',
        loading: 'Cargando...',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        confirm: 'Confirmar',
        yes: 'Sí',
        no: 'No',
        submit: 'Enviar',
        close: 'Cerrar',
        previous: 'Anterior',
        finish: 'Finalizar',
        add: 'Añadir',
        view: 'Ver',
        download: 'Descargar',
        all: 'Todos',
        more: 'más',
        present: 'Presente',
        anonymous: 'Anónimo',
        notProvided: 'No proporcionado',
        justNow: 'Justo ahora',
        minutesAgo: 'minutos atrás',
        hoursAgo: 'horas atrás',
        daysAgo: 'días atrás',
        send: 'Enviar',
        sending: 'Enviando...',
        processing: 'Procesando...'
    },
    notifications: {
        savedSuccessfully: 'Guardado exitosamente',
        updatedSuccessfully: 'Actualizado exitosamente',
        deletedSuccessfully: 'Eliminado exitosamente',
        errorSaving: 'Error al guardar',
        errorUpdating: 'Error al actualizar',
        errorDeleting: 'Error al eliminar',
        errorLoading: 'Error al cargar datos',
        identitySaved: 'Identidad guardada correctamente',
        experienceSaved: 'Experiencia guardada exitosamente',
        experienceDeleted: 'Experiencia eliminada exitosamente',
        educationSaved: 'Educación guardada correctamente',
        educationDeleted: 'Educación eliminada exitosamente',
        skillsSaved: 'Habilidades guardadas correctamente',
        languagesSaved: 'Idiomas guardados correctamente',
        portfolioSaved: 'Portafolio guardado correctamente',
        preferencesSaved: 'Preferencias guardadas correctamente',
        profileCompleted: '¡Perfil completado y optimizado con éxito!',
        urlUpdated: 'URL actualizada exitosamente',
        urlTooShort: 'La URL debe tener al menos 3 caracteres',
        urlAlreadyInUse: 'Esta URL ya está en uso. Por favor elige otra.',
        templateUpdated: 'Plantilla actualizada exitosamente',
        errorUpdatingTemplate: 'Error al actualizar plantilla',
    },
    meta: {
        default: { title: 'YourCVPassport', description: 'Tu CV Profesional Verificado' },
        home: { title: 'YourCVPassport - CV Profesional Verificado | Destaca y Consigue Empleo', description: 'Construye un CV profesional verificado en el que confían los reclutadores. Optimización con IA, compatibilidad ATS, visibilidad global. ¡Únete a más de 10,000 profesionales!' },
        productOverview: { title: 'Resumen del Producto | YourCVPassport', description: 'Descubre todas las funciones de YourCVPassport: perfiles verificados, exportación ATS, dominios personalizados, analíticas e IA.' },
        stamps: { title: 'Sellos Verificados | YourCVPassport', description: 'Obtén sellos de verificación para tu CV: identidad, educación, experiencia laboral y validación de habilidades. Destaca con credenciales de confianza.' },
        ats: { title: 'Compatibilidad de Exportación ATS | YourCVPassport', description: 'Exporta tu CV en formatos PDF y DOCX compatibles con ATS. Optimizado para el 98% de los sistemas de selección de Fortune 500.' },
        domain: { title: 'Dominio y URL Personalizados | YourCVPassport', description: 'Obtén tu URL de CV personalizada como yourcvpassport.com/cv/tunombre. Marca profesional, fácil de compartir, enlaces memorables.' },
        analytics: { title: 'Analíticas de Perfil | YourCVPassport', description: 'Analíticas avanzadas para tu CV: sigue las visitas al perfil, la ubicación de los visitantes, las fuentes de tráfico y las métricas de interacción.' },
        ai: { title: 'Asistente de IA para CV y Cartas | YourCVPassport', description: 'Aprovecha el poder de la IA para mejorar tu resumen de perfil, escribir cartas de presentación convincentes y sugerir palabras clave impactantes.' },
        talentSearch: { title: 'Búsqueda Avanzada de Talento | YourCVPassport', description: 'Busca entre más de 10,000 perfiles profesionales verificados con filtros avanzados por habilidades, experiencia, ubicación y salario.' },
        about: { title: 'Sobre Nosotros | YourCVPassport', description: 'Conoce nuestra misión de potenciar la confianza profesional en todo el mundo a través de credenciales verificadas.' },
        mission: { title: 'Misión y Valores | YourCVPassport', description: 'Nuestra misión es construir confianza en las credenciales profesionales a nivel mundial a través de la transparencia, la innovación y la inclusividad.' },
        press: { title: 'Prensa y Kit de Medios | YourCVPassport', description: 'Recursos para periodistas y socios de medios. Encuentra nuestros últimos anuncios, activos de marca e información de la empresa.' },
        contact: { title: 'Contáctanos | YourCVPassport', description: 'Ponte en contacto con YourCVPassport para soporte al cliente, consultas de ventas u oportunidades de asociación.' },
        howItWorks: { title: 'Cómo Funciona para Profesionales | YourCVPassport', description: 'Aprende a crear tu CV verificado en 3 sencillos pasos: Importa, verifica y comparte tu perfil profesional.' },
        templates: { title: 'Plantillas de CV y Ejemplos | YourCVPassport', description: 'Explora más de 20 plantillas de CV profesionales y optimizadas para ATS, y ejemplos reales para cada industria.' },
        pricing: { title: 'Planes de Precios | YourCVPassport', description: 'Precios transparentes que crecen contigo. Elige el plan adecuado para desbloquear tu potencial. Plan gratuito disponible.' },
        help: { title: 'Centro de Ayuda | YourCVPassport', description: 'Bienvenido a nuestro centro de soporte. Encuentra guías, tutoriales y respuestas a todas tus preguntas sobre YourCVPassport.' },
        companyPlans: { title: 'Planes para Empresas | YourCVPassport', description: 'Planes de reclutamiento para empresas con créditos de contacto, mensajería masiva, soporte dedicado e integración ATS.' },
        integrations: { title: 'Integraciones ATS | YourCVPassport', description: 'Integra sin problemas YourCVPassport con Greenhouse, Lever, Workable y más. API REST para integraciones personalizadas.' },
        security: { title: 'Seguridad y Cumplimiento | YourCVPassport', description: 'Seguridad de nivel empresarial y cumplimiento total con el RGPD. Certificado SOC 2, ISO 27001. Tus datos están seguros con nosotros.' },
        blog: { title: 'Blog y Guías de Carrera | YourCVPassport', description: 'Consejos de expertos sobre redacción de CV, preparación de entrevistas, crecimiento profesional y estrategias de búsqueda de empleo.' },
        library: { title: 'Biblioteca de Plantillas | YourCVPassport', description: 'Descarga más de 50 plantillas profesionales gratuitas: CVs, cartas de presentación, correos de seguimiento y mensajes de LinkedIn.' },
        success: { title: 'Casos de Éxito | YourCVPassport', description: 'Lee inspiradores casos de éxito de profesionales que consiguieron sus trabajos soñados usando YourCVPassport.' },
        status: { title: 'Estado del Sistema | YourCVPassport', description: 'Encuentra actualizaciones de estado en tiempo real, estadísticas de tiempo de actividad y las últimas noticias y registro de cambios del producto.' },
    },
    header: {
        login: 'Acceder',
        signup: 'Registrarse',
        dashboard: 'Mi Perfil',
        logout: 'Salir',
    },
    hero: {
        title: 'Tu CV Profesional Verificado: Destaca y Avanza en tu Carrera',
        subtitle: 'En un mercado competitivo, la confianza es tu mayor activo. Crea un perfil único y verificado para mostrar tus credenciales y ser visto por las mejores empresas.',
        ctaCreate: 'Crea Tu CV',
        ctaSearch: 'Buscar Talento',
    },
    companies: {
        title: 'Empresas que Confían en la Verificación de YourCVPassport',
        logos: [
            { name: "ISEIE", url: "https://iseie.com/", logoUrl: "https://iseie.com/wp-content/uploads/2024/11/LOGO-PAIS-BANDERA-ESPANA-0-00-00-00-e1738499416780.png" },
            { name: "Psiko Aprende", url: "https://psikoaprende.com/", logoUrl: "https://psikoaprende.com/wp-content/uploads/2024/11/LOGO-PSIKO-APRENDE-PNG-1-e1730841803106.png", logoUrlLight: "https://psikoaprende.com/wp-content/uploads/2024/03/LOGO-PSIKO-APRENDE-PNG-2-e1730843042102.png" },
            { name: "Navalis University", url: "https://navalis.university/", logoUrl: "https://navalis.university/wp-content/uploads/2025/08/Navalis-Magna-logo-scaled.png", logoUrlLight: "https://navalis.university/wp-content/uploads/2025/08/Navalis-Magna-Logo-Negro-1024x1024.png" },
            { name: "ISEIH", url: "https://iseih.com/", logoUrl: "https://iseih.com/wp-content/uploads/2025/08/ISEIH-LOGOTIPO-3.png" },
            { name: "CETLAT", url: "https://cetlat.org/", logoUrl: "https://cetlat.org/wp-content/uploads/2025/05/cetlat-horizontal-nuevo-logo.webp" }
        ],
    },
    features: {
        title: 'Potencia Tu Perfil Profesional con Nuestras Herramientas Verificadas',
        subtitle: 'Desde asistencia con IA hasta reconocimiento global, te proporcionamos las herramientas que necesitas para triunfar.',
        items: [
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>', title: 'Verificación de Identidad', description: 'Genera confianza inmediata con los empleadores a través de sellos verificados de identidad, educación e historial laboral.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>', title: 'Compatibilidad de Exportación ATS', description: 'Exporta tu perfil a formatos PDF o DOCX optimizados para pasar cualquier Sistema de Seguimiento de Candidatos.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>', title: 'Mejora de Perfil con IA', description: 'Usa nuestro asistente de IA para refinar tu biografía, resaltar habilidades clave y crear cartas de presentación convincentes.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>', title: 'Analíticas de Perfil Profesional', description: 'Mira quién está viendo tu perfil, desde dónde y qué habilidades están captando más la atención.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.884 5.337l.623.623M16.116 5.337l-.623.623M12 3v1m0 16v1m-6.663-1.477l.623-.623M18.116 15.89l-.623-.623" /></svg>', title: 'Visibilidad Internacional', description: 'Nuestros estándares de verificación universales hacen que tu perfil sea reconocido y confiable a nivel mundial.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>', title: 'Personalización Avanzada', description: 'Adapta tu perfil con dominios, diseños y secciones personalizadas para reflejar verdaderamente tu marca personal.' },
        ],
    },
    howItWorks: {
        title: 'Crear Tu CV Es Así de Fácil',
        subtitle: 'Pon en marcha tu perfil verificado en solo unos simples pasos.',
        steps: [
            { title: "Crea Tu Perfil Profesional", description: "Regístrate y construye tu perfil. Importa desde LinkedIn o sube tu CV existente para empezar rápidamente." },
            { title: "Verifica Tus Credenciales", description: "Envía tus documentos para verificación. Nuestro proceso seguro añade sellos de confianza a tu perfil." },
            { title: "Comparte y Destaca", description: "Comparte tu enlace único de CV con reclutadores y en redes profesionales para que te encuentren." },
        ],
    },
    testimonials: {
        title: "Casos de Éxito que Inspiran el Crecimiento Profesional",
        subtitle: "Escucha a profesionales y reclutadores que han transformado sus carreras con nosotros.",
    },
    pricing: {
        title: 'Planes a Medida de Tus Necesidades Profesionales',
        subtitle: "Elige el plan adecuado para desbloquear tu potencial, ya sea que estés empezando o liderando un equipo.",
        compareCta: 'Comparar Todos los Planes y Características →',
    },
    security: {
        title: 'Seguridad y Cumplimiento RGPD: Tus Datos, Tu Control',
        subtitle: 'Estamos comprometidos con la protección de tu privacidad. Nuestra plataforma se basa en la seguridad, cumpliendo con los estándares más estrictos del RGPD. Tú controlas tus datos, quién los ve y cuándo.',
        cta: 'Más Información sobre Seguridad',
    },
    faq: {
        title: "Preguntas Frecuentes Sobre los CVs Profesionales Verificados",
        subtitle: "¿Tienes preguntas? Tenemos respuestas. Si no encuentras lo que buscas, no dudes en contactarnos.",
    },
     stampsFaq: {
        title: "Preguntas Frecuentes sobre Verificación",
        description: "Encuentra respuestas a preguntas comunes sobre nuestro proceso de verificación."
    },
    cta: {
        title: 'Comienza Tu Viaje Profesional Hoy',
        subtitle: '¿Listo para dar el siguiente paso en tu carrera? Crea tu CV verificado y desbloquea nuevas oportunidades.',
        button: 'Crea Tu CV Ahora',
    },
    footer: {
        tagline: 'Tu identidad profesional verificada.',
        rights: 'Todos los derechos reservados.',
        product: { title: 'Producto', overview: 'Resumen', stamps: 'Perfiles Verificados', ats: 'Exportación ATS', ai: 'Asistente IA' },
        solutions: { title: 'Soluciones', professionals: 'Para Profesionales', companies: 'Para Empresas', pricing: 'Precios' },
        resources: { title: 'Recursos', blog: 'Blog', help: 'Centro de Ayuda', status: 'Estado del Sistema' },
        company: { title: 'Empresa', about: 'Sobre Nosotros', press: 'Prensa', contact: 'Contacto' },
        links: {
            overview: '/producto/resumen',
            stamps: '/producto/sellos',
            ats: '/producto/ats',
            ai: '/producto/ia',
            professionals: '/profesionales/como-funciona',
            companies: '/empresas/busqueda',
            pricing: '/precios',
            blog: '/recursos/blog',
            help: '/profesionales/ayuda',
            status: '/recursos/estado',
            about: '/nosotros',
            press: '/nosotros/prensa',
            contact: '/nosotros/contacto'
        }
    },
    underConstruction: {
        title: '¡Esta sección está en construcción!',
        subtitle: 'Pronto podrás explorar todas las funcionalidades que estamos preparando para ti aquí. Estamos trabajando para ofrecerte la mejor experiencia.',
    },
    changelogTypes: {
        'New Feature': 'Nueva Funcionalidad',
        'Improvement': 'Mejora',
        'Bug Fix': 'Corrección de Error',
    },
    aboutUs: {
        title: 'Nuestra Misión es Potenciar la Confianza Profesional',
        subtitle: 'En YourCVPassport, creemos que la confianza es la base de toda oportunidad profesional. Nuestra misión es empoderar a profesionales y empresas con perfiles verificados que aceleren el éxito.',
        valuesTitle: 'Nuestros Valores',
        values: [
            { title: 'Integridad', description: 'Actuamos con honestidad y transparencia, asegurando que cada verificación sea un verdadero sello de confianza.' },
            { title: 'Innovación', description: 'Utilizamos tecnología de punta para simplificar la verificación y mejorar la conexión entre el talento y la oportunidad.' },
            { title: 'Empoderamiento', description: 'Damos a los profesionales el control sobre su identidad digital y a las empresas las herramientas para contratar con confianza.' }
        ],
        pressTitle: 'Prensa y Kit de Medios',
        pressSubtitle: '¿Interesado en contar nuestra historia? Ponte en contacto con nuestro equipo de comunicaciones.',
        ctaDownload: 'Explorar Página de Prensa',
        ctaContact: 'Contactar con Prensa',
        pressLink: 'nosotros/prensa',
        contactLink: 'nosotros/contacto'
    },
    customDomain: {
        title: 'Dominio Personalizado y URL Profesional: El Centro de Tu Marca Personal',
        subtitle: 'Crea un enlace memorable y profesional para tu CV. Destaca con una URL personalizada como yourcvpassport.com/cv/tunombre o conecta tu propio dominio.',
        standOutTitle: 'Destaca de la Multitud con una URL Profesional',
        firstImpressionsTitle: 'Las Primeras Impresiones Cuentan',
        firstImpressionsBody: 'Una URL limpia y personalizada demuestra profesionalismo y atención al detalle. Es lo primero que ve un reclutador.',
        whyGenericDontWorkTitle: 'Por Qué las URLs Genéricas no Funcionan',
        whyGenericDontWorkBody: '¿cuál es más fácil de recordar y se ve más profesional? Tu URL es parte de tu marca.',
        boostBrandTitle: 'Impulsa Tu Marca Personal',
        boostBrandItems: [
            'Aumenta la memorabilidad',
            'Demuestra profesionalismo',
            'Mejora el SEO para tu nombre',
            'Centraliza tu presencia en línea'
        ],
        setupTitle: 'Configura Tu URL Personalizada en Segundos',
        step1: {
            title: 'Paso 1: Elige Tu Subdominio',
            description: 'Elige un slug único que refleje tu nombre o marca.',
            subDescription: 'Este será tu enlace personal para compartir con los reclutadores.',
            formatsTitle: 'Formatos Disponibles',
            structureText: 'u otras estructuras como',
            slugOptionsText: 'nombre-apellido'
        },
        step2: {
            title: 'Paso 2 (Opcional): Conecta Tu Propio Dominio',
            description: 'Para una marca definitiva, apunta tu propio dominio (ej. tunombre.com) a tu CV.',
            subDescription: 'Esta función está disponible en nuestro plan Profesional.'
        },
        qrTitle: 'Generación de Código QR: Une lo Físico y lo Digital',
        qrBody: 'Tu URL personalizada genera automáticamente un código QR único. Añádelo a tus tarjetas de visita físicas, presentaciones o portafolios para dar a los reclutadores acceso instantáneo a tu perfil verificado.',
        qrFeatures: [
            'Código QR Instantáneo para Tu URL',
            'Perfecto para Tarjetas de Visita y Networking',
            'Rastrea Escaneos con Analíticas'
        ],
        businessCardTitle: 'Tarjeta de Visita de Muestra',
        analyticsTitle: 'Integrado con Analíticas de Perfil',
        seoTitle: 'Mejora Tu SEO Personal',
        seoBody: 'Una URL pública y personalizada te ayuda a posicionarte mejor en los resultados de búsqueda cuando los reclutadores buscan tu nombre.',
        googleVisibilityTitle: 'Visibilidad en Google',
        googleVisibilityBody: 'Una estructura de URL limpia ayuda a los motores de búsqueda a indexar tu perfil, haciéndote más visible.',
        linkedinEnhancementTitle: 'Mejora de Perfil de LinkedIn',
        linkedinEnhancementBody: 'Añade tu URL personalizada a tu información de contacto de LinkedIn para un toque profesional.',
        examplesTitle: 'Ejemplos de Buenas URLs Personalizadas',
        examples: [
            'yourcvpassport.com/cv/anagarcia',
            'yourcvpassport.com/cv/juanperez',
            'yourcvpassport.com/cv/luislopez'
        ],
        ctaTitle: '¿Listo para Reclamar Tu URL Profesional?',
        ctaSubtitle: 'Actualiza a nuestro Plan Profesional para desbloquear tu dominio personalizado y construir una marca personal más fuerte.',
        ctaButton: 'Reclama Tu URL'
    },
    urlSimulator: {
        checking: 'Comprobando...',
        check: 'Comprobar Disponibilidad',
        available: '¡Genial! Esta URL está disponible.',
        taken: 'Esta URL ya está en uso. Intenta con otra.'
    },
    productOverview: {
        title: 'Tu CV Profesional para Oportunidades Globales',
        subtitle: 'Una plataforma única y verificada para mostrar tus habilidades, experiencia y credenciales. Genera confianza con los reclutadores y desbloquea tu potencial profesional con funciones diseñadas para el éxito.',
        cta: {
            startFree: 'Empieza Gratis'
        },
        platform: {
            title: 'Una Plataforma Todo en Uno para el Crecimiento Profesional',
            subtitle: 'Desde la verificación hasta la visibilidad, te tenemos cubierto.'
        },
        features: {
            verified: {
                title: 'Perfiles Verificados (Sellos)',
                subFeatures: ['Verificación de Identidad', 'Confirmación de Educación', 'Validación de Historial Laboral'],
                description: 'Construye una confianza inigualable con los reclutadores. Nuestros sellos de verificación confirman tus credenciales en la fuente, haciendo que tu perfil destaque como auténtico y fiable.'
            },
            ats: {
                title: 'Compatibilidad de Exportación ATS',
                subFeatures: ['Formatos PDF y DOCX', 'Optimizado para el 98% de los Sistemas', 'Diseños Profesionales'],
                description: 'Exporta tu perfil verificado a formatos compatibles con ATS. Asegúrate de que tu solicitud sea vista por ojos humanos, superando los filtros de selección automatizados con plantillas diseñadas profesionalmente y compatibles.'
            },
            domain: {
                title: 'Dominio y URL Personalizados',
                subFeatures: ['URL Personalizada (yourcvpassport.com/cv/tunombre)', 'Conecta Tu Propio Dominio', 'Generación de Código QR'],
                description: 'Establece tu marca profesional con una URL memorable y personalizada. Un enlace limpio causa una gran primera impresión y es fácil de compartir en tarjetas de visita, redes sociales y firmas de correo electrónico.'
            },
            analytics: {
                title: 'Analíticas de Perfil',
                subFeatures: ['Seguimiento de Visitas en Tiempo Real', 'Datos Geográficos de Visitantes', 'Análisis de Fuentes de Tráfico'],
                description: 'Obtén información valiosa sobre quién está viendo tu perfil. Comprende a tu audiencia, sigue tu visibilidad y ajusta tu estrategia basándote en datos reales.'
            },
            ai: {
                title: 'Asistente de IA para CV y Cartas de Presentación',
                subFeatures: ['Mejora del Resumen del CV', 'Optimización de Palabras Clave', 'Generación de Cartas de Presentación'],
                description: 'Aprovecha el poder de la IA para refinar tu narrativa profesional. Nuestro asistente te ayuda a crear resúmenes convincentes, sugiere palabras clave impactantes e incluso genera cartas de presentación personalizadas.'
            },
            security: {
                title: 'Seguridad de Nivel Empresarial y RGPD',
                description: 'Tus datos son tuyos. Cumplimos plenamente con el RGPD, empleando cifrado de extremo a extremo y robustas medidas de seguridad para proteger tu información. Tú controlas lo que compartes y con quién.'
            }
        },
        demo: {
            title: 'Verlo en Acción',
            subtitle: 'Mira nuestra demostración rápida para ver lo fácil que es crear, verificar y compartir tu CV profesional.',
            feature: 'Desde la creación del perfil hasta las analíticas, en menos de 2 minutos.'
        },
        differentiator: {
            title: 'Más que un Creador de CV: una Plataforma de Confianza',
            subtitle: 'Los CV tradicionales son estáticos y no verificados. YourCVPassport es un ecosistema dinámico y de confianza que conecta talento verificado con oportunidades globales.'
        },
        comparison: {
            title: 'Cómo Nos Comparamos',
            subtitle: 'Mira cómo YourCVPassport se compara con los creadores de CV tradicionales y las redes profesionales.',
            cta: {
                getStarted: 'Comenzar',
                chooseBasic: 'Elegir Básico',
                choosePro: 'Elegir Pro',
                contactSales: 'Contactar a Ventas'
            }
        },
        finalCta: {
            title: '¿Listo para Construir Tu CV Profesional?',
            subtitle: 'Únete a miles de profesionales que están tomando el control de sus carreras.',
            button: 'Crea Tu CV Gratis'
        }
    },
    stampsPage: {
        title: 'Verifica Tus Credenciales para Posicionarte en YourCVPassport',
        subtitle: 'Destaca de la competencia con credenciales verificadas que validan tu trayectoria profesional. Construye confianza y acelera tu contratación.',
        cta: {
            start: 'Inicia Tu Verificación'
        },
        why: {
            title: 'Por Qué la Verificación es Importante en el Mercado Laboral Actual',
            trustGapTitle: 'La Brecha de Confianza',
            trustGapBody: 'Los reclutadores informan que hasta el 85% de los currículums contienen información engañosa. Esto crea una "brecha de confianza" que ralentiza la contratación y dificulta que los candidatos honestos y cualificados sean notados.',
            whatIsTitle: '¿Qué es un Sello Verificado?',
            whatIsBody: 'Un Sello Verificado es una insignia digital en tu perfil que confirma que una credencial específica, como tu identidad, título o historial laboral, ha sido autenticada por un tercero de confianza. Es tu prueba de autenticidad.'
        },
        types: [
            {
                icon: identityStampIcon,
                title: 'Sello de Verificación de Identidad',
                description: 'Confirma tu identidad con un documento oficial. Esta es la base de la confianza y un requisito previo para otros sellos.',
                subFeatures: ['Verificación única', 'Construye confianza fundamental', 'Protege contra el fraude de identidad']
            },
            {
                icon: educationStampIcon,
                title: 'Sellos de Educación e Historial Laboral',
                description: 'Verificamos tus títulos académicos y tu historial de empleo directamente con las instituciones, proporcionando una prueba irrefutable de tu trayectoria.',
                subFeatures: ['Confirma títulos y fechas', 'Valida cargos y antigüedad', 'Elimina retrasos en la verificación de antecedentes']
            }
        ],
        how: {
            title: 'Cómo Funciona Nuestro Proceso de Verificación Seguro',
            subtitle: 'Simple, seguro y diseñado para proteger tu privacidad.',
            steps: [
                { title: 'Envía Tu Información', description: 'Sube tus documentos a través de nuestro portal cifrado. Tus datos están protegidos con seguridad de nivel bancario.' },
                { title: 'Verificación por Terceros', description: 'Nuestros socios de confianza verifican de forma segura tus credenciales con las instituciones pertinentes.' },
                { title: 'Recibe Tu Sello', description: 'Una vez confirmado, el sello oficial se añade a tu perfil, haciendo que tus credenciales sean instantáneamente creíbles.' }
            ]
        },
        benefits: {
            title: 'Los Beneficios de un Perfil Verificado',
            items: [
                { title: 'Destaca ante los Reclutadores', description: 'Los perfiles verificados reciben 3 veces más visitas de los mejores reclutadores.' },
                { title: 'Acelera la Contratación', description: 'Reduce los retrasos en la verificación de antecedentes y obtén ofertas de trabajo más rápido.' },
                { title: 'Construye Credibilidad Global', description: 'Nuestros sellos son reconocidos y confiables por empresas de todo el mundo.' }
            ]
        },
        companiesTitle: 'Empresas que Priorizan Candidatos Verificados',
        testimonials: {
            title: 'Escucha a los Profesionales que se Verificaron',
            description: 'Descubre cómo los sellos verificados tuvieron un impacto real en su búsqueda de empleo.'
        },
        finalCta: {
            title: '¿Listo para Construir Confianza y Acelerar Tu Carrera?',
            subtitle: 'Verifica tus credenciales hoy y únete al nuevo estándar de confianza profesional.',
            button: 'Verifícame Ahora'
        }
    },
    atsPage: {
        title: 'Compatibilidad de Exportación ATS: Haz que tu CV Supere a los Robots',
        subtitle: 'Asegúrate de que tu solicitud sea vista por ojos humanos. Exporta tu perfil verificado en formatos PDF y DOCX compatibles con ATS, optimizados para el 98% de los sistemas de selección.',
        cta: {
            export: 'Exporta tu CV compatible con ATS'
        },
        why: {
            title: 'Por Qué la Compatibilidad con ATS no es Negociable',
            understanding: 'Entendiendo los Sistemas de Seguimiento de Candidatos (ATS)',
            description: 'Más del 95% de las empresas de Fortune 500 usan ATS para filtrar currículums. Si tu CV no está formateado correctamente, es rechazado antes de que un humano lo vea. Gráficos llamativos, columnas y tipos de archivo incorrectos pueden llevar a la descalificación automática.'
        },
        how: {
            title: 'Cómo Funciona Nuestra Función de Exportación',
            steps: [
                { title: 'Estructura de Datos Limpia', description: 'Extraemos los datos de tu perfil verificado en un formato de texto limpio de una sola columna que cualquier ATS puede analizar sin problemas.' },
                { title: 'Optimización de Palabras Clave', description: 'Nuestro sistema se asegura de que tus habilidades y experiencias clave estén formateadas como texto legible por máquina, no como imágenes u objetos complejos.' },
                { title: 'Formato Estandarizado', description: 'Aplicamos un formato profesional y universalmente aceptado para encabezados, fechas y secciones para garantizar la máxima compatibilidad.' }
            ]
        },
        formats: {
            pdf: {
                title: 'PDF: El Estándar Universal',
                features: [
                    { title: 'Conserva el Formato', description: 'Se ve perfecto en cualquier dispositivo, exactamente como lo diseñaste.' },
                    { title: 'Accesible Universalmente', description: 'El formato preferido por la mayoría de los sistemas de solicitud modernos.' },
                    { title: 'Seguro y Profesional', description: 'Formato no editable que indica un documento finalizado.' }
                ]
            },
            docx: {
                title: 'DOCX: Para Máxima Editabilidad',
                features: [
                    { title: 'Totalmente Editable', description: 'Te permite hacer pequeños ajustes para una solicitud de empleo específica después de exportar.' },
                    { title: 'Máxima Compatibilidad', description: 'Requerido por algunos ATS más antiguos o portales de solicitud de empresas específicas.' },
                    { title: 'Fácil de Leer', description: 'Formato familiar para los reclutadores que prefieren abrir documentos en Microsoft Word.' }
                ]
            }
        },
        templates: {
            title: 'Elige de una Biblioteca de Plantillas Optimizadas para ATS',
            subtitle: 'Belleza e inteligencia. Nuestras plantillas están diseñadas para ser visualmente atractivas para los humanos y perfectamente legibles para las máquinas.',
            items: [
                { title: 'Pasaporte (Nuevo)', imageUrl: '/images/templates/passport.png' },
                { title: 'Clásico', imageUrl: '/images/templates/classic.png' },
                { title: 'Profesional Moderno', imageUrl: '/images/templates/modern-professional.png' },
                { title: 'Corporativo Clásico', imageUrl: '/images/templates/classic-corporate.png' },
                { title: 'Creativo Minimalista', imageUrl: '/images/templates/creative-minimalist.png' },
                { title: 'Estándar Académico', imageUrl: '/images/templates/academic-standard.png' },
                { title: 'Moderno Minimalista', imageUrl: '/images/templates/modern-minimalist.png' },
                { title: 'Creativo Audaz', imageUrl: '/images/templates/creative-bold.png' },
                { title: 'Profesional Clásico', imageUrl: '/images/templates/professional-classic.png' },
                { title: 'Profesional de la Salud', imageUrl: '/images/templates/healthcare-professional.png' },
                { title: 'Minimalista Amarillo', imageUrl: '/images/templates/minimalist-yellow.png' },
                { title: 'Gradiente Azul', imageUrl: '/images/templates/gradient-blue.png' },
                { title: 'Rosa Coral', imageUrl: '/images/templates/coral-pink.png' },
                { title: 'Verde Minimalista', imageUrl: '/images/templates/green-minimal.png' },
                { title: 'Naranja Creativo', imageUrl: '/images/templates/creative-orange.png' },
                { title: 'Barra Lateral Oscura', imageUrl: '/images/templates/classic-sidebar.png' },
                { title: 'Encabezado Gradiente', imageUrl: '/images/templates/modern-clean.png' },
                { title: 'Línea de Tiempo Elegante', imageUrl: '/images/templates/elegant-minimal.png' },
                { title: 'Azul Profesional', imageUrl: '/images/templates/professional-blue.png' },
                { title: 'Banner Creativo', imageUrl: '/images/templates/creative-modern.png' }
            ]
        },
        optimization: {
            title: 'Mira la Diferencia: CV Estándar vs. Exportación Optimizada',
            subtitle: 'Nuestro sistema transforma perfiles visualmente complejos en documentos limpios y analizables sin perder la información principal.',
            whatMakesDifferent: '¿Qué Hace Diferente a Nuestra Exportación?',
            features: ['Elimina Columnas y Tablas', 'Simplifica Gráficos e Iconos', 'Estandariza Fuentes'],
            beforeImageUrl: 'https://picsum.photos/seed/ats-before/800/600',
            afterImageUrl: 'https://picsum.photos/seed/ats-after/800/600'
        },
        statistics: {
            title: 'Por Qué Importa la Optimización ATS',
            subtitle: 'Supera los robots y llega a manos humanas. Nuestro formato optimizado para ATS aumenta dramáticamente tus posibilidades.',
            stat1: {
                value: '75%',
                description: 'de los CVs nunca llegan a ojos humanos debido al rechazo de ATS'
            },
            stat2: {
                value: '3x',
                description: 'Mayor probabilidad de pasar el filtrado ATS con formato optimizado'
            },
            stat3: {
                value: '60%',
                description: 'Más llamadas para entrevistas con CVs compatibles con ATS'
            }
        },
        demo: {
            title: 'Exporta en Dos Clics',
            subtitle: 'Generar tu CV compatible con ATS es simple. Solo elige tu plantilla, selecciona tu formato y haz clic en "Exportar".',
            step1: 'Elige tu Plantilla',
            step2: 'Selecciona tu Formato',
            button: 'Exportar Ahora'
        },
        finalCta: {
            title: 'Deja de ser Rechazado por Robots. Empieza a Conseguir Entrevistas.',
            subtitle: 'Crea tu perfil y obtén acceso a exportaciones ilimitadas compatibles con ATS.',
            button: 'Crear Mi CV Ahora'
        }
    },
    aiPage: {
        title: 'Asistente de IA: Tu Copiloto Profesional Personal',
        subtitle: 'Aprovecha el poder de la inteligencia artificial para mejorar el resumen de tu perfil, escribir cartas de presentación convincentes y sugerir palabras clave impactantes que te hagan destacar.',
        cta: {
            try: 'Prueba el Asistente de IA'
        },
        features: {
            title: 'Cómo Nuestra IA Puede Acelerar Tu Búsqueda de Empleo',
            subtitle: 'Desde la optimización hasta la creación, nuestras herramientas de IA están diseñadas para ahorrarte tiempo y mejorar tus resultados.',
            items: {
                enhancement: {
                    title: 'Mejora del Resumen del CV',
                    description: 'Convierte tu experiencia en una narrativa poderosa. Nuestra IA analiza tu perfil y sugiere resúmenes convincentes que captan la atención de los reclutadores.'
                },
                keywords: {
                    title: 'Optimización de Palabras Clave',
                    description: 'Nuestra IA escanea las descripciones de los trabajos y sugiere palabras clave relevantes para incluir en tu perfil, aumentando tu visibilidad en las búsquedas de reclutadores y los escaneos de ATS.'
                },
                generator: {
                    title: 'Generador de Cartas de Presentación',
                    description: 'Deja de mirar una página en blanco. Proporciona una descripción del trabajo y tu perfil, y nuestra IA generará una carta de presentación personalizada y profesional en segundos.'
                }
            }
        },
        finalCta: {
            title: '¿Listo para Potenciar Tus Solicitudes?',
            subtitle: 'Desbloquea todo el poder de nuestro Asistente de IA con un Plan Profesional.',
            button: 'Actualizar a Pro'
        },
        coverLetterGenerator: {
            title: 'Generador de Cartas de Presentación con IA',
            subtitle: 'Pega la descripción del trabajo y tu CV para generar una carta de presentación personalizada en segundos.',
            jobDescription: {
                label: 'Descripción del Trabajo',
                placeholder: 'Pega la descripción del trabajo aquí...'
            },
            cvSummary: {
                label: 'Tu CV / Resumen de Perfil',
                placeholder: 'Pega tu CV o un resumen de tus habilidades y experiencia...'
            },
            generateButton: 'Generar Carta de Presentación',
            generating: 'Generando...',
            resultTitle: 'Carta de Presentación Generada:',
            errors: {
                missingFields: 'Por favor proporciona tanto la descripción del trabajo como tu CV.',
                apiKey: 'La clave API no está configurada.',
                emptyResult: 'La carta de presentación generada estaba vacía. Por favor intenta de nuevo.',
                general: 'Ocurrió un error al generar la carta de presentación. Por favor intenta de nuevo.'
            }
        }
    },
    analyticsPage: {
        title: "Analíticas de Perfil Profesional: Información Basada en Datos para Acelerar tu Crecimiento Profesional",
        subtitle: "Analíticas avanzadas para tu CV: sigue las visitas al perfil, ubicación de visitantes, fuentes de tráfico y métricas de interacción. Información basada en datos para optimizar tu búsqueda de empleo.",
        dashboardImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1024&h=768&fit=crop&q=80",
        dashboardImageAlt: "Vista previa del Panel de Analíticas",
        whyTitle: "Por Qué las Analíticas son Importantes para Tu Perfil Profesional",
        whySubtitle: "El Poder de los Datos del Perfil",
        whyDescription: "En un mercado laboral competitivo, los datos son tu ventaja. Entender quién ve tu perfil, cómo te encuentran y en qué están interesados te permite adaptar tu estrategia, enfocar tus esfuerzos y, en última instancia, conseguir el trabajo de tus sueños más rápido.",
        trackTitle: "Sigue Cada Visita a tu Perfil en Tiempo Real",
        dashboardTitle: "Panel de Visitantes en Tiempo Real",
        metrics: {
            views: "Visitas Totales al Perfil",
            visitors: "Visitantes Únicos",
            engagement: "Tasa de Interacción"
        },
        trends: {
            views: "▲ 15% este mes",
            visitors: "▲ 12% este mes",
            engagement: "▲ 5% este mes"
        },
        trendsTitle: "Tendencias Temporales: Informes de Rendimiento Diario, Semanal y Mensual",
        geoTitle: "Información Geográfica: Ve Dónde se Encuentran los Reclutadores",
        geoDescription: "Descubre tu alcance global con seguimiento a nivel de país y ciudad. Nuestro mapa de calor de ubicación de reclutadores te ayuda a identificar puntos calientes de contratación y a adaptar tu búsqueda.",
        mapImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop&q=80",
        mapImageAlt: "Mapa del mundo mostrando ubicaciones de visitantes",
        trafficTitle: "Fuentes de Tráfico: Descubre Cómo Encuentran tu CV",
        trafficDescription: "Comprende tus canales de adquisición. Ve si los reclutadores te encuentran a través de LinkedIn, enlaces directos o motores de búsqueda.",
        trafficSources: {
            linkedin: "Referencias de LinkedIn",
            direct: "Clics en Enlaces Directos",
            search: "Motores de Búsqueda y Redes Sociales"
        },
        engagementTitle: "Métricas de Interacción que Muestran lo que Funciona",
        engagementSubtitle: "Ve más allá de las visitas. Entiende cómo interactúan los reclutadores con tu perfil.",
        engagementItems: [
            { title: "Métricas de Duración de Visita", description: "Ve cuánto tiempo pasan los visitantes en tu perfil." },
            { title: "Interacción por Sección", description: "Identifica qué secciones (ej. experiencia, habilidades) reciben más atención." },
            { title: "Seguimiento de Descargas", description: "Recibe notificaciones cuando se descarga tu PDF/DOCX exportado." }
        ],
        companyInsightsTitle: "Información de Empresas: Identifica Empleadores Interesados",
        companyInsightsDescription: "Con nuestro Plan Profesional, ve los nombres de las empresas que visitan tu perfil, dándote una pista para contactarlos.",
        testimonialsTitle: "Convierte las Analíticas en Oportunidades Profesionales",
        testimonialsDescription: "Escucha a profesionales que usaron datos para potenciar su búsqueda de empleo.",
        analyticsTestimonials: [
            { quote: "El panel de analíticas me mostró que una empresa tecnológica de primer nivel en Berlín vio mi perfil. Me puse en contacto proactivamente y conseguí una entrevista. ¡Información que cambia el juego!", name: 'Anna Kowalsky', role: 'Ingeniera de Software Senior', imageUrl: 'https://picsum.photos/id/1027/100/100' },
            { quote: "Como freelance, saber qué habilidades de mi perfil generan más interacción me ayuda a adaptar mis propuestas. Las analíticas son mi arma secreta.", name: 'James Smith', role: 'Reclutador Técnico en Innovate Inc.', imageUrl: 'https://picsum.photos/id/1005/100/100' },
            { quote: "Noté que las visitas a mi perfil aumentaron después de actualizar mi titular basándome en las sugerencias de la IA. Ver los datos confirmar mi estrategia fue increíblemente motivador.", name: 'Maria Garcia', role: 'Gerente de Producto', imageUrl: 'https://picsum.photos/id/1011/100/100' }
        ],
        finalCtaTitle: "Exporta Informes para Tu Estrategia Profesional",
        finalCtaSubtitle: "Desbloquea tu panel de analíticas y empieza a tomar decisiones basadas en datos.",
        finalCtaButton: "Desbloquear Mis Analíticas"
    },
    libraryPage: {
        title: "Biblioteca de Plantillas: Recursos Profesionales para Acelerar Tu Búsqueda de Empleo",
        subtitle: "Descarga más de 50 plantillas profesionales gratuitas: CVs, cartas de presentación, correos de seguimiento, mensajes de LinkedIn. Formatos editables para cada industria. ¡Empieza a usarlas hoy!",
        filters: {
            allIndustries: "Todas las Industrias",
            allLevels: "Todos los Niveles"
        },
        modal: {
            useTemplate: "Usar esta Plantilla"
        },
        notFound: {
            title: "No se encontraron plantillas",
            subtitle: "Intenta ajustar tus filtros para encontrar la plantilla perfecta."
        },
        cta: {
            title: "Vista Previa de Todas las Plantillas",
            subtitle: "Actualiza a nuestro Plan Profesional para descargas ilimitadas, personalización avanzada y herramientas con IA.",
            button: "Actualizar a Pro"
        }
    },
    statusPage: {
        title: "Estado del Sistema y Registro de Cambios del Producto",
        subtitle: "La transparencia y la mejora continua son nuestro núcleo. Aquí puedes encontrar actualizaciones de estado en tiempo real, estadísticas de tiempo de actividad y las últimas noticias del producto.",
        operational: "✓ Todos los Sistemas Operacionales",
        healthTitle: "Salud Actual de la Plataforma",
        uptimeTitle: "Estadísticas de Tiempo de Actividad",
        uptime: {
            day: "Últimas 24 Horas",
            week: "Últimos 7 Días",
            month: "Últimos 30 Días"
        },
        subscribe: {
            title: "Suscríbete a las Actualizaciones",
            description: "Recibe notificaciones sobre incidentes y nuevas funcionalidades.",
            placeholder: "tu@email.com",
            button: "Suscribirse",
            alert: "¡Suscrito con éxito con"
        },
        changelogTitle: "Registro de Cambios del Producto",
        version: "Versión",
        roadmapTitle: "Próximas Funcionalidades en Nuestro Roadmap",
        historyTitle: "Informes Históricos de Incidentes",
        incidents: {
            latency: "Latencia Menor en la API",
            maintenance: "Mantenimiento Programado",
            noIncidents: "Sin incidentes en los últimos 90 días."
        },
        incidentStatus: {
            resolved: "Resuelto",
            completed: "Completado"
        },
        dates: {
          june15: "8 de noviembre de 2025",
          may30: "25 de octubre de 2025"
        }
    },
    missionPage: {
        title: "Nuestra Misión y Valores: Construyendo Confianza en las Credenciales Profesionales a Nivel Mundial",
        subtitle: "Aprende sobre la misión de YourCVPassport de democratizar los perfiles profesionales verificados en todo el mundo. Nuestros valores: transparencia, confianza, innovación e inclusividad.",
        problemTitle: "El Problema que Estamos Resolviendo",
        problemSubtitle: "Cerrando la Brecha de Confianza en el Reclutamiento Moderno",
        problem: {
            title: "La Crisis de Credibilidad Global",
            description: "El 78% de los reclutadores han detectado información falsa en CVs. Las empresas gastan más de $15,000 USD y 42 días promedio verificando credenciales por cada contratación. Mientras tanto, el 85% de candidatos honestos y cualificados son descartados automáticamente por sistemas ATS que no pueden distinguir talento real de perfiles inflados. El resultado: empresas perdiendo millones en malas contrataciones y profesionales talentosos invisibles en un mar de información no verificable."
        },
        solution: {
            title: "Verificación Blockchain Instantánea",
            description: "Transformamos cada credencial en un activo digital verificable mediante blockchain. Instituciones educativas, empleadores y certificadores validan directamente tus logros, creando un perfil inmutable y transparente. Resultado: reclutadores ahorran 95% del tiempo en verificaciones, candidatos destacan con credenciales auténticas comprobables en segundos, y las empresas reducen costos de contratación en un 67% mientras incrementan la calidad del talento contratado."
        },
        visionTitle: "Nuestra Visión para el Futuro del Trabajo",
        visionDescription: "Visualizamos un futuro donde cada profesional tenga una identidad digital portátil y verificada que desbloquee oportunidades a nivel mundial, haciendo que el proceso de contratación sea más transparente, eficiente y equitativo para todos.",
        valuesTitle: "Valores Fundamentales que Guían Cada Decisión",
        goal: "Nuestra Meta: Empoderar a 1 Millón de Profesionales para 2026",
        stats: {
            verified: "Profesionales Verificados",
            trustScore: "Puntuación de Confianza del Reclutador",
            countries: "Países Representados"
        },
        journeyTitle: "Nuestro Viaje Hasta Ahora",
        testimonialsTitle: "Lo que Nuestra Comunidad Dice Sobre Nuestra Misión",
        finalCta: {
            title: "Únete a Nosotros para Crear un Mercado Laboral Más Transparente",
            subtitle: "Ya seas un profesional que busca destacar o una empresa en busca de talento de confianza, sé parte del cambio.",
            button: "Crea Tu CV"
        }
    },
    pressPage: {
        title: "Prensa y Kit de Medios",
        subtitle: "Recursos para periodistas y socios de medios. Encuentra nuestros últimos anuncios, activos de marca e información de la empresa aquí.",
        cta: {
            download: "Descargar Kit de Medios Completo",
            contact: "Contactar al Equipo de Prensa"
        },
        releasesTitle: "Últimos Comunicados de Prensa",
        readMore: "Leer Más →",
        factsTitle: "YourCVPassport en Cifras",
        assetsTitle: "Activos de Marca y Directrices",
        assets: {
            logoDownloads: "Descargas de Logos",
            primary: "Logo Principal",
            icon: "Versión Solo Icono",
            download: "Descargar",
            colors: "Colores de Marca"
        },
        teamTitle: "Equipo Ejecutivo",
        seenInTitle: "Como se Vio En",
        contactTitle: "Contacta a Nuestro Equipo de Prensa",
        contactSubtitle: "Para todas las consultas de medios, por favor envíanos un correo a",
        form: {
            name: "Nombre Completo",
            outlet: "Medio de Comunicación",
            email: "Correo Electrónico",
            message: "Mensaje",
            submit: "Enviar Consulta",
            alert: "¡Gracias por tu consulta! Nuestro equipo de prensa se pondrá en contacto contigo pronto."
        }
    },
    contactPage: {
        title: "Contáctanos: Estamos Aquí para Ayudarte a Triunfar",
        subtitle: "Ponte en contacto con YourCVPassport: soporte al cliente, consultas de ventas, oportunidades de asociación. Tiempo de respuesta: 24 horas. ¡Contáctanos ahora!",
        teamTitle: "Ponte en Contacto con Nuestro Equipo Hoy",
        form: {
            title: "Envíanos un Mensaje",
            subtitle: "El tiempo de respuesta suele ser de 24 horas hábiles.",
            name: "Nombre Completo",
            email: "Dirección de Correo Electrónico",
            inquiry: "Tipo de Consulta",
            message: "Mensaje",
            submit: "Enviar Mensaje",
            alert: "¡Gracias por tu mensaje! Nos pondremos en contacto contigo en breve.",
            inquiryTypes: ["Pregunta General", "Soporte Técnico", "Problema de Facturación", "Consulta de Ventas", "Asociación", "Prensa"]
        },
        office: {
            title: "Ubicaciones de Nuestras Oficinas",
            hq: "Sede: Valencia, España",
            description: "Nuestra oficina principal está ubicada en Valencia, España, en el corazón de la ciudad, cerca del histórico Ayuntamiento. Operamos con un talentoso equipo remoto distribuido por todo el mundo."
        },
        connect: {
            title: "Conecta con Nosotros",
            social: ["LinkedIn", "X (Twitter)", "YouTube"]
        },
        faqTitle: "Preguntas Frecuentes",
        mapImageUrl: "https://maps.googleapis.com/maps/api/staticmap?center=Ayuntamiento+de+Valencia,Spain&zoom=15&size=800x600&markers=color:blue%7Clabel:V%7CAyuntamiento+de+Valencia,Spain&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
    },
    successStoriesPage: {
        title: 'Casos de Éxito: Resultados Reales de Profesionales Como Tú',
        subtitle: 'Descubre cómo los perfiles verificados, las herramientas de IA y una presencia profesional en línea han transformado carreras y acelerado el éxito.',
        stats: {
            hires: '5,000+ Contrataciones',
            promotion: '3x Aumento de Ascensos',
            timeSaved: '50% de Tiempo Ahorrado'
        },
        filters: {
            industry: 'Filtrar por Industria',
            goal: 'Filtrar por Objetivo'
        },
        featured: {
            label: 'Historia Destacada'
        },
        readFullStory: 'Leer Historia Completa',
        form: {
            title: 'Comparte Tu Caso de Éxito',
            subtitle: '¿Conseguiste un nuevo trabajo, un ascenso o un gran proyecto usando YourCVPassport? ¡Nos encantaría escucharlo!',
            name: 'Tu Nombre',
            email: 'Tu Correo Electrónico',
            message: 'Tu Historia',
            submit: 'Enviar Mi Historia',
            alert: '¡Gracias por compartir tu historia! Nuestro equipo la revisará y podría contactarte para más detalles.'
        },
        finalCta: {
            title: '¿Listo para Escribir Tu Propio Caso de Éxito?',
            subtitle: 'Crea tu perfil verificado hoy y da el siguiente paso en tu viaje profesional.',
            button: 'Comenzar Mi Historia'
        },
        modal: {
            beforeAfter: 'Transformación Antes y Después',
            video: 'Video Testimonio'
        }
    },
    aiBuilder: {
        title: "Asistente de IA para CV",
        subtitle: "Responde unas cuantas preguntas y nuestra IA creará un borrador de CV profesional para ti.",
        inputLabel: "Cuéntanos sobre ti",
        placeholder: "Por ejemplo:\n- Rol deseado: Gerente de Producto Senior\n- Años de experiencia: 8 años\n- Habilidades clave: Planificación de productos, metodologías Agile, investigación de usuarios\n- Logros recientes: Lancé una nueva función que aumentó la participación del usuario en un 20%. Lideré un equipo de 5 ingenieros y 2 diseñadores.",
        generateButton: "Generar Vista Previa del CV",
        generating: "Generando...",
        previewTitle: "Vista Previa Generada",
        loadingPreview: "La IA está creando tu CV...",
        previewPlaceholder: "La vista previa de tu CV generado por IA aparecerá aquí.",
        summaryTitle: "Resumen Profesional",
        experienceTitle: "Viñetas de Experiencia (Rol Reciente)",
        apiKeyError: "La clave de API no está configurada.",
        parseError: "No se pudo procesar el contenido generado. Por favor, inténtalo de nuevo.",
        generalError: "Ocurrió un error:",
        questionnairePrompt: (answers: any) => `Basado en las respuestas del usuario, genera un CV profesional como un único objeto JSON. El JSON debe tener estas claves: 'summary' (string), 'experience_bullets' (array de strings), 'skills' (array de objetos con 'name' y 'percentage'), 'services' (array de objetos con 'title' y 'description'), 'stats' (array de objetos con 'label' y 'value'), y 'portfolio_items' (array de objetos con 'title', 'category', y 'link'). Sé creativo y profesional.
        
        Nombre Completo: ${answers.fullName}
        Titular Deseado: ${answers.headline}
        Trabajo Más Reciente: ${answers.jobTitle} en ${answers.company}
        Logros: ${answers.achievements}
        Educación: ${answers.degree} de ${answers.institution}
        Habilidades y Dominio (ej., Habilidad:_Porcentaje): ${answers.skills}
        Servicios Ofrecidos (ej., Título_-_Descripción): ${answers.services}
        Estadísticas de Carrera (ej., Valor_-_Etiqueta): ${answers.stats}
        Proyectos de Portafolio (ej., Título_-_Categoría_-_Enlace): ${answers.portfolio}
        Ubicación: ${answers.location}
        Disponibilidad: ${answers.availability}
        Teléfono: ${answers.phone}
        LinkedIn: ${answers.linkedin}
        GitHub/Portafolio: ${answers.github}
        `,
        questionnaire: {
            title: "Asistente de IA para CV",
            back: "Atrás",
            next: "Siguiente",
            finish: "Finalizar y Generar CV",
            generating: "Generando...",
            steps: [
                { key: "fullName", question: "¿Cuál es tu nombre completo?", placeholder: "ej., Ana García" },
                { key: "headline", question: "¿Cuál es tu titular profesional deseado?", placeholder: "ej., Gerente de Producto Senior" },
                { key: "jobTitle", question: "¿Cuál fue tu cargo más reciente?", placeholder: "ej., Gerente de Producto" },
                { key: "company", question: "¿Y dónde trabajaste?", placeholder: "ej., Innovate Inc." },
                { key: "achievements", question: "Describe tus responsabilidades y logros clave en ese puesto.", placeholder: "ej., Lideré el lanzamiento de una nueva función que aumentó la interacción del usuario en un 20%.", type: "textarea" },
                { key: "degree", question: "¿Cuál es tu nivel de educación más alto?", placeholder: "ej., Máster en Ciencias de la Computación" },
                { key: "institution", question: "¿A qué institución asististe?", placeholder: "ej., Universidad de Tecnología" },
                { key: "skills", question: "Enumera tus habilidades principales y tu dominio (1-100).", placeholder: "ej., Planificación de Productos:90, Agile:95", type: "textarea" },
                { key: "services", question: "¿Qué servicios ofreces? (uno por línea, formato: Título - Descripción)", placeholder: "ej., Diseño Web - Creación de sitios web responsivos", type: "textarea" },
                { key: "stats", question: "Enumera algunas estadísticas clave de tu carrera. (una por línea, formato: Valor - Etiqueta)", placeholder: "ej., 8+ - Años de Experiencia", type: "textarea" },
                { key: "portfolio", question: "Enumera algunos proyectos de tu portafolio. (uno por línea, formato: Título - Categoría - Enlace)", placeholder: "ej., Rediseño de E-commerce - UX/UI - https://proyecto.enlace", type: "textarea" },
                { key: "location", question: "¿Dónde te encuentras?", placeholder: "ej., Berlín, Alemania" },
                { key: "availability", question: "¿Cuál es tu disponibilidad?", placeholder: "ej., Disponible para tiempo completo, media jornada, contrato" },
                { key: "phone", question: "¿Cuál es tu número de teléfono?", placeholder: "ej., +34 123 456 789" },
                { key: "linkedin", question: "¿Cuál es la URL de tu perfil de LinkedIn?", placeholder: "ej., https://linkedin.com/in/anagarcia" },
                { key: "github", question: "¿Cuál es la URL de tu GitHub u otro portafolio?", placeholder: "ej., https://github.com/anagarcia" }
            ]
        },
        review: {
            title: "Paso 2: Revisa y Edita",
            subtitle: "Nuestra IA ha generado un borrador. Siéntete libre de hacer las modificaciones que desees antes de continuar.",
            summaryLabel: "Resumen Profesional",
            experienceLabel: "Hitos de Experiencia",
            button: "Guardar y Actualizar Perfil"
        },
        templates: {
            title: "Paso 3: Elige Tu Plantilla",
            subtitle: "Selecciona una plantilla para ver una vista previa en vivo de tu nuevo CV. Haz clic en 'Guardar Plantilla' para aplicarla a tu perfil.",
            saveButton: "Guardar Plantilla",
            saving: "Guardando...",
            saveSuccess: "¡Plantilla Guardada!"
        }
    },
    dashboard: {
        title: "Panel de Control",
        welcome: (name: string) => `¡Bienvenido de nuevo, ${name}!`,
        loading: "Cargando...",
        subtitle: "Gestiona tu perfil profesional y destaca entre miles",
        firstLoginWelcome: {
            title: "¡Bienvenido a YourCVPassport!",
            description: "Para comenzar a usar todas las funcionalidades del dashboard, completa tu perfil profesional. Solo te tomará unos minutos.",
            progress: "Progreso del perfil",
            startButton: "Comenzar mi perfil",
            continueButton: "Continuar mi perfil",
        },
        darkMode: {
            title: "Modo Oscuro",
            light: "Cambiar a modo claro",
            dark: "Cambiar a modo oscuro",
        },
        quickActions: {
            title: "Acciones Rápidas",
            updateProfile: "Actualizar Perfil",
            exportCV: "Exportar CV",
            shareCV: "Compartir CV",
            analytics: "Analíticas",
        },
        stats: {
            profileVisits: "Visitas al Perfil",
            ctaClicks: "Clics en CTA",
            experiences: "Experiencias",
            skills: "Habilidades",
            last30Days: "Últimos 30 días",
            totalAccumulated: "Total acumulado",
            registered: "Registradas",
            added: "Agregadas",
        },
        profileCompletion: {
            completeProfile: "Completa tu perfil profesional",
            profileAt: "Tu perfil está al",
            increasesVisibility: "Un perfil completo aumenta tu visibilidad hasta 5x más.",
            completeNow: "Completar ahora",
            aiAssistant: "Asistente IA",
            profileComplete: "¡Perfil completo!",
            excellentWork: "Excelente trabajo. Tu perfil está completo al",
            complete: "y optimizado para atraer más oportunidades.",
            viewProfile: "Ver mi perfil",
            downloadPDF: "Descargar PDF",
        },
        weeklyVisits: {
            title: "Visitas al Perfil",
            last7Days: "Últimos 7 días",
            monthlyView: "Vista mensual",
            calendarView: "Vista de calendario",
            visits: "visitas",
            active: "Activo",
            total: "Total",
            less: "Menos",
            more: "Más",
            days: {
                mon: "Lun",
                tue: "Mar",
                wed: "Mié",
                thu: "Jue",
                fri: "Vie",
                sat: "Sáb",
                sun: "Dom",
            },
        },
        newUserWelcome: {
            startCreating: "Comienza creando tu perfil profesional",
            whatCanYouDo: "¿Qué puedes hacer con YourCVPassport?",
        },
        recentActivity: {
            title: "Actividad Reciente",
            profileVisits: (count: number) => `${count} visitas al perfil`,
            ctaClicks: (count: number) => `${count} clics en CTA`,
            profileUpdated: "Perfil actualizado",
            last7Days: "Últimos 7 días",
            totalAccumulated: "Total acumulado",
        },
        nextSteps: {
            title: "Próximos Pasos",
            add3Experiences: "Agrega al menos 3 experiencias laborales",
            completeSummary: "Completa tu resumen profesional",
            addSkills: "Añade tus habilidades clave",
        },
        quickSummary: {
            title: "Resumen Rápido",
            profileCreated: "Perfil creado",
            lastUpdate: "Última actualización",
            today: "Hoy",
            registrationDate: "Fecha de registro",
            activeTemplate: "Plantilla activa",
            visibility: "Visibilidad",
            public: "Pública",
        },
        quickActionCards: {
            viewCV: "Ver mi CV",
            viewCVDescription: "Visualiza tu perfil público",
            exportPDF: "Exportar PDF",
            exportPDFDescription: "Descarga tu CV",
            analytics: "Analíticas",
            analyticsDescription: "Estadísticas detalladas",
        },
        cards: {
            addNew: "Añadir Nuevo",
            edit: "Editar",
            delete: "Eliminar",
            noItems: "Aún no hay elementos.",
            notAvailable: "N/D",
            profile: {
                title: "Información del Perfil",
                fullName: "Nombre Completo",
                headline: "Titular",
                summary: "Resumen / Biografía",
                nameLabel: "Nombre:",
                headlineLabel: "Titular:",
                summaryLabel: "Resumen:",
                editProfile: "Editar Perfil",
            },
            experience: {
                title: "Experiencia Laboral",
            },
            education: {
                title: "Educación",
            },
            skills: {
                title: "Habilidades",
                addPlaceholder: "Añadir nueva habilidad",
                add: "Añadir",
                noSkills: "Aún no hay habilidades.",
            },
            services: { title: "Servicios" },
            stats: { title: "Estadísticas" },
            portfolio: { title: "Proyectos de Portafolio" },
            photo: {
                title: "Foto de Perfil",
                uploading: "Subiendo...",
                change: "Cambiar Foto",
            },
            design: {
                title: "Plantilla y Diseño de CV",
                currentTemplate: "Tu plantilla actual es",
                changeTemplate: "Cambiar Plantilla",
            },
            templateSelector: {
                title: "Selecciona tu Plantilla",
                subtitle: "Elige una plantilla profesional para tu CV",
                description: "Selecciona una plantilla que mejor represente tu estilo profesional. Haz clic en cualquier plantilla para ver una vista previa completa.",
                previewHover: "Vista previa con tus datos",
                proLabel: "PRO",
                proPlan: "Plan Pro",
                selected: "Seleccionada",
                currentTemplate: "Plantilla Actual",
                useTemplate: "Usar Esta Plantilla",
                savingTemplate: "Guardando selección de plantilla...",
                upgradeTitle: "Desbloquea Todas las Plantillas Premium",
                upgradeDescription: (count: number) => `Actualiza a Pro para acceder a las ${count} plantillas profesionales y destacar entre la multitud`,
                upgradeCta: "Actualizar a Pro",
                previewModalTitle: (name: string) => `Vista Previa de ${name}`,
                previewModalSubtitle: "Vista previa de tu perfil con esta plantilla",
                closePreview: "Cerrar",
            },
            settings: {
                title: "Perfil Público y Ajustes de SEO",
                customURL: "URL Personalizada",
                metaTitle: "Meta Título (para SEO)",
                metaDescription: "Meta Descripción (para SEO)",
                accentColor: "Color de Acento",
                save: "Guardar Ajustes",
            },
        },
        modals: {
            add: "Añadir",
            edit: "Editar",
            cancel: "Cancelar",
            save: "Guardar",
            update: "Actualizar",
            addExperience: "Añadir Experiencia",
            editExperience: "Editar Experiencia",
            addNewExperience: "Añadir Nueva Experiencia",
            title: "Título",
            jobTitle: "Título del Puesto",
            company: "Empresa",
            startDate: "Fecha de Inicio",
            endDate: "Fecha de Fin",
            currentJob: "Actualmente trabajo aquí",
            description: "Descripción",
            keyAchievements: "Logros Clave",
            addAchievement: "+ Añadir Logro",
            achievementPlaceholder: "ej., Lideré un equipo de 5 ingenieros...",
            noExperienceYet: "Aún no se ha añadido experiencia. Haz clic en \"Añadir Experiencia\" para comenzar.",
            jobTitlePlaceholder: "Ingeniero de Software Senior",
            companyPlaceholder: "Tech Corp",
            descriptionPlaceholder: "Describe tu rol y responsabilidades...",
            deleteConfirm: "¿Estás seguro de que quieres eliminar esta experiencia?",
            addEducation: "Añadir Educación",
            editEducation: "Editar Educación",
            addNewEducation: "Añadir Nueva Educación",
            institution: "Institución",
            institutionPlaceholder: "Universidad de Madrid",
            degree: "Título / Grado",
            degreePlaceholder: "Licenciatura en Ingeniería",
            fieldOfStudy: "Campo de Estudio",
            fieldOfStudyPlaceholder: "Ingeniería Informática",
            currentStudy: "Actualmente estudio aquí",
            noEducationYet: "Aún no se ha añadido educación. Haz clic en \"Añadir Educación\" para comenzar.",
            deleteEducationConfirm: "¿Estás seguro de que quieres eliminar esta educación?",
            service: "Servicio",
            stat: "Estadística",
            value: "Valor (ej. 8+)",
            label: "Etiqueta (ej. Años de Experiencia)",
            portfolioItem: "Elemento del Portafolio",
            category: "Categoría",
            // Skills
            addSkill: "Añadir Habilidad",
            editSkill: "Editar Habilidad",
            skillName: "Nombre de la Habilidad",
            skillLevel: "Nivel",
            skillNamePlaceholder: "ej., JavaScript, Python, Diseño...",
            skillPercentage: "Porcentaje de Habilidad (0-100)",
            yearsOfExperience: "Años de Experiencia",
            year: "año",
            years: "años",
            noSkillsYet: "Aún no se han añadido habilidades. Haz clic en \"Añadir Habilidad\" para comenzar.",
            deleteSkillConfirm: "¿Estás seguro de que quieres eliminar esta habilidad?",
            beginner: "Principiante",
            intermediate: "Intermedio",
            advanced: "Avanzado",
            expert: "Experto",
            restoreDraft: "¿Restaurar borrador guardado?",
            restoreDraftTitle: "Restaurar Borrador",
            restoreButton: "Restaurar",
            discardButton: "Descartar",
            saveError: "Error al guardar. Tus datos están guardados localmente y puedes intentar de nuevo.",
            // Languages
            addLanguage: "Añadir Idioma",
            editLanguage: "Editar Idioma",
            addNewLanguage: "Añadir Nuevo Idioma",
            languageName: "Idioma",
            languageLevel: "Nivel",
            languageNamePlaceholder: "ej., Inglés, Español...",
            noLanguagesYet: "Aún no se han añadido idiomas. Haz clic en \"Añadir Idioma\" para comenzar.",
            deleteLanguageConfirm: "¿Estás seguro de que quieres eliminar este idioma?",
            native: "Nativo",
            // Portfolio
            addPortfolioItem: "Añadir Proyecto",
            editPortfolioItem: "Editar Proyecto",
            addNewPortfolioItem: "Añadir Nuevo Proyecto",
            projectTitle: "Título del Proyecto",
            projectCategory: "Categoría",
            projectLink: "Enlace",
            projectDescription: "Descripción",
            projectImage: "Imagen",
            uploadImage: "Subir Imagen",
            uploading: "Subiendo...",
            chooseFile: "Elegir Archivo",
            projectTitlePlaceholder: "Mi Proyecto Increíble",
            projectCategoryPlaceholder: "Desarrollo Web",
            projectLinkPlaceholder: "https://miproyecto.com",
            projectDescriptionPlaceholder: "Describe tu proyecto...",
            noPortfolioYet: "Aún no se han añadido proyectos. Haz clic en \"Añadir Proyecto\" para comenzar.",
            deletePortfolioConfirm: "¿Estás seguro de que quieres eliminar este proyecto?",
            // Certifications
            addCertification: "Añadir Certificación",
            editCertification: "Editar Certificación",
            certificationTitle: "Nombre de la Certificación",
            certificationIssuer: "Emisor",
            certificationIssueDate: "Fecha de Emisión",
            certificationExpiryDate: "Fecha de Expiración",
            certificationCredentialId: "ID de Credencial",
            certificationCredentialUrl: "URL de Credencial",
            certificationTitlePlaceholder: "AWS Certified Solutions Architect",
            certificationIssuerPlaceholder: "Amazon Web Services",
            certificationDescriptionPlaceholder: "Describe esta certificación...",
            noCertificationsYet: "Aún no se han añadido certificaciones. Haz clic en \"Añadir Certificación\" para comenzar.",
            deleteCertificationConfirm: "¿Estás seguro de que quieres eliminar esta certificación?",
            neverExpires: "No expira",
            // Collaborations
            addCollaboration: "Añadir Colaboración",
            editCollaboration: "Editar Colaboración",
            collaborationTitle: "Título de la Colaboración",
            collaborationOrganization: "Organización",
            collaborationRole: "Tu Rol",
            collaborationStartDate: "Fecha de Inicio",
            collaborationEndDate: "Fecha de Fin",
            collaborationUrl: "URL del Proyecto",
            collaborationCollaborators: "Colaboradores",
            currentCollaboration: "Colaboración actual",
            collaborationTitlePlaceholder: "Proyecto Open Source XYZ",
            collaborationOrganizationPlaceholder: "GitHub / Apache Foundation",
            collaborationRolePlaceholder: "Contribuidor Principal",
            collaborationDescriptionPlaceholder: "Describe tu colaboración y contribuciones...",
            collaborationCollaboratorsPlaceholder: "Nombres separados por comas",
            noCollaborationsYet: "Aún no se han añadido colaboraciones. Haz clic en \"Añadir Colaboración\" para comenzar.",
            deleteCollaborationConfirm: "¿Estás seguro de que quieres eliminar esta colaboración?",
            // Tabs for Portfolio Section
            tabProjects: "Proyectos",
            tabCertifications: "Certificaciones",
            tabCollaborations: "Colaboraciones",
            // Categories
            webDevelopment: "Desarrollo Web",
            mobileDevelopment: "Desarrollo Móvil",
            design: "Diseño",
            dataScience: "Ciencia de Datos",
            other: "Otro",
        },
        alerts: {
            settingsSaved: "¡Ajustes guardados!",
            confirmDelete: "¿Estás seguro?",
        },
        errors: {
            loadProfile: "No se pudo cargar el perfil.",
            urlTaken: "Esta URL personalizada ya está en uso.",
            skillExists: (name: string) => `La habilidad "${name}" ya existe.`,
        },
        preferences: {
            title: "Preferencias",
            language: {
                title: "Configuración de Idioma",
                label: "Idioma de la Interfaz",
                description: "Selecciona tu idioma preferido para el panel de control y la aplicación",
                english: "Inglés (English)",
                spanish: "Español",
            },
            jobPreferences: {
                title: "Preferencias Laborales",
                seekingStatus: "Estado de Búsqueda",
                seekingStatusDescription: "Indica si estás buscando activamente oportunidades laborales. Solo los que buscan activamente mostrarán el badge de 'Open to opportunities' en su CV público.",
                seekingOpen: "Busco Activamente",
                seekingPassive: "Abierto a Ofertas",
                seekingNotLooking: "No Busco Actualmente",
                jobType: "Tipo de Trabajo (selecciona todos los que apliquen)",
                availability: "Disponibilidad para Empezar",
                selectAvailability: "Selecciona disponibilidad",
                immediate: "Inmediato",
                twoWeeks: "Aviso de 2 Semanas",
                oneMonth: "Aviso de 1 Mes",
                twoMonths: "2+ Meses",
                notLooking: "No Disponible",
                salary: "Expectativas Salariales",
                minSalary: "Salario mínimo",
                maxSalary: "Salario máximo",
                currency: "Moneda",
                workLocation: "Preferencia de Ubicación de Trabajo",
                willingToRelocate: "Dispuesto a reubicarse",
                preferredLocations: "Ubicaciones Preferidas",
                preferredLocationsOld: "Ubicaciones Preferidas (separadas por comas)",
                locationPlaceholder: "ej., San Francisco, Nueva York, Remoto",
                locationHelper: "Ingresa las ubicaciones separadas por comas",
                selectCountry: "Selecciona un país...",
                selectCity: "Selecciona una ciudad...",
                firstSelectCountry: "Primero selecciona un país",
                jobTypes: {
                    fullTime: "Tiempo Completo",
                    partTime: "Medio Tiempo",
                    contract: "Contrato",
                    freelance: "Freelance",
                    internship: "Pasantía",
                },
                remotePreferences: {
                    remote: "Remoto",
                    hybrid: "Híbrido",
                    onSite: "Presencial",
                    flexible: "Flexible",
                },
            },
            saveButton: "Guardar Preferencias",
            unsavedChanges: "Tienes cambios sin guardar",
        },
        identity: {
            title: "Identidad",
            professionalInfo: "Información Profesional",
            contactInfo: "Información de Contacto",
            changePhoto: "Cambiar",
            country: "País",
            uploadPhoto: "Subir Foto",
            uploading: "Subiendo...",
            photoHelper: "JPG, PNG, GIF o WebP (máx 5MB)",
            fullName: "Nombre Completo",
            fullNameRequired: "Nombre Completo *",
            fullNamePlaceholder: "Juan Pérez",
            headline: "Título Profesional",
            headlineRequired: "Título Profesional *",
            headlinePlaceholder: "Ingeniero de Software Senior",
            location: "Ubicación",
            phone: "Teléfono",
            remoteWork: "Abierto a trabajo remoto",
            socialLinks: "Enlaces Sociales",
            linkedinUrl: "URL de LinkedIn",
            githubUrl: "URL de GitHub",
            portfolioUrl: "URL de Portafolio",
            aboutMe: "Acerca de Mí",
            aboutMePlaceholder: "Cuéntanos sobre ti, tu experiencia y qué te hace único...",
            saveChanges: "Guardar Cambios",
            unsavedChanges: "Tienes cambios sin guardar",
            noChanges: "Sin Cambios",
            invalidLinkedin: "Por favor ingresa una URL válida de LinkedIn (https://linkedin.com/in/usuario)",
            invalidGithub: "Por favor ingresa una URL válida de GitHub (https://github.com/usuario)",
            invalidPortfolio: "Por favor ingresa una URL válida de Portafolio",
            restoreDraft: "¿Restaurar borrador guardado?",
            saveError: "Error al guardar. Tus datos están guardados localmente y puedes intentar de nuevo.",
        },
        auth: {
            login: {
                title: "Bienvenido de Nuevo",
                subtitle: "Inicia sesión en tu cuenta profesional de CV",
                email: "Correo Electrónico",
                password: "Contraseña",
                rememberMe: "Recordarme",
                forgotPassword: "¿Olvidaste tu contraseña?",
                loginButton: "Iniciar Sesión",
                noAccount: "¿No tienes una cuenta?",
                signUpLink: "Regístrate",
                divider: "O continuar con",
                loggingIn: "Iniciando sesión...",
                emailPlaceholder: "tu.email@ejemplo.com",
                passwordPlaceholder: "Ingresa tu contraseña",
                submit: "Iniciar Sesión",
                signUp: "Regístrate gratis",
                orContinue: "O continuar con",
                welcomeTitle: "Bienvenido de Nuevo",
                welcomeSubtitle: "Continúa construyendo tu futuro profesional con nuestras poderosas herramientas de CV y asistencia de IA.",
                feature1: "Plantillas de CV profesionales",
                feature2: "Sugerencias con IA",
                feature3: "Seguro y privado",
            },
            signup: {
                title: "Crea tu Cuenta",
                subtitle: "Únete a miles de profesionales que confían en YourCVPassport",
                fullName: "Nombre Completo",
                email: "Correo Electrónico",
                password: "Contraseña",
                confirmPassword: "Confirmar Contraseña",
                agreeToTerms: "Acepto los",
                termsOfService: "Términos de Servicio",
                and: "y",
                privacyPolicy: "Política de Privacidad",
                signupButton: "Crear Cuenta",
                creatingAccount: "Creando cuenta...",
                haveAccount: "¿Ya tienes una cuenta?",
                loginLink: "Inicia sesión",
                divider: "O regístrate con",
                passwordRequirements: "Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números",
                fullNamePlaceholder: "Juan Pérez",
                emailPlaceholder: "tu.email@ejemplo.com",
                passwordPlaceholder: "Mínimo 8 caracteres",
                confirmPasswordPlaceholder: "Repite tu contraseña",
                orContinue: "O continuar con",
                checkEmail: "¡Revisa tu correo!",
                checkEmailDesc: "Te hemos enviado un enlace de confirmación a",
                checkEmailAction: "Haz clic en el enlace del correo para iniciar sesión al instante.",
                sending: "Enviando...",
                welcomeTitle: "Comienza tu Viaje",
                welcomeSubtitle: "Únete a miles de profesionales que crean CVs destacados con nuestra plataforma impulsada por IA.",
                feature1: "Gratis para empezar",
                feature2: "No se requiere tarjeta de crédito",
                feature3: "Configura en menos de 2 minutos",
            },
            oauth: {
                google: "Continuar con Google",
                linkedin: "Continuar con LinkedIn",
            },
            magicLink: {
                title: "Enlace Mágico",
                subtitle: "Te enviaremos un enlace seguro para iniciar sesión",
                email: "Correo Electrónico",
                sendButton: "Enviar Enlace Mágico",
                sending: "Enviando...",
                checkEmail: "¡Revisa tu correo!",
                emailSentMessage: "Te hemos enviado un enlace mágico a",
                clickLink: "Haz clic en el enlace para iniciar sesión de forma segura.",
                backToLogin: "Volver a Iniciar Sesión",
                emailPlaceholder: "tu.email@ejemplo.com",
                submit: "Enviar Enlace Mágico",
            },
            recovery: {
                title: "Recuperar Contraseña",
                subtitle: "Ingresa tu correo electrónico para restablecer tu contraseña",
                email: "Correo Electrónico",
                sendButton: "Enviar Instrucciones de Recuperación",
                sending: "Enviando...",
                checkEmail: "¡Revisa tu correo!",
                emailSentMessage: "Te hemos enviado instrucciones de recuperación a",
                backToLogin: "Volver a Iniciar Sesión",
                resetPassword: "Restablecer Contraseña",
                newPassword: "Nueva Contraseña",
                confirmPassword: "Confirmar Nueva Contraseña",
                resetButton: "Restablecer Contraseña",
                resetting: "Restableciendo...",
                successMessage: "Tu contraseña ha sido restablecida exitosamente",
                loginNow: "Iniciar sesión ahora",
                emailPlaceholder: "tu.email@ejemplo.com",
                submit: "Enviar Enlace",
                newPasswordTitle: "Establecer Nueva Contraseña",
                newPasswordSubtitle: "Ingresa tu nueva contraseña abajo",
                newPasswordPlaceholder: "Mínimo 8 caracteres",
                confirmPasswordPlaceholder: "Repite tu nueva contraseña",
                submitNewPassword: "Actualizar Contraseña",
                successTitle: "¡Contraseña Actualizada!",
                successDesc: "Tu contraseña ha sido actualizada exitosamente.",
                successAction: "Volver a iniciar sesión",
            },
            errors: {
                invalidEmail: "Por favor ingresa un correo electrónico válido",
                emailRequired: "El correo electrónico es obligatorio",
                passwordRequired: "La contraseña es obligatoria",
                passwordTooShort: "La contraseña debe tener al menos 8 caracteres",
                passwordsNotMatch: "Las contraseñas no coinciden",
                fullNameRequired: "El nombre completo es obligatorio",
                termsRequired: "Debes aceptar los Términos de Servicio",
                invalidCredentials: "Correo electrónico o contraseña incorrectos",
                emailAlreadyExists: "Este correo electrónico ya está registrado",
                weakPassword: "La contraseña es demasiado débil. Debe incluir mayúsculas, minúsculas y números",
                serverError: "Algo salió mal. Por favor intenta de nuevo",
                networkError: "Error de red. Por favor verifica tu conexión",
                sessionExpired: "Tu sesión ha expirado. Por favor inicia sesión nuevamente",
                unauthorized: "No autorizado. Por favor inicia sesión",
                tooManyAttempts: "Demasiados intentos. Por favor intenta más tarde",
            },
            success: {
                loginSuccess: "¡Inicio de sesión exitoso!",
                signupSuccess: "¡Cuenta creada exitosamente! Por favor revisa tu correo para confirmar",
                magicLinkSent: "¡Enlace mágico enviado! Revisa tu correo",
                passwordResetSent: "¡Instrucciones de recuperación enviadas! Revisa tu correo",
                passwordUpdated: "¡Contraseña actualizada exitosamente!",
            },
        },
        menu: {
            dashboard: "Dashboard",
            myProfile: "Mi Perfil",
            template: "Template",
            cvEditor: "Editor de CV",
            viewCV: "Ver mi CV",
            visas: "Visas",
            cvVersions: "Versiones de CV",
            export: "Exportar",
            share: "Compartir",
            analytics: "Analítica",
            leads: "Leads",
            stamps: "Verificaciones",
            successStories: "Casos de Éxito",
            settings: "Ajustes",
            help: "Ayuda",
            backToHome: "Volver al Inicio",
            signOut: "Cerrar Sesión",
            user: "Usuario",
            profileIncomplete: "Por favor completa tu perfil antes de ver o compartir tu CV. Como mínimo, añade tu nombre completo, título profesional y resumen.",
            editManually: "Editar manualmente",
            completeProfileFirst: "Completa tu perfil primero",
            editProfile: "Editar Perfil",
            viewPublicProfile: "Ver Perfil Público",
        },
        successStories: {
            title: "¡Comparte Tu Caso de Éxito!",
            subtitle: "¿Conseguiste un nuevo trabajo, un ascenso o un gran proyecto usando YourCVPassport? ¡Nos encantaría escucharlo!",
            newStory: "Compartir Mi Historia",
            shareStory: "Compartir Mi Historia",
            editStory: "Editar Mi Historia",
            myStories: "Mis Historias",
            noStories: "Aún no has compartido ninguna historia",
            noStoriesHelp: "Haz clic en el botón de arriba para compartir tu primera historia de éxito",
            approved: "✓ Aprobada",
            pending: "⏳ Pendiente de aprobación",
            submitted: "Enviada",
            error: "Error",
            success: "Éxito",
            loadError: "Error al cargar tus historias",
            cannotEditApproved: "No puedes editar una historia que ya ha sido aprobada.",
            updateSuccess: "Historia actualizada correctamente. Está pendiente de aprobación.",
            submitSuccess: "¡Historia enviada correctamente! Será revisada por nuestro equipo antes de ser publicada.",
            saveError: "Error al guardar",
            confirmDelete: "Confirmar eliminación",
            deleteMessage: "¿Eliminar tu historia \"{headline}\"? Esta acción no se puede deshacer.",
            delete: "Eliminar",
            cancel: "Cancelar",
            deleteSuccess: "Historia eliminada correctamente",
            deleteError: "Error al eliminar",
            edit: "Editar",
            update: "Actualizar",
            submit: "Enviar Historia",
            form: {
                name: "Tu Nombre",
                role: "Tu Rol/Posición",
                headline: "Titular de Tu Historia",
                headlinePlaceholder: "Ej: Conseguí mi trabajo soñado en solo 2 semanas",
                fullStory: "Tu Historia Completa",
                storyPlaceholder: "Cuéntanos cómo YourCVPassport te ayudó a alcanzar tu objetivo profesional...",
                industry: "Industria",
                goal: "Objetivo Alcanzado",
                imageUrl: "URL de Tu Foto",
                imageHelp: "Sugerencia: Puedes usar la URL de tu foto de perfil de YourCVPassport",
                beforeImage: "URL Imagen \"Antes\" (opcional)",
                afterImage: "URL Imagen \"Después\" (opcional)",
            }
        },
        editor: {
            title: "Editar Perfil",
            subtitle: "Completa tu perfil profesional para destacar ante empleadores",
            lastSaved: (time: string) => `Último guardado: ${time}`,
            underConstruction: "En construcción",
            aiAssistant: "Asistente IA",
            completeWithAI: "Completar con IA Asistente",
        },
        welcomeCard: {
            title: "¡Tu perfil está casi listo!",
            description: (minutes: number) => `Completa tu información en solo ${minutes} minutos con nuestro asistente inteligente. Te haremos preguntas sencillas y nosotros nos encargamos del resto.`,
            progressLabel: "Progreso actual",
            completeButton: "Completar con IA Asistente",
            editManually: "Editar manualmente",
            missingFields: {
                fullName: "Nombre completo",
                headline: "Título profesional",
                summary: "Resumen",
                avatar: "Foto de perfil",
                location: "Ubicación",
                phone: "Teléfono",
                social: "Redes sociales",
                experience: "Experiencia laboral",
                education: "Educación",
                skills: "Habilidades",
            },
        },
        analytics: {
            visits30Days: "Visitas (30 días)",
            ctaClicks: "Clics en CTAs",
            completed: "Completado",
            verifiedStamps: "Stamps Verificados",
            completeProfile: "Completar perfil",
            credentials: "Credenciales",
            totalAccumulated: "Total acumulado",
            trackAnalytics: "Rastrear Analíticas",
            trackAnalyticsDescription: "Permite el seguimiento de visitas",
        },
        stamps: {
            title: "Verificaciones de Credenciales",
            subtitle: "Verifica tus credenciales para generar confianza con empleadores",
            verified: "Verificadas",
            pending: "Pendientes",
            rejected: "Rechazadas",
            expired: "Expiradas",
        },
        cvBuilder: {
            title: "¡Crea tu Propio CV Profesional!",
            description: "Diseña un CV impresionante con nuestras plantillas personalizables. Elige entre más de 15 diseños profesionales y destaca entre los demás candidatos.",
            features: [
                "Más de 15 plantillas profesionales",
                "Personalización de colores y estilos",
                "Descarga en PDF de alta calidad"
            ],
            createCV: "Crear mi CV",
            viewCV: "Ver mi CV",
        },
        visitsChart: {
            title: "Visitas últimos 30 días",
        },
        trafficSources: {
            title: "Fuentes de Tráfico",
        },

        recentLeads: {
            title: "Leads Recientes",
            viewDetails: "Ver detalles",
            noLeads: "No hay leads aún",
        },
        cvCanvas: {
            backToDashboard: "Volver al Dashboard",
            exportPDF: "Exportar PDF",
            help: "Ayuda",
        },
        templateSection: {
            title: "Selecciona tu Plantilla",
            subtitle: "Elige una plantilla profesional para tu CV",
            selectTemplate: "Selecciona una plantilla profesional",
            templateUpdated: "Plantilla actualizada correctamente",
            templateUpdateError: "Error al actualizar la plantilla",
        },
        export: {
            title: "Exportar CV",
            subtitle: "Descarga tu CV en diferentes formatos",
            pdf: {
                title: "Exportar PDF",
                description: "Descarga tu CV en formato PDF",
                button: "Descargar PDF",
                printDialog: {
                    title: "Generando PDF de tu CV",
                    description: "Tu CV se está procesando y descargará automáticamente como archivo PDF con todos los colores y diseño.",
                    preparing: "Preparando CV...",
                    capturing: "Capturando diseño...",
                    generating: "Generando PDF...",
                    downloading: "Descargando...",
                    tip: "El archivo PDF se guardará en tu carpeta de descargas con todos los colores y gráficos.",
                    confirm: "Descargar PDF",
                },
            },
            json: {
                title: "Exportar JSON",
                description: "Descarga los datos de tu perfil en formato JSON",
                button: "Descargar JSON",
            },
            publicLink: "Link Público",
            publicLinkDescription: "Comparte tu CV con un link público personalizado",
            copyLink: "Copiar Link",
            popupBlocked: "Por favor, permite las ventanas emergentes para exportar tu CV a PDF",
        },
        share: {
            title: "Compartir CV",
            subtitle: "Comparte tu CV profesional en redes sociales",
            publicLink: "Link Público",
            publicLinkDescription: "Comparte tu CV con un link público personalizado",
            copyLink: "Copiar Link",
            copy: "Copiar",
            yourPublicUrl: "Tu URL pública",
            seoOptimizedUrl: "URL optimizada para SEO",
            improveUrl: "Mejora tu URL:",
            improveUrlDescription: "Para obtener una URL SEO-friendly como",
            completeProfileToShare: "Para compartir tu CV, necesitas completar la información básica de tu perfil:",
            goToCompleteProfile: "Ir a completar mi perfil",
            linkCopied: "Link copiado al portapapeles!",
            completeNameAndTitle: "nombre completo y título profesional",
            shareText: "Mira mi CV profesional",
            linkedin: "LinkedIn",
            twitter: "Twitter",
            facebook: "Facebook",
            whatsapp: "WhatsApp",
            businessCard: {
                title: "Tarjeta de Visita Digital",
                description: "Descarga tu tarjeta de visita profesional con código QR integrado",
                galleryDescription: "Explora todos los diseños de tarjetas disponibles",
                viewCard: "Ver Mi Tarjeta",
                viewGallery: "Ver Galería",
                downloaded: "Tarjeta descargada correctamente!",
            },
            qrCode: {
                title: "Código QR",
                description: "Genera un código QR para compartir tu CV en eventos o tarjetas de presentación",
                download: "Descargar QR",
            },
        },
        leads: {
            title: "Leads y Contactos",
            subtitle: "Gestiona los contactos y mensajes recibidos",
            recentLeads: "Últimos Leads/Mensajes",
            totalLeads: "Total Leads",
            new: "Nuevos",
            conversionRate: "Tasa de Conversión",
            noLeads: "No hay leads todavía",
            noLeadsDescription: "Los contactos que recibas aparecerán aquí",
            viewAllMessages: "Ver todos los mensajes",
            email: "Email:",
            anonymous: "Anónimo",
        },
        analyticsPanel: {
            title: "Analíticas Detalladas",
            subtitle: "Análisis completo del rendimiento de tu CV",
            dateRange: {
                days7: "7 días",
                days30: "30 días",
                days90: "90 días",
                all: "Todo",
            },
            export: "Exportar",
            exportCSV: "Exportar como CSV",
            printPDF: "Imprimir / PDF",
            realTimeActivity: "Actividad en Tiempo Real",
            realTimeDescription: "Tu perfil está siendo visto ahora mismo. Los datos se actualizan automáticamente cada minuto.",
            viewAllCountries: "Ver todos los países",
        },
        cvEditor: {
            title: "Editor de CV Personalizado",
            chooseTemplate: "Elige una Plantilla para Editar",
            help: "Ayuda",
        },
        visas: {
            title: "Visas (Proyectos & Logros)",
            subtitle: "Muestra tus proyectos más importantes con la metodología CAR",
            newVisa: "Nueva Visa",
            noVisas: "No tienes Visas todavía",
            noVisasDescription: "Crea tu primera Visa para mostrar tus proyectos y logros más importantes",
            createFirstVisa: "Crear Primera Visa",
            edit: "Editar",
            editComingSoon: "La edición de Visas estará disponible próximamente",
            createComingSoon: "La creación de Visas estará disponible próximamente",
            deleteConfirm: "¿Estás seguro de que quieres eliminar esta Visa?",
            deleteError: "Error al eliminar la Visa",
            present: "Presente",
            metrics: "métricas",
        },
        helpSection: {
            title: "Centro de Ayuda",
            subtitle: "Encuentra respuestas rápidas a tus preguntas y aprende a sacar el máximo provecho de YourCVPassport",
            gettingStarted: {
                title: "Primeros Pasos",
                description: "Aprende a crear tu primer CV profesional en minutos",
                step1: "Completa tu perfil en \"Identity\"",
                step2: "Agrega tu experiencia laboral",
                step3: "Selecciona una plantilla profesional",
            },
            profileEditor: "Editor de Perfil",
            profileEditorDesc: "Edita y completa tu información profesional",
            profileEditorTips: {
                tip1: "Cada sección se guarda automáticamente",
                tip2: "Los círculos verdes indican completitud",
                tip3: "Usa el modo oscuro para mayor comodidad",
            },
            cvTemplates: "Plantillas de CV",
            cvTemplatesDesc: "Elige y personaliza diseños profesionales",
            cvTemplatesTips: {
                tip1: "Más de 10 plantillas profesionales",
                tip2: "Diseños modernos y ATS-friendly",
                tip3: "Cambia de plantilla en cualquier momento",
            },
            shareExport: "Compartir y Exportar",
            shareExportDesc: "Comparte tu CV y exporta a PDF",
            shareExportTips: {
                tip1: "Genera un enlace único para compartir",
                tip2: "Descarga en PDF profesional",
                tip3: "Rastrea quién visualiza tu CV",
            },
            privacy: {
                title: "Privacidad y Seguridad",
                description: "Tu información está protegida",
                tip1: "Control total sobre tu visibilidad",
                tip2: "Datos encriptados en tránsito",
                tip3: "Cumplimos con GDPR",
            },
            support: {
                title: "Soporte Técnico",
                description: "¿Necesitas ayuda adicional?",
                contact: "Contactar Soporte",
            },
            faq: {
                title: "Preguntas Frecuentes",
                q1: "¿Cómo puedo descargar mi CV en PDF?",
                a1: "Ve a la sección \"Mi CV\", haz clic en el botón \"Descargar PDF\" en la esquina superior derecha. Tu CV se descargará automáticamente con el diseño de la plantilla seleccionada.",
                q2: "¿Puedo tener múltiples versiones de mi CV?",
                a2: "Actualmente, puedes personalizar tu CV cambiando entre diferentes plantillas. Estamos trabajando en una función que te permitirá crear múltiples versiones de tu CV para diferentes industrias o puestos.",
                q3: "¿Cómo funciona el enlace compartido?",
                a3: "Tu enlace único (yourcvpassport.com/tu-nombre) permite a empleadores ver tu CV online. Puedes controlar la visibilidad desde la sección \"Configuración\" y ver las estadísticas de visualización en \"Analytics\".",
                q4: "¿Qué datos se guardan automáticamente?",
                a4: "Toda tu información se guarda automáticamente mientras editas. Verás un mensaje de confirmación \"Guardado exitosamente\" en la parte superior de la pantalla cuando tus cambios se hayan sincronizado.",
                q5: "¿Qué significa \"ATS-friendly\"?",
                a5: "ATS (Applicant Tracking System) son sistemas que las empresas usan para filtrar CVs. Nuestras plantillas están optimizadas para ser leídas correctamente por estos sistemas, aumentando tus posibilidades de que tu CV sea visto por reclutadores humanos.",
            },
            videoTutorial: {
                title: "Tutorial en Video",
                description: "Mira nuestro tutorial completo de 5 minutos y aprende a crear un CV profesional desde cero.",
                watchVideo: "Ver Tutorial",
                bestPractices: "Mejores prácticas para CVs",
                tips: "Tips para destacar ante reclutadores",
            },
            initialSetup: "Configuración inicial del perfil",
        },
        settings: {
            title: "Ajustes de Cuenta",
            subtitle: "Configura tu cuenta y preferencias",
            accountInfo: "Información de Cuenta",
            privacy: "Privacidad",
            publicProfile: "Perfil Público",
            publicProfileDescription: "Tu CV es visible en internet",
            trackAnalytics: "Rastrear Analíticas",
            trackAnalyticsDescription: "Permite el seguimiento de visitas",
            dangerZone: "Zona de Peligro",
            dangerZoneDescription: "Estas acciones son permanentes y no se pueden deshacer",
            deleteAccount: "Eliminar Cuenta",
        },
        aiAssistant: {
            title: "Asistente de IA",
            subtitle: "Mejora tu perfil con inteligencia artificial",
            modes: {
                summary: {
                    title: "Mejorar Resumen",
                    description: "Optimiza tu resumen profesional para destacar"
                },
                experience: {
                    title: "Mejorar Experiencia",
                    description: "Reescribe descripciones de trabajo con impacto"
                },
                skills: {
                    title: "Sugerir Habilidades",
                    description: "Obtén sugerencias de habilidades relevantes"
                },
                coverLetter: {
                    title: "Carta de Presentación",
                    description: "Genera una carta personalizada"
                },
                ats: {
                    title: "Optimizar para ATS",
                    description: "Mejora tu CV para sistemas de seguimiento"
                },
                translate: {
                    title: "Traducir Perfil",
                    description: "Traduce tu perfil al otro idioma"
                }
            },
            generating: "Generando sugerencia...",
            original: "Original:",
            suggestion: "Sugerencia de IA:",
            apply: "Aplicar Cambios",
            regenerate: "Regenerar",
            backToMenu: "Volver al menú",
            errors: {
                noApiKey: "API key no configurada",
                noExperiences: "No hay experiencias para mejorar",
                generic: "Error al generar sugerencia",
                applyError: "Error al aplicar cambios"
            }
        },
    },
    NAV_LINKS: [
        { name: 'Producto', href: '#', id: 'producto', subItems: [
            { name: 'Resumen', href: '#', id: 'producto/resumen' },
            { name: 'Perfiles Verificados (Sellos)', href: '#', id: 'producto/sellos' },
            { name: 'Exportación ATS (PDF/DOCX)', href: '#', id: 'producto/ats' },
            { name: 'Dominio/URL Personalizado', href: '#', id: 'producto/dominio' },
            { name: 'Analíticas de Perfil', href: '#', id: 'producto/analiticas' },
            { name: 'IA para CV y Cartas', href: '#', id: 'producto/ia' },
        ]},
        { name: 'Profesionales', href: '#', id: 'profesionales', subItems: [
            { name: 'Cómo funciona', href: '#', id: 'profesionales/como-funciona' },
            { name: 'Plantillas y Ejemplos', href: '#', id: 'profesionales/plantillas' },
            { name: 'Buscar Empleos', href: '#', id: 'jobs' },
            { name: 'Precios (Planes)', href: '#', id: 'precios' },
            { name: 'Centro de Ayuda', href: '#', id: 'profesionales/ayuda' },
        ]},
        { name: 'Empresas', href: '#', id: 'empresas', subItems: [
            { name: 'Búsqueda Avanzada de Talento', href: '#', id: 'empresas/busqueda' },
            { name: 'Plan para Empresas', href: '#', id: 'empresas/planes' },
            { name: 'Integraciones ATS', href: '#', id: 'empresas/integraciones' },
            { name: 'Seguridad y Cumplimiento (RGPD)', href: '#', id: 'empresas/seguridad' },
        ]},
        { name: 'Recursos', href: '#', id: 'recursos', subItems: [
            { name: 'Blog / Guías de Carrera', href: '#', id: 'recursos/blog' },
            { name: 'Biblioteca de Plantillas', href: '#', id: 'recursos/biblioteca' },
            { name: 'Casos de Éxito', href: '#', id: 'recursos/exito' },
            { name: 'Estado del Sistema', href: '#', id: 'recursos/estado' },
        ]},
        { name: 'Nosotros', href: '#', id: 'nosotros', subItems: [
            { name: 'Misión y Valores', href: '#', id: 'nosotros/mision' },
            { name: 'Prensa/Kit de Medios', href: '#', id: 'nosotros/prensa' },
            { name: 'Contacto', href: '#', id: 'nosotros/contacto' },
        ]},
        { name: 'Precios', href: '#', id: 'precios' },
    ],
    PRICING_PLANS: [
        { title: 'Plan Básico', price: 'Gratis', period: 'Para siempre', description: 'Comienza con un perfil profesional y verificado.', features: ['1 Perfil Verificado', 'Verificaciones Limitadas (Sellos)', 'Plantillas Estándar', 'URL Compartible'], cta: 'Comienza Gratis' },
        { title: 'Plan Profesional', price: '€15', period: '/ mes', description: 'Desbloquea potentes herramientas para acelerar tu carrera.', features: ['Todo en Básico', 'Verificaciones Ilimitadas', 'Plantillas Premium', 'Dominio Personalizado', 'Mejora de Perfil con IA', 'Analíticas Avanzadas'], cta: 'Comenzar Ahora', highlight: true },
        { title: 'Plan Corporativo', price: 'A medida', period: '', description: 'Para equipos y empresas que buscan reclutar el mejor talento.', features: ['Gestión de Equipos', 'Búsqueda Avanzada de Talento', 'Integraciones ATS', 'Soporte Dedicado', 'Seguridad Mejorada'], cta: 'Contactar Ventas' },
    ],
     PRICING_PAGE_PLANS: [
      {
        title: 'Plan Gratis',
        price: 'Gratis',
        period: 'Para siempre',
        description: 'Empieza con un perfil profesional y verificado.',
        features: ['1 Perfil Verificado', 'Verificaciones limitadas (Sellos)', 'Plantillas estándar', '1 exportación ATS/mes', 'Soporte comunitario'],
        cta: 'Empieza Gratis',
      },
      {
        title: 'Plan Profesional',
        price: '€15',
        period: '/ mes',
        description: 'Desbloquea potentes herramientas para acelerar tu carrera.',
        features: ['Todo lo del plan Gratis', 'Verificaciones ilimitadas', 'Plantillas Premium', 'Dominio personalizado', 'Mejora de perfil con IA', 'Analíticas avanzadas', 'Soporte prioritario'],
        cta: 'Inicia prueba gratuita de 14 días',
        highlight: true,
      },
      {
        title: 'Plan Corporativo',
        price: 'A medida',
        period: '',
        description: 'Para equipos y empresas que buscan reclutar el mejor talento.',
        features: ['Gestión de equipos', 'Búsqueda avanzada de talento', 'Integraciones con ATS', 'Soporte dedicado', 'Seguridad mejorada', 'Acceso a la API'],
        cta: 'Contactar con Ventas',
      },
    ],
    PRICING_COMPARISON: {
        headers: ['Característica', 'Gratis', 'Profesional', 'Corporativo'],
        rows: [
            { category: 'Perfil Principal', feature: 'Creación de Perfil Verificado', values: ['✓', '✓', '✓'] },
            { category: 'Perfil Principal', feature: 'Plantillas Estándar', values: ['✓', '✓', '✓'] },
            { category: 'Perfil Principal', feature: 'URL Compartible', values: ['✓', '✓', '✓'] },
            { category: 'Verificaciones', feature: 'Verificación de Identidad', values: ['1 Sello', 'Ilimitado', 'Ilimitado'] },
            { category: 'Verificaciones', feature: 'Sellos de Educación/Trabajo', values: ['Limitado', 'Ilimitado', 'Ilimitado'] },
            { category: 'Exportaciones y Personalización', feature: 'Exportación ATS (PDF/DOCX)', values: ['1 / mes', 'Ilimitado', 'Ilimitado'] },
            { category: 'Exportaciones y Personalización', feature: 'Plantillas Premium', values: ['-', '✓', '✓'] },
            { category: 'Exportaciones y Personalización', feature: 'Dominio/URL Personalizado', values: ['-', '✓', '✓'] },
            { category: 'Exportaciones y Personalización', feature: 'Eliminar marca de YourCVPassport', values: ['-', '✓', '✓'] },
            { category: 'Herramientas y Analíticas', feature: 'Mejora de Perfil con IA', values: ['-', '✓', '✓'] },
            { category: 'Herramientas y Analíticas', feature: 'Generador de Cartas de Presentación con IA', values: ['-', '✓', '✓'] },
            { category: 'Herramientas y Analíticas', feature: 'Analíticas Básicas de Perfil', values: ['✓', '✓', '✓'] },
            { category: 'Herramientas y Analíticas', feature: 'Analíticas Avanzadas (Visitas de Empresas)', values: ['-', '✓', '✓'] },
            { category: 'Soporte y Seguridad', feature: 'Soporte Comunitario', values: ['✓', '✓', '✓'] },
            { category: 'Soporte y Seguridad', feature: 'Soporte Prioritario por Email', values: ['-', '✓', '✓'] },
            { category: 'Soporte y Seguridad', feature: 'Gestor de Cuenta Dedicado', values: ['-', '-', '✓'] },
            { category: 'Soporte y Seguridad', feature: 'Gestión de Equipos', values: ['-', '-', '✓'] },
            { category: 'Soporte y Seguridad', feature: 'Acceso a API e Integraciones Personalizadas', values: ['-', '-', '✓'] },
        ]
    },
    FAQ_ITEMS: [
        { question: '¿Qué es un CV verificado?', answer: 'Un CV verificado es un perfil profesional asegurado y autenticado digitalmente. Verificamos tu identidad, educación, experiencia laboral y habilidades, proporcionando a los empleadores una representación fiable y fidedigna de tus cualificaciones.' },
        { question: '¿Cómo funciona el proceso de verificación?', answer: 'Envías tus documentos e información a través de nuestra plataforma segura. Nuestro sistema, combinado con servicios de verificación de terceros, confirma la autenticidad de tus credenciales. Una vez verificado, se añade un "sello" a tu perfil.' },
        { question: '¿Están seguros mis datos?', answer: 'Absolutamente. Cumplimos totalmente con el RGPD y utilizamos encriptación de última generación para proteger tus datos. Tienes control total sobre quién ve tu perfil e información.' },
        { question: '¿Puedo exportar mi CV para solicitudes de empleo?', answer: '¡Sí! Puedes exportar tu CV verificado en varios formatos compatibles con ATS como PDF y DOCX, asegurando que pase a través de los sistemas de seguimiento de candidatos utilizados por la mayoría de las empresas.' },
        { question: '¿Cuánto cuesta crear un perfil en YourCVPassport?', answer: 'Crear tu perfil básico es completamente gratis. Ofrecemos un plan gratuito que incluye plantillas esenciales y funciones básicas. Para acceso a plantillas premium, herramientas de IA, dominio personalizado y análisis avanzado, puedes actualizar a uno de nuestros planes de pago.' },
        { question: '¿Puedo actualizar mi CV después de haberlo creado?', answer: 'Por supuesto. Puedes editar y actualizar tu CV en cualquier momento desde tu panel de control. Todas las actualizaciones se guardan automáticamente y se reflejan en tiempo real en tu perfil público si está activado.' },
        { question: '¿Qué es un perfil público y cómo funciona?', answer: 'Un perfil público es una versión de tu CV que puedes compartir con reclutadores mediante un enlace único. Puedes activarlo o desactivarlo cuando quieras y controlar exactamente qué información es visible. Es ideal para búsqueda pasiva de empleo.' },
        { question: '¿Los reclutadores pueden encontrarme en YourCVPassport?', answer: 'Sí, si activas tu perfil público, los reclutadores pueden encontrarte mediante nuestra función de búsqueda avanzada. Pueden filtrar por habilidades, ubicación, industria y más. Tú mantienes el control sobre tu visibilidad y puedes desactivar tu perfil en cualquier momento.' },
        { question: '¿Qué ventajas ofrece YourCVPassport frente a otros creadores de CV?', answer: 'YourCVPassport se diferencia por combinar creación de CV profesional con verificación de credenciales mediante tecnología blockchain, optimización con IA, plantillas compatibles con ATS, perfil público con URL personalizada, y herramientas de análisis para rastrear el rendimiento de tu CV.' },
    ],
    TESTIMONIALS: [
        { quote: "El sello de verificación marcó una gran diferencia. Recibí más llamadas de empresas de primer nivel que nunca. Es un antes y un después.", name: 'Anna Kowalsky', role: 'Ingeniera de Software Senior', imageUrl: 'https://picsum.photos/id/1027/100/100' },
        { quote: "Como reclutador, YourCVPassport es invaluable. Me ahorra horas de comprobación de antecedentes y me permite centrarme en candidatos cualificados y de confianza.", name: 'James Smith', role: 'Reclutador Técnico en Innovate Inc.', imageUrl: 'https://picsum.photos/id/1005/100/100' },
        { quote: "La herramienta de mejora de perfil con IA me ayudó a crear el resumen perfecto. Resaltó mis fortalezas de maneras que no había imaginado.", name: 'María García', role: 'Gerente de Producto', imageUrl: 'https://picsum.photos/id/1011/100/100' }
    ],
    STAMPS_FAQ_ITEMS: [
        { question: '¿Cuánto tarda la verificación?', answer: 'La verificación de identidad suele ser instantánea. La de educación y experiencia laboral puede tardar de 2 a 5 días hábiles dependiendo de la institución.' },
        { question: '¿Qué documentos necesito?', answer: 'Varía según el sello. Para la identidad, se requiere un documento de identidad emitido por el gobierno. Para la educación, es posible que necesites un diploma o expediente académico.' },
        { question: '¿Qué es la tecnología blockchain y cómo protege mis credenciales?', answer: 'Blockchain es una tecnología de registro distribuido que crea un registro inmutable y transparente de tus credenciales verificadas. Una vez que tu información es verificada y registrada en la blockchain, no puede ser alterada ni falsificada, garantizando la máxima autenticidad.' },
        { question: '¿Puedo verificar certificaciones profesionales además de títulos académicos?', answer: 'Sí, puedes verificar múltiples tipos de credenciales incluyendo certificaciones profesionales (PMP, AWS, Google, etc.), títulos académicos, cursos especializados, licencias profesionales y experiencia laboral. Cada tipo de credencial recibe su propio sello de verificación.' },
        { question: '¿Qué sucede si mi empleador anterior ya no existe o no responde?', answer: 'Entendemos que algunas empresas pueden haber cerrado o ser difíciles de contactar. En estos casos, aceptamos documentos alternativos como cartas de referencia, recibos de nómina, contratos laborales o declaraciones de impuestos que demuestren tu empleo.' },
        { question: '¿Los reclutadores pueden ver mis documentos originales?', answer: 'No. Los reclutadores solo ven el sello de verificación en tu perfil que confirma que tus credenciales han sido verificadas. Tus documentos originales permanecen privados y seguros en nuestro sistema encriptado. Solo nuestro equipo de verificación autorizado tiene acceso temporal para el proceso de validación.' },
        { question: '¿Cuánto cuestan las verificaciones de credenciales?', answer: 'La verificación básica de identidad está incluida en todos los planes. Las verificaciones de educación y experiencia laboral están incluidas en los planes Profesional y Corporativo. Para usuarios del plan gratuito, ofrecemos verificaciones individuales a partir de €9.99 por credencial.' },
    ],
    PRICING_PAGE_TESTIMONIALS: [
        { quote: "El Plan Profesional vale cada céntimo. El dominio personalizado y las analíticas avanzadas me dieron la ventaja que necesitaba.", name: 'Juan Pérez', role: 'Director de Marketing', imageUrl: 'https://picsum.photos/id/1012/100/100', plan: 'Profesional' },
        { quote: "Empecé con el plan gratuito, que era genial. Me pasé a Pro por las herramientas de IA y fue un cambio radical para mis solicitudes.", name: 'Laura Gómez', role: 'Diseñadora UX', imageUrl: 'https://picsum.photos/id/1013/100/100', plan: 'Profesional' },
        { quote: "Todo nuestro equipo utiliza el plan Corporativo. Ha optimizado nuestra contratación y nos ayuda a encontrar talento verificado mucho más rápido.", name: 'Carlos Fernández', role: 'Jefe de Talento en Stellar Corp.', imageUrl: 'https://picsum.photos/id/1014/100/100', plan: 'Corporativo' }
    ],
    COMPANY_TESTIMONIALS: [
        { quote: "La calidad de los candidatos que encontramos en YourCVPassport es inigualable. La verificación nos ahorra tiempo y reduce el riesgo de contratación.", name: 'Emily White', role: 'Gerente de RRHH, Apex Solutions', imageUrl: 'https://picsum.photos/id/1015/100/100'},
        { quote: "Los filtros de búsqueda avanzada nos permiten identificar las habilidades exactas que necesitamos. Ha reducido nuestro tiempo de búsqueda a la mitad.", name: 'David Green', role: 'Líder de Reclutamiento, QuantumLeap', imageUrl: 'https://picsum.photos/id/1016/100/100'}
    ],
    PRICING_PAGE_FAQ_ITEMS: [
        { question: '¿Hay una prueba gratuita para el Plan Profesional?', answer: 'Sí, todos nuestros planes de pago vienen con una prueba gratuita de 14 días. Puedes explorar todas las funciones antes de comprometerte.' },
        { question: '¿Puedo cambiar mi plan más adelante?', answer: 'Por supuesto. Puedes ampliar, reducir o cancelar tu plan en cualquier momento desde tu panel de cuenta.' },
        { question: '¿Qué son los créditos de contacto para los planes Corporativos?', answer: 'Los créditos de contacto se utilizan para ver perfiles completos y contactar a los candidatos. Este sistema flexible te permite pagar por lo que usas.' },
        { question: '¿Qué métodos de pago aceptan?', answer: 'Aceptamos todas las tarjetas de crédito y débito principales (Visa, MasterCard, American Express), PayPal y transferencias bancarias para planes Corporativos. Todos los pagos se procesan de forma segura a través de pasarelas de pago certificadas PCI-DSS.' },
        { question: '¿Qué sucede si cancelo mi suscripción?', answer: 'Puedes cancelar en cualquier momento sin penalización. Mantendrás acceso a las funciones premium hasta el final de tu período de facturación actual. Después, tu cuenta volverá automáticamente al plan gratuito y tu perfil permanecerá activo con las funciones básicas.' },
        { question: '¿Hay descuentos para estudiantes o organizaciones sin fines de lucro?', answer: 'Sí, ofrecemos un 30% de descuento para estudiantes con identificación válida y un 25% de descuento para organizaciones sin fines de lucro verificadas. Contacta a nuestro equipo de ventas en support@yourcvpassport.com para aplicar estos descuentos.' },
        { question: '¿Puedo pagar anualmente para ahorrar dinero?', answer: 'Absolutamente. Al elegir facturación anual, ahorras un 20% comparado con los pagos mensuales. Por ejemplo, el Plan Profesional cuesta €29/mes (€348/año) mensualmente, pero solo €23.20/mes (€278.40/año) con facturación anual.' },
        { question: '¿El plan Corporativo incluye soporte dedicado?', answer: 'Sí, todos los clientes del plan Corporativo reciben un gestor de cuenta dedicado, soporte prioritario con tiempo de respuesta garantizado de menos de 2 horas, integración personalizada con tus sistemas ATS existentes, y sesiones de capacitación para tu equipo de reclutamiento.' },
    ],
    HELP_CENTER_FAQ_ITEMS: [
        { question: '¿Cómo restablezco mi contraseña?', answer: 'Puedes restablecer tu contraseña haciendo clic en el enlace "¿Olvidaste tu contraseña?" en la página de inicio de sesión. Se te enviará un correo electrónico con instrucciones.'},
        { question: '¿Cómo actualizo la información de mi perfil?', answer: 'Puedes editar todas las secciones de tu perfil directamente desde tu panel de control después de iniciar sesión.'},
        { question: '¿Cómo cambio mi plantilla de CV después de haberla seleccionado?', answer: 'Dirígete a tu panel de control, haz clic en "Configuración de Plantilla" o "Cambiar Plantilla", y selecciona una nueva plantilla de nuestra galería. Todo tu contenido se transferirá automáticamente al nuevo diseño sin perder ninguna información.'},
        { question: '¿Puedo descargar mi CV en diferentes idiomas?', answer: 'Sí, YourCVPassport soporta creación de CV multilingüe. Puedes crear versiones de tu CV en español e inglés, y exportar cada versión por separado. Esto es especialmente útil para aplicar a empleos internacionales.'},
        { question: '¿Cómo activo o desactivo mi perfil público?', answer: 'En tu panel de control, ve a "Configuración de Privacidad" y utiliza el interruptor "Perfil Público" para activarlo o desactivarlo. Cuando está activado, los reclutadores pueden encontrarte; cuando está desactivado, solo tú puedes acceder a tu perfil.'},
        { question: '¿Qué hago si no recibo el correo de verificación?', answer: 'Primero, revisa tu carpeta de spam o correo no deseado. Si aún no lo encuentras, ve a la configuración de tu cuenta y haz clic en "Reenviar correo de verificación". Si el problema persiste, contacta a nuestro equipo de soporte en support@yourcvpassport.com.'},
        { question: '¿Cómo puedo ver las estadísticas de mi CV (vistas, descargas)?', answer: 'Las analíticas están disponibles en los planes Profesional y Corporativo. En tu panel de control, haz clic en "Analíticas" para ver métricas detalladas incluyendo vistas de perfil, descargas de CV, búsquedas por palabra clave que llevaron a tu perfil, y tendencias a lo largo del tiempo.'},
    ],
    SEARCH_PROFILE_EXAMPLES: [
        { name: 'Dr. Evelyn Reed', role: 'Científica de Datos', location: 'Berlín, Alemania', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Big Data'], verified: true, imageUrl: 'https://picsum.photos/id/1027/100/100' },
        { name: 'Marcus Chen', role: 'Diseñador UX Senior', location: 'Londres, Reino Unido', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'], verified: true, imageUrl: 'https://picsum.photos/id/1005/100/100' },
        { name: 'Sofia Rossi', role: 'Gerente de Producto', location: 'Remoto', skills: ['Agile', 'Roadmapping', 'JIRA', 'Análisis de Mercado', 'Estrategia GTM'], verified: true, imageUrl: 'https://picsum.photos/id/1011/100/100' },
        { name: 'Alex Johnson', role: 'Ingeniero DevOps', location: 'Nueva York, EE. UU.', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'], verified: true, imageUrl: 'https://picsum.photos/id/1012/100/100' },
        { name: 'Isabella Costa', role: 'Gerente de Marketing', location: 'São Paulo, Brasil', skills: ['SEO', 'Marketing de Contenidos', 'Google Analytics'], verified: false, imageUrl: 'https://picsum.photos/id/1013/100/100' },
        { name: 'Kenji Tanaka', role: 'Investigador de IA', location: 'Tokio, Japón', skills: ['PyTorch', 'NLP', 'Visión por Computadora'], verified: true, imageUrl: 'https://picsum.photos/id/1014/100/100' },
    ],
    ATS_INTEGRATIONS: [
        { name: 'Greenhouse', logo: 'G', description: 'Sincroniza automáticamente los perfiles de los candidatos de YourCVPassport directamente en tu pipeline de Greenhouse.' },
        { name: 'Lever', logo: 'L', description: 'Optimiza tu flujo de trabajo añadiendo candidatos verificados a tu pool de talentos de Lever con un solo clic.' },
        { name: 'Workable', logo: 'W', description: 'Empuja a los candidatos y sus credenciales verificadas a Workable para seguirlos a través de tus etapas de contratación.' }
    ],
    BLOG_CATEGORIES: ['Todo', 'CV y Currículum', 'Consejos de Entrevista', 'Crecimiento Profesional', 'Para Reclutadores'],
    BLOG_POSTS: [
        { id: 1, title: 'Cómo Superar los Escaneos de ATS en 2025', category: 'CV y Currículum', imageUrl: 'https://picsum.photos/id/10/400/300', summary: 'Aprende los mejores secretos para crear un CV que sea notado tanto por robots como por humanos.', authorName: 'John Carter', authorImageUrl: 'https://picsum.photos/id/1005/100/100', date: '15 de enero de 2025', featured: true },
        { id: 2, title: '5 Errores Comunes de Entrevista a Evitar', category: 'Consejos de Entrevista', imageUrl: 'https://picsum.photos/id/20/400/300', summary: 'Clava tu próxima entrevista evitando estos errores simples pero críticos.', authorName: 'Jane Doe', authorImageUrl: 'https://picsum.photos/id/1027/100/100', date: '10 de enero de 2025' },
        { id: 3, title: 'Navegando un Cambio de Carrera Después de los 40', category: 'Crecimiento Profesional', imageUrl: 'https://picsum.photos/id/30/400/300', summary: 'Nunca es tarde para seguir tu pasión. Así es como hacer una transición exitosa.', authorName: 'Emily White', authorImageUrl: 'https://picsum.photos/id/1011/100/100', date: '5 de enero de 2025' },
        { id: 4, title: 'Por Qué las Credenciales Verificadas Importan a los Reclutadores', category: 'Para Reclutadores', imageUrl: 'https://picsum.photos/id/40/400/300', summary: 'Un análisis profundo sobre cómo los candidatos pre-verificados pueden ahorrar tiempo y reducir riesgos de contratación.', authorName: 'James Smith', authorImageUrl: 'https://picsum.photos/id/1005/100/100', date: '28 de diciembre de 2024' },
        { id: 5, title: 'La Guía Definitiva para Escribir una Carta de Presentación Convincente', category: 'CV y Currículum', imageUrl: 'https://picsum.photos/id/50/400/300', summary: 'Nuestra IA puede ayudar, pero estos principios fundamentales son clave para escribir una carta que destaque.', authorName: 'Jane Doe', authorImageUrl: 'https://picsum.photos/id/1027/100/100', date: '25 de diciembre de 2024' }
    ],
    TEMPLATE_CATEGORIES: ['CV', 'Cover Letter', 'Email', 'LinkedIn'] as const,
    TEMPLATE_CATEGORY_NAMES: {
        'CV': 'CV',
        'Cover Letter': 'Carta de Presentación',
        'Email': 'Correo',
        'LinkedIn': 'LinkedIn'
    },
    TEMPLATE_INDUSTRIES: ['Todo', 'Tecnología', 'Creativo', 'Corporativo', 'Salud'],
    TEMPLATE_LEVELS: ['Todo', 'Nivel Inicial', 'Carrera Media', 'Senior', 'Ejecutivo'],
    TEMPLATES: [
        // CVs - Tecnología
        { id: 1, title: 'Diseño Moderno Minimalista', category: 'CV', imageUrl: '/images/templates/modern-minimalist.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 1250, rating: 4.8 },
        { id: 2, title: 'CV Tech Stack Completo', category: 'CV', imageUrl: '/images/templates/gradient-blue.png', industry: 'Tecnología', level: 'Senior', downloads: 1890, rating: 4.9 },
        { id: 3, title: 'Desarrollador Frontend', category: 'CV', imageUrl: '/images/templates/professional-blue.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 1567, rating: 4.7 },
        { id: 4, title: 'Ingeniero Full Stack', category: 'CV', imageUrl: '/images/templates/modern-clean.png', industry: 'Tecnología', level: 'Senior', downloads: 2234, rating: 4.9 },
        { id: 5, title: 'DevOps Profesional', category: 'CV', imageUrl: '/images/templates/classic.png', industry: 'Tecnología', level: 'Senior', downloads: 1456, rating: 4.8 },
        { id: 6, title: 'Data Scientist', category: 'CV', imageUrl: '/images/templates/elegant-minimal.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 1678, rating: 4.7 },
        { id: 7, title: 'Programador Junior', category: 'CV', imageUrl: '/images/templates/green-minimal.png', industry: 'Tecnología', level: 'Nivel Inicial', downloads: 2134, rating: 4.6 },
        { id: 8, title: 'Arquitecto de Software', category: 'CV', imageUrl: '/images/templates/modern-professional.png', industry: 'Tecnología', level: 'Ejecutivo', downloads: 1234, rating: 4.9 },

        // CVs - Creativo
        { id: 9, title: 'Formato Creativo Audaz', category: 'CV', imageUrl: '/images/templates/creative-bold.png', industry: 'Creativo', level: 'Senior', downloads: 980, rating: 4.9 },
        { id: 10, title: 'Portfolio Diseñador Gráfico', category: 'CV', imageUrl: '/images/templates/creative-modern.png', industry: 'Creativo', level: 'Carrera Media', downloads: 1345, rating: 4.8 },
        { id: 11, title: 'UX/UI Designer', category: 'CV', imageUrl: '/images/templates/creative-orange.png', industry: 'Creativo', level: 'Senior', downloads: 1789, rating: 4.9 },
        { id: 12, title: 'Diseñador Web', category: 'CV', imageUrl: '/images/templates/coral-pink.png', industry: 'Creativo', level: 'Carrera Media', downloads: 1456, rating: 4.7 },
        { id: 13, title: 'Director de Arte', category: 'CV', imageUrl: '/images/templates/creative-minimalist.png', industry: 'Creativo', level: 'Ejecutivo', downloads: 890, rating: 4.8 },
        { id: 14, title: 'Fotógrafo Profesional', category: 'CV', imageUrl: '/images/templates/minimalist-yellow.png', industry: 'Creativo', level: 'Senior', downloads: 756, rating: 4.6 },
        { id: 15, title: 'Ilustrador Digital', category: 'CV', imageUrl: '/images/templates/passport.png', industry: 'Creativo', level: 'Carrera Media', downloads: 923, rating: 4.7 },
        { id: 16, title: 'Diseñador Multimedia', category: 'CV', imageUrl: '/images/templates/template-16.png', industry: 'Creativo', level: 'Nivel Inicial', downloads: 1123, rating: 4.5 },

        // CVs - Corporativo
        { id: 17, title: 'Diseño Profesional Clásico', category: 'CV', imageUrl: '/images/templates/professional-classic.png', industry: 'Corporativo', level: 'Ejecutivo', downloads: 2100, rating: 4.7 },
        { id: 18, title: 'Gerente de Proyectos', category: 'CV', imageUrl: '/images/templates/classic-corporate.png', industry: 'Corporativo', level: 'Senior', downloads: 1890, rating: 4.8 },
        { id: 19, title: 'Analista Financiero', category: 'CV', imageUrl: '/images/templates/classic-sidebar.png', industry: 'Corporativo', level: 'Carrera Media', downloads: 1567, rating: 4.6 },
        { id: 20, title: 'Contador Profesional', category: 'CV', imageUrl: '/images/templates/academic-standard.png', industry: 'Corporativo', level: 'Senior', downloads: 1234, rating: 4.7 },
        { id: 21, title: 'Consultor de Negocios', category: 'CV', imageUrl: '/images/templates/template-21.png', industry: 'Corporativo', level: 'Ejecutivo', downloads: 1456, rating: 4.9 },
        { id: 22, title: 'Recursos Humanos', category: 'CV', imageUrl: '/images/templates/template-22.png', industry: 'Corporativo', level: 'Carrera Media', downloads: 1678, rating: 4.5 },
        { id: 23, title: 'Asistente Ejecutivo', category: 'CV', imageUrl: '/images/templates/template-23.png', industry: 'Corporativo', level: 'Carrera Media', downloads: 1345, rating: 4.6 },
        { id: 24, title: 'Director de Operaciones', category: 'CV', imageUrl: '/images/templates/template-24.png', industry: 'Corporativo', level: 'Ejecutivo', downloads: 987, rating: 4.8 },

        // CVs - Salud
        { id: 25, title: 'Profesional de la Salud', category: 'CV', imageUrl: '/images/templates/healthcare-professional.png', industry: 'Salud', level: 'Carrera Media', downloads: 850, rating: 4.6 },
        { id: 26, title: 'Enfermero Registrado', category: 'CV', imageUrl: '/images/templates/template-26.png', industry: 'Salud', level: 'Carrera Media', downloads: 1456, rating: 4.7 },
        { id: 27, title: 'Médico Especialista', category: 'CV', imageUrl: '/images/templates/template-27.png', industry: 'Salud', level: 'Ejecutivo', downloads: 1123, rating: 4.9 },
        { id: 28, title: 'Farmacéutico', category: 'CV', imageUrl: '/images/templates/template-28.png', industry: 'Salud', level: 'Senior', downloads: 890, rating: 4.6 },
        { id: 29, title: 'Fisioterapeuta', category: 'CV', imageUrl: '/images/templates/template-29.png', industry: 'Salud', level: 'Carrera Media', downloads: 756, rating: 4.5 },
        { id: 30, title: 'Técnico de Laboratorio', category: 'CV', imageUrl: '/images/templates/template-30.png', industry: 'Salud', level: 'Nivel Inicial', downloads: 923, rating: 4.4 },

        // Cartas de Presentación
        { id: 31, title: 'Carta Moderna Tech', category: 'Cover Letter', imageUrl: '/images/templates/template-31.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 1567, rating: 4.8 },
        { id: 32, title: 'Carta Profesional Corporativa', category: 'Cover Letter', imageUrl: '/images/templates/template-32.png', industry: 'Corporativo', level: 'Senior', downloads: 1890, rating: 4.7 },
        { id: 33, title: 'Carta Creativa Diseño', category: 'Cover Letter', imageUrl: '/images/templates/template-33.png', industry: 'Creativo', level: 'Carrera Media', downloads: 1234, rating: 4.9 },
        { id: 34, title: 'Carta Salud Profesional', category: 'Cover Letter', imageUrl: '/images/templates/template-34.png', industry: 'Salud', level: 'Senior', downloads: 890, rating: 4.6 },
        { id: 35, title: 'Carta Nivel Inicial', category: 'Cover Letter', imageUrl: '/images/templates/template-35.png', industry: 'Tecnología', level: 'Nivel Inicial', downloads: 2134, rating: 4.5 },
        { id: 36, title: 'Carta Ejecutiva', category: 'Cover Letter', imageUrl: '/images/templates/template-36.png', industry: 'Corporativo', level: 'Ejecutivo', downloads: 1456, rating: 4.9 },
        { id: 37, title: 'Carta Cambio de Carrera', category: 'Cover Letter', imageUrl: '/images/templates/template-37.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 1678, rating: 4.7 },
        { id: 38, title: 'Carta Freelance', category: 'Cover Letter', imageUrl: '/images/templates/template-38.png', industry: 'Creativo', level: 'Senior', downloads: 1123, rating: 4.8 },

        // Correos
        { id: 39, title: 'Email Seguimiento Post-Entrevista', category: 'Email', imageUrl: '/images/templates/template-39.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 2345, rating: 4.8 },
        { id: 40, title: 'Email Networking Profesional', category: 'Email', imageUrl: '/images/templates/template-40.png', industry: 'Corporativo', level: 'Senior', downloads: 1890, rating: 4.7 },
        { id: 41, title: 'Email Solicitud de Referencia', category: 'Email', imageUrl: '/images/templates/template-41.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 1567, rating: 4.6 },
        { id: 42, title: 'Email Agradecimiento', category: 'Email', imageUrl: '/images/templates/template-42.png', industry: 'Corporativo', level: 'Nivel Inicial', downloads: 2456, rating: 4.5 },
        { id: 43, title: 'Email Propuesta Freelance', category: 'Email', imageUrl: '/images/templates/template-43.png', industry: 'Creativo', level: 'Senior', downloads: 1234, rating: 4.9 },
        { id: 44, title: 'Email Renegociación Salarial', category: 'Email', imageUrl: '/images/templates/template-44.png', industry: 'Corporativo', level: 'Senior', downloads: 1678, rating: 4.8 },
        { id: 45, title: 'Email Primera Conexión', category: 'Email', imageUrl: '/images/templates/template-45.png', industry: 'Tecnología', level: 'Nivel Inicial', downloads: 2134, rating: 4.6 },

        // LinkedIn
        { id: 46, title: 'Resumen LinkedIn Tech Professional', category: 'LinkedIn', imageUrl: '/images/templates/template-46.png', industry: 'Tecnología', level: 'Senior', downloads: 2567, rating: 4.9 },
        { id: 47, title: 'Resumen LinkedIn Creativo', category: 'LinkedIn', imageUrl: '/images/templates/template-47.png', industry: 'Creativo', level: 'Carrera Media', downloads: 1890, rating: 4.8 },
        { id: 48, title: 'Resumen LinkedIn Ejecutivo', category: 'LinkedIn', imageUrl: '/images/templates/template-48.png', industry: 'Corporativo', level: 'Ejecutivo', downloads: 1456, rating: 4.9 },
        { id: 49, title: 'Resumen LinkedIn Salud', category: 'LinkedIn', imageUrl: '/images/templates/template-49.png', industry: 'Salud', level: 'Senior', downloads: 1123, rating: 4.7 },
        { id: 50, title: 'Mensaje LinkedIn Networking', category: 'LinkedIn', imageUrl: '/images/templates/template-50.png', industry: 'Tecnología', level: 'Carrera Media', downloads: 2234, rating: 4.8 },
        { id: 51, title: 'Perfil LinkedIn Junior', category: 'LinkedIn', imageUrl: '/images/templates/template-51.png', industry: 'Tecnología', level: 'Nivel Inicial', downloads: 2456, rating: 4.6 },
        { id: 52, title: 'Recomendación LinkedIn', category: 'LinkedIn', imageUrl: '/images/templates/template-52.png', industry: 'Corporativo', level: 'Senior', downloads: 1678, rating: 4.7 },
    ] as Template[],
    STORY_INDUSTRIES: ['Todo', 'Tecnología', 'Marketing', 'Salud', 'Finanzas'],
    STORY_GOALS: ['Todo', 'Cambio de Carrera', 'Primer Empleo', 'Ascenso', 'Freelance'],
    SUCCESS_STORIES: [
        { id: 1, name: 'María Rodriguez', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', role: 'Ingeniera de Software → Gerente de Producto', industry: 'Tecnología', goal: 'Cambio de Carrera', headline: 'De Programadora a Líder: Cómo un Perfil Verificado Abrió la Puerta a la Gestión', fullStory: 'María era una desarrolladora experta pero le costaba ser considerada para roles de gestión. Al verificar sus certificaciones en gestión de proyectos y usar el asistente de IA para reformular su experiencia, consiguió el trabajo de sus sueños como Gerente de Producto en una empresa tecnológica líder.', featured: true, videoUrl: '#', beforeImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop', afterImageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop'},
        { id: 2, name: 'David Chen', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', role: 'Diseñador Gráfico Freelance', industry: 'Creativo', goal: 'Freelance', headline: 'Dupliqué mi Base de Clientes en Tres Meses', fullStory: 'David usó su portafolio verificado en YourCVPassport con un dominio personalizado para generar confianza con clientes internacionales. La presentación profesional y las habilidades verificadas le ayudaron a destacar en las plataformas de freelance.', videoUrl: '#'},
    ],
    SYSTEM_STATUS_ITEMS: [
        { name: 'Sitio Web Principal y API', status: 'Operacional' },
        { name: 'Editor de Perfil', status: 'Operacional' },
        { name: 'Sistemas de Verificación', status: 'Operacional' },
        { name: 'Generador de CV con IA', status: 'Operacional' },
        { name: 'Sistema de Plantillas', status: 'Operacional' },
        { name: 'Búsqueda de Perfiles Públicos', status: 'Operacional' },
        { name: 'Cambio de Idioma (ES/EN)', status: 'Operacional' },
        { name: 'Servicio de Exportación ATS', status: 'Operacional' },
        { name: 'Portal de Soporte al Cliente', status: 'Operacional' },
        { name: 'Servicios de Facturación', status: 'Operacional' },
        { name: 'Almacenamiento de Avatares', status: 'Operacional' },
        { name: 'Sistema de Autenticación', status: 'Operacional' },
    ],
    UPTIME_STATS: {
        day: '100%',
        week: '99.98%',
        month: '99.99%',
    },
    CHANGELOG_ENTRIES: [
        { version: '2.3.0', date: '10 de noviembre de 2025', changes: [
            { type: 'New Feature', description: 'Sistema de tarjetas de visita digitales con 20 diseños adaptativos que coinciden con cada template de CV.' },
            { type: 'New Feature', description: 'Galería interactiva de tarjetas de visita con filtros (Todas/Gratis/Pro) y vista previa en tiempo real.' },
            { type: 'New Feature', description: 'Descarga de tarjetas en formato PNG (alta resolución 3x) y PDF (tamaño estándar 85.6x54mm).' },
            { type: 'New Feature', description: 'Códigos QR de alta calidad integrados en las tarjetas con nivel de corrección de errores H.' },
            { type: 'New Feature', description: 'Componente LoadingSpinner profesional con animaciones mejoradas y mensajes multilingües.' },
            { type: 'Improvement', description: 'Mejorada la persistencia de sesión para prevenir redirecciones al actualizar (F5) en panel admin.' },
            { type: 'Improvement', description: 'Sistema de gestión de estados de carga separados (session + profile) para rutas protegidas.' },
            { type: 'Improvement', description: 'URLs de producción mostradas correctamente (yourcvpassport.com) en lugar de localhost.' },
            { type: 'Improvement', description: 'ID de usuario mostrando primeros 10 caracteres del UUID en mayúsculas.' },
            { type: 'Bug Fix', description: 'Corregida la redirección no deseada en AdminProtectedRoute al refrescar la página.' },
            { type: 'Bug Fix', description: 'Solucionado problema de importación de jsPDF para generación de PDFs.' },
            { type: 'Bug Fix', description: 'Corregidos campos de datos en tarjetas (headline en lugar de professional_title, email desde sesión).' }
        ] },
        { version: '2.2.0', date: '15 de octubre de 2025', changes: [
            { type: 'New Feature', description: 'Añadidas 4 nuevas plantillas de CV profesionales: Modern Minimalist, Creative Bold, Professional Classic y Healthcare Professional.' },
            { type: 'New Feature', description: 'Implementado sistema de cambio de idioma dinámico (Español/Inglés) con persistencia en localStorage.' },
            { type: 'Improvement', description: 'Mejorada la visualización de avatares en todas las plantillas de CV con soporte para imágenes y respaldo con iniciales.' },
            { type: 'Improvement', description: 'Optimizadas las imágenes de historias de éxito para mejor representación visual.' },
            { type: 'Bug Fix', description: 'Corregido el problema de visualización de fotos de perfil en plantillas públicas.' },
            { type: 'Bug Fix', description: 'Solucionados problemas de traducción en múltiples páginas del sitio.' }
        ] },
        { version: '2.1.0', date: '20 de septiembre de 2025', changes: [{ type: 'New Feature', description: 'Introducido el Generador de Cartas de Presentación con IA.'}, { type: 'Improvement', description: 'Mejorado el formato de exportación ATS para plantillas creativas.' }] },
        { version: '2.0.5', date: '5 de septiembre de 2025', changes: [{ type: 'Bug Fix', description: 'Corregido un problema con la renovación de certificados SSL de dominios personalizados.'}, { type: 'Improvement', description: 'Mejorado el rendimiento del panel de analíticas del perfil.' }] },
    ] as ChangelogEntry[],
    ROADMAP_ITEMS: [
        { title: 'Colaboración Avanzada en Equipo', description: 'Permitir que los equipos comenten y revisen perfiles de candidatos internamente.', quarter: 'T1 2026' },
        { title: 'Función de Introducción en Video', description: 'Permitir a los profesionales añadir una breve introducción en video a su perfil.', quarter: 'T2 2026' },
        { title: 'Aplicación Móvil (iOS y Android)', description: 'Gestiona tu perfil y sigue tus solicitudes sobre la marcha.', quarter: 'T3 2026' },
    ],
    COMPANY_MILESTONES: [
        { year: '2023', title: 'Lanzamiento de la Plataforma', description: 'YourCVPassport fue fundado con la misión de aportar confianza y transparencia al mundo profesional.' },
        { year: '2024', title: '10,000 Usuarios Verificados', description: 'Alcanzamos un hito importante, ayudando a más de 10,000 profesionales a mostrar sus credenciales verificadas.' },
        { year: '2025', title: 'Expansión Global', description: 'Expandiendo nuestros servicios de verificación para cubrir más países e industrias, haciendo de la confianza profesional un estándar global.' },
    ] as MilestoneItem[],
    MISSION_TESTIMONIALS: [
        { quote: "Esta plataforma es más que un creador de CV; es un movimiento hacia un mercado laboral más honesto y transparente.", name: 'Dra. Alisha Khan', role: 'Coach de Carrera y Autora', imageUrl: 'https://picsum.photos/id/1018/100/100'},
        { quote: "Como reclutador, saber que las credenciales de un candidato están pre-verificadas es un gran paso adelante. Se alinea perfectamente con nuestro valor de contratar con integridad.", name: 'Ben Carter', role: 'Jefe de Personal, NextGen', imageUrl: 'https://picsum.photos/id/1019/100/100'}
    ],
    PRESS_RELEASES: [
        { id: 1, date: '10 de julio de 2025', title: 'YourCVPassport Lanza Suite con IA para Revolucionar las Solicitudes de Empleo', summary: 'Las nuevas herramientas incluyen un asistente de IA para la optimización de perfiles y un generador de cartas de presentación, con el objetivo de nivelar el campo de juego para los buscadores de empleo.'},
        { id: 2, date: '5 de junio de 2025', title: 'YourCVPassport Alcanza el Hito de 10,000 Profesionales Verificados', summary: 'La plataforma celebra un crecimiento significativo mientras continúa su misión de construir una red global de talento de confianza.'},
        { id: 3, date: '1 de mayo de 2025', title: 'Anunciada Nueva Alianza con los Principales Proveedores de ATS', summary: 'Las integraciones con los principales Sistemas de Seguimiento de Candidatos agilizarán el proceso de contratación para clientes empresariales.'},
    ],
    EXECUTIVES: [
        { name: 'Jane Doe', title: 'Fundadora y CEO', imageUrl: 'https://picsum.photos/id/1027/200/200', bio: 'Con más de 15 años en tecnología de RRHH, Jane fundó YourCVPassport para resolver el déficit de confianza en el reclutamiento moderno.' },
        { name: 'John Smith', title: 'Director de Tecnología (CTO)', imageUrl: 'https://picsum.photos/id/1005/200/200', bio: 'Experto en seguridad y entusiasta de la IA, John lidera el desarrollo de nuestra plataforma segura e innovadora.' },
        { name: 'Emily White', title: 'VP de Producto', imageUrl: 'https://picsum.photos/id/1011/200/200', bio: 'A Emily le apasiona crear productos centrados en el usuario que empoderen a los profesionales en su trayectoria profesional.' },
    ],
    MEDIA_COVERAGE: [
        { name: 'TechForward', logoUrl: '#', articleUrl: '#' },
        { name: 'HR Weekly', logoUrl: '#', articleUrl: '#' },
        { name: 'Career Insider', logoUrl: '#', articleUrl: '#' },
        { name: 'Startup Daily', logoUrl: '#', articleUrl: '#' },
        { name: 'Forbes', logoUrl: '#', articleUrl: '#' },
    ],
    CONTACT_PAGE_FAQ_ITEMS: [
        { question: '¿Cuál es su horario de atención?', answer: 'Nuestro equipo de soporte está disponible 24/7 por correo electrónico. Para consultas de ventas y asociaciones, nuestro horario es de lunes a viernes, de 9 AM a 6 PM CET.' },
        { question: '¿Dónde está la sede de YourCVPassport?', answer: 'Nuestra sede se encuentra en Valencia, España, cerca del Ayuntamiento de Valencia en el centro histórico de la ciudad. Operamos con un equipo totalmente remoto en todo el mundo.'},
        { question: '¿Cómo puedo verificar mis credenciales en la plataforma?', answer: 'Puedes verificar tus credenciales educativas y profesionales a través de nuestro sistema blockchain. Simplemente sube los documentos necesarios en la sección de verificación de tu perfil, y nuestro equipo procesará la verificación en 24-48 horas laborables.' },
        { question: '¿Ofrecen soporte en español?', answer: 'Sí, ofrecemos soporte completo en español e inglés. Nuestro equipo está disponible para ayudarte en tu idioma preferido a través de correo electrónico, chat en vivo y nuestro centro de ayuda multilingüe.' },
        { question: '¿Cuál es el tiempo de respuesta promedio del equipo de soporte?', answer: 'Para consultas generales por correo electrónico, nuestro tiempo de respuesta es de 4-6 horas durante días laborables. Los clientes del plan Profesional reciben respuesta en menos de 2 horas, y los clientes Corporativos tienen soporte prioritario con respuesta garantizada en menos de 1 hora.' },
        { question: '¿Tienen oficinas físicas donde pueda visitarlos?', answer: 'Nuestra sede principal está en Valencia, España, pero operamos principalmente de forma remota para servir mejor a nuestra comunidad global. Para reuniones presenciales o visitas a la oficina, por favor coordina previamente con nuestro equipo a través de support@yourcvpassport.com.' },
        { question: '¿Cómo puedo reportar un problema técnico o bug en la plataforma?', answer: 'Si encuentras un problema técnico, por favor repórtalo inmediatamente enviando un correo a support@yourcvpassport.com con capturas de pantalla, descripción del problema y los pasos para reproducirlo. Nuestro equipo técnico lo investigará y te mantendrá informado del progreso.' },
        { question: '¿Ofrecen capacitación o webinars para nuevos usuarios?', answer: 'Sí, organizamos webinars gratuitos mensuales para nuevos usuarios donde mostramos las mejores prácticas de la plataforma, cómo optimizar tu perfil, y responder preguntas en vivo. También ofrecemos sesiones de capacitación personalizadas para equipos corporativos.' },
        { question: '¿Cómo puedo dar feedback o sugerir nuevas funcionalidades?', answer: 'Valoramos mucho tus comentarios. Puedes enviar sugerencias, ideas de funcionalidades o feedback general a través del formulario de contacto, por correo a support@yourcvpassport.com, o participando en nuestra comunidad de usuarios. Revisamos todas las sugerencias mensualmente para nuestra hoja de ruta de producto.' },
    ],
    CORE_VALUES: [
        { icon: transparencyIcon, title: 'Transparencia', description: 'Creemos en la comunicación abierta. Nuestros precios son públicos, nuestro roadmap es compartido y construimos abiertamente con nuestra comunidad.' },
        { icon: trustIcon, title: 'Confianza', description: 'La confianza es nuestra base. Estamos comprometidos a construir una plataforma donde cada credencial pueda ser verificada y cada perfil sea fiable.' },
        { icon: innovationIcon, title: 'Innovación', description: 'Aprovechamos la tecnología de punta, como la IA, para resolver problemas del mundo real en el reclutamiento y hacer que el proceso de contratación sea más eficiente y justo.' },
        { icon: inclusivityIcon, title: 'Inclusividad', description: 'Nos esforzamos por crear un campo de juego nivelado, proporcionando herramientas que empoderen a profesionales de todos los orígenes para acceder a oportunidades globales.' }
    ],
    COMPANY_FACTS: [
        { icon: factFoundedIcon, value: '2023', label: 'Fundada en' },
        { icon: factUsersIcon, value: '10,000+', label: 'Usuarios Activos' },
        { icon: factCountriesIcon, value: '50+', label: 'Países Atendidos' },
        { icon: factTeamIcon, value: '25+', label: 'Miembros del Equipo' }
    ],
    CONTACT_CARDS: [
        { icon: contactSupportIcon, title: 'Soporte al Cliente', description: 'Para ayuda con tu perfil, verificaciones o problemas con la cuenta.', email: 'support@yourcvpassport.com', ctaText: 'Enviar Email a Soporte', ctaLink: 'mailto:support@yourcvpassport.com', isMailLink: true },
        { icon: contactSalesIcon, title: 'Consultas de Ventas', description: 'Aprende más sobre nuestros planes para Empresas y soluciones personalizadas.', email: 'support@yourcvpassport.com', ctaText: 'Contactar Ventas', ctaLink: 'mailto:support@yourcvpassport.com', isMailLink: true },
        { icon: contactPartnershipsIcon, title: 'Asociaciones', description: '¿Interesado en integrarte con nosotros o formar una asociación?', email: 'support@yourcvpassport.com', ctaText: 'Conviértete en Socio', ctaLink: 'mailto:support@yourcvpassport.com', isMailLink: true },
    ],
    howItWorksPage: {
        title: "Cómo Funciona para Profesionales",
        subtitle: "Desde la creación del perfil hasta conseguir el trabajo de tus sueños, aquí tienes tu guía paso a paso para el éxito.",
        heroSteps: [
            { title: "Construye Perfil", description: "Importa datos o empieza de cero." },
            { title: "Verifícate", description: "Añade confianza con sellos." },
            { title: "Comparte y Triunfa", description: "Haz que te vean los reclutadores." }
        ],
        gettingStarted: {
            title: "Primeros Pasos para Conseguir Trabajo como Profesional",
            subtitle: "Tu camino hacia oportunidades laborales profesionales comienza aquí."
        },
        mainSteps: [
            {
                stepLabel: "Paso 1",
                title: "Importa y Construye Tu Perfil",
                description: "Crea rápidamente tu perfil importando datos de LinkedIn o subiendo tu CV existente. Nuestras herramientas analizarán la información y la estructurarán por ti.",
                features: ["Importación de LinkedIn", "Subida de CV", "Entrada Manual"],
                showcase: { title: "Secciones del Perfil", layout: "grid", items: ["Resumen", "Experiencia", "Educación", "Habilidades"] }
            },
            {
                stepLabel: "Paso 2",
                title: "Verifica Tus Credenciales",
                description: "Añade una capa de confianza verificando tus cualificaciones clave. Envía tus documentos a través de nuestro portal seguro para obtener sellos de verificación.",
                features: ["Verificación de Identidad", "Sellos de Educación e Historial Laboral"],
                showcase: { title: "Estado de Verificación", layout: 'stack', items: [{ title: "Educación", description: "Verificado" }, { title: "Historial Laboral", description: "Pendiente" }] }
            },
        ],
        video: {
            title: "Mira Nuestro Tutorial",
            subtitle: "Ve la plataforma en acción."
        },
        whatsNext: {
            title: "¿Qué Sigue Después de Compartir?",
            subtitle: "Aprovecha tu nuevo CV profesional.",
            items: [
                { title: "Sigue las Analíticas", description: "Ve quién está viendo tu perfil." },
                { title: "Aplica con Confianza", description: "Usa tu URL verificada en las solicitudes." }
            ]
        },
        testimonials: {
            title: "Casos de Éxito",
            description: "Escucha a otros profesionales."
        },
        finalCta: {
            title: "¿Listo para Empezar?",
            subtitle: "Crea tu CV profesional hoy.",
            button: "Empieza Gratis"
        }
    },
    templatesAndExamplesPage: {
        title: "Biblioteca de Plantillas y Ejemplos",
        subtitle: "Plantillas diseñadas profesionalmente para cada industria y nivel de carrera.",
        templatesIncluded: "CVs, Cartas de Presentación, Correos y Más",
        gallery: {
            title: "Explora Nuestras Plantillas",
            subtitle: "Encuentra el diseño perfecto que coincida con tu marca personal.",
            categories: [
                { key: 'All', name: 'Todo' },
                { key: 'CV', name: 'CVs' },
                { key: 'Cover Letter', name: 'Cartas de Presentación' },
                { key: 'Email', name: 'Correos' },
            ],
            templates: [] // Uses TEMPLATES constant
        },
        successStories: {
            title: "Casos de Éxito Reales",
            subtitle: "Ve la transformación antes y después.",
            imageCaption: "Una plantilla bien estructurada puede marcar la diferencia."
        },
        customize: {
            title: "Editor Visual Intuitivo",
            subtitle: "Personaliza cada detalle sin esfuerzo.",
            features: [
                "Cambia colores, fuentes y estilos en tiempo real",
                "Reorganiza secciones con drag-and-drop",
                "Previsualiza cambios instantáneamente",
                "Ajusta márgenes y espaciado",
                "Exporta a PDF de alta calidad"
            ]
        },
        comparison: {
            title: "YourCVPassport vs. Herramientas Tradicionales",
            headers: ["Característica", "YourCVPassport", "Tradicional"],
            rows: [
                { feature: "Optimizado para ATS", values: ["✓", "-"] },
                { feature: "Diseñado Profesionalmente", values: ["✓", "Varía"] },
                { feature: "Editor Visual en Tiempo Real", values: ["✓", "-"] },
                { feature: "Verificación Blockchain", values: ["✓", "-"] },
                { feature: "Múltiples Formatos de Exportación", values: ["✓", "Limitado"] },
                { feature: "Analíticas de Perfil", values: ["✓", "-"] }
            ]
        },
        finalCta: {
            title: "Encuentra Tu Plantilla Perfecta",
            subtitle: "Comienza a construir tu perfil profesional hoy.",
            button: "Explorar Plantillas"
        }
    },
    pricingPage: {
        title: "Encuentra el Plan Perfecto",
        subtitle: "Elige el plan adecuado para tus objetivos profesionales.",
        billingToggle: {
            monthly: "Mensual",
            annually: "Anual",
            save: "Ahorra 20%"
        },
        plans: {
            title: "Nuestros Planes"
        },
        comparison: {
            title: "Compara Todas las Funciones"
        },
        roi: {
            title: "Retorno de la Inversión",
            subtitle: "Mira cómo nuestros planes pueden ayudarte.",
            stats: [
                { value: "3x", label: "Más Vistas de Perfil" },
                { value: "50%", label: "Contratación más Rápida" },
                { value: "98%", label: "Confianza del Reclutador" }
            ]
        },
        guarantee: {
            title: "Nuestra Garantía",
            items: [
                { title: "Devolución de Dinero", description: "Garantía de devolución de 14 días." },
                { title: "Cancela en Cualquier Momento", description: "Sin contratos a largo plazo." },
                { title: "Pagos Seguros", description: "Tus datos están seguros." },
                { title: "Precios Transparentes", description: "Sin cargos ocultos." },
            ]
        },
        testimonialsTitle: "Lo que Dicen Nuestros Usuarios",
        faqTitle: "Preguntas Frecuentes",
        finalCta: {
            title: "¿Listo para Empezar?",
            subtitle: "Elige tu plan y comienza a construir tu futuro.",
            button: "Regístrate Ahora"
        },
        freePrice: "Gratis",
        customPrice: "A medida",
        trialLabel: "Prueba de 14 Días"
    },
    helpCenterPage: {
        title: "Centro de Ayuda",
        subtitle: "Estamos aquí para ayudar. Encuentra respuestas a tus preguntas.",
        searchPlaceholder: "Buscar artículos...",
        categories: [
            { icon: transparencyIcon, title: "Primeros Pasos", description: "Aprende lo básico." },
            { icon: trustIcon, title: "Verificación", description: "Todo sobre los sellos." },
            { icon: innovationIcon, title: "Configuración de la Cuenta", description: "Gestiona tu cuenta." }
        ],
        popular: {
            title: "Artículos Populares",
            articles: [
                "¿Cómo verificar tu educación?",
                "¿Cómo configurar un dominio personalizado?",
                "Solución de problemas de exportación ATS."
            ]
        },
        video: {
            title: "Video Tutorial",
            caption: "Guía de Inicio Rápido"
        },
        faqTitle: "Preguntas Frecuentes",
        community: {
            title: "Únete a Nuestra Comunidad",
            description: "Haz preguntas y comparte consejos con otros usuarios.",
            button: "Visitar Foro"
        },
        contact: {
            title: "Contactar a Soporte",
            description: "¿No encuentras una respuesta? Nuestro equipo está aquí para ayudar.",
            button: "Contáctanos"
        }
    },
    advancedTalentSearch: {
        title: "Búsqueda Avanzada de Talentos",
        subtitle: "Encuentra talento verificado y de primer nivel más rápido que nunca.",
        searchButton: "Buscar",
        interfaceTitle: "Descubre tu Próxima Contratación",
        verified: "Verificado",
        more: "más",
        viewProfile: "Ver Perfil",
        filters: {
            title: "Filtros",
            stamps: { label: "Sellos de Verificación", identity: "Identidad Verificada", education: "Educación Verificada", experience: "Experiencia Verificada" },
            skills: { label: "Habilidades", placeholder: "ej., Python, Figma" },
            location: { label: "Ubicación", placeholder: "ej., Berlín, Alemania" },
            salary: { label: "Expectativa Salarial (EUR)", min: "Mín", max: "Máx" },
            experience: { label: "Años de Experiencia", options: ["Cualquiera", "0-2 años", "3-5 años", "6-10 años", "10+ años"] },
            applyButton: "Aplicar Filtros"
        },
        aiMatching: {
            title: "Emparejamiento de Candidatos con IA",
            description: "Nuestra IA analiza la descripción de tu trabajo y te presenta los candidatos más relevantes y verificados de nuestra base de talentos.",
            features: [
                {
                    title: "Búsqueda Semántica Avanzada",
                    description: "Encuentra candidatos basándote en el significado, no solo en palabras clave exactas."
                },
                {
                    title: "Coincidencia de Habilidades",
                    description: "Identifica automáticamente las competencias técnicas y blandas que coinciden con tu búsqueda."
                },
                {
                    title: "Análisis de Experiencia",
                    description: "Evalúa la trayectoria profesional y la progresión de carrera de cada candidato."
                },
                {
                    title: "Puntuación de Compatibilidad",
                    description: "Recibe un porcentaje de compatibilidad para cada perfil basado en múltiples factores."
                },
                {
                    title: "Recomendaciones Inteligentes",
                    description: "Descubre candidatos similares que podrían ser perfectos para tu posición."
                }
            ]
        },
        comparison: {
            title: "Por Qué Nuestra Búsqueda es Mejor",
            headers: ["Característica", "YourCVPassport", "Plataformas Tradicionales"],
            rows: [
                { feature: "Credenciales Verificadas", passport: "✓", traditional: "-" },
                { feature: "Emparejamiento con IA", passport: "✓", traditional: "Basado en palabras clave" },
                { feature: "Perfiles Actualizados en Tiempo Real", passport: "✓", traditional: "Perfiles desactualizados" },
                { feature: "Contacto Directo con Candidatos", passport: "✓", traditional: "Limitado" },
                { feature: "Filtros Avanzados por Skills", passport: "✓", traditional: "Filtros básicos" },
                { feature: "Análisis Predictivo de Compatibilidad", passport: "✓", traditional: "-" },
                { feature: "Verificación de Experiencia Laboral", passport: "✓", traditional: "-" },
                { feature: "Validación de Educación", passport: "✓", traditional: "-" },
                { feature: "Integración ATS Completa", passport: "✓", traditional: "Parcial" },
                { feature: "Búsqueda Semántica Avanzada", passport: "✓", traditional: "Búsqueda por texto" },
                { feature: "Dashboard de Analíticas", passport: "✓", traditional: "Básico" },
                { feature: "Exportación de Datos", passport: "PDF, DOCX, JSON", traditional: "Solo PDF" },
            ]
        },
        finalCta: {
            title: "Empieza a Encontrar Talento Verificado Hoy",
            subtitle: "Regístrate en un plan de empresa para acceder a nuestra búsqueda avanzada de talento.",
            button: "Comenzar Ahora"
        }
    },
    companyPlansPage: {
        title: "Planes para Empresas",
        subtitle: "Accede a un grupo de talento verificado y agiliza tu proceso de contratación.",
        tiers: {
            title: "Nuestros Niveles",
            plans: [
                { title: "Starter", description: "Para equipos pequeños.", price: "€99", credits: "100 créditos/mes", features: ["Acceso a la búsqueda", "1 puesto de usuario"], cta: "Empezar" },
                { title: "Growth", description: "Para empresas en crecimiento.", price: "€249", credits: "1000 créditos/mes", features: ["Todo en Starter", "3 puestos de usuario", "Integración ATS"], cta: "Empezar", highlight: true },
                { title: "Enterprise", description: "Para grandes organizaciones.", price: "A medida", credits: "3000 créditos/mes", features: ["Todo en Growth", "Puestos ilimitados", "Acceso a API"], cta: "Contactar a Ventas" }
            ]
        },
        credits: {
            title: "Cómo Funcionan los Créditos",
            subtitle: "Usa los créditos para desbloquear acciones dentro de la plataforma.",
            items: [
                { cost: "1 Crédito", action: "Ver Perfil Completo" },
                { cost: "5 Créditos", action: "Obtener Información de Contacto" },
                { cost: "10 Créditos", action: "Enviar Mensaje Directo" }
            ]
        },
        matrix: {
            title: "Matriz de Características",
            headers: ["Característica", "Starter", "Growth", "Enterprise"],
            rows: [
                { feature: "Búsqueda de Talento", starter: "✓", growth: "✓", enterprise: "✓" },
                { feature: "Puestos de Usuario", starter: "1", growth: "3", enterprise: "Ilimitados" },
                { feature: "Integración ATS", starter: "-", growth: "✓", enterprise: "✓" },
            ]
        },
        testimonialsTitle: "Lo que Dicen los Reclutadores",
        roi: {
            title: "Retorno de la Inversión",
            timeToHire: { title: "Tiempo para Contratar", value: "-40%" },
            costPerHire: { title: "Costo por Contratación", value: "-25%" }
        },
    },
    atsIntegrationsPage: {
        title: "Integraciones ATS",
        subtitle: "Conecta sin problemas YourCVPassport con tus herramientas de contratación existentes.",
        logos: ["Greenhouse", "Lever", "Workable", "SmartRecruiters"],
        learnMore: "Saber Más",
        showcase: {
            title: "Integraciones Destacadas",
            subtitle: "Integraciones con un solo clic con los principales Sistemas de Seguimiento de Candidatos de la industria."
        },
        setup: {
            title: "Configuración Fácil",
            steps: [
                { title: "Conectar Cuenta", description: "Autoriza tu ATS." },
                { title: "Configurar Ajustes", description: "Mapea campos y etapas." },
                { title: "Sincronizar Perfiles", description: "Empieza a sincronizar candidatos." }
            ]
        },
        api: {
            title: "Crea Integraciones Personalizadas con Nuestra API",
            description: "Nuestra robusta API REST te permite crear flujos de trabajo personalizados e integrar nuestros datos verificados en cualquier sistema.",
            features: ["Accede a datos verificados", "Sincroniza perfiles de candidatos", "Webhooks para actualizaciones en tiempo real"],
            cta: "Ver Documentación de la API",
            comment: "// Obtener datos del candidato..."
        },
        security: {
            title: "Seguro y Conforme",
            description: "Todas las integraciones se construyen con seguridad de nivel empresarial y son totalmente conformes con el RGPD.",
            badges: ["OAuth 2.0", "Cifrado de Datos", "Conforme con RGPD"]
        },
        finalCta: {
            title: "Optimiza tu Flujo de Trabajo de Contratación",
            subtitle: "Intégrate con tus herramientas favoritas y contrata más rápido.",
            button: "Explorar Integraciones"
        }
    },
    securityCompliancePage: {
        title: "Seguridad y Cumplimiento",
        subtitle: "Tu confianza es nuestra máxima prioridad. Estamos comprometidos a proteger tus datos.",
        heroBadges: ["Cumple con RGPD", "Certificado SOC 2", "Cifrado de Extremo a Extremo"],
        commitment: {
            security: {
                title: "Nuestro Compromiso con la Seguridad",
                description: "Empleamos las mejores prácticas de la industria para mantener tus datos seguros.",
                features: [
                    { title: "Cifrado", description: "Los datos se cifran en reposo y en tránsito." },
                    { title: "Auditorías Regulares", description: "Nos sometemos a auditorías de seguridad regulares de terceros." }
                ]
            },
            privacy: {
                title: "Nuestro Compromiso con la Privacidad",
                description: "Tú tienes el control de tus datos.",
                features: [
                    { title: "Portabilidad de Datos", description: "Exporta tus datos en cualquier momento." },
                    { title: "Controles Granulares", description: "Tú decides qué compartir." }
                ]
            }
        },
        certifications: {
            title: "Certificaciones y Cumplimiento",
            items: ["SOC 2 Tipo II", "ISO 27001", "RGPD", "CCPA"]
        },
        dataFlow: {
            title: "Flujo de Datos",
            steps: ["Ingresas Datos", "Los Datos se Cifran", "Almacenamiento Seguro", "Tú Controlas el Acceso"]
        },
        transparency: {
            title: "Características de Transparencia",
            features: [
                { icon: transparencyIcon, title: "Procesamiento de Datos", description: "Información clara sobre cómo usamos tus datos." },
                { icon: trustIcon, title: "Subprocesadores", description: "Una lista pública de nuestros proveedores de servicios de terceros." },
                { icon: innovationIcon, title: "Código Abierto", description: "Contribuimos y usamos software de código abierto." },
                { icon: inclusivityIcon, title: "Informes de Incidentes", description: "Informes públicos sobre cualquier incidente de seguridad." }
            ]
        },
        finalCta: {
            title: "¿Tienes Preguntas?",
            subtitle: "Visita nuestro Centro de Confianza para informes y políticas detalladas.",
            button: "Visitar Centro de Confianza"
        }
    },
    blogPage: {
        title: "Blog y Guías Profesionales",
        subtitle: "Consejos de expertos para ayudarte a navegar tu carrera profesional.",
        featured: {
            label: "Artículo Destacado"
        },
        searchPlaceholder: "Buscar artículos...",
        sidebar: {
            popular: {
                title: "Artículos Populares"
            },
            newsletter: {
                title: "Suscríbete a nuestro Boletín",
                subtitle: "Recibe los últimos consejos profesionales en tu bandeja de entrada.",
                placeholder: "Tu dirección de correo",
                button: "Suscribirse",
                alert: "Suscrito con éxito con"
            }
        },
        finalCta: {
            title: "¿Listo para dar el siguiente paso?",
            subtitle: "Crea tu CV profesional hoy.",
            button: "Empezar"
        }
    }
    ,
    onboardingWizard: {
        step: "Paso",
        of: "de",
        startButton: "¡Empecemos!",
        backButton: "Atrás",
        nextButton: "Siguiente",
        finishButton: "Finalizar",
        goals: ["Buscar un empleo", "Encontrar nuevos clientes", "Hacer networking"],
        dragAndDrop: "Arrastra y suelta tu CV aquí",
        dropHere: "Suelta el archivo aquí...",
        or: "o",
        browseFiles: "Explorar archivos",
        skip: "Omitir por ahora",
        aiGenerating: "La IA está generando tu perfil...",
        stampsDescription: "Activa tus sellos de verificación.",
        verifyEmail: "Verificar Email",
        setHandle: "Elige tu URL pública",
        handlePlaceholder: "tu-nombre",
        copyUrl: "Copiar URL",
        copied: "¡Copiado!",
        noCvMessage: "Por favor, vuelve atrás e importa un CV para usar el Asistente de IA.",
        goBackAndImport: "Volver e Importar",
        shareDescription: "¡Tu perfil está activo! Compártelo con el mundo.",
        social: "Redes",
        steps: [
            { title: "Bienvenida", description: "Vamos a crear tu CV. Te haremos algunas preguntas para construir un perfil impresionante y verificado." },
            { title: "Elige Rol y Objetivo", description: "¿Cuál es tu objetivo principal? (ej. empleo, clientes, networking)" },
            { title: "Importar CV", description: "Arrastra y suelta tu CV (PDF/DOCX) u omite este paso por ahora." },
            { title: "Generación de Perfil con IA", description: "Nuestra IA está creando tu perfil. Podrás previsualizarlo y editarlo." },
            { title: "Activar Sellos", description: "Verifica tu identidad para generar confianza. Te guiaremos en la verificación de email/teléfono." },
            { title: "Publicar Perfil", description: "Configura tu URL única y los ajustes de visibilidad." },
            { title: "Comparte tu CV", description: "Comparte tu nuevo perfil por URL, código QR o redes sociales." }
        ]
    },
    contactLeadModal: {
        title: "Contactar a",
        subtitle: "Envía un mensaje especificando el motivo de contacto",
        successTitle: "¡Mensaje Enviado!",
        successMessage: "recibirá tu mensaje pronto.",
        leadTypes: {
            jobOffer: "Oferta de Trabajo",
            collaboration: "Colaboración",
            networking: "Networking",
            consultation: "Consultoría",
            other: "Otro"
        },
        form: {
            leadType: "Tipo de Contacto",
            subject: "Asunto",
            subjectPlaceholder: "Ej: Oferta de Senior Developer en nuestra empresa",
            subjectPlaceholderOther: "Ej: Propuesta de colaboración en proyecto",
            message: "Mensaje",
            messagePlaceholder: "Describe tu propuesta, oferta o motivo de contacto...",
            messageMinLength: "Mínimo 50 caracteres para enviar",
            company: "Empresa",
            companyPlaceholder: "Nombre de la empresa",
            position: "Posición Ofrecida",
            positionPlaceholder: "Ej: Senior Developer",
            salary: "Rango Salarial",
            salaryPlaceholder: "Ej: $80k - $120k",
            location: "Ubicación",
            locationPlaceholder: "Ej: Remote / Madrid",
            companyOptional: "Empresa / Organización (opcional)",
            companyOptionalPlaceholder: "Nombre de tu empresa u organización",
            jobOfferDetails: "Detalles de la Oferta"
        },
        buttons: {
            cancel: "Cancelar",
            send: "Enviar Mensaje",
            sending: "Enviando..."
        },
        errors: {
            loginRequired: "Debes iniciar sesión para enviar un mensaje"
        }
    },
    leadsInbox: {
        title: "Mensajes Recibidos",
        noNewMessages: "No tienes mensajes nuevos",
        newMessages: "mensaje nuevo",
        newMessagesPlural: "mensajes nuevos",
        searchPlaceholder: "Buscar conversaciones...",
        filters: {
            all: "Todos",
            new: "Nuevos",
            read: "Leídos",
            replied: "Respondidos",
            unread: "No leídos",
            job_offers: "Ofertas de Trabajo",
            collaboration: "Colaboración",
            accepted: "Aceptados",
            rejected: "Rechazados"
        },
        emptyState: {
            title: "No hay mensajes en esta categoría",
            description: "Los mensajes aparecerán aquí cuando los recibas",
            noConversations: "Sin conversaciones",
            noConversationsDescription: "Tus conversaciones aparecerán aquí",
            noMessages: "Sin mensajes aún",
            noMessagesDescription: "Selecciona una conversación para comenzar a mensajear"
        },
        detailView: {
            selectMessage: "Selecciona un mensaje",
            selectMessageDescription: "Haz clic en un mensaje de la lista para ver los detalles completos",
            contactType: "Tipo de Contacto",
            subject: "Asunto",
            message: "Mensaje",
            company: "Empresa",
            position: "Posición",
            salary: "Salario",
            location: "Ubicación",
            jobOfferDetails: "Detalles de la Oferta",
            leadDetails: "Detalles del Lead",
            contactInfo: "Información de Contacto",
            name: "Nombre",
            email: "Email",
            phone: "Teléfono",
            type: "Tipo",
            status: "Estado",
            received: "Recibido",
            lastMessage: "Último Mensaje"
        },
        actions: {
            markReplied: "Marcar Respondido",
            archive: "Archivar",
            accept: "Aceptar",
            reject: "Rechazar",
            send: "Enviar"
        },
        status: {
            new: "Nuevo",
            read: "Leído",
            replied: "Respondido",
            accepted: "Aceptado",
            rejected: "Rechazado",
            archived: "Archivado",
            pending: "Pendiente",
            contacted: "Contactado"
        },
        messageInput: {
            placeholder: "Escribe un mensaje...",
            sending: "Enviando...",
            sent: "Enviado",
            error: "Error al enviar"
        },
        labels: {
            unread: "sin leer",
            starred: "Destacados",
            today: "Hoy",
            yesterday: "Ayer",
            thisWeek: "Esta semana",
            older: "Anteriores"
        }
    },
    displaySettings: {
        title: "Configuración de Visualización del CV",
        subtitle: "Controla qué secciones opcionales se muestran en tu CV público",
        options: {
            availability: {
                title: "Mostrar Badge de Disponibilidad",
                description: "Muestra un indicador de \"Open to opportunities\" en tu CV"
            },
            qrCode: {
                title: "Mostrar Código QR",
                description: "Incluye un código QR para compartir tu perfil fácilmente"
            },
            credentials: {
                title: "Mostrar Credenciales Verificadas",
                description: "Muestra badges de verificación (email, LinkedIn, identidad)"
            },
            connectLinks: {
                title: "Mostrar Enlaces de Conexión",
                description: "Muestra una sección con tus enlaces profesionales (LinkedIn, Portfolio, GitHub)"
            }
        },
        recommended: "Recomendado",
        tip: {
            title: "Consejo Profesional",
            description: "Las secciones recomendadas ayudan a que tu CV sea más profesional y fácil de compartir. Las credenciales verificadas y enlaces de conexión son opcionales y pueden ser útiles si ya tienes esa información en otras partes de tu CV."
        },
        buttons: {
            save: "Guardar Configuración",
            saving: "Guardando..."
        },
        messages: {
            success: "Configuración guardada correctamente",
            error: "Error al guardar la configuración"
        }
    },
    aiAssistantSection: {
        title: "Asistente de IA",
        subtitle: "Mejora tu CV con inteligencia artificial",
        analyzeButton: "Analizar",
        analyzingButton: "Analizando...",
        tabs: {
            summary: "Resumen",
            experience: "Experiencia",
            education: "Educación"
        },
        suggestions: {
            title: "Sugerencias de Mejora",
            originalText: "Texto Original",
            improvedText: "Mejorado por IA",
            applyButton: "Aplicar Mejora",
            applyingButton: "Aplicando...",
            appliedSuccess: "Aplicado exitosamente"
        },
        emptyState: {
            title: "No hay sugerencias todavía",
            description: {
                summary: "Haz clic en Analizar para generar mejoras inteligentes de tu resumen",
                experience: "Haz clic en Analizar para generar mejoras inteligentes de tu experiencia",
                education: "Haz clic en Analizar para generar mejoras inteligentes de tu educación"
            }
        },
        notConfigured: {
            title: "Asistente de IA No Disponible",
            description: "El asistente de IA no está configurado actualmente. Esta función requiere una API Key de Google AI para funcionar.",
            whatCanYouDo: "¿Qué puedes hacer mientras tanto?",
            alternatives: {
                editManually: "Edita manualmente tu perfil en las otras secciones",
                useTemplates: "Usa las plantillas profesionales disponibles",
                exportPDF: "Exporta tu CV en formato PDF"
            },
            adminNote: "Nota para administradores: Configura la variable de entorno"
        },
        errors: {
            analyzingSummary: "Error al analizar el resumen profesional",
            analyzingExperiences: "Error al analizar experiencias laborales",
            analyzingEducation: "Error al analizar educación",
            applyingSuggestion: "Error al aplicar la mejora",
            noExperiences: "No hay experiencias laborales para analizar",
            noEducation: "No hay educación para analizar"
        },
        success: {
            applied: "✓ Mejora aplicada exitosamente"
        }
    },

    aiQuestionnaire: {
        sections: {
            identity: { name: 'Información Personal', icon: '👤' },
            experience: { name: 'Experiencia Laboral', icon: '💼' },
            education: { name: 'Educación', icon: '🎓' },
            skills: { name: 'Habilidades', icon: '⚡' },
            languages: { name: 'Idiomas', icon: '🌍' },
            preferences: { name: 'Preferencias', icon: '⚙️' },
            template: { name: 'Plantilla de CV', icon: '🎨' }
        },
        progress: {
            step: 'Paso',
            of: 'de'
        },
        navigation: {
            previous: 'Anterior',
            next: 'Siguiente',
            finish: 'Finalizar',
            saving: 'Guardando...'
        },
        identity: {
            name: 'Nombre',
            namePlaceholder: 'Juan Pérez',
            title: 'Título',
            titlePlaceholder: 'Desarrollador Full Stack',
            email: 'Email',
            emailPlaceholder: 'email@ejemplo.com',
            phone: 'Teléfono',
            phonePlaceholder: '+34 600 123 456',
            location: 'Ubicación',
            locationPlaceholder: 'Madrid, España',
            linkedin: 'LinkedIn',
            linkedinPlaceholder: 'linkedin.com/in/usuario',
            github: 'GitHub',
            githubPlaceholder: 'github.com/usuario',
            portfolio: 'Portfolio',
            portfolioPlaceholder: 'portfolio.com',
            summary: 'Resumen',
            summaryPlaceholder: 'Describe tu trayectoria profesional...',
            countryPlaceholder: 'Selecciona tu país'
        },
        experience: {
            label: 'Experiencia',
            position: 'Cargo',
            positionPlaceholder: 'Desarrollador Senior',
            company: 'Empresa',
            companyPlaceholder: 'Tech Company',
            startDate: 'Inicio',
            endDate: 'Fin',
            currentJob: 'Trabajo actual',
            description: 'Descripción',
            descriptionPlaceholder: 'Responsabilidades y logros...'
        },
        education: {
            label: 'Educación',
            institution: 'Institución',
            institutionPlaceholder: 'Universidad',
            degree: 'Título',
            degreePlaceholder: 'Licenciatura',
            field: 'Campo',
            fieldPlaceholder: 'Ingeniería',
            startDate: 'Inicio',
            endDate: 'Fin',
            description: 'Descripción',
            descriptionPlaceholder: 'Logros y cursos relevantes...'
        },
        skills: {
            label: 'Habilidad',
            skill: 'Habilidad',
            skillPlaceholder: 'JavaScript',
            level: 'Nivel',
            levelSelect: 'Seleccionar',
            levelBasic: 'Básico',
            levelIntermediate: 'Intermedio',
            levelAdvanced: 'Avanzado',
            levelExpert: 'Experto',
            years: 'Años'
        },
        languages: {
            label: 'Idioma',
            language: 'Idioma',
            languagePlaceholder: 'Español',
            level: 'Nivel',
            levelSelect: 'Seleccionar',
            levelA1: 'A1 - Básico',
            levelA2: 'A2 - Pre-intermedio',
            levelB1: 'B1 - Intermedio',
            levelB2: 'B2 - Intermedio-alto',
            levelC1: 'C1 - Avanzado',
            levelC2: 'C2 - Maestría',
            levelNative: 'Nativo'
        },
        preferences: {
            availability: 'Disponibilidad',
            availabilitySelect: 'Seleccionar',
            availabilityImmediate: 'Inmediata',
            availability1Week: '1 semana',
            availability2Weeks: '2 semanas',
            availability1Month: '1 mes',
            availabilityMore: 'Más de 1 mes',
            workMode: 'Modalidad',
            workModeSelect: 'Seleccionar',
            workModeRemote: 'Remoto',
            workModeOnsite: 'Presencial',
            workModeHybrid: 'Híbrido',
            expectedSalary: 'Salario esperado',
            expectedSalaryPlaceholder: '50.000€ - 60.000€',
            relocationWilling: 'Dispuesto a relocalizarse'
        },
        template: {
            selectTemplate: 'Selecciona una plantilla'
        },
        messages: {
            loadingError: 'Error al cargar el perfil',
            savingError: 'Error al guardar el perfil',
            completedTitle: '¡Perfil completado!',
            completedMessage: 'Tu perfil se ha guardado correctamente',
            optimizing: 'Optimizando...',
            aiNotAvailable: 'Asistente de IA no disponible'
        },
        required: '*'
    },
    // Encabezados de secciones de CV y etiquetas comunes
    cvSections: {
        summary: 'Resumen',
        about: 'Sobre Mí',
        profile: 'Perfil Profesional',
        workExperience: 'Experiencia Laboral',
        experience: 'Experiencia',
        professionalExperience: 'Experiencia Profesional',
        education: 'Educación',
        skills: 'Habilidades',
        skillsExpertise: 'Habilidades y Experiencia',
        competencies: 'Competencias y Habilidades',
        languages: 'Idiomas',
        contact: 'Contacto',
        location: 'Ubicación',
        email: 'Email',
        phone: 'Teléfono',
        present: 'Presente',
        ongoing: 'Actual',
        now: 'Ahora',
        contactMe: 'Contáctame',
        scheduleMeeting: 'Agendar Reunión',
        downloadCV: 'Descargar CV',
        sendMessage: 'Enviar Mensaje',
        certifications: 'Certificaciones',
        portfolio: 'Portafolio',
        recommendations: 'Recomendaciones'
    },
    // Secciones del Editor de Perfil
    profileEditor: {
        aiImprovement: {
            title: 'Dale el toque final con IA',
            almostDone: '¡Estás a un paso de terminar!',
            experienceTab: 'Experiencia',
            educationTab: 'Educación',
        },
        aiSkills: {
            title: 'Sugerencias de Habilidades con IA',
            suggested: 'Habilidades Sugeridas',
        },
        qualityScore: {
            title: 'Calidad del Perfil',
            workExperience: 'Experiencia laboral',
            education: 'Educación',
            languages: 'Idiomas',
            perfect: '¡Perfil perfecto! Has completado todos los requisitos de calidad',
            almostPerfect: '¡Perfil casi perfecto! Solo pequeños detalles para alcanzar el 100%',
            good: 'Buen perfil, pero aún puedes mejorarlo siguiendo las sugerencias',
            needsAttention: 'Tu perfil necesita atención en varias áreas importantes',
            needsImprovement: 'Tu perfil necesita mejoras significativas para destacar',
            completed100: '¡Perfil completado al 100%!',
            readyToShine: 'Tu CV profesional está listo para destacar',
            excellentWork: 'Excelente trabajo. Tu perfil cumple con todos los estándares de calidad y está optimizado para captar la atención de reclutadores.',
            nextSteps: 'Siguientes pasos recomendados:',
            exportShare: 'Exporta y comparte tu CV con empresas',
            reviewAnalytics: 'Revisa las analíticas de visitas a tu perfil',
            keepUpdated: 'Mantén tu información actualizada regularmente',
            aiRecommendations: 'Recomendaciones IA',
            suggestion: 'sugerencia',
            suggestions: 'sugerencias',
            labels: {
                excellent: 'Excelente',
                good: 'Bueno',
                regular: 'Regular',
                needsImprovements: 'Necesita mejoras',
            },
            priority: {
                high: 'Alta',
                medium: 'Media',
                low: 'Baja',
            }
        },
        deleteModal: {
            deleteEducation: 'Eliminar Educación',
            deleteExperience: 'Eliminar Experiencia',
        },
        identity: {
            contactInfo: 'Información de Contacto',
        },
        languages: {
            title: 'Idiomas',
            nativeLanguages: 'Idiomas Nativos',
            otherLanguages: 'Otros Idiomas',
        },
        finalization: {
            congratulations: '¡Felicidades!',
            completedProfile: 'Has completado tu perfil profesional',
            selectTemplate: 'Selecciona tu plantilla de CV',
            chooseDesign: 'Elige el diseño que mejor represente tu estilo profesional',
            cvAvailableAt: 'Tu CV está disponible en:',
            urlChangeWarning: (daysRemaining: number, date: string) =>
                `⚠️ Podrás cambiar tu URL en ${daysRemaining} días (${date})`,
            saving: 'Guardando...',
            completeProfile: 'Completar Perfil',
            templates: {
                modern: {
                    name: 'Moderno',
                    description: 'Diseño limpio y profesional con toques modernos'
                },
                classic: {
                    name: 'Clásico',
                    description: 'Formato tradicional para empresas corporativas'
                },
                creative: {
                    name: 'Creativo',
                    description: 'Ideal para diseñadores e industrias creativas'
                }
            },
            errors: {
                urlTooShort: 'La URL debe tener al menos 3 caracteres',
                urlAlreadyInUse: 'Esta URL ya está en uso. Por favor elige otra.'
            }
        }
    },
    // Pasos del Wizard de Perfil
    wizardSteps: {
        identity: 'Identidad',
        experience: 'Experiencia',
        education: 'Educación',
        skills: 'Habilidades',
        languages: 'Idiomas',
        portfolio: 'Portafolio',
        preferences: 'Preferencias',
        finalize: 'Finalizar'
    },
    // Mensajes de validación del wizard
    wizardValidation: {
        fullName: 'Nombre completo',
        email: 'Email',
        headline: 'Título profesional',
        summary: 'Resumen',
        photo: 'Foto de perfil',
        atLeastOneExperience: 'Al menos 1 experiencia laboral',
        atLeastThreeSkills: 'Al menos 3 habilidades',
        youHave: 'tienes',
        visitPreferences: 'Debes visitar la sección de Preferencias',
    },
    // Mensajes de Error de Validación
    validationErrors: {
        title: 'Errores de validación',
        identity: {
            fullNameRequired: 'El nombre completo es obligatorio (mínimo 2 caracteres)',
            headlineRequired: 'El título profesional es obligatorio (mínimo 5 caracteres)',
            summaryRequired: 'El resumen "Acerca de mí" es obligatorio',
            summaryMax: 'Máximo 500 caracteres',
            countryRequired: 'Debes seleccionar un país'
        },
        experience: {
            positionRequired: 'El puesto es obligatorio',
            companyRequired: 'El nombre de la empresa es obligatorio',
            startDateRequired: 'La fecha de inicio es obligatoria'
        },
        education: {
            institutionRequired: 'El nombre de la institución es obligatorio',
            degreeRequired: 'El título es obligatorio',
            fieldRequired: 'El campo de estudio es obligatorio',
            startDateRequired: 'La fecha de inicio es obligatoria',
            endDateRequired: 'La fecha de fin es obligatoria. Si aún estudias aquí, marca "Actualmente estudio aquí"',
            endDateBeforeStart: 'La fecha de fin no puede ser anterior a la fecha de inicio',
            dateRangeTooLong: 'El rango de fechas no puede ser mayor a 50 años',
            yearInvalid: 'El año debe tener 4 dígitos válidos (YYYY)',
            yearTooOld: 'La fecha no puede ser anterior a 1950',
            yearFuture: 'La fecha no puede ser posterior al año actual',
            monthInvalid: 'El mes debe estar entre 01 y 12',
            dateFormatInvalid: 'Formato inválido. Use YYYY-MM (ej: 2024-03)',
            gpaLabel: 'GPA / Nota Media (Opcional)',
            gpaPlaceholder: 'GPA en escala de 0.0 a 4.0 (ej: 3.85)',
            gpaScale4: 'Escala 4.0',
            gpaScale5: 'Escala 5.0',
            gpaScale10: 'Escala 10.0',
            gpaScale100: 'Escala 100.0',
            gpaMaxError: 'El valor máximo para esta escala es'
        },
        skills: {
            nameRequired: 'El nombre de la habilidad es obligatorio',
            yearsInvalid: 'Los años de experiencia deben ser un número válido',
            yearsMax: 'Los años de experiencia no pueden exceder 50',
            percentageInvalid: 'El porcentaje debe ser un número válido',
            percentageMax: 'El porcentaje no puede exceder 100'
        },
        languages: {
            nameRequired: 'El nombre del idioma es obligatorio'
        },
        portfolio: {
            titleRequired: 'El título es obligatorio',
            urlRequired: 'El enlace es obligatorio',
            urlInvalid: 'Debe ser una URL válida (ejemplo: https://ejemplo.com)'
        },
        certification: {
            issuerRequired: 'El emisor es obligatorio',
            issueDateRequired: 'La fecha de emisión es obligatoria',
            titleRequired: 'El nombre de la certificación es obligatorio'
        },
        collaboration: {
            organizationRequired: 'El nombre de la organización es obligatorio',
            roleRequired: 'Tu rol es obligatorio',
            startDateRequired: 'La fecha de inicio es obligatoria',
            titleRequired: 'El título de la colaboración es obligatorio'
        },
        preferences: {
            salaryInvalid: 'El valor debe ser un número válido',
            salaryMax: 'El salario no puede exceder 1,000,000'
        }
    },
    // Traducciones del Panel Empresarial
    company: {
        verifying: 'Verificando acceso empresarial...',
        pendingApproval: {
            title: 'Solicitud en Revisión',
            message: 'Tu registro empresarial está siendo revisado por nuestro equipo. Te notificaremos por email una vez que tu solicitud haya sido procesada.',
            timeframe: 'Las revisiones suelen tomar 1-2 días hábiles.'
        },
        rejected: {
            title: 'Solicitud No Aprobada',
            message: 'Lamentablemente, tu registro empresarial no fue aprobado.',
            reasonTitle: 'Motivo:',
            contact: 'Si crees que esto es un error o deseas proporcionar información adicional, por favor contacta a nuestro equipo de soporte.'
        },
        suspended: {
            title: 'Cuenta Suspendida',
            message: 'Tu cuenta empresarial ha sido temporalmente suspendida.',
            contact: 'Por favor contacta a soporte para resolver este problema.'
        },
        registration: {
            title: 'Registra Tu Empresa',
            subtitle: 'Verifica tu empresa y comienza a encontrar talento de primer nivel',
            basicInfo: 'Información Básica',
            address: 'Dirección de la Empresa',
            verification: 'Documentos de Verificación',
            companyName: 'Nombre de la Empresa',
            companyNamePlaceholder: 'ej., Corporación Acme',
            legalName: 'Nombre Legal',
            legalNamePlaceholder: 'Nombre oficial registrado de la empresa',
            taxId: 'CIF/NIF',
            taxIdPlaceholder: 'ej., A12345678',
            companyEmail: 'Email Corporativo',
            companyEmailPlaceholder: 'contacto@empresa.com',
            companyPhone: 'Teléfono',
            companyPhonePlaceholder: '+34 912 345 678',
            website: 'Sitio Web',
            websitePlaceholder: 'https://empresa.com',
            street: 'Dirección',
            city: 'Ciudad',
            state: 'Provincia/Estado',
            country: 'País',
            postalCode: 'Código Postal',
            industry: 'Industria',
            companySize: 'Tamaño de la Empresa',
            companySizeOptions: {
                '1-10': '1-10 empleados',
                '11-50': '11-50 empleados',
                '51-200': '51-200 empleados',
                '201-500': '201-500 empleados',
                '501-1000': '501-1000 empleados',
                '1000+': 'Más de 1000 empleados'
            },
            description: 'Descripción de la Empresa',
            descriptionPlaceholder: 'Cuéntanos sobre tu empresa...',
            logo: 'Logo de la Empresa',
            logoUpload: 'Subir Logo',
            taxDocument: 'Documento Fiscal (CIF/NIF)',
            taxDocumentHelp: 'Sube una copia escaneada de tu documento de identificación fiscal',
            verificationDocument: 'Licencia o Registro Comercial',
            verificationDocumentHelp: 'Sube tu certificado de registro empresarial',
            uploadButton: 'Elegir Archivo',
            dragDrop: 'o arrastra y suelta',
            fileTypes: 'PNG, JPG, PDF hasta 10MB',
            submit: 'Enviar Solicitud',
            submitting: 'Enviando...',
            success: '¡Registro enviado exitosamente!',
            successMessage: 'Tu solicitud está en revisión. Te notificaremos por email.',
            requiredField: 'Este campo es obligatorio',
            requiredFieldsNote: 'Campos obligatorios',
            invalidEmail: 'Dirección de email inválida',
            invalidUrl: 'Formato de URL inválido',
            fileTooLarge: 'El tamaño del archivo debe ser menor a 10MB',
            invalidFileType: 'Tipo de archivo inválido. Solo se permiten PNG, JPG y PDF.',
            loginRequired: 'Debes iniciar sesión para registrar una empresa',
            fixErrors: 'Por favor corrige los errores de validación antes de enviar'
        },
        dashboard: {
            title: 'Panel Empresarial',
            welcome: 'Bienvenido de nuevo',
            welcomeMessage: 'Gestiona tu búsqueda de talento y esfuerzos de reclutamiento',
            creditsRemaining: 'Créditos Restantes',
            buyMore: 'Comprar más',
            profilesViewed: 'Perfiles Vistos',
            contactsSent: 'Contactos Enviados',
            savedSearches: 'Búsquedas Guardadas',
            viewAll: 'Ver todo',
            quickActions: 'Acciones Rápidas',
            browseByCategory: 'Explorar por Categoría',
            browseByCategoryDesc: 'Explora talento organizado por categorías profesionales',
            searchTalent: 'Buscar Talento',
            searchTalentDesc: 'Encuentra profesionales con filtros avanzados',
            buyCredits: 'Comprar Créditos',
            buyCreditsDesc: 'Compra créditos para desbloquear perfiles',
            savedSearchesDesc: 'Gestiona tus búsquedas guardadas y alertas',
            exports: 'Exportaciones',
            exportsDesc: 'Ver y descargar exportaciones de perfiles',
            management: 'Gestión',
            teamMembers: 'Miembros del Equipo',
            settings: 'Configuración',
            analytics: 'Analíticas',
            jobPostings: 'Gestionar Vacantes',
            manageJobPostings: 'Gestiona tus vacantes y aplicaciones',
            viewAnalytics: 'Rastrea tu desempeño de reclutamiento y actividad',
            companySettings: 'Configura tu perfil y preferencias de empresa',
            manageTeam: 'Gestiona miembros del equipo y permisos',
            postJob: 'Publicar Vacante',
            accountInfo: 'Información de la Cuenta',
            companyName: 'Nombre de la Empresa',
            email: 'Email',
            status: 'Estado',
            active: 'Activa',
            recentActivity: 'Actividad Reciente',
            noActivity: 'Sin actividad reciente',
            last30Days: 'Últimos 30 días',
            activityTrend: 'Tendencia de Actividad (30 Días)',
            profileViews: 'Vistas de Perfil',
            contacts: 'Contactos',
            creditBalance: 'Saldo de Créditos',
            balance: 'Saldo',
            noDataYet: 'Sin datos de transacciones aún'
        },
        search: {
            title: 'Buscar Talento',
            subtitle: 'Encuentra los candidatos perfectos para tu empresa',
            availableCredits: 'Créditos Disponibles',
            resultsFound: 'Resultados Encontrados',
            generalSearch: 'Búsqueda General',
            searchPlaceholder: 'Buscar por nombre, email, título o descripción...',
            keywordsPlaceholder: 'Palabras clave, habilidades, títulos de trabajo...',
            filters: 'Filtros',
            search: 'Buscar',
            viewAll: 'Ver todas las categorías',
            niche: 'Nicho',
            allNiches: 'Todos los nichos',
            profession: 'Profesión',
            allProfessions: 'Todas las profesiones',
            specialization: 'Especialización',
            allSpecializations: 'Todas las especializaciones',
            location: 'Ubicación',
            locationPlaceholder: 'Ciudad, país...',
            jobTitle: 'Título del Trabajo',
            jobTitlePlaceholder: 'ej., Ingeniero de Software',
            experienceLevel: 'Nivel de Experiencia',
            entry: 'Principiante (0-2 años)',
            mid: 'Intermedio (2-5 años)',
            senior: 'Senior (5-10 años)',
            expert: 'Experto (10+ años)',
            educationLevel: 'Nivel de Educación',
            bachelor: 'Licenciatura',
            master: 'Maestría',
            phd: 'Doctorado',
            diploma: 'Diploma',
            availability: 'Disponibilidad',
            allAvailability: 'Todas',
            immediate: 'Inmediata',
            twoWeeks: '2 semanas',
            oneMonth: '1 mes',
            negotiable: 'Negociable',
            workMode: 'Modalidad de Trabajo',
            allWorkModes: 'Todas',
            remoteOnly: 'Solo remoto',
            hybrid: 'Híbrido',
            onSite: 'Presencial',
            flexible: 'Flexible',
            skills: 'Habilidades',
            skillsPlaceholder: 'Añadir una habilidad...',
            languages: 'Idiomas',
            languagesPlaceholder: 'Añadir un idioma...',
            clearFilters: 'Limpiar todos los filtros',
            saveSearch: 'Guardar Búsqueda',
            searchSaved: '¡Búsqueda guardada exitosamente!',
            saveFailed: 'Error al guardar la búsqueda',
            searchError: 'Error al buscar perfiles',
            showingResults: 'Mostrando',
            results: 'resultados',
            searching: 'Buscando...',
            noResults: 'No se encontraron resultados',
            tryDifferent: 'Intenta ajustar tus filtros de búsqueda',
            viewProfile: 'Ver Perfil'
        },
        profile: {
            unlock: 'Desbloquear Perfil',
            download: 'Descargar CV',
            downloadAgain: 'Descargar de Nuevo (Gratis)',
            contact: 'Contactar',
            contactInfo: 'Información de Contacto',
            unlockToView: 'Desbloquear para ver',
            about: 'Acerca de',
            skills: 'Habilidades',
            experience: 'Experiencia Laboral',
            education: 'Educación',
            languages: 'Idiomas',
            unlockProfile: 'Desbloquear Perfil',
            unlockConfirm: '¿Deseas desbloquear este perfil?',
            confirmUnlock: 'Desbloquear',
            sendMessage: 'Enviar Mensaje',
            messagePlaceholder: 'Escribe tu mensaje...',
            messageRequired: 'Por favor ingresa un mensaje',
            messageSent: '¡Mensaje enviado exitosamente!',
            messageError: 'Error al enviar el mensaje',
            insufficientCredits: 'Créditos insuficientes. Por favor compra más créditos.',
            fetchError: 'Error al cargar el perfil',
            unlockError: 'Error al desbloquear el perfil',
            unlockSuccess: '¡Perfil desbloqueado exitosamente!',
            downloadError: 'Error al descargar el CV',
            downloadSuccess: '¡CV descargado exitosamente!',
            downloadStarted: 'Descarga de CV iniciada',
        },
        messages: {
            title: 'Mensajes',
            subtitle: 'Comunícate con el talento',
            searchPlaceholder: 'Buscar conversaciones...',
            noConversations: 'No hay conversaciones aún',
            noSearchResults: 'No se encontraron conversaciones',
            selectConversation: 'Selecciona una conversación',
            selectConversationDesc: 'Elige una conversación de la lista para comenzar a enviar mensajes',
            viewProfile: 'Ver Perfil',
            typePlaceholder: 'Escribe tu mensaje...',
            messageSent: 'Mensaje enviado exitosamente',
            sendError: 'Error al enviar el mensaje',
            loadError: 'Error al cargar mensajes',
            newMessage: 'Nuevo Mensaje',
            startConversation: 'Iniciar Conversación',
            subject: 'Asunto',
            subjectPlaceholder: 'ej., Oportunidad Laboral en...',
            selectProfile: 'Seleccionar Perfil',
            compose: 'Redactar',
            conversationStarted: 'Conversación iniciada exitosamente',
            conversationError: 'Error al iniciar la conversación',
            creditsRequired: 'Se requieren {credits} créditos para iniciar esta conversación',
            notFound: 'Perfil no encontrado'
        },
        credits: {
            title: 'Gestión de Créditos',
            subtitle: 'Compra y gestiona tus créditos',
            currentBalance: 'Saldo Actual',
            availableCredits: 'créditos disponibles',
            credits: 'créditos',
            profilesUnlocked: 'Perfiles Desbloqueados',
            cvsDownloaded: 'CVs Descargados',
            totalSpent: 'Total Gastado',
            buyCredits: 'Comprar Créditos',
            packages: {
                starter: 'Pack Inicial',
                professional: 'Pack Profesional',
                business: 'Pack Empresarial',
                enterprise: 'Pack Corporativo'
            },
            popular: 'POPULAR',
            save: 'AHORRA',
            perCredit: 'por crédito',
            noExpiry: 'Los créditos nunca expiran',
            instantActivation: 'Activación instantánea',
            purchase: 'Comprar',
            processing: 'Procesando...',
            purchaseSuccess: '¡Créditos comprados exitosamente!',
            purchaseError: 'Error al comprar créditos',
            transactionHistory: 'Historial de Transacciones',
            noTransactions: 'Aún no hay transacciones',
            date: 'Fecha',
            type: 'Tipo',
            description: 'Descripción',
            usage: 'Uso',
            howItWorks: 'Cómo Funcionan los Créditos',
            info1: 'Desbloquear perfil completo: 5 créditos',
            info2: 'Descargar CV: 3 créditos (primera vez), gratis después',
            info3: 'Los créditos nunca expiran',
            info4: 'Contactar candidatos es gratis'
        },
        savedSearches: {
            title: 'Búsquedas Guardadas',
            subtitle: 'Gestiona tus búsquedas guardadas y alertas automáticas',
            newSearch: 'Nueva Búsqueda',
            alertsInfo: 'Alertas Automáticas',
            alertsDescription: 'Habilita alertas en tus búsquedas guardadas para recibir notificaciones por email cuando nuevos perfiles coincidan con tus criterios.',
            noSearches: 'No hay búsquedas guardadas',
            createFirst: 'Crea tu primera búsqueda guardada para comenzar',
            goToSearch: 'Ir a Búsqueda',
            alertsActive: 'Alertas Activas',
            created: 'Creada',
            frequency: 'Frecuencia',
            lastAlert: 'Última alerta',
            run: 'Ejecutar Búsqueda',
            enableAlerts: 'Habilitar Alertas',
            disableAlerts: 'Deshabilitar Alertas',
            alertsEnabled: 'Alertas habilitadas',
            alertsDisabled: 'Alertas deshabilitadas',
            toggleError: 'Error al actualizar alertas',
            editSearch: 'Editar Búsqueda',
            searchName: 'Nombre de la Búsqueda',
            alertFrequency: 'Frecuencia de Alertas',
            daily: 'Diaria',
            weekly: 'Semanal',
            monthly: 'Mensual',
            updateSuccess: 'Búsqueda actualizada exitosamente',
            updateError: 'Error al actualizar la búsqueda',
            deleteConfirm: '¿Estás seguro de que deseas eliminar esta búsqueda?',
            deleteSuccess: 'Búsqueda eliminada exitosamente',
            deleteError: 'Error al eliminar la búsqueda',
            noFilters: 'Sin filtros específicos'
        },
        team: {
            title: 'Miembros del Equipo',
            subtitle: 'Gestiona los miembros de tu equipo y sus roles',
            addMember: 'Agregar Miembro',
            totalMembers: 'Total de Miembros',
            admins: 'Administradores',
            activeMembers: 'Miembros Activos',
            membersList: 'Lista de Miembros',
            noMembers: 'Aún no hay miembros del equipo',
            you: 'Tú',
            joined: 'Se unió',
            pending: 'Invitación pendiente',
            removeMember: 'Eliminar miembro',
            roleDescriptions: 'Descripciones de Roles',
            ownerRole: 'Propietario',
            ownerDesc: 'Acceso completo a todas las características incluyendo facturación y gestión de equipo',
            adminRole: 'Administrador',
            adminDesc: 'Puede gestionar miembros del equipo y acceder a todas las funciones de búsqueda',
            memberRole: 'Miembro',
            memberDesc: 'Puede buscar talento y contactar candidatos',
            viewerRole: 'Observador',
            viewerDesc: 'Acceso de solo lectura a resultados de búsqueda y analíticas',
            inviteNewMember: 'Invitar Nuevo Miembro',
            emailAddress: 'Dirección de Email',
            role: 'Rol',
            sendInvite: 'Enviar Invitación',
            inviting: 'Invitando...',
            emailRequired: 'El email es requerido',
            userNotFound: 'Usuario no encontrado. Primero debe crear una cuenta.',
            alreadyMember: 'El usuario ya es miembro del equipo',
            inviteSuccess: '¡Miembro agregado exitosamente!',
            inviteError: 'Error al agregar miembro',
            cannotRemoveOwner: 'No se puede eliminar al propietario de la empresa',
            confirmRemove: '¿Estás seguro de que deseas eliminar a este miembro del equipo?',
            removeSuccess: 'Miembro eliminado exitosamente',
            removeError: 'Error al eliminar miembro',
            fetchError: 'Error al cargar los miembros del equipo'
        },
        settings: {
            title: 'Configuración de Empresa',
            subtitle: 'Gestiona la información y preferencias de tu empresa',
            verificationStatus: 'Estado de Verificación',
            approved: 'Aprobada',
            pending: 'Pendiente de Revisión',
            rejected: 'Rechazada',
            verifiedDesc: 'Tu empresa está verificada y puede acceder a todas las funciones',
            pendingDesc: 'Tu registro de empresa está en revisión',
            rejectedDesc: 'Tu registro de empresa fue rechazado',
            rejectionReason: 'Razón del Rechazo:',
            basicInfo: 'Información Básica',
            companyName: 'Nombre de la Empresa',
            email: 'Email',
            phone: 'Teléfono',
            website: 'Sitio Web',
            industry: 'Industria',
            companySize: 'Tamaño de la Empresa',
            employees: 'empleados',
            description: 'Descripción',
            address: 'Dirección',
            street: 'Calle',
            city: 'Ciudad',
            state: 'Estado/Provincia',
            country: 'País',
            postal: 'Código Postal',
            saveChanges: 'Guardar Cambios',
            saving: 'Guardando...',
            save: 'Guardar Configuración',
            saved: '¡Configuración guardada exitosamente!',
            saveSuccess: '¡Configuración guardada exitosamente!',
            saveError: 'Error al guardar la configuración',
            loadError: 'Error al cargar la configuración',
            loading: 'Cargando configuración...',
            noPermission: 'No tienes permiso para editar la configuración',
            noEditPermission: 'Solo los propietarios y administradores pueden editar la configuración.',
            tabs: {
                notifications: 'Notificaciones',
                privacy: 'Privacidad',
                search: 'Búsqueda',
                billing: 'Facturación'
            },
            notifications: {
                title: 'Preferencias de Notificaciones',
                description: 'Configura cómo y cuándo quieres recibir notificaciones',
                emailNotifications: 'Notificaciones por Email',
                emailNotificationsDesc: 'Recibe actualizaciones importantes por correo electrónico',
                newMatches: 'Alertas de Nuevos Matches',
                newMatchesDesc: 'Recibe notificaciones cuando haya nuevos candidatos que coincidan con tus búsquedas',
                creditLow: 'Alerta de Créditos Bajos',
                creditLowDesc: 'Recibe una notificación cuando tus créditos estén por agotarse',
                weeklySummary: 'Resumen Semanal',
                weeklySummaryDesc: 'Recibe un resumen semanal de tu actividad de reclutamiento'
            },
            privacy: {
                title: 'Configuración de Privacidad',
                description: 'Controla la visibilidad de tu empresa y las opciones de contacto',
                profileVisibility: 'Visibilidad del Perfil',
                public: 'Público',
                publicDesc: 'Visible para todos los usuarios',
                verifiedOnly: 'Solo Verificados',
                verifiedOnlyDesc: 'Solo visible para usuarios verificados',
                private: 'Privado',
                privateDesc: 'Solo visible para candidatos contactados',
                allowMessages: 'Permitir Mensajes Directos',
                allowMessagesDesc: 'Permite que los candidatos te envíen mensajes directamente'
            },
            searchPreferences: {
                title: 'Preferencias de Búsqueda',
                description: 'Personaliza tu experiencia de búsqueda de talento',
                autoSave: 'Guardar Búsquedas Automáticamente',
                autoSaveDesc: 'Guarda automáticamente tus búsquedas para acceso rápido',
                matchThreshold: 'Umbral de Coincidencia',
                matchThresholdDesc: 'Porcentaje mínimo de coincidencia para mostrar candidatos en los resultados'
            },
            billing: {
                title: 'Configuración de Facturación',
                description: 'Gestiona la recarga automática y preferencias de pago',
                autoRecharge: 'Recarga Automática',
                autoRechargeDesc: 'Recarga automáticamente cuando los créditos estén bajos',
                rechargeThreshold: 'Recargar cuando los créditos caigan a',
                rechargeAmount: 'Cantidad a recargar',
                credits: 'créditos'
            }
        },
        analytics: {
            title: 'Analíticas',
            subtitle: 'Rastrea tu desempeño de reclutamiento y actividad',
            week: 'Semana',
            month: 'Mes',
            year: 'Año',
            today: 'Hoy',
            thisWeek: 'esta semana',
            thisMonth: 'este mes',
            profileViews: 'Vistas de Perfil',
            contactsSent: 'Contactos Enviados',
            creditsUsed: 'Créditos Usados',
            remainingCredits: 'Créditos Restantes',
            available: 'Disponibles',
            activityByDay: 'Actividad por Día de la Semana',
            views: 'Vistas',
            contacts: 'Contactos',
            creditUsage: 'Desglose de Uso de Créditos',
            noData: 'Sin datos de uso de créditos aún',
            monthlySummary: 'Resumen Mensual',
            totalProfileViews: 'Total de Vistas de Perfil',
            totalContacts: 'Total de Contactos Enviados',
            totalCreditsUsed: 'Total de Créditos Usados'
        },
        exports: {
            title: 'Historial de Exportaciones',
            subtitle: 'Ver y descargar perfiles exportados anteriormente',
            totalExports: 'Total de Exportaciones',
            thisMonth: 'Este Mes',
            uniqueProfiles: 'Perfiles Únicos',
            searchPlaceholder: 'Buscar por nombre o email...',
            profile: 'Perfil',
            email: 'Email',
            type: 'Tipo',
            date: 'Fecha de Exportación',
            actions: 'Acciones',
            noExports: 'No se encontraron exportaciones',
            noMatches: 'No hay exportaciones que coincidan con tu búsqueda',
            startExporting: 'Comienza a descargar perfiles para construir tu historial de exportaciones',
            searchTalent: 'Buscar Talento',
            showing: 'Mostrando',
            exports: 'exportaciones',
            downloadStarted: 'Descargando CV para',
            downloadError: 'Error al descargar el archivo'
        },
        jobSearch: {
            searchPlaceholder: 'Título, palabra clave o empresa...',
            locationPlaceholder: 'Ciudad, país o \'remoto\'...',
            limitedAccessMessage: 'Búsqueda y filtros limitados · ',
            createAccount: 'Crea tu cuenta gratis',
            fullAccessMessage: ' para acceder a todas las funciones',
            filters: {
                all: 'Todos',
                allModes: 'Todas',
                allLevels: 'Todos',
                employmentType: {
                    label: 'Tipo de empleo',
                    fullTime: 'Tiempo Completo',
                    partTime: 'Medio Tiempo',
                    contract: 'Contrato',
                    temporary: 'Temporal',
                    internship: 'Pasantía',
                    freelance: 'Freelance'
                },
                workMode: {
                    label: 'Modalidad',
                    remote: 'Remoto',
                    onsite: 'Presencial',
                    hybrid: 'Híbrido'
                },
                experienceLevel: {
                    label: 'Nivel de experiencia',
                    entry: 'Sin experiencia',
                    junior: 'Junior',
                    mid: 'Semi-senior',
                    senior: 'Senior',
                    lead: 'Lead',
                    executive: 'Ejecutivo'
                }
            },
            loading: 'Cargando oportunidades...',
            searching: 'Buscando vacantes...',
            resultsCount: {
                featured: 'destacadas',
                found: 'encontradas',
                singular: 'vacante',
                plural: 'vacantes'
            },
            noJobsFound: 'No se encontraron vacantes',
            tryDifferentFilters: 'Intenta ajustar tus filtros de búsqueda',
            limitedView: 'Vista limitada',
            registerToSeeAll: 'Regístrate para ver todas',
            salary: 'Salario',
            viewDetails: 'Ver detalles',
            applyNow: 'Aplicar ahora',
            // Additional translations
            errorLoading: 'Error al cargar las vacantes. Por favor, intenta de nuevo.',
            advancedFilters: 'Filtros Avanzados',
            clearFilters: 'Limpiar filtros',
            remoteTag: 'Remoto',
            salaryFrom: 'Desde',
            salaryUpTo: 'Hasta',
            moreSkills: 'más',
            // CTA section for non-authenticated users
            cta: {
                title: '¿Quieres ver todas las ofertas?',
                subtitle: 'Crea tu perfil gratuito y accede a:',
                personalizedOffers: 'Ofertas Personalizadas',
                personalizedOffersDesc: 'Basadas en tu perfil y habilidades',
                matchScore: 'Match Score',
                matchScoreDesc: 'Ve tu compatibilidad con cada oferta',
                saveAndApply: 'Guarda y Aplica',
                saveAndApplyDesc: 'Administra tus aplicaciones en un solo lugar',
                createAccountFree: 'Crear Cuenta Gratis',
                alreadyHaveAccount: 'Ya tengo cuenta',
                freeForever: 'Gratis para siempre',
                noCreditCard: 'Sin tarjeta de crédito',
                setupTime: 'Configuración en 2 minutos'
            },
            // Hero section
            hero: {
                title: 'Encuentra tu próximo',
                titleHighlight: 'empleo',
                subtitleAuthenticated: 'Miles de oportunidades te esperan',
                subtitleGuest: 'Crea tu perfil y accede a miles de ofertas personalizadas',
                signUpFree: 'Registrarse Gratis',
                signIn: 'Iniciar Sesión'
            }
        },
        jobDetail: {
            backToSearch: 'Volver a búsqueda',
            applyNow: 'Aplicar Ahora',
            alreadyApplied: 'Ya aplicaste',
            daysRemaining: 'día restante',
            daysRemainingPlural: 'días restantes',
            salary: 'Salario',
            department: 'Departamento',
            published: 'Publicado',
            jobDescription: 'Descripción del Puesto',
            responsibilities: 'Responsabilidades',
            requirements: 'Requisitos',
            niceToHave: 'Deseable',
            benefits: 'Beneficios',
            requiredSkills: 'Habilidades Requeridas',
            optionalSkills: 'Habilidades Opcionales',
            aboutCompany: 'Sobre la Empresa',
            website: 'Sitio Web',
            applicationInstructions: 'Instrucciones de Aplicación',
            remote: 'Remoto',
            employmentType: {
                fullTime: 'Tiempo Completo',
                partTime: 'Medio Tiempo',
                contract: 'Contrato',
                temporary: 'Temporal',
                internship: 'Pasantía',
                freelance: 'Freelance'
            },
            workMode: {
                remote: 'Remoto',
                onsite: 'Presencial',
                hybrid: 'Híbrido'
            },
            experienceLevel: {
                entry: 'Sin experiencia',
                junior: 'Junior',
                mid: 'Semi-senior',
                senior: 'Senior',
                lead: 'Lead',
                executive: 'Ejecutivo'
            },
            salaryPeriod: {
                hourly: '/hora',
                monthly: '/mes',
                yearly: '/año'
            },
            salaryFrom: 'Desde',
            salaryUpTo: 'Hasta',
            modal: {
                applyTo: 'Aplicar a',
                coverLetter: 'Carta de Presentación',
                coverLetterPlaceholder: 'Cuéntanos por qué eres el candidato ideal para esta posición...',
                cancel: 'Cancelar',
                sending: 'Enviando...',
                submitApplication: 'Enviar Aplicación'
            },
            yesNo: {
                yes: 'Sí',
                no: 'No'
            },
            errors: {
                loadingJob: 'Error al cargar la vacante',
                loginRequired: 'Debes iniciar sesión para aplicar',
                profileRequired: 'Debes tener un perfil completo para aplicar',
                answerRequired: 'Por favor responde todas las preguntas requeridas',
                applicationSuccess: '¡Aplicación enviada con éxito!',
                alreadyApplied: 'Ya has aplicado a esta vacante',
                jobNotAvailable: 'Esta vacante ya no está disponible',
                applicationError: 'Error al enviar la aplicación'
            }
        },
        talentCategories: {
            pageTitle: 'Búsqueda de Talentos por Categorías - Empresa',
            pageDescription: 'Explora talentos organizados por categorías profesionales',
            backToDashboard: 'Volver al Panel Empresarial',
            title: 'Búsqueda de Talentos por Categorías',
            subtitle: 'Explora profesionales organizados por nicho, profesión y especialización',
            viewTalents: 'Ver talentos',
            howItWorksTitle: '¿Cómo funciona la búsqueda por categorías?',
            howItWorksDescription: 'Los talentos se organizan automáticamente en categorías según las palabras clave encontradas en sus títulos profesionales y descripciones. Cada categoría agrupa perfiles relacionados para facilitar la búsqueda.',
            nicheLabel: 'Nicho',
            nicheDescription: 'Extraído del campo "headline" (descripción profesional)',
            professionLabel: 'Profesión',
            professionDescription: 'Extraído del campo "title" (título profesional)',
            specializationLabel: 'Especialización',
            specializationDescription: 'Búsqueda combinada en ambos campos'
        }
    }
};