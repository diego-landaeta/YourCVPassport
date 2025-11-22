import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../supabase/client';
import { CountryBadge } from './CountrySelector';

interface ProfileCardProps {
    profile: any;
    skills: string[];
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, skills }) => {
    const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0052FF&color=fff&size=128`;

    return (
        <div className="group relative bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-cv-blue overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cv-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative p-6 flex flex-col h-full">
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

                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    {profile.country_code && (
                        <div className="flex items-center gap-2">
                            <CountryBadge countryCode={profile.country_code} size="md" showName={false} />
                            {profile.location && (
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{profile.location}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-grow mb-4">
                    <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 3).map((skill: string, index: number) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-cv-blue/10 to-indigo-500/10 text-cv-blue text-xs font-semibold rounded-lg border border-cv-blue/20"
                            >
                                {skill}
                            </span>
                        ))}
                        {skills.length > 3 && (
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg">
                                +{skills.length - 3} more
                            </span>
                        )}
                    </div>
                </div>

                <Link
                    to={`/cv/${profile.slug || profile.id}`}
                    className="w-full bg-gradient-to-r from-cv-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl text-center flex items-center justify-center gap-2"
                >
                    <span>View Profile</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

// Country/City mapping
const COUNTRY_NAMES: { [key: string]: string } = {
    ES: 'Spain',
    MX: 'Mexico',
    AR: 'Argentina',
    CO: 'Colombia',
    CL: 'Chile',
    PE: 'Peru',
    US: 'United States',
    GB: 'United Kingdom',
    FR: 'France',
    DE: 'Germany',
    IT: 'Italy',
    BR: 'Brazil',
};

const ProfileCategoryPage: React.FC = () => {
    const { country, city, role, skill } = useParams<{
        country?: string;
        city?: string;
        role?: string;
        skill?: string;
    }>();
    const { lang } = useLanguage();

    const [profiles, setProfiles] = useState<any[]>([]);
    const [profileSkills, setProfileSkills] = useState<{ [key: string]: string[] }>({});
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProfiles, setTotalProfiles] = useState(0);
    const profilesPerPage = 20;

    useEffect(() => {
        loadProfiles();
    }, [country, city, role, skill, currentPage]);

    const loadProfiles = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .not('full_name', 'is', null)
                .not('headline', 'is', null);

            // Apply category filters
            if (country) {
                query = query.eq('country_code', country.toUpperCase());
            }

            if (city) {
                query = query.ilike('location', `%${city}%`);
            }

            if (role) {
                const roleFormatted = role.replace(/-/g, ' ');
                query = query.or(`headline.ilike.%${roleFormatted}%,title.ilike.%${roleFormatted}%`);
            }

            // Pagination
            const from = (currentPage - 1) * profilesPerPage;
            const to = from + profilesPerPage - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

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

                // Filter by skill if needed
                let filteredProfiles = profilesData;
                if (skill) {
                    const skillFormatted = skill.replace(/-/g, ' ');
                    filteredProfiles = profilesData.filter(profile => {
                        const profileSkillsList = skillsMap[profile.id] || [];
                        return profileSkillsList.some(s =>
                            s.toLowerCase().includes(skillFormatted.toLowerCase())
                        );
                    });
                }

                setProfiles(filteredProfiles);
                setProfileSkills(skillsMap);
                setTotalProfiles(count || filteredProfiles.length);
            }
        } catch (err) {
            console.error('Error loading profiles:', err);
        } finally {
            setLoading(false);
        }
    };

    // Build breadcrumbs
    const breadcrumbs = [
        { label: 'Home', path: '/' },
        { label: 'Profiles', path: '/profiles' },
    ];

    if (country) {
        breadcrumbs.push({
            label: COUNTRY_NAMES[country.toUpperCase()] || country,
            path: `/profiles/${country.toLowerCase()}`,
        });
    }

    if (city) {
        const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
        breadcrumbs.push({
            label: cityFormatted,
            path: country
                ? `/profiles/${country.toLowerCase()}/${city.toLowerCase()}`
                : `/profiles/${city.toLowerCase()}`,
        });
    }

    if (role) {
        const roleFormatted = role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        breadcrumbs.push({
            label: roleFormatted,
            path: city
                ? `/profiles/${country}/${city}/${role}`
                : country
                ? `/profiles/${country}/${role}`
                : `/profiles/${role}`,
        });
    }

    if (skill) {
        const skillFormatted = skill.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        breadcrumbs.push({
            label: skillFormatted,
            path: city
                ? `/profiles/${country}/${city}/${skill}`
                : country
                ? `/profiles/${country}/${skill}`
                : `/profiles/${skill}`,
        });
    }

    // Generate dynamic title and description
    const generateTitle = () => {
        const parts = [];
        if (role) parts.push(role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        if (skill) parts.push(skill.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        if (city) parts.push(`in ${city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ')}`);
        if (country) parts.push(COUNTRY_NAMES[country.toUpperCase()] || country);

        return parts.length > 0 ? parts.join(' ') : 'Professional Profiles';
    };

    const generateDescription = () => {
        const title = generateTitle();
        return `Browse ${totalProfiles > 0 ? totalProfiles : ''} verified ${title} profiles. Connect with top talent, view credentials, and find the perfect candidate for your team.`;
    };

    const title = generateTitle();
    const description = generateDescription();

    // Generate Schema.org ItemList markup
    const schemaOrgMarkup = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: title,
        description: description,
        numberOfItems: totalProfiles,
        itemListElement: profiles.map((profile, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Person',
                '@id': `${window.location.origin}/cv/${profile.slug || profile.id}`,
                name: profile.full_name,
                jobTitle: profile.headline || profile.title,
                address: profile.location
                    ? {
                          '@type': 'PostalAddress',
                          addressLocality: profile.location,
                          addressCountry: profile.country_code,
                      }
                    : undefined,
                image: profile.avatar_url,
                url: `${window.location.origin}/cv/${profile.slug || profile.id}`,
                knowsAbout: profileSkills[profile.id] || [],
            },
        })),
    };

    const totalPages = Math.ceil(totalProfiles / profilesPerPage);

    return (
        <>
            <Helmet>
                <title>{title} - YourCVPassport</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={`${title} - YourCVPassport`} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={window.location.href} />
                <script type="application/ld+json">{JSON.stringify(schemaOrgMarkup)}</script>
            </Helmet>

            <div className="bg-white dark:bg-dark-bg-primary min-h-screen">
                {/* Breadcrumbs */}
                <nav className="bg-gray-50 dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                    <div className="max-w-7xl mx-auto">
                        <ol className="flex items-center space-x-2 text-sm">
                            {breadcrumbs.map((crumb, index) => (
                                <li key={crumb.path} className="flex items-center">
                                    {index > 0 && (
                                        <svg
                                            className="w-4 h-4 mx-2 text-gray-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                    {index === breadcrumbs.length - 1 ? (
                                        <span className="font-medium text-cv-blue">{crumb.label}</span>
                                    ) : (
                                        <Link
                                            to={crumb.path}
                                            className="text-gray-600 dark:text-gray-400 hover:text-cv-blue transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                </nav>

                {/* Hero Section with Dynamic H1 */}
                <section className="bg-gradient-to-br from-cv-blue via-indigo-600 to-purple-600 text-white py-16 px-4">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{title}</h1>
                        <p className="text-xl text-blue-100 max-w-3xl">{description}</p>
                    </div>
                </section>

                {/* Profiles Grid */}
                <section className="py-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Results Header */}
                        <div className="mb-6 flex items-center justify-between bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-sm">
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
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cv-blue mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading profiles...</p>
                            </div>
                        ) : profiles.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-sm border-2 border-dashed border-gray-300">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    No profiles found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Try browsing other categories or visit the main directory
                                </p>
                                <Link
                                    to="/profiles"
                                    className="inline-block px-6 py-3 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    Browse All Profiles
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Profile Cards Grid */}
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
                                            className="px-4 py-2 bg-white dark:bg-dark-bg-secondary border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>

                                        <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 bg-white dark:bg-dark-bg-secondary border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

export default ProfileCategoryPage;
