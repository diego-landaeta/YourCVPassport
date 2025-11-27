import React, { useState, useEffect, useRef } from 'react';
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
  FunnelIcon,
  MagnifyingGlassPlusIcon,
  ShieldCheckIcon
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
  const [showLightbox, setShowLightbox] = useState(false);
  
  // Magnifier state
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [isZoomEnabled, setIsZoomEnabled] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const { toasts, removeToast, success, error } = useToast();

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isZoomEnabled) return;
    const elem = e.currentTarget;
    const { width, height } = elem.getBoundingClientRect();
    setImgSize({ width, height });
    setShowMagnifier(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomEnabled) return;
    const elem = e.currentTarget;
    const { top, left } = elem.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    setMagnifierPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

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

      // Filter out PENDING EMAIL and PHONE stamps (they should only show when VERIFIED)
      const filteredData = (data || []).filter(stamp => {
        if ((stamp.type === 'EMAIL' || stamp.type === 'PHONE') && stamp.status === 'PENDING') {
          return false;
        }
        return true;
      });

      setStamps(filteredData);

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

    } catch (error) {} finally {
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
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(documentPath, 3600); // URL válida por 1 hora

      if (error) {
        return ''; // Return empty string to show error state
      }
      return data.signedUrl;
    } catch (error) {
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

      const { data, error: rpcError } = await supabase.rpc('verify_stamp', {
        stamp_id: stampId,
        admin_id: user.id,
        notes: actionNotes
      });

      if (rpcError) {
        throw rpcError;
      }

      success('Stamp verificado exitosamente');
      setShowDocumentModal(false);
      setSelectedStamp(null);
      setActionNotes('');
      setDocumentUrl(null);
      loadStamps();

    } catch (err: any) {
      error('Error al aprobar: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessing(false);
    }
  };

  const rejectStamp = async (stampId: string, reason?: string) => {
    const rejectionReason = reason || actionNotes;

    if (!rejectionReason) {
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

      const { data, error: rpcError } = await supabase.rpc('reject_stamp', {
        stamp_id: stampId,
        admin_id: user.id,
        reason: rejectionReason
      });

      if (rpcError) {
        throw rpcError;
      }

      success('Stamp rechazado exitosamente');
      setShowDocumentModal(false);
      setSelectedStamp(null);
      setActionNotes('');
      setDocumentUrl(null);
      loadStamps();

    } catch (err: any) {
      error('Error al rechazar: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickReject = async (stamp: Stamp) => {
    const reason = prompt('Por favor, ingresa el motivo del rechazo:');

    if (reason === null) {
      return; // User cancelled
    }

    if (!reason.trim()) {
      error('Debes proporcionar un motivo para rechazar');
      return;
    }

    await rejectStamp(stamp.id, reason);
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
                      <div className="flex items-center justify-end gap-3">
                        {stamp.status === 'PENDING' && (
                          <button
                            onClick={() => handleQuickReject(stamp)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Rechazar rápidamente"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Rechazar
                          </button>
                        )}
                        <button
                          onClick={() => viewDocument(stamp)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Ver Detalles
                        </button>
                      </div>
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
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl max-w-6xl w-full h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header - Compact */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheckIcon className="w-6 h-6 text-blue-200" />
                    Verificación de {getStampTypeName(selectedStamp.type)}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Solicitado por: <span className="font-semibold text-white">{(selectedStamp.profiles as any)?.full_name}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedStamp(null);
                    setActionNotes('');
                    setDocumentUrl(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content - Fixed Height with Internal Scroll */}
            <div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-dark-bg-primary">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Left Column: Info & Actions */}
                <div className="flex flex-col gap-6 h-full">
                  {/* Stamp Info Card */}
                  <div className="bg-white dark:bg-dark-bg-secondary p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">Estado Actual</label>
                        <div>{getStatusBadge(selectedStamp.status)}</div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">Fecha Solicitud</label>
                        <p className="text-sm text-gray-900 dark:text-white font-medium flex items-center gap-1.5">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          {formatDate(selectedStamp.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Details Card - Scrollable */}
                  <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                        Información Proporcionada
                      </h3>
                    </div>
                    <div className="p-4 overflow-y-auto custom-scrollbar">
                      <div className="space-y-0 text-sm">
                        {Object.entries(selectedStamp.evidence as any).map(([key, value]) => {
                          if (key === 'document_url' || key === 'verification_code' || key === 'expires_at' || key === 'attempts' || key === 'file_type' || key === 'file_name') return null;
                          return (
                            <div key={key} className="grid grid-cols-3 gap-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary px-2 -mx-2 rounded-lg transition-colors">
                              <span className="font-medium text-gray-500 dark:text-gray-400 capitalize col-span-1 flex items-center">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className="text-gray-900 dark:text-white col-span-2 break-words font-medium">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions Card */}
                  <div className="bg-white dark:bg-dark-bg-secondary p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    {selectedStamp.status === 'PENDING' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Notas de Revisión
                          </label>
                          <textarea
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                            placeholder="Escribe aquí las observaciones para el usuario..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => rejectStamp(selectedStamp.id)}
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            {processing ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
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
                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            {processing ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-5 h-5" />
                                Aprobar Verificación
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Esta solicitud ya ha sido procesada.
                        </p>
                        {selectedStamp.admin_notes && (
                          <div className="mt-3 text-left bg-white dark:bg-dark-bg-primary p-3 rounded border border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Nota del Admin</span>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{selectedStamp.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Document Preview */}
                <div className="flex flex-col h-full bg-white dark:bg-dark-bg-secondary p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <EyeIcon className="w-4 h-4 text-blue-500" />
                      Documento Adjunto
                    </h3>
                    {(selectedStamp.evidence as any).file_type?.startsWith('image/') && (
                      <button
                        onClick={() => {
                          setIsZoomEnabled(!isZoomEnabled);
                          setShowMagnifier(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isZoomEnabled 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                        title={isZoomEnabled ? "Desactivar Lupa" : "Activar Lupa"}
                      >
                        <MagnifyingGlassPlusIcon className="w-4 h-4" />
                        {isZoomEnabled ? 'Lupa Activa' : 'Activar Lupa'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden relative group flex items-center justify-center">
                    {loadingDocument ? (
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500 font-medium">Cargando documento...</p>
                      </div>
                    ) : documentUrl ? (
                      (selectedStamp.evidence as any).file_type?.startsWith('image/') ? (
                        <div 
                          className={`relative w-full h-full flex items-center justify-center group ${isZoomEnabled ? 'cursor-none' : 'cursor-zoom-in'}`}
                          onClick={() => !isZoomEnabled && setShowLightbox(true)}
                          onMouseEnter={handleMouseEnter}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <img
                            ref={imgRef}
                            src={documentUrl}
                            alt="Document"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {}}
                          />
                          
                          {showMagnifier && (
                            <div 
                              style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                height: '200px',
                                width: '200px',
                                top: `${magnifierPosition.y - 100}px`,
                                left: `${magnifierPosition.x - 100}px`,
                                border: '4px solid white',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                backgroundImage: `url('${documentUrl}')`,
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: `${imgSize.width * 2}px ${imgSize.height * 2}px`,
                                backgroundPosition: `${-magnifierPosition.x * 2 + 100}px ${-magnifierPosition.y * 2 + 100}px`,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                zIndex: 50
                              }}
                            />
                          )}
                          
                          {!showMagnifier && (
                            <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none">
                              <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                {isZoomEnabled ? 'Modo Lupa Activo' : 'Clic para pantalla completa'}
                              </div>
                            </div>
                          )}


                        </div>
                      ) : (
                        <div className="text-center p-8">
                          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <DocumentTextIcon className="w-10 h-10 text-blue-500" />
                          </div>
                          <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                            {(selectedStamp.evidence as any).file_name || 'Documento PDF'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Este documento no se puede previsualizar
                          </p>
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <EyeIcon className="w-5 h-5" />
                            Abrir en nueva pestaña
                          </a>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-8">
                        <XCircleIcon className="w-16 h-16 text-red-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No se pudo cargar el documento</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Overlay */}
      {showLightbox && documentUrl && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <img 
              src={documentUrl} 
              alt="Full size document" 
              className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
            />
            <button 
              className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 transition-colors flex items-center gap-2 bg-white/10 rounded-full px-4 hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setShowLightbox(false);
              }}
            >
              <span className="text-sm font-medium">Cerrar</span>
              <XMarkIcon className="w-6 h-6" />
            </button>
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

