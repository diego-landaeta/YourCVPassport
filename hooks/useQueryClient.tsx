/**
 * React Query Setup for Data Caching
 *
 * Configuración centralizada de TanStack Query (React Query) para:
 * - Cache de datos del dashboard
 * - Deduplicación de requests
 * - Invalidación selectiva
 * - Retry logic
 * - Optimistic updates
 */

import React from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuración global del Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración de cache
      staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
      gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en cache (antes cacheTime)

      // Configuración de refetch
      refetchOnWindowFocus: false, // No refetch al volver a la ventana
      refetchOnMount: false, // No refetch al montar si hay datos en cache
      refetchOnReconnect: true, // Sí refetch al reconectar internet

      // Retry logic
      retry: 3, // 3 intentos en caso de error
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Error handling
      throwOnError: false, // No lanzar errores, manejar con error state
    },
    mutations: {
      // Configuración de mutaciones
      retry: 1, // 1 reintento para mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Query Keys - Centralización de keys para fácil invalidación
 */
export const queryKeys = {
  // Profile
  profile: (userId: string) => ['profile', userId] as const,

  // Leads
  leads: (userId: string) => ['leads', userId] as const,
  lead: (leadId: string) => ['lead', leadId] as const,
  leadMessages: (leadId: string) => ['messages', leadId] as const,

  // Analytics
  analytics: (userId: string, days: number = 30) => ['analytics', userId, days] as const,
  analyticsTimeSeries: (userId: string, days: number = 30) => ['analytics-timeseries', userId, days] as const,

  // Dashboard data
  experiences: (userId: string) => ['experiences', userId] as const,
  education: (userId: string) => ['education', userId] as const,
  skills: (userId: string) => ['skills', userId] as const,
  certifications: (userId: string) => ['certifications', userId] as const,
  languages: (userId: string) => ['languages', userId] as const,
  portfolio: (userId: string) => ['portfolio', userId] as const,
  stamps: (userId: string) => ['stamps', userId] as const,

  // Stats
  stats: (userId: string) => ['stats', userId] as const,
};

/**
 * Hook para invalidar queries específicas
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateProfile: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },

    invalidateLeads: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads(userId) });
    },

    invalidateLead: (leadId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadMessages(leadId) });
    },

    invalidateAnalytics: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analyticsTimeSeries(userId) });
    },

    invalidateAllDashboard: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['leads', userId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', userId] });
      queryClient.invalidateQueries({ queryKey: ['experiences', userId] });
      queryClient.invalidateQueries({ queryKey: ['education', userId] });
      queryClient.invalidateQueries({ queryKey: ['skills', userId] });
      queryClient.invalidateQueries({ queryKey: ['certifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['languages', userId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', userId] });
      queryClient.invalidateQueries({ queryKey: ['stamps', userId] });
    },
  };
}

/**
 * Hook para prefetch de datos (cargar antes de navegar)
 */
export function usePrefetchQueries() {
  const queryClient = useQueryClient();

  return {
    prefetchLeads: async (userId: string, fetcher: () => Promise<any>) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.leads(userId),
        queryFn: fetcher,
      });
    },

    prefetchAnalytics: async (userId: string, fetcher: () => Promise<any>) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.analytics(userId),
        queryFn: fetcher,
      });
    },
  };
}

/**
 * Utilidad para optimistic updates
 */
export function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: any[],
  updater: (old: T | undefined) => T
) {
  // Cancelar queries en vuelo
  queryClient.cancelQueries({ queryKey });

  // Snapshot del valor anterior
  const previousData = queryClient.getQueryData<T>(queryKey);

  // Optimistic update
  queryClient.setQueryData<T>(queryKey, updater);

  // Retornar rollback function
  return () => {
    if (previousData !== undefined) {
      queryClient.setQueryData(queryKey, previousData);
    }
  };
}

/**
 * Wrapper del QueryClientProvider con DevTools
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        null /* <ReactQueryDevtools initialIsOpen={false} /> */
      )}
    </QueryClientProvider>
  );
}
