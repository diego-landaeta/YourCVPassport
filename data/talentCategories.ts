export interface TalentCategory {
  slug: string;
  name_en: string;
  name_es: string;
  description_en: string;
  description_es: string;
  icon: string;
  keywords: string[]; // Keywords to match in title/headline
  color: string;
}

export const talentCategories: TalentCategory[] = [
  {
    slug: 'ingenierosdesoftware',
    name_en: 'Software Engineers',
    name_es: 'Ingenieros de Software',
    description_en: 'Full-stack developers, backend engineers, frontend specialists, and software architects',
    description_es: 'Desarrolladores full-stack, ingenieros backend, especialistas frontend y arquitectos de software',
    icon: '💻',
    keywords: ['software engineer', 'developer', 'programador', 'full-stack', 'backend', 'frontend', 'ingeniero de software'],
    color: 'blue'
  },
  {
    slug: 'disenadores',
    name_en: 'Designers',
    name_es: 'Diseñadores',
    description_en: 'UI/UX designers, graphic designers, product designers, and creative directors',
    description_es: 'Diseñadores UI/UX, diseñadores gráficos, diseñadores de producto y directores creativos',
    icon: '🎨',
    keywords: ['designer', 'diseñador', 'ui/ux', 'graphic design', 'product design', 'creative'],
    color: 'purple'
  },
  {
    slug: 'cientificosdedatos',
    name_en: 'Data Scientists',
    name_es: 'Científicos de Datos',
    description_en: 'Data scientists, machine learning engineers, AI specialists, and data analysts',
    description_es: 'Científicos de datos, ingenieros de machine learning, especialistas en IA y analistas de datos',
    icon: '📊',
    keywords: ['data scientist', 'machine learning', 'ai', 'artificial intelligence', 'data analyst', 'científico de datos'],
    color: 'green'
  },
  {
    slug: 'productmanagers',
    name_en: 'Product Managers',
    name_es: 'Product Managers',
    description_en: 'Product managers, product owners, and product strategists',
    description_es: 'Product managers, product owners y estrategas de producto',
    icon: '📱',
    keywords: ['product manager', 'product owner', 'pm', 'product strategy'],
    color: 'indigo'
  },
  {
    slug: 'marketingdigital',
    name_en: 'Digital Marketing',
    name_es: 'Marketing Digital',
    description_en: 'Digital marketers, SEO specialists, content creators, and social media managers',
    description_es: 'Especialistas en marketing digital, SEO, creadores de contenido y community managers',
    icon: '📈',
    keywords: ['marketing', 'seo', 'content', 'social media', 'digital marketing', 'community manager'],
    color: 'pink'
  },
  {
    slug: 'devops',
    name_en: 'DevOps Engineers',
    name_es: 'Ingenieros DevOps',
    description_en: 'DevOps engineers, cloud architects, SRE, and infrastructure specialists',
    description_es: 'Ingenieros DevOps, arquitectos cloud, SRE y especialistas en infraestructura',
    icon: '⚙️',
    keywords: ['devops', 'cloud', 'aws', 'azure', 'kubernetes', 'docker', 'infrastructure', 'sre'],
    color: 'orange'
  },
  {
    slug: 'ciberseguridad',
    name_en: 'Cybersecurity',
    name_es: 'Ciberseguridad',
    description_en: 'Security engineers, penetration testers, security analysts, and compliance specialists',
    description_es: 'Ingenieros de seguridad, pentesters, analistas de seguridad y especialistas en compliance',
    icon: '🔒',
    keywords: ['security', 'cybersecurity', 'pentester', 'seguridad', 'compliance', 'ethical hacker'],
    color: 'red'
  },
  {
    slug: 'movil',
    name_en: 'Mobile Developers',
    name_es: 'Desarrolladores Móviles',
    description_en: 'iOS developers, Android developers, and cross-platform mobile specialists',
    description_es: 'Desarrolladores iOS, Android y especialistas en desarrollo móvil multiplataforma',
    icon: '📲',
    keywords: ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'móvil'],
    color: 'teal'
  },
  {
    slug: 'ventas',
    name_en: 'Sales',
    name_es: 'Ventas',
    description_en: 'Sales executives, account managers, business development, and sales engineers',
    description_es: 'Ejecutivos de ventas, account managers, desarrollo de negocios y sales engineers',
    icon: '💼',
    keywords: ['sales', 'ventas', 'account manager', 'business development', 'sales engineer', 'comercial'],
    color: 'yellow'
  },
  {
    slug: 'recursoshumanos',
    name_en: 'Human Resources',
    name_es: 'Recursos Humanos',
    description_en: 'HR specialists, recruiters, talent acquisition, and people operations',
    description_es: 'Especialistas en RRHH, reclutadores, adquisición de talento y people operations',
    icon: '👥',
    keywords: ['hr', 'human resources', 'recruiter', 'talent acquisition', 'recursos humanos', 'rrhh', 'people'],
    color: 'cyan'
  },
  {
    slug: 'finanzas',
    name_en: 'Finance',
    name_es: 'Finanzas',
    description_en: 'Financial analysts, accountants, CFOs, and finance managers',
    description_es: 'Analistas financieros, contadores, CFOs y gerentes financieros',
    icon: '💰',
    keywords: ['finance', 'financial', 'accountant', 'cfo', 'finanzas', 'contador', 'accounting'],
    color: 'emerald'
  },
  {
    slug: 'blockchain',
    name_en: 'Blockchain',
    name_es: 'Blockchain',
    description_en: 'Blockchain developers, smart contract engineers, and Web3 specialists',
    description_es: 'Desarrolladores blockchain, ingenieros de smart contracts y especialistas Web3',
    icon: '⛓️',
    keywords: ['blockchain', 'web3', 'smart contract', 'solidity', 'ethereum', 'crypto'],
    color: 'violet'
  }
];

export const getCategoryBySlug = (slug: string): TalentCategory | undefined => {
  return talentCategories.find(cat => cat.slug === slug);
};

export const getCategoryColor = (color: string): string => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200'
  };
  return colors[color] || colors.blue;
};
