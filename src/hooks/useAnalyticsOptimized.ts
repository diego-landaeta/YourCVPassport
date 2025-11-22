/**
 * Optimized Analytics Data Fetching Hooks
 *
 * Reduce de 6 queries a 2 queries usando funciones SQL agregadas
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabase/client';
import { queryKeys } from './useQueryClient';
import React from 'react';

export interface AnalyticsSummary {
  views: number;
  clicks: number;
  leads: number;
  unique_visitors: number;
  top_referrers: Array<{ referrer: string; count: number }>;
  top_countries: Array<{ country: string; count: number }>;
}

export interface AnalyticsTimeSeriesPoint {
  date: string;
  views: number;
  clicks: number;
  unique_visitors: number;
}

/**
 * Hook para obtener resumen de analytics - OPTIMIZADO
 * Antes: 6 queries separadas
 * Después: 1 query usando función SQL
 */
export function useAnalyticsSummary(userId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: queryKeys.analytics(userId || '', days),
    queryFn: async (): Promise<AnalyticsSummary> => {
      if (!userId) throw new Error('User ID required');

      // Llamar función SQL que agrega todo en una sola query
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        profile_id: userId,
        days,
      });

      if (error) {
        console.error('Error fetching analytics summary:', error);
        throw error;
      }

      return data as AnalyticsSummary;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener series de tiempo de analytics
 * Usado para gráficos
 */
export function useAnalyticsTimeSeries(userId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: queryKeys.analyticsTimeSeries(userId || '', days),
    queryFn: async (): Promise<AnalyticsTimeSeriesPoint[]> => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase.rpc('get_analytics_timeseries', {
        profile_id: userId,
        days,
      });

      if (error) {
        console.error('Error fetching analytics timeseries:', error);
        throw error;
      }

      return data as AnalyticsTimeSeriesPoint[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para analytics de perfil (sin funciones SQL)
 * Útil si las funciones SQL no están disponibles
 */
export function useAnalyticsBasic(userId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: ['analytics-basic', userId, days],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Ejecutar queries en paralelo (mejor que secuencial)
      const [viewsResult, clicksResult, leadsResult] = await Promise.all([
        supabase
          .from('analytics_views')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', userId)
          .gte('viewed_at', startDate.toISOString()),

        supabase
          .from('analytics_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', userId)
          .gte('clicked_at', startDate.toISOString()),

        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .gte('created_at', startDate.toISOString()),
      ]);

      return {
        views: viewsResult.count || 0,
        clicks: clicksResult.count || 0,
        leads: leadsResult.count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para vistas recientes (últimos N días)
 */
export function useRecentViews(userId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: ['recent-views', userId, limit],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('analytics_views')
        .select('*')
        .eq('profile_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos (más fresco que summary)
  });
}

/**
 * Hook para analytics de URLs específicas
 */
export function useAnalyticsByURL(userId: string | undefined, url: string) {
  return useQuery({
    queryKey: ['analytics-url', userId, url],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('analytics_views')
        .select('*')
        .eq('profile_id', userId)
        .eq('page_url', url)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!url,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Utilidad para calcular estadísticas localmente
 */
export function calculateAnalyticsStats(summary: AnalyticsSummary | undefined) {
  if (!summary) {
    return {
      totalEngagement: 0,
      conversionRate: 0,
      avgViewsPerVisitor: 0,
      topReferrer: null,
      topCountry: null,
    };
  }

  const totalEngagement = summary.views + summary.clicks;
  const conversionRate =
    summary.views > 0 ? ((summary.leads / summary.views) * 100).toFixed(2) : '0.00';
  const avgViewsPerVisitor =
    summary.unique_visitors > 0
      ? (summary.views / summary.unique_visitors).toFixed(1)
      : '0.0';

  return {
    totalEngagement,
    conversionRate: parseFloat(conversionRate),
    avgViewsPerVisitor: parseFloat(avgViewsPerVisitor),
    topReferrer: summary.top_referrers?.[0] || null,
    topCountry: summary.top_countries?.[0] || null,
  };
}

/**
 * Hook para combinar múltiples períodos de analytics
 */
export function useAnalyticsComparison(
  userId: string | undefined,
  currentPeriod: number = 30,
  previousPeriod: number = 30
) {
  const current = useAnalyticsSummary(userId, currentPeriod);
  const previous = useAnalyticsSummary(userId, previousPeriod);

  const comparison = React.useMemo(() => {
    if (!current.data || !previous.data) return null;

    const viewsChange =
      previous.data.views > 0
        ? ((current.data.views - previous.data.views) / previous.data.views) * 100
        : 0;

    const clicksChange =
      previous.data.clicks > 0
        ? ((current.data.clicks - previous.data.clicks) / previous.data.clicks) * 100
        : 0;

    const leadsChange =
      previous.data.leads > 0
        ? ((current.data.leads - previous.data.leads) / previous.data.leads) * 100
        : 0;

    return {
      viewsChange: viewsChange.toFixed(1),
      clicksChange: clicksChange.toFixed(1),
      leadsChange: leadsChange.toFixed(1),
      trend: viewsChange > 0 ? 'up' : viewsChange < 0 ? 'down' : 'stable',
    };
  }, [current.data, previous.data]);

  return {
    current: current.data,
    previous: previous.data,
    comparison,
    isLoading: current.isLoading || previous.isLoading,
    error: current.error || previous.error,
  };
}