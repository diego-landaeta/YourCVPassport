// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NOTIF_CONFIG = {
  reaction:  { icon: '👍', labelEs: 'reaccionó a tu publicación', labelEn: 'reacted to your post' },
  comment:   { icon: '💬', labelEs: 'comentó en tu publicación', labelEn: 'commented on your post' },
  reply:     { icon: '↩️', labelEs: 'respondió a tu comentario', labelEn: 'replied to your comment' },
  mention:   { icon: '@',  labelEs: 'te mencionó',               labelEn: 'mentioned you' },
  repost:    { icon: '🔄', labelEs: 'compartió tu publicación',  labelEn: 'shared your post' },
};

const NotificationBell = () => {
  const { lang } = useLanguage();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handle);
      return () => document.removeEventListener('mousedown', handle);
    }
  }, [open]);

  const displayed = notifications.slice(0, 8);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <svg className="w-5 h-5 text-cv-blue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-2xl shadow-xl z-[60] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <h4 className="font-bold text-gray-800 dark:text-white text-sm">
              {lang === 'es' ? 'Notificaciones' : 'Notifications'}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-xs text-cv-blue hover:text-blue-700 font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {lang === 'es' ? 'Leer todo' : 'Read all'}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center">
                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-cv-blue rounded-full animate-spin mx-auto" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {lang === 'es' ? 'Sin notificaciones' : 'No notifications'}
                </p>
              </div>
            ) : (
              displayed.map((notif) => {
                const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.comment;
                const actorName = notif.actor?.full_name || (lang === 'es' ? 'Alguien' : 'Someone');
                const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
                  addSuffix: true,
                  locale: lang === 'es' ? es : undefined,
                });

                return (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                    }}
                    className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary ${
                      !notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <img
                      src={notif.actor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&background=3B82F6&color=fff&size=32`}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                        <span className="font-semibold">{actorName}</span>{' '}
                        <span className="text-gray-500 dark:text-gray-400">
                          {lang === 'es' ? config.labelEs : config.labelEn}
                        </span>
                      </p>
                      {notif.post?.content && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          &ldquo;{notif.post.content.slice(0, 50)}{notif.post.content.length > 50 ? '...' : ''}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">{timeAgo}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-cv-blue rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
