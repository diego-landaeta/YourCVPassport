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
        <div className="group relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-cv-blue dark:hover:border-cv-blue overflow-hidden">
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cv-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

            {/* Content */}
            <div className="relative p-4 flex flex-col h-full">
                {/* Header with Avatar and Verified Badge */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                        <img
                            src={avatarUrl}
                            alt={profile.full_name}
                            className="w-12 h-12 rounded-lg object-cover ring-2 ring-white dark:ring-gray-800 shadow group-hover:ring-cv-blue/30 transition-all"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0052FF&color=fff&size=128`;
                            }}
                        />
                        {profile.plan !== 'Free' && (
                            <div className="absolute -top-1 -right-1 bg-cv-green text-white p-1 rounded-full shadow" title="Verified Profile">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 truncate group-hover:text-cv-blue transition-colors">
                            {profile.full_name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {profile.headline || 'Professional'}
                        </p>
                    </div>
                </div>

                {/* Location with Country Badge */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                    {profile.country_code ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <CountryBadge countryCode={profile.country_code} size="sm" showName={false} />
                            {profile.location && (
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{profile.location}</span>
                            )}
                            {profile.remote_preference === 'REMOTE' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                                    Remote
                                </span>
                            )}
                        </div>
                    ) : profile.location && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{profile.location}</span>
                    )}
                </div>

                {/* Top 3 Skills */}
                <div className="flex-grow mb-3">
                    <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 3).map((skill: string, index: number) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 bg-cv-blue/10 dark:bg-cv-blue/20 text-cv-blue dark:text-cv-blue-light text-xs font-medium rounded"
                            >
                                {skill}
                            </span>
                        ))}
                        {skills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
                                +{skills.length - 3}
                            </span>
                        )}
                    </div>
                    {skills.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-600 italic">
                            No skills
                        </p>
                    )}
                </div>

                {/* View Profile CTA */}
                <Link
                    to={`/cv/${profile.slug || profile.id}`}
                    className="w-full bg-cv-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow text-center flex items-center justify-center gap-1.5"
                >
                    <span>View Profile</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    salaryMin: string;
    salaryMax: string;
    experienceLevel: string;
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
        salaryMin: searchParams.get('salaryMin') || '',
        salaryMax: searchParams.get('salaryMax') || '',
        experienceLevel: searchParams.get('experience') || 'Any',
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
        } catch (err) {}
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
        } catch (err) {} finally {
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
            salaryMin: '',
            salaryMax: '',
            experienceLevel: 'Any',
        });
        setCurrentPage(1);
    };

    return (
        <>
            <PageSEO
                title="Talent Directory - YourCVPassport"
                description="Connect with verified professionals worldwide. Advanced filters by role, location, skills, experience, and salary expectations. Find the perfect candidate for your team."
                lang={lang}
            />

            <div className="bg-white dark:bg-dark-bg-primary min-h-screen">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-cv-blue via-indigo-600 to-purple-600 text-white py-3 px-4">
                    <AnimatedWrapper>
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-xl md:text-2xl font-extrabold mb-1">
                                Talent Directory
                            </h1>
                            <p className="text-xs text-blue-100 max-w-3xl">
                                Connect with verified professionals worldwide
                            </p>
                        </div>
                    </AnimatedWrapper>
                </section>

                {/* Main Content */}
                <section className="py-3 px-4 bg-gray-50 dark:bg-dark-bg-primary">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-6 gap-4">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-4 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* Filter Header */}
                                    <div className="bg-gradient-to-r from-cv-blue to-indigo-600 p-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="p-0.5 bg-white/20 rounded">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xs font-bold text-white">Filters</h3>
                                        </div>
                                    </div>

                                    {/* Filter Options */}
                                    <div className="p-2 space-y-2">
                                        {/* Role/Title Input */}
                                        <div>
                                            <label htmlFor="role" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Role
                                                </div>
                                            </label>
                                            <input
                                                id="role"
                                                type="text"
                                                placeholder="e.g., Developer"
                                                value={filters.role}
                                                onChange={(e) => handleFilterChange('role', e.target.value)}
                                                className="w-full px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
                                            />
                                        </div>

                                        {/* Country Dropdown */}
                                        <div>
                                            <label htmlFor="country" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Country
                                                </div>
                                            </label>
                                            <select
                                                id="country"
                                                value={filters.country}
                                                onChange={(e) => handleFilterChange('country', e.target.value)}
                                                className="w-full px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
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
                                            <label htmlFor="city" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Location
                                                </div>
                                            </label>
                                            <input
                                                id="city"
                                                type="text"
                                                placeholder="e.g., Madrid"
                                                value={filters.city}
                                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                                className="w-full px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
                                            />
                                        </div>

                                        {/* Skills Multi-Select */}
                                        <div>
                                            <label htmlFor="skill-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Skills
                                                </div>
                                            </label>
                                            <input
                                                id="skill-input"
                                                type="text"
                                                placeholder="Search skills..."
                                                list="skills-datalist"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSkillAdd(e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                                className="w-full px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all"
                                            />
                                            <datalist id="skills-datalist">
                                                {availableSkills.map(skill => (
                                                    <option key={skill} value={skill} />
                                                ))}
                                            </datalist>
                                        </div>

                                        {/* Checkboxes - Combined */}
                                        <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded p-1.5 space-y-1">
                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.availability}
                                                    onChange={(e) => handleFilterChange('availability', e.target.checked)}
                                                    className="h-3 w-3 text-cv-blue rounded border border-gray-300 focus:ring-1 focus:ring-cv-blue"
                                                />
                                                <span className="text-xs font-medium text-gray-900 dark:text-white">Open to work</span>
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.verifiedOnly}
                                                    onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                                                    className="h-3 w-3 text-cv-blue rounded border border-gray-300 focus:ring-1 focus:ring-cv-blue"
                                                />
                                                <span className="text-xs font-medium text-gray-900 dark:text-white">Verified only</span>
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.remote}
                                                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                                                    className="h-3 w-3 text-cv-blue rounded border border-gray-300 focus:ring-1 focus:ring-cv-blue"
                                                />
                                                <span className="text-xs font-medium text-gray-900 dark:text-white">Remote only</span>
                                            </label>
                                        </div>

                                        {/* Salary Expectation (EUR) */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Salary
                                                </div>
                                            </label>
                                            <div className="grid grid-cols-2 gap-1">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={filters.salaryMin}
                                                    onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                                                    className="w-full px-1.5 py-0.5 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={filters.salaryMax}
                                                    onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                                                    className="w-full px-1.5 py-0.5 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        {/* Years of Experience */}
                                        <div>
                                            <label htmlFor="experience" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Experience
                                                </div>
                                            </label>
                                            <select
                                                id="experience"
                                                value={filters.experienceLevel}
                                                onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                                                className="w-full px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                                            >
                                                <option value="Any">Any</option>
                                                <option value="0-2">0-2 years</option>
                                                <option value="3-5">3-5 years</option>
                                                <option value="6-10">6-10 years</option>
                                                <option value="10+">10+ years</option>
                                            </select>
                                        </div>

                                        {/* Clear Filters Button */}
                                        <button
                                            onClick={clearAllFilters}
                                            className="w-full px-1.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Area */}
                            <div className="lg:col-span-5">
                                {/* Sort and Results Header */}
                                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cv-blue/10 rounded-lg">
                                            <svg className="w-5 h-5 text-cv-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Candidates found</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {totalProfiles} {totalProfiles === 1 ? 'professional' : 'professionals'}
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
                                            No matching profiles
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                            Adjust your search criteria to discover more candidates
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
                                        {/* Profile Cards Grid - 4 columns on desktop */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

