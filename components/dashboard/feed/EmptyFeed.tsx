import React, { memo } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../contexts/LanguageContext';

const EmptyFeed: React.FC = memo(() => {
  const { lang } = useLanguage();

  const t = {
    en: {
      title: 'Your feed is empty',
      description: 'Share your first post or wait for others to post. Professional achievements and updates will appear here.',
      hint: 'Start by sharing what you\'re working on!'
    },
    es: {
      title: 'Tu feed esta vacio',
      description: 'Comparte tu primera publicacion o espera a que otros publiquen. Los logros profesionales y actualizaciones apareceran aqui.',
      hint: '¡Comienza compartiendo en que estas trabajando!'
    }
  };

  const translations = t[lang];

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
        <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {translations.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
        {translations.description}
      </p>
      <p className="text-sm text-cv-blue dark:text-blue-400">
        {translations.hint}
      </p>
    </div>
  );
});

EmptyFeed.displayName = 'EmptyFeed';
export default EmptyFeed;
