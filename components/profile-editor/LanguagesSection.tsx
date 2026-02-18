// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector, { getLanguageByName } from '../shared/LanguageSelector';
import { getProfileSchemas } from '../../schemas/getProfileSchemas';

type LanguageFormData = {
  id?: string;
  name: string;
  level: string;
  percentage?: number | null;
  is_native?: boolean;
  isNative?: boolean; // Legacy support
};

interface LanguagesSectionProps {
  initialData?: LanguageFormData[];
  onSave: (data: LanguageFormData[]) => Promise<void>;
  onNavigateToVerifications?: () => void;
  onNext?: () => void;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const;

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ initialData = [], onSave, onNavigateToVerifications, onNext }) => {
  const translations = useTranslations();
  const { lang } = useLanguage();
  const modals = translations.dashboard.modals;
  const langT = translations.profileEditor.languages;

  // Get schema with translated error messages
  const { languageSchema } = useMemo(() => getProfileSchemas(translations), [translations]);

  const [languages, setLanguages] = useState<LanguageFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showNativeLanguagePrompt, setShowNativeLanguagePrompt] = useState(
    initialData.length === 0 || !initialData.some(l => l.isNative || l.is_native)
  );

  // Update languages when initialData changes
  React.useEffect(() => {
    setLanguages(initialData);
    setShowNativeLanguagePrompt(initialData.length === 0 || !initialData.some(l => l.isNative || l.is_native));
  }, [initialData]);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
  });

  const nativeLanguages = languages.filter(l => l.isNative || l.is_native);
  const otherLanguages = languages.filter(l => !(l.isNative || l.is_native));

  const handleAdd = () => {
    setEditingIndex(null);
    reset({ name: '', level: 'B2', percentage: 50, isNative: false, is_native: false });
    setIsFormOpen(true);
  };

  const handleAddNative = () => {
    setEditingIndex(null);
    reset({ name: '', level: 'Native', percentage: 100, isNative: true, is_native: true });
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    reset(languages[index]);
    setIsFormOpen(true);
  };

  const handleDelete = (index: number) => {
    const updated = languages.filter((_, i) => i !== index);
    setLanguages(updated);
    onSave(updated);
  };

  const onSubmit = async (data: LanguageFormData) => {
    // Ensure both isNative and is_native are set for compatibility
    const isNativeValue = data.isNative === true || data.is_native === true;
    const normalizedData = {
      ...data,
      isNative: isNativeValue,
      is_native: isNativeValue,
    };

    let updated: LanguageFormData[];
    if (editingIndex !== null) {
      updated = languages.map((lang, idx) => (idx === editingIndex ? normalizedData : lang));
    } else {
      updated = [...languages, normalizedData];
    }
    setLanguages(updated);

    // ✅ Cerrar formulario INMEDIATAMENTE para mejor UX
    setIsFormOpen(false);

    // Hide native language prompt after adding native language
    if (normalizedData.isNative || normalizedData.is_native) {
      setShowNativeLanguagePrompt(false);
    }

    // Guardar en segundo plano (no bloquea UI)
    await onSave(updated);
  };

  const handleSaveAndContinue = async () => {
    // Only save if there are actual changes
    const hasChanges = JSON.stringify(languages) !== JSON.stringify(initialData || []);

    if (hasChanges) {
      await onSave(languages);
    }

    if (onNext) {
      onNext();
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'A1': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'A2': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'B1': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'B2': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'C1': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'C2': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'Native': 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white',
    };
    return colors[level] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-cv-blue';
    if (percentage >= 60) return 'bg-cv-blue';
    if (percentage >= 40) return 'bg-cv-blue';
    return 'bg-gray-400 dark:bg-gray-500';
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-end mb-6">
      </div>

      {/* Language Certificate Verification Banner - Only show when NOT in wizard mode */}
      {languages.length > 0 && !onNext && onNavigateToVerifications && (
        <div className="mb-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                {langT.haveCertificate}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                {langT.uploadCertificateDesc}
              </p>
              <button
                onClick={() => onNavigateToVerifications?.()}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {langT.uploadCertificate}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Native Language Prompt - Priority */}
      {showNativeLanguagePrompt && (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-400 dark:to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {langT.whatIsNativeLanguage}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {langT.nativeLanguageDesc}
              </p>
              <button
                onClick={handleAddNative}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {langT.addNativeLanguage}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Native Languages Display */}
      {nativeLanguages.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {translations.profileEditor.languages.nativeLanguages}
            </h3>
            <button
              onClick={handleAddNative}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {langT.addNative}
            </button>
          </div>
          <div className="space-y-2">
            {nativeLanguages.map((nativeLanguage) => {
              const languageData = getLanguageByName(nativeLanguage.name);
              const index = languages.indexOf(nativeLanguage);
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-3">
                    {languageData && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-white">
                        <img
                          src={`https://flagcdn.com/w40/${languageData.countryCode}.png`}
                          srcSet={`https://flagcdn.com/w80/${languageData.countryCode}.png 2x`}
                          alt={languageData.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{nativeLanguage.name}</h4>
                        <span className="px-2 py-0.5 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium rounded uppercase">
                          {langT.native}
                        </span>
                      </div>
                      {languageData && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{languageData.nativeName}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEdit(index)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={translations.common.edit}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-1.5 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={translations.common.delete}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form for Native Languages - appears right after native languages list */}
      {isFormOpen && watch('isNative') && (
        <div className="mb-5 border-t dark:border-dark-border pt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {langT.addNativeLanguage}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Hidden fields for form state */}
            <input type="hidden" {...register('name')} />
            <input type="hidden" {...register('level')} />
            <input
              type="hidden"
              {...register('percentage', { valueAsNumber: true })}
            />
            <input
              type="hidden"
              {...register('isNative', {
                setValueAs: (v) => {
                  if (typeof v === 'boolean') return v;
                  if (v === 'true') return true;
                  if (v === 'false') return false;
                  return !!v;
                }
              })}
            />
            <input
              type="hidden"
              {...register('is_native', {
                setValueAs: (v) => {
                  if (typeof v === 'boolean') return v;
                  if (v === 'true') return true;
                  if (v === 'false') return false;
                  return !!v;
                }
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {langT.language} *
              </label>
              <LanguageSelector
                value={watch('name')}
                onChange={(languageName) => setValue('name', languageName, { shouldValidate: true, shouldDirty: true })}
                placeholder={langT.selectLanguage}
                lang={lang}
                error={errors.name?.message}
                excludeLanguages={languages.map(l => l.name)}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {translations.common.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                {langT.addNativeLanguage}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Other Languages Section */}
      {nativeLanguages.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {translations.profileEditor.languages.otherLanguages}
            </h3>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-cv-blue hover:bg-cv-blue-dark text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {langT.addLanguage}
            </button>
          </div>

          {otherLanguages.length > 0 ? (
            <div className="space-y-2">
              {otherLanguages.map((language) => {
                const languageData = getLanguageByName(language.name);
                const index = languages.indexOf(language);
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      {languageData && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-white">
                          <img
                            src={`https://flagcdn.com/w40/${languageData.countryCode}.png`}
                            srcSet={`https://flagcdn.com/w80/${languageData.countryCode}.png 2x`}
                            alt={languageData.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{language.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(language.level)}`}>
                            {language.level}
                          </span>
                        </div>
                        {languageData && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{languageData.nativeName}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={translations.common.edit}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={translations.common.delete}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {language.percentage !== undefined && language.percentage !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium min-w-[70px]">
                          {langT.proficiency}
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarColor(language.percentage)}`}
                            style={{ width: `${language.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold min-w-[32px] text-right">
                          {language.percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {langT.noAdditionalLanguages}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Form for Other Languages - appears at the bottom */}
      {isFormOpen && !watch('isNative') && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? modals.editLanguage : modals.addLanguage}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Hidden fields for form state */}
            <input type="hidden" {...register('name')} />
            <input
              type="hidden"
              {...register('isNative', {
                setValueAs: (v) => {
                  if (typeof v === 'boolean') return v;
                  if (v === 'true') return true;
                  if (v === 'false') return false;
                  return !!v;
                }
              })}
            />
            <input
              type="hidden"
              {...register('is_native', {
                setValueAs: (v) => {
                  if (typeof v === 'boolean') return v;
                  if (v === 'true') return true;
                  if (v === 'false') return false;
                  return !!v;
                }
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {langT.language} *
              </label>
              <LanguageSelector
                value={watch('name')}
                onChange={(languageName) => setValue('name', languageName, { shouldValidate: true, shouldDirty: true })}
                placeholder={langT.selectLanguage}
                lang={lang}
                error={errors.name?.message}
                excludeLanguages={languages.map(l => l.name)}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            {!watch('isNative') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {langT.proficiencyLevel} *
                  </label>
                  <select
                    {...register('level')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  >
                    {CEFR_LEVELS.filter(level => level !== 'Native').map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {langT.proficiencyPercentage}
                  </label>
                  <input
                    {...register('percentage', {
                      valueAsNumber: true,
                      setValueAs: (v) => isNaN(v) || v === '' ? null : Number(v),
                    })}
                    type="range"
                    min="0"
                    max="100"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>0%</span>
                    <span>{watch('percentage') || 0}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {translations.common.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
              >
                {watch('isNative')
                  ? langT.addNativeLanguage
                  : (editingIndex !== null
                      ? langT.update
                      : langT.addLanguage
                    )
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Next Button */}
      {nativeLanguages.length > 0 && !isFormOpen && (
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveAndContinue}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            {translations.common?.next || 'Next'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguagesSection;
