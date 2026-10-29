/**
 * Título SEO, descripción y H1 de las páginas estáticas, escritos a mano (hallazgo 11 de la
 * auditoría del 25/10/2026): título completo de 50 a 60 caracteres con la marca, descripción de
 * 120 a 155 que termina en frase completa y sin «...».
 *
 * seo/static-meta.mjs conserva el título y la descripción tal como los pinta la SPA (PageSEO añade
 * " - YourCVPassport" y recorta a 160); aquí van los de la copia estática. Si una ruta no aparece
 * en STATIC_SEO se usa el texto de static-meta.mjs ajustado por seo/seo-text.mjs.
 * El título de la SPA no cambia mientras PageSEO/las traducciones no adopten estos valores:
 * al hidratar, Helmet pone el suyo.
 *
 * Clave: ruta de la página. Los alias (/producto, /empresas...) heredan la de su principal.
 * Un test (tests/qa/seo-estatico.spec.ts) comprueba los rangos de longitud de todas las entradas.
 */

/** @type {Record<string, { title?: string, description?: string, h1?: string }>} */
export const STATIC_SEO = {
  "/producto/ats": {
    title: "Plantillas de CV Optimizadas para ATS - YourCVPassport",
    description: "Exporta tu CV optimizado para sistemas ATS como Greenhouse, Lever y Workday, con formato PDF compatible y plantillas profesionales de YourCVPassport.",
    h1: "Plantillas de CV Optimizadas para ATS",
  },
  "/product/ats": {
    title: "ATS-Optimized CV Templates and Export - YourCVPassport",
    description: "Export your CV optimized for ATS systems like Greenhouse, Lever and Workday, with a compatible PDF format and professional templates from YourCVPassport.",
    h1: "ATS-Optimized CV Templates and Export",
  },
  "/producto/dominio": {
    title: "Dominio Personalizado para tu CV Online - YourCVPassport",
    description: "Crea tu marca personal con un dominio memorable: yourcvpassport.com/tu-nombre en lugar de URLs genéricas. Destaca ante los reclutadores.",
    h1: "Dominio Personalizado para tu CV Online",
  },
  "/product/domain": {
    title: "Custom Domain for Your Online CV Profile - YourCVPassport",
    description: "Build your personal brand with a memorable domain: yourcvpassport.com/your-name instead of generic URLs. Stand out to recruiters.",
    h1: "Custom Domain for Your Online CV Profile",
  },
  "/producto/analiticas": {
    title: "Analítica de tu Perfil Profesional - YourCVPassport",
    description: "Descubre quién visita tu CV profesional con analíticas detalladas: métricas de interés, fuentes de tráfico y distribución geográfica de las visitas.",
    h1: "Analítica de tu Perfil Profesional",
  },
  "/product/analytics": {
    title: "Professional Profile Analytics Tools - YourCVPassport",
    description: "Discover who visits your professional CV with detailed analytics: engagement metrics, traffic sources and the geographic distribution of visits.",
    h1: "Professional Profile Analytics Tools",
  },
  "/empresas/busqueda": {
    title: "Búsqueda Avanzada de Talento Verificado - YourCVPassport",
    description: "Encuentra candidatos ideales con filtros avanzados por habilidades, experiencia y ubicación. Perfiles verificados y contacto directo con el candidato.",
    h1: "Búsqueda Avanzada de Talento Verificado",
  },
  "/companies/search": {
    title: "Advanced Talent Search for Recruiters - YourCVPassport",
    description: "Find ideal candidates with advanced filters by skills, experience and location. Verified profiles and direct contact with each candidate.",
    h1: "Advanced Talent Search for Recruiters",
  },
  "/nosotros": {
    title: "Sobre Nosotros: Nuestra Misión y Valores - YourCVPassport",
    description: "Conoce nuestra misión de democratizar el acceso a oportunidades laborales globales con verificación blockchain, y nuestros valores de transparencia.",
    h1: "Sobre Nosotros: Nuestra Misión y Valores",
  },
  "/about": {
    title: "About YourCVPassport: Mission and Values - YourCVPassport",
    description: "Learn about our mission to democratize access to global job opportunities through blockchain verification, and our values of transparency and innovation.",
    h1: "About YourCVPassport: Mission and Values",
  },
  "/nosotros/prensa": {
    title: "Kit de Prensa y Recursos para Medios - YourCVPassport",
    description: "Recursos de prensa para medios y periodistas: logos oficiales, capturas de pantalla, información corporativa, comunicados y contacto de prensa.",
    h1: "Kit de Prensa y Recursos para Medios",
  },
  "/about/press": {
    title: "Press Kit and Resources for Media - YourCVPassport",
    description: "Press resources for media and journalists: official logos, screenshots, corporate information, press releases and press contact details.",
    h1: "Press Kit and Resources for Media",
  },
  "/profesionales/como-funciona": {
    title: "Cómo Funciona YourCVPassport para Ti - YourCVPassport",
    description: "Crea tu perfil profesional verificado en 3 pasos sencillos: importa tus datos, verifica tus credenciales y destaca ante los reclutadores.",
    h1: "Cómo Funciona YourCVPassport para Ti",
  },
  "/professionals/how": {
    title: "How YourCVPassport Works for Professionals - YourCVPassport",
    description: "Create your verified professional profile in 3 simple steps: import your data, verify your credentials and stand out to recruiters.",
    h1: "How YourCVPassport Works for Professionals",
  },
  "/profesionales/plantillas": {
    title: "Plantillas de CV Profesionales y Editables - YourCVPassport",
    description: "Plantillas de CV diseñadas por expertos en RRHH y optimizadas para sistemas ATS como Greenhouse y Lever. Personalízalas y expórtalas a PDF de alta calidad.",
    h1: "Plantillas de CV Profesionales y Editables",
  },
  "/professionals/templates": {
    title: "Professional CV Templates for Every Role - YourCVPassport",
    description: "CV templates designed by HR experts and optimized for ATS systems like Greenhouse and Lever. Customize them and export to high-quality PDF.",
    h1: "Professional CV Templates for Every Role",
  },
  "/precios": {
    title: "Precios y Planes de YourCVPassport - YourCVPassport",
    description: "Elige el plan para impulsar tu carrera: desde el plan gratuito hasta enterprise, todos incluyen plantillas profesionales optimizadas para sistemas ATS.",
    h1: "Precios y Planes de YourCVPassport",
  },
  "/pricing": {
    title: "Pricing and Plans for Every Career Stage - YourCVPassport",
    description: "Choose the plan that boosts your career: from free to enterprise, every option includes professional CV templates optimized for ATS systems.",
    h1: "Pricing and Plans for Every Career Stage",
  },
  "/profesionales/ayuda": {
    title: "Centro de Ayuda y Soporte Técnico - YourCVPassport",
    description: "Encuentra respuestas rápidas a tus preguntas: guías completas, tutoriales paso a paso, vídeos explicativos y soporte técnico para sacar el máximo partido.",
    h1: "Centro de Ayuda y Soporte Técnico",
  },
  "/professionals/help": {
    title: "Help Center and Technical Support - YourCVPassport",
    description: "Find quick answers to your questions: complete guides, step-by-step tutorials, explainer videos and technical support to get the most out of the platform.",
    h1: "Help Center and Technical Support",
  },
  "/empresas/planes": {
    title: "Planes de Reclutamiento para Empresas - YourCVPassport",
    description: "Soluciones de reclutamiento escalables: planes flexibles con créditos, búsqueda avanzada de talento verificado, integración con ATS y soporte dedicado.",
    h1: "Planes de Reclutamiento para Empresas",
  },
  "/companies/plans": {
    title: "Recruitment Plans for Growing Companies - YourCVPassport",
    description: "Scalable recruitment solutions: flexible plans with credits, advanced verified talent search, ATS integration and dedicated support for your team.",
    h1: "Recruitment Plans for Growing Companies",
  },
  "/empresas/integraciones": {
    title: "Integraciones con los Principales ATS - YourCVPassport",
    description: "Conecta tu CV profesional con los sistemas ATS más usados: Greenhouse, Lever, Workday y Taleo, con exportación directa y compatibilidad garantizada.",
    h1: "Integraciones con los Principales ATS",
  },
  "/companies/integrations": {
    title: "Integrations with Leading ATS Systems - YourCVPassport",
    description: "Connect your professional CV with the most used ATS systems: Greenhouse, Lever, Workday and Taleo, with direct export and guaranteed compatibility.",
    h1: "Integrations with Leading ATS Systems",
  },
  "/empresas/seguridad": {
    title: "Seguridad y Cumplimiento de tus Datos - YourCVPassport",
    description: "Seguridad máxima para tus datos profesionales: cifrado de extremo a extremo, cumplimiento del RGPD, copias automáticas y auditorías periódicas.",
    h1: "Seguridad y Cumplimiento de tus Datos",
  },
  "/companies/security": {
    title: "Security and Compliance for Your Data - YourCVPassport",
    description: "Maximum security for your professional data: end-to-end encryption, GDPR compliance, automatic backups and regular security audits.",
    h1: "Security and Compliance for Your Data",
  },
  "/recursos/exito": {
    title: "Casos de Éxito de Profesionales Verificados - YourCVPassport",
    description: "Lee historias reales de profesionales que consiguieron trabajo con nuestras plantillas de CV: transformaciones verificadas y resultados comprobados.",
    h1: "Casos de Éxito de Profesionales Verificados",
  },
  "/resources/success-stories": {
    title: "Success Stories from Real Professionals - YourCVPassport",
    description: "Read real stories of professionals who landed jobs using our CV templates, with verified transformations and proven results from YourCVPassport.",
    h1: "Success Stories from Real Professionals",
  },
  "/recursos/estado": {
    title: "Estado del Sistema y Disponibilidad - YourCVPassport",
    description: "Consulta en tiempo real el estado de YourCVPassport: disponibilidad, métricas de rendimiento, historial de incidentes y avisos de mantenimiento programado.",
    h1: "Estado del Sistema y Disponibilidad",
  },
  "/resources/status": {
    title: "System Status and Service Availability - YourCVPassport",
    description: "Check the real-time status of YourCVPassport: uptime, performance metrics, incident history and notices of scheduled maintenance.",
    h1: "System Status and Service Availability",
  },
  "/terminos": {
    title: "Términos y Condiciones de Uso del Servicio - YourCVPassport",
    description: "Condiciones que regulan el uso de YourCVPassport: cuentas, contenido de los perfiles, planes de pago, responsabilidades y cómo contactar con nosotros.",
    h1: "Términos y Condiciones de Uso del Servicio",
  },
  "/terms": {
    title: "Terms and Conditions for Using the Service - YourCVPassport",
    description: "The terms that govern the use of YourCVPassport: accounts, profile content, paid plans, responsibilities and how to contact us with any question.",
    h1: "Terms and Conditions for Using the Service",
  },
  "/privacidad": {
    title: "Política de Privacidad y Datos Personales - YourCVPassport",
    description: "Cómo YourCVPassport trata tus datos personales: qué recogemos, para qué los usamos, con quién se comparten y cómo ejercer tus derechos.",
    h1: "Política de Privacidad y Datos Personales",
  },
  "/privacy": {
    title: "Privacy Policy and Data Protection - YourCVPassport",
    description: "How YourCVPassport handles your personal data: what we collect, why we use it, who it is shared with and how to exercise your data protection rights.",
    h1: "Privacy Policy and Data Protection",
  },
  "/politica-de-cookies": {
    title: "Política de Cookies y Almacenamiento - YourCVPassport",
    description: "Qué guarda YourCVPassport en tu navegador, para qué lo usa y cómo cambiar tu decisión sobre las cookies en cualquier momento desde la configuración.",
    h1: "Política de Cookies y Almacenamiento",
  },
  "/cookie-policy": {
    title: "Cookie Policy and Browser Storage - YourCVPassport",
    description: "What YourCVPassport stores in your browser, why it does so, and how to change your cookie choices at any time from the settings of the site.",
    h1: "Cookie Policy and Browser Storage",
  },
  "/comunidad": {
    title: "Comunidad de Profesionales Verificados - YourCVPassport",
    description: "Descubre publicaciones de profesionales verificados: logros, nuevos empleos, eventos y novedades de la comunidad de YourCVPassport. Únete y comparte.",
    h1: "Comunidad de Profesionales Verificados",
  },
  "/feed": {
    title: "Community of Verified Professionals - YourCVPassport",
    description: "Discover posts from verified professionals: achievements, new jobs, events and news from the YourCVPassport community. Join in and share your own.",
    h1: "Community of Verified Professionals",
  },
  "/recursos": {
    title: "Recursos para tu Carrera Profesional - YourCVPassport",
    description: "Consejos, guías y herramientas para tu carrera: empieza por el blog de YourCVPassport, con artículos sobre CV, entrevistas y búsqueda de empleo.",
    h1: "Recursos para tu Carrera Profesional",
  },
  "/resources": {
    title: "Resources for Your Professional Career - YourCVPassport",
    description: "Tips, guides and tools for your career: start with the YourCVPassport blog, with articles on CVs, interviews and job search strategies.",
    h1: "Resources for Your Professional Career",
  },
  "/login": {
    description: "Inicia sesión en YourCVPassport para gestionar tu CV profesional, postularte a ofertas de empleo y seguir el estado de tus candidaturas.",
  },
  "/signup": {
    description: "Crea gratis tu cuenta de YourCVPassport y empieza a construir tu CV profesional verificado, con plantillas, IA y sellos de verificación.",
  },
};

