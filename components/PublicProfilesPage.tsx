import React, { useState, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../supabase/client';
import { Link, useSearchParams } from 'react-router-dom';
import { CountryBadge } from './CountrySelector';
import { Helmet } from 'react-helmet-async';

const AnimatedWrapper: React.FC<{children: React.ReactNode, delay?: string}> = ({ children, delay = 'duration-700' }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`transition-all ${delay} ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

interface ProfileCardProps {
    profile: any;
    skills: string[];
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, skills }) => {
    const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0052FF&color=fff&size=128`;

    return (
        <div className="group relative bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-cv-blue dark:hover:border-cv-blue overflow-hidden">
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cv-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative p-6 flex flex-col h-full">
                {/* Header with Avatar and Verified Badge */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                        <img
                            src={avatarUrl}
                            alt={profile.full_name}
                            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg group-hover:ring-cv-blue/30 transition-all"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0052FF&color=fff&size=128`;
                            }}
                        />
                        {profile.plan !== 'Free' && (
                            <div className="absolute -top-2 -right-2 bg-cv-green text-white p-1.5 rounded-full shadow-lg" title="Verified Profile">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate group-hover:text-cv-blue transition-colors">
                            {profile.full_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {profile.headline || 'Professional'}
                        </p>
                    </div>
                </div>

                {/* Location with Country Badge */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    {profile.country_code ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <CountryBadge countryCode={profile.country_code} size="md" showName={false} />
                            {profile.location && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="font-medium">{profile.location}</span>
                                </div>
                            )}
                            {profile.remote_preference === 'REMOTE' && (
                                <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-md">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                    </svg>
                                    Remote
                                </span>
                            )}
                        </div>
                    ) : profile.location && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                            <span className="font-medium">{profile.location}</span>
                        </div>
                    )}
                </div>

                {/* Top 3 Skills */}
                <div className="flex-grow mb-4">
                    <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 3).map((skill: string, index: number) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-cv-blue/10 to-indigo-500/10 dark:from-cv-blue/20 dark:to-indigo-500/20 text-cv-blue dark:text-cv-blue-light text-xs font-semibold rounded-lg border border-cv-blue/20 dark:border-cv-blue/30"
                            >
                                {skill}
                            </span>
                        ))}
                        {skills.length > 3 && (
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                +{skills.length - 3} more
                            </span>
                        )}
                    </div>
                    {skills.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                            No skills listed
                        </p>
                    )}
                </div>

                {/* View Profile CTA */}
                <Link
                    to={`/cv/${profile.slug || profile.id}`}
                    className="w-full bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl text-center flex items-center justify-center gap-2 group-hover:scale-105"
                >
                    <span>View Profile</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

interface Filters {
    role: string;
    country: string;
    city: string;
    skills: string[];
    availability: boolean;
    verifiedOnly: boolean;
    remote: boolean;
}

type SortOption = 'relevance' | 'recent' | 'verified';

