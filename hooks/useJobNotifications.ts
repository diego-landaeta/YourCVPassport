import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

interface JobNotification {
  id: string;
  type: 'new_application' | 'status_change';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  application_id?: string;
  job_posting_id?: string;
}

export const useJobNotifications = (companyId: string | null) => {
  const [notifications, setNotifications] = useState<JobNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load notifications
  const loadNotifications = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      // Get unread applications count
      const { data: applications, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          created_at,
          viewed_by_company,
          status,
          job_posting:job_postings(id, title),
          profile:profiles(full_name)
        `)
        .eq('company_id', companyId)
        .eq('viewed_by_company', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Convert to notifications format
      const newNotifications: JobNotification[] = (applications || []).map((app: any) => ({
        id: app.id,
        type: 'new_application' as const,
        title: 'Nueva Aplicación',
        message: `${app.profile?.full_name || 'Un candidato'} aplicó a ${app.job_posting?.title || 'una vacante'}`,
        read: app.viewed_by_company,
        created_at: app.created_at,
        application_id: app.id,
        job_posting_id: app.job_posting?.id,
      }));

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!companyId) return;

    loadNotifications();

    // Subscribe to new applications
    const channel = supabase
      .channel('job-applications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_applications',
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          // Reload notifications
          await loadNotifications();

          // Show toast notification
          const newApp = payload.new as any;

          // Get job title
          const { data: job } = await supabase
            .from('job_postings')
            .select('title')
            .eq('id', newApp.job_posting_id)
            .single();

          // Get candidate name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newApp.profile_id)
            .single();

          toast.success(
            `Nueva aplicación de ${profile?.full_name || 'un candidato'} para ${job?.title || 'una vacante'}`,
            {
              duration: 5000,
              icon: '📩',
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Update application as viewed
      await supabase
        .from('job_applications')
        .update({
          viewed_by_company: true,
          viewed_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!companyId) return;

    try {
      await supabase
        .from('job_applications')
        .update({
          viewed_by_company: true,
          viewed_at: new Date().toISOString(),
        })
        .eq('company_id', companyId)
        .eq('viewed_by_company', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
};
