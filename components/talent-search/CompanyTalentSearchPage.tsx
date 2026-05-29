// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser, Stamp } from '../../types';
import { useToastContext } from '../../contexts/ToastContext';
import type { TalentSearchPageProps } from './types';
import { CountryBadge } from '../shared/CountrySelector';
import { sortProfilesByPriority } from '../../utils/profileSorting';
import { translateBatch, detectSourceLanguage, TranslationLanguage } from '../../services/translation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookmarkIcon,
  CreditCardIcon,
  MapPinIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  XMarkIcon,
  StarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/react/24/solid';
import { isPremiumProfile, getVerifiedStampsCount } from '../../utils/profileSorting';

interface Profile {
  id: string;
  full_name: string;
  headline?: string;
  location?: string;
  country_code?: string;
  avatar_url?: string;
  plan?: string;
  handle?: string;
  slug?: string;
  availability?: string;
  remote_preference?: string;
  bio?: string;
  summary?: string;
  stamps?: Stamp[];
  skills?: Array<{ id: string; name: string }>;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const CompanyTalentSearchPage: React.FC<TalentSearchPageProps> = ({
  adminMode = false,
  showAdminControls = false,
}) => {
  const context = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const company = adminMode ? null : context?.company;
  const companyUser = adminMode ? null : context?.companyUser;

  const translations = useTranslations();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const toast = useToastContext();

  // State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const PROFILES_PER_PAGE = 30;

  // Filters - Always visible
  const [locationFilter, setLocationFilter] = useState('');
  const [remotePrefFilter, setRemotePrefFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const [locations, setLocations] = useState<string[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);

  // Translation state for profile cards
  const [profileTranslations, setProfileTranslations] = useState<Map<string, string>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const lastTranslationLang = useRef<string>('');

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Helper function
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  // Helper to get translated text
  const getTranslation = useCallback((text: string | null | undefined): string => {
    if (!text) return '';
    return profileTranslations.get(text) || text;
  }, [profileTranslations]);

  const loadFilterOptions = useCallback(async () => {
    // Check cache first
    const cacheKey = 'talent_search_filter_options';
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheExpiry) {
          setLocations(data.locations);
          setAllSkills(data.skills);
          return;
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    try {
      // Load filter options in parallel
      const [locationsResponse, skillsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('location')
          .eq('is_public', true)
          .not('location', 'is', null)
          .limit(200),
        supabase
          .from('skills')
          .select('name')
          .not('name', 'is', null)
          .limit(300)
      ]);

      const uniqueLocs = Array.from(new Set(
        (locationsResponse.data || []).map((p: any) => p.location).filter(Boolean)
      )).sort();

      const uniqueSkills = Array.from(new Set(
        (skillsResponse.data || []).map((s: any) => s.name).filter(Boolean)
      )).sort();

      setLocations(uniqueLocs);
      setAllSkills(uniqueSkills);

      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify({
        data: { locations: uniqueLocs, skills: uniqueSkills },
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }, []);

  const loadProfiles = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);

      // Calculate pagination
      const from = (page - 1) * PROFILES_PER_PAGE;
      const to = from + PROFILES_PER_PAGE - 1;

      // Build query with filters applied on server-side
      let query = supabase
        .from('profiles')
        .select(`
          id, full_name, headline, location, country_code, avatar_url, plan, handle, slug,
          availability, remote_preference, role, summary,
          stamps (
            id,
            type,
            status,
            verified_at
          )
        `, { count: 'exact' })
        .not('full_name', 'is', null)
        .not('headline', 'is', null)
        .neq('full_name', '')
        .neq('headline', '')
        .neq('role', 'admin')
        // IMPORTANT: Only show profiles that have completed the wizard and have a slug
        .eq('wizard_completed', true)
        .not('slug', 'is', null)
        .not('template', 'is', null);

      // Apply search query filter on server
      if (debouncedSearchQuery) {
        query = query.or(
          `full_name.ilike.%${debouncedSearchQuery}%,` +
          `headline.ilike.%${debouncedSearchQuery}%,` +
          `summary.ilike.%${debouncedSearchQuery}%,` +
          `location.ilike.%${debouncedSearchQuery}%`
        );
      }

      // Apply location filter on server
      if (locationFilter) {
        query = query.ilike('location', `%${locationFilter}%`);
      }

      // Apply remote preference filter on server
      if (remotePrefFilter) {
        query = query.eq('remote_preference', remotePrefFilter);
      }

      // Apply availability filter on server
      if (availabilityFilter) {
        query = query.eq('availability', availabilityFilter);
      }

      // Apply pagination and ordering
      const { data: profilesData, error: profilesError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (profilesError) {
        console.error('❌ Supabase error:', profilesError);
        toast.error(`${t('company.search.searchError')}: ${profilesError.message}`);
        throw profilesError;
      }

      // Load skills for the profiles in this page
      let profilesWithSkills: Profile[] = profilesData || [];

      if (profilesData && profilesData.length > 0) {
        const profileIds = profilesData.map(p => p.id);

        // Load ALL skills for these profiles
        // Use a higher limit to ensure we get all skills (Supabase default is 1000)
        const { data: allSkillsData, error: skillsError } = await supabase
          .from('skills')
          .select('profile_id, id, name')
          .in('profile_id', profileIds)
          .order('name')
          .limit(5000);

        if (skillsError) {
          console.error('❌ Error loading skills:', skillsError);
        }

        // Group skills by profile (translation is handled dynamically via profileTranslations)
        const skillsMap = new Map<string, Array<{ id: string; name: string }>>();
        allSkillsData?.forEach((skill: any) => {
          if (!skillsMap.has(skill.profile_id)) {
            skillsMap.set(skill.profile_id, []);
          }
          // Keep original name - translation is done dynamically via translateBatch
          skillsMap.get(skill.profile_id)!.push({ id: skill.id, name: skill.name });
        });

        // Attach all skills to profiles
        profilesWithSkills = profilesData.map(profile => ({
          ...profile,
          skills: skillsMap.get(profile.id) || []
        }));

        // Filter profiles by skill if skill filter is active
        if (skillFilter) {
          profilesWithSkills = profilesWithSkills.filter(profile => {
            const profileSkills = profile.skills || [];
            return profileSkills.some(skill =>
              skill.name.toLowerCase().includes(skillFilter.toLowerCase())
            );
          });
        }
      }

      // Apply priority sorting: Premium and certified users first
      const sortedProfiles = sortProfilesByPriority(profilesWithSkills);
      setProfiles(sortedProfiles);

      // Update total count (if skill filter is active, use filtered count, otherwise use server count)
      if (skillFilter && profilesWithSkills.length < (count || 0)) {
        // When skill filter is applied client-side, we can't know the true total
        // So we just show the current page results
        setTotalProfiles(profilesWithSkills.length);
      } else {
        setTotalProfiles(count || 0);
      }
    } catch (error: any) {
      console.error('❌ Error loading profiles:', error);
      toast.error(error?.message || t('company.search.searchError'));
      setProfiles([]);
      setTotalProfiles(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, locationFilter, remotePrefFilter, availabilityFilter, skillFilter, toast, t]);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Load profiles when filters or page changes
  useEffect(() => {
    loadProfiles(currentPage);
  }, [currentPage, debouncedSearchQuery, locationFilter, remotePrefFilter, availabilityFilter, experienceLevelFilter, skillFilter]);

  // Reset to page 1 when filters change (not page)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, locationFilter, remotePrefFilter, availabilityFilter, experienceLevelFilter, skillFilter]);

  // Translate profile cards when profiles load or language changes
  useEffect(() => {
    if (profiles.length === 0) {
      setProfileTranslations(new Map());
      return;
    }

    // Skip if already translated for this language + profiles combination
    const profilesKey = `${lang}-${profiles.map(p => p.id).join(',')}`;
    if (lastTranslationLang.current === profilesKey) {
      return;
    }

    // Extract all translatable texts from profiles, grouped by detected language
    const textsInSpanish: string[] = [];
    const textsInEnglish: string[] = [];

    profiles.forEach(profile => {
      const textsToCheck = [
        profile.headline,
        profile.summary,
        ...(profile.skills?.map(s => s.name) || [])
      ].filter(t => t && t.trim() !== '');

      textsToCheck.forEach(text => {
        if (text) {
          const textLang = detectSourceLanguage(text);
          if (textLang === 'es') {
            textsInSpanish.push(text);
          } else {
            textsInEnglish.push(text);
          }
        }
      });
    });

    // Determine what needs translation based on current UI language
    const textsToTranslate = lang === 'en' ? textsInSpanish : textsInEnglish;
    const sourceLang: TranslationLanguage = lang === 'en' ? 'es' : 'en';

    const uniqueTexts = [...new Set(textsToTranslate)];

    if (uniqueTexts.length === 0) {
      lastTranslationLang.current = profilesKey;
      return;
    }

    const doTranslate = async () => {
      setIsTranslating(true);
      try {
        const translations = await translateBatch(uniqueTexts, lang as TranslationLanguage, sourceLang);
        setProfileTranslations(prev => {
          const newMap = new Map(prev);
          translations.forEach((value, key) => newMap.set(key, value));
          return newMap;
        });
        lastTranslationLang.current = profilesKey;
      } catch (error) {
        console.error('[TalentSearch] Translation error:', error);
      } finally {
        setIsTranslating(false);
      }
    };

    // Debounce translation to avoid too many API calls
    const timeoutId = setTimeout(doTranslate, 300);
    return () => clearTimeout(timeoutId);
  }, [profiles, lang]);

  const handleViewProfile = (profile: Profile) => {
    if (adminMode) {
      window.open(`/cv/${profile.slug || profile.handle || profile.id}`, '_blank');
    } else {
      // Use slug or handle for cleaner URLs, fallback to ID if neither exists
      const profileIdentifier = profile.slug || profile.handle || profile.id;
      navigate(`/company/profile/${profileIdentifier}`);
    }
  };

  const handleSaveSearch = async () => {
    if (!company || !companyUser) {
      toast.error(t('company.search.saveFailed'));
      return;
    }

    try {
      const { error } = await supabase
        .from('company_saved_searches')
        .insert({
          company_id: company.id,
          search_name: `${t('company.search.search')} - ${new Date().toLocaleDateString()}`,
          search_filters: {
            keywords: searchQuery,
            location: locationFilter,
            remotePreference: remotePrefFilter,
            availability: availabilityFilter,
            experienceLevel: experienceLevelFilter,
            skill: skillFilter,
          },
          created_by: companyUser.user_id,
        });

      if (error) throw error;
      toast.success(t('company.search.searchSaved'));
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error(t('company.search.saveFailed'));
    }
  };

  const clearAllFilters = () => {
    setLocationFilter('');
    setRemotePrefFilter('');
    setAvailabilityFilter('');
    setExperienceLevelFilter('');
    setSkillFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Pagination controls
  const totalPages = Math.ceil(totalProfiles / PROFILES_PER_PAGE);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const creditBalance = company?.credit_balance || 0;
  const activeFiltersCount = [locationFilter, remotePrefFilter, availabilityFilter, experienceLevelFilter, skillFilter, searchQuery].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modern Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('company.search.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('company.search.subtitle')}
              </p>
            </div>

            {!adminMode && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <CreditCardIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {t('company.dashboard.creditsRemaining')}
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg">{creditBalance}</div>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('company.search.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sticky top-24">
              {/* Filters Header */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <FunnelIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">{t('company.search.filters')}</h3>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{activeFiltersCount} activos</span>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                    >
                      Limpiar todos
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Location */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {t('company.search.location')}
                  </label>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder={t('company.search.locationPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('company.search.skills')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSkillFilter('')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        skillFilter === ''
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {['Python', 'JavaScript', 'React', 'Node.js', 'Design', 'Marketing'].map(skill => (
                      <button
                        key={skill}
                        onClick={() => setSkillFilter(skill)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          skillFilter === skill
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {t('company.search.experienceLevel')}
                  </label>
                  <select
                    value={experienceLevelFilter}
                    onChange={(e) => setExperienceLevelFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Any</option>
                    <option value="entry">{t('company.search.entry')}</option>
                    <option value="mid">{t('company.search.mid')}</option>
                    <option value="senior">{t('company.search.senior')}</option>
                    <option value="expert">{t('company.search.expert')}</option>
                  </select>
                </div>

                {/* Save Search */}
                {!adminMode && profiles.length > 0 && (
                  <button
                    onClick={handleSaveSearch}
                    className="w-full mt-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <BookmarkIcon className="h-4 w-4" />
                    {t('company.search.saveSearch')}
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* Results Count and Pagination Info */}
            {!loading && profiles.length > 0 && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Results Found
                  </h2>
                  <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                    {totalProfiles}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => loadProfiles(currentPage)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-dark-border border-t-cv-blue"></div>
                <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('company.search.searching')}...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && profiles.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('company.search.noResults')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {t('company.search.tryDifferent')}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    {t('company.search.clearFilters')}
                  </button>
                </div>
              </div>
            )}

            {/* Results Grid - Modern Cards */}
            {!loading && profiles.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.map((profile, profileIndex) => {
                    const skills = profile.skills || [];
                    const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=2563eb&color=fff&size=200`;
                    const isPremium = isPremiumProfile(profile);
                    const verifiedStampsCount = getVerifiedStampsCount(profile);
                    const isCertified = verifiedStampsCount > 0;

                    return (
                      <div
                        key={profile.id}
                        onClick={() => handleViewProfile(profile)}
                        className="group relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden flex flex-col"
                        style={{ height: '340px' }}
                      >
                        {/* Card Content */}
                        <div className="p-6 flex flex-col h-full">
                          {/* Avatar and Name Row - Fixed height */}
                          <div className="flex items-center gap-3 mb-3" style={{ minHeight: '56px' }}>
                            <div className="relative flex-shrink-0">
                              <img
                                src={avatarUrl}
                                alt={profile.full_name}
                                loading="lazy"
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=2563eb&color=fff&size=200`;
                                }}
                              />
                            {/* Verified Badge */}
                            {isCertified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center border-2 border-white dark:border-gray-800">
                                <CheckBadgeIconSolid className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {profile.full_name}
                              </h3>
                              {isPremium && (
                                <StarIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                              {getTranslation(profile.headline) || '\u00A0'}
                            </p>
                          </div>
                        </div>

                        {/* Summary - Fixed height */}
                        <div className="mb-4" style={{ minHeight: '44px' }}>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {getTranslation(profile.summary) || '\u00A0'}
                          </p>
                        </div>

                        {/* Location - Fixed height */}
                        <div className="mb-4" style={{ minHeight: '20px' }}>
                          {profile.location ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{profile.location}</span>
                            </div>
                          ) : (
                            <div style={{ height: '20px' }}></div>
                          )}
                        </div>

                        {/* Skills - Min height so cards stay aligned, but content can expand without clipping */}
                        <div className="mb-4" style={{ minHeight: '72px' }}>
                          {skills && skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {skills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={skill.id || idx}
                                  className="inline-flex items-center px-3 py-1.5 max-w-full bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-200 text-xs font-semibold rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
                                  title={getTranslation(skill.name)}
                                >
                                  <span className="truncate">{getTranslation(skill.name)}</span>
                                </span>
                              ))}
                              {skills.length > 3 && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-full border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0">
                                  +{skills.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ height: '72px' }}></div>
                          )}
                        </div>

                        {/* View Profile Button - Fixed at bottom */}
                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(profile);
                            }}
                            className="w-full px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
                          >
                            <span>View Profile</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={!canGoPrevious}
                      className={`p-2 rounded-lg border transition-all ${
                        canGoPrevious
                          ? 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => goToPage(1)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
                          >
                            1
                          </button>
                          {currentPage > 4 && <span className="text-gray-400">...</span>}
                        </>
                      )}

                      {/* Previous pages */}
                      {currentPage > 1 && (
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
                        >
                          {currentPage - 1}
                        </button>
                      )}

                      {/* Current page */}
                      <button
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold border border-blue-600"
                      >
                        {currentPage}
                      </button>

                      {/* Next pages */}
                      {currentPage < totalPages && (
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
                        >
                          {currentPage + 1}
                        </button>
                      )}

                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                          <button
                            onClick={() => goToPage(totalPages)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={!canGoNext}
                      className={`p-2 rounded-lg border transition-all ${
                        canGoNext
                          ? 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Admin Mode Notice */}
            {showAdminControls && adminMode && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">
                  🔒 {t('admin.dashboard.title')}: {t('company.dashboard.creditsRemaining')}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CompanyTalentSearchPage;
