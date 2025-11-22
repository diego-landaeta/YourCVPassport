/**
 * HOOK FOR CV VERSIONS MANAGEMENT
 * CRUD operations for managing multiple CV versions by country/role
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import {
  CVVersion,
  CreateCVVersionRequest,
  UpdateCVVersionRequest,
  CVVersionStats,
  FullProfileData,
  CVSectionType
} from '../types';

interface UseCVVersionsOptions {
  autoFetch?: boolean;
}

/**
 * Hook for managing CV versions
 */
export function useCVVersions(options: UseCVVersionsOptions = {}) {
  const { autoFetch = true } = options;
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query to fetch all versions for the current profile
  const {
    data: versions = [],
    isLoading,
    refetch,
    error: queryError
  } = useQuery({
    queryKey: ['cv-versions', profile?.id],
    queryFn: async (): Promise<CVVersion[]> => {
      if (!profile?.id) {
        setError('No profile ID');
        return [];
      }

      const { data, error: supabaseError } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        // Store error message for display but DON'T throw
        setError(supabaseError.message || 'Error fetching CV versions');
        console.error('CV Versions error:', supabaseError);
        return [];
      }

      setError(null);
      return data || [];
    },
    enabled: autoFetch && !!profile?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false // Don't retry if table doesn't exist
  });

  // Query to fetch version statistics
  const { data: stats } = useQuery({
    queryKey: ['cv-version-stats', profile?.id],
    queryFn: async (): Promise<CVVersionStats | null> => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .rpc('get_cv_version_stats', { p_profile_id: profile.id });

      if (error) {
        console.error('Error fetching version stats:', error);
        return null;
      }

      return data?.[0] || null;
    },
    enabled: autoFetch && !!profile?.id && !error, // Don't fetch stats if main query failed
    staleTime: 1000 * 60 * 5,
    retry: false
  });

  // Fetch current profile data to create a snapshot
  const fetchCurrentProfileData = useCallback(async (): Promise<FullProfileData | null> => {
    if (!profile?.id) {
      setError('No profile ID available');
      return null;
    }

    try {
      const [
        { data: experiences },
        { data: education },
        { data: certifications },
        { data: skills },
        { data: languages },
        { data: services },
        { data: statsData },
        { data: portfolioItems },
        { data: visas },
        { data: stamps }
      ] = await Promise.all([
        supabase.from('experiences').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('education').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('certifications').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('skills').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('languages').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('services').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('stats').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('portfolio_items').select('*').eq('profile_id', profile.id).order('sort_order'),
        supabase.from('visas').select('*').eq('profile_id', profile.id),
        supabase.from('stamps').select('*').eq('profile_id', profile.id)
      ]);

      const fullProfileData: FullProfileData = {
        profile,
        experiences: experiences || [],
        education: education || [],
        certifications: certifications || [],
        skills: skills || [],
        languages: languages || [],
        services: services || [],
        stats: statsData || [],
        portfolioItems: portfolioItems || [],
        visas: visas || [],
        stamps: stamps || []
      };

      return fullProfileData;
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to fetch profile data');
      return null;
    }
  }, [profile]);

  // Create a new CV version
  const createVersion = useCallback(
    async (request: CreateCVVersionRequest): Promise<CVVersion | null> => {
      if (!profile?.id) {
        setError('No profile ID available');
        return null;
      }

      setIsCreating(true);
      setError(null);

      try {
        // Fetch current profile data to snapshot
        const snapshotData = await fetchCurrentProfileData();
        if (!snapshotData) {
          throw new Error('Failed to create snapshot');
        }

        // Create the version
        const { data, error: insertError } = await supabase
          .from('cv_versions')
          .insert({
            profile_id: profile.id,
            version_name: request.version_name,
            country: request.country || null,
            role: request.role || null,
            sections: request.sections,
            template: request.template || 'modern',
            template_color: request.template_color || null,
            snapshot_data: snapshotData,
            export_options: request.export_options || {
              includePhoto: true,
              includeStamps: true,
              includeSummary: true,
              includeSkills: true,
              includeLanguages: true,
              includeCertifications: true,
              includePortfolio: true
            },
            notes: request.notes || null,
            created_by: profile.id
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['cv-versions', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['cv-version-stats', profile.id] });

        return data;
      } catch (err) {
        console.error('Error creating version:', err);
        setError(err instanceof Error ? err.message : 'Failed to create version');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [profile, fetchCurrentProfileData, queryClient]
  );

  // Update an existing CV version
  const updateVersion = useCallback(
    async (versionId: string, updates: UpdateCVVersionRequest): Promise<CVVersion | null> => {
      if (!profile?.id) {
        setError('No profile ID available');
        return null;
      }

      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from('cv_versions')
          .update(updates)
          .eq('id', versionId)
          .eq('profile_id', profile.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['cv-versions', profile.id] });

        return data;
      } catch (err) {
        console.error('Error updating version:', err);
        setError(err instanceof Error ? err.message : 'Failed to update version');
        return null;
      }
    },
    [profile, queryClient]
  );

  // Delete a CV version
  const deleteVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      if (!profile?.id) {
        setError('No profile ID available');
        return false;
      }

      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from('cv_versions')
          .delete()
          .eq('id', versionId)
          .eq('profile_id', profile.id);

        if (deleteError) throw deleteError;

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['cv-versions', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['cv-version-stats', profile.id] });

        return true;
      } catch (err) {
        console.error('Error deleting version:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete version');
        return false;
      }
    },
    [profile, queryClient]
  );

  // Duplicate a CV version
  const duplicateVersion = useCallback(
    async (versionId: string, newName: string): Promise<string | null> => {
      if (!profile?.id) {
        setError('No profile ID available');
        return null;
      }

      setError(null);

      try {
        const { data, error: rpcError } = await supabase
          .rpc('duplicate_cv_version', {
            p_version_id: versionId,
            p_new_name: newName
          });

        if (rpcError) throw rpcError;

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['cv-versions', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['cv-version-stats', profile.id] });

        return data;
      } catch (err) {
        console.error('Error duplicating version:', err);
        setError(err instanceof Error ? err.message : 'Failed to duplicate version');
        return null;
      }
    },
    [profile, queryClient]
  );

  // Get a single version by ID
  const getVersion = useCallback(
    async (versionId: string): Promise<CVVersion | null> => {
      if (!profile?.id) {
        setError('No profile ID available');
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('cv_versions')
          .select('*')
          .eq('id', versionId)
          .eq('profile_id', profile.id)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error fetching version:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch version');
        return null;
      }
    },
    [profile]
  );

  return {
    // Data
    versions,
    stats,
    isLoading,
    isCreating,
    error,

    // Methods
    createVersion,
    updateVersion,
    deleteVersion,
    duplicateVersion,
    getVersion,
    refetch,
    fetchCurrentProfileData
  };
}
