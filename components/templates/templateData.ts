export interface TemplateData {
    id: string;
    name: {
        es: string;
        en: string;
    };
    previewImg: string;
    isPro: boolean;category: 'CV' | 'Cover Letter' | 'Email';
}

export const templates: TemplateData[] = [
    {
        id: 'passport',
        name: { es: 'Pasaporte (Nuevo)', en: 'Passport (New)' },
        previewImg: '/images/templates/passport.png',
        isPro: false,
        category: 'CV',
    },
    {
        id: 'classic',
        name: { es: 'Clásico', en: 'Classic' },
        previewImg: '/images/templates/classic.png',
        isPro: false,
        category: 'CV',
    },
    {
        id: 'modern-professional',
        name: { es: 'Profesional Moderno', en: 'Modern Professional' },
        previewImg: '/images/templates/modern-professional.png',
        isPro: false,
        category: 'CV',
    },
    {
        id: 'corporate-classic',
        name: { es: 'Corporativo Clásico', en: 'Corporate Classic' },
        previewImg: '/images/templates/classic-corporate.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'creative-minimalist',
        name: { es: 'Creativo Minimalista', en: 'Creative Minimalist' },
        previewImg: '/images/templates/creative-minimalist.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'academic-standard',
        name: { es: 'Estándar Académico', en: 'Academic Standard' },
        previewImg: '/images/templates/academic-standard.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'modern-minimalist',
        name: { es: 'Moderno Minimalista', en: 'Modern Minimalist' },
        previewImg: '/images/templates/modern-minimalist.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'creative-bold',
        name: { es: 'Creativo Audaz', en: 'Creative Bold' },
        previewImg: '/images/templates/creative-bold.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'professional-classic',
        name: { es: 'Profesional Clásico', en: 'Professional Classic' },
        previewImg: '/images/templates/professional-classic.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'healthcare-professional',
        name: { es: 'Profesional de la Salud', en: 'Healthcare Professional' },
        previewImg: '/images/templates/healthcare-professional.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'minimalist-yellow',
        name: { es: 'Minimalista Amarillo', en: 'Minimalist Yellow' },
        previewImg: '/images/templates/minimalist-yellow.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'gradient-blue',
        name: { es: 'Gradiente Azul', en: 'Gradient Blue' },
        previewImg: '/images/templates/gradient-blue.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'coral-pink',
        name: { es: 'Rosa Coral', en: 'Coral Pink' },
        previewImg: '/images/templates/coral-pink.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'green-minimal',
        name: { es: 'Verde Minimalista', en: 'Green Minimal' },
        previewImg: '/images/templates/green-minimal.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'creative-orange',
        name: { es: 'Naranja Creativo', en: 'Creative Orange' },
        previewImg: '/images/templates/creative-orange.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'classic-sidebar',
        name: { es: 'Barra Lateral Oscura', en: 'Sidebar Dark' },
        previewImg: '/images/templates/classic-sidebar.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'modern-clean',
        name: { es: 'Encabezado Gradiente', en: 'Header Gradient' },
        previewImg: '/images/templates/modern-clean.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'elegant-minimal',
        name: { es: 'Línea de Tiempo Elegante', en: 'Elegant Timeline' },
        previewImg: '/images/templates/elegant-minimal.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'professional-blue',
        name: { es: 'Azul Profesional', en: 'Professional Blue' },
        previewImg: '/images/templates/professional-blue.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'creative-modern',
        name: { es: 'Banner Creativo', en: 'Creative Banner' },
        previewImg: '/images/templates/creative-modern.png',
        isPro: true,
        category: 'CV',
    },
    {
        id: 'urban',
        name: { es: 'Urbano', en: 'Urban' },
        previewImg: '/images/templates/urban.png',
        isPro: true,
        category: 'CV',
    },
];