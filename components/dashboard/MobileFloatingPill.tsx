// @ts-nocheck
import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';

interface MobileFloatingPillProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onMenuToggle: () => void;
  avatarUrl: string;
  profileName?: string;
  unreadCount?: number;
}

/**
 * Compose FAB — floats above the Facebook-style bottom tab bar.
 * Only visible when the user is on the 'feed' section.
 */
const MobileFloatingPill: React.FC<MobileFloatingPillProps> = ({
  activeSection,
}) => {
  const t = useTranslations();

  if (activeSection !== 'feed') return null;

  const dispatch = (event: string) =>
    window.dispatchEvent(new CustomEvent(event));

  return (
    <button
      onClick={() => dispatch('feed-open-composer')}
      aria-label={t.feed.floatingPill.newPost}
      className="fixed z-50 lg:hidden bg-cv-blue text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
        right: '1rem',
        width: '3rem',
        height: '3rem',
      }}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
};

export default MobileFloatingPill;
