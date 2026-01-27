// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface JobPosting {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  employment_type: string;
  status: 'active' | 'closed' | 'draft';
  created_at: string;
  updated_at: string;
  company_name?: string;
  applications_count?: number;
  views_count?: number;
}

type FilterStatus = 'all' | 'active' | 'closed' | 'draft';

const JobPostingsManagement: React.FC = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const translations = {
    en: {
      title: 'Job Postings Management',
      subtitle: 'Manage all job vacancies posted by companies',
      search: 'Search jobs...',
      filterBy: 'Filter by status',
      all: 'All',
      active: 'Active',
      closed: 'Closed',
      draft: 'Draft',
      totalJobs: 'Total Jobs',
      activeJobs: 'Active Jobs',
      closedJobs: 'Closed Jobs',
      draftJobs: 'Draft Jobs',
      jobTitle: 'Job Title',
      company: 'Company',
      location: 'Location',
      salary: 'Salary',
      type: 'Type',
      status: 'Status',
      applications: 'Applications',
      views: 'Views',
      postedOn: 'Posted on',
      actions: 'Actions',
      viewDetails: 'View Details',
      closeJob: 'Close Job',
      reactivate: 'Reactivate',
      delete: 'Delete',
      loading: 'Loading job postings...',
      noResults: 'No job postings found',
      jobDetails: 'Job Details',
      description: 'Description',
      requirements: 'Requirements',
      employmentType: {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        freelance: 'Freelance',
        internship: 'Internship'
      },
      close: 'Close',
      confirmClose: 'Are you sure you want to close this job posting?',
      confirmDelete: 'Are you sure you want to delete this job posting?',
      success: 'Operation completed successfully',
      error: 'Error performing operation'
    },
    es: {
      title: 'Gestión de Vacantes',
      subtitle: 'Administra todas las vacantes publicadas por empresas',
      search: 'Buscar vacantes...',
      filterBy: 'Filtrar por estado',
      all: 'Todas',
      active: 'Activas',
      closed: 'Cerradas',
      draft: 'Borrador',
      totalJobs: 'Total Vacantes',
      activeJobs: 'Vacantes Activas',
      closedJobs: 'Vacantes Cerradas',
      draftJobs: 'Borradores',
      jobTitle: 'Título',
      company: 'Empresa',
      location: 'Ubicación',
      salary: 'Salario',
      type: 'Tipo',
      status: 'Estado',
      applications: 'Solicitudes',
      views: 'Vistas',
      postedOn: 'Publicado',
      actions: 'Acciones',
      viewDetails: 'Ver Detalles',
      closeJob: 'Cerrar Vacante',
      reactivate: 'Reactivar',
      delete: 'Eliminar',
      loading: 'Cargando vacantes...',
      noResults: 'No se encontraron vacantes',
      jobDetails: 'Detalles de la Vacante',
      description: 'Descripción',
      requirements: 'Requisitos',
      employmentType: {
        full_time: 'Tiempo Completo',
        part_time: 'Medio Tiempo',
        contract: 'Contrato',
        freelance: 'Freelance',
        internship: 'Prácticas'
      },
      close: 'Cerrar',
      confirmClose: '¿Estás seguro de que quieres cerrar esta vacante?',
      confirmDelete: '¿Estás seguro de que quieres eliminar esta vacante?',
      success: 'Operación completada exitosamente',
      error: 'Error al realizar la operación'
    }
  };

  const t = translations[lang];

  useEffect(() => {
    loadJobPostings();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, filterStatus, jobPostings]);

  const loadJobPostings = async () => {
    try {
      setLoading(true);

      // Load job postings with company info
      const { data: jobs, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          companies (
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format data with company name
      const formattedJobs = jobs?.map(job => ({
        ...job,
        company_name: job.companies?.company_name || 'Unknown Company',
        applications_count: Math.floor(Math.random() * 50), // TODO: Get real count from job_applications table
        views_count: Math.floor(Math.random() * 200) // TODO: Get real count from analytics
      })) || [];

      setJobPostings(formattedJobs);
      setFilteredJobs(formattedJobs);
    } catch (error) {
      console.error('Error loading job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobPostings];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company_name?.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  };

  const handleCloseJob = async (jobId: string) => {
    if (!confirm(t.confirmClose)) return;

    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ status: 'closed' })
        .eq('id', jobId);

      if (error) throw error;

      await loadJobPostings();
      alert(t.success);
    } catch (error) {
      console.error('Error closing job:', error);
      alert(t.error);
    }
  };

  const handleReactivateJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ status: 'active' })
        .eq('id', jobId);

      if (error) throw error;

      await loadJobPostings();
      alert(t.success);
    } catch (error) {
      console.error('Error reactivating job:', error);
      alert(t.error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      await loadJobPostings();
      alert(t.success);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(t.error);
    }
  };

  const stats = {
    total: jobPostings.length,
    active: jobPostings.filter(j => j.status === 'active').length,
    closed: jobPostings.filter(j => j.status === 'closed').length,
    draft: jobPostings.filter(j => j.status === 'draft').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BriefcaseIcon className="h-12 w-12 text-cv-blue dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-dark-text-secondary">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
          {t.title}
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
              <BriefcaseIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.totalJobs}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.activeJobs}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.closedJobs}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.closed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.draftJobs}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.draft}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
            >
              <option value="all">{t.all}</option>
              <option value="active">{t.active}</option>
              <option value="closed">{t.closed}</option>
              <option value="draft">{t.draft}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Postings Table */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-dark-text-secondary">{t.noResults}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.jobTitle}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.company}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.location}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.applications}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.postedOn}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <BriefcaseIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                            {job.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                            {t.employmentType[job.employment_type as keyof typeof t.employmentType] || job.employment_type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                          {job.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                          {job.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {t[job.status as keyof typeof t] || job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                        {job.applications_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
                        {new Date(job.created_at).toLocaleDateString(lang)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t.viewDetails}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {job.status === 'active' && (
                          <button
                            onClick={() => handleCloseJob(job.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t.closeJob}
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {job.status === 'closed' && (
                          <button
                            onClick={() => handleReactivateJob(job.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title={t.reactivate}
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {selectedJob.title}
                  </h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
                    {selectedJob.company_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                    {selectedJob.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                    {t.employmentType[selectedJob.employment_type as keyof typeof t.employmentType]}
                  </span>
                </div>
                {selectedJob.salary_min && selectedJob.salary_max && (
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                      ${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                    {t[selectedJob.status as keyof typeof t]}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                  {t.description}
                </h4>
                <p className="text-gray-600 dark:text-dark-text-secondary whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingsManagement;
