import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase/client';
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
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { useLanguage } from '../../../contexts/LanguageContext';
import LoadingSpinner from '../../shared/LoadingSpinner';

interface JobPosting {
  id: string;
  title: string;
  slug: string;
  company_id: string;
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
  company_name: string;
  company_logo_url: string | null;
  is_saved?: boolean;
  has_applied?: boolean;
}

interface AllJobsTabProps {
  profileId: string;
}

const AllJobsTab: React.FC<AllJobsTabProps> = ({ profileId }) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();

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
  }, [searchTerm, locationFilter, employmentTypeFilter, workModeFilter, experienceLevelFilter, profileId]);

  const loadJobs = async () => {
    try {
      setLoading(true);

      // Use RPC function for optimized search
      const { data, error } = await supabase.rpc('search_public_jobs', {
        p_search_term: searchTerm || null,
        p_location: locationFilter || null,
        p_employment_type: employmentTypeFilter || null,
        p_work_mode: workModeFilter || null,
        p_experience_level: experienceLevelFilter || null,
        p_limit: 100,
        p_offset: 0
      });

      if (error) throw error;

      // Transform data
      const transformedJobs: JobPosting[] = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        slug: job.slug,
        company_id: job.company_id,
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
        company_name: job.company_name,
        company_logo_url: job.company_logo_url
      }));

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

      const finalJobs = transformedJobs.map(job => ({
        ...job,
        is_saved: savedJobIds.has(job.id),
        has_applied: appliedJobIds.has(job.id)
      }));

      setJobs(finalJobs);
      setTotalJobs(finalJobs.length);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error(lang === 'es' ? 'Error al cargar vacantes' : 'Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (jobId: string, jobTitle: string, currentlySaved: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_job_save', {
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
          ? lang === 'es' ? `"${jobTitle}" eliminada de guardados` : `"${jobTitle}" removed`
          : lang === 'es' ? `"${jobTitle}" guardada` : `"${jobTitle}" saved`
      );
    } catch (error: any) {
      console.error('Error toggling save:', error);
      toast.error(lang === 'es' ? 'Error al guardar' : 'Error saving job');
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
    const labels: Record<string, { es: string; en: string }> = {
      FULL_TIME: { es: 'Tiempo Completo', en: 'Full Time' },
      PART_TIME: { es: 'Medio Tiempo', en: 'Part Time' },
      CONTRACT: { es: 'Contrato', en: 'Contract' },
      TEMPORARY: { es: 'Temporal', en: 'Temporary' },
      INTERNSHIP: { es: 'Pasantía', en: 'Internship' },
      FREELANCE: { es: 'Freelance', en: 'Freelance' }
    };
    return labels[type]?.[lang] || type;
  };

  const getWorkModeLabel = (mode: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      REMOTE: { es: 'Remoto', en: 'Remote' },
      ONSITE: { es: 'Presencial', en: 'On-site' },
      HYBRID: { es: 'Híbrido', en: 'Hybrid' }
    };
    return labels[mode]?.[lang] || mode;
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      ENTRY: { es: 'Sin experiencia', en: 'Entry Level' },
      JUNIOR: { es: 'Junior', en: 'Junior' },
      MID: { es: 'Semi-senior', en: 'Mid-level' },
      SENIOR: { es: 'Senior', en: 'Senior' },
      LEAD: { es: 'Lead', en: 'Lead' },
      EXECUTIVE: { es: 'Ejecutivo', en: 'Executive' }
    };
    return labels[level]?.[lang] || level;
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) return `${lang === 'es' ? 'Desde' : 'From'} ${currency} ${min.toLocaleString()}`;
    return `${lang === 'es' ? 'Hasta' : 'Up to'} ${currency} ${max!.toLocaleString()}`;
  };

  const getDaysAgo = (date: string) => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return lang === 'es' ? 'Hoy' : 'Today';
    if (days === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
    return lang === 'es' ? `Hace ${days} días` : `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner
          message={lang === 'es' ? 'Cargando vacantes...' : 'Loading jobs...'}
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-600" />
            <input
              type="text"
              placeholder={lang === 'es' ? 'Título, palabra clave o empresa...' : 'Title, keyword or company...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-bg-primary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 transition-all"
            />
          </div>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-600" />
            <input
              type="text"
              placeholder={lang === 'es' ? 'Ciudad, país o "remoto"...' : 'City, country or "remote"...'}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-bg-primary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-6 py-3 bg-cv-blue text-white rounded-lg font-semibold hover:bg-cv-blue-dark transition-all"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            {lang === 'es' ? 'Filtros' : 'Filters'}
            {(employmentTypeFilter || workModeFilter || experienceLevelFilter) && (
              <span className="ml-2 bg-white text-cv-blue rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                {[employmentTypeFilter, workModeFilter, experienceLevelFilter].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-cv-blue dark:text-cv-blue-light" />
              {lang === 'es' ? 'Filtros Avanzados' : 'Advanced Filters'}
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BriefcaseIcon className="h-4 w-4 inline mr-1" />
                {lang === 'es' ? 'Tipo de Empleo' : 'Employment Type'}
              </label>
              <select
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg-primary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-white transition-all"
              >
                <option value="">{lang === 'es' ? 'Todos' : 'All'}</option>
                <option value="FULL_TIME">{lang === 'es' ? 'Tiempo Completo' : 'Full Time'}</option>
                <option value="PART_TIME">{lang === 'es' ? 'Medio Tiempo' : 'Part Time'}</option>
                <option value="CONTRACT">{lang === 'es' ? 'Contrato' : 'Contract'}</option>
                <option value="TEMPORARY">{lang === 'es' ? 'Temporal' : 'Temporary'}</option>
                <option value="INTERNSHIP">{lang === 'es' ? 'Pasantía' : 'Internship'}</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                {lang === 'es' ? 'Modalidad' : 'Work Mode'}
              </label>
              <select
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg-primary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-white transition-all"
              >
                <option value="">{lang === 'es' ? 'Todas' : 'All'}</option>
                <option value="REMOTE">{lang === 'es' ? 'Remoto' : 'Remote'}</option>
                <option value="ONSITE">{lang === 'es' ? 'Presencial' : 'On-site'}</option>
                <option value="HYBRID">{lang === 'es' ? 'Híbrido' : 'Hybrid'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                {lang === 'es' ? 'Nivel de Experiencia' : 'Experience Level'}
              </label>
              <select
                value={experienceLevelFilter}
                onChange={(e) => setExperienceLevelFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg-primary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:focus:ring-cv-blue-light focus:border-transparent text-gray-900 dark:text-white transition-all"
              >
                <option value="">{lang === 'es' ? 'Todos' : 'All'}</option>
                <option value="ENTRY">{lang === 'es' ? 'Sin experiencia' : 'Entry Level'}</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID">{lang === 'es' ? 'Semi-senior' : 'Mid-level'}</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead</option>
                <option value="EXECUTIVE">{lang === 'es' ? 'Ejecutivo' : 'Executive'}</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-cv-blue dark:hover:text-cv-blue-light font-medium transition-colors"
            >
              {lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4">
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-cv-blue dark:text-cv-blue-light text-lg">
            {totalJobs}
          </span>{' '}
          {lang === 'es'
            ? `vacante${totalJobs !== 1 ? 's' : ''} encontrada${totalJobs !== 1 ? 's' : ''}`
            : `job${totalJobs !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-16 text-center">
          <BriefcaseIcon className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            {lang === 'es' ? 'No se encontraron vacantes' : 'No jobs found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {lang === 'es'
              ? 'Intenta ajustar tus filtros de búsqueda o amplía los criterios'
              : 'Try adjusting your search filters or broaden the criteria'}
          </p>
          <button
            onClick={clearFilters}
            className="px-8 py-3 bg-cv-blue text-white rounded-lg font-semibold hover:bg-cv-blue-dark transition-all"
          >
            {lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg hover:shadow-xl transition-all p-6 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Company Logo */}
                  {job.company_logo_url ? (
                    <img
                      src={job.company_logo_url}
                      alt={job.company_name}
                      className="h-14 w-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-7 w-7 text-gray-400" />
                    </div>
                  )}

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
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
                          ✓ {lang === 'es' ? 'Ya aplicaste' : 'Already applied'}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue dark:text-cv-blue-light">
                        <BriefcaseIcon className="w-3 h-3" />
                        {getEmploymentTypeLabel(job.employment_type)}
                      </span>

                      {job.work_mode && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          {getWorkModeLabel(job.work_mode)}
                        </span>
                      )}

                      {job.is_remote && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <MapPinIcon className="w-3 h-3" />
                          {lang === 'es' ? 'Remoto' : 'Remote'}
                        </span>
                      )}

                      {!job.is_remote && job.location_city && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
                          <MapPinIcon className="w-3 h-3" />
                          {job.location_city}
                        </span>
                      )}

                      {job.experience_level && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                          {getExperienceLevelLabel(job.experience_level)}
                        </span>
                      )}

                      {job.show_salary && formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <CurrencyDollarIcon className="w-3 h-3" />
                          {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-3 h-3" />
                        {getDaysAgo(job.published_at)}
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
                        {lang === 'es' ? 'Ver Detalles' : 'View Details'}
                      </button>
                      {!job.has_applied && (
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
                            ? lang === 'es' ? 'Guardada' : 'Saved'
                            : lang === 'es' ? 'Guardar' : 'Save'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllJobsTab;
