import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const DISMISSED_KEY = 'ycvp-push-prompt-dismissed';

/**
 * PushNotificationPrompt
 * Shows a non-intrusive banner asking the user to enable browser notifications.
 * - Appears only for logged-in users
 * - Only when permission is 'default' (not yet asked)
 * - Stores dismissal in localStorage so it doesn't re-appear
 */
const PushNotificationPrompt: React.FC = () => {
  const { lang } = useLanguage();
  const { session } = useAuth();
  const { permission, isSupported, requestPermissionAndSubscribe, isLoading } =
    usePushNotifications();

  const isEs = lang === 'es';

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* ── Show prompt 3 s after mount (once, if not dismissed) ─ */
  useEffect(() => {
    if (!isSupported || !session?.user.id) return;
    if (permission !== 'default') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const show = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(show);
  }, [isSupported, session?.user.id, permission]);

  const handleEnable = async () => {
    const success = await requestPermissionAndSubscribe();
    setVisible(false);
    if (!success) {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed || !isSupported || permission !== 'default' || !session?.user.id) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-cv-blue/10 dark:bg-cv-blue/15 rounded-xl flex items-center justify-center">
          <BellAlertIcon className="w-5 h-5 text-cv-blue" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
            {isEs ? 'Activa las notificaciones' : 'Enable notifications'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            {isEs
              ? 'Entérate al instante cuando reaccionen, comenten o mencionen tus publicaciones.'
              : 'Get instant alerts when someone reacts, comments, or mentions your posts.'}
          </p>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="flex-1 py-1.5 rounded-xl bg-cv-blue text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                isEs ? 'Activar' : 'Enable'
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              {isEs ? 'Ahora no' : 'Not now'}
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={isEs ? 'Cerrar' : 'Close'}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
