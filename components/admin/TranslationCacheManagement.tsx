import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  LanguageIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface CachedTranslation {
  id: string;
  profile_id: string;
  target_language: string;
  source_content_hash: string;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    slug: string;
  };
}

interface CachedTextTranslation {
  id: string;
  text_hash: string;
  source_lang: string;
  target_lang: string;
  original_text: string;
  translated_text: string;
  created_at: string;
  hit_count: number;
}

interface CacheStats {
  total: number;
  spanish: number;
  english: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

interface TextCacheStats {
  total: number;
  toSpanish: number;
  toEnglish: number;
  totalHits: number;
  newestEntry: string | null;
}

type ActiveTab = 'profiles' | 'texts';

const TranslationCacheManagement: React.FC = () => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profiles');

  // Profile translations state
  const [translations, setTranslations] = useState<CachedTranslation[]>([]);
  const [stats, setStats] = useState<CacheStats>({
    total: 0,
    spanish: 0,
    english: 0,
    oldestEntry: null,
    newestEntry: null,
  });

  // Text translations state
  const [textTranslations, setTextTranslations] = useState<CachedTextTranslation[]>([]);
  const [textStats, setTextStats] = useState<TextCacheStats>({
    total: 0,
    toSpanish: 0,
    toEnglish: 0,
    totalHits: 0,
    newestEntry: null,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'es' | 'en'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const t = {
    en: {
      title: 'Translation Cache',
      subtitle: 'Manage cached translations',
      tabs: {
        profiles: 'Profile Translations',
        texts: 'Text Translations',
      },
      stats: {
        total: 'Total Cached',
        spanish: 'Spanish',
        english: 'English',
        oldest: 'Oldest Entry',
        newest: 'Newest Entry',
        toSpanish: 'To Spanish',
        toEnglish: 'To English',
        totalHits: 'Total Hits',
      },
      table: {
        profile: 'Profile',
        language: 'Target Language',
        hash: 'Content Hash',
        created: 'Created',
        updated: 'Last Updated',
        actions: 'Actions',
        originalText: 'Original Text',
        translatedText: 'Translated Text',
        direction: 'Direction',
        hitCount: 'Hit Count',
      },
      filters: {
        search: 'Search by profile name...',
        searchText: 'Search by text content...',
        all: 'All Languages',
        spanish: 'Spanish',
        english: 'English',
      },
      actions: {
        refresh: 'Refresh',
        clearAll: 'Clear All Cache',
        delete: 'Delete',
        confirmClearAll: 'Are you sure you want to clear ALL translation cache? This will force re-translation for all profiles.',
        confirmClearAllTexts: 'Are you sure you want to clear ALL text translations cache?',
        confirmDelete: 'Delete this cached translation?',
      },
      empty: 'No cached translations found',
      emptyTexts: 'No cached text translations found',
      loading: 'Loading...',
    },
    es: {
      title: 'Caché de Traducciones',
      subtitle: 'Gestiona las traducciones cacheadas',
      tabs: {
        profiles: 'Traducciones de Perfiles',
        texts: 'Traducciones de Texto',
      },
      stats: {
        total: 'Total en Caché',
        spanish: 'Español',
        english: 'Inglés',
        oldest: 'Entrada más Antigua',
        newest: 'Entrada más Reciente',
        toSpanish: 'A Español',
        toEnglish: 'A Inglés',
        totalHits: 'Hits Totales',
      },
      table: {
        profile: 'Perfil',
        language: 'Idioma Destino',
        hash: 'Hash de Contenido',
        created: 'Creado',
        updated: 'Última Actualización',
        actions: 'Acciones',
        originalText: 'Texto Original',
        translatedText: 'Texto Traducido',
        direction: 'Dirección',
        hitCount: 'Nº de Usos',
      },
      filters: {
        search: 'Buscar por nombre de perfil...',
        searchText: 'Buscar por contenido de texto...',
        all: 'Todos los Idiomas',
        spanish: 'Español',
        english: 'Inglés',
      },
      actions: {
        refresh: 'Actualizar',
        clearAll: 'Limpiar Todo el Caché',
        delete: 'Eliminar',
        confirmClearAll: '¿Estás seguro de que quieres limpiar TODO el caché de traducciones? Esto forzará re-traducción para todos los perfiles.',
        confirmClearAllTexts: '¿Estás seguro de que quieres limpiar TODO el caché de traducciones de texto?',
        confirmDelete: '¿Eliminar esta traducción cacheada?',
      },
      empty: 'No se encontraron traducciones en caché',
      emptyTexts: 'No se encontraron traducciones de texto en caché',
      loading: 'Cargando...',
    },
  };

  const translations_t = t[lang];

  useEffect(() => {
    fetchTranslations();
    fetchTextTranslations();
  }, []);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      // Fetch translations with profile info
      const { data, error } = await supabase
        .from('profile_translations')
        .select(`
          id,
          profile_id,
          target_language,
          source_content_hash,
          created_at,
          updated_at,
          profiles:profile_id (
            full_name,
            slug
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        profile: item.profiles,
      }));

      setTranslations(transformedData);

      // Calculate stats
      const spanishCount = transformedData.filter((t: CachedTranslation) => t.target_language === 'es').length;
      const englishCount = transformedData.filter((t: CachedTranslation) => t.target_language === 'en').length;

      const sortedByDate = [...transformedData].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setStats({
        total: transformedData.length,
        spanish: spanishCount,
        english: englishCount,
        oldestEntry: sortedByDate[0]?.created_at || null,
        newestEntry: sortedByDate[sortedByDate.length - 1]?.created_at || null,
      });
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTextTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('text_translations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTextTranslations(data || []);

      // Calculate stats
      const toSpanishCount = (data || []).filter((t: CachedTextTranslation) => t.target_lang === 'es').length;
      const toEnglishCount = (data || []).filter((t: CachedTextTranslation) => t.target_lang === 'en').length;
      const totalHits = (data || []).reduce((acc: number, t: CachedTextTranslation) => acc + (t.hit_count || 0), 0);

      const sortedByDate = [...(data || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setTextStats({
        total: (data || []).length,
        toSpanish: toSpanishCount,
        toEnglish: toEnglishCount,
        totalHits,
        newestEntry: sortedByDate[sortedByDate.length - 1]?.created_at || null,
      });
    } catch (error) {
      console.error('Error fetching text translations:', error);
    }
  };

  const handleDeleteCache = async (id: string) => {
    if (!confirm(translations_t.actions.confirmDelete)) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('profile_translations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTranslations(prev => prev.filter(t => t.id !== id));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (error) {
      console.error('Error deleting cache:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAllCache = async () => {
    if (!confirm(translations_t.actions.confirmClearAll)) return;

    setClearingAll(true);
    try {
      const { error } = await supabase
        .from('profile_translations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      setTranslations([]);
      setStats({
        total: 0,
        spanish: 0,
        english: 0,
        oldestEntry: null,
        newestEntry: null,
      });
    } catch (error) {
      console.error('Error clearing all cache:', error);
    } finally {
      setClearingAll(false);
    }
  };

  const handleDeleteTextCache = async (id: string) => {
    if (!confirm(translations_t.actions.confirmDelete)) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('text_translations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTextTranslations(prev => prev.filter(t => t.id !== id));
      setTextStats(prev => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (error) {
      console.error('Error deleting text cache:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAllTextCache = async () => {
    if (!confirm(translations_t.actions.confirmClearAllTexts)) return;

    setClearingAll(true);
    try {
      const { error } = await supabase
        .from('text_translations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      setTextTranslations([]);
      setTextStats({
        total: 0,
        toSpanish: 0,
        toEnglish: 0,
        totalHits: 0,
        newestEntry: null,
      });
    } catch (error) {
      console.error('Error clearing all text cache:', error);
    } finally {
      setClearingAll(false);
    }
  };

  const filteredTranslations = translations.filter(t => {
    const matchesSearch = !searchQuery ||
      t.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.profile?.slug?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage = selectedLanguage === 'all' || t.target_language === selectedLanguage;

    return matchesSearch && matchesLanguage;
  });

  const filteredTextTranslations = textTranslations.filter(t => {
    const matchesSearch = !searchQuery ||
      t.original_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.translated_text?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage = selectedLanguage === 'all' || t.target_lang === selectedLanguage;

    return matchesSearch && matchesLanguage;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
            <LanguageIcon className="h-6 w-6" />
            {translations_t.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
            {translations_t.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchTranslations();
              fetchTextTranslations();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {translations_t.actions.refresh}
          </button>
          <button
            onClick={activeTab === 'profiles' ? handleClearAllCache : handleClearAllTextCache}
            disabled={clearingAll || (activeTab === 'profiles' ? translations.length === 0 : textTranslations.length === 0)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearingAll ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
            {translations_t.actions.clearAll}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('profiles'); setSearchQuery(''); }}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profiles'
                ? 'border-cv-blue text-cv-blue dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary'
            }`}
          >
            <UserIcon className="h-5 w-5" />
            {translations_t.tabs.profiles}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'profiles'
                ? 'bg-cv-blue/10 text-cv-blue dark:bg-blue-400/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary'
            }`}>
              {stats.total}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('texts'); setSearchQuery(''); }}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'texts'
                ? 'border-cv-blue text-cv-blue dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary'
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            {translations_t.tabs.texts}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'texts'
                ? 'bg-cv-blue/10 text-cv-blue dark:bg-blue-400/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary'
            }`}>
              {textStats.total}
            </span>
          </button>
        </nav>
      </div>

