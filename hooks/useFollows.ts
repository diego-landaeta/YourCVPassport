import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

interface FollowCounts {
  followers: number;
  following: number;
}

export const useFollows = (targetUserId?: string) => {
  const { session } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const hasFetchedRef = useRef(false);

  const currentUserId = session?.user.id;

  // Fetch follow status + counts for target user
  const fetchFollowData = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);

      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', targetUserId),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', targetUserId),
      ]);

      // If table doesn't exist yet (migration not run), bail silently
      if (followersRes.error || followingRes.error) {
        setLoading(false);
        return;
      }

      setCounts({
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      });

      // Check if current user follows target
      if (currentUserId && currentUserId !== targetUserId) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
          .maybeSingle();

        setIsFollowing(!!data);
      }
    } catch (err) {
      // Silently ignore if table doesn't exist
    } finally {
      setLoading(false);
    }
  }, [targetUserId, currentUserId]);

  // Toggle follow/unfollow
  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId || toggling) return;

    setToggling(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);
    setCounts(prev => ({
      ...prev,
      followers: prev.followers + (wasFollowing ? -1 : 1),
    }));

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });

        if (error) throw error;

        // Send follow notification
        await supabase
          .from('feed_notifications')
          .upsert({
            user_id: targetUserId,
            actor_id: currentUserId,
            type: 'follow',
            post_id: null,
            comment_id: null,
          }, {
            onConflict: 'user_id,actor_id,type,post_id',
            ignoreDuplicates: true,
          });
      }
    } catch (err) {
      // Rollback
      console.error('Error toggling follow:', err);
      setIsFollowing(wasFollowing);
      setCounts(prev => ({
        ...prev,
        followers: prev.followers + (wasFollowing ? 1 : -1),
      }));
    } finally {
      setToggling(false);
    }
  }, [currentUserId, targetUserId, isFollowing, toggling]);

  // Fetch following IDs for current user (used for feed filtering)
  const fetchFollowingIds = useCallback(async (): Promise<string[]> => {
    if (!currentUserId) return [];

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);

    if (error) {
      console.error('Error fetching following IDs:', error);
      return [];
    }

    return data?.map(f => f.following_id) || [];
  }, [currentUserId]);

  useEffect(() => {
    if (!targetUserId || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchFollowData();
  }, [fetchFollowData, targetUserId]);

  // Reset when target changes
  useEffect(() => {
    hasFetchedRef.current = false;
    setIsFollowing(false);
    setCounts({ followers: 0, following: 0 });
    setLoading(true);
  }, [targetUserId]);

  return {
    isFollowing,
    counts,
    loading,
    toggling,
    toggleFollow,
    fetchFollowingIds,
    refreshFollowData: fetchFollowData,
  };
};
