// @ts-nocheck
import React from 'react';

interface MobileFloatingPillProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onMenuToggle: () => void;
  avatarUrl: string;
  profileName?: string;
  unreadCount?: number;
}

const PILL_ITEMS = [
  {
    id: 'dashboard',
    label: 'Home',
    path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'feed',
    label: 'Feed',
    path: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
  },
  {
    id: 'vacantes',
    label: 'Jobs',
    path: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    id: 'leads',
    label: 'Alerts',
    path: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  },
];

const MobileFloatingPill: React.FC<MobileFloatingPillProps> = ({
  activeSection,
  onSectionChange,
  onMenuToggle,
  avatarUrl,
  profileName,
  unreadCount = 0,
}) => {
  return (
    <nav
      className="fixed left-1/2 z-[999] lg:hidden"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-full px-2.5 py-2"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {/* CV Logo */}
        <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-gray-900 font-bold text-[10px] tracking-tighter flex-shrink-0 mr-1">
          CV
        </div>

        {/* Nav items */}
        {PILL_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const isAlerts = item.id === 'leads';
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`p-2.5 rounded-full transition-all relative ${
                isActive
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              aria-label={item.label}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
              </svg>
              {isAlerts && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
              )}
            </button>
          );
        })}

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1.5" />

        {/* Avatar — opens full menu */}
        <button
          onClick={onMenuToggle}
          className="flex-shrink-0 hover:scale-105 transition-transform"
          aria-label="Menu"
        >
          <img
            src={avatarUrl}
            alt={profileName || 'User'}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
          />
        </button>
      </div>
    </nav>
  );
};

export default MobileFloatingPill;
