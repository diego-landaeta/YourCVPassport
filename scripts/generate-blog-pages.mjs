/**
 * Generate 300 individual blog post .ts files + index
 *
 * Output:
 *   content/posts/[slug].ts     — 300 individual files (one per post)
 *   content/posts/index.ts      — barrel export for listing
 *
 * Usage: node scripts/generate-blog-pages.mjs
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const plan = JSON.parse(readFileSync(join(root, 'content', 'blog-300-plan.json'), 'utf-8'));
const postsDir = join(root, 'content', 'posts');
mkdirSync(postsDir, { recursive: true });

// ── Unsplash images ──
const pools = {
  career: ['photo-1521791136064-7986c2920216','photo-1507679799987-c73779587ccf','photo-1573497019940-1c28c88b4f3e','photo-1560472355-536de3962603','photo-1553877522-43269d4ea984','photo-1486312338219-ce68d2c6f44d','photo-1454165804606-c3d57bc86b40','photo-1450101499163-c8848c66ca85'],
  tech: ['photo-1517694712202-14dd9538aa97','photo-1461749280684-dccba630e2f6','photo-1498050108023-c5249f4df085','photo-1504639725590-34d0984388bd','photo-1555066931-4365d14bab8c','photo-1537432376149-e84978a29b46','photo-1519389950473-47ba0277781c','photo-1581091226825-a6a2a5aee158'],
  office: ['photo-1497366216548-37526070297c','photo-1542744173-8e7e53415bb0','photo-1552664730-d307ca884978','photo-1600880292203-757bb62b4baf','photo-1497215842964-222b430dc094','photo-1556761175-5973dc0f32e7','photo-1551836022-d5d88e9218df','photo-1531482615713-2afd69097998'],
  education: ['photo-1523050854058-8df90110c7f1','photo-1524178232363-1fb2b075b655','photo-1509062522246-3755977927d7','photo-1501504905252-473c47e087f8','photo-1427504494785-3a9ca7044f45','photo-1503676260728-1c00da094a0b','photo-1513258496099-48168024aec0','photo-1577896851231-70ef18881754'],
  remote: ['photo-1522202176988-66273c2fd55f','photo-1587825140708-dfaf18c91193','photo-1585974738771-84483dd9f89f','photo-1593642632559-0c6d3fc62b89','photo-1521898284481-a5ec348cb555','photo-1600508774634-4e11d34730e2','photo-1588196749597-9ff075ee6b5b','photo-1612831455740-a2f6212eefc0'],
  interview: ['photo-1565688534245-05d6b5be184a','photo-1573497019940-1c28c88b4f3e','photo-1560472355-536de3962603','photo-1551836022-d5d88e9218df','photo-1519389950473-47ba0277781c','photo-1542744094-3a31f272c490','photo-1557804506-669a67965ba0','photo-1531545514256-b1400bc00f31'],
  latam: ['photo-1518611012118-696072aa579a','photo-1526948531399-320e7e40f0ca','photo-1529390079861-591f39a1e508','photo-1486406146926-c627a92ad1ab','photo-1444653614773-995cb1ef9efa','photo-1517245386747-bb4c01f7629d','photo-1494790108377-be9c29b29330','photo-1507003211169-0a1dd7228f2d'],
};

function pickPool(cluster) {
  if (cluster.includes('ats') || cluster.includes('tech')) return pools.tech;
  if (cluster.includes('pais') || cluster.includes('hispano')) return pools.latam;
  if (cluster.includes('education') || cluster.includes('academia')) return pools.education;
  if (cluster.includes('remote') || cluster.includes('freelance')) return pools.remote;
  if (cluster.includes('interview') || cluster.includes('entrevista')) return pools.interview;
  if (cluster.includes('industry') || cluster.includes('hiring')) return pools.office;
  return pools.career;
}

function img(cluster, i) {
  const p = pickPool(cluster);
  return `https://images.unsplash.com/${p[i % p.length]}`;
}

const clusterCategory = {
  'templates-by-profession': 'Templates & Design',
  'cv-by-country': 'International CV',
  'industry-hiring-guides': 'Industry Guides',
  'career-stage': 'Career Development',
  'skills-certifications': 'Skills & Certifications',
  'ats-technology': 'ATS & Technology',
  'interview-job-search': 'Interview & Job Search',
  'freelance-remote-work': 'Freelance & Remote',
  'education-academia': 'Education & Academia',
  'mercado-hispano-profesiones': 'Guías Profesionales',
  'mercado-hispano-paises': 'CV por País',
  'mercado-hispano-tendencias': 'Tendencias Laborales',
  'mercado-hispano-etapa-carrera': 'Desarrollo de Carrera',
  'mercado-hispano-ats-tecnologia': 'ATS y Tecnología',
  'mercado-hispano-entrevista-empleo': 'Entrevista y Empleo',
};

// ── Markdown generator ──
function md(post, idx) {
  const kw = post.keyword;
  const es = post.lang === 'es';
  const raw = (post.content_outline || '').split('\\n').filter(s => s.trim()).map(s => s.replace(/^\\d+\\.\\s*/, '').trim());
  while (raw.length < 11) raw.push(es ? `Aspectos avanzados de ${kw}` : `Advanced aspects of ${kw}`);
  const secs = raw.slice(0, 11);

  let o = '';

  // ── H1 ──
  o += `# ${post.title}\n\n`;

  // ── Intro (2 paragraphs) ──
  if (es) {
    o += `En el competitivo mercado laboral de 2026, dominar **${kw}** se ha convertido en una necesidad para cualquier profesional que quiera destacar. Los reclutadores reciben cientos de solicitudes por cada vacante, y solo aquellos candidatos que entienden cómo optimizar su perfil profesional logran pasar los filtros iniciales.\n\n`;
    o += `Esta guía completa sobre **${kw}** te proporciona estrategias comprobadas, ejemplos prácticos y herramientas que necesitas para transformar tu búsqueda de empleo. Según datos de LinkedIn, los profesionales que aplican estas técnicas reciben un 60% más de contactos de reclutadores.\n\n`;
  } else {
    o += `In the competitive 2026 job market, mastering **${kw}** has become essential for any professional looking to stand out. Recruiters receive hundreds of applications per vacancy, and only candidates who understand how to optimize their professional profile make it past the initial filters.\n\n`;
    o += `This comprehensive guide on **${kw}** provides you with proven strategies, practical examples, and the tools you need to transform your job search. According to LinkedIn data, professionals who apply these techniques receive 60% more recruiter contacts.\n\n`;
  }

  o += `![${kw}](${img(post.cluster, idx)}?w=800&q=80){caption:${es ? 'Guía completa sobre' : 'Complete guide on'} ${kw}}\n\n`;

  // ── H2 sections ──
  let h3n = 0;
  for (let i = 0; i < secs.length; i++) {
    const sec = secs[i];
    // H2 always includes keyword
    const h2 = sec.toLowerCase().includes(kw.toLowerCase().split(' ')[0])
      ? sec
      : (es ? `${sec} — claves de ${kw}` : `${sec} — ${kw} insights`);

    o += `## ${h2}\n\n`;

    // Main paragraph
    if (es) {
      o += `Cuando hablamos de **${kw}** en el contexto de ${sec.toLowerCase()}, es fundamental entender que cada detalle cuenta. Los profesionales más exitosos no dejan nada al azar: investigan las tendencias del mercado, analizan las ofertas de su sector y adaptan su perfil a cada oportunidad.\n\n`;
      o += `La clave está en combinar una presentación visual impecable con contenido estratégico que demuestre tu valor real. Veamos los aspectos específicos que debes dominar.\n\n`;
    } else {
      o += `When discussing **${kw}** in the context of ${sec.toLowerCase()}, it's essential to understand that every detail matters. The most successful professionals leave nothing to chance: they research market trends, analyze job postings in their sector, and tailor their profile to each opportunity.\n\n`;
      o += `The key is combining flawless visual presentation with strategic content that demonstrates your real value. Let's look at the specific aspects you need to master.\n\n`;
    }

    // H3s — 1 to 2 per section, targeting ~15 total
    if (h3n < 15) {
      o += `### ${es ? 'Mejores prácticas para' : 'Best practices for'} ${sec.toLowerCase()}\n\n`;
      h3n++;
      if (es) {
        o += `Para destacar en **${kw}** dentro de esta área, aplica estas estrategias probadas:\n\n`;
        o += `- **Investiga a fondo**: Antes de aplicar, estudia la empresa, su cultura y los requisitos específicos del puesto\n`;
        o += `- **Personaliza siempre**: Un CV genérico no pasa los filtros ATS. Adapta cada sección a la oferta\n`;
        o += `- **Cuantifica logros**: Los números hablan más que las palabras. Usa métricas concretas de tu impacto\n`;
        o += `- **Optimiza para ATS**: Incluye las palabras clave exactas de la oferta de trabajo\n`;
        o += `- **Revisa y perfecciona**: Un solo error ortográfico puede costarte la entrevista\n\n`;
      } else {
        o += `To excel in **${kw}** within this area, apply these proven strategies:\n\n`;
        o += `- **Research thoroughly**: Before applying, study the company, its culture, and specific role requirements\n`;
        o += `- **Always customize**: A generic CV won't pass ATS filters. Tailor every section to the posting\n`;
        o += `- **Quantify achievements**: Numbers speak louder than words. Use concrete metrics of your impact\n`;
        o += `- **Optimize for ATS**: Include exact keywords from the job posting\n`;
        o += `- **Review and refine**: A single typo can cost you the interview\n\n`;
      }

      if (i % 2 === 0 && h3n < 15) {
        o += `### ${es ? 'Errores frecuentes en' : 'Common mistakes in'} ${sec.toLowerCase()}\n\n`;
        h3n++;
        if (es) {
          o += `Evita estos errores que cometen la mayoría de candidatos con **${kw}**:\n\n`;
          o += `- Usar el mismo CV para todas las aplicaciones sin personalizar\n`;
          o += `- Incluir información irrelevante que distrae del mensaje principal\n`;
          o += `- Ignorar el formato y la legibilidad del documento\n`;
          o += `- No incluir palabras clave que los sistemas ATS buscan automáticamente\n\n`;
        } else {
          o += `Avoid these mistakes that most candidates make with **${kw}**:\n\n`;
          o += `- Using the same CV for every application without customizing\n`;
          o += `- Including irrelevant information that distracts from the main message\n`;
          o += `- Ignoring document formatting and readability\n`;
          o += `- Not including keywords that ATS systems automatically scan for\n\n`;
        }
      }
    }

    // Images every 3 sections
    if (i % 3 === 1) {
      o += `![${sec}](${img(post.cluster, idx + i + 7)}?w=800&q=80){caption:${sec}}\n\n`;
    }

    // Boxes
    if (i === 0) {
      o += es
        ? `:::tip\nLos reclutadores dedican un promedio de 7.4 segundos a la primera revisión de un CV. Asegúrate de que tu propuesta de valor sobre ${kw} sea visible de inmediato en el primer tercio del documento.\n:::\n\n`
        : `:::tip\nRecruiters spend an average of 7.4 seconds on the first review of a CV. Make sure your value proposition about ${kw} is immediately visible in the top third of the document.\n:::\n\n`;
    }
    if (i === 2) {
      o += es
        ? `:::info\nEl 75% de los CVs son descartados por sistemas ATS antes de llegar a un reclutador humano. Optimizar tu perfil con las palabras clave correctas de ${kw} es esencial para superar este filtro.\n:::\n\n`
        : `:::info\n75% of CVs are rejected by ATS systems before reaching a human recruiter. Optimizing your profile with the right ${kw} keywords is essential to pass this filter.\n:::\n\n`;
    }
    if (i === 4) {
      o += es
        ? `:::warning\nNo cometas el error de usar el mismo CV genérico para todas las aplicaciones. Personalizar tu enfoque de ${kw} para cada empresa aumenta tus probabilidades de éxito hasta en un 60%.\n:::\n\n`
        : `:::warning\nDon't make the mistake of using the same generic CV for every application. Customizing your ${kw} approach for each company increases your success rate by up to 60%.\n:::\n\n`;
    }
    if (i === 6) {
      o += es
        ? `:::example\n**Antes**: "Responsable de ventas en la empresa durante 3 años"\n**Después**: "Incrementé las ventas en un 35% en 6 meses, generando +200K€ en nuevos contratos mediante estrategias de prospección digital y gestión de cuentas clave"\n:::\n\n`
        : `:::example\n**Before**: "Responsible for sales at the company for 3 years"\n**After**: "Increased sales by 35% in 6 months, generating +$200K in new contracts through digital prospecting strategies and key account management"\n:::\n\n`;
    }
    if (i === 8) {
      o += es
        ? `:::tip\nIncluir un enlace a tu perfil profesional verificado en YourCVPassport le da a los reclutadores acceso instantáneo a tus credenciales verificadas, aumentando significativamente tu credibilidad.\n:::\n\n`
        : `:::tip\nIncluding a link to your verified professional profile on YourCVPassport gives recruiters instant access to your verified credentials, significantly boosting your credibility.\n:::\n\n`;
    }
  }

  // ── CTA section ──
  o += es
    ? `## Cómo YourCVPassport te ayuda con ${kw}\n\nEn [YourCVPassport](https://yourcvpassport.com), hemos diseñado herramientas profesionales para que domines cada aspecto de **${kw}**:\n\n- **20+ plantillas profesionales** diseñadas por expertos en reclutamiento y optimizadas para ATS\n- **Asistente con IA** (Google Gemini) que te guía paso a paso en la creación de tu CV\n- **Verificación profesional** con sellos digitales que validan tu experiencia y formación\n- **Exportación multi-formato** en PDF y DOCX compatibles con cualquier sistema de selección\n- **URL personalizada** para compartir tu perfil verificado directamente con reclutadores\n- **Analytics integrado** para saber quién ve tu perfil y optimizar tu visibilidad\n\n**[Crea tu CV verificado gratis →](https://yourcvpassport.com/signup)**\n\n`
    : `## How YourCVPassport helps you with ${kw}\n\nAt [YourCVPassport](https://yourcvpassport.com), we've built professional tools to help you master every aspect of **${kw}**:\n\n- **20+ professional templates** designed by recruitment experts and optimized for ATS\n- **AI assistant** (Google Gemini) guiding you step-by-step through CV creation\n- **Professional verification** with digital stamps validating your experience and credentials\n- **Multi-format export** in PDF and DOCX compatible with any hiring system\n- **Custom URL** to share your verified profile directly with recruiters\n- **Built-in analytics** to see who views your profile and optimize your visibility\n\n**[Create your verified CV for free →](https://yourcvpassport.com/signup)**\n\n`;

  // ── Conclusion ──
  o += es
    ? `## Conclusión: domina ${kw} y transforma tu carrera profesional\n\nDominar **${kw}** no es solo una ventaja competitiva — es una necesidad absoluta en el mercado laboral de 2026. Con las estrategias, herramientas y consejos prácticos que hemos compartido en esta guía, estás significativamente mejor preparado para crear un perfil profesional que realmente destaque entre la competencia.\n\nRecuerda: la clave del éxito está en la personalización constante, los datos concretos que respalden tus logros, y la mejora continua de tu perfil. Tu próximo gran paso profesional comienza con un CV excepcional que refleje tu verdadero valor.\n`
    : `## Conclusion: master ${kw} and transform your professional career\n\nMastering **${kw}** isn't just a competitive advantage — it's an absolute necessity in the 2026 job market. With the strategies, tools, and practical tips we've shared in this guide, you're significantly better prepared to create a professional profile that truly stands out from the competition.\n\nRemember: the key to success lies in constant personalization, concrete data backing your achievements, and continuous profile improvement. Your next big career move starts with an exceptional CV that reflects your true value.\n`;

  return o;
}

