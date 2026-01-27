import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export const useCompanyUnreadMessages = (companyId?: string) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    loadUnreadCount();

    // Subscribe to changes in messages table
    const subscription = supabase
      .channel('company-messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'company_messages',
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [companyId]);

  const loadUnreadCount = async () => {
    if (!companyId) return;

    try {
      // Call the database function to get unread count
      const { data, error } = await supabase
        .rpc('get_company_unread_messages_count', { p_company_id: companyId });

      if (error) throw error;

      setUnreadCount(data || 0);
    } catch (err: any) {
      console.error('Error loading unread messages count:', err?.message || err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { unreadCount, loading, refresh: loadUnreadCount };
};
