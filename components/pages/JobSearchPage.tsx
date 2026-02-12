import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BriefcaseIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ArrowRightIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';

interface JobPosting {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  department: string | null;
  employment_type: string;
  work_mode: string;
  experience_level: string;
  location_city: string | null;
  location_country: string | null;
  is_remote: boolean;
  description: string;
  required_skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  show_salary: boolean;
  published_at: string;
  application_deadline: string | null;
  company: {
    name: string;
    logo_url: string | null;
    website: string | null;
  };
}

const JobSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = useTranslations();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    loadJobs();
  }, [searchTerm, locationFilter, employmentTypeFilter, workModeFilter, experienceLevelFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);

      // Public view: limit to 8 featured jobs
      // Authenticated users should use the dashboard for full experience
      const limit = user ? 50 : 8;

      // Usar la función RPC para búsqueda pública optimizada
      const { data, error } = await supabase.rpc('search_public_jobs', {
        p_search_term: searchTerm || null,
        p_location: locationFilter || null,
        p_employment_type: employmentTypeFilter || null,
        p_work_mode: workModeFilter || null,
        p_experience_level: experienceLevelFilter || null,
        p_limit: limit,
        p_offset: 0
      });

      if (error) {
        console.error('Error loading jobs:', error);
        throw error;
      }

      // Transformar datos al formato esperado
      const transformedJobs = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        slug: job.slug,
        company_id: job.company_id,
        department: null,
        employment_type: job.employment_type,
        work_mode: job.work_mode,
        experience_level: job.experience_level,
        location_city: job.location_city,
        location_country: job.location_country,
        is_remote: job.is_remote,
        description: job.description,
        required_skills: job.required_skills || [],
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency,
        show_salary: job.show_salary,
        published_at: job.published_at,
        application_deadline: job.application_deadline,
        company: {
          name: job.company_name,
          logo_url: job.company_logo_url,
          website: null
        }
      }));

      setJobs(transformedJobs);
      setTotalJobs(transformedJobs.length);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error(t.company?.jobSearch?.errorLoading || 'Error loading jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setEmploymentTypeFilter('');
    setWorkModeFilter('');
    setExperienceLevelFilter('');
  };

  const getEmploymentTypeLabel = (type: string) => {
    const filters = t.company?.jobSearch?.filters?.employmentType;
    const labels: Record<string, string> = {
      FULL_TIME: filters?.fullTime || 'Full Time',
      PART_TIME: filters?.partTime || 'Part Time',
      CONTRACT: filters?.contract || 'Contract',
      TEMPORARY: filters?.temporary || 'Temporary',
      INTERNSHIP: filters?.internship || 'Internship',
      FREELANCE: filters?.freelance || 'Freelance',
    };
    return labels[type] || type;
  };

  const getWorkModeLabel = (mode: string) => {
    const filters = t.company?.jobSearch?.filters?.workMode;
    const labels: Record<string, string> = {
      REMOTE: filters?.remote || 'Remote',
      ONSITE: filters?.onsite || 'On-site',
      HYBRID: filters?.hybrid || 'Hybrid',
    };
    return labels[mode] || mode;
  };

  const getExperienceLevelLabel = (level: string) => {
    const filters = t.company?.jobSearch?.filters?.experienceLevel;
    const labels: Record<string, string> = {
      ENTRY: filters?.entry || 'Entry Level',
      JUNIOR: filters?.junior || 'Junior',
      MID: filters?.mid || 'Mid-Level',
      SENIOR: filters?.senior || 'Senior',
      LEAD: filters?.lead || 'Lead',
      EXECUTIVE: filters?.executive || 'Executive',
    };
    return labels[level] || level;
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) return `${t.company?.jobSearch?.salaryFrom || 'From'} ${currency} ${min.toLocaleString()}`;
    return `${t.company?.jobSearch?.salaryUpTo || 'Up to'} ${currency} ${max!.toLocaleString()}`;
  };

  const getDaysAgo = (date: string) => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return lang === 'es' ? 'Hoy' : 'Today';
    if (days === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
    return lang === 'es' ? `Hace ${days} días` : `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-cv-light-gray dark:bg-dark-bg-primary">
      {/* Hero Section */}
      <section className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-dark-text-primary leading-tight">
              {t.company?.jobSearch?.hero?.title || 'Find your next'} <span className="text-cv-blue dark:text-cv-blue-light">{t.company?.jobSearch?.hero?.titleHighlight || 'job'}</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
              {user
                ? (t.company?.jobSearch?.hero?.subtitleAuthenticated || 'Thousands of opportunities await you')
                : (t.company?.jobSearch?.hero?.subtitleGuest || 'Create your profile and access thousands of personalized offers')}
            </p>
            {!user && (
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-cv-blue to-indigo-600 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {t.company?.jobSearch?.hero?.signUpFree || 'Sign Up Free'}
                  <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white dark:bg-dark-bg-primary border-2 border-cv-blue text-cv-blue dark:text-cv-blue-light rounded-lg font-bold text-lg hover:bg-cv-blue/5 dark:hover:bg-cv-blue/10 transition-all"
                >
                  {t.company?.jobSearch?.hero?.signIn || 'Sign In'}
                </button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-primary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg dark:shadow-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                <input
                  type="text"
                  placeholder={t.company.jobSearch.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!user}
                  className="w-full pl-10 pr-4 py-3 bg-cv-light-gray dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                <input
                  type="text"
                  placeholder={t.company.jobSearch.locationPlaceholder}
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  disabled={!user}
                  className="w-full pl-10 pr-4 py-3 bg-cv-light-gray dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/signup');
                  } else {
                    setShowFilters(!showFilters);
                  }
                }}
                className="flex items-center justify-center px-6 py-3 bg-cv-blue dark:bg-cv-blue text-white rounded-lg font-semibold hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light transition-all duration-300 transform hover:scale-105 shadow-lg relative group"
              >
                {!user && (
                  <LockClosedIcon className="absolute -top-2 -right-2 h-5 w-5 text-white bg-red-500 rounded-full p-1 shadow-md animate-pulse" />
                )}
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                {user ? (t.company?.jobSearch?.advancedFilters || 'Filters') : (t.company?.jobSearch?.hero?.signUpFree || 'Register to filter')}
                {user && (employmentTypeFilter || workModeFilter || experienceLevelFilter) && (
                  <span className="ml-2 bg-white text-cv-blue rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                    {[employmentTypeFilter, workModeFilter, experienceLevelFilter].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
            {!user && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                  🔒 {t.company.jobSearch.limitedAccessMessage}<button onClick={() => navigate('/signup')} className="text-cv-blue dark:text-cv-blue-light font-semibold hover:underline">{t.company.jobSearch.createAccount}</button>{t.company.jobSearch.fullAccessMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg dark:shadow-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary flex items-center">
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-cv-blue dark:text-cv-blue-light" />
                {t.company?.jobSearch?.advancedFilters || 'Advanced Filters'}
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 dark:text-dark-text-tertiary hover:text-gray-600 dark:hover:text-dark-text-secondary transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  <BriefcaseIcon className="h-4 w-4 inline mr-1" />
                  {t.company.jobSearch.filters.employmentType.label}
                </label>
                <select
                  value={employmentTypeFilter}
                  onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cv-light-gray dark:bg-dark-bg-primary border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-dark-text-primary transition-all"
                >
                  <option value="">{t.company.jobSearch.filters.all}</option>
                  <option value="FULL_TIME">{t.company.jobSearch.filters.employmentType.fullTime}</option>
                  <option value="PART_TIME">{t.company.jobSearch.filters.employmentType.partTime}</option>
                  <option value="CONTRACT">{t.company.jobSearch.filters.employmentType.contract}</option>
                  <option value="TEMPORARY">{t.company.jobSearch.filters.employmentType.temporary}</option>
                  <option value="INTERNSHIP">{t.company.jobSearch.filters.employmentType.internship}</option>
                  <option value="FREELANCE">{t.company.jobSearch.filters.employmentType.freelance}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  {t.company.jobSearch.filters.workMode.label}
                </label>
                <select
                  value={workModeFilter}
                  onChange={(e) => setWorkModeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cv-light-gray dark:bg-dark-bg-primary border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-dark-text-primary transition-all"
                >
                  <option value="">{t.company.jobSearch.filters.allModes}</option>
                  <option value="REMOTE">{t.company.jobSearch.filters.workMode.remote}</option>
                  <option value="ONSITE">{t.company.jobSearch.filters.workMode.onsite}</option>
                  <option value="HYBRID">{t.company.jobSearch.filters.workMode.hybrid}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {t.company.jobSearch.filters.experienceLevel.label}
                </label>
                <select
                  value={experienceLevelFilter}
                  onChange={(e) => setExperienceLevelFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cv-light-gray dark:bg-dark-bg-primary border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-dark-text-primary transition-all"
                >
                  <option value="">{t.company.jobSearch.filters.allLevels}</option>
                  <option value="ENTRY">{t.company.jobSearch.filters.experienceLevel.entry}</option>
                  <option value="JUNIOR">{t.company.jobSearch.filters.experienceLevel.junior}</option>
                  <option value="MID">{t.company.jobSearch.filters.experienceLevel.mid}</option>
                  <option value="SENIOR">{t.company.jobSearch.filters.experienceLevel.senior}</option>
                  <option value="LEAD">{t.company.jobSearch.filters.experienceLevel.lead}</option>
                  <option value="EXECUTIVE">{t.company.jobSearch.filters.experienceLevel.executive}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 text-gray-600 dark:text-dark-text-secondary hover:text-cv-blue dark:hover:text-cv-blue-light font-medium transition-colors"
              >
                {t.company?.jobSearch?.clearFilters || 'Clear filters'}
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-dark-text-secondary text-lg">
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-cv-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.company.jobSearch.searching}
              </span>
            ) : (
              <>
                <span className="font-bold text-2xl text-cv-blue dark:text-cv-blue-light">{totalJobs}</span>
                <span className="ml-2">{totalJobs !== 1 ? t.company.jobSearch.resultsCount.plural : t.company.jobSearch.resultsCount.singular} {!user ? t.company.jobSearch.resultsCount.featured : t.company.jobSearch.resultsCount.found}</span>
                {!user && (
                  <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                    <LockClosedIcon className="h-4 w-4 mr-1" />
                    {t.company.jobSearch.limitedView} · {t.company.jobSearch.registerToSeeAll}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-dark-border"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cv-blue dark:border-cv-blue-light border-t-transparent absolute top-0"></div>
            </div>
            <p className="mt-6 text-gray-600 dark:text-dark-text-secondary font-medium">{t.company.jobSearch.loading}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg dark:shadow-2xl p-16 text-center">
            <BriefcaseIcon className="h-20 w-20 text-gray-300 dark:text-dark-text-tertiary mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-3">
              {t.company.jobSearch.noJobsFound}
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6 max-w-md mx-auto">
              {t.company.jobSearch.tryDifferentFilters}
            </p>
            <button
              onClick={clearFilters}
              className="px-8 py-3 bg-cv-blue dark:bg-cv-blue text-white rounded-lg font-semibold hover:bg-cv-blue-dark dark:hover:bg-cv-blue-light transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {t.company?.jobSearch?.clearFilters || 'Clear filters'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <div
                  onClick={() => navigate(`/jobs/${job.slug}`)}
                  className={`group bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-cv-blue-light/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer p-6 ${
                    !user && index >= 5 ? 'opacity-60 blur-sm pointer-events-none' : ''
                  }`}
                >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Company Logo */}
                    {job.company.logo_url ? (
                      <div className="flex-shrink-0">
                        <img
                          src={job.company.logo_url}
                          alt={job.company.name}
                          className="h-16 w-16 rounded-lg object-cover border-2 border-gray-100 dark:border-dark-border"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-16 w-16 rounded-lg bg-cv-light-gray dark:bg-dark-bg-tertiary flex items-center justify-center border-2 border-gray-100 dark:border-dark-border">
                        <BuildingOfficeIcon className="h-8 w-8 text-cv-blue dark:text-cv-blue-light" />
                      </div>
                    )}

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-dark-text-primary mb-1 group-hover:text-cv-blue dark:group-hover:text-cv-blue-light transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 dark:text-dark-text-secondary mb-3 flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1.5" />
                        {job.company.name}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.employment_type && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue dark:text-cv-blue-light">
                            <BriefcaseIcon className="h-3 w-3 mr-1" />
                            {getEmploymentTypeLabel(job.employment_type)}
                          </span>
                        )}
                        {job.work_mode && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-cv-green/10 dark:bg-cv-green/20 text-cv-green dark:text-cv-green">
                            {getWorkModeLabel(job.work_mode)}
                          </span>
                        )}
                        {job.is_remote && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {t.company?.jobSearch?.remoteTag || 'Remote'}
                          </span>
                        )}
                        {!job.is_remote && job.location_city && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {job.location_city}, {job.location_country}
                          </span>
                        )}
                        {job.experience_level && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                            {getExperienceLevelLabel(job.experience_level)}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.required_skills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-cv-light-gray dark:bg-dark-bg-primary text-gray-700 dark:text-dark-text-secondary text-xs rounded border border-gray-200 dark:border-dark-border"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.required_skills.length > 5 && (
                            <span className="px-2 py-0.5 text-gray-500 dark:text-dark-text-tertiary text-xs">
                              +{job.required_skills.length - 5} {t.company?.jobSearch?.moreSkills || 'more'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Salary & Date */}
                  <div className="text-right ml-6 flex-shrink-0">
                    {job.show_salary && (job.salary_min || job.salary_max) && (
                      <div className="mb-3 px-3 py-2 bg-cv-green/10 dark:bg-cv-green/20 rounded-lg">
                        <div className="flex items-center justify-end text-cv-green font-semibold text-sm mb-0.5">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-dark-text-tertiary">{t.company.jobSearch.salary}</div>
                      </div>
                    )}
                    <div className="flex items-center justify-end text-xs text-gray-500 dark:text-dark-text-tertiary">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      {getDaysAgo(job.published_at)}
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                  <p className="text-gray-600 dark:text-dark-text-secondary line-clamp-2 text-sm leading-relaxed">
                    {job.description}
                  </p>
                  <div className="mt-3 flex items-center text-cv-blue dark:text-cv-blue-light font-medium text-sm group-hover:underline">
                    {t.company.jobSearch.viewDetails}
                    <svg className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* CTA after 5th job for non-authenticated users */}
              {!user && index === 4 && (
                <div className="relative">
                  <div className="bg-gradient-to-r from-cv-blue to-indigo-600 rounded-lg shadow-2xl p-10 text-center text-white">
                    <div className="flex justify-center mb-4">
                      <LockClosedIcon className="w-16 h-16" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3">
                      {t.company?.jobSearch?.cta?.title || 'Want to see all job offers?'}
                    </h3>
                    <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                      {t.company?.jobSearch?.cta?.subtitle || 'Create your free profile and access:'}
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-4xl mb-2">🎯</div>
                        <div className="font-semibold mb-1">{t.company?.jobSearch?.cta?.personalizedOffers || 'Personalized Offers'}</div>
                        <div className="text-sm opacity-80">{t.company?.jobSearch?.cta?.personalizedOffersDesc || 'Based on your profile and skills'}</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-4xl mb-2">📊</div>
                        <div className="font-semibold mb-1">{t.company?.jobSearch?.cta?.matchScore || 'Match Score'}</div>
                        <div className="text-sm opacity-80">{t.company?.jobSearch?.cta?.matchScoreDesc || 'See your compatibility with each offer'}</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-4xl mb-2">💾</div>
                        <div className="font-semibold mb-1">{t.company?.jobSearch?.cta?.saveAndApply || 'Save & Apply'}</div>
                        <div className="text-sm opacity-80">{t.company?.jobSearch?.cta?.saveAndApplyDesc || 'Manage your applications in one place'}</div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => navigate('/signup')}
                        className="px-10 py-4 bg-white text-cv-blue rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                      >
                        {t.company?.jobSearch?.cta?.createAccountFree || 'Create Free Account'}
                        <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-10 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition-all"
                      >
                        {t.company?.jobSearch?.cta?.alreadyHaveAccount || 'Already have an account'}
                      </button>
                    </div>
                    <p className="mt-6 text-sm opacity-75">
                      ✓ {t.company?.jobSearch?.cta?.freeForever || 'Free forever'} · ✓ {t.company?.jobSearch?.cta?.noCreditCard || 'No credit card'} · ✓ {t.company?.jobSearch?.cta?.setupTime || 'Setup in 2 minutes'}
                    </p>
                  </div>
                </div>
              )}
            </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearchPage;
