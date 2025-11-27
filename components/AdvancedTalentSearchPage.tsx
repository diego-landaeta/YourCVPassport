import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useTranslations } from '../hooks/useTranslations';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../supabase/client';
import { Link } from 'react-router-dom';
import { CountryBadge } from './CountrySelector';

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
    const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0052FF&color=fff&size=128`;
    
    return (
        <div className="group relative bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-cv-blue dark:hover:border-cv-blue overflow-hidden">
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cv-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Content */}
            <div className="relative p-6 flex flex-col h-full">
                {/* Header with Avatar and Badge */}
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
                            <div className="absolute -top-2 -right-2 bg-cv-green text-white p-1.5 rounded-full shadow-lg">
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
                        <div className="flex items-center gap-2">
                            <CountryBadge countryCode={profile.country_code} size="md" showName={false} />
                            {profile.location && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="font-medium">{profile.location}</span>
                                </div>
                            )}
                        </div>
                    ) : profile.location ? (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                            <span className="font-medium">{profile.location}</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-sm text-gray-400 dark:text-gray-600 italic">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                            <span>Ubicación no especificada</span>
                        </div>
                    )}
                </div>

                {/* Skills */}
                <div className="flex-grow mb-4">
                    <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 4).map((skill: string, index: number) => (
                            <span 
                                key={index} 
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-cv-blue/10 to-indigo-500/10 dark:from-cv-blue/20 dark:to-indigo-500/20 text-cv-blue dark:text-cv-blue-light text-xs font-semibold rounded-lg border border-cv-blue/20 dark:border-cv-blue/30"
                            >
                                {skill}
                            </span>
                        ))}
                        {skills.length > 4 && (
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                +{skills.length - 4} más
                            </span>
                        )}
                    </div>
                    {skills.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                            Sin habilidades registradas
                        </p>
                    )}
                </div>

                {/* View Profile Button */}
                <Link 
                    to={`/cv/${profile.slug || profile.id}`}
                    className="w-full bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl text-center flex items-center justify-center gap-2 group-hover:scale-105"
                >
                    <span>Ver Perfil</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </div>
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
        <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cv-blue to-indigo-600 p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{filterLabels.title}</h3>
                        <p className="text-sm text-blue-100">Refina tu búsqueda</p>
                    </div>
                </div>
            </div>
            
            {/* Filters */}
            <div className="p-6 space-y-6">
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            className="h-5 w-5 text-cv-blue rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-cv-blue transition-all" 
                            id="verified-only"
                            checked={filters.verifiedOnly}
                            onChange={(e) => onFilterChange({ ...filters, verifiedOnly: e.target.checked })}
                        />
                        <div className="flex-1">
                            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-cv-blue transition-colors">
                                Verified profiles only
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Premium and Pro members
                            </p>
                        </div>
                        <svg className="w-5 h-5 text-cv-green" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                    </label>
                </div>
                
                <div>
                     <label htmlFor="skills" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {filterLabels.skills.label}
                     </label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <input 
                            id="skills" 
                            type="text" 
                            placeholder={filterLabels.skills.placeholder}
                            value={filters.skills}
                            onChange={(e) => onFilterChange({ ...filters, skills: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all" 
                        />
                     </div>
                </div>

                <div>
                     <label htmlFor="country" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Country
                        </div>
                     </label>
                     <select
                        id="country"
                        value={filters.country}
                        onChange={(e) => onFilterChange({ ...filters, country: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all appearance-none bg-white dark:bg-dark-bg-tertiary cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                     >
                        <option value="">All countries</option>
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

                <div>
                     <label htmlFor="location" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {filterLabels.location.label}
                        </div>
                     </label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <input 
                            id="location" 
                            type="text" 
                            placeholder={filterLabels.location.placeholder}
                            value={filters.location}
                            onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all" 
                        />
                     </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                        </svg>
                        Ciudad o región específica
                    </p>
                </div>

                <div>
                     <label htmlFor="salary" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {filterLabels.salary.label}
                        </div>
                     </label>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                            <input 
                                id="salary" 
                                type="number" 
                                placeholder={filterLabels.salary.min}
                                value={filters.salaryMin}
                                onChange={(e) => onFilterChange({ ...filters, salaryMin: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all" 
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Mínimo</p>
                        </div>
                        <div>
                            <input 
                                type="number" 
                                placeholder={filterLabels.salary.max}
                                value={filters.salaryMax}
                                onChange={(e) => onFilterChange({ ...filters, salaryMax: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all" 
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Máximo</p>
                        </div>
                     </div>
                </div>
                
                <div>
                    <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {filterLabels.experience.label}
                        </div>
                    </label>
                    <select 
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cv-blue focus:border-cv-blue dark:bg-dark-bg-tertiary dark:text-white transition-all appearance-none bg-white dark:bg-dark-bg-tertiary cursor-pointer"
                        value={filters.experienceLevel}
                        onChange={(e) => onFilterChange({ ...filters, experienceLevel: e.target.value })}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                        {filterLabels.experience.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>
            
            {/* Apply Button */}
            <div className="p-6 pt-0">
                <button 
                    onClick={onApplyFilters}
                    className="w-full bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
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
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        verifiedOnly: false,
        skills: '',
        country: '',
        location: '',
        salaryMin: '',
        salaryMax: '',
        experienceLevel: 'Cualquiera'
    });

    // Load profiles from database
    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            
            // Get profiles with complete information
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .not('full_name', 'is', null)
                .not('headline', 'is', null)
                .not('summary', 'is', null)
                .order('created_at', { ascending: false })
                .limit(50);

            if (profilesError) throw profilesError;

            // Get skills for each profile
            const skillsMap: { [key: string]: string[] } = {};
            
            if (profilesData) {
                for (const profile of profilesData) {
                    const { data: skillsData } = await supabase
                        .from('skills')
                        .select('name')
                        .eq('profile_id', profile.id);
                    
                    skillsMap[profile.id] = skillsData?.map(s => s.name) || [];
                }
            }

            setProfiles(profilesData || []);
            setProfileSkills(skillsMap);
        } catch (err) {} finally {
            setLoading(false);
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
                profileSkills[p.id]?.some(skill => skill.toLowerCase().includes(query))
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
                profileSkills[p.id]?.some(skill => skill.toLowerCase().includes(skillQuery))
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
            <section className="bg-cv-light-gray dark:bg-dark-bg-secondary text-center py-20 px-4">
                <AnimatedWrapper>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-cv-dark-gray dark:text-dark-text-primary">
                        {pageData.title}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-dark-text-secondary">
                        {pageData.subtitle}
                    </p>
                    <div className="mt-8 max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 bg-white dark:bg-dark-bg-primary p-4 rounded-lg shadow-lg">
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
                </AnimatedWrapper>
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
                                Encuentra el talento perfecto para tu equipo con filtros avanzados
                            </p>
                        </div>
                        
                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-3">
                                <div className="sticky top-6">
                                    <FilterSection 
                                        filters={filters}
                                        onFilterChange={setFilters}
                                        onApplyFilters={() => {}}
                                    />
                                </div>
                            </div>
                            
                            {/* Results Area */}
                            <div className="lg:col-span-9">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-sm">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cv-blue mb-4"></div>
                                        <p className="text-gray-600 dark:text-gray-400">Cargando perfiles...</p>
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
                                            No se encontraron perfiles
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                            Intenta ajustar los filtros de búsqueda o ampliar tus criterios
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
                                                    experienceLevel: 'Cualquiera'
                                                });
                                                setSearchQuery('');
                                            }}
                                            className="px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                        >
                                            Limpiar Filtros
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
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Resultados encontrados</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {filteredProfiles.length} {filteredProfiles.length === 1 ? 'perfil' : 'perfiles'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => loadProfiles()}
                                                className="px-4 py-2 text-sm font-medium text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Actualizar
                                            </button>
                                        </div>

                                        {/* Profile Cards Grid */}
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {filteredProfiles.map(profile => (
                                                <ProfileCard 
                                                    key={profile.id} 
                                                    profile={profile}
                                                    skills={profileSkills[profile.id] || []}
                                                />
                                            ))}
                                        </div>
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

