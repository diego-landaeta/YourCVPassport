import React, { memo } from 'react';
import { useTranslations } from '../../../hooks/useTranslations';

const EmptyFeed: React.FC = memo(() => {
  const t = useTranslations();

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 p-8 sm:p-12 text-center">
      {/* Illustration */}
      <div className="relative w-20 h-20 mx-auto mb-5">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
        <span className="absolute -top-2 -right-2 text-lg select-none">✨</span>
        <span className="absolute -bottom-1 -left-2 text-sm select-none">🚀</span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {t.feed.empty.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-5 max-w-sm mx-auto text-sm sm:text-base leading-relaxed">
        {t.feed.empty.description}
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-cv-blue/10 dark:bg-blue-900/30 rounded-full text-cv-blue dark:text-blue-400 text-sm font-medium">
        <span>💡</span>
        {t.feed.empty.hint}
      </div>
    </div>
  );
});

EmptyFeed.displayName = 'EmptyFeed';
export default EmptyFeed;
