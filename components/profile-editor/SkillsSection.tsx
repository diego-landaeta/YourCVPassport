import React, { useState, lazy, Suspense, useImperativeHandle, forwardRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SkillFormData } from '../../schemas/profileSchemas';
import { getProfileSchemas } from '../../schemas/getProfileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import { useToastContext } from '../../contexts/ToastContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Lazy load AISkillsSuggestion
const AISkillsSuggestion = lazy(() => import('./AISkillsSuggestion'));

interface SkillsSectionProps {
  initialData?: SkillFormData[];
  onSave: (data: SkillFormData[]) => Promise<void>;
  onNext?: () => void;
}

export interface SkillsSectionHandle {
  toggleAISuggestions: () => void;
}

// Common skills for autocomplete - Extended with diverse categories (English + Spanish)
const COMMON_SKILLS = [
  // Programming Languages (EN + ES)
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'Dart', 'R', 'MATLAB', 'Scala',
  'Perl', 'Elixir', 'Haskell', 'Lua', 'Julia',

  // Web & Mobile Development
  'HTML5', 'CSS3', 'SASS', 'LESS', 'Tailwind CSS', 'Bootstrap', 'Material UI',
  'Vue.js', 'Angular', 'Next.js', 'Gatsby', 'Nuxt.js', 'Svelte', 'jQuery',
  'React Native', 'Flutter', 'Ionic', 'Xamarin', 'SwiftUI',
  'Desarrollo Web', 'Desarrollo Móvil', 'Diseño Responsive', 'Progressive Web Apps',

  // Backend & Databases
  'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Cassandra', 'DynamoDB',
  'Firebase', 'Oracle', 'MariaDB', 'SQLite', 'Elasticsearch', 'Neo4j',
  'GraphQL', 'REST API', 'SOAP', 'gRPC', 'WebSockets',
  'Bases de Datos', 'Modelado de Datos', 'APIs', 'Backend Development',

  // DevOps & Cloud
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Heroku', 'DigitalOcean',
  'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
  'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant', 'Nginx', 'Apache',
  'CI/CD', 'Microservices', 'Serverless', 'Computación en la Nube',

  // Tools & Version Control
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
  'VS Code', 'IntelliJ IDEA', 'Eclipse', 'Vim', 'Emacs',
  'Jira', 'Confluence', 'Trello', 'Asana', 'Monday.com', 'Notion',
  'Control de Versiones', 'Gestión de Proyectos',

  // Design & Creative
  'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin',
  'Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Premiere Pro',
  'Lightroom', 'CorelDRAW', 'Canva', 'Blender', '3D Modeling', 'AutoCAD',
  'SketchUp', 'Prototyping', 'Wireframing', 'User Research', 'Design Thinking',
  'Color Theory', 'Typography', 'Brand Identity', 'Motion Graphics',
  'Diseño UI/UX', 'Diseño Gráfico', 'Diseño Web', 'Prototipado', 'Identidad de Marca',

  // Data & Analytics
  'Data Analysis', 'Data Visualization', 'Business Intelligence', 'ETL',
  'Tableau', 'Power BI', 'Looker', 'Google Analytics', 'Mixpanel',
  'Machine Learning', 'Deep Learning', 'Natural Language Processing',
  'Computer Vision', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
  'Pandas', 'NumPy', 'Jupyter', 'Apache Spark', 'Hadoop', 'Airflow',
  'Data Mining', 'Statistical Analysis', 'A/B Testing', 'Predictive Modeling',
  'Análisis de Datos', 'Visualización de Datos', 'Inteligencia Artificial',
  'Aprendizaje Automático', 'Ciencia de Datos', 'Big Data',

  // Business & Management
  'Project Management', 'Product Management', 'Agile', 'Scrum', 'Kanban',
  'Lean', 'Six Sigma', 'Strategic Planning', 'Business Development',
  'Market Research', 'Competitive Analysis', 'Financial Planning', 'Budgeting',
  'Risk Management', 'Change Management', 'Stakeholder Management',
  'Resource Planning', 'Process Improvement', 'KPI Tracking', 'OKRs',
  'Gestión de Proyectos', 'Gestión de Productos', 'Planificación Estratégica',
  'Desarrollo de Negocios', 'Investigación de Mercado', 'Análisis Competitivo',

  // Soft Skills (EN + ES)
  'Leadership', 'Team Management', 'Communication', 'Public Speaking',
  'Presentation Skills', 'Negotiation', 'Conflict Resolution', 'Critical Thinking',
  'Problem Solving', 'Decision Making', 'Time Management', 'Adaptability',
  'Creativity', 'Emotional Intelligence', 'Mentoring', 'Coaching',
  'Active Listening', 'Collaboration', 'Customer Service', 'Networking',
  'Liderazgo', 'Gestión de Equipos', 'Comunicación', 'Oratoria',
  'Habilidades de Presentación', 'Negociación', 'Resolución de Conflictos',
  'Pensamiento Crítico', 'Resolución de Problemas', 'Toma de Decisiones',
  'Gestión del Tiempo', 'Adaptabilidad', 'Creatividad', 'Inteligencia Emocional',
  'Mentoría', 'Coaching', 'Escucha Activa', 'Colaboración', 'Servicio al Cliente',
  'Trabajo en Equipo', 'Empatía', 'Motivación', 'Delegación', 'Organización',

  // Marketing & Sales (EN + ES)
  'Digital Marketing', 'SEO', 'SEM', 'Content Marketing', 'Email Marketing',
  'Social Media Marketing', 'Facebook Ads', 'Google Ads', 'LinkedIn Marketing',
  'Influencer Marketing', 'Affiliate Marketing', 'Growth Hacking',
  'Marketing Automation', 'CRM', 'Salesforce', 'HubSpot', 'Mailchimp',
  'Copywriting', 'Content Strategy', 'Brand Management', 'Product Marketing',
  'Sales Strategy', 'B2B Sales', 'B2C Sales', 'Account Management',
  'Marketing Digital', 'Estrategia de Contenido', 'Gestión de Marca', 'Ventas',
  'Publicidad Digital', 'Redes Sociales', 'Growth Hacking', 'Analítica Web',

  // Finance & Accounting (EN + ES)
  'Financial Analysis', 'Accounting', 'Bookkeeping', 'Tax Preparation',
  'Auditing', 'QuickBooks', 'SAP', 'Excel', 'Financial Modeling',
  'Investment Analysis', 'Corporate Finance', 'Cost Accounting',
  'GAAP', 'IFRS', 'Payroll', 'Forecasting', 'Variance Analysis',
  'Análisis Financiero', 'Contabilidad', 'Finanzas', 'Auditoría', 'Presupuestos',

  // Human Resources (EN + ES)
  'Recruitment', 'Talent Acquisition', 'Onboarding', 'Performance Management',
  'Employee Relations', 'Compensation & Benefits', 'Training & Development',
  'HR Analytics', 'Workforce Planning', 'Diversity & Inclusion',
  'Labor Law', 'Organizational Development', 'HRIS', 'Workday', 'BambooHR',
  'Recursos Humanos', 'Reclutamiento', 'Gestión del Talento', 'Capacitación',
  'Nómina', 'Desarrollo Organizacional', 'Selección de Personal',

  // Healthcare & Medical (EN + ES)
  'Patient Care', 'Medical Diagnosis', 'Treatment Planning', 'EMR/EHR',
  'HIPAA Compliance', 'Clinical Research', 'Pharmacology', 'Nursing',
  'Physical Therapy', 'Occupational Therapy', 'Medical Coding', 'CPT/ICD',
  'Healthcare Administration', 'Medical Writing', 'Telemedicine',
  'Atención al Paciente', 'Diagnóstico Médico', 'Investigación Clínica',
  'Enfermería', 'Farmacología', 'Telemedicina', 'Salud',

  // Education & Training (EN + ES)
  'Curriculum Development', 'Instructional Design', 'E-Learning', 'LMS',
  'Classroom Management', 'Student Assessment', 'Educational Technology',
  'Tutoring', 'Workshop Facilitation', 'Corporate Training', 'Moodle',
  'Canvas', 'Blackboard', 'Educational Psychology', 'Lesson Planning',
  'Educación', 'Diseño Instruccional', 'Formación', 'Capacitación',
  'Docencia', 'Pedagogía', 'E-Learning', 'Tutoría',

  // Legal (EN + ES)
  'Legal Research', 'Contract Drafting', 'Contract Negotiation', 'Litigation',
  'Compliance', 'Corporate Law', 'Intellectual Property', 'Patent Law',
  'Employment Law', 'Real Estate Law', 'Legal Writing', 'Case Management',
  'Derecho', 'Asesoría Legal', 'Redacción de Contratos', 'Litigio',
  'Derecho Corporativo', 'Propiedad Intelectual', 'Cumplimiento Legal',

  // Engineering & Manufacturing (EN + ES)
  'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Industrial Engineering', 'CAD', 'CAM', 'SolidWorks',
  'MATLAB', 'Simulation', 'Quality Control', 'Lean Manufacturing',
  'Supply Chain', 'Logistics', 'Inventory Management', 'Production Planning',
  'ISO Standards', 'GMP', 'Process Engineering', 'Root Cause Analysis',
  'Ingeniería', 'Ingeniería Mecánica', 'Ingeniería Civil', 'Control de Calidad',
  'Manufactura', 'Cadena de Suministro', 'Logística', 'Producción',

  // Testing & Quality Assurance (EN + ES)
  'TDD', 'BDD', 'Unit Testing', 'Integration Testing', 'E2E Testing',
  'Manual Testing', 'Automated Testing', 'Performance Testing', 'Security Testing',
  'Jest', 'Mocha', 'Chai', 'Selenium', 'Cypress', 'Playwright', 'TestNG',
  'Quality Assurance', 'Test Planning', 'Bug Tracking', 'Load Testing',
  'Regression Testing', 'UAT', 'Test Automation', 'Appium',
  'Pruebas de Software', 'QA', 'Testing', 'Automatización de Pruebas',

  // Cybersecurity & Information Security (EN + ES)
  'Cybersecurity', 'Penetration Testing', 'Ethical Hacking', 'Network Security',
  'Security Auditing', 'Vulnerability Assessment', 'Incident Response',
  'SIEM', 'Firewall Management', 'IDS/IPS', 'Cryptography', 'SSL/TLS',
  'Security Compliance', 'ISO 27001', 'SOC 2', 'GDPR', 'PCI DSS',
  'Threat Intelligence', 'Malware Analysis', 'Security Architecture',
  'Identity Management', 'Access Control', 'Risk Assessment', 'Forensics',
  'Ciberseguridad', 'Seguridad Informática', 'Hacking Ético', 'Auditoría de Seguridad',

  // Architecture & Infrastructure (EN + ES)
  'Solution Architecture', 'Enterprise Architecture', 'System Design',
  'Cloud Architecture', 'Network Architecture', 'Microservices Architecture',
  'API Design', 'Scalability', 'High Availability', 'Disaster Recovery',
  'Infrastructure as Code', 'Monitoring', 'Observability', 'Prometheus',
  'Grafana', 'ELK Stack', 'Splunk', 'New Relic', 'Datadog',
  'Arquitectura de Software', 'Diseño de Sistemas', 'Infraestructura',

  // Blockchain & Web3 (EN + ES)
  'Blockchain', 'Smart Contracts', 'Solidity', 'Ethereum', 'Web3',
  'Cryptocurrency', 'DeFi', 'NFT', 'Hyperledger', 'Truffle',
  'MetaMask', 'Decentralized Applications', 'Consensus Algorithms',
  'Criptomonedas', 'Contratos Inteligentes',

  // Gaming & Game Development (EN + ES)
  'Unity', 'Unreal Engine', 'Game Design', 'Game Development', 'C# for Games',
  '3D Animation', 'Level Design', 'Game Physics', 'Shader Programming',
  'Godot', 'GameMaker', 'Pixel Art', 'Character Design', 'VR Development',
  'AR Development', 'Mobile Gaming', 'Multiplayer Networking',
  'Desarrollo de Videojuegos', 'Diseño de Juegos', 'Animación 3D',

  // Video & Audio Production (EN + ES)
  'Video Editing', 'Audio Engineering', 'Sound Design', 'Music Production',
  'Final Cut Pro', 'DaVinci Resolve', 'Avid Media Composer', 'Pro Tools',
  'Logic Pro', 'Ableton Live', 'FL Studio', 'Voice Over', 'Podcasting',
  'Live Streaming', 'OBS Studio', 'Camera Operation', 'Lighting',
  'Color Grading', 'Audio Mixing', 'Mastering', 'Foley',
  'Edición de Video', 'Producción de Audio', 'Producción Musical', 'Locución',

  // E-commerce & Retail (EN + ES)
  'E-commerce Management', 'Shopify', 'WooCommerce', 'Magento', 'BigCommerce',
  'Amazon FBA', 'Dropshipping', 'Inventory Management', 'Order Fulfillment',
  'Payment Gateways', 'Conversion Optimization', 'Product Photography',
  'Merchandising', 'Retail Management', 'POS Systems', 'Category Management',
  'Comercio Electrónico', 'Gestión de Inventario', 'Ventas Online',

  // Writing & Content Creation (EN + ES)
  'Creative Writing', 'Copywriting', 'Technical Writing', 'Content Creation',
  'Blog Writing', 'SEO Writing', 'Journalism', 'Editing', 'Proofreading',
  'Scriptwriting', 'Grant Writing', 'Proposal Writing', 'Press Releases',
  'Social Media Content', 'Newsletter Writing', 'UX Writing', 'Storytelling',
  'Redacción', 'Escritura Creativa', 'Redacción Técnica', 'Periodismo',
  'Corrección de Estilo', 'Creación de Contenido',

  // Translation & Localization (EN + ES)
  'Translation', 'Localization', 'Subtitling', 'Transcription', 'Interpretation',
  'CAT Tools', 'SDL Trados', 'MemoQ', 'Cultural Adaptation', 'Multilingual SEO',
  'Traducción', 'Localización', 'Interpretación', 'Subtitulado', 'Transcripción',

  // Real Estate & Property Management (EN + ES)
  'Real Estate', 'Property Management', 'Leasing', 'Real Estate Marketing',
  'Property Valuation', 'Tenant Relations', 'Contract Management',
  'Real Estate Law', 'MLS', 'Real Estate CRM', 'Building Maintenance',
  'Bienes Raíces', 'Gestión Inmobiliaria', 'Valuación de Propiedades',

  // Hospitality & Tourism
  'Hospitality Management', 'Hotel Management', 'Front Desk Operations',
  'Guest Services', 'Restaurant Management', 'Food & Beverage',
  'Event Management', 'Catering', 'Tourism Management', 'Travel Planning',
  'Reservation Systems', 'PMS Software', 'Concierge Services',

  // Agriculture & Environmental
  'Agriculture', 'Sustainable Farming', 'Crop Management', 'Soil Science',
  'Environmental Science', 'Environmental Compliance', 'Sustainability',
  'Climate Change', 'Renewable Energy', 'Solar Energy', 'Wind Energy',
  'Carbon Footprint Analysis', 'Environmental Impact Assessment', 'GIS',

  // Construction & Architecture
  'Construction Management', 'Project Estimation', 'Building Codes',
  'Architecture', 'Architectural Design', 'BIM', 'Revit', 'ArchiCAD',
  'Site Supervision', 'Quantity Surveying', 'Construction Safety',
  'LEED Certification', 'Structural Engineering', 'MEP Design',

  // Telecommunications
  'Telecommunications', 'Network Engineering', 'VoIP', 'Wireless Networks',
  '5G Technology', 'Fiber Optics', 'Routing & Switching', 'Cisco',
  'Network Protocols', 'LAN/WAN', 'VPN', 'BGP', 'OSPF', 'MPLS',

  // Automotive & Transportation
  'Automotive Engineering', 'Vehicle Diagnostics', 'Auto Mechanics',
  'Electric Vehicles', 'Autonomous Vehicles', 'Transportation Planning',
  'Fleet Management', 'Logistics Optimization', 'Route Planning',

  // Scientific Research
  'Research Methodology', 'Laboratory Techniques', 'Data Collection',
  'Statistical Software', 'SPSS', 'SAS', 'Scientific Writing',
  'Peer Review', 'Grant Application', 'Experiment Design', 'Literature Review',
  'Bioinformatics', 'Genomics', 'Proteomics', 'Chemistry', 'Physics',
  'Biology', 'Microbiology', 'Molecular Biology', 'Cell Culture',

  // Customer Success & Support
  'Customer Support', 'Customer Success', 'Technical Support', 'Help Desk',
  'Zendesk', 'Freshdesk', 'Intercom', 'Customer Retention',
  'Onboarding', 'Client Relations', 'Account Management', 'Ticketing Systems',
  'Live Chat Support', 'Phone Support', 'Email Support', 'SLA Management',

  // Sports & Fitness (Professional)
  'Personal Training', 'Fitness Coaching', 'Nutrition Planning', 'Sports Coaching',
  'Athletic Training', 'Physical Conditioning', 'Injury Prevention', 'Rehabilitation',
  'Sports Psychology', 'Exercise Physiology', 'Wellness Coaching', 'Kinesiology',
  'Sports Medicine', 'Athletic Performance', 'Biomechanics',

  // Arts & Creative Professions
  'Fine Art', 'Digital Art', 'Illustration', 'Graphic Design', 'Portrait Art',
  'Commercial Art', 'Art Direction', 'Visual Arts', 'Concept Art',
  'Music Composition', 'Music Theory', 'Music Production', 'Sound Engineering',
  'Music Education', 'Audio Production', 'Musical Direction',

  // Fashion Industry
  'Fashion Design', 'Pattern Making', 'Garment Construction', 'Textile Design',
  'Fashion Merchandising', 'Fashion Buying', 'Trend Forecasting', 'Fashion Marketing',
  'Apparel Production', 'Quality Control Fashion', 'Fashion Illustration',

  // Culinary & Food Service (Professional)
  'Culinary Arts', 'Pastry Arts', 'Menu Planning', 'Recipe Development',
  'Food Cost Control', 'Kitchen Management', 'Restaurant Management',
  'Food Safety', 'HACCP', 'ServSafe', 'Dietary Planning', 'Nutrition Science',
  'Catering Management', 'Food Service Operations', 'Beverage Management',
  'Wine Knowledge', 'Food & Beverage Cost Analysis',

  // Social Services & Nonprofit
  'Social Work', 'Case Management', 'Crisis Intervention', 'Counseling',
  'Community Outreach', 'Nonprofit Management', 'Fundraising', 'Grant Writing',
  'Volunteer Coordination', 'Program Development', 'Advocacy', 'Child Welfare',
  'Elder Care', 'Mental Health Support', 'Substance Abuse Counseling',
  'Family Therapy', 'Group Facilitation', 'Conflict Mediation',
  'Disaster Relief', 'Humanitarian Aid', 'Community Development',

  // Psychology & Counseling
  'Clinical Psychology', 'Psychological Assessment', 'Cognitive Behavioral Therapy',
  'Psychotherapy', 'Marriage Counseling', 'Career Counseling', 'Life Coaching',
  'Mindfulness', 'Meditation', 'Stress Management', 'Grief Counseling',
  'Trauma Therapy', 'Child Psychology', 'Adolescent Counseling',
  'Behavioral Analysis', 'Psychological Testing', 'Therapeutic Techniques',

  // Library & Information Science
  'Library Management', 'Cataloging', 'Reference Services', 'Archives Management',
  'Information Retrieval', 'Digital Libraries', 'Library Systems', 'Research Assistance',
  'Collection Development', 'Metadata', 'Information Literacy', 'Dewey Decimal',
  'Library of Congress Classification', 'Database Searching', 'Interlibrary Loan',

  // Veterinary & Animal Care
  'Veterinary Medicine', 'Animal Care', 'Pet Grooming', 'Animal Training',
  'Dog Training', 'Veterinary Nursing', 'Animal Behavior', 'Wildlife Care',
  'Equine Care', 'Animal Nutrition', 'Pet Sitting', 'Kennel Management',
  'Animal Rescue', 'Zoo Keeping', 'Aquarium Management', 'Pet First Aid',

  // Emergency Services & Safety
  'Emergency Medical Services', 'Paramedic', 'EMT', 'First Aid', 'CPR',
  'Firefighting', 'Fire Safety', 'Emergency Response', 'Disaster Management',
  'Search and Rescue', 'Crisis Management', 'Emergency Planning',
  'Occupational Safety', 'OSHA Compliance', 'Safety Training', 'Risk Assessment',
  'Safety Inspections', 'Hazmat', 'Industrial Safety', 'Construction Safety',

  // Aviation & Maritime
  'Pilot License', 'Aviation', 'Flight Operations', 'Air Traffic Control',
  'Aircraft Maintenance', 'Aviation Safety', 'Navigation', 'Flight Planning',
  'Maritime Operations', 'Ship Navigation', 'Marine Engineering', 'Sailing',
  'Boating', 'Maritime Law', 'Cargo Operations', 'Port Management',

  // Photography & Videography (Extended)
  'Portrait Photography', 'Wedding Photography', 'Event Photography',
  'Commercial Photography', 'Fashion Photography', 'Product Photography',
  'Real Estate Photography', 'Food Photography', 'Wildlife Photography',
  'Sports Photography', 'Photojournalism', 'Studio Photography', 'Lighting Setup',
  'Photo Retouching', 'Drone Photography', 'Aerial Photography', 'Cinematography',
  'Video Production', 'Documentary Filmmaking', 'Commercial Videography',

  // Religious & Spiritual Services (Professional)
  'Ministry', 'Pastoral Care', 'Religious Education', 'Theology', 'Chaplaincy',
  'Youth Ministry', 'Religious Administration', 'Faith-based Counseling',

  // Skilled Trades & Technical Services
  'Plumbing', 'Electrical Systems', 'HVAC Systems', 'Carpentry', 'Welding',
  'Masonry', 'Roofing', 'Construction', 'Flooring Installation', 'Drywall',
  'Landscape Architecture', 'Horticulture', 'Irrigation Systems',
  'Locksmith Services', 'Appliance Repair', 'Solar Installation',
  'Concrete Construction', 'Heavy Equipment Operation', 'Equipment Maintenance',

  // Wellness & Therapeutic Services (Professional)
  'Massage Therapy', 'Physical Rehabilitation', 'Therapeutic Massage',
  'Sports Massage', 'Chiropractic Care', 'Acupuncture', 'Physical Therapy',
  'Occupational Therapy', 'Spa Management', 'Wellness Program Design',
  'Holistic Health Consulting', 'Health & Wellness Coaching',

  // Public Relations & Communications
  'Public Relations', 'Media Relations', 'Press Relations', 'Crisis Communication',
  'Corporate Communications', 'Internal Communications', 'Stakeholder Engagement',
  'Speech Writing', 'Media Training', 'Brand Communication', 'Reputation Management',
  'Social Media Management', 'Community Management', 'Influencer Relations',

  // Event Management (Extended)
  'Wedding Planning', 'Conference Planning', 'Trade Show Management',
  'Festival Organization', 'Concert Production', 'Corporate Events',
  'Fundraising Events', 'Virtual Events', 'Event Marketing', 'Event Budgeting',
  'Event Logistics', 'Venue Selection', 'Catering Coordination', 'Entertainment Booking',

  // Import/Export & International Trade
  'Import/Export', 'International Trade', 'Customs Compliance', 'Freight Forwarding',
  'Trade Compliance', 'Tariffs', 'International Logistics', 'Cross-Border Trade',
  'Trade Documentation', 'Incoterms', 'Export Documentation', 'Customs Brokerage',

  // Insurance
  'Insurance Underwriting', 'Claims Processing', 'Risk Analysis', 'Policy Administration',
  'Insurance Sales', 'Life Insurance', 'Health Insurance', 'Property Insurance',
  'Casualty Insurance', 'Actuarial Science', 'Insurance Law', 'Claims Adjustment',

  // Other Professional Skills
  'Documentation', 'Research', 'Event Planning', 'Vendor Management',
  'Contract Management', 'Reporting', 'Data Entry', 'Administrative Support',
  'Office Management', 'Travel Coordination', 'Calendar Management',
  'Microsoft Office', 'Google Workspace', 'Slack', 'Zoom', 'Microsoft Teams',
  'Scheduling', 'Meeting Coordination', 'Minute Taking', 'Filing Systems',
  'Virtual Assistance', 'Business Writing', 'Spreadsheet Management',
  'Database Management', 'CRM Management', 'Workflow Optimization',
  'Typing Speed', 'Data Processing', 'Record Keeping', 'Office Equipment',
  'Reception', 'Phone Etiquette', 'Multi-tasking', 'Organizational Skills',
];

