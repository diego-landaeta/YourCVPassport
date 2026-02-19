import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FeedNotification } from '../../../hooks/useNotifications';

interface NotificationsPanelProps {
  notifications: FeedNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  loading: boolean;
}

const NOTIF_CONFIG: Record<string, { icon: string; labelEs: string; labelEn: string }> = {
  reaction:  { icon: '👍', labelEs: 'reaccionó a tu publicación', labelEn: 'reacted to your post' },
  comment:   { icon: '💬', labelEs: 'comentó en tu publicación', labelEn: 'commented on your post' },
  reply:     { icon: '↩️', labelEs: 'respondió a tu comentario', labelEn: 'replied to your comment' },
  mention:   { icon: '@',  labelEs: 'te mencionó',               labelEn: 'mentioned you' },
  repost:    { icon: '🔄', labelEs: 'compartió tu publicación',  labelEn: 'shared your post' },
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  loading,
}) => {
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const displayed = expanded ? notifications : notifications.slice(0, 5);

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            {unreadCount > 0 ? (
              <BellAlertIcon className="w-5 h-5 text-cv-blue" />
            ) : (
              <BellIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <h4 className="font-bold text-gray-800 dark:text-white text-sm">
            {lang === 'es' ? 'Notificaciones' : 'Notifications'}
          </h4>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-cv-blue hover:text-blue-700 font-medium transition-colors"
          >
            <CheckIcon className="w-3.5 h-3.5" />
            {lang === 'es' ? 'Leer todo' : 'Read all'}
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center">
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-cv-blue rounded-full animate-spin mx-auto" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <BellIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
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
                onClick={() => !notif.is_read && onMarkAsRead(notif.id)}
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
                      "{notif.post.content.slice(0, 60)}{notif.post.content.length > 60 ? '...' : ''}"
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

      {/* Show more */}
      {notifications.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2.5 text-xs font-semibold text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-t border-gray-100 dark:border-dark-border"
        >
          {expanded
            ? (lang === 'es' ? 'Ver menos' : 'Show less')
            : (lang === 'es' ? `Ver todas (${notifications.length})` : `View all (${notifications.length})`)}
        </button>
      )}
    </div>
  );
};

export default NotificationsPanel;
