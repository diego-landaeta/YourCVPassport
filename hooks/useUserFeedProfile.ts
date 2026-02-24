import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { FeedPost, ReactionType } from '../types/feed';

const POSTS_PER_PAGE = 10;

interface UserProfileData {
  id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  slug: string | null;
  summary: string | null;
  country_code: string | null;
  created_at: string | null;
}

interface UserFeedStats {
  totalPosts: number;
  totalLikesReceived: number;
  totalCommentsReceived: number;
}

interface SkillItem {
  id: string;
  name: string;
  level: string | null;
}

interface ExperienceItem {
  id: string;
  company: string | null;
  position: string | null;
  is_current: boolean;
}

interface LanguageItem {
  id: string;
  language: string;
  level: string | null;
}

interface GroupItem {
  id: string;
  name: string;
  slug: string | null;
  member_count: number;
  metadata?: Record<string, unknown>;
}

interface ProfileExtras {
  skills: SkillItem[];
  experiences: ExperienceItem[];
  educationCount: number;
  languages: LanguageItem[];
  groups: GroupItem[];
}

export const useUserFeedProfile = (userId: string) => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stats, setStats] = useState<UserFeedStats>({ totalPosts: 0, totalLikesReceived: 0, totalCommentsReceived: 0 });
  const [extras, setExtras] = useState<ProfileExtras>({ skills: [], experiences: [], educationCount: 0, languages: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const resolvedIdRef = useRef<string | null>(null);

  // Fetch profile + stats + extras
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setProfile(null);
      setPosts([]);
      resolvedIdRef.current = null;

      const profileFields = 'id, full_name, headline, avatar_url, slug, summary, country_code, created_at';
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      let profileRes = isUUID
        ? await supabase.from('profiles').select(profileFields).eq('id', userId).maybeSingle()
        : await supabase.from('profiles').select(profileFields).eq('slug', userId).maybeSingle();

      if (!profileRes.data && !cancelled) {
        profileRes = isUUID
          ? await supabase.from('profiles').select(profileFields).eq('slug', userId).maybeSingle()
          : await supabase.from('profiles').select(profileFields).eq('id', userId).maybeSingle();
      }

      if (cancelled) return;

      if (profileRes.data) {
        setProfile(profileRes.data);
        resolvedIdRef.current = profileRes.data.id;
        const pid = profileRes.data.id;

        // Fetch stats + extras in parallel
        const [statsRes, skillsRes, expRes, eduRes, langRes, groupMembersRes] = await Promise.all([
          supabase.from('feed_posts').select('id, likes_count, comments_count')
            .eq('author_id', pid).eq('is_hidden', false).eq('visibility', 'PUBLIC'),
          supabase.from('skills').select('id, name, level').eq('profile_id', pid).order('sort_order').limit(12),
          supabase.from('experiences').select('id, company, position, is_current').eq('profile_id', pid).order('sort_order').limit(3),
          supabase.from('education').select('id').eq('profile_id', pid),
          supabase.from('languages').select('id, language, level').eq('profile_id', pid).order('sort_order').limit(6),
          supabase.from('group_members').select('group_id').eq('user_id', pid),
        ]);

        if (cancelled) return;

        if (statsRes.data) {
          setStats({
            totalPosts: statsRes.data.length,
            totalLikesReceived: statsRes.data.reduce((sum, p) => sum + (p.likes_count || 0), 0),
            totalCommentsReceived: statsRes.data.reduce((sum, p) => sum + (p.comments_count || 0), 0),
          });
        }

        // Fetch group details if user belongs to any
        let groups: GroupItem[] = [];
        const groupIds = groupMembersRes.data?.map(r => r.group_id) || [];
        if (groupIds.length > 0) {
          const { data: groupsData } = await supabase
            .from('groups')
            .select('id, name, slug, member_count, metadata')
            .in('id', groupIds)
            .limit(8);
          groups = (groupsData as GroupItem[]) || [];
        }

        if (cancelled) return;

        setExtras({
          skills: (skillsRes.data as SkillItem[]) || [],
          experiences: (expRes.data as ExperienceItem[]) || [],
          educationCount: eduRes.data?.length || 0,
          languages: (langRes.data as LanguageItem[]) || [],
          groups,
        });
      }

      if (!cancelled) setLoading(false);
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [userId]);

  // Fetch posts (paginated)
  const fetchPosts = useCallback(async (page: number = 0, append: boolean = false) => {
    const authorId = resolvedIdRef.current;
    if (!authorId) return;

    try {
      setPostsLoading(true);
      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

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
        .eq('author_id', authorId)
        .eq('is_hidden', false)
        .eq('visibility', 'PUBLIC')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      const postIds = postsData?.map(p => p.id) || [];
      let userReactions: Record<string, ReactionType> = {};
      let userReposts: string[] = [];
      let userBookmarks: string[] = [];
      let userPollVotes: Record<string, number> = {};
      let pollVoteCountsMap: Record<string, { option_index: number; count: number }[]> = {};
      let topReactionsMap: Record<string, ReactionType[]> = {};
      let realLikesCount: Record<string, number> = {};
      let groupMap: Record<string, { id: string; name: string; metadata?: Record<string, unknown> }> = {};

      if (postIds.length > 0 && session?.user.id) {
        const [likesRes, repostsRes, allReactionsRes] = await Promise.all([
          supabase.from('feed_likes').select('post_id, reaction_type').eq('user_id', session.user.id).in('post_id', postIds),
          supabase.from('feed_shares').select('original_post_id').eq('shared_by', session.user.id).eq('share_type', 'REPOST').in('original_post_id', postIds),
          supabase.from('feed_likes').select('post_id, reaction_type').in('post_id', postIds),
        ]);

        for (const l of likesRes.data || []) userReactions[l.post_id] = l.reaction_type as ReactionType;
        userReposts = repostsRes.data?.map(r => r.original_post_id) || [];

        const reactCountMap: Record<string, Record<string, number>> = {};
        for (const l of allReactionsRes.data || []) {
          if (!reactCountMap[l.post_id]) reactCountMap[l.post_id] = {};
          reactCountMap[l.post_id][l.reaction_type] = (reactCountMap[l.post_id][l.reaction_type] || 0) + 1;
          realLikesCount[l.post_id] = (realLikesCount[l.post_id] || 0) + 1;
        }
        for (const [pid, counts] of Object.entries(reactCountMap)) {
          topReactionsMap[pid] = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([rt]) => rt as ReactionType);
        }

        const optionalQueries: Promise<void>[] = [];
        optionalQueries.push(
          Promise.resolve(supabase.from('feed_bookmarks').select('post_id').eq('user_id', session.user.id).in('post_id', postIds))
            .then(res => { userBookmarks = res.data?.map(b => b.post_id) || []; })
        );

        const pollPostIds = postsData?.filter(p => p.content_type === 'POLL').map(p => p.id) || [];
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

        const groupIds = [...new Set(postsData?.filter(p => p.group_id).map(p => p.group_id as string) || [])];
        if (groupIds.length > 0) {
          optionalQueries.push(
            Promise.resolve(supabase.from('groups').select('id, name, metadata').in('id', groupIds))
              .then(({ data: groupsData }) => { for (const g of groupsData || []) groupMap[g.id] = g; })
          );
        }

        await Promise.allSettled(optionalQueries);
      }

      const processedPosts = postsData?.map(post => {
        const realCount = realLikesCount[post.id];
        return {
          ...post,
          likes_count: realCount !== undefined ? realCount : post.likes_count,
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
      console.error('Error fetching user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [session?.user.id]);

  // Fetch posts once profile is resolved
  useEffect(() => {
    if (!profile) return;
    resolvedIdRef.current = profile.id;
    pageRef.current = 0;
    fetchPosts(0, false);
  }, [profile?.id, fetchPosts]);

  const loadMore = useCallback(() => {
    if (!postsLoading && hasMore) {
      pageRef.current += 1;
      fetchPosts(pageRef.current, true);
    }
  }, [postsLoading, hasMore, fetchPosts]);

  const refreshPosts = useCallback(() => {
    pageRef.current = 0;
    fetchPosts(0, false);
  }, [fetchPosts]);

  return { profile, posts, stats, extras, loading, postsLoading, hasMore, loadMore, refreshPosts };
};
