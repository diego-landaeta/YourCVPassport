import React from 'react';
import { EnvelopeIcon, CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { CTATracker } from './CTATracker';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../contexts/ToastContext';

interface ProfileContactButtonsProps {
  profileId: string;
  profileEmail?: string | null;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
  showSchedule?: boolean;
  showDownload?: boolean;
  accentColor?: string;
}

/**
 * Reusable contact buttons component for CV templates
 * Shows contact, schedule meeting, and download CV buttons
 * Automatically hides when viewing own profile
 */
export const ProfileContactButtons: React.FC<ProfileContactButtonsProps> = ({
  profileId,
  profileEmail,
  variant = 'default',
  className = '',
  showSchedule = true,
  showDownload = true,
  accentColor = '#3B82F6'
}) => {
  const { user } = useAuth();
  const t = useTranslations();
  const toast = useToastContext();
  const isOwnProfile = user?.id === profileId;

  // Don't show buttons when viewing own profile
  if (isOwnProfile) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 text-center print:hidden">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          {t.cvSections.viewingOwnProfile || 'Este es tu perfil. Los visitantes verán los botones de contacto aquí.'}
        </p>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex flex-wrap gap-2 print:hidden ${className}`}>
        <button
          onClick={() => toast.info('Funcionalidad en desarrollo')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          <EnvelopeIcon className="w-4 h-4" />
          <span>{t.cvSections.contactMe}</span>
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 print:hidden ${className}`}>
        <button
          onClick={() => toast.info('Funcionalidad en desarrollo')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          <EnvelopeIcon className="w-4 h-4" />
          <span>{t.cvSections.contactMe}</span>
        </button>
        {showSchedule && (
          <button
            onClick={() => toast.info('Funcionalidad en desarrollo')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>{t.cvSections.scheduleMeeting}</span>
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-wrap gap-3 print:hidden ${className}`}>
      <button
        onClick={() => toast.info('Funcionalidad en desarrollo')}
        className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
      >
        <EnvelopeIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span>{t.cvSections.contactMe}</span>
      </button>
      {showSchedule && (
        <button
          onClick={() => toast.info('Funcionalidad en desarrollo')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-bg-tertiary border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <CalendarIcon className="w-5 h-5" />
          <span>{t.cvSections.scheduleMeeting}</span>
        </button>
      )}
    </div>
  );
};

export default ProfileContactButtons;
