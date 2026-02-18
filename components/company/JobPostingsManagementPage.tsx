import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

interface JobPosting {
  id: string;
  title: string;
  slug: string;
  department: string | null;
  employment_type: string;
  work_mode: string;
  experience_level: string;
  location_city: string | null;
  location_country: string | null;
  is_remote: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'FILLED';
  published_at: string | null;
  application_deadline: string | null;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
  credits_cost: number;
}

const JobPostingsManagementPage: React.FC = () => {
  const t = useTranslations();
  const translations = t.company.jobPostingsManagement;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredPostings, setFilteredPostings] = useState<JobPosting[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_views' | 'most_applications'>('newest');

  useEffect(() => {
    fetchCompanyAndJobPostings();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [jobPostings, filterStatus, searchQuery, sortBy]);

  const fetchCompanyAndJobPostings = async () => {
    try {
      setLoading(true);

      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get company user membership
      const { data: companyUser, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id, role')
        .eq('user_id', user.id)
        .single();

      if (companyUserError || !companyUser) {
        toast.error(translations.toasts.noCompanyFound);
        navigate('/company/register');
        return;
      }

      setCompanyId(companyUser.company_id);

      // Fetch job postings for this company
      const { data: postings, error: postingsError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('company_id', companyUser.company_id)
        .order('created_at', { ascending: false });

      if (postingsError) throw postingsError;

      setJobPostings(postings || []);
    } catch (error: any) {
      console.error('Error fetching job postings:', error);
      toast.error(translations.toasts.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...jobPostings];

    // Apply status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.department?.toLowerCase().includes(query) ||
        p.location_city?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_views':
          return b.views_count - a.views_count;
        case 'most_applications':
          return b.applications_count - a.applications_count;
        default:
          return 0;
      }
    });

    setFilteredPostings(filtered);
  };

  const handlePublish = async (posting: JobPosting) => {
    if (!companyId) return;

    const confirmMsg = translations.confirmPublish.replace('{credits}', posting.credits_cost.toString());
    if (!confirm(confirmMsg)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('publish_job_posting', {
        p_job_posting_id: posting.id,
        p_company_id: companyId,
        p_user_id: user.id,
        p_duration_days: 30,
      });

      if (error) throw error;

      toast.success(translations.toasts.publishSuccess);
      fetchCompanyAndJobPostings();
    } catch (error: any) {
      console.error('Error publishing job:', error);
      if (error.message.includes('Insufficient credits')) {
        toast.error(translations.toasts.insufficientCredits);
        navigate('/company/credits');
      } else {
        toast.error(translations.toasts.errorPublishing);
      }
    }
  };

  const handleStatusChange = async (postingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', postingId);

      if (error) throw error;

      toast.success(translations.toasts.statusUpdated);
      fetchCompanyAndJobPostings();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(translations.toasts.errorUpdatingStatus);
    }
  };

  const handleDelete = async (postingId: string) => {
    if (!confirm(translations.confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', postingId);

      if (error) throw error;

      toast.success(translations.toasts.deleted);
      fetchCompanyAndJobPostings();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error(translations.toasts.errorDeleting);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'CLOSED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'FILLED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {translations.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {translations.subtitle}
              </p>
            </div>
            <button
              onClick={() => navigate('/company/jobs/new')}
              className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {translations.newPosting}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translations.search}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
            />
          </div>

          {/* Filter and Sort */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(translations.filters).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key.toUpperCase())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === key.toUpperCase()
                      ? 'bg-cv-blue text-white'
                      : 'bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white focus:ring-2 focus:ring-cv-blue focus:border-transparent"
            >
              <option value="newest">{translations.sort.newest}</option>
              <option value="oldest">{translations.sort.oldest}</option>
              <option value="most_views">{translations.sort.most_views}</option>
              <option value="most_applications">{translations.sort.most_applications}</option>
            </select>
          </div>
        </div>

        {/* Job Postings List */}
        {filteredPostings.length === 0 ? (
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {jobPostings.length === 0 ? translations.emptyState.title : translations.noResults.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {jobPostings.length === 0 ? translations.emptyState.description : translations.noResults.description}
            </p>
            {jobPostings.length === 0 && (
              <button
                onClick={() => navigate('/company/jobs/new')}
                className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {translations.emptyState.action}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPostings.map((posting) => (
              <div
                key={posting.id}
                className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title and Status */}
                    <div className="flex items-start gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
                        {posting.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(posting.status)}`}>
                        {translations.status[posting.status]}
                      </span>
                    </div>

                    {/* Meta Information */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {posting.department && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {posting.department}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {translations.employmentType[posting.employment_type as keyof typeof translations.employmentType]}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {posting.is_remote ? translations.workMode.REMOTE : `${posting.location_city || ''}, ${posting.location_country || ''}`}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">{posting.views_count}</span>
                        <span className="text-gray-500 dark:text-gray-400">{translations.stats.views}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">{posting.applications_count}</span>
                        <span className="text-gray-500 dark:text-gray-400">{translations.stats.applications}</span>
                      </div>
                      {posting.status === 'DRAFT' && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-gray-900 dark:text-white">{posting.credits_cost}</span>
                          <span className="text-gray-500 dark:text-gray-400">{translations.stats.cost}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {posting.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => navigate(`/company/jobs/edit/${posting.id}`)}
                          className="px-4 py-2 text-sm bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors"
                        >
                          {translations.actions.edit}
                        </button>
                        <button
                          onClick={() => handlePublish(posting)}
                          className="px-4 py-2 text-sm bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {translations.actions.publish}
                        </button>
                      </>
                    )}
                    {posting.status === 'PUBLISHED' && (
                      <>
                        <button
                          onClick={() => navigate(`/company/jobs/${posting.id}/applications`)}
                          className="px-4 py-2 text-sm bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {translations.actions.viewApplications}
                        </button>
                        <button
                          onClick={() => handleStatusChange(posting.id, 'PAUSED')}
                          className="px-4 py-2 text-sm bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors"
                        >
                          {translations.actions.pause}
                        </button>
                      </>
                    )}
                    {posting.status === 'PAUSED' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(posting.id, 'PUBLISHED')}
                          className="px-4 py-2 text-sm bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {translations.actions.resume}
                        </button>
                        <button
                          onClick={() => handleStatusChange(posting.id, 'CLOSED')}
                          className="px-4 py-2 text-sm bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors"
                        >
                          {translations.actions.close}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(posting.id)}
                      className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      {translations.actions.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPostingsManagementPage;
