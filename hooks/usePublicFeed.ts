import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { FeedPost, ReactionType, FeedContentType } from '../types/feed';

const POSTS_PER_PAGE = 10;

export const usePublicFeed = (filterType: FeedContentType | 'ALL' = 'ALL', searchTerm: string = '') => {
  const { session } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchPosts = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let query = supabase
        .from('feed_posts')
        .select(`
          *,
          author:profiles!author_id (
            id,
            full_name,
            headline,
            avatar_url,
            slug
          )
        `)
        .eq('is_hidden', false)
        .eq('visibility', 'PUBLIC')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filterType !== 'ALL') {
        query = query.eq('content_type', filterType);
      }
      if (searchTerm.trim()) {
        query = query.ilike('content', `%${searchTerm.trim()}%`);
      }

      const { data: postsData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const postIds = postsData?.map(p => p.id) || [];

      // Fetch all reactions for top-reaction bubbles (public, no auth needed)
      let topReactionsMap: Record<string, ReactionType[]> = {};
      if (postIds.length > 0) {
        const allReactionsRes = await supabase
          .from('feed_likes')
          .select('post_id, reaction_type')
          .in('post_id', postIds);
        const reactCountMap: Record<string, Record<string, number>> = {};
        for (const l of allReactionsRes.data || []) {
          if (!reactCountMap[l.post_id]) reactCountMap[l.post_id] = {};
          reactCountMap[l.post_id][l.reaction_type] = (reactCountMap[l.post_id][l.reaction_type] || 0) + 1;
        }
        for (const [pid, counts] of Object.entries(reactCountMap)) {
          topReactionsMap[pid] = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([rt]) => rt as ReactionType);
        }
      }

      // If user is logged in, fetch their reactions for richer display
      let userReactions: Record<string, ReactionType> = {};
      let userReposts: string[] = [];
      let userBookmarks: string[] = [];

      if (session?.user.id && postIds.length > 0) {
        const [likesRes, repostsRes] = await Promise.all([
          supabase
            .from('feed_likes')
            .select('post_id, reaction_type')
            .eq('user_id', session.user.id)
            .in('post_id', postIds),
          supabase
            .from('feed_shares')
            .select('original_post_id')
            .eq('shared_by', session.user.id)
            .eq('share_type', 'REPOST')
            .in('original_post_id', postIds),
        ]);

        // Bookmarks table may not exist yet — query separately so 400 doesn't break core data
        const bookmarksRes = await supabase
          .from('feed_bookmarks')
          .select('post_id')
          .eq('user_id', session.user.id)
          .in('post_id', postIds)
          .then(res => res.error ? { data: [] as { post_id: string }[] } : res);

        for (const l of likesRes.data || []) {
          userReactions[l.post_id] = l.reaction_type as ReactionType;
        }
        userReposts = repostsRes.data?.map(r => r.original_post_id) || [];
        userBookmarks = (bookmarksRes as { data: { post_id: string }[] | null }).data?.map(b => b.post_id) || [];
      }

      const processedPosts = postsData?.map(post => ({
        ...post,
        hasLiked: !!userReactions[post.id],
        hasReposted: userReposts.includes(post.id),
        hasBookmarked: userBookmarks.includes(post.id),
        userReaction: userReactions[post.id] || null,
        topReactions: topReactionsMap[post.id] || [],
        userPollVote: null,
        pollVoteCounts: [],
      })) || [];

      setHasMore(processedPosts.length === POSTS_PER_PAGE);

      if (append) {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...processedPosts.filter(p => !existingIds.has(p.id))];
        });
      } else {
        setPosts(processedPosts);
      }
    } catch (err) {
      console.error('Error fetching public feed:', err);
      setError('Error al cargar el feed');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id, filterType, searchTerm]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      pageRef.current += 1;
      fetchPosts(pageRef.current, true);
    }
  }, [loading, hasMore, fetchPosts]);

  const refreshFeed = useCallback(() => {
    pageRef.current = 0;
    fetchPosts(0, false);
  }, [fetchPosts]);

  // Refetch when auth, filter, or search changes
  const sessionUserId = session?.user.id;
  useEffect(() => {
    pageRef.current = 0;
    fetchPosts(0);
  }, [sessionUserId, filterType, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  return { posts, loading, error, hasMore, loadMore, refreshFeed };
};
