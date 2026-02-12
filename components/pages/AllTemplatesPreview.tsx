import React from 'react';
import PassportTemplate from '../templates/PassportTemplate';
import ClassicTemplate from '../templates/ClassicTemplate';
import YellowMinimalistTemplate from '../templates/YellowMinimalistTemplate';
import BlueGradientTemplate from '../templates/BlueGradientTemplate';
import CoralPinkTemplate from '../templates/CoralPinkTemplate';
import GreenMinimalTemplate from '../templates/GreenMinimalTemplate';
import CreativeOrangeTemplate from '../templates/CreativeOrangeTemplate';
import ClassicSidebarTemplate from '../templates/ClassicSidebarTemplate';
import ModernCleanTemplate from '../templates/ModernCleanTemplate';
import ElegantMinimalTemplate from '../templates/ElegantMinimalTemplate';
import ProfessionalBlueTemplate from '../templates/ProfessionalBlueTemplate';
import CreativeModernTemplate from '../templates/CreativeModernTemplate';

const AllTemplatesPreview: React.FC = () => {
    // 12 unique profiles - one for each template
    const templates = [
        {
            name: 'Passport (New)',
            id: 'passport',
            component: PassportTemplate,
            color: '#3B82F6',
            data: {
                profile: { 
                    id: '1', 
                    full_name: 'Elena Morales Vega', 
                    headline: 'Product Manager Senior', 
                    summary: 'Líder de producto con 9 años transformando ideas en productos exitosos. Especializada en metodologías ágiles y estrategia de producto.', 
                    meta_description: 'elena.morales@product.com', 
                    cv_visibility: 'public', 
                    created_at: new Date().toISOString(), 
                    updated_at: new Date().toISOString(),
                    // Add missing properties to satisfy FullProfileData
                    certifications: [],
                    languages: [],
                    services: [],
                    stats: [],
                    portfolioItems: []
                },
                experiences: [
                    { id: '1', profile_id: '1', position: 'Senior Product Manager', company_name: 'TechVentures Inc.', start_date: '2020-01-01', end_date: null, description: 'Liderazgo de roadmap de producto para plataforma SaaS. Incremento de usuarios activos en 250%.', is_current: true, created_at: new Date().toISOString() },
                    { id: '2', profile_id: '1', position: 'Product Manager', company_name: 'Digital Innovations', start_date: '2017-06-01', end_date: '2019-12-01', description: 'Desarrollo de MVP y validación de mercado. Lanzamiento de 3 productos nuevos.', is_current: false, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '1', field_of_study: 'General', degree: 'MBA - Gestión de Producto', institution_name: 'IE Business School', start_date: '2015-09-01', end_date: '2017-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Product Strategy', 'Agile & Scrum', 'User Research', 'Data Analytics', 'SQL'].map((name, i) => ({ id: `${i + 1}`, profile_id: '1', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '2', position: 'Ingeniero Civil Senior', company_name: 'Constructora Nacional S.A.', start_date: '2018-01-01', end_date: null, description: 'Dirección de proyectos de infraestructura vial. Gestión de presupuestos de €50M.', is_current: true, created_at: new Date().toISOString() },
                    { id: '2', profile_id: '2', position: 'Ingeniero de Proyectos', company_name: 'Obras y Servicios', start_date: '2012-03-01', end_date: '2017-12-01', description: 'Supervisión de obra civil. Control de calidad y seguridad.', is_current: false, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '2', field_of_study: 'General', degree: 'Ingeniería Civil', institution_name: 'Universidad Politécnica de Madrid', start_date: '2004-09-01', end_date: '2009-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['AutoCAD', 'MS Project', 'Gestión de Proyectos', 'PMP', 'BIM'].map((name, i) => ({ id: `${i + 1}`, profile_id: '2', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '3', position: 'Social Media Strategist', company_name: 'Creative Agency Barcelona', start_date: '2021-01-01', end_date: null, description: 'Estrategia de contenido para marcas líderes. Crecimiento orgánico de 300%.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '3', field_of_study: 'General', degree: 'Comunicación Audiovisual', institution_name: 'Universidad de Barcelona', start_date: '2014-09-01', end_date: '2018-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Instagram & TikTok', 'Video Editing', 'Copywriting', 'Canva'].map((name, i) => ({ id: `${i + 1}`, profile_id: '3', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '4', position: 'Senior Data Scientist', company_name: 'AI Solutions Corp', start_date: '2019-01-01', end_date: null, description: 'Desarrollo de modelos ML para predicción de demanda. Reducción de costos en 35%.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '4', field_of_study: 'General', degree: 'Máster en Data Science', institution_name: 'Universidad Carlos III', start_date: '2014-09-01', end_date: '2016-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Python & R', 'Machine Learning', 'TensorFlow', 'SQL'].map((name, i) => ({ id: `${i + 1}`, profile_id: '4', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '5', position: 'Senior Event Planner', company_name: 'Luxury Events Spain', start_date: '2020-01-01', end_date: null, description: 'Coordinación de eventos de alto nivel para clientes VIP. 98% satisfacción del cliente.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '5', field_of_study: 'General', degree: 'Turismo y Eventos', institution_name: 'Universidad de Valencia', start_date: '2013-09-01', end_date: '2017-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Event Planning', 'Budget Management', 'Vendor Relations'].map((name, i) => ({ id: `${i + 1}`, profile_id: '5', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '6', position: 'ESG Consultant', company_name: 'Green Future Consulting', start_date: '2019-01-01', end_date: null, description: 'Asesoría en estrategias de sostenibilidad. Reportes ESG y certificaciones.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '6', field_of_study: 'General', degree: 'Ciencias Ambientales', institution_name: 'Universidad Autónoma de Madrid', start_date: '2010-09-01', end_date: '2014-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['ESG Strategy', 'ISO 14001', 'Carbon Footprint'].map((name, i) => ({ id: `${i + 1}`, profile_id: '6', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '7', position: 'Freelance Illustrator', company_name: 'Independiente', start_date: '2019-01-01', end_date: null, description: 'Ilustración para campañas publicitarias. Más de 100 proyectos completados.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '7', field_of_study: 'General', degree: 'Bellas Artes', institution_name: 'Universidad Complutense', start_date: '2012-09-01', end_date: '2016-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Adobe Illustrator', 'Procreate', 'Branding'].map((name, i) => ({ id: `${i + 1}`, profile_id: '7', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '8', position: 'Senior Associate - M&A', company_name: 'Despacho Legal Internacional', start_date: '2018-01-01', end_date: null, description: 'Asesoría en fusiones y adquisiciones. Due diligence legal.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '8', field_of_study: 'General', degree: 'Licenciatura en Derecho', institution_name: 'Universidad de Navarra', start_date: '2007-09-01', end_date: '2012-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Corporate Law', 'M&A', 'Contract Negotiation'].map((name, i) => ({ id: `${i + 1}`, profile_id: '8', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '9', position: 'HR Business Partner', company_name: 'Tech Unicorn Startup', start_date: '2020-01-01', end_date: null, description: 'Estrategia de talento para equipos tech. Employer branding y EVP.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '9', field_of_study: 'General', degree: 'Psicología Organizacional', institution_name: 'Universidad de Sevilla', start_date: '2010-09-01', end_date: '2014-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Talent Acquisition', 'Employer Branding', 'People Analytics'].map((name, i) => ({ id: `${i + 1}`, profile_id: '9', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '10', position: 'Senior Financial Analyst', company_name: 'Investment Bank Madrid', start_date: '2019-01-01', end_date: null, description: 'Modelado financiero y valuación. M&A advisory.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '10', field_of_study: 'General', degree: 'ADE + Finanzas', institution_name: 'ICADE Universidad', start_date: '2011-09-01', end_date: '2015-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Financial Modeling', 'Valuation', 'Excel & VBA'].map((name, i) => ({ id: `${i + 1}`, profile_id: '10', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '11', position: 'Operations Manager', company_name: 'Global Logistics Corp', start_date: '2019-01-01', end_date: null, description: 'Optimización de supply chain end-to-end. Implementación de Lean Six Sigma.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '11', field_of_study: 'General', degree: 'Ingeniería Industrial', institution_name: 'Universidad Politécnica de Valencia', start_date: '2010-09-01', end_date: '2014-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['Supply Chain', 'Lean Six Sigma', 'SAP & ERP'].map((name, i) => ({ id: `${i + 1}`, profile_id: '11', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
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
                    { id: '1', profile_id: '12', position: 'Senior Motion Designer', company_name: 'Motion Studio BCN', start_date: '2020-01-01', end_date: null, description: 'Creación de motion graphics para advertising. Animación de logos y branding.', is_current: true, created_at: new Date().toISOString() }
                ],
                education: [{ id: '1', profile_id: '12', field_of_study: 'General', degree: 'Diseño Multimedia', institution_name: 'Escuela Superior de Diseño', start_date: '2014-09-01', end_date: '2017-06-01', description: null, created_at: new Date().toISOString() }],
                skills: ['After Effects', 'Cinema 4D', 'Premiere Pro'].map((name, i) => ({ id: `${i + 1}`, profile_id: '12', name, created_at: new Date().toISOString() })),
                certifications: [],
                languages: [],
                services: [],
                stats: [],
                portfolioItems: []
            }
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-4xl font-bold text-center mb-8">All 12 Templates Preview</h1>
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
                        <li>Ejecuta: <code className="bg-gray-200 px-2 py-1 rounded">npm run generate-all-previews</code></li>
                        <li>Las imágenes se guardarán en: <code className="bg-gray-200 px-2 py-1 rounded">public/images/templates/</code></li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default AllTemplatesPreview;
