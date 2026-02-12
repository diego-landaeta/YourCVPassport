/**
 * Bidirectional translation map for common skills
 * Maps English <-> Spanish skill names
 */

// English to Spanish
export const SKILLS_EN_TO_ES: Record<string, string> = {
  // Programming & Tech
  'JavaScript': 'JavaScript',
  'TypeScript': 'TypeScript',
  'Python': 'Python',
  'Java': 'Java',
  'React': 'React',
  'Node.js': 'Node.js',
  'Web Development': 'Desarrollo Web',
  'Mobile Development': 'Desarrollo Móvil',
  'Responsive Design': 'Diseño Responsive',
  'Backend Development': 'Desarrollo Backend',
  'Data Analysis': 'Análisis de Datos',
  'Data Visualization': 'Visualización de Datos',
  'Business Intelligence': 'Inteligencia de Negocios',
  'Machine Learning': 'Aprendizaje Automático',
  'Artificial Intelligence': 'Inteligencia Artificial',
  'Deep Learning': 'Aprendizaje Profundo',
  'Natural Language Processing': 'Procesamiento de Lenguaje Natural',
  'Computer Vision': 'Visión por Computadora',
  'Data Science': 'Ciencia de Datos',
  'Big Data': 'Big Data',
  'Cloud Computing': 'Computación en la Nube',
  'DevOps': 'DevOps',
  'Version Control': 'Control de Versiones',
  'Project Management': 'Gestión de Proyectos',

  // Design & Creative
  'UI/UX Design': 'Diseño UI/UX',
  'Graphic Design': 'Diseño Gráfico',
  'Web Design': 'Diseño Web',
  'Prototyping': 'Prototipado',
  'Brand Identity': 'Identidad de Marca',
  'User Research': 'Investigación de Usuarios',
  'Design Thinking': 'Pensamiento de Diseño',
  'Color Theory': 'Teoría del Color',
  'Typography': 'Tipografía',
  'Motion Graphics': 'Gráficos en Movimiento',
  '3D Modeling': 'Modelado 3D',
  '3D Animation': 'Animación 3D',

  // Business & Management
  'Product Management': 'Gestión de Productos',
  'Strategic Planning': 'Planificación Estratégica',
  'Business Development': 'Desarrollo de Negocios',
  'Market Research': 'Investigación de Mercado',
  'Competitive Analysis': 'Análisis Competitivo',
  'Financial Planning': 'Planificación Financiera',
  'Budgeting': 'Presupuestos',
  'Risk Management': 'Gestión de Riesgos',
  'Change Management': 'Gestión del Cambio',
  'Stakeholder Management': 'Gestión de Partes Interesadas',
  'Resource Planning': 'Planificación de Recursos',
  'Process Improvement': 'Mejora de Procesos',
  'KPI Tracking': 'Seguimiento de KPIs',

  // Soft Skills
  'Leadership': 'Liderazgo',
  'Leadership Development': 'Desarrollo de Liderazgo',
  'Conscious Leadership': 'Liderazgo Consciente',
  'Executive Leadership': 'Liderazgo Ejecutivo',
  'Team Management': 'Gestión de Equipos',
  'Team Leadership': 'Liderazgo de Equipos',
  'Team Facilitation': 'Facilitación de Equipos',
  'Communication': 'Comunicación',
  'Public Speaking': 'Oratoria',
  'Presentation Skills': 'Habilidades de Presentación',
  'Negotiation': 'Negociación',
  'Conflict Resolution': 'Resolución de Conflictos',
  'Critical Thinking': 'Pensamiento Crítico',
  'Problem Solving': 'Resolución de Problemas',
  'Decision Making': 'Toma de Decisiones',
  'Time Management': 'Gestión del Tiempo',
  'Adaptability': 'Adaptabilidad',
  'Creativity': 'Creatividad',
  'Emotional Intelligence': 'Inteligencia Emocional',
  'Mentoring': 'Mentoría',
  'Coaching': 'Coaching',
  'Executive Coaching': 'Coaching Ejecutivo',
  'Life Coaching': 'Coaching de Vida',
  'Career Coaching': 'Coaching de Carrera',
  'Active Listening': 'Escucha Activa',
  'Collaboration': 'Colaboración',
  'Customer Service': 'Servicio al Cliente',
  'Networking': 'Networking',
  'Teamwork': 'Trabajo en Equipo',
  'Team Player': 'Jugador de Equipo',
  'Empathy': 'Empatía',
  'Motivation': 'Motivación',
  'Delegation': 'Delegación',
  'Organization': 'Organización',
  'Analytical Skills': 'Habilidades Analíticas',
  'Attention to Detail': 'Atención al Detalle',
  'Self-Motivation': 'Automotivación',
  'Flexibility': 'Flexibilidad',
  'Patience': 'Paciencia',
  'Interpersonal Skills': 'Habilidades Interpersonales',
  'Work Ethic': 'Ética de Trabajo',
  'Accountability': 'Responsabilidad',
  'Integrity': 'Integridad',
  'Culture Transformation': 'Transformación Cultural',
  'Organizational Culture': 'Cultura Organizacional',
  'Cultural Change': 'Cambio Cultural',
  'Personal Development': 'Desarrollo Personal',
  'Professional Development': 'Desarrollo Profesional',
  'Self-Awareness': 'Autoconocimiento',
  'Mindfulness': 'Mindfulness',
  'Work-Life Balance': 'Equilibrio Trabajo-Vida',
  'Stress Management': 'Gestión del Estrés',
  'Resilience': 'Resiliencia',
  'Innovation': 'Innovación',
  'Strategic Thinking': 'Pensamiento Estratégico',
  'Visionary Leadership': 'Liderazgo Visionario',
  'Servant Leadership': 'Liderazgo de Servicio',
  'Transformational Leadership': 'Liderazgo Transformacional',

  // Marketing & Sales
  'Digital Marketing': 'Marketing Digital',
  'SEO': 'SEO',
  'SEM': 'SEM',
  'Content Marketing': 'Marketing de Contenidos',
  'Email Marketing': 'Email Marketing',
  'Social Media Marketing': 'Marketing en Redes Sociales',
  'Social Media': 'Redes Sociales',
  'Content Strategy': 'Estrategia de Contenido',
  'Brand Management': 'Gestión de Marca',
  'Product Marketing': 'Marketing de Producto',
  'Sales Strategy': 'Estrategia de Ventas',
  'Sales': 'Ventas',
  'B2B Sales': 'Ventas B2B',
  'B2C Sales': 'Ventas B2C',
  'Account Management': 'Gestión de Cuentas',
  'Growth Hacking': 'Growth Hacking',
  'Marketing Automation': 'Automatización de Marketing',
  'Copywriting': 'Copywriting',
  'Web Analytics': 'Analítica Web',
  'Digital Advertising': 'Publicidad Digital',

  // Finance & Accounting
  'Financial Analysis': 'Análisis Financiero',
  'Accounting': 'Contabilidad',
  'Bookkeeping': 'Teneduría de Libros',
  'Tax Preparation': 'Preparación de Impuestos',
  'Auditing': 'Auditoría',
  'Financial Modeling': 'Modelado Financiero',
  'Investment Analysis': 'Análisis de Inversiones',
  'Corporate Finance': 'Finanzas Corporativas',
  'Cost Accounting': 'Contabilidad de Costos',
  'Finance': 'Finanzas',
  'Budgets': 'Presupuestos',

  // Human Resources
  'Human Resources': 'Recursos Humanos',
  'Recruitment': 'Reclutamiento',
  'Talent Acquisition': 'Adquisición de Talento',
  'Talent Management': 'Gestión del Talento',
  'Onboarding': 'Incorporación',
  'Performance Management': 'Gestión del Desempeño',
  'Employee Relations': 'Relaciones con Empleados',
  'Training & Development': 'Capacitación y Desarrollo',
  'Training': 'Capacitación',
  'HR Analytics': 'Analítica de RRHH',
  'Workforce Planning': 'Planificación de la Fuerza Laboral',
  'Diversity & Inclusion': 'Diversidad e Inclusión',
  'Labor Law': 'Derecho Laboral',
  'Organizational Development': 'Desarrollo Organizacional',
  'Payroll': 'Nómina',
  'Personnel Selection': 'Selección de Personal',

  // Nature, Environment & Ecopsychology
  'Ecopsychology': 'Ecopsicología',
  'Forest Therapy': 'Terapia Forestal',
  'Forest Bathing': 'Baño de Bosque',
  'Environmental Education': 'Educación Ambiental',
  'Group Facilitation': 'Facilitación de Grupos',
  'Retreat Design': 'Diseño de Retiros',
  'Mindfulness in Nature': 'Mindfulness en la Naturaleza',
  'Ecological Anxiety Management': 'Gestión de la Ansiedad Ecológica',
  'Conservation Biology': 'Biología de la Conservación',
  'Environmental Interpretation': 'Interpretación Ambiental',
  'Nature Reconnection Practices': 'Prácticas de Reconexión con la Naturaleza',
  'Deep Ecology': 'Ecología Profunda',
  'Nature Experience Design': 'Diseño de Experiencias en la Naturaleza',
  'Trauma-Informed Nature Therapy': 'Terapia de Naturaleza Informada en Trauma',
  'Sustainability Communication': 'Comunicación de Sostenibilidad',
  'Ecological Dialogue Facilitation': 'Facilitación de Diálogo Ecológico',
  'Nature-Based Therapy': 'Terapia Basada en la Naturaleza',
  'Eco-Therapy': 'Eco-Terapia',
  'Ecotherapy': 'Ecoterapia',
  'Wildlife Conservation': 'Conservación de Vida Silvestre',
  'Environmental Science': 'Ciencias Ambientales',
  'Sustainability': 'Sostenibilidad',
  'Sustainable Development': 'Desarrollo Sostenible',
  'Climate Change': 'Cambio Climático',
  'Renewable Energy': 'Energía Renovable',
  'Green Technology': 'Tecnología Verde',
  'Ecological Restoration': 'Restauración Ecológica',
  'Biodiversity': 'Biodiversidad',
  'Environmental Policy': 'Política Ambiental',
  'Carbon Footprint': 'Huella de Carbono',
  'Waste Management': 'Gestión de Residuos',
  'Water Conservation': 'Conservación del Agua',
  'Sustainable Agriculture': 'Agricultura Sostenible',
  'Permaculture': 'Permacultura',
  'Organic Farming': 'Agricultura Orgánica',
  'Environmental Impact Assessment': 'Evaluación de Impacto Ambiental',
  'Nature Photography': 'Fotografía de Naturaleza',
  'Outdoor Education': 'Educación al Aire Libre',
  'Adventure Therapy': 'Terapia de Aventura',
  'Wilderness Skills': 'Habilidades de Supervivencia',
  'Environmental Consulting': 'Consultoría Ambiental',
  'Nature Connection': 'Conexión con la Naturaleza',
  'Holistic Health': 'Salud Holística',
  'Wellness Coaching': 'Coaching de Bienestar',
  'Mind-Body Connection': 'Conexión Mente-Cuerpo',
  'Meditation': 'Meditación',
  'Yoga': 'Yoga',
  'Breathwork': 'Trabajo de Respiración',
  'Sound Healing': 'Sanación con Sonido',
  'Energy Healing': 'Sanación Energética',
  'Alternative Medicine': 'Medicina Alternativa',
  'Integrative Health': 'Salud Integrativa',
  'Nature Guiding': 'Guía de Naturaleza',
  'Wilderness Therapy': 'Terapia de Vida Silvestre',

  // Nutrition & Dietetics
  'Holistic Nutrition': 'Nutrición Holística',
  'Mindful Eating': 'Alimentación Consciente',
  'Functional Nutrition': 'Nutrición Funcional',
  'Personalized Dietary Planning': 'Planificación Dietética Personalizada',
  'Salud Integrativa': 'Salud Integrativa',
  'Nutritional Education': 'Educación Nutricional',
  'Clinical Nutrition': 'Nutrición Clínica',
  'Gut-Brain Connection': 'Conexión Intestino-Cerebro',
  'Preventive Nutrition': 'Nutrición Preventiva',
  'Nutritional Assessment': 'Evaluación Nutricional',
  'Chronic Disease Management': 'Manejo de Enfermedades Crónicas',
  'Therapeutic Cooking': 'Cocina Terapéutica',
  'Emotional Nutrition': 'Nutrición Emocional',
  'Functional Supplementation': 'Suplementación Funcional',
  'Nutritional Communication': 'Comunicación Nutricional',
  'Dietetics': 'Dietética',
  'Food Science': 'Ciencia de los Alimentos',
  'Meal Planning': 'Planificación de Comidas',
  'Sports Nutrition': 'Nutrición Deportiva',
  'Pediatric Nutrition': 'Nutrición Pediátrica',
  'Geriatric Nutrition': 'Nutrición Geriátrica',
  'Weight Management': 'Control de Peso',
  'Eating Disorders': 'Trastornos Alimentarios',
  'Nutrition Counseling': 'Asesoramiento Nutricional',
  'Nutrition Therapy': 'Terapia Nutricional',
  'Registered Dietitian': 'Dietista Registrado',
  'Food Allergies': 'Alergias Alimentarias',
  'Plant-Based Nutrition': 'Nutrición Basada en Plantas',
  'Gut Health': 'Salud Intestinal',
  'Microbiome': 'Microbioma',
  'Anti-Inflammatory Diet': 'Dieta Antiinflamatoria',
  'Ketogenic Diet': 'Dieta Cetogénica',
  'Intermittent Fasting': 'Ayuno Intermitente',
  'Food Technology': 'Tecnología Alimentaria',

  // Healthcare & Medical
  'Patient Care': 'Atención al Paciente',
  'Medical Diagnosis': 'Diagnóstico Médico',
  'Treatment Planning': 'Planificación de Tratamiento',
  'Clinical Research': 'Investigación Clínica',
  'Pharmacology': 'Farmacología',
  'Nursing': 'Enfermería',
  'Physical Therapy': 'Fisioterapia',
  'Occupational Therapy': 'Terapia Ocupacional',
  'Medical Coding': 'Codificación Médica',
  'Healthcare Administration': 'Administración de Salud',
  'Medical Writing': 'Redacción Médica',
  'Telemedicine': 'Telemedicina',
  'Health': 'Salud',

  // Education & Training
  'Education': 'Educación',
  'Curriculum Development': 'Desarrollo Curricular',
  'Curriculum Design': 'Diseño Curricular',
  'Instructional Design': 'Diseño Instruccional',
  'E-Learning': 'E-Learning',
  'Classroom Management': 'Gestión del Aula',
  'Student Assessment': 'Evaluación Estudiantil',
  'Educational Technology': 'Tecnología Educativa',
  'Tutoring': 'Tutoría',
  'Workshop Facilitation': 'Facilitación de Talleres',
  'Corporate Training': 'Capacitación Corporativa',
  'Teacher Training': 'Capacitación Docente',
  'Educational Psychology': 'Psicología Educativa',
  'Lesson Planning': 'Planificación de Lecciones',
  'Teaching': 'Docencia',
  'Pedagogy': 'Pedagogía',
  'Social Emotional Learning (SEL)': 'Aprendizaje Socioemocional (SEL)',
  'Restorative Practices': 'Prácticas Restaurativas',

  // Legal
  'Legal Research': 'Investigación Legal',
  'Contract Drafting': 'Redacción de Contratos',
  'Contract Negotiation': 'Negociación de Contratos',
  'Litigation': 'Litigio',
  'Compliance': 'Cumplimiento',
  'Corporate Law': 'Derecho Corporativo',
  'Intellectual Property': 'Propiedad Intelectual',
  'Patent Law': 'Derecho de Patentes',
  'Employment Law': 'Derecho Laboral',
  'Real Estate Law': 'Derecho Inmobiliario',
  'Legal Writing': 'Redacción Legal',
  'Case Management': 'Gestión de Casos',
  'Law': 'Derecho',
  'Legal Advisory': 'Asesoría Legal',
  'Legal Compliance': 'Cumplimiento Legal',

  // Engineering & Manufacturing
  'Engineering': 'Ingeniería',
  'Mechanical Engineering': 'Ingeniería Mecánica',
  'Electrical Engineering': 'Ingeniería Eléctrica',
  'Civil Engineering': 'Ingeniería Civil',
  'Chemical Engineering': 'Ingeniería Química',
  'Industrial Engineering': 'Ingeniería Industrial',
  'Quality Control': 'Control de Calidad',
  'Lean Manufacturing': 'Manufactura Esbelta',
  'Supply Chain': 'Cadena de Suministro',
  'Logistics': 'Logística',
  'Inventory Management': 'Gestión de Inventario',
  'Production Planning': 'Planificación de Producción',
  'Process Engineering': 'Ingeniería de Procesos',
  'Manufacturing': 'Manufactura',
  'Production': 'Producción',

  // Testing & QA
  'Quality Assurance': 'Aseguramiento de Calidad',
  'Software Testing': 'Pruebas de Software',
  'Test Planning': 'Planificación de Pruebas',
  'Bug Tracking': 'Seguimiento de Errores',
  'Test Automation': 'Automatización de Pruebas',
  'Manual Testing': 'Pruebas Manuales',
  'Automated Testing': 'Pruebas Automatizadas',
  'Performance Testing': 'Pruebas de Rendimiento',
  'Security Testing': 'Pruebas de Seguridad',

  // Cybersecurity
  'Cybersecurity': 'Ciberseguridad',
  'Information Security': 'Seguridad Informática',
  'Penetration Testing': 'Pruebas de Penetración',
  'Ethical Hacking': 'Hacking Ético',
  'Network Security': 'Seguridad de Redes',
  'Security Auditing': 'Auditoría de Seguridad',
  'Vulnerability Assessment': 'Evaluación de Vulnerabilidades',
  'Incident Response': 'Respuesta a Incidentes',
  'Threat Intelligence': 'Inteligencia de Amenazas',
  'Malware Analysis': 'Análisis de Malware',
  'Security Architecture': 'Arquitectura de Seguridad',

  // Architecture & Infrastructure
  'Software Architecture': 'Arquitectura de Software',
  'Solution Architecture': 'Arquitectura de Soluciones',
  'Enterprise Architecture': 'Arquitectura Empresarial',
  'System Design': 'Diseño de Sistemas',
  'Cloud Architecture': 'Arquitectura en la Nube',
  'Infrastructure': 'Infraestructura',

  // Blockchain & Web3
  'Blockchain': 'Blockchain',
  'Smart Contracts': 'Contratos Inteligentes',
  'Cryptocurrency': 'Criptomonedas',

  // Gaming
  'Game Design': 'Diseño de Juegos',
  'Game Development': 'Desarrollo de Videojuegos',

  // Video & Audio
  'Video Editing': 'Edición de Video',
  'Audio Engineering': 'Ingeniería de Audio',
  'Sound Design': 'Diseño de Sonido',
  'Music Production': 'Producción Musical',
  'Voice Over': 'Locución',
  'Podcasting': 'Podcasting',
  'Audio Production': 'Producción de Audio',

  // E-commerce & Retail
  'E-commerce Management': 'Gestión de Comercio Electrónico',
  'E-commerce': 'Comercio Electrónico',
  'Online Sales': 'Ventas Online',

  // Writing & Content
  'Creative Writing': 'Escritura Creativa',
  'Technical Writing': 'Redacción Técnica',
  'Content Creation': 'Creación de Contenido',
  'Blog Writing': 'Redacción de Blogs',
  'Journalism': 'Periodismo',
  'Editing': 'Edición',
  'Proofreading': 'Corrección de Pruebas',
  'Scriptwriting': 'Guionismo',
  'Writing': 'Redacción',
  'Style Correction': 'Corrección de Estilo',

  // Translation & Localization
  'Translation': 'Traducción',
  'Localization': 'Localización',
  'Subtitling': 'Subtitulado',
  'Transcription': 'Transcripción',
  'Interpretation': 'Interpretación',

  // Real Estate
  'Real Estate': 'Bienes Raíces',
  'Property Management': 'Gestión Inmobiliaria',
  'Property Valuation': 'Valuación de Propiedades',
};

