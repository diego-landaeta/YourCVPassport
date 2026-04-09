import React from 'react';
import { FullProfileData } from '../../types';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
  HeartIcon,
  SparklesIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
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
  const { profile, experiences = [], education = [], skills = [], languages = [], portfolioItems = [], stamps = [], certifications = [], services = [], stats = [], recommendations = [] } = data || {};
  const accentColor = color || '#0D9488';
  const accentLight = `${accentColor}10`;
  const accentMedium = `${accentColor}20`;
  const accentStrong = `${accentColor}30`;
  const t = useTranslations();
  const { lang } = useLanguage();

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' });
  };

  const certItems = portfolioItems?.filter(item => item.type === 'CERTIFICATION') || [];
  const teachingItems = portfolioItems?.filter(item => item.type !== 'CERTIFICATION') || [];

  // Social links available in profile
  const socialLinks = [
    profile.linkedin_url && { label: 'LinkedIn', url: profile.linkedin_url },
    profile.portfolio_url && { label: lang === 'es' ? 'Web' : 'Website', url: profile.portfolio_url },
    profile.github_url && { label: 'GitHub', url: profile.github_url },
  ].filter(Boolean) as { label: string; url: string }[];

  // Psi symbol for psychology branding
  const PsiIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="22" fontFamily="Georgia, serif" fontWeight="bold">
        &#936;
      </text>
    </svg>
  );

  // Section header component for consistency
  const SectionHeader = ({ icon: Icon, title, usePsi }: { icon?: React.ElementType; title: string; usePsi?: boolean }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentLight }}>
        {usePsi ? <PsiIcon className="w-6 h-6" /> : Icon && <Icon className="w-5 h-5" style={{ color: accentColor }} />}
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h2>
    </div>
  );

  // Skill level badge — uses accentColor dynamically
  const SkillLevelBadge = ({ level }: { level?: string | null }) => {
    if (!level) return null;
    const normalized = level.toUpperCase();
    const config: Record<string, { opacity: string; label: string }> = {
      EXPERT: { opacity: '25', label: 'Expert' },
      ADVANCED: { opacity: '18', label: lang === 'es' ? 'Avanzado' : 'Advanced' },
      INTERMEDIATE: { opacity: '12', label: lang === 'es' ? 'Intermedio' : 'Intermediate' },
      BEGINNER: { opacity: '08', label: lang === 'es' ? 'Básico' : 'Beginner' },
    };
    const c = config[normalized] || config.INTERMEDIATE;
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
        style={{ backgroundColor: `${accentColor}${c.opacity}`, color: accentColor }}
      >
        {c.label}
      </span>
    );
  };

  return (
    <div className="font-sans bg-white dark:bg-dark-bg-primary">
      {/* ===== HEADER ===== */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-dark-bg-secondary dark:via-dark-bg-tertiary dark:to-dark-bg-secondary" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Avatar with Psi badge */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl shadow-xl ring-4 ring-white/80 dark:ring-dark-bg-primary overflow-hidden"
                   style={{ backgroundColor: profile.avatar_url ? 'transparent' : accentColor }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-white text-4xl sm:text-5xl font-bold">
                    {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg flex items-center justify-center text-white"
                   style={{ backgroundColor: accentColor }}>
                <PsiIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </div>

            {/* Name, headline, meta */}
            <div className="flex-1 text-center sm:text-left pt-0 sm:pt-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                {profile.full_name}
              </h1>
              <p className="text-lg sm:text-xl font-semibold mb-3" style={{ color: accentColor }}>
                {profile.headline}
              </p>

              {/* Location + Colegiado badge */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                {profile.country_code && (
                  <CountryBadge countryCode={profile.country_code} size="sm" showName={true} lang="es" />
                )}
                {profile.location && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{profile.location}</span>
                )}
                {/* Colegiado / License number — stored in meta_title */}
                {profile.meta_title && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                        style={{ borderColor: accentColor, color: accentColor, backgroundColor: accentLight }}>
                    <CheckBadgeIcon className="w-3.5 h-3.5" />
                    {profile.meta_title}
                  </span>
                )}
              </div>

              {/* Social links inline */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                  {socialLinks.map((link) => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:opacity-80 transition-opacity"
                       style={{ color: accentColor }}>
                      <LinkIcon className="w-3.5 h-3.5" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Contact buttons */}
              <div className="mt-2">
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

      {/* ===== STATS BAR ===== */}
      {stats.length > 0 && (
        <div className="border-b dark:border-gray-700" style={{ borderColor: accentStrong }}>
          <div className="max-w-5xl mx-auto px-6 sm:px-10 py-6">
            <div className={`grid gap-6 ${stats.length <= 3 ? `grid-cols-${stats.length}` : 'grid-cols-2 sm:grid-cols-4'}`}
                 style={{ gridTemplateColumns: stats.length <= 4 ? `repeat(${stats.length}, 1fr)` : undefined }}>
              {stats.map((stat) => (
                <div key={stat.id} className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: accentColor }}>
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== BODY — Two column layout ===== */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ===== MAIN COLUMN (2/3) ===== */}
          <div className="lg:col-span-2 space-y-10">

            {/* --- PERFIL PROFESIONAL --- */}
            {profile.summary && (
              <section>
                <SectionHeader usePsi title={lang === 'es' ? 'Perfil Profesional' : 'Professional Profile'} />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px] whitespace-pre-wrap pl-0 sm:pl-[52px]">
                  {profile.summary}
                </p>
              </section>
            )}

            {/* --- EXPERIENCIA CLÍNICA Y PROFESIONAL --- */}
            {experiences.length > 0 && (
              <section>
                <SectionHeader icon={BriefcaseIcon} title={lang === 'es' ? 'Experiencia Clínica y Profesional' : 'Clinical & Professional Experience'} />
                <div className="space-y-6 pl-0 sm:pl-[52px]">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="relative pl-6 border-l-2 dark:border-gray-700" style={{ borderColor: `${accentColor}40` }}>
                      <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full -translate-x-[7px] ring-2 ring-white dark:ring-dark-bg-primary"
                           style={{ backgroundColor: accentColor }} />
                      <div className="flex flex-wrap justify-between items-baseline gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{exp.position}</h3>
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
                <SectionHeader icon={AcademicCapIcon} title={lang === 'es' ? 'Formación Académica' : 'Education'} />
                <div className="space-y-3 pl-0 sm:pl-[52px]">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex gap-4 p-4 rounded-xl border dark:border-gray-700"
                         style={{ borderColor: `${accentColor}20`, backgroundColor: accentLight }}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                           style={{ backgroundColor: accentMedium }}>
                        <AcademicCapIcon className="w-5 h-5" style={{ color: accentColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
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

            {/* --- RECOMENDACIONES / TESTIMONIOS --- */}
            {recommendations && recommendations.length > 0 && (
              <section>
                <SectionHeader icon={ChatBubbleLeftRightIcon} title={lang === 'es' ? 'Recomendaciones' : 'Recommendations'} />
                <div className="space-y-4 pl-0 sm:pl-[52px]">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="relative p-5 rounded-xl border dark:border-gray-700"
                         style={{ borderColor: `${accentColor}20`, backgroundColor: accentLight }}>
                      {/* Quote mark */}
                      <div className="absolute top-3 right-4 text-4xl font-serif leading-none opacity-20" style={{ color: accentColor }}>"</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic relative z-10 mb-4">
                        {rec.recommendation_text}
                      </p>
                      <div className="flex items-center gap-3 relative z-10">
                        {rec.recommender_avatar_url && (
                          <img src={rec.recommender_avatar_url} alt={rec.recommender_name}
                               className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg-primary" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{rec.recommender_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {rec.recommender_title}
                            {rec.recommender_company && ` · ${rec.recommender_company}`}
                          </p>
                        </div>
                        {rec.relationship && (
                          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: accentMedium, color: accentColor }}>
                            {rec.relationship}
                          </span>
                        )}
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
          <div className="lg:col-span-1 space-y-5">

            {/* --- SERVICIOS TERAPÉUTICOS --- */}
            {services && services.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: accentStrong }}>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <HeartIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Servicios' : 'Services'}</span>
                </h3>
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div key={svc.id} className="p-3 rounded-lg" style={{ backgroundColor: accentLight }}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{svc.title}</p>
                      {svc.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{svc.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- ESPECIALIDADES --- */}
            {skills.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: accentStrong }}>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Especialidades' : 'Specializations'}</span>
                </h3>
                <div className="space-y-1.5">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-2.5 rounded-lg"
                         style={{ backgroundColor: accentLight }}>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{skill.name}</span>
                      <SkillLevelBadge level={skill.level} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- IDIOMAS --- */}
            {languages.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: accentStrong }}>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Idiomas' : 'Languages'}</span>
                </h3>
                <div className="space-y-1.5">
                  {languages.map((language) => (
                    <div key={language.id} className="flex items-center justify-between p-3 rounded-lg"
                         style={{ backgroundColor: accentLight }}>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {(t as any).languageNames?.[language.name] || language.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: language.is_native ? `${accentColor}20` : `${accentColor}12`,
                              color: accentColor
                            }}>
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
                   style={{ borderColor: accentStrong }}>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckBadgeIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Certificaciones' : 'Certifications'}</span>
                </h3>
                <div className="space-y-2.5">
                  {certItems.map((cert) => (
                    <div key={cert.id} className="p-3 rounded-lg"
                         style={{ backgroundColor: accentLight, borderLeft: `3px solid ${accentColor}` }}>
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
            {teachingItems.length > 0 && (
              <div className="rounded-2xl p-5 shadow-sm border dark:border-gray-700"
                   style={{ borderColor: accentStrong }}>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5" style={{ color: accentColor }} />
                  <span>{lang === 'es' ? 'Docencia' : 'Teaching'}</span>
                </h3>
                <div className="space-y-2">
                  {teachingItems.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg" style={{ backgroundColor: accentLight }}>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.description}</p>
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
            )}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t dark:border-gray-700 py-6 px-6 sm:px-10"
              style={{ borderColor: `${accentColor}20` }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
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
