import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector, { getLanguageByName } from '../LanguageSelector';

// Extended language schema with percentage and isNative flag
const extendedLanguageSchema = z.object({
  name: z.string().min(1, 'El nombre del idioma es requerido'),
  level: z.string().min(1, 'El nivel es requerido'),
  percentage: z.number().min(0).max(100).optional().nullable(),
  isNative: z.boolean().optional(),
});

type LanguageFormData = z.infer<typeof extendedLanguageSchema> & { id?: string };

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
  const [languages, setLanguages] = useState<LanguageFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showNativeLanguagePrompt, setShowNativeLanguagePrompt] = useState(
    initialData.length === 0 || !initialData.some(l => l.isNative)
  );

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<LanguageFormData>({
    resolver: zodResolver(extendedLanguageSchema),
  });

  const nativeLanguage = languages.find(l => l.isNative);
  const otherLanguages = languages.filter(l => !l.isNative);

  const handleAdd = () => {
    setEditingIndex(null);
    reset({ name: '', level: 'B2', percentage: null, isNative: false });
    setIsFormOpen(true);
  };

  const handleAddNative = () => {
    setEditingIndex(null);
    reset({ name: '', level: 'Native', percentage: 100, isNative: true });
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
    let updated: LanguageFormData[];
    if (editingIndex !== null) {
      updated = languages.map((lang, idx) => (idx === editingIndex ? data : lang));
    } else {
      updated = [...languages, data];
    }
    setLanguages(updated);
    await onSave(updated);
    setIsFormOpen(false);

    // Hide native language prompt after adding native language
    if (data.isNative) {
      setShowNativeLanguagePrompt(false);
    }
  };

  const handleSaveAndContinue = async () => {
    await onSave(languages);
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {lang === 'en' ? 'Languages' : 'Idiomas'}
        </h2>
      </div>

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
                {lang === 'en' ? 'What is your native language?' : '¿Cuál es tu idioma nativo?'}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {lang === 'en'
                  ? 'Start by selecting your native language. This is the language you speak fluently from birth or early childhood.'
                  : 'Comienza seleccionando tu idioma nativo. Este es el idioma que hablas con fluidez desde tu nacimiento o infancia.'}
              </p>
              <button
                onClick={handleAddNative}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {lang === 'en' ? 'Add Native Language' : 'Agregar Idioma Nativo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Native Language Display */}
      {nativeLanguage && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            {lang === 'en' ? 'Native Language' : 'Idioma Nativo'}
          </h3>
          {(() => {
            const languageData = getLanguageByName(nativeLanguage.name);
            const index = languages.indexOf(nativeLanguage);
            return (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
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
                        {lang === 'en' ? 'Native' : 'Nativo'}
                      </span>
                    </div>
                    {languageData && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{languageData.nativeName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(index)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={lang === 'en' ? 'Edit' : 'Editar'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Language Certificate Verification Banner */}
      {languages.length > 0 && (
        <div className="mb-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                {lang === 'en' ? 'Do you have a language certificate?' : '¿Cuentas con algún certificado de idioma?'}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                {lang === 'en'
                  ? 'Upload official certificates (TOEFL, IELTS, DELE, DELF, etc.) to verify your proficiency.'
                  : 'Sube certificados oficiales (TOEFL, IELTS, DELE, DELF, etc.) para verificar tu nivel.'}
              </p>
              <button
                onClick={() => onNavigateToVerifications?.()}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {lang === 'en' ? 'Upload Certificate' : 'Subir Certificado'}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Languages Section */}
      {nativeLanguage && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {lang === 'en' ? 'Other Languages' : 'Otros Idiomas'}
            </h3>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-cv-blue hover:bg-cv-blue-dark text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {lang === 'en' ? 'Add Language' : 'Agregar Idioma'}
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
                          title={lang === 'en' ? 'Edit' : 'Editar'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={lang === 'en' ? 'Delete' : 'Eliminar'}
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
                          {lang === 'en' ? 'Proficiency' : 'Nivel de dominio'}
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
                {lang === 'en' ? 'No additional languages yet' : 'Aún no has agregado otros idiomas'}
              </p>
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {watch('isNative')
              ? (lang === 'en' ? 'Add Native Language' : 'Agregar Idioma Nativo')
              : (editingIndex !== null ? modals.editLanguage : modals.addLanguage)}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {lang === 'en' ? 'Language' : 'Idioma'} *
              </label>
              <LanguageSelector
                value={watch('name')}
                onChange={(languageName) => setValue('name', languageName, { shouldDirty: true })}
                placeholder={lang === 'en' ? 'Select a language' : 'Selecciona un idioma'}
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
                    {lang === 'en' ? 'Proficiency Level' : 'Nivel de Dominio'} *
                  </label>
                  <select
                    {...register('level')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  >
                    {CEFR_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lang === 'en' ? 'Proficiency Percentage (%)' : 'Porcentaje de Dominio (%)'}
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

            {/* Preview Section */}
            {watch('name') && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg border border-gray-200 dark:border-dark-border">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {lang === 'en' ? 'Preview' : 'Vista previa'}
                </h4>
                <div className={`rounded-lg p-3 border-2 ${
                  watch('isNative')
                    ? 'bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-800/40 dark:to-blue-800/40 border-indigo-300 dark:border-indigo-600'
                    : 'bg-white dark:bg-dark-bg-secondary border-gray-200 dark:border-dark-border'
                }`}>
                  <div className="flex items-start gap-3 mb-2">
                    {getLanguageByName(watch('name')) && (
                      <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm border-2 bg-white ${
                        watch('isNative')
                          ? 'border-indigo-400 dark:border-indigo-500'
                          : 'border-blue-200 dark:border-blue-800'
                      }`}>
                        <img
                          src={`https://flagcdn.com/w40/${getLanguageByName(watch('name'))?.countryCode}.png`}
                          srcSet={`https://flagcdn.com/w80/${getLanguageByName(watch('name'))?.countryCode}.png 2x`}
                          alt={getLanguageByName(watch('name'))?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{watch('name')}</h4>
                        {watch('isNative') && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                            {lang === 'en' ? 'NATIVE' : 'NATIVO'}
                          </span>
                        )}
                      </div>
                      {getLanguageByName(watch('name')) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getLanguageByName(watch('name'))?.nativeName}</p>
                      )}
                      {!watch('isNative') && watch('level') && (
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${getLevelColor(watch('level'))}`}>
                          {watch('level')}
                        </span>
                      )}
                    </div>
                  </div>
                  {!watch('isNative') && watch('percentage') !== null && watch('percentage') !== undefined && watch('percentage') > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{lang === 'en' ? 'Proficiency level' : 'Nivel de dominio'}</span>
                        <span>{watch('percentage')}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-cv-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${watch('percentage')}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {lang === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
              >
                {watch('isNative')
                  ? (lang === 'en' ? 'Add Native Language' : 'Agregar Idioma Nativo')
                  : (editingIndex !== null
                      ? (lang === 'en' ? 'Update' : 'Actualizar')
                      : (lang === 'en' ? 'Add Language' : 'Agregar Idioma')
                    )
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Next Button */}
      {nativeLanguage && !isFormOpen && (
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveAndContinue}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            Siguiente
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
