import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Group, GroupMember, CreateGroupPayload } from '../types/groups';

// ─── useGroups ──────────────────────────────────────────────
// Returns the user's joined groups + suggested public groups.
export const useGroups = () => {
  const { session } = useAuth();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      if (session?.user.id) {
        // Groups the user has joined
        const { data: memberRows } = await supabase
          .from('group_members')
          .select('group_id, role')
          .eq('user_id', session.user.id);

        const memberGroupIds = memberRows?.map(r => r.group_id) ?? [];
        const roleMap: Record<string, string> = {};
        memberRows?.forEach(r => { roleMap[r.group_id] = r.role; });

        if (memberGroupIds.length > 0) {
          const { data } = await supabase
            .from('groups')
            .select('*')
            .in('id', memberGroupIds)
            .order('created_at', { ascending: false });

          setMyGroups(
            (data ?? []).map(g => ({
              ...g,
              isMember: true,
              isOwner: g.owner_id === session.user.id,
              role: roleMap[g.id] as Group['role'],
            }))
          );
        } else {
          setMyGroups([]);
        }

        // Suggested: public groups the user has NOT joined
        let suggestedQuery = supabase
          .from('groups')
          .select('*')
          .eq('is_private', false)
          .order('member_count', { ascending: false })
          .limit(30);

        if (memberGroupIds.length > 0) {
          suggestedQuery = suggestedQuery.not('id', 'in', `(${memberGroupIds.join(',')})`);
        }

        const { data: suggested } = await suggestedQuery;

        setSuggestedGroups(
          (suggested ?? []).map(g => ({ ...g, isMember: false, isOwner: false }))
        );
      } else {
        // Anon: only public groups
        const { data } = await supabase
          .from('groups')
          .select('*')
          .eq('is_private', false)
          .order('member_count', { ascending: false })
          .limit(20);
        setSuggestedGroups((data ?? []).map(g => ({ ...g, isMember: false, isOwner: false })));
        setMyGroups([]);
      }
    } catch (err: any) {
      // Silently ignore if tables don't exist yet (SQL migration not run)
      if (!err?.message?.includes('relation') && !err?.code?.includes('42P01')) {
        console.error('useGroups error:', err);
      }
      setMyGroups([]);
      setSuggestedGroups([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  return { myGroups, suggestedGroups, loading, refresh: fetchGroups };
};

// ─── useGroupDetail ─────────────────────────────────────────
export const useGroupDetail = (groupId: string | null) => {
  const { session } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const { data: groupData } = await supabase
          .from('groups')
          .select('*, owner:profiles!owner_id(full_name, avatar_url, slug)')
          .eq('id', groupId)
          .single();

        if (!groupData || cancelled) return;

        let isMember = false;
        let role: Group['role'] = undefined;

        if (session?.user.id) {
          const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', session.user.id)
            .maybeSingle();
          isMember = !!membership;
          role = membership?.role as Group['role'];
        }

        if (!cancelled) {
          setGroup({
            ...groupData,
            isMember,
            isOwner: groupData.owner_id === session?.user.id,
            role,
          });
        }

        // Fetch members (top 20)
        const { data: memberData } = await supabase
          .from('group_members')
          .select('*, profile:profiles(full_name, avatar_url, slug, headline)')
          .eq('group_id', groupId)
          .order('joined_at', { ascending: true })
          .limit(20);

        if (!cancelled) setMembers(memberData ?? []);
      } catch (err) {
        console.error('useGroupDetail error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [groupId, session?.user.id]);

  return { group, members, loading };
};

// ─── useGroupActions ────────────────────────────────────────
export const useGroupActions = () => {
  const { session } = useAuth();

  const createGroup = useCallback(async (payload: CreateGroupPayload): Promise<Group | null> => {
    if (!session?.user.id) return null;
    const { data, error } = await supabase
      .from('groups')
      .insert({ ...payload, owner_id: session.user.id })
      .select()
      .single();
    if (error) { console.error('createGroup error:', error); return null; }
    return data as Group;
  }, [session?.user.id]);

  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!session?.user.id) return false;
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: session.user.id, role: 'member' });
    return !error;
  }, [session?.user.id]);

  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!session?.user.id) return false;
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', session.user.id);
    return !error;
  }, [session?.user.id]);

  const updateGroup = useCallback(async (
    groupId: string,
    updates: Partial<CreateGroupPayload>
  ): Promise<boolean> => {
    if (!session?.user.id) return false;
    const { error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId);
    return !error;
  }, [session?.user.id]);

  return { createGroup, joinGroup, leaveGroup, updateGroup };
};