const PublicProfilesPage: React.FC = () => {
    const { lang } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [profiles, setProfiles] = useState<any[]>([]);
    const [profileSkills, setProfileSkills] = useState<{ [key: string]: string[] }>({});
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProfiles, setTotalProfiles] = useState(0);
    const [availableSkills, setAvailableSkills] = useState<string[]>([]);
    const profilesPerPage = 20;

    // Filters state
    const [filters, setFilters] = useState<Filters>({
        role: searchParams.get('role') || '',
        country: searchParams.get('country') || '',
        city: searchParams.get('city') || '',
        skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
        availability: searchParams.get('availability') === 'true',
        verifiedOnly: searchParams.get('verified') === 'true',
        remote: searchParams.get('remote') === 'true',
    });

    const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance');

    // Load available skills for autocomplete
    useEffect(() => {
        loadAvailableSkills();
    }, []);

    const loadAvailableSkills = async () => {
        try {
            const { data } = await supabase
                .from('skills')
                .select('name')
                .limit(1000);

            if (data) {
                const uniqueSkills = [...new Set(data.map(s => s.name))].sort();
                setAvailableSkills(uniqueSkills);
            }
        } catch (err) {
            console.error('Error loading skills:', err);
        }
    };

    // Load profiles
    useEffect(() => {
        loadProfiles();
    }, [filters, sortBy, currentPage]);

    // Update URL params when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.role) params.set('role', filters.role);
        if (filters.country) params.set('country', filters.country);
        if (filters.city) params.set('city', filters.city);
        if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
        if (filters.availability) params.set('availability', 'true');
        if (filters.verifiedOnly) params.set('verified', 'true');
        if (filters.remote) params.set('remote', 'true');
        if (sortBy !== 'relevance') params.set('sort', sortBy);

        setSearchParams(params);
    }, [filters, sortBy]);

    const loadProfiles = async () => {
        try {
            setLoading(true);

            // Build query
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .not('full_name', 'is', null)
                .not('headline', 'is', null);

            // Apply filters
            if (filters.country) {
                query = query.eq('country_code', filters.country);
            }

            if (filters.city) {
                query = query.ilike('location', `%${filters.city}%`);
            }

            if (filters.role) {
                query = query.or(`headline.ilike.%${filters.role}%,title.ilike.%${filters.role}%`);
            }

            if (filters.availability) {
                query = query.eq('job_seeking_status', 'OPEN');
            }

            if (filters.verifiedOnly) {
                query = query.neq('plan', 'Free');
            }

            if (filters.remote) {
                query = query.eq('remote_preference', 'REMOTE');
            }

            // Apply sorting
            switch (sortBy) {
                case 'recent':
                    query = query.order('updated_at', { ascending: false });
                    break;
                case 'verified':
                    query = query.order('plan', { ascending: false });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }

            // Pagination
            const from = (currentPage - 1) * profilesPerPage;
            const to = from + profilesPerPage - 1;
            query = query.range(from, to);

            const { data: profilesData, error: profilesError, count } = await query;

            if (profilesError) throw profilesError;

            // Get skills for each profile
            const skillsMap: { [key: string]: string[] } = {};

            if (profilesData) {
                for (const profile of profilesData) {
                    const { data: skillsData } = await supabase
                        .from('skills')
                        .select('name')
                        .eq('profile_id', profile.id)
                        .order('sort_order', { ascending: true });

                    skillsMap[profile.id] = skillsData?.map(s => s.name) || [];
                }

                // Filter by skills if needed
                let filteredProfiles = profilesData;
                if (filters.skills.length > 0) {
                    filteredProfiles = profilesData.filter(profile => {
                        const profileSkillsList = skillsMap[profile.id] || [];
                        return filters.skills.some(filterSkill =>
                            profileSkillsList.some(profileSkill =>
                                profileSkill.toLowerCase().includes(filterSkill.toLowerCase())
                            )
                        );
                    });
                }

                setProfiles(filteredProfiles);
                setProfileSkills(skillsMap);
                setTotalProfiles(count || 0);
            }
        } catch (err) {
            console.error('Error loading profiles:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalProfiles / profilesPerPage);

    const handleFilterChange = (key: keyof Filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleSkillAdd = (skill: string) => {
        if (skill && !filters.skills.includes(skill)) {
            setFilters(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        }
    };

    const handleSkillRemove = (skill: string) => {
        setFilters(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const clearAllFilters = () => {
        setFilters({
            role: '',
            country: '',
            city: '',
            skills: [],
            availability: false,
            verifiedOnly: false,
            remote: false,
        });
        setCurrentPage(1);
    };

    return (
        <>
            <PageSEO
                title="Professional Profiles Directory - YourCVPassport"
                description="Browse verified professional profiles. Filter by role, location, skills, and availability. Connect with top talent worldwide."
                lang={lang}
            />

            <div className="bg-white dark:bg-dark-bg-primary min-h-screen">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-cv-blue via-indigo-600 to-purple-600 text-white py-16 px-4">
                    <AnimatedWrapper>
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                                Professional Profiles Directory
                            </h1>
                            <p className="text-xl text-blue-100 max-w-3xl">
                                Discover talented professionals from around the world. Filter by skills, location, and availability.
                            </p>
                        </div>
                    </AnimatedWrapper>
                </section>

                {/* Main Content */}
                <section className="py-12 px-4 bg-gray-50 dark:bg-dark-bg-primary">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-4 gap-8">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-6 bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
                                    {/* Filter Header */}
                                    <div className="bg-gradient-to-r from-cv-blue to-indigo-600 p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Filters</h3>
                                                <p className="text-sm text-blue-100">Refine your search</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filter Options */}
                                    <div className="p-6 space-y-6">
                                        {/* Role/Title Input */}
                                        <div>
                                            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Role / Title
                                            </label>
                                            <input
                                                id="role"
                                                type="text"
                                                placeholder="e.g., UI Designer, Developer"
                                                value={filters.role}
                                                onChange={(e) => handleFilterChange('role', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
                                            />
                                        </div>

                                        {/* Country Dropdown */}
                                        <div>
                                            <label htmlFor="country" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Country
                                            </label>
                                            <select
                                                id="country"
                                                value={filters.country}
                                                onChange={(e) => handleFilterChange('country', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
                                            >
                                                <option value="">All Countries</option>
                                                <option value="ES">Spain</option>
                                                <option value="MX">Mexico</option>
                                                <option value="AR">Argentina</option>
                                                <option value="CO">Colombia</option>
                                                <option value="CL">Chile</option>
                                                <option value="PE">Peru</option>
                                                <option value="US">United States</option>
                                                <option value="GB">United Kingdom</option>
                                                <option value="FR">France</option>
                                                <option value="DE">Germany</option>
                                                <option value="IT">Italy</option>
                                                <option value="BR">Brazil</option>
                                            </select>
                                        </div>

                                        {/* City Input */}
                                        <div>
                                            <label htmlFor="city" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                City
                                            </label>
                                            <input
                                                id="city"
                                                type="text"
                                                placeholder="e.g., Valencia, Madrid"
                                                value={filters.city}
                                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
                                            />
                                        </div>

                                        {/* Skills Multi-Select */}
                                        <div>
                                            <label htmlFor="skill-input" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Skills
                                            </label>
                                            <div className="space-y-2">
                                                <input
                                                    id="skill-input"
                                                    type="text"
                                                    placeholder="Type to search skills..."
                                                    list="skills-datalist"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSkillAdd(e.currentTarget.value);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
                                                />
                                                <datalist id="skills-datalist">
                                                    {availableSkills.map(skill => (
                                                        <option key={skill} value={skill} />
                                                    ))}
                                                </datalist>
                                                {filters.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {filters.skills.map(skill => (
                                                            <span
                                                                key={skill}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-cv-blue text-white text-xs font-semibold rounded-lg"
                                                            >
                                                                {skill}
                                                                <button
                                                                    onClick={() => handleSkillRemove(skill)}
                                                                    className="hover:bg-white/20 rounded-full p-0.5"
                                                                >
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Availability Checkbox */}
                                        <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-4">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.availability}
                                                    onChange={(e) => handleFilterChange('availability', e.target.checked)}
                                                    className="h-5 w-5 text-cv-blue rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-cv-blue transition-all"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-cv-blue transition-colors">
                                                        Open to opportunities
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Actively looking for jobs
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Verified Only Checkbox */}
                                        <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-4">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.verifiedOnly}
                                                    onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                                                    className="h-5 w-5 text-cv-blue rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-cv-blue transition-all"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-cv-blue transition-colors">
                                                        Verified profiles only
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Premium members
                                                    </p>
                                                </div>
                                                <svg className="w-5 h-5 text-cv-green" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                                </svg>
                                            </label>
                                        </div>

                                        {/* Remote Checkbox */}
                                        <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-4">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.remote}
                                                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                                                    className="h-5 w-5 text-cv-blue rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-cv-blue transition-all"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-cv-blue transition-colors">
                                                        Remote only
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Work from anywhere
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Clear Filters Button */}
                                        <button
                                            onClick={clearAllFilters}
                                            className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Area */}
                            <div className="lg:col-span-3">
                                {/* Sort and Results Header */}
                                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cv-blue/10 rounded-lg">
                                            <svg className="w-5 h-5 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Results found</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {totalProfiles} {totalProfiles === 1 ? 'profile' : 'profiles'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sort Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Sort by:
                                        </label>
                                        <select
                                            id="sort"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white text-sm"
                                        >
                                            <option value="relevance">Relevance</option>
                                            <option value="recent">Recently Active</option>
                                            <option value="verified">Most Verified</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Loading State */}
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-sm">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cv-blue mb-4"></div>
                                        <p className="text-gray-600 dark:text-gray-400">Loading profiles...</p>
                                    </div>
                                ) : profiles.length === 0 ? (
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
                                            No profiles found
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                            Try adjusting your search filters or broaden your criteria
                                        </p>
                                        <button
                                            onClick={clearAllFilters}
                                            className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Profile Cards Grid - Responsive: 3 cols desktop, 2 tablet, 1 mobile */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {profiles.map(profile => (
                                                <ProfileCard
                                                    key={profile.id}
                                                    profile={profile}
                                                    skills={profileSkills[profile.id] || []}
                                                />
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="mt-8 flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-4 py-2 bg-white dark:bg-dark-bg-secondary border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Previous
                                                </button>

                                                <div className="flex items-center gap-1">
                                                    {[...Array(totalPages)].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        // Show first, last, current, and pages around current
                                                        if (
                                                            pageNum === 1 ||
                                                            pageNum === totalPages ||
                                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                                        pageNum === currentPage
                                                                            ? 'bg-cv-blue text-white'
                                                                            : 'bg-white dark:bg-dark-bg-secondary border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                                    }`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        } else if (
                                                            pageNum === currentPage - 2 ||
                                                            pageNum === currentPage + 2
                                                        ) {
                                                            return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                                                        }
                                                        return null;
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-4 py-2 bg-white dark:bg-dark-bg-secondary border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default PublicProfilesPage;