/** Enlaces principales que llevan todas las páginas estáticas (sin la propia ruta). */
export const MAIN_LINKS = {
  es: [
    ['/precios', 'Precios y planes'],
    ['/producto/resumen', 'Qué ofrece YourCVPassport'],
    ['/profesionales/como-funciona', 'Cómo funciona'],
    ['/profesionales/plantillas', 'Plantillas de CV'],
    ['/empresas/busqueda', 'Para empresas'],
    ['/recursos/blog', 'Blog de carrera'],
    ['/nosotros', 'Sobre nosotros'],
    ['/nosotros/contacto', 'Contacto'],
  ],
  en: [
    ['/pricing', 'Pricing and plans'],
    ['/product/overview', 'What YourCVPassport offers'],
    ['/professionals/how', 'How it works'],
    ['/professionals/templates', 'CV templates'],
    ['/companies/search', 'For companies'],
    ['/resources/blog', 'Career blog'],
    ['/about', 'About us'],
    ['/about/contact', 'Contact'],
  ],
};

export const LEGAL_LINKS = {
  es: [['/privacidad', 'Política de privacidad'], ['/terminos', 'Términos y condiciones'], ['/politica-de-cookies', 'Política de cookies']],
  en: [['/privacy', 'Privacy Policy'], ['/terms', 'Terms and Conditions'], ['/cookie-policy', 'Cookie policy']],
};

export const COPY = {
  es: { home: 'Inicio', nav: 'Enlaces principales', legal: 'Legal', articles: 'Todos los artículos' },
  en: { home: 'Home', nav: 'Main links', legal: 'Legal', articles: 'All articles' },
};
