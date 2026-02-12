import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TranslationProgressIndicatorProps {
  current: number;
  total: number;
  percentage: number;
  isVisible: boolean;
}

export function TranslationProgressIndicator({
  current,
  total,
  percentage,
  isVisible,
}: TranslationProgressIndicatorProps) {
  const { lang } = useLanguage();

  if (!isVisible || total === 0) return null;

  const translatingText = lang === 'es' ? 'Traduciendo...' : 'Translating...';

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-xl min-w-[280px] animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <svg
            className="w-5 h-5 text-blue-400 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-white">
          {translatingText}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{current} / {total}</span>
          <span>{percentage}%</span>
        </div>

        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton text component for text being translated
 */
export function TranslationSkeleton({
  width = '100%',
  height = '1em',
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Multi-line skeleton for longer text like descriptions
 */
export function TranslationSkeletonParagraph({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <TranslationSkeleton
          key={i}
          width={i === lines - 1 ? '70%' : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

/**
 * Helper to check if a text is currently being translated
 */
export function isTextPending(text: string | null | undefined, pendingTexts: Set<string>): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return pendingTexts.has(trimmed) || Array.from(pendingTexts).some(pt => pt.startsWith(trimmed.substring(0, 50)));
}
