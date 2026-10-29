// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { companyDocumentPath, getCompanyDocumentSignedUrl } from '../../lib/companyDocuments';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToastContext } from '../../contexts/ToastContext';
import type { Company, CompanyUser } from '../../types';
import { COMPANY_FULL_COLUMNS } from '../../lib/companyColumns';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface CompanyWithUsers extends Company {
  company_users?: CompanyUser[];
}

// Columnas nuevas de la fase 1 (companies_full): país, idioma y persona de contacto.
const EXTRA_COMPANY_COLUMNS = 'country_code, idioma, contact_name, contact_position';

// Revisión automática (company_ai_reviews, solo admin). `motivos` es jsonb:
// [{ code, severity: 'info' | 'warn', message_es, message_en }].
const reviewMessage = (m: any, lang: string): string =>
  typeof m === 'string' ? m : (lang === 'es' ? m?.message_es : m?.message_en) ?? m?.message_es ?? m?.message ?? '';

const CompanyManagementSection: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const toast = useToastContext();

  // approve_company / reject_company comprueban en el servidor que quien llama
  // (auth.uid()) es admin; p_admin_id se sigue enviando pero se ignora.
  // Un 42501 (PostgREST 403) significa que la sesión no es de un admin.
  const notAdminMessage = lang === 'es'
    ? 'Solo un administrador puede aprobar o rechazar empresas. Vuelve a iniciar sesión con una cuenta de administrador.'
    : 'Only an administrator can approve or reject companies. Sign in again with an administrator account.';

  const [companies, setCompanies] = useState<CompanyWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithUsers | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  // company_ai_reviews por empresa (la más reciente primero)
  const [reviews, setReviews] = useState<Record<string, any[]>>({});
  const [documentToView, setDocumentToView] = useState<string | null>(null);
  const [documentIsPdf, setDocumentIsPdf] = useState(false);

  // company-documents es privado: se abre con una URL firmada (1 h). Acepta la
  // ruta guardada por el registro nuevo y las URLs públicas antiguas.
  const openDocument = async (stored: string) => {
    const signed = await getCompanyDocumentSignedUrl(stored);
    if (!signed) {
      toast.error('No se pudo abrir el documento');
      return;
    }
    setDocumentIsPdf((companyDocumentPath(stored) || '').toLowerCase().endsWith('.pdf'));
    setDocumentToView(signed);
  };

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0
  });

  useEffect(() => {
    loadCompanies();
  }, [filter, searchTerm]);

  const loadCompanies = async (withExtra = true): Promise<void> => {
    try {
      setLoading(true);

      // Columnas privadas (email, CIF, documentos, notas...): vista companies_full (admin)
      let query = supabase
        .from('companies_full')
        // Sin embed company_users: no se usaba y, desde una vista, depende de que
        // PostgREST deduzca la relación
        .select(withExtra ? `${COMPANY_FULL_COLUMNS}, ${EXTRA_COMPANY_COLUMNS}` : COMPANY_FULL_COLUMNS)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter !== 'ALL') {
        query = query.eq('status', filter);
      }

      // Apply search
      // Sin caracteres de sintaxis de PostgREST: comas, paréntesis o comillas en la
      // búsqueda alterarían el filtro .or()
      const term = searchTerm.replace(/[,()"\\*]/g, ' ').trim();
      if (term) {
        query = query.or(`company_name.ilike.%${term}%,company_email.ilike.%${term}%,tax_id.ilike.%${term}%`);
      }

      const { data, error } = await query;

      if (error) {
        // Migración 20261029 sin aplicar: sin las columnas nuevas, como antes.
        if (withExtra && (error.code === '42703' || error.code === 'PGRST204')) return loadCompanies(false);
        throw error;
      }

      setCompanies(data || []);

      // Motivos de la revisión automática de cada empresa (si la tabla no existe, se omite).
      const ids = (data || []).map((c: any) => c.id);
      if (ids.length > 0) {
        const { data: revs, error: revError } = await supabase
          .from('company_ai_reviews')
          .select('id, company_id, resultado, motivos, proveedor, modelo, created_at')
          .in('company_id', ids)
          .order('created_at', { ascending: false });
        const byCompany: Record<string, any[]> = {};
        if (!revError) (revs || []).forEach((r: any) => { (byCompany[r.company_id] ||= []).push(r); });
        setReviews(byCompany);
      } else {
        setReviews({});
      }

      // Calculate stats
      const allCompanies = await supabase
        .from('companies_full')
        .select('status');

      if (allCompanies.data) {
        const statusCounts = allCompanies.data.reduce((acc, company) => {
          acc[company.status] = (acc[company.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          total: allCompanies.data.length,
          pending: statusCounts.PENDING || 0,
          approved: statusCounts.APPROVED || 0,
          rejected: statusCounts.REJECTED || 0,
          suspended: statusCounts.SUSPENDED || 0
        });
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (company: CompanyWithUsers) => {
    setSelectedCompany(company);
    setApprovalNotes(company.admin_notes || '');
    setShowDetailsModal(true);
  };

  const handleApprove = async () => {
    if (!selectedCompany || !user) return;

    setProcessing(true);

    try {
      const { data, error } = await supabase.rpc('approve_company', {
        p_company_id: selectedCompany.id,
        p_admin_id: user.id, // ignorado en el servidor (se usa auth.uid())
        p_notes: approvalNotes || null
      });

      if (error) throw error;

      // Send approval email
      try {
        await supabase.functions.invoke('company-registration-email', {
          body: {
            companyId: selectedCompany.id,
            type: 'approved'
          }
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success(`Company "${selectedCompany.company_name}" has been approved!`);

      // Reload companies
      await loadCompanies();

      // Close modal
      setShowDetailsModal(false);
      setSelectedCompany(null);
      setApprovalNotes('');
    } catch (error: any) {
      console.error('Error approving company:', error);
      toast.error(error?.code === '42501' ? notAdminMessage : `Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCompany || !user || !rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.rpc('reject_company', {
        p_company_id: selectedCompany.id,
        p_admin_id: user.id, // ignorado en el servidor (se usa auth.uid())
        p_reason: rejectReason
      });

      if (error) throw error;

      // Send rejection email
      try {
        await supabase.functions.invoke('company-registration-email', {
          body: {
            companyId: selectedCompany.id,
            type: 'rejected'
          }
        });
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success(`Company "${selectedCompany.company_name}" has been rejected.`);

      // Reload companies
      await loadCompanies();

      // Close modals
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setSelectedCompany(null);
      setRejectReason('');
    } catch (error: any) {
      console.error('Error rejecting company:', error);
      toast.error(error?.code === '42501' ? notAdminMessage : `Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Suspended
          </span>
        );
      default:
        return null;
    }
  };

  const getReviewBadge = (companyId: string) => {
    const latest = reviews[companyId]?.[0];
    if (!latest) {
      return <span className="text-xs text-gray-400 dark:text-dark-text-tertiary">{lang === 'es' ? 'Sin revisar' : 'Not reviewed'}</span>;
    }
    const styles: Record<string, string> = {
      ok: 'bg-green-100 text-green-800',
      dudosa: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = lang === 'es'
      ? { ok: 'Sin incidencias', dudosa: 'Dudosa', error: 'Error' }
      : { ok: 'No issues', dudosa: 'Doubtful', error: 'Error' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[latest.resultado] || 'bg-gray-100 text-gray-800'}`}>
        {labels[latest.resultado] || latest.resultado}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Company Management</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-dark-text-secondary">
          Review and manage company registrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div
          className={`bg-white dark:bg-dark-bg-secondary overflow-hidden shadow dark:shadow-2xl rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-3xl transition-shadow border border-transparent dark:border-dark-border ${
            filter === 'ALL' ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
          }`}
          onClick={() => setFilter('ALL')}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'ALL'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('ALL'); } }}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400 dark:text-dark-text-tertiary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary truncate">Total</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-dark-bg-secondary overflow-hidden shadow dark:shadow-2xl rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-3xl transition-shadow border border-transparent dark:border-dark-border ${
            filter === 'PENDING' ? 'ring-2 ring-yellow-500 dark:ring-yellow-400' : ''
          }`}
          onClick={() => setFilter('PENDING')}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'PENDING'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('PENDING'); } }}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400 dark:text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary truncate">Pending</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-dark-bg-secondary overflow-hidden shadow dark:shadow-2xl rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-3xl transition-shadow border border-transparent dark:border-dark-border ${
            filter === 'APPROVED' ? 'ring-2 ring-green-500 dark:ring-green-400' : ''
          }`}
          onClick={() => setFilter('APPROVED')}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'APPROVED'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('APPROVED'); } }}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400 dark:text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary truncate">Approved</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{stats.approved}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-dark-bg-secondary overflow-hidden shadow dark:shadow-2xl rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-3xl transition-shadow border border-transparent dark:border-dark-border ${
            filter === 'REJECTED' ? 'ring-2 ring-red-500 dark:ring-red-400' : ''
          }`}
          onClick={() => setFilter('REJECTED')}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'REJECTED'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('REJECTED'); } }}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400 dark:text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary truncate">Rejected</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{stats.rejected}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-dark-bg-secondary overflow-hidden shadow dark:shadow-2xl rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-3xl transition-shadow border border-transparent dark:border-dark-border ${
            filter === 'SUSPENDED' ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''
          }`}
          onClick={() => setFilter('SUSPENDED')}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'SUSPENDED'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter('SUSPENDED'); } }}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-orange-400 dark:text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary truncate">Suspended</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{stats.suspended}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-dark-bg-secondary shadow dark:shadow-2xl rounded-lg p-4 border border-transparent dark:border-dark-border">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
          </div>
          <input
            type="text"
            placeholder="Search by company name, email, or tax ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-border rounded-md leading-5 bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-dark-text-secondary focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-dark-bg-secondary shadow dark:shadow-2xl rounded-lg overflow-hidden border border-transparent dark:border-dark-border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-text-tertiary" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text-primary">No companies found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
              {filter !== 'ALL' ? `No companies with status "${filter}"` : 'No companies registered yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    Tax ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {lang === 'es' ? 'Revisión auto.' : 'Auto review'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {company.logo_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={company.logo_url}
                              alt={company.company_name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-dark-bg-tertiary flex items-center justify-center">
                              <BuildingOfficeIcon className="h-6 w-6 text-gray-400 dark:text-dark-text-tertiary" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{company.company_name}</div>
                          <div className="text-sm text-gray-500 dark:text-dark-text-secondary">{company.company_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text-primary">
                      {company.tax_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(company.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getReviewBadge(company.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text-primary">
                      {company.credit_balance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                      {formatDate(company.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(company)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailsModal(false)}></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Company Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    aria-label={lang === 'en' ? 'Close' : 'Cerrar'}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:focus-visible:ring-blue-400"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Company Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Basic Information</h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-200">{selectedCompany.company_name}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Legal Name:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-200">{selectedCompany.legal_name}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax ID:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-200">{selectedCompany.tax_id}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-200">{selectedCompany.company_email}</p>
                        </div>
                        {(selectedCompany as any).country_code && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{lang === 'es' ? 'País / idioma:' : 'Country / language:'}</span>
                            <p className="text-sm text-gray-900 dark:text-gray-200">
                              {(selectedCompany as any).country_code}{(selectedCompany as any).idioma ? ` · ${(selectedCompany as any).idioma}` : ''}
                            </p>
                          </div>
                        )}
                        {(selectedCompany as any).contact_name && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{lang === 'es' ? 'Contacto:' : 'Contact:'}</span>
                            <p className="text-sm text-gray-900 dark:text-gray-200">
                              {(selectedCompany as any).contact_name}{(selectedCompany as any).contact_position ? ` · ${(selectedCompany as any).contact_position}` : ''}
                            </p>
                          </div>
                        )}
                        {selectedCompany.company_phone && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                            <p className="text-sm text-gray-900 dark:text-gray-200">{selectedCompany.company_phone}</p>
                          </div>
                        )}
                        {selectedCompany.website_url && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Website:</span>
                            <a
                              href={selectedCompany.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {selectedCompany.website_url}
                            </a>
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                          <div className="mt-1">{getStatusBadge(selectedCompany.status)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Revisión automática: motivos de company_ai_reviews */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {lang === 'es' ? 'Revisión automática' : 'Automatic review'}
                      </h4>
                      {(reviews[selectedCompany.id] || []).length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          {lang === 'es' ? 'Todavía no hay revisión automática de esta empresa.' : 'There is no automatic review for this company yet.'}
                        </p>
                      ) : (
                        (reviews[selectedCompany.id] || []).slice(0, 3).map((r: any, idx: number) => (
                          <div key={r.id} className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${idx > 0 ? 'mt-2 opacity-80' : ''}`}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {getReviewBadge(selectedCompany.id) && idx === 0 ? getReviewBadge(selectedCompany.id) : (
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{r.resultado}</span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {r.proveedor || '—'}{r.modelo ? ` (${r.modelo})` : ''} · {formatDate(r.created_at)}
                              </span>
                            </div>
                            {Array.isArray(r.motivos) && r.motivos.length > 0 ? (
                              <ul className="space-y-1">
                                {r.motivos.map((m: any, i: number) => (
                                  <li key={i} className="text-sm text-gray-700 dark:text-gray-200 flex gap-2">
                                    <span className={`shrink-0 text-xs font-semibold uppercase ${m?.severity === 'warn' ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                      {m?.severity === 'warn' ? (lang === 'es' ? 'Aviso' : 'Warning') : 'Info'}
                                    </span>
                                    <span>{reviewMessage(m, lang)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-600 dark:text-gray-300">{lang === 'es' ? 'Sin motivos registrados.' : 'No reasons recorded.'}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {selectedCompany.description && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          {selectedCompany.description}
                        </p>
                      </div>
                    )}

                    {selectedCompany.status === 'REJECTED' && selectedCompany.rejection_reason && (
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-400 mb-2">Rejection Reason</h4>
                        <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          {selectedCompany.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Documents */}
                  <div className="space-y-4">
                    {/* Company Logo */}
                    {selectedCompany.logo_url && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Company Logo</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <img
                            src={selectedCompany.logo_url}
                            alt="Company Logo"
                            className="max-w-full h-auto max-h-32 object-contain rounded"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Verification Documents</h4>
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tax Document (CIF/NIF)</p>
                          {selectedCompany.tax_document_url ? (
                            <button
                              onClick={() => openDocument(selectedCompany.tax_document_url!)}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Document
                            </button>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No document uploaded</p>
                          )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Business License</p>
                          {selectedCompany.verification_document_url ? (
                            <button
                              onClick={() => openDocument(selectedCompany.verification_document_url!)}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Document
                            </button>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No document uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedCompany.status === 'PENDING' && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Admin Notes (Optional)</h4>
                        <textarea
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          rows={4}
                          placeholder="Add any notes about this company..."
                          className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    )}

                    {selectedCompany.admin_notes && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Admin Notes</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          {selectedCompany.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedCompany.status === 'PENDING' && (
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve Company'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Reject Company
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Please provide a reason for rejecting this company. This will be sent to them via email.
                      </p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        placeholder="e.g., Invalid tax documentation, Incomplete information, etc."
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-red-500 focus:border-red-500 placeholder-gray-400 dark:placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  disabled={processing}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {documentToView && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setDocumentToView(null)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Document Preview
                  </h3>
                  <button
                    type="button"
                    onClick={() => setDocumentToView(null)}
                    aria-label={lang === 'en' ? 'Close' : 'Cerrar'}
                    className="text-gray-400 hover:text-gray-500 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:focus-visible:ring-blue-400"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4">
                  {documentIsPdf ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">PDF Preview</p>
                      <a
                        href={documentToView}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Open PDF in New Tab
                      </a>
                    </div>
                  ) : (
                    <img
                      src={documentToView}
                      alt="Document"
                      className="max-w-full h-auto mx-auto"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagementSection;
