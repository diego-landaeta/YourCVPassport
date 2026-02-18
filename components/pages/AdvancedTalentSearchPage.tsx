import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useTranslations } from '../../hooks/useTranslations';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import { Link } from 'react-router-dom';
import { CountryBadge } from '../shared/CountrySelector';
import HeroImage from '../landing/HeroImage';
import { CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/react/24/solid';
import { StarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { isPremiumProfile, getVerifiedStampsCount } from '../../utils/profileSorting';
import { translateBatch, detectSourceLanguage } from '../../services/translation';
import { correctGender, inferGenderFromName } from '../../utils/genderCorrection';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const ProfileCard: React.FC<{ profile: any; skills: string[] }> = ({ profile, skills }) => {
    const t = useTranslations();

    // Get avatar URL or generate initials
    const avatarUrl = profile.avatar_url || profile.photo_url || profile.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=2563eb&color=fff&size=200`;

    // Check premium and verified status
    const isPremium = isPremiumProfile(profile);
    const verifiedStampsCount = getVerifiedStampsCount(profile);
    const isCertified = verifiedStampsCount > 0;

    return (
        <Link
            to={`/cv/${profile.slug || profile.id}`}
            className="group relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden block flex flex-col"
            style={{ height: '340px' }}
        >
            {/* Card Content */}
            <div className="p-6 flex flex-col h-full">
                {/* Avatar and Name Row - Fixed height */}
                <div className="flex items-center gap-3 mb-3" style={{ minHeight: '56px' }}>
                    <div className="relative flex-shrink-0">
                        <img
                            src={avatarUrl}
                            alt={profile.full_name || ''}
                            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=2563eb&color=fff&size=200`;
                            }}
                        />
                        {/* Verified Badge on Avatar */}
                        {isCertified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center border-2 border-white dark:border-gray-800">
                                <CheckBadgeIconSolid className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {profile.full_name || 'Anonymous'}
                            </h3>
                            {isPremium && (
                                <StarIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {(profile.title || profile.professional_title || profile.headline) || '\u00A0'}
                        </p>
                    </div>
                </div>

                {/* Summary - Fixed height */}
                <div className="mb-4" style={{ minHeight: '44px' }}>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {(profile.summary || profile.bio) || '\u00A0'}
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

                {/* Skills - Fixed height */}
                <div className="mb-4" style={{ minHeight: '72px', maxHeight: '72px', overflow: 'hidden' }}>
                    {skills && skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skills.slice(0, 2).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-200 text-xs font-semibold rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
                                >
                                    {skill}
                                </span>
                            ))}
                            {skills.length > 2 && (
                                <span
                                    className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-full border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    +{skills.length - 2}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div style={{ height: '72px' }}></div>
                    )}
                </div>

                {/* View Profile Button - Fixed at bottom */}
                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button className="w-full px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg group">
                        <span>{t.advancedTalentSearch.viewProfile}</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </Link>
    );
}

