import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserGroupIcon,
  CreditCardIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../supabase/client';
import { Company } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const CompaniesViewSection: React.FC = () => {
  const { lang } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const translations = {
    en: {
      search: 'Search by name, tax ID or email...',
      loading: 'Loading companies...',
      noCompanies: 'No companies registered yet',
      companyName: 'Company Name',
      taxId: 'Tax ID',
      email: 'Email',
      status: 'Status',
      registeredDate: 'Registered',
      viewDetails: 'View Details',
      closeDetails: 'Close',
      verified: 'Verified',
      pending: 'Pending',
      rejected: 'Rejected',
      suspended: 'Suspended',
      basicInfo: 'Basic Information',
      legalName: 'Legal Name',
      phone: 'Phone',
      website: 'Website',
      industry: 'Industry',
      size: 'Company Size',
      address: 'Address',
      credits: 'Credits',
      creditBalance: 'Credit Balance',
      purchased: 'Purchased',
      used: 'Used',
      description: 'Description',
      verificationInfo: 'Verification Information',
      verifiedAt: 'Verified At',
      adminNotes: 'Admin Notes',
      rejectionReason: 'Rejection Reason',
      noPhone: 'Not provided',
      noWebsite: 'Not provided',
      noAddress: 'Not provided'
    },
    es: {
      search: 'Buscar por nombre, CIF o email...',
      loading: 'Cargando empresas...',
      noCompanies: 'No hay empresas registradas aún',
      companyName: 'Nombre Comercial',
      taxId: 'CIF/NIF',
      email: 'Email',
      status: 'Estado',
      registeredDate: 'Registrada',
      viewDetails: 'Ver Detalles',
      closeDetails: 'Cerrar',
      verified: 'Verificada',
      pending: 'Pendiente',
      rejected: 'Rechazada',
      suspended: 'Suspendida',
      basicInfo: 'Información Básica',
      legalName: 'Razón Social',
      phone: 'Teléfono',
      website: 'Sitio Web',
      industry: 'Industria',
      size: 'Tamaño',
      address: 'Dirección',
      credits: 'Créditos',
      creditBalance: 'Saldo de Créditos',
      purchased: 'Comprados',
      used: 'Usados',
      description: 'Descripción',
      verificationInfo: 'Información de Verificación',
      verifiedAt: 'Verificada el',
      adminNotes: 'Notas del Admin',
      rejectionReason: 'Razón de Rechazo',
      noPhone: 'No proporcionado',
      noWebsite: 'No proporcionado',
      noAddress: 'No proporcionada'
    }
  };

  const t = translations[lang];

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Company['status']) => {
    const statusConfig = {
      APPROVED: {
        icon: CheckBadgeIcon,
        text: t.verified,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      PENDING: {
        icon: ClockIcon,
        text: t.pending,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      REJECTED: {
        icon: XCircleIcon,
        text: t.rejected,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      },
      SUSPENDED: {
        icon: XCircleIcon,
        text: t.suspended,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      }
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <StatusIcon className="w-3.5 h-3.5" />
        {config.text}
      </span>
    );
  };

  const formatAddress = (company: Company) => {
    const parts = [
      company.address_street,
      company.address_city,
      company.address_state,
      company.address_country,
      company.address_postal
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : t.noAddress;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent text-gray-900 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Companies List */}
      <div>
        {filteredCompanies.length === 0 ? (
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg dark:shadow-2xl p-12 text-center">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-dark-text-secondary">
              {searchTerm ? 'No se encontraron empresas' : t.noCompanies}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg dark:shadow-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-border text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">{t.companyName}</div>
              <div className="col-span-2">{t.taxId}</div>
              <div className="col-span-3">{t.email}</div>
              <div className="col-span-2">{t.status}</div>
              <div className="col-span-1 text-right">{t.viewDetails}</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className="w-full grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-left group"
                >
                  {/* Company Name with Logo */}
                  <div className="col-span-4 flex items-center gap-3">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.company_name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-dark-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary flex items-center justify-center border border-gray-200 dark:border-dark-border flex-shrink-0">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-dark-text-primary truncate group-hover:text-cv-blue transition-colors">
                        {company.company_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {company.legal_name}
                      </p>
                    </div>
                  </div>

                  {/* Tax ID */}
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm font-mono text-gray-900 dark:text-dark-text-primary">
                      {company.tax_id}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="col-span-3 flex items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {company.company_email}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    {getStatusBadge(company.status)}
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 flex items-center justify-end">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-cv-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setSelectedCompany(null)}
            ></div>

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-dark-bg-secondary rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-6 py-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedCompany.logo_url ? (
                    <img
                      src={selectedCompany.logo_url}
                      alt={selectedCompany.company_name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-dark-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary flex items-center justify-center border border-gray-200 dark:border-dark-border">
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                      {selectedCompany.company_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedCompany.legal_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                {/* Status Badge */}
                <div className="mb-6">
                  {getStatusBadge(selectedCompany.status)}
                </div>

                {/* Basic Information */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary uppercase tracking-wider mb-4">
                    {t.basicInfo}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.legalName}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                          {selectedCompany.legal_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono bg-gray-100 dark:bg-dark-bg-tertiary px-2 py-1 rounded mt-0.5 flex-shrink-0">
                        CIF
                      </span>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.taxId}</p>
                        <p className="text-sm font-mono font-medium text-gray-900 dark:text-dark-text-primary">
                          {selectedCompany.tax_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.email}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                          {selectedCompany.company_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.phone}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                          {selectedCompany.company_phone || t.noPhone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <GlobeAltIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.website}</p>
                        {selectedCompany.website_url ? (
                          <a
                            href={selectedCompany.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-cv-blue hover:underline"
                          >
                            {selectedCompany.website_url}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-400">{t.noWebsite}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <UserGroupIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.size}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                          {selectedCompany.company_size || '-'}
                        </p>
                      </div>
                    </div>

                    {selectedCompany.industry && (
                      <div className="flex items-start gap-3 md:col-span-2">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded mt-0.5 flex-shrink-0">
                          Industria
                        </span>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.industry}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                            {selectedCompany.industry}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.address}</p>
                      <p className="text-sm text-gray-900 dark:text-dark-text-primary">
                        {formatAddress(selectedCompany)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedCompany.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary uppercase tracking-wider mb-2">
                      {t.description}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedCompany.description}
                    </p>
                  </div>
                )}

                {/* Credits */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary uppercase tracking-wider mb-4">
                    {t.credits}
                  </h4>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCardIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t.creditBalance}</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {selectedCompany.credit_balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-600 dark:text-green-400">{t.purchased}</p>
                        <p className="font-semibold text-green-700 dark:text-green-300">
                          {selectedCompany.total_credits_purchased.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-600 dark:text-green-400">{t.used}</p>
                        <p className="font-semibold text-green-700 dark:text-green-300">
                          {selectedCompany.total_credits_used.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Info */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary uppercase tracking-wider mb-4">
                    {t.verificationInfo}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.registeredDate}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                          {formatDate(selectedCompany.created_at)}
                        </p>
                      </div>
                    </div>

                    {selectedCompany.verified_at && (
                      <div className="flex items-start gap-3">
                        <CheckBadgeIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.verifiedAt}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                            {formatDate(selectedCompany.verified_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedCompany.admin_notes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{t.adminNotes}</p>
                        <p className="text-sm text-blue-900 dark:text-blue-300">
                          {selectedCompany.admin_notes}
                        </p>
                      </div>
                    )}

                    {selectedCompany.rejection_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">{t.rejectionReason}</p>
                        <p className="text-sm text-red-900 dark:text-red-300">
                          {selectedCompany.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-6 py-4 border-t border-gray-200 dark:border-dark-border flex justify-end">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="px-4 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg text-sm font-medium text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.closeDetails}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesViewSection;
