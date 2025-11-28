/**
 * Profile Quality Score Component
 *
 * Muestra el score de calidad del perfil (0-100%) y sugerencias accionables
 * para mejorar el CV del usuario
 */

import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  calculateProfileScore,
  generateProfileSuggestions,
  ProfileQualityCheck,
} from '../../lib/ai';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid';

interface ProfileQualityScoreProps {
  experiences?: any[];
  education?: any[];
  skills?: any[];
  visas?: any[];
  languages?: any[];
  certifications?: any[];
  onNavigateToSection?: (sectionId: string) => void;
}

const ProfileQualityScore: React.FC<ProfileQualityScoreProps> = ({
  experiences = [],
  education = [],
  skills = [],
  visas = [],
  languages = [],
  certifications = [],
  onNavigateToSection,
}) => {
  const { profile } = useAuth();

  // Calculate quality check
  const qualityCheck: ProfileQualityCheck = useMemo(() => {
    return {
      hasPhoto: !!profile?.photo_url,
      hasEmail: !!profile?.email,
      emailVerified: !!profile?.email_verified,
      hasSummary: !!profile?.summary && profile.summary.trim().length > 20,
      experienceCount: experiences.length,
      educationCount: education.length,
      skillsCount: skills.length,
      visasCount: visas.length,
      languagesCount: languages.length,
      certificationsCount: certifications.length,
    };
  }, [profile, experiences, education, skills, visas, languages, certifications]);

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
        label: 'Excelente',
        icon: CheckCircleIcon,
      };
    } else if (score >= 70) {
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-blue-500 dark:border-blue-400',
        label: 'Bueno',
        icon: ChartBarIcon,
      };
    } else if (score >= 50) {
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-500 dark:border-yellow-400',
        label: 'Regular',
        icon: ExclamationTriangleIcon,
      };
    } else {
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-500 dark:border-red-400',
        label: 'Necesita mejoras',
        icon: XCircleIcon,
      };
    }
  };

  const scoreDisplay = getScoreDisplay(score);
  const ScoreIcon = scoreDisplay.icon;

  // Map suggestion categories to section IDs
  const getSectionIdFromCategory = (category: string): string | null => {
    const categoryMap: Record<string, string> = {
      'Foto de perfil': 'identity',
      'Email': 'identity',
      'Resumen profesional': 'identity',
      'Experiencia laboral': 'experience',
      'Habilidades': 'skills',
      'Educación': 'education',
      'Proyectos (Visas)': 'visas',
      'Idiomas': 'languages',
      'Certificaciones': 'portfolio',
      'Verificaciones': 'stamps',
    };
    return categoryMap[category] || null;
  };

  // Priority badge
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const styles = {
      high: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
        label: 'Alta',
      },
      medium: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-700',
        label: 'Media',
      },
      low: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-700',
        label: 'Baja',
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
                Calidad del Perfil
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
          {score >= 90
            ? '¡Perfil casi perfecto! Solo pequeños detalles para alcanzar el 100%'
            : score >= 70
            ? 'Buen perfil, pero aún puedes mejorarlo siguiendo las sugerencias'
            : score >= 50
            ? 'Tu perfil necesita atención en varias áreas importantes'
            : 'Tu perfil necesita mejoras significativas para destacar'}
        </p>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Recomendaciones IA
            </h4>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">
              {suggestions.length} {suggestions.length === 1 ? 'sugerencia' : 'sugerencias'}
            </span>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => {
              const priorityBadge = getPriorityBadge(suggestion.priority);
              const sectionId = getSectionIdFromCategory(suggestion.category);
              const isClickable = onNavigateToSection && sectionId;

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
                        {suggestion.category}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-dark-text-secondary leading-relaxed">
                        {suggestion.message}
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
              Las sugerencias se ordenan automáticamente por prioridad para ayudarte a optimizar tu perfil.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              ¡Perfil optimizado!
            </h4>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Tu perfil cumple con todos los requisitos de calidad. Continúa manteniéndolo actualizado para maximizar tu visibilidad.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileQualityScore;
