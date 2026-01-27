import React, { useState } from 'react';
import { SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import MatchBreakdown, { MatchBreakdownData } from './MatchBreakdown';
import { useLanguage } from '../../contexts/LanguageContext';

interface MatchScoreBadgeProps {
  score: number;
  breakdown?: MatchBreakdownData;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
  className?: string;
}

/**
 * Visual badge displaying job match score with optional breakdown tooltip
 *
 * Score ranges:
 * - 80-100: Excellent match (green)
 * - 60-79: Good match (yellow/amber)
 * - 40-59: Fair match (orange)
 * - 0-39: Low match (gray)
 */
const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  breakdown,
  size = 'md',
  showBreakdown = true,
  className = ''
}) => {
  const { lang } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);

  // Get color classes based on score
  const getScoreColors = () => {
    if (score >= 80) {
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-500 dark:border-green-600',
        text: 'text-green-700 dark:text-green-400',
        ring: 'ring-green-500/20 dark:ring-green-600/30'
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-500 dark:border-amber-600',
        text: 'text-amber-700 dark:text-amber-400',
        ring: 'ring-amber-500/20 dark:ring-amber-600/30'
      };
    } else if (score >= 40) {
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-500 dark:border-orange-600',
        text: 'text-orange-700 dark:text-orange-400',
        ring: 'ring-orange-500/20 dark:ring-orange-600/30'
      };
    } else {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        border: 'border-gray-400 dark:border-gray-600',
        text: 'text-gray-600 dark:text-gray-400',
        ring: 'ring-gray-400/20 dark:ring-gray-600/30'
      };
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs gap-1',
          icon: 'w-3 h-3',
          score: 'text-sm font-bold',
          ring: 'ring-2'
        };
      case 'lg':
        return {
          container: 'px-4 py-2.5 text-base gap-2',
          icon: 'w-5 h-5',
          score: 'text-2xl font-bold',
          ring: 'ring-4'
        };
      default: // md
        return {
          container: 'px-3 py-1.5 text-sm gap-1.5',
          icon: 'w-4 h-4',
          score: 'text-lg font-bold',
          ring: 'ring-3'
        };
    }
  };

  // Get label based on score
  const getScoreLabel = () => {
    if (score >= 80) {
      return lang === 'es' ? 'Excelente' : 'Excellent';
    } else if (score >= 60) {
      return lang === 'es' ? 'Bueno' : 'Good';
    } else if (score >= 40) {
      return lang === 'es' ? 'Aceptable' : 'Fair';
    } else {
      return lang === 'es' ? 'Bajo' : 'Low';
    }
  };

  const colors = getScoreColors();
  const sizes = getSizeClasses();

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          flex items-center justify-center
          ${sizes.container}
          ${colors.bg} ${colors.border} ${colors.text}
          border-2 ${sizes.ring} ${colors.ring}
          rounded-full
          transition-all duration-200
          ${showBreakdown && breakdown ? 'cursor-pointer hover:scale-105' : ''}
        `}
        onMouseEnter={() => showBreakdown && breakdown && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => showBreakdown && breakdown && setShowTooltip(!showTooltip)}
      >
        <SparklesIcon className={sizes.icon} />
        <span className={sizes.score}>{score}%</span>
        <span className="hidden sm:inline font-medium">
          {lang === 'es' ? 'Match' : 'Match'}
        </span>
        {showBreakdown && breakdown && (
          <InformationCircleIcon className={`${sizes.icon} ml-1 opacity-70`} />
        )}
      </div>

      {/* Circular progress indicator (optional visual enhancement) */}
      {size === 'lg' && (
        <svg
          className="absolute inset-0 -z-10"
          viewBox="0 0 100 100"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${score * 2.827}, 282.7`}
            className={colors.text}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Breakdown Tooltip */}
      {showBreakdown && breakdown && showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
          <MatchBreakdown data={breakdown} score={score} />
        </div>
      )}
    </div>
  );
};

export default MatchScoreBadge;
