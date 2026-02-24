import React, { useState } from 'react';
import { useNotifications, FeedNotification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckIcon } from '@heroicons/react/24/outline';
import { BellSlashIcon } from '@heroicons/react/24/solid';

type NotifTab = 'all' | 'reactions' | 'comments' | 'follows';

const getActionText = (type: string, lang: string): string => {
  const map: Record<string, Record<string, string>> = {
    es: { reaction: 'reaccionó a tu publicación', comment: 'comentó tu publicación', reply: 'respondió a tu comentario', mention: 'te mencionó', repost: 'compartió tu publicación', follow: 'empezó a seguirte' },
    en: { reaction: 'reacted to your post', comment: 'commented on your post', reply: 'replied to your comment', mention: 'mentioned you', repost: 'shared your post', follow: 'started following you' },
  };
  return (map[lang] || map.en)[type] || (lang === 'es' ? 'interactuó contigo' : 'interacted with you');
};

const TYPE_EMOJI: Record<string, string> = {
  reaction: '❤️', comment: '💬', mention: '@', repost: '🔁', reply: '↩️', follow: '👤',
};

/* ── Notification Row ── */
const NotifRow: React.FC<{ n: FeedNotification; onRead: (id: string) => void; lang: string }> = ({ n, onRead, lang }) => {
  const actor = n.actor;
  const avatarUrl = actor?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(actor?.full_name || '?')}&background=3B82F6&color=fff&size=36`;

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    if (n.type === 'follow') {
      window.dispatchEvent(new CustomEvent('feed-navigate-to-profile', { detail: { userId: n.actor_id } }));
    } else if (n.post_id) {
      window.dispatchEvent(new CustomEvent('feed-navigate-to-post', { detail: { postId: n.post_id } }));
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-colors ${
        !n.is_read ? 'bg-cv-blue/5 dark:bg-cv-blue/10' : 'hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
      }`}
    >
      <div className="relative flex-shrink-0">
        <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
        <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">{TYPE_EMOJI[n.type] || '🔔'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-snug truncate">
          <span className="font-semibold">{actor?.full_name || '?'}</span>{' '}
          <span className="text-gray-500 dark:text-gray-400">{getActionText(n.type, lang)}</span>
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: lang === 'es' ? es : undefined })}
        </p>
      </div>
      {!n.is_read && <div className="w-2 h-2 rounded-full bg-cv-blue flex-shrink-0" />}
    </button>
  );
};

/* ── Main ── */
const NotificationsPage: React.FC = () => {
  const { lang } = useLanguage();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState<NotifTab>('all');
  const isEs = lang === 'es';

  const filtered = notifications.filter(n => {
    if (tab === 'all') return true;
    if (tab === 'reactions') return n.type === 'reaction';
    if (tab === 'comments') return n.type === 'comment' || n.type === 'reply' || n.type === 'mention';
    if (tab === 'follows') return n.type === 'follow' || n.type === 'repost';
    return true;
  });

  const unread = notifications.filter(n => !n.is_read).length;

  const tabs: { id: NotifTab; label: string }[] = [
    { id: 'all', label: isEs ? 'Todo' : 'All' },
    { id: 'reactions', label: isEs ? 'Reacciones' : 'Reactions' },
    { id: 'comments', label: isEs ? 'Comentarios' : 'Comments' },
    { id: 'follows', label: isEs ? 'Social' : 'Social' },
  ];

  return (
    <div className="max-w-xl mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {isEs ? 'Notificaciones' : 'Notifications'}
          {unread > 0 && <span className="ml-2 text-xs font-medium text-gray-400 dark:text-gray-500">({unread})</span>}
        </h2>
        {unread > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs font-medium text-cv-blue hover:underline"
          >
            <CheckIcon className="w-3.5 h-3.5" />
            {isEs ? 'Leer todo' : 'Mark all'}
          </button>
        )}
      </div>

      {/* Tabs - compact underline style */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              tab === t.id
                ? 'border-cv-blue text-cv-blue'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-7 h-7 border-2 border-cv-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">{isEs ? 'Cargando...' : 'Loading...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <BellSlashIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {isEs ? 'Sin notificaciones' : 'No notifications'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {isEs ? 'Cuando interactúen contigo aparecerá aquí.' : 'Interactions will show up here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {filtered.map(n => (
            <NotifRow key={n.id} n={n} onRead={markAsRead} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
