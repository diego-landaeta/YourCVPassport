// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';

// Job Application Status Type
export type JobApplicationStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

// Active statuses that count towards "in progress" applications
export const ACTIVE_APPLICATION_STATUSES: JobApplicationStatus[] = [
  'NEW',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER'
];

export interface JobApplication {
  id: string;
  created_at: string;
  updated_at: string;
  job_posting_id: string;
  profile_id: string;
  status: JobApplicationStatus;
  cover_letter: string | null;
  resume_url: string | null;
  answers: any;
  viewed_by_company: boolean;
  viewed_at: string | null;
  match_score: number | null;
  job_posting?: {
    id: string;
    title: string;
    slug: string;
    department: string | null;
    employment_type: string;
    location_city: string | null;
    location_country: string | null;
    is_remote: boolean;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    company_id: string;
    company?: {
      id: string;
      company_name: string;
      logo_url: string | null;
    };
  };
}

interface UseJobApplicationsOptions {
  includeJobDetails?: boolean;
  statusFilter?: JobApplicationStatus[];
}

/**
 * Custom hook to manage job applications for a user profile
 *
 * Features:
 * - Loads applications from database with optional job posting details
 * - Real-time subscription to application changes
 * - Calculates active applications count (NEW, REVIEWING, INTERVIEW, etc.)
 * - Provides refetch function for manual refresh
 * - Handles loading and error states
 *
 * @param profileId - The user's profile ID
 * @param options - Configuration options
 * @returns Applications data, loading state, active count, and refetch function
 */
export const useJobApplications = (
  profileId: string | undefined | null,
  options: UseJobApplicationsOptions = {}
) => {
  const {
    includeJobDetails = true,
    statusFilter
  } = options;

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  // Load applications from database
  const loadApplications = useCallback(async () => {
    if (!profileId) {
      setApplications([]);
      setActiveCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('job_applications')
        .select(
          includeJobDetails
            ? `
              *,
              job_posting:job_postings (
                id,
                title,
                slug,
                department,
                employment_type,
                location_city,
                location_country,
                is_remote,
                salary_min,
                salary_max,
                salary_currency,
                company_id,
                company:companies (
                  id,
                  company_name,
                  logo_url
                )
              )
            `
            : '*'
        )
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      const apps = (data || []) as JobApplication[];
      setApplications(apps);

      // Calculate active count (applications in progress)
      const active = apps.filter(app =>
        ACTIVE_APPLICATION_STATUSES.includes(app.status)
      ).length;
      setActiveCount(active);

    } catch (err: any) {
      console.error('Error loading job applications:', err);
      setError(err?.message || 'Failed to load applications');
      setApplications([]);
      setActiveCount(0);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, includeJobDetails, JSON.stringify(statusFilter)]);

  // Initial load
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!profileId) return;

    const subscription = supabase
      .channel(`job-applications-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          // Refetch applications when any change occurs
          loadApplications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profileId, loadApplications]);

  return {
    applications,
    loading,
    error,
    activeCount,
    refetch: loadApplications
  };
};
