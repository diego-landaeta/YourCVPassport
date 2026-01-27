import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Export {
  id: string;
  profile_id: string;
  profile_name: string;
  profile_email: string;
  export_type: 'PDF' | 'JSON';
  exported_at: string;
  exported_by: string;
  file_url?: string;
}

const ExportsHistoryPage: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();
  const navigate = useNavigate();

  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PDF' | 'JSON'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const exportsPerPage = 20;

  // Helper function to access translations
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  useEffect(() => {
    if (company?.id) {
      fetchExports();
    }
  }, [company]);

  const fetchExports = async () => {
    try {
      // Get all profile views where has_downloaded is true
      const { data: views, error: viewsError } = await supabase
        .from('company_profile_views')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            professional_title
          )
        `)
        .eq('company_id', company.id)
        .eq('has_downloaded', true)
        .order('created_at', { ascending: false });

      if (viewsError) throw viewsError;

      // Transform to exports format
      const exportsData: Export[] = (views || []).map((view: any) => ({
        id: view.id,
        profile_id: view.profile_id,
        profile_name: view.profiles?.full_name || 'Unknown',
        profile_email: view.profiles?.email || 'N/A',
        export_type: 'PDF' as const,
        exported_at: view.created_at,
        exported_by: view.created_by,
      }));

      setExports(exportsData);
    } catch (error) {
      console.error('Error fetching exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (exp: Export) => {
    try {
      // NOTE: File download pending - Requires storage bucket integration
      // to retrieve previously exported CVs. Will be implemented in future iteration.
      // For now, users should re-export from profile view page.
      alert(
        t('company.exports.downloadStarted') ||
          `Downloading CV for ${exp.profile_name}...`
      );
      // Redirect to profile view where they can export again
      navigate(`/company/profile/${exp.profile_id}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(t('company.exports.downloadError') || 'Error downloading file');
    }
  };

  const handleViewProfile = (profileId: string) => {
    navigate(`/company/profile/${profileId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Filter exports
  const filteredExports = exports.filter((exp) => {
    const matchesSearch =
      exp.profile_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.profile_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || exp.export_type === filterType;
    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredExports.length / exportsPerPage);
  const startIndex = (currentPage - 1) * exportsPerPage;
  const paginatedExports = filteredExports.slice(
    startIndex,
    startIndex + exportsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
            {t('company.exports.title') || 'Exports History'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
            {t('company.exports.subtitle') ||
              'View and download previously exported profiles'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {t('company.exports.totalExports') || 'Total Exports'}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary mt-1">
                  {exports.length}
                </p>
              </div>
              <ArrowDownTrayIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {t('company.exports.thisMonth') || 'This Month'}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary mt-1">
                  {
                    exports.filter((exp) => {
                      const exportDate = new Date(exp.exported_at);
                      const now = new Date();
                      return (
                        exportDate.getMonth() === now.getMonth() &&
                        exportDate.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
              <ClockIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {t('company.exports.uniqueProfiles') || 'Unique Profiles'}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary mt-1">
                  {new Set(exports.map((exp) => exp.profile_id)).size}
                </p>
              </div>
              <DocumentTextIcon className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                <input
                  type="text"
                  placeholder={
                    t('company.exports.searchPlaceholder') ||
                    'Search by name or email...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as 'ALL' | 'PDF' | 'JSON')
                  }
                  className="block w-full pl-10 pr-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">{t('common.all') || 'All Types'}</option>
                  <option value="PDF">PDF</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">
              {t('common.loading') || 'Loading...'}
            </p>
          </div>
        ) : paginatedExports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
            <ArrowDownTrayIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-text-tertiary" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text-primary">
              {t('company.exports.noExports') || 'No exports found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
              {searchTerm
                ? t('company.exports.noMatches') || 'No exports match your search'
                : t('company.exports.startExporting') ||
                  'Start downloading profiles to build your export history'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/company/search')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors gap-2"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  {t('company.exports.searchTalent') || 'Search Talent'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-dark-text-secondary">
              {t('company.exports.showing') || 'Showing'} {startIndex + 1}-
              {Math.min(startIndex + exportsPerPage, filteredExports.length)}{' '}
              {t('common.of') || 'of'} {filteredExports.length}{' '}
              {t('company.exports.exports') || 'exports'}
            </div>

            {/* Exports Table */}
            <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                  <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        {t('company.exports.profile') || 'Profile'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        {t('company.exports.email') || 'Email'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        {t('company.exports.type') || 'Type'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        {t('company.exports.date') || 'Export Date'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        {t('company.exports.actions') || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                    {paginatedExports.map((exp) => (
                      <tr
                        key={exp.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                            {exp.profile_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                            {exp.profile_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            {exp.export_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-tertiary">
                          {formatDate(exp.exported_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewProfile(exp.profile_id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              <EyeIcon className="h-4 w-4" />
                              {t('common.view') || 'View'}
                            </button>
                            <button
                              onClick={() => handleDownload(exp)}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              {t('common.download') || 'Download'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary text-sm font-medium text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.previous') || 'Previous'}
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white'
                            : 'bg-white dark:bg-dark-bg-secondary border-gray-300 dark:border-gray-600 text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-secondary text-sm font-medium text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.next') || 'Next'}
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExportsHistoryPage;
