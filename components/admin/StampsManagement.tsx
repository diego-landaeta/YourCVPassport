import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { Stamp, StampType, StampStatus } from '../../types';
import {
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import Toast from '../common/Toast';

const StampsManagement: React.FC = () => {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StampStatus | 'ALL'>('PENDING');
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    expired: 0
  });

  useEffect(() => {
    loadStamps();
  }, [filter]);

  const loadStamps = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('stamps')
        .select(`
          *,
          profiles:profile_id(id, full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setStamps(data || []);

      // Calculate stats
      const { data: allStamps } = await supabase
        .from('stamps')
        .select('status');

      if (allStamps) {
        setStats({
          total: allStamps.length,
          pending: allStamps.filter(s => s.status === 'PENDING').length,
          verified: allStamps.filter(s => s.status === 'VERIFIED').length,
          rejected: allStamps.filter(s => s.status === 'REJECTED').length,
          expired: allStamps.filter(s => s.status === 'EXPIRED').length
        });
      }

    } catch (error) {
      console.error('Error loading stamps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStampIcon = (type: StampType) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'EMAIL': return <EnvelopeIcon className={iconClass} />;
      case 'PHONE': return <PhoneIcon className={iconClass} />;
      case 'IDENTITY': return <IdentificationIcon className={iconClass} />;
      case 'EDUCATION': return <AcademicCapIcon className={iconClass} />;
      case 'CERTIFICATION': return <DocumentTextIcon className={iconClass} />;
      case 'EMPLOYMENT': return <BriefcaseIcon className={iconClass} />;
      case 'SKILL': return <CodeBracketIcon className={iconClass} />;
    }
  };

  const getStampTypeName = (type: StampType): string => {
    const names: Record<StampType, string> = {
      'EMAIL': 'Email',
      'PHONE': 'Teléfono',
      'IDENTITY': 'Identidad',
      'EDUCATION': 'Educación',
      'CERTIFICATION': 'Certificación',
      'EMPLOYMENT': 'Empleo',
      'SKILL': 'Habilidad'
    };
    return names[type];
  };

  const getStatusBadge = (status: StampStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
            <CheckCircleIcon className="w-4 h-4" />
            Verificado
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
            <ClockIcon className="w-4 h-4" />
            Pendiente
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
            <XCircleIcon className="w-4 h-4" />
            Rechazado
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
            <ClockIcon className="w-4 h-4" />
            Expirado
          </span>
        );
    }
  };

  const getDocumentSignedUrl = async (documentPath: string): Promise<string> => {
    // Si la URL es externa (como Unsplash para datos de prueba), devolverla directamente
    if (documentPath.startsWith('http://') || documentPath.startsWith('https://')) {
      return documentPath;
    }

    // Si es una ruta de Supabase Storage, obtener URL firmada
    try {
      console.log('Getting signed URL for path:', documentPath);

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(documentPath, 3600); // URL válida por 1 hora

      if (error) {
        console.error('Error getting signed URL:', error);
        console.error('Error details:', JSON.stringify(error));
        return ''; // Return empty string to show error state
      }

      console.log('Signed URL generated successfully:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error processing document URL:', error);
      return '';
    }
  };

  const viewDocument = async (stamp: Stamp) => {
    const evidence = stamp.evidence as any;
    if (!evidence.document_url) {
      error('Este stamp no tiene documento adjunto');
      return;
    }

    setSelectedStamp(stamp);
    setShowDocumentModal(true);
    setLoadingDocument(true);

    // Obtener URL firmada para el documento
    const signedUrl = await getDocumentSignedUrl(evidence.document_url);
    setDocumentUrl(signedUrl);
    setLoadingDocument(false);
  };

  const approveStamp = async (stampId: string) => {
    if (!actionNotes) {
      error('Por favor añade una nota para el registro');
      return;
    }

    setProcessing(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario actual');
      }

      console.log('Approving stamp:', stampId, 'by admin:', user.id);

      const { data, error: rpcError } = await supabase.rpc('verify_stamp', {
        stamp_id: stampId,
        admin_id: user.id,
        notes: actionNotes
      });

      if (rpcError) {
        console.error('RPC Error details:', rpcError);
        throw rpcError;
      }

      console.log('Stamp approved successfully:', data);
      success('Stamp verificado exitosamente');
      setShowDocumentModal(false);
      setSelectedStamp(null);
      setActionNotes('');
      setDocumentUrl(null);
      loadStamps();

    } catch (err: any) {
      console.error('Error approving stamp:', err);
      console.error('Error stack:', err.stack);
      error('Error al aprobar: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessing(false);
    }
  };

  const rejectStamp = async (stampId: string) => {
    if (!actionNotes) {
      error('Por favor añade un motivo de rechazo');
      return;
    }

    setProcessing(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario actual');
      }

      console.log('Rejecting stamp:', stampId, 'by admin:', user.id);

      const { data, error: rpcError } = await supabase.rpc('reject_stamp', {
        stamp_id: stampId,
        admin_id: user.id,
        reason: actionNotes
      });

      if (rpcError) {
        console.error('RPC Error details:', rpcError);
        throw rpcError;
      }

      console.log('Stamp rejected successfully:', data);
      success('Stamp rechazado exitosamente');
      setShowDocumentModal(false);
      setSelectedStamp(null);
      setActionNotes('');
      setDocumentUrl(null);
      loadStamps();

    } catch (err: any) {
      console.error('Error rejecting stamp:', err);
      console.error('Error stack:', err.stack);
      error('Error al rechazar: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Verificados</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.verified}</div>
        </div>
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Rechazados</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.rejected}</div>
        </div>
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Expirados</div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">{stats.expired}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por estado:</span>
          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'ALL' ? 'Todos' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stamps List */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow overflow-hidden">
        {stamps.length === 0 ? (
          <div className="text-center py-12">
            <CheckBadgeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay stamps {filter !== 'ALL' && `con estado ${filter.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Solicitado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-gray-700">
                {stamps.map((stamp) => (
                  <tr key={stamp.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={(stamp.profiles as any)?.avatar_url || `https://ui-avatars.com/api/?name=${(stamp.profiles as any)?.full_name}`}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {(stamp.profiles as any)?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {(stamp.profiles as any)?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStampIcon(stamp.type)}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getStampTypeName(stamp.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(stamp.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(stamp.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {stamp.provider || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewDocument(stamp)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Modal */}
      {showDocumentModal && selectedStamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Verificación de {getStampTypeName(selectedStamp.type)}
                  </h2>
                  <p className="text-blue-100">
                    Solicitado por: {(selectedStamp.profiles as any)?.full_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedStamp(null);
                    setActionNotes('');
                    setDocumentUrl(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stamp Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                  <div className="mt-1">{getStatusBadge(selectedStamp.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Solicitud</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedStamp.created_at)}</p>
                </div>
              </div>

              {/* Evidence Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Proporcionada</h3>
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 space-y-3">
                  {Object.entries(selectedStamp.evidence as any).map(([key, value]) => {
                    if (key === 'document_url' || key === 'verification_code' || key === 'expires_at' || key === 'attempts') return null;
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document Preview */}
              {(selectedStamp.evidence as any).document_url && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documento Adjunto</h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {loadingDocument ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Cargando documento...</p>
                      </div>
                    ) : documentUrl ? (
                      (selectedStamp.evidence as any).file_type?.startsWith('image/') ? (
                        <img
                          src={documentUrl}
                          alt="Document"
                          className="w-full"
                          onError={(e) => {
                            console.error('Error loading image from URL:', documentUrl);
                          }}
                        />
                      ) : (
                        <div className="p-8 text-center">
                          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {(selectedStamp.evidence as any).file_name || 'Documento PDF'}
                          </p>
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          >
                            <EyeIcon className="w-5 h-5" />
                            Abrir Documento
                          </a>
                        </div>
                      )
                    ) : (
                      <div className="p-8 text-center">
                        <XCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Error al cargar el documento. Revisa la consola para más detalles.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedStamp.status === 'PENDING' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas del Administrador
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Añade notas sobre la verificación..."
                  />
                </div>
              )}

              {selectedStamp.admin_notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Notas Previas</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-400">{selectedStamp.admin_notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedStamp.status === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => rejectStamp(selectedStamp.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-5 h-5" />
                        Rechazar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => approveStamp(selectedStamp.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Aprobar
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default StampsManagement;
