/**
 * Minimal ATS Template
 *
 * Plantilla minimalista optimizada para ATS:
 * - Fuente sans-serif (Helvetica)
 * - Máximo whitespace para legibilidad
 * - Ultra-clean, estética moderna
 * - Enfoque en contenido, mínimo diseño
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

interface MinimalATSTemplateProps {
  data: ATSProcessedData;
  language?: 'en' | 'es';
}

// Configuración de la plantilla
const config = ATS_TEMPLATE_CONFIGS.minimal;

// Estilos minimalistas optimizados para ATS
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
  // Header ultra-minimalista
  header: {
    marginBottom: config.spacing.sectionGap + 10,
  },
  name: {
    fontSize: config.font.size.h1,
    fontWeight: 'bold',
    marginBottom: 10,
    color: config.colors.primary,
    letterSpacing: 1,
  },
  headline: {
    fontSize: config.font.size.h3,
    marginBottom: 15,
    color: config.colors.secondary,
    fontWeight: 'light',
    lineHeight: 1.6,
  },
  contactInfo: {
    fontSize: config.font.size.small,
    lineHeight: 1.8,
    marginTop: 12,
    color: config.colors.muted,
  },
  contactItem: {
    marginBottom: 3,
  },
  // Secciones con máximo whitespace
  section: {
    marginBottom: config.spacing.sectionGap,
  },
  sectionTitle: {
    fontSize: config.font.size.h2,
    fontWeight: 'bold',
    marginBottom: config.spacing.itemGap + 4,
    color: config.colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Summary limpio
  summary: {
    fontSize: config.font.size.body,
    lineHeight: config.font.lineHeight,
    color: config.colors.text,
    textAlign: 'left',
  },
  // Experience items minimalistas
  experienceItem: {
    marginBottom: config.spacing.itemGap + 6,
  },
  position: {
    fontSize: config.font.size.h3,
    fontWeight: 'bold',
    marginBottom: 4,
    color: config.colors.primary,
  },
  companyDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  company: {
    fontSize: config.font.size.body,
    color: config.colors.secondary,
  },
  dateRange: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  location: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
    marginBottom: 8,
  },
  description: {
    fontSize: config.font.size.body,
    lineHeight: config.font.lineHeight,
    marginTop: 6,
    color: config.colors.text,
  },
  achievements: {
    marginTop: 8,
  },
  achievement: {
    fontSize: config.font.size.body,
    marginBottom: 5,
    paddingLeft: 0,
    color: config.colors.text,
    lineHeight: config.font.lineHeight,
  },
  // Education minimalista
  educationItem: {
    marginBottom: config.spacing.itemGap + 4,
  },
  degree: {
    fontSize: config.font.size.h3,
    fontWeight: 'bold',
    marginBottom: 4,
    color: config.colors.primary,
  },
  institutionDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  institution: {
    fontSize: config.font.size.body,
    color: config.colors.secondary,
  },
  fieldOfStudy: {
    fontSize: config.font.size.body,
    color: config.colors.muted,
    marginBottom: 3,
  },
  grade: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  // Skills ultra-limpios
  skillsContainer: {
    lineHeight: 2,
  },
  skillItem: {
    fontSize: config.font.size.body,
    marginBottom: 5,
    color: config.colors.text,
  },
  skillDivider: {
    color: config.colors.muted,
  },
  // Languages
  languageItem: {
    fontSize: config.font.size.body,
    marginBottom: 6,
    color: config.colors.text,
  },
  languageLevel: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  // Certifications
  certificationItem: {
    marginBottom: config.spacing.itemGap,
  },
  certName: {
    fontSize: config.font.size.body,
    fontWeight: 'bold',
    marginBottom: 3,
    color: config.colors.primary,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  certIssuer: {
    fontSize: config.font.size.body,
    color: config.colors.secondary,
  },
  certDate: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  certId: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
    marginTop: 2,
  },
  // Portfolio
  portfolioItem: {
    marginBottom: config.spacing.itemGap,
  },
  portfolioTitle: {
    fontSize: config.font.size.body,
    fontWeight: 'bold',
    marginBottom: 4,
    color: config.colors.primary,
  },
  portfolioDescription: {
    fontSize: config.font.size.body,
    color: config.colors.text,
    marginBottom: 3,
    lineHeight: config.font.lineHeight,
  },
  portfolioUrl: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  // Verification stamps minimalistas
  stampsSection: {
    marginTop: config.spacing.sectionGap + 10,
    paddingTop: 15,
  },
  stampsTitle: {
    fontSize: config.font.size.small,
    fontWeight: 'bold',
    marginBottom: 10,
    color: config.colors.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  stampsList: {
    lineHeight: 2,
  },
  stampBadge: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
    marginBottom: 4,
  },
});

export const MinimalATSTemplate: React.FC<MinimalATSTemplateProps> = ({
  data,
  language = 'en',
}) => {
  const { profile, stamps, sections } = data;
  const p = profile.profile;

  // Helper para obtener el nombre del stamp type
  const getStampLabel = (type: StampType): string => {
    const labels: Record<StampType, { en: string; es: string }> = {
      EMAIL: { en: 'Email Verified', es: 'Email Verificado' },
      PHONE: { en: 'Phone Verified', es: 'Teléfono Verificado' },
      IDENTITY: { en: 'Identity Verified', es: 'Identidad Verificada' },
      EDUCATION: { en: 'Education Verified', es: 'Educación Verificada' },
      CERTIFICATION: { en: 'Certification Verified', es: 'Certificación Verificada' },
      EMPLOYMENT: { en: 'Employment Verified', es: 'Empleo Verificado' },
      SKILL: { en: 'Skill Verified', es: 'Habilidad Verificada' },
    };
    return labels[type][language];
  };

  return (
    <Document
      title={`CV - ${p.full_name}`}
      author={p.full_name}
      subject="Professional Resume - Minimal"
      keywords={data.keywords.join(', ')}
      creator="YourCVPassport"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER - Minimal Design */}
        <View style={styles.header}>
          <Text style={styles.name}>{sanitizeText(p.full_name)}</Text>
          {p.headline && (
            <Text style={styles.headline}>{sanitizeText(p.headline)}</Text>
          )}
          <View style={styles.contactInfo}>
            {p.email && <Text style={styles.contactItem}>{p.email}</Text>}
            {p.phone && <Text style={styles.contactItem}>{p.phone}</Text>}
            {p.location && <Text style={styles.contactItem}>{p.location}</Text>}
            {p.linkedin_url && (
              <Text style={styles.contactItem}>{p.linkedin_url}</Text>
            )}
            {p.github_url && (
              <Text style={styles.contactItem}>{p.github_url}</Text>
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
                  <Text style={styles.position}>
                    {sanitizeText(exp.position)}
                  </Text>
                  <View style={styles.companyDateRow}>
                    <Text style={styles.company}>
                      {sanitizeText(exp.company_name)}
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
                  {exp.location && (
                    <Text style={styles.location}>
                      {sanitizeText(exp.location)}
                    </Text>
                  )}
                  {exp.description && (
                    <Text style={styles.description}>
                      {sanitizeText(exp.description)}
                    </Text>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.achievements}>
                      {exp.achievements.map((achievement, idx) => (
                        <Text key={idx} style={styles.achievement}>
                          {sanitizeText(achievement)}
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
                  <Text style={styles.degree}>{sanitizeText(edu.degree)}</Text>
                  <View style={styles.institutionDateRow}>
                    <Text style={styles.institution}>
                      {sanitizeText(edu.institution_name)}
                    </Text>
                    <Text style={styles.dateRange}>
                      {formatDateRange(
                        edu.start_date,
                        edu.end_date,
                        edu.is_current,
                        language
                      )}
                    </Text>
                  </View>
                  {edu.field_of_study && (
                    <Text style={styles.fieldOfStudy}>
                      {sanitizeText(edu.field_of_study)}
                    </Text>
                  )}
                  {edu.grade && (
                    <Text style={styles.grade}>
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
                  <Text key={skill.id || index} style={styles.skillItem}>
                    {sanitizeText(skill.name)}
                    {skill.level && (
                      <Text style={styles.skillDivider}> · {skill.level}</Text>
                    )}
                  </Text>
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
                  <Text style={styles.certName}>
                    {sanitizeText(cert.name)}
                  </Text>
                  <View style={styles.certRow}>
                    <Text style={styles.certIssuer}>
                      {sanitizeText(cert.issuer)}
                    </Text>
                    {cert.issue_date && (
                      <Text style={styles.certDate}>
                        {new Date(cert.issue_date).getFullYear()}
                      </Text>
                    )}
                  </View>
                  {cert.credential_id && (
                    <Text style={styles.certId}>
                      {language === 'en' ? 'Credential' : 'Credencial'}: {cert.credential_id}
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
              {profile.languages.map((lang, index) => (
                <Text key={lang.id || index} style={styles.languageItem}>
                  {sanitizeText(lang.name)}{' '}
                  <Text style={styles.languageLevel}>
                    · {lang.level}
                    {lang.is_native &&
                      ` · ${language === 'en' ? 'Native' : 'Nativo'}`}
                  </Text>
                </Text>
              ))}
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
              {language === 'en' ? 'Verified' : 'Verificado'}
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

export default MinimalATSTemplate;
