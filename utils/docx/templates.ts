/**
 * DOCX Templates for ATS-Optimized CVs
 *
 * Genera documentos Word (.docx) editables optimizados para ATS
 * usando la librería docx.js
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  convertInchesToTwip,
} from 'docx';
import { ATSProcessedData, ATSTemplateType } from '../../types/ats-export.types';
import { FullProfileData, Stamp, Experience, Education, Skill } from '../../types';

/**
 * Genera documento DOCX según la plantilla seleccionada
 */
export function generateDOCX(
  data: ATSProcessedData,
  template: ATSTemplateType,
  language: 'en' | 'es' = 'en'
): Document {
  switch (template) {
    case 'classic':
      return generateClassicDOCX(data, language);
    case 'modern':
      return generateModernDOCX(data, language);
    case 'minimal':
      return generateMinimalDOCX(data, language);
    default:
      return generateModernDOCX(data, language);
  }
}

/**
 * Plantilla Modern DOCX
 */
function generateModernDOCX(
  data: ATSProcessedData,
  language: 'en' | 'es'
): Document {
  const { profile, stamps, keywords } = data;
  const translations = getTranslations(language);

  const sections: Paragraph[] = [];

  // Header - Name and Title
  sections.push(
    new Paragraph({
      text: profile.profile.full_name || '',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      style: 'heading1',
    })
  );

  if (profile.profile.headline) {
    sections.push(
      new Paragraph({
        text: profile.profile.headline,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        style: 'subtitle',
      })
    );
  }

  // Contact Information
  const contactInfo: string[] = [];
  if (profile.profile.email) contactInfo.push(`📧 ${profile.profile.email}`);
  if (profile.profile.phone) contactInfo.push(`📱 ${profile.profile.phone}`);
  if (profile.profile.location) contactInfo.push(`📍 ${profile.profile.location}`);
  if (profile.profile.linkedin_url) contactInfo.push(`🔗 LinkedIn`);
  if (profile.profile.github_url) contactInfo.push(`💻 GitHub`);

  if (contactInfo.length > 0) {
    sections.push(
      new Paragraph({
        text: contactInfo.join(' • '),
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );
  }

  // Professional Summary
  if (profile.profile.summary) {
    sections.push(createSectionHeader(translations.summary, true));
    sections.push(
      new Paragraph({
        text: profile.profile.summary,
        spacing: { after: 200 },
      })
    );
  }

  // Work Experience
  if (profile.experiences && profile.experiences.length > 0) {
    sections.push(createSectionHeader(translations.experience, true));

    profile.experiences.forEach((exp: Experience) => {
      // Job Title & Company
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.title} - ${exp.company}`,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );

      // Date & Location
      const dateStr = formatDateRange(exp.start_date, exp.end_date, exp.is_current, language);
      const locationStr = exp.location ? ` • ${exp.location}` : '';

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dateStr + locationStr,
              italics: true,
              color: '666666',
            }),
          ],
          spacing: { after: 100 },
        })
      );

      // Description
      if (exp.description) {
        sections.push(
          new Paragraph({
            text: exp.description,
            spacing: { after: 100 },
          })
        );
      }

      // Achievements
      if (exp.achievements) {
        const achievements = exp.achievements.split('\n').filter((a: string) => a.trim());
        achievements.forEach((achievement: string) => {
          sections.push(
            new Paragraph({
              text: `• ${achievement.trim()}`,
              spacing: { after: 50 },
              indent: { left: convertInchesToTwip(0.25) },
            })
          );
        });
      }

      sections.push(new Paragraph({ spacing: { after: 150 } }));
    });
  }

  // Education
  if (profile.education && profile.education.length > 0) {
    sections.push(createSectionHeader(translations.education, true));

    profile.education.forEach((edu: Education) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.degree} - ${edu.institution}`,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );

      const dateStr = formatDateRange(edu.start_date, edu.end_date, false, language);
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dateStr,
              italics: true,
              color: '666666',
            }),
          ],
          spacing: { after: 100 },
        })
      );

      if (edu.field_of_study) {
        sections.push(
          new Paragraph({
            text: edu.field_of_study,
            spacing: { after: 150 },
          })
        );
      }
    });
  }

  // Skills
  if (profile.skills && profile.skills.length > 0) {
    sections.push(createSectionHeader(translations.skills, true));

    const skillsText = profile.skills
      .map((skill: Skill) => skill.name)
      .join(' • ');

    sections.push(
      new Paragraph({
        text: skillsText,
        spacing: { after: 200 },
      })
    );
  }

  // Languages
  if (profile.languages && profile.languages.length > 0) {
    sections.push(createSectionHeader(translations.languages, true));

    profile.languages.forEach((lang: any) => {
      sections.push(
        new Paragraph({
          text: `${lang.name} - ${lang.proficiency}`,
          spacing: { after: 100 },
        })
      );
    });
  }

  // Certifications
  if (profile.certifications && profile.certifications.length > 0) {
    sections.push(createSectionHeader(translations.certifications, true));

    profile.certifications.forEach((cert: any) => {
      const certText = `${cert.name} - ${cert.issuer}`;
      const dateText = cert.issue_date ? ` (${formatDate(cert.issue_date, language)})` : '';

      sections.push(
        new Paragraph({
          text: certText + dateText,
          spacing: { after: 100 },
        })
      );
    });
  }

  // Portfolio
  if (profile.portfolio && profile.portfolio.length > 0) {
    sections.push(createSectionHeader(translations.portfolio, true));

    profile.portfolio.slice(0, 5).forEach((item: any) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item.title,
              bold: true,
            }),
            item.url ? new TextRun({
              text: ` - ${item.url}`,
              color: '2563eb',
            }) : new TextRun({ text: '' }),
          ],
          spacing: { after: 50 },
        })
      );

      if (item.description) {
        sections.push(
          new Paragraph({
            text: item.description,
            spacing: { after: 100 },
            indent: { left: convertInchesToTwip(0.25) },
          })
        );
      }
    });
  }

  // Verified Credentials
  if (stamps && stamps.length > 0) {
    sections.push(createSectionHeader(translations.verified + ' Credentials', true));

    stamps.forEach((stamp: Stamp) => {
      sections.push(
        new Paragraph({
          text: `✓ ${formatStampType(stamp.stamp_type, language)}`,
          spacing: { after: 100 },
        })
      );
    });
  }

  // Footer
  sections.push(
    new Paragraph({
      text: `Generated with YourCVPassport - ${new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}`,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      style: 'footer',
    })
  );

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children: sections,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              before: 0,
              after: 0,
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 32, // 16pt
            bold: true,
            color: '2563eb', // Modern blue
          },
          paragraph: {
            spacing: {
              before: 0,
              after: 200,
            },
          },
        },
        {
          id: 'heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 28, // 14pt
            bold: true,
            color: '1a1a1a',
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
            border: {
              bottom: {
                color: '2563eb',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          },
        },
        {
          id: 'subtitle',
          name: 'Subtitle',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 24, // 12pt
            color: '666666',
          },
        },
        {
          id: 'footer',
          name: 'Footer',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 18, // 9pt
            color: '999999',
          },
        },
      ],
    },
  });
}