interface FilterSectionProps {
    filters: {
        verifiedOnly: boolean;
        skills: string;
        country: string;
        location: string;
        salaryMin: string;
        salaryMax: string;
        experienceLevel: string;
    };
    onFilterChange: (filters: any) => void;
    onApplyFilters: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ filters, onFilterChange, onApplyFilters }) => {
    const t = useTranslations();
    const { filters: filterLabels } = t.advancedTalentSearch;

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col backdrop-blur-sm" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-white">{filterLabels.title}</h3>
                </div>
            </div>

            {/* Filters - Scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1" style={{ minHeight: 0 }}>

                <div>
                     <label htmlFor="skills" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        {filterLabels.skills.label}
                     </label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <input
                            id="skills"
                            type="text"
                            placeholder={filterLabels.skills.placeholder}
                            value={filters.skills}
                            onChange={(e) => onFilterChange({ ...filters, skills: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                     </div>
                </div>

                <div>
                     <label htmlFor="country" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        {filterLabels.countryLabel}
                     </label>
                     <select
                        id="country"
                        value={filters.country}
                        onChange={(e) => onFilterChange({ ...filters, country: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all appearance-none bg-white cursor-pointer text-sm"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                     >
                        <option value="">{filterLabels.allCountries}</option>
                        <option value="ES">{filterLabels.countries.ES}</option>
                        <option value="MX">{filterLabels.countries.MX}</option>
                        <option value="AR">Argentina</option>
                        <option value="CO">Colombia</option>
                        <option value="CL">Chile</option>
                        <option value="PE">{filterLabels.countries.PE}</option>
                        <option value="US">{filterLabels.countries.US}</option>
                        <option value="GB">{filterLabels.countries.GB}</option>
                        <option value="FR">{filterLabels.countries.FR}</option>
                        <option value="DE">{filterLabels.countries.DE}</option>
                        <option value="IT">{filterLabels.countries.IT}</option>
                        <option value="BR">Brasil</option>
                     </select>
                </div>

                <div>
                     <label htmlFor="location" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        {filterLabels.locationLabel}
                     </label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <input
                            id="location"
                            type="text"
                            placeholder={filterLabels.location.placeholder}
                            value={filters.location}
                            onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                     </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {filterLabels.locationHint}
                    </p>
                </div>

                <div>
                    <label htmlFor="experience" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        {filterLabels.experience.label}
                    </label>
                    <select
                        id="experience"
                        value={filters.experienceLevel}
                        onChange={(e) => onFilterChange({ ...filters, experienceLevel: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all appearance-none bg-white cursor-pointer text-sm"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                        {filterLabels.experience.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            {/* Apply Button - Fixed at bottom */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-600 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/80 flex-shrink-0">
                <button
                    onClick={onApplyFilters}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>{filterLabels.applyButton}</span>
                </button>
            </div>
        </div>
    );
};

