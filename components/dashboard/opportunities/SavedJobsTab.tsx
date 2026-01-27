import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase/client';
import {
  BookmarkIcon as BookmarkIconSolid,
  TrashIcon,
  BriefcaseIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/solid';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../contexts/LanguageContext';
import LoadingSpinner from '../../LoadingSpinner';
import toast from 'react-hot-toast';

interface SavedJob {
  saved_id: string;
  saved_at: string;
  notes: string | null;
  job_id: string;
  job_title: string;
  job_slug: string;
  company_name: string;
  company_logo_url: string | null;
  location_city: string | null;
  location_country: string | null;
  is_remote: boolean;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
}

interface SavedJobsTabProps {
  profileId: string;
}

const SavedJobsTab: React.FC<SavedJobsTabProps> = ({ profileId }) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedJobs();
  }, [profileId]);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_saved_jobs', {
        p_profile_id: profileId,
        p_limit: 100,
        p_offset: 0
      });

      if (error) throw error;
      setSavedJobs(data || []);
    } catch (error: any) {
      console.error('Error loading saved jobs:', error);
      toast.error(lang === 'es' ? 'Error al cargar ofertas guardadas' : 'Error loading saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const unsaveJob = async (savedId: string, jobTitle: string) => {
    try {
      const { error } = await supabase
        .from('saved_job_postings')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setSavedJobs(prev => prev.filter(job => job.saved_id !== savedId));
      toast.success(
        lang === 'es' ? `"${jobTitle}" eliminada de guardados` : `"${jobTitle}" removed from saved`
      );
    } catch (error: any) {
      console.error('Error unsaving job:', error);
      toast.error(lang === 'es' ? 'Error al quitar guardado' : 'Error removing saved job');
    }
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency || '$';
    if (min && max) return `${curr}${min.toLocaleString()} - ${curr}${max.toLocaleString()}`;
    if (min) return `${lang === 'es' ? 'Desde' : 'From'} ${curr}${min.toLocaleString()}`;
    return `${lang === 'es' ? 'Hasta' : 'Up to'} ${curr}${max!.toLocaleString()}`;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner
          message={lang === 'es' ? 'Cargando ofertas guardadas...' : 'Loading saved jobs...'}
          size="large"
        />
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-12 text-center">
        <BookmarkIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {lang === 'es' ? 'No tienes ofertas guardadas' : 'No saved jobs'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {lang === 'es'
            ? 'Guarda ofertas interesantes para revisarlas más tarde'
            : 'Save interesting jobs to review them later'}
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('change-opportunities-tab', { detail: { tab: 'all' } }))}
          className="px-6 py-3 bg-cv-blue text-white rounded-lg font-medium hover:bg-cv-blue-dark transition-colors"
        >
          {lang === 'es' ? 'Explorar Ofertas' : 'Explore Jobs'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4 mb-4">
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-cv-blue dark:text-cv-blue-light text-lg">
            {savedJobs.length}
          </span>{' '}
          {lang === 'es' ? 'ofertas guardadas' : 'saved jobs'}
        </p>
      </div>

      {savedJobs.map((job) => (
        <div
          key={job.saved_id}
          className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg hover:shadow-xl transition-all p-6 group"
        >
          <div className="flex items-start gap-4">
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
                onClick={() => navigate(`/jobs/${job.job_slug}`)}
                className="text-lg font-bold text-gray-900 dark:text-white mb-1 hover:text-cv-blue dark:hover:text-cv-blue-light cursor-pointer transition-colors"
              >
                {job.job_title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{job.company_name}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue dark:text-cv-blue-light">
                  <BriefcaseIcon className="w-3 h-3" />
                  {getEmploymentTypeLabel(job.employment_type)}
                </span>

                {job.is_remote ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <MapPinIcon className="w-3 h-3" />
                    {lang === 'es' ? 'Remoto' : 'Remote'}
                  </span>
                ) : job.location_city && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
                    <MapPinIcon className="w-3 h-3" />
                    {job.location_city}, {job.location_country}
                  </span>
                )}

                {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <CurrencyDollarIcon className="w-3 h-3" />
                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/jobs/${job.job_slug}`)}
                  className="px-4 py-2 bg-cv-blue text-white rounded-lg font-medium hover:bg-cv-blue-dark transition-colors text-sm"
                >
                  {lang === 'es' ? 'Ver Detalles' : 'View Details'}
                </button>
                <button
                  onClick={() => unsaveJob(job.saved_id, job.job_title)}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  {lang === 'es' ? 'Quitar' : 'Remove'}
                </button>
              </div>
            </div>

            {/* Saved Badge */}
            <div className="flex-shrink-0">
              <BookmarkIconSolid className="w-6 h-6 text-cv-blue dark:text-cv-blue-light" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedJobsTab;
