import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export const useUnreadLeadsCount = () => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    loadUnreadCount();

    // Subscribe to changes in leads table
    const subscription = supabase
      .channel('leads-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `recipient_id=eq.${profile.id}`
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const loadUnreadCount = async () => {
    if (!profile) return;

    try {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .eq('status', 'NEW');

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { unreadCount, loading, refresh: loadUnreadCount };
};