interface SortableSkillItemProps {
  skill: SkillFormData;
  onEdit: () => void;
  onDelete: () => void;
  translations: any;
}

const SortableSkillItem: React.FC<SortableSkillItemProps> = ({ skill, onEdit, onDelete, translations }) => {
  const modals = translations.dashboard.modals;
  const { lang } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: skill.id || `temp-${skill.name}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'BEGINNER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'INTERMEDIATE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ADVANCED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'EXPERT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getLevelTranslation = (level?: string) => {
    if (!level) return '';
    switch (level.toUpperCase()) {
      case 'BEGINNER': return modals.beginner;
      case 'INTERMEDIATE': return modals.intermediate;
      case 'ADVANCED': return modals.advanced;
      case 'EXPERT': return modals.expert;
      default: return level.toLowerCase();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-3 border border-gray-200 dark:border-dark-border flex items-center gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
          {skill.level && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${getLevelColor(skill.level)}`}>
              {getLevelTranslation(skill.level)}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        <button type="button" onClick={onEdit} className="text-cv-blue hover:text-cv-blue-dark p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const SkillsSection = forwardRef<SkillsSectionHandle, SkillsSectionProps>(({ initialData = [], onSave, onNext }, ref) => {
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const t = translations.profileEditor.skills;
  const { session } = useAuth();
  const { lang } = useLanguage();
  const toast = useToastContext();

  // Get schemas with translated error messages
  const { skillSchema } = useMemo(() => getProfileSchemas(translations), [translations]);

  const [skills, setSkills] = useState<SkillFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Detectar si estamos en modo wizard (onNext presente = wizard mode)
  const isWizardMode = !!onNext;

  // Sync local state with initialData when it changes
  React.useEffect(() => {
    setSkills(initialData);
  }, [initialData]);

  // Expose toggleAISuggestions method to parent component
  useImperativeHandle(ref, () => ({
    toggleAISuggestions: () => {
      setShowAISuggestions(prev => !prev);
    },
  }));

  // Load skills from database
  const loadSkills = React.useCallback(async () => {
    if (!session?.user.id) return;const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('profile_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {} else {setSkills(data || []);
    }
  }, [session?.user.id]);

  // Load experiences for AI suggestions
  React.useEffect(() => {
    const loadExperiences = async () => {
      if (!session?.user.id) return;const { data, error } = await supabase
        .from('experiences')
        .select('position, company_name, description')
        .eq('profile_id', session.user.id)
        .order('start_date', { ascending: false });

      if (error) {} else {// Map position to title for compatibility with AISkillsSuggestion
        const mappedData = data.map(exp => ({
          title: exp.position,
          company_name: exp.company_name,
          description: exp.description || ''
        }));
        setExperiences(mappedData);
      }
    };

    loadExperiences();
  }, [session]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
  });

  const watchedLevel = watch('level');

  // Log de errores de validación
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {}
  }, [errors]);

  // DISABLED: Auto-save draft functionality was causing issues with form editing
  // The draft was interfering with normal editing operations and showing unwanted dialogs

  // Improved filtering: Show skills based on active language and exclude existing skills
  const filteredSuggestions = React.useMemo(() => {
    if (!searchTerm) return [];

    const searchLower = searchTerm.toLowerCase();

    // Get existing skill names (excluding the one being edited)
    const existingSkillNames = skills
      .filter((_, idx) => idx !== editingIndex)
      .map(skill => skill.name.toLowerCase());

    // Language-specific skill keywords to determine if a skill is in Spanish
    const spanishIndicators = ['ción', 'ía', 'ñ', 'ó', 'á', 'é', 'ú'];
    const isLikelySpanish = (skill: string) => {
      const lowerSkill = skill.toLowerCase();
      return spanishIndicators.some(indicator => lowerSkill.includes(indicator));
    };

    const matches: string[] = [];

    COMMON_SKILLS.forEach((skill) => {
      const skillLower = skill.toLowerCase();
      const skillIsSpanish = isLikelySpanish(skill);

      // Exclude skills that already exist
      if (existingSkillNames.includes(skillLower)) {
        return;
      }

      // Only include skills that match the search AND match the current language
      if (skillLower.includes(searchLower)) {
        if (lang === 'es' && skillIsSpanish) {
          matches.push(skill);
        } else if (lang === 'en' && !skillIsSpanish) {
          matches.push(skill);
        }
      }
    });

    // Sort by relevance: 1) starts with, 2) shorter length (more specific)
    matches.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = aLower.startsWith(searchLower);
      const bStarts = bLower.startsWith(searchLower);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.length - b.length;
    });

    return matches.slice(0, 10);
  }, [searchTerm, lang, skills, editingIndex]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSkills((items) => {
        const oldIndex = items.findIndex((item) => (item.id || `temp-${item.name}`) === active.id);
        const newIndex = items.findIndex((item) => (item.id || `temp-${item.name}`) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setSearchTerm('');
    reset({ name: '', level: undefined, years_of_experience: undefined, percentage: undefined });
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    // Limpiar cualquier borrador previo antes de editar
    localStorage.removeItem('skill_draft');

    const skill = skills[index];
    setEditingIndex(index);
    setSearchTerm(skill.name);
    reset(skill);
    setIsFormOpen(true);
  };

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const handleDelete = (index: number) => {
    setDeleteIndex(index);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updated = skills.filter((_, i) => i !== deleteIndex);
      setSkills(updated);
      onSave(updated);
      setDeleteIndex(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setValue('name', suggestion);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: SkillFormData) => {
    try {
      // Check for duplicate skill names (case-insensitive)
      const isDuplicate = skills.some((skill, idx) => {
        // Skip the skill being edited
        if (editingIndex !== null && idx === editingIndex) return false;
        return skill.name.toLowerCase() === data.name.toLowerCase();
      });

      if (isDuplicate) {
        toast.error(t.skillAlreadyExists);
        return;
      }

      let updated: SkillFormData[];
      if (editingIndex !== null) {
        updated = skills.map((skill, idx) => (idx === editingIndex ? data : skill));
      } else {
        updated = [...skills, data];
      }

      setSkills(updated);

      // ✅ Cerrar formulario INMEDIATAMENTE para mejor UX
      localStorage.removeItem('skill_draft');
      setIsFormOpen(false);
      reset();
      setSearchTerm('');
      setEditingIndex(null);

      // ⚠️ NO mostrar toast en modo wizard para no interrumpir el flujo
      if (!isWizardMode) {
        toast.success(t.skillSaved);
      }

      // Guardar en segundo plano
      await onSave(updated);
    } catch (error) {
      // Siempre mostrar errores, incluso en wizard mode
      toast.error(t.errorSavingSkill + (error as Error).message);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {modals.addSkill}
          </button>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-cv-blue" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.aiSuggestionsTitle}
              </h3>
            </div>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cv-blue"></div>
            </div>
          }>
            <AISkillsSuggestion
              experiences={experiences}
              currentSkills={skills.map(s => s.name)}
              onSkillAdded={loadSkills}
            />
          </Suspense>
        </div>
      )}

      {/* Skills Grid with Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={skills.map((skill) => skill.id || `temp-${skill.name}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {skills.map((skill, index) => (
              <SortableSkillItem
                key={skills[index]?.id || `${skills[index]?.name}-${index}`}
                skill={skill}
                onEdit={() => handleEdit(index)}
                onDelete={() => handleDelete(index)}
                translations={translations}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {skills.length === 0 && !isFormOpen && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>{modals.noSkillsYet}</p>
        </div>
      )}

      {/* Premium AI Suggestions Button - Floating (only when NOT in wizard mode) */}
      {!isFormOpen && !onNext && (
        <button
          onClick={() => setShowAISuggestions(prev => !prev)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-cv-blue to-purple-600 text-white rounded-full hover:from-cv-blue-dark hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 flex items-center justify-center z-40 group"
          title={t.aiSuggestionsTitle}
        >
          {/* Premium Badge */}
          <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-pulse z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            PREMIUM
          </span>
          {/* Lightning Icon */}
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t.aiSuggestionsTitle}
          </span>
        </button>
      )}

      {/* Botón Continuar - Solo cuando hay habilidades y no está abierto el formulario */}
      {skills.length > 0 && !isFormOpen && onNext && (
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={onNext}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            {translations.common?.next || 'Next'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {modals.deleteSkillConfirm || '¿Eliminar habilidad?'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.actionCannotBeUndone}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteIndex(null)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors font-medium"
              >
                {modals.cancel || 'Cancelar'}
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                {translations.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Form */}
      {isFormOpen && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? modals.editSkill : modals.addSkill}
          </h3>

          {/* DEBUG: Mostrar errores de validación */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-4">
              <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">⚠️ {translations.validationErrors.title}:</h4>
              <ul className="list-disc list-inside text-red-700 dark:text-red-400">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>{key}: {error?.message || 'Error desconocido'}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {modals.skillName} *
              </label>
              <input
                {...register('name')}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setValue('name', e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                placeholder={modals.skillNamePlaceholder}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              {!errors.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.typeToSeeSuggestions}
                </p>
              )}

              {/* Autocomplete Suggestions - Improved */}
              {showSuggestions && searchTerm && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-dark-bg-primary border-b border-gray-200 dark:border-dark-border sticky top-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t.popularSuggestions}
                    </p>
                  </div>
                  {filteredSuggestions.map((suggestion, idx) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-white transition-colors border-b border-gray-100 dark:border-dark-border last:border-0 flex items-center gap-2 group"
                    >
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-cv-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="group-hover:text-cv-blue transition-colors font-medium">{suggestion}</span>
                    </button>
                  ))}
                  <div className="px-3 py-2 bg-gray-50 dark:bg-dark-bg-primary border-t border-gray-200 dark:border-dark-border sticky bottom-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.customSkillTip}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {modals.skillLevel}
                </label>
                <select
                  {...register('level', {
                    setValueAs: (v) => v === '' ? undefined : v,
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                >
                  <option value="">{t.notSpecified}</option>
                  <option value="BEGINNER">{modals.beginner}</option>
                  <option value="INTERMEDIATE">{modals.intermediate}</option>
                  <option value="ADVANCED">{modals.advanced}</option>
                  <option value="EXPERT">{modals.expert}</option>
                </select>
              </div>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {modals.skillPercentage}
              </label>
              <input
                {...register('percentage', {
                  setValueAs: (v) => {
                    if (v === '' || v === null || v === undefined) return null;
                    const num = Number(v);
                    return isNaN(num) ? undefined : num;
                  },
                })}
                type="range"
                min="0"
                max="100"
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>{watch('percentage') || 0}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('skill_draft');
                  setIsFormOpen(false);
                  setShowSuggestions(false);
                  reset();
                  setSearchTerm('');
                  setEditingIndex(null);
                }}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {modals.cancel}
              </button>
              <button
                type="submit"
                onClick={() => {}}
                disabled={isSubmitting}
                className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t.saving : editingIndex !== null ? modals.update : modals.add} {modals.addSkill.replace('Añadir ', '').replace('Add ', '')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});

SkillsSection.displayName = 'SkillsSection';

export default SkillsSection;

