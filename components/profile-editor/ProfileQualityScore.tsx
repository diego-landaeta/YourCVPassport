/**
 * Profile Quality Score Component
 *
 * Muestra el score de calidad del perfil (0-100%) y sugerencias accionables
 * para mejorar el CV del usuario
 */

import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import {
  calculateProfileScore,
  generateProfileSuggestions,
  ProfileQualityCheck,
  SuggestionType,
} from '../../lib/ai';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid';

interface ProfileQualityScoreProps {
  // Soporta tanto arrays como conteos directos
  experiences?: any[];
  education?: any[];
  skills?: any[];
  visas?: any[];
  languages?: any[];
  certifications?: any[];
  // Conteos directos (preferidos - se cargan al inicio del dashboard)
  experienceCount?: number;
  educationCount?: number;
  skillsCount?: number;
  certificationsCount?: number;
  onNavigateToSection?: (sectionId: string) => void;
}

const ProfileQualityScore: React.FC<ProfileQualityScoreProps> = ({
  experiences = [],
  education = [],
  skills = [],
  visas = [],
  languages = [],
  certifications = [],
  experienceCount,
  educationCount,
  skillsCount,
  certificationsCount,
  onNavigateToSection,
}) => {
  const { profile } = useAuth();
  const t = useTranslations();

  // Calculate quality check - usa conteos directos si están disponibles, sino usa arrays
  const qualityCheck: ProfileQualityCheck = useMemo(() => {
    // Verificar foto: puede estar en avatar_url o photo_url
    const hasPhoto = !!(profile?.avatar_url || profile?.photo_url);

    return {
      hasPhoto,
      hasEmail: !!profile?.email,
      emailVerified: !!profile?.email_verified,
      hasSummary: !!profile?.summary && profile.summary.trim().length > 20,
      experienceCount: experienceCount ?? experiences.length,
      educationCount: educationCount ?? education.length,
      skillsCount: skillsCount ?? skills.length,
      visasCount: visas.length,
      languagesCount: languages.length,
      certificationsCount: certificationsCount ?? certifications.length,
    };
  }, [profile, experiences, education, skills, visas, languages, certifications, experienceCount, educationCount, skillsCount, certificationsCount]);

  // Calculate score
  const score = useMemo(() => calculateProfileScore(qualityCheck), [qualityCheck]);

  // Generate suggestions
  const suggestions = useMemo(
    () => generateProfileSuggestions(qualityCheck),
    [qualityCheck]
  );

  // Get score color and label
  const getScoreDisplay = (score: number) => {
    if (score >= 90) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-500 dark:border-green-400',
        label: t.profileEditor.qualityScore.labels.excellent,
        icon: CheckCircleIcon,
      };
    } else if (score >= 70) {
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-blue-500 dark:border-blue-400',
        label: t.profileEditor.qualityScore.labels.good,
        icon: ChartBarIcon,
      };
    } else if (score >= 50) {
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-500 dark:border-yellow-400',
        label: t.profileEditor.qualityScore.labels.regular,
        icon: ExclamationTriangleIcon,
      };
    } else {
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-500 dark:border-red-400',
        label: t.profileEditor.qualityScore.labels.needsImprovements,
        icon: XCircleIcon,
      };
    }
  };

  const scoreDisplay = getScoreDisplay(score);
  const ScoreIcon = scoreDisplay.icon;

  // Map suggestion types to section IDs
  const getSectionIdFromType = (type: SuggestionType): string | null => {
    const typeMap: Record<SuggestionType, string> = {
      'summary': 'identity',
      'experience': 'experience',
      'education': 'education',
      'skills': 'skills',
      'verifications': 'stamps',
    };
    return typeMap[type] || null;
  };

  // Get translated category and message for a suggestion type
  const getSuggestionText = (type: SuggestionType, data?: { remaining?: number }) => {
    const messages = t.profileEditor.qualityScore.suggestionMessages;
    const suggestionData = messages[type];

    if (type === 'skills' && data?.remaining !== undefined) {
      return {
        category: suggestionData.category,
        message: typeof suggestionData.message === 'function'
          ? suggestionData.message(data.remaining)
          : suggestionData.message,
      };
    }

    return {
      category: suggestionData.category,
      message: suggestionData.message as string,
    };
  };

  // Priority badge
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const styles = {
      high: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
        label: t.profileEditor.qualityScore.priority.high,
      },
      medium: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-700',
        label: t.profileEditor.qualityScore.priority.medium,
      },
      low: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-700',
        label: t.profileEditor.qualityScore.priority.low,
      },
    };
    return styles[priority];
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div
        className={`${scoreDisplay.bgColor} border-2 ${scoreDisplay.borderColor} rounded-xl p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ScoreIcon className={`w-8 h-8 ${scoreDisplay.color}`} />
            <div>
              <h3 className={`text-2xl font-bold ${scoreDisplay.color}`}>
                {score}%
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.profileEditor.qualityScore.title}
              </p>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-full ${scoreDisplay.bgColor} border ${scoreDisplay.borderColor}`}
          >
            <span className={`font-semibold ${scoreDisplay.color}`}>
              {scoreDisplay.label}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 90
                ? 'bg-green-500 dark:bg-green-400'
                : score >= 70
                ? 'bg-blue-500 dark:bg-blue-400'
                : score >= 50
                ? 'bg-yellow-500 dark:bg-yellow-400'
                : 'bg-red-500 dark:bg-red-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          {score === 100
            ? t.profileEditor.qualityScore.perfect
            : score >= 90
            ? t.profileEditor.qualityScore.almostPerfect
            : score >= 70
            ? t.profileEditor.qualityScore.good
            : score >= 50
            ? t.profileEditor.qualityScore.needsAttention
            : t.profileEditor.qualityScore.needsImprovement}
        </p>
      </div>

      {/* Success message - Solo mostrar cuando score === 100 */}
      {score === 100 ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                {t.profileEditor.qualityScore.completed100}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                {t.profileEditor.qualityScore.readyToShine}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.profileEditor.qualityScore.excellentWork}
            </p>

            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                {t.profileEditor.qualityScore.nextSteps}
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 dark:text-green-400 font-bold">→</span>
                  <span>{t.profileEditor.qualityScore.exportShare}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 dark:text-green-400 font-bold">→</span>
                  <span>{t.profileEditor.qualityScore.reviewAnalytics}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 dark:text-green-400 font-bold">→</span>
                  <span>{t.profileEditor.qualityScore.keepUpdated}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              {t.profileEditor.qualityScore.aiRecommendations}
            </h4>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">
              {suggestions.length} {suggestions.length === 1 ? t.profileEditor.qualityScore.suggestion : t.profileEditor.qualityScore.suggestions}
            </span>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => {
              const priorityBadge = getPriorityBadge(suggestion.priority);
              const sectionId = getSectionIdFromType(suggestion.type);
              const isClickable = onNavigateToSection && sectionId;
              const suggestionText = getSuggestionText(suggestion.type, suggestion.data);

              const cardContent = (
                <>
                  <div className="flex items-start gap-3">
                    <div className={`px-2.5 py-1.5 rounded-md border ${priorityBadge.bg} ${priorityBadge.border} flex-shrink-0 mt-0.5`}>
                      <span className={`text-xs font-bold ${priorityBadge.text} uppercase tracking-wide`}>
                        {priorityBadge.label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-dark-text-primary mb-1.5">
                        {suggestionText.category}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-dark-text-secondary leading-relaxed">
                        {suggestionText.message}
                      </p>
                    </div>
                    {isClickable && (
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </>
              );

              return isClickable ? (
                <button
                  key={index}
                  onClick={() => onNavigateToSection(sectionId)}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
                >
                  {cardContent}
                </button>
              ) : (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.profileEditor.qualityScore.suggestionsOrderedByPriority}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProfileQualityScore;
