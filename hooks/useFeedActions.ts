import { useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { ReactionType } from '../types/feed';

export const useFeedActions = () => {
  const { session } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  /**
   * toggleReaction handles 3 cases:
   * 1. Same reaction as current → remove (unlike)
   * 2. Different reaction from current → update
   * 3. No current reaction → insert new
   */
  const toggleReaction = useCallback(async (
    postId: string,
    reactionType: ReactionType,
    currentReaction: ReactionType | null
  ) => {
    if (!session?.user.id) return { success: false };

    try {
      setIsLiking(true);

      if (currentReaction === reactionType) {
        // Case 1: Same reaction → remove
        const { error } = await supabase
          .from('feed_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
        if (error) throw error;
        return { success: true, newReaction: null, newLikedState: false };
      } else if (currentReaction) {
        // Case 2: Different reaction → update
        const { error } = await supabase
          .from('feed_likes')
          .update({ reaction_type: reactionType })
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
        if (error) throw error;
        return { success: true, newReaction: reactionType, newLikedState: true };
      } else {
        // Case 3: No reaction → insert
        const { error } = await supabase
          .from('feed_likes')
          .insert({
            post_id: postId,
            user_id: session.user.id,
            reaction_type: reactionType,
          });
        if (error) throw error;
        return { success: true, newReaction: reactionType, newLikedState: true };
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
      return { success: false };
    } finally {
      setIsLiking(false);
    }
  }, [session?.user.id]);

  // Backward-compatible wrapper
  const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
    const result = await toggleReaction(postId, 'LIKE', currentlyLiked ? 'LIKE' : null);
    return { success: result.success, newLikedState: result.success ? !currentlyLiked : currentlyLiked };
  }, [toggleReaction]);

  const deletePost = useCallback(async (postId: string) => {
    if (!session?.user.id) return false;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('feed_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', session.user.id);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error deleting post:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [session?.user.id]);

  const editPost = useCallback(async (postId: string, newContent: string) => {
    if (!session?.user.id) return false;

    try {
      setIsEditing(true);

      const { error } = await supabase
        .from('feed_posts')
        .update({
          content: newContent,
          is_edited: true
        })
        .eq('id', postId)
        .eq('author_id', session.user.id);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error editing post:', err);
      return false;
    } finally {
      setIsEditing(false);
    }
  }, [session?.user.id]);

  const sharePost = useCallback(async (
    originalPostId: string,
    shareType: 'REPOST' | 'QUOTE' = 'REPOST',
    comment?: string
  ) => {
    if (!session?.user.id) return { success: false };

    try {
      setIsSharing(true);

      // Create share record
      const { error: shareError } = await supabase
        .from('feed_shares')
        .insert({
          original_post_id: originalPostId,
          shared_by: session.user.id,
          share_type: shareType,
          share_comment: comment || null
        });

      if (shareError) throw shareError;

      // If QUOTE, create a new post with reference
      if (shareType === 'QUOTE' && comment) {
        const { error: postError } = await supabase
          .from('feed_posts')
          .insert({
            author_id: session.user.id,
            content: comment,
            content_type: 'TEXT',
            metadata: { shared_from: originalPostId }
          });

        if (postError) throw postError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error sharing post:', err);
      return { success: false };
    } finally {
      setIsSharing(false);
    }
  }, [session?.user.id]);

  const toggleRepost = useCallback(async (postId: string, currentlyReposted: boolean) => {
    if (!session?.user.id) return { success: false };

    try {
      setIsSharing(true);

      if (currentlyReposted) {
        // Remove existing repost
        const { error } = await supabase
          .from('feed_shares')
          .delete()
          .eq('original_post_id', postId)
          .eq('shared_by', session.user.id)
          .eq('share_type', 'REPOST');

        if (error) throw error;
        return { success: true, newRepostedState: false };
      } else {
        // Check for existing repost first (prevent duplicates)
        const { data: existing } = await supabase
          .from('feed_shares')
          .select('id')
          .eq('original_post_id', postId)
          .eq('shared_by', session.user.id)
          .eq('share_type', 'REPOST')
          .maybeSingle();

        if (existing) {
          // Already reposted — treat as success, already active
          return { success: true, newRepostedState: true };
        }

        const { error } = await supabase
          .from('feed_shares')
          .insert({
            original_post_id: postId,
            shared_by: session.user.id,
            share_type: 'REPOST',
          });

        if (error) throw error;
        return { success: true, newRepostedState: true };
      }
    } catch (err) {
      console.error('Error toggling repost:', err);
      return { success: false };
    } finally {
      setIsSharing(false);
    }
  }, [session?.user.id]);

  const toggleBookmark = useCallback(async (postId: string, currentlyBookmarked: boolean) => {
    if (!session?.user.id) return { success: false };

    try {
      if (currentlyBookmarked) {
        const { error } = await supabase
          .from('feed_bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
        if (error) throw error;
        return { success: true, newBookmarkedState: false };
      } else {
        const { error } = await supabase
          .from('feed_bookmarks')
          .insert({ post_id: postId, user_id: session.user.id });
        // Ignore duplicate constraint (already bookmarked)
        if (error && error.code !== '23505') throw error;
        return { success: true, newBookmarkedState: true };
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      return { success: false };
    }
  }, [session?.user.id]);

  const togglePin = useCallback(async (postId: string, currentlyPinned: boolean) => {
    if (!session?.user.id) return false;

    try {
      const { error } = await supabase
        .from('feed_posts')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', postId)
        .eq('author_id', session.user.id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error toggling pin:', err);
      return false;
    }
  }, [session?.user.id]);

  const votePoll = useCallback(async (postId: string, optionIndex: number) => {
    if (!session?.user.id) return { success: false };

    try {
      setIsVoting(true);

      const { error } = await supabase
        .from('feed_poll_votes')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          option_index: optionIndex,
        });

      // If already voted (unique constraint), treat as success
      if (error && error.code !== '23505') throw error;

      return { success: true, optionIndex };
    } catch (err) {
      console.error('Error voting on poll:', err);
      return { success: false };
    } finally {
      setIsVoting(false);
    }
  }, [session?.user.id]);

  const reportPost = useCallback(async (
    postId: string,
    reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other',
    details?: string
  ) => {
    if (!session?.user.id) return false;

    try {
      const { error } = await supabase
        .from('feed_reports')
        .insert({
          post_id: postId,
          reported_by: session.user.id,
          reason,
          details: details || null
        });

      // If already reported (unique constraint), treat as success
      if (error && error.code !== '23505') throw error;

      return true;
    } catch (err) {
      console.error('Error reporting post:', err);
      return false;
    }
  }, [session?.user.id]);

  return {
    toggleLike,
    toggleReaction,
    deletePost,
    editPost,
    sharePost,
    toggleRepost,
    toggleBookmark,
    togglePin,
    votePoll,
    reportPost,
    isLiking,
    isDeleting,
    isEditing,
    isSharing,
    isVoting
  };
};
