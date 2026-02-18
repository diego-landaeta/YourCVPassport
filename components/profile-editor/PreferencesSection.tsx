import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PreferencesFormData } from '../../schemas/profileSchemas';
import { getProfileSchemas } from '../../schemas/getProfileSchemas';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToastContext } from '../../contexts/ToastContext';

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

// Ciudades organizadas por país
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Neuquén', 'Bariloche', 'Corrientes', 'Bahía Blanca', 'Formosa', 'Posadas', 'San Luis', 'Río Cuarto', 'Tandil', 'Ushuaia', 'Puerto Madryn'],
  'Brasil': ['São Paulo', 'Río de Janeiro', 'Brasilia', 'Belo Horizonte', 'Salvador', 'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Manaus', 'Belém', 'Goiânia', 'Campinas', 'Florianópolis', 'São Luís', 'Maceió', 'Natal', 'Campo Grande', 'João Pessoa', 'Teresina', 'Santos', 'Ribeirão Preto', 'Sorocaba', 'Vitória', 'Aracaju', 'Cuiabá'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Viña del Mar', 'Puerto Montt', 'Iquique', 'Talca', 'Rancagua', 'Arica', 'Punta Arenas', 'Osorno', 'Valdivia', 'Chillán', 'Copiapó', 'Los Ángeles', 'Coyhaique'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Cartagena', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Manizales', 'Cúcuta', 'Ibagué', 'Villavicencio', 'Pasto', 'Montería', 'Neiva', 'Armenia', 'Popayán', 'Sincelejo', 'Valledupar', 'Riohacha', 'Tunja', 'Quibdó'],
  'México': ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla', 'Tijuana', 'León', 'Querétaro', 'Mérida', 'San Luis Potosí', 'Aguascalientes', 'Playa del Carmen', 'Oaxaca', 'Veracruz', 'Morelia', 'Toluca', 'Saltillo', 'Chihuahua', 'Hermosillo', 'Culiacán', 'Tuxtla Gutiérrez', 'Acapulco', 'Mazatlán', 'Puerto Vallarta', 'Cozumel', 'Los Cabos', 'Tulum'],
  'Perú': ['Lima', 'Cusco', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Huancayo', 'Tacna', 'Ayacucho', 'Pucallpa', 'Cajamarca', 'Juliaca', 'Puno', 'Chimbote', 'Huaraz', 'Tarapoto', 'Tumbes', 'Ica', 'Sullana'],
  'Venezuela': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Maturín', 'Barcelona', 'Mérida', 'San Cristóbal', 'Puerto La Cruz', 'Cumaná', 'Los Teques', 'Punto Fijo', 'Cabimas', 'Guarenas', 'Ciudad Bolívar'],
  'Ecuador': ['Quito', 'Guayaquil', 'Cuenca', 'Manta', 'Ambato', 'Portoviejo', 'Loja', 'Machala', 'Santo Domingo', 'Esmeraldas', 'Riobamba', 'Ibarra', 'Milagro', 'Quevedo', 'Latacunga', 'Salinas', 'Babahoyo'],
  'Uruguay': ['Montevideo', 'Punta del Este', 'Salto', 'Maldonado', 'Colonia del Sacramento', 'Rivera', 'Paysandú', 'Las Piedras', 'Tacuarembó', 'Mercedes', 'Melo', 'Fray Bentos', 'Rocha'],
  'Paraguay': ['Asunción', 'Ciudad del Este', 'Encarnación', 'Luque', 'San Lorenzo', 'Caaguazú', 'Lambaré', 'Fernando de la Mora', 'Nemby', 'Pedro Juan Caballero', 'Concepción', 'Villarrica'],
  'Bolivia': ['La Paz', 'Santa Cruz de la Sierra', 'Cochabamba', 'Sucre', 'Tarija', 'Potosí', 'Oruro', 'Trinidad', 'Cobija', 'Riberalta', 'Yacuiba', 'Montero', 'Quillacollo'],
  'Costa Rica': ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Liberia', 'Puntarenas', 'Limón', 'San Isidro', 'Jacó', 'Quepos', 'Tamarindo', 'Manuel Antonio', 'La Fortuna'],
  'Panamá': ['Ciudad de Panamá', 'David', 'Colón', 'Santiago de Veraguas', 'Chitré', 'La Chorrera', 'Penonome', 'Bocas del Toro', 'Boquete', 'El Valle'],
  'El Salvador': ['San Salvador', 'Santa Ana', 'San Miguel', 'Soyapango', 'Mejicanos', 'San Martín', 'Apopa', 'Delgado', 'Sonsonate', 'La Libertad', 'Usulután'],
  'Nicaragua': ['Managua', 'León', 'Granada', 'Masaya', 'Matagalpa', 'Chinandega', 'Estelí', 'Jinotega', 'Juigalpa', 'San Juan del Sur', 'Bluefields'],
  'Honduras': ['Tegucigalpa', 'San Pedro Sula', 'La Ceiba', 'Choloma', 'El Progreso', 'Comayagua', 'Choluteca', 'Roatán', 'Copán', 'Utila'],
  'Guatemala': ['Ciudad de Guatemala', 'Antigua', 'Quetzaltenango', 'Escuintla', 'Mixco', 'Villa Nueva', 'Petapa', 'Cobán', 'Huehuetenango', 'Flores', 'Panajachel', 'Chichicastenango', 'Tikal'],
  'República Dominicana': ['Santo Domingo', 'Santiago de los Caballeros', 'Punta Cana', 'La Romana', 'San Pedro de Macorís', 'Puerto Plata', 'Bávaro', 'Samaná', 'Jarabacoa', 'Las Terrenas', 'Cabarete', 'Sosúa'],
  'Estados Unidos': ['Nueva York', 'Los Ángeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Seattle', 'Boston', 'Austin', 'Denver', 'Atlanta', 'Las Vegas', 'Washington DC', 'Philadelphia', 'Phoenix', 'San Diego', 'Dallas', 'San Antonio', 'Portland', 'Nashville', 'Charlotte', 'Orlando', 'Tampa', 'Detroit', 'Minneapolis', 'Baltimore', 'St. Louis', 'Cleveland', 'Pittsburgh', 'Sacramento', 'San Jose', 'Indianapolis', 'Columbus', 'Milwaukee', 'Kansas City', 'Raleigh', 'New Orleans', 'Salt Lake City', 'Richmond', 'Memphis', 'Louisville'],
  'Canadá': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Quebec', 'Winnipeg', 'Hamilton', 'Victoria', 'Halifax', 'Kitchener', 'London', 'Regina', 'Saskatoon', 'Sherbrooke', 'Kelowna', 'Abbotsford', 'Kingston', 'Guelph', 'Whistler', 'Niagara Falls', 'Banff'],
  'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Murcia', 'Palma de Mallorca', 'Las Palmas', 'Alicante', 'Granada', 'San Sebastián', 'Santander', 'Salamanca', 'Toledo', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Tarragona', 'Cádiz', 'Pamplona', 'Burgos', 'Logroño', 'Segovia', 'Ávila', 'Marbella', 'Ibiza', 'Menorca', 'Santiago de Compostela'],
  'Reino Unido': ['Londres', 'Manchester', 'Edimburgo', 'Birmingham', 'Liverpool', 'Glasgow', 'Bristol', 'Leeds', 'Sheffield', 'Newcastle', 'Cardiff', 'Belfast', 'Nottingham', 'Cambridge', 'Oxford', 'Leicester', 'Coventry', 'Bradford', 'Southampton', 'Portsmouth', 'Brighton', 'Plymouth', 'York', 'Bath', 'Inverness', 'Aberdeen', 'Dundee', 'Stirling'],
  'Francia': ['París', 'Lyon', 'Marsella', 'Toulouse', 'Niza', 'Nantes', 'Estrasburgo', 'Montpellier', 'Burdeos', 'Lille', 'Rennes', 'Reims', 'Cannes', 'Angers', 'Dijon', 'Grenoble', 'Aix-en-Provence', 'Tours', 'Limoges', 'Clermont-Ferrand', 'Nancy', 'Aviñón', 'Mónaco', 'Nimes', 'Perpignan', 'Metz', 'Toulon', 'Biarritz'],
  'Alemania': ['Berlín', 'Múnich', 'Frankfurt', 'Hamburgo', 'Colonia', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresde', 'Hannover', 'Núremberg', 'Bonn', 'Mannheim', 'Karlsruhe', 'Wiesbaden', 'Münster', 'Augsburgo', 'Chemnitz', 'Heidelberg', 'Friburgo', 'Potsdam', 'Lübeck', 'Rostock', 'Erfurt', 'Kassel'],
  'Italia': ['Roma', 'Milán', 'Florencia', 'Venecia', 'Nápoles', 'Turín', 'Bolonia', 'Palermo', 'Génova', 'Verona', 'Pisa', 'Rimini', 'Parma', 'Catania', 'Bari', 'Messina', 'Padua', 'Trieste', 'Brescia', 'Siena', 'Perugia', 'Como', 'Bergamo', 'Módena', 'Ferrara', 'Vicenza', 'Amalfi', 'Sorrento', 'Capri', 'Taormina'],
  'Países Bajos': ['Ámsterdam', 'Rotterdam', 'La Haya', 'Utrecht', 'Eindhoven', 'Groningen', 'Maastricht', 'Tilburg', 'Breda', 'Leiden', 'Haarlem', 'Delft', 'Nijmegen', 'Arnhem', 'Zwolle', 'Apeldoorn'],
  'Bélgica': ['Bruselas', 'Amberes', 'Gante', 'Brujas', 'Lieja', 'Lovaina', 'Namur', 'Charleroi', 'Mons', 'Ostende', 'Malinas', 'Dinant', 'Spa', 'Waterloo'],
  'Suiza': ['Zúrich', 'Ginebra', 'Basilea', 'Lausana', 'Berna', 'Lucerna', 'Lugano', 'San Galo', 'Winterthur', 'Interlaken', 'Zermatt', 'Montreux', 'Locarno', 'Bellinzona', 'Neuchâtel'],
  'Austria': ['Viena', 'Salzburgo', 'Graz', 'Innsbruck', 'Linz', 'Klagenfurt', 'Villach', 'Wels', 'Hallstatt', 'St. Anton', 'Bad Gastein'],
  'República Checa': ['Praga', 'Brno', 'Ostrava', 'Pilsen', 'Liberec', 'Olomouc', 'Karlovy Vary', 'České Budějovice', 'Hradec Králové', 'Český Krumlov'],
  'Polonia': ['Varsovia', 'Cracovia', 'Gdansk', 'Wrocław', 'Poznán', 'Łódź', 'Szczecin', 'Lublin', 'Katowice', 'Bydgoszcz', 'Toruń', 'Zakopane', 'Gdynia', 'Sopot'],
  'Hungría': ['Budapest', 'Debrecen', 'Szeged', 'Pécs', 'Miskolc', 'Győr', 'Eger', 'Hévíz', 'Sopron', 'Kecskemét'],
  'Portugal': ['Lisboa', 'Oporto', 'Braga', 'Coimbra', 'Funchal', 'Faro', 'Évora', 'Aveiro', 'Setúbal', 'Guimarães', 'Sintra', 'Cascais', 'Óbidos', 'Lagos', 'Albufeira', 'Viseu', 'Ponta Delgada'],
  'Irlanda': ['Dublín', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Killarney', 'Derry', 'Drogheda', 'Bray', 'Ennis', 'Sligo'],
  'Suecia': ['Estocolmo', 'Gotemburgo', 'Malmö', 'Upsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Kiruna'],
  'Dinamarca': ['Copenhague', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Helsingør'],
  'Noruega': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Ålesund', 'Bodø', 'Molde', 'Narvik'],
  'Finlandia': ['Helsinki', 'Espoo', 'Tampere', 'Turku', 'Oulu', 'Vantaa', 'Lahti', 'Kuopio', 'Jyväskylä', 'Pori', 'Lappeenranta', 'Rovaniemi', 'Vaasa'],
  'Grecia': ['Atenas', 'Tesalónica', 'Patras', 'Heraclión', 'Corfú', 'Rodas', 'Mykonos', 'Santorini', 'Larisa', 'Volos', 'Ioannina', 'Kavala', 'Chania', 'Naxos', 'Paros', 'Meteora', 'Delfos'],
  'Japón': ['Tokio', 'Osaka', 'Kioto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Hiroshima', 'Nara', 'Kawasaki', 'Saitama', 'Sendai', 'Chiba', 'Kitakyushu', 'Niigata', 'Hamamatsu', 'Kumamoto', 'Kagoshima', 'Kanazawa', 'Hakone', 'Nikko', 'Takayama'],
  'Corea del Sur': ['Seúl', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Jeju', 'Suwon', 'Ulsan', 'Jeonju', 'Gyeongju', 'Sokcho', 'Andong', 'Pohang'],
  'China': ['Shanghái', 'Pekín', 'Hong Kong', 'Shenzhen', 'Guangzhou', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Nanjing', 'Tianjin', 'Chongqing', 'Suzhou', 'Qingdao', 'Dalian', 'Xiamen', 'Kunming', 'Harbin', 'Shenyang', 'Macau', 'Guilin', 'Lijiang', 'Zhengzhou'],
  'Singapur': ['Singapur'],
  'Tailandia': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Hua Hin', 'Koh Samui', 'Ayutthaya', 'Koh Phi Phi', 'Chiang Rai', 'Sukhothai', 'Pai', 'Kanchanaburi', 'Railay Beach'],
  'Filipinas': ['Manila', 'Cebú', 'Davao', 'Makati', 'Boracay', 'Palawan', 'Baguio', 'Iloilo', 'Zamboanga', 'Bacolod', 'El Nido', 'Siargao', 'Vigan', 'Tagaytay'],
  'Indonesia': ['Jakarta', 'Bali', 'Surabaya', 'Bandung', 'Yogyakarta', 'Medan', 'Semarang', 'Malang', 'Lombok', 'Makassar', 'Palembang', 'Ubud', 'Gili Islands', 'Bromo'],
  'Vietnam': ['Ho Chi Minh', 'Hanói', 'Da Nang', 'Hue', 'Nha Trang', 'Hoi An', 'Halong Bay', 'Can Tho', 'Dalat', 'Phu Quoc', 'Sapa', 'Mui Ne', 'Vung Tau'],
  'India': ['Bombay', 'Nueva Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Calcuta', 'Ahmedabad', 'Jaipur', 'Goa', 'Agra', 'Varanasi', 'Udaipur', 'Kochi', 'Mysore', 'Amritsar', 'Chandigarh', 'Lucknow', 'Indore', 'Surat', 'Jodhpur'],
  'Emiratos Árabes Unidos': ['Dubái', 'Abu Dabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman', 'Fujairah', 'Al Ain'],
  'Israel': ['Tel Aviv', 'Jerusalén', 'Haifa', 'Eilat', 'Beersheba', 'Netanya', 'Herzliya', 'Ashdod', 'Tiberias', 'Caesarea'],
  'Australia': ['Sídney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaida', 'Gold Coast', 'Canberra', 'Hobart', 'Darwin', 'Cairns', 'Byron Bay', 'Sunshine Coast', 'Newcastle', 'Wollongong', 'Geelong', 'Townsville', 'Ballarat', 'Bendigo', 'Launceston', 'Albury'],
  'Nueva Zelanda': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Dunedin', 'Queenstown', 'Rotorua', 'Tauranga', 'Nelson', 'Napier', 'Palmerston North', 'Invercargill', 'Wanaka', 'Te Anau'],
  'Sudáfrica': ['Ciudad del Cabo', 'Johannesburgo', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Knysna', 'Stellenbosch', 'Hermanus', 'Kruger Park', 'Nelspruit'],
  'Egipto': ['El Cairo', 'Alejandría', 'Giza', 'Luxor', 'Sharm el-Sheikh', 'Hurghada', 'Asuán', 'Dahab', 'Marsa Alam', 'Port Said', 'Suez'],
  'Kenia': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Malindi', 'Lamu', 'Naivasha'],
  'Nigeria': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City', 'Kaduna', 'Enugu', 'Calabar', 'Owerri'],
  'Marruecos': ['Casablanca', 'Rabat', 'Marrakech', 'Fez', 'Tánger', 'Agadir', 'Meknes', 'Essaouira', 'Chefchaouen', 'Ouarzazate', 'Tetuán', 'Asilah'],
};

const PreferencesSection: React.FC<PreferencesSectionProps> = ({ initialData, onSave, onNext }) => {
  const translations = useTranslations();
  const { lang, setLang } = useLanguage();
  const toast = useToastContext();
  const t = translations.dashboard.preferences;
  const [selectedCountry, setSelectedCountry] = React.useState<string>('');

  // Get schema with translated error messages
  const { preferencesSchema } = useMemo(() => getProfileSchemas(translations), [translations]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
    reset,
    getValues,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      ...initialData,
      preferred_locations: Array.isArray(initialData?.preferred_locations)
        ? initialData.preferred_locations
        : [],
    },
  });

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        preferred_locations: Array.isArray(initialData.preferred_locations)
          ? initialData.preferred_locations
          : [],
      });
    }
  }, [initialData, reset]);

  // Listen for auto-save event from wizard
  React.useEffect(() => {
    const handleAutoSave = async () => {
      const formValues = getValues();

      // VALIDACIÓN: Al menos un campo debe estar lleno
      const hasAtLeastOneField =
        formValues.job_seeking_status ||
        formValues.availability ||
        formValues.salary_min ||
        formValues.salary_max ||
        formValues.willing_to_relocate ||
        (formValues.preferred_locations && formValues.preferred_locations.length > 0);

      if (!hasAtLeastOneField) {
        // Mostrar error si no hay ningún campo lleno
        toast.error(translations.preferencesToasts.completePreferences);
        // Lanzar evento de error para que el wizard no marque como completado
        window.dispatchEvent(new CustomEvent('auto-save-preferences-error'));
        return;
      }

      // Solo guardar si hay cambios pendientes
      if (isDirty) {
        await onSave(formValues);
        toast.success(translations.preferencesToasts.savedAutomatically);
      }

      // Lanzar evento de éxito
      window.dispatchEvent(new CustomEvent('auto-save-preferences-success'));
    };

    window.addEventListener('auto-save-preferences', handleAutoSave);
    return () => window.removeEventListener('auto-save-preferences', handleAutoSave);
  }, [isDirty, onSave, getValues, toast, lang]);

  const onSubmit = async (data: PreferencesFormData) => {
    console.log('🔵 PreferencesSection onSubmit called with data:', data);
    console.log('🔵 Form errors:', errors);
    console.log('🔵 isDirty:', isDirty);

    try {
      // Only save if there are actual changes
      if (isDirty) {
        await onSave(data);
        toast.success(translations.preferencesToasts.savedSuccessfully);
      }

      // ALWAYS advance to next section (even if no changes to save)
      // This allows users to skip preferences and go to finalization
      if (onNext) {
        console.log('🔵 Calling onNext()');
        onNext();
      } else {
        console.log('❌ onNext is not defined');
      }
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      toast.error(translations.preferencesToasts.errorSaving);
      // Even on error, try to advance (user can come back later)
      if (onNext) {
        onNext();
      }
    }
  };

  const onError = (formErrors: any) => {
    console.log('❌ Form validation failed with errors:', formErrors);
    console.log('❌ All form errors object:', errors);
    console.log('❌ Current form values:', watch());
  };

  const handleLanguageChange = (newLang: 'en' | 'es') => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  // Validate salary input to prevent values greater than 1,000,000 (max 7 digits)
  const handleSalaryInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let value = input.value;

    // Remove any non-numeric characters
    value = value.replace(/[^\d]/g, '');

    // Limit to 7 digits maximum (1,000,000)
    if (value.length > 7) {
      value = value.slice(0, 7);
    }

    // Update input value
    input.value = value;
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate className="space-y-8">
        {/* Job Preferences Section */}
        <div>
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
                    max="1000000"
                    onInput={handleSalaryInput}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                    placeholder={t.jobPreferences.minSalary}
                  />
                  {errors.salary_min && (
                    <p className="text-red-500 text-sm mt-1">{errors.salary_min.message}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register('salary_max', { valueAsNumber: true })}
                    type="number"
                    max="1000000"
                    onInput={handleSalaryInput}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                    placeholder={t.jobPreferences.maxSalary}
                  />
                  {errors.salary_max && (
                    <p className="text-red-500 text-sm mt-1">{errors.salary_max.message}</p>
                  )}
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

            {/* Preferred Locations - Only show if willing to relocate */}
            {watch('willing_to_relocate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.jobPreferences.preferredLocations}
                </label>
                <Controller
                  name="preferred_locations"
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => {
                    // Ensure field.value is always an array
                    const selectedLocations = Array.isArray(field.value) ? field.value : [];
                    const countries = Object.keys(CITIES_BY_COUNTRY).sort();
                    const availableCities = selectedCountry ? CITIES_BY_COUNTRY[selectedCountry].filter(
                      city => !selectedLocations.includes(`${city}, ${selectedCountry}`)
                    ) : [];

                    return (
                      <div className="space-y-3">
                        {/* Selected Cities */}
                        {selectedLocations.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg border border-gray-200 dark:border-dark-border">
                            {selectedLocations.map((location: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-cv-blue text-white rounded-full text-sm"
                              >
                                {location}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedLocations.filter((_: string, i: number) => i !== index);
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Country Selector */}
                          <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                          >
                            <option value="">{t.jobPreferences.selectCountry}</option>
                            {countries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>

                          {/* City Selector - Only visible when country is selected */}
                          <select
                            disabled={!selectedCountry}
                            onChange={(e) => {
                              if (e.target.value && selectedCountry) {
                                field.onChange([...selectedLocations, `${e.target.value}, ${selectedCountry}`]);
                                e.target.value = '';
                                setSelectedCountry(''); // Reset country selector after adding city
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {selectedCountry ? t.jobPreferences.selectCity : t.jobPreferences.firstSelectCountry}
                            </option>
                            {availableCities.map((city: string) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-border">
          <button
            type="submit"
            onClick={() => {
              console.log('🔴 Button clicked - checking form errors:', errors);
              console.log('🔴 Form values:', watch());
            }}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            {translations.common?.next || 'Next'}
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
