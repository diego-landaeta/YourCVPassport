import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useTranslations } from './useTranslations';
import type { FeedComment } from '../types/feed';

export const useFeedComments = (postId: string) => {
  const { session } = useAuth();
  const t = useTranslations();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Keep a ref of current comments for optimistic rollbacks
  const commentsRef = useRef<FeedComment[]>([]);
  useEffect(() => { commentsRef.current = comments; }, [comments]);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch top-level comments with author info
      const { data, error: fetchError } = await supabase
        .from('feed_comments')
        .select(`
          *,
          author:profiles!author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          if (comment.replies_count > 0) {
            const { data: replies } = await supabase
              .from('feed_comments')
              .select(`
                *,
                author:profiles!author_id (
                  id,
                  full_name,
                  avatar_url
                )
              `)
              .eq('parent_id', comment.id)
              .eq('is_hidden', false)
              .order('created_at', { ascending: true });

            return { ...comment, replies: replies || [] };
          }
          return { ...comment, replies: [] };
        })
      );

      // Check if user has liked any comments
      if (session?.user.id && commentsWithReplies.length > 0) {
        const allCommentIds = commentsWithReplies.flatMap(c => [
          c.id,
          ...(c.replies?.map((r: FeedComment) => r.id) || [])
        ]);

        const { data: likedComments } = await supabase
          .from('feed_comment_likes')
          .select('comment_id')
          .eq('user_id', session.user.id)
          .in('comment_id', allCommentIds);

        const likedIds = new Set(likedComments?.map(l => l.comment_id) || []);

        const finalComments = commentsWithReplies.map(comment => ({
          ...comment,
          hasLiked: likedIds.has(comment.id),
          replies: comment.replies?.map((reply: FeedComment) => ({
            ...reply,
            hasLiked: likedIds.has(reply.id)
          }))
        }));

        setComments(finalComments);
      } else {
        setComments(commentsWithReplies);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(t.feed.errors.loadingFeed);
    } finally {
      setLoading(false);
    }
  }, [postId, session?.user.id]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!session?.user.id) return null;

    try {
      setIsAdding(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('feed_comments')
        .insert({
          post_id: postId,
          author_id: session.user.id,
          content,
          parent_id: parentId || null
        })
        .select(`
          *,
          author:profiles!author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (insertError) throw insertError;

      // Insert into state without full refetch
      const newComment: FeedComment = { ...data, hasLiked: false, replies: [] };

      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), newComment], replies_count: c.replies_count + 1 }
            : c
        ));
      } else {
        setComments(prev => [...prev, newComment]);
      }

      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(t.feed.errors.creatingPost);
      return null;
    } finally {
      setIsAdding(false);
    }
  }, [session?.user.id, postId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!session?.user.id) return false;

    // Snapshot for rollback
    const snapshot = commentsRef.current;

    // Optimistic removal
    setComments(prev =>
      prev
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies?.filter((r: FeedComment) => r.id !== commentId),
          replies_count: c.replies?.some((r: FeedComment) => r.id === commentId)
            ? c.replies_count - 1
            : c.replies_count,
        }))
    );

    try {
      const { error } = await supabase
        .from('feed_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', session.user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      setComments(snapshot); // Rollback
      return false;
    }
  }, [session?.user.id]);

  const editComment = useCallback(async (commentId: string, newContent: string) => {
    if (!session?.user.id) return false;

    // Snapshot for rollback
    const snapshot = commentsRef.current;

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) return { ...c, content: newContent, is_edited: true };
      return {
        ...c,
        replies: c.replies?.map((r: FeedComment) =>
          r.id === commentId ? { ...r, content: newContent, is_edited: true } : r
        ),
      };
    }));

    try {
      const { error } = await supabase
        .from('feed_comments')
        .update({
          content: newContent,
          is_edited: true
        })
        .eq('id', commentId)
        .eq('author_id', session.user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error editing comment:', err);
      setComments(snapshot); // Rollback
      return false;
    }
  }, [session?.user.id]);

  const toggleCommentLike = useCallback(async (commentId: string, currentlyLiked: boolean) => {
    if (!session?.user.id) return false;

    // Snapshot for rollback
    const snapshot = commentsRef.current;

    // Optimistic update
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          hasLiked: !currentlyLiked,
          likes_count: currentlyLiked ? comment.likes_count - 1 : comment.likes_count + 1
        };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map((reply: FeedComment) => {
            if (reply.id === commentId) {
              return {
                ...reply,
                hasLiked: !currentlyLiked,
                likes_count: currentlyLiked ? reply.likes_count - 1 : reply.likes_count + 1
              };
            }
            return reply;
          })
        };
      }
      return comment;
    }));

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from('feed_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feed_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: session.user.id
          });

        if (error) throw error;
      }

      return true;
    } catch (err) {
      console.error('Error toggling comment like:', err);
      setComments(snapshot); // Rollback on failure
      return false;
    }
  }, [session?.user.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    editComment,
    toggleCommentLike,
    isAdding,
    refresh: fetchComments
  };
};