// ── Generate individual files ──
console.log(`Generating ${plan.length} individual blog post files...\n`);

const slugs = [];
let generated = 0;

for (let i = 0; i < plan.length; i++) {
  const post = plan[i];
  const dayOffset = Math.floor(i / 10) + 1;
  const pubDate = new Date();
  pubDate.setDate(pubDate.getDate() + dayOffset);
  pubDate.setHours(8 + (i % 10) * 2, 0, 0, 0);

  const category = clusterCategory[post.cluster] || post.cluster;
  const content = md(post, i);
  const imageUrl = `${img(post.cluster, i)}?w=1200&h=630&fit=crop&q=80`;

  // Escape backticks and ${} in content for template literal
  const escaped = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

  const fileContent = `import { BlogPostData } from './types';

const post: BlogPostData = {
  id: ${1000 + i},
  title: ${JSON.stringify(post.title)},
  slug: ${JSON.stringify(post.slug)},
  summary: ${JSON.stringify(post.meta_description)},
  content: \`${escaped}\`,
  image_url: ${JSON.stringify(imageUrl)},
  author_name: 'YourCVPassport Team',
  category: ${JSON.stringify(category)},
  is_featured: ${post.priority === 'high' && i % 20 === 0},
  published_at: ${JSON.stringify(pubDate.toISOString())},
  meta_title: ${JSON.stringify(post.title.length > 60 ? post.title.substring(0, 57) + '...' : post.title)},
  meta_description: ${JSON.stringify(post.meta_description)},
  lang: ${JSON.stringify(post.lang)},
};

export default post;
`;

  writeFileSync(join(postsDir, `${post.slug}.ts`), fileContent, 'utf-8');
  slugs.push(post.slug);
  generated++;
  if (generated % 50 === 0) console.log(`  ${generated}/${plan.length}...`);
}

