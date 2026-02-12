import { useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export const useFeedActions = () => {
  const { session } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
    if (!session?.user.id) return { success: false };

    try {
      setIsLiking(true);

      if (currentlyLiked) {
        const { error } = await supabase
          .from('feed_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feed_likes')
          .insert({
            post_id: postId,
            user_id: session.user.id,
            reaction_type: 'LIKE'
          });

        if (error) throw error;
      }

      return { success: true, newLikedState: !currentlyLiked };
    } catch (err) {
      console.error('Error toggling like:', err);
      return { success: false };
    } finally {
      setIsLiking(false);
    }
  }, [session?.user.id]);

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

  const reportPost = useCallback(async (postId: string, reason: string) => {
    if (!session?.user.id) return false;

    try {
      // For now, just log the report. In production, you'd have a reports table
      console.log('Report submitted:', { postId, reason, reportedBy: session.user.id });

      // Could also hide the post for the user or send to admin
      return true;
    } catch (err) {
      console.error('Error reporting post:', err);
      return false;
    }
  }, [session?.user.id]);

  return {
    toggleLike,
    deletePost,
    editPost,
    sharePost,
    reportPost,
    isLiking,
    isDeleting,
    isEditing,
    isSharing
  };
};
