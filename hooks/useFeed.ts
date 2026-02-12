import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { FeedPost, CreatePostInput } from '../types/feed';

const POSTS_PER_PAGE = 10;

export const useFeed = () => {
  const { session } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const pageRef = useRef(0);

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
            avatar_url
          )
        `)
        .eq('is_hidden', false)
        .eq('visibility', 'PUBLIC')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      // Fetch user's likes for these posts
      const postIds = postsData?.map(p => p.id) || [];
      let userLikes: string[] = [];

      if (postIds.length > 0) {
        const { data: likesData } = await supabase
          .from('feed_likes')
          .select('post_id')
          .eq('user_id', session.user.id)
          .in('post_id', postIds);

        userLikes = likesData?.map(l => l.post_id) || [];
      }

      // Mark liked posts
      const processedPosts = postsData?.map(post => ({
        ...post,
        hasLiked: userLikes.includes(post.id)
      })) || [];

      setHasMore(processedPosts.length === POSTS_PER_PAGE);

      if (append) {
        setPosts(prev => [...prev, ...processedPosts]);
      } else {
        setPosts(processedPosts);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Error al cargar el feed');
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
          visibility: input.visibility || 'PUBLIC'
        })
        .select(`
          *,
          author:profiles!author_id (
            id,
            full_name,
            headline,
            avatar_url
          )
        `)
        .single();

      if (createError) throw createError;

      // Add to top of feed
      setPosts(prev => [{ ...data, hasLiked: false }, ...prev]);

      return data;
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Error al crear publicacion');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
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
    isCreating
  };
};