// ── Types file ──
writeFileSync(join(postsDir, 'types.ts'), `export interface BlogPostData {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image_url: string;
  author_name: string;
  category: string;
  is_featured: boolean;
  published_at: string;
  meta_title: string;
  meta_description: string;
  lang: string;
}
`, 'utf-8');

// ── Index file (barrel export with lazy imports) ──
const indexLines = [
  `import { BlogPostData } from './types';`,
  `export type { BlogPostData };`,
  ``,
  `// Lazy import map — each post is its own file for code splitting`,
  `const postImports: Record<string, () => Promise<{ default: BlogPostData }>> = {`,
];
for (const slug of slugs) {
  indexLines.push(`  '${slug}': () => import('./${slug}'),`);
}
indexLines.push(`};`);
indexLines.push(``);
indexLines.push(`export async function getPostBySlug(slug: string): Promise<BlogPostData | null> {`);
indexLines.push(`  const importer = postImports[slug];`);
indexLines.push(`  if (!importer) return null;`);
indexLines.push(`  const mod = await importer();`);
indexLines.push(`  const post = mod.default;`);
indexLines.push(`  // Only return if published`);
indexLines.push(`  if (new Date(post.published_at) > new Date()) return null;`);
indexLines.push(`  return post;`);
indexLines.push(`}`);
indexLines.push(``);
indexLines.push(`// For blog listing — imports ALL post metadata (not content) at once`);
indexLines.push(`// This file is generated and only loaded when the blog page is visited`);

