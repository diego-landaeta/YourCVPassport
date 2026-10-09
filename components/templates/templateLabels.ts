import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Textos fijos de las plantillas de CV (excepto Passport) en español e inglés.
 *
 * Las plantillas siguen el idioma de la interfaz (`useLanguage`), igual que las
 * etiquetas que ya salen de `t.cvSections`. Aquí van solo los textos propios de
 * las plantillas que no existen en `translations/` (ese diccionario es de otra
 * unidad): se mantienen en un único sitio para no repetir ternarios por plantilla.
 *
 * `en` se tipa con la forma de `es`: si falta una clave en un idioma, no compila.
 */
const es = {
    // Fechas
    present: 'Presente',
    ongoing: 'En curso',
    expiresShort: 'Exp.:',

    // Secciones
    about: 'Sobre mí',
    aboutMe: 'Sobre mí',
    contact: 'Contacto',
    experience: 'Experiencia',
    workExperience: 'Experiencia laboral',
    professionalExperience: 'Experiencia profesional',
    education: 'Educación',
    academicEducation: 'Formación académica',
    academicProfile: 'Perfil académico',
    professionalProfile: 'Perfil profesional',
    professionalSummary: 'Resumen profesional',
    skills: 'Habilidades',
    competencies: 'Competencias y habilidades',
    keyCompetencies: 'Competencias clave',
    professionalCompetencies: 'Competencias profesionales',
    additionalInfo: 'Información adicional',
    referencesOnRequest: 'Referencias disponibles a petición.',
    portfolio: 'Portafolio',
    projects: 'Proyectos',
    myProjects: 'Mis proyectos',
    featuredProjects: 'Proyectos destacados',
    services: 'Servicios',
    languages: 'Idiomas',
    credentials: 'Credenciales',
    testimonials: 'Testimonios',

    // Pestañas (Gradient Blue, Coral Pink, Yellow Minimalist)
    tabAbout: 'Sobre mí',
    tabResume: 'Trayectoria',
    tabProjects: 'Proyectos',
    tabContact: 'Contacto',
    tabExperience: 'Experiencia',
    tabWork: 'Trabajos',
    tabPortfolio: 'Portafolio',
    aLittleAboutMe: 'Un poco sobre mí',

    // Estados vacíos
    noExperience: 'No hay experiencia registrada.',
    noEducation: 'No hay formación registrada.',
    noProjects: 'No hay proyectos que mostrar.',
    noPortfolio: 'No hay trabajos que mostrar.',

    // Enlaces y contacto
    viewProject: 'Ver proyecto',
    viewProfile: 'Ver perfil',
    profileLink: 'Perfil',
    getInTouch: 'Ponte en contacto',
    contactMe: 'Contáctame',
    letsWorkTogether: 'Trabajemos juntos',

    // Saludos
    hiIm: 'Hola, soy',
    helloIm: (name: string) => `Hola, soy ${name}`,

    // Urban
    helloMyNameIs: 'HOLA_ME_LLAMO',
    manifesto: 'Manifiesto',
    trackRecord: 'Trayectoria',
    drops: 'Proyectos',
    arsenal: 'Arsenal',
    view: 'VER',

    // Niveles (Psychology)
    levelExpert: 'Experto',
};

export type TemplateLabels = typeof es;

const en: TemplateLabels = {
    present: 'Present',
    ongoing: 'Ongoing',
    expiresShort: 'Exp.:',

    about: 'About',
    aboutMe: 'About Me',
    contact: 'Contact',
    experience: 'Experience',
    workExperience: 'Work Experience',
    professionalExperience: 'Professional Experience',
    education: 'Education',
    academicEducation: 'Academic Background',
    academicProfile: 'Academic Profile',
    professionalProfile: 'Professional Profile',
    professionalSummary: 'Professional Summary',
    skills: 'Skills',
    competencies: 'Skills & Competencies',
    keyCompetencies: 'Key Competencies',
    professionalCompetencies: 'Professional Competencies',
    additionalInfo: 'Additional Information',
    referencesOnRequest: 'References available upon request.',
    portfolio: 'Portfolio',
    projects: 'Projects',
    myProjects: 'My Projects',
    featuredProjects: 'Featured Projects',
    services: 'Services',
    languages: 'Languages',
    credentials: 'Credentials',
    testimonials: 'Testimonials',

    tabAbout: 'About',
    tabResume: 'Resume',
    tabProjects: 'Projects',
    tabContact: 'Contact',
    tabExperience: 'Experience',
    tabWork: 'Work',
    tabPortfolio: 'Portfolio',
    aLittleAboutMe: 'A little about me',

    noExperience: 'No experience listed.',
    noEducation: 'No education listed.',
    noProjects: 'No projects to display.',
    noPortfolio: 'No portfolio items to display.',

    viewProject: 'View Project',
    viewProfile: 'View Profile',
    profileLink: 'Profile',
    getInTouch: 'Get in Touch',
    contactMe: 'Contact Me',
    letsWorkTogether: "Let's Work Together",

    hiIm: "Hi, I'm",
    helloIm: (name: string) => `Hello, I'm ${name}`,

    helloMyNameIs: 'HELLO_MY_NAME_IS',
    manifesto: 'Manifesto',
    trackRecord: 'Track Record',
    drops: 'Drops',
    arsenal: 'Arsenal',
    view: 'VIEW',

    levelExpert: 'Expert',
};

export const templateLabels: Record<'es' | 'en', TemplateLabels> = { es, en };

/** Textos de plantilla en el idioma actual de la interfaz, y ese idioma. */
export const useTemplateLabels = (): { L: TemplateLabels; lang: 'es' | 'en' } => {
    const { lang } = useLanguage();
    return { L: templateLabels[lang] ?? es, lang };
};
