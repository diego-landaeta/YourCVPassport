import React from 'react';
import PassportTemplate from './templates/PassportTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import YellowMinimalistTemplate from './templates/YellowMinimalistTemplate';
import BlueGradientTemplate from './templates/BlueGradientTemplate';
import CoralPinkTemplate from './templates/CoralPinkTemplate';
import GreenMinimalTemplate from './templates/GreenMinimalTemplate';
import CreativeOrangeTemplate from './templates/CreativeOrangeTemplate';
import ClassicSidebarTemplate from './templates/ClassicSidebarTemplate';
import ModernCleanTemplate from './templates/ModernCleanTemplate';
import ElegantMinimalTemplate from './templates/ElegantMinimalTemplate';
import ProfessionalBlueTemplate from './templates/ProfessionalBlueTemplate';
import CreativeModernTemplate from './templates/CreativeModernTemplate';
import ModernMinimalistTemplate from './templates/ModernMinimalistTemplate';
import CreativeBoldTemplate from './templates/CreativeBoldTemplate';
import ProfessionalClassicTemplate from './templates/ProfessionalClassicTemplate';
import HealthcareProfessionalTemplate from './templates/HealthcareProfessionalTemplate';

const TemplatePreviewCapture: React.FC = () => {
    // 12 unique professional profiles
    const templates = [
        {
            name: 'Passport (New)',
            id: 'passport',
            component: PassportTemplate,
            color: '#3B82F6',
            data: {
                profile: { id: '1', full_name: 'Elena Morales Vega', headline: 'Product Manager Senior', summary: 'Líder de producto con 9 años transformando ideas en productos exitosos. Especializada en metodologías ágiles y estrategia de producto.', meta_description: 'elena.morales@product.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '1', title: 'Senior Product Manager', company_name: 'TechVentures Inc.', start_date: '2020-01-01', end_date: null, description: 'Liderazgo de roadmap de producto para plataforma SaaS. Incremento de usuarios activos en 250%.', is_current: true, created_at: new Date().toISOString() },
                    { id: '2', profile_id: '1', title: 'Product Manager', company_name: 'Digital Innovations', start_date: '2017-06-01', end_date: '2019-12-01', description: 'Desarrollo de MVP y validación de mercado. Lanzamiento de 3 productos nuevos.', is_current: false, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '1', degree: 'MBA - Gestión de Producto', institution_name: 'IE Business School', start_date: '2015-09-01', end_date: '2017-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Product Strategy', 'Agile & Scrum', 'User Research', 'Data Analytics', 'SQL'].map((name, i) => ({ id: `${i + 1}`, profile_id: '1', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Classic',
            id: 'classic',
            component: ClassicTemplate,
            color: '#1E40AF',
            data: {
                profile: { id: '2', full_name: 'Javier Sánchez Torres', headline: 'Ingeniero Civil Senior', summary: 'Ingeniero civil con 15 años liderando proyectos de infraestructura de gran escala. Especializado en gestión de obra y planificación.', meta_description: 'javier.sanchez@engineering.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '2', title: 'Ingeniero Civil Senior', company_name: 'Constructora Nacional S.A.', start_date: '2018-01-01', end_date: null, description: 'Dirección de proyectos de infraestructura vial. Gestión de presupuestos de €50M.', is_current: true, created_at: new Date().toISOString() },
                    { id: '2', profile_id: '2', title: 'Ingeniero de Proyectos', company_name: 'Obras y Servicios', start_date: '2012-03-01', end_date: '2017-12-01', description: 'Supervisión de obra civil. Control de calidad y seguridad.', is_current: false, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '2', degree: 'Ingeniería Civil', institution_name: 'Universidad Politécnica de Madrid', start_date: '2004-09-01', end_date: '2009-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['AutoCAD', 'MS Project', 'Gestión de Proyectos', 'PMP', 'BIM'].map((name, i) => ({ id: `${i + 1}`, profile_id: '2', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Minimalist Yellow',
            id: 'minimalist-yellow',
            component: YellowMinimalistTemplate,
            color: '#F59E0B',
            data: {
                profile: { id: '3', full_name: 'Laura Jiménez Castro', headline: 'Content Creator & Social Media', summary: 'Creadora de contenido con 6 años construyendo comunidades online. Experta en Instagram y TikTok.', meta_description: 'laura.jimenez@content.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '3', title: 'Social Media Strategist', company_name: 'Creative Agency Barcelona', start_date: '2021-01-01', end_date: null, description: 'Estrategia de contenido para marcas líderes. Crecimiento orgánico de 300%.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '3', degree: 'Comunicación Audiovisual', institution_name: 'Universidad de Barcelona', start_date: '2014-09-01', end_date: '2018-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Instagram & TikTok', 'Video Editing', 'Copywriting', 'Canva'].map((name, i) => ({ id: `${i + 1}`, profile_id: '3', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Gradient Blue',
            id: 'gradient-blue',
            component: BlueGradientTemplate,
            color: '#2563EB',
            data: {
                profile: { id: '4', full_name: 'Roberto Díaz Moreno', headline: 'Data Scientist | ML Engineer', summary: 'Científico de datos con 8 años desarrollando modelos predictivos y soluciones de IA.', meta_description: 'roberto.diaz@datascience.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '4', title: 'Senior Data Scientist', company_name: 'AI Solutions Corp', start_date: '2019-01-01', end_date: null, description: 'Desarrollo de modelos ML para predicción de demanda. Reducción de costos en 35%.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '4', degree: 'Máster en Data Science', institution_name: 'Universidad Carlos III', start_date: '2014-09-01', end_date: '2016-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Python & R', 'Machine Learning', 'TensorFlow', 'SQL'].map((name, i) => ({ id: `${i + 1}`, profile_id: '4', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Coral Pink',
            id: 'coral-pink',
            component: CoralPinkTemplate,
            color: '#F97316',
            data: {
                profile: { id: '5', full_name: 'Carmen López Ruiz', headline: 'Event Planner & Coordinator', summary: 'Organizadora de eventos con 7 años creando experiencias memorables. Más de 200 eventos exitosos.', meta_description: 'carmen.lopez@events.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '5', title: 'Senior Event Planner', company_name: 'Luxury Events Spain', start_date: '2020-01-01', end_date: null, description: 'Coordinación de eventos de alto nivel para clientes VIP. 98% satisfacción del cliente.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '5', degree: 'Turismo y Eventos', institution_name: 'Universidad de Valencia', start_date: '2013-09-01', end_date: '2017-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Event Planning', 'Budget Management', 'Vendor Relations'].map((name, i) => ({ id: `${i + 1}`, profile_id: '5', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Green Minimal',
            id: 'green-minimal',
            component: GreenMinimalTemplate,
            color: '#059669',
            data: {
                profile: { id: '6', full_name: 'Pablo Martínez Gil', headline: 'Sustainability Consultant', summary: 'Consultor en sostenibilidad con 10 años ayudando a empresas a implementar estrategias ESG.', meta_description: 'pablo.martinez@sustainability.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '6', title: 'ESG Consultant', company_name: 'Green Future Consulting', start_date: '2019-01-01', end_date: null, description: 'Asesoría en estrategias de sostenibilidad. Reportes ESG y certificaciones.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '6', degree: 'Ciencias Ambientales', institution_name: 'Universidad Autónoma de Madrid', start_date: '2010-09-01', end_date: '2014-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['ESG Strategy', 'ISO 14001', 'Carbon Footprint'].map((name, i) => ({ id: `${i + 1}`, profile_id: '6', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Creative Orange',
            id: 'creative-orange',
            component: CreativeOrangeTemplate,
            color: '#EA580C',
            data: {
                profile: { id: '7', full_name: 'Ana Belén Ramos', headline: 'Ilustradora & Diseñadora Gráfica', summary: 'Ilustradora creativa con 8 años creando arte digital para marcas globales.', meta_description: 'anabelen.ramos@illustration.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '7', title: 'Freelance Illustrator', company_name: 'Independiente', start_date: '2019-01-01', end_date: null, description: 'Ilustración para campañas publicitarias. Más de 100 proyectos completados.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '7', degree: 'Bellas Artes', institution_name: 'Universidad Complutense', start_date: '2012-09-01', end_date: '2016-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Adobe Illustrator', 'Procreate', 'Branding'].map((name, i) => ({ id: `${i + 1}`, profile_id: '7', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Sidebar Dark',
            id: 'classic-sidebar',
            component: ClassicSidebarTemplate,
            color: '#1E293B',
            data: {
                profile: { id: '8', full_name: 'Fernando González Pérez', headline: 'Abogado Corporativo | M&A', summary: 'Abogado especializado en derecho corporativo con 12 años de experiencia.', meta_description: 'fernando.gonzalez@legal.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '8', title: 'Senior Associate - M&A', company_name: 'Despacho Legal Internacional', start_date: '2018-01-01', end_date: null, description: 'Asesoría en fusiones y adquisiciones. Due diligence legal.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '8', degree: 'Licenciatura en Derecho', institution_name: 'Universidad de Navarra', start_date: '2007-09-01', end_date: '2012-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Corporate Law', 'M&A', 'Contract Negotiation'].map((name, i) => ({ id: `${i + 1}`, profile_id: '8', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Header Gradient',
            id: 'modern-clean',
            component: ModernCleanTemplate,
            color: '#6366F1',
            data: {
                profile: { id: '9', full_name: 'Isabel Hernández Mora', headline: 'HR Business Partner', summary: 'Profesional de RRHH con 11 años optimizando procesos de talento y cultura organizacional.', meta_description: 'isabel.hernandez@hr.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '9', title: 'HR Business Partner', company_name: 'Tech Unicorn Startup', start_date: '2020-01-01', end_date: null, description: 'Estrategia de talento para equipos tech. Employer branding y EVP.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '9', degree: 'Psicología Organizacional', institution_name: 'Universidad de Sevilla', start_date: '2010-09-01', end_date: '2014-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Talent Acquisition', 'Employer Branding', 'People Analytics'].map((name, i) => ({ id: `${i + 1}`, profile_id: '9', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Elegant Timeline',
            id: 'elegant-minimal',
            component: ElegantMinimalTemplate,
            color: '#8B5CF6',
            data: {
                profile: { id: '10', full_name: 'Diego Ramírez Ortiz', headline: 'Financial Analyst | Investment Banking', summary: 'Analista financiero con 9 años en banca de inversión y private equity.', meta_description: 'diego.ramirez@finance.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '10', title: 'Senior Financial Analyst', company_name: 'Investment Bank Madrid', start_date: '2019-01-01', end_date: null, description: 'Modelado financiero y valuación. M&A advisory.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '10', degree: 'ADE + Finanzas', institution_name: 'ICADE Universidad', start_date: '2011-09-01', end_date: '2015-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Financial Modeling', 'Valuation', 'Excel & VBA'].map((name, i) => ({ id: `${i + 1}`, profile_id: '10', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Professional Blue',
            id: 'professional-blue',
            component: ProfessionalBlueTemplate,
            color: '#0284C7',
            data: {
                profile: { id: '11', full_name: 'Marta Silva Navarro', headline: 'Operations Manager | Supply Chain', summary: 'Gerente de operaciones con 10 años optimizando cadenas de suministro.', meta_description: 'marta.silva@operations.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '11', title: 'Operations Manager', company_name: 'Global Logistics Corp', start_date: '2019-01-01', end_date: null, description: 'Optimización de supply chain end-to-end. Implementación de Lean Six Sigma.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '11', degree: 'Ingeniería Industrial', institution_name: 'Universidad Politécnica de Valencia', start_date: '2010-09-01', end_date: '2014-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Supply Chain', 'Lean Six Sigma', 'SAP & ERP'].map((name, i) => ({ id: `${i + 1}`, profile_id: '11', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Creative Banner',
            id: 'creative-modern',
            component: CreativeModernTemplate,
            color: '#DB2777',
            data: {
                profile: { id: '12', full_name: 'Andrés Castro Ruiz', headline: 'Motion Designer | Video Editor', summary: 'Diseñador de motion graphics con 7 años creando contenido audiovisual para marcas.', meta_description: 'andres.castro@motion.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '12', title: 'Senior Motion Designer', company_name: 'Motion Studio BCN', start_date: '2020-01-01', end_date: null, description: 'Creación de motion graphics para advertising. Animación de logos y branding.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '12', degree: 'Diseño Multimedia', institution_name: 'Escuela Superior de Diseño', start_date: '2014-09-01', end_date: '2017-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['After Effects', 'Cinema 4D', 'Premiere Pro'].map((name, i) => ({ id: `${i + 1}`, profile_id: '12', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Diseño Moderno Minimalista',
            id: 'modern-minimalist',
            component: ModernMinimalistTemplate,
            color: '#60A5FA',
            data: {
                profile: { id: '13', full_name: 'Carmen López Fernández', headline: 'UX/UI Designer | Product Design', summary: 'Diseñadora de experiencias digitales con 8 años creando productos centrados en el usuario.', meta_description: 'carmen.lopez@uxdesign.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '13', title: 'Senior UX Designer', company_name: 'Digital Products Studio', start_date: '2019-01-01', end_date: null, description: 'Diseño de interfaces para aplicaciones móviles y web. Research y testing con usuarios.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '13', degree: 'Diseño Gráfico', institution_name: 'Escuela de Diseño Barcelona', start_date: '2012-09-01', end_date: '2016-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems'].map((name, i) => ({ id: `${i + 1}`, profile_id: '13', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Formato Creativo Audaz',
            id: 'creative-bold',
            component: CreativeBoldTemplate,
            color: '#3B82F6',
            data: {
                profile: { id: '14', full_name: 'Miguel Ángel Ramos', headline: 'Creative Director | Brand Strategist', summary: 'Director creativo con 12 años desarrollando identidades de marca memorables para startups y corporaciones.', meta_description: 'miguel.ramos@creative.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '14', title: 'Creative Director', company_name: 'Brand Agency Madrid', start_date: '2018-01-01', end_date: null, description: 'Dirección de equipo creativo de 15 personas. Desarrollo de estrategia de marca y campañas.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '14', degree: 'Publicidad y Relaciones Públicas', institution_name: 'Universidad Complutense', start_date: '2008-09-01', end_date: '2012-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Brand Strategy', 'Art Direction', 'Adobe Creative Suite', 'Team Leadership'].map((name, i) => ({ id: `${i + 1}`, profile_id: '14', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Diseño Profesional Clásico',
            id: 'professional-classic',
            component: ProfessionalClassicTemplate,
            color: '#1F2937',
            data: {
                profile: { id: '15', full_name: 'Isabel Martínez García', headline: 'Abogada Corporativa Senior | M&A', summary: 'Abogada especializada en derecho mercantil con 14 años asesorando operaciones de M&A y reestructuraciones.', meta_description: 'isabel.martinez@legal.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '15', title: 'Senior Associate', company_name: 'Bufete Internacional Madrid', start_date: '2016-01-01', end_date: null, description: 'Asesoramiento en fusiones y adquisiciones. Due diligence y negociación de contratos.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '15', degree: 'Licenciatura en Derecho', institution_name: 'Universidad de Navarra', start_date: '2006-09-01', end_date: '2011-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Derecho Mercantil', 'M&A', 'Due Diligence', 'Negociación'].map((name, i) => ({ id: `${i + 1}`, profile_id: '15', name, created_at: new Date().toISOString() }))
            }
        },
        {
            name: 'Profesional de la Salud',
            id: 'healthcare-professional',
            component: HealthcareProfessionalTemplate,
            color: '#0EA5E9',
            data: {
                profile: { id: '16', full_name: 'Dr. Fernando Ruiz Sánchez', headline: 'Médico Especialista en Cardiología', summary: 'Cardiólogo con 16 años de experiencia clínica especializado en electrofisiología y arritmias cardíacas.', meta_description: 'dr.ruiz@hospital.com', cv_visibility: 'public', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                experiences: [
                    { id: '1', profile_id: '16', title: 'Cardiólogo', company_name: 'Hospital Universitario La Paz', start_date: '2015-01-01', end_date: null, description: 'Atención clínica de pacientes con arritmias. Implantación de marcapasos y desfibriladores.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '16', degree: 'Medicina y Cirugía', institution_name: 'Universidad Autónoma de Madrid', start_date: '2002-09-01', end_date: '2008-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Electrofisiología', 'Ecocardiografía', 'Implantes Cardíacos', 'Urgencias'].map((name, i) => ({ id: `${i + 1}`, profile_id: '16', name, created_at: new Date().toISOString() }))
            }
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-4xl font-bold text-center mb-8">All 16 Templates Preview</h1>
                <p className="text-center text-gray-600 mb-12">
                    Vista previa de todas las plantillas del dashboard con perfiles únicos
                </p>

                <div className="space-y-16">
                    {templates.map(({ name, id, component: Template, color, data }) => (
                        <div key={id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-gray-800 text-white p-4">
                                <h2 className="text-2xl font-bold">{name}</h2>
                                <p className="text-sm text-gray-300">ID: {id}</p>
                            </div>
                            <div
                                id={`template-${id}`}
                                className="transform scale-75 origin-top"
                                style={{ width: '133.33%', height: 'auto' }}
                            >
                                <Template data={data} color={color} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-blue-50 border-l-4 border-blue-500 p-6">
                    <h3 className="text-lg font-bold mb-2">Para generar las vistas previas:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Ejecuta: <code className="bg-gray-200 px-2 py-1 rounded">npm run generate-previews</code></li>
                        <li>Las imágenes se guardarán en: <code className="bg-gray-200 px-2 py-1 rounded">public/images/templates/</code></li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default TemplatePreviewCapture;
