import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentCheckIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useJobApplications, JobApplicationStatus } from '../../../hooks/useJobApplications';
import ApplicationTimeline from '../../jobs/ApplicationTimeline';
import { useLanguage } from '../../../contexts/LanguageContext';
import LoadingSpinner from '../../shared/LoadingSpinner';

interface MyApplicationsTabProps {
  profileId: string;
  statusFilter?: JobApplicationStatus | JobApplicationStatus[]; // External status filter from parent (single or array)
}

/**
 * My Applications Tab - Track job application status
 *
 * Features:
 * - Visual timeline for each application
 * - Filter by status (can be controlled externally)
 * - Quick actions (view job, message company)
 * - Statistics overview
 */
const MyApplicationsTab: React.FC<MyApplicationsTabProps> = ({ profileId, statusFilter: externalStatusFilter }) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  // Use external filter if provided, otherwise allow internal filtering
  const { applications, loading, error, activeCount } = useJobApplications(profileId, {
    includeJobDetails: true,
    statusFilter: externalStatusFilter
      ? Array.isArray(externalStatusFilter)
        ? externalStatusFilter
        : [externalStatusFilter]
      : undefined
  });

  // No need for internal filtering if using hook's statusFilter
  const filteredApplications = applications;

  // Calculate statistics (from unfiltered data if possible)
  // Note: These stats might be partial if external filter is applied
  const stats = {
    total: applications.length,
    active: activeCount,
    interviewing: applications.filter(app => app.status === 'INTERVIEW').length,
    offers: applications.filter(app => app.status === 'OFFER').length,
    hired: applications.filter(app => app.status === 'HIRED').length,
    rejected: applications.filter(app => app.status === 'REJECTED').length
  };

  // Status labels for display
  const statusLabels: Record<JobApplicationStatus, { es: string; en: string }> = {
    NEW: { es: 'Nueva', en: 'New' },
    REVIEWING: { es: 'En Revisión', en: 'Under Review' },
    SHORTLISTED: { es: 'Preseleccionado', en: 'Shortlisted' },
    INTERVIEW: { es: 'Entrevista', en: 'Interview' },
    OFFER: { es: 'Oferta', en: 'Offer' },
    HIRED: { es: 'Contratado', en: 'Hired' },
    REJECTED: { es: 'Rechazada', en: 'Rejected' },
    WITHDRAWN: { es: 'Retirada', en: 'Withdrawn' }
  };

  const getStatusBadgeColor = (status: JobApplicationStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'REVIEWING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'SHORTLISTED':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'INTERVIEW':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
      case 'OFFER':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'HIRED':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'WITHDRAWN':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner
          message={lang === 'es' ? 'Cargando tus aplicaciones...' : 'Loading your applications...'}
          size="large"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-700 dark:text-red-400">
          {lang === 'es' ? 'Error al cargar aplicaciones: ' : 'Error loading applications: '}
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label={lang === 'es' ? 'Total' : 'Total'}
          value={stats.total}
          color="blue"
        />
        <StatCard
          label={lang === 'es' ? 'Activas' : 'Active'}
          value={stats.active}
          color="yellow"
        />
        <StatCard
          label={lang === 'es' ? 'Entrevistas' : 'Interviews'}
          value={stats.interviewing}
          color="indigo"
        />
        <StatCard
          label={lang === 'es' ? 'Ofertas' : 'Offers'}
          value={stats.offers}
          color="green"
        />
        <StatCard
          label={lang === 'es' ? 'Aceptado' : 'Accepted'}
          value={stats.hired}
          color="emerald"
        />
        <StatCard
          label={lang === 'es' ? 'Rechazadas' : 'Rejected'}
          value={stats.rejected}
          color="red"
        />
      </div>

      {/* Filter is now in parent component MyApplicationsSection */}

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-12 text-center">
          <DocumentCheckIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {lang === 'es' ? 'No hay aplicaciones' : 'No applications'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {externalStatusFilter
              ? lang === 'es'
                ? 'No hay aplicaciones con este estado'
                : 'No applications with this status'
              : lang === 'es'
                ? 'Aún no has aplicado a ninguna vacante'
                : 'You haven\'t applied to any jobs yet'}
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-opportunities-tab', { detail: { tab: 'all' } }))}
            className="px-6 py-3 bg-cv-blue text-white rounded-lg font-medium hover:bg-cv-blue-dark transition-colors"
          >
            {lang === 'es' ? 'Explorar Ofertas' : 'Explore Jobs'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg hover:shadow-xl transition-all p-6"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Job Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {/* Company Logo */}
                      {application.job_posting?.company?.logo_url ? (
                        <img
                          src={application.job_posting.company.logo_url}
                          alt={application.job_posting.company.company_name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <DocumentCheckIcon className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}

                      {/* Job Title & Company */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {application.job_posting?.title || 'Job Title'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {application.job_posting?.company?.company_name || 'Company Name'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(application.status)}`}>
                            {statusLabels[application.status]?.[lang] || application.status}
                          </span>
                          {application.viewed_by_company && (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <EyeIcon className="w-3.5 h-3.5" />
                              {lang === 'es' ? 'Vista por empresa' : 'Viewed by company'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {lang === 'es' ? 'Aplicado hace' : 'Applied'}{' '}
                      {Math.floor((new Date().getTime() - new Date(application.created_at).getTime()) / (1000 * 60 * 60 * 24))}{' '}
                      {lang === 'es' ? 'días' : 'days ago'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/jobs/${application.job_posting?.slug}`)}
                      className="px-4 py-2 bg-cv-blue text-white rounded-lg font-medium hover:bg-cv-blue-dark transition-colors text-sm"
                    >
                      {lang === 'es' ? 'Ver Vacante' : 'View Job'}
                    </button>
                    <button
                      onClick={() => {/* TODO: Open messaging */}}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      {lang === 'es' ? 'Mensaje' : 'Message'}
                    </button>
                  </div>
                </div>

                {/* Right: Timeline */}
                <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6">
                  <ApplicationTimeline
                    currentStatus={application.status}
                    createdAt={application.created_at}
                    updatedAt={application.updated_at}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper Component: Stat Card
interface StatCardProps {
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'indigo' | 'green' | 'emerald' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-white',
    yellow: 'from-yellow-500 to-amber-600 text-white',
    indigo: 'from-indigo-500 to-indigo-600 text-white',
    green: 'from-green-500 to-green-600 text-white',
    emerald: 'from-emerald-500 to-emerald-600 text-white',
    red: 'from-red-500 to-red-600 text-white'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-lg p-4`}>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

export default MyApplicationsTab;
