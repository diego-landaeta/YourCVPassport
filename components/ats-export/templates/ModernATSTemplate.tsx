// @ts-nocheck
/**
 * Modern ATS Template
 *
 * Plantilla moderna optimizada para ATS:
 * - Fuente sans-serif (Helvetica)
 * - Color azul profesional como acento
 * - Layout limpio y contemporáneo
 * - Optimizado para parsers ATS modernos
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { ATSProcessedData } from '../../../types/ats-export.types';
import { ATS_TEMPLATE_CONFIGS, formatDateRange, sanitizeText } from '../../../utils/pdf/ats-optimizer';
import { StampType } from '../../../types';

interface ModernATSTemplateProps {
  data: ATSProcessedData;
  language?: 'en' | 'es';
}

// Configuración de la plantilla
const config = ATS_TEMPLATE_CONFIGS.modern;

// Estilos modernos optimizados para ATS
const styles = StyleSheet.create({
  page: {
    fontFamily: config.font.family,
    fontSize: config.font.size.body,
    lineHeight: config.font.lineHeight,
    paddingTop: config.spacing.pageMargin.top,
    paddingRight: config.spacing.pageMargin.right,
    paddingBottom: config.spacing.pageMargin.bottom,
    paddingLeft: config.spacing.pageMargin.left,
    color: config.colors.text,
  },
  // Header moderno con acento de color
  header: {
    marginBottom: config.spacing.sectionGap,
    paddingBottom: 15,
  },
  name: {
    fontSize: config.font.size.h1,
    fontWeight: 'bold',
    marginBottom: 6,
    color: config.colors.accent,
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: config.font.size.h3,
    marginBottom: 10,
    color: config.colors.secondary,
    fontWeight: 'normal',
  },
  contactInfo: {
    fontSize: config.font.size.small,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 8,
    paddingTop: 8,
    borderTop: `2pt solid ${config.colors.accent}`,
  },
  contactItem: {
    marginRight: 15,
    color: config.colors.secondary,
  },
  // Secciones con estilo moderno
  section: {
    marginBottom: config.spacing.sectionGap,
  },
  sectionTitle: {
    fontSize: config.font.size.h2,
    fontWeight: 'bold',
    marginBottom: config.spacing.itemGap,
    color: config.colors.accent,
    paddingBottom: 6,
    borderBottom: `2pt solid ${config.colors.accent}`,
    letterSpacing: 0.3,
  },
  // Summary con mejor legibilidad
  summary: {
    fontSize: config.font.size.body,
    lineHeight: config.font.lineHeight,
    textAlign: 'justify',
    color: config.colors.text,
  },
  // Experience items con diseño moderno
  experienceItem: {
    marginBottom: config.spacing.itemGap,
    paddingLeft: 0,
  },
  experienceHeader: {
    marginBottom: 6,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  position: {
    fontSize: config.font.size.h3,
    fontWeight: 'bold',
    color: config.colors.primary,
  },
  dateRange: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
    fontStyle: 'italic',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  company: {
    fontSize: config.font.size.body,
    fontWeight: 'medium',
    color: config.colors.secondary,
  },
  location: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
    marginLeft: 8,
  },
  description: {
    fontSize: config.font.size.body,
    lineHeight: config.font.lineHeight,
    marginTop: 5,
    color: config.colors.text,
  },
  achievements: {
    marginTop: 6,
  },
  achievement: {
    fontSize: config.font.size.body,
    marginBottom: 4,
    paddingLeft: 12,
    color: config.colors.text,
  },
  // Education con diseño limpio
  educationItem: {
    marginBottom: config.spacing.itemGap,
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  degree: {
    fontSize: config.font.size.h3,
    fontWeight: 'bold',
    color: config.colors.primary,
  },
  institution: {
    fontSize: config.font.size.body,
    color: config.colors.secondary,
    marginBottom: 2,
  },
  fieldOfStudy: {
    fontSize: config.font.size.body,
    fontStyle: 'italic',
    color: config.colors.muted,
    marginBottom: 3,
  },
  // Skills en grid moderno
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillItem: {
    fontSize: config.font.size.body,
    backgroundColor: '#f3f4f6',
    padding: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 3,
  },
  skillWithLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillName: {
    fontWeight: 'medium',
  },
  skillLevel: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
    marginLeft: 4,
  },
  // Languages
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageItem: {
    fontSize: config.font.size.body,
    marginRight: 15,
    marginBottom: 6,
  },
  languageName: {
    fontWeight: 'medium',
  },
  languageLevel: {
    color: config.colors.muted,
    fontSize: config.font.size.small,
  },
  // Certifications con diseño moderno
  certificationItem: {
    marginBottom: config.spacing.itemGap - 4,
    paddingBottom: 8,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  certName: {
    fontSize: config.font.size.body,
    fontWeight: 'bold',
    color: config.colors.primary,
  },
  certDate: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  certIssuer: {
    fontSize: config.font.size.body,
    color: config.colors.secondary,
    marginBottom: 2,
  },
  certDetails: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  // Portfolio items
  portfolioItem: {
    marginBottom: config.spacing.itemGap - 4,
  },
  portfolioTitle: {
    fontSize: config.font.size.body,
    fontWeight: 'bold',
    color: config.colors.primary,
    marginBottom: 2,
  },
  portfolioDescription: {
    fontSize: config.font.size.body,
    color: config.colors.text,
    marginBottom: 2,
  },
  portfolioUrl: {
    fontSize: config.font.size.small,
    color: config.colors.accent,
  },
  // Verification stamps con diseño moderno
  stampsSection: {
    marginTop: config.spacing.sectionGap,
    paddingTop: 12,
    borderTop: `1pt solid ${config.colors.muted}`,
  },
  stampsTitle: {
    fontSize: config.font.size.small,
    fontWeight: 'bold',
    marginBottom: 8,
    color: config.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stampsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stampBadge: {
    fontSize: config.font.size.small,
    backgroundColor: '#eff6ff',
    color: config.colors.accent,
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    border: `1pt solid ${config.colors.accent}`,
    marginRight: 8,
    marginBottom: 6,
  },
});

export const ModernATSTemplate: React.FC<ModernATSTemplateProps> = ({
  data,
  language = 'en',
}) => {
  const { profile, stamps, sections } = data;
  const p = profile.profile;

  // Helper para obtener el nombre del stamp type
  const getStampLabel = (type: StampType): string => {
    const labels: Record<StampType, { en: string; es: string }> = {
      EMAIL: { en: 'Email ✓', es: 'Email ✓' },
      PHONE: { en: 'Phone ✓', es: 'Teléfono ✓' },
      IDENTITY: { en: 'ID ✓', es: 'ID ✓' },
      EDUCATION: { en: 'Education ✓', es: 'Educación ✓' },
      CERTIFICATION: { en: 'Certification ✓', es: 'Certificación ✓' },
      EMPLOYMENT: { en: 'Employment ✓', es: 'Empleo ✓' },
      SKILL: { en: 'Skill ✓', es: 'Habilidad ✓' },
    };
    return labels[type][language];
  };

  return (
    <Document
      title={`CV - ${p.full_name}`}
      author={p.full_name}
      subject="Professional Resume - Modern"
      keywords={data.keywords.join(', ')}
      creator="YourCVPassport"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER - Modern Design */}
        <View style={styles.header}>
          <Text style={styles.name}>{sanitizeText(p.full_name)}</Text>
          {p.headline && (
            <Text style={styles.headline}>{sanitizeText(p.headline)}</Text>
          )}
          <View style={styles.contactInfo}>
            {p.email && <Text style={styles.contactItem}>✉ {p.email}</Text>}
            {p.phone && <Text style={styles.contactItem}>☎ {p.phone}</Text>}
            {p.location && <Text style={styles.contactItem}>📍 {p.location}</Text>}
            {p.linkedin_url && (
              <Text style={styles.contactItem}>
                in/ {p.linkedin_url.replace('https://www.linkedin.com/in/', '').replace('/', '')}
              </Text>
            )}
            {p.github_url && (
              <Text style={styles.contactItem}>
                gh/ {p.github_url.replace('https://github.com/', '')}
              </Text>
            )}
          </View>
        </View>

        {/* PROFESSIONAL SUMMARY */}
        {sections.find((s) => s.type === 'summary')?.enabled && p.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {sections.find((s) => s.type === 'summary')?.title}
            </Text>
            <Text style={styles.summary}>{sanitizeText(p.summary)}</Text>
          </View>
        )}

        {/* WORK EXPERIENCE */}
        {sections.find((s) => s.type === 'experience')?.enabled &&
          profile.experiences &&
          profile.experiences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {sections.find((s) => s.type === 'experience')?.title}
              </Text>
              {profile.experiences.map((exp, index) => (
                <View key={exp.id || index} style={styles.experienceItem}>
                  <View style={styles.experienceHeader}>
                    <View style={styles.positionRow}>
                      <Text style={styles.position}>
                        {sanitizeText(exp.position)}
                      </Text>
                      <Text style={styles.dateRange}>
                        {formatDateRange(
                          exp.start_date,
                          exp.end_date,
                          exp.is_current,
                          language
                        )}
                      </Text>
                    </View>
                    <View style={styles.companyRow}>
                      <Text style={styles.company}>
                        {sanitizeText(exp.company_name)}
                      </Text>
                      {exp.location && (
                        <Text style={styles.location}>
                          • {sanitizeText(exp.location)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {exp.description && (
                    <Text style={styles.description}>
                      {sanitizeText(exp.description)}
                    </Text>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.achievements}>
                      {exp.achievements.map((achievement, idx) => (
                        <Text key={idx} style={styles.achievement}>
                          → {sanitizeText(achievement)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

        {/* EDUCATION */}
        {sections.find((s) => s.type === 'education')?.enabled &&
          profile.education &&
          profile.education.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {sections.find((s) => s.type === 'education')?.title}
              </Text>
              {profile.education.map((edu, index) => (
                <View key={edu.id || index} style={styles.educationItem}>
                  <View style={styles.degreeRow}>
                    <Text style={styles.degree}>{sanitizeText(edu.degree)}</Text>
                    <Text style={styles.dateRange}>
                      {formatDateRange(
                        edu.start_date,
                        edu.end_date,
                        edu.is_current,
                        language
                      )}
                    </Text>
                  </View>
                  <Text style={styles.institution}>
                    {sanitizeText(edu.institution_name)}
                  </Text>
                  {edu.field_of_study && (
                    <Text style={styles.fieldOfStudy}>
                      {sanitizeText(edu.field_of_study)}
                    </Text>
                  )}
                  {edu.grade && (
                    <Text style={styles.certDetails}>
                      {language === 'en' ? 'Grade' : 'Calificación'}:{' '}
                      {sanitizeText(edu.grade)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

        {/* SKILLS */}
        {sections.find((s) => s.type === 'skills')?.enabled &&
          profile.skills &&
          profile.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {sections.find((s) => s.type === 'skills')?.title}
              </Text>
              <View style={styles.skillsContainer}>
                {profile.skills.map((skill, index) => (
                  <View key={skill.id || index} style={styles.skillItem}>
                    <Text style={styles.skillName}>
                      {sanitizeText(skill.name)}
                      {skill.level && (
                        <Text style={styles.skillLevel}> • {skill.level}</Text>
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* CERTIFICATIONS */}
        {sections.find((s) => s.type === 'certifications')?.enabled &&
          profile.certifications &&
          profile.certifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {sections.find((s) => s.type === 'certifications')?.title}
              </Text>
              {profile.certifications.map((cert, index) => (
                <View key={cert.id || index} style={styles.certificationItem}>
                  <View style={styles.certRow}>
                    <Text style={styles.certName}>
                      {sanitizeText(cert.name)}
                    </Text>
                    {cert.issue_date && (
                      <Text style={styles.certDate}>
                        {new Date(cert.issue_date).getFullYear()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.certIssuer}>
                    {sanitizeText(cert.issuer)}
                  </Text>
                  {cert.credential_id && (
                    <Text style={styles.certDetails}>
                      ID: {cert.credential_id}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

        {/* LANGUAGES */}
        {sections.find((s) => s.type === 'languages')?.enabled &&
          profile.languages &&
          profile.languages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {sections.find((s) => s.type === 'languages')?.title}
              </Text>
              <View style={styles.languagesContainer}>
                {profile.languages.map((lang, index) => (
                  <Text key={lang.id || index} style={styles.languageItem}>
                    <Text style={styles.languageName}>
                      {sanitizeText(lang.name)}
                    </Text>
                    <Text style={styles.languageLevel}> • {lang.level}</Text>
                    {lang.is_native && (
                      <Text style={styles.languageLevel}>
                        {' '}({language === 'en' ? 'Native' : 'Nativo'})
                      </Text>
                    )}
                  </Text>
                ))}
              </View>
            </View>
          )}

        {/* PORTFOLIO */}
        {sections.find((s) => s.type === 'portfolio')?.enabled &&
          profile.portfolioItems &&
          profile.portfolioItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {sections.find((s) => s.type === 'portfolio')?.title}
              </Text>
              {profile.portfolioItems.slice(0, 5).map((item, index) => (
                <View key={item.id || index} style={styles.portfolioItem}>
                  <Text style={styles.portfolioTitle}>
                    {sanitizeText(item.title)}
                  </Text>
                  {item.description && (
                    <Text style={styles.portfolioDescription}>
                      {sanitizeText(item.description)}
                    </Text>
                  )}
                  {item.url && (
                    <Text style={styles.portfolioUrl}>{item.url}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

        {/* VERIFICATION STAMPS */}
        {config.showStamps && stamps.length > 0 && (
          <View style={styles.stampsSection}>
            <Text style={styles.stampsTitle}>
              {language === 'en'
                ? 'Verified Credentials'
                : 'Credenciales Verificadas'}
            </Text>
            <View style={styles.stampsList}>
              {stamps.map((stamp, index) => (
                <Text key={stamp.id || index} style={styles.stampBadge}>
                  {getStampLabel(stamp.type)}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ModernATSTemplate;