// Generate a lightweight metadata array for the listing page
const metaEntries = plan.map((post, i) => {
  const dayOffset = Math.floor(i / 10) + 1;
  const pubDate = new Date();
  pubDate.setDate(pubDate.getDate() + dayOffset);
  pubDate.setHours(8 + (i % 10) * 2, 0, 0, 0);
  return {
    id: 1000 + i,
    title: post.title,
    slug: post.slug,
    summary: post.meta_description,
    image_url: `${img(post.cluster, i)}?w=1200&h=630&fit=crop&q=80`,
    category: clusterCategory[post.cluster] || post.cluster,
    is_featured: post.priority === 'high' && i % 20 === 0,
    published_at: pubDate.toISOString(),
    meta_title: post.title.length > 60 ? post.title.substring(0, 57) + '...' : post.title,
    meta_description: post.meta_description,
    lang: post.lang,
  };
});

indexLines.push(`export const allPostsMeta: Omit<BlogPostData, 'content'>[] = ${JSON.stringify(metaEntries, null, 2)};`);
indexLines.push(``);
indexLines.push(`export function getPublishedPosts(lang: string): Omit<BlogPostData, 'content'>[] {`);
indexLines.push(`  const now = new Date();`);
indexLines.push(`  return allPostsMeta`);
indexLines.push(`    .filter(p => p.lang === lang && new Date(p.published_at) <= now)`);
indexLines.push(`    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());`);
indexLines.push(`}`);

writeFileSync(join(postsDir, 'index.ts'), indexLines.join('\n'), 'utf-8');

console.log(`\nDone!`);
console.log(`  ${generated} post files in content/posts/`);
console.log(`  + types.ts`);
console.log(`  + index.ts (lazy imports + metadata)`);
console.log(`  Schedule: 10 posts/day over ${Math.ceil(generated / 10)} days`);
console.log(`  First publish: tomorrow`);
