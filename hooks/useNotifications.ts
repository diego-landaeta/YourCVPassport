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

/* ── Caché compartida entre instancias ──────────────────────
 * El hook se usa a la vez en la barra móvil, la campana, la página de
 * Notificaciones y en varios componentes del feed. Antes cada instancia lanzaba
 * su propia consulta y la página mostraba «Cargando...» hasta que acababa la
 * suya (issue #4, punto 23). Ahora las consultas simultáneas se comparten y la
 * página pinta al instante lo que ya cargó otra instancia (p. ej. la barra
 * inferior al entrar al panel) mientras refresca en segundo plano. */
let listCache: { userId: string; data: FeedNotification[] } | null = null;
let inflight: { userId: string; promise: Promise<FeedNotification[]> } | null = null;

function loadNotificationList(userId: string): Promise<FeedNotification[]> {
  if (inflight && inflight.userId === userId) return inflight.promise;
  const promise = (async () => {
    const { data, error } = await supabase
      .from('feed_notifications')
      .select(`
        *,
        actor:profiles!actor_id (full_name, avatar_url, slug),
        post:feed_posts!post_id (content, content_type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    const list = (data || []) as FeedNotification[];
    listCache = { userId, data: list };
    return list;
  })();
  inflight = { userId, promise };
  promise.then(
    () => { if (inflight?.promise === promise) inflight = null; },
    () => { if (inflight?.promise === promise) inflight = null; },
  );
  return promise;
}

/* ─────────────────────────────────────────────────────────── */

export const useNotifications = () => {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const cached = userId && listCache?.userId === userId ? listCache.data : null;
  const [notifications, setNotifications] = useState<FeedNotification[]>(cached ?? []);
  const [unreadCount, setUnreadCount] = useState(cached ? cached.filter(n => !n.is_read).length : 0);
  const [loading, setLoading] = useState(!cached);
  const fetchedForRef = useRef<string | null>(null);
  const notifDisabledRef = useRef(false);
  // Canal de tiempo real propio de cada instancia: con el mismo nombre, Supabase
  // cerraba el canal de las otras instancias al suscribirse una nueva.
  const channelSuffixRef = useRef(Math.random().toString(36).slice(2, 10));

  const fetchNotifications = useCallback(async () => {
    if (!session?.user.id) return;

    try {
      // Con datos en caché se refresca sin volver a «Cargando...».
      if (!(listCache && listCache.userId === session.user.id)) setLoading(true);
      const data = await loadNotificationList(session.user.id);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  // Mantiene la caché al día con lo marcado como leído en esta instancia.
  useEffect(() => {
    if (userId && !loading) listCache = { userId, data: notifications };
  }, [userId, loading, notifications]);

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
  // Se marca como hecha solo cuando hay sesión: antes el primer render sin sesión
  // gastaba el intento y la lista se quedaba en «Cargando...» hasta un evento.
  useEffect(() => {
    if (!userId || fetchedForRef.current === userId) return;
    fetchedForRef.current = userId;
    fetchNotifications();
  }, [userId, fetchNotifications]);

  /* ── Real-time subscription + browser notification ──────── */
  useEffect(() => {
    if (!session?.user.id) return;

    const channel = supabase
      .channel(`feed_notifications:${session.user.id}:${channelSuffixRef.current}`)
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
                // maybeSingle: el actor puede tener el perfil oculto (sin fila visible)
                .maybeSingle();
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