      {/* Stats Cards - Profile Translations */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <DocumentTextIcon className="h-4 w-4" />
              {translations_t.stats.total}
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-amber-100 text-sm">
              <LanguageIcon className="h-4 w-4" />
              {translations_t.stats.spanish}
            </div>
            <p className="text-2xl font-bold mt-1">{stats.spanish}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-emerald-100 text-sm">
              <LanguageIcon className="h-4 w-4" />
              {translations_t.stats.english}
            </div>
            <p className="text-2xl font-bold mt-1">{stats.english}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-purple-100 text-sm">
              <ClockIcon className="h-4 w-4" />
              {translations_t.stats.newest}
            </div>
            <p className="text-sm font-medium mt-1">
              {stats.newestEntry ? formatDate(stats.newestEntry) : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards - Text Translations */}
      {activeTab === 'texts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              {translations_t.stats.total}
            </div>
            <p className="text-2xl font-bold mt-1">{textStats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-amber-100 text-sm">
              <LanguageIcon className="h-4 w-4" />
              {translations_t.stats.toSpanish}
            </div>
            <p className="text-2xl font-bold mt-1">{textStats.toSpanish}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-emerald-100 text-sm">
              <LanguageIcon className="h-4 w-4" />
              {translations_t.stats.toEnglish}
            </div>
            <p className="text-2xl font-bold mt-1">{textStats.toEnglish}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 text-purple-100 text-sm">
              <ArrowPathIcon className="h-4 w-4" />
              {translations_t.stats.totalHits}
            </div>
            <p className="text-2xl font-bold mt-1">{textStats.totalHits}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'profiles' ? translations_t.filters.search : translations_t.filters.searchText}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
          />
        </div>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as 'all' | 'es' | 'en')}
          className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
        >
          <option value="all">{translations_t.filters.all}</option>
          <option value="es">{translations_t.filters.spanish}</option>
          <option value="en">{translations_t.filters.english}</option>
        </select>
      </div>

