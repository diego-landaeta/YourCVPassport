/**
 * Hook for checking and tracking feature usage limits
 *
 * Provides functions to:
 * - Check if user can use a feature
 * - Record usage events
 * - Get usage statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

// Feature types that can be tracked
export type FeatureType = 'ats_export' | 'ai_request' | 'stamp_request' | 'profile_view';

// Plan types
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

// Feature check result
export interface FeatureLimitCheck {
  allowed: boolean;
  plan: PlanType;
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
  reason?: string;
}

// Full usage stats
export interface UsageStats {
  plan: PlanType;
  ats_export: FeatureLimitCheck;
  ai_request: FeatureLimitCheck;
  stamp_request: FeatureLimitCheck;
  features: {
    can_use_ai: boolean;
    can_use_premium_templates: boolean;
    can_remove_branding: boolean;
  };
  period_start: string;
  period_end: string;
}

// Record usage result
export interface RecordUsageResult {
  success: boolean;
  error?: string;
  details?: FeatureLimitCheck;
}

// Plan display info
export const PLAN_INFO: Record<PlanType, { name: string; color: string; badge: string }> = {
  free: { name: 'Free', color: 'gray', badge: 'bg-gray-100 text-gray-800' },
  basic: { name: 'Basic', color: 'blue', badge: 'bg-blue-100 text-blue-800' },
  pro: { name: 'Professional', color: 'indigo', badge: 'bg-indigo-100 text-indigo-800' },
  enterprise: { name: 'Enterprise', color: 'purple', badge: 'bg-purple-100 text-purple-800' },
};

// Feature display info
export const FEATURE_INFO: Record<FeatureType, { name: string; description: string }> = {
  ats_export: {
    name: 'ATS Export',
    description: 'Export your CV in ATS-optimized PDF or DOCX format',
  },
  ai_request: {
    name: 'AI Assistant',
    description: 'Use AI to optimize your profile content',
  },
  stamp_request: {
    name: 'Verification Stamps',
    description: 'Request verification for your credentials',
  },
  profile_view: {
    name: 'Profile Views',
    description: 'Track who views your profile',
  },
};

export function useUsageLimits() {
  const { user, profile } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current usage stats
   */
  const fetchUsageStats = useCallback(async () => {
    if (!user?.id) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_usage_stats', {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;

      // Parse the result (it comes as JSONB)
      const stats = data as UsageStats;
      setUsageStats(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage stats';
      setError(errorMessage);
      console.error('Error fetching usage stats:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Check if user can use a specific feature
   */
  const checkFeatureLimit = useCallback(
    async (featureType: FeatureType): Promise<FeatureLimitCheck | null> => {
      if (!user?.id) {
        return {
          allowed: false,
          plan: 'free',
          limit: 0,
          used: 0,
          remaining: 0,
          reason: 'Not authenticated',
        };
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('check_feature_limit', {
          p_user_id: user.id,
          p_feature_type: featureType,
        });

        if (rpcError) throw rpcError;

        return data as FeatureLimitCheck;
      } catch (err) {
        console.error('Error checking feature limit:', err);
        return null;
      }
    },
    [user?.id]
  );

  /**
   * Record usage of a feature (with limit check)
   */
  const recordUsage = useCallback(
    async (
      featureType: FeatureType,
      metadata?: Record<string, unknown>
    ): Promise<RecordUsageResult> => {
      if (!user?.id) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('record_usage', {
          p_user_id: user.id,
          p_feature_type: featureType,
          p_metadata: metadata || {},
        });

        if (rpcError) throw rpcError;

        const result = data as RecordUsageResult;

        // Refresh stats after recording
        if (result.success) {
          await fetchUsageStats();
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to record usage';
        console.error('Error recording usage:', err);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [user?.id, fetchUsageStats]
  );

  /**
   * Quick check if user can use AI (common use case)
   */
  const canUseAI = useCallback(async (): Promise<boolean> => {
    const check = await checkFeatureLimit('ai_request');
    return check?.allowed ?? false;
  }, [checkFeatureLimit]);

  /**
   * Quick check if user can export ATS
   */
  const canExportATS = useCallback(async (): Promise<boolean> => {
    const check = await checkFeatureLimit('ats_export');
    return check?.allowed ?? false;
  }, [checkFeatureLimit]);

  /**
   * Quick check if user can request stamps
   */
  const canRequestStamp = useCallback(async (): Promise<boolean> => {
    const check = await checkFeatureLimit('stamp_request');
    return check?.allowed ?? false;
  }, [checkFeatureLimit]);

  /**
   * Get user's current plan
   */
  const getCurrentPlan = useCallback((): PlanType => {
    return (profile?.plan as PlanType) || 'free';
  }, [profile?.plan]);

  /**
   * Check if user has a paid plan
   */
  const isPaidPlan = useCallback((): boolean => {
    const plan = getCurrentPlan();
    return plan !== 'free';
  }, [getCurrentPlan]);

  /**
   * Check if user has premium features
   */
  const hasPremiumFeatures = useCallback((): boolean => {
    const plan = getCurrentPlan();
    return plan === 'pro' || plan === 'enterprise';
  }, [getCurrentPlan]);

  // Fetch stats on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUsageStats();
    }
  }, [user?.id, fetchUsageStats]);

  return {
    // State
    usageStats,
    isLoading,
    error,

    // Actions
    fetchUsageStats,
    checkFeatureLimit,
    recordUsage,

    // Quick checks
    canUseAI,
    canExportATS,
    canRequestStamp,

    // Plan helpers
    getCurrentPlan,
    isPaidPlan,
    hasPremiumFeatures,

    // Constants
    PLAN_INFO,
    FEATURE_INFO,
  };
}

/**
 * Hook specifically for AI access checks
 * Use this in AI-related components for cleaner code
 */
export function useAIAccess() {
  const { user } = useAuth();
  const [canUse, setCanUse] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [limitInfo, setLimitInfo] = useState<FeatureLimitCheck | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id) {
        setCanUse(false);
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_feature_limit', {
          p_user_id: user.id,
          p_feature_type: 'ai_request',
        });

        if (error) throw error;

        const result = data as FeatureLimitCheck;
        setLimitInfo(result);
        setCanUse(result.allowed);
      } catch (err) {
        console.error('Error checking AI access:', err);
        setCanUse(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [user?.id]);

  return { canUse, isChecking, limitInfo };
}

/**
 * Hook specifically for ATS export checks
 */
export function useATSExportAccess() {
  const { user } = useAuth();
  const [canUse, setCanUse] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [limitInfo, setLimitInfo] = useState<FeatureLimitCheck | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id) {
        setCanUse(false);
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_feature_limit', {
          p_user_id: user.id,
          p_feature_type: 'ats_export',
        });

        if (error) throw error;

        const result = data as FeatureLimitCheck;
        setLimitInfo(result);
        setCanUse(result.allowed);
      } catch (err) {
        console.error('Error checking ATS export access:', err);
        setCanUse(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [user?.id]);

  return { canUse, isChecking, limitInfo };
}

export default useUsageLimits;