// Spanish to English (reverse map)
export const SKILLS_ES_TO_EN: Record<string, string> = Object.entries(SKILLS_EN_TO_ES).reduce(
  (acc, [en, es]) => {
    acc[es] = en;
    return acc;
  },
  {} as Record<string, string>
);

// Case-insensitive lookup maps (lowercase key -> original key)
const EN_LOWERCASE_MAP: Record<string, string> = Object.keys(SKILLS_EN_TO_ES).reduce(
  (acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
  },
  {} as Record<string, string>
);

const ES_LOWERCASE_MAP: Record<string, string> = Object.keys(SKILLS_ES_TO_EN).reduce(
  (acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Translates a skill name to the target language (case-insensitive)
 * @param skillName - The skill name to translate
 * @param targetLang - Target language ('en' or 'es')
 * @returns Translated skill name, or original if no translation found
 */
export function translateSkill(skillName: string, targetLang: 'en' | 'es'): string {
  if (!skillName) return skillName;

  const trimmed = skillName.trim();
  const lowerName = trimmed.toLowerCase();

  if (targetLang === 'es') {
    // Try exact match first
    if (SKILLS_EN_TO_ES[trimmed]) {
      return SKILLS_EN_TO_ES[trimmed];
    }
    // Try case-insensitive match
    const originalKey = EN_LOWERCASE_MAP[lowerName];
    if (originalKey) {
      return SKILLS_EN_TO_ES[originalKey];
    }
    return trimmed;
  } else {
    // Try exact match first
    if (SKILLS_ES_TO_EN[trimmed]) {
      return SKILLS_ES_TO_EN[trimmed];
    }
    // Try case-insensitive match
    const originalKey = ES_LOWERCASE_MAP[lowerName];
    if (originalKey) {
      return SKILLS_ES_TO_EN[originalKey];
    }
    return trimmed;
  }
}

/**
 * Translates an array of skills to the target language
 * @param skills - Array of skill objects with 'name' property
 * @param targetLang - Target language ('en' or 'es')
 * @returns Array of skills with translated names
 */
export function translateSkills<T extends { name: string }>(
  skills: T[],
  targetLang: 'en' | 'es'
): T[] {
  return skills.map(skill => ({
    ...skill,
    name: translateSkill(skill.name, targetLang),
  }));
}

/**
 * Checks if a skill is a predefined skill (exists in translation map) - case-insensitive
 * @param skillName - The skill name to check
 * @returns true if skill is predefined, false otherwise
 */
export function isPredefinedSkill(skillName: string): boolean {
  if (!skillName) return false;
  const lowerName = skillName.trim().toLowerCase();
  return lowerName in EN_LOWERCASE_MAP || lowerName in ES_LOWERCASE_MAP;
}
