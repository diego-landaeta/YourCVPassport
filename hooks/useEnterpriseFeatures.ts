/**
 * Enterprise Features Hook
 *
 * Hook para verificar y gestionar las funcionalidades Enterprise
 * Permite verificar si un usuario tiene acceso a características específicas
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

// Types
export type FeatureCategory = 'support' | 'integration' | 'customization' | 'analytics' | 'team' | 'content' | 'general';

export interface EnterpriseFeature {
  feature_key: string;
  name_en: string;
  name_es: string;
  description_en: string;
  description_es: string;
  icon: string;
  category: FeatureCategory;
  has_feature: boolean;
  source?: 'plan_default' | 'enterprise_default' | 'custom_assignment' | 'custom_grant';
  custom_value?: Record<string, unknown>;
}

export interface FeatureCheck {
  has_feature: boolean;
  plan?: string;
  source?: string;
  reason?: string;
  custom_value?: Record<string, unknown>;
  expired_at?: string;
}

export interface UserEnterpriseFeatures {
  plan: string;
  features: EnterpriseFeature[];
}

// Feature keys for type safety
export const ENTERPRISE_FEATURES = {
  // Support
  PRIORITY_SUPPORT: 'priority_support',
  DEDICATED_ACCOUNT_MANAGER: 'dedicated_account_manager',
  SUPPORT_24_7: '24_7_support',

  // Integration
  API_ACCESS: 'api_access',
  WEBHOOK_NOTIFICATIONS: 'webhook_notifications',
  ATS_INTEGRATION: 'ats_integration',
  SSO_SAML: 'sso_saml',

  // Customization
  WHITE_LABEL: 'white_label',
  CUSTOM_DOMAIN: 'custom_domain',
  CUSTOM_BRANDING: 'custom_branding',
  CUSTOM_EMAIL_TEMPLATES: 'custom_email_templates',

  // Analytics
  ADVANCED_ANALYTICS: 'advanced_analytics',
  EXPORT_ANALYTICS: 'export_analytics',
  TEAM_ANALYTICS: 'team_analytics',

  // Team
  TEAM_MANAGEMENT: 'team_management',
  ROLE_PERMISSIONS: 'role_permissions',
  BULK_OPERATIONS: 'bulk_operations',

  // Content
  PREMIUM_TEMPLATES: 'premium_templates',
  AI_UNLIMITED: 'ai_unlimited',
  VIDEO_CV: 'video_cv',
} as const;

export type EnterpriseFeatureKey = typeof ENTERPRISE_FEATURES[keyof typeof ENTERPRISE_FEATURES];

/**
 * Hook to check and manage enterprise features for the current user
 */
