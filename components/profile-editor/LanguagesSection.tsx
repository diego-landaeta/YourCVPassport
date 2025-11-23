import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { languageSchema, LanguageFormData } from '../../schemas/profileSchemas';
import { useTranslations } from '../../hooks/useTranslations';

interface LanguagesSectionProps {
  initialData?: LanguageFormData[];
  onSave: (data: LanguageFormData[]) => Promise<void>;
}

const COMMON_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese',
  'Korean', 'Arabic', 'Russian', 'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
];

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const;

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ initialData = [], onSave }) => {
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const [languages, setLanguages] = useState<LanguageFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
  });

  const handleAdd = () => {
    setEditingIndex(null);
    reset({ name: '', level: 'B2' });
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
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'A1': 'bg-gray-100 text-gray-800',
      'A2': 'bg-blue-100 text-blue-800',
      'B1': 'bg-green-100 text-green-800',
      'B2': 'bg-yellow-100 text-yellow-800',
      'C1': 'bg-orange-100 text-orange-800',
      'C2': 'bg-red-100 text-red-800',
      'Native': 'bg-purple-100 text-purple-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modals.addLanguage.replace('Añadir ', '').replace('Add ', '')}</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {modals.addLanguage}
        </button>
      </div>

      {/* Language Certificate Verification Banner */}
      {languages.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {translations.lang === 'en' ? 'Do you have a language certificate?' : '¿Cuentas con algún certificado de idioma?'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {translations.lang === 'en'
                  ? 'Verify your language proficiency with official certificates (TOEFL, IELTS, DELE, DELF, etc.). Go to Verifications to upload your language certificates.'
                  : 'Verifica tu nivel de idioma con certificados oficiales (TOEFL, IELTS, DELE, DELF, etc.). Ve a Verificaciones para subir tus certificados de idioma.'}
              </p>
              <button
                onClick={() => window.location.href = '#verificaciones'}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                {translations.lang === 'en' ? 'Upload Language Certificate' : 'Subir Certificado de Idioma'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {languages.map((lang, index) => (
          <div key={index} className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{lang.name}</h4>
                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${getLevelColor(lang.level)}`}>
                  {lang.level}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(index)} className="text-cv-blue hover:text-cv-blue-dark">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(index)} className="text-red-500 hover:text-red-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {languages.length === 0 && !isFormOpen && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{modals.noLanguagesYet}</p>
        </div>
      )}

      {isFormOpen && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? modals.editLanguage : modals.addLanguage}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.languageName} *</label>
              <select
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
              >
                <option value="">{modals.languageName}</option>
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.languageLevel} *</label>
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

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                {modals.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium"
              >
                {editingIndex !== null ? modals.update : modals.add} {modals.addLanguage.replace('Añadir ', '').replace('Add ', '')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LanguagesSection;
