import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import {
  BookmarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  XMarkIcon,
  CheckIcon,
  BellSlashIcon,
} from '@heroicons/react/24/outline';

interface SavedSearch {
  id: string;
  search_name: string;
  filters: any;
  alert_enabled: boolean;
  alert_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  last_alert_sent: string | null;
  results_count: number;
  created_at: string;
  updated_at: string;
}

const SavedSearchesPage: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();
  const navigate = useNavigate();

  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
      fetchSavedSearches();
    }
  }, [company]);

  const fetchSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('company_saved_searches')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each search, count current matching profiles
      const searchesWithCounts = await Promise.all(
        (data || []).map(async (search) => {
          // NOTE: Real-time search count pending - Requires running the actual
          // search query against profiles table with all filters.
          // This will be implemented in next iteration to avoid performance issues.
          // For now, showing saved searches without live counts.
          return {
            ...search,
            results_count: 0, // Live count will be added in future update
          };
        })
      );

      setSearches(searchesWithCounts);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSearch = (search: SavedSearch) => {
    // Navigate to search page with filters applied
    navigate('/company/search', { state: { filters: search.filters } });
  };

  const handleToggleAlerts = async (search: SavedSearch) => {
    try {
      const { error } = await supabase
        .from('company_saved_searches')
        .update({ alert_enabled: !search.alert_enabled })
        .eq('id', search.id);

      if (error) throw error;

      await fetchSavedSearches();
      alert(
        search.alert_enabled
          ? t('company.savedSearches.alertsDisabled') || 'Alerts disabled'
          : t('company.savedSearches.alertsEnabled') || 'Alerts enabled'
      );
    } catch (error) {
      console.error('Error toggling alerts:', error);
      alert(t('company.savedSearches.toggleError') || 'Error updating alerts');
    }
  };

  const handleEditSearch = (search: SavedSearch) => {
    setEditingSearch(search);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSearch) return;

    try {
      const { error } = await supabase
        .from('company_saved_searches')
        .update({
          search_name: editingSearch.search_name,
          alert_frequency: editingSearch.alert_frequency,
        })
        .eq('id', editingSearch.id);

      if (error) throw error;

      await fetchSavedSearches();
      setShowEditModal(false);
      setEditingSearch(null);
      alert(t('company.savedSearches.updateSuccess') || 'Search updated successfully');
    } catch (error) {
      console.error('Error updating search:', error);
      alert(t('company.savedSearches.updateError') || 'Error updating search');
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm(t('company.savedSearches.deleteConfirm') || 'Are you sure you want to delete this search?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      await fetchSavedSearches();
      alert(t('company.savedSearches.deleteSuccess') || 'Search deleted successfully');
    } catch (error) {
      console.error('Error deleting search:', error);
      alert(t('company.savedSearches.deleteError') || 'Error deleting search');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getFilterSummary = (filters: any) => {
    if (!filters) return t('company.savedSearches.noFilters') || 'No specific filters';

    const parts = [];
    if (filters.keywords) parts.push(`Keywords: "${filters.keywords}"`);
    if (filters.location) parts.push(`Location: ${filters.location}`);
    if (filters.jobTitle) parts.push(`Title: ${filters.jobTitle}`);
    if (filters.skills?.length > 0) parts.push(`Skills: ${filters.skills.join(', ')}`);
    if (filters.experienceLevel) parts.push(`Experience: ${filters.experienceLevel}`);
    if (filters.educationLevel) parts.push(`Education: ${filters.educationLevel}`);
    return parts.join(' • ') || t('company.savedSearches.noFilters') || 'No specific filters';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
              {t('company.savedSearches.title') || 'Saved Searches'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
              {t('company.savedSearches.subtitle') || 'Manage your saved searches and automated alerts'}
            </p>
          </div>
          <button
            onClick={() => navigate('/company/search')}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {t('company.savedSearches.newSearch') || 'New Search'}
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                {t('company.savedSearches.alertsInfo') || 'Automated Alerts'}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('company.savedSearches.alertsDescription') ||
                  'Enable alerts on your saved searches to receive email notifications when new profiles match your criteria.'}
              </p>
            </div>
          </div>
        </div>

        {/* Searches List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">
              {t('common.loading') || 'Loading...'}
            </p>
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
            <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-text-tertiary" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text-primary">
              {t('company.savedSearches.noSearches') || 'No saved searches'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
              {t('company.savedSearches.createFirst') || 'Create your first saved search to get started'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/company/search')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors gap-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                {t('company.savedSearches.goToSearch') || 'Go to Search'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 hover:shadow-xl dark:hover:shadow-3xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BookmarkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                        {search.search_name}
                      </h3>
                      {search.alert_enabled && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <BellIcon className="h-3 w-3 mr-1" />
                          {t('company.savedSearches.alertsActive') || 'Alerts Active'}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
                      {getFilterSummary(search.filters)}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-dark-text-tertiary">
                      <span>
                        {t('company.savedSearches.created') || 'Created'}: {formatDate(search.created_at)}
                      </span>
                      {search.alert_enabled && (
                        <>
                          <span>•</span>
                          <span>
                            {t('company.savedSearches.frequency') || 'Frequency'}: {search.alert_frequency}
                          </span>
                          {search.last_alert_sent && (
                            <>
                              <span>•</span>
                              <span>
                                {t('company.savedSearches.lastAlert') || 'Last alert'}:{' '}
                                {formatDate(search.last_alert_sent)}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleRunSearch(search)}
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <PlayIcon className="h-4 w-4" />
                      {t('company.savedSearches.run') || 'Run Search'}
                    </button>
                    <button
                      onClick={() => handleToggleAlerts(search)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                        search.alert_enabled
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/40'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                      }`}
                    >
                      {search.alert_enabled ? (
                        <>
                          <BellSlashIcon className="h-4 w-4" />
                          {t('company.savedSearches.disableAlerts') || 'Disable Alerts'}
                        </>
                      ) : (
                        <>
                          <BellIcon className="h-4 w-4" />
                          {t('company.savedSearches.enableAlerts') || 'Enable Alerts'}
                        </>
                      )}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSearch(search)}
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <PencilIcon className="h-4 w-4" />
                        {t('common.edit') || 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteSearch(search.id)}
                        className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                        {t('common.delete') || 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-dark-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                  {t('company.savedSearches.editSearch') || 'Edit Search'}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('company.savedSearches.searchName') || 'Search Name'}
                  </label>
                  <input
                    type="text"
                    value={editingSearch.search_name}
                    onChange={(e) =>
                      setEditingSearch({ ...editingSearch, search_name: e.target.value })
                    }
                    className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('company.savedSearches.alertFrequency') || 'Alert Frequency'}
                  </label>
                  <select
                    value={editingSearch.alert_frequency}
                    onChange={(e) =>
                      setEditingSearch({
                        ...editingSearch,
                        alert_frequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
                      })
                    }
                    className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DAILY">{t('company.savedSearches.daily') || 'Daily'}</option>
                    <option value="WEEKLY">{t('company.savedSearches.weekly') || 'Weekly'}</option>
                    <option value="MONTHLY">{t('company.savedSearches.monthly') || 'Monthly'}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {t('common.save') || 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSearchesPage;
