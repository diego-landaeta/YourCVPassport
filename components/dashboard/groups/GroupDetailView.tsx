import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabase/client';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToastContext } from '../../../contexts/ToastContext';
import { useGroupDetail, useGroupActions } from '../../../hooks/useGroups';
import { useFeed } from '../../../hooks/useFeed';
import { useFeedActions } from '../../../hooks/useFeedActions';
import { useNotifications } from '../../../hooks/useNotifications';
import { Group } from '../../../types/groups';
import type { FeedPost as FeedPostType } from '../../../types/feed';
import FeedPost from '../feed/FeedPost';
import CreatePostForm from '../feed/CreatePostForm';
import { CameraIcon, PencilIcon } from '@heroicons/react/24/solid';
import { MegaphoneIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface GroupDetailViewProps {
  groupId: string;
  onBack: () => void;
}

// Members tab removed — sidebar covers it

const GroupDetailView: React.FC<GroupDetailViewProps> = ({ groupId, onBack }) => {
  const { lang } = useLanguage();
  const { session, profile } = useAuth();
  const toast = useToastContext();
  const isEs = lang === 'es';
  const { group, members, loading } = useGroupDetail(groupId);
  const { joinGroup, leaveGroup, updateGroup } = useGroupActions();
  const { createPost, isCreating, postCooldown } = useFeed();
  const { votePoll } = useFeedActions();
  const { sendNotification } = useNotifications();

  const [showAllMembers, setShowAllMembers] = useState(false);
  const [posts, setPosts] = useState<FeedPostType[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [isMemberLocal, setIsMemberLocal] = useState<boolean | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchGroupPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const { data } = await supabase
        .from('feed_posts')
        .select(`
          *,
          author:profiles!author_id (id, full_name, headline, avatar_url, slug)
        `)
        .eq('group_id', groupId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(30);

      const posts = data ?? [];

      // Fetch poll vote counts (same logic as useFeed.ts)
      const pollPostIds = posts.filter(p => p.content_type === 'POLL').map(p => p.id);
      const pollVoteCountsMap: Record<string, { option_index: number; count: number }[]> = {};
      const userPollVotesMap: Record<string, number> = {};

      if (pollPostIds.length > 0) {
        try {
          const [myVotesRes, countsRes] = await Promise.all([
            session?.user.id
              ? supabase.from('feed_poll_votes').select('post_id, option_index').eq('user_id', session.user.id).in('post_id', pollPostIds)
              : Promise.resolve({ data: [] }),
            supabase.rpc('get_poll_vote_counts', { poll_post_ids: pollPostIds }),
          ]);
          for (const v of (myVotesRes.data || []) as { post_id: string; option_index: number }[]) {
            userPollVotesMap[v.post_id] = v.option_index;
          }
          for (const row of (countsRes.data || []) as { post_id: string; option_index: number; count: number }[]) {
            if (!pollVoteCountsMap[row.post_id]) pollVoteCountsMap[row.post_id] = [];
            pollVoteCountsMap[row.post_id].push({ option_index: row.option_index, count: row.count });
          }
        } catch {
          // RPC may not exist yet — silently ignore
        }
      }

      setPosts(posts.map(p => ({
        ...p,
        pollVoteCounts: pollVoteCountsMap[p.id] || [],
        userPollVote: userPollVotesMap[p.id] ?? null,
      })));
    } catch (err) {
      console.error('GroupDetailView posts error:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [groupId, session?.user.id]);

  useEffect(() => { fetchGroupPosts(); }, [fetchGroupPosts]);

  const handleJoin = async () => {
    setMembershipLoading(true);
    await joinGroup(groupId);
    setIsMemberLocal(true);
    setMembershipLoading(false);
    fetchGroupPosts();
  };

  const handleLeave = async () => {
    if (!window.confirm(isEs ? '¿Salir del grupo?' : 'Leave group?')) return;
    setMembershipLoading(true);
    await leaveGroup(groupId);
    setMembershipLoading(false);
    onBack();
  };

  const handleCreatePost = useCallback(async (
    content: string,
    images: string[],
    contentType?: any,
    achievementType?: string,
    achievementData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => {
    await createPost({
      content,
      imageUrls: images,
      contentType,
      achievementType,
      achievementData,
      metadata: { ...metadata, _group_id: groupId },
      group_id: groupId,
    });
    await fetchGroupPosts();
  }, [createPost, groupId, fetchGroupPosts]);

  const uploadImage = async (
    file: File,
    type: 'cover' | 'avatar'
  ): Promise<string | null> => {
    if (!session?.user.id) return null;
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `groups/${groupId}/${type}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadImage(file, 'cover');
    if (url) {
      setLocalCoverUrl(url);
      await updateGroup(groupId, { cover_url: url });
    }
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const url = await uploadImage(file, 'avatar');
    if (url) {
      setLocalAvatarUrl(url);
      await updateGroup(groupId, { avatar_url: url });
    }
    setUploadingAvatar(false);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cv-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20 text-gray-500">
        {isEs ? 'Grupo no encontrado' : 'Group not found'}
      </div>
    );
  }

  const isMember = isMemberLocal !== null ? isMemberLocal : (group.isMember ?? false);
  const canEdit = group.isOwner || group.role === 'admin';
  const isChannel = group.metadata?.type === 'channel';
  // Regular members in a channel can only read (no reactions, comments or poll votes)
  const channelReadOnly = isChannel && !canEdit;

  const handleChannelReadOnly = () => {
    toast.info(isEs
      ? 'Los canales son solo lectura. Solo los admins pueden interactuar.'
      : 'Channels are read-only. Only admins can interact.'
    );
  };

  const coverUrl = localCoverUrl ?? group.cover_url;
  const avatarUrl = localAvatarUrl ?? group.avatar_url;

  const accentColor = isChannel ? 'bg-purple-500 hover:bg-purple-600' : 'bg-cv-blue hover:bg-blue-700';
  const coverGradient = isChannel ? 'from-purple-600/80 to-violet-700/80' : 'from-cv-blue/70 to-blue-600/80';

  // Find top posters from the loaded posts
  const topPosters = (() => {
    const counts: Record<string, { id: string; name: string; avatar: string | null; slug: string | null; count: number }> = {};
    for (const p of posts) {
      const a = p.author;
      if (!a?.id) continue;
      if (!counts[a.id]) counts[a.id] = { id: a.id, name: a.full_name || '?', avatar: a.avatar_url, slug: a.slug, count: 0 };
      counts[a.id].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {isEs
          ? (isChannel ? 'Volver a canales' : 'Volver a grupos')
          : (isChannel ? 'Back to channels' : 'Back to groups')}
      </button>

      {/* Hidden file inputs */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverChange}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Group header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
        {/* Cover */}
        <div className={`h-40 bg-gradient-to-br ${coverGradient} relative overflow-hidden`}>
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/30" />
              <div className="absolute bottom-0 left-8 w-20 h-20 rounded-full bg-white/20" />
              <div className="absolute top-4 left-1/3 w-14 h-14 rounded-full bg-white/20" />
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white backdrop-blur-sm ${
              isChannel ? 'bg-purple-600/70' : 'bg-cv-blue/70'
            }`}>
              {isChannel
                ? <MegaphoneIcon className="w-3 h-3" />
                : <UserGroupIcon className="w-3 h-3" />
              }
              {isChannel ? (isEs ? 'Canal' : 'Channel') : (isEs ? 'Grupo' : 'Group')}
            </span>
          </div>

          {group.is_private && (
            <span className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              🔒 {isEs ? 'Privado' : 'Private'}
            </span>
          )}

          {/* Edit cover button (admin only) */}
          {canEdit && (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs font-medium backdrop-blur-sm transition-colors disabled:opacity-50"
            >
              {uploadingCover ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CameraIcon className="w-3.5 h-3.5" />
              )}
              {isEs ? 'Cambiar portada' : 'Change cover'}
            </button>
          )}
        </div>

        <div className="px-5 -mt-9 pb-5">
          {/* Avatar with edit button */}
          <div className="relative inline-block mb-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden border-2 border-white dark:border-gray-900 ${
              avatarUrl ? '' : `bg-gradient-to-br ${isChannel ? 'from-purple-500 to-violet-600' : 'from-cv-blue to-blue-600'}`
            }`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                group.name.charAt(0).toUpperCase()
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                title={isEs ? 'Cambiar ícono' : 'Change icon'}
              >
                {uploadingAvatar ? (
                  <div className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PencilIcon className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h2>
              {group.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{group.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">{group.member_count}</span> {isEs ? 'miembros' : 'members'}
                </span>
                {group.post_count > 0 && (
                  <span className="text-xs text-gray-400">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{group.post_count}</span> posts
                  </span>
                )}
              </div>
            </div>

            {/* Join/Leave button */}
            {session?.user.id && (
              isMember ? (
                group.isOwner ? null : (
                  <button
                    onClick={handleLeave}
                    disabled={membershipLoading}
                    className="flex-shrink-0 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    {isEs ? 'Salir' : 'Leave'}
                  </button>
                )
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={membershipLoading}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 ${accentColor}`}
                >
                  {isChannel ? (isEs ? 'Seguir' : 'Follow') : (isEs ? 'Unirse' : 'Join')}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 3-column layout: left sidebar | posts | right sidebar */}
      <div className="flex gap-5">

        {/* LEFT sidebar — hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          {/* About card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {isEs ? 'Acerca de' : 'About'}
            </h3>
            {group.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{group.description}</p>
            )}
            <div className="flex gap-4 text-center py-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{group.member_count}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                  {isChannel ? (isEs ? 'Seguidores' : 'Followers') : (isEs ? 'Miembros' : 'Members')}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{group.post_count}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Posts</div>
              </div>
            </div>
            {group.created_at && (
              <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {isEs ? 'Creado el' : 'Created'} {new Date(group.created_at).toLocaleDateString(isEs ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            {/* Owner / Admin info */}
            {group.owner && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
                  {isChannel ? (isEs ? 'Administrador' : 'Admin') : (isEs ? 'Creador' : 'Creator')}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden flex-shrink-0 ${
                    group.owner.avatar_url ? '' : 'bg-gradient-to-br from-cv-blue to-blue-600'
                  }`}>
                    {group.owner.avatar_url ? (
                      <img src={group.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      group.owner.full_name?.charAt(0) ?? '?'
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{group.owner.full_name}</p>
                </div>
              </div>
            )}

            {/* Quick join/leave for sidebar too */}
            {session?.user.id && !group.isOwner && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {isMember ? (
                  <button
                    onClick={handleLeave}
                    disabled={membershipLoading}
                    className="w-full py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    {isChannel ? (isEs ? 'Dejar de seguir' : 'Unfollow') : (isEs ? 'Salir del grupo' : 'Leave group')}
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={membershipLoading}
                    className={`w-full py-2 rounded-lg text-white text-xs font-semibold transition-colors disabled:opacity-50 ${accentColor}`}
                  >
                    {isChannel ? (isEs ? 'Seguir' : 'Follow') : (isEs ? 'Unirse' : 'Join')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CENTER — Posts feed */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
            {isMember && session?.user.id && (
              <CreatePostForm
                profile={profile}
                onSubmit={handleCreatePost}
                isSubmitting={isCreating}
                cooldown={postCooldown}
              />
            )}

            {postsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-cv-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-4xl mb-3">📝</div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  {isEs ? 'Sin publicaciones aún' : 'No posts yet'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isEs ? '¡Sé el primero en publicar aquí!' : 'Be the first to post here!'}
                </p>
              </div>
            ) : (
              posts.map(post => (
                <FeedPost
                  key={post.id}
                  post={post}
                  currentUserId={session?.user.id}
                  onPostUpdated={fetchGroupPosts}
                  onPollVote={channelReadOnly ? undefined : votePoll}
                  onNotify={sendNotification}
                  readOnly={channelReadOnly}
                  onAuthRequired={channelReadOnly ? handleChannelReadOnly : () => {}}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT sidebar — hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">

          {/* Members preview card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isChannel ? (isEs ? 'Seguidores' : 'Followers') : (isEs ? 'Miembros' : 'Members')}
              </h3>
              {members.length > 8 && (
                <button
                  onClick={() => setShowAllMembers(v => !v)}
                  className="text-xs text-cv-blue hover:underline"
                >
                  {showAllMembers ? (isEs ? 'Ver menos' : 'Show less') : (isEs ? 'Ver todos' : 'See all')}
                </button>
              )}
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-gray-400">{isEs ? 'Sin miembros' : 'No members yet'}</p>
            ) : (
              <div className="space-y-2.5">
                {(showAllMembers ? members : members.slice(0, 8)).map((member) => (
                  <div key={member.id} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden flex-shrink-0 ${
                      member.profile?.avatar_url ? '' : 'bg-gradient-to-br from-cv-blue to-blue-600'
                    }`}>
                      {member.profile?.avatar_url ? (
                        <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        member.profile?.full_name?.charAt(0) ?? '?'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {member.profile?.full_name ?? 'Unknown'}
                      </p>
                    </div>
                    {member.role !== 'member' && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        member.role === 'owner'
                          ? (isChannel ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-500' : 'bg-cv-blue/10 text-cv-blue')
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {member.role === 'owner' ? 'Admin' : 'Mod'}
                      </span>
                    )}
                  </div>
                ))}
                {!showAllMembers && members.length > 8 && (
                  <button
                    onClick={() => setShowAllMembers(true)}
                    className="text-xs text-gray-400 hover:text-cv-blue transition-colors"
                  >
                    +{members.length - 8} {isEs ? 'más' : 'more'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Most active members (from posts) — hide for channels since only admins post */}
          {!isChannel && topPosters.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {isEs ? 'Más activos' : 'Most Active'}
              </h3>
              <div className="space-y-2.5">
                {topPosters.map((poster, i) => (
                  <div key={poster.id} className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 w-4 text-right">{i + 1}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden flex-shrink-0 ${
                      poster.avatar ? '' : 'bg-gradient-to-br from-cv-blue to-blue-600'
                    }`}>
                      {poster.avatar ? (
                        <img src={poster.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        poster.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{poster.name}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{poster.count} {poster.count === 1 ? 'post' : 'posts'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GroupDetailView;
