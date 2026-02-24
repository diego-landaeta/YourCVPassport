import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useTranslations } from './useTranslations';
import type { FeedPost, CreatePostInput, ReactionType, FeedContentType } from '../types/feed';

const POSTS_PER_PAGE = 10;

export const useFeed = (filterType: FeedContentType | 'ALL' = 'ALL', searchTerm: string = '') => {
  const { session } = useAuth();
  const t = useTranslations();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [postCooldown, setPostCooldown] = useState(false);
  const pageRef = useRef(0);
  const hasFetchedRef = useRef(false);

  const fetchPosts = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!session?.user.id) return;

    try {
      setLoading(true);
      setError(null);

      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Fetch posts with author info — filtered server-side
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

      // Fetch user's likes and reposts for these posts
      const postIds = postsData?.map(p => p.id) || [];
      let userReactions: Record<string, ReactionType> = {};
      let userReposts: string[] = [];
      let userBookmarks: string[] = [];
      let userPollVotes: Record<string, number> = {};
      let pollVoteCountsMap: Record<string, { option_index: number; count: number }[]> = {};
      let topReactionsMap: Record<string, ReactionType[]> = {};
      let realLikesCount: Record<string, number> = {};
      let groupMap: Record<string, { id: string; name: string; metadata?: Record<string, unknown> }> = {};

      if (postIds.length > 0) {
        // Core queries — these tables always exist
        const [likesRes, repostsRes, allReactionsRes] = await Promise.all([
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
          supabase
            .from('feed_likes')
            .select('post_id, reaction_type')
            .in('post_id', postIds),
        ]);

        // Build reaction maps from already-fetched data
        for (const l of likesRes.data || []) {
          userReactions[l.post_id] = l.reaction_type as ReactionType;
        }
        userReposts = repostsRes.data?.map(r => r.original_post_id) || [];

        const reactCountMap: Record<string, Record<string, number>> = {};
        for (const l of allReactionsRes.data || []) {
          if (!reactCountMap[l.post_id]) reactCountMap[l.post_id] = {};
          reactCountMap[l.post_id][l.reaction_type] = (reactCountMap[l.post_id][l.reaction_type] || 0) + 1;
          realLikesCount[l.post_id] = (realLikesCount[l.post_id] || 0) + 1;
        }
        for (const [pid, counts] of Object.entries(reactCountMap)) {
          topReactionsMap[pid] = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([rt]) => rt as ReactionType);
        }

        // Optional tables (bookmarks, polls, groups) — may not exist yet
        // These are queried separately so 400 errors don't block core feed
        const pollPostIds = postsData?.filter(p => p.content_type === 'POLL').map(p => p.id) || [];
        const groupIds = [...new Set(postsData?.filter(p => p.group_id).map(p => p.group_id as string) || [])];

        const optionalQueries: Promise<void>[] = [];

        // Bookmarks
        optionalQueries.push(
          Promise.resolve(
            supabase
              .from('feed_bookmarks')
              .select('post_id')
              .eq('user_id', session.user.id)
              .in('post_id', postIds)
          ).then(res => { userBookmarks = res.data?.map(b => b.post_id) || []; })
        );

        if (pollPostIds.length > 0) {
          optionalQueries.push(
            Promise.all([
              supabase.from('feed_poll_votes').select('post_id, option_index').eq('user_id', session.user.id).in('post_id', pollPostIds),
              supabase.rpc('get_poll_vote_counts', { poll_post_ids: pollPostIds }),
            ]).then(([myVotesRes, countsRes]) => {
              for (const v of myVotesRes.data || []) userPollVotes[v.post_id] = v.option_index;
              if (countsRes.data) {
                for (const row of countsRes.data as { post_id: string; option_index: number; count: number }[]) {
                  if (!pollVoteCountsMap[row.post_id]) pollVoteCountsMap[row.post_id] = [];
                  pollVoteCountsMap[row.post_id].push({ option_index: row.option_index, count: row.count });
                }
              }
            })
          );
        }

        if (groupIds.length > 0) {
          optionalQueries.push(
            Promise.resolve(supabase.from('groups').select('id, name, metadata').in('id', groupIds))
              .then(({ data: groupsData }) => {
                for (const g of groupsData || []) groupMap[g.id] = g;
              })
          );
        }

        // Await all optional queries but don't fail if any 400
        await Promise.allSettled(optionalQueries);
      }

      // Mark liked / reposted / bookmarked posts with reaction type + poll data
      const processedPosts = postsData?.map(post => {
        // Use real likes count from feed_likes if available, otherwise keep denormalized
        const realCount = realLikesCount[post.id];
        const correctedLikesCount = realCount !== undefined ? realCount : post.likes_count;
        return {
          ...post,
          likes_count: correctedLikesCount,
          hasLiked: !!userReactions[post.id],
          hasReposted: userReposts.includes(post.id),
          hasBookmarked: userBookmarks.includes(post.id),
          userReaction: userReactions[post.id] || null,
          topReactions: topReactionsMap[post.id] || [],
          userPollVote: userPollVotes[post.id] ?? null,
          pollVoteCounts: pollVoteCountsMap[post.id] || [],
          group: post.group_id ? (groupMap[post.group_id] ?? null) : null,
        };
      }) || [];

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
      console.error('Error fetching feed:', err);
      setError(t.feed.errors.loadingFeed);
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

  const createPost = useCallback(async (input: CreatePostInput) => {
    if (!session?.user.id) return;
    if (postCooldown) throw new Error('rate_limited');

    try {
      setIsCreating(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('feed_posts')
        .insert({
          author_id: session.user.id,
          content: input.content,
          content_type: input.imageUrls && input.imageUrls.length > 0 ? 'IMAGE' : (input.contentType || 'TEXT'),
          image_urls: input.imageUrls || [],
          achievement_type: input.achievementType,
          achievement_data: input.achievementData || {},
          metadata: input.metadata || {},
          visibility: input.visibility || 'PUBLIC',
          ...(input.group_id ? { group_id: input.group_id } : {}),
        })
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
        .single();

      if (createError) throw createError;

      // Add to top of feed
      setPosts(prev => [{ ...data, hasLiked: false, hasReposted: false, hasBookmarked: false, userReaction: null }, ...prev]);

      // Rate limit: 30s cooldown between posts
      setPostCooldown(true);
      setTimeout(() => setPostCooldown(false), 30000);

      return data;
    } catch (err) {
      console.error('Error creating post:', err);
      setError(t.feed.errors.creatingPost);
      throw err; // Re-throw so the form knows the post failed and keeps content
    } finally {
      setIsCreating(false);
    }
  }, [session?.user.id]);

  // Initial fetch + refetch on filter/search change
  useEffect(() => {
    pageRef.current = 0;
    hasFetchedRef.current = true;
    fetchPosts(0);
  }, [fetchPosts]); // fetchPosts recreates when filterType/searchTerm/session change

  // Real-time subscription
  useEffect(() => {
    if (!session?.user.id) return;

    const subscription = supabase
      .channel('feed_posts_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_posts'
        },
        async (payload) => {
          // Prepend new post from other users without resetting pagination
          const newPost = payload.new as FeedPost;
          if (newPost.author_id !== session.user.id && newPost.is_hidden === false && newPost.visibility === 'PUBLIC') {
            // Fetch author profile so the post renders with name/avatar
            const { data: author } = await supabase
              .from('profiles')
              .select('id, full_name, headline, avatar_url, slug')
              .eq('id', newPost.author_id)
              .single();

            setPosts(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              return [{
                ...newPost,
                author: author || undefined,
                hasLiked: false,
                hasReposted: false,
                hasBookmarked: false,
                userReaction: null,
                topReactions: [],
                pollVoteCounts: [],
              }, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user.id, refreshFeed]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    refreshFeed,
    isCreating,
    postCooldown
  };
};
