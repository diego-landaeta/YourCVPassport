import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface FeedNotification {
  id: string;
  created_at: string;
  user_id: string;
  actor_id: string;
  type: 'reaction' | 'comment' | 'reply' | 'mention' | 'repost';
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

export const useNotifications = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

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

    try {
      await supabase
        .from('feed_notifications')
        .upsert({
          user_id: targetUserId,
          actor_id: session.user.id,
          type,
          post_id: postId || null,
          comment_id: commentId || null,
        }, {
          onConflict: 'user_id,actor_id,type,post_id',
          ignoreDuplicates: true,
        });
    } catch {
      // Silently fail - notifications are best-effort
    }
  }, [session?.user.id]);

  // Initial fetch
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!session?.user.id) return;

    const channel = supabase
      .channel('feed_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchNotifications();
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
