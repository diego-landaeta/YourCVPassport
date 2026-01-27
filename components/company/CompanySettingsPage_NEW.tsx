// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import { useToastContext } from '../../context/ToastContext';
import {
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface CompanySettings {
  // Notifications
  email_notifications: boolean;
  new_matches_alert: boolean;
  credit_low_alert: boolean;
  weekly_summary: boolean;

  // Privacy
  profile_visibility: 'public' | 'private' | 'verified_only';
  allow_direct_messages: boolean;

  // Search Preferences
  auto_save_searches: boolean;
  match_threshold: number;

  // Billing
  auto_recharge_enabled: boolean;
  auto_recharge_threshold: number;
  auto_recharge_amount: number;
}

const CompanySettingsPage_NEW: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const t = useTranslations();
  const toast = useToastContext();

  const [settings, setSettings] = useState<CompanySettings>({
    email_notifications: true,
    new_matches_alert: true,
    credit_low_alert: true,
    weekly_summary: false,
    profile_visibility: 'public',
    allow_direct_messages: true,
    auto_save_searches: true,
    match_threshold: 70,
    auto_recharge_enabled: false,
    auto_recharge_threshold: 10,
    auto_recharge_amount: 100,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'search' | 'billing'>('notifications');

  const canEdit = companyUser.role === 'OWNER' || companyUser.role === 'ADMIN';

  useEffect(() => {
    loadSettings();
  }, [company.id]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load settings from company_settings table
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', company.id)
        .single();

      if (error) {
        // If no settings exist yet, use defaults (will be created on first save)
        if (error.code === 'PGRST116') {
          console.log('No settings found, using defaults');
        } else {
          throw error;
        }
      } else if (data) {
        // Update state with loaded settings
        setSettings({
          email_notifications: data.email_notifications,
          new_matches_alert: data.new_matches_alert,
          credit_low_alert: data.credit_low_alert,
          weekly_summary: data.weekly_summary,
          profile_visibility: data.profile_visibility,
          allow_direct_messages: data.allow_direct_messages,
          auto_save_searches: data.auto_save_searches,
          match_threshold: data.match_threshold,
          auto_recharge_enabled: data.auto_recharge_enabled,
          auto_recharge_threshold: data.auto_recharge_threshold,
          auto_recharge_amount: data.auto_recharge_amount,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(t.company.settings.loadError);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error(t.company.settings.noPermission);
      return;
    }

    try {
      setSaving(true);

      // First, check if settings already exist
      const { data: existingSettings } = await supabase
        .from('company_settings')
        .select('id')
        .eq('company_id', company.id)
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('company_settings')
          .update({
            email_notifications: settings.email_notifications,
            new_matches_alert: settings.new_matches_alert,
            credit_low_alert: settings.credit_low_alert,
            weekly_summary: settings.weekly_summary,
            profile_visibility: settings.profile_visibility,
            allow_direct_messages: settings.allow_direct_messages,
            auto_save_searches: settings.auto_save_searches,
            match_threshold: settings.match_threshold,
            auto_recharge_enabled: settings.auto_recharge_enabled,
            auto_recharge_threshold: settings.auto_recharge_threshold,
            auto_recharge_amount: settings.auto_recharge_amount,
          })
          .eq('company_id', company.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('company_settings')
          .insert({
            company_id: company.id,
            email_notifications: settings.email_notifications,
            new_matches_alert: settings.new_matches_alert,
            credit_low_alert: settings.credit_low_alert,
            weekly_summary: settings.weekly_summary,
            profile_visibility: settings.profile_visibility,
            allow_direct_messages: settings.allow_direct_messages,
            auto_save_searches: settings.auto_save_searches,
            match_threshold: settings.match_threshold,
            auto_recharge_enabled: settings.auto_recharge_enabled,
            auto_recharge_threshold: settings.auto_recharge_threshold,
            auto_recharge_amount: settings.auto_recharge_amount,
          });

        if (error) throw error;
      }

      toast.success(t.company.settings.saved);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t.company.settings.saveError);
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof CompanySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSetting = (key: keyof CompanySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t.company.settings.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
            {t.company.settings.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
            {t.company.settings.subtitle}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-dark-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? 'border-cv-blue text-cv-blue dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <BellIcon className="inline h-5 w-5 mr-2" />
              {t.company.settings.tabs.notifications}
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'privacy'
                  ? 'border-cv-blue text-cv-blue dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <ShieldCheckIcon className="inline h-5 w-5 mr-2" />
              {t.company.settings.tabs.privacy}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-cv-blue text-cv-blue dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Cog6ToothIcon className="inline h-5 w-5 mr-2" />
              {t.company.settings.tabs.search}
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'billing'
                  ? 'border-cv-blue text-cv-blue dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <CreditCardIcon className="inline h-5 w-5 mr-2" />
              {t.company.settings.tabs.billing}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                  {t.company.settings.notifications.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t.company.settings.notifications.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-border">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {t.company.settings.notifications.emailNotifications}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.company.settings.notifications.emailNotificationsDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting('email_notifications')}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.email_notifications ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-border">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {t.company.settings.notifications.newMatches}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.company.settings.notifications.newMatchesDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting('new_matches_alert')}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.new_matches_alert ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.new_matches_alert ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-border">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {t.company.settings.notifications.creditLow}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.company.settings.notifications.creditLowDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting('credit_low_alert')}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.credit_low_alert ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.credit_low_alert ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {t.company.settings.notifications.weeklySummary}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.company.settings.notifications.weeklySummaryDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting('weekly_summary')}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.weekly_summary ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.weekly_summary ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                  {t.company.settings.privacy.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t.company.settings.privacy.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="py-3 border-b border-gray-200 dark:border-dark-border">
                  <label className="block font-medium text-gray-900 dark:text-dark-text-primary mb-2">
                    {t.company.settings.privacy.profileVisibility}
                  </label>
                  <select
                    value={settings.profile_visibility}
                    onChange={(e) => updateSetting('profile_visibility', e.target.value)}
                    disabled={!canEdit}
                    className="block w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue disabled:opacity-50"
                  >
                    <option value="public">{t.company.settings.privacy.public} - {t.company.settings.privacy.publicDesc}</option>
                    <option value="verified_only">{t.company.settings.privacy.verifiedOnly} - {t.company.settings.privacy.verifiedOnlyDesc}</option>
                    <option value="private">{t.company.settings.privacy.private} - {t.company.settings.privacy.privateDesc}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {t.company.settings.privacy.allowMessages}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.company.settings.privacy.allowMessagesDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting('allow_direct_messages')}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.allow_direct_messages ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.allow_direct_messages ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                  {t.company.settings.searchPreferences.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t.company.settings.searchPreferences.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-border">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {t.company.settings.searchPreferences.autoSave}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.company.settings.searchPreferences.autoSaveDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting('auto_save_searches')}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.auto_save_searches ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.auto_save_searches ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-3">
                  <label className="block font-medium text-gray-900 dark:text-dark-text-primary mb-2">
                    {t.company.settings.searchPreferences.matchThreshold}: {settings.match_threshold}%
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t.company.settings.searchPreferences.matchThresholdDesc}
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={settings.match_threshold}
                    onChange={(e) => updateSetting('match_threshold', parseInt(e.target.value))}
                    disabled={!canEdit}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>50%</span>
                    <span>70%</span>
                    <span>95%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                  {t.company.settings.billing.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t.company.settings.billing.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-border">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {t.company.settings.billing.autoRecharge}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.company.settings.billing.autoRechargeDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting('auto_recharge_enabled')}
                    disabled={!canEdit}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.auto_recharge_enabled ? 'bg-cv-blue' : 'bg-gray-200 dark:bg-gray-700'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.auto_recharge_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.auto_recharge_enabled && (
                  <>
                    <div className="py-3 border-b border-gray-200 dark:border-dark-border">
                      <label className="block font-medium text-gray-900 dark:text-dark-text-primary mb-2">
                        {t.company.settings.billing.rechargeThreshold}:
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={settings.auto_recharge_threshold}
                        onChange={(e) => updateSetting('auto_recharge_threshold', parseInt(e.target.value))}
                        disabled={!canEdit}
                        className="block w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue disabled:opacity-50"
                      />
                    </div>

                    <div className="py-3">
                      <label className="block font-medium text-gray-900 dark:text-dark-text-primary mb-2">
                        {t.company.settings.billing.rechargeAmount}:
                      </label>
                      <select
                        value={settings.auto_recharge_amount}
                        onChange={(e) => updateSetting('auto_recharge_amount', parseInt(e.target.value))}
                        disabled={!canEdit}
                        className="block w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue disabled:opacity-50"
                      >
                        <option value="50">50 {t.company.settings.billing.credits}</option>
                        <option value="100">100 {t.company.settings.billing.credits}</option>
                        <option value="200">200 {t.company.settings.billing.credits}</option>
                        <option value="500">500 {t.company.settings.billing.credits}</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {canEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-cv-blue hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t.company.settings.saving : t.company.settings.save}
            </button>
          </div>
        )}

        {!canEdit && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              {t.company.settings.noEditPermission}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettingsPage_NEW;
