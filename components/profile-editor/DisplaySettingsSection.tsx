import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { useTranslations } from '../../hooks/useTranslations';

const DisplaySettingsSection: React.FC = () => {
  const { profile, refetchProfile } = useAuth();
  const t = useTranslations();
  const [settings, setSettings] = useState({
    show_verified_credentials: profile?.show_verified_credentials ?? false,
    show_connect_links: profile?.show_connect_links ?? false,
    show_qr_code: profile?.show_qr_code ?? true,
    show_availability_badge: profile?.show_availability_badge ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setSettings({
        show_verified_credentials: profile.show_verified_credentials ?? false,
        show_connect_links: profile.show_connect_links ?? false,
        show_qr_code: profile.show_qr_code ?? true,
        show_availability_badge: profile.show_availability_badge ?? true,
      });
    }
  }, [profile]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', profile.id);

      if (error) throw error;

      await refetchProfile();
      setMessage({ type: 'success', text: t.displaySettings.messages.success });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving display settings:', err);
      setMessage({ type: 'error', text: t.displaySettings.messages.error });
    } finally {
      setSaving(false);
    }
  };

  const settingsOptions = [
    {
      key: 'show_availability_badge' as const,
      title: t.displaySettings.options.availability.title,
      description: t.displaySettings.options.availability.description,
      icon: '🟢',
      recommended: true,
    },
    {
      key: 'show_qr_code' as const,
      title: t.displaySettings.options.qrCode.title,
      description: t.displaySettings.options.qrCode.description,
      icon: '📱',
      recommended: true,
    },
    {
      key: 'show_verified_credentials' as const,
      title: t.displaySettings.options.credentials.title,
      description: t.displaySettings.options.credentials.description,
      icon: '✅',
      recommended: false,
    },
    {
      key: 'show_connect_links' as const,
      title: t.displaySettings.options.connectLinks.title,
      description: t.displaySettings.options.connectLinks.description,
      icon: '🔗',
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t.displaySettings.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t.displaySettings.subtitle}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl border-2 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="space-y-4">
        {settingsOptions.map((option) => (
          <div
            key={option.key}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border-2 border-gray-200 dark:border-dark-border hover:border-cv-blue/50 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-3xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {option.title}
                    </h4>
                    {option.recommended && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                        {t.displaySettings.recommended}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(option.key)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 ${
                  settings[option.key]
                    ? 'bg-cv-blue'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                    settings[option.key] ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              {t.displaySettings.tip.title}
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {t.displaySettings.tip.description}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t-2 border-gray-200 dark:border-dark-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:transform-none"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>{t.displaySettings.buttons.saving}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{t.displaySettings.buttons.save}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DisplaySettingsSection;
