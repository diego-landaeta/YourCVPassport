import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  LanguageIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

export interface MatchBreakdownData {
  skills?: {
    matched: number;
    total: number;
    matchedSkills?: string[];
    missingSkills?: string[];
  };
  experience?: {
    score: number;
    label: string;
  };
  education?: {
    score: number;
    label: string;
  };
  languages?: {
    matched: number;
    total: number;
    matchedLanguages?: string[];
  };
  location?: {
    score: number;
    label: string;
  };
}

interface MatchBreakdownProps {
  data: MatchBreakdownData;
  score: number;
  className?: string;
}

/**
 * Detailed breakdown of job match score factors
 *
 * Shows individual scores for:
 * - Skills match
 * - Experience level
 * - Education requirements
 * - Language requirements
 * - Location compatibility
 */
const MatchBreakdown: React.FC<MatchBreakdownProps> = ({
  data,
  score,
  className = ''
}) => {
  const { lang } = useLanguage();

  const translations = {
    es: {
      title: 'Desglose de compatibilidad',
      skills: 'Habilidades',
      experience: 'Experiencia',
      education: 'Educación',
      languages: 'Idiomas',
      location: 'Ubicación',
      of: 'de',
      matched: 'coinciden',
      missing: 'faltan',
      perfect: 'Perfecto',
      good: 'Bueno',
      fair: 'Aceptable',
      low: 'Bajo'
    },
    en: {
      title: 'Match Breakdown',
      skills: 'Skills',
      experience: 'Experience',
      education: 'Education',
      languages: 'Languages',
      location: 'Location',
      of: 'of',
      matched: 'matched',
      missing: 'missing',
      perfect: 'Perfect',
      good: 'Good',
      fair: 'Fair',
      low: 'Low'
    }
  };

  const t = translations[lang];

  const renderSkillsSection = () => {
    if (!data.skills) return null;

    const { matched, total, matchedSkills, missingSkills } = data.skills;
    const percentage = total > 0 ? Math.round((matched / total) * 100) : 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CodeBracketIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t.skills}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                percentage >= 80
                  ? 'bg-green-500'
                  : percentage >= 60
                  ? 'bg-amber-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {matched}/{total}
          </span>
        </div>
        {matchedSkills && matchedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {matchedSkills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1"
              >
                <CheckCircleIcon className="w-3 h-3" />
                {skill}
              </span>
            ))}
            {matchedSkills.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{matchedSkills.length - 5}
              </span>
            )}
          </div>
        )}
        {missingSkills && missingSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {missingSkills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full flex items-center gap-1"
              >
                <XCircleIcon className="w-3 h-3" />
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderExperienceSection = () => {
    if (!data.experience) return null;

    const { score: expScore, label } = data.experience;

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t.experience}
          </span>
        </div>
        <span
          className={`text-sm font-semibold ${
            expScore >= 80
              ? 'text-green-600 dark:text-green-400'
              : expScore >= 60
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  const renderEducationSection = () => {
    if (!data.education) return null;

    const { score: eduScore, label } = data.education;

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t.education}
          </span>
        </div>
        <span
          className={`text-sm font-semibold ${
            eduScore >= 80
              ? 'text-green-600 dark:text-green-400'
              : eduScore >= 60
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  const renderLanguagesSection = () => {
    if (!data.languages) return null;

    const { matched, total, matchedLanguages } = data.languages;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LanguageIcon className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {t.languages}
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {matched}/{total}
          </span>
        </div>
        {matchedLanguages && matchedLanguages.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-7">
            {matchedLanguages.map((language, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full"
              >
                {language}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLocationSection = () => {
    if (!data.location) return null;

    const { score: locScore, label } = data.location;

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t.location}
          </span>
        </div>
        <span
          className={`text-sm font-semibold ${
            locScore >= 80
              ? 'text-green-600 dark:text-green-400'
              : locScore >= 60
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`
        w-80 max-w-[90vw]
        bg-white dark:bg-dark-bg-secondary
        border-2 border-gray-200 dark:border-gray-700
        rounded-xl shadow-2xl
        p-4
        space-y-3
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t.title}
        </h3>
        <div
          className={`text-2xl font-bold ${
            score >= 80
              ? 'text-green-600 dark:text-green-400'
              : score >= 60
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {score}%
        </div>
      </div>

      {/* Breakdown sections */}
      <div className="space-y-3">
        {renderSkillsSection()}
        {renderExperienceSection()}
        {renderEducationSection()}
        {renderLanguagesSection()}
        {renderLocationSection()}
      </div>
    </div>
  );
};

export default MatchBreakdown;
