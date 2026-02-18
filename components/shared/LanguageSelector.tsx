import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

export interface Language {
  name: string;
  flag: string;
  nativeName: string;
  countryCode: string; // ISO 3166-1 alpha-2 country code for flag image
}

export const COMMON_LANGUAGES: Language[] = [
  { name: 'English', flag: '🇬🇧', nativeName: 'English', countryCode: 'gb' },
  { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español', countryCode: 'es' },
  { name: 'French', flag: '🇫🇷', nativeName: 'Français', countryCode: 'fr' },
  { name: 'German', flag: '🇩🇪', nativeName: 'Deutsch', countryCode: 'de' },
  { name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano', countryCode: 'it' },
  { name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português', countryCode: 'pt' },
  { name: 'Chinese', flag: '🇨🇳', nativeName: '中文', countryCode: 'cn' },
  { name: 'Japanese', flag: '🇯🇵', nativeName: '日本語', countryCode: 'jp' },
  { name: 'Korean', flag: '🇰🇷', nativeName: '한국어', countryCode: 'kr' },
  { name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية', countryCode: 'sa' },
  { name: 'Russian', flag: '🇷🇺', nativeName: 'Русский', countryCode: 'ru' },
  { name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी', countryCode: 'in' },
  { name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands', countryCode: 'nl' },
  { name: 'Swedish', flag: '🇸🇪', nativeName: 'Svenska', countryCode: 'se' },
  { name: 'Norwegian', flag: '🇳🇴', nativeName: 'Norsk', countryCode: 'no' },
  { name: 'Danish', flag: '🇩🇰', nativeName: 'Dansk', countryCode: 'dk' },
  { name: 'Finnish', flag: '🇫🇮', nativeName: 'Suomi', countryCode: 'fi' },
];

interface LanguageSelectorProps {
  value?: string; // Language name
  onChange: (languageName: string) => void;
  placeholder?: string;
  lang?: 'en' | 'es';
  className?: string;
  error?: string;
  excludeLanguages?: string[]; // List of language names to exclude from the dropdown
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Selecciona un idioma',
  lang = 'es',
  className = '',
  error,
  excludeLanguages = []
}) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLanguage = COMMON_LANGUAGES.find(l => l.name === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = COMMON_LANGUAGES.filter(language => {
    // Exclude languages that are already added (except the currently selected one when editing)
    if (excludeLanguages.includes(language.name) && language.name !== value) {
      return false;
    }

    const searchLower = searchQuery.toLowerCase();
    return language.name.toLowerCase().includes(searchLower) ||
           language.nativeName.toLowerCase().includes(searchLower);
  });

  const handleSelect = (languageName: string) => {
    onChange(languageName);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-bg-secondary border-2 rounded-xl hover:border-cv-blue dark:hover:border-cv-blue transition-colors focus:outline-none focus:ring-2 focus:ring-cv-blue focus:border-transparent ${
          error ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-dark-border'
        }`}
      >
        {selectedLanguage ? (
          <>
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-blue-200 dark:border-blue-800 bg-white">
              <img
                src={`https://flagcdn.com/w40/${selectedLanguage.countryCode}.png`}
                srcSet={`https://flagcdn.com/w80/${selectedLanguage.countryCode}.png 2x`}
                alt={selectedLanguage.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900 dark:text-white">
                {selectedLanguage.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedLanguage.nativeName}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <span className="flex-1 text-left text-gray-500 dark:text-gray-400 font-medium">
              {placeholder}
            </span>
          </>
        )}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-dark-bg-secondary border-2 border-gray-200 dark:border-dark-border rounded-xl shadow-2xl max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-bg-secondary">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.common.searchLanguage}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="overflow-y-auto max-h-80">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {t.common.noLanguagesFound}
              </div>
            ) : (
              filteredLanguages.map((language) => (
                <button
                  key={language.name}
                  type="button"
                  onClick={() => handleSelect(language.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors ${
                    value === language.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-gray-200 dark:border-gray-600 bg-white">
                    <img
                      src={`https://flagcdn.com/w40/${language.countryCode}.png`}
                      srcSet={`https://flagcdn.com/w80/${language.countryCode}.png 2x`}
                      alt={language.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white text-base">
                      {language.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {language.nativeName}
                    </div>
                  </div>
                  {value === language.name && (
                    <svg className="w-5 h-5 text-cv-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

// Helper function to get language by name
export const getLanguageByName = (name: string): Language | undefined => {
  return COMMON_LANGUAGES.find(l => l.name === name);
};
