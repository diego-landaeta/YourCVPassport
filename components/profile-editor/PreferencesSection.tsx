import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { preferencesSchema, PreferencesFormData } from '../../schemas/profileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';

interface PreferencesSectionProps {
  initialData?: Partial<PreferencesFormData>;
  onSave: (data: PreferencesFormData) => Promise<void>;
  onNext?: () => void;
}

const JOB_SEEKING_STATUS_OPTIONS = ['OPEN', 'PASSIVE', 'NOT_LOOKING'] as const;
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship'] as const;
const AVAILABILITY_OPTIONS = ['immediate', '2-weeks', '1-month', '2-months', 'not-looking'] as const;
const REMOTE_PREFERENCES = ['remote', 'hybrid', 'on-site', 'flexible'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];

// Lista de ciudades populares organizadas por región
const POPULAR_CITIES = [
  // América Latina
  'Buenos Aires, Argentina',
  'Córdoba, Argentina',
  'Rosario, Argentina',
  'Mendoza, Argentina',
  'São Paulo, Brasil',
  'Río de Janeiro, Brasil',
  'Brasilia, Brasil',
  'Belo Horizonte, Brasil',
  'Santiago, Chile',
  'Valparaíso, Chile',
  'Bogotá, Colombia',
  'Medellín, Colombia',
  'Cali, Colombia',
  'Cartagena, Colombia',
  'Ciudad de México, México',
  'Guadalajara, México',
  'Monterrey, México',
  'Cancún, México',
  'Lima, Perú',
  'Cusco, Perú',
  'Arequipa, Perú',
  'Caracas, Venezuela',
  'Quito, Ecuador',
  'Guayaquil, Ecuador',
  'Montevideo, Uruguay',
  'Asunción, Paraguay',
  'La Paz, Bolivia',
  'San José, Costa Rica',
  'Panamá, Panamá',
  'San Salvador, El Salvador',
  'Managua, Nicaragua',
  'Tegucigalpa, Honduras',
  'Guatemala, Guatemala',
  'Santo Domingo, República Dominicana',
  'La Habana, Cuba',

  // América del Norte
  'Nueva York, Estados Unidos',
  'Los Ángeles, Estados Unidos',
  'Chicago, Estados Unidos',
  'Houston, Estados Unidos',
  'Miami, Estados Unidos',
  'San Francisco, Estados Unidos',
  'Seattle, Estados Unidos',
  'Boston, Estados Unidos',
  'Austin, Estados Unidos',
  'Denver, Estados Unidos',
  'Atlanta, Estados Unidos',
  'Las Vegas, Estados Unidos',
  'Toronto, Canadá',
  'Vancouver, Canadá',
  'Montreal, Canadá',
  'Calgary, Canadá',
  'Ottawa, Canadá',

  // Europa
  'Madrid, España',
  'Barcelona, España',
  'Valencia, España',
  'Sevilla, España',
  'Bilbao, España',
  'Málaga, España',
  'Londres, Reino Unido',
  'Manchester, Reino Unido',
  'Edimburgo, Reino Unido',
  'París, Francia',
  'Lyon, Francia',
  'Marsella, Francia',
  'Berlín, Alemania',
  'Múnich, Alemania',
  'Frankfurt, Alemania',
  'Hamburgo, Alemania',
  'Roma, Italia',
  'Milán, Italia',
  'Florencia, Italia',
  'Venecia, Italia',
  'Ámsterdam, Países Bajos',
  'Rotterdam, Países Bajos',
  'Bruselas, Bélgica',
  'Zúrich, Suiza',
  'Ginebra, Suiza',
  'Viena, Austria',
  'Praga, República Checa',
  'Varsovia, Polonia',
  'Budapest, Hungría',
  'Lisboa, Portugal',
  'Oporto, Portugal',
  'Dublín, Irlanda',
  'Estocolmo, Suecia',
  'Copenhague, Dinamarca',
  'Oslo, Noruega',
  'Helsinki, Finlandia',
  'Atenas, Grecia',

  // Asia
  'Tokio, Japón',
  'Osaka, Japón',
  'Kioto, Japón',
  'Seúl, Corea del Sur',
  'Shanghái, China',
  'Pekín, China',
  'Hong Kong, China',
  'Shenzhen, China',
  'Singapur, Singapur',
  'Bangkok, Tailandia',
  'Manila, Filipinas',
  'Jakarta, Indonesia',
  'Ho Chi Minh, Vietnam',
  'Hanói, Vietnam',
  'Bombay, India',
  'Nueva Delhi, India',
  'Bangalore, India',
  'Dubái, Emiratos Árabes Unidos',
  'Abu Dabi, Emiratos Árabes Unidos',
  'Tel Aviv, Israel',

  // Oceanía
  'Sídney, Australia',
  'Melbourne, Australia',
  'Brisbane, Australia',
  'Perth, Australia',
  'Auckland, Nueva Zelanda',
  'Wellington, Nueva Zelanda',

  // África
  'Ciudad del Cabo, Sudáfrica',
  'Johannesburgo, Sudáfrica',
  'El Cairo, Egipto',
  'Nairobi, Kenia',
  'Lagos, Nigeria',
  'Casablanca, Marruecos',
];

const PreferencesSection: React.FC<PreferencesSectionProps> = ({ initialData, onSave, onNext }) => {
  const translations = useTranslations();
  const { lang, setLang } = useLanguage();
  const t = translations.dashboard.preferences;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
    reset,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: initialData || {},
  });

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: PreferencesFormData) => {
    await onSave(data);
    if (onNext) {
      onNext();
    }
  };

  const handleLanguageChange = (newLang: 'en' | 'es') => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* Job Preferences Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.jobPreferences.title}</h3>
          <div className="space-y-6">
            {/* Job Seeking Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobPreferences.seekingStatus || 'Estado de Búsqueda'}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t.jobPreferences.seekingStatusDescription || 'Indica si estás buscando activamente oportunidades laborales'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {JOB_SEEKING_STATUS_OPTIONS.map((status) => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      {...register('job_seeking_status')}
                      type="radio"
                      value={status}
                      className="w-4 h-4 text-cv-blue border-gray-300 focus:ring-cv-blue"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {status === 'OPEN' && (t.jobPreferences.seekingOpen || 'Busco Activamente')}
                      {status === 'PASSIVE' && (t.jobPreferences.seekingPassive || 'Abierto a Ofertas')}
                      {status === 'NOT_LOOKING' && (t.jobPreferences.seekingNotLooking || 'No Busco Actualmente')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

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
                render={({ field }) => {
                  const selectedLocations = field.value || [];
                  const availableCities = POPULAR_CITIES.filter(city => !selectedLocations.includes(city));

                  return (
                    <div className="space-y-3">
                      {/* Selected Cities */}
                      {selectedLocations.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg border border-gray-200 dark:border-dark-border">
                          {selectedLocations.map((location, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-cv-blue text-white rounded-full text-sm"
                            >
                              {location}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = selectedLocations.filter((_, i) => i !== index);
                                  field.onChange(updated);
                                }}
                                className="ml-1 hover:bg-cv-blue-dark rounded-full p-0.5"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* City Selector */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            field.onChange([...selectedLocations, e.target.value]);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      >
                        <option value="">Selecciona una ciudad...</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Selecciona las ciudades donde estarías dispuesto a trabajar
                      </p>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-border">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            Siguiente
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesSection;
