import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface FeedNotification {
  id: string;
  created_at: string;
  user_id: string;
  actor_id: string;
  type: 'reaction' | 'comment' | 'reply' | 'mention' | 'repost' | 'follow';
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  actor?: {
    full_name: string;
    avatar_url: string | null;
    slug: string | null;
  };
  post?: {
    content: string;
    content_type: string;
  };
}

/* ── Helpers ─────────────────────────────────────────────── */
const NOTIF_LABELS_ES: Record<string, string> = {
  reaction: 'reaccionó a tu publicación',
  comment:  'comentó tu publicación',
  reply:    'respondió a tu comentario',
  mention:  'te mencionó en una publicación',
  repost:   'compartió tu publicación',
  follow:   'empezó a seguirte',
};
const NOTIF_LABELS_EN: Record<string, string> = {
  reaction: 'reacted to your post',
  comment:  'commented on your post',
  reply:    'replied to your comment',
  mention:  'mentioned you in a post',
  repost:   'shared your post',
  follow:   'started following you',
};

function buildNotifBody(type: string, actorName: string, lang = 'es'): string {
  const labels = lang === 'es' ? NOTIF_LABELS_ES : NOTIF_LABELS_EN;
  const action = labels[type] ?? (lang === 'es' ? 'interactuó contigo' : 'interacted with you');
  return `${actorName} ${action}`;
}

/** Show a browser notification via service worker (if granted) */
function showBrowserNotification(title: string, body: string, url: string, tag: string) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    icon:  '/favicon-192x192.png',
    badge: '/favicon-32x32.png',
    tag,
    data:  { url },
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => new Notification(title, options));
  } else {
    new Notification(title, options);
  }
}

/* ─────────────────────────────────────────────────────────── */

export const useNotifications = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const notifDisabledRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feed_notifications')
        .select(`
          *,
          actor:profiles!actor_id (full_name, avatar_url, slug),
          post:feed_posts!post_id (content, content_type)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) {
        setNotifications(data as FeedNotification[]);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user.id) return;

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase
      .from('feed_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', session.user.id);
  }, [session?.user.id]);

  const markAllAsRead = useCallback(async () => {
    if (!session?.user.id) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from('feed_notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);
  }, [session?.user.id]);

  const sendNotification = useCallback(async (
    targetUserId: string,
    type: FeedNotification['type'],
    postId?: string,
    commentId?: string,
  ) => {
    if (!session?.user.id) return;
    if (targetUserId === session.user.id) return; // Don't notify yourself
    if (notifDisabledRef.current) return; // Skip if RLS denied previously

    const { error } = await supabase
      .from('feed_notifications')
      .upsert({
        user_id:    targetUserId,
        actor_id:   session.user.id,
        type,
        post_id:    postId    || null,
        comment_id: commentId || null,
      }, {
        onConflict:       'user_id,actor_id,type,post_id',
        ignoreDuplicates: true,
      });

    // If RLS denies (403), stop trying for this session
    if (error?.code === '42501' || error?.message?.includes('policy')) {
      notifDisabledRef.current = true;
    }
  }, [session?.user.id]);

  /* ── Initial fetch ───────────────────────────────────────── */
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchNotifications();
  }, [fetchNotifications]);

  /* ── Real-time subscription + browser notification ──────── */
  useEffect(() => {
    if (!session?.user.id) return;

    const channel = supabase
      .channel(`feed_notifications:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'feed_notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          // Refresh full list so we get actor/post joined data
          fetchNotifications();

          // Show browser notification if permission granted
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            payload.new
          ) {
            const notif = payload.new as FeedNotification;

            // Fetch actor name for the notification body
            let actorName = '';
            try {
              const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', notif.actor_id)
                .single();
              actorName = data?.full_name || '';
            } catch { /* ignore */ }

            // Detect lang from html tag
            const lang = document.documentElement.lang?.startsWith('es') ? 'es' : 'en';
            const body = buildNotifBody(notif.type, actorName, lang);
            const url  = notif.post_id ? `/feed` : '/dashboard';

            showBrowserNotification(
              'YourCVPassport',
              body,
              url,
              `ycvp-${notif.type}-${notif.post_id ?? 'general'}`
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    sendNotification,
    refreshNotifications: fetchNotifications,
  };
};