      {/* Profile Translations Table */}
      {activeTab === 'profiles' && (
        <>
          {filteredTranslations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
              <LanguageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-dark-text-secondary">
                {translations_t.empty}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.profile}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.language}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.hash}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.updated}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                  {filteredTranslations.map((translation) => (
                    <tr key={translation.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-dark-bg-tertiary rounded-full">
                            <UserIcon className="h-5 w-5 text-gray-500 dark:text-dark-text-secondary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                              {translation.profile?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                              /{translation.profile?.slug || translation.profile_id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          translation.target_language === 'es'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                        }`}>
                          {translation.target_language === 'es' ? 'Español' : 'English'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-600 dark:text-dark-text-secondary bg-gray-100 dark:bg-dark-bg-tertiary px-2 py-1 rounded">
                          {translation.source_content_hash.slice(0, 12)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                        {formatDate(translation.updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteCache(translation.id)}
                          disabled={deleting === translation.id}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title={translations_t.actions.delete}
                        >
                          {deleting === translation.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Text Translations Table */}
      {activeTab === 'texts' && (
        <>
          {filteredTextTranslations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-dark-text-secondary">
                {translations_t.emptyTexts}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.originalText}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.translatedText}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.direction}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.hitCount}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {translations_t.table.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                  {filteredTextTranslations.map((textTrans) => (
                    <tr key={textTrans.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-dark-text-primary max-w-xs truncate" title={textTrans.original_text}>
                          {textTrans.original_text.length > 50 ? textTrans.original_text.slice(0, 50) + '...' : textTrans.original_text}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-dark-text-primary max-w-xs truncate" title={textTrans.translated_text}>
                          {textTrans.translated_text.length > 50 ? textTrans.translated_text.slice(0, 50) + '...' : textTrans.translated_text}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            textTrans.source_lang === 'es'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                          }`}>
                            {textTrans.source_lang.toUpperCase()}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            textTrans.target_lang === 'es'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                          }`}>
                            {textTrans.target_lang.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                          {textTrans.hit_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteTextCache(textTrans.id)}
                          disabled={deleting === textTrans.id}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title={translations_t.actions.delete}
                        >
                          {deleting === textTrans.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TranslationCacheManagement;