const AdvancedTalentSearchPage: React.FC = () => {
    const { openModal } = useAuth();
    const { lang } = useLanguage();
    const t = useTranslations();
    const pageData = t.advancedTalentSearch;

    // State for profiles and filters
    const [profiles, setProfiles] = useState<any[]>([]);
    const [profileSkills, setProfileSkills] = useState<{ [key: string]: string[] }>({});
    const [loading, setLoading] = useState(true);
    const [isTranslating, setIsTranslating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [displayLimit, setDisplayLimit] = useState(12);
    const [filters, setFilters] = useState({
        verifiedOnly: false,
        skills: '',
        country: '',
        location: '',
        salaryMin: '',
        salaryMax: '',
        experienceLevel: t.advancedTalentSearch.filters.experience.options[0]
    });

    // Load profiles from database
    useEffect(() => {
        loadProfiles();
    }, [lang]);

    const loadProfiles = async () => {
        try {
            setLoading(true);

            // Get profiles with complete information, prioritizing premium users
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    stamps (
                        id,
                        type,
                        status,
                        verified_at
                    )
                `)
                .not('full_name', 'is', null)
                .not('headline', 'is', null)
                .not('summary', 'is', null)
                // IMPORTANT: Only show profiles that have completed the wizard and have a slug
                .eq('wizard_completed', true)
                .not('slug', 'is', null)
                .not('template', 'is', null)
                .order('plan', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(50);

            if (profilesError) throw profilesError;

            // Get skills for ALL profiles in ONE query (optimized)
            const skillsMap: { [key: string]: string[] } = {};

            if (profilesData && profilesData.length > 0) {
                const profileIds = profilesData.map(p => p.id);

                // Load ALL skills for all profiles in a SINGLE query
                // Use a higher limit to ensure we get all skills (Supabase default is 1000)
                const { data: allSkillsData, error: skillsError } = await supabase
                    .from('skills')
                    .select('profile_id, name')
                    .in('profile_id', profileIds)
                    .limit(5000);

                if (skillsError) {
                    console.error('Error loading skills:', skillsError);
                }

                // Group skills by profile_id (keep original names, translate later via API)
                allSkillsData?.forEach(skill => {
                    if (!skillsMap[skill.profile_id]) {
                        skillsMap[skill.profile_id] = [];
                    }
                    skillsMap[skill.profile_id].push(skill.name);
                });
            }

            // Attach skills to each profile object to avoid sync issues
            const profilesWithSkills = (profilesData || []).map(profile => ({
                ...profile,
                _skills: skillsMap[profile.id] || []
            }));

            setProfileSkills(skillsMap);
            setProfiles(profilesWithSkills);

            // Translate headlines dynamically if needed
            translateProfileTexts(profilesWithSkills);
        } catch (err) {} finally {
            setLoading(false);
        }
    };

    // Function to translate profile texts (headlines + skills) dynamically via API
    const translateProfileTexts = async (profilesList: any[]) => {
        if (!profilesList || profilesList.length === 0) return;

        // Collect texts grouped by detected language
        const textsInSpanish: string[] = [];
        const textsInEnglish: string[] = [];

        profilesList.forEach(profile => {
            const textsToCheck = [
                profile.headline,
                profile.title,
                profile.professional_title,
                profile.summary,
                profile.bio,
                ...(profile._skills || [])
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
        const sourceLang = lang === 'en' ? 'es' : 'en';

        const uniqueTexts = [...new Set(textsToTranslate)];

        console.log(`[TalentSearch] Language: ${lang}, Spanish texts: ${textsInSpanish.length}, English texts: ${textsInEnglish.length}, To translate: ${uniqueTexts.length}`);

        if (uniqueTexts.length === 0) return;

        setIsTranslating(true);

        try {
            console.log(`[TalentSearch] Translating ${uniqueTexts.length} texts: ${sourceLang} -> ${lang}...`);
            const translations = await translateBatch(uniqueTexts, lang as 'en' | 'es', sourceLang as 'en' | 'es');

            // Apply translations to profiles (headlines + skills)
            // Apply gender correction for Spanish translations
            const translatedProfiles = profilesList.map(profile => {
                // Determine gender from profile data or infer from name
                const gender = profile.gender || inferGenderFromName(profile.full_name);

                // Get translations (only if the text was in the source language)
                let headline = profile.headline ? (translations.get(profile.headline) || profile.headline) : profile.headline;
                let title = profile.title ? (translations.get(profile.title) || profile.title) : profile.title;
                let professionalTitle = profile.professional_title ? (translations.get(profile.professional_title) || profile.professional_title) : profile.professional_title;
                let summary = profile.summary ? (translations.get(profile.summary) || profile.summary) : profile.summary;
                let bio = profile.bio ? (translations.get(profile.bio) || profile.bio) : profile.bio;

                // Apply gender correction only for Spanish
                if (lang === 'es' && gender) {
                    headline = correctGender(headline, gender);
                    title = correctGender(title, gender);
                    professionalTitle = correctGender(professionalTitle, gender);
                    summary = correctGender(summary, gender);
                    bio = correctGender(bio, gender);
                }

                return {
                    ...profile,
                    headline,
                    title,
                    professional_title: professionalTitle,
                    summary,
                    bio,
                    _skills: profile._skills?.map((skill: string) => translations.get(skill) || skill) || [],
                };
            });

            setProfiles(translatedProfiles);
            console.log(`[TalentSearch] Translation complete with gender correction`);
        } catch (error) {
            console.error('[TalentSearch] Translation error:', error);
            // Keep original profiles on error
        } finally {
            setIsTranslating(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...profiles];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.full_name?.toLowerCase().includes(query) ||
                p.headline?.toLowerCase().includes(query) ||
                p.summary?.toLowerCase().includes(query) ||
                p._skills?.some(skill => skill.toLowerCase().includes(query))
            );
        }

        // Filter by verified (premium users)
        if (filters.verifiedOnly) {
            filtered = filtered.filter(p => p.plan !== 'Free');
        }

        // Filter by skills
        if (filters.skills.trim()) {
            const skillQuery = filters.skills.toLowerCase();
            filtered = filtered.filter(p =>
                p._skills?.some(skill => skill.toLowerCase().includes(skillQuery))
            );
        }

        // Filter by country
        if (filters.country) {
            filtered = filtered.filter(p => p.country_code === filters.country);
        }

        // Filter by location
        if (filters.location.trim()) {
            const locationQuery = filters.location.toLowerCase();
            filtered = filtered.filter(p => 
                p.location?.toLowerCase().includes(locationQuery)
            );
        }

        // Filter by salary range
        if (filters.salaryMin || filters.salaryMax) {
            filtered = filtered.filter(p => {
                if (!p.salary_min && !p.salary_max) return false;
                
                const profileMin = p.salary_min || 0;
                const profileMax = p.salary_max || Infinity;
                const filterMin = filters.salaryMin ? parseInt(filters.salaryMin) : 0;
                const filterMax = filters.salaryMax ? parseInt(filters.salaryMax) : Infinity;
                
                return profileMin <= filterMax && profileMax >= filterMin;
            });
        }

        return filtered;
    };

    const filteredProfiles = applyFilters();

    const seoTitle = lang === 'es'
        ? 'Búsqueda Avanzada de Talento'
        : 'Advanced Talent Search';

    const seoDescription = lang === 'es'
        ? 'Encuentra candidatos ideales con IA. Filtros avanzados por skills, experiencia, ubicación. Perfiles verificados, contacto directo, integración ATS completa para reclutadores con YourCVPassport.'
        : 'Find ideal candidates with AI. Advanced filters by skills, experience, location. Verified profiles, direct contact, complete ATS integration for recruiters with YourCVPassport.';

    return (
        <>
            <PageSEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
            />
            <div className="bg-white dark:bg-dark-bg-primary">
            {/* Hero Section */}
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <AnimatedWrapper>
                            <div className="text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                                    {pageData.title}
                                </h1>
                                <p className="mt-6 text-lg text-gray-600 dark:text-dark-text-secondary">
                                    {pageData.subtitle}
                                </p>
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 bg-white dark:bg-dark-bg-primary p-4 rounded-lg shadow-lg">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="ej: Senior Python Developer, React, Designer..."
                                        className="flex-grow p-3 border border-gray-300 dark:border-dark-border-light rounded-md focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-secondary dark:text-white"
                                    />
                                    <button
                                        onClick={() => applyFilters()}
                                        className="bg-cv-blue text-white px-8 py-3 rounded-md font-semibold hover:bg-opacity-90 transition-colors"
                                    >
                                        {pageData.searchButton}
                                    </button>
                                </div>
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <HeroImage
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                                alt={pageData.heroImageAlt}
                                position="center"
                            />
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>

            {/* Main Search Interface */}
            <section className="py-16 px-4 bg-gray-50 dark:bg-dark-bg-primary">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-4">
                                {pageData.interfaceTitle}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                {pageData.interfaceSubtitle}
                            </p>
                        </div>
                        
                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-3">
                                <div className="sticky top-6">
                                    <FilterSection
                                        filters={filters}
                                        onFilterChange={setFilters}
                                        onApplyFilters={() => {
                                            // Filters are applied reactively, but this provides visual feedback
                                            // and can trigger a scroll to results
                                            const resultsSection = document.querySelector('.lg\\:col-span-9');
                                            if (resultsSection) {
                                                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            
                            {/* Results Area */}
                            <div className="lg:col-span-9">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-sm">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cv-blue mb-4"></div>
                                        <p className="text-gray-600 dark:text-gray-400">{pageData.loadingProfiles}</p>
                                    </div>
                                ) : filteredProfiles.length === 0 ? (
                                    <div className="text-center py-20 bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700">
                                        <div className="relative inline-block mb-6">
                                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-2xl opacity-50"></div>
                                            <div className="relative p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                            {pageData.noResultsTitle}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                            {pageData.noResultsSubtitle}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setFilters({
                                                    verifiedOnly: false,
                                                    skills: '',
                                                    country: '',
                                                    location: '',
                                                    salaryMin: '',
                                                    salaryMax: '',
                                                    experienceLevel: pageData.filters.experience.options[0]
                                                });
                                                setSearchQuery('');
                                            }}
                                            className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                        >
                                            {pageData.clearFilters}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Results Header */}
                                        <div className="mb-6 flex items-center justify-between bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-cv-blue/10 rounded-lg">
                                                    <svg className="w-5 h-5 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{pageData.resultsFound}</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {filteredProfiles.length} {filteredProfiles.length === 1 ? pageData.profileSingular : pageData.profilePlural}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Translation Indicator */}
                                                {isTranslating && (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full border border-purple-200 dark:border-purple-700/50 animate-pulse">
                                                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                                            {pageData.translating}
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => loadProfiles()}
                                                    className="px-4 py-2 text-sm font-medium text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    {pageData.refresh}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Profile Cards Grid */}
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {filteredProfiles.slice(0, displayLimit).map(profile => (
                                                <ProfileCard
                                                    key={profile.id}
                                                    profile={profile}
                                                    skills={profile._skills || []}
                                                />
                                            ))}
                                        </div>

                                        {/* Load More Button */}
                                        {filteredProfiles.length > displayLimit && (
                                            <div className="mt-8 text-center">
                                                <button
                                                    onClick={() => setDisplayLimit(prev => prev + 12)}
                                                    className="px-8 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                                                >
                                                    {pageData.loadMore}
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                    {pageData.showingOf.replace('{current}', String(displayLimit)).replace('{total}', String(filteredProfiles.length))}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </AnimatedWrapper>
                </div>
            </section>
            
            {/* AI Matching Section */}
            <section className="py-20 px-4 bg-cv-light-gray dark:bg-dark-bg-secondary">
                <div className="max-w-7xl mx-auto">
                    <AnimatedWrapper>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary mb-4">{pageData.aiMatching.title}</h2>
                            <p className="text-lg text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto">{pageData.aiMatching.description}</p>
                        </div>
                    </AnimatedWrapper>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <AnimatedWrapper>
                            <div className="space-y-5">
                                {pageData.aiMatching.features.map((feature: any) => (
                                    <div key={feature.title} className="flex items-start gap-4 bg-white dark:bg-dark-bg-primary p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-lg bg-cv-blue/10 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-cv-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-cv-dark-gray dark:text-dark-text-primary mb-1">{feature.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary leading-relaxed">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AnimatedWrapper>
                        <AnimatedWrapper delay="duration-1000">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-cv-blue/20 to-purple-500/20 rounded-2xl blur-3xl"></div>
                                <div className="relative bg-white dark:bg-dark-bg-primary p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80" alt="AI matching illustration" className="rounded-lg w-full object-cover" />
                                    <div className="absolute -bottom-6 -right-6 bg-cv-blue text-white px-6 py-4 rounded-xl shadow-xl">
                                        <div className="text-3xl font-bold">95%</div>
                                        <div className="text-sm opacity-90">Match Score</div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedWrapper>
                    </div>
                </div>
            </section>
            
            {/* Comparison Table */}
            <section className="py-20 px-4">
                <AnimatedWrapper>
                    <div className="max-w-5xl mx-auto">
                        {/* FIX: Access property from the correct translation object key */}
                        <h2 className="text-3xl md:text-4xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-12">{pageData.comparison.title}</h2>
                        <div className="overflow-x-auto shadow-lg rounded-lg border">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-dark-bg-secondary">
                                        {/* FIX: Access property from the correct translation object key */}
                                        {pageData.comparison.headers.map((header: string) => <th key={header} className="p-4 font-bold">{header}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* FIX: Access property from the correct translation object key */}
                                    {pageData.comparison.rows.map((row: any) => (
                                        <tr key={row.feature} className="border-t">
                                            <td className="p-4">{row.feature}</td>
                                            <td className="p-4 text-cv-green font-semibold">{row.passport}</td>
                                            <td className="p-4">{row.traditional}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </AnimatedWrapper>
            </section>
            
            {/* Final CTA */}
            <section className="bg-cv-blue">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
                    <AnimatedWrapper>
                        {/* FIX: Access property from the correct translation object key */}
                        <h2 className="text-3xl md:text-4xl font-bold text-white">{pageData.finalCta.title}</h2>
                        <p className="mt-4 text-lg leading-6 text-white/80">
                           {/* FIX: Access property from the correct translation object key */}
                           {pageData.finalCta.subtitle}
                        </p>
                        <button onClick={() => openModal('signup')} className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-cv-blue bg-white dark:bg-dark-bg-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary dark:bg-dark-bg-secondary sm:w-auto transform hover:scale-105 transition-transform">
                            {/* FIX: Access property from the correct translation object key */}
                            {pageData.finalCta.button}
                        </button>
                    </AnimatedWrapper>
                </div>
            </section>
            </div>
        </>
    );
};

export default AdvancedTalentSearchPage;

