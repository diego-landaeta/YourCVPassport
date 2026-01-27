// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/client';
import { templates } from '../templates/templateData';
import { FullProfileData, Profile } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

// Import all template components
import ClassicTemplate from '../templates/ClassicTemplate';
import PassportTemplate from '../templates/PassportTemplate';
import ModernProfessionalTemplate from '../templates/ModernProfessionalTemplate';
import ProfessionalClassicTemplate from '../templates/ProfessionalClassicTemplate';
import AcademicStandardTemplate from '../templates/AcademicStandardTemplate';
import CreativeMinimalistTemplate from '../templates/CreativeMinimalistTemplate';
import CreativeBoldTemplate from '../templates/CreativeBoldTemplate';
import CreativeOrangeTemplate from '../templates/CreativeOrangeTemplate';
import CreativeModernTemplate from '../templates/CreativeModernTemplate';
import BlueGradientTemplate from '../templates/BlueGradientTemplate';
import ModernCleanTemplate from '../templates/ModernCleanTemplate';
import ModernMinimalistTemplate from '../templates/ModernMinimalistTemplate';
import ProfessionalBlueTemplate from '../templates/ProfessionalBlueTemplate';
import ElegantMinimalTemplate from '../templates/ElegantMinimalTemplate';
import YellowMinimalistTemplate from '../templates/YellowMinimalistTemplate';
import CoralPinkTemplate from '../templates/CoralPinkTemplate';
import GreenMinimalTemplate from '../templates/GreenMinimalTemplate';
import ClassicSidebarTemplate from '../templates/ClassicSidebarTemplate';
import HealthcareProfessionalTemplate from '../templates/HealthcareProfessionalTemplate';
import CorporateClassicTemplate from '../templates/CorporateClassicTemplate';
import UrbanTemplate from '../templates/UrbanTemplate';

// Template map
const templateComponents: Record<string, React.ComponentType<{ data: FullProfileData; color?: string | null }>> = {
  'classic': ClassicTemplate,
  'passport': PassportTemplate,
  'modern-professional': ModernProfessionalTemplate,
  'corporate-classic': CorporateClassicTemplate,
  'professional-classic': ProfessionalClassicTemplate,
  'academic-standard': AcademicStandardTemplate,
  'creative-minimalist': CreativeMinimalistTemplate,
  'creative-bold': CreativeBoldTemplate,
  'creative-orange': CreativeOrangeTemplate,
  'creative-modern': CreativeModernTemplate,
  'gradient-blue': BlueGradientTemplate,
  'modern-clean': ModernCleanTemplate,
  'modern-minimalist': ModernMinimalistTemplate,
  'professional-blue': ProfessionalBlueTemplate,
  'elegant-minimal': ElegantMinimalTemplate,
  'minimalist-yellow': YellowMinimalistTemplate,
  'coral-pink': CoralPinkTemplate,
  'green-minimal': GreenMinimalTemplate,
  'classic-sidebar': ClassicSidebarTemplate,
  'healthcare-professional': HealthcareProfessionalTemplate,
  'urban': UrbanTemplate,
};

