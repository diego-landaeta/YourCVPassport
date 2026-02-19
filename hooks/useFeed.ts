import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useTranslations } from './useTranslations';
import type { FeedPost, CreatePostInput, ReactionType } from '../types/feed';

const POSTS_PER_PAGE = 10;

export const useFeed = () => {
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

      // Fetch posts with author info
      const { data: postsData, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      // Fetch user's likes and reposts for these posts
      const postIds = postsData?.map(p => p.id) || [];
      let userReactions: Record<string, ReactionType> = {};
      let userReposts: string[] = [];
      let userBookmarks: string[] = [];
      let userPollVotes: Record<string, number> = {};
      let pollVoteCountsMap: Record<string, { option_index: number; count: number }[]> = {};

      if (postIds.length > 0) {
        // Core queries (likes + reposts) — these tables always exist
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

        // Bookmarks query — may fail if migration wasn't run yet
        try {
          const bookmarksRes = await supabase
            .from('feed_bookmarks')
            .select('post_id')
            .eq('user_id', session.user.id)
            .in('post_id', postIds);
          userBookmarks = bookmarksRes.data?.map(b => b.post_id) || [];
        } catch {
          // Table may not exist yet — gracefully ignore
        }

        // Poll votes: fetch user's votes + aggregate counts for POLL posts
        const pollPostIds = postsData?.filter(p => p.content_type === 'POLL').map(p => p.id) || [];

        if (pollPostIds.length > 0) {
          try {
            const [myVotesRes, countsRes] = await Promise.all([
              supabase
                .from('feed_poll_votes')
                .select('post_id, option_index')
                .eq('user_id', session.user.id)
                .in('post_id', pollPostIds),
              supabase
                .rpc('get_poll_vote_counts', { poll_post_ids: pollPostIds })
            ]);

            for (const v of myVotesRes.data || []) {
              userPollVotes[v.post_id] = v.option_index;
            }

            // If RPC doesn't exist yet, fall back to empty
            if (countsRes.data) {
              for (const row of countsRes.data as { post_id: string; option_index: number; count: number }[]) {
                if (!pollVoteCountsMap[row.post_id]) pollVoteCountsMap[row.post_id] = [];
                pollVoteCountsMap[row.post_id].push({ option_index: row.option_index, count: row.count });
              }
            }
          } catch {
            // Poll tables may not exist yet — gracefully ignore
          }
        }

        // Build a map of postId → reactionType
        for (const l of likesRes.data || []) {
          userReactions[l.post_id] = l.reaction_type as ReactionType;
        }
        userReposts = repostsRes.data?.map(r => r.original_post_id) || [];
      }

      // Mark liked / reposted / bookmarked posts with reaction type + poll data
      const processedPosts = postsData?.map(post => ({
        ...post,
        hasLiked: !!userReactions[post.id],
        hasReposted: userReposts.includes(post.id),
        hasBookmarked: userBookmarks.includes(post.id),
        userReaction: userReactions[post.id] || null,
        userPollVote: userPollVotes[post.id] ?? null,
        pollVoteCounts: pollVoteCountsMap[post.id] || [],
      })) || [];

      setHasMore(processedPosts.length === POSTS_PER_PAGE);

      if (append) {
        setPosts(prev => [...prev, ...processedPosts]);
      } else {
        setPosts(processedPosts);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(t.feed.errors.loadingFeed);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

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
          visibility: input.visibility || 'PUBLIC'
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

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPosts(0);
  }, [fetchPosts]);

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
        (payload) => {
          // Only refresh if it's not from current user (they already have it)
          if (payload.new.author_id !== session.user.id) {
            refreshFeed();
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
