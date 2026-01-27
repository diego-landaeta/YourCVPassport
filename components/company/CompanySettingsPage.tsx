import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import { useToastContext } from '../../context/ToastContext';
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhotoIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const CompanySettingsPage: React.FC = () => {
  const { company: initialCompany, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();
  const toast = useToastContext();

  const [company, setCompany] = useState<Company>(initialCompany);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const canEdit = companyUser.role === 'OWNER' || companyUser.role === 'ADMIN';

  const handleInputChange = (field: keyof Company, value: any) => {
    setCompany({ ...company, [field]: value });
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error(t('company.settings.noPermission') || 'You do not have permission to edit settings');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('companies')
        .update({
          company_name: company.company_name,
          company_email: company.company_email,
          company_phone: company.company_phone,
          website_url: company.website_url,
          address_street: company.address_street,
          address_city: company.address_city,
          address_state: company.address_state,
          address_country: company.address_country,
          address_postal: company.address_postal,
          industry: company.industry,
          company_size: company.company_size,
          description: company.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (error) throw error;

      toast.success(t('company.settings.saveSuccess') || 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('company.settings.saveError') || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (company.status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            {t('company.settings.approved') || 'Approved'}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            {t('company.settings.pending') || 'Pending Review'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
            <XCircleIcon className="h-4 w-4 mr-1" />
            {t('company.settings.rejected') || 'Rejected'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('company.settings.title') || 'Company Settings'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('company.settings.subtitle') || 'Manage your company information and preferences'}
          </p>
        </div>

        {/* Verification Status */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('company.settings.verificationStatus') || 'Verification Status'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {company.status === 'APPROVED'
                  ? (t('company.settings.verifiedDesc') || 'Your company is verified and can access all features')
                  : company.status === 'PENDING'
                  ? (t('company.settings.pendingDesc') || 'Your company registration is under review')
                  : (t('company.settings.rejectedDesc') || 'Your company registration was rejected')
                }
              </p>
              {company.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-400">
                    {t('company.settings.rejectionReason') || 'Rejection Reason:'}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {company.rejection_reason}
                  </p>
                </div>
              )}
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('company.settings.basicInfo') || 'Basic Information'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                {t('company.settings.companyName') || 'Company Name'}
              </label>
              <input
                type="text"
                value={company.company_name || ''}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                disabled={!canEdit}
                className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  <EnvelopeIcon className="inline h-4 w-4 mr-1" />
                  {t('company.settings.email') || 'Email'}
                </label>
                <input
                  type="email"
                  value={company.company_email || ''}
                  onChange={(e) => handleInputChange('company_email', e.target.value)}
                  disabled={!canEdit}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  <PhoneIcon className="inline h-4 w-4 mr-1" />
                  {t('company.settings.phone') || 'Phone'}
                </label>
                <input
                  type="tel"
                  value={company.company_phone || ''}
                  onChange={(e) => handleInputChange('company_phone', e.target.value)}
                  disabled={!canEdit}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                <GlobeAltIcon className="inline h-4 w-4 mr-1" />
                {t('company.settings.website') || 'Website'}
              </label>
              <input
                type="url"
                value={company.website_url || ''}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                disabled={!canEdit}
                placeholder="https://example.com"
                className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.settings.industry') || 'Industry'}
                </label>
                <input
                  type="text"
                  value={company.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  disabled={!canEdit}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.settings.companySize') || 'Company Size'}
                </label>
                <select
                  value={company.company_size || ''}
                  onChange={(e) => handleInputChange('company_size', e.target.value)}
                  disabled={!canEdit}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 {t('company.settings.employees') || 'employees'}</option>
                  <option value="11-50">11-50 {t('company.settings.employees') || 'employees'}</option>
                  <option value="51-200">51-200 {t('company.settings.employees') || 'employees'}</option>
                  <option value="201-500">201-500 {t('company.settings.employees') || 'employees'}</option>
                  <option value="501-1000">501-1000 {t('company.settings.employees') || 'employees'}</option>
                  <option value="1000+">1000+ {t('company.settings.employees') || 'employees'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('company.settings.description') || 'Description'}
              </label>
              <textarea
                value={company.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!canEdit}
                rows={4}
                className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <MapPinIcon className="inline h-5 w-5 mr-1" />
            {t('company.settings.address') || 'Address'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('company.settings.street') || 'Street Address'}
              </label>
              <input
                type="text"
                value={company.address_street || ''}
                onChange={(e) => handleInputChange('address_street', e.target.value)}
                disabled={!canEdit}
                className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.settings.city') || 'City'}
                </label>
                <input
                  type="text"
                  value={company.address_city || ''}
                  onChange={(e) => handleInputChange('address_city', e.target.value)}
                  disabled={!canEdit}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.settings.state') || 'State/Province'}
                </label>
                <input
                  type="text"
                  value={company.address_state || ''}
                  onChange={(e) => handleInputChange('address_state', e.target.value)}
                  disabled={!canEdit}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.settings.country') || 'Country'}
                </label>
                <input
                  type="text"
                  value={company.address_country || ''}
                  onChange={(e) => handleInputChange('address_country', e.target.value)}
                  disabled={!canEdit}
                  maxLength={2}
                  placeholder="US"
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('company.settings.postal') || 'Postal Code'}
                </label>
                <input
                  type="text"
                  value={company.address_postal || ''}
                  onChange={(e) => handleInputChange('address_postal', e.target.value)}
                  disabled={!canEdit}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {canEdit && (
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? (t('company.settings.saving') || 'Saving...') : (t('company.settings.saveChanges') || 'Save Changes')}
            </button>
          </div>
        )}

        {!canEdit && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              {t('company.settings.noEditPermission') || 'Only company owners and admins can edit settings.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettingsPage;
