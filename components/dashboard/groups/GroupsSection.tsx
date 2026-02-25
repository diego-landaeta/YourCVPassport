import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGroups, useGroupActions } from '../../../hooks/useGroups';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToastContext } from '../../../contexts/ToastContext';
import { Group } from '../../../types/groups';
import GroupCard from './GroupCard';
import GroupDetailView from './GroupDetailView';
import CreateGroupModal from './CreateGroupModal';
import { PlusIcon, UserGroupIcon, MegaphoneIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

type GroupMode = 'group' | 'channel';

interface GroupsSectionProps {
  mode?: GroupMode;
  onSectionChange?: (section: string) => void;
}

const GroupsSection: React.FC<GroupsSectionProps> = ({ mode = 'group', onSectionChange }) => {
  const { lang } = useLanguage();
  const { session, profile } = useAuth();
  const toast = useToastContext();
  const location = useLocation();
  const navigate = useNavigate();
  const isEs = lang === 'es';
  const isChannel = mode === 'channel';

  const isPremium = profile?.plan && ['pro', 'premium', 'enterprise'].includes(String(profile.plan).toLowerCase());

  const { myGroups: allMyGroups, suggestedGroups: allSuggested, loading, refresh } = useGroups();
  const { joinGroup, leaveGroup } = useGroupActions();

  // Filter by type stored in metadata
  const myGroups = allMyGroups.filter(g =>
    isChannel ? g.metadata?.type === 'channel' : g.metadata?.type !== 'channel'
  );
  const suggestedGroups = allSuggested.filter(g =>
    isChannel ? g.metadata?.type === 'channel' : g.metadata?.type !== 'channel'
  );

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  /* ── Auto-open group from ?grupo=slug URL param ── */
  useEffect(() => {
    if (loading) return;
    const slug = new URLSearchParams(location.search).get('grupo');
    if (!slug || activeGroupId) return;
    const all = [...allMyGroups, ...allSuggested];
    const found = all.find(g => g.slug === slug || g.id === slug);
    if (found) setActiveGroupId(found.id);
  }, [loading, location.search, allMyGroups, allSuggested, activeGroupId]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [view, setView] = useState<'browse' | 'my'>('browse');
  // Optimistic UI: track groups that were just joined/left locally
  const [justJoined, setJustJoined] = useState<Set<string>>(new Set());
  const [justLeft, setJustLeft] = useState<Set<string>>(new Set());

  const handleCreateClick = useCallback(() => {
    if (isPremium) {
      setShowCreateModal(true);
    } else {
      setShowPremiumBanner(true);
    }
  }, [isPremium]);

  const handleJoin = useCallback(async (groupId: string) => {
    if (!session?.user.id) return;
    setActionLoading(groupId);
    const ok = await joinGroup(groupId);
    if (ok) {
      setJustJoined(prev => new Set(prev).add(groupId));
      setJustLeft(prev => { const s = new Set(prev); s.delete(groupId); return s; });
      toast.success(isChannel
        ? (isEs ? '¡Ahora sigues este canal!' : 'You are now following this channel!')
        : (isEs ? '¡Te has unido al grupo!' : 'You joined the group!')
      );
    }
    setActionLoading(null);
    // Background refresh for accurate counts
    refresh();
  }, [session?.user.id, joinGroup, refresh, toast, isEs, isChannel]);

  const handleLeave = useCallback(async (groupId: string) => {
    setActionLoading(groupId);
    const ok = await leaveGroup(groupId);
    if (ok) {
      setJustLeft(prev => new Set(prev).add(groupId));
      setJustJoined(prev => { const s = new Set(prev); s.delete(groupId); return s; });
    }
    setActionLoading(null);
    refresh();
  }, [leaveGroup, refresh]);

  const handleCreated = useCallback((group: Group) => {
    setShowCreateModal(false);
    refresh();
    setActiveGroupId(group.id);
  }, [refresh]);

  if (activeGroupId) {
    return (
      <GroupDetailView
        groupId={activeGroupId}
        onBack={() => setActiveGroupId(null)}
      />
    );
  }

  // Apply optimistic join/leave state
  const applyOptimistic = (groups: Group[]): Group[] =>
    groups.map(g => {
      if (justJoined.has(g.id)) return { ...g, isMember: true };
      if (justLeft.has(g.id)) return { ...g, isMember: false };
      return g;
    });

  const optimisticMy = applyOptimistic([...myGroups, ...suggestedGroups.filter(g => justJoined.has(g.id))]);
  const optimisticSuggested = applyOptimistic(suggestedGroups.filter(g => !justJoined.has(g.id)));
  const displayGroups = view === 'my'
    ? optimisticMy.filter(g => g.isMember)
    : optimisticSuggested.filter(g => !g.isMember);

  const title = isChannel
    ? (isEs ? 'Canales' : 'Channels')
    : (isEs ? 'Grupos' : 'Groups');

  const subtitle = isChannel
    ? (isEs ? 'Sigue temas que te interesan' : 'Follow topics that interest you')
    : (isEs ? 'Comunidades profesionales' : 'Professional communities');

  const emptyLabel = view === 'my'
    ? (isChannel
      ? (isEs ? 'No sigues ningún canal aún.' : "You don't follow any channels yet.")
      : (isEs ? 'No perteneces a ningún grupo aún.' : "You haven't joined any groups yet."))
    : (isChannel
      ? (isEs ? 'No hay canales disponibles.' : 'No channels available.')
      : (isEs ? 'No hay grupos públicos disponibles.' : 'No public groups available.'));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isChannel ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-cv-blue/10'}`}>
            {isChannel
              ? <MegaphoneIcon className="w-5 h-5 text-purple-500" />
              : <UserGroupIcon className="w-5 h-5 text-cv-blue" />
            }
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        {session?.user.id && (
          <button
            onClick={handleCreateClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${
              isPremium
                ? (isChannel ? 'bg-purple-500 hover:bg-purple-600' : 'bg-cv-blue hover:bg-blue-700')
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
            }`}
          >
            {isPremium ? <PlusIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
            {isChannel ? (isEs ? 'Crear canal' : 'Create channel') : (isEs ? 'Crear grupo' : 'Create group')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        <button
          onClick={() => setView('browse')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === 'browse'
              ? (isChannel ? 'bg-purple-500 text-white' : 'bg-cv-blue text-white')
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {isEs ? 'Explorar' : 'Explore'}
        </button>
        {session?.user.id && (
          <button
            onClick={() => setView('my')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              view === 'my'
                ? (isChannel ? 'bg-purple-500 text-white' : 'bg-cv-blue text-white')
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isChannel ? (isEs ? 'Mis canales' : 'My channels') : (isEs ? 'Mis grupos' : 'My groups')}
            {myGroups.length > 0 && (
              <span className="ml-1.5 bg-white/20 text-xs px-1.5 rounded-full">{myGroups.length}</span>
            )}
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayGroups.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{isChannel ? '📢' : '👥'}</div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{emptyLabel}</p>
          {view === 'my' && session?.user.id && (
            <button
              onClick={handleCreateClick}
              className={`mt-3 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${
                isPremium
                  ? (isChannel ? 'bg-purple-500 hover:bg-purple-600' : 'bg-cv-blue hover:bg-blue-700')
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              }`}
            >
              {!isPremium && <SparklesIcon className="w-4 h-4 inline mr-1" />}
              {isChannel
                ? (isEs ? 'Crear mi primer canal' : 'Create my first channel')
                : (isEs ? 'Crear mi primer grupo' : 'Create my first group')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGroups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onOpen={setActiveGroupId}
              loading={actionLoading === group.id}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateGroupModal
          type={mode}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Premium Upsell Banner */}
      {showPremiumBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPremiumBanner(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white text-center">
              <SparklesIcon className="w-10 h-10 mx-auto mb-2" />
              <h3 className="text-lg font-bold">
                {isEs ? 'Funcionalidad PRO' : 'PRO Feature'}
              </h3>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                {isChannel
                  ? (isEs
                    ? 'Crear canales es una funcionalidad exclusiva del plan PRO. Mejora tu plan para empezar a crear y administrar canales.'
                    : 'Creating channels is a PRO-only feature. Upgrade your plan to start creating and managing channels.')
                  : (isEs
                    ? 'Crear grupos es una funcionalidad exclusiva del plan PRO. Mejora tu plan para empezar a crear y administrar grupos.'
                    : 'Creating groups is a PRO-only feature. Upgrade your plan to start creating and managing groups.')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPremiumBanner(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {isEs ? 'Ahora no' : 'Not now'}
                </button>
                <button
                  onClick={() => {
                    setShowPremiumBanner(false);
                    navigate(isEs ? '/precios' : '/pricing');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-colors"
                >
                  {isEs ? 'Ver planes' : 'View plans'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsSection;