/**
 * Plantilla Classic DOCX (similar a Modern pero más conservadora)
 */
function generateClassicDOCX(
  data: ATSProcessedData,
  language: 'en' | 'es'
): Document {
  // Similar a Modern pero con Times New Roman y sin color
  const doc = generateModernDOCX(data, language);

  // Modificar estilos para Classic
  // (esto es simplificado, en producción modificarías los estilos)
  return doc;
}

/**
 * Plantilla Minimal DOCX (ultra-limpia)
 */
function generateMinimalDOCX(
  data: ATSProcessedData,
  language: 'en' | 'es'
): Document {
  // Similar a Modern pero con menos elementos visuales
  const doc = generateModernDOCX(data, language);
  return doc;
}

/**
 * Helper: Crear header de sección
 */
function createSectionHeader(text: string, withBorder: boolean = true): Paragraph {
  return new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    style: 'heading2',
  });
}

/**
 * Helper: Formatear rango de fechas
 */
function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
  language: 'en' | 'es'
): string {
  const start = startDate ? formatDate(startDate, language) : '';
  const end = isCurrent
    ? language === 'es' ? 'Presente' : 'Present'
    : endDate ? formatDate(endDate, language) : '';

  return `${start} - ${end}`;
}

/**
 * Helper: Formatear fecha
 */
function formatDate(date: string | null, language: 'en' | 'es'): string {
  if (!date) return '';

  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };

  return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options);
}

/**
 * Helper: Formatear tipo de stamp
 */
function formatStampType(type: string, language: 'en' | 'es'): string {
  const labels: Record<string, Record<string, string>> = {
    en: {
      EMAIL: 'Email Verified',
      PHONE: 'Phone Verified',
      IDENTITY: 'Identity Verified',
      LINKEDIN: 'LinkedIn Connected',
      GITHUB: 'GitHub Verified',
      EDUCATION: 'Education Verified',
      EXPERIENCE: 'Work Experience Verified',
      CERTIFICATION: 'Certification Verified',
    },
    es: {
      EMAIL: 'Email Verificado',
      PHONE: 'Teléfono Verificado',
      IDENTITY: 'Identidad Verificada',
      LINKEDIN: 'LinkedIn Conectado',
      GITHUB: 'GitHub Verificado',
      EDUCATION: 'Educación Verificada',
      EXPERIENCE: 'Experiencia Laboral Verificada',
      CERTIFICATION: 'Certificación Verificada',
    },
  };

  return labels[language]?.[type] || type;
}

/**
 * Helper: Obtener traducciones
 */
function getTranslations(language: 'en' | 'es') {
  const translations = {
    en: {
      summary: 'Professional Summary',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      certifications: 'Certifications',
      portfolio: 'Portfolio',
      verified: 'Verified',
    },
    es: {
      summary: 'Resumen Profesional',
      experience: 'Experiencia Laboral',
      education: 'Educación',
      skills: 'Habilidades',
      languages: 'Idiomas',
      certifications: 'Certificaciones',
      portfolio: 'Portafolio',
      verified: 'Verificado',
    },
  };

  return translations[language];
}

/**
 * Helper: Generar nombre de archivo
 */
export function generateDOCXFileName(name: string, template: ATSTemplateType): string {
  const sanitizedName = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const date = new Date().toISOString().split('T')[0];

  return `cv-${sanitizedName}-${template}-${date}.docx`;
}