export function useEnterpriseFeatures() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<UserEnterpriseFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all features for the user
  const fetchFeatures = useCallback(async () => {
    if (!user?.id) {
      setFeatures(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_user_enterprise_features', {
        p_user_id: user.id,
      });

      if (rpcError) {
        throw rpcError;
      }

      setFeatures(data as UserEnterpriseFeatures);
    } catch (err) {
      console.error('Error fetching enterprise features:', err);
      setError(err instanceof Error ? err.message : 'Error loading features');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Check if user has a specific feature
  const hasFeature = useCallback((featureKey: EnterpriseFeatureKey): boolean => {
    if (!features) return false;
    const feature = features.features.find(f => f.feature_key === featureKey);
    return feature?.has_feature ?? false;
  }, [features]);

  // Check a single feature with full details
  const checkFeature = useCallback(async (featureKey: EnterpriseFeatureKey): Promise<FeatureCheck> => {
    if (!user?.id) {
      return { has_feature: false, reason: 'Not authenticated' };
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('check_enterprise_feature', {
        p_user_id: user.id,
        p_feature_key: featureKey,
      });

      if (rpcError) {
        throw rpcError;
      }

      return data as FeatureCheck;
    } catch (err) {
      console.error('Error checking feature:', err);
      return { has_feature: false, reason: 'Error checking feature' };
    }
  }, [user?.id]);

  // Get features by category
  const getFeaturesByCategory = useCallback((category: FeatureCategory): EnterpriseFeature[] => {
    if (!features) return [];
    return features.features.filter(f => f.category === category);
  }, [features]);

  // Get all enabled features
  const getEnabledFeatures = useCallback((): EnterpriseFeature[] => {
    if (!features) return [];
    return features.features.filter(f => f.has_feature);
  }, [features]);

  // Quick checks for common features
  const canUseAPI = useCallback(() => hasFeature(ENTERPRISE_FEATURES.API_ACCESS), [hasFeature]);
  const canUseWhiteLabel = useCallback(() => hasFeature(ENTERPRISE_FEATURES.WHITE_LABEL), [hasFeature]);
  const canUseCustomDomain = useCallback(() => hasFeature(ENTERPRISE_FEATURES.CUSTOM_DOMAIN), [hasFeature]);
  const canUseTeamManagement = useCallback(() => hasFeature(ENTERPRISE_FEATURES.TEAM_MANAGEMENT), [hasFeature]);
  const hasPrioritySupport = useCallback(() => hasFeature(ENTERPRISE_FEATURES.PRIORITY_SUPPORT), [hasFeature]);
  const hasAdvancedAnalytics = useCallback(() => hasFeature(ENTERPRISE_FEATURES.ADVANCED_ANALYTICS), [hasFeature]);

  // Check if user is Enterprise
  const isEnterprise = features?.plan === 'enterprise';
  const isPro = features?.plan === 'pro';
  const isPremium = isEnterprise || isPro;

  return {
    // State
    features,
    isLoading,
    error,
    plan: features?.plan,

    // Feature checks
    hasFeature,
    checkFeature,
    getFeaturesByCategory,
    getEnabledFeatures,

    // Quick checks
    canUseAPI,
    canUseWhiteLabel,
    canUseCustomDomain,
    canUseTeamManagement,
    hasPrioritySupport,
    hasAdvancedAnalytics,

    // Plan checks
    isEnterprise,
    isPro,
    isPremium,

    // Actions
    refresh: fetchFeatures,
  };
}

/**
 * Hook for admin to manage enterprise features
 */
export function useEnterpriseAdmin() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all available enterprise features (for admin UI)
  const getAllFeatures = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('enterprise_features')
        .select('*')
        .order('sort_order');

      if (queryError) throw queryError;
      return data;
    } catch (err) {
      console.error('Error fetching all features:', err);
      throw err;
    }
  }, []);

  // Get features for a specific user
  const getUserFeatures = useCallback(async (userId: string): Promise<UserEnterpriseFeatures | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_enterprise_features', {
        p_user_id: userId,
      });

      if (rpcError) throw rpcError;
      return data as UserEnterpriseFeatures;
    } catch (err) {
      console.error('Error fetching user features:', err);
      throw err;
    }
  }, []);

  // Grant or revoke a feature for a user
  const setUserFeature = useCallback(async (
    userId: string,
    featureKey: string,
    enabled: boolean,
    options?: {
      customValue?: Record<string, unknown>;
      expiresAt?: Date;
      notes?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('admin_set_user_feature', {
        p_user_id: userId,
        p_feature_key: featureKey,
        p_enabled: enabled,
        p_custom_value: options?.customValue || {},
        p_expires_at: options?.expiresAt?.toISOString() || null,
        p_notes: options?.notes || null,
      });

      if (rpcError) throw rpcError;

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating feature';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Grant all enterprise features to a user
  const grantEnterprisePlan = useCallback(async (userId: string, notes?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('admin_grant_enterprise_plan', {
        p_user_id: userId,
        p_notes: notes || 'Upgraded to Enterprise plan',
      });

      if (rpcError) throw rpcError;

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error granting enterprise plan';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new enterprise feature
  const createFeature = useCallback(async (feature: {
    feature_key: string;
    name_en: string;
    name_es: string;
    description_en?: string;
    description_es?: string;
    icon?: string;
    category?: string;
    sort_order?: number;
  }) => {
    try {
      const { data, error: insertError } = await supabase
        .from('enterprise_features')
        .insert(feature)
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      console.error('Error creating feature:', err);
      throw err;
    }
  }, []);

  // Update an enterprise feature
  const updateFeature = useCallback(async (featureKey: string, updates: Partial<{
    name_en: string;
    name_es: string;
    description_en: string;
    description_es: string;
    icon: string;
    category: string;
    is_active: boolean;
    sort_order: number;
  }>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('enterprise_features')
        .update(updates)
        .eq('feature_key', featureKey)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (err) {
      console.error('Error updating feature:', err);
      throw err;
    }
  }, []);

  // Delete an enterprise feature
  const deleteFeature = useCallback(async (featureKey: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('enterprise_features')
        .delete()
        .eq('feature_key', featureKey);

      if (deleteError) throw deleteError;
      return true;
    } catch (err) {
      console.error('Error deleting feature:', err);
      throw err;
    }
  }, []);

  return {
    isLoading,
    error,

    // Feature management
    getAllFeatures,
    createFeature,
    updateFeature,
    deleteFeature,

    // User feature management
    getUserFeatures,
    setUserFeature,
    grantEnterprisePlan,
  };
}

export default useEnterpriseFeatures;
