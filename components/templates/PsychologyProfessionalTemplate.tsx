import React from 'react';
import { FullProfileData } from '../../types';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
  HeartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CountryBadge } from '../shared/CountrySelector';
import { ProfileContactButtons } from './ProfileContactButtons';
import PublicStampBadges from '../PublicStampBadges';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';

interface PsychologyProfessionalTemplateProps {
  data: FullProfileData;
  color?: string | null;
}

const PsychologyProfessionalTemplate: React.FC<PsychologyProfessionalTemplateProps> = ({ data, color }) => {
  const { profile, experiences = [], education = [], skills = [], languages = [], portfolioItems = [], stamps = [], certifications = [], services = [] } = data || {};
  const accentColor = color || '#0D9488'; // teal-600 — calma, confianza, salud mental
  const accentLight = `${accentColor}12`;
  const accentMedium = `${accentColor}20`;
  const t = useTranslations();
  const { lang } = useLanguage();

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' });
  };

  // Separate certifications from portfolio items
  const certItems = portfolioItems?.filter(item => item.type === 'CERTIFICATION') || [];

  // Psi symbol SVG for psychology branding
  const PsiIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="22" fontFamily="Georgia, serif" fontWeight="bold">
        &#936;
      </text>
    </svg>
  );

  // Skill level badge
  const SkillLevelBadge = ({ level }: { level?: string | null }) => {
    if (!level) return null;
    const config: Record<string, { bg: string; text: string; label: string }> = {
      EXPERT: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-800 dark:text-teal-300', label: 'Expert' },
      ADVANCED: { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-800 dark:text-cyan-300', label: 'Avanzado' },
      INTERMEDIATE: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-300', label: 'Intermedio' },
      BEGINNER: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'Básico' },
      // Support lowercase from CVs
      expert: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-800 dark:text-teal-300', label: 'Expert' },
      advanced: { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-800 dark:text-cyan-300', label: 'Avanzado' },
      intermediate: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-300', label: 'Intermedio' },
      beginner: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'Básico' },
    };
    const c = config[level] || config.INTERMEDIATE;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="font-sans bg-white dark:bg-dark-bg-primary">
      {/* ===== HEADER — Teal gradient with Psi branding ===== */}
      <header className="relative overflow-hidden">
        {/* Background pattern — subtle brain/neuron dots */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-dark-bg-secondary dark:via-dark-bg-tertiary dark:to-dark-bg-secondary" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />

        <div className="relative max-w-5xl mx-auto px-10 py-10">
          <div className="flex items-start gap-8">
            {/* Avatar with Psi badge */}
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 rounded-2xl shadow-xl ring-4 ring-white/80 dark:ring-dark-bg-primary overflow-hidden"
                   style={{ backgroundColor: profile.avatar_url ? 'transparent' : accentColor }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-white text-5xl font-bold">
                    {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Psi badge — professional psychology identifier */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-white"
                   style={{ backgroundColor: accentColor }}>
                <PsiIcon className="w-7 h-7" />
              </div>
            </div>

            {/* Name & headline */}
            <div className="flex-1 pt-1">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                {profile.full_name}
              </h1>
              <p className="text-xl font-semibold mb-3" style={{ color: accentColor }}>
                {profile.headline}
              </p>

              {/* Location & Country */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {profile.country_code && (
                  <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                )}
                {profile.location && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{profile.location}</span>
                )}
              </div>

              {/* Verification stamps inline */}
              {stamps && stamps.length > 0 && (
                <div className="mb-4">
                  <PublicStampBadges stamps={stamps} compact={true} />
                </div>
              )}

              {/* Contact buttons */}
              <div className="mt-3">
                <ProfileContactButtons
                  profileId={profile.id}
                  profileEmail={profile.email}
                  variant="compact"
                  accentColor={accentColor}
                  showDownload={false}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Bottom accent bar */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${accentColor}, #06B6D4, ${accentColor})` }} />
      </header>

      {/* ===== BODY — Two column layout ===== */}
      <div className="max-w-5xl mx-auto px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ===== MAIN COLUMN (2/3) ===== */}
          <div className="lg:col-span-2 space-y-10">

            {/* --- PERFIL PROFESIONAL --- */}
            {profile.summary && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentLight }}>
                    <PsiIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    {lang === 'es' ? 'Perfil Profesional' : 'Professional Profile'}
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px] whitespace-pre-wrap pl-[52px]">
                  {profile.summary}
                </p>
              </section>
            )}

            {/* --- EXPERIENCIA PROFESIONAL --- */}
            {experiences.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentLight }}>
                    <BriefcaseIcon className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    {lang === 'es' ? 'Experiencia Clínica y Profesional' : 'Clinical & Professional Experience'}
                  </h2>
                </div>
                <div className="space-y-6 pl-[52px]">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="relative pl-6 border-l-2 dark:border-gray-700" style={{ borderColor: `${accentColor}40` }}>
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full -translate-x-[7px] ring-2 ring-white dark:ring-dark-bg-primary"
                           style={{ backgroundColor: accentColor }} />
                      <div className="flex flex-wrap justify-between items-baseline gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{exp.position}</h3>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                              style={{ backgroundColor: accentMedium, color: accentColor }}>
                          {formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : (lang === 'es' ? 'Presente' : 'Present')}
                        </span>
                      </div>
                      <p className="font-semibold text-sm mb-2" style={{ color: accentColor }}>{exp.company_name}</p>
                      {exp.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {exp.achievements.map((ach, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <CheckBadgeIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                              <span>{ach}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- FORMACIÓN ACADÉMICA --- */}
            {education.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentLight }}>
                    <AcademicCapIcon className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    {lang === 'es' ? 'Formación Académica' : 'Education'}
                  </h2>
                </div>
                <div className="space-y-4 pl-[52px]">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex gap-4 p-4 rounded-xl border dark:border-gray-700"
                         style={{ borderColor: `${accentColor}25`, backgroundColor: accentLight }}>
                      <div className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center"
                           style={{ backgroundColor: accentMedium }}>
                        <AcademicCapIcon className="w-6 h-6" style={{ color: accentColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{edu.institution_name}</p>
                        {edu.field_of_study && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{edu.field_of_study}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(edu.start_date)} – {edu.end_date ? formatDate(edu.end_date) : (lang === 'es' ? 'En curso' : 'Ongoing')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- VERIFIED CREDENTIALS (Stamps) --- */}
            {stamps && stamps.length > 0 && (
              <section className="rounded-2xl p-6 border-2 dark:border-green-800"
                       style={{ borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }}>
                <PublicStampBadges stamps={stamps} showDetails={true} />
              </section>
            )}
          </div>

          {/* ===== SIDEBAR (1/3) ===== */}
          <div className="lg:col-span-1 space-y-6">

            {/* --- SERVICIOS TERAPÉUTICOS --- */}
            {services && services.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: `${accentColor}30` }}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <HeartIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Servicios' : 'Services'}</span>
                </h3>
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div key={svc.id} className="p-3 rounded-lg" style={{ backgroundColor: accentLight }}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{svc.title}</p>
                      {svc.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{svc.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- COMPETENCIAS Y ESPECIALIDADES --- */}
            {skills.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: `${accentColor}30` }}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Especialidades' : 'Specializations'}</span>
                </h3>
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-2.5 rounded-lg"
                         style={{ backgroundColor: accentLight }}>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{skill.name}</span>
                      <SkillLevelBadge level={skill.level} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- IDIOMAS --- */}
            {languages.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: `${accentColor}30` }}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Idiomas' : 'Languages'}</span>
                </h3>
                <div className="space-y-2">
                  {languages.map((language) => (
                    <div key={language.id} className="flex items-center justify-between p-3 rounded-lg"
                         style={{ backgroundColor: accentLight }}>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {(t as any).languageNames?.[language.name] || language.name}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        language.is_native
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300'
                          : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300'
                      }`}>
                        {language.is_native ? (lang === 'es' ? 'Nativo' : 'Native') : language.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- CERTIFICACIONES --- */}
            {certItems.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: `${accentColor}30` }}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckBadgeIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Certificaciones' : 'Certifications'}</span>
                </h3>
                <div className="space-y-3">
                  {certItems.map((cert) => (
                    <div key={cert.id} className="p-3 rounded-lg border-l-3"
                         style={{ backgroundColor: accentLight, borderLeftWidth: '3px', borderLeftColor: accentColor }}>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        {cert.title}
                        {cert.verified && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold rounded-full">
                            <CheckBadgeIcon className="w-3 h-3 mr-0.5" />
                            {lang === 'es' ? 'Verificada' : 'Verified'}
                          </span>
                        )}
                      </h4>
                      {cert.issuer && <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-0.5">{cert.issuer}</p>}
                      {cert.issue_date && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">{formatDate(cert.issue_date)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- DOCENCIA / FORMACIÓN QUE IMPARTE --- */}
            {(() => {
              const teachingItems = portfolioItems?.filter(item => item.type !== 'CERTIFICATION') || [];
              return teachingItems.length > 0 && (
                <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                     style={{ borderColor: `${accentColor}30` }}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AcademicCapIcon className="w-5 h-5" style={{ color: accentColor }} />
                    <span>{lang === 'es' ? 'Docencia' : 'Teaching'}</span>
                  </h3>
                  <div className="space-y-2">
                    {teachingItems.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg" style={{ backgroundColor: accentLight }}>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                    style={{ backgroundColor: accentMedium, color: accentColor }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t dark:border-gray-700 py-6 px-10"
              style={{ borderColor: `${accentColor}20` }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600">
            <PsiIcon className="w-4 h-4" />
            <span>{lang === 'es' ? 'Perfil profesional generado en' : 'Professional profile powered by'} YourCVPassport</span>
          </div>
          {profile.meta_description && (
            <span className="text-xs text-gray-400 dark:text-gray-600">{profile.meta_description}</span>
          )}
        </div>
      </footer>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 0.8cm; }
        }
      `}</style>
    </div>
  );
};

export default PsychologyProfessionalTemplate;
