/**
 * Optimized Leads Data Fetching Hooks
 *
 * Resuelve el problema N+1 de queries y agrega caching con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase/client';
import { queryKeys } from './useQueryClient';

export interface Lead {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  sender_company: string | null;
  lead_type: 'job_offer' | 'collaboration' | 'networking' | 'other';
  subject: string;
  message: string;
  company_name: string | null;
  position_offered: string | null;
  salary_range: string | null;
  location: string | null;
  status: 'new' | 'read' | 'accepted' | 'rejected' | 'archived';
  created_at: string;
  read_at: string | null;
  unread_count: number;
  starred: boolean;
}

export interface Message {
  id: string;
  lead_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Hook principal para cargar leads - OPTIMIZADO
 * Resuelve N+1 problem: 1 query en lugar de N+1
 */
export function useLeads(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leads(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      // ANTES: 1 query para leads + N queries para unread count = N+1 queries
      // DESPUÉS: 1 query con join = 1 query total

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          messages (
            id,
            is_read,
            sender_id
          )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular unread count en cliente (muy rápido)
      const leadsWithCount: Lead[] = (data || []).map(lead => ({
        ...lead,
        unread_count: lead.messages?.filter(
          (m: any) => !m.is_read && m.sender_id !== userId
        ).length || 0,
        // Eliminar messages del objeto final para reducir payload
        messages: undefined,
      }));

      return leadsWithCount;
    },
    enabled: !!userId, // Solo ejecutar si hay userId
    staleTime: 2 * 60 * 1000, // 2 minutos - leads son datos que cambian menos
  });
}

/**
 * Hook para cargar un lead específico con sus mensajes
 */
export function useLeadWithMessages(leadId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leadMessages(leadId || ''),
    queryFn: async () => {
      if (!leadId) throw new Error('Lead ID required');

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!leadId && !!userId,
    staleTime: 30 * 1000, // 30 segundos - mensajes cambian más frecuentemente
  });
}

/**
 * Mutation para marcar lead como leído - CON OPTIMISTIC UPDATE
 */
export function useMarkLeadAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, userId }: { leadId: string; userId: string }) => {
      // Actualizar lead
      const { error: leadError } = await supabase
        .from('leads')
        .update({ read_at: new Date().toISOString() })
        .eq('id', leadId);

      if (leadError) throw leadError;

      // Actualizar mensajes
      const { error: messagesError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('lead_id', leadId)
        .neq('sender_id', userId);

      if (messagesError) throw messagesError;

      return { leadId };
    },

    // Optimistic update - actualizar UI inmediatamente
    onMutate: async ({ leadId, userId }) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: queryKeys.leads(userId) });

      // Snapshot del valor anterior
      const previousLeads = queryClient.getQueryData<Lead[]>(queryKeys.leads(userId));

      // Optimistic update
      if (previousLeads) {
        queryClient.setQueryData<Lead[]>(
          queryKeys.leads(userId),
          previousLeads.map(lead =>
            lead.id === leadId
              ? { ...lead, read_at: new Date().toISOString(), unread_count: 0 }
              : lead
          )
        );
      }

      return { previousLeads };
    },

    // Rollback en caso de error
    onError: (err, { userId }, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKeys.leads(userId), context.previousLeads);
      }
      console.error('Error marking lead as read:', err);
    },

    // Refetch después de éxito
    onSettled: (data, error, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(userId) });
    },
  });
}

/**
 * Mutation para enviar mensaje - CON OPTIMISTIC UPDATE
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      userId,
      userName,
      content,
    }: {
      leadId: string;
      userId: string;
      userName: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          lead_id: leadId,
          sender_id: userId,
          sender_name: userName,
          content: content.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },

    // Optimistic update
    onMutate: async ({ leadId, userId, userName, content }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leadMessages(leadId) });

      const previousMessages = queryClient.getQueryData<Message[]>(
        queryKeys.leadMessages(leadId)
      );

      // Mensaje temporal
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        lead_id: leadId,
        sender_id: userId,
        sender_name: userName,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // Agregar mensaje optimista
      if (previousMessages) {
        queryClient.setQueryData<Message[]>(
          queryKeys.leadMessages(leadId),
          [...previousMessages, optimisticMessage]
        );
      }

      return { previousMessages };
    },

    onError: (err, { leadId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.leadMessages(leadId), context.previousMessages);
      }
      console.error('Error sending message:', err);
    },

    onSettled: (data, error, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadMessages(leadId) });
    },
  });
}

/**
 * Mutation para actualizar estado de lead
 */
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      status,
    }: {
      leadId: string;
      status: Lead['status'];
    }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onMutate: async ({ leadId, status, userId }: any) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leads(userId) });

      const previousLeads = queryClient.getQueryData<Lead[]>(queryKeys.leads(userId));

      if (previousLeads) {
        queryClient.setQueryData<Lead[]>(
          queryKeys.leads(userId),
          previousLeads.map(lead =>
            lead.id === leadId ? { ...lead, status } : lead
          )
        );
      }

      return { previousLeads };
    },

    onError: (err, { userId }, context: any) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKeys.leads(userId), context.previousLeads);
      }
    },

    onSettled: (data, error, { userId }: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(userId) });
    },
  });
}

/**
 * Mutation para toggle starred
 */
export function useToggleStarred() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, starred }: { leadId: string; starred: boolean }) => {
      const { error } = await supabase
        .from('leads')
        .update({ starred })
        .eq('id', leadId);

      if (error) throw error;
      return { leadId, starred };
    },

    onMutate: async ({ leadId, starred, userId }: any) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leads(userId) });

      const previousLeads = queryClient.getQueryData<Lead[]>(queryKeys.leads(userId));

      if (previousLeads) {
        queryClient.setQueryData<Lead[]>(
          queryKeys.leads(userId),
          previousLeads.map(lead =>
            lead.id === leadId ? { ...lead, starred } : lead
          )
        );
      }

      return { previousLeads };
    },

    onError: (err, { userId }, context: any) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKeys.leads(userId), context.previousLeads);
      }
    },
  });
}

/**
 * Hook para estadísticas de leads
 */
export function useLeadsStats(leads: Lead[] | undefined) {
  if (!leads) {
    return {
      total: 0,
      unread: 0,
      jobOffers: 0,
      collaboration: 0,
      accepted: 0,
      rejected: 0,
      new: 0,
    };
  }

  return {
    total: leads.length,
    unread: leads.filter(l => !l.read_at).length,
    jobOffers: leads.filter(l => l.lead_type === 'job_offer').length,
    collaboration: leads.filter(l => l.lead_type === 'collaboration').length,
    accepted: leads.filter(l => l.status === 'accepted').length,
    rejected: leads.filter(l => l.status === 'rejected').length,
    new: leads.filter(l => l.status === 'new').length,
  };
}