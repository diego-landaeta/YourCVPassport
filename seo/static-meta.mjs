/**
 * Título y descripción de cada página pública, para servirlos en el HTML desde el
 * primer byte (antes todas las URLs llegaban con el título genérico en inglés de
 * index.html y el bueno lo ponía React segundos después; Google podía indexar el genérico).
 *
 * scripts/generate-static-meta.mjs lo usa tras `vite build` para escribir
 * dist/<ruta>/index.html (copia de index.html con estos valores, canonical y hreflang).
 * nginx (try_files $uri $uri/ /index.html) y server.mjs sirven esa copia; React la
 * hidrata igual que antes y Helmet reemplaza las etiquetas (llevan data-rh).
 *
 * Los valores son EXACTAMENTE los que pinta cada página (PageSEO añade " - YourCVPassport"
 * y recorta la descripción a 160 caracteres). Si cambias el título de una página, cámbialo
 * también aquí: tests/qa/u5-web-publica.local.spec.ts compara cada título con la SPA.
 *
 * Rutas: la principal de cada pareja ES/EN de config/routeConfig.ts (sin duplicadas ni
 * redirecciones) más /empleos-/jobs y /comunidad-/feed.
 */

/** @typedef {{ es: string, en: string }} Bilingual */
/** @type {ReadonlyArray<{ es: string, en: string, title: Bilingual, description: Bilingual }>} */
export const STATIC_META_PAIRS = [
  {
    es: '/producto/resumen', en: '/product/overview',
    title: { es: 'Plataforma Profesional de CV Verificado - YourCVPassport', en: 'Professional Verified CV Platform - YourCVPassport' },
    description: {
      es: 'Crea, verifica y comparte tu CV profesional con tecnología blockchain. Plantillas ATS, dominio personalizado, analíticas avanzadas, IA integrada y más con Yo...',
      en: 'Create, verify and share your professional CV with blockchain technology. ATS templates, custom domain, advanced analytics, integrated AI and more with YourC...',
    },
  },
  {
    es: '/producto/sellos', en: '/product/stamps',
    title: { es: 'Verificación de Credenciales Blockchain - YourCVPassport', en: 'Blockchain Credential Verification - YourCVPassport' },
    description: {
      es: 'Verifica tus logros profesionales con tecnología blockchain inmutable. Certificaciones, diplomas, experiencia laboral validados y confiables para reclutadore...',
      en: 'Verify your professional achievements with immutable blockchain technology. Certifications, diplomas, work experience validated and trusted by recruiters wit...',
    },
  },
  {
    es: '/producto/ats', en: '/product/ats',
    title: { es: 'Plantillas Optimizadas para ATS - YourCVPassport', en: 'ATS-Optimized Templates - YourCVPassport' },
    description: {
      es: 'Exporta tu CV optimizado para sistemas ATS como Greenhouse, Lever y Workday. Formato PDF compatible, parsing 99% exitoso, plantillas profesionales con YourCV...',
      en: 'Export your optimized CV for ATS systems like Greenhouse, Lever and Workday. Compatible PDF format, 99% successful parsing, professional templates with YourC...',
    },
  },
  {
    es: '/producto/dominio', en: '/product/domain',
    title: { es: 'Dominio Personalizado para tu CV - YourCVPassport', en: 'Custom Domain for Your CV - YourCVPassport' },
    description: {
      es: 'Crea tu marca personal con un dominio profesional memorable. yourcvpassport.com/tu-nombre en lugar de URLs genéricas. Destaca ante reclutadores con YourCVPas...',
      en: 'Build your personal brand with a memorable professional domain. yourcvpassport.com/your-name instead of generic URLs. Stand out to recruiters with YourCVPass...',
    },
  },
  {
    es: '/producto/analiticas', en: '/product/analytics',
    title: { es: 'Analítica de Perfil Profesional - YourCVPassport', en: 'Professional Profile Analytics - YourCVPassport' },
    description: {
      es: 'Descubre quién visita tu CV profesional con analíticas detalladas. Métricas de engagement, fuentes de tráfico y distribución geográfica para optimizar tu bús...',
      en: 'Discover who visits your professional CV with detailed analytics. Engagement metrics, traffic sources, and geographic distribution to optimize your job searc...',
    },
  },
  {
    es: '/producto/ia', en: '/product/ai',
    title: { es: 'IA que potencia tu perfil profesional - YourCVPassport', en: 'AI that powers your professional profile - YourCVPassport' },
    description: {
      es: 'Descubre cómo nuestra IA optimiza tu CV automáticamente: mejora descripciones, genera summaries profesionales, sugiere skills relevantes y valida la calidad ...',
      en: 'Discover how our AI optimizes your CV automatically: improves descriptions, generates professional summaries, suggests relevant skills and validates your pro...',
    },
  },
  {
    es: '/empresas/busqueda', en: '/companies/search',
    title: { es: 'Búsqueda Avanzada de Talento - YourCVPassport', en: 'Advanced Talent Search - YourCVPassport' },
    description: {
      es: 'Encuentra candidatos ideales con IA. Filtros avanzados por skills, experiencia, ubicación. Perfiles verificados, contacto directo, integración ATS completa p...',
      en: 'Find ideal candidates with AI. Advanced filters by skills, experience, location. Verified profiles, direct contact, complete ATS integration for recruiters w...',
    },
  },
  {
    es: '/nosotros', en: '/about',
    title: { es: 'Sobre nosotros: misión y valores - YourCVPassport', en: 'About us: mission and values - YourCVPassport' },
    description: {
      es: 'Conoce nuestra misión de democratizar el acceso a oportunidades laborales globales mediante verificación blockchain. Valores de transparencia, innovación y e...',
      en: 'Learn about our mission to democratize access to global job opportunities through blockchain verification. Values of transparency, innovation, and equity wit...',
    },
  },
  {
    es: '/nosotros/prensa', en: '/about/press',
    title: { es: 'Kit de Prensa - YourCVPassport', en: 'Press Kit - YourCVPassport' },
    description: {
      es: 'Recursos de prensa para medios y periodistas. Logos oficiales, screenshots, información corporativa, comunicados de prensa y contacto de medios de YourCVPass...',
      en: 'Press resources for media and journalists. Official logos, screenshots, corporate information, press releases and media contact for YourCVPassport.',
    },
  },
  {
    es: '/nosotros/contacto', en: '/about/contact',
    title: { es: 'Contacto - Soporte y Atención al Cliente - YourCVPassport', en: 'Contact - Support and Customer Service - YourCVPassport' },
    description: {
      es: 'Contáctanos para soporte, ventas o preguntas sobre tu CV profesional. Equipo de atención disponible para ayudarte a destacar ante reclutadores con YourCVPass...',
      en: 'Contact us for support, sales, or questions about your professional CV. Support team available to help you stand out to recruiters with YourCVPassport.',
    },
  },
  {
    es: '/profesionales/como-funciona', en: '/professionals/how',
    title: { es: 'Cómo Funciona para Profesionales - YourCVPassport', en: 'How It Works for Professionals - YourCVPassport' },
    description: {
      es: 'Descubre cómo crear tu perfil profesional verificado en 3 simples pasos. Importa datos, verifica credenciales y destaca ante reclutadores con YourCVPassport.',
      en: 'Discover how to create your verified professional profile in 3 simple steps. Import data, verify credentials, and stand out to recruiters with YourCVPassport.',
    },
  },
  {
    es: '/profesionales/plantillas', en: '/professionals/templates',
    title: { es: 'Plantillas de CV Profesionales - YourCVPassport', en: 'Professional CV Templates - YourCVPassport' },
    description: {
      es: 'Plantillas de CV diseñadas por expertos en RRHH, optimizadas para sistemas ATS como Greenhouse y Lever. Personalizables y exportables a PDF de alta calidad c...',
      en: 'CV templates designed by HR experts, optimized for ATS systems like Greenhouse and Lever. Customizable and exportable to high-quality PDF with YourCVPassport.',
    },
  },
  {
    es: '/precios', en: '/pricing',
    title: { es: 'Precios y Planes - YourCVPassport', en: 'Pricing and Plans - YourCVPassport' },
    description: {
      es: 'Elige el plan perfecto para impulsar tu carrera profesional. Desde gratis hasta enterprise, todas las opciones incluyen plantillas profesionales optimizadas ...',
      en: 'Choose the perfect plan to boost your professional career. From free to enterprise, all options include professional ATS-optimized templates with YourCVPassp...',
    },
  },
  {
    es: '/profesionales/ayuda', en: '/professionals/help',
    title: { es: 'Centro de Ayuda - YourCVPassport', en: 'Help Center - YourCVPassport' },
    description: {
      es: 'Encuentra respuestas rápidas a tus preguntas. Guías completas, tutoriales paso a paso, videos explicativos y soporte técnico para sacar el máximo provecho de...',
      en: 'Find quick answers to your questions. Complete guides, step-by-step tutorials, explanatory videos, and technical support to get the most out of YourCVPassport.',
    },
  },
  {
    es: '/empresas/planes', en: '/companies/plans',
    title: { es: 'Planes para Empresas - YourCVPassport', en: 'Company Plans - YourCVPassport' },
    description: {
      es: 'Soluciones de reclutamiento escalables para empresas. Planes flexibles con créditos, búsqueda avanzada de talento verificado, integración ATS completa y sopo...',
      en: 'Scalable recruitment solutions for companies. Flexible credit-based plans, advanced verified talent search, complete ATS integration, and dedicated support w...',
    },
  },
  {
    es: '/empresas/integraciones', en: '/companies/integrations',
    title: { es: 'Integraciones ATS - YourCVPassport', en: 'ATS Integrations - YourCVPassport' },
    description: {
      es: 'Conecta tu CV profesional con los principales sistemas ATS: Greenhouse, Lever, Workday, Taleo. Exportación directa y compatibilidad garantizada con YourCVPas...',
      en: 'Connect your professional CV with leading ATS systems: Greenhouse, Lever, Workday, Taleo. Direct export and guaranteed compatibility with YourCVPassport.',
    },
  },
  {
    es: '/empresas/seguridad', en: '/companies/security',
    title: { es: 'Seguridad y Cumplimiento - YourCVPassport', en: 'Security and Compliance - YourCVPassport' },
    description: {
      es: 'Máxima seguridad para tus datos profesionales. Encriptación end-to-end, certificación SOC 2, cumplimiento GDPR, backups automáticos y auditorías de seguridad...',
      en: 'Maximum security for your professional data. End-to-end encryption, SOC 2 certification, GDPR compliance, automatic backups and security audits with YourCVPa...',
    },
  },
  {
    es: '/recursos/blog', en: '/resources/blog',
    title: { es: 'Blog - Recursos y Consejos de Carrera - YourCVPassport', en: 'Blog - Career Resources and Advice - YourCVPassport' },
    description: {
      es: 'Artículos expertos sobre desarrollo profesional, estrategias de búsqueda de empleo, optimización de CV, tendencias de reclutamiento y consejos para destacar ...',
      en: 'Expert articles on professional development, job search strategies, CV optimization, recruitment trends, and tips to stand out in the job market.',
    },
  },
  {
    es: '/recursos/exito', en: '/resources/success-stories',
    title: { es: 'Casos de Éxito - YourCVPassport', en: 'Success Stories - YourCVPassport' },
    description: {
      es: 'Lee historias reales de profesionales que consiguieron trabajo usando nuestras plantillas de CV. Transformaciones verificadas y resultados comprobados con Yo...',
      en: 'Read real stories of professionals who got jobs using our CV templates. Verified transformations and proven results with YourCVPassport.',
    },
  },
  {
    es: '/recursos/estado', en: '/resources/status',
    title: { es: 'Estado del Sistema - YourCVPassport', en: 'System Status - YourCVPassport' },
    description: {
      es: 'Monitoreo en tiempo real del estado de YourCVPassport. Uptime, métricas de rendimiento, historial de incidentes y notificaciones de mantenimiento programado.',
      en: 'Real-time monitoring of YourCVPassport status. Uptime, performance metrics, incident history and scheduled maintenance notifications.',
    },
  },
  {
    es: '/terminos', en: '/terms',
    title: { es: 'Términos y condiciones | YourCVPassport', en: 'Terms and Conditions | YourCVPassport' },
    description: {
      es: 'Términos y condiciones de YourCVPassport',
      en: 'Terms and Conditions for YourCVPassport',
    },
  },
  {
    es: '/privacidad', en: '/privacy',
    title: { es: 'Política de privacidad | YourCVPassport', en: 'Privacy Policy | YourCVPassport' },
    description: {
      es: 'Política de privacidad de YourCVPassport',
      en: 'Privacy Policy for YourCVPassport',
    },
  },
  {
    es: '/empleos', en: '/jobs',
    title: { es: 'Buscar empleo - Encuentra tu próxima oportunidad - YourCVPassport', en: 'Job Search - Find Your Next Opportunity - YourCVPassport' },
    description: {
      es: 'Consulta ofertas de empleo de empresas verificadas. Filtra por ubicación, nivel de experiencia y modalidad, y postúlate con tu perfil de CV verificado.',
      en: 'Browse job opportunities from verified companies. Filter by location, experience level, and work mode. Apply directly with your verified CV profile.',
    },
  },
  {
    es: '/comunidad', en: '/feed',
    title: { es: 'Comunidad — YourCVPassport', en: 'Community — YourCVPassport' },
    description: {
      es: 'Descubre publicaciones de profesionales verificados. Logros, empleos, eventos y más.',
      en: 'Discover posts from verified professionals. Achievements, jobs, events and more.',
    },
  },
];

/**
 * Rutas que sirven ambos idiomas en la misma URL (sin hreflang): se sirven con el texto
 * en español, el idioma por defecto de la web. React lo cambia si el visitante usa inglés.
 * @type {ReadonlyArray<{ path: string, title: string, description: string }>}
 */
export const STATIC_META_SINGLE = [
  {
    path: '/login',
    title: 'Iniciar sesión - Accede a tu cuenta | YourCVPassport',
    description: 'Inicia sesión en YourCVPassport para gestionar tu CV profesional, postularte a ofertas y seguir tus candidaturas.',
  },
  {
    path: '/signup',
    title: 'Crear cuenta - Crea tu CV profesional | YourCVPassport',
    description: 'Crea gratis tu cuenta de YourCVPassport y empieza a construir tu CV profesional verificado.',
  },
];
