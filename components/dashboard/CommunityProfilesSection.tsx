import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import { MagnifyingGlassIcon, ArrowLeftIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline';

type CommunityMember = {
  id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  slug: string | null;
  post_count: number;
  likes_received: number;
};

const MEMBERS_PER_PAGE = 20;

const CommunityProfilesSection: React.FC<{
  onSectionChange?: (section: string) => void;
}> = ({ onSectionChange }) => {
  const { lang } = useLanguage();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMembers = useCallback(async (page: number, append: boolean) => {
    try {
      setLoading(true);
      const from = page * MEMBERS_PER_PAGE;

      // Get distinct authors from feed_posts with their post count + total likes
      const { data: postStats, error } = await supabase
        .from('feed_posts')
        .select('author_id, likes_count')
        .eq('is_hidden', false)
        .eq('visibility', 'PUBLIC');

      if (error) throw error;

      // Aggregate: count posts & sum likes per author
      const statsMap: Record<string, { post_count: number; likes_received: number }> = {};
      for (const row of postStats ?? []) {
        if (!statsMap[row.author_id]) statsMap[row.author_id] = { post_count: 0, likes_received: 0 };
        statsMap[row.author_id].post_count += 1;
        statsMap[row.author_id].likes_received += row.likes_count || 0;
      }

      // Sort by post count desc, then get a page of author IDs
      const sortedAuthors = Object.entries(statsMap)
        .sort((a, b) => b[1].post_count - a[1].post_count);

      // Apply search filter if needed — we'll filter after fetching profiles
      // First get all unique author IDs for this page range
      const pagedAuthorIds = sortedAuthors
        .slice(from, from + MEMBERS_PER_PAGE + 10) // fetch a few extra for search filtering
        .map(([id]) => id);

      if (pagedAuthorIds.length === 0) {
        if (!append) setMembers([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Fetch profiles for these authors
      let profileQuery = supabase
        .from('profiles')
        .select('id, full_name, headline, avatar_url, slug')
        .in('id', pagedAuthorIds);

      if (debouncedSearch.trim()) {
        profileQuery = profileQuery.or(`full_name.ilike.%${debouncedSearch.trim()}%,headline.ilike.%${debouncedSearch.trim()}%`);
      }

      const { data: profilesData } = await profileQuery;

      // Merge profile data with stats, maintain sort order
      const profileMap = new Map((profilesData ?? []).map(p => [p.id, p]));
      const results: CommunityMember[] = [];

      for (const [authorId, stats] of sortedAuthors) {
        const profile = profileMap.get(authorId);
        if (!profile) continue;
        results.push({
          id: profile.id,
          full_name: profile.full_name || '',
          headline: profile.headline,
          avatar_url: profile.avatar_url,
          slug: profile.slug,
          post_count: stats.post_count,
          likes_received: stats.likes_received,
        });
      }

      const paged = results.slice(from, from + MEMBERS_PER_PAGE);
      setHasMore(paged.length === MEMBERS_PER_PAGE);

      if (append) {
        setMembers(prev => [...prev, ...paged.filter(r => !prev.some(p => p.id === r.id))]);
      } else {
        setMembers(paged);
      }
    } catch (err) {
      console.error('Error fetching community members:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    pageRef.current = 0;
    fetchMembers(0, false);
  }, [fetchMembers]);

  const loadMore = () => {
    if (!loading && hasMore) {
      pageRef.current += 1;
      fetchMembers(pageRef.current, true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSectionChange?.('feed')}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {lang === 'es' ? 'Miembros de la comunidad' : 'Community Members'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'es' ? 'Profesionales activos en el feed' : 'Professionals active in the feed'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === 'es' ? 'Buscar por nombre o titular...' : 'Search by name or headline...'}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cv-blue/20 focus:border-cv-blue/50 transition-all"
        />
      </div>

      {/* Grid */}
      {loading && members.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-5 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mb-3" />
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="w-32 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {lang === 'es' ? 'No se encontraron miembros' : 'No members found'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map(m => (
              <a
                key={m.id}
                href={`/cv/${m.slug ?? m.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-5 hover:shadow-lg hover:border-cv-blue/30 transition-all group"
              >
                <div className="flex flex-col items-center text-center">
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt={m.full_name}
                      className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-gray-100 dark:ring-dark-border group-hover:ring-cv-blue/30 transition-all"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cv-blue to-indigo-600 text-white text-lg font-bold flex items-center justify-center mb-3 ring-2 ring-gray-100 dark:ring-dark-border group-hover:ring-cv-blue/30 transition-all">
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-cv-blue transition-colors truncate w-full">
                    {m.full_name}
                  </p>
                  {m.headline && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {m.headline}
                    </p>
                  )}
                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
                      <span>{m.post_count} {m.post_count === 1 ? 'post' : 'posts'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HeartIcon className="w-3.5 h-3.5" />
                      <span>{m.likes_received}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-cv-blue border border-cv-blue/30 rounded-xl hover:bg-cv-blue hover:text-white transition-all disabled:opacity-50"
              >
                {loading
                  ? (lang === 'es' ? 'Cargando...' : 'Loading...')
                  : (lang === 'es' ? 'Ver más miembros' : 'Load more members')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommunityProfilesSection;
