import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  FunnelIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface JobApplication {
  id: string;
  job_posting_id: string;
  user_id: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string;
  company_name?: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
}

type FilterStatus = 'all' | 'pending' | 'reviewing' | 'accepted' | 'rejected';

const JobApplicationsManagement: React.FC = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const translations = {
    en: {
      title: 'Job Applications Management',
      subtitle: 'Manage all job applications from users',
      search: 'Search applications...',
      filterBy: 'Filter by status',
      all: 'All',
      pending: 'Pending',
      reviewing: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
      totalApplications: 'Total Applications',
      pendingApplications: 'Pending',
      reviewingApplications: 'Under Review',
      acceptedApplications: 'Accepted',
      applicant: 'Applicant',
      jobTitle: 'Job Title',
      company: 'Company',
      status: 'Status',
      appliedOn: 'Applied on',
      actions: 'Actions',
      viewDetails: 'View Details',
      approve: 'Approve',
      reject: 'Reject',
      markReviewing: 'Mark as Reviewing',
      loading: 'Loading applications...',
      noResults: 'No applications found',
      applicationDetails: 'Application Details',
      coverLetter: 'Cover Letter',
      noCoverLetter: 'No cover letter provided',
      close: 'Close',
      confirmApprove: 'Are you sure you want to approve this application?',
      confirmReject: 'Are you sure you want to reject this application?',
      success: 'Operation completed successfully',
      error: 'Error performing operation',
      contactInfo: 'Contact Information',
      email: 'Email',
      phone: 'Phone'
    },
    es: {
      title: 'Gestión de Solicitudes de Empleo',
      subtitle: 'Administra todas las solicitudes de empleo de usuarios',
      search: 'Buscar solicitudes...',
      filterBy: 'Filtrar por estado',
      all: 'Todas',
      pending: 'Pendientes',
      reviewing: 'En Revisión',
      accepted: 'Aceptadas',
      rejected: 'Rechazadas',
      totalApplications: 'Total Solicitudes',
      pendingApplications: 'Pendientes',
      reviewingApplications: 'En Revisión',
      acceptedApplications: 'Aceptadas',
      applicant: 'Solicitante',
      jobTitle: 'Vacante',
      company: 'Empresa',
      status: 'Estado',
      appliedOn: 'Solicitó',
      actions: 'Acciones',
      viewDetails: 'Ver Detalles',
      approve: 'Aprobar',
      reject: 'Rechazar',
      markReviewing: 'Marcar en Revisión',
      loading: 'Cargando solicitudes...',
      noResults: 'No se encontraron solicitudes',
      applicationDetails: 'Detalles de la Solicitud',
      coverLetter: 'Carta de Presentación',
      noCoverLetter: 'No se proporcionó carta de presentación',
      close: 'Cerrar',
      confirmApprove: '¿Estás seguro de que quieres aprobar esta solicitud?',
      confirmReject: '¿Estás seguro de que quieres rechazar esta solicitud?',
      success: 'Operación completada exitosamente',
      error: 'Error al realizar la operación',
      contactInfo: 'Información de Contacto',
      email: 'Correo',
      phone: 'Teléfono'
    }
  };

  const t = translations[lang];

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchQuery, filterStatus, applications]);

  const loadApplications = async () => {
    try {
      setLoading(true);

      // Load job applications with related data
      const { data: apps, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (
            title,
            companies (
              company_name
            )
          ),
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format data
      const formattedApps = apps?.map(app => ({
        ...app,
        job_title: app.job_postings?.title || 'Unknown Job',
        company_name: app.job_postings?.companies?.company_name || 'Unknown Company',
        applicant_name: app.profiles?.full_name || 'Unknown User',
        applicant_email: app.profiles?.email || '',
        applicant_phone: app.profiles?.phone || ''
      })) || [];

      setApplications(formattedApps);
      setFilteredApplications(formattedApps);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.applicant_name?.toLowerCase().includes(query) ||
        app.job_title?.toLowerCase().includes(query) ||
        app.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: 'reviewing' | 'accepted' | 'rejected') => {
    const confirmMessage = newStatus === 'accepted' ? t.confirmApprove : newStatus === 'rejected' ? t.confirmReject : null;

    if (confirmMessage && !confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;

      await loadApplications();
      setShowDetailModal(false);
      alert(t.success);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert(t.error);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'reviewing':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-cv-blue dark:text-blue-400 mx-auto mb-4 animate-pulse" />
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
              <DocumentTextIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.totalApplications}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.pendingApplications}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.reviewingApplications}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.reviewing}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.acceptedApplications}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.accepted}</p>
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
              <option value="pending">{t.pending}</option>
              <option value="reviewing">{t.reviewing}</option>
              <option value="accepted">{t.accepted}</option>
              <option value="rejected">{t.rejected}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-dark-text-secondary">{t.noResults}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.applicant}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.jobTitle}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.company}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.appliedOn}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                            {application.applicant_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                            {application.applicant_email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                          {application.job_title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-dark-text-primary">
                          {application.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {t[application.status as keyof typeof t] || application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
                        {new Date(application.created_at).toLocaleDateString(lang)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t.viewDetails}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {application.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(application.id, 'reviewing')}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title={t.markReviewing}
                          >
                            <DocumentTextIcon className="h-5 w-5" />
                          </button>
                        )}
                        {(application.status === 'pending' || application.status === 'reviewing') && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(application.id, 'accepted')}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title={t.approve}
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(application.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title={t.reject}
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </>
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
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {t.applicationDetails}
                  </h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
                    {selectedApplication.job_title} - {selectedApplication.company_name}
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
              {/* Applicant Info */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                  {t.applicant}
                </h4>
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-dark-text-primary">
                      {selectedApplication.applicant_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <a
                      href={`mailto:${selectedApplication.applicant_email}`}
                      className="text-cv-blue hover:underline"
                    >
                      {selectedApplication.applicant_email}
                    </a>
                  </div>
                  {selectedApplication.applicant_phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <a
                        href={`tel:${selectedApplication.applicant_phone}`}
                        className="text-cv-blue hover:underline"
                      >
                        {selectedApplication.applicant_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                  {t.status}
                </h4>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                  {getStatusIcon(selectedApplication.status)}
                  {t[selectedApplication.status as keyof typeof t]}
                </span>
              </div>

              {/* Cover Letter */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                  {t.coverLetter}
                </h4>
                {selectedApplication.cover_letter ? (
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                    <p className="text-gray-700 dark:text-dark-text-secondary whitespace-pre-wrap">
                      {selectedApplication.cover_letter}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-dark-text-secondary italic">
                    {t.noCoverLetter}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {(selectedApplication.status === 'pending' || selectedApplication.status === 'reviewing') && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedApplication.id, 'accepted')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      {t.approve}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      {t.reject}
                    </button>
                  </>
                )}
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

export default JobApplicationsManagement;
