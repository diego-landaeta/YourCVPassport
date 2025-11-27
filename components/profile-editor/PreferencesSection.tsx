import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { preferencesSchema, PreferencesFormData } from '../../schemas/profileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';

interface PreferencesSectionProps {
  initialData?: Partial<PreferencesFormData>;
  onSave: (data: PreferencesFormData) => Promise<void>;
}

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship'] as const;
const AVAILABILITY_OPTIONS = ['immediate', '2-weeks', '1-month', '2-months', 'not-looking'] as const;
const REMOTE_PREFERENCES = ['remote', 'hybrid', 'on-site', 'flexible'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];

const PreferencesSection: React.FC<PreferencesSectionProps> = ({ initialData, onSave }) => {
  const translations = useTranslations();
  const { lang, setLang } = useLanguage();
  const t = translations.dashboard.preferences;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: PreferencesFormData) => {
    await onSave(data);
  };

  const handleLanguageChange = (newLang: 'en' | 'es') => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Language Settings Section */}
        <div className="pb-6 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.language.title}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.language.label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t.language.description}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  lang === 'en'
                    ? 'bg-cv-blue text-white shadow-md'
                    : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t.language.english}
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('es')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  lang === 'es'
                    ? 'bg-cv-blue text-white shadow-md'
                    : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t.language.spanish}
              </button>
            </div>
          </div>
        </div>

        {/* Job Preferences Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.jobPreferences.title}</h3>
          <div className="space-y-6">
            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobPreferences.jobType}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {JOB_TYPES.map((type) => (
                  <Controller
                    key={type}
                    name="job_type"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={type}
                          checked={field.value?.includes(type) || false}
                          onChange={(e) => {
                            const currentValue = field.value || [];
                            if (e.target.checked) {
                              field.onChange([...currentValue, type]);
                            } else {
                              field.onChange(currentValue.filter((v) => v !== type));
                            }
                          }}
                          className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {type === 'full-time' && t.jobPreferences.jobTypes.fullTime}
                          {type === 'part-time' && t.jobPreferences.jobTypes.partTime}
                          {type === 'contract' && t.jobPreferences.jobTypes.contract}
                          {type === 'freelance' && t.jobPreferences.jobTypes.freelance}
                          {type === 'internship' && t.jobPreferences.jobTypes.internship}
                        </span>
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobPreferences.availability}
              </label>
              <select
                {...register('availability')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
              >
                <option value="">{t.jobPreferences.selectAvailability}</option>
                <option value="immediate">{t.jobPreferences.immediate}</option>
                <option value="2-weeks">{t.jobPreferences.twoWeeks}</option>
                <option value="1-month">{t.jobPreferences.oneMonth}</option>
                <option value="2-months">{t.jobPreferences.twoMonths}</option>
                <option value="not-looking">{t.jobPreferences.notLooking}</option>
              </select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobPreferences.salary}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    {...register('salary_min', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                    placeholder={t.jobPreferences.minSalary}
                  />
                </div>
                <div>
                  <input
                    {...register('salary_max', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                    placeholder={t.jobPreferences.maxSalary}
                  />
                </div>
                <div>
                  <select
                    {...register('salary_currency')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  >
                    <option value="">{t.jobPreferences.currency}</option>
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Remote Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobPreferences.workLocation}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {REMOTE_PREFERENCES.map((pref) => (
                  <label key={pref} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      {...register('remote_preference')}
                      type="radio"
                      value={pref}
                      className="w-4 h-4 text-cv-blue border-gray-300 focus:ring-cv-blue"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {pref === 'remote' && t.jobPreferences.remotePreferences.remote}
                      {pref === 'hybrid' && t.jobPreferences.remotePreferences.hybrid}
                      {pref === 'on-site' && t.jobPreferences.remotePreferences.onSite}
                      {pref === 'flexible' && t.jobPreferences.remotePreferences.flexible}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Relocation */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  {...register('willing_to_relocate')}
                  type="checkbox"
                  className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.jobPreferences.willingToRelocate}
                </span>
              </label>
            </div>

            {/* Preferred Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobPreferences.preferredLocations}
              </label>
              <Controller
                name="preferred_locations"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    value={field.value?.join(', ') || ''}
                    onChange={(e) => {
                      const locations = e.target.value
                        .split(',')
                        .map((loc) => loc.trim())
                        .filter((loc) => loc !== '');
                      field.onChange(locations);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                    placeholder={t.jobPreferences.locationPlaceholder}
                  />
                )}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.jobPreferences.locationHelper}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end items-center gap-3">
          {isDirty && (
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {t.unsavedChanges}
            </span>
          )}
          <button
            type="submit"
            disabled={!isDirty}
            className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {t.saveButton}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesSection;
