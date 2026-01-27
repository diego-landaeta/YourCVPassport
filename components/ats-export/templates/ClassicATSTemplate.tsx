// @ts-nocheck
/**
 * Classic ATS Template
 *
 * Plantilla tradicional optimizada para ATS:
 * - Fuente serif (Times-Roman)
 * - Blanco y negro
 * - Layout conservador y profesional
 * - Máxima compatibilidad con parsers ATS
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { ATSProcessedData } from '../../../types/ats-export.types';
import { ATS_TEMPLATE_CONFIGS, formatDateRange, sanitizeText } from '../../../utils/pdf/ats-optimizer';
import { StampType } from '../../../types';

interface ClassicATSTemplateProps {
  data: ATSProcessedData;
  language?: 'en' | 'es';
}

// Configuración de la plantilla
const config = ATS_TEMPLATE_CONFIGS.classic;

// Estilos optimizados para ATS
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
  // Header con información de contacto
  header: {
    marginBottom: config.spacing.sectionGap,
    borderBottom: `1pt solid ${config.colors.primary}`,
    paddingBottom: 10,
  },
  name: {
    fontSize: config.font.size.h1,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headline: {
    fontSize: config.font.size.h3,
    marginBottom: 8,
    color: config.colors.secondary,
  },
  contactInfo: {
    fontSize: config.font.size.small,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  contactItem: {
    marginRight: 12,
  },
  // Secciones
  section: {
    marginBottom: config.spacing.sectionGap,
  },
  sectionTitle: {
    fontSize: config.font.size.h2,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: config.spacing.itemGap,
    borderBottom: `1pt solid ${config.colors.primary}`,
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
  // Summary
  summary: {
    fontSize: config.font.size.body,
    lineHeight: config.font.lineHeight,
    textAlign: 'justify',
  },
  // Experience items
  experienceItem: {
    marginBottom: config.spacing.itemGap,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  position: {
    fontSize: config.font.size.h3,
    fontWeight: 'bold',
  },
  company: {
    fontSize: config.font.size.body,
    marginBottom: 2,
  },
  date: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
  },
  location: {
    fontSize: config.font.size.small,
    color: config.colors.muted,
    marginBottom: 4,
  },
  description: {
    fontSize: config.font.size.body,
    lineHeight: config.font.lineHeight,
    marginTop: 4,
  },
  achievements: {
    marginTop: 4,
  },
  achievement: {
    fontSize: config.font.size.body,
    marginBottom: 3,
    paddingLeft: 10,
  },
  // Education items
  educationItem: {
    marginBottom: config.spacing.itemGap,
  },
  degree: {
    fontSize: config.font.size.h3,
    fontWeight: 'bold',
  },
  institution: {
    fontSize: config.font.size.body,
    marginBottom: 2,
  },
  fieldOfStudy: {
    fontSize: config.font.size.body,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  // Skills
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillItem: {
    fontSize: config.font.size.body,
    marginRight: 12,
    marginBottom: 4,
  },
  // Languages
  languageItem: {
    fontSize: config.font.size.body,
    marginBottom: 4,
  },
  // Certifications
  certificationItem: {
    marginBottom: config.spacing.itemGap - 4,
  },
  certName: {
    fontSize: config.font.size.body,
    fontWeight: 'bold',
  },
  certIssuer: {
    fontSize: config.font.size.body,
    color: config.colors.secondary,
  },
  // Verification stamps
  stampsSection: {
    marginTop: config.spacing.sectionGap,
    paddingTop: 10,
    borderTop: `1pt solid ${config.colors.muted}`,
  },
  stampsTitle: {
    fontSize: config.font.size.small,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  stampsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stampBadge: {
    fontSize: config.font.size.small - 1,
    padding: 3,
    border: `1pt solid ${config.colors.primary}`,
    marginRight: 6,
    marginBottom: 4,
  },
});

export const ClassicATSTemplate: React.FC<ClassicATSTemplateProps> = ({
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
      subject="Professional Resume"
      keywords={data.keywords.join(', ')}
      creator="YourCVPassport"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER - Contact Information */}
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
              <Text style={styles.contactItem}>
                LinkedIn: {p.linkedin_url.replace('https://', '')}
              </Text>
            )}
            {p.github_url && (
              <Text style={styles.contactItem}>
                GitHub: {p.github_url.replace('https://', '')}
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
                  <Text style={styles.position}>
                    {sanitizeText(exp.position)}
                  </Text>
                  <Text style={styles.company}>
                    {sanitizeText(exp.company_name)}
                  </Text>
                  <Text style={styles.date}>
                    {formatDateRange(
                      exp.start_date,
                      exp.end_date,
                      exp.is_current,
                      language
                    )}
                  </Text>
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
                          • {sanitizeText(achievement)}
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
                  <Text style={styles.institution}>
                    {sanitizeText(edu.institution_name)}
                  </Text>
                  {edu.field_of_study && (
                    <Text style={styles.fieldOfStudy}>
                      {sanitizeText(edu.field_of_study)}
                    </Text>
                  )}
                  <Text style={styles.date}>
                    {formatDateRange(
                      edu.start_date,
                      edu.end_date,
                      edu.is_current,
                      language
                    )}
                  </Text>
                  {edu.grade && (
                    <Text style={styles.description}>
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
                    {skill.level && ` (${skill.level})`}
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
                  <Text style={styles.certIssuer}>
                    {sanitizeText(cert.issuer)}
                    {cert.issue_date &&
                      ` - ${new Date(cert.issue_date).getFullYear()}`}
                  </Text>
                  {cert.credential_id && (
                    <Text style={styles.description}>
                      {language === 'en' ? 'Credential ID' : 'ID de Credencial'}:{' '}
                      {cert.credential_id}
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
                  {sanitizeText(lang.name)} - {lang.level}
                  {lang.is_native &&
                    ` (${language === 'en' ? 'Native' : 'Nativo'})`}
                </Text>
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
                  ✓ {getStampLabel(stamp.type)}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ClassicATSTemplate;
