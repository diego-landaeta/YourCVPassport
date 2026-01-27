// @ts-nocheck
/**
 * Admin Modern Template - Enhanced version with photo
 *
 * Plantilla moderna mejorada para uso del administrador:
 * - Incluye foto de perfil
 * - Diseño profesional y completo
 * - Información de contacto visible
 * - Optimizado para descarga por admin
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { ATSProcessedData } from '../../../types/ats-export.types';
import { ATS_TEMPLATE_CONFIGS, formatDateRange, sanitizeText } from '../../../utils/pdf/ats-optimizer';

interface AdminModernTemplateProps {
  data: ATSProcessedData;
  language?: 'en' | 'es';
}

const config = ATS_TEMPLATE_CONFIGS.modern;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    color: '#1f2937',
  },
  // Header with photo
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2pt solid #2563eb',
  },
  photoContainer: {
    width: 80,
    height: 80,
    marginRight: 20,
    borderRadius: 40,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1f2937',
  },
  headline: {
    fontSize: 13,
    marginBottom: 8,
    color: '#4b5563',
  },
  contactInfo: {
    fontSize: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  contactItem: {
    marginRight: 12,
    color: '#6b7280',
  },
  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563eb',
    paddingBottom: 4,
    borderBottom: '1pt solid #e5e7eb',
  },
  // Summary
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    textAlign: 'justify',
    color: '#374151',
  },
  // Experience
  experienceItem: {
    marginBottom: 12,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  position: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dateRange: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  company: {
    fontSize: 10,
    fontWeight: 'medium',
    color: '#4b5563',
    marginBottom: 2,
  },
  location: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    marginTop: 3,
    color: '#374151',
  },
  // Education
  educationItem: {
    marginBottom: 10,
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  degree: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  institution: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 1,
  },
  fieldOfStudy: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  // Skills
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillItem: {
    fontSize: 9,
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    padding: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    borderRadius: 2,
  },
  // Languages
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageItem: {
    fontSize: 10,
    marginRight: 12,
    marginBottom: 4,
  },
  languageName: {
    fontWeight: 'bold',
  },
  languageLevel: {
    color: '#6b7280',
    fontSize: 9,
  },
  // Certifications
  certificationItem: {
    marginBottom: 8,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  certName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  certDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  certIssuer: {
    fontSize: 9,
    color: '#4b5563',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  },
});

const AdminModernTemplate: React.FC<AdminModernTemplateProps> = ({ data, language = 'es' }) => {
  const { profile, stamps } = data;
  const p = profile.profile;

  const t = {
    es: {
      contact: 'Información de Contacto',
      summary: 'Resumen Profesional',
      experience: 'Experiencia Laboral',
      education: 'Educación',
      skills: 'Habilidades',
      languages: 'Idiomas',
      certifications: 'Certificaciones',
      portfolio: 'Portafolio',
      present: 'Presente',
      powered: 'Generado por YourCVPassport'
    },
    en: {
      contact: 'Contact Information',
      summary: 'Professional Summary',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      certifications: 'Certifications',
      portfolio: 'Portfolio',
      present: 'Present',
      powered: 'Generated by YourCVPassport'
    }
  };

  const translations = t[language];

  // Get profile photo URL
  const photoUrl = p.photo_url || p.avatar_url || (p as any).profile_photo_url;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Photo */}
        <View style={styles.headerContainer}>
          {photoUrl && (
            <View style={styles.photoContainer}>
              <Image src={photoUrl} style={styles.photo} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{sanitizeText(p.full_name || '')}</Text>
            {p.headline && (
              <Text style={styles.headline}>{sanitizeText(p.headline)}</Text>
            )}
            <View style={styles.contactInfo}>
              {p.email && (
                <Text style={styles.contactItem}>📧 {p.email}</Text>
              )}
              {p.location && (
                <Text style={styles.contactItem}>📍 {sanitizeText(p.location)}</Text>
              )}
              {p.country_code && (
                <Text style={styles.contactItem}>🌍 {p.country_code}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Summary */}
        {p.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.summary}</Text>
            <Text style={styles.summary}>{sanitizeText(p.summary)}</Text>
          </View>
        )}

        {/* Work Experience */}
        {profile.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.experience}</Text>
            {profile.experiences.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.positionRow}>
                  <Text style={styles.position}>{sanitizeText(exp.position || '')}</Text>
                  <Text style={styles.dateRange}>
                    {formatDateRange(exp.start_date, exp.end_date, exp.is_current, language)}
                  </Text>
                </View>
                {exp.company && (
                  <Text style={styles.company}>{sanitizeText(exp.company)}</Text>
                )}
                {exp.location && (
                  <Text style={styles.location}>{sanitizeText(exp.location)}</Text>
                )}
                {exp.description && (
                  <Text style={styles.description}>{sanitizeText(exp.description)}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {profile.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.education}</Text>
            {profile.education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.degreeRow}>
                  <Text style={styles.degree}>{sanitizeText(edu.degree || '')}</Text>
                  <Text style={styles.dateRange}>
                    {formatDateRange(edu.start_date, edu.end_date, false, language)}
                  </Text>
                </View>
                {edu.institution && (
                  <Text style={styles.institution}>{sanitizeText(edu.institution)}</Text>
                )}
                {edu.field_of_study && (
                  <Text style={styles.fieldOfStudy}>{sanitizeText(edu.field_of_study)}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.skills}</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, index) => (
                <Text key={index} style={styles.skillItem}>
                  {sanitizeText(skill.name || '')}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {profile.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.languages}</Text>
            <View style={styles.languagesContainer}>
              {profile.languages.map((lang, index) => (
                <View key={index} style={styles.languageItem}>
                  <Text style={styles.languageName}>{sanitizeText(lang.language || '')}</Text>
                  {lang.proficiency && (
                    <Text style={styles.languageLevel}> - {sanitizeText(lang.proficiency)}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {profile.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.certifications}</Text>
            {profile.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <View style={styles.certRow}>
                  <Text style={styles.certName}>{sanitizeText(cert.name || '')}</Text>
                  {cert.issue_date && (
                    <Text style={styles.certDate}>{cert.issue_date}</Text>
                  )}
                </View>
                {cert.issuer && (
                  <Text style={styles.certIssuer}>{sanitizeText(cert.issuer)}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>{translations.powered}</Text>
      </Page>
    </Document>
  );
};

export default AdminModernTemplate;