// Sample data for demonstration
const getSampleProfileData = (): FullProfileData => ({
  profile: {
    id: 'sample-id',
    user_id: 'sample-user-id',
    full_name: 'María González',
    headline: 'Senior Full Stack Developer & UX Designer',
    summary: 'Desarrolladora apasionada con más de 8 años de experiencia creando soluciones web escalables y centradas en el usuario. Especializada en React, Node.js, y diseño de interfaces intuitivas.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    email: 'maria.gonzalez@example.com',
    phone: '+34 612 345 678',
    location: 'Madrid, España',
    country_code: 'ES',
    language: 'es',
    template_id: 'classic',
    color: '#3B82F6',
    show_contact_info: true,
    show_verified_credentials: true,
    verification_status: 'verified',
    created_at: '2024-01-01',
    updated_at: '2024-01-15',
    slug: 'maria-gonzalez',
    meta_description: 'Full Stack Developer especializada en React y Node.js',
    is_public: true,
    role: 'user'
  },
  experiences: [
    {
      id: '1',
      user_id: 'sample-user-id',
      position: 'Senior Full Stack Developer',
      company_name: 'Tech Innovation Labs',
      start_date: '2020-03-01',
      end_date: null,
      description: 'Liderando el desarrollo de aplicaciones web escalables utilizando React, Node.js y PostgreSQL. Implementación de arquitecturas serverless en AWS y diseño de sistemas de alta disponibilidad.',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      user_id: 'sample-user-id',
      position: 'Frontend Developer',
      company_name: 'Digital Solutions Inc.',
      start_date: '2018-01-15',
      end_date: '2020-02-28',
      description: 'Desarrollo de interfaces de usuario modernas con React y TypeScript. Colaboración con equipos de diseño para crear experiencias de usuario excepcionales.',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '3',
      user_id: 'sample-user-id',
      position: 'Junior Web Developer',
      company_name: 'StartUp Ventures',
      start_date: '2016-06-01',
      end_date: '2017-12-31',
      description: 'Desarrollo de sitios web responsivos y aplicaciones web utilizando HTML, CSS, JavaScript y WordPress.',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ],
  education: [
    {
      id: '1',
      user_id: 'sample-user-id',
      degree: 'Master en Desarrollo de Software',
      institution_name: 'Universidad Politécnica de Madrid',
      field_of_study: 'Ingeniería de Software',
      start_date: '2014-09-01',
      end_date: '2016-06-30',
      description: 'Especialización en arquitecturas de software, patrones de diseño y metodologías ágiles.',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      user_id: 'sample-user-id',
      degree: 'Grado en Informática',
      institution_name: 'Universidad Complutense de Madrid',
      field_of_study: 'Ciencias de la Computación',
      start_date: '2010-09-01',
      end_date: '2014-06-30',
      description: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ],
  skills: [
    { id: '1', user_id: 'sample-user-id', name: 'React', proficiency_level: 'expert', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '2', user_id: 'sample-user-id', name: 'TypeScript', proficiency_level: 'expert', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '3', user_id: 'sample-user-id', name: 'Node.js', proficiency_level: 'advanced', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '4', user_id: 'sample-user-id', name: 'PostgreSQL', proficiency_level: 'advanced', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '5', user_id: 'sample-user-id', name: 'AWS', proficiency_level: 'intermediate', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '6', user_id: 'sample-user-id', name: 'Docker', proficiency_level: 'intermediate', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '7', user_id: 'sample-user-id', name: 'Git', proficiency_level: 'expert', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '8', user_id: 'sample-user-id', name: 'Figma', proficiency_level: 'advanced', created_at: '2024-01-01', updated_at: '2024-01-01' }
  ],
  languages: [
    { id: '1', user_id: 'sample-user-id', name: 'Español', level: 'Nativo', proficiency_level: 'native', created_at: '2024-01-01', updated_at: '2024-01-01', language: 'Español' },
    { id: '2', user_id: 'sample-user-id', name: 'Inglés', level: 'Profesional', proficiency_level: 'professional', created_at: '2024-01-01', updated_at: '2024-01-01', language: 'Inglés' },
    { id: '3', user_id: 'sample-user-id', name: 'Francés', level: 'Intermedio', proficiency_level: 'intermediate', created_at: '2024-01-01', updated_at: '2024-01-01', language: 'Francés' }
  ],
  certifications: [
    {
      id: '1',
      user_id: 'sample-user-id',
      name: 'AWS Certified Solutions Architect',
      certification_name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issuing_organization: 'Amazon Web Services',
      issue_date: '2023-05-15',
      expiry_date: '2026-05-15',
      credential_id: 'AWS-SA-2023-12345',
      credential_url: 'https://aws.amazon.com/verification',
      does_not_expire: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      user_id: 'sample-user-id',
      name: 'Google UX Design Professional Certificate',
      certification_name: 'Google UX Design Professional Certificate',
      issuer: 'Google',
      issuing_organization: 'Google',
      issue_date: '2022-11-20',
      expiry_date: null,
      credential_id: 'GUX-2022-67890',
      credential_url: 'https://www.coursera.org/account/accomplishments/verify',
      does_not_expire: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ],
  portfolio: [
    {
      id: '1',
      user_id: 'sample-user-id',
      project_name: 'E-commerce Platform Redesign',
      title: 'E-commerce Platform Redesign',
      description: 'Rediseño completo de una plataforma de comercio electrónico con más de 100,000 usuarios activos. Mejora del 45% en conversiones.',
      project_url: 'https://example.com/project1',
      image_url: null,
      thumbnail_url: null,
      category: 'Web Development',
      technologies: ['React', 'Node.js', 'PostgreSQL'],
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      user_id: 'sample-user-id',
      project_name: 'Mobile Banking App',
      title: 'Mobile Banking App',
      description: 'Aplicación móvil de banca digital con autenticación biométrica y gestión de finanzas personales.',
      project_url: 'https://example.com/project2',
      image_url: null,
      thumbnail_url: null,
      category: 'Mobile Development',
      technologies: ['React Native', 'Firebase'],
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '3',
      user_id: 'sample-user-id',
      project_name: 'AI-Powered Dashboard',
      title: 'AI-Powered Dashboard',
      description: 'Dashboard de análisis de datos con integración de machine learning para predicciones en tiempo real.',
      project_url: 'https://example.com/project3',
      image_url: null,
      thumbnail_url: null,
      category: 'Data Visualization',
      technologies: ['TypeScript', 'Python', 'TensorFlow'],
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ],
  recommendations: [
    {
      id: '1',
      user_id: 'sample-user-id',
      recommender_name: 'Carlos Rodríguez',
      recommender_title: 'CTO',
      recommender_position: 'CTO at Tech Innovation Labs',
      recommender_company: 'Tech Innovation Labs',
      recommender_avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      recommendation_text: 'María es una desarrolladora excepcional con una visión única para resolver problemas complejos. Su capacidad para liderar equipos y entregar proyectos de alta calidad la hace invaluable.',
      relationship: 'Supervisor directo',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      user_id: 'sample-user-id',
      recommender_name: 'Ana Martínez',
      recommender_title: 'Product Manager',
      recommender_position: 'Product Manager at Digital Solutions Inc.',
      recommender_company: 'Digital Solutions Inc.',
      recommender_avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      recommendation_text: 'Trabajar con María fue una experiencia increíble. Su atención al detalle y su compromiso con la experiencia del usuario son incomparables. Altamente recomendada.',
      relationship: 'Colega de trabajo',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ],
  portfolioItems: []
});

const AdminTestingHub: React.FC = () => {
  const { lang } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [useSampleData, setUseSampleData] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic');
  const [profileData, setProfileData] = useState<FullProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'preview'>('preview');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const cvRef = useRef<HTMLDivElement>(null);

  // Load all profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Load profile data when a profile is selected or sample data is toggled
  useEffect(() => {
    if (useSampleData) {
      setProfileData(getSampleProfileData());
    } else if (selectedProfileId) {
      loadProfileData(selectedProfileId);
    } else {
      setProfileData(null);
    }
  }, [selectedProfileId, useSampleData]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, email, avatar_url, template, slug')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadProfileData = async (profileId: string) => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;

      // Fetch related data
      const [
        { data: experiences },
        { data: education },
        { data: skills },
        { data: languages },
        { data: certifications },
        { data: portfolio },
        { data: recommendations }
      ] = await Promise.all([
        supabase.from('experiences').select('*').eq('profile_id', profileId).order('start_date', { ascending: false }),
        supabase.from('education').select('*').eq('profile_id', profileId).order('start_date', { ascending: false }),
        supabase.from('skills').select('*').eq('profile_id', profileId).order('sort_order', { ascending: true }),
        supabase.from('languages').select('*').eq('profile_id', profileId).order('sort_order', { ascending: true }),
        supabase.from('certifications').select('*').eq('profile_id', profileId).order('issue_date', { ascending: false }),
        supabase.from('portfolio_items').select('*').eq('profile_id', profileId).order('sort_order', { ascending: true }),
        supabase.from('recommendations').select('*').eq('profile_id', profileId).order('created_at', { ascending: false })
      ]);

      setProfileData({
        profile,
        experiences: experiences || [],
        education: education || [],
        skills: skills || [],
        languages: languages || [],
        certifications: certifications || [],
        portfolio: portfolio || [],
        recommendations: recommendations || []
      });

      // Set template to user's saved template if available
      if (profile.template) {
        setSelectedTemplate(profile.template);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cvRef.current || !profileData) return;

    try {
      setDownloading(true);

      // TODO: Install html2pdf.js package: npm install html2pdf.js --legacy-peer-deps
      // Dynamic import of html2pdf
      // const html2pdf = (await import('html2pdf.js')).default;

      // const element = cvRef.current;
      // const opt = {
      //   margin: 0,
      //   filename: `CV_${profileData.profile.full_name.replace(/\s+/g, '_')}_${selectedTemplate}.pdf`,
      //   image: { type: 'jpeg', quality: 0.98 },
      //   html2canvas: {
      //     scale: 2,
      //     useCORS: true,
      //     logging: false,
      //     letterRendering: true
      //   },
      //   jsPDF: {
      //     unit: 'mm',
      //     format: 'a4',
      //     orientation: 'portrait',
      //     compress: true
      //   },
      //   pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      // };

      // await html2pdf().set(opt).from(element).save();

      console.warn('PDF download temporarily disabled. Install html2pdf.js to enable.');
      alert('PDF download feature is temporarily disabled. Please contact administrator.');

    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF. Asegúrate de que html2pdf.js esté instalado.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCaptureScreenshot = async () => {
    if (!cvRef.current || !profileData) return;

    setCapturing(true);
    try {
      // Dynamically import html2canvas only when needed
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: previewTheme === 'dark' ? '#1f2937' : '#ffffff',
        logging: false,
      });

      const filename = `${selectedTemplate}-${previewTheme}-${useSampleData ? 'sample' : profileData.profile.slug}.png`;

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Error al capturar screenshot. Verifica que html2canvas esté instalado.');
    } finally {
      setCapturing(false);
    }
  };

  const togglePreviewTheme = () => {
    setPreviewTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderTemplate = () => {
    if (!profileData) return null;

    const TemplateComponent = templateComponents[selectedTemplate] || ClassicTemplate;
    return <TemplateComponent data={profileData} color={profileData.profile.color || profileData.profile.template_color} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🧪 Testing Hub</h2>
            <p className="text-purple-100">Prueba plantillas con datos reales o de muestra, descarga CVs y captura screenshots</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'bg-purple-700 hover:bg-purple-800 text-white'
              }`}
            >
              Vista Previa
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'gallery'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'bg-purple-700 hover:bg-purple-800 text-white'
              }`}
            >
              Galería
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'gallery' ? (
        /* Gallery View - Template Cards */
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Todas las Plantillas ({templates.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Haz clic en cualquier plantilla para verla en vista previa
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => {
              const isAvailable = templateComponents[template.id];
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedTemplate(template.id);
                      setViewMode('preview');
                    }
                  }}
                  disabled={!isAvailable}
                  className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border-2 overflow-hidden ${
                    isAvailable
                      ? 'border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Preview Image */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                    <img
                      src={template.previewImg}
                      alt={template.name[lang]}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                        template.isPro
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                          : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
                      }`}
                    >
                      {template.isPro ? 'PRO' : 'FREE'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {template.name[lang]}
                    </h3>
                    {template.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {template.description[lang]}
                      </p>
                    )}
                    {!isAvailable && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                        Plantilla no disponible
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Preview Mode - Original Testing Hub */
        <>
          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Data Source Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                📊 Origen de Datos
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${useSampleData ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600'}">
                  <input
                    type="radio"
                    checked={useSampleData}
                    onChange={() => {
                      setUseSampleData(true);
                      setSelectedProfileId(null);
                    }}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Datos de Muestra</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Perfil ficticio completo</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${!useSampleData ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600'}">
                  <input
                    type="radio"
                    checked={!useSampleData}
                    onChange={() => setUseSampleData(false)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Usuario Real</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Selecciona un perfil</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Profile Selector (only visible when not using sample data) */}
            {!useSampleData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  👤 Seleccionar Usuario
                </label>
                <select
                  value={selectedProfileId || ''}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Selecciona un usuario --</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name} ({profile.email})
                    </option>
                  ))}
                </select>
                {selectedProfileId && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Total perfiles: {profiles.length}
                  </div>
                )}
              </div>
            )}

            {/* Template Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                🎨 Seleccionar Plantilla
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <optgroup label="🆓 Plantillas Gratuitas">
                  {templates.filter(t => !t.isPro).map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name[lang as 'es' | 'en']}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="⭐ Premium">
                  {templates.filter(t => t.isPro).map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name[lang as 'es' | 'en']}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Total: {templates.length} ({templates.filter(t => t.isPro).length} premium)
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {profileData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {downloading ? 'Descargando...' : 'Descargar PDF'}
                </button>

                <button
                  onClick={handleCaptureScreenshot}
                  disabled={capturing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {capturing ? 'Capturando...' : 'Capturar Screenshot'}
                </button>

                <button
                  onClick={togglePreviewTheme}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {previewTheme === 'light' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Tema Oscuro
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Tema Claro
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>

                <div className="flex-1"></div>

                <div className="bg-purple-100 dark:bg-purple-900 px-4 py-3 rounded-lg">
                  <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                    📄 {profileData.profile.full_name}
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {useSampleData ? 'Datos de muestra' : 'Usuario real'} • {selectedTemplate}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando datos del perfil...</p>
            </div>
          )}

          {/* CV Preview */}
          {!loading && profileData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4">
                <h3 className="text-lg font-bold">Vista Previa del CV</h3>
                <p className="text-sm text-gray-300">Esta es la vista que se descargará en PDF o screenshot</p>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-900">
                <div className={previewTheme === 'dark' ? 'dark' : ''}>
                  <div
                    ref={cvRef}
                    className="bg-white dark:bg-gray-800 shadow-2xl mx-auto"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      maxWidth: '100%'
                    }}
                  >
                    {renderTemplate()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !profileData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {useSampleData ? 'Usando Datos de Muestra' : 'Selecciona un perfil para comenzar'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {useSampleData
                  ? 'Los datos de muestra se cargarán automáticamente'
                  : 'Elige un usuario del selector de arriba o usa los datos de muestra'}
              </p>
            </div>
          )}

          {/* Info Panel */}
          <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-6 rounded-lg">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Funcionalidades del Testing Hub</h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Datos de muestra:</strong> Prueba plantillas con un perfil ficticio completo sin seleccionar usuarios reales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Galería de plantillas:</strong> Visualiza todas las plantillas disponibles en formato de galería</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Capturar screenshot:</strong> Genera imágenes PNG de alta calidad en tema claro u oscuro</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Descargar PDF:</strong> Genera un PDF de alta calidad del CV (actualmente deshabilitado)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Cambiar tema:</strong> Alterna entre tema claro y oscuro para ver cómo se adapta la plantilla</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Imprimir:</strong> Usa el botón de imprimir o Ctrl+P para imprimir directamente</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTestingHub;
