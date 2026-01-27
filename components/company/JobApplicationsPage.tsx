// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface JobApplication {
  id: string;
  created_at: string;
  updated_at: string;
  job_posting_id: string;
  profile_id: string;
  status: string;
  cover_letter: string | null;
  resume_url: string | null;
  answers: any;
  viewed_by_company: boolean;
  viewed_at: string | null;
  internal_notes: string | null;
  rating: number | null;
  match_score: number | null;
  job_posting: {
    id: string;
    title: string;
    slug: string;
    department: string | null;
    employment_type: string;
    location_city: string | null;
    location_country: string | null;
  };
  profile: {
    id: string;
    full_name: string;
    headline: string | null;
    location: string | null;
    email: string | null;
    phone: string | null;
    cv_url: string | null;
    slug: string | null;
    profile_picture_url: string | null;
  };
}

const JobApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    avgMatchScore: 0,
  });

  useEffect(() => {
    loadCompanyAndApplications();
  }, [user, selectedJobId, selectedStatus]);

  const loadCompanyAndApplications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get company ID
      const { data: companyUser, error: companyError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (companyError || !companyUser) {
        toast.error('Empresa no encontrada');
        return;
      }

      setCompanyId(companyUser.company_id);

      // Build query
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job_posting:job_postings(id, title, slug, department, employment_type, location_city, location_country),
          profile:profiles(id, full_name, headline, location, email, phone, cv_url, slug, profile_picture_url)
        `)
        .eq('company_id', companyUser.company_id)
        .order('created_at', { ascending: false });

      // Filter by job posting
      if (selectedJobId) {
        query = query.eq('job_posting_id', selectedJobId);
      }

      // Filter by status
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus.toUpperCase());
      }

      const { data, error } = await query;

      if (error) throw error;

      setApplications(data || []);

      // Calculate stats
      if (data) {
        const total = data.length;
        const newApps = data.filter(app => app.status === 'NEW').length;
        const reviewing = data.filter(app => app.status === 'REVIEWING').length;
        const shortlisted = data.filter(app => app.status === 'SHORTLISTED').length;
        const interview = data.filter(app => app.status === 'INTERVIEW').length;
        const avgMatch = data.reduce((sum, app) => sum + (app.match_score || 0), 0) / (total || 1);

        setStats({
          total,
          new: newApps,
          reviewing,
          shortlisted,
          interview,
          avgMatchScore: Math.round(avgMatch),
        });
      }
    } catch (error: any) {
      toast.error('Error al cargar las aplicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (application: JobApplication) => {
    setSelectedApplication(application);
    setInternalNotes(application.internal_notes || '');
    setRating(application.rating);
    setShowDetailsModal(true);

    // Mark as viewed
    if (!application.viewed_by_company) {
      await supabase
        .from('job_applications')
        .update({
          viewed_by_company: true,
          viewed_at: new Date().toISOString(),
          viewed_by: user?.id,
        })
        .eq('id', application.id);

      // Refresh list
      loadCompanyAndApplications();
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApplication || !companyId || !user) return;

    try {
      setUpdatingStatus(true);

      const { data, error } = await supabase.rpc('update_application_status', {
        p_application_id: selectedApplication.id,
        p_company_id: companyId,
        p_user_id: user.id,
        p_new_status: newStatus,
        p_internal_notes: internalNotes || null,
        p_rating: rating,
      });

      if (error) throw error;

      toast.success('Estado actualizado correctamente');
      setShowDetailsModal(false);
      loadCompanyAndApplications();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      REVIEWING: 'bg-yellow-100 text-yellow-800',
      SHORTLISTED: 'bg-purple-100 text-purple-800',
      INTERVIEW: 'bg-indigo-100 text-indigo-800',
      OFFER: 'bg-green-100 text-green-800',
      HIRED: 'bg-green-600 text-white',
      REJECTED: 'bg-red-100 text-red-800',
      WITHDRAWN: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportToCSV = () => {
    try {
      // Prepare CSV headers
      const headers = [
        'Candidato',
        'Email',
        'Teléfono',
        'Vacante',
        'Departamento',
        'Match Score',
        'Estado',
        'Calificación',
        'Fecha Aplicación',
        'Ubicación',
      ];

      // Prepare CSV rows
      const rows = filteredApplications.map(app => [
        app.profile.full_name || 'N/A',
        app.profile.email || 'N/A',
        app.profile.phone || 'N/A',
        app.job_posting.title,
        app.job_posting.department || 'N/A',
        app.match_score?.toString() || '0',
        app.status,
        app.rating?.toString() || 'Sin calificar',
        new Date(app.created_at).toLocaleDateString('es-ES'),
        app.profile.location || 'N/A',
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `aplicaciones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Aplicaciones exportadas exitosamente');
    } catch (error) {
      toast.error('Error al exportar aplicaciones');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Aplicaciones Recibidas
        </h1>
        <p className="mt-2 text-gray-600">
          Gestiona las aplicaciones de candidatos a tus vacantes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Nuevas</div>
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Revisando</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.reviewing}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Preseleccionadas</div>
          <div className="text-2xl font-bold text-purple-600">{stats.shortlisted}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Entrevista</div>
          <div className="text-2xl font-bold text-indigo-600">{stats.interview}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Match Promedio</div>
          <div className={`text-2xl font-bold ${getMatchScoreColor(stats.avgMatchScore)}`}>
            {stats.avgMatchScore}%
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevas</option>
              <option value="reviewing">Revisando</option>
              <option value="shortlisted">Preseleccionadas</option>
              <option value="interview">Entrevista</option>
              <option value="offer">Oferta</option>
              <option value="hired">Contratado</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            disabled={filteredApplications.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Exportar a CSV
          </button>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay aplicaciones
          </h3>
          <p className="text-gray-600">
            Aún no has recibido aplicaciones para tus vacantes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vacante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-gray-50 ${!app.viewed_by_company ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {app.profile.profile_picture_url ? (
                          <img
                            src={app.profile.profile_picture_url}
                            alt={app.profile.full_name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {app.profile.full_name}
                            {!app.viewed_by_company && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                                Nueva
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {app.profile.headline || app.profile.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{app.job_posting.title}</div>
                      <div className="text-sm text-gray-500">
                        {app.job_posting.department && `${app.job_posting.department} • `}
                        {app.job_posting.location_city || 'Remoto'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className={`text-sm font-semibold ${getMatchScoreColor(app.match_score || 0)}`}>
                          {app.match_score || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.rating ? (
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`h-4 w-4 ${i < app.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewApplication(app)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApplication.profile.full_name}
                  </h2>
                  <p className="text-gray-600">{selectedApplication.profile.headline}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {selectedApplication.profile.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {selectedApplication.profile.location}
                      </div>
                    )}
                    {selectedApplication.profile.email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        {selectedApplication.profile.email}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Match Score */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Puntuación de Match</span>
                  <span className={`text-2xl font-bold ${getMatchScoreColor(selectedApplication.match_score || 0)}`}>
                    {selectedApplication.match_score || 0}%
                  </span>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Carta de Presentación</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* Rating */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Calificación</h3>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      {rating && star <= rating ? (
                        <StarIconSolid className="h-8 w-8 text-yellow-400" />
                      ) : (
                        <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                      )}
                    </button>
                  ))}
                  {rating && (
                    <button
                      onClick={() => setRating(null)}
                      className="ml-4 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notas Internas</h3>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agrega notas sobre este candidato..."
                />
              </div>

              {/* Status Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Estado</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleUpdateStatus('REVIEWING')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
                  >
                    Revisando
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('SHORTLISTED')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 disabled:opacity-50"
                  >
                    Preseleccionar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('INTERVIEW')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 disabled:opacity-50"
                  >
                    Entrevista
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('OFFER')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    Oferta
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('HIRED')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Contratado
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="space-x-3">
                  {selectedApplication.profile.slug && (
                    <button
                      onClick={() => navigate(`/company/profile/${selectedApplication.profile_id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Ver Perfil Completo
                    </button>
                  )}
                  {selectedApplication.profile.cv_url && (
                    <a
                      href={selectedApplication.profile.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Descargar CV
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicationsPage;
