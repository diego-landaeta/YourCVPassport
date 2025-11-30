import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export const useUnreadLeadsCount = () => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leadsTableExists, setLeadsTableExists] = useState<boolean | null>(null);

  // Check if leads table exists on first load
  useEffect(() => {
    checkLeadsTableExists();
  }, []);

  useEffect(() => {
    if (!profile || leadsTableExists === false) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (leadsTableExists === null) {
      // Still checking if table exists
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
  }, [profile, leadsTableExists]);

  const checkLeadsTableExists = async () => {
    try {
      // Try a simple query to check if table exists
      const { error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        // Check if error is about missing table
        if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation')) {
          console.warn('Leads table does not exist yet. Leads feature will be disabled.');
          setLeadsTableExists(false);
        } else {
          // Other errors (like RLS) mean table exists
          setLeadsTableExists(true);
        }
      } else {
        setLeadsTableExists(true);
      }
    } catch (err) {
      console.warn('Could not check leads table existence:', err);
      setLeadsTableExists(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!profile || leadsTableExists === false) return;

    try {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .eq('status', 'NEW');

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      // Silently fail - leads feature may not be enabled for this user
      // Don't show error toast as it's not critical functionality
      console.warn('Could not load unread leads count:', err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { unreadCount, loading, refresh: loadUnreadCount };
};
