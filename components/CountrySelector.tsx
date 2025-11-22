import React, { useState, useRef, useEffect } from 'react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  nameEs: string;
}

export const countries: Country[] = [
  { code: 'ES', name: 'Spain', nameEs: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'United States', nameEs: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'MX', name: 'Mexico', nameEs: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', nameEs: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', nameEs: 'Colombia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', nameEs: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Peru', nameEs: 'Perú', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', nameEs: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', nameEs: 'Ecuador', flag: '🇪🇨' },
  { code: 'GT', name: 'Guatemala', nameEs: 'Guatemala', flag: '🇬🇹' },
  { code: 'CU', name: 'Cuba', nameEs: 'Cuba', flag: '🇨🇺' },
  { code: 'BO', name: 'Bolivia', nameEs: 'Bolivia', flag: '🇧🇴' },
  { code: 'DO', name: 'Dominican Republic', nameEs: 'República Dominicana', flag: '🇩🇴' },
  { code: 'HN', name: 'Honduras', nameEs: 'Honduras', flag: '🇭🇳' },
  { code: 'PY', name: 'Paraguay', nameEs: 'Paraguay', flag: '🇵🇾' },
  { code: 'SV', name: 'El Salvador', nameEs: 'El Salvador', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', nameEs: 'Nicaragua', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', nameEs: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', nameEs: 'Panamá', flag: '🇵🇦' },
  { code: 'UY', name: 'Uruguay', nameEs: 'Uruguay', flag: '🇺🇾' },
  { code: 'PR', name: 'Puerto Rico', nameEs: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'GB', name: 'United Kingdom', nameEs: 'Reino Unido', flag: '🇬🇧' },
  { code: 'FR', name: 'France', nameEs: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', nameEs: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', nameEs: 'Italia', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', nameEs: 'Portugal', flag: '🇵🇹' },
  { code: 'BR', name: 'Brazil', nameEs: 'Brasil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', nameEs: 'Canadá', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', nameEs: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', nameEs: 'Nueva Zelanda', flag: '🇳🇿' },
  { code: 'JP', name: 'Japan', nameEs: 'Japón', flag: '🇯🇵' },
  { code: 'CN', name: 'China', nameEs: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', nameEs: 'India', flag: '🇮🇳' },
  { code: 'KR', name: 'South Korea', nameEs: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'RU', name: 'Russia', nameEs: 'Rusia', flag: '🇷🇺' },
  { code: 'ZA', name: 'South Africa', nameEs: 'Sudáfrica', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', nameEs: 'Nigeria', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', nameEs: 'Egipto', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', nameEs: 'Marruecos', flag: '🇲🇦' },
  { code: 'AE', name: 'United Arab Emirates', nameEs: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', nameEs: 'Arabia Saudita', flag: '🇸🇦' },
  { code: 'TR', name: 'Turkey', nameEs: 'Turquía', flag: '🇹🇷' },
  { code: 'GR', name: 'Greece', nameEs: 'Grecia', flag: '🇬🇷' },
  { code: 'NL', name: 'Netherlands', nameEs: 'Países Bajos', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', nameEs: 'Bélgica', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', nameEs: 'Suiza', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', nameEs: 'Austria', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', nameEs: 'Suecia', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', nameEs: 'Noruega', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', nameEs: 'Dinamarca', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', nameEs: 'Finlandia', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', nameEs: 'Polonia', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', nameEs: 'República Checa', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', nameEs: 'Hungría', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', nameEs: 'Rumania', flag: '🇷🇴' },
  { code: 'IE', name: 'Ireland', nameEs: 'Irlanda', flag: '🇮🇪' },
  { code: 'SG', name: 'Singapore', nameEs: 'Singapur', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', nameEs: 'Malasia', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', nameEs: 'Tailandia', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', nameEs: 'Vietnam', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', nameEs: 'Filipinas', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', nameEs: 'Indonesia', flag: '🇮🇩' },
];

interface CountrySelectorProps {
  value?: string; // Country code
  onChange: (countryCode: string) => void;
  placeholder?: string;
  lang?: 'en' | 'es';
  className?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select country',
  lang = 'es',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find(c => c.code === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(country => {
    const searchLower = searchQuery.toLowerCase();
    const countryName = lang === 'es' ? country.nameEs : country.name;
    return countryName.toLowerCase().includes(searchLower) || 
           country.code.toLowerCase().includes(searchLower);
  });

  const handleSelect = (countryCode: string) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-bg-secondary border-2 border-gray-200 dark:border-dark-border rounded-xl hover:border-cv-blue dark:hover:border-cv-blue transition-colors focus:outline-none focus:ring-2 focus:ring-cv-blue focus:border-transparent"
      >
        {selectedCountry ? (
          <>
            <span className="text-3xl">{selectedCountry.flag}</span>
            <span className="flex-1 text-left text-gray-900 dark:text-white font-medium">
              {lang === 'es' ? selectedCountry.nameEs : selectedCountry.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-500 dark:text-gray-400">
            {placeholder}
          </span>
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'es' ? 'Buscar país...' : 'Search country...'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-transparent dark:bg-dark-bg-tertiary dark:text-white"
              autoFocus
            />
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto max-h-80">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {lang === 'es' ? 'No se encontraron países' : 'No countries found'}
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors ${
                    value === country.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="flex-1 text-left text-gray-900 dark:text-white">
                    {lang === 'es' ? country.nameEs : country.name}
                  </span>
                  {value === country.code && (
                    <svg className="w-5 h-5 text-cv-blue" fill="currentColor" viewBox="0 0 20 20">
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

export default CountrySelector;

// Helper function to get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

// Component to display country flag badge
export const CountryBadge: React.FC<{ countryCode: string; size?: 'sm' | 'md' | 'lg'; showName?: boolean; lang?: 'en' | 'es' }> = ({ 
  countryCode, 
  size = 'md',
  showName = false,
  lang = 'es'
}) => {
  const country = getCountryByCode(countryCode);
  if (!country) return null;

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`${currentSize} rounded-full bg-white dark:bg-gray-800 shadow-md border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden relative`}>
        <img 
          src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
          srcSet={`https://flagcdn.com/w160/${countryCode.toLowerCase()}.png 2x`}
          alt={`${country.nameEs} flag`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to emoji if image fails to load
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-2xl">${country.flag}</span>`;
            }
          }}
        />
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {lang === 'es' ? country.nameEs : country.name}
        </span>
      )}
    </div>
  );
};
