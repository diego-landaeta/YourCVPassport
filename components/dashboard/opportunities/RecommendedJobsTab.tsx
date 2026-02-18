import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase/client';
import {
  SparklesIcon,
  BriefcaseIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BookmarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import MatchScoreBadge from '../../jobs/MatchScoreBadge';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslations } from '../../../hooks/useTranslations';
import LoadingSpinner from '../../shared/LoadingSpinner';
import toast from 'react-hot-toast';

interface RecommendedJob {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  employment_type: string;
  work_mode: string;
  location_city: string | null;
  location_country: string | null;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  required_skills: string[] | null;
  created_at: string;
  match_score: number | null;
  is_saved?: boolean;
  has_applied?: boolean;
}

interface RecommendedJobsTabProps {
  profileId: string;
  onSwitchToAllJobs?: () => void;
}

const RecommendedJobsTab: React.FC<RecommendedJobsTabProps> = ({ profileId, onSwitchToAllJobs }) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendedJobs();
  }, [profileId]);

  const loadRecommendedJobs = async () => {
    try {
      setLoading(true);

      // Get user's skills for matching
      const { data: userSkills } = await supabase
        .from('skills')
        .select('name')
        .eq('profile_id', profileId);

      const skillNames = userSkills?.map(s => s.name) || [];

      // Get published jobs
      const { data: jobsData, error } = await supabase
        .from('job_postings')
        .select(`
          id,
          title,
          slug,
          company_id,
          employment_type,
          work_mode,
          location_city,
          location_country,
          is_remote,
          salary_min,
          salary_max,
          salary_currency,
          required_skills,
          created_at,
          companies!inner (
            id,
            company_name,
            logo_url
          )
        `)
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate simple match scores (frontend fallback)
      const jobsWithScores: RecommendedJob[] = (jobsData || []).map((job: any) => {
        const jobSkills = job.required_skills || [];
        const matchedSkills = jobSkills.filter((skill: string) =>
          skillNames.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
        );
        const matchScore = jobSkills.length > 0
          ? Math.round((matchedSkills.length / jobSkills.length) * 100)
          : 50;

        return {
          id: job.id,
          title: job.title,
          slug: job.slug,
          company_id: job.company_id,
          company_name: job.companies.company_name,
          company_logo_url: job.companies.logo_url,
          employment_type: job.employment_type,
          work_mode: job.work_mode,
          location_city: job.location_city,
          location_country: job.location_country,
          is_remote: job.is_remote,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency,
          required_skills: job.required_skills,
          created_at: job.created_at,
          match_score: matchScore
        };
      });

      // Sort by match score (highest first)
      const sortedJobs = jobsWithScores.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

      // Check which jobs are saved
      const { data: savedJobs } = await supabase
        .from('saved_job_postings')
        .select('job_posting_id')
        .eq('profile_id', profileId);

      const savedJobIds = new Set(savedJobs?.map(s => s.job_posting_id) || []);

      // Check which jobs user has applied to
      const { data: applications } = await supabase
        .from('job_applications')
        .select('job_posting_id')
        .eq('profile_id', profileId);

      const appliedJobIds = new Set(applications?.map(a => a.job_posting_id) || []);

      const finalJobs = sortedJobs.map(job => ({
        ...job,
        is_saved: savedJobIds.has(job.id),
        has_applied: appliedJobIds.has(job.id)
      }));

      // Show only top matches (score >= 40)
      setJobs(finalJobs.filter(j => (j.match_score || 0) >= 40).slice(0, 20));
    } catch (error: any) {
      console.error('Error loading recommended jobs:', error);
      toast.error(t.dashboard.opportunities.errorLoadingRecommendations);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (jobId: string, jobTitle: string, currentlySaved: boolean) => {
    try {
      const { data, error } = await supabase.rpc('toggle_job_save', {
        p_job_posting_id: jobId
      });

      if (error) throw error;

      setJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, is_saved: !currentlySaved } : job
        )
      );

      toast.success(
        currentlySaved
          ? t.dashboard.opportunities.jobRemoved(jobTitle)
          : t.dashboard.opportunities.jobSaved(jobTitle)
      );
    } catch (error: any) {
      console.error('Error toggling save:', error);
      toast.error(t.dashboard.opportunities.errorSavingJob);
    }
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency || '$';
    if (min && max) return `${curr}${min.toLocaleString()} - ${curr}${max.toLocaleString()}`;
    if (min) return `${t.dashboard.opportunities.salaryFrom} ${curr}${min.toLocaleString()}`;
    return `${t.dashboard.opportunities.salaryUpTo} ${curr}${max!.toLocaleString()}`;
  };

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FULL_TIME: t.dashboard.opportunities.fullTime,
      PART_TIME: t.dashboard.opportunities.partTime,
      CONTRACT: t.dashboard.opportunities.contract,
      TEMPORARY: t.dashboard.opportunities.temporary,
      INTERNSHIP: t.dashboard.opportunities.internship,
      FREELANCE: 'Freelance'
    };
    return labels[type] || type;
  };

  const getDaysAgo = (date: string) => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return t.dashboard.opportunities.today;
    if (days === 1) return t.dashboard.opportunities.yesterday;
    return t.dashboard.opportunities.daysAgo(days);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner
          message={t.dashboard.opportunities.loadingRecommendations}
          size="large"
        />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-12 text-center">
        <SparklesIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {t.dashboard.opportunities.noRecommendations}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t.dashboard.opportunities.noRecommendationsDescription}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onSwitchToAllJobs}
            className="px-6 py-3 bg-cv-blue text-white rounded-lg font-medium hover:bg-cv-blue-dark transition-colors"
          >
            {t.dashboard.opportunities.viewAllJobs}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-cv-blue to-indigo-600 rounded-lg shadow-lg p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-8 h-8" />
          <h2 className="text-2xl font-bold">
            {t.dashboard.opportunities.recommendedJobs}
          </h2>
        </div>
        <p className="opacity-90">
          {t.dashboard.opportunities.recommendedJobsDescription(jobs.length)}
        </p>
      </div>

      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg hover:shadow-xl transition-all p-6 group relative"
        >
          {/* Match Score Badge - Top Right */}
          <div className="absolute top-4 right-4">
            <MatchScoreBadge score={job.match_score || 0} size="md" showBreakdown={false} />
          </div>

          <div className="flex items-start gap-4 pr-32">
            {/* Company Logo */}
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={job.company_name}
                className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <BuildingOfficeIcon className="w-7 h-7 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              {/* Job Title & Company */}
              <h3
                onClick={() => navigate(`/jobs/${job.slug}`)}
                className="text-lg font-bold text-gray-900 dark:text-white mb-1 hover:text-cv-blue dark:hover:text-cv-blue-light cursor-pointer transition-colors"
              >
                {job.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{job.company_name}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {job.has_applied && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500">
                    ✓ {t.dashboard.opportunities.alreadyApplied}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue dark:text-cv-blue-light">
                  <BriefcaseIcon className="w-3 h-3" />
                  {getEmploymentTypeLabel(job.employment_type)}
                </span>

                {job.is_remote && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <MapPinIcon className="w-3 h-3" />
                    {t.dashboard.opportunities.remote}
                  </span>
                )}

                {!job.is_remote && job.location_city && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
                    <MapPinIcon className="w-3 h-3" />
                    {job.location_city}
                  </span>
                )}

                {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <CurrencyDollarIcon className="w-3 h-3" />
                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-gray-500 dark:text-gray-400">
                  <ClockIcon className="w-3 h-3" />
                  {getDaysAgo(job.created_at)}
                </span>
              </div>

              {/* Skills Preview */}
              {job.required_skills && job.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.required_skills.slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-xs rounded border border-gray-200 dark:border-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.required_skills.length > 5 && (
                    <span className="px-2 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                      +{job.required_skills.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/jobs/${job.slug}`)}
                  className="px-4 py-2 bg-cv-blue text-white rounded-lg font-medium hover:bg-cv-blue-dark transition-colors text-sm"
                >
                  {t.dashboard.opportunities.viewDetails}
                </button>
                <button
                  onClick={() => toggleSave(job.id, job.title, job.is_saved || false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
                    job.is_saved
                      ? 'bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue dark:text-cv-blue-light'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {job.is_saved ? (
                    <BookmarkIconSolid className="w-4 h-4" />
                  ) : (
                    <BookmarkIcon className="w-4 h-4" />
                  )}
                  {job.is_saved
                    ? t.dashboard.opportunities.saved
                    : t.dashboard.opportunities.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecommendedJobsTab;
